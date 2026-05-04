// tests/deliverynote.test.js
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

// Setup helper
const setup = async () => {
  const reg = await request(app).post('/api/user/register').send(baseUser);
  const token = reg.body.accessToken;

  await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test',
      lastName: 'User',
      nif: '12345678A'
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
        province: 'Madrid'
      },
    });

  const client = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'DN Client',
      cif: 'B33333333',
      email: 'dn@client.com'
    });

  const project = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'DN Project',
      projectCode: 'DN001',
      client: client.body.client._id
    });

  return {
    token,
    clientId: client.body.client._id,
    projectId: project.body.project._id
  };
};

// POST /api/deliverynote: creates a note
it('creates a delivery note', async () => {
  const { token, clientId, projectId } = await setup();
  const res = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'Test work',
      workdate: new Date().toISOString(),
      hours: 8
    });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('_id');
  expect(res.body.format).toBe('hours');
});

// GET /api/deliverynote: lists notes
// GET /api/deliverynote/:id: returns one note
// PATCH /api/deliverynote/:id/sign signs it, signing it twice returns 409
// DELETE /api/deliverynote/:id: succeeds when unsigned
// DELETE /api/deliverynote/:id returns 403 whne signed
// GET /api/deliverynote/pdf/:id returns application/pdf and 200


