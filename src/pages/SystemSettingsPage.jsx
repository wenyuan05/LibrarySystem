import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { systemAPI } from '../utils/api';

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({
    borrow_days: '14',
    fine_per_day: '0.5',
    max_books: '5',
    borrow_confirm_minutes: '60',
    max_renew_times: '3',
    renew_days: '7',
    system_name: 'Library Management System',
    system_version: '1.0.0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Load system settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await systemAPI.getSettings();
      setSettings(data);
    } catch (err) {
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

    try {
      await systemAPI.updateSettings(settings);
      showToast('System settings updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update system settings', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading system settings...</div>;
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

        <div className="form-group">
          <label htmlFor="borrow_confirm_minutes">Borrow Confirmation Time (minutes, default: 60)</label>
          <input
            type="number"
            id="borrow_confirm_minutes"
            name="borrow_confirm_minutes"
            min="1"
            max="1440"
            value={settings.borrow_confirm_minutes}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="max_renew_times">Maximum Renewal Times (default: 3)</label>
          <input
            type="number"
            id="max_renew_times"
            name="max_renew_times"
            min="0"
            max="10"
            value={settings.max_renew_times}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="renew_days">Renewal Days (default: 7)</label>
          <input
            type="number"
            id="renew_days"
            name="renew_days"
            min="1"
            max="30"
            value={settings.renew_days}
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