// tests/client.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './setup.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

// Helper setup function
async function setup() {
  const email = `test${Date.now()}@bildyapp.com`;

  const registerRes = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'TestPassword123', });


  const token =
    registerRes.body.token ||
    registerRes.body.accessToken ||
    registerRes.body?.data?.token;

  expect(registerRes.status).toBe(201);
  expect(token).toBeDefined();

  await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test User',
      lastName: 'Tester',
      nif: '12345678A',
    });

  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({
      isFreelance: false,
      name: 'Test Company',
      cif: 'B12345678',
      address: {
        street: 'Main St',
        number: '1',
        postal: '28001',
        city: 'Madrid',
        province: 'Madrid',
      },
    });

  return { token };
};

describe('DEBUG: user register', () => {
  it('register a user', async () => {
    const res = await request(app).post('/api/user/register').send({
      name: 'Test User',
      email: 'test@bildyapp.com',
      password: 'TestPassword123',
    });

    console.log('Register status:', res.status);
    console.log('Register body:', JSON.stringify(res.body, null, 2));
  });
});

describe('Client endpoints', () => {

  // GET /api/client
  it('creates a client', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Client One',
        cif: 'B11111111',
        email: 'client1@test.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.client.name).toBe('Client One');
    expect(res.body.client.cif).toBe('B11111111')
  });

  // GET /api/client/:id
  it('gets a client by id', async () => {
    const { token } = await setup();

    // First create a client
    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Client One',
        cif: 'B11111111',
        email: 'client1@test.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid',
        },
      });

    expect(created.status).toBe(201);

    // Fetch it by id
    const res = await request(app)
      .get(`/api/client/${created.body.client._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.client._id).toBe(created.body.client._id);
    expect(res.body.client.name).toBe('Client One');
  });

  // GET /api/client/:id but for non existing client
  it('returns 404 for a non-existent client', async () => {
    const { token } = await setup();

    const res = await request(app)
      .get('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404);
  });

  // PUT /api/client/:id
  it('update a client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Client One',
        cif: 'B11111111',
        email: 'client1@test.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid'
        },
      });

    expect(created.status).toBe(201);

    const res = await request(app)
      .put(`/api/client/${created.body.client._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Client Updated' });

    expect(res.status).toBe(200);
    expect(res.body.client.name).toBe('Client Updated');
    expect(res.body.client.cif).toBe('B11111111');
  });

  // PUT /api/client/:id updating a non existent client returns 404
  it('returns 404 when updating a non-existent client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' });

    expect(created.status).toBe(404);
  });

  // DELETE /api/client/:id?soft=true
  it('soft deletes a client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Client One',
        cif: 'B11111111',
        email: 'client1@test.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid'
        },
      });

    expect(created.status).toBe(201);

    const res = await request(app)
      .delete(`/api/client/${created.body.client._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Client should no longer appear in the active list
    const getRes = await request(app)
      .get(`/api/client/${created.body.client._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  // List archived clients 
  it('lists archived clients', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Client One',
        cif: 'B11111111',
        email: 'client1@test.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid'
        },
      });

    await request(app)
      .delete(`/api/client/${created.body.client._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`)

    const res = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clients)).toBe(true);
    expect(res.body.clients.length).toBeGreaterThan(0);
    expect(res.body.clients[0]._id).toBe(created.body.client._id);
  });

  // Restores archived client
  it('restores an archived client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Client One',
        cif: 'B11111111',
        email: 'client1@test.com',
        phone: '123456789',
        address: {
          street: 'Client St',
          number: '10',
          postal: '28002',
          city: 'Madrid',
          province: 'Madrid',
        },
      });

    await request(app)
      .delete(`/api/client/${created.body.client._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/client/${created.body.client._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.client.deleted).toBe(false);

    // Should be visible again in normal GET
    const getRes = await request(app)
      .get(`/api/client/${created.body.client._id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(getRes.status).toBe(200);
  });
});
