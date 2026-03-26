const db = require('./db');

// 续借图书（需要登录）
exports.renewBook = (req, res) => {
  const { user_id, book_id } = req.body;
  
  // 非管理员只能续借自己的图书
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot renew for other users' });
    return;
  }
  
  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查用户状态是否为活跃
      db.get('SELECT status FROM user_status WHERE user_id = ?', [user_id], function(err, userStatus) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!userStatus || userStatus.status !== 'active') {
          db.run('ROLLBACK');
          res.status(403).json({ error: 'User is blocked and cannot renew books' });
          return;
        }

        // 查找未归还的借阅记录
        db.get(
          'SELECT id, due_date, renew_count FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?',
          [user_id, book_id, 'borrowed'],
          function(err, record) {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            if (!record) {
              db.run('ROLLBACK');
              res.status(400).json({ error: 'No active borrow record found' });
              return;
            }
            
            // 获取系统设置
            db.all('SELECT key, value FROM system_settings WHERE key IN (?, ?)', ['max_renew_times', 'renew_days'], function(err, settings) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              // 解析系统设置
              let maxRenewTimes = 3; // 默认值
              let renewDays = 7; // 默认值
              
              settings.forEach(function(setting) {
                if (setting.key === 'max_renew_times') {
                  maxRenewTimes = parseInt(setting.value) || 3;
                } else if (setting.key === 'renew_days') {
                  renewDays = parseInt(setting.value) || 7;
                }
              });
              
              // 检查续借次数是否已达到上限
              const currentRenewCount = record.renew_count || 0;
              if (currentRenewCount >= maxRenewTimes) {
                db.run('ROLLBACK');
                res.status(400).json({ error: 'Maximum renewal limit (' + maxRenewTimes + ') reached' });
                return;
              }
              
              // 计算新的到期日期
              const new_due_date = new Date(record.due_date);
              new_due_date.setDate(new_due_date.getDate() + renewDays);
              const new_due_date_str = new_due_date.toISOString().split('T')[0];
              
              // 更新借阅记录
              db.run(
                'UPDATE borrow_records SET due_date = ?, renew_count = ? WHERE id = ?',
                [new_due_date_str, currentRenewCount + 1, record.id],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  db.run('COMMIT', function(err) {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({ 
                      message: 'Book renewed successfully', 
                      new_due_date: new_due_date_str,
                      renew_count: currentRenewCount + 1,
                      max_renew_times: maxRenewTimes
                    });
                  });
                }
              );
            });
          }
        );
    });
  });
};