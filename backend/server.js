const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 简单的认证中间件
const authenticate = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(401).json({ error: 'Username and password are required' });
    return;
  }
  next();
};

// API路由

// 用户登录
app.post('/api/login', authenticate, (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email
    });
  });
});

// 获取用户信息
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT id, username, role, name, email FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  });
});

// 获取所有用户（管理员）
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, role, name, email FROM users', (err, users) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(users);
  });
});

// 添加用户（管理员）
app.post('/api/users', (req, res) => {
  const { username, password, role, name, email } = req.body;
  
  // 检查用户名是否已存在
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }
    
    // 插入新用户
    db.run(
      'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
      [username, password, role, name, email],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, username, role, name, email });
      }
    );
  });
});

// 更新用户信息
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  db.run(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ id, name, email });
    }
  );
});

// 删除用户（管理员）
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  });
});

// 获取用户借阅记录
app.get('/api/users/:id/borrow-records', (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT br.id, b.title, b.author, br.borrow_date, br.return_date 
     FROM borrow_records br 
     JOIN books b ON br.book_id = b.id 
     WHERE br.user_id = ?`,
    [id],
    (err, records) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(records);
    }
  );
});

// 借阅书籍
app.post('/api/borrow', (req, res) => {
  const { user_id, book_id } = req.body;
  const borrow_date = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(() => {
    // 检查书籍是否可用
    db.get('SELECT status FROM books WHERE id = ?', [book_id], (err, book) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!book || book.status !== 'available') {
        res.status(400).json({ error: 'Book is not available' });
        return;
      }
      
      // 更新书籍状态
      db.run('UPDATE books SET status = ? WHERE id = ?', ['borrowed', book_id], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 创建借阅记录
        db.run(
          'INSERT INTO borrow_records (user_id, book_id, borrow_date) VALUES (?, ?, ?)',
          [user_id, book_id, borrow_date],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ id: this.lastID, user_id, book_id, borrow_date });
          }
        );
      });
    });
  });
});

// 归还书籍
app.post('/api/return', (req, res) => {
  const { user_id, book_id } = req.body;
  const return_date = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(() => {
    // 查找未归还的借阅记录
    db.get(
      'SELECT id FROM borrow_records WHERE user_id = ? AND book_id = ? AND return_date IS NULL',
      [user_id, book_id],
      (err, record) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!record) {
          res.status(400).json({ error: 'No active borrow record found' });
          return;
        }
        
        // 更新借阅记录
        db.run(
          'UPDATE borrow_records SET return_date = ? WHERE id = ?',
          [return_date, record.id],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            
            // 更新书籍状态
            db.run('UPDATE books SET status = ? WHERE id = ?', ['available', book_id], (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({ message: 'Book returned successfully', return_date });
            });
          }
        );
      }
    );
  });
});

// 获取所有书籍
app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取单本书籍
app.get('/api/books/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json(row);
  });
});

// 添加书籍
app.post('/api/books', (req, res) => {
  const { title, author, isbn } = req.body;
  
  // 检查ISBN是否已存在
  db.get('SELECT id FROM books WHERE isbn = ?', [isbn], (err, existingBook) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (existingBook) {
      res.status(400).json({ error: 'Book with this ISBN already exists' });
      return;
    }
    
    // 插入新书籍
    db.run(
      'INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)',
      [title, author, isbn],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, title, author, isbn, status: 'available' });
      }
    );
  });
});

// 更新书籍状态
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run(
    'UPDATE books SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      res.json({ id, status });
    }
  );
});

// 删除书籍
app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json({ message: 'Book deleted' });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});