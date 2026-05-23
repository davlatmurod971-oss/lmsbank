// EmployeeLearningPath.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeesAPI } from '../../utils/api';
import { CheckCircle, Clock, Target } from 'lucide-react';

export default function EmployeeLearningPath() {
  const { user } = useAuth();
  const [lp, setLp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employee?.id) { setLoading(false); return; }
    employeesAPI.getLearningPath(user.employee.id)
      .then(r => setLp(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!lp?.targetLevel) return (
    <div className="card"><div className="empty-state">
      <div className="empty-state-icon">🎯</div>
      <div className="empty-state-title">Career track tayinlanmagan</div>
      <div className="empty-state-desc">HR career trackingizni tayinlashini kuting</div>
    </div></div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>O'quv Yo'lim</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
          {lp.currentLevel?.level_name} → {lp.targetLevel?.level_name}
        </p>
      </div>

      {/* Progress card */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-700), var(--blue-500))', borderRadius: 14, padding: '20px 24px', marginBottom: 20, color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Maqsad</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{lp.targetLevel?.level_name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{lp.progress || 0}%</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>bajarildi</div>
          </div>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'white', borderRadius: 4, width: `${lp.progress || 0}%`, transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>{lp.completedCount} / {lp.totalRequired} training bajarildi</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Trainings */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>
            <BookOpenIcon /> Traininglar
          </div>
          {lp.trainingPath?.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Talab yo'q</p> :
            lp.trainingPath?.map((tp, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                {tp.isCompleted ? <CheckCircle size={16} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} /> : <Clock size={16} color="var(--text-tertiary)" style={{ marginTop: 2, flexShrink: 0 }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{tp.training?.training_name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {tp.is_required ? 'Majburiy' : 'Ixtiyoriy'}
                    {tp.training?.duration_minutes ? ` • ${tp.training.duration_minutes} daq` : ''}
                  </div>
                  {tp.employeeTraining && !tp.isCompleted && (
                    <div style={{ marginTop: 4 }}>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${tp.employeeTraining.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>

        {/* Skill gaps */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>
            <Target size={16} style={{ display: 'inline', marginRight: 6 }} />Ko'nikma farqlari
          </div>
          {lp.skillGaps?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--success)' }}>✅ Barcha ko'nikmalar to'ldirilgan!</div>
          ) : lp.skillGaps?.map((sg, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{sg.skill?.skill_name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: sg.passed ? 'var(--success)' : 'var(--danger)' }}>
                  {sg.currentScore} / {sg.requiredScore}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${Math.min((sg.currentScore / sg.requiredScore) * 100, 100)}%`,
                  background: sg.passed ? 'var(--success)' : undefined
                }} />
              </div>
              {!sg.passed && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>Farq: {sg.gap} ball</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookOpenIcon() {
  return <span style={{ display: 'inline', marginRight: 6 }}>📚</span>;
}
