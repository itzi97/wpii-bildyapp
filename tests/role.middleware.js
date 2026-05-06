// tests/role.middleware.test.js
import { authorizeRoles } from '../src/middleware/role.middleware.js';

describe('role.middleware', () => {
  it('returns 401 when req.user is missing', () => {
    const next = jest.fn();
    const middleware = authorizeRoles('admin');

    middleware({}, {}, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
