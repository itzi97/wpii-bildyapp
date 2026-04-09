import config from '../config/index.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

// Middleware to check access token sent in Authorization header.
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Access token required'));
  }

  // Explicit token format checking
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(AppError.unauthorized('Invalid token format'));
  }

  const token = parts[1]

  console.log('Token preview:', token?.substring(0, 20) + '...');

  try {
    // Verify token and decode payload.
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Look up the user in database.
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(AppError.unauthorized('User not found'))
    }

    // Attach authenticated user to request object.
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verify error:', error.name, error.message)
    return next(AppError.unauthorized('Invalid or expired token'))
  }
};
