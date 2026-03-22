const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3002;

// 中间件
app.use(cors());
app.use(express.json());

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

// 简单的登录端点
app.post('/api/users/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'user1' && password === 'user123') {
    res.json({
      id: 2,
      username: 'user1',
      role: 'user',
      name: 'Test User',
      email: 'user@example.com',
      token: 'test-token'
    });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// 预约图书端点
app.post('/api/borrow/reserve', (req, res) => {
  console.log('reserveBook called with:', req.body);
  const { user_id, book_id } = req.body;
  const reservation_date = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(() => {
    console.log('Beginning transaction');
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error beginning transaction:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查书籍是否存在
      console.log('Checking if book exists:', book_id);
      db.get('SELECT id, available_copies FROM books WHERE id = ?', [book_id], (err, book) => {
        if (err) {
          console.error('Error checking book:', err);
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!book) {
          console.log('Book not found:', book_id);
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Book not found' });
          return;
        }
        console.log('Book found:', book);
        
        // 检查书籍是否可用（如果可用，不需要预约）
        if (book.available_copies > 0) {
          console.log('Book is available, no need to reserve:', book_id);
          db.run('ROLLBACK');
          res.status(400).json({ error: 'Book is available, no need to reserve' });
          return;
        }
        
        // 检查用户是否已经预约了该图书
        console.log('Checking if user has already reserved the book:', user_id, book_id);
        db.get(
          'SELECT id FROM reservation_records WHERE user_id = ? AND book_id = ? AND status = ?',
          [user_id, book_id, 'active'],
          (err, existingReservation) => {
            if (err) {
              console.error('Error checking existing reservation:', err);
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            if (existingReservation) {
              console.log('User has already reserved the book:', user_id, book_id);
              db.run('ROLLBACK');
              res.status(400).json({ error: 'You have already reserved this book' });
              return;
            }
            
            // 创建预约记录
            console.log('Creating reservation record:', user_id, book_id, reservation_date);
            db.run(
              'INSERT INTO reservation_records (user_id, book_id, reservation_date, status) VALUES (?, ?, ?, ?)',
              [user_id, book_id, reservation_date, 'active'],
              function(err) {
                if (err) {
                  console.error('Error creating reservation record:', err);
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                console.log('Reservation record created, committing transaction');
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  console.log('Transaction committed successfully');
                  res.json({ 
                    id: this.lastID, 
                    user_id, 
                    book_id, 
                    reserve_date: reservation_date, 
                    status: 'active',
                    message: 'Book reserved successfully. You will be notified when it becomes available.'
                  });
                });
              }
            );
          }
        );
      });
    });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
