// tests/error-handler.test.js
import { jest } from '@jest/globals';

const logErrorToSlack = jest.fn();

await jest.unstable_mockModule('../src/services/logger.service.js', () => ({
  logErrorToSlack,
}));

const { default: errorHandler } = await import('../src/middleware/error-handler.js');
const { default: AppError } = await import('../src/utils/AppError.js');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('error-handler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns AppError status/code/message without logging to Slack', async () => {
    const err = AppError.badRequest('Invalid body');
    const req = { method: 'POST', originalUrl: '/api/test' };
    const res = makeRes();

    await errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: err.code,
      message: 'Invalid body',
    });
    expect(logErrorToSlack).not.toHaveBeenCalled();
  });

  it('returns 500 for unexpected errors and logs to Slack', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
    const err = new Error('Boom');
    const req = { method: 'GET', originalUrl: '/api/test' };
    const res = makeRes();

    await errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(logErrorToSlack).toHaveBeenCalledWith(err, req);
    spy.mockRestore();
  });
});
