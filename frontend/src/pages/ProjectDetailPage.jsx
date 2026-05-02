import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['todo', 'inprogress', 'done'];
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '' });
  const [taskError, setTaskError] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  const isAdmin = project?.currentUserRole === 'admin';

  const fetchData = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`)
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '' });
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      assignedTo: task.assignedTo?._id || ''
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    setSavingTask(true);
    try {
      const payload = {
        ...taskForm,
        project: id,
        dueDate: taskForm.dueDate || null,
        assignedTo: taskForm.assignedTo || null
      };
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      setTaskError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(ts => ts.filter(t => t._id !== taskId));
    } catch (err) { console.error(err); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    setAddingMember(true);
    try {
      const res = await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setProject(res.data);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
    } catch (err) { alert(err.response?.data?.message || 'Failed to remove member'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) { alert('Failed to delete project'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  const isOverdue = (task) => task.dueDate && task.status !== 'done' && isPast(parseISO(task.dueDate));

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-white/30 text-sm mb-2">
            <button onClick={() => navigate('/projects')} className="hover:text-white transition-colors">Projects</button>
            <span>/</span>
            <span className="text-white/60">{project?.name}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">{project?.name}</h1>
          {project?.description && <p className="text-white/40 mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button onClick={openCreateTask} className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
              <button onClick={handleDeleteProject} className="btn-danger px-3 py-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-ink-900 border border-ink-700 rounded-xl p-1 w-fit">
        {['tasks', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={`ml-1.5 text-xs font-mono ${activeTab === tab ? 'text-white/70' : 'text-white/20'}`}>
              {tab === 'tasks' ? tasks.length : project?.members?.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map(status => (
            <div key={status} className="bg-ink-900/50 border border-ink-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-white text-sm">{STATUS_LABELS[status]}</h3>
                <span className="text-xs font-mono bg-ink-700 px-2 py-0.5 rounded-full text-white/50">{tasksByStatus[status].length}</span>
              </div>
              <div className="space-y-3">
                {tasksByStatus[status].map(task => (
                  <div key={task._id} className="card p-4 hover:border-ink-600 transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium text-white leading-snug">{task.title}</h4>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEditTask(task)} className="text-white/30 hover:text-accent transition-colors p-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteTask(task._id)} className="text-white/30 hover:text-rose transition-colors p-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {task.description && <p className="text-white/30 text-xs mb-2 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className={`badge-${task.priority}`}>{task.priority}</span>
                      {task.dueDate && (
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isOverdue(task) ? 'bg-rose/15 text-rose' : 'bg-ink-700 text-white/40'}`}>
                          {format(parseISO(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                          {task.assignedTo.name[0].toUpperCase()}
                        </div>
                        <span className="text-white/40 text-xs">{task.assignedTo.name}</span>
                      </div>
                    )}
                    {/* Status changer */}
                    {(isAdmin || task.assignedTo?._id === user?._id) && (
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task, e.target.value)}
                        className="w-full bg-ink-800 border border-ink-600 text-white/60 text-xs rounded-lg px-2 py-1.5 mt-1 focus:outline-none focus:border-accent"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className="text-center py-6 text-white/20 text-sm">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="max-w-lg">
          <div className="card divide-y divide-ink-700">
            {project?.members?.map(m => (
              <div key={m.user?._id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-display font-bold">
                    {m.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{m.user?.name}</p>
                    <p className="text-white/30 text-xs">{m.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-accent/15 text-accent' : 'bg-ink-700 text-white/40'}`}>
                    {m.role}
                  </span>
                  {isAdmin && m.user?._id !== user?._id && (
                    <button onClick={() => handleRemoveMember(m.user?._id)} className="text-white/20 hover:text-rose transition-colors ml-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="mt-4">
              {showAddMember ? (
                <div className="card p-5">
                  <h3 className="font-display font-bold text-white mb-4">Add Member</h3>
                  <form onSubmit={handleAddMember} className="space-y-3">
                    {memberError && <div className="bg-rose/10 border border-rose/20 text-rose text-sm px-4 py-3 rounded-lg">{memberError}</div>}
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">Email</label>
                      <input className="input" type="email" required placeholder="user@example.com"
                        value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5">Role</label>
                      <select className="input" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowAddMember(false)} className="btn-ghost flex-1">Cancel</button>
                      <button type="submit" disabled={addingMember} className="btn-primary flex-1">
                        {addingMember ? 'Adding...' : 'Add Member'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button onClick={() => { setShowAddMember(true); setMemberError(''); }} className="btn-ghost w-full flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Member
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setShowTaskModal(false)}>
          <div className="card w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-white mb-5">
              {editTask ? 'Edit Task' : 'New Task'}
            </h2>
            <form onSubmit={handleSaveTask} className="space-y-4">
              {taskError && <div className="bg-rose/10 border border-rose/20 text-rose text-sm px-4 py-3 rounded-lg">{taskError}</div>}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Title</label>
                <input className="input" required placeholder="Task title"
                  value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Description <span className="text-white/20">(optional)</span></label>
                <textarea className="input resize-none" rows={3} placeholder="Task details..."
                  value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Status</label>
                  <select className="input" value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Due Date <span className="text-white/20">(optional)</span></label>
                <input type="date" className="input"
                  value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Assign To <span className="text-white/20">(optional)</span></label>
                <select className="input" value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {project?.members?.map(m => (
                    <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={savingTask} className="btn-primary flex-1">
                  {savingTask ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
