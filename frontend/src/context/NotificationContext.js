import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({ unreadCount: 0, refreshUnreadCount: () => {} });

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    if (user?.role === 'student') {
      api.get('/notifications/unread-count')
        .then(res => setUnreadCount(Number(res.data.count) || 0))
        .catch(() => {});
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  // Fetch on login / user change
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
