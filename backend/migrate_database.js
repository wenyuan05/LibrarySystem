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

  // 3. 修改 borrow_records 表，添加 copy_id 字段
  console.log('修改 borrow_records 表，添加 copy_id 字段...');
  db.run('ALTER TABLE borrow_records ADD COLUMN copy_id INTEGER', (err) => {
    if (err) {
      console.error('添加 copy_id 字段失败:', err.message);
    } else {
      console.log('copy_id 字段添加成功');
      // 添加外键约束
      db.run('ALTER TABLE borrow_records ADD FOREIGN KEY (copy_id) REFERENCES book_copies(id)', (err) => {
        if (err) {
          console.error('添加外键约束失败:', err.message);
        } else {
          console.log('外键约束添加成功');
        }
      });
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

  // 5. 等待所有操作完成后关闭数据库连接
  setTimeout(() => {
    console.log('数据库结构迁移完成');
    db.close();
  }, 1000);
});
