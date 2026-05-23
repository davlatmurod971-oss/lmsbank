import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      const role = data.user.role;
      if (role === 'HR_MANAGER' || role === 'ADMIN') navigate('/hr/dashboard');
      else if (role === 'BRANCH_MANAGER') navigate('/manager/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Kirish muvaffaqiyatsiz bo\'ldi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 40%, #2563EB 70%, #3B82F6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background shapes */}
      <div style={{
        position: 'absolute', top: -120, right: -120, width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(255,255,255,0.05)'
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
        borderRadius: '50%', background: 'rgba(255,255,255,0.04)'
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '10%', width: 150, height: 150,
        borderRadius: '50%', background: 'rgba(255,255,255,0.03)'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: 'white',
            letterSpacing: '-0.5px', marginBottom: 4
          }}>SkillPath</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13.5 }}>
            Bank LMS — Kasbiy rivojlanish tizimi
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 20, padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
        }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#0F172A' }}>
            Xush kelibsiz
          </h2>
          <p style={{ color: '#64748B', fontSize: 13.5, marginBottom: 24 }}>
            Hisobingizga kiring
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email manzil</label>
              <input
                type="email"
                className="form-input"
                placeholder="email@bank.uz"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parol</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Parolingizni kiriting"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ marginTop: 8, justifyContent: 'center', padding: '11px', fontSize: 15 }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Kirilmoqda...</>
              ) : (
                <><LogIn size={18} /> Kirish</>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: 24, padding: 16, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', marginBottom: 8 }}>
              Demo hisoblar
            </p>
            {[
              { role: 'HR Manager', email: 'hr@skillpathbank.uz', pass: 'Admin@12345', color: '#1D4ED8' },
              { role: 'Manager', email: 'manager@bank.uz', pass: 'Manager@123', color: '#0891B2' },
              { role: 'Employee', email: 'employee@bank.uz', pass: 'Employee@123', color: '#059669' }
            ].map(a => (
              <button
                key={a.role}
                type="button"
                onClick={() => setForm({ email: a.email, password: a.pass })}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '4px 0', fontSize: 12.5, color: a.color, fontWeight: 600
                }}
              >
                {a.role}: {a.email}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          © 2025 SkillPath Bank LMS. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
