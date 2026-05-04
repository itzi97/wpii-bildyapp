// tests/apperror.test.js
import AppError from '../src/utils/AppError.js';

describe('AppError utility', () => {
  it('creates an AppError with the correct status and message', () => {
    const err = new AppError('Something went wrong', 422);
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('Something went wrong');
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe('AppError');
  });

  it('defaults statusCode to 500 when not provided', () => {
    const err = new AppError('Oops');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('AppError.badRequest creates a 400', () => {
    const err = AppError.badRequest();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });

  it('AppError.unauthorized creates a 401', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('AppError.forbidden creates a 403', () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('AppError.notFound creates a 404', () => {
    const err = AppError.notFound();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('AppError.conflict creates a 409', () => {
    const err = AppError.conflict();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('AppError.tooManyRequests creates a 429', () => {
    const err = AppError.tooManyRequests();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMIT');
  });

  it('AppError.internal creates a 500', () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('accepts custom message and code overrides', () => {
    const err = AppError.badRequest('Custom message', 'CUSTOM_CODE');
    expect(err.message).toBe('Custom message');
    expect(err.code).toBe('CUSTOM_CODE');
  });
});
