// ManagerFeedback.jsx
import { useState, useEffect } from 'react';
import { employeesAPI, feedbackAPI, skillsAPI } from '../../utils/api';

export default function ManagerFeedback() {
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [form, setForm] = useState({ skillId: '', feedbackText: '', evidenceText: '', rating: 5, recommendation: 'CONTINUE_DEVELOPMENT' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([employeesAPI.getAll({ limit: 100 }), skillsAPI.getAll()]).then(([e, s]) => {
      setEmployees(e.data.employees || []);
      setSkills(s.data.skills || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSubmitting(true);
    try {
      await feedbackAPI.add(selectedEmp, { ...form, rating: parseInt(form.rating) });
      setSuccess(true);
      setForm({ skillId: '', feedbackText: '', evidenceText: '', rating: 5, recommendation: 'CONTINUE_DEVELOPMENT' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { alert(err.response?.data?.error || 'Xato'); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Feedback Qo'shish</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Xodim ko'nikmalarini baholash</p>
      </div>

      {success && <div className="alert alert-success">✅ Feedback muvaffaqiyatli qo'shildi!</div>}

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Xodim *</label>
            <select className="form-input" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} required>
              <option value="">Xodimni tanlang</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Ko'nikma</label>
              <select className="form-input" value={form.skillId} onChange={e => setForm(p => ({ ...p, skillId: e.target.value }))}>
                <option value="">Umumiy feedback</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.skill_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reyting</label>
              <select className="form-input" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} ({r}/5)</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tavsiya *</label>
            <select className="form-input" value={form.recommendation} onChange={e => setForm(p => ({ ...p, recommendation: e.target.value }))}>
              <option value="CONTINUE_DEVELOPMENT">Rivojlanishni davom ettir</option>
              <option value="READY_FOR_DISCUSSION">Promotion muhokamaga tayyor</option>
              <option value="NEEDS_MORE_EVIDENCE">Ko'proq dalil kerak</option>
              <option value="NOT_READY">Hali tayyor emas</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Feedback matni *</label>
            <textarea className="form-input" style={{ minHeight: 100 }} value={form.feedbackText} onChange={e => setForm(p => ({ ...p, feedbackText: e.target.value }))} required placeholder="Xodimning ko'nikmalar bo'yicha batafsil fikringiz..." />
          </div>
          {form.recommendation === 'READY_FOR_DISCUSSION' && (
            <div className="form-group">
              <label className="form-label">Dalil (majburiy) *</label>
              <textarea className="form-input" style={{ minHeight: 80 }} value={form.evidenceText} onChange={e => setForm(p => ({ ...p, evidenceText: e.target.value }))} placeholder="Promotion uchun aniq dalillar va misolar..." required />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />Saqlanmoqda...</> : 'Feedback saqlash'}
          </button>
        </form>
      </div>
    </div>
  );
}
