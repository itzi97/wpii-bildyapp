// tests/app.socket.test.js
import request from 'supertest';
import app from '../src/app.js';
import { jest } from '@jest/globals';
import { io, emitToCompany } from '../src/app.js';

describe('app socket helpers', () => {
  it('exports io server instance', () => {
    expect(io).toBeDefined();
  });

  it('emitToCompany emits to the company room', () => {
    const emit = jest.fn();
    const to = jest.spyOn(io, 'to').mockReturnValue({ emit });

    emitToCompany('company123', 'deliverynote:update', { ok: true });

    expect(to).toHaveBeenCalledWith('company123');
    expect(emit).toHaveBeenCalledWith('deliverynote:update', { ok: true });

    to.mockRestore();
  });
});

describe('app rate limit middleware', () => {
  it('does not set x-ratelimit headers when NODE_ENV=test', async () => {
    // In NODE_ENV=test the rate limiter is disabled to prevent 429s during
    // integration tests. We verify that no rate-limit headers are present.
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer invalid-token');

    // The route still responds (401 from auth middleware), but no rate-limit headers
    expect(res.status).toBe(401);
    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
  });
});
