import AppError from '../utils/AppError.js';

// Centralized Express error middleware (API response consistency).
export default function errorHandler(err, req, res, next) {
  // If it is already one of our application errors, keep its data.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  // Unexpected errors fall back to generic 500 response.
  console.error(err);

  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Internal server error',
  });
}
