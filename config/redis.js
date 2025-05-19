import Redis from 'ioredis';
import logger from '../utils/logger.js';
import { getEnvConfig } from '../utils/envValidator.js';

// Get Redis configuration from environment
const redisConfig = getEnvConfig({
  REDIS_HOST: { default: 'localhost' },
  REDIS_PORT: { type: 'number', default: 6379 },
  REDIS_PASSWORD: { default: '' },
  REDIS_USERNAME: { default: '' },
  REDIS_DB: { type: 'number', default: 0 },
  REDIS_TLS_ENABLED: { type: 'boolean', default: false },
  REDIS_CONNECT_TIMEOUT: { type: 'number', default: 5000 },
  REDIS_MAX_RETRIES: { type: 'number', default: 3 },
  REDIS_RETRY_DELAY: { type: 'number', default: 1000 },
  NODE_ENV: { default: 'development' }
});

// Create a mock Redis client for development if Redis is not available
class MockRedis {
  constructor() {
    this.store = new Map();
    this.connected = true;
    logger.info('Using mock Redis client - data will not persist between restarts');
  }
  
  // Add ping method for connection testing
  async ping() {
    return 'PONG';
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
  // For Redis Cloud, we need to use a URL connection string
  const redisUrl = `redis://${encodeURIComponent('dante miguel')}:${encodeURIComponent(redisConfig.REDIS_PASSWORD)}@${redisConfig.REDIS_HOST}:${redisConfig.REDIS_PORT}/${redisConfig.REDIS_DB}`;
  
  const redisOptions = {
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      if (times > redisConfig.REDIS_MAX_RETRIES) {
        logger.error('Redis connection failed after maximum retries');
        return null; // Stop retrying
      }
      const delay = Math.min(times * redisConfig.REDIS_RETRY_DELAY, 3000);
      logger.info(`Redis retry attempt ${times} in ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 1, // Reduce retries to fail faster
    connectTimeout: redisConfig.REDIS_CONNECT_TIMEOUT,
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      servername: redisConfig.REDIS_HOST // Important for TLS validation
    },
    keyPrefix: 'booklens-cache:',
    connectionName: 'booklens-api',
  };

  // Try to connect using URL first, then fallback to options if that fails
  try {
    redis = new Redis(redisUrl, redisOptions);
  } catch (error) {
    logger.warn(`Redis URL connection failed: ${error.message}, trying with options`);
    redis = new Redis({
      host: redisConfig.REDIS_HOST,
      port: redisConfig.REDIS_PORT,
      username: 'dante miguel',
      password: redisConfig.REDIS_PASSWORD,
      db: redisConfig.REDIS_DB,
      ...redisOptions
    });
  }

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    if (err.code === 'ECONNREFUSED' || err.message.includes('SSL') || err.message.includes('WRONGPASS')) {
      logger.warn(`Redis connection error: ${err.message}, falling back to mock implementation`);
      redis = new MockRedis();
    } else {
      logger.error('Redis error', { error: err.message });
    }
  });

  // Test connection with timeout
  try {
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis ping timeout')), 2000)
    );
    
    await Promise.race([pingPromise, timeoutPromise]);
    logger.info('Redis ping successful');
  } catch (error) {
    logger.warn(`Redis ping failed: ${error.message}, falling back to mock implementation`);
    redis = new MockRedis();
  }
} catch (error) {
  logger.warn('Failed to initialize Redis, using mock implementation', { error: error.message });
  redis = new MockRedis();
}

export default redis;
