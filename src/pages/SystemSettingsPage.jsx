import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { systemAPI } from '../utils/api';

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({
    borrow_days: '14',
    fine_per_day: '0.5',
    max_books: '5',
    system_name: 'Library Management System',
    system_version: '1.0.0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Load system settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemAPI.getSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load system settings');
      showToast('Failed to load system settings', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await systemAPI.updateSettings(settings);
      showToast('System settings updated successfully', 'success');
    } catch (err) {
      setError('Failed to update system settings');
      showToast('Failed to update system settings', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading system settings...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchSettings} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="system-settings-page card fade-in">
      <h2>System Settings</h2>
      
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="system_name">System Name</label>
          <input
            type="text"
            id="system_name"
            name="system_name"
            value={settings.system_name}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="system_version">System Version</label>
          <input
            type="text"
            id="system_version"
            name="system_version"
            value={settings.system_version}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="borrow_days">Borrow Days (default: 14)</label>
          <input
            type="number"
            id="borrow_days"
            name="borrow_days"
            min="1"
            max="365"
            value={settings.borrow_days}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fine_per_day">Fine Per Day (default: 0.5)</label>
          <input
            type="number"
            id="fine_per_day"
            name="fine_per_day"
            min="0"
            step="0.1"
            value={settings.fine_per_day}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="max_books">Max Books Per User (default: 5)</label>
          <input
            type="number"
            id="max_books"
            name="max_books"
            min="1"
            max="50"
            value={settings.max_books}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={fetchSettings}
            disabled={saving}
          >
            Reset to Current
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettingsPage;