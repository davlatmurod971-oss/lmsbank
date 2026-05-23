import { useState, useEffect } from 'react';
import { branchesAPI } from '../../utils/api';
import { Plus, Building2, MapPin } from 'lucide-react';

export default function HRBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ branchName: '', branchCode: '', city: '', address: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await branchesAPI.getAll();
      setBranches(res.data.branches || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await branchesAPI.create(form);
      setShowAdd(false);
      setForm({ branchName: '', branchCode: '', city: '', address: '' });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Xato'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Filiallar</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Bank filiallari ro'yxati ({branches.length})</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Yangi filial</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Yangi Filial</div>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Filial nomi *</label>
                <input className="form-input" value={form.branchName} onChange={e => setForm(p => ({ ...p, branchName: e.target.value }))} required placeholder="Masalan: Toshkent Markaziy" />
              </div>
              <div className="form-group">
                <label className="form-label">Filial kodi *</label>
                <input className="form-input" value={form.branchCode} onChange={e => setForm(p => ({ ...p, branchCode: e.target.value }))} required placeholder="TAS-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Shahar</label>
                <input className="form-input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Toshkent" />
              </div>
              <div className="form-group">
                <label className="form-label">Manzil</label>
                <input className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Ko'cha, uy raqami" />
              </div>
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
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {branches.map(b => (
            <div key={b.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="var(--blue-600)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.branch_name}</div>
                  <div style={{ fontSize: 11.5, fontFamily: 'monospace', background: 'var(--blue-50)', color: 'var(--blue-700)', padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>{b.branch_code}</div>
                </div>
              </div>
              {b.city && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <MapPin size={12} />
                  {b.city}{b.address ? `, ${b.address}` : ''}
                </div>
              )}
              {b.manager && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Menejer: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.manager.full_name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
