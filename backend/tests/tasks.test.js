const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { createTestApp, seedUser, request } = require('./helpers');

let app, db, token;

before(() => {
  const testEnv = createTestApp();
  app = testEnv.app;
  db = testEnv.db;
  token = seedUser(db).token;
});

describe('Task Routes', () => {
  describe('GET /api/tasks', () => {
    it('should return empty list initially', async () => {
      const res = await request(app, 'GET', '/api/tasks', { token });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.tasks, []);
    });

    it('should filter tasks by priority', async () => {
      // Create tasks with different priorities
      await request(app, 'POST', '/api/tasks', { token, body: { title: 'High priority task', priority: 'high' } });
      await request(app, 'POST', '/api/tasks', { token, body: { title: 'Low priority task', priority: 'low' } });

      const res = await request(app, 'GET', '/api/tasks?priority=high', { token });
      assert.equal(res.status, 200);
      assert.equal(res.body.tasks.length, 1);
      assert.equal(res.body.tasks[0].title, 'High priority task');
    });

    it('should require authentication', async () => {
      const res = await request(app, 'GET', '/api/tasks');
      assert.equal(res.status, 401);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a task successfully', async () => {
      const res = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Test task', description: 'A test description', priority: 'high' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.task.title, 'Test task');
      assert.equal(res.body.task.description, 'A test description');
      assert.equal(res.body.task.priority, 'high');
      assert.equal(res.body.task.status, 'todo');
      assert.ok(res.body.task.id);
    });

    it('should create task with default priority', async () => {
      const res = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Default priority task' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.task.priority, 'medium');
    });

    it('should reject task without title', async () => {
      const res = await request(app, 'POST', '/api/tasks', {
        token,
        body: { description: 'No title here' },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Title is required');
    });

    it('should require authentication', async () => {
      const res = await request(app, 'POST', '/api/tasks', {
        body: { title: 'Unauthorized task' },
      });
      assert.equal(res.status, 401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a task by id', async () => {
      const createRes = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Get task test' },
      });
      const taskId = createRes.body.task.id;

      const res = await request(app, 'GET', `/api/tasks/${taskId}`, { token });
      assert.equal(res.status, 200);
      assert.equal(res.body.task.title, 'Get task test');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app, 'GET', '/api/tasks/99999', { token });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Task not found');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task fields', async () => {
      const createRes = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Original title', priority: 'low' },
      });
      const taskId = createRes.body.task.id;

      const res = await request(app, 'PUT', `/api/tasks/${taskId}`, {
        token,
        body: { title: 'Updated title', priority: 'critical', status: 'in_progress' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.task.title, 'Updated title');
      assert.equal(res.body.task.priority, 'critical');
      assert.equal(res.body.task.status, 'in_progress');
    });

    it('should update only provided fields', async () => {
      const createRes = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Partial update test', description: 'Original desc', priority: 'high' },
      });
      const taskId = createRes.body.task.id;

      const res = await request(app, 'PUT', `/api/tasks/${taskId}`, {
        token,
        body: { description: 'Updated desc' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.task.title, 'Partial update test');
      assert.equal(res.body.task.description, 'Updated desc');
      assert.equal(res.body.task.priority, 'high');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app, 'PUT', '/api/tasks/99999', {
        token,
        body: { title: 'Nope' },
      });
      assert.equal(res.status, 404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const createRes = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Task to delete' },
      });
      const taskId = createRes.body.task.id;

      const deleteRes = await request(app, 'DELETE', `/api/tasks/${taskId}`, { token });
      assert.equal(deleteRes.status, 200);
      assert.equal(deleteRes.body.message, 'Task deleted successfully');

      const getRes = await request(app, 'GET', `/api/tasks/${taskId}`, { token });
      assert.equal(getRes.status, 404);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app, 'DELETE', '/api/tasks/99999', { token });
      assert.equal(res.status, 404);
    });
  });

  describe('Task → pipeline integration', () => {
    it('should trigger a build when task moves to done', async () => {
      const createRes = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Deploy me', status: 'todo' },
      });
      const taskId = createRes.body.task.id;

      const res = await request(app, 'PUT', `/api/tasks/${taskId}`, {
        token,
        body: { status: 'done' },
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.pipeline);
      assert.equal(res.body.pipeline.branch, 'main');
      assert.equal(res.body.pipeline.build.status, 'running');
      assert.match(res.body.pipeline.build.commit_message, /Deploy me/);
    });

    it('should trigger CI build when task moves to in_progress', async () => {
      const createRes = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Start work', status: 'todo' },
      });
      const taskId = createRes.body.task.id;

      const res = await request(app, 'PUT', `/api/tasks/${taskId}`, {
        token,
        body: { status: 'in_progress' },
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.pipeline);
      assert.equal(res.body.pipeline.branch, 'develop');
    });

    it('should not trigger build when staying in todo', async () => {
      const createRes = await request(app, 'POST', '/api/tasks', {
        token,
        body: { title: 'Just a note', status: 'todo' },
      });
      assert.equal(createRes.body.pipeline, undefined);
    });
  });
});
