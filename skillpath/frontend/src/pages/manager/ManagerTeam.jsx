// ManagerTeam.jsx
import { useState, useEffect } from 'react';
import { employeesAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function ManagerTeam() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    employeesAPI.getAll({ limit: 100 })
      .then(r => setEmployees(r.data.employees || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Jamoam</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>{employees.length} ta xodim</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {employees.map(emp => (
          <div key={emp.id} className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="avatar">{emp.full_name?.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{emp.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{emp.employee_role || 'Lavozim yo\'q'}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {emp.career_track?.track_name || 'Career track yo\'q'} {emp.current_level ? `• ${emp.current_level.level_name}` : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{emp.branch?.branch_name || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
