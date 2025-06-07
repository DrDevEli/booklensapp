import logger from '../infrastructure/config/logger.js';

/**
 * Base application error class
 */
export class ApplicationError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace and log error
    Error.captureStackTrace(this, this.constructor);
    logger.error(this.toString());
  }

  toString() {
    return `${this.timestamp} [${this.name}] ${this.message} | Status: ${this.status} | Details: ${JSON.stringify(this.details)}`;
  }

  toJSON() {
    return {
      error: {
        type: this.name,
        message: this.message,
        status: this.status,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp
      }
    };
  }
}

// Domain-specific errors
export class ValidationError extends ApplicationError {
  constructor(errors, message = 'Validation failed') {
    super(message, 400, { errors });
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource, message = 'Resource not found') {
    super(message, 404, { resource });
  }
}

export class ConflictError extends ApplicationError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle ApplicationError instances
  if (err instanceof ApplicationError) {
    return res.status(err.status).json(err.toJSON());
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const authError = new AuthenticationError('Invalid token');
    return res.status(authError.status).json(authError.toJSON());
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationError = new ValidationError(err.errors);
    return res.status(validationError.status).json(validationError.toJSON());
  }

  // Log unexpected errors
  logger.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method
  });

  // Generic error response
  res.status(500).json({
    error: {
      type: 'InternalServerError',
      message: 'An unexpected error occurred',
      status: 500,
      timestamp: new Date().toISOString()
    }
  });
};
