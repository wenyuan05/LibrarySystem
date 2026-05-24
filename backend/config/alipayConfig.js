const SANDBOX_GATEWAY = 'https://openapi-sandbox.dl.alipaydev.com/gateway.do';
const PRODUCTION_GATEWAY = 'https://openapi.alipay.com/gateway.do';

const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const wrapPemBody = (body) => {
  const compact = String(body || '').replace(/\s+/g, '');
  return compact.match(/.{1,64}/g)?.join('\n') || '';
};

const normalizePemKey = (value, type) => {
  if (!value) {
    return '';
  }

  const key = String(value).replace(/\\n/g, '\n').trim();
  if (!key) {
    return '';
  }

  if (key.includes('-----BEGIN')) {
    return key;
  }

  const label = type === 'private' ? 'PRIVATE KEY' : 'PUBLIC KEY';
  return `-----BEGIN ${label}-----\n${wrapPemBody(key)}\n-----END ${label}-----`;
};

const normalizeMode = (value) => {
  const mode = String(value || 'sandbox').trim().toLowerCase();
  return mode === 'production' ? 'production' : 'sandbox';
};

const getAlipayConfig = () => {
  const mode = normalizeMode(process.env.ALIPAY_MODE);
  const defaultGateway = mode === 'production' ? PRODUCTION_GATEWAY : SANDBOX_GATEWAY;

  return {
    enabled: normalizeBoolean(process.env.ALIPAY_ENABLED, false),
    mode,
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: normalizePemKey(process.env.ALIPAY_PRIVATE_KEY, 'private'),
    alipayPublicKey: normalizePemKey(process.env.ALIPAY_PUBLIC_KEY, 'public'),
    gateway: process.env.ALIPAY_GATEWAY || defaultGateway,
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
    returnUrl: process.env.ALIPAY_RETURN_URL || '',
    simulationEnabled: normalizeBoolean(process.env.ALIPAY_SIMULATION_ENABLED, mode === 'sandbox'),
    signType: process.env.ALIPAY_SIGN_TYPE || 'RSA2',
    charset: process.env.ALIPAY_CHARSET || 'utf-8',
    format: process.env.ALIPAY_FORMAT || 'json',
    timeoutMs: parseInt(process.env.ALIPAY_TIMEOUT_MS || '10000', 10)
  };
};

const validateAlipayConfig = (config = getAlipayConfig()) => {
  if (!config.enabled) {
    return [];
  }

  const missing = [];
  const requiredFields = {
    ALIPAY_APP_ID: config.appId,
    ALIPAY_PRIVATE_KEY: config.privateKey,
    ALIPAY_PUBLIC_KEY: config.alipayPublicKey,
    ALIPAY_GATEWAY: config.gateway,
    ALIPAY_NOTIFY_URL: config.notifyUrl,
    ALIPAY_RETURN_URL: config.returnUrl
  };

  Object.entries(requiredFields).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });

  return missing;
};

const getSafeAlipayConfig = (config = getAlipayConfig()) => ({
  enabled: config.enabled,
  mode: config.mode,
  gateway: config.gateway,
  notifyUrl: config.notifyUrl,
  returnUrl: config.returnUrl,
  simulationEnabled: config.simulationEnabled,
  signType: config.signType,
  charset: config.charset,
  format: config.format,
  timeoutMs: config.timeoutMs,
  hasAppId: Boolean(config.appId),
  hasPrivateKey: Boolean(config.privateKey),
  hasAlipayPublicKey: Boolean(config.alipayPublicKey)
});

module.exports = {
  SANDBOX_GATEWAY,
  PRODUCTION_GATEWAY,
  getAlipayConfig,
  getSafeAlipayConfig,
  validateAlipayConfig
};
