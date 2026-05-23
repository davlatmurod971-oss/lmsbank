// ManagerDashboard.jsx
import { useState, useEffect } from 'react';
import { employeesAPI } from '../../utils/api';
import { Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    employeesAPI.getAll({ limit: 50 })
      .then(r => setEmployees(r.data.employees || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  const active = employees.filter(e => e.employment_status === 'ACTIVE').length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Manager Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Jamoa holati va taraqqiyoti</p>
      </div>

      <div className="metric-grid">
        {[
          { icon: <Users size={20} />, label: 'Jamoa a\'zolari', value: employees.length, color: '#2563EB', bg: '#EFF6FF' },
          { icon: <CheckCircle size={20} />, label: 'Faol xodimlar', value: active, color: '#10B981', bg: '#D1FAE5' },
        ].map((m, i) => (
          <div key={i} className="metric-card" style={{ '--metric-color': m.color }}>
            <div className="metric-icon" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Jamoa a'zolari</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/manager/team')}>Barchasi</button>
        </div>
        <table>
          <thead>
            <tr><th>Xodim</th><th>Career Track</th><th>Daraja</th><th>Holati</th></tr>
          </thead>
          <tbody>
            {employees.slice(0, 8).map(emp => (
              <tr key={emp.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm">{emp.full_name?.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.full_name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{emp.employee_role || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{emp.career_track?.track_name || '—'}</td>
                <td style={{ fontSize: 13 }}>{emp.current_level?.level_name || '—'}</td>
                <td><span className={`badge ${emp.employment_status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{emp.employment_status === 'ACTIVE' ? 'Faol' : 'Nofaol'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
