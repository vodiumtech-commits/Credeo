import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

export async function rateLimit(
  key: string,
  max: number,
  windowSecs: number
): Promise<{ ok: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { ok: true, remaining: max };

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSecs);
  return { ok: count <= max, remaining: Math.max(0, max - count) };
}
