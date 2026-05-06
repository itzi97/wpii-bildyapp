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
  it('applies rate limiting middleware', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });
});
