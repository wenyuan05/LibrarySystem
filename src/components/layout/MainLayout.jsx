import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { announcementAPI } from '../../utils/api';
import Sidebar from '../Sidebar/Sidebar';

const MainLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadAnnouncements = async () => {
      try {
        const data = await announcementAPI.getUnread();
        const publishedUnread = (data || []).filter(announcement => announcement.is_published);
        setUnreadAnnouncements(publishedUnread);
        setIsAnnouncementModalOpen(publishedUnread.length > 0);
      } catch (err) {
        console.error('Failed to load unread announcements:', err);
      }
    };

    fetchUnreadAnnouncements();
  }, [user?.id]);

  const handleReadAnnouncements = async () => {
    const ids = unreadAnnouncements.map(announcement => announcement.id);
    setIsAnnouncementModalOpen(false);
    setUnreadAnnouncements([]);

    if (ids.length === 0) return;

    try {
      await announcementAPI.markRead(ids);
    } catch (err) {
      console.error('Failed to mark announcements as read:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app-container">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 主内容 */}
      <div className="main-content">
        {/* 顶部导航 */}
        <header className="header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <h1>Library Management System</h1>
          <div className="user-menu">
            <span className="user-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            <span>{user?.name || 'User'}</span>
          </div>
        </header>

        {/* 内容区域 */}
        <div className="content">
          {children}
        </div>
      </div>

      {isAnnouncementModalOpen && unreadAnnouncements.length > 0 && (
        <div className="announcement-reminder-overlay" role="presentation">
          <div
            className="announcement-reminder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-reminder-title"
          >
            <div className="announcement-reminder-header">
              <div>
                <span className="announcement-reminder-label">Announcement</span>
                <h2 id="announcement-reminder-title">New Library Notice</h2>
              </div>
              <span className="announcement-reminder-count">{unreadAnnouncements.length}</span>
            </div>

            <div className="announcement-reminder-list">
              {unreadAnnouncements.map(announcement => (
                <article className="announcement-reminder-item" key={announcement.id}>
                  <div className="announcement-reminder-item-header">
                    <h3>{announcement.title}</h3>
                    <span>{announcement.created_at}</span>
                  </div>
                  <p>{announcement.content}</p>
                </article>
              ))}
            </div>

            <div className="announcement-reminder-actions">
              <button type="button" className="btn-primary" onClick={handleReadAnnouncements}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
