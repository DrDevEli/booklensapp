import logger from '../infrastructure/config/logger.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('API Error', { 
    error: err.message, 
    stack: err.stack,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });
  
  const status = err.status || 500;
  const message = status === 500 && process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  // Handle different response types
  if (req.accepts('html')) {
    res.status(status).render('books', {
      error: message,
      data: null
    });
  } else {
    res.status(status).json({
      success: false,
      error: message
    });
  }
};

// Specialized error classes
export class ValidationError extends ApiError {
  constructor(message, errors = {}) {
    super(400, message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}
