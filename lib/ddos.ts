import redis from './redis';
import { siemLogger, SecurityEvent } from './siem';

// Very basic volumetric detection: global counter per minute
const GLOBAL_WINDOW = 60; // seconds
const GLOBAL_KEY = 'ddos:global';

export async function recordGlobalRequest() {
  const now = Date.now();
  if (!redis) return;
  await redis.zadd(GLOBAL_KEY, now, now.toString());
  const cutoff = now - GLOBAL_WINDOW * 1000;
  await redis.zremrangebyscore(GLOBAL_KEY, 0, cutoff);
  await redis.expire(GLOBAL_KEY, GLOBAL_WINDOW * 2);
}

export async function checkGlobalRate() {
  if (!redis) return 0;
  const count = await redis.zcard(GLOBAL_KEY);
  const rpm = (count / GLOBAL_WINDOW) * 60;
  return rpm;
}

export async function analyzeGlobalRate() {
  const rpm = await checkGlobalRate();
  const threshold = 10000; // high-volume threshold
  if (rpm > threshold) {
    siemLogger.log({
      eventType: 'high_global_request_rate',
      severity: 'high',
      source: 'ddos',
      details: { rpm },
    });
  }
  return rpm;
}