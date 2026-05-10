import React, { useCallback, useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { systemAPI } from '../utils/api';
import './SystemSettingsPage.css';

const settingDefinitions = [
  { key: 'system_name', label: 'System Name', type: 'text', default: 'Library Management System' },
  { key: 'system_version', label: 'System Version', type: 'text', default: '1.0.0' },
  { key: 'borrow_period_days', label: 'Borrow Days', type: 'number', min: 1, max: 365, default: 14 },
  { key: 'fine_per_day', label: 'Fine Per Day', type: 'number', min: 0, step: 0.1, default: 0.5 },
  { key: 'max_borrows', label: 'Max Books Per User', type: 'number', min: 1, max: 50, default: 5 },
  { key: 'borrow_confirm_minutes', label: 'Borrow Confirmation Time (minutes)', type: 'number', min: 1, max: 1440, default: 60 },
  { key: 'max_renew_times', label: 'Maximum Renewal Times', type: 'number', min: 0, max: 10, default: 3 },
  { key: 'renew_days', label: 'Renewal Days', type: 'number', min: 1, max: 30, default: 7 },
  { key: 'blacklist_days', label: 'Blacklist Days', type: 'number', min: 1, max: 365, default: 30 },
  { key: 'max_reservations', label: 'Max Reservations Per User', type: 'number', min: 1, max: 20, default: 3 },
];

const defaultSettings = settingDefinitions.reduce((acc, setting) => {
  if (setting.default !== undefined) {
    acc[setting.key] = String(setting.default);
  }
  return acc;
}, {});

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved
  const { showToast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await systemAPI.getSettings();
      setSettings({ ...defaultSettings, ...data });
    } catch (err) {
      showToast('Failed to load system settings', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const startEdit = (key) => {
    setEditingKey(key);
    setEditValue(settings[key] ?? defaultSettings[key] ?? '');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (key) => {
    setSaving(key);
    try {
      await systemAPI.updateSettings({ [key]: editValue });
      setSettings(prev => ({ ...prev, [key]: editValue }));
      setEditingKey(null);
      setEditValue('');
      showToast(`"${settingDefinitions.find(s => s.key === key)?.label || key}" updated successfully`, 'success');
    } catch (err) {
      showToast('Failed to update setting', 'error');
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const handleKeyDown = (e, key) => {
    if (e.key === 'Enter') {
      handleSave(key);
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (loading) {
    return <div className="loading">Loading system settings...</div>;
  }

  return (
    <div className="system-settings-page card fade-in">
      <div className="page-header">
        <h2>System Settings</h2>
        <button className="btn-secondary" onClick={fetchSettings} disabled={!!editingKey}>
          Refresh
        </button>
      </div>

      <div className="settings-list">
        {settingDefinitions.map(({ key, label, type, min, max, step, default: defVal }) => {
          const isEditing = editingKey === key;
          const isSaving = saving === key;
          const currentValue = settings[key] ?? defaultSettings[key] ?? '';

          return (
            <div key={key} className={`setting-item ${isEditing ? 'editing' : ''}`}>
              <div className="setting-info">
                <span className="setting-label">{label}</span>
                <span className="setting-value">
                  {isEditing ? (
                    <input
                      type={type}
                      autoFocus
                      min={min}
                      max={max}
                      step={step}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => handleKeyDown(e, key)}
                      className="form-input setting-input"
                    />
                  ) : (
                    <span className="current-value">{currentValue}</span>
                  )}
                  {!isEditing && defVal !== undefined && (
                    <span className="setting-default">default: {defVal}</span>
                  )}
                </span>
              </div>
              <div className="setting-actions">
                {isEditing ? (
                  <>
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => handleSave(key)}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={cancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => startEdit(key)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemSettingsPage;
