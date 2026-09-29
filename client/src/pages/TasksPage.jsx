import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckSquare, ClipboardList, Home, LogOut, Menu, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api, readSession, writeSession } from '../lib/api';
import { Button } from '../components/Button';
import { AuthPanel } from '../components/AuthPanel';

const EMPTY_TASK = { title: '', description: '', priority: 'medium', dueDate: '2026-10-20', status: 'not-started' };
const statusNames = { 'not-started': 'Not started', 'in-progress': 'In progress', completed: 'Completed' };

function TaskForm({ task, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState(task || EMPTY_TASK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const editing = Boolean(task?.id);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = await api(editing ? `/tasks/${task.id}` : '/tasks', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      onSaved(body.task);
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm('Delete this task permanently?')) return;
    setBusy(true);
    try { await api(`/tasks/${task.id}`, { method: 'DELETE' }); onDeleted(task.id); } catch (requestError) { setError(requestError.message); setBusy(false); }
  }

  return (
    <aside className="task-drawer" aria-label={editing ? 'Edit task' : 'Create task'}>
      <div className="drawer-heading"><h2>{editing ? 'Edit task' : 'New task'}</h2><button className="icon-button" onClick={onClose} aria-label="Close task form"><X /></button></div>
      <form onSubmit={submit}>
        <label>Title <span>*</span><input required minLength="2" maxLength="120" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Description<textarea maxLength="500" rows="5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <small className="character-count">{form.description.length}/500</small>
        <label>Priority <span>*</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label>Due date <span>*</span><input type="date" required value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
        <label>Status <span>*</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <Button type="submit" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Create task'}</Button>
        {editing ? <Button variant="danger" onClick={remove} disabled={busy}><Trash2 size={17} /> Delete task</Button> : null}
      </form>
    </aside>
  );
}

export function TasksPage() {
  const [session, setSession] = useState(readSession);
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(session));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try { const body = await api('/tasks'); setTasks(body.tasks); setError(''); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  }, [session]);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  const counts = useMemo(() => ({ all: tasks.length, active: tasks.filter((task) => task.status !== 'completed').length, completed: tasks.filter((task) => task.status === 'completed').length }), [tasks]);
  const visibleTasks = useMemo(() => tasks.filter((task) => (filter === 'all' || (filter === 'active' ? task.status !== 'completed' : task.status === 'completed')) && `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase())), [tasks, filter, query]);

  function signOut() { writeSession(null); setSession(null); setTasks([]); }
  function saveTask(saved) { setTasks((current) => current.some((task) => task.id === saved.id) ? current.map((task) => task.id === saved.id ? saved : task) : [...current, saved]); setSelected(saved); }
  function deleteTask(id) { setTasks((current) => current.filter((task) => task.id !== id)); setSelected(null); }

  if (!session) return <div className="auth-page"><Link className="back-link" to="/">← Portfolio</Link><AuthPanel onAuthenticated={setSession} /></div>;

  return (
    <div className="tasks-app">
      <aside className={`task-sidebar ${sidebarOpen ? 'is-open' : ''}`}><div className="task-logo"><CheckSquare /> <span>Task<strong>Flow</strong></span></div><nav><button><Home /> Overview</button><button className="active"><ClipboardList /> My tasks</button><button onClick={() => setFilter('completed')}><Check /> Completed</button></nav><div className="sidebar-bottom"><Link to="/">Portfolio</Link><Link to="/shop">Northstar Store</Link><button onClick={signOut}><LogOut size={17} /> Sign out</button></div></aside>
      <main className="task-main">
        <button className="icon-button mobile-sidebar-button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle dashboard navigation"><Menu /></button>
        <header className="task-header"><div><h1>My tasks</h1><p>Plan the work. Finish what matters.</p></div><Button onClick={() => setSelected(EMPTY_TASK)}><Plus size={18} /> New task</Button></header>
        <div className="task-toolbar"><div className="filters">{['all', 'active', 'completed'].map((value) => <button className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} key={value}>{value[0].toUpperCase() + value.slice(1)} ({counts[value]})</button>)}</div><label className="search-field"><Search size={18} /><input aria-label="Search tasks" placeholder="Search tasks..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="task-table-wrap">
          {loading ? <div className="empty-state">Loading your tasks...</div> : visibleTasks.length === 0 ? <div className="empty-state"><ClipboardList /><h2>No tasks found</h2><p>Create a task or adjust your filters.</p></div> : <table className="task-table"><thead><tr><th>Task</th><th>Priority</th><th>Due date</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleTasks.map((task) => <tr key={task.id} className={selected?.id === task.id ? 'selected' : ''} onClick={() => setSelected(task)}><td><strong>{task.title}</strong><span>{task.description}</span></td><td><span className={`priority priority--${task.priority}`}><i />{task.priority}</span></td><td>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><span className={`status status--${task.status}`}>{statusNames[task.status]}</span></td><td><button className="icon-button" aria-label={`Edit ${task.title}`} onClick={(event) => { event.stopPropagation(); setSelected(task); }}><Pencil size={17} /></button></td></tr>)}</tbody></table>}
        </div>
      </main>
      {selected ? <TaskForm key={selected.id || 'new'} task={selected.id ? selected : null} onClose={() => setSelected(null)} onSaved={saveTask} onDeleted={deleteTask} /> : null}
    </div>
  );
}

