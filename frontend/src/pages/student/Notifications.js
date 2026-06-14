import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';
import { MdNotifications, MdAssignment, MdGrade, MdMenuBook, MdCardMembership, MdSchedule, MdDoneAll } from 'react-icons/md';

const iconMap = {
  assignment: <MdAssignment style={{ color: '#6366f1' }} />,
  grade: <MdGrade style={{ color: '#22c55e' }} />,
  course: <MdMenuBook style={{ color: '#f59e0b' }} />,
  certificate: <MdCardMembership style={{ color: '#ec4899' }} />,
  deadline: <MdSchedule style={{ color: '#ef4444' }} />,
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshUnreadCount } = useNotifications();

  const fetchNotifications = () => {
    api.get('/notifications').then(res => setNotifications(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      refreshUnreadCount(); // sync badge in sidebar
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      refreshUnreadCount(); // sync badge in sidebar
      toast.success('All marked as read');
    } catch {}
  };

  const unread = notifications.filter(n => !n.is_read).length;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Notifications</h1>
          <p>{unread > 0 ? `${unread} unread notifications` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            <MdDoneAll /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <MdNotifications style={{ width: 64, height: 64 }} />
          <h3>No notifications</h3>
          <p>You're all caught up! Notifications will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) markRead(n.id); }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '16px 20px',
                background: n.is_read ? 'var(--bg-secondary)' : 'rgba(99,102,241,0.07)',
                border: `1px solid ${n.is_read ? 'var(--border)' : 'rgba(99,102,241,0.25)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: n.is_read ? 'default' : 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {iconMap[n.type] || <MdNotifications style={{ color: 'var(--text-secondary)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</span>
                  {!n.is_read && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--accent)', flexShrink: 0,
                    }} />
                  )}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
                {timeAgo(n.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
