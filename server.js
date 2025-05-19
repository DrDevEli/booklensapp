import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import passport from './config/passport.js';
import { errorHandler } from './utils/errors.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import logger from './utils/logger.js';
import securityMiddleware from './middleware/security.js';
import { validateEnv, getEnvConfig, validateRedisConfig } from './utils/envValidator.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
validateEnv([
  'SESSION_SECRET',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI'
]);

// Get configuration from environment
const config = getEnvConfig({
  PORT: { type: 'number', default: 3000 },
  NODE_ENV: { default: 'development' },
  CORS_ORIGIN: { default: '*' },
  MONGODB_URI: { required: true },
  TRUST_PROXY: { type: 'boolean', default: false }
});

// Initialize Express app
const app = express();
const PORT = config.PORT;

// Apply security middleware (includes helmet)
securityMiddleware(app);

// Configure CORS
const corsOptions = {
  origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Add compression middleware
app.use(compression());

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Initialize passport
app.use(passport.initialize());

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// API Documentation
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let swaggerDocument;
try {
  const swaggerPath = join(__dirname, 'docs', 'swagger.json');
  swaggerDocument = JSON.parse(readFileSync(swaggerPath, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  logger.info('API documentation loaded successfully');
} catch (error) {
  logger.error('Failed to load API documentation', { error: error.message });
}

// Error handling
app.use(errorHandler);

// Connect to MongoDB with retry logic
const connectWithRetry = async (retryCount = 5, delay = 5000) => {
  try {
    const mongooseOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      minPoolSize: 2
    };
    
    await mongoose.connect(config.MONGODB_URI, mongooseOptions);
    logger.info('Connected to MongoDB successfully');
    return true;
  } catch (err) {
    if (retryCount === 0) {
      logger.error('Failed to connect to MongoDB after multiple attempts', { error: err.message });
      return false;
    }
    
    logger.warn(`MongoDB connection failed, retrying in ${delay}ms...`, { 
      attemptsRemaining: retryCount,
      error: err.message
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(retryCount - 1, delay);
  }
};

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  // Close MongoDB connection
  if (mongoose.connection.readyState === 1) {
    logger.info('Closing MongoDB connection');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
  
  // Exit process
  logger.info('Exiting process');
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server regardless of MongoDB connection status
const startServer = () => {
  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
  });
  
  // Set timeouts
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds (slightly more than keepAliveTimeout)
  
  return server;
};

// Initialize application
(async () => {
  // Validate Redis configuration
  const redisConfigValid = validateRedisConfig();
  if (!redisConfigValid) {
    logger.warn('Redis configuration is invalid. Cache features may not work properly.');
  }
  
  // Try to connect to MongoDB but don't block server startup
  connectWithRetry().then(connected => {
    if (!connected) {
      logger.warn('Starting server without MongoDB connection. Some features will be unavailable.');
    }
    startServer();
  });
})();

export default app;
