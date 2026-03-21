const db = require('../db');

// 获取借阅业务统计数据（管理员）
exports.getBorrowStats = (req, res) => {
  // 开始事务
  db.serialize(() => {
    const stats = {};
    let completedQueries = 0;
    const totalQueries = 4;
    let done = false;

    // 1. 总借阅次数
    db.get('SELECT COUNT(*) as total_borrows FROM borrow_records', (err, result) => {
      if (done) return;
      if (err) {
        done = true;
        res.status(500).json({ error: err.message });
        return;
      }
      stats.total_borrows = result.total_borrows;
      checkCompletion();
    });

    // 2. 总归还次数
    db.get('SELECT COUNT(*) as total_returns FROM borrow_records WHERE status = ?', ['returned'], (err, result) => {
      if (done) return;
      if (err) {
        done = true;
        res.status(500).json({ error: err.message });
        return;
      }
      stats.total_returns = result.total_returns;
      checkCompletion();
    });

    // 3. 当前借阅中数量
    db.get('SELECT COUNT(*) as current_borrows FROM borrow_records WHERE status = ?', ['borrowed'], (err, result) => {
      if (done) return;
      if (err) {
        done = true;
        res.status(500).json({ error: err.message });
        return;
      }
      stats.current_borrows = result.current_borrows;
      checkCompletion();
    });

    // 4. 平均借阅天数
    db.get(
      `SELECT AVG(JULIANDAY(return_date) - JULIANDAY(borrow_date)) as avg_borrow_days 
       FROM borrow_records 
       WHERE status = ? AND return_date IS NOT NULL`,
      ['returned'],
      (err, result) => {
        if (done) return;
        if (err) {
          done = true;
          res.status(500).json({ error: err.message });
          return;
        }
        stats.avg_borrow_days = result.avg_borrow_days ? parseFloat(result.avg_borrow_days.toFixed(2)) : 0;
        checkCompletion();
      }
    );

    // 检查所有查询是否完成
    function checkCompletion() {
      if (done) return;
      completedQueries++;
      if (completedQueries === totalQueries) {
        done = true;
        res.json(stats);
      }
    }
  });
};

// 获取月度借阅统计（管理员）
exports.getMonthlyStats = (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  
  const sql = `
    SELECT 
      strftime('%m', borrow_date) as month,
      COUNT(*) as borrow_count
    FROM borrow_records
    WHERE strftime('%Y', borrow_date) = ?
    GROUP BY month
    ORDER BY month
  `;
  
  db.all(sql, [year], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 生成12个月的完整数据
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      const found = results.find(item => item.month === month);
      return {
        month,
        borrow_count: found ? found.borrow_count : 0
      };
    });
    
    res.json(monthlyData);
  });
};

// 获取热门图书统计（管理员）
exports.getPopularBooksStats = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const sql = `
    SELECT 
      b.id, b.title, b.author, COUNT(br.id) as borrow_count
    FROM books b
    LEFT JOIN borrow_records br ON b.id = br.book_id
    GROUP BY b.id
    ORDER BY borrow_count DESC
    LIMIT ?
  `;
  
  db.all(sql, [limit], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
};