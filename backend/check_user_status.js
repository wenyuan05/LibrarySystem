const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

// 检查用户状态
db.serialize(() => {
  // 检查user1的状态
  db.get('SELECT * FROM user_status WHERE user_id = 2', (err, status) => {
    if (err) {
      console.error('Error checking user1 status:', err.message);
    } else {
      console.log('User1 status:', status);
    }
  });
  
  // 检查blocked_user的状态
  db.get('SELECT * FROM user_status WHERE user_id = 95', (err, status) => {
    if (err) {
      console.error('Error checking blocked_user status:', err.message);
    } else {
      console.log('Blocked user status:', status);
    }
  });
  
  // 关闭数据库连接
  db.close();
});
