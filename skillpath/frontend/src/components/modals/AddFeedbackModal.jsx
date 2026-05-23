import { useState, useEffect } from 'react';
import { feedbackAPI, skillsAPI } from '../../utils/api';
import { X, MessageSquare } from 'lucide-react';

export default function AddFeedbackModal({ employeeId, onClose, onSuccess }) {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({
    skillId: '',
    feedbackText: '',
    evidenceText: '',
    rating: 4,
    recommendation: 'CONTINUE_DEVELOPMENT'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    skillsAPI.getAll().then(r => setSkills(r.data.skills || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.recommendation === 'READY_FOR_DISCUSSION' && !form.evidenceText.trim()) {
      setError('Promotion uchun dalil kiritilishi shart');
      return;
    }
    setLoading(true);
    try {
      await feedbackAPI.add(employeeId, { ...form, rating: parseInt(form.rating), skillId: form.skillId || undefined });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const recommendations = [
    { value: 'CONTINUE_DEVELOPMENT', label: 'Rivojlanishni davom ettir', color: '#2563EB' },
    { value: 'READY_FOR_DISCUSSION', label: 'Promotion muhokamaga tayyor', color: '#10B981' },
    { value: 'NEEDS_MORE_EVIDENCE', label: "Ko'proq dalil kerak", color: '#F59E0B' },
    { value: 'NOT_READY', label: 'Hali tayyor emas', color: '#EF4444' },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} color="var(--blue-600)" />
            </div>
            <div className="modal-title">Feedback Qo'shish</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ko'nikma (ixtiyoriy)</label>
                <select className="form-input" value={form.skillId} onChange={e => setForm(p => ({ ...p, skillId: e.target.value }))}>
                  <option value="">Umumiy feedback</option>
                  {skills.map(s => <option key={s.id} value={s.id}>{s.skill_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reyting</label>
                <div style={{ display: 'flex', gap: 4, paddingTop: 8 }}>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(p => ({ ...p, rating: r }))}
                      style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', opacity: r <= form.rating ? 1 : 0.3, transition: 'opacity 0.15s' }}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tavsiya *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {recommendations.map(r => (
                  <button key={r.value} type="button"
                    onClick={() => setForm(p => ({ ...p, recommendation: r.value }))}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: `2px solid ${form.recommendation === r.value ? r.color : 'var(--border)'}`,
                      background: form.recommendation === r.value ? `${r.color}12` : 'white',
                      color: form.recommendation === r.value ? r.color : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                    }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Feedback matni *</label>
              <textarea className="form-input" style={{ minHeight: 100 }}
                value={form.feedbackText}
                onChange={e => setForm(p => ({ ...p, feedbackText: e.target.value }))}
                required placeholder="Xodimning faoliyati, ko'nikmalar rivojlanishi haqida batafsil yozing..." />
            </div>

            {form.recommendation === 'READY_FOR_DISCUSSION' && (
              <div className="form-group">
                <label className="form-label">Dalil (majburiy) *</label>
                <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12.5, color: 'var(--blue-700)' }}>
                  💡 Promotion tavsiyasi uchun aniq dalillar va misollar ko'rsating
                </div>
                <textarea className="form-input" style={{ minHeight: 80 }}
                  value={form.evidenceText}
                  onChange={e => setForm(p => ({ ...p, evidenceText: e.target.value }))}
                  placeholder="Masalan: 3 oyda KYC compliance 100% bajarildi, 5 ta yangi mijoz jalb qilindi..." />
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)', width: 16, height: 16 }} />Saqlanmoqda...</> : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
