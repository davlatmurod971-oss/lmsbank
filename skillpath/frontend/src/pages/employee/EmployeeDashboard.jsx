import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeesAPI } from '../../utils/api';
import { BookOpen, Target, Award, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.employee?.id) { setLoading(false); return; }
    Promise.all([
      employeesAPI.getById(user.employee.id),
      employeesAPI.getLearningPath(user.employee.id)
    ]).then(([p, lp]) => {
      setProfile(p.data);
      setLearningPath(lp.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  if (!user?.employee?.id) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Xush kelibsiz, {user?.fullName}!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>HR sizga ma'lumotlar kiritgandan so'ng dashboard ko'rsatiladi.</p>
      </div>
    );
  }

  const { employee, trainingStats, promotionReadiness } = profile || {};
  const lp = learningPath;

  return (
    <div>
      {/* Welcome card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--blue-700) 0%, var(--blue-500) 100%)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: 'white',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>Xush kelibsiz</div>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{employee?.full_name}</h2>
        <div style={{ fontSize: 13.5, opacity: 0.8 }}>
          {employee?.employee_role || 'Lavozim belgilanmagan'} • {employee?.career_track?.track_name || 'Career track yo\'q'}
        </div>
        {employee?.current_level && (
          <div style={{ marginTop: 12, display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 14px', fontSize: 12.5, fontWeight: 600 }}>
            📍 {employee.current_level.level_name}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { icon: <BookOpen size={20} />, label: 'Traininglar', value: trainingStats?.total || 0, color: '#2563EB', bg: '#EFF6FF' },
          { icon: <CheckCircle size={20} />, label: 'Tugallangan', value: trainingStats?.completed || 0, color: '#10B981', bg: '#D1FAE5' },
          { icon: <AlertCircle size={20} />, label: 'Kechikkan', value: trainingStats?.overdue || 0, color: '#EF4444', bg: '#FEE2E2' },
        ].map((m, i) => (
          <div key={i} className="metric-card" style={{ '--metric-color': m.color }}>
            <div className="metric-icon" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Learning path progress */}
      {lp?.targetLevel && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">O'quv yo'li progressi</div>
              <div className="card-subtitle">{lp.currentLevel?.level_name} → {lp.targetLevel?.level_name}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/learning-path')}>Ko'rish</button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>Umumiy progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue-600)' }}>{lp.progress || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${lp.progress || 0}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <span>✅ {lp.completedCount} tugallangan</span>
            <span>📚 {lp.totalRequired - lp.completedCount} qolgan</span>
          </div>
        </div>
      )}

      {/* Promotion readiness */}
      {promotionReadiness && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Promotion Tayyor</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: `conic-gradient(var(--blue-500) ${promotionReadiness.totalScore * 3.6}deg, var(--surface-3) 0deg)`
            }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue-600)' }}>{promotionReadiness.totalScore}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {promotionReadiness.status === 'READY_FOR_DISCUSSION' ? '🎉 Promotion muhokamaga tayyorsiz!' :
                 promotionReadiness.status === 'ALMOST_READY' ? '⏳ Deyarli tayyorsiz' :
                 promotionReadiness.status === 'IN_PROGRESS' ? '📈 Maqsad tomon rivojlanmoqdasiz' :
                 '💪 Rivojlanishni davom ettiring'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Training, ko'nikmalar va feedback baholanmoqda</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
