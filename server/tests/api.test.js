import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';

let mongo;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.model('User').syncIndexes();
});

/** Signs up a user and returns a supertest agent that keeps the auth cookie. */
async function signedInAgent(email = 'priya@example.com') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ name: 'Priya', email, password: 'password123' });
  expect(res.status).toBe(201);
  return agent;
}

describe('auth', () => {
  it('signs up, sets an httpOnly cookie and never returns the password hash', async () => {
    const res = await request(app).post('/api/auth/signup').send({ name: 'Priya', email: 'Priya@Example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), name: 'Priya', email: 'priya@example.com', createdAt: expect.any(String) });
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.headers['set-cookie'][0]).toMatch(/^token=.+HttpOnly/i);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('rejects a duplicate email with 409 and a field message', async () => {
    await signedInAgent();
    const res = await request(app).post('/api/auth/signup').send({ name: 'P', email: 'PRIYA@example.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.fields.email).toMatch(/already registered/);
  });

  it('validates signup fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({ name: '', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['email', 'name', 'password']);
  });

  it('logs in with the right password only, with one message for both failures', async () => {
    await signedInAgent();
    const ok = await request(app).post('/api/auth/login').send({ email: 'priya@example.com', password: 'password123' });
    expect(ok.status).toBe(200);
    const wrong = await request(app).post('/api/auth/login').send({ email: 'priya@example.com', password: 'wrongpass1' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'password123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('accepts a Bearer token as well as the cookie', async () => {
    const signup = await request(app).post('/api/auth/signup').send({ name: 'P', email: 'p@example.com', password: 'password123' });
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${signup.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('p@example.com');
  });

  it('protects routes and logs out', async () => {
    expect((await request(app).get('/api/projects')).status).toBe(401);
    expect((await request(app).get('/api/projects').set('Authorization', 'Bearer not-a-jwt')).status).toBe(401);
    const agent = await signedInAgent();
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    expect((await agent.post('/api/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('projects', () => {
  it('creates, lists with task counts, searches, updates and deletes with its tasks', async () => {
    const agent = await signedInAgent();
    const created = await agent.post('/api/projects').send({ title: 'Website redesign', description: 'Spring launch' });
    expect(created.status).toBe(201);
    const id = created.body.project.id;
    await agent.post('/api/projects').send({ title: 'Office move' });

    await agent.post(`/api/projects/${id}/tasks`).send({ title: 'A', status: 'done' });
    await agent.post(`/api/projects/${id}/tasks`).send({ title: 'B', status: 'todo', dueDate: '2020-01-01' });

    const list = await agent.get('/api/projects');
    expect(list.body.projects).toHaveLength(2);
    const counts = list.body.projects.find((p) => p.id === id).taskCounts;
    expect(counts).toEqual({ todo: 1, inProgress: 0, done: 1, overdue: 1, total: 2 });

    const search = await agent.get('/api/projects?q=WEB');
    expect(search.body.projects.map((p) => p.title)).toEqual(['Website redesign']);

    const updated = await agent.patch(`/api/projects/${id}`).send({ title: 'Website v2' });
    expect(updated.body.project.title).toBe('Website v2');
    expect(updated.body.project.description).toBe('Spring launch');

    expect((await agent.delete(`/api/projects/${id}`)).status).toBe(204);
    expect((await agent.get(`/api/projects/${id}`)).status).toBe(404);
    expect(await mongoose.model('Task').countDocuments({ project: id })).toBe(0);
  });

  it('requires a title', async () => {
    const agent = await signedInAgent();
    const res = await agent.post('/api/projects').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.title).toBe('Title is required');
  });

  it("never shows or changes another user's projects or tasks", async () => {
    const owner = await signedInAgent('owner@example.com');
    const intruder = await signedInAgent('intruder@example.com');
    const { id } = (await owner.post('/api/projects').send({ title: 'Secret' })).body.project;
    const task = (await owner.post(`/api/projects/${id}/tasks`).send({ title: 'Secret task' })).body.task;

    expect((await intruder.get('/api/projects')).body.projects).toEqual([]);
    expect((await intruder.get(`/api/projects/${id}`)).status).toBe(404);
    expect((await intruder.patch(`/api/projects/${id}`).send({ title: 'x' })).status).toBe(404);
    expect((await intruder.delete(`/api/projects/${id}`)).status).toBe(404);
    expect((await intruder.get(`/api/projects/${id}/tasks`)).status).toBe(404);
    expect((await intruder.post(`/api/projects/${id}/tasks`).send({ title: 'x' })).status).toBe(404);
    expect((await intruder.patch(`/api/tasks/${task.id}`).send({ status: 'done' })).status).toBe(404);
    expect((await intruder.delete(`/api/tasks/${task.id}`)).status).toBe(404);
    expect((await owner.get(`/api/tasks/${task.id}`)).body.task.status).toBe('todo');
  });

  it('answers a malformed id with 404, not a server error', async () => {
    const agent = await signedInAgent();
    expect((await agent.get('/api/projects/not-an-id')).status).toBe(404);
    expect((await agent.patch('/api/tasks/123').send({ title: 'x' })).status).toBe(404);
  });
});

describe('tasks', () => {
  async function projectWithTasks() {
    const agent = await signedInAgent();
    const { id } = (await agent.post('/api/projects').send({ title: 'P' })).body.project;
    const add = (body) => agent.post(`/api/projects/${id}/tasks`).send(body);
    await add({ title: 'no date', status: 'todo' });
    await add({ title: 'late', status: 'in-progress', dueDate: '2026-11-20' });
    await add({ title: 'early', status: 'todo', dueDate: '2026-11-01' });
    await add({ title: 'middle', status: 'done', dueDate: '2026-11-10' });
    return { agent, id };
  }
  const titles = (res) => res.body.tasks.map((t) => t.title);

  it('creates a task with defaults and validates status and date', async () => {
    const agent = await signedInAgent();
    const { id } = (await agent.post('/api/projects').send({ title: 'P' })).body.project;
    const res = await agent.post(`/api/projects/${id}/tasks`).send({ title: 'Write copy' });
    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({ title: 'Write copy', description: '', status: 'todo', dueDate: null, project: id });

    const bad = await agent.post(`/api/projects/${id}/tasks`).send({ title: 'x', status: 'blocked', dueDate: 'tomorrow' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields).sort()).toEqual(['dueDate', 'status']);
  });

  it('sorts by due date both ways with undated tasks last, and by newest', async () => {
    const { agent, id } = await projectWithTasks();
    expect(titles(await agent.get(`/api/projects/${id}/tasks`))).toEqual(['early', 'middle', 'late', 'no date']);
    expect(titles(await agent.get(`/api/projects/${id}/tasks?sort=due_desc`))).toEqual(['late', 'middle', 'early', 'no date']);
    expect(titles(await agent.get(`/api/projects/${id}/tasks?sort=newest`))).toEqual(['middle', 'early', 'late', 'no date']);
  });

  it('filters by status and rejects an unknown status', async () => {
    const { agent, id } = await projectWithTasks();
    expect(titles(await agent.get(`/api/projects/${id}/tasks?status=todo`))).toEqual(['early', 'no date']);
    expect(titles(await agent.get(`/api/projects/${id}/tasks?status=done`))).toEqual(['middle']);
    expect((await agent.get(`/api/projects/${id}/tasks?status=nope`)).status).toBe(400);
  });

  it('edits any field, clears a due date and deletes', async () => {
    const { agent, id } = await projectWithTasks();
    const [task] = (await agent.get(`/api/projects/${id}/tasks?status=in-progress`)).body.tasks;
    const res = await agent.patch(`/api/tasks/${task.id}`).send({ status: 'done', title: 'late (shipped)', dueDate: null });
    expect(res.body.task).toMatchObject({ status: 'done', title: 'late (shipped)', dueDate: null });
    expect((await agent.patch(`/api/tasks/${task.id}`).send({})).status).toBe(400);
    expect((await agent.delete(`/api/tasks/${task.id}`)).status).toBe(204);
    expect((await agent.get(`/api/tasks/${task.id}`)).status).toBe(404);
  });
});
