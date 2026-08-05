import Redis from 'ioredis';

// Use environment variable for configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let client: Redis | null = null;

if (!client) {
  client = new Redis(redisUrl);
}

export default client;