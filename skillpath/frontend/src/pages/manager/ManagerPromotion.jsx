import { useState, useEffect } from 'react';
import { promotionAPI, employeesAPI } from '../../utils/api';

export default function ManagerPromotion() {
  const [packets, setPackets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pp, emp] = await Promise.all([promotionAPI.getAll(), employeesAPI.getAll({ limit: 100 })]);
      setPackets(pp.data.packets || []);
      setEmployees(emp.data.employees || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Promotion Packets</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Jamoam promotion holati</p>
      </div>
      {packets.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Promotion packet yo'q</div>
          <div className="empty-state-desc">HR yaratgan packetlar bu yerda ko'rinadi</div>
        </div></div>
      ) : packets.map(p => (
        <div key={p.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.employee?.full_name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {p.current_level?.level_name} → {p.target_level?.level_name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue-600)' }}>{p.readiness_score}%</div>
              <span className={`badge ${p.status === 'APPROVED' ? 'badge-green' : p.status === 'READY_FOR_DISCUSSION' ? 'badge-blue' : 'badge-gray'}`}>{p.status}</span>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Manager tavsiyasi</label>
            <textarea className="form-input" style={{ minHeight: 60, fontSize: 13 }} placeholder="Manager tavsiyasini kiriting..."
              onBlur={e => promotionAPI.updateStatus(p.id, { managerRecommendation: e.target.value })} defaultValue={p.manager_recommendation || ''} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => promotionAPI.updateStatus(p.id, { status: 'READY_FOR_DISCUSSION' }).then(load)}>Muhokamaga tayyor</button>
            <button className="btn btn-secondary btn-sm" onClick={() => promotionAPI.updateStatus(p.id, { status: 'NEEDS_MORE_EVIDENCE' || 'NOT_READY' }).then(load)}>Ko'proq dalil kerak</button>
          </div>
        </div>
      ))}
    </div>
  );
}
