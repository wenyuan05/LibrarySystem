const crypto = require('crypto');
const db = require('../db');
const { getAlipayConfig, getSafeAlipayConfig, validateAlipayConfig } = require('../config/alipayConfig');
const { buildPagePayUrl, precreateTrade, queryTrade, verifyNotification } = require('../services/alipayClient');

const ADMIN_ROLES = ['admin', 'librarian'];

const canAccessUser = (req, userId) => (
  Number(userId) === req.user.id || ADMIN_ROLES.includes(req.user.role)
);

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
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

const isValidDateOnly = (value) => {
  if (!DATE_PATTERN.test(String(value || ''))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const addMonthsUtc = (date, months) => {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  copy.setUTCMonth(copy.getUTCMonth() + months);
  return copy;
};

const formatMonthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getLastTwelveMonthKeys = () => {
  const currentMonth = new Date();
  const start = addMonthsUtc(currentMonth, -11);
  return Array.from({ length: 12 }, (_, index) => formatMonthKey(addMonthsUtc(start, index)));
};

const parseDateOnly = (value) => new Date(`${value}T00:00:00Z`);

const addDaysUtc = (date, days) => {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const getDaySpanInclusive = (startDate, endDate) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((parseDateOnly(endDate) - parseDateOnly(startDate)) / msPerDay) + 1;
};

const getMonthEndDate = (monthKey, maxEndDate) => {
  const [year, month] = monthKey.split('-').map(Number);
  const end = new Date(Date.UTC(year, month, 0));
  const endKey = formatDateKey(end);
  return endKey > maxEndDate ? maxEndDate : endKey;
};

const buildIncomeTrendBuckets = (startDate, endDate, granularity) => {
  const buckets = [];

  if (granularity === 'month') {
    let cursor = new Date(Date.UTC(parseDateOnly(startDate).getUTCFullYear(), parseDateOnly(startDate).getUTCMonth(), 1));
    const finalMonth = formatMonthKey(parseDateOnly(endDate));

    while (formatMonthKey(cursor) <= finalMonth) {
      const month = formatMonthKey(cursor);
      const bucketStart = month === formatMonthKey(parseDateOnly(startDate)) ? startDate : `${month}-01`;
      buckets.push({
        key: month,
        label: month,
        start_date: bucketStart,
        end_date: getMonthEndDate(month, endDate),
        income: 0,
        paid_count: 0
      });
      cursor = addMonthsUtc(cursor, 1);
    }

    return buckets;
  }

  if (granularity === 'week') {
    let cursor = parseDateOnly(startDate);
    while (formatDateKey(cursor) <= endDate) {
      const bucketStart = formatDateKey(cursor);
      const bucketEnd = formatDateKey(addDaysUtc(cursor, 6)) > endDate ? endDate : formatDateKey(addDaysUtc(cursor, 6));
      buckets.push({
        key: `${bucketStart}_${bucketEnd}`,
        label: `${bucketStart.slice(5)}~${bucketEnd.slice(5)}`,
        start_date: bucketStart,
        end_date: bucketEnd,
        income: 0,
        paid_count: 0
      });
      cursor = addDaysUtc(cursor, 7);
    }

    return buckets;
  }

  let cursor = parseDateOnly(startDate);
  while (formatDateKey(cursor) <= endDate) {
    const day = formatDateKey(cursor);
    buckets.push({
      key: day,
      label: day.slice(5),
      start_date: day,
      end_date: day,
      income: 0,
      paid_count: 0
    });
    cursor = addDaysUtc(cursor, 1);
  }

  return buckets;
};

const getIncomeTrendOptions = (query) => {
  const hasRange = Boolean(query.start_date || query.end_date);

  if (!hasRange) {
    const monthKeys = getLastTwelveMonthKeys();
    return {
      hasRange,
      granularity: 'month',
      startDate: `${monthKeys[0]}-01`,
      endDate: formatDateKey(new Date())
    };
  }

  const startDate = query.start_date || query.end_date;
  const endDate = query.end_date || query.start_date;
  const daySpan = getDaySpanInclusive(startDate, endDate);
  let granularity = 'month';
  if (daySpan <= 31) {
    granularity = 'day';
  } else if (daySpan <= 180) {
    granularity = 'week';
  }

  return { hasRange, granularity, startDate, endDate };
};

const parsePositiveInt = (value, fallback, maxValue) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maxValue);
};

const buildPaymentUrl = (payment) => {
  const baseUrl = process.env.ALIPAY_RETURN_URL || 'http://localhost:5173/payment-result';
  const params = new URLSearchParams({
    out_trade_no: payment.out_trade_no,
    amount: roundMoney(payment.amount).toFixed(2)
  });
  return `${baseUrl}?${params.toString()}`;
};

const buildProviderPaymentUrl = async (payment, config = getAlipayConfig()) => {
  const missing = validateAlipayConfig(config);
  if (!config.enabled || missing.length > 0) {
    return {
      paymentUrl: buildPaymentUrl(payment),
      qrCode: buildPaymentUrl(payment),
      source: 'local'
    };
  }

  const paymentUrl = buildPagePayUrl(config, payment);
  let qrCode = '';
  let source = 'alipay-precreate';
  try {
    const precreateResult = await precreateTrade(config, payment);
    if (precreateResult.code === '10000' && precreateResult.qr_code) {
      qrCode = precreateResult.qr_code;
    } else {
      throw new Error(precreateResult.sub_msg || precreateResult.msg || precreateResult.code || 'Alipay precreate failed');
    }
  } catch (precreateErr) {
    throw new Error(`Failed to create Alipay QR code: ${precreateErr.message}`);
  }

  return {
    paymentUrl,
    qrCode,
    source
  };
};

const refreshPaymentCheckout = async (payment) => {
  const providerPayment = await buildProviderPaymentUrl(payment);
  return await new Promise((resolve, reject) => {
    db.run(
      `UPDATE payments
       SET qr_code = ?,
           payment_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [providerPayment.qrCode, providerPayment.paymentUrl, payment.id],
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          ...payment,
          qr_code: providerPayment.qrCode,
          payment_url: providerPayment.paymentUrl,
          payment_url_source: providerPayment.source
        });
      }
    );
  });
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
                 provider_trade_no = COALESCE(?, provider_trade_no),
                 raw_notify = ?,
                 paid_at = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [rawNotify?.trade_no || null, JSON.stringify(rawNotify || {}), paidAt, payment.id],
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
                    provider_trade_no: rawNotify?.trade_no || payment.provider_trade_no,
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

const expirePaymentRow = (payment, callback) => {
  if (payment.status !== 'pending') {
    callback(new Error('Only pending payments can be expired'));
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
        callback(updateErr);
        return;
      }

      callback(null, mapPaymentRow({ ...payment, status: 'expired' }));
    }
  );
};

const syncPendingAlipayPayment = async (payment) => {
  const config = getAlipayConfig();
  if (payment.status !== 'pending' || !config.enabled || validateAlipayConfig(config).length > 0) {
    return mapPaymentRow(payment);
  }

  let queryResult;
  try {
    queryResult = await queryTrade(config, payment.out_trade_no);
  } catch (queryErr) {
    console.error('Failed to query Alipay trade status:', queryErr.message);
    return mapPaymentRow(payment);
  }
  if (queryResult.code !== '10000') {
    return mapPaymentRow(payment);
  }

  if (queryResult.total_amount && roundMoney(queryResult.total_amount) !== roundMoney(payment.amount)) {
    console.error('Alipay query amount does not match local payment:', {
      out_trade_no: payment.out_trade_no,
      local_amount: payment.amount,
      alipay_amount: queryResult.total_amount
    });
    return mapPaymentRow(payment);
  }

  if (['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(queryResult.trade_status)) {
    return await new Promise((resolve, reject) => {
      completePayment(payment, {
        source: 'alipay-trade-query',
        ...queryResult
      }, (completeErr, paidPayment) => {
        if (completeErr) {
          reject(completeErr);
          return;
        }
        resolve(paidPayment);
      });
    });
  }

  if (queryResult.trade_status === 'TRADE_CLOSED') {
    return await new Promise((resolve, reject) => {
      expirePaymentRow(payment, (expireErr, expiredPayment) => {
        if (expireErr) {
          reject(expireErr);
          return;
        }
        resolve(expiredPayment);
      });
    });
  }

  return mapPaymentRow(payment);
};

const respondWithSyncedPayment = (res, payment) => {
  syncPendingAlipayPayment(payment)
    .then(syncedPayment => res.json(syncedPayment))
    .catch(err => {
      console.error('Failed to synchronize Alipay payment:', err.message);
      res.json(mapPaymentRow(payment));
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
      findReusablePendingFinePayment(userId, borrowRecordIds, amount, async (pendingErr, pendingPayment) => {
        if (pendingErr) {
          res.status(500).json({ error: pendingErr.message });
          return;
        }

        if (pendingPayment) {
          let reusablePayment = pendingPayment;
          if (pendingPayment.qr_code === pendingPayment.payment_url) {
            try {
              reusablePayment = await refreshPaymentCheckout(pendingPayment);
            } catch (refreshErr) {
              res.status(500).json({ error: refreshErr.message });
              return;
            }
          }

          res.json({
            ...mapPaymentRow(reusablePayment),
            reused: true,
            payment_url_source: reusablePayment.payment_url_source,
            simulate_notify_path: `/api/payments/alipay/simulate-notify/${reusablePayment.out_trade_no}`
          });
          return;
        }

      const outTradeNo = generateOutTradeNo();
      const subject = `Library fine payment #${outTradeNo}`;
      let providerPayment;
      try {
        providerPayment = await buildProviderPaymentUrl({ out_trade_no: outTradeNo, amount, subject });
      } catch (paymentUrlErr) {
        res.status(500).json({ error: `Failed to build Alipay payment URL: ${paymentUrlErr.message}` });
        return;
      }

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
          providerPayment.qrCode,
          providerPayment.paymentUrl,
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
            qr_code: providerPayment.qrCode,
            payment_url: providerPayment.paymentUrl,
            payment_url_source: providerPayment.source,
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
    date_to,
    keyword
  } = req.query;
  const page = parsePositiveInt(req.query.page, 1, 100000);
  const pageSize = parsePositiveInt(req.query.page_size, 10, 100);
  const offset = (page - 1) * pageSize;

  const where = [];
  const params = [];

  if ((date_from && !isValidDateOnly(date_from)) || (date_to && !isValidDateOnly(date_to))) {
    res.status(400).json({ error: 'date_from and date_to must use YYYY-MM-DD format' });
    return;
  }

  if (date_from && date_to && date_from > date_to) {
    res.status(400).json({ error: 'date_from cannot be after date_to' });
    return;
  }

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

  if (keyword && String(keyword).trim()) {
    const value = `%${String(keyword).trim()}%`;
    where.push(`(
      p.out_trade_no LIKE ?
      OR p.status LIKE ?
      OR CAST(p.user_id AS TEXT) LIKE ?
      OR u.username LIKE ?
      OR u.name LIKE ?
    )`);
    params.push(value, value, value, value, value);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  db.get(
    `SELECT COUNT(*) as total
     FROM payments p
     LEFT JOIN users u ON p.user_id = u.id
     ${whereSql}`,
    params,
    (countErr, countRow) => {
      if (countErr) {
        res.status(500).json({ error: countErr.message });
        return;
      }

      db.all(
        `SELECT p.*, u.username, u.name
         FROM payments p
         LEFT JOIN users u ON p.user_id = u.id
         ${whereSql}
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
        (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          const total = countRow?.total || 0;
          res.json({
            items: rows.map(mapPaymentRow),
            pagination: {
              page,
              page_size: pageSize,
              total,
              total_pages: Math.max(1, Math.ceil(total / pageSize))
            }
          });
        }
      );
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

    respondWithSyncedPayment(res, payment);
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

    respondWithSyncedPayment(res, payment);
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

    expirePaymentRow(payment, (expireErr, expiredPayment) => {
      if (expireErr) {
        res.status(500).json({ error: expireErr.message });
        return;
      }

      res.json({
        message: 'Payment expired successfully',
        payment: expiredPayment
      });
    });
  });
};

exports.alipayNotify = function(req, res) {
  const config = getAlipayConfig();
  const payload = req.body || {};

  if (!config.enabled) {
    res.status(400).send('fail');
    return;
  }

  if (!verifyNotification(payload, config.alipayPublicKey, config.signType)) {
    res.status(400).send('fail');
    return;
  }

  if (!['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(payload.trade_status)) {
    res.send('success');
    return;
  }

  db.get('SELECT * FROM payments WHERE out_trade_no = ?', [payload.out_trade_no], (err, payment) => {
    if (err || !payment) {
      res.status(400).send('fail');
      return;
    }

    if (payload.app_id && payload.app_id !== config.appId) {
      res.status(400).send('fail');
      return;
    }

    if (payload.total_amount && roundMoney(payload.total_amount) !== roundMoney(payment.amount)) {
      res.status(400).send('fail');
      return;
    }

    completePayment(payment, payload, (completeErr) => {
      if (completeErr) {
        res.status(400).send('fail');
        return;
      }

      res.send('success');
    });
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

exports.getIncomeAnalytics = function(req, res) {
  const requestedStart = req.query.start_date || req.query.end_date || '';
  const requestedEnd = req.query.end_date || req.query.start_date || '';

  if ((requestedStart && !isValidDateOnly(requestedStart)) || (requestedEnd && !isValidDateOnly(requestedEnd))) {
    res.status(400).json({ error: 'start_date and end_date must use YYYY-MM-DD format' });
    return;
  }

  if (requestedStart && requestedEnd && requestedStart > requestedEnd) {
    res.status(400).json({ error: 'start_date cannot be after end_date' });
    return;
  }

  const trendOptions = getIncomeTrendOptions(req.query);
  const trendBuckets = buildIncomeTrendBuckets(trendOptions.startDate, trendOptions.endDate, trendOptions.granularity);

  db.all(
    `SELECT date(paid_at) as paid_date,
            COALESCE(SUM(amount), 0) as income,
            COUNT(*) as paid_count
     FROM payments
     WHERE provider = 'alipay'
       AND payment_type = 'fine'
       AND status = 'paid'
       AND date(paid_at) BETWEEN date(?) AND date(?)
     GROUP BY date(paid_at)`,
    [trendOptions.startDate, trendOptions.endDate],
    (monthlyErr, rows) => {
      if (monthlyErr) {
        res.status(500).json({ error: monthlyErr.message });
        return;
      }

      (rows || []).forEach(row => {
        const bucket = trendBuckets.find(item => row.paid_date >= item.start_date && row.paid_date <= item.end_date);
        if (bucket) {
          bucket.income = roundMoney(bucket.income + row.income);
          bucket.paid_count += row.paid_count || 0;
        }
      });

      const rangeStart = trendOptions.startDate;
      const rangeEnd = trendOptions.endDate;

      db.get(
        `SELECT COALESCE(SUM(amount), 0) as total_income,
                COUNT(*) as paid_count
         FROM payments
         WHERE provider = 'alipay'
           AND payment_type = 'fine'
           AND status = 'paid'
           AND date(paid_at) BETWEEN date(?) AND date(?)`,
        [rangeStart, rangeEnd],
        (rangeErr, rangeRow) => {
          if (rangeErr) {
            res.status(500).json({ error: rangeErr.message });
            return;
          }

          res.json({
            trend: {
              granularity: trendOptions.granularity,
              start_date: trendOptions.startDate,
              end_date: trendOptions.endDate,
              buckets: trendBuckets
            },
            range: {
              start_date: rangeStart,
              end_date: rangeEnd,
              total_income: roundMoney(rangeRow?.total_income || 0),
              paid_count: rangeRow?.paid_count || 0
            }
          });
        }
      );
    }
  );
};
