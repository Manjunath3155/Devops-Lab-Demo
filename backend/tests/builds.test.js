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

describe('Build Routes', () => {
  describe('GET /api/builds', () => {
    it('should return empty list initially', async () => {
      const res = await request(app, 'GET', '/api/builds', { token });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.builds, []);
    });

    it('should require authentication', async () => {
      const res = await request(app, 'GET', '/api/builds');
      assert.equal(res.status, 401);
    });
  });

  describe('POST /api/builds', () => {
    it('should trigger a build successfully', async () => {
      const res = await request(app, 'POST', '/api/builds', {
        token,
        body: { branch: 'main', commit_sha: 'abc123', commit_message: 'Test build' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.build.branch, 'main');
      assert.equal(res.body.build.commit_sha, 'abc123');
      assert.equal(res.body.build.commit_message, 'Test build');
      assert.equal(res.body.build.build_number, 1);
      assert.equal(res.body.build.status, 'running');
      assert.ok(res.body.build.id);
      assert.equal(res.body.message, 'Build triggered successfully');
    });

    it('should auto-increment build number', async () => {
      await request(app, 'POST', '/api/builds', { token, body: { branch: 'develop' } });
      const res = await request(app, 'POST', '/api/builds', { token, body: { branch: 'develop' } });
      assert.equal(res.status, 201);
      assert.equal(res.body.build.build_number, 3);
    });

    it('should reject build without branch', async () => {
      const res = await request(app, 'POST', '/api/builds', { token, body: {} });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Branch is required');
    });

    it('should require authentication', async () => {
      const res = await request(app, 'POST', '/api/builds', { body: { branch: 'main' } });
      assert.equal(res.status, 401);
    });
  });

  describe('GET /api/builds', () => {
    it('should filter by status', async () => {
      await request(app, 'POST', '/api/builds', { token, body: { branch: 'main' } });
      const res = await request(app, 'GET', '/api/builds?status=running', { token });
      assert.equal(res.status, 200);
      assert.ok(res.body.builds.length > 0);
      res.body.builds.forEach((b) => assert.equal(b.status, 'running'));
    });
  });

  describe('GET /api/builds/:id', () => {
    it('should get a build by id', async () => {
      const createRes = await request(app, 'POST', '/api/builds', { token, body: { branch: 'main' } });
      const buildId = createRes.body.build.id;

      const res = await request(app, 'GET', `/api/builds/${buildId}`, { token });
      assert.equal(res.status, 200);
      assert.equal(res.body.build.id, buildId);
      assert.ok(res.body.deployments !== undefined);
    });

    it('should return 404 for non-existent build', async () => {
      const res = await request(app, 'GET', '/api/builds/99999', { token });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Build not found');
    });
  });

  describe('GET /api/builds/stats/summary', () => {
    it('should return zero stats when no builds exist', async () => {
      // Use a fresh app with no builds
      const freshEnv = createTestApp();
      const freshToken = seedUser(freshEnv.db).token;
      const res = await request(freshEnv.app, 'GET', '/api/builds/stats/summary', { token: freshToken });
      assert.equal(res.status, 200);
      assert.equal(res.body.stats.total, 0);
      assert.equal(res.body.stats.success, 0);
      assert.equal(res.body.stats.failed, 0);
      assert.equal(res.body.stats.running, 0);
      assert.equal(res.body.stats.successRate, 0);
    });

    it('should return stats with builds and tasks', async () => {
      await request(app, 'POST', '/api/builds', { token, body: { branch: 'main' } });
      await request(app, 'POST', '/api/tasks', { token, body: { title: 'Stats task', status: 'done' } });

      const res = await request(app, 'GET', '/api/builds/stats/summary', { token });
      assert.equal(res.status, 200);
      assert.ok(res.body.stats.total > 0);
      assert.ok(res.body.stats.successRate >= 0);
      assert.ok(res.body.stats.totalTasks > 0);
    });
  });

  describe('GET /api/builds/latest/:branch', () => {
    it('should return null when no builds exist for branch', async () => {
      const res = await request(app, 'GET', '/api/builds/latest/feature-x', { token });
      assert.equal(res.status, 200);
      assert.equal(res.body.build, null);
    });

    it('should return the latest build for a branch', async () => {
      await request(app, 'POST', '/api/builds', { token, body: { branch: 'release' } });
      const res = await request(app, 'GET', '/api/builds/latest/release', { token });
      assert.equal(res.status, 200);
      assert.ok(res.body.build);
      assert.equal(res.body.build.branch, 'release');
    });
  });
});
