// Yuqoriga import:
import AIChatBot from '../../components/AIChatBot';
// ManagerLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, MessageSquare, Award, LogOut } from 'lucide-react';

const navItems = [
  { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/manager/team', icon: Users, label: 'Jamoam' },
  { to: '/manager/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/manager/promotion-packets', icon: Award, label: 'Promotion' },
];

export default function ManagerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'MG';

 return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>S</div>
            <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, color: 'white' }}>SkillPath</h1>
          </div>
          <span style={{ fontSize: 10.5, color: 'var(--blue-300)', letterSpacing: 1 }}>MANAGER PORTAL</span>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Menyu</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />{item.label}
            </NavLink>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)' }}>
            <div className="avatar avatar-sm" style={{ width: 34, height: 34, fontSize: 12 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
              <div style={{ fontSize: 10.5, color: 'var(--blue-300)' }}>Branch Manager</div>
            </div>
            <button onClick={async () => { await logout(); navigate('/login'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">Manager Paneli</div>
          <div className="avatar" style={{ cursor: 'pointer' }}>{initials}</div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div> {/* main-content yopilishi */}

      {/* Chatbot shu yerga xavfsiz joylashtirildi */}
      <AIChatBot role={user?.role} userName={user?.fullName} />

    </div> {/* app-layout yopilishi */}
  );
