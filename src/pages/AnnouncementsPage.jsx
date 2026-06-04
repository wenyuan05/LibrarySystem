import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import { announcementAPI } from '../utils/api';
import './AnnouncementsPage.css';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const { showToast } = useToast();

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await announcementAPI.getAll();
      // Only show published announcements
      const publishedAnnouncements = data.filter(announcement => announcement.is_published);
      setAnnouncements(publishedAnnouncements);
    } catch (err) {
      showToast('Failed to load announcements', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load announcements list
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const closeAnnouncementModal = () => {
    setSelectedAnnouncement(null);
  };

  if (loading) {
    return <div className="loading">Loading announcements...</div>;
  }

  return (
    <div className="announcements-page card fade-in">
      <h2>Announcements</h2>

      {announcements.length === 0 ? (
        <div className="empty-state">
          <p>No announcements found</p>
        </div>
      ) : (
        <div className="announcement-list">
          {announcements.map(announcement => (
            <article
              key={announcement.id}
              className="announcement-card card fade-in"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedAnnouncement(announcement)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedAnnouncement(announcement);
                }
              }}
            >
              <div className="announcement-header">
                <h3>{announcement.title}</h3>
                <span className="announcement-date">{announcement.created_at}</span>
              </div>
              <div className="announcement-content">
                {announcement.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              <span className="announcement-open-hint">View full announcement</span>
            </article>
          ))}
        </div>
      )}

      {selectedAnnouncement && createPortal((
        <div className="announcement-detail-overlay" onClick={closeAnnouncementModal}>
          <div
            className="announcement-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="announcement-detail-header">
              <div>
                <span>Announcement</span>
                <h3 id="announcement-detail-title">{selectedAnnouncement.title}</h3>
                <time>{selectedAnnouncement.created_at}</time>
              </div>
              <button
                type="button"
                className="announcement-detail-close"
                onClick={closeAnnouncementModal}
                aria-label="Close announcement detail"
              >
                x
              </button>
            </div>
            <div className="announcement-detail-content">
              {selectedAnnouncement.content.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>
            <div className="announcement-detail-actions">
              <button type="button" className="btn-primary" onClick={closeAnnouncementModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default AnnouncementsPage;
