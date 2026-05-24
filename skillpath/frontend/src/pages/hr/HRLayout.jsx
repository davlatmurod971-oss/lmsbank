// 1-qator — import qo'shing:
import AIChatBot from '../../components/AIChatBot';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../utils/api';
import {
  LayoutDashboard, Users, GitBranch, BookOpen, Award, BarChart3,
  Building2, Bell, LogOut, ChevronRight, Settings
} from 'lucide-react';

const navItems = [
  { to: '/hr/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hr/employees', icon: Users, label: 'Xodimlar' },
  { to: '/hr/career-tracks', icon: GitBranch, label: 'Career Tracks' },
  { to: '/hr/trainings', icon: BookOpen, label: 'Traininglar' },
  { to: '/hr/promotion-packets', icon: Award, label: 'Promotion Packets' },
  { to: '/hr/reports', icon: BarChart3, label: 'Hisobotlar' },
  { to: '/hr/branches', icon: Building2, label: 'Filiallar' },
];

export default function HRLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  useEffect(() => {
    notificationsAPI.getAll().then(r => setUnreadCount(r.data.unreadCount)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'HR';

 return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0
            }}>S</div>
            <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, color: 'white' }}>SkillPath</h1>
          </div>
          <span style={{ fontSize: 10.5, color: 'var(--blue-300)', letterSpacing: 1 }}>BANK LMS PLATFORM</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Asosiy menyu</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* User profile at bottom */}
        <div style={{ marginTop: 'auto', padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)'
          }}>
            <div className="avatar avatar-sm" style={{ width: 34, height: 34, fontSize: 12 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--blue-300)' }}>HR Manager</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }} title="Chiqish">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title">HR Boshqaruv Paneli</div>
          </div>
          <div className="topbar-actions">
            <button style={{
              position: 'relative', background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <Bell size={18} color="var(--text-secondary)" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                  background: 'var(--danger)', borderRadius: '50%', border: '2px solid white'
                }} />
              )}
            </button>
            <div className="avatar" style={{ cursor: 'pointer' }}>{initials}</div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Chatbot strukturani buzmasligi uchun asosiy content'dan tashqariga qo'yildi */}
      <AIChatBot role={user?.role} userName={user?.fullName} />

    </div>
  );
