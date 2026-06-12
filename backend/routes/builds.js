const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { triggerManualBuild } = require('../services/buildTrigger');
const { getJenkinsConfig, getAuthHeaders, listJenkinsJobs } = require('../services/jenkins');

const router = express.Router();

function normalizeJenkinsJob(job) {
  return job || getJenkinsConfig().defaultJob;
}

function findBuildByJobAndNumber(jobName, buildNumber) {
  return db.prepare(`
    SELECT id FROM builds
    WHERE build_number = ?
      AND (jenkins_job = ? OR (jenkins_job IS NULL AND ? = 'DevFlow-Pipeline'))
  `).get(buildNumber, jobName, jobName);
}

// Get all builds
router.get('/', authenticateToken, (req, res) => {
  const { status, branch, jenkins_job } = req.query;
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
  if (jenkins_job) {
    query += ` AND (b.jenkins_job = ? OR (b.jenkins_job IS NULL AND ? = 'DevFlow-Pipeline'))`;
    params.push(jenkins_job, jenkins_job);
  }

  query += ' ORDER BY b.created_at DESC LIMIT 50';

  try {
    const builds = db.prepare(query).all(...params);
    res.json({ builds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch builds' });
  }
});

// List Jenkins pipeline jobs (must be before /:id)
router.get('/jenkins/jobs', authenticateToken, async (req, res) => {
  try {
    const jobs = await listJenkinsJobs();
    res.json({ jobs, defaultJob: getJenkinsConfig().defaultJob });
  } catch (err) {
    res.status(502).json({ error: 'Failed to list Jenkins jobs' });
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
  const { branch, commit_sha, commit_message, jenkins_job, trigger_jenkins } = req.body;

  if (!branch) {
    return res.status(400).json({ error: 'Branch is required' });
  }

  try {
    const result = triggerManualBuild(req.user.id, {
      branch,
      commit_sha,
      commit_message,
      jenkins_job,
      trigger_jenkins,
    });
    res.status(201).json({
      build: result.build,
      jenkinsJob: result.jenkinsJob,
      jenkinsQueued: result.jenkinsQueued,
      message: result.jenkinsQueued
        ? `Build queued on Jenkins (${result.jenkinsJob})`
        : 'Build recorded locally',
    });
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
      inProgressTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get().count,
    };
    stats.successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

    // Average build duration in seconds (completed builds only)
    const avgRow = db.prepare(`
      SELECT AVG((JULIANDAY(finished_at) - JULIANDAY(started_at)) * 86400) as avg_sec
      FROM builds
      WHERE finished_at IS NOT NULL AND started_at IS NOT NULL
        AND status IN ('success', 'failed')
    `).get();
    stats.avgDurationSec = avgRow?.avg_sec ? Math.round(avgRow.avg_sec) : null;

    // Builds per branch
    stats.byBranch = db.prepare(`
      SELECT branch,
        COUNT(*) as total,
        SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
      FROM builds WHERE branch IS NOT NULL
      GROUP BY branch ORDER BY total DESC LIMIT 5
    `).all();

    // Builds per Jenkins job
    stats.byJob = db.prepare(`
      SELECT COALESCE(jenkins_job,'DevFlow-Pipeline') as job,
        COUNT(*) as total,
        SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
      FROM builds
      GROUP BY COALESCE(jenkins_job,'DevFlow-Pipeline')
      ORDER BY total DESC
    `).all();

    // Last failed build info
    stats.recentFailed = db.prepare(`
      SELECT build_number, branch, commit_message, started_at,
        COALESCE(jenkins_job,'DevFlow-Pipeline') as jenkins_job
      FROM builds WHERE status='failed'
      ORDER BY created_at DESC LIMIT 1
    `).get() || null;

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Jenkins health/status check
router.get('/jenkins/status', authenticateToken, async (req, res) => {
  const { url, defaultJob } = getJenkinsConfig();
  const authHeaders = getAuthHeaders();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(
      `${url}/api/json?tree=jobs[name,color,lastBuild[number,result,timestamp]]`,
      { headers: authHeaders, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!resp.ok) {
      return res.json({ reachable: false, jobs: [], defaultJob });
    }
    const data = await resp.json();
    const jobs = (data.jobs || []).map((j) => ({
      name: j.name,
      color: j.color || 'notbuilt',
      lastBuildNumber: j.lastBuild?.number ?? null,
      lastBuildResult: j.lastBuild?.result ?? null,
      lastBuildTimestamp: j.lastBuild?.timestamp ?? null,
    }));
    res.json({ reachable: true, jobs, defaultJob });
  } catch {
    res.json({ reachable: false, jobs: [], defaultJob });
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
  const { jenkins_job } = req.body || {};
  const JENKINS_URL = getJenkinsConfig().url;
  const JOB_NAME = normalizeJenkinsJob(jenkins_job);
  const authHeaders = getAuthHeaders();

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
        const existing = findBuildByJobAndNumber(JOB_NAME, jb.number);

        const buildData = {
          build_number: jb.number,
          jenkins_job: JOB_NAME,
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
          db.prepare(`
            UPDATE builds SET jenkins_job=?, branch=?, status=?, started_at=?, finished_at=?, logs=?
            WHERE id = ?
          `).run(
            buildData.jenkins_job, buildData.branch, buildData.status,
            buildData.started_at, buildData.finished_at, buildData.logs, existing.id
          );

          const updated = db.prepare('SELECT * FROM builds WHERE id = ?').get(existing.id);
          syncedBuilds.push(updated);
        } else {
          const result = db.prepare(`
            INSERT INTO builds (build_number, branch, status, commit_sha, commit_message, triggered_by, started_at, finished_at, logs, jenkins_job)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            buildData.build_number, buildData.branch, buildData.status, buildData.commit_sha,
            buildData.commit_message, buildData.triggered_by, buildData.started_at,
            buildData.finished_at, buildData.logs, buildData.jenkins_job
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
      jenkinsJob: JOB_NAME,
      message: `Synced ${syncedBuilds.length} builds from Jenkins (${JOB_NAME})`,
    });
  } catch (err) {
    console.error('Jenkins sync error:', err.message);
    res.status(502).json({
      error: `Failed to connect to Jenkins at ${JENKINS_URL}. Make sure Jenkins is running.`,
    });
  }
});

module.exports = router;
