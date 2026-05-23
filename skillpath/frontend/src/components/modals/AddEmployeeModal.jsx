import { useState } from 'react';
import { employeesAPI } from '../../utils/api';
import { X, User, Copy, Check } from 'lucide-react';

export default function AddEmployeeModal({ onClose, onSuccess, branches, departments }) {
  const [form, setForm] = useState({
    fullName: '', email: '', employeeCode: '',
    branchId: '', departmentId: '', employeeRole: '', hireDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await employeesAPI.create(form);
      setCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(created.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="var(--blue-600)" />
            </div>
            <div className="modal-title">Yangi Xodim Qo'shish</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {created ? (
            <div>
              <div className="alert alert-success">✅ Xodim muvaffaqiyatli yaratildi!</div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Vaqtinchalik parol:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ flex: 1, background: 'var(--surface-3)', padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
                    {created.temporaryPassword}
                  </code>
                  <button className="btn btn-secondary btn-sm" onClick={copyPassword}>
                    {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    {copied ? 'Nusxa olindi' : 'Nusxa'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                  ⚠️ Bu parolni xodimga yetkazing. Birinchi kirishda o'zgartirish tavsiya qilinadi.
                </p>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={onSuccess}>Yopish</button>
                <button className="btn btn-secondary" onClick={() => { setCreated(null); setForm({ fullName: '', email: '', employeeCode: '', branchId: '', departmentId: '', employeeRole: '', hireDate: '' }); }}>
                  Yana qo'shish
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">To'liq ism *</label>
                  <input className="form-input" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} required placeholder="Abdullayev Bobur" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="bobur@bank.uz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Xodim kodi *</label>
                  <input className="form-input" value={form.employeeCode} onChange={e => setForm(p => ({ ...p, employeeCode: e.target.value }))} required placeholder="EMP-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Lavozim</label>
                  <input className="form-input" value={form.employeeRole} onChange={e => setForm(p => ({ ...p, employeeRole: e.target.value }))} placeholder="Teller" />
                </div>
                <div className="form-group">
                  <label className="form-label">Filial</label>
                  <select className="form-input" value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                    <option value="">Tanlang</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bo'lim</label>
                  <select className="form-input" value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                    <option value="">Tanlang</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Ishga kirgan sana</label>
                  <input className="form-input" type="date" value={form.hireDate} onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: 0, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)', width: 16, height: 16 }} />Saqlanmoqda...</> : 'Yaratish'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
