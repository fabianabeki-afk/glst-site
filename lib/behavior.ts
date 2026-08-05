import redis from './redis';

/**
 * Stores a simple request history per fingerprint and computes a score.
 * Score is based on requests per minute and burst behaviour.
 */
export interface BehaviorStats {
  requestsPerMinute: number;
  lastRequest: number;
  score: number; // 0-100
}

const WINDOW_SECONDS = 60;

// Each fingerprint key will store a sorted set of timestamps

export async function recordRequest(fingerprint: string): Promise<BehaviorStats> {
  const now = Date.now();
  const key = `bf:${fingerprint}`;

  if (!redis) throw new Error('Redis client not initialized');
  // add current timestamp
  await redis.zadd(key, now, now.toString());
  // remove entries older than window
  const cutoff = now - WINDOW_SECONDS * 1000;
  await redis.zremrangebyscore(key, 0, cutoff);
  // get count
  const count = await redis.zcard(key);

  const rpm = (count / WINDOW_SECONDS) * 60;
  // simplistic scoring: rpm over threshold gives higher score
  const score = Math.min(100, Math.round((rpm / 200) * 100));

  // set TTL to 2x window so old keys expire
  await redis.expire(key, WINDOW_SECONDS * 2);

  return {
    requestsPerMinute: rpm,
    lastRequest: now,
    score,
  };
}

export async function getStats(fingerprint: string): Promise<BehaviorStats | null> {
  const key = `bf:${fingerprint}`;
  if (!redis) throw new Error('Redis client not initialized');
  const exists = await redis.exists(key);
  if (!exists) return null;
  const now = Date.now();
  const count = await redis.zcard(key);
  const rpm = (count / WINDOW_SECONDS) * 60;
  const score = Math.min(100, Math.round((rpm / 200) * 100));
  // grab latest timestamp
  const last = await redis.zrange(key, -1, -1);
  const lastRequest = last.length ? parseInt(last[0], 10) : now;
  return { requestsPerMinute: rpm, lastRequest, score };
}