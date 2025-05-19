import redis from '../config/redis.js';
import logger from './logger.js';

const DEFAULT_TTL = 3600; // 1 hour

export const cache = {
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Parsed value or null if not found
   */
  get: async (key) => {
    try {
      const value = await redis.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (e) {
        return value; // Return as-is if not JSON
      }
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  },

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be stringified)
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  set: async (key, value, ttl = DEFAULT_TTL) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await redis.set(key, stringValue, 'EX', ttl);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  },

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  del: async (key) => {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  },

  /**
   * Set multiple cache entries with the same TTL
   * @param {Object} entries - Key-value pairs to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  mset: async (entries, ttl = DEFAULT_TTL) => {
    try {
      const pipeline = redis.pipeline();

      for (const [key, value] of Object.entries(entries)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        pipeline.set(key, stringValue, 'EX', ttl);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error', { error: error.message });
      return false;
    }
  }
};