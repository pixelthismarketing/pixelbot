import { cookies } from "next/headers";
import { redis } from "./redis";
import { env } from "./env";
import { hmac, randomToken } from "./crypto";

// One session = one device, 7 days. The cookie holds only a random token;
// everything else stays on the server.
const COOKIE = "pb_session";
const TTL = 7 * 24 * 60 * 60;

export type Session = { contactId: string; email: string; site: string | null; createdAt: number };

const keyFor = (token: string) => `sess:${hmac(env.sessionSecret(), token)}`;

export async function createSession(s: Omit<Session, "createdAt">): Promise<void> {
  const token = randomToken();
  await redis().set(keyFor(token), { ...s, createdAt: Date.now() } satisfies Session, { ex: TTL });
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: TTL });
}

export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return (await redis().get<Session>(keyFor(token))) ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await redis().del(keyFor(token));
  jar.delete(COOKIE);
}
