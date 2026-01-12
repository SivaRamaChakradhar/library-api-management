/**
 * Custom error classes for better error handling
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class BusinessRuleError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join('; ');
      return next(new ValidationError(errorMessage));
    }

    req[property] = value;
    next();
  };
};

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Handle specific error types
  if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    if (err.message.includes('UNIQUE constraint failed')) {
      message = 'A record with this value already exists';
    } else if (err.message.includes('FOREIGN KEY constraint failed')) {
      message = 'Invalid reference to related resource';
    } else {
      message = 'Database constraint violation';
    }
  }

  // Log error for debugging (in production, use a proper logger)
  if (statusCode === 500) {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  BusinessRuleError,
  validate,
  errorHandler,
  asyncHandler
};
