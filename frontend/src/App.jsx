import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from './utils/api';

// ─── Auth Context ────────────────────────────────────────────────
const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

// ─── Icons (inline SVG, no external deps) ────────────────────────
const Icons = {
  logo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  board: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  builds: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  ),
  chevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  play: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  ),
  spinner: () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
};

// ─── Login Page ─────────────────────────────────────────────────
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
      const data = isRegister
        ? await api.register(form.username, form.email, form.password)
        : await api.login(form.username, form.password);
      api.setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg mb-4 text-white">
            <Icons.logo />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">DevFlow</h1>
          <p className="text-gray-500 text-sm mt-1">DevOps Pipeline Dashboard</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter username"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Enter email"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <span className="flex items-center justify-center gap-2"><Icons.spinner /> Please wait...</span>
                : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────
// DARK MODE: added darkMode + onToggleDark props
// OLD: function Navbar({ user, onLogout, activePage, onNavigate }) {
function Navbar({ user, onLogout, activePage, onNavigate, darkMode, onToggleDark }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'board', label: 'Board', icon: Icons.board },
    { id: 'builds', label: 'Builds', icon: Icons.builds },
  ];

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white">
                <Icons.logo />
              </div>
              DevFlow
            </div>

            <nav className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activePage === tab.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <tab.icon />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* DARK MODE TOGGLE BUTTON */}
            <button
              onClick={onToggleDark}
              className="px-2 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-[10px] font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700">{user?.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Logout"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────
function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [jenkinsStatus, setJenkinsStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, buildsData, tasksData, jenkinsData] = await Promise.all([
        api.getBuildStats(),
        api.getBuilds(),
        api.getTasks(),
        api.getJenkinsStatus().catch(() => null),
      ]);
      setStats(statsData.stats);
      setBuilds(buildsData.builds || []);
      setTasks(tasksData.tasks || []);
      setJenkinsStatus(jenkinsData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const fmtDuration = (sec) => {
    if (!sec) return '—';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-500" />
      </div>
    );
  }

  const totalBuilds = stats?.total || 0;
  const successCount = stats?.success || 0;
  const failedCount = stats?.failed || 0;
  const runningCount = stats?.running || 0;
  const successRate = stats?.successRate || 0;
  const totalTasks = stats?.totalTasks || 0;
  const completedTasks = stats?.completedTasks || 0;
  const inProgressTasksCount = stats?.inProgressTasks || 0;
  const avgDurationSec = stats?.avgDurationSec || null;
  const byJob = stats?.byJob || [];

  // Task distribution by status
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const taskTotal = todoTasks + inProgressTasks + doneTasks || 1;

  // Use server-side byBranch if available, else compute locally
  const branches = stats?.byBranch?.length
    ? stats.byBranch
    : (() => {
      const m = {};
      builds.forEach(b => {
        const br = (b.branch || 'main').replace(/^refs\/remotes\/origin\//, '').replace(/^origin\//, '');
        if (!m[br]) m[br] = { branch: br, total: 0, success: 0, failed: 0 };
        m[br].total++;
        if (b.status === 'success') m[br].success++;
        if (b.status === 'failed') m[br].failed++;
      });
      return Object.values(m);
    })();

  // Build activity feed - combine builds and tasks chronologically
  const buildItems = builds.map(b => ({
    id: `b-${b.id}`,
    type: 'build',
    timestamp: new Date(b.created_at || b.started_at || Date.now()),
    build_number: b.build_number,
    branch: (b.branch || 'main').replace(/^refs\/remotes\/origin\//, '').replace(/^origin\//, ''),
    jenkins_job: b.jenkins_job || 'DevFlow-Pipeline',
    status: b.status,
    commit_message: b.commit_message,
  }));
  const taskItems = tasks.map(t => ({
    id: `t-${t.id}`,
    type: 'task',
    timestamp: new Date(t.created_at || Date.now()),
    title: t.title,
    priority: t.priority,
    status: t.status,
  }));
  const activity = [...buildItems, ...taskItems]
    .sort((a, b) => (b.build_number ?? 0) - (a.build_number ?? 0) || b.timestamp - a.timestamp)
    .slice(0, 6);

  // Recent items for direct display — sort by build_number so newest is always first
  const recentBuilds = [...builds]
    .sort((a, b) => (b.build_number ?? 0) - (a.build_number ?? 0))
    .slice(0, 4);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  const cards = [
    {
      label: 'Total Builds', value: totalBuilds,
      sub: `${successCount} passed · ${failedCount} failed`,
      accent: totalBuilds > 0 ? 'text-indigo-600' : 'text-gray-400', icon: 'builds',
    },
    {
      label: 'Tasks', value: `${completedTasks}/${totalTasks}`,
      sub: `${inProgressTasksCount} in progress · ${todoTasks} to do`,
      accent: totalTasks > 0 ? 'text-emerald-600' : 'text-gray-400', icon: 'board',
    },
    {
      label: 'Avg Build Time', value: fmtDuration(avgDurationSec),
      sub: avgDurationSec ? 'for completed builds' : 'no data yet',
      accent: avgDurationSec ? (avgDurationSec < 120 ? 'text-emerald-600' : avgDurationSec < 300 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400',
      icon: 'play',
    },
    {
      label: 'Success Rate', value: `${successRate}%`,
      sub: runningCount > 0 ? `${runningCount} currently running` : 'overall pipeline health',
      accent: successRate >= 80 ? 'text-emerald-600' : successRate >= 50 ? 'text-amber-600' : 'text-gray-400', icon: 'logo',
    },
  ];

  const buildTotalForBar = successCount + failedCount;
  const successPct = buildTotalForBar > 0 ? (successCount / buildTotalForBar) * 100 : 0;
  const failedPct = buildTotalForBar > 0 ? (failedCount / buildTotalForBar) * 100 : 0;

  const timeAgo = (date) => {
    const ts = date.getTime();
    if (isNaN(ts)) return '';
    const now = Date.now();
    const diff = now - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const statusDot = (status) => {
    if (status === 'success') return 'bg-emerald-500';
    if (status === 'failed') return 'bg-red-500';
    if (status === 'running') return 'bg-amber-500 animate-pulse';
    if (status === 'in_progress') return 'bg-blue-500';
    if (status === 'done') return 'bg-emerald-500';
    return 'bg-gray-400';
  };

  const statusBg = (status) => {
    if (status === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'running') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'in_progress') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'done') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Overview of your DevOps pipeline</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
          title="Refresh dashboard"
        >
          {refreshing ? <Icons.spinner /> : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          )}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Quick Actions</span>
          <div className="h-4 w-px bg-gray-200" />
          <button
            onClick={() => onNavigate('board')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Icons.plus /> New Task
          </button>
          <button
            onClick={() => onNavigate('builds')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Icons.play /> Trigger Build
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-all hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{card.label}</p>
              <span className="text-gray-400 opacity-50">
                {card.icon === 'builds' ? <Icons.builds /> :
                  card.icon === 'board' ? <Icons.board /> :
                    card.icon === 'play' ? <Icons.play /> : <Icons.logo />}
              </span>
            </div>
            <p className={`text-2xl font-semibold mt-1 ${card.accent}`}>{card.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Jenkins Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 px-4 shadow-sm">
        <div className="flex items-center flex-wrap gap-3">
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Jenkins</span>
          <div className="h-4 w-px bg-gray-200" />
          {jenkinsStatus === null ? (
            <span className="text-[11px] text-gray-400">Checking...</span>
          ) : jenkinsStatus?.reachable ? (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected to Jenkins
              </span>
              {(jenkinsStatus.jobs || []).map((job) => {
                const result = job.lastBuildResult;
                const dot = result === 'SUCCESS' ? 'bg-emerald-500' :
                  result === 'FAILURE' ? 'bg-red-500' :
                    result === 'ABORTED' ? 'bg-gray-400' : 'bg-amber-400';
                const label = result === 'SUCCESS' ? 'passed' :
                  result === 'FAILURE' ? 'failed' :
                    result === 'ABORTED' ? 'aborted' : 'unknown';
                return (
                  <span key={job.name} className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {job.name}
                    {job.lastBuildNumber && (
                      <span className="text-gray-400">#{job.lastBuildNumber} · {label}</span>
                    )}
                  </span>
                );
              })}
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Jenkins unreachable — check if Jenkins is running at :8080
            </span>
          )}
        </div>
      </div>

      {/* Recent Builds - visual cards */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900">Recent Builds</h2>
          <button onClick={() => onNavigate('builds')} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">View all</button>
        </div>
        {recentBuilds.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">No builds yet. Trigger your first build!</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recentBuilds.map((b) => (
              <div key={b.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-700 font-medium">#{b.build_number}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${statusBg(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{b.branch}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {timeAgo(new Date(b.created_at || b.started_at || Date.now()))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Build Pipeline + Task Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Build Pipeline Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Build Pipeline</h2>
          {buildTotalForBar === 0 && runningCount === 0 ? (
            <p className="text-xs text-gray-500 py-3">No builds yet. Trigger one to see pipeline health.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 text-[11px] mb-3">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {successCount} passed
                </span>
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {failedCount} failed
                </span>
                {runningCount > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {runningCount} running
                  </span>
                )}
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {successCount > 0 && (
                  <div className="bg-emerald-500 h-full transition-all duration-700 rounded-l-full" style={{ width: `${successPct}%` }} />
                )}
                {failedCount > 0 && (
                  <div className="bg-red-500 h-full transition-all duration-700 rounded-r-full" style={{ width: `${failedPct}%` }} />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                <span>{successRate}% success rate</span>
                <span>{buildTotalForBar} total</span>
              </div>
            </>
          )}
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Tasks Overview</h2>
          {tasks.length === 0 ? (
            <p className="text-xs text-gray-500 py-3">No tasks yet. Create one from the Board page.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 text-[11px] mb-3">
                <span className="flex items-center gap-1.5 text-gray-600"><span className="w-2 h-2 rounded-full bg-gray-400" /> {todoTasks} to do</span>
                <span className="flex items-center gap-1.5 text-gray-600"><span className="w-2 h-2 rounded-full bg-blue-500" /> {inProgressTasks} in progress</span>
                <span className="flex items-center gap-1.5 text-gray-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {doneTasks} done</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {todoTasks > 0 && (
                  <div className="bg-gray-400 h-full transition-all duration-700 rounded-l-full" style={{ width: `${(todoTasks / taskTotal) * 100}%` }} />
                )}
                {inProgressTasks > 0 && (
                  <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${(inProgressTasks / taskTotal) * 100}%` }} />
                )}
                {doneTasks > 0 && (
                  <div className="bg-emerald-500 h-full transition-all duration-700 rounded-r-full" style={{ width: `${(doneTasks / taskTotal) * 100}%` }} />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                <span>{tasks.length} total tasks</span>
                <span>{completedTasks} completed</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Tasks + Activity + Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Recent Tasks</h2>
            <button onClick={() => onNavigate('board')} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">View all</button>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-xs text-gray-500 py-3">No tasks yet. Create one!</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(t.status)}`} />
                  <span className="text-xs text-gray-700 truncate flex-1">{t.title}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${t.priority === 'critical' ? 'bg-red-50 text-red-700' :
                      t.priority === 'high' ? 'bg-orange-50 text-orange-700' :
                        t.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                    }`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-xs text-gray-500 py-3">No activity yet.</p>
          ) : (
            <div className="space-y-0">
              {activity.map((item, idx) => (
                <div key={item.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ring-2 ring-gray-200 ${item.type === 'build'
                        ? item.status === 'success' ? 'bg-emerald-500' : item.status === 'failed' ? 'bg-red-500' : item.status === 'running' ? 'bg-amber-500' : 'bg-gray-400'
                        : item.status === 'done' ? 'bg-emerald-500' : item.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                    {idx < activity.length - 1 && <div className="w-px flex-1 bg-gray-200 my-0.5" />}
                  </div>
                  <div className="pb-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-700 truncate">
                        {item.type === 'build'
                          ? `${item.jenkins_job} #${item.build_number}`
                          : item.title}
                      </span>
                      <span className="text-[9px] text-gray-400 flex-shrink-0">
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {item.type === 'build' ? `${item.branch} — ${item.status}` : item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branch Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-medium text-gray-900 mb-3">Branches</h2>
          {branches.length === 0 ? (
            <p className="text-xs text-gray-500 py-3">No branches with builds yet.</p>
          ) : (
            <div className="space-y-3">
              {branches.map((b) => (
                <div key={b.branch}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 font-medium">{b.branch}</span>
                    <span className="text-[10px] text-gray-400">{b.total} builds</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                    {b.success > 0 && (
                      <div className="bg-emerald-500 h-full" style={{ width: `${(b.success / b.total) * 100}%` }} />
                    )}
                    {b.failed > 0 && (
                      <div className="bg-red-500 h-full" style={{ width: `${(b.failed / b.total) * 100}%` }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Task Detail Modal ───────────────────────────────────────────
function TaskModal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(task?.id, form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await onDelete(task?.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">
            {task?.id ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors">
            <Icons.close />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Task title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-24"
              placeholder="Add a description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
          {task?.id ? (
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
              <Icons.trash /> Delete
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : task?.id ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Board Page ──────────────────────────────────────────
const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-400' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500' },
];

const PRIORITY_BADGES = {
  critical: { label: 'Critical', class: 'bg-red-50 text-red-700' },
  high: { label: 'High', class: 'bg-orange-50 text-orange-800' },
  medium: { label: 'Medium', class: 'bg-amber-50 text-amber-700' },
  low: { label: 'Low', class: 'bg-gray-100 text-gray-500' },
};

function BoardColumn({ column, tasks, onOpenTask, onAddTask }) {
  const [newTitle, setNewTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddTask(column.id, newTitle.trim());
      setNewTitle('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setShowInput(false); setNewTitle(''); }
  };

  const highCount = tasks.filter(t => t.priority === 'critical' || t.priority === 'high').length;

  return (
    <div className="bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col flex-1 min-w-0" style={{ minHeight: 0 }}>
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.color}`} />
          <h3 className="text-xs font-medium text-gray-700">{column.title}</h3>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tasks.length}</span>
          {highCount > 0 && (
            <span className="text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded">
              {highCount} urgent
            </span>
          )}
        </div>
        <button
          onClick={() => setShowInput(true)}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Add task"
        >
          <Icons.plus />
        </button>
      </div>

      {/* Add task input */}
      {showInput && (
        <div className="px-3 pt-3">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!newTitle.trim()) { setShowInput(false); } }}
            className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            placeholder="Task title, Enter to add"
          />
        </div>
      )}

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 px-3 py-2 space-y-2 overflow-y-auto min-h-[120px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/60' : ''
              }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onClick={() => onOpenTask(task)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function TaskCard({ task, index, onClick }) {
  const badge = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;

  return (
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white border border-gray-200 rounded-lg p-3 cursor-pointer group transition-all ${snapshot.isDragging
              ? 'shadow-lg border-indigo-400 rotate-[3deg] scale-[1.02]'
              : 'hover:border-gray-300 hover:shadow-sm'
            }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-800 leading-relaxed break-words flex-1">{task.title}</p>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${badge.class}`}>
              {badge.label}
            </span>
          </div>
          {task.description && (
            <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {task.assigned_username && (
              <span className="text-[10px] text-gray-400">@{task.assigned_username}</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function PipelineBanner({ notice, onDismiss, onViewBuilds }) {
  if (!notice) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 shadow-sm">
      <span className="mt-0.5 flex h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500 animate-pulse" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-indigo-900">{notice.title}</p>
        <p className="text-[11px] text-indigo-700 mt-0.5">{notice.detail}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onViewBuilds}
          className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 underline"
        >
          View builds
        </button>
        <button type="button" onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <Icons.close />
        </button>
      </div>
    </div>
  );
}

function BoardPage({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState(null);
  const [pipelineNotice, setPipelineNotice] = useState(null);

  useEffect(() => { loadTasks(); }, []);

  const showPipelineNotice = (pipeline) => {
    if (!pipeline?.build) return;
    const jenkinsNote = pipeline.jenkinsQueued
      ? ' Jenkins job queued (if Jenkins is running).'
      : '';
    setPipelineNotice({
      title: `Pipeline triggered — ${pipeline.action}`,
      detail: `Build #${pipeline.build.build_number} running on branch "${pipeline.branch}".${jenkinsNote}`,
    });
  };

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'BUILD_UPDATE' && msg.data?.status !== 'running') {
          setPipelineNotice((prev) =>
            prev
              ? {
                ...prev,
                title: `Build #${msg.data.build_number} ${msg.data.status}`,
                detail: `Pipeline finished on ${msg.data.branch}. Open Builds for logs.`,
              }
              : prev
          );
        }
      };
    } catch {
      /* WebSocket optional */
    }
    return () => ws?.close();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColumnTasks = (columnId) => tasks.filter((t) => t.status === columnId);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = parseInt(draggableId.replace('task-', ''), 10);
    const newStatus = destination.droppableId;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const data = await api.updateTask(taskId, { status: newStatus });
      showPipelineNotice(data.pipeline);
    } catch (err) {
      // Revert on failure
      loadTasks();
    }
  };

  const handleOpenTask = (task) => setModalTask(task);
  const handleCloseModal = () => setModalTask(null);

  const handleSaveTask = async (id, form) => {
    let data;
    if (id) {
      data = await api.updateTask(id, form);
    } else {
      data = await api.createTask({ title: form.title, description: form.description, priority: form.priority, status: form.status });
    }
    showPipelineNotice(data.pipeline);
    await loadTasks();
  };

  const handleDeleteTask = async (id) => {
    await api.deleteTask(id);
    await loadTasks();
  };

  const handleAddTask = async (columnId, title) => {
    try {
      const data = await api.createTask({ title, status: columnId, priority: 'medium' });
      showPipelineNotice(data.pipeline);
      loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-500" />
      </div>
    );
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Board
            {totalTasks > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {completionPct}% complete ({doneTasks}/{totalTasks})
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Drag to In Progress → CI on develop · Done → deploy on main + Jenkins
          </p>
        </div>
        <button
          onClick={() => setModalTask({ id: null, title: '', description: '', priority: 'medium', status: 'todo' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          <Icons.plus /> New Task
        </button>
      </div>

      <PipelineBanner
        notice={pipelineNotice}
        onDismiss={() => setPipelineNotice(null)}
        onViewBuilds={() => onNavigate?.('builds')}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              tasks={getColumnTasks(col.id)}
              onOpenTask={handleOpenTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </DragDropContext>

      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}

// ─── Builds Page ─────────────────────────────────────────────────
const JENKINS_JOB_KEY = 'devflow_jenkins_job';

function BuildsPage() {
  const fmtDuration = (start, end) => {
    if (!start || !end) return null;
    const sec = Math.round((new Date(end) - new Date(start)) / 1000);
    if (sec < 0) return null;
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [branch, setBranch] = useState('main');
  const [pipeline, setPipeline] = useState(() => localStorage.getItem(JENKINS_JOB_KEY) || 'Devops-Lab-Demo');
  const [jenkinsJobs, setJenkinsJobs] = useState(['Devops-Lab-Demo', 'DevFlow-Pipeline']);
  const [wsConnected, setWsConnected] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jenkinsJobStatus, setJenkinsJobStatus] = useState(null);

  useEffect(() => {
    api.getJenkinsJobs()
      .then((data) => {
        if (data.jobs?.length) setJenkinsJobs(data.jobs);
        if (data.defaultJob && !localStorage.getItem(JENKINS_JOB_KEY)) {
          setPipeline(data.defaultJob);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    loadBuilds();
    const cleanup = connectWebSocket();
    // Fetch Jenkins status for current pipeline
    api.getJenkinsStatus()
      .then((data) => {
        const job = (data.jobs || []).find(j => j.name === pipeline);
        setJenkinsJobStatus(job || null);
      })
      .catch(() => setJenkinsJobStatus(null));
    return cleanup;
  }, [pipeline]);

  const handlePipelineChange = (job) => {
    setPipeline(job);
    localStorage.setItem(JENKINS_JOB_KEY, job);
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setWsConnected(true);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'BUILD_UPDATE') {
          setBuilds((prev) => [msg.data, ...prev.filter(b => b.id !== msg.data.id)]);
        }
      };
      ws.onclose = () => setWsConnected(false);
    } catch { }
    return () => ws?.close();
  };

  const loadBuilds = async () => {
    try {
      const data = await api.getBuilds({ jenkins_job: pipeline });
      setBuilds(data.builds || []);
    } catch (err) {
      console.error('Failed to load builds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBuilds();
    setRefreshing(false);
  };

  const handleSyncFromJenkins = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const data = await api.syncBuildsFromJenkins(pipeline);
      setSyncMessage(data.message || `Synced ${data.builds?.length || 0} builds`);
      // Refresh the builds list after sync
      await loadBuilds();
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const triggerBuild = async () => {
    setTriggering(true);
    try {
      const data = await api.triggerBuild(branch, { jenkinsJob: pipeline });
      setSyncMessage(data.message || `Triggered ${pipeline}`);
      loadBuilds();
    } catch (err) {
      console.error('Failed to trigger build:', err);
    } finally {
      setTriggering(false);
    }
  };

  const branchOptions = [...new Set([
    'main',
    'develop',
    ...builds.map((b) => b.branch).filter(Boolean),
  ])];

  const filteredBuilds = (statusFilter === 'all'
    ? [...builds]
    : builds.filter(b => b.status === statusFilter)
  ).sort((a, b) => (b.build_number ?? 0) - (a.build_number ?? 0));

  const statusCounts = {
    all: builds.length,
    running: builds.filter(b => b.status === 'running').length,
    success: builds.filter(b => b.status === 'success').length,
    failed: builds.filter(b => b.status === 'failed').length,
  };

  const statusColors = (status) => {
    if (status === 'success') return 'bg-emerald-500';
    if (status === 'failed') return 'bg-red-500';
    if (status === 'running') return 'bg-amber-500 animate-pulse';
    return 'bg-gray-400';
  };

  const badgeColors = (status) => {
    if (status === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'running') return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Build Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">CI/CD pipeline status and logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncFromJenkins}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
            title="Sync builds from Jenkins"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync from Jenkins'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
            title="Refresh builds"
          >
            {refreshing ? <Icons.spinner /> : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            )}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-[11px] text-gray-500">{wsConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Jenkins job status for current pipeline */}
      {jenkinsJobStatus && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${jenkinsJobStatus.lastBuildResult === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            jenkinsJobStatus.lastBuildResult === 'FAILURE' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${jenkinsJobStatus.lastBuildResult === 'SUCCESS' ? 'bg-emerald-500' :
              jenkinsJobStatus.lastBuildResult === 'FAILURE' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
          <span className="font-medium">{pipeline}</span>
          {jenkinsJobStatus.lastBuildNumber && (
            <span>· Last build #{jenkinsJobStatus.lastBuildNumber} — {jenkinsJobStatus.lastBuildResult || 'UNKNOWN'}</span>
          )}
          {jenkinsJobStatus.lastBuildTimestamp && (
            <span className="ml-auto text-[10px] opacity-70">
              {new Date(jenkinsJobStatus.lastBuildTimestamp).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit shadow-sm">
        {[['all', 'All'], ['running', 'Running'], ['success', 'Passed'], ['failed', 'Failed']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${statusFilter === val
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            {label}
            <span className={`text-[10px] px-1 py-0.5 rounded ${statusFilter === val ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{statusCounts[val]}</span>
          </button>
        ))}
      </div>

      {/* Sync status message */}
      {syncMessage && (
        <div className={`px-4 py-2.5 rounded-lg text-xs font-medium border ${syncMessage.toLowerCase().includes('fail') || syncMessage.toLowerCase().includes('error')
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
          {syncMessage}
        </div>
      )}

      {/* Trigger Build */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Pipeline</label>
          <select
            value={pipeline}
            onChange={(e) => handlePipelineChange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-xs focus:outline-none focus:border-indigo-500 min-w-[160px]"
          >
            {jenkinsJobs.map((job) => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide ml-2">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-xs focus:outline-none focus:border-indigo-500"
          >
            {branchOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button
            onClick={triggerBuild}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggering ? <Icons.spinner /> : <Icons.play />}
            {triggering ? 'Triggering...' : 'Run Pipeline'}
          </button>
        </div>
        <p className="text-[10px] text-gray-400">
          Sync and list show builds for <span className="font-medium text-gray-600">{pipeline}</span> only.
        </p>
      </div>

      {/* Build List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-500" />
        </div>
      ) : filteredBuilds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xs text-gray-500">
            {builds.length === 0 ? 'No builds yet. Trigger your first build!' : `No ${statusFilter} builds.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBuilds.map((build) => {
            const duration = fmtDuration(build.started_at, build.finished_at);
            const branch = (build.branch || 'main').replace(/^refs\/remotes\/origin\//, '').replace(/^origin\//, '');
            return (
              <div key={build.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedId(expandedId === build.id ? null : build.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors(build.status)}`} />
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-800 font-medium">Build #{build.build_number}</span>
                        <span className="text-xs text-gray-400">
                          {build.jenkins_job || 'DevFlow-Pipeline'} · {branch}
                        </span>
                        {duration && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⏱ {duration}</span>
                        )}
                      </div>
                      {build.commit_message && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">{build.commit_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badgeColors(build.status)}`}>
                      {build.status}
                    </span>
                    <Icons.chevronDown />
                  </div>
                </button>

                {expandedId === build.id && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gray-200 pt-3">
                    {build.logs && (
                      <div className="bg-gray-950 rounded-lg p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{build.logs}</pre>
                      </div>
                    )}
                    <div className="flex items-center flex-wrap gap-4 text-[10px] text-gray-400">
                      {build.triggered_username && <span>👤 {build.triggered_username}</span>}
                      {build.started_at && <span>▶ {new Date(build.started_at).toLocaleString()}</span>}
                      {build.finished_at && <span>■ {new Date(build.finished_at).toLocaleString()}</span>}
                      {duration && <span className="font-medium text-gray-500">Duration: {duration}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  // DARK MODE STATE (new)
  // OLD: no darkMode state here
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (api.token) {
      api.getMe().then((data) => setUser(data.user)).catch(() => api.setToken(null));
    }
  }, []);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { api.setToken(null); setUser(null); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    {/* DARK MODE: className switches bg based on darkMode state */}
    {/* OLD: <div className="min-h-screen bg-gray-50 flex flex-col"> */}
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* DARK MODE: passing darkMode + onToggleDark to Navbar */}
      {/* OLD: <Navbar user={user} onLogout={handleLogout} activePage={page} onNavigate={setPage} /> */}
      <Navbar user={user} onLogout={handleLogout} activePage={page} onNavigate={setPage} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 min-h-0">
        {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
        {page === 'board' && <BoardPage onNavigate={setPage} />}
        {page === 'builds' && <BuildsPage />}
      </main>
    </div>
  );
}
