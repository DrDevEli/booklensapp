import Redis from 'ioredis';
import logger from '../utils/logger.js';

// Create a mock Redis client for development if Redis is not available
class MockRedis {
  constructor() {
    this.store = new Map();
    logger.warn('Using mock Redis client - data will not persist between restarts');
  }

  async get(key) {
    return this.store.get(key);
  }

  async set(key, value, ...args) {
    // Handle EX argument for expiry
    if (args.length > 0 && args[0] === 'EX') {
      this.store.set(key, value);
      // Simulate expiry
      setTimeout(() => {
        this.store.delete(key);
      }, args[1] * 1000);
      return 'OK';
    }
    this.store.set(key, value);
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key) {
    const value = this.store.get(key);
    const newValue = value ? parseInt(value) + 1 : 1;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async expire(key, seconds) {
    if (this.store.has(key)) {
      setTimeout(() => {
        this.store.delete(key);
      }, seconds * 1000);
      return 1;
    }
    return 0;
  }

  async sadd(key, ...members) {
    let set = this.store.get(key);
    if (!set) {
      set = new Set();
      this.store.set(key, set);
    }
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    }
    return added;
  }
  
  pipeline() {
    return {
      set: (...args) => {
        this.set(...args);
        return this;
      },
      sadd: (...args) => {
        this.sadd(...args);
        return this;
      },
      del: (...args) => {
        this.del(...args);
        return this;
      },
      exec: async () => {
        return [];
      }
    };
  }

  async smembers(key) {
    const set = this.store.get(key);
    return set ? Array.from(set) : [];
  }
}

let redis;

try {
  const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 3000);
      logger.info(`Redis retry attempt ${times} in ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    connectTimeout: 5000
  };

  redis = new Redis(redisOptions);

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      logger.warn('Redis connection refused, falling back to mock implementation');
      redis = new MockRedis();
    } else {
      logger.error('Redis error', { error: err.message });
    }
  });

  // Test connection
  await redis.ping().catch(() => {
    logger.warn('Redis ping failed, falling back to mock implementation');
    redis = new MockRedis();
  });
} catch (error) {
  logger.warn('Failed to initialize Redis, using mock implementation', { error: error.message });
  redis = new MockRedis();
}

export default redis;
