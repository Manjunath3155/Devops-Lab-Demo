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

// Sync builds from Jenkins API
router.post('/sync-from-jenkins', authenticateToken, async (req, res) => {
  const JENKINS_URL = 'http://localhost:8080';
  const JOB_NAME = 'DevFlow-Pipeline';
  const AUTH = Buffer.from('manjunathpatil:Manjunath1234').toString('base64');

  try {
    // Fetch job info from Jenkins (includes build history)
    const response = await fetch(`${JENKINS_URL}/job/${JOB_NAME}/api/json`, {
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        error: `Jenkins returned ${response.status}. Make sure Jenkins is running at ${JENKINS_URL}`,
      });
    }

    const jobData = await response.json();
    const jenkinsBuilds = jobData.builds || [];

    if (jenkinsBuilds.length === 0) {
      return res.json({ builds: [], message: 'No builds found in Jenkins' });
    }

    // Fetch details for each Jenkins build
    const syncedBuilds = [];
    for (const jb of jenkinsBuilds) {
      try {
        const detailResp = await fetch(`${jb.url}api/json`, {
          headers: { 'Authorization': `Basic ${AUTH}`, 'Accept': 'application/json' },
        });
        if (!detailResp.ok) continue;

        const detail = await detailResp.json();

        // Map Jenkins build status to ours
        let status = 'pending';
        if (detail.result === 'SUCCESS') status = 'success';
        else if (detail.result === 'FAILURE') status = 'failed';
        else if (detail.building) status = 'running';
        else if (detail.result === 'ABORTED') status = 'cancelled';

        // Check if build already exists (by build_number)
        const existing = db.prepare('SELECT id FROM builds WHERE build_number = ?').get(jb.number);

        const buildData = {
          build_number: jb.number,
          branch: detail.actions?.find(a => a.parameters)?.parameters?.find(p => p.name === 'branch')?.value || 'main',
          status,
          commit_sha: '',
          commit_message: '',
          started_at: new Date(detail.timestamp).toISOString(),
          finished_at: detail.building ? null : new Date(detail.timestamp + (detail.duration || 0)).toISOString(),
          logs: `[${new Date(detail.timestamp).toISOString()}] Jenkins build #${jb.number}\n` +
                `[${new Date(detail.timestamp).toISOString()}] Pipeline: ${JOB_NAME}\n` +
                `[${new Date(detail.timestamp + 1000).toISOString()}] Stage: Checkout ✓\n` +
                `[${new Date(detail.timestamp + 2000).toISOString()}] Stage: Build ✓\n` +
                `[${new Date(detail.timestamp + 3000).toISOString()}] Result: ${detail.result || 'RUNNING'}\n` +
                `[${new Date(detail.timestamp + 4000).toISOString()}] Duration: ${(detail.duration / 1000).toFixed(1)}s`,
          triggered_by: req.user.id,
        };

        if (existing) {
          // Update existing build
          db.prepare(`
            UPDATE builds SET branch=?, status=?, started_at=?, finished_at=?, logs=?
            WHERE id = ?
          `).run(buildData.branch, buildData.status, buildData.started_at, buildData.finished_at, buildData.logs, existing.id);

          const updated = db.prepare('SELECT * FROM builds WHERE id = ?').get(existing.id);
          syncedBuilds.push(updated);
        } else {
          // Insert new build
          const result = db.prepare(`
            INSERT INTO builds (build_number, branch, status, commit_sha, commit_message, triggered_by, started_at, finished_at, logs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            buildData.build_number, buildData.branch, buildData.status, buildData.commit_sha,
            buildData.commit_message, buildData.triggered_by, buildData.started_at,
            buildData.finished_at, buildData.logs
          );

          const inserted = db.prepare('SELECT * FROM builds WHERE id = ?').get(result.lastInsertRowid);
          syncedBuilds.push(inserted);
        }
      } catch (err) {
        console.error(`Failed to fetch Jenkins build #${jb.number}:`, err.message);
      }
    }

    // Broadcast updates via WebSocket
    if (global.broadcastBuildUpdate) {
      syncedBuilds.forEach(b => global.broadcastBuildUpdate(b));
    }

    res.json({
      builds: syncedBuilds,
      message: `Synced ${syncedBuilds.length} builds from Jenkins`,
    });
  } catch (err) {
    console.error('Jenkins sync error:', err.message);
    res.status(502).json({
      error: `Failed to connect to Jenkins at ${JENKINS_URL}. Make sure Jenkins is running.`,
    });
  }
});

module.exports = router;
