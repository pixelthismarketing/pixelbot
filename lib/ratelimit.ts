import { redis } from "./redis";
import { env } from "./env";
import { hmac } from "./crypto";

/** Simple fixed-window limit. Returns true when the caller is over the limit. */
export async function overLimit(bucket: string, id: string, max: number, windowSec: number): Promise<boolean> {
  const key = `rl:${bucket}:${hmac(env.otpPepper(), id)}`;
  const n = await redis().incr(key);
  if (n === 1) await redis().expire(key, windowSec);
  return n > max;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
