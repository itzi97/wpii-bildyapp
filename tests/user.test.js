// tests/user.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';
import { jest } from '@jest/globals';
import { authorizeRoles } from '../src/middleware/role.middleware.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

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
      address: { street: 'Main St', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
    });

  return { token, email };
}

describe('Email validation', () => {
  it('validates email with correct code', async () => {
    const email = `test${Date.now()}@bildyapp.com`;
    const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
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
    const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    const token = reg.body.accessToken;

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(400);
  });

  it('rejects already-verified email', async () => {
    const email = `alreadyv${Date.now()}@test.com`;
    const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    const token = reg.body.accessToken;
    const User = (await import('../src/models/User.js')).default;
    const user = await User.findOne({ email });

    await request(app).put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`).send({ code: user.verificationCode });

    const res = await request(app).put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`).send({ code: user.verificationCode });

    expect(res.status).toBe(400);
  });

  it('returns 429 after exhausting verification attempts', async () => {
    const email = `attempts${Date.now()}@test.com`;
    const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    const token = reg.body.accessToken;

    for (let i = 0; i < 3; i++) {
      await request(app).put('/api/user/validation')
        .set('Authorization', `Bearer ${token}`).send({ code: '000000' });
    }

    const res = await request(app).put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`).send({ code: '000000' });

    expect(res.status).toBe(429);
  });
});

describe('Token refresh', () => {
  it('refreshes token with valid refreshToken', async () => {
    const email = `test${Date.now()}@bildyapp.com`;
    const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });

    const res = await request(app).post('/api/user/refresh').send({ refreshToken: reg.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects refresh with invalid token', async () => {
    const res = await request(app).post('/api/user/refresh').send({ refreshToken: 'invalidtoken' });
    expect(res.status).toBe(401);
  });

  it('rejects refresh when refreshToken is missing', async () => {
    const res = await request(app).post('/api/user/refresh').send({});
    expect(res.status).toBe(400);
  });
});

describe('User profile & company', () => {
  it('returns current user via GET /api/user', async () => {
    const { token, email } = await setupWithCompany();
    const res = await request(app).get('/api/user').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('updates personal data', async () => {
    const { token } = await setupWithCompany();
    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated', lastName: 'Name', nif: '87654321B' });
    expect(res.status).toBe(200);
  });

  it('sets company data (isFreelance)', async () => {
    const email = `test${Date.now()}@bildyapp.com`;
    const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ isFreelance: true });
    expect(res.status).toBe(200);
  });
});

describe('Password change', () => {
  it('changes password with correct current password', async () => {
    const { token } = await setupWithCompany();
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'TestPassword123', newPassword: 'NewPassword456' });
    expect(res.status).toBe(200);
    expect(res.body.ack).toBe(true);
  });

  it('rejects password change with wrong current password', async () => {
    const { token } = await setupWithCompany();
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword123', newPassword: 'NewPassword456' });
    expect(res.status).toBe(401);
  });
});

describe('User invite', () => {
  it('invites a new user', async () => {
    const { token } = await setupWithCompany();
    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: `invited${Date.now()}@bildyapp.com`, name: 'Invited', lastName: 'User' });
    expect(res.status).toBe(201);
    expect(res.body.ack).toBe(true);
  });

  it('rejects inviting an already registered email', async () => {
    const { token } = await setupWithCompany();
    const existingEmail = `existing${Date.now()}@bildyapp.com`;
    await request(app).post('/api/user/register').send({ email: existingEmail, password: 'TestPassword123' });

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: existingEmail, name: 'Existing', lastName: 'User' });
    expect(res.status).toBe(409);
  });
});

describe('User deletion', () => {
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
});

describe('Logout', () => {
  it('logs out successfully', async () => {
    const { token } = await setupWithCompany();
    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ack).toBe(true);
  });
});

describe('Role middleware — authorizeRoles', () => {
  it('calls next with 403 when user role is not allowed', async () => {
    const email = `norole${Date.now()}@test.com`;
    const reg = await request(app).post('/api/user/register').send({ email, password: 'Password123!' });
    const token = reg.body.accessToken;

    const User = (await import('../src/models/User.js')).default;
    await User.findOneAndUpdate({ email }, { role: 'user' });

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: `invited${Date.now()}@test.com`, name: 'A', lastName: 'B' });

    expect(res.status).toBe(403);
  });

  it('calls next with 401 when req.user is undefined (unit)', () => {
    const next = jest.fn();
    authorizeRoles('admin')({}, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});
