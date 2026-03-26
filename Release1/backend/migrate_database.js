const db = require('./db');

console.log('开始数据库结构迁移...');

db.serialize(() => {
  // 1. 创建 book_copies 表
  console.log('创建 book_copies 表...');
  db.run(`
    CREATE TABLE IF NOT EXISTS book_copies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      status TEXT DEFAULT 'available',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `, (err) => {
    if (err) {
      console.error('创建 book_copies 表失败:', err.message);
    } else {
      console.log('book_copies 表创建成功');
    }
  });

  // 2. 在 system_settings 表中添加 borrow_confirm_minutes 配置项
  console.log('添加 borrow_confirm_minutes 系统设置...');
  db.run(
    'INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)',
    ['borrow_confirm_minutes', '60', '借阅确认时长（分钟）'],
    (err) => {
      if (err) {
        console.error('添加系统设置失败:', err.message);
      } else {
        console.log('borrow_confirm_minutes 系统设置添加成功');
      }
    }
  );

  // 3. 在 system_settings 表中添加续借相关配置项
  console.log('添加续借相关系统设置...');
  // 续借次数上限
  db.run(
    'INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)',
    ['max_renew_times', '3', '最大续借次数'],
    (err) => {
      if (err) {
        console.error('添加续借次数设置失败:', err.message);
      } else {
        console.log('max_renew_times 系统设置添加成功');
      }
    }
  );
  // 每次续借时间（天）
  db.run(
    'INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)',
    ['renew_days', '7', '每次续借时长（天）'],
    (err) => {
      if (err) {
        console.error('添加续借时长设置失败:', err.message);
      } else {
        console.log('renew_days 系统设置添加成功');
      }
    }
  );

  // 3. 修改 borrow_records 表，添加 copy_id 字段
  console.log('修改 borrow_records 表，添加 copy_id 字段...');
  db.run('ALTER TABLE borrow_records ADD COLUMN copy_id INTEGER', (err) => {
    if (err) {
      console.error('添加 copy_id 字段失败:', err.message);
    } else {
        console.log('copy_id 字段添加成功');
        // 注意：SQLite 不支持通过 ALTER TABLE 添加外键约束
        // 外键约束需要在表创建时声明
        console.log('外键约束将在应用程序层面处理');
      }
  });

  // 4. 修改 borrow_records 表，添加 confirm_deadline 字段
  console.log('修改 borrow_records 表，添加 confirm_deadline 字段...');
  db.run('ALTER TABLE borrow_records ADD COLUMN confirm_deadline TEXT', (err) => {
    if (err) {
      console.error('添加 confirm_deadline 字段失败:', err.message);
    } else {
      console.log('confirm_deadline 字段添加成功');
    }
  });

  // 5. 修改 borrow_records 表，添加 renew_count 字段
  console.log('修改 borrow_records 表，添加 renew_count 字段...');
  db.run('ALTER TABLE borrow_records ADD COLUMN renew_count INTEGER DEFAULT 0', (err) => {
    if (err) {
      console.error('添加 renew_count 字段失败:', err.message);
    } else {
      console.log('renew_count 字段添加成功');
    }
  });

  // 5. 等待所有操作完成后关闭数据库连接
  setTimeout(() => {
    console.log('数据库结构迁移完成');
    db.close();
  }, 1000);
});
