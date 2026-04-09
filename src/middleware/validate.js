import { ZodError } from 'zod';

// Generic Zod validation middleware
export const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return res.status(400).json({
        error: true,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details
      });
    }

    next(error);
  }
};

export default validate;
