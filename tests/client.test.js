// tests/client.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

// Helper: registers a user, completes their profile, and creates a company.
// Returns the access token so individual tests can make authenticated requests.
async function setup() {
  const email = `test${Date.now()}@bildyapp.com`;

  const registerRes = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'TestPassword123' });

  const token =
    registerRes.body.token ||
    registerRes.body.accessToken ||
    registerRes.body?.data?.token;

  expect(registerRes.status).toBe(201);
  expect(token).toBeDefined();

  await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test User', lastName: 'Tester', nif: '12345678A' });

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
}

// Reusable client payload to avoid repeating the same object in every test
const clientPayload = {
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
};

describe('Client endpoints', () => {

  it('creates a client', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Client One');
    expect(res.body.data.cif).toBe('B11111111');
  });

  it('gets a client by id', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(created.body.data._id);
    expect(res.body.data.name).toBe('Client One');
  });

  it('returns 404 for a non-existent client', async () => {
    const { token } = await setup();

    const res = await request(app)
      .get('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('updates a client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    expect(created.status).toBe(201);

    const res = await request(app)
      .put(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Client Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Client Updated');
    expect(res.body.data.cif).toBe('B11111111');
  });

  it('returns 404 when updating a non-existent client', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });

  it('soft deletes a client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    expect(created.status).toBe(201);

    const res = await request(app)
      .delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Client archived');

    // Soft-deleted client must no longer appear in the active list
    const getRes = await request(app)
      .get(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  it('lists archived clients', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    await request(app)
      .delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]._id).toBe(created.body.data._id);
  });

  it('restores an archived client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    await request(app)
      .delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/client/${created.body.data._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(false);

    // After restoring, the client should be accessible again via GET
    const getRes = await request(app)
      .get(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
  });

  it('rejects duplicate CIF in the same company', async () => {
    const { token } = await setup();

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    expect(res.status).toBe(409);
  });

  it('lists clients', async () => {
    const { token } = await setup();

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientPayload);

    const res = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.totalItems).toBe(1);
    expect(res.body.currentPage).toBe(1);
  });

  it('hard deletes a client', async () => {
    const { token } = await setup();

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'To Delete',
        cif: 'B99999999',
        email: 'del@test.com',
        phone: '123456789',
        address: {
          street: 'St',
          number: '1', postal:
            '28001', city:
            'Madrid',
          province: 'Madrid'
        }
      });

    const res = await request(app)
      .delete(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Client deleted');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/client');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/client')
      .set('Authorization', 'Bearer tokeninvalido');
    expect(res.status).toBe(401);
  });

  it('rejects a client with missing required fields', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'only-email@test.com' });

    expect(res.status).toBe(400);
  });

  it('paginates clients with ?page and ?limit', async () => {
    const { token } = await setup();

    for (const cif of ['B11111111', 'B22222222']) {
      await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'C',
          cif,
          email: 'c@c.com',
          phone: '111',
          address: {
            street: 'S',
            number: '1',
            postal: '28001',
            city: 'Madrid',
            province: 'Madrid'
          }
        });
    }

    const res = await request(app)
      .get('/api/client?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
    expect(res.body.currentPage).toBe(1);
  });

  it('filters clients by name', async () => {
    const { token } = await setup();

    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'García SL',
        cif: 'B11111111',
        email: 'a@a.com',
        phone: '111',
        address: {
          street: 'S',
          number: '1',
          postal: '28001',
          city: 'Madrid',
          province: 'Madrid'
        }
      });
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Smith Ltd',
        cif: 'B22222222',
        email: 'b@b.com',
        phone: '222',
        address: {
          street: 'S',
          number: '1',
          postal: '28001',
          city: 'Madrid',
          province: 'Madrid'
        }
      });

    const res = await request(app)
      .get('/api/client?name=García')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('García SL');
  });

  it('rejects updating a client to a duplicate CIF', async () => {
    const { token } = await setup();

    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'A',
        cif: 'B11111111',
        email: 'a@a.com',
        phone: '1',
        address: {
          street: 'S',
          number: '1',
          postal: '28001',
          city: 'Madrid',
          province: 'Madrid'
        }
      });

    const second = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'B',
        cif: 'B22222222',
        email: 'b@b.com',
        phone: '2',
        address: {
          street: 'S',
          number: '1',
          postal: '28001',
          city: 'Madrid',
          province: 'Madrid'
        }
      });

    const res = await request(app)
      .put(`/api/client/${second.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cif: 'B11111111' });

    expect(res.status).toBe(409);
  });

  it('returns 404 when deleting a non-existent client', async () => {
    const { token } = await setup();

    const res = await request(app)
      .delete('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when restoring a non-archived client', async () => {
    const { token } = await setup();

    const res = await request(app)
      .patch('/api/client/676767676767676767676767/restore')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
