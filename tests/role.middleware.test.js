// tests/role.middleware.test.js
import { jest } from '@jest/globals';
import { authorizeRoles } from '../src/middleware/role.middleware.js';

describe('authorizeRoles middleware', () => {
  it('calls next with 401 when req.user is missing', () => {
    const next = jest.fn();
    authorizeRoles('admin')({}, {}, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('calls next with 403 when user role is not in allowed list', () => {
    const next = jest.fn();
    const req = { user: { role: 'user' } };
    authorizeRoles('admin', 'owner')(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it('calls next() with no error when role is allowed', () => {
    const next = jest.fn();
    const req = { user: { role: 'admin' } };
    authorizeRoles('admin')(req, {}, next);

    // next called with no arguments means no error, middleware passed
    expect(next).toHaveBeenCalledWith();
  });
});
