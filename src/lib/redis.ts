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

export { getRedis };

export async function rateLimit(
  key: string,
  max: number,
  windowSecs: number,
  /**
   * When true, the limiter fails CLOSED if Redis is unavailable in production
   * (i.e. the action is blocked). Use this for auth / OTP / anything abusable.
   * Defaults to false (fail-open) for non-sensitive rate limits.
   */
  enforceInProduction = false
): Promise<{ ok: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) {
    if (enforceInProduction && process.env.NODE_ENV === "production") {
      console.error("[redis] Rate limiter unavailable (UPSTASH not configured) — failing CLOSED for a protected action");
      return { ok: false, remaining: 0 };
    }
    return { ok: true, remaining: max };
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSecs);
    return { ok: count <= max, remaining: Math.max(0, max - count) };
  } catch (err) {
    console.error("[redis] rate-limit error:", err);
    if (enforceInProduction && process.env.NODE_ENV === "production") return { ok: false, remaining: 0 };
    return { ok: true, remaining: max };
  }
}
