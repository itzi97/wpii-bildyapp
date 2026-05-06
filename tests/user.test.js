// tests/user.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());


async function setupVerified() {
  const email = `test${Date.now()}@bildyapp.com`;

  const reg = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'TestPassword123' });

  const token = reg.body.accessToken;
  const verificationCode = (await import('../src/models/User.js'))
    .default.findOne({ email }).then(u => u.verificationCode);

  // Validate email so user is 'verified'
  const User = (await import('../src/models/User.js')).default;
  const user = await User.findOne({ email });
  const code = user.verificationCode;

  await request(app)
    .put('/api/user/validation')
    .set('Authorization', `Bearer ${token}`)
    .send({ code });

  return { token, email, userId: user._id.toString() };
}

async function setupWithCompany() {
  const email = `test${Date.now()}@bildyapp.com`;

  const reg = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'TestPassword123' });

  const token = reg.body.accessToken;

  await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test', lastName: 'User', nif: '12345678A' });

  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({
      isFreelance: false,
      name: 'Test Company',
      cif: `B${Date.now().toString().slice(-8)}`,
      address: {
        street: 'Main St', number: '1',
        postal: '28001', city: 'Madrid', province: 'Madrid',
      },
    });

  return { token, email };
}

describe('User endpoints', () => {
  it('validates email with correct code', async () => {
    const email = `test${Date.now()}@bildyapp.com`;

    const reg = await request(app)
      .post('/api/user/register')
      .send({ email, password: 'TestPassword123' });

    const token = reg.body.accessToken;

    const User = (await import('../src/models/User.js')).default;
    const user = await User.findOne({ email });

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: user.verificationCode });

    expect(res.status).toBe(200);
    expect(res.body.ack).toBe(true);
  });

  it('rejects wrong validation code', async () => {
    const email = `test${Date.now()}@bildyapp.com`;

    const reg = await request(app)
      .post('/api/user/register')
      .send({ email, password: 'TestPassword123' });

    const token = reg.body.accessToken;

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(400);
  });

  it('logs out successfully', async () => {
    const { token } = await setupWithCompany();

    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ack).toBe(true);
  });

  it('refreshes token', async () => {
    const email = `test${Date.now()}@bildyapp.com`;

    const reg = await request(app)
      .post('/api/user/register')
      .send({ email, password: 'TestPassword123' });

    const { refreshToken } = reg.body;

    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('soft deletes the user', async () => {
    const { token } = await setupWithCompany();

    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ack).toBe(true);
  });

  it('hard deletes the user', async () => {
    const { token } = await setupWithCompany();

    const res = await request(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('changes password', async () => {
    const { token } = await setupWithCompany();

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'TestPassword123', newPassword: 'NewPassword456' });

    expect(res.status).toBe(200);
    expect(res.body.ack).toBe(true);
  });

  it('invites a user', async () => {
    const { token } = await setupWithCompany();

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: `invited${Date.now()}@bildyapp.com`,
        name: 'Invited',
        lastName: 'User',
      });

    expect(res.status).toBe(201);
    expect(res.body.ack).toBe(true);
  });

  it('rejects login with wrong password', async () => {
    const email = `test${Date.now()}@bildyapp.com`;
    await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });

    // First verify the email
    const User = (await import('../src/models/User.js')).default;
    const user = await User.findOne({ email });
    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${(await request(app).post('/api/user/register').send({ email: `x${email}`, password: 'TestPassword123' })).body.accessToken}`)
      .send({ code: user.verificationCode });

    const res = await request(app)
      .post('/api/user/login')
      .send({ email, password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  it('rejects refresh with invalid token', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: 'invalidtoken' });
    expect(res.status).toBe(401);
  });

  it('rejects duplicate email on register', async () => {
    const email = `test${Date.now()}@bildyapp.com`;
    await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    const res = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    expect(res.status).toBe(409);
  });

  it('returns 401 when login with unverified user', async () => {
    const email = `unverified${Date.now()}@test.com`;
    await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    // Do NOT verify — status stays 'pending'
    const res = await request(app).post('/api/user/login').send({ email, password: 'TestPassword123' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when validating already-verified email', async () => {
    const email = `alreadyv${Date.now()}@test.com`;
    const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    const token = reg.body.accessToken;
    const User = (await import('../src/models/User.js')).default;
    const user = await User.findOne({ email });
    // Verify once
    await request(app).put('/api/user/validation').set('Authorization', `Bearer ${token}`).send({ code: user.verificationCode });
    // Try to verify again
    const res = await request(app).put('/api/user/validation').set('Authorization', `Bearer ${token}`).send({ code: user.verificationCode });
    expect(res.status).toBe(400);
  });

  it('returns 429 after exhausting verification attempts', async () => {
    const email = `attempts${Date.now()}@test.com`;
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email, password: 'TestPassword123' });

    const token = reg.body.accessToken;

    for (let i = 0; i < 3; i++) {
      await request(app)
        .put('/api/user/validation')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '000000' });
    }

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(429);
  });

  it('rejects refresh when token is missing', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects password change with wrong current password', async () => {
    const { token } = await setupWithCompany();

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword456'
      });

    expect(res.status).toBe(401);
  });

  it('rejects inviting an already registered email', async () => {
    const { token } = await setupWithCompany();
    const existingEmail = `existing${Date.now()}@bildyapp.com`;

    await request(app)
      .post('/api/user/register')
      .send({ email: existingEmail, password: 'TestPassword123' });

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: existingEmail,
        name: 'Existing',
        lastName: 'User'
      });

    expect(res.status).toBe(409);
  });
});

describe('Role middleware — forbidden access', () => {
  it('returns 403 when a non-admin user accesses an admin-only route', async () => {
    const email = `norole${Date.now()}@test.com`;

    const reg = await request(app)
      .post('/api/user/register')
      .send({ email, password: 'Password123!' });

    const token = reg.body.accessToken;

    // Downgrade role to 'user' so authorizeRoles('admin') rejects it
    const User = (await import('../src/models/User.js')).default;
    await User.findOneAndUpdate({ email }, { role: 'user' });

    // authenticateToken re-fetches user from DB, so the updated role is used
    const forbidden = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: `invited${Date.now()}@test.com`, name: 'A', lastName: 'B' });

    expect(forbidden.status).toBe(403);
  });
});

import { jest } from '@jest/globals';
import { authorizeRoles } from '../src/middleware/role.middleware.js';

describe('authorizeRoles — direct unit tests', () => {
  it('calls next with 401 when req.user is undefined', () => {
    const next = jest.fn();
    authorizeRoles('admin')({}, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);  // hits line 20 (!req.user branch)
  });
});
