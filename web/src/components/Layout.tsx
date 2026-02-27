import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NavItem = ({ to, icon, label }: any) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px', borderRadius: 8,
      color: isActive ? '#fff' : '#64748b',
      background: isActive ? 'var(--surface2)' : 'transparent',
      fontWeight: isActive ? 500 : 400,
      transition: 'all 0.15s',
      textDecoration: 'none',
      fontSize: 14,
    })}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', padding: '20px 12px', flexShrink: 0,
      }}>
        <div style={{ marginBottom: 28, padding: '0 6px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
            ▣ WBAT
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Business Manager</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <NavItem to="/dashboard" icon="◈" label="Dashboard" />
          <NavItem to="/invoices" icon="◪" label="Invoices" />
          <NavItem to="/customers" icon="◉" label="Customers" />
          <NavItem to="/settings" icon="◎" label="Settings" />
        </nav>

        <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{user?.email}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'capitalize' }}>
            {user?.role} · {user?.company?.name}
          </div>
          <button className="btn-ghost" style={{ width: '100%', fontSize: 12 }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}
