import { redis } from "./redis";
import { env } from "./env";
import { hmac, safeEqualHex, sixDigitCode } from "./crypto";

// Rules from the brief:
// - code expires in 10 minutes, single use
// - 5 wrong tries locks sign-in for 15 minutes
// - at most 3 codes per hour per email
// - stored hashed, never as the plain number
const CODE_TTL = 10 * 60;
const LOCK_TTL = 15 * 60;
const MAX_TRIES = 5;
const MAX_CODES_PER_HOUR = 3;

type OtpRecord = { h: string; contactId: string; tries: number };

const idFor = (email: string) => hmac(env.otpPepper(), `email:${email}`);
const keys = (email: string) => {
  const id = idFor(email);
  return { code: `otp:code:${id}`, sent: `otp:sent:${id}`, lock: `otp:lock:${id}` };
};
const codeHash = (contactId: string, code: string) => hmac(env.otpPepper(), `code:${contactId}:${code}`);

export async function isLocked(email: string): Promise<boolean> {
  return (await redis().exists(keys(email).lock)) === 1;
}

/** Returns a fresh code, or null when the hourly limit is used up or sign-in is locked. */
export async function issueCode(email: string, contactId: string): Promise<string | null> {
  const k = keys(email);
  if (await isLocked(email)) return null;
  const count = await redis().incr(k.sent);
  if (count === 1) await redis().expire(k.sent, 3600);
  if (count > MAX_CODES_PER_HOUR) return null;
  const code = sixDigitCode();
  const rec: OtpRecord = { h: codeHash(contactId, code), contactId, tries: 0 };
  await redis().set(k.code, rec, { ex: CODE_TTL }); // a new code replaces any older one
  return code;
}

export type VerifyResult =
  | { ok: true; contactId: string }
  | { ok: false; reason: "locked" | "invalid"; triesLeft?: number };

export async function checkCode(email: string, code: string): Promise<VerifyResult> {
  const k = keys(email);
  if (await isLocked(email)) return { ok: false, reason: "locked" };
  const rec = await redis().get<OtpRecord>(k.code);
  if (!rec || !/^\d{6}$/.test(code)) return { ok: false, reason: "invalid" };

  if (safeEqualHex(rec.h, codeHash(rec.contactId, code))) {
    await redis().del(k.code); // single use
    return { ok: true, contactId: rec.contactId };
  }

  const tries = rec.tries + 1;
  if (tries >= MAX_TRIES) {
    await redis().del(k.code);
    await redis().set(k.lock, 1, { ex: LOCK_TTL });
    return { ok: false, reason: "locked" };
  }
  const ttl = await redis().ttl(k.code);
  await redis().set(k.code, { ...rec, tries }, { ex: ttl > 0 ? ttl : CODE_TTL });
  return { ok: false, reason: "invalid", triesLeft: MAX_TRIES - tries };
}
