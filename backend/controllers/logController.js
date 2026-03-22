const db = require('../db');

// 获取系统日志（管理员）
exports.getSystemLogs = (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  
  let sql = 'SELECT * FROM system_logs';
  const params = [];
  
  // 添加排序和分页
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  // 执行查询
  db.all(sql, params, (err, logs) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 获取总记录数
    let countSql = 'SELECT COUNT(*) as total FROM system_logs';
    
    db.get(countSql, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        logs,
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
};

// 清除系统日志（管理员）
exports.clearSystemLogs = (req, res) => {
  const { days } = req.body;
  
  let sql = 'DELETE FROM system_logs';
  const params = [];
  
  // 如果指定了天数，只清除指定天数前的日志
  if (days) {
    sql += ' WHERE created_at < datetime(\'now\', ?)';
    params.push(`-${days} days`);
  }
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ message: `Cleared ${this.changes} logs` });
  });
};