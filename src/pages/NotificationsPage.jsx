import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/notificationHooks';
import { useToast } from '../context/ToastContext';
import { notificationAPI } from '../utils/api';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { clearUnreadCount, decrementUnreadCount, refreshUnreadCount } = useNotifications();
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await notificationAPI.getAll(user.id);
      setNotifications(data);
      refreshUnreadCount();
    } catch (err) {
      showToast(err.message || 'Failed to load notifications', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount, showToast, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [fetchNotifications, user?.id]);

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return;

    try {
      await notificationAPI.markAsRead(notification.id);
      setNotifications(prev => prev.map(item => (
        item.id === notification.id ? { ...item, is_read: 1 } : item
      )));
      decrementUnreadCount(1);
    } catch (err) {
      showToast(err.message || 'Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setUpdating(true);
      await notificationAPI.markAllAsRead(user.id);
      setNotifications(prev => prev.map(item => ({ ...item, is_read: 1 })));
      clearUnreadCount();
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update notifications', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  const unreadCount = notifications.filter(item => !item.is_read).length;

  return (
    <div className="notifications-page card fade-in">
      <div className="notifications-header">
        <div>
          <h2>Notifications</h2>
          <p>{unreadCount} unread of {notifications.length}</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleMarkAllRead}
          disabled={updating || unreadCount === 0}
        >
          Mark All Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications found.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(notification => (
            <button
              type="button"
              key={notification.id}
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
              onClick={() => handleMarkRead(notification)}
            >
              <span className="notification-dot" aria-hidden="true"></span>
              <span className="notification-content">
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
