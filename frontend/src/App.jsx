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
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg mb-4 text-white">
            <Icons.logo />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">DevFlow</h1>
          <p className="text-zinc-500 text-sm mt-1">DevOps Pipeline Dashboard</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter username"
                required
              />
            </div>

            {isRegister && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter email"
                required
              />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/30 text-red-400 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-zinc-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <span className="flex items-center justify-center gap-2"><Icons.spinner /> Please wait...</span>
                : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
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
function Navbar({ user, onLogout, activePage, onNavigate }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'board', label: 'Board', icon: Icons.board },
    { id: 'builds', label: 'Builds', icon: Icons.builds },
  ];

  return (
    <header className="border-b border-zinc-800 bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activePage === tab.id
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <tab.icon />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-[10px] font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-zinc-300">{user?.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
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
function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, buildsData, tasksData] = await Promise.all([
        api.getBuildStats(),
        api.getBuilds(),
        api.getTasks(),
      ]);
      setStats(statsData.stats);
      setRecentBuilds(buildsData.builds?.slice(0, 5) || []);
      setRecentTasks(tasksData.tasks?.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-600 border-t-zinc-300" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Builds', value: stats?.total || 0, change: `${stats?.successRate || 0}% success rate` },
    { label: 'Tasks', value: `${stats?.completedTasks || 0}/${stats?.totalTasks || 0}`, change: 'completed' },
    { label: 'Running', value: stats?.running || 0, change: 'active builds' },
    { label: 'Success Rate', value: `${stats?.successRate || 0}%`, change: 'overall' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Overview of your DevOps pipeline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500">{card.label}</p>
            <p className="text-2xl font-semibold text-zinc-100 mt-1">{card.value}</p>
            <p className="text-[11px] text-zinc-600 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Builds */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-zinc-100 mb-3">Recent Builds</h2>
          {recentBuilds.length === 0 ? (
            <p className="text-xs text-zinc-600">No builds yet. Trigger one from the Builds page!</p>
          ) : (
            <div className="space-y-2">
              {recentBuilds.map((build) => (
                <div key={build.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      build.status === 'success' ? 'bg-emerald-500' :
                      build.status === 'failed' ? 'bg-red-500' :
                      build.status === 'running' ? 'bg-amber-500 animate-pulse' :
                      'bg-zinc-600'
                    }`} />
                    <span className="text-xs text-zinc-300">Build #{build.build_number}</span>
                    <span className="text-[11px] text-zinc-600">{build.branch}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    build.status === 'success' ? 'bg-emerald-900/30 text-emerald-400' :
                    build.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                    build.status === 'running' ? 'bg-amber-900/30 text-amber-400' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>
                    {build.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-zinc-100 mb-3">Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <p className="text-xs text-zinc-600">No tasks yet. Create one from the Board page!</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      task.status === 'done' ? 'bg-emerald-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-zinc-600'
                    }`} />
                    <span className="text-xs text-zinc-300 truncate">{task.title}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                    task.priority === 'critical' ? 'bg-red-900/30 text-red-400' :
                    task.priority === 'high' ? 'bg-orange-900/30 text-orange-400' :
                    task.priority === 'medium' ? 'bg-amber-900/30 text-amber-400' :
                    'bg-zinc-800 text-zinc-500'
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-100">
            {task?.id ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors">
            <Icons.close />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Task title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-24"
              placeholder="Add a description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
          {task?.id ? (
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 rounded-md hover:bg-red-900/20 transition-colors">
              <Icons.trash /> Delete
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300 rounded-md hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-zinc-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  { id: 'todo', title: 'To Do', color: 'bg-zinc-600' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500' },
];

const PRIORITY_BADGES = {
  critical: { label: 'Critical', class: 'bg-red-900/40 text-red-400' },
  high: { label: 'High', class: 'bg-orange-900/40 text-orange-400' },
  medium: { label: 'Medium', class: 'bg-amber-900/40 text-amber-400' },
  low: { label: 'Low', class: 'bg-zinc-800 text-zinc-500' },
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

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col flex-1 min-w-0" style={{ minHeight: 0 }}>
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.color}`} />
          <h3 className="text-xs font-medium text-zinc-300">{column.title}</h3>
          <span className="text-[11px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{tasks.length}</span>
        </div>
        <button
          onClick={() => setShowInput(true)}
          className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
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
            className="w-full px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-xs placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
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
            className={`flex-1 px-3 py-2 space-y-2 overflow-y-auto min-h-[120px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-900/10' : ''
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
          className={`bg-zinc-800 border border-zinc-700 rounded-lg p-3 cursor-pointer group transition-all ${
            snapshot.isDragging
              ? 'shadow-xl border-indigo-500/50 rotate-[3deg] scale-[1.02]'
              : 'hover:border-zinc-600'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-zinc-200 leading-relaxed break-words flex-1">{task.title}</p>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${badge.class}`}>
              {badge.label}
            </span>
          </div>
          {task.description && (
            <p className="text-[11px] text-zinc-500 mt-1.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {task.assigned_username && (
              <span className="text-[10px] text-zinc-600">@{task.assigned_username}</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function BoardPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState(null);

  useEffect(() => { loadTasks(); }, []);

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
      await api.updateTask(taskId, { status: newStatus });
    } catch (err) {
      // Revert on failure
      loadTasks();
    }
  };

  const handleOpenTask = (task) => setModalTask(task);
  const handleCloseModal = () => setModalTask(null);

  const handleSaveTask = async (id, form) => {
    if (id) {
      await api.updateTask(id, form);
    } else {
      await api.createTask({ title: form.title, description: form.description, priority: form.priority, status: form.status });
    }
    await loadTasks();
  };

  const handleDeleteTask = async (id) => {
    await api.deleteTask(id);
    await loadTasks();
  };

  const handleAddTask = async (columnId, title) => {
    try {
      await api.createTask({ title, status: columnId, priority: 'medium' });
      loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-600 border-t-zinc-300" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Board</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Drag and drop tasks to update status</p>
        </div>
        <button
          onClick={() => setModalTask({ id: null, title: '', description: '', priority: 'medium', status: 'todo' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-zinc-100 rounded-lg transition-colors"
        >
          <Icons.plus /> New Task
        </button>
      </div>

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
function BuildsPage() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [branch, setBranch] = useState('main');
  const [wsConnected, setWsConnected] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadBuilds();
    const cleanup = connectWebSocket();
    return cleanup;
  }, []);

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
    } catch {}
    return () => ws?.close();
  };

  const loadBuilds = async () => {
    try {
      const data = await api.getBuilds();
      setBuilds(data.builds || []);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Build Pipeline</h1>
          <p className="text-xs text-zinc-500 mt-0.5">CI/CD pipeline status and logs</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
          <span className="text-[11px] text-zinc-500">{wsConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Trigger Build */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2.5">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="main">main</option>
            <option value="develop">develop</option>
            <option value="feature/new-ui">feature/new-ui</option>
          </select>
          <button
            onClick={triggerBuild}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-zinc-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggering ? <Icons.spinner /> : <Icons.play />}
            {triggering ? 'Triggering...' : 'Trigger Build'}
          </button>
        </div>
      </div>

      {/* Build List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-600 border-t-zinc-300" />
        </div>
      ) : builds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xs text-zinc-600">No builds yet. Trigger your first build!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {builds.map((build) => (
            <div key={build.id} className="bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                onClick={() => setExpandedId(expandedId === build.id ? null : build.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    build.status === 'success' ? 'bg-emerald-500' :
                    build.status === 'failed' ? 'bg-red-500' :
                    build.status === 'running' ? 'bg-amber-500 animate-pulse' :
                    'bg-zinc-600'
                  }`} />
                  <div className="text-left">
                    <span className="text-sm text-zinc-200 font-medium">Build #{build.build_number}</span>
                    <span className="text-xs text-zinc-600 ml-2">{build.branch}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    build.status === 'success' ? 'bg-emerald-900/30 text-emerald-400' :
                    build.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                    build.status === 'running' ? 'bg-amber-900/30 text-amber-400 animate-pulse' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>
                    {build.status}
                  </span>
                  <Icons.chevronDown />
                </div>
              </button>

              {expandedId === build.id && (
                <div className="px-4 pb-4 space-y-2 border-t border-zinc-800 pt-3">
                  {build.commit_message && (
                    <p className="text-xs text-zinc-400">{build.commit_message}</p>
                  )}
                  {build.logs && (
                    <div className="bg-zinc-950 rounded-lg p-3 font-mono text-[11px] text-zinc-500 overflow-x-auto max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{build.logs}</pre>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                    {build.triggered_username && <span>By: {build.triggered_username}</span>}
                    {build.started_at && <span>Start: {new Date(build.started_at).toLocaleString()}</span>}
                    {build.finished_at && <span>End: {new Date(build.finished_at).toLocaleString()}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('devflow_token');
    if (token) {
      api.getMe().then((data) => setUser(data.user)).catch(() => api.setToken(null));
    }
  }, []);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { api.setToken(null); setUser(null); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      <Navbar user={user} onLogout={handleLogout} activePage={page} onNavigate={setPage} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 min-h-0">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'board' && <BoardPage />}
        {page === 'builds' && <BuildsPage />}
      </main>
    </div>
  );
}
