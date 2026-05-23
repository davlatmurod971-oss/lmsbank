import { useState, useEffect } from 'react';
import { trainingsAPI } from '../../utils/api';
import { X, BookOpen } from 'lucide-react';

export default function AssignTrainingModal({ employeeId, onClose, onSuccess }) {
  const [trainings, setTrainings] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trainingsAPI.getAll({ search }).then(r => setTrainings(r.data.trainings || [])).catch(() => {});
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { setError('Training tanlang'); return; }
    setError('');
    setLoading(true);
    try {
      await trainingsAPI.assign({ employeeId, trainingId: selected, dueDate: dueDate || undefined, isRequired });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const selectedTraining = trainings.find(t => t.id === selected);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} color="var(--blue-600)" />
            </div>
            <div className="modal-title">Training Tayinlash</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Training qidirish</label>
              <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom bo'yicha qidiring..." />
            </div>

            <div className="form-group">
              <label className="form-label">Training tanlang *</label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 10 }}>
                {trainings.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Training topilmadi</div>
                ) : trainings.map(t => (
                  <div key={t.id}
                    onClick={() => setSelected(t.id)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      background: selected === t.id ? 'var(--blue-50)' : 'transparent',
                      borderLeft: selected === t.id ? '3px solid var(--blue-500)' : '3px solid transparent',
                      transition: 'all 0.1s'
                    }}>
                    <div style={{ fontSize: 13.5, fontWeight: selected === t.id ? 600 : 400, color: selected === t.id ? 'var(--blue-700)' : 'var(--text-primary)' }}>
                      {t.training_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {t.content_type} {t.duration_minutes ? `• ${t.duration_minutes} daq` : ''} {t.is_compliance_required ? '• 🔒 Compliance' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTraining && (
              <div style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue-700)' }}>Tanlangan:</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--blue-800)' }}>{selectedTraining.training_name}</div>
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Muddat</label>
                <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 28 }}>
                <input type="checkbox" id="isRequired" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} />
                <label htmlFor="isRequired" style={{ fontSize: 13.5, cursor: 'pointer' }}>Majburiy</label>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !selected}>
            {loading ? <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)', width: 16, height: 16 }} />Tayinlanmoqda...</> : 'Tayinlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
