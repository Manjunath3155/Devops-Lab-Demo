const db = require('../database');
const { getJenkinsConfig, triggerJenkinsJob } = require('./jenkins');

async function tryTriggerJenkins(jobName) {
  const name = jobName || getJenkinsConfig().defaultJob;
  return triggerJenkinsJob(name);
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

function startBuild(userId, { branch, commitSha, commitMessage, triggerJenkins, action, jenkinsJob }) {
  const jobName = jenkinsJob || getJenkinsConfig().defaultJob;
  const lastBuild = db.prepare(
    `SELECT MAX(build_number) as max_num FROM builds
     WHERE COALESCE(jenkins_job, 'DevFlow-Pipeline') = ?`
  ).get(jobName);
  const buildNumber = (lastBuild?.max_num || 0) + 1;

  const result = db.prepare(
    'INSERT INTO builds (build_number, branch, commit_sha, commit_message, status, triggered_by, started_at, jenkins_job) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    buildNumber,
    branch,
    commitSha || '',
    commitMessage,
    'running',
    userId,
    new Date().toISOString(),
    jobName
  );

  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(result.lastInsertRowid);

  if (global.broadcastBuildUpdate) {
    global.broadcastBuildUpdate(build);
  }

  simulateBuildCompletion(build, buildNumber, branch, commitMessage);

  if (triggerJenkins) {
    tryTriggerJenkins(jobName).then((ok) => {
      if (ok) console.log(`[buildTrigger] Jenkins job queued: ${jobName} (${action})`);
    });
  }

  return {
    build,
    action,
    branch,
    jenkinsJob: jobName,
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
function triggerManualBuild(userId, { branch, commit_sha, commit_message, jenkins_job, trigger_jenkins }) {
  const jenkinsJob = jenkins_job || getJenkinsConfig().defaultJob;
  return startBuild(userId, {
    branch,
    commitSha: commit_sha || '',
    commitMessage: commit_message || 'Manual build trigger',
    triggerJenkins: trigger_jenkins !== false,
    jenkinsJob,
    action: `Manual pipeline (${jenkinsJob})`,
  });
}

module.exports = {
  triggerBuildForTask,
  triggerManualBuild,
  shouldTriggerPipeline,
  getPipelineForStatus,
  tryTriggerJenkins,
};
