// HRCareerTracks.jsx
import { useState, useEffect } from 'react';
import { careerTracksAPI, departmentsAPI, skillsAPI, trainingsAPI } from '../../utils/api';
import { Plus, ChevronDown, ChevronRight, GitBranch } from 'lucide-react';

export default function HRCareerTracks() {
  const [tracks, setTracks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ trackName: '', departmentId: '', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [tr, dep] = await Promise.all([careerTracksAPI.getAll(), departmentsAPI.getAll()]);
      setTracks(tr.data.careerTracks || []);
      setDepartments(dep.data.departments || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await careerTracksAPI.create(form);
      setShowAdd(false);
      setForm({ trackName: '', departmentId: '', description: '' });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Xato'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Career Tracks</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Kasbiy rivojlanish yo'nalishlari</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Yangi track</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Yangi Career Track</div>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Track nomi *</label>
                <input className="form-input" value={form.trackName} onChange={e => setForm(p => ({ ...p, trackName: e.target.value }))} required placeholder="Masalan: Teller Track" />
              </div>
              <div className="form-group">
                <label className="form-label">Bo'lim</label>
                <select className="form-input" value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                  <option value="">Bo'limni tanlang</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tavsif</label>
              <textarea className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Career track haqida qisqacha..." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Yaratish</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Bekor</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : tracks.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">🗂</div>
          <div className="empty-state-title">Career track yo'q</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>Birinchi trackni yarating</button>
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tracks.map(track => (
            <div key={track.id} className="card" style={{ padding: 0 }}>
              <button
                onClick={() => setExpanded(expanded === track.id ? null : track.id)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GitBranch size={18} color="var(--blue-600)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{track.track_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {track.department?.department_name || 'Bo\'lim belgilanmagan'} • {track.career_levels?.length || 0} ta daraja
                    </div>
                  </div>
                </div>
                {expanded === track.id ? <ChevronDown size={18} color="var(--text-tertiary)" /> : <ChevronRight size={18} color="var(--text-tertiary)" />}
              </button>

              {expanded === track.id && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                  {track.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0' }}>{track.description}</p>}
                  <div style={{ fontSize: 12.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-tertiary)', margin: '12px 0 8px' }}>DARAJALAR</div>
                  {(track.career_levels || []).sort((a, b) => a.level_order - b.level_order).map(level => (
                    <div key={level.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      background: 'var(--surface-2)', borderRadius: 8, marginBottom: 6
                    }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {level.level_order}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{level.level_name}</div>
                        {level.description && <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{level.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
