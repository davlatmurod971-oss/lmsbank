import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeesAPI, feedbackAPI, promotionAPI, careerTracksAPI, trainingsAPI, skillsAPI } from '../../utils/api';
import { ArrowLeft, User, BookOpen, Target, MessageSquare, Award, Edit2, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import AddFeedbackModal from '../../components/modals/AddFeedbackModal';
import AssignTrainingModal from '../../components/modals/AssignTrainingModal';
import AssignCareerTrackModal from '../../components/modals/AssignCareerTrackModal';

const TABS = ['Profil', 'O\'quv yo\'li', 'Traininglar', 'Feedback', 'Promotion'];

export default function HREmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [packets, setPackets] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showCareerTrack, setShowCareerTrack] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [empRes, lpRes, trRes, fbRes, ppRes] = await Promise.all([
        employeesAPI.getById(id),
        employeesAPI.getLearningPath(id),
        employeesAPI.getTrainings(id),
        feedbackAPI.getByEmployee(id),
        promotionAPI.getAll()
      ]);
      setData(empRes.data);
      setLearningPath(lpRes.data);
      setTrainings(trRes.data.trainings || []);
      setFeedback(fbRes.data.feedback || []);
      setPackets((ppRes.data.packets || []).filter(p => p.employee_id === id));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!data) return <div className="empty-state"><p>Xodim topilmadi</p></div>;

  const { employee, trainingStats, skillGaps, promotionReadiness } = data;

  const readinessColor = {
    READY_FOR_DISCUSSION: 'var(--success)',
    ALMOST_READY: 'var(--blue-500)',
    IN_PROGRESS: 'var(--warning)',
    NOT_READY: 'var(--danger)'
  };

  const trainingStatusIcon = {
    COMPLETED: <CheckCircle size={16} color="var(--success)" />,
    IN_PROGRESS: <Clock size={16} color="var(--blue-500)" />,
    OVERDUE: <AlertCircle size={16} color="var(--danger)" />,
    NOT_STARTED: <XCircle size={16} color="var(--text-tertiary)" />,
  };

  return (
    <div>
      {/* Back button + header */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hr/employees')} style={{ marginBottom: 12 }}>
          <ArrowLeft size={16} /> Orqaga
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar avatar-lg">{employee.full_name?.charAt(0)}</div>
            <div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>{employee.full_name}</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--blue-50)', color: 'var(--blue-700)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  {employee.employee_code}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{employee.employee_role || 'Lavozim yo\'q'}</span>
                <span className={`badge ${employee.employment_status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                  {employee.employment_status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCareerTrack(true)}>
              <Target size={14} /> Career Track
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowTraining(true)}>
              <BookOpen size={14} /> Training qo'shish
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowFeedback(true)}>
              <MessageSquare size={14} /> Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Jami traininglar', value: trainingStats?.total || 0, color: 'var(--blue-600)' },
          { label: 'Tugallangan', value: trainingStats?.completed || 0, color: 'var(--success)' },
          { label: 'Kechikkan', value: trainingStats?.overdue || 0, color: 'var(--danger)' },
          {
            label: 'Promotion ballari',
            value: promotionReadiness ? `${promotionReadiness.totalScore}%` : '—',
            color: promotionReadiness ? readinessColor[promotionReadiness.status] : 'var(--text-tertiary)'
          }
        ].map((m, i) => (
          <div key={i} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Sora,sans-serif', color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Tab: Profile */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Asosiy ma'lumotlar</div>
            {[
              ['Filial', employee.branch?.branch_name],
              ['Bo\'lim', employee.department?.department_name],
              ['Career Track', employee.career_track?.track_name],
              ['Joriy daraja', employee.current_level?.level_name],
              ['Menejer', employee.manager?.full_name],
              ['Ishga kirgan sana', employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('uz-UZ') : '—'],
              ['Email', employee.user?.email],
              ['Oxirgi kirish', employee.user?.last_login_at ? new Date(employee.user.last_login_at).toLocaleString('uz-UZ') : '—']
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{val || '—'}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Promotion Tayyor</div>
            {promotionReadiness ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'Sora,sans-serif', color: readinessColor[promotionReadiness.status] }}>
                    {promotionReadiness.totalScore}%
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {promotionReadiness.status === 'READY_FOR_DISCUSSION' ? '🎉 Muhokamaga tayyor' :
                     promotionReadiness.status === 'ALMOST_READY' ? '⏳ Deyarli tayyor' :
                     promotionReadiness.status === 'IN_PROGRESS' ? '📈 Rivojlanmoqda' : '⚠️ Hali tayyor emas'}
                  </div>
                </div>
                {Object.entries(promotionReadiness.breakdown).map(([key, val]) => {
                  const labels = {
                    trainingScore: 'Training (30%)',
                    skillScore: 'Ko\'nikmalar (35%)',
                    complianceScore: 'Compliance (15%)',
                    feedbackScore: 'Feedback (10%)',
                    evidenceScore: 'Dalil (10%)'
                  };
                  const maxes = { trainingScore: 30, skillScore: 35, complianceScore: 15, feedbackScore: 10, evidenceScore: 10 };
                  return (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5 }}>{labels[key]}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{val}/{maxes[key]}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(val / maxes[key]) * 100}%`, background: val >= maxes[key] * 0.8 ? 'var(--success)' : 'var(--blue-500)' }} />
                      </div>
                    </div>
                  );
                })}
                <button className="btn btn-primary w-full" style={{ marginTop: 16, justifyContent: 'center' }}
                  onClick={() => promotionAPI.generate({ employeeId: id, targetLevelId: learningPath?.targetLevel?.id }).then(load)}>
                  <Award size={15} /> Promotion Packet yaratish
                </button>
              </>
            ) : <div className="empty-state"><p>Career track tayinlanmagan</p></div>}
          </div>
        </div>
      )}

      {/* Tab: Learning Path */}
      {tab === 1 && (
        <div>
          {!learningPath?.learningPath && !learningPath?.targetLevel ? (
            <div className="card"><div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-title">Career track tayinlanmagan</div>
              <div className="empty-state-desc">Xodimga career track tayinlang</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCareerTrack(true)}>
                Career Track tayinlash
              </button>
            </div></div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Joriy daraja</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{learningPath.currentLevel?.level_name || '—'}</div>
                  </div>
                  <div style={{ fontSize: 24, color: 'var(--text-tertiary)' }}>→</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Maqsad daraja</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue-600)' }}>{learningPath.targetLevel?.level_name || '—'}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>Umumiy progress</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{learningPath.progress || 0}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 10 }}>
                    <div className="progress-fill" style={{ width: `${learningPath.progress || 0}%` }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 14 }}>Traininglar ({learningPath.completedCount}/{learningPath.totalRequired})</div>
                  {learningPath.trainingPath?.map((tp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      {tp.isCompleted ? <CheckCircle size={16} color="var(--success)" /> : <Clock size={16} color="var(--text-tertiary)" />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{tp.training?.training_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {tp.is_required ? 'Majburiy' : 'Ixtiyoriy'} • {tp.training?.duration_minutes} daqiqa
                        </div>
                      </div>
                      {tp.isCompleted && <span className="badge badge-green" style={{ fontSize: 10 }}>Tugallandi</span>}
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 14 }}>Ko'nikma farqlari</div>
                  {learningPath.skillGaps?.length === 0 ? (
                    <div className="empty-state"><p>Barcha ko'nikmalar to'ldirilgan ✅</p></div>
                  ) : learningPath.skillGaps?.map((sg, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{sg.skill?.skill_name}</span>
                        <span style={{ fontSize: 12.5, color: sg.passed ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                          {sg.currentScore}/{sg.requiredScore}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill"
                          style={{
                            width: `${Math.min((sg.currentScore / sg.requiredScore) * 100, 100)}%`,
                            background: sg.passed ? 'var(--success)' : 'var(--blue-500)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Trainings */}
      {tab === 2 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Barcha traininglar ({trainings.length})</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowTraining(true)}>
              <BookOpen size={14} /> Training qo'shish
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Training</th>
                <th>Turi</th>
                <th>Muddat</th>
                <th>Progress</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {trainings.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><p>Traininglar yo'q</p></div></td></tr>
              ) : trainings.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{t.training?.training_name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{t.training?.content_type}</div>
                  </td>
                  <td><span className={`badge ${t.is_required ? 'badge-blue' : 'badge-gray'}`}>{t.is_required ? 'Majburiy' : 'Ixtiyoriy'}</span></td>
                  <td style={{ fontSize: 12.5 }}>
                    {t.due_date ? (
                      <span style={{ color: new Date(t.due_date) < new Date() && t.status !== 'COMPLETED' ? 'var(--danger)' : 'inherit' }}>
                        {new Date(t.due_date).toLocaleDateString('uz-UZ')}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ width: 100 }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${t.progress}%` }} /></div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{t.progress}%</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {trainingStatusIcon[t.status]}
                      <span style={{ fontSize: 12.5 }}>
                        {t.status === 'COMPLETED' ? 'Tugallandi' : t.status === 'IN_PROGRESS' ? 'Jarayonda' : t.status === 'OVERDUE' ? 'Kechikkan' : 'Boshlanmagan'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Feedback */}
      {tab === 3 && (
        <div>
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowFeedback(true)}>
              <MessageSquare size={14} /> Feedback qo'shish
            </button>
          </div>
          {feedback.length === 0 ? (
            <div className="card"><div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-title">Feedback yo'q</div>
            </div></div>
          ) : feedback.map(fb => {
            const recColors = {
              READY_FOR_DISCUSSION: 'badge-green',
              CONTINUE_DEVELOPMENT: 'badge-blue',
              NEEDS_MORE_EVIDENCE: 'badge-yellow',
              NOT_READY: 'badge-red'
            };
            const recLabels = {
              READY_FOR_DISCUSSION: 'Muhokamaga tayyor',
              CONTINUE_DEVELOPMENT: 'Rivojlanishni davom ettir',
              NEEDS_MORE_EVIDENCE: 'Ko\'proq dalil kerak',
              NOT_READY: 'Tayyor emas'
            };
            return (
              <div key={fb.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="avatar avatar-sm">{fb.manager?.full_name?.charAt(0) || 'M'}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{fb.manager?.full_name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{new Date(fb.created_at).toLocaleDateString('uz-UZ')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {fb.skill && <span className="badge badge-blue">{fb.skill.skill_name}</span>}
                    {fb.recommendation && <span className={`badge ${recColors[fb.recommendation] || 'badge-gray'}`}>{recLabels[fb.recommendation]}</span>}
                    {fb.rating && <span style={{ fontSize: 13, fontWeight: 700 }}>⭐ {fb.rating}/5</span>}
                  </div>
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: fb.evidence_text ? 10 : 0 }}>{fb.feedback_text}</p>
                {fb.evidence_text && (
                  <div style={{ background: 'var(--blue-50)', borderLeft: '3px solid var(--blue-400)', padding: '8px 12px', borderRadius: '0 6px 6px 0', fontSize: 13 }}>
                    <strong>Dalil:</strong> {fb.evidence_text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Promotion */}
      {tab === 4 && (
        <div>
          {packets.length === 0 ? (
            <div className="card"><div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Promotion packet yo'q</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }}
                onClick={() => learningPath?.targetLevel && promotionAPI.generate({ employeeId: id, targetLevelId: learningPath.targetLevel.id }).then(load)}>
                Packet yaratish
              </button>
            </div></div>
          ) : packets.map(p => (
            <div key={p.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.current_level?.level_name} → {p.target_level?.level_name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Yaratildi: {new Date(p.created_at).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>{p.readiness_score}%</div>
                  <span className={`badge ${
                    p.status === 'APPROVED' ? 'badge-green' :
                    p.status === 'READY_FOR_DISCUSSION' ? 'badge-blue' :
                    p.status === 'DRAFT' ? 'badge-gray' : 'badge-red'
                  }`}>{p.status}</span>
                </div>
              </div>
              {p.summary && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{p.summary}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                {['READY_FOR_DISCUSSION', 'APPROVED', 'NOT_READY', 'REVIEW_LATER'].map(s => (
                  <button key={s} className="btn btn-secondary btn-sm"
                    onClick={() => promotionAPI.updateStatus(p.id, { status: s }).then(load)}>
                    {s === 'READY_FOR_DISCUSSION' ? 'Muhokamaga' : s === 'APPROVED' ? 'Tasdiqlash' : s === 'NOT_READY' ? 'Tayyor emas' : 'Keyinroq'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showFeedback && <AddFeedbackModal employeeId={id} onClose={() => setShowFeedback(false)} onSuccess={() => { setShowFeedback(false); load(); }} />}
      {showTraining && <AssignTrainingModal employeeId={id} onClose={() => setShowTraining(false)} onSuccess={() => { setShowTraining(false); load(); }} />}
      {showCareerTrack && <AssignCareerTrackModal employeeId={id} onClose={() => setShowCareerTrack(false)} onSuccess={() => { setShowCareerTrack(false); load(); }} />}
    </div>
  );
}
