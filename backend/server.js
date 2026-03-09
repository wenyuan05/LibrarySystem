const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = 3001;
// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// 检查 JWT_SECRET 是否设置
if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET environment variable not set. Using a temporary secret for development only.');
  console.warn('⚠️  This is insecure for production environments.');
  // 仅在开发环境中使用默认值
  process.env.JWT_SECRET = 'dev-secret';
}

// 中间件
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// 登录请求体验证中间件
const validateLoginBody = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  next();
};

// 注册请求体验证中间件
const validateRegisterBody = (req, res, next) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name || !email) {
    res.status(400).json({ error: 'Username, password, name and email are required' });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  next();
};

// 书籍请求体验证中间件
const validateBookBody = (req, res, next) => {
  const { title, author, isbn } = req.body;
  if (!title || !author || !isbn) {
    res.status(400).json({ error: 'Title, author and ISBN are required' });
    return;
  }
  if (title.length < 1 || title.length > 100) {
    res.status(400).json({ error: 'Title must be between 1 and 100 characters' });
    return;
  }
  if (author.length < 1 || author.length > 50) {
    res.status(400).json({ error: 'Author must be between 1 and 50 characters' });
    return;
  }
  const isbnRegex = /^\d{10}(?:\d{3})?$/;
  if (!isbnRegex.test(isbn)) {
    res.status(400).json({ error: 'ISBN must be 10 or 13 digits' });
    return;
  }
  next();
};

// 管理员添加用户请求体验证中间件
const validateAdminAddUserBody = (req, res, next) => {
  const { username, password, role, name, email } = req.body;
  if (!username || !password || !role || !name || !email) {
    res.status(400).json({ error: 'Username, password, role, name and email are required' });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  // 严格验证role字段，只允许'user'或'admin'
  if (!['user', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Role must be either "user" or "admin"' });
    return;
  }
  next();
};

// 解析并验证 JWT 的中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ error: 'Authorization token is required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = { id: payload.id, role: payload.role, username: payload.username };
    next();
  });
};

// 角色控制中间件
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    return;
  }
  next();
};

// API路由

// 用户登录
app.post('/api/login', validateLoginBody, (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.json({
        ...payload,
        name: user.name,
        email: user.email,
        token,
      });
    } catch (compareError) {
      res.status(500).json({ error: 'Failed to verify credentials' });
    }
  });
});

// 用户注册（普通用户自助注册）
app.post('/api/register', validateRegisterBody, (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username || !password || !name || !email) {
    res.status(400).json({ error: 'Username, password, name and email are required' });
    return;
  }

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

    // 加密密码并插入新用户，角色默认为 user
    bcrypt.hash(password, 10, (hashErr, hash) => {
      if (hashErr) {
        res.status(500).json({ error: 'Failed to hash password' });
        return;
      }

      const role = 'user';
      db.run(
        'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
        [username, hash, role, name, email],
        function(insertErr) {
          if (insertErr) {
            res.status(500).json({ error: insertErr.message });
            return;
          }

          const payload = {
            id: this.lastID,
            username,
            role,
          };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

          res.status(201).json({
            ...payload,
            name,
            email,
            token,
          });
        }
      );
    });
  });
});

// 获取用户信息（需要登录，只能查看自己的信息或管理员）
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // 检查是否是用户本人或管理员
  if (Number(id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot view other users information' });
    return;
  }
  
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
app.get('/api/users', authenticateToken, requireRole('admin'), (req, res) => {
  db.all('SELECT id, username, role, name, email FROM users', (err, users) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(users);
  });
});

// 添加用户（管理员）
app.post('/api/users', authenticateToken, requireRole('admin'), validateAdminAddUserBody, (req, res) => {
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
    
    // 插入新用户（密码加密存储）
    bcrypt.hash(password, 10, (hashErr, hash) => {
      if (hashErr) {
        res.status(500).json({ error: 'Failed to hash password' });
        return;
      }

      db.run(
        'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
        [username, hash, role, name, email],
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
});

// 更新用户信息（需要登录，允许本人或管理员）
app.put('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (Number(id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot update other users' });
    return;
  }
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
app.delete('/api/users/:id', authenticateToken, requireRole('admin'), (req, res) => {
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

// 获取用户借阅记录（需要登录，只能查看自己的记录或管理员）
app.get('/api/users/:id/borrow-records', authenticateToken, (req, res) => {
  const { id } = req.params;
  if (Number(id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot view other users borrow records' });
    return;
  }
  db.all(
    `SELECT br.id, br.book_id, b.title, b.author, br.borrow_date, br.return_date 
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

// 借阅书籍（需要登录）
app.post('/api/borrow', authenticateToken, (req, res) => {
  const { user_id, book_id } = req.body;
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot borrow for other users' });
    return;
  }
  const borrow_date = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查书籍是否可用
      db.get('SELECT status FROM books WHERE id = ?', [book_id], (err, book) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!book || book.status !== 'available') {
          db.run('ROLLBACK');
          res.status(400).json({ error: 'Book is not available' });
          return;
        }
        
        // 检查是否存在该书籍尚未归还的借阅记录
        db.get(
          'SELECT id FROM borrow_records WHERE book_id = ? AND return_date IS NULL',
          [book_id],
          (err, existingRecord) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            if (existingRecord) {
              db.run('ROLLBACK');
              res.status(400).json({ error: 'Book is already borrowed and not returned' });
              return;
            }
            
            // 更新书籍状态
            db.run('UPDATE books SET status = ? WHERE id = ?', ['borrowed', book_id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              // 创建借阅记录
              db.run(
                'INSERT INTO borrow_records (user_id, book_id, borrow_date) VALUES (?, ?, ?)',
                [user_id, book_id, borrow_date],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  db.run('COMMIT', (err) => {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({ id: this.lastID, user_id, book_id, borrow_date });
                  });
                }
              );
            });
          }
        );
      });
    });
  });
});

// 归还书籍（需要登录）
app.post('/api/return', authenticateToken, (req, res) => {
  const { user_id, book_id } = req.body;
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot return for other users' });
    return;
  }
  const return_date = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找未归还的借阅记录
      db.get(
        'SELECT id FROM borrow_records WHERE user_id = ? AND book_id = ? AND return_date IS NULL',
        [user_id, book_id],
        (err, record) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (!record) {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'No active borrow record found' });
            return;
          }
          
          // 更新借阅记录
          db.run(
            'UPDATE borrow_records SET return_date = ? WHERE id = ?',
            [return_date, record.id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              // 更新书籍状态
              db.run('UPDATE books SET status = ? WHERE id = ?', ['available', book_id], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                db.run('COMMIT', (err) => {
                  if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  res.json({ message: 'Book returned successfully', return_date });
                });
              });
            }
          );
        }
      );
    });
  });
});

// 获取所有书籍（无需登录，公开访问）
app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 获取单本书籍（无需登录，公开访问）
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

// 添加书籍（管理员）
app.post('/api/books', authenticateToken, requireRole('admin'), validateBookBody, (req, res) => {
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

// 更新书籍信息（管理员）
app.put('/api/books/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, status } = req.body;
  
  // 构建更新语句
  const updateFields = [];
  const updateValues = [];
  
  if (title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(title);
  }
  if (author !== undefined) {
    updateFields.push('author = ?');
    updateValues.push(author);
  }
  if (isbn !== undefined) {
    updateFields.push('isbn = ?');
    updateValues.push(isbn);
  }
  if (status !== undefined) {
    updateFields.push('status = ?');
    updateValues.push(status);
  }
  
  if (updateFields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  
  // 添加 id 到参数列表
  updateValues.push(id);
  
  // 执行更新
  const sql = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
  db.run(sql, updateValues, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    
    // 返回更新后的书籍信息
    db.get('SELECT * FROM books WHERE id = ?', [id], (err, book) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(book);
    });
  });
});

// 删除书籍（管理员）
app.delete('/api/books/:id', authenticateToken, requireRole('admin'), (req, res) => {
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

// 统一错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});