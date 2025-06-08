// Must be first to load and validate environment variables
import dotenv from 'dotenv';
import { cleanEnv, str, num, url } from 'envalid';

dotenv.config();

const env = cleanEnv(process.env, {
  MONGODB_URI: str(),
  PORT: num({ default: 3323 }),
  JWT_SECRET: str({desc: '32+ character secret for JWT signing'}),
  JWT_EXPIRES_IN: str({ default: '1h' }),
  JWT_REFRESH_SECRET: str({ default: process.env.JWT_SECRET }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  SESSION_SECRET: str(),
  NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: num({ default: 6379 }),
  FRONTEND_URL: url({ default: 'http://localhost:3000' })
});

// Core modules
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

// Express & Middleware
import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import session from 'express-session';
import flash from 'connect-flash';
import helmet from 'helmet';

// Auth and Models
import passport from './server/src/config/passport.js';
import rateLimiterMiddleware from './server/src/middleware/rateLimiter.js';

// Routes
import bookRoutes from './server/src/routes/bookRoutes.js';
import userRoutes from './server/src/routes/userRoutes.js';
import authRoutes from './server/src/routes/authRoutes.js';
import collectionRoutes from './server/src/routes/collectionRoutes.js';

// MongoDB
import mongoose from 'mongoose';
import logger, { requestLogger } from './server/src/config/logger.js';
import User from './server/src/models/User.js';
import Book from './server/src/models/Book.js';
import BookCollection from './server/src/models/BookCollection.js';


const app = express();
const PORT = process.env.PORT || 3323;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB with enhanced configuration
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log('✅ MongoDB connected');
    // Verify indexes on startup
    mongoose.connection.db.collection('books').createIndex({ title: 'text' });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit on DB connection failure
  });

// MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔁 MongoDB reconnected');
});

// Middleware setup
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'devsecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: NODE_ENV === 'production' },
}));

// Flash messages
app.use(flash());

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

// Global locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Security Headers
app.use(helmet.hsts({
  maxAge: 63072000,
  includeSubDomains: true,
  preload: true,
}));

// Rate limiter
app.use('/api/', rateLimiterMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  const status = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  res.json({
    status,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Add request logging middleware
app.use(requestLogger);

// Route handlers
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/auth', authRoutes);

// Error handler placeholder
import errorHandler from './server/src/middleware/errorHandler.js';
app.use(errorHandler);

if (NODE_ENV === 'production') {
  // HTTPS Configuration
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'config/ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'config/ssl/cert.pem')),
  };

  // Redirect all HTTP to HTTPS
  const httpApp = express();
  httpApp.all('*', (req, res) => {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
  });
  httpApp.listen(80, () => console.log('🌐 HTTP -> HTTPS redirect running on port 80'));

  // Launch secure server
  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(443, () => console.log('🔐 Secure HTTPS server running on port 443'));

} else {
  // Development mode
  app.listen(PORT, () => console.log(`🛠️ Dev server running on http://localhost:${PORT}`));
}
