// tests/error-handler.test.js
import request from 'supertest';
import { connectDB, closeDB, clearDB } from './helpers.js';
import { default as app } from '../src/app.js';
import AppError from '../src/utils/appError.js';

beforeAll(connectDB);
afterEach(clearDB);
afterAll(closeDB);

it('handles AppError 400', async () => {
  const res = await request(app)
    .get('/api/trigger-400')
    .set('Authorization', 'Bearer invalid');
  expect(res.status).toBe(400);
});

it('handles 500 errors', async () => {
  const res = await request(app)
    .get('/api/trigger-500');
  expect(res.status).toBe(500);
});
