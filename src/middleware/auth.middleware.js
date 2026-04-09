import config from '../config/index.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

// Middleware to check access token sent in Authorization header.
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Token required',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(AppError.unauthorized('Access token required'))
  }

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
    return next(AppError.forbidden('Invalid or expired token'))
  }
};
