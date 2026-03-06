const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

console.log('测试数据库唯一约束...');

// 尝试添加重复的书籍
db.run(
  'INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)',
  ['Test Book', 'Test Author', '9780743273565'], // 使用已存在的ISBN
  function(err) {
    if (err) {
      console.log('添加重复书籍失败 (预期行为):', err.message);
    } else {
      console.log('添加重复书籍成功 (意外行为)');
    }
    
    // 尝试添加重复的用户
    db.run(
      'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'test123', 'admin', 'Test Admin', 'test@example.com'], // 使用已存在的用户名
      function(err) {
        if (err) {
          console.log('添加重复用户失败 (预期行为):', err.message);
        } else {
          console.log('添加重复用户成功 (意外行为)');
        }
        
        // 关闭数据库连接
        db.close((err) => {
          if (err) {
            console.error('关闭数据库连接失败:', err);
          } else {
            console.log('\n约束测试完成！');
          }
        });
      }
    );
  }
);