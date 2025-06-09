import Redis from 'ioredis';
import mongoose from 'mongoose';

import dotenv from 'dotenv';
dotenv.config();

/**
 * Simple logger implementation for testing
 * @type {Object}
 */
const logger = {
  /**
   * Log info message
   * @param {string} msg 
   * @param {Object} [data] 
   */
  info: (msg, data) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
  
  /**
   * Log error message  
   * @param {string} msg
   * @param {Object} [data]
   */
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data) : ''),
  
  /**
   * Log success message
   * @param {string} msg 
   * @param {Object} [data]
   */
  success: (msg, data) => console.log(`[SUCCESS] ${msg}`, data ? JSON.stringify(data) : ''),
  
  /** 
   * Log warning message
   * @param {string} msg
   * @param {Object} [data] 
   */
  warn: (msg, data) => console.warn(`[WARNING] ${msg}`, data ? JSON.stringify(data) : '')
};

// Test MongoDB connection
async function testMongoConnection() {
  try {
    logger.info('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    
    // Wait for connection events
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000);
    });
    
    logger.success('MongoDB connection successful!');
    return true;
  } catch (error) {
    logger.error('MongoDB connection failed:', { error: error.message });
    return false;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
  }
}

// Test Redis connection
async function testRedisConnection() {
  let redisClient = null;
  try {
    logger.info('Testing Redis connection...');
    
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      enableOfflineQueue: true,
      maxRetriesPerRequest: null
    });

    // Test a simple operation
    const testKey = 'test-connection-' + Date.now();
    await redisClient.set(testKey, 'success');
    const result = await redisClient.get(testKey);
    await redisClient.del(testKey);
    
    if (result === 'success') {
      logger.success('Redis connection and operations successful!');
      return true;
    } else {
      logger.error('Redis test operation failed');
      return false;
    }
  } catch (error) {
    logger.error('Redis connection failed:', { error: error.message });
    return false;
  } finally {
    if (redisClient) {
      redisClient.disconnect();
      logger.info('Redis connection closed');
    }
  }
}

// Run tests
async function runTests() {
  logger.info('Starting project tests...');
  
  const dbResult = await testMongoConnection();
  const redisResult = await testRedisConnection();
  
  logger.info('Test results:', {
    mongodb: dbResult ? 'PASSED' : 'FAILED',
    redis: redisResult ? 'PASSED' : 'FAILED'
  });
  
  if (dbResult && redisResult) {
    logger.success('All connection tests passed! The project is ready for the next implementation phase.');
  } else {
    logger.error('Some connection tests failed. Please check your configuration.');
  }
}

// Execute tests
runTests().catch(err => {
  logger.error('Unexpected error during tests:', { error: err.message });
  process.exit(1);
});
