const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_EXPIRES_IN = '7d';

// 用户登录
exports.login = (req, res) => {
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
};

// 用户注册（普通用户自助注册）
exports.register = (req, res) => {
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

          // 为新用户创建状态记录
          db.run('INSERT INTO user_status (user_id, status) VALUES (?, ?)', [this.lastID, 'active']);

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
};

// 获取用户信息（需要登录，只能查看自己的信息或管理员）
exports.getUserById = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, username, role, name, email, phone, address FROM users WHERE id = ?', [id], (err, user) => {
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
};

// 获取所有用户（管理员）
exports.getAllUsers = (req, res) => {
  db.all('SELECT id, username, role, name, email, phone, address FROM users', (err, users) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(users);
  });
};

// 添加用户（管理员）
exports.addUser = (req, res) => {
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
          
          // 为新用户创建状态记录
          db.run('INSERT INTO user_status (user_id, status) VALUES (?, ?)', [this.lastID, 'active']);
          
          res.json({ id: this.lastID, username, role, name, email });
        }
      );
    });
  });
};

// 更新用户信息（需要登录，允许本人或管理员）
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  db.run(
    'UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
    [name, email, phone, address, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ id, name, email, phone, address });
    }
  );
};

// 删除用户（管理员）
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 删除用户状态记录
      db.run('DELETE FROM user_status WHERE user_id = ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        // 删除用户
        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (this.changes === 0) {
            db.run('ROLLBACK');
            res.status(404).json({ error: 'User not found' });
            return;
          }

          db.run('COMMIT', (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'User deleted' });
          });
        });
      });
    });
  });
};

// 获取用户借阅记录（需要登录，只能查看自己的记录或管理员）
exports.getUserBorrowRecords = (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT br.id, br.book_id, b.title, b.author, br.borrow_date, br.due_date, br.return_date, br.status, br.fine 
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
};

// 拉黑用户（图书管理员或系统管理员）
exports.blockUser = (req, res) => {
  const { id } = req.params;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 更新用户状态为 blocked
      db.run('UPDATE user_status SET status = ? WHERE user_id = ?', ['blocked', id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        // 检查是否有未归还的借阅记录
        db.all('SELECT id FROM borrow_records WHERE user_id = ? AND status = ?', [id, 'borrowed'], (err, records) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          // 记录系统日志
          db.run('INSERT INTO system_logs (action, user_id, description) VALUES (?, ?, ?)', 
            ['block_user', req.user.id, `User blocked by librarian: ${id}`], (err) => {
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
                res.json({ message: 'User blocked successfully' });
              });
            }
          );
        });
      });
    });
  });
};

// 解除拉黑用户（图书管理员或系统管理员）
exports.unblockUser = (req, res) => {
  const { id } = req.params;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 更新用户状态为 active
      db.run('UPDATE user_status SET status = ? WHERE user_id = ?', ['active', id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        // 记录系统日志
        db.run('INSERT INTO system_logs (action, user_id, description) VALUES (?, ?, ?)', 
          ['unblock_user', req.user.id, `User unblocked by librarian: ${id}`], (err) => {
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
              res.json({ message: 'User unblocked successfully' });
            });
          }
        );
      });
    });
  });
};

// 获取用户状态（需要登录，只能查看自己的状态或管理员）
exports.getUserStatus = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT status FROM user_status WHERE user_id = ?', [id], (err, status) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!status) {
      res.status(404).json({ error: 'User status not found' });
      return;
    }
    res.json({ user_id: id, status: status.status });
  });
};

// 请求密码重置（简化版，不需要发送邮件）
exports.requestPasswordReset = (req, res) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    res.status(400).json({ error: 'Email or phone is required' });
    return;
  }

  // 构建查询语句
  let query = 'SELECT id, username, name, email, phone FROM users WHERE ';
  let params = [];

  if (email) {
    query += 'email = ?';
    params.push(email);
  } else if (phone) {
    query += 'phone = ?';
    params.push(phone);
  }

  // 查找用户
  db.get(query, params, (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      res.status(404).json({ error: 'User not found with the provided information' });
      return;
    }

    // 生成重置令牌
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // 1小时过期
    );

    res.json({ 
      message: 'User found. You can now reset your password.',
      token: resetToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });
  });
};

// 重置密码
exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required' });
    return;
  }

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;

    // 加密新密码
    bcrypt.hash(newPassword, 10, (hashErr, hash) => {
      if (hashErr) {
        res.status(500).json({ error: 'Failed to hash password' });
        return;
      }

      // 更新密码
      db.run('UPDATE users SET password = ? WHERE id = ?', [hash, id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        res.json({ message: 'Password reset successfully' });
      });
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};