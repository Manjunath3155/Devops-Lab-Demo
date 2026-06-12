function getJenkinsConfig() {
  return {
    url: (process.env.JENKINS_URL || 'http://host.docker.internal:8080').replace(/\/$/, ''),
    defaultJob: process.env.JENKINS_JOB_NAME || 'Devops-Lab-Demo',
    user: process.env.JENKINS_USER || 'manjunathpatil',
    token: process.env.JENKINS_TOKEN || process.env.JENKINS_PASSWORD || 'Manjunath1234',
  };
}

function getAuthHeaders() {
  const { user, token } = getJenkinsConfig();
  return {
    Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`,
    Accept: 'application/json',
  };
}

async function listJenkinsJobs() {
  const { url } = getJenkinsConfig();
  const authHeaders = getAuthHeaders();
  const fallback = [
    getJenkinsConfig().defaultJob,
    'DevFlow-Pipeline',
    'Devops-Lab-Demo',
  ];

  try {
    const response = await fetch(`${url}/api/json?tree=jobs[name,url,color]`, {
      headers: authHeaders,
    });
    if (!response.ok) {
      return [...new Set(fallback)];
    }
    const data = await response.json();
    const names = (data.jobs || []).map((j) => j.name).filter(Boolean);
    return names.length ? names : [...new Set(fallback)];
  } catch {
    return [...new Set(fallback)];
  }
}

async function triggerJenkinsJob(jobName) {
  const { url } = getJenkinsConfig();
  const authHeaders = getAuthHeaders();

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
    console.warn(`[jenkins] Failed to trigger ${jobName}:`, err.message);
    return false;
  }
}

module.exports = {
  getJenkinsConfig,
  getAuthHeaders,
  listJenkinsJobs,
  triggerJenkinsJob,
};
