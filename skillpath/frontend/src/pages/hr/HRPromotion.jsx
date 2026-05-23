// HRPromotion.jsx
import { useState, useEffect } from 'react';
import { promotionAPI } from '../../utils/api';
import { Award, ChevronRight } from 'lucide-react';

export function HRPromotion() {
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await promotionAPI.getAll();
      setPackets(res.data.packets || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const statusMap = {
    DRAFT: { label: 'Qoralama', cls: 'badge-gray' },
    READY_FOR_DISCUSSION: { label: 'Muhokamaga tayyor', cls: 'badge-blue' },
    APPROVED: { label: 'Tasdiqlangan', cls: 'badge-green' },
    NOT_READY: { label: 'Tayyor emas', cls: 'badge-red' },
    REVIEW_LATER: { label: 'Keyinroq', cls: 'badge-yellow' }
  };

  const filtered = filter ? packets.filter(p => p.status === filter) : packets;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Promotion Packets</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Jami {packets.length} ta packet</p>
        </div>
        <select className="form-input" style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Barcha holat</option>
          {Object.entries(statusMap).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Promotion packet yo'q</div>
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => {
            const s = statusMap[p.status] || statusMap.DRAFT;
            return (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar">{p.employee?.full_name?.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.employee?.full_name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        {p.current_level?.level_name} → {p.target_level?.level_name} • {p.employee?.branch?.branch_name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{new Date(p.created_at).toLocaleDateString('uz-UZ')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue-600)' }}>{p.readiness_score}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tayyor</div>
                    </div>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {['APPROVED', 'NOT_READY', 'REVIEW_LATER'].map(st => (
                        <button key={st} className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
                          onClick={() => promotionAPI.updateStatus(p.id, { status: st }).then(load)}>
                          {st === 'APPROVED' ? 'Tasdiqlash' : st === 'NOT_READY' ? 'Tayyor emas' : 'Keyinroq'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HRPromotion;
