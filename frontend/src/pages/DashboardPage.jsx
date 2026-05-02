import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, color, icon }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-white/40 text-sm">{label}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
    </div>
    <p className="font-display text-3xl font-bold text-white">{value}</p>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Good day, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-white/40 mt-1">Here's what's happening across your projects</p>
      </div>

      {!stats || stats.total === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-2">No tasks yet</h3>
          <p className="text-white/40 text-sm">Create a project and add tasks to see your dashboard stats</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tasks" value={stats.total} color="bg-accent/15" icon={
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/></svg>
            }/>
            <StatCard label="In Progress" value={stats.byStatus.inprogress} color="bg-amber/15" icon={
              <svg className="w-4 h-4 text-amber" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
            }/>
            <StatCard label="Completed" value={stats.byStatus.done} color="bg-jade/15" icon={
              <svg className="w-4 h-4 text-jade" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            }/>
            <StatCard label="Overdue" value={stats.overdue} color="bg-rose/15" icon={
              <svg className="w-4 h-4 text-rose" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            }/>
          </div>

          {/* Status bars */}
          <div className="card p-6">
            <h2 className="font-display font-bold text-white mb-5">Task Progress</h2>
            <div className="space-y-4">
              {[
                { label: 'To Do', val: stats.byStatus.todo, color: 'bg-white/20' },
                { label: 'In Progress', val: stats.byStatus.inprogress, color: 'bg-amber' },
                { label: 'Done', val: stats.byStatus.done, color: 'bg-jade' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/60">{label}</span>
                    <span className="text-white font-mono">{val}</span>
                  </div>
                  <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: stats.total ? `${(val / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks per user */}
          {stats.byUser.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-5">Tasks by Team Member</h2>
              <div className="space-y-3">
                {stats.byUser.map(u => (
                  <div key={u.email} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-display font-bold shrink-0">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white truncate">{u.name}</span>
                        <span className="text-xs font-mono text-white/40 ml-2">{u.count} task{u.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(u.count / stats.total) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
