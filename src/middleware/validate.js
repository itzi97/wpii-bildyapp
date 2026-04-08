import AppError from '../utils/AppError.js';

// Validate request bodies with Zod.
export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join(', ');

      return next(AppError.badRequest(message, 'VALIDATION_ERROR'));
    }

    // Used parsed data, transforms/normalization from Zod preserved.
    req.body = result.data;
    next();
  };
}
