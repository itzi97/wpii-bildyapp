// Validate request bodies with Zod.
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const errors = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    // TODO: Should I use AppError here? In T6 it's direct
    // I'm asuming it has to do with short-circuit and return 400 skipping
    // passing control to errorHandler
    res.status(400).json({
      error: true,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: errors
    });
  }
}

export default validate;
