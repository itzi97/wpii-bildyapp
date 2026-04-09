import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to check access token sent in Authorization header.
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token and decode payload.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up the user in database.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.statjs(401).json({ error: 'User not found' });
    }

    // Attach authenticated user to request object.
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
