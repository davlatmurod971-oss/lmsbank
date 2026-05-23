// EmployeeTrainings.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeesAPI, trainingsAPI } from '../../utils/api';
import { CheckCircle, Clock, AlertCircle, Play, Check } from 'lucide-react';

export default function EmployeeTrainings() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    if (!user?.employee?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await employeesAPI.getTrainings(user.employee.id);
      setTrainings(res.data.trainings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleStart = async (id) => {
    try { await trainingsAPI.start(id); load(); } catch (e) { alert('Xato'); }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Trainingni tugallangan deb belgilaysizmi?')) return;
    try { await trainingsAPI.complete(id); load(); } catch (e) { alert('Xato'); }
  };

  const filtered = filter ? trainings.filter(t => t.status === filter) : trainings;

  const statusInfo = {
    COMPLETED: { label: 'Tugallangan', cls: 'badge-green', icon: <CheckCircle size={14} color="var(--success)" /> },
    IN_PROGRESS: { label: 'Jarayonda', cls: 'badge-blue', icon: <Clock size={14} color="var(--blue-500)" /> },
    OVERDUE: { label: 'Kechikkan', cls: 'badge-red', icon: <AlertCircle size={14} color="var(--danger)" /> },
    NOT_STARTED: { label: 'Boshlanmagan', cls: 'badge-gray', icon: null },
    CANCELLED: { label: 'Bekor', cls: 'badge-gray', icon: null }
  };

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Traininglarim</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Jami {trainings.length} ta training</p>
        </div>
        <select className="form-input" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Barcha holat</option>
          <option value="NOT_STARTED">Boshlanmagan</option>
          <option value="IN_PROGRESS">Jarayonda</option>
          <option value="COMPLETED">Tugallangan</option>
          <option value="OVERDUE">Kechikkan</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">Training yo'q</div>
        </div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(t => {
            const si = statusInfo[t.status] || statusInfo.NOT_STARTED;
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED';
            return (
              <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className={`badge ${si.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {si.icon}{si.label}
                  </span>
                  {t.is_required && <span className="badge badge-blue">Majburiy</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 6, flex: 1 }}>
                  {t.training?.training_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  {t.training?.content_type} {t.training?.duration_minutes ? `• ${t.training.duration_minutes} daq` : ''}
                </div>
                {t.due_date && (
                  <div style={{ fontSize: 12, color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)', marginBottom: 10, fontWeight: isOverdue ? 600 : 400 }}>
                    {isOverdue ? '⚠️ Muddati o\'tdi: ' : '📅 Muddat: '}
                    {new Date(t.due_date).toLocaleDateString('uz-UZ')}
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span>Progress</span><span style={{ fontWeight: 600 }}>{t.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${t.progress}%`,
                      background: t.status === 'COMPLETED' ? 'var(--success)' : t.status === 'OVERDUE' ? 'var(--danger)' : undefined
                    }} />
                  </div>
                </div>
                {t.status === 'NOT_STARTED' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStart(t.id)} style={{ justifyContent: 'center' }}>
                    <Play size={13} /> Boshlash
                  </button>
                )}
                {t.status === 'IN_PROGRESS' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleComplete(t.id)} style={{ justifyContent: 'center', background: 'var(--success)' }}>
                    <Check size={13} /> Tugalladim
                  </button>
                )}
                {t.status === 'COMPLETED' && (
                  <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--success)', fontWeight: 600 }}>
                    ✅ {t.completed_at ? new Date(t.completed_at).toLocaleDateString('uz-UZ') : 'Tugallandi'}
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
