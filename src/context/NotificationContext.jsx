import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { NotificationContext } from './notificationHooks';
import { notificationAPI } from '../utils/api';

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const data = await notificationAPI.getUnreadCount(userId);
      const nextCount = data.count || 0;
      setUnreadCount(nextCount);
      return nextCount;
    } catch (err) {
      console.error('Failed to load notification count:', err);
      return 0;
    }
  }, [userId]);

  const decrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadUnreadCount = async () => {
      if (!userId) {
        if (!ignore) setUnreadCount(0);
        return;
      }

      try {
        const data = await notificationAPI.getUnreadCount(userId);
        if (!ignore) {
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.error('Failed to load notification count:', err);
      }
    };

    loadUnreadCount();

    return () => {
      ignore = true;
    };
  }, [userId]);

  const value = useMemo(() => ({
    unreadCount,
    refreshUnreadCount,
    decrementUnreadCount,
    clearUnreadCount
  }), [clearUnreadCount, decrementUnreadCount, refreshUnreadCount, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
