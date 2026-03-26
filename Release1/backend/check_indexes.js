const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

console.log('检查数据库索引状态...');

// 检查索引
db.all('SELECT name, tbl_name, sql FROM sqlite_master WHERE type="index"', (err, rows) => {
  if (err) {
    console.error('查询索引失败:', err);
    db.close();
    return;
  }
  
  if (rows.length === 0) {
    console.log('数据库中没有索引');
  } else {
    console.log(`发现 ${rows.length} 个索引:`);
    rows.forEach(row => {
      console.log(`- 索引名: ${row.name}`);
      console.log(`  表名: ${row.tbl_name}`);
      console.log(`  SQL: ${row.sql}`);
      console.log('');
    });
  }
  
  // 检查书籍表数据
  console.log('检查书籍表数据...');
  db.all('SELECT id, title, author, isbn FROM books', (err, books) => {
    if (err) {
      console.error('查询书籍数据失败:', err);
      db.close();
      return;
    }
    
    console.log(`书籍表中有 ${books.length} 条记录:`);
    books.forEach(book => {
      console.log(`- ${book.title} (${book.isbn})`);
    });
    
    // 检查用户表数据
    console.log('\n检查用户表数据...');
    db.all('SELECT id, username, role, name FROM users', (err, users) => {
      if (err) {
        console.error('查询用户数据失败:', err);
        db.close();
        return;
      }
      
      console.log(`用户表中有 ${users.length} 条记录:`);
      users.forEach(user => {
        console.log(`- ${user.username} (${user.role})`);
      });
      
      // 关闭数据库连接
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err);
        } else {
          console.log('\n检查完成！');
        }
      });
    });
  });
});