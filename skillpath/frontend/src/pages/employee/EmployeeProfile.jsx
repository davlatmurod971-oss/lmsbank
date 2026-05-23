import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeesAPI, feedbackAPI } from '../../utils/api';

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employee?.id) { setLoading(false); return; }
    Promise.all([
      employeesAPI.getById(user.employee.id),
      feedbackAPI.getByEmployee(user.employee.id)
    ]).then(([p, f]) => {
      setProfile(p.data);
      setFeedback(f.data.feedback || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  const { employee, skillGaps } = profile || {};

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Profilim</h2>
      </div>

      {employee && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div className="avatar avatar-lg">{employee.full_name?.charAt(0)}</div>
              <div>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700 }}>{employee.full_name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{employee.employee_role || '—'}</div>
              </div>
            </div>
            {[
              ['Xodim kodi', employee.employee_code],
              ['Filial', employee.branch?.branch_name],
              ['Bo\'lim', employee.department?.department_name],
              ['Career Track', employee.career_track?.track_name],
              ['Joriy daraja', employee.current_level?.level_name],
              ['Menejer', employee.manager?.full_name],
              ['Ishga kirgan', employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('uz-UZ') : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{val || '—'}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Ko'nikmalarim</div>
            {skillGaps?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Ko'nikma ma'lumoti yo'q</p>
            ) : skillGaps?.map((sg, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{sg.skill?.skill_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: sg.passed ? 'var(--success)' : 'var(--danger)' }}>
                    {sg.currentScore} / {sg.requiredScore}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((sg.currentScore / sg.requiredScore) * 100, 100)}%`, background: sg.passed ? 'var(--success)' : undefined }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Manager Feedbacklari ({feedback.length})</div>
        {feedback.length === 0 ? (
          <div className="empty-state"><p>Hali feedback yo'q</p></div>
        ) : feedback.map(fb => (
          <div key={fb.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{fb.manager?.full_name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{new Date(fb.created_at).toLocaleDateString('uz-UZ')}</div>
            </div>
            {fb.rating && <div style={{ marginBottom: 4 }}>{'⭐'.repeat(fb.rating)}</div>}
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)' }}>{fb.feedback_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
