import { useState, useEffect } from 'react';
import { trainingsAPI } from '../../utils/api';
import { Plus, BookOpen, Clock, Shield } from 'lucide-react';

const CONTENT_TYPES = ['VIDEO', 'DOCUMENT', 'QUIZ', 'TASK', 'COURSE', 'SIMULATION', 'MANAGER_REVIEW'];
const CATEGORIES = ['Compliance', 'Operations', 'Finance', 'Soft Skills', 'Security', 'Technical'];

export default function HRTrainings() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ trainingName: '', category: '', description: '', contentType: 'COURSE', durationMinutes: '', isComplianceRequired: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await trainingsAPI.getAll({ search });
      setTrainings(res.data.trainings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await trainingsAPI.create({ ...form, durationMinutes: parseInt(form.durationMinutes) || null });
      setShowAdd(false);
      setForm({ trainingName: '', category: '', description: '', contentType: 'COURSE', durationMinutes: '', isComplianceRequired: false });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Xato'); }
  };

  const contentTypeColors = { VIDEO: 'badge-blue', DOCUMENT: 'badge-gray', QUIZ: 'badge-yellow', TASK: 'badge-cyan', COURSE: 'badge-green', SIMULATION: 'badge-blue', MANAGER_REVIEW: 'badge-red' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Training Kutubxonasi</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Jami {trainings.length} ta training</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Yangi training</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Yangi Training</div>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Training nomi *</label>
                <input className="form-input" value={form.trainingName} onChange={e => setForm(p => ({ ...p, trainingName: e.target.value }))} required placeholder="Masalan: AML Basics" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategoriya</label>
                <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="">Tanlang</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kontent turi</label>
                <select className="form-input" value={form.contentType} onChange={e => setForm(p => ({ ...p, contentType: e.target.value }))}>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Davomiyligi (daqiqa)</label>
                <input className="form-input" type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: e.target.value }))} placeholder="60" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tavsif</label>
              <textarea className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="compliance" checked={form.isComplianceRequired} onChange={e => setForm(p => ({ ...p, isComplianceRequired: e.target.checked }))} />
              <label htmlFor="compliance" style={{ fontSize: 13.5, cursor: 'pointer' }}>Compliance training (majburiy)</label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Yaratish</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Bekor</button>
            </div>
          </form>
        </div>
      )}

      <div className="search-bar" style={{ marginBottom: 16 }}>
        <BookOpen size={16} color="var(--text-tertiary)" />
        <input placeholder="Training qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {trainings.map(t => (
            <div key={t.id} className="card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className={`badge ${contentTypeColors[t.content_type] || 'badge-gray'}`}>{t.content_type}</span>
                {t.is_compliance_required && <span className="badge badge-red"><Shield size={10} /> Compliance</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.4 }}>{t.training_name}</div>
              {t.description && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{t.description}</p>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
                {t.duration_minutes && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{t.duration_minutes} daq</span>}
                {t.category && <span>{t.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
