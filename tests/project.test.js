// tests/project.test.js
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, closeDB, clearDB } from './helpers.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

// Helper: registers a user, completes their profile, creates a company and a
// client. Returns the token and clientId for use in project tests.
async function setup() {
  const suffix = Date.now();
  const email = `test${suffix}@bildyapp.com`;

  const registerRes = await request(app)
    .post('/api/user/register')
    .send({ email, password: 'TestPassword123' });

  const token = registerRes.body.accessToken;
  expect(registerRes.status).toBe(201);
  expect(token).toBeDefined();

  await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test', lastName: 'User', nif: '12345678A' });

  const companyRes = await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({
      isFreelance: false,
      name: 'Test Company',
      cif: `B${suffix}`.slice(0, 9), // unique CIF per run, avoids duplicate key collisions
      address: { street: 'Main St', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
    });

  expect(companyRes.status).toBe(200); // assert company was created

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Project Client', cif: 'B11111111', email: 'client@test.com' });

  expect(clientRes.status).toBe(201); // assert client was created
  return { token, clientId: clientRes.body.data._id };
}

// Reusable project payload, individual tests override fields as needed
const projectPayload = (clientId) => ({
  name: 'Project One',
  projectCode: 'PRJ001',
  client: clientId,
  email: 'project@test.com',
  notes: 'Initial notes',
});

describe('Project endpoints', () => {

  it('creates a project', async () => {
    const { token, clientId } = await setup();

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectPayload(clientId));

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.name).toBe('Project One');
    expect(res.body.data.projectCode).toBe('PRJ001');
  });

  it('returns 404 when client does not exist', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost Project', projectCode: 'GHO001', client: '676767676767676767676767' });

    expect(res.status).toBe(404);
  });

  it('rejects duplicate project code in the same company', async () => {
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
    expect(res.body.data.name).toBe('Project One');
  });

  it('returns 404 for a non-existent project', async () => {
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
      .send({ name: 'Project Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Project Updated');
    expect(res.body.data.projectCode).toBe('PRJ001');
  });

  it('rejects updating a project to a duplicate code', async () => {
    const { token, clientId } = await setup();

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A', projectCode: 'AAA001', client: clientId });

    const second = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'B', projectCode: 'BBB002', client: clientId });

    const res = await request(app)
      .put(`/api/project/${second.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ projectCode: 'AAA001' });

    expect(res.status).toBe(409);
  });

  it('lists projects with pagination', async () => {
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
    expect(res.body.data.length).toBe(1);
    expect(res.body.totalItems).toBe(1);
    expect(res.body.currentPage).toBe(1);
  });

  it('paginates projects with ?page and ?limit', async () => {
    const { token, clientId } = await setup();

    for (const code of ['P001', 'P002']) {
      await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: code, projectCode: code, client: clientId });
    }

    const res = await request(app)
      .get('/api/project?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
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
    const getRes = await request(app)
      .get(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
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
    expect(Array.isArray(res.body.data)).toBe(true);
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

    // After restoring, the project must be accessible again via GET
    const getRes = await request(app)
      .get(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
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

  it('returns 404 when deleting a non-existent project', async () => {
    const { token } = await setup();

    const res = await request(app)
      .delete('/api/project/676767676767676767676767')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when restoring a non-archived project', async () => {
    const { token } = await setup();

    const res = await request(app)
      .patch('/api/project/676767676767676767676767/restore')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/project');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/project')
      .set('Authorization', 'Bearer tokeninvalido');
    expect(res.status).toBe(401);
  });

  it('rejects a project with missing required fields', async () => {
    const { token } = await setup();

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No code' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a project belonging to a different company', async () => {
    const { token } = await setup();
    const res = await request(app)
      .get('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
