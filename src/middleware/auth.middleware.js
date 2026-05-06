// src/middleware/auth.middleware.js
// JWT authentication middleware. Runs before any protected route handler.
// Extracts the Bearer token from the Authorization header, verifies it,
// looks up the user in the database, and attaches the user document to req.user
// so downstream controllers can access the authenticated user without extra DB calls.
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Express middleware that enforces JWT authentication.
 * Attach to any route that requires a logged-in user:
 *   router.get('/protected', authenticateToken, controller)
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // The Authorization header must be present and follow the "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Access token required'));
  }

  // Extract the raw JWT string — everything after "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify() both validates the signature and checks the expiry date.
    // It throws a JsonWebTokenError if the token is tampered with, and a
    // TokenExpiredError if the exp claim has passed.
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Fetch the full user document from MongoDB so controllers have access
    // to fields like company, role, and status that aren't in the JWT payload.
    const user = await User.findById(decoded.id);

    if (!user) {
      // Token was valid but the user has since been deleted
      return next(AppError.unauthorized('User not found'));
    }

    // Make the authenticated user available to all subsequent middleware and controllers
    req.user = user;
    next();
  } catch (error) {
    // Covers both JsonWebTokenError (bad signature) and TokenExpiredError
    return next(AppError.unauthorized('Invalid or expired token'));
  }
};
