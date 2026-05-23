// HRReports.jsx
import { useState, useEffect } from 'react';
import { reportsAPI } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function HRReports() {
  const [trainingData, setTrainingData] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsAPI.trainingCompletion(), reportsAPI.promotionPipeline()])
      .then(([t, p]) => {
        setTrainingData(t.data);
        setPipeline(p.data.pipeline || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  const pieData = trainingData ? [
    { name: 'Tugallangan', value: trainingData.summary.completed, color: '#10B981' },
    { name: 'Jarayonda', value: trainingData.summary.inProgress, color: '#3B82F6' },
    { name: 'Kechikkan', value: trainingData.summary.overdue, color: '#EF4444' },
    { name: 'Boshlanmagan', value: trainingData.summary.notStarted, color: '#94A3B8' },
  ] : [];

  const readinessColors = {
    READY_FOR_DISCUSSION: '#10B981', ALMOST_READY: '#3B82F6',
    IN_PROGRESS: '#F59E0B', NOT_READY: '#EF4444'
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Hisobotlar va Analitika</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Tizim statistikasi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Training Summary */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Training bajarilishi</div>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>Umumiy holat</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue-600)' }}>{trainingData?.completionRate}%</div>
                <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>BAJARILDI</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{d.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Jami</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{trainingData?.summary.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Promotion Stats */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Promotion Pipeline</div>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>Tayyor bo'lish darajasi</div>
          {pipeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={pipeline.slice(0, 8).map(p => ({ name: p.employee?.full_name?.split(' ')[0], score: p.readiness_score }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Ball']} />
                <Bar dataKey="score" fill="var(--blue-500)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Ma'lumot yo'q</p></div>}
        </div>
      </div>

      {/* Detailed promotion table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Promotion pipeline xodimlar ro'yxati</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Xodim</th>
              <th>Filial</th>
              <th>Holat</th>
              <th>Ball</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.length === 0 ? (
              <tr><td colSpan={4}><div className="empty-state"><p>Ma'lumot yo'q</p></div></td></tr>
            ) : pipeline.map((p, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm">{p.employee?.full_name?.charAt(0)}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.employee?.full_name}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{p.employee?.branch?.branch_name || '—'}</td>
                <td>
                  <span className={`badge ${
                    p.status === 'APPROVED' ? 'badge-green' :
                    p.status === 'READY_FOR_DISCUSSION' ? 'badge-blue' :
                    p.status === 'DRAFT' ? 'badge-gray' : 'badge-red'
                  }`}>{p.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${p.readiness_score}%`, background: readinessColors[p.status] || 'var(--blue-500)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{p.readiness_score}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
