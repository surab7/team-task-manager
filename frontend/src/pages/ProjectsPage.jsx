import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchProjects = () => {
    api.get('/projects').then(res => setProjects(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '' });
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const getUserRole = (project) => {
    const m = project.members?.find(m => m.user?._id === user?._id || m.user?.email === user?.email);
    return m?.role || 'member';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Projects</h1>
          <p className="text-white/40 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-2">No projects yet</h3>
          <p className="text-white/40 text-sm mb-5">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const role = getUserRole(project);
            return (
              <Link key={project._id} to={`/projects/${project._id}`}
                className="card p-5 hover:border-accent/40 transition-all duration-200 hover:bg-ink-800 group block">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-display font-bold text-lg group-hover:bg-accent/20 transition-colors">
                    {project.name[0].toUpperCase()}
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${role === 'admin' ? 'bg-accent/15 text-accent' : 'bg-white/10 text-white/50'}`}>
                    {role}
                  </span>
                </div>
                <h3 className="font-display font-bold text-white mb-1 group-hover:text-accent-light transition-colors">{project.name}</h3>
                {project.description && (
                  <p className="text-white/40 text-sm line-clamp-2 mb-3">{project.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-1.5">
                    {project.members?.slice(0, 4).map((m, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-ink-600 border-2 border-ink-900 flex items-center justify-center text-white/70 text-xs font-bold">
                        {m.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/30 text-xs">{project.members?.length} member{project.members?.length !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-white mb-5">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="bg-rose/10 border border-rose/20 text-rose text-sm px-4 py-3 rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Project Name</label>
                <input className="input" required placeholder="e.g. Website Redesign"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Description <span className="text-white/20">(optional)</span></label>
                <textarea className="input resize-none" rows={3} placeholder="What's this project about?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
