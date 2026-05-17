const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all builds
router.get('/', authenticateToken, (req, res) => {
  const { status, branch } = req.query;
  let query = `
    SELECT b.*, u.username as triggered_username
    FROM builds b
    LEFT JOIN users u ON b.triggered_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }
  if (branch) {
    query += ' AND b.branch = ?';
    params.push(branch);
  }

  query += ' ORDER BY b.created_at DESC LIMIT 50';

  try {
    const builds = db.prepare(query).all(...params);
    res.json({ builds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch builds' });
  }
});

// Get single build
router.get('/:id', authenticateToken, (req, res) => {
  const build = db.prepare(`
    SELECT b.*, u.username as triggered_username
    FROM builds b
    LEFT JOIN users u ON b.triggered_by = u.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }

  const deployments = db.prepare('SELECT * FROM deployments WHERE build_id = ?').all(build.id);
  res.json({ build, deployments });
});

// Trigger a new build
router.post('/', authenticateToken, (req, res) => {
  const { branch, commit_sha, commit_message } = req.body;

  if (!branch) {
    return res.status(400).json({ error: 'Branch is required' });
  }

  try {
    // Get next build number
    const lastBuild = db.prepare('SELECT MAX(build_number) as max_num FROM builds').get();
    const buildNumber = (lastBuild.max_num || 0) + 1;

    const stmt = db.prepare(
      'INSERT INTO builds (build_number, branch, commit_sha, commit_message, status, triggered_by, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      buildNumber,
      branch,
      commit_sha || '',
      commit_message || '',
      'running',
      req.user.id,
      new Date().toISOString()
    );

    const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(result.lastInsertRowid);

    // Simulate build progress (in production, this would be async)
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      db.prepare(`
        UPDATE builds SET status = ?, finished_at = ?, logs = ? WHERE id = ?
      `).run(
        success ? 'success' : 'failed',
        new Date().toISOString(),
        success
          ? `[${new Date().toISOString()}] Build #${buildNumber} started\n[${new Date().toISOString()}] Cloning repository...\n[${new Date().toISOString()}] Checking out ${branch}...\n[${new Date().toISOString()}] Installing dependencies...\n[${new Date().toISOString()}] Running tests...\n[${new Date().toISOString()}] All tests passed ✓\n[${new Date().toISOString()}] Building project...\n[${new Date().toISOString()}] Build completed successfully ✓`
          : `[${new Date().toISOString()}] Build #${buildNumber} started\n[${new Date().toISOString()}] Cloning repository...\n[${new Date().toISOString()}] Checking out ${branch}...\n[${new Date().toISOString()}] Installing dependencies...\n[${new Date().toISOString()}] Running tests...\n[${new Date().toISOString()}] Test failed: AssertionError in pipeline.test.js\n[${new Date().toISOString()}] Build failed ✗`,
        build.id
      );

      // Broadcast via WebSocket (will be connected in server.js)
      const updatedBuild = db.prepare('SELECT * FROM builds WHERE id = ?').get(build.id);
      if (global.broadcastBuildUpdate) {
        global.broadcastBuildUpdate(updatedBuild);
      }
    }, 3000);

    res.status(201).json({ build, message: 'Build triggered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger build' });
  }
});

// Get latest build status
router.get('/latest/:branch', authenticateToken, (req, res) => {
  const build = db.prepare(`
    SELECT * FROM builds WHERE branch = ? ORDER BY created_at DESC LIMIT 1
  `).get(req.params.branch);

  res.json({ build: build || null });
});

// Get build statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM builds').get().count,
      success: db.prepare("SELECT COUNT(*) as count FROM builds WHERE status = 'success'").get().count,
      failed: db.prepare("SELECT COUNT(*) as count FROM builds WHERE status = 'failed'").get().count,
      running: db.prepare("SELECT COUNT(*) as count FROM builds WHERE status = 'running'").get().count,
      totalTasks: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
      completedTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get().count,
    };
    stats.successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
