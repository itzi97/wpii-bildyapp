// tests/project.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

// Helper: registers a user, completes their profile, creates a company, and
// creates a client. Returns the token and clientId for use in project tests.
async function setup() {
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
      cif: 'B12345678',
      address: {
        street: 'Main St', number: '1',
        postal: '28001', city: 'Madrid', province: 'Madrid',
      },
    });

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Client One',
      cif: 'B11111111',
      email: 'client@test.com',
      phone: '123456789',
      address: {
        street: 'Client St', number: '10',
        postal: '28002', city: 'Madrid', province: 'Madrid',
      },
    });

  // Use the normalised response shape
  const clientId = clientRes.body.data._id;
  return { token, clientId };
}

// Reusable project payload factory, takes a clientId to keep tests DRY
const projectPayload = (clientId) => ({
  name: 'Test Project',
  projectCode: 'PROJ-001',
  client: clientId,
  address: {
    street: 'Project St', number: '5',
    postal: '28003', city: 'Madrid', province: 'Madrid',
  },
});

describe('Project endpoints', () => {

  it('creates a project', async () => {
    const { token, clientId } = await setup();

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Project');
    expect(res.body.data.projectCode).toBe('PROJ-001');
  });

  it('rejects duplicate project code in same company', async () => {
    const { token, clientId } = await setup();

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    expect(res.status).toBe(409);
  });

  it('returns 404 when client does not exist', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload('676767676767676767676767'));

    expect(res.status).toBe(404);
  });

  it('lists projects', async () => {
    const { token, clientId } = await setup();

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    const res = await request(app)
      .get('/api/project')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.totalItems).toBe(1);
  });

  it('gets a project by id', async () => {
    const { token, clientId } = await setup();

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    const res = await request(app)
      .get(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(created.body.data._id);
  });

  it('returns 404 for unknown project id', async () => {
    const { token } = await setup();

    const res = await request(app)
      .get('/api/project/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('updates a project', async () => {
    const { token, clientId } = await setup();

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    const res = await request(app)
      .put(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Project');
  });

  it('soft deletes a project', async () => {
    const { token, clientId } = await setup();

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    const res = await request(app)
      .delete(`/api/project/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Project archived');

    // Soft-deleted project must no longer appear in the active list
    const check = await request(app)
      .get(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(check.status).toBe(404);
  });

  it('hard deletes a project', async () => {
    const { token, clientId } = await setup();

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    const res = await request(app)
      .delete(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Project deleted');
  });

  it('lists archived projects', async () => {
    const { token, clientId } = await setup();

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    await request(app)
      .delete(`/api/project/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('restores an archived project', async () => {
    const { token, clientId } = await setup();

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    await request(app)
      .delete(`/api/project/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/project/${created.body.data._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(false);
  });

  it('returns 404 for non-existent project', async () => {
    const { token } = await setup();

    const res = await request(app)
      .get('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when updating non-existent project', async () => {
    const { token } = await setup();

    const res = await request(app)
      .put('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });

  it('returns 404 when updating project with a foreign client', async () => {
    const { token, clientId } = await setup();

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    const res = await request(app)
      .put(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ client: '676767676767676767676767' });

    expect(res.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent project', async () => {
    const { token } = await setup();

    const res = await request(app)
      .delete('/api/project/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when restoring a non-existent archived project', async () => {
    const { token } = await setup();

    const res = await request(app)
      .patch('/api/project/676767676767676767676767/restore')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
