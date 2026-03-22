const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing database connection...');

// 测试查询books表
db.get('SELECT id, available_copies FROM books WHERE id = 1', (err, book) => {
  if (err) {
    console.error('Error querying books table:', err);
    return;
  }
  console.log('Book found:', book);
  
  // 测试查询reservation_records表
  db.get('SELECT id FROM reservation_records WHERE user_id = 2 AND book_id = 1 AND status = "active"', (err, reservation) => {
    if (err) {
      console.error('Error querying reservation_records table:', err);
      return;
    }
    console.log('Reservation found:', reservation);
    
    // 测试插入reservation_records表
    const reservation_date = new Date().toISOString().split('T')[0];
    db.run('INSERT INTO reservation_records (user_id, book_id, reservation_date, status) VALUES (?, ?, ?, ?)', [2, 1, reservation_date, 'active'], function(err) {
      if (err) {
        console.error('Error inserting into reservation_records table:', err);
        return;
      }
      console.log('Reservation inserted successfully, ID:', this.lastID);
      
      // 关闭数据库连接
      db.close();
    });
  });
});
