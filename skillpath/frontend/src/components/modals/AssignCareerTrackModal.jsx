import { useState, useEffect } from 'react';
import { careerTracksAPI, employeesAPI } from '../../utils/api';
import { X, GitBranch } from 'lucide-react';

export default function AssignCareerTrackModal({ employeeId, onClose, onSuccess }) {
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [trackDetail, setTrackDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    careerTracksAPI.getAll().then(r => setTracks(r.data.careerTracks || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTrack) { setTrackDetail(null); setSelectedLevel(''); return; }
    careerTracksAPI.getById(selectedTrack).then(r => {
      setTrackDetail(r.data.careerTrack);
      setSelectedLevel('');
    }).catch(() => {});
  }, [selectedTrack]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrack || !selectedLevel) { setError('Career track va darajani tanlang'); return; }
    setError('');
    setLoading(true);
    try {
      await employeesAPI.assignCareerTrack(employeeId, { careerTrackId: selectedTrack, levelId: selectedLevel });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const levels = (trackDetail?.career_levels || []).sort((a, b) => a.level_order - b.level_order);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={18} color="var(--blue-600)" />
            </div>
            <div className="modal-title">Career Track Tayinlash</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Career Track *</label>
            <select className="form-input" value={selectedTrack} onChange={e => setSelectedTrack(e.target.value)}>
              <option value="">Career trackni tanlang</option>
              {tracks.map(t => (
                <option key={t.id} value={t.id}>{t.track_name} {t.department ? `(${t.department.department_name})` : ''}</option>
              ))}
            </select>
          </div>

          {selectedTrack && (
            <div className="form-group">
              <label className="form-label">Joriy daraja *</label>
              {levels.length === 0 ? (
                <div className="alert alert-warning">Bu trackda darajalar yo'q. Avval darajalar qo'shing.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {levels.map(level => (
                    <div key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${selectedLevel === level.id ? 'var(--blue-500)' : 'var(--border)'}`,
                        background: selectedLevel === level.id ? 'var(--blue-50)' : 'white',
                        transition: 'all 0.15s'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: selectedLevel === level.id ? 'var(--blue-500)' : 'var(--surface-3)',
                          color: selectedLevel === level.id ? 'white' : 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all 0.15s'
                        }}>
                          {level.level_order}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: selectedLevel === level.id ? 'var(--blue-700)' : 'var(--text-primary)' }}>
                            {level.level_name}
                          </div>
                          {level.description && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{level.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedLevel && trackDetail && (
            <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 6 }}>
                ℹ️ Tayinlash amalga oshirilganda avtomatik:
              </div>
              <ul style={{ fontSize: 12.5, color: 'var(--blue-800)', paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
                <li>Keyingi daraja uchun kerakli traininglar tayinlanadi</li>
                <li>O'quv yo'li yangilanadi</li>
              </ul>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !selectedTrack || !selectedLevel}>
            {loading
              ? <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)', width: 16, height: 16 }} />Tayinlanmoqda...</>
              : 'Tayinlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
