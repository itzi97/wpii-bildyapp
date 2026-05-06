// tests/client.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

async function setup() {
  const email = `test${Date.now()}@bildyapp.com`;
  const reg = await request(app).post('/api/user/register').send({ email, password: 'TestPassword123' });
  const token = reg.body.accessToken;

  await request(app).put('/api/user/register').set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test', lastName: 'User', nif: '12345678A' });

  await request(app).patch('/api/user/company').set('Authorization', `Bearer ${token}`)
    .send({
      isFreelance: false, name: 'Test Company',
      cif: `B${Date.now().toString().slice(-8)}`,
      address: { street: 'Main St', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
    });

  return { token };
}

const clientPayload = {
  name: 'Client One', cif: 'B11111111', email: 'client1@test.com', phone: '123456789',
  address: { street: 'Client St', number: '10', postal: '28002', city: 'Madrid', province: 'Madrid' },
};

describe('POST /api/client', () => {
  it('creates a client', async () => {
    const { token } = await setup();
    const res = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send(clientPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Client One');
    expect(res.body.data.cif).toBe('B11111111');
  });

  it('rejects with 400 when required fields are missing', async () => {
    const { token } = await setup();
    const res = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send({ email: 'only-email@test.com' });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate CIF within the same company', async () => {
    const { token } = await setup();
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientPayload);
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientPayload);
    expect(res.status).toBe(409);
  });
});

describe('GET /api/client', () => {
  it('lists clients with pagination metadata', async () => {
    const { token } = await setup();
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientPayload);

    const res = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.totalItems).toBe(1);
    expect(res.body.currentPage).toBe(1);
  });

  it('paginates with ?page and ?limit', async () => {
    const { token } = await setup();
    for (const cif of ['B11111111', 'B22222222']) {
      await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
        .send({
          name: 'C', cif, email: 'c@c.com', phone: '111',
          address: { street: 'S', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
        });
    }
    const res = await request(app).get('/api/client?page=1&limit=1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('filters clients by name (partial match)', async () => {
    const { token } = await setup();
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'García SL', cif: 'B11111111', email: 'a@a.com', phone: '111',
        address: { street: 'S', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
      });
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Smith Ltd', cif: 'B22222222', email: 'b@b.com', phone: '222',
        address: { street: 'S', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
      });

    const res = await request(app).get('/api/client?name=García').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('García SL');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/client');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app).get('/api/client').set('Authorization', 'Bearer tokeninvalido');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/client/:id', () => {
  it('gets a client by id', async () => {
    const { token } = await setup();
    const created = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send(clientPayload);

    const res = await request(app).get(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(created.body.data._id);
  });

  it('returns 404 for a non-existent client', async () => {
    const { token } = await setup();
    const res = await request(app).get('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/client/:id', () => {
  it('updates a client', async () => {
    const { token } = await setup();
    const created = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send(clientPayload);

    const res = await request(app).put(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`).send({ name: 'Client Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Client Updated');
  });

  it('rejects update to a duplicate CIF', async () => {
    const { token } = await setup();
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'A', cif: 'B11111111', email: 'a@a.com', phone: '1',
        address: { street: 'S', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
      });
    const second = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'B', cif: 'B22222222', email: 'b@b.com', phone: '2',
        address: { street: 'S', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
      });

    const res = await request(app).put(`/api/client/${second.body.data._id}`)
      .set('Authorization', `Bearer ${token}`).send({ cif: 'B11111111' });
    expect(res.status).toBe(409);
  });

  it('returns 404 when updating non-existent client', async () => {
    const { token } = await setup();
    const res = await request(app).post('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`).send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/client/:id', () => {
  it('soft deletes a client', async () => {
    const { token } = await setup();
    const created = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send(clientPayload);

    const res = await request(app).delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Client archived');

    const getRes = await request(app).get(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('hard deletes a client', async () => {
    const { token } = await setup();
    const created = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send({
        name: 'To Delete', cif: 'B99999999', email: 'del@test.com', phone: '123456789',
        address: { street: 'St', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
      });
    const res = await request(app).delete(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Client deleted');
  });

  it('returns 404 when deleting a non-existent client', async () => {
    const { token } = await setup();
    const res = await request(app).delete('/api/client/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/client/archived + PATCH restore', () => {
  it('lists archived clients', async () => {
    const { token } = await setup();
    const created = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send(clientPayload);
    await request(app).delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/client/archived').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('restores an archived client', async () => {
    const { token } = await setup();
    const created = await request(app).post('/api/client')
      .set('Authorization', `Bearer ${token}`).send(clientPayload);
    await request(app).delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app).patch(`/api/client/${created.body.data._id}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(false);
  });

  it('returns 404 when restoring a non-existent client', async () => {
    const { token } = await setup();
    const res = await request(app).patch('/api/client/676767676767676767676767/restore')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
