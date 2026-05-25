const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const normalizeMode = (value) => {
  const mode = String(value || 'log').trim().toLowerCase();
  return mode === 'smtp' ? 'smtp' : 'log';
};

const getEmailConfig = () => {
  const mode = normalizeMode(process.env.EMAIL_MODE);
  const user = process.env.SMTP_USER || '';
  const frontendUrl = process.env.FRONTEND_URL && process.env.FRONTEND_URL !== '*'
    ? process.env.FRONTEND_URL
    : '';

  return {
    enabled: normalizeBoolean(process.env.EMAIL_ENABLED, false),
    mode,
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: normalizeBoolean(process.env.SMTP_SECURE, true),
    user,
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || (user ? `Library System <${user}>` : ''),
    appPublicUrl: process.env.APP_PUBLIC_URL || frontendUrl || 'http://localhost:5173'
  };
};

const validateEmailConfig = (config = getEmailConfig()) => {
  if (!config.enabled || config.mode !== 'smtp') {
    return [];
  }

  const missing = [];
  const requiredFields = {
    SMTP_HOST: config.host,
    SMTP_PORT: config.port,
    SMTP_USER: config.user,
    SMTP_PASS: config.pass,
    EMAIL_FROM: config.from
  };

  Object.entries(requiredFields).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });

  return missing;
};

const getSafeEmailConfig = (config = getEmailConfig()) => ({
  enabled: config.enabled,
  mode: config.mode,
  host: config.host,
  port: config.port,
  secure: config.secure,
  from: config.from,
  appPublicUrl: config.appPublicUrl,
  hasUser: Boolean(config.user),
  hasPass: Boolean(config.pass)
});

module.exports = {
  getEmailConfig,
  getSafeEmailConfig,
  validateEmailConfig
};
