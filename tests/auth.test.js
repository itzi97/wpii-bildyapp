// tests/auth.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

const baseUser = {
  email: 'test@bildyapp.com',
  password: 'Password123!',
};

describe('POST /api/user/register', () => {
  it('registers a new user and returns accessToken', async () => {
    const res = await request(app).post('/api/user/register').send(baseUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('fails with 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ password: 'Password123!' });
    expect(res.status).toBe(400);
  });

  it('fails with 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'test@bildyapp.com' });
    expect(res.status).toBe(400);
  });

  it('fails with 409 on duplicate email', async () => {
    await request(app).post('/api/user/register').send(baseUser);
    const res = await request(app).post('/api/user/register').send(baseUser);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/user/login', () => {
  beforeEach(async () => {
    const reg = await request(app).post('/api/user/register').send(baseUser);
    const token = reg.body.accessToken;
    const User = (await import('../src/models/User.js')).default;
    const user = await User.findOne({ email: baseUser.email });
    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: user.verificationCode });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/user/login').send(baseUser);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('fails with 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ ...baseUser, password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  it('fails with 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'nobody@bildyapp.com', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('Auth middleware — JWT protection', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('returns 401 with malformed JWT', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });

  it('returns 401 without Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'plaintokennoprefix');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is valid but user was deleted', async () => {
    const email = `gone${Date.now()}@test.com`;
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email, password: 'Password123!' });
    const token = reg.body.accessToken;

    const User = (await import('../src/models/User.js')).default;
    await User.deleteOne({ email });

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
