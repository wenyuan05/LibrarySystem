const db = require('../db');

// 获取系统设置
exports.getSystemSettings = (req, res) => {
  db.all('SELECT * FROM system_settings', (err, settings) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 将设置转换为对象形式
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  });
};

// 更新系统设置
exports.updateSystemSettings = (req, res) => {
  const settings = req.body;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 遍历所有设置并更新
      let updatedCount = 0;
      const totalSettings = Object.keys(settings).length;
      let hasFailed = false;
      
      if (totalSettings === 0) {
        db.run('COMMIT', (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ message: 'No settings to update' });
        });
        return;
      }

      Object.entries(settings).forEach(([key, value]) => {
        db.run(
          'INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
          [key, value, ''],
          function(err) {
            if (hasFailed) return;
            
            if (err) {
              hasFailed = true;
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }

            updatedCount++;
            
            // 当所有设置都更新完成后，提交事务
            if (updatedCount === totalSettings && !hasFailed) {
              // 记录系统日志
              db.run('INSERT INTO system_logs (action, user_id, description) VALUES (?, ?, ?)', 
                ['update_settings', req.user.id, 'System settings updated by admin'], (err) => {
                  if (hasFailed) return;
                  if (err) {
                    hasFailed = true;
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }

                  db.run('COMMIT', (err) => {
                    if (hasFailed) return;
                    if (err) {
                      hasFailed = true;
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({ message: 'System settings updated successfully' });
                  });
                }
              );
            }
          }
        );
      });
    });
  });
};
