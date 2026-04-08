import mongoSanitize from 'express-mongo-sanitize';

// Removes MongoDB operators like $ from request data.
export default mongoSanitize({
  replaceWith: '_',
});
