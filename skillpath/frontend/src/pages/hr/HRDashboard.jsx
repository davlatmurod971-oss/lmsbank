import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesAPI, reportsAPI, promotionAPI } from '../../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';

export default function HRDashboard() {
  const [stats, setStats] = useState(null);
  const [trainingReport, setTrainingReport] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, trainingRes, pipelineRes] = await Promise.all([
          employeesAPI.getAll({ limit: 5 }),
          reportsAPI.trainingCompletion(),
          reportsAPI.promotionPipeline()
        ]);
        setStats(empRes.data.pagination);
        setTrainingReport(trainingRes.data);
        setPipeline(pipelineRes.data.pipeline?.slice(0, 5) || []);
        setRecentEmployees(empRes.data.employees || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const trainingData = trainingReport ? [
    { name: 'Tugallangan', value: trainingReport.summary.completed, color: '#10B981' },
    { name: 'Jarayonda', value: trainingReport.summary.inProgress, color: '#3B82F6' },
    { name: 'Kechikkan', value: trainingReport.summary.overdue, color: '#EF4444' },
    { name: 'Boshlanmagan', value: trainingReport.summary.notStarted, color: '#94A3B8' },
  ] : [];

  const readinessLabels = {
    READY_FOR_DISCUSSION: { label: 'Tayyor', color: '#10B981' },
    ALMOST_READY: { label: 'Deyarli tayyor', color: '#3B82F6' },
    IN_PROGRESS: { label: 'Jarayonda', color: '#F59E0B' },
    NOT_READY: { label: 'Tayyor emas', color: '#EF4444' }
  };

  return (
    <div>
      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard
          icon={<Users size={20} />}
          label="Jami xodimlar"
          value={stats?.total || 0}
          color="#2563EB"
          bgColor="#EFF6FF"
        />
        <MetricCard
          icon={<BookOpen size={20} />}
          label="Training bajarilishi"
          value={`${trainingReport?.completionRate || 0}%`}
          color="#0891B2"
          bgColor="#ECFEFF"
        />
        <MetricCard
          icon={<AlertCircle size={20} />}
          label="Kechikkan traininglar"
          value={trainingReport?.summary.overdue || 0}
          color="#EF4444"
          bgColor="#FEF2F2"
        />
        <MetricCard
          icon={<Award size={20} />}
          label="Promotion pipeline"
          value={pipeline.length}
          color="#8B5CF6"
          bgColor="#F5F3FF"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Training status pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Training Holati</div>
              <div className="card-subtitle">Barcha tayinlangan traininglar</div>
            </div>
          </div>
          {trainingData.some(d => d.value > 0) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={trainingData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {trainingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {trainingData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state"><p>Ma'lumot yo'q</p></div>
          )}
        </div>

        {/* Promotion pipeline */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Promotion Pipeline</div>
              <div className="card-subtitle">Yuqori readiness ballari</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hr/promotion-packets')}>
              Barchasi <ChevronRight size={14} />
            </button>
          </div>
          {pipeline.length > 0 ? (
            <div>
              {pipeline.map((p, i) => {
                const ri = readinessLabels[p.status] || readinessLabels.NOT_READY;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: i < pipeline.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">
                        {p.employee?.full_name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.employee?.full_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{p.employee?.branch?.branch_name}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: ri.color }}>{p.readiness_score}%</div>
                      <div style={{ fontSize: 11, color: ri.color, fontWeight: 500 }}>{ri.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><p>Pipeline bo'sh</p></div>
          )}
        </div>
      </div>

      {/* Recent employees */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">So'nggi xodimlar</div>
            <div className="card-subtitle">Yangi qo'shilganlar</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/hr/employees')}>
            Barchasi ko'rish
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Xodim</th>
                <th>Filial</th>
                <th>Bo'lim</th>
                <th>Lavozim</th>
                <th>Holati</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>Xodimlar yo'q</td></tr>
              ) : recentEmployees.map(emp => (
                <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/hr/employees/${emp.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{emp.full_name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.full_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{emp.employee_code}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{emp.branch?.branch_name || '—'}</td>
                  <td style={{ fontSize: 13 }}>{emp.department?.department_name || '—'}</td>
                  <td style={{ fontSize: 13 }}>{emp.employee_role || '—'}</td>
                  <td>
                    <span className={`badge ${emp.employment_status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                      {emp.employment_status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color, bgColor }) {
  return (
    <div className="metric-card" style={{ '--metric-color': color }}>
      <div className="metric-icon" style={{ background: bgColor, color }}>
        {icon}
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
