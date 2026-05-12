import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import { announcementAPI } from '../utils/api';
import './AnnouncementManagementPage.css';

const AnnouncementManagementPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_published: false
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await announcementAPI.getAll();
      setAnnouncements(data);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingAnnouncement) {
        // Update announcement
        await announcementAPI.update(editingAnnouncement.id, formData);
        showToast('Announcement updated successfully', 'success');
      } else {
        // Create announcement
        await announcementAPI.create(formData);
        showToast('Announcement created successfully', 'success');
      }
      fetchAnnouncements();
      resetForm();
    } catch (err) {
      showToast('Failed to save announcement', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      is_published: true
    });
    setShowAddForm(true);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_published: announcement.is_published
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementAPI.delete(id);
        showToast('Announcement deleted successfully', 'success');
        fetchAnnouncements();
      } catch (err) {
        showToast('Failed to delete announcement', 'error');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      is_published: false
    });
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="loading">Loading announcements...</div>;
  }

  return (
    <div className="announcement-management-page fade-in">
      <div className="announcement-management-header">
        <div>
          <h2>Announcement Management</h2>
          <p>Create, publish, and maintain library notices.</p>
        </div>
        <button
          type="button"
          className="btn-primary announcement-add-button"
          onClick={handleCreate}
        >
          Add Announcement
        </button>
      </div>

      {/* 公告列表 */}
      <section className="announcement-management-list">
        <div className="announcement-list-heading">
          <div>
            <h3>Announcements</h3>
            <span>{announcements.length} total</span>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="empty-state">
            <p>No announcements found</p>
          </div>
        ) : (
          <div className="announcement-table-wrap">
            <table className="announcement-management-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Announcement</th>
                  <th>Published</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map(announcement => (
                  <tr key={announcement.id} className="fade-in">
                    <td>{announcement.id}</td>
                    <td>
                      <div className="announcement-title-cell">
                        <strong>{announcement.title}</strong>
                        <span>{announcement.content}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`announcement-status ${announcement.is_published ? 'published' : 'draft'}`}>
                        {announcement.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>{announcement.created_at}</td>
                    <td>
                      <div className="announcement-row-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleEdit(announcement)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAddForm && createPortal(
        <div className="announcement-modal-overlay" onClick={resetForm}>
          <div
            className="announcement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="announcement-modal-header">
              <div>
                <span>{editingAnnouncement ? 'Edit Notice' : 'New Notice'}</span>
                <h3 id="announcement-modal-title">
                  {editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}
                </h3>
              </div>
              <button
                type="button"
                className="announcement-modal-close"
                onClick={resetForm}
                aria-label="Close announcement form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form className="announcement-modal-form" onSubmit={handleSubmit}>
              <div className="announcement-field">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  placeholder="Enter announcement title"
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows="8"
                  required
                  disabled={saving}
                  placeholder="Write the announcement content"
                />
              </div>

              <label className="announcement-publish-toggle" htmlFor="is_published">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  disabled={saving}
                />
                <span aria-hidden="true"></span>
                <strong>Publish Announcement</strong>
              </label>

              <div className="announcement-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AnnouncementManagementPage;
