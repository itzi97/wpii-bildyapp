// tests/auth.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './setup.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

const baseUser = {
  email: 'test@bildyapp.com',
  password: 'Password123!',
};

describe('POST /api/user/register', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/user/register').send(baseUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('fails with missing email', async () => {
    const res = await request(app).post('/api/user/register').send({
      password: 'Password123!'
    });
    expect(res.status).toBe(400);
  });

  it('fails with duplicate email', async () => {
    await request(app).post('/api/user/register').send(baseUser);
    const res = await request(app).post('/api/user/register').send(baseUser);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/user/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/user/register').send(baseUser);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/user/login').send(baseUser);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('fails with wrong password', async () => {
    const res = await request(app).post('/api/user/login').send({
      ...baseUser,
      password: 'wrong',
    });
    expect(res.status).toBe(401);
  });

  it('fails with unknown email', async () => {
    const res = await request(app).post('/api/user/login').send({
      email: 'nobody@x.com',
      password: 'Password123!'
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/user', () => {
  it('returns current user with valid token', async () => {
    const reg = await request(app).post('/api/user/register').send(baseUser);
    const res = await request(app).get('/api/user').set(
      'Authorization',
      `Bearer ${reg.body.accessToken}`
    );
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(baseUser.email);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user/register (onboarding)', () => {
  it('updates personal data', async () => {
    const reg = await request(app).post('/api/user/register').send(baseUser);
    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ fullName: 'Test User', phone: '676769676' });
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/user/company', () => {
  it('sets company data', async () => {
    const reg = await request(app).post('/api/user/register').send(baseUser);
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ name: 'TestCo', cif: 'B12345678', isFreelance: false });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/user/logout', () => {
  it('logs out succesfully', async () => {
    const reg = await request(app).post('/api/user/register').send(baseUser);
    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);
    expect(res.status).toBe(200);
  });
});

