// tests/misc.test.js
import AppError from '../src/utils/AppError.js';

describe('AppError utility', () => {
  it('creates an AppError with the correct status and message', () => {
    const err = new AppError('Something went wrong', 422);
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('Something went wrong');
    expect(err.isOperational).toBe(true);
  });

  it('defaults statusCode to 500 when not provided', () => {
    const err = new AppError('Oops');
    expect(err.statusCode).toBe(500);
  });

  it('AppError.notFound creates a 404', () => {
    const err = AppError.notFound('Not found');
    expect(err.statusCode).toBe(404);
  });

  it('AppError.conflict creates a 409', () => {
    const err = AppError.conflict('Duplicate');
    expect(err.statusCode).toBe(409);
  });
});
