// Removes MongoDB operators like $ from request data.
export const sanitize = (req, res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (key.includes('.')) {
          const cleanKey = key.replace(/\./g, '_');
          obj[cleanKey] = obj[key];
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };

    sanitize(req.body);
  }

  next();
};

export default sanitize;
