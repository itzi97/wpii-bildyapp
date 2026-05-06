// src/utils/AppError.js
// Custom error class for all application-level (operational) errors.
//
// Why a custom error class?
//   Express's default error handler has no way to distinguish a "404 Not Found"
//   from a programming mistake. By throwing AppError instances, the centralized
//   error-handler in middleware/error-handler.js can check instanceof AppError
//   and respond with the correct HTTP status and a consistent JSON shape.
//
// Usage in controllers:
//   return next(AppError.notFound('Client not found'));
//   return next(AppError.conflict('CIF already exists'));
export default class AppError extends Error {
  /**
   * @param {string} message: Human-readable error description (sent to the client)
   * @param {number} statusCode: HTTP status code (400, 401, 403, 404, 409, 500…)
   * @param {string} code: Machine-readable error code (e.g. 'NOT_FOUND')
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    // Call the parent Error constructor to set this.message and the stack trace
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';

    // isOperational = true marks this as an expected, handled error.
    // The error handler uses this to decide whether to send details to the client.
    this.isOperational = true;

    // Captures a clean stack trace that excludes the AppError constructor itself
    Error.captureStackTrace?.(this, this.constructor);
  }

  // -- Static factory helpers
  // These make controller code more readable:
  //   next(AppError.notFound('Client not found'))
  // instead of:
  //   next(new AppError('Client not found', 404, 'NOT_FOUND'))

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMIT') {
    return new AppError(message, 429, code);
  }

  // For unexpected server-side failures that still need a controlled response
  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new AppError(message, 500, code);
  }
}
