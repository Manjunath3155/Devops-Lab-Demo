import { useState, useEffect, createContext, useContext } from 'react';
import api from './utils/api';

// Auth Context
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Pages
function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await api.register(form.username, form.email, form.password);
      } else {
        data = await api.login(form.username, form.password);
      }
      api.setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">DevFlow</h1>
          <p className="text-purple-200 mt-1">DevOps Pipeline Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your username"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-purple-300 hover:text-white text-sm transition-colors"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, buildsData, tasksData] = await Promise.all([
        api.getBuildStats(),
        api.getBuilds(),
        api.getTasks(),
      ]);
      setStats(statsData.stats);
      setRecentBuilds(buildsData.builds.slice(0, 5));
      setRecentTasks(tasksData.tasks.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Builds',
      value: stats?.total || 0,
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Tasks',
      value: `${stats?.completedTasks || 0}/${stats?.totalTasks || 0}`,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Running',
      value: stats?.running || 0,
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your DevOps pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color} bg-opacity-20`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Builds */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Builds</h2>
          {recentBuilds.length === 0 ? (
            <p className="text-gray-500 text-sm">No builds yet. Trigger one from the Builds page!</p>
          ) : (
            <div className="space-y-3">
              {recentBuilds.map((build) => (
                <div key={build.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      build.status === 'success' ? 'bg-green-500' :
                      build.status === 'failed' ? 'bg-red-500' :
                      build.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                      'bg-gray-500'
                    }`}></span>
                    <div>
                      <p className="text-white text-sm font-medium">Build #{build.build_number}</p>
                      <p className="text-gray-400 text-xs">{build.branch}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    build.status === 'success' ? 'bg-green-500/20 text-green-300' :
                    build.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                    build.status === 'running' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {build.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks yet. Create one from the Tasks page!</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{task.title}</p>
                    <p className="text-gray-400 text-xs capitalize">{task.status.replace('_', ' ')}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 ${
                    task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadTasks(); }, [filter]);

  const loadTasks = async () => {
    try {
      const filters = {};
      if (filter !== 'all') filters.status = filter;
      const data = await api.getTasks(filters);
      setTasks(data.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createTask(form);
      setForm({ title: '', description: '', priority: 'medium' });
      setShowForm(false);
      loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      loadTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const statusColors = {
    todo: 'bg-gray-500/20 text-gray-300',
    in_progress: 'bg-blue-500/20 text-blue-300',
    review: 'bg-yellow-500/20 text-yellow-300',
    done: 'bg-green-500/20 text-green-300',
  };

  const priorityColors = {
    low: 'border-l-green-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-orange-500',
    critical: 'border-l-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 mt-1">Manage your project tasks</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/25"
        >
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-20"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors">
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'todo', 'in_progress', 'review', 'done'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === s
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 border-l-4 ${priorityColors[task.priority]} hover:bg-white/10 transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[task.status] || ''}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.assigned_username && (
                      <span className="text-xs text-gray-500">@{task.assigned_username}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {task.status !== 'done' && (
                    <button
                      onClick={() => updateStatus(task.id, task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'review' : 'done')}
                      className="p-1.5 text-gray-400 hover:text-green-400 transition-colors"
                      title="Advance status"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuildsPage() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [branch, setBranch] = useState('main');
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    loadBuilds();
    connectWebSocket();
  }, []);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setWsConnected(true);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'BUILD_UPDATE') {
        setBuilds((prev) => [msg.data, ...prev.filter(b => b.id !== msg.data.id)]);
      }
    };
    ws.onclose = () => setWsConnected(false);

    return () => ws.close();
  };

  const loadBuilds = async () => {
    try {
      const data = await api.getBuilds();
      setBuilds(data.builds);
    } catch (err) {
      console.error('Failed to load builds:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerBuild = async () => {
    setTriggering(true);
    try {
      await api.triggerBuild(branch);
      loadBuilds();
    } catch (err) {
      console.error('Failed to trigger build:', err);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Build Pipeline</h1>
          <p className="text-gray-400 mt-1">CI/CD pipeline status and logs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-xs text-gray-400">{wsConnected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Trigger Build */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="main">main</option>
            <option value="develop">develop</option>
            <option value="feature/new-ui">feature/new-ui</option>
          </select>
          <button
            onClick={triggerBuild}
            disabled={triggering}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 flex items-center gap-2"
          >
            {triggering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Triggering...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Trigger Build
              </>
            )}
          </button>
        </div>
      </div>

      {/* Build History */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-500 border-t-transparent"></div>
        </div>
      ) : builds.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No builds yet. Trigger your first build!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {builds.map((build) => (
            <div key={build.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    build.status === 'success' ? 'bg-green-500' :
                    build.status === 'failed' ? 'bg-red-500' :
                    build.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-500'
                  }`}></span>
                  <span className="text-white font-medium">Build #{build.build_number}</span>
                  <span className="text-gray-400 text-sm">on {build.branch}</span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  build.status === 'success' ? 'bg-green-500/20 text-green-300' :
                  build.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                  build.status === 'running' ? 'bg-yellow-500/20 text-yellow-300 animate-pulse' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {build.status.charAt(0).toUpperCase() + build.status.slice(1)}
                </span>
              </div>

              {build.commit_message && (
                <p className="text-gray-400 text-sm ml-6 mb-2">{build.commit_message}</p>
              )}

              {build.logs && (
                <div className="ml-6 mt-2 bg-black/40 rounded-lg p-3 font-mono text-xs text-gray-400 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{build.logs}</pre>
                </div>
              )}

              <div className="flex items-center gap-4 ml-6 mt-2 text-xs text-gray-500">
                {build.triggered_username && <span>Triggered by: {build.triggered_username}</span>}
                {build.started_at && <span>Started: {new Date(build.started_at).toLocaleString()}</span>}
                {build.finished_at && <span>Finished: {new Date(build.finished_at).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar({ user, onLogout, activePage, onNavigate }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'builds', label: 'Builds', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  return (
    <nav className="bg-white/5 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">DevFlow</span>
            </div>

            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activePage === tab.id
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-white">{user?.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('devflow_token');
    if (token) {
      api.getMe().then((data) => setUser(data.user)).catch(() => {
        api.setToken(null);
      });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar user={user} onLogout={handleLogout} activePage={page} onNavigate={setPage} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {{
          dashboard: <DashboardPage />,
          tasks: <TasksPage />,
          builds: <BuildsPage />,
        }[page] || <DashboardPage />}
      </main>
    </div>
  );
}
