import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import passport from './config/passport.js';
import { errorHandler } from './utils/errors.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booksserviceapi');
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

// Start server regardless of MongoDB connection status
const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
  });
};

// Initialize application
(async () => {
  // Try to connect to MongoDB but don't block server startup
  connectWithRetry().then(connected => {
    if (!connected) {
      logger.warn('Starting server without MongoDB connection. Some features will be unavailable.');
    }
    startServer();
  });
})();

export default app;
