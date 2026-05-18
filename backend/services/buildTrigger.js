const db = require('../database');

function getJenkinsConfig() {
  return {
    url: (process.env.JENKINS_URL || 'http://host.docker.internal:8080').replace(/\/$/, ''),
    jobName: process.env.JENKINS_JOB_NAME || 'Devops-Lab-Demo',
    user: process.env.JENKINS_USER || 'manjunathpatil',
    token: process.env.JENKINS_TOKEN || process.env.JENKINS_PASSWORD || 'Manjunath1234',
  };
}

async function tryTriggerJenkins() {
  const { url, jobName, user, token } = getJenkinsConfig();
  const authHeaders = {
    Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`,
  };

  try {
    const crumbRes = await fetch(`${url}/crumbIssuer/api/json`, { headers: authHeaders });
    if (crumbRes.ok) {
      const crumb = await crumbRes.json();
      authHeaders['Jenkins-Crumb'] = crumb.crumb;
    }

    const buildRes = await fetch(`${url}/job/${encodeURIComponent(jobName)}/build`, {
      method: 'POST',
      headers: authHeaders,
    });

    return buildRes.ok || buildRes.status === 201;
  } catch (err) {
    console.warn('[buildTrigger] Jenkins trigger failed:', err.message);
    return false;
  }
}

function simulateBuildCompletion(build, buildNumber, branch, commitMessage) {
  setTimeout(() => {
    const success = Math.random() > 0.3;
    const finishedAt = new Date().toISOString();
    const logs = success
      ? `[${finishedAt}] Build #${buildNumber} started\n[${finishedAt}] Task: ${commitMessage}\n[${finishedAt}] Cloning repository...\n[${finishedAt}] Checking out ${branch}...\n[${finishedAt}] Installing dependencies...\n[${finishedAt}] Running tests...\n[${finishedAt}] All tests passed ✓\n[${finishedAt}] Building project...\n[${finishedAt}] Build completed successfully ✓`
      : `[${finishedAt}] Build #${buildNumber} started\n[${finishedAt}] Task: ${commitMessage}\n[${finishedAt}] Cloning repository...\n[${finishedAt}] Checking out ${branch}...\n[${finishedAt}] Running tests...\n[${finishedAt}] Test failed: pipeline validation error\n[${finishedAt}] Build failed ✗`;

    db.prepare(`
      UPDATE builds SET status = ?, finished_at = ?, logs = ? WHERE id = ?
    `).run(success ? 'success' : 'failed', finishedAt, logs, build.id);

    const updatedBuild = db.prepare('SELECT * FROM builds WHERE id = ?').get(build.id);
    if (global.broadcastBuildUpdate) {
      global.broadcastBuildUpdate(updatedBuild);
    }
  }, 3000);
}

/** Map task status → pipeline action */
function getPipelineForStatus(status) {
  if (status === 'in_progress') {
    return { branch: 'develop', triggerJenkins: false, action: 'CI validation' };
  }
  if (status === 'done') {
    return { branch: 'main', triggerJenkins: true, action: 'Deploy pipeline' };
  }
  return null;
}

function shouldTriggerPipeline(oldStatus, newStatus) {
  if (!newStatus || newStatus === oldStatus) return false;
  return getPipelineForStatus(newStatus) !== null;
}

function startBuild(userId, { branch, commitSha, commitMessage, triggerJenkins, action }) {
  const lastBuild = db.prepare('SELECT MAX(build_number) as max_num FROM builds').get();
  const buildNumber = (lastBuild.max_num || 0) + 1;

  const result = db.prepare(
    'INSERT INTO builds (build_number, branch, commit_sha, commit_message, status, triggered_by, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    buildNumber,
    branch,
    commitSha || '',
    commitMessage,
    'running',
    userId,
    new Date().toISOString()
  );

  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(result.lastInsertRowid);

  if (global.broadcastBuildUpdate) {
    global.broadcastBuildUpdate(build);
  }

  simulateBuildCompletion(build, buildNumber, branch, commitMessage);

  if (triggerJenkins) {
    tryTriggerJenkins().then((ok) => {
      if (ok) console.log(`[buildTrigger] Jenkins job queued (${action})`);
    });
  }

  return {
    build,
    action,
    branch,
    jenkinsQueued: !!triggerJenkins,
  };
}

/**
 * Start a build for a task status change. Returns build record + metadata.
 */
function triggerBuildForTask(userId, task) {
  const pipeline = getPipelineForStatus(task.status);
  if (!pipeline) return null;

  return startBuild(userId, {
    branch: pipeline.branch,
    commitSha: `task-${task.id}`,
    commitMessage: `Task #${task.id}: ${task.title}`,
    triggerJenkins: pipeline.triggerJenkins,
    action: pipeline.action,
  });
}

/** Manual build from the Builds page */
function triggerManualBuild(userId, { branch, commit_sha, commit_message }) {
  return startBuild(userId, {
    branch,
    commitSha: commit_sha || '',
    commitMessage: commit_message || 'Manual build trigger',
    triggerJenkins: branch === 'main',
    action: 'Manual pipeline',
  });
}

module.exports = {
  triggerBuildForTask,
  triggerManualBuild,
  shouldTriggerPipeline,
  getPipelineForStatus,
  tryTriggerJenkins,
};
