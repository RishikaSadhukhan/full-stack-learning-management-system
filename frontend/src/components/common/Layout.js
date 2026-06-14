import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  MdDashboard, MdMenuBook, MdAssignment, MdBarChart,
  MdNotifications, MdCardMembership, MdLogout, MdMenu, MdClose,
  MdPerson, MdAdd, MdSearch
} from 'react-icons/md';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Consume shared notification count — no longer local state
  const { unreadCount, refreshUnreadCount } = useNotifications();

  // Refresh the badge count whenever the user navigates TO the notifications page
  // (they may have just read everything there)
  useEffect(() => {
    if (location.pathname === '/student/notifications') {
      // Small delay so the Notifications page has time to fire markAllRead before we re-fetch
      const timer = setTimeout(() => refreshUnreadCount(), 600);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, refreshUnreadCount]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const instructorNav = [
    { to: '/instructor/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
    { to: '/instructor/courses', icon: <MdMenuBook />, label: 'My Courses' },
  ];

  const studentNav = [
    { to: '/student/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
    { to: '/student/courses', icon: <MdSearch />, label: 'Browse Courses' },
    { to: '/student/assignments', icon: <MdAssignment />, label: 'Assignments' },
    { to: '/student/certificates', icon: <MdCardMembership />, label: 'Certificates' },
    { to: '/student/notifications', icon: <MdNotifications />, label: 'Notifications', badge: unreadCount },
  ];

  const navItems = user?.role === 'instructor' ? instructorNav : studentNav;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '70px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 36, height: 36,
                background: 'var(--accent)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 18, color: '#fff',
              }}>E</div>
              <span style={{ fontWeight: 800, fontSize: 18 }}>EduTrack</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', color: 'var(--text-secondary)', fontSize: 22, padding: 4, borderRadius: 6 }}
          >
            {sidebarOpen ? <MdClose /> : <MdMenu />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent)' : 'transparent',
                fontSize: 15,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                position: 'relative',
                transition: 'var(--transition)',
              })}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 10,
                }}>{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '16px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontWeight: 700, fontSize: 15, flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)', background: 'none',
              fontSize: 15, fontWeight: 500, width: '100%',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <MdLogout style={{ fontSize: 20, flexShrink: 0 }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px 24px', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
