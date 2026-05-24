const crypto = require('crypto');

const formatTimestamp = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds())
  ].join('');
};

const buildSignContent = (params) => (
  Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
);

const switchPemLabel = (key, fromLabel, toLabel) => (
  key
    .replace(`-----BEGIN ${fromLabel}-----`, `-----BEGIN ${toLabel}-----`)
    .replace(`-----END ${fromLabel}-----`, `-----END ${toLabel}-----`)
);

const buildPrivateKeyCandidates = (privateKey) => {
  const candidates = [privateKey];
  if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    candidates.push(switchPemLabel(privateKey, 'PRIVATE KEY', 'RSA PRIVATE KEY'));
  }
  if (privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    candidates.push(switchPemLabel(privateKey, 'RSA PRIVATE KEY', 'PRIVATE KEY'));
  }
  return [...new Set(candidates)];
};

const signParams = (params, privateKey, signType = 'RSA2') => {
  const algorithm = signType === 'RSA' ? 'RSA-SHA1' : 'RSA-SHA256';
  const signContent = buildSignContent(params);
  let lastError;

  for (const candidate of buildPrivateKeyCandidates(privateKey)) {
    try {
      const signer = crypto.createSign(algorithm);
      signer.update(signContent, 'utf8');
      signer.end();
      return signer.sign(candidate, 'base64');
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
};

const buildGatewayUrl = (gateway, params) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).sort().forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      searchParams.append(key, params[key]);
    }
  });
  return `${gateway}?${searchParams.toString()}`;
};

const buildPagePayUrl = (config, payment) => {
  const bizContent = {
    out_trade_no: payment.out_trade_no,
    product_code: 'FAST_INSTANT_TRADE_PAY',
    total_amount: Number(payment.amount).toFixed(2),
    subject: payment.subject || `Library fine payment #${payment.out_trade_no}`
  };

  const params = {
    app_id: config.appId,
    method: 'alipay.trade.page.pay',
    format: config.format,
    charset: config.charset,
    sign_type: config.signType,
    timestamp: formatTimestamp(),
    version: '1.0',
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
    biz_content: JSON.stringify(bizContent)
  };

  return buildGatewayUrl(config.gateway, {
    ...params,
    sign: signParams(params, config.privateKey, config.signType)
  });
};

const buildTradeQueryUrl = (config, outTradeNo) => {
  const params = {
    app_id: config.appId,
    method: 'alipay.trade.query',
    format: config.format,
    charset: config.charset,
    sign_type: config.signType,
    timestamp: formatTimestamp(),
    version: '1.0',
    biz_content: JSON.stringify({ out_trade_no: outTradeNo })
  };

  return buildGatewayUrl(config.gateway, {
    ...params,
    sign: signParams(params, config.privateKey, config.signType)
  });
};

const queryTrade = async (config, outTradeNo) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(buildTradeQueryUrl(config, outTradeNo), {
      method: 'GET',
      signal: controller.signal
    });
    const payload = await response.json();
    return payload.alipay_trade_query_response || payload;
  } finally {
    clearTimeout(timeout);
  }
};

const verifyNotification = (payload, alipayPublicKey, signType = 'RSA2') => {
  const { sign, sign_type: payloadSignType, ...params } = payload;
  if (!sign) {
    return false;
  }

  const algorithm = (payloadSignType || signType) === 'RSA' ? 'RSA-SHA1' : 'RSA-SHA256';
  const verifier = crypto.createVerify(algorithm);
  verifier.update(buildSignContent(params), 'utf8');
  verifier.end();
  return verifier.verify(alipayPublicKey, sign, 'base64');
};

module.exports = {
  buildPagePayUrl,
  queryTrade,
  verifyNotification
};
