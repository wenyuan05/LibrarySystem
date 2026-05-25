const nodemailer = require('nodemailer');
const db = require('../db');
const { getEmailConfig, validateEmailConfig } = require('../config/emailConfig');

let cachedTransporter = null;
let cachedTransportKey = '';

const getTransporter = (config) => {
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (cachedTransporter && cachedTransportKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
  cachedTransportKey = key;
  return cachedTransporter;
};

const logEmail = ({ userId = null, to, subject, scenario, status, errorMessage = '' }) => {
  db.run(
    `INSERT INTO email_logs (user_id, to_email, subject, scenario, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, to, subject, scenario, status, errorMessage],
    (err) => {
      if (err) {
        console.error('Failed to write email log:', err.message);
      }
    }
  );
};

const sendMail = async ({ userId = null, to, subject, text, html, scenario = 'general' }) => {
  const config = getEmailConfig();
  if (!to) {
    logEmail({ userId, to: '', subject, scenario, status: 'failed', errorMessage: 'Recipient email is required' });
    throw new Error('Recipient email is required');
  }

  if (!config.enabled) {
    logEmail({ userId, to, subject, scenario, status: 'skipped', errorMessage: 'Email is disabled' });
    return { skipped: true, mode: config.mode };
  }

  if (config.mode === 'log') {
    console.log('[email:log]', { to, subject, scenario, text });
    logEmail({ userId, to, subject, scenario, status: 'logged' });
    return { logged: true, mode: config.mode };
  }

  const missing = validateEmailConfig(config);
  if (missing.length > 0) {
    const message = `Missing email configuration: ${missing.join(', ')}`;
    logEmail({ userId, to, subject, scenario, status: 'failed', errorMessage: message });
    throw new Error(message);
  }

  try {
    const transporter = getTransporter(config);
    const result = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html
    });
    logEmail({ userId, to, subject, scenario, status: 'sent' });
    return { sent: true, messageId: result.messageId, mode: config.mode };
  } catch (err) {
    logEmail({ userId, to, subject, scenario, status: 'failed', errorMessage: err.message });
    throw err;
  }
};

const sendMailSafe = async (mail) => {
  try {
    return await sendMail(mail);
  } catch (err) {
    console.error(`Failed to send ${mail.scenario || 'general'} email:`, err.message);
    return { error: err.message };
  }
};

module.exports = {
  sendMail,
  sendMailSafe
};
