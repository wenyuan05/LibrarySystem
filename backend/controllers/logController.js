const db = require('../db');

exports.getSystemLogs = (req, res) => {
  const {
    limit = 100,
    offset = 0,
    order = 'desc',
    keyword = '',
    action = '',
    user_id = '',
    date_from = '',
    date_to = ''
  } = req.query;
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);
  const sortDirection = order === 'asc' ? 'ASC' : 'DESC';
  const whereClauses = [];
  const whereParams = [];

  if (keyword.trim()) {
    whereClauses.push('(action LIKE ? OR description LIKE ? OR CAST(user_id AS TEXT) LIKE ?)');
    const keywordLike = `%${keyword.trim()}%`;
    whereParams.push(keywordLike, keywordLike, keywordLike);
  }
  if (action.trim()) {
    whereClauses.push('action LIKE ?');
    whereParams.push(`%${action.trim()}%`);
  }
  if (user_id.trim()) {
    whereClauses.push('CAST(user_id AS TEXT) = ?');
    whereParams.push(user_id.trim());
  }
  if (date_from) {
    whereClauses.push('date(created_at) >= date(?)');
    whereParams.push(date_from);
  }
  if (date_to) {
    whereClauses.push('date(created_at) <= date(?)');
    whereParams.push(date_to);
  }

  const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM system_logs${whereSql} ORDER BY created_at ${sortDirection} LIMIT ? OFFSET ?`;
  const params = [...whereParams, parsedLimit, parsedOffset];

  db.all(sql, params, (err, logs) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const countSql = `SELECT COUNT(*) as total FROM system_logs${whereSql}`;
    db.get(countSql, whereParams, (countErr, countResult) => {
      if (countErr) {
        res.status(500).json({ error: countErr.message });
        return;
      }

      res.json({
        logs,
        total: countResult.total,
        limit: parsedLimit,
        offset: parsedOffset
      });
    });
  });
};

exports.clearSystemLogs = (req, res) => {
  const { days } = req.body;
  let sql = 'DELETE FROM system_logs';
  const params = [];
  const hasDaysFilter = days !== undefined && days !== null && days !== '';

  if (hasDaysFilter) {
    const parsedDays = Number(days);
    if (!Number.isInteger(parsedDays) || parsedDays < 0 || parsedDays > 3650) {
      res.status(400).json({ error: 'Days must be an integer between 1 and 3650, or 0 to clear all logs' });
      return;
    }
    if (parsedDays > 0) {
      sql += ' WHERE created_at < datetime(\'now\', ?)';
      params.push(`-${parsedDays} days`);
    }
  }

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.json({ message: `Cleared ${this.changes} logs` });
  });
};
