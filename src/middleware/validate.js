// src/middleware/validate.js
// Zod validation middleware factory. Takes a Zod schema and returns an Express
// middleware that validates req.body, req.query, and req.params against it.
// On success, the parsed (and potentially transformed/coerced) values replace
// the originals on the request object so controllers always receive clean data.
// On failure, a structured 400 response is returned listing every field error.
//
// Usage in routes:
//   import { validate } from '../middleware/validate.js';
//   import { createClientSchema } from '../validators/client.validator.js';
//   router.post('/', authenticateToken, validate(createClientSchema), createClient);
import { ZodError } from 'zod';

/**
 * Factory function that returns a validation middleware for the given Zod schema.
 * The schema should be an object schema with optional 'body', 'query', and 'params' keys.
 *
 * @param {import('zod').ZodSchema} schema: Zod schema to validate against
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    // parseAsync supports schemas with async refinements (e.g. .refine() with DB checks)
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace request values with the parsed (coerced/transformed) versions.
    // This means controllers can trust the types, e.g. a numeric string "5"
    // becomes the number 5 if the schema uses z.coerce.number().
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) Object.assign(req.query, parsed.query);
    if (parsed.params) Object.assign(req.params, parsed.params);

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Map Zod's issue list into a flat array of { field, message } objects
      // so the client gets clear, actionable validation feedback per field.
      const details = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      });
    }

    // Non-Zod errors (e.g. database errors in async refinements) go to error-handler
    next(error);
  }
};

export default validate;
