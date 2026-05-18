const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createTestApp, seedUser, request } = require('./helpers');

let app, db;

before(() => {
  const testEnv = createTestApp();
  app = testEnv.app;
  db = testEnv.db;
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app, 'POST', '/api/auth/register', {
        body: { username: 'newuser', email: 'new@example.com', password: 'password123' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.user.username, 'newuser');
      assert.equal(res.body.user.email, 'new@example.com');
      assert.ok(res.body.token);
      assert.equal(typeof res.body.token, 'string');
      assert(!res.body.user.password); // password should not be returned
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app, 'POST', '/api/auth/register', {
        body: { username: 'user1' },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'All fields are required');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app, 'POST', '/api/auth/register', {
        body: { username: 'user2', email: 'user2@example.com', password: '12345' },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Password must be at least 6 characters');
    });

    it('should reject duplicate username', async () => {
      await request(app, 'POST', '/api/auth/register', {
        body: { username: 'dupe', email: 'dupe1@example.com', password: 'password123' },
      });
      const res = await request(app, 'POST', '/api/auth/register', {
        body: { username: 'dupe', email: 'dupe2@example.com', password: 'password123' },
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.error, 'Username or email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const { user } = seedUser(db, { username: 'loginuser', email: 'login@example.com', password: 'password123' });
      const res = await request(app, 'POST', '/api/auth/login', {
        body: { username: 'loginuser', password: 'password123' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.username, 'loginuser');
      assert.ok(res.body.token);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app, 'POST', '/api/auth/login', {
        body: { username: 'loginuser', password: 'wrongpassword' },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      const res = await request(app, 'POST', '/api/auth/login', {
        body: { username: 'nonexistent', password: 'password123' },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Invalid credentials');
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app, 'POST', '/api/auth/login', {
        body: { username: 'testuser' },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Username and password are required');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const { token } = seedUser(db, { username: 'meuser', email: 'me@example.com', password: 'password123' });
      const res = await request(app, 'GET', '/api/auth/me', { token });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.username, 'meuser');
    });

    it('should reject without token', async () => {
      const res = await request(app, 'GET', '/api/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('should reject with invalid token', async () => {
      const res = await request(app, 'GET', '/api/auth/me', {
        headers: { Authorization: 'Bearer invalid-token-here' },
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Invalid or expired token');
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app, 'GET', '/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'healthy');
      assert.equal(res.body.version, '1.0.0');
    });
  });
});
