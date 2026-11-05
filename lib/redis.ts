import { Redis } from "@upstash/redis";
import { env } from "./env";

let client: Redis | null = null;

export function redis(): Redis {
  if (!client) client = new Redis({ url: env.redisUrl(), token: env.redisToken() });
  return client;
}
