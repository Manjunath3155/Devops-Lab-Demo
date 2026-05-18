const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('devflow_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('devflow_token', token);
    } else {
      localStorage.removeItem('devflow_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  register(username, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Tasks
  getTasks(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/tasks${params ? `?${params}` : ''}`);
  }

  getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  createTask(task) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  updateTask(id, updates) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Builds
  getBuilds(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/builds${params ? `?${params}` : ''}`);
  }

  getBuild(id) {
    return this.request(`/builds/${id}`);
  }

  triggerBuild(branch, commitSha = '', commitMessage = '') {
    return this.request('/builds', {
      method: 'POST',
      body: JSON.stringify({ branch, commit_sha: commitSha, commit_message: commitMessage }),
    });
  }

  getBuildStats() {
    return this.request('/builds/stats/summary');
  }

  syncBuildsFromJenkins() {
    return this.request('/builds/sync-from-jenkins', {
      method: 'POST',
    });
  }

  // Health
  healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiClient();
export default api;
