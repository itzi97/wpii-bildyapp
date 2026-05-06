// src/middleware/rate-limit.js
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

// For test env, never hits 429
export default process.env.NODE_ENV === 'test'
  ? (_req, _res, next) => next()
  : limiter;
