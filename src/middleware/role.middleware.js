// src/middleware/role.middleware.js
// Role-based authorisation middleware. Runs after authenticateToken so req.user
// is guaranteed to be set. Returns a 403 if the authenticated user's role is not
// in the list of allowed roles passed to the factory function.
//
// Usage:
//   router.delete('/admin-only', authenticateToken, authorizeRoles('admin'), handler)
import AppError from '../utils/AppError.js';

/**
 * Factory that returns a middleware checking the user's role.
 * Accept multiple roles: authorizeRoles('admin', 'moderator')
 *
 * @param {...string} allowedRoles: Roles permitted to access the route
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // This check is a safety net, authenticateToken should always run first
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    // Check whether the authenticated user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
};
