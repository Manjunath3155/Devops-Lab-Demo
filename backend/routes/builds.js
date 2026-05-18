const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { triggerManualBuild } = require('../services/buildTrigger');

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

// Trigger a new build (manual from Builds page)
router.post('/', authenticateToken, (req, res) => {
  const { branch, commit_sha, commit_message } = req.body;

  if (!branch) {
    return res.status(400).json({ error: 'Branch is required' });
  }

  try {
    const { build } = triggerManualBuild(req.user.id, { branch, commit_sha, commit_message });
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

function branchFromJenkinsBuild(detail) {
  for (const action of detail.actions || []) {
    const branches = action.lastBuiltRevision?.branch;
    if (branches?.length) {
      const name = branches[0].name || '';
      return name.replace(/^refs\/heads\//, '').replace(/^origin\//, '') || 'main';
    }
  }
  const params = detail.actions?.find((a) => a.parameters)?.parameters || [];
  const branchParam = params.find((p) => /branch/i.test(p.name))?.value;
  if (branchParam) return String(branchParam).replace(/^origin\//, '');
  return 'main';
}

function commitFromJenkinsBuild(detail) {
  for (const action of detail.actions || []) {
    if (action.lastBuiltRevision?.SHA1) return action.lastBuiltRevision.SHA1;
  }
  const items = detail.changeSet?.items;
  if (items?.length) return items[items.length - 1].commitId || '';
  return '';
}

async function fetchJenkinsConsoleLog(jenkinsUrl, jobName, buildNumber, authHeaders) {
  const url = `${jenkinsUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/consoleText`;
  const resp = await fetch(url, { headers: authHeaders });
  if (!resp.ok) return '';
  const text = await resp.text();
  return text.length > 50000 ? text.slice(-50000) : text;
}

// Sync builds from Jenkins API
router.post('/sync-from-jenkins', authenticateToken, async (req, res) => {
  // host.docker.internal = Jenkins on your PC when backend runs in Docker
  const JENKINS_URL = (process.env.JENKINS_URL || 'http://host.docker.internal:8080').replace(/\/$/, '');
  const JOB_NAME = process.env.JENKINS_JOB_NAME || 'Devops-Lab-Demo';
  const jenkinsUser = process.env.JENKINS_USER || 'manjunathpatil';
  const jenkinsToken = process.env.JENKINS_TOKEN || process.env.JENKINS_PASSWORD || 'Manjunath1234';
  const AUTH = Buffer.from(`${jenkinsUser}:${jenkinsToken}`).toString('base64');
  const authHeaders = {
    Authorization: `Basic ${AUTH}`,
    Accept: 'application/json',
  };

  try {
    const response = await fetch(`${JENKINS_URL}/job/${encodeURIComponent(JOB_NAME)}/api/json`, {
      headers: authHeaders,
    });

    if (!response.ok) {
      return res.status(502).json({
        error: `Jenkins returned ${response.status} for job "${JOB_NAME}". Check JENKINS_URL, job name, and credentials.`,
      });
    }

    const jobData = await response.json();
    const jenkinsBuilds = jobData.builds || [];

    if (jenkinsBuilds.length === 0) {
      return res.json({ builds: [], message: 'No builds found in Jenkins' });
    }

    const syncedBuilds = [];
    for (const jb of jenkinsBuilds) {
      try {
        const buildApiUrl = `${JENKINS_URL}/job/${encodeURIComponent(JOB_NAME)}/${jb.number}/api/json`;
        const detailResp = await fetch(buildApiUrl, {
          headers: authHeaders,
        });
        if (!detailResp.ok) continue;

        const detail = await detailResp.json();
        const consoleLog = await fetchJenkinsConsoleLog(JENKINS_URL, JOB_NAME, jb.number, authHeaders);

        let status = 'pending';
        if (detail.result === 'SUCCESS') status = 'success';
        else if (detail.result === 'FAILURE') status = 'failed';
        else if (detail.building) status = 'running';
        else if (detail.result === 'ABORTED') status = 'cancelled';

        const changeItems = detail.changeSet?.items || [];
        const existing = db.prepare('SELECT id FROM builds WHERE build_number = ?').get(jb.number);

        const buildData = {
          build_number: jb.number,
          branch: branchFromJenkinsBuild(detail),
          status,
          commit_sha: commitFromJenkinsBuild(detail),
          commit_message: changeItems.length ? changeItems[changeItems.length - 1].msg || '' : '',
          started_at: new Date(detail.timestamp).toISOString(),
          finished_at: detail.building ? null : new Date(detail.timestamp + (detail.duration || 0)).toISOString(),
          logs: consoleLog || `[${new Date(detail.timestamp).toISOString()}] Jenkins build #${jb.number} (${JOB_NAME})\nResult: ${detail.result || 'RUNNING'}`,
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
