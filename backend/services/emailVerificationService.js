const bcrypt = require('bcrypt');
const db = require('../db');
const { sendMail } = require('./emailService');

const CODE_TTL_MINUTES = 10;
const VALID_PURPOSES = new Set(['registration', 'password_reset']);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const getPurposeLabel = (purpose) => {
  if (purpose === 'registration') return 'registration';
  if (purpose === 'password_reset') return 'password reset';
  return 'verification';
};

const storeCode = ({ email, purpose, code }) => new Promise((resolve, reject) => {
  const normalizedEmail = normalizeEmail(email);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  bcrypt.hash(code, 10, (hashErr, hash) => {
    if (hashErr) {
      reject(hashErr);
      return;
    }

    db.serialize(() => {
      db.run(
        'UPDATE email_verification_codes SET used_at = CURRENT_TIMESTAMP WHERE email = ? AND purpose = ? AND used_at IS NULL',
        [normalizedEmail, purpose]
      );
      db.run(
        `INSERT INTO email_verification_codes (email, purpose, code_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
        [normalizedEmail, purpose, hash, expiresAt],
        function(insertErr) {
          if (insertErr) {
            reject(insertErr);
            return;
          }
          resolve({ id: this.lastID, expiresAt });
        }
      );
    });
  });
});

const sendVerificationCode = async ({ email, purpose }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email is required');
  }
  if (!VALID_PURPOSES.has(purpose)) {
    throw new Error('Invalid verification purpose');
  }

  const code = generateCode();
  const { expiresAt } = await storeCode({ email: normalizedEmail, purpose, code });
  const label = getPurposeLabel(purpose);

  await sendMail({
    to: normalizedEmail,
    scenario: `${purpose}_verification`,
    subject: `Library System ${label} verification code`,
    text: `Your Library System ${label} verification code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
    html: `<p>Your Library System ${label} verification code is:</p><p><strong style="font-size:24px;letter-spacing:4px;">${code}</strong></p><p>It expires in ${CODE_TTL_MINUTES} minutes.</p>`
  });

  return { email: normalizedEmail, purpose, expiresAt };
};

const verifyCode = ({ email, purpose, code }) => new Promise((resolve, reject) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').trim();

  if (!normalizedEmail || !purpose || !normalizedCode) {
    reject(new Error('Verification code is required'));
    return;
  }

  db.get(
    `SELECT id, code_hash, expires_at
     FROM email_verification_codes
     WHERE email = ? AND purpose = ? AND used_at IS NULL
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT 1`,
    [normalizedEmail, purpose],
    async (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (!row) {
        reject(new Error('Verification code not found or already used'));
        return;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        reject(new Error('Verification code has expired'));
        return;
      }

      try {
        const matched = await bcrypt.compare(normalizedCode, row.code_hash);
        if (!matched) {
          reject(new Error('Invalid verification code'));
          return;
        }

        db.run(
          'UPDATE email_verification_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ?',
          [row.id],
          (updateErr) => {
            if (updateErr) {
              reject(updateErr);
              return;
            }
            resolve(true);
          }
        );
      } catch (compareErr) {
        reject(compareErr);
      }
    }
  );
});

module.exports = {
  sendVerificationCode,
  verifyCode,
  normalizeEmail
};
