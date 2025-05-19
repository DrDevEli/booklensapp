import { ApiError } from './errors.js';
import logger from './logger.js';

/**
 * Validates required environment variables
 * @param {Array<string>} requiredVars - List of required environment variables
 * @throws {Error} If any required variable is missing
 */
export function validateEnv(requiredVars = []) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Validates Redis connection configuration
 * @returns {boolean} - True if configuration is valid
 */
export function validateRedisConfig() {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;
  
  if (!redisHost || !redisPort) {
    logger.warn('Redis host or port not configured properly');
    return false;
  }
  
  if (!redisPassword) {
    logger.warn('Redis password not configured');
    return false;
  }
  
  // Username is hardcoded in the Redis config, so we don't check it here
  
  return true;
}

/**
 * Validates and returns environment variables with defaults
 * @param {Object} config - Configuration object with variable names and default values
 * @returns {Object} - Object with validated environment variables
 */
export function getEnvConfig(config = {}) {
  const result = {};
  
  for (const [key, options] of Object.entries(config)) {
    const { required = false, default: defaultValue, type = 'string' } = options;
    
    if (required && !process.env[key]) {
      const errorMessage = `Missing required environment variable: ${key}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    let value = process.env[key] || defaultValue;
    
    // Type conversion
    if (value !== undefined) {
      if (type === 'number') {
        value = Number(value);
      } else if (type === 'boolean') {
        value = value === 'true' || value === '1' || value === true;
      } else if (type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (error) {
          logger.error(`Invalid JSON in environment variable ${key}`);
          value = defaultValue;
        }
      }
    }
    
    result[key] = value;
  }
  
  return result;
}
