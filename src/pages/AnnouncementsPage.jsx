import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { announcementAPI } from '../utils/api';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Load announcements list
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await announcementAPI.getAll();
      // Only show published announcements
      const publishedAnnouncements = data.filter(announcement => announcement.is_published);
      setAnnouncements(publishedAnnouncements);
    } catch (err) {
      setError('Failed to load announcements');
      showToast('Failed to load announcements', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading announcements...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchAnnouncements} className="btn-primary">Retry</button>
      </div>
    );
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
            <div key={announcement.id} className="announcement-card card fade-in">
              <div className="announcement-header">
                <h3>{announcement.title}</h3>
                <span className="announcement-date">{announcement.created_at}</span>
              </div>
              <div className="announcement-content">
                {announcement.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;