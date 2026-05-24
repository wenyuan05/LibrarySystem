const crypto = require('crypto');
const db = require('../db');
const { getAlipayConfig, getSafeAlipayConfig, validateAlipayConfig } = require('../config/alipayConfig');

const ADMIN_ROLES = ['admin', 'librarian'];

const canAccessUser = (req, userId) => (
  Number(userId) === req.user.id || ADMIN_ROLES.includes(req.user.role)
);

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;
const parseBorrowRecordIds = (value) => {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch (_) {
    return [];
  }
};

const generateOutTradeNo = () => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ALI${timestamp}${suffix}`;
};

const getPayableFineStatusClause = () => "status IN ('returning', 'returned')";

const buildPaymentUrl = (payment) => {
  const baseUrl = process.env.ALIPAY_RETURN_URL || 'http://localhost:5173/payment-result';
  const params = new URLSearchParams({
    out_trade_no: payment.out_trade_no,
    amount: roundMoney(payment.amount).toFixed(2)
  });
  return `${baseUrl}?${params.toString()}`;
};

const mapPaymentRow = (row) => {
  if (!row) return null;
  const paymentUrl = row.payment_url || buildPaymentUrl(row);

  return {
    ...row,
    amount: roundMoney(row.amount),
    qr_code: row.qr_code || paymentUrl,
    payment_url: paymentUrl,
    borrow_record_ids: parseBorrowRecordIds(row.borrow_record_ids)
  };
};

const findReusablePendingFinePayment = (userId, borrowRecordIds, amount, callback) => {
  db.all(
    `SELECT *
     FROM payments
     WHERE user_id = ?
       AND provider = 'alipay'
       AND payment_type = 'fine'
       AND status = 'pending'
     ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        callback(err);
        return;
      }

      const targetIds = [...borrowRecordIds].sort((a, b) => a - b).join(',');
      const reusable = rows.find(row => {
        const rowIds = parseBorrowRecordIds(row.borrow_record_ids).sort((a, b) => a - b).join(',');
        return rowIds === targetIds && roundMoney(row.amount) === amount;
      });

      callback(null, reusable || null);
    }
  );
};

const syncUserFineTotal = (userId, callback) => {
  db.run(
    `UPDATE users
     SET total_fine = (
       SELECT COALESCE(SUM(fine), 0)
       FROM borrow_records
       WHERE user_id = ?
         AND fine > 0
         AND fine_status = 'unpaid'
         AND status IN ('returning', 'returned')
     )
     WHERE id = ?`,
    [userId, userId],
    callback
  );
};

const completePayment = (payment, rawNotify, callback) => {
  if (payment.status === 'paid') {
    callback(null, mapPaymentRow(payment));
    return;
  }

  if (payment.status === 'expired') {
    callback(new Error('Expired payments cannot be completed'));
    return;
  }

  if (payment.status !== 'pending') {
    callback(new Error(`Payment status ${payment.status} cannot be completed`));
    return;
  }

  const borrowRecordIds = payment.borrow_record_ids ? JSON.parse(payment.borrow_record_ids) : [];
  if (borrowRecordIds.length === 0) {
    callback(new Error('Payment has no linked fine records'));
    return;
  }

  const paidAt = new Date().toISOString();
  const placeholders = borrowRecordIds.map(() => '?').join(',');

  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {
        callback(beginErr);
        return;
      }

      db.run(
        `UPDATE borrow_records
         SET fine_status = 'paid'
         WHERE user_id = ?
           AND fine > 0
           AND fine_status = 'unpaid'
           AND ${getPayableFineStatusClause()}
           AND id IN (${placeholders})`,
        [payment.user_id, ...borrowRecordIds],
        function(fineErr) {
          if (fineErr) {
            db.run('ROLLBACK');
            callback(fineErr);
            return;
          }

          if (this.changes !== borrowRecordIds.length) {
            db.run('ROLLBACK');
            callback(new Error('Linked fines are no longer payable'));
            return;
          }

          db.run(
            `UPDATE payments
             SET status = 'paid',
                 raw_notify = ?,
                 paid_at = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [JSON.stringify(rawNotify || {}), paidAt, payment.id],
            (paymentErr) => {
              if (paymentErr) {
                db.run('ROLLBACK');
                callback(paymentErr);
                return;
              }

              syncUserFineTotal(payment.user_id, (syncErr) => {
                if (syncErr) {
                  db.run('ROLLBACK');
                  callback(syncErr);
                  return;
                }

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    callback(commitErr);
                    return;
                  }

                  callback(null, mapPaymentRow({
                    ...payment,
                    status: 'paid',
                    raw_notify: JSON.stringify(rawNotify || {}),
                    paid_at: paidAt
                  }));
                });
              });
            }
          );
        }
      );
    });
  });
};

exports.getAlipayStatus = function(req, res) {
  const config = getAlipayConfig();
  res.json({
    ...getSafeAlipayConfig(config),
    missing: validateAlipayConfig(config)
  });
};

exports.createFineAlipayPayment = function(req, res) {
  const userId = Number(req.body.user_id || req.user.id);
  if (!canAccessUser(req, userId)) {
    res.status(403).json({ error: 'Forbidden: cannot create payment for other users' });
    return;
  }

  db.all(
    `SELECT id, fine
     FROM borrow_records
     WHERE user_id = ?
       AND fine > 0
       AND fine_status = 'unpaid'
       AND ${getPayableFineStatusClause()}
     ORDER BY id ASC`,
    [userId],
    (err, fineRows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!fineRows || fineRows.length === 0) {
        res.status(400).json({ error: 'No actual unpaid fines to pay. Estimated overdue fines can be paid after the book is returned.' });
        return;
      }

      const amount = roundMoney(fineRows.reduce((sum, row) => sum + (Number(row.fine) || 0), 0));
      const borrowRecordIds = fineRows.map(row => row.id);
      findReusablePendingFinePayment(userId, borrowRecordIds, amount, (pendingErr, pendingPayment) => {
        if (pendingErr) {
          res.status(500).json({ error: pendingErr.message });
          return;
        }

        if (pendingPayment) {
          res.json({
            ...mapPaymentRow(pendingPayment),
            reused: true,
            simulate_notify_path: `/api/payments/alipay/simulate-notify/${pendingPayment.out_trade_no}`
          });
          return;
        }

      const outTradeNo = generateOutTradeNo();
      const subject = `Library fine payment #${outTradeNo}`;
      const paymentUrl = buildPaymentUrl({ out_trade_no: outTradeNo, amount });
      const qrCode = paymentUrl;

      db.run(
        `INSERT INTO payments
          (user_id, provider, payment_type, out_trade_no, amount, status, subject, qr_code, payment_url, borrow_record_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'alipay',
          'fine',
          outTradeNo,
          amount,
          'pending',
          subject,
          qrCode,
          paymentUrl,
          JSON.stringify(borrowRecordIds)
        ],
        function(insertErr) {
          if (insertErr) {
            res.status(500).json({ error: insertErr.message });
            return;
          }

          res.status(201).json({
            id: this.lastID,
            user_id: userId,
            provider: 'alipay',
            payment_type: 'fine',
            out_trade_no: outTradeNo,
            amount,
            status: 'pending',
            subject,
            qr_code: qrCode,
            payment_url: paymentUrl,
            borrow_record_ids: borrowRecordIds,
            simulate_notify_path: `/api/payments/alipay/simulate-notify/${outTradeNo}`
          });
        }
      );
      });
    }
  );
};

exports.listPayments = function(req, res) {
  const {
    user_id,
    status,
    provider = 'alipay',
    payment_type,
    date_from,
    date_to
  } = req.query;

  const where = [];
  const params = [];

  if (!ADMIN_ROLES.includes(req.user.role)) {
    where.push('p.user_id = ?');
    params.push(req.user.id);
  } else if (user_id) {
    where.push('p.user_id = ?');
    params.push(Number(user_id));
  }

  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }

  if (provider) {
    where.push('p.provider = ?');
    params.push(provider);
  }

  if (payment_type) {
    where.push('p.payment_type = ?');
    params.push(payment_type);
  }

  if (date_from) {
    where.push('date(p.created_at) >= date(?)');
    params.push(date_from);
  }

  if (date_to) {
    where.push('date(p.created_at) <= date(?)');
    params.push(date_to);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  db.all(
    `SELECT p.*, u.username, u.name
     FROM payments p
     LEFT JOIN users u ON p.user_id = u.id
     ${whereSql}
     ORDER BY p.created_at DESC
     LIMIT 200`,
    params,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json(rows.map(mapPaymentRow));
    }
  );
};

exports.getPayment = function(req, res) {
  db.get('SELECT * FROM payments WHERE id = ?', [req.params.id], (err, payment) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (!canAccessUser(req, payment.user_id)) {
      res.status(403).json({ error: 'Forbidden: cannot view this payment' });
      return;
    }

    res.json(mapPaymentRow(payment));
  });
};

exports.getPaymentByOutTradeNo = function(req, res) {
  db.get('SELECT * FROM payments WHERE out_trade_no = ?', [req.params.out_trade_no], (err, payment) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (!canAccessUser(req, payment.user_id)) {
      res.status(403).json({ error: 'Forbidden: cannot view this payment' });
      return;
    }

    res.json(mapPaymentRow(payment));
  });
};

exports.simulateAlipayNotify = function(req, res) {
  const { out_trade_no } = req.params;
  const config = getAlipayConfig();

  if (!config.simulationEnabled) {
    res.status(403).json({ error: 'Alipay simulation is disabled' });
    return;
  }

  db.get('SELECT * FROM payments WHERE out_trade_no = ?', [out_trade_no], (err, payment) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (!canAccessUser(req, payment.user_id)) {
      res.status(403).json({ error: 'Forbidden: cannot simulate this payment' });
      return;
    }

    completePayment(payment, {
      source: 'local-simulation',
      trade_status: 'TRADE_SUCCESS',
      out_trade_no,
      simulated_at: new Date().toISOString()
    }, (completeErr, paidPayment) => {
      if (completeErr) {
        res.status(500).json({ error: completeErr.message });
        return;
      }

      res.json({
        message: 'Payment simulated successfully',
        payment: paidPayment
      });
    });
  });
};

exports.expirePayment = function(req, res) {
  db.get('SELECT * FROM payments WHERE id = ?', [req.params.id], (err, payment) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (!canAccessUser(req, payment.user_id)) {
      res.status(403).json({ error: 'Forbidden: cannot expire this payment' });
      return;
    }

    if (payment.status !== 'pending') {
      res.status(400).json({ error: 'Only pending payments can be expired' });
      return;
    }

    db.run(
      `UPDATE payments
       SET status = 'expired',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payment.id],
      (updateErr) => {
        if (updateErr) {
          res.status(500).json({ error: updateErr.message });
          return;
        }

        res.json({
          message: 'Payment expired successfully',
          payment: mapPaymentRow({ ...payment, status: 'expired' })
        });
      }
    );
  });
};

exports.alipayNotify = function(req, res) {
  res.status(501).json({
    error: 'Real Alipay notify verification is not implemented yet. Use the authenticated simulate-notify endpoint for local testing.'
  });
};

exports.getIncomeSummary = function(req, res) {
  const sql = `
    SELECT
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN status = 'paid' AND date(paid_at) = date('now', 'localtime') THEN amount ELSE 0 END), 0) as today_income,
      COALESCE(SUM(CASE WHEN status = 'paid' AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now', 'localtime') THEN amount ELSE 0 END), 0) as month_income,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
    FROM payments
    WHERE provider = 'alipay' AND payment_type = 'fine'
  `;

  db.get(sql, [], (err, summary) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    db.all(
      `SELECT p.id, p.user_id, u.username, u.name, p.out_trade_no, p.amount, p.status, p.paid_at, p.created_at
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.provider = 'alipay' AND p.payment_type = 'fine'
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [],
      (listErr, rows) => {
        if (listErr) {
          res.status(500).json({ error: listErr.message });
          return;
        }

        res.json({
          total_income: roundMoney(summary.total_income),
          today_income: roundMoney(summary.today_income),
          month_income: roundMoney(summary.month_income),
          paid_count: summary.paid_count || 0,
          pending_count: summary.pending_count || 0,
          recent_payments: rows.map(row => ({
            ...row,
            amount: roundMoney(row.amount)
          }))
        });
      }
    );
  });
};
