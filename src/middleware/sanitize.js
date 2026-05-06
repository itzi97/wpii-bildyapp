// src/middleware/sanitize.js
// NoSQL injection protection middleware. Strips MongoDB query operators
// (keys starting with '$') and dot-notation keys from request bodies before
// they reach any controller. This prevents attackers from injecting operators
// like { "$gt": "" } into query filters via the request body.
//
// Example of an attack this prevents:
//   POST /api/user/login  { "email": { "$gt": "" }, "password": "anything" }
//   Without this middleware, $gt would reach Mongoose and match every user.

/**
 * Recursively sanitizes an object by:
 *  - Deleting keys that start with '$' (MongoDB operators)
 *  - Replacing keys containing '.' with an underscore version (prevents dot-notation injection)
 *
 * @param {object} obj - The object to sanitize in place
 */
function sanitizeObject(obj) {
  for (const key in obj) {
    if (key.startsWith('$')) {
      // Remove MongoDB operator keys entirely
      delete obj[key];
    } else if (key.includes('.')) {
      // Replace dot-notation keys to prevent path traversal in queries
      const cleanKey = key.replace(/\./g, '_');
      obj[cleanKey] = obj[key];
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recurse into nested objects and arrays
      sanitizeObject(obj[key]);
    }
  }
}

export const sanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  next();
};

export default sanitize;
