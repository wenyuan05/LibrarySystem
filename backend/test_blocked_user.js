const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

// 测试被拉黑用户的功能
db.serialize(() => {
  // 创建一个测试用户
  const username = 'blocked_user';
  const password = 'password123';
  const passwordHash = bcrypt.hashSync(password, 10);
  
  // 插入测试用户
  db.run('INSERT OR IGNORE INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)', 
    [username, passwordHash, 'user', 'Blocked User', 'blocked@example.com'], 
    function(err) {
      if (err) {
        console.error('Error creating test user:', err.message);
        return;
      }
      
      const userId = this.lastID || 1;
      console.log(`Created test user with ID: ${userId}`);
      
      // 为用户创建状态记录并设置为blocked
      db.run('INSERT OR REPLACE INTO user_status (user_id, status) VALUES (?, ?)', 
        [userId, 'blocked'], 
        (err) => {
          if (err) {
            console.error('Error setting user status:', err.message);
            return;
          }
          console.log(`Set user ${userId} status to blocked`);
          
          // 关闭数据库连接
          db.close();
          console.log('Test user created and blocked successfully!');
          console.log('You can now test borrowing, reserving, and renewing books with this user.');
        }
      );
    }
  );
});
