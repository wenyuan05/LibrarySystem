import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { announcementAPI } from '../utils/api';

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

  // Load announcements list
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
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
  };

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
    <div className="announcement-management-page card fade-in">
      <h2>Announcement Management</h2>
      
      {/* 操作栏 */}
      <div className="action-bar">
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Announcement'}
        </button>
      </div>
      
      {/* 添加/编辑公告表单 */}
      {showAddForm && (
        <div className="announcement-form card">
          <h3>{editingAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows="6"
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="is_published"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
              <label htmlFor="is_published">Publish Announcement</label>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Announcement'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 公告列表 */}
      <div className="announcement-list">
        <h3>Announcements</h3>
        {announcements.length === 0 ? (
          <div className="empty-state">
            <p>No announcements found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Published</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(announcement => (
                <tr key={announcement.id} className="fade-in">
                  <td>{announcement.id}</td>
                  <td>{announcement.title}</td>
                  <td>
                    <span className={`status-badge status-${announcement.is_published ? 'active' : 'inactive'}`}>
                      {announcement.is_published ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{announcement.created_at}</td>
                  <td>
                    <button 
                      className="btn-primary"
                      onClick={() => handleEdit(announcement)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagementPage;