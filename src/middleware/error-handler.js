// src/middleware/error-handler.js
// Centralised Express error-handling middleware. Must be the last app.use() call
// in app.js so it catches errors forwarded by next(err) from anywhere in the stack.
//
// Two categories of errors are handled:
//   1. AppError (operational), known, expected errors from controllers.
//      Respond with the error's own statusCode and machine-readable code.
//   2. Unexpected errors, programming mistakes, DB failures, third-party crashes.
//      Always respond with 500 and log the full error to Slack.
import AppError from '../utils/AppError.js';
import { logErrorToSlack } from '../services/logger.service.js';

/**
 * Express error handler, signature must have exactly 4 parameters (err, req, res, next)
 * so Express recognises it as an error-handling middleware.
 */
export default async function errorHandler(err, req, res, next) {
  // AppError instances are operational errors thrown intentionally by controllers.
  // Return the error's own status code and a consistent JSON body.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  // Any other error is unexpected, log the full stack to the console and Slack,
  // then return a generic 500 response (never expose internal details to the client).
  console.error('[error-handler] Unexpected error:', err);
  await logErrorToSlack(err, req);

  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Internal server error',
  });
}
