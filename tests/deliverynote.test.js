// tests/deliverynote.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

// Globals for tests
const baseUser = {
  email: 'test@bildyapp.com',
  password: 'Password123!',
};

const SIGNATURE_DATA = 'data:image/png;base64,ZmFrZVNpZ25hdHVyZQ==';

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
      workDate: new Date().toISOString(),
      hours: 8
    });

  console.log('create response:', res.status, JSON.stringify(res.body));

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('_id');
  expect(res.body.format).toBe('hours');
});

// GET /api/deliverynote: lists notes
it('lists delivery notes', async () => {
  const { token, clientId, projectId } = await setup();

  await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'Test work',
      workDate: new Date().toISOString(),
      hours: 8,
    });

  const res = await request(app)
    .get('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

// GET /api/deliverynote/:id: returns one note
it('gets a delivery note by id', async () => {
  const { token, clientId, projectId } = await setup();

  const created = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'Inspection work',
      workDate: new Date().toISOString(),
      hours: 6
    });

  const noteId = created.body._id;

  const res = await request(app)
    .get(`/api/deliverynote/${noteId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('_id', noteId);
  expect(res.body.format).toBe('hours');
  expect(res.body.description).toBe('Inspection work');
});

// PATCH /api/deliverynote/:id/sign signs it, signing it twice returns 409
it('signs a delivery note', async () => {
  const { token, clientId, projectId } = await setup();

  const created = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'Signing test',
      workDate: new Date().toISOString(),
      hours: 4
    });

  const noteId = created.body._id;

  const res = await request(app)
    .patch(`/api/deliverynote/${noteId}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ signatureData: SIGNATURE_DATA });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('_id', noteId);
  expect(res.body.signed).toBe(true);
  expect(res.body.signatureData).toBe(SIGNATURE_DATA);
  expect(res.body.signedAt).toBeTruthy();
});

it('does not allow signing a delivery note twice', async () => {
  const { token, clientId, projectId } = await setup();

  const created = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'Double sign test',
      workDate: new Date().toISOString(),
      hours: 5,
    });

  const noteId = created.body._id;

  await request(app)
    .patch(`/api/deliverynote/${noteId}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ signatureData: SIGNATURE_DATA });

  const res = await request(app)
    .patch(`/api/deliverynote/${noteId}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ signatureData: SIGNATURE_DATA });

  // TODO
  expect(res.status).toBe(409);
  expect(res.body.error).toBe('Already signed');
});

// DELETE /api/deliverynote/:id: returns 403 when signed
it('does not allow deleting a signed delivery note', async () => {
  const { token, clientId, projectId } = await setup();

  const created = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'Signed deleted protection test',
      workDate: new Date().toISOString(),
      hours: 3,
    });

  const noteId = created.body._id;

  await request(app)
    .patch(`/api/deliverynote/${noteId}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ signatureData: SIGNATURE_DATA });

  const res = await request(app)
    .delete(`/api/deliverynote/${noteId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(403);
  expect(res.body.error).toBe('Cannot delete a signed delivery note');
});

// DELETE /api/deliverynote/:id: succeeds when unsigned
it('deletes an unsigned delivery note', async () => {
  const { token, clientId, projectId } = await setup();

  const created = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'Unsigned delete test',
      workDate: new Date().toISOString(),
      hours: 2,
    });

  const noteId = created.body._id;

  const res = await request(app)
    .delete(`/api/deliverynote/${noteId}`)
    .set('Authorization', `Bearer ${token}`)

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('message');
});

// GET /api/deliverynote/pdf/:id: returns application/pdf and 200
it('downloads delivery note PDF', async () => {
  const { token, clientId, projectId } = await setup();

  const created = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientId,
      projectId,
      format: 'hours',
      description: 'PDF test',
      workDate: new Date().toISOString(),
      hours: 8
    });

  const noteId = created.body._id;

  const res = await request(app)
    .get(`/api/deliverynote/pdf/${noteId}`)
    .set('Authorization', `Bearer ${token}`)

  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toBe('application/pdf');
});

it('returns 404 for non-existent delivery note', async () => {
  const { token } = await setup();
  const res = await request(app)
    .get('/api/deliverynote/000000000000000000000000')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(404);
});

it('returns 404 when signing a non-existent note', async () => {
  const { token } = await setup();
  const res = await request(app)
    .patch('/api/deliverynote/000000000000000000000000/sign')
    .set('Authorization', `Bearer ${token}`)
    .send({ signatureData: SIGNATURE_DATA });
  expect(res.status).toBe(404);
});

it('returns 400 when signing without signatureData', async () => {
  const { token, clientId, projectId } = await setup();

  const created = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({ clientId, projectId, format: 'hours', description: 'x', workDate: new Date().toISOString(), hours: 1 });

  const res = await request(app)
    .patch(`/api/deliverynote/${created.body._id}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
  expect(res.status).toBe(400);
});

it('returns 404 when fetching PDF for non-existent note', async () => {
  const { token } = await setup();
  const res = await request(app)
    .get('/api/deliverynote/pdf/000000000000000000000000')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(404);
});

it('returns 404 when deleting a non-existent note', async () => {
  const { token } = await setup();
  const res = await request(app)
    .delete('/api/deliverynote/000000000000000000000000')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(404);
});

it('returns 400 when creating a note with invalid body', async () => {
  const { token } = await setup();
  const res = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({ format: 'invalid-format' }); // missing required fields
  expect(res.status).toBe(400);
});
