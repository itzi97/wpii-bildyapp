// tests/auth.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';
import User from '../src/models/User.js';

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
    await User.findOneAndUpdate({ email: baseUser.email }, { status: 'verified' });
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
    expect(res.body.user.email).toBe(baseUser.email);
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
      .send({ name: 'Test', lastName: 'User', nif: '12345678A' });
    expect(res.status).toBe(200);
  });
  it('rejects a non-admin user on an admin-only route', async () => {
    const res1 = await request(app)
      .post('/api/user/register')
      .send({ email: `roletest${Date.now()}@test.com`, password: 'TestPassword123' });

    const token = res1.body.accessToken;

    await User.findOneAndUpdate(
      { email: res1.body.user?.email },
      { role: 'user' }
    );

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: `invited${Date.now()}@test.com`, name: 'A', lastName: 'B' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/user/company', () => {
  it('sets company data', async () => {
    const reg = await request(app).post('/api/user/register').send(baseUser);
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ isFreelance: true });
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


// Auth middleware, protected routes
describe('GET /api/client', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/client');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed/invalid JWT', async () => {
    const res = await request(app)
      .get('/api/client')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });

  it('returns 401 with Bearer but no token value', async () => {
    const res = await request(app)
      .get('/api/client')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token format is wrong (no Bearer prefix)', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'Token abc123');
    expect(res.status).toBe(401);
  });

  it('rejects a token without Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'plaintokennoprefix');

    expect(res.status).toBe(401);
  });
});

