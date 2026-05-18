const express = require('express');
const http = require('http');
const path = require('path');

const TEST_SECRET = 'test-secret-key-for-devflow';

/**
 * Creates a fresh Express app using the real route modules with an in-memory database.
 * Clears module cache to ensure fresh database is used.
 */
function createTestApp() {
  // Set environment before requiring modules
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = TEST_SECRET;

  // Clear module cache for database and route modules
  delete require.cache[require.resolve(path.join(__dirname, '../database'))];
  delete require.cache[require.resolve(path.join(__dirname, '../middleware/auth'))];
  delete require.cache[require.resolve(path.join(__dirname, '../routes/auth'))];
  delete require.cache[require.resolve(path.join(__dirname, '../routes/tasks'))];
  delete require.cache[require.resolve(path.join(__dirname, '../routes/builds'))];

  // Create the app with the real route modules
  const app = express();
  app.use(express.json());

  // Mount the real routes
  app.use('/api/auth', require(path.join(__dirname, '../routes/auth')));
  app.use('/api/tasks', require(path.join(__dirname, '../routes/tasks')));
  app.use('/api/builds', require(path.join(__dirname, '../routes/builds')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', version: '1.0.0', timestamp: new Date().toISOString() });
  });

  // Get the fresh database instance for seeding
  const db = require(path.join(__dirname, '../database'));

  return { app, db };
}

/**
 * Seed a test user and return their auth token.
 * Uses the injected db (from createTestApp) to add user data.
 */
function seedUser(db, overrides = {}) {
  const bcrypt = require('bcryptjs');
  const username = overrides.username || 'testuser';
  const email = overrides.email || 'test@example.com';
  const password = bcrypt.hashSync(overrides.password || 'password123', 10);

  db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, password);
  const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE username = ?').get(username);

  // Generate token to match what the real auth middleware would create
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    TEST_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
}

/**
 * Helper to make HTTP requests to the app.
 * Each request creates a temporary server on a random port.
 */
function request(app, method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const body = options.body ? JSON.stringify(options.body) : undefined;

      const clientReq = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': body ? Buffer.byteLength(body) : 0,
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            ...options.headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            server.close(() => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch {
                resolve({ status: res.statusCode, body: data });
              }
            });
          });
        }
      );

      clientReq.on('error', (err) => {
        server.close(() => reject(err));
      });

      if (body) clientReq.write(body);
      clientReq.end();
    });

    server.on('error', reject);
  });
}

module.exports = { createTestApp, seedUser, request };
