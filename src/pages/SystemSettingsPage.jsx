import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { systemAPI } from '../utils/api';
import './SystemSettingsPage.css';

const settingSections = [
  {
    id: 'borrow',
    title: 'Borrow Rules',
    icon: 'BR',
    description: 'Control borrowing limits, confirmation timing, renewals, and reservations.',
    settings: [
      {
        key: 'borrow_enabled',
        label: 'Borrowing Enabled',
        type: 'checkbox',
        default: '1',
        helper: 'Turn reader borrowing requests on or off globally.'
      },
      {
        key: 'borrow_period_days',
        label: 'Borrow Days',
        type: 'number',
        min: 1,
        max: 365,
        default: 14,
        helper: 'Default number of days a reader can keep a borrowed book.'
      },
      {
        key: 'max_borrows',
        label: 'Max Books Per User',
        type: 'number',
        min: 1,
        max: 50,
        default: 5,
        helper: 'Maximum active borrowed books allowed for each reader.'
      },
      {
        key: 'borrow_confirm_minutes',
        label: 'Borrow Confirmation Time',
        type: 'number',
        min: 1,
        max: 1440,
        default: 60,
        suffix: 'min',
        helper: 'Minutes before an unconfirmed borrow request expires.'
      },
      {
        key: 'max_renew_times',
        label: 'Maximum Renewal Times',
        type: 'number',
        min: 0,
        max: 10,
        default: 3,
        helper: 'How many times a borrowed book can be renewed.'
      },
      {
        key: 'renew_days',
        label: 'Renewal Days',
        type: 'number',
        min: 1,
        max: 30,
        default: 7,
        helper: 'Additional days granted for each renewal.'
      }
    ]
  },
  {
    id: 'fine',
    title: 'Fine Rules',
    icon: 'FR',
    description: 'Define overdue charges and exception handling policies.',
    settings: [
      {
        key: 'fine_per_day',
        label: 'Fine Per Day',
        type: 'number',
        min: 0,
        step: 0.1,
        default: 0.5,
        prefix: '¥',
        helper: 'Daily overdue charge. Set to 0 to disable overdue fines.'
      }
    ]
  }
];

const settingDefinitions = settingSections.flatMap(section => section.settings);

const defaultSettings = settingDefinitions.reduce((acc, setting) => {
  acc[setting.key] = String(setting.default ?? '');
  return acc;
}, {});

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [draftSettings, setDraftSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await systemAPI.getSettings();
      const mergedSettings = { ...defaultSettings, ...data };
      setSettings(mergedSettings);
      setDraftSettings(mergedSettings);
      setIsEditable(false);
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

  const changedSettings = useMemo(() => {
    return settingDefinitions.reduce((acc, setting) => {
      const nextValue = draftSettings[setting.key] ?? '';
      const currentValue = settings[setting.key] ?? defaultSettings[setting.key] ?? '';

      if (String(nextValue) !== String(currentValue)) {
        acc[setting.key] = String(nextValue);
      }

      return acc;
    }, {});
  }, [draftSettings, settings]);

  const hasChanges = Object.keys(changedSettings).length > 0;

  const visibleSections = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return settingSections;
    }

    return settingSections
      .map(section => ({
        ...section,
        settings: section.settings.filter(setting => {
          const haystack = `${section.title} ${setting.label} ${setting.helper || ''}`.toLowerCase();
          return haystack.includes(normalizedTerm);
        })
      }))
      .filter(section => section.settings.length > 0);
  }, [searchTerm]);

  const handleFieldChange = (key, value) => {
    setDraftSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      await systemAPI.updateSettings(changedSettings);
      setSettings(prev => ({ ...prev, ...changedSettings }));
      setDraftSettings(prev => ({ ...prev, ...changedSettings }));
      setIsEditable(false);
      showToast('System settings saved successfully', 'success');
    } catch (err) {
      showToast('Failed to update system settings', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftSettings(settings);
    setIsEditable(false);
  };

  const handleResetDefaults = () => {
    setDraftSettings(defaultSettings);
    setIsEditable(true);
  };

  if (loading) {
    return <div className="loading">Loading system settings...</div>;
  }

  return (
    <div className="system-settings-shell fade-in">
      <header className="settings-hero">
        <div>
          <span className="settings-eyebrow">Admin Console</span>
          <h2>System Settings</h2>
          <p>Configure global library system behavior</p>
        </div>
        <div className="settings-header-actions">
          <button
            type="button"
            className="btn-secondary settings-secondary-button"
            onClick={handleResetDefaults}
            disabled={saving}
          >
            Reset Defaults
          </button>
          <button
            type="button"
            className="btn-primary settings-primary-button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="settings-toolbar">
        <div className="settings-search">
          <span aria-hidden="true"></span>
          <input
            type="search"
            placeholder="Search settings"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
        <label className="settings-edit-toggle">
          <input
            type="checkbox"
            checked={isEditable}
            onChange={event => {
              if (!event.target.checked && hasChanges) {
                handleCancel();
                return;
              }
              setIsEditable(event.target.checked);
            }}
          />
          <span></span>
          Editable mode
        </label>
      </div>

      <main className="settings-layout">
        <div className="settings-sections">
          {visibleSections.map(section => (
            <section className="settings-card" key={section.id}>
              <div className="settings-card-header">
                <div className="settings-card-icon">{section.icon}</div>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
              </div>

              <div className="settings-card-divider"></div>

              <div className="settings-grid">
                {section.settings.map(setting => {
                  const value = draftSettings[setting.key] ?? defaultSettings[setting.key] ?? '';
                  const changed = String(value) !== String(settings[setting.key] ?? defaultSettings[setting.key] ?? '');
                  const isCheckbox = setting.type === 'checkbox';

                  return (
                    <label
                      className={`settings-field ${isEditable ? 'is-editable' : ''} ${changed ? 'is-modified' : ''}`}
                      key={setting.key}
                    >
                      <span className="settings-label-row">
                        <span>{setting.label}</span>
                        {changed && <small>Modified</small>}
                      </span>
                      <span className="settings-input-wrap">
                        {setting.prefix && <span className="settings-affix">{setting.prefix}</span>}
                        {isCheckbox ? (
                          <input
                            type="checkbox"
                            checked={String(value) !== '0'}
                            disabled={!isEditable || saving}
                            onChange={event => handleFieldChange(setting.key, event.target.checked ? '1' : '0')}
                          />
                        ) : (
                          <input
                            type={setting.type}
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={value}
                            disabled={!isEditable || saving}
                            onChange={event => handleFieldChange(setting.key, event.target.value)}
                          />
                        )}
                        {setting.suffix && <span className="settings-affix">{setting.suffix}</span>}
                      </span>
                      <span className="settings-helper">{setting.helper}</span>
                      <span className="settings-default">Default: {isCheckbox ? (String(setting.default) !== '0' ? 'Enabled' : 'Disabled') : String(setting.default)}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="settings-side-panel">
          <div className="settings-side-card">
            <h3>Configuration Health</h3>
            <div className="settings-health-row">
              <span>Editable state</span>
              <strong>{isEditable ? 'Unlocked' : 'Locked'}</strong>
            </div>
            <div className="settings-health-row">
              <span>Pending changes</span>
              <strong>{Object.keys(changedSettings).length}</strong>
            </div>
            <div className="settings-health-row">
              <span>Managed settings</span>
              <strong>{settingDefinitions.length}</strong>
            </div>
          </div>
          <div className="settings-side-card">
            <h3>Recent Activity</h3>
            <p>Changes are recorded in the system log after saving.</p>
          </div>
        </aside>
      </main>

      {hasChanges && (
        <div className="settings-save-bar">
          <span>{Object.keys(changedSettings).length} pending change{Object.keys(changedSettings).length > 1 ? 's' : ''}</span>
          <div>
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;
