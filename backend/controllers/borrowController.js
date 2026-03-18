const db = require('../db');

// 借阅书籍（需要登录）
exports.borrowBook = (req, res) => {
  const { user_id, book_id } = req.body;
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot borrow for other users' });
    return;
  }
  const borrow_date = new Date().toISOString().split('T')[0];
  
  // 计算到期日期（默认14天）
  const due_date = new Date();
  due_date.setDate(due_date.getDate() + 14);
  const due_date_str = due_date.toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查用户状态是否为活跃
      db.get('SELECT status FROM user_status WHERE user_id = ?', [user_id], (err, userStatus) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!userStatus || userStatus.status !== 'active') {
          db.run('ROLLBACK');
          res.status(403).json({ error: 'User is blocked and cannot borrow books' });
          return;
        }

        // 检查书籍是否可用
          db.get('SELECT status, available_copies FROM books WHERE id = ?', [book_id], (err, book) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            if (!book || book.available_copies <= 0) {
              db.run('ROLLBACK');
              res.status(400).json({ error: 'Book is not available' });
              return;
            }
            
            // 检查是否存在该书籍尚未归还的借阅记录（根据可用副本数判断，允许多副本同时被借）
            db.get(
              'SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND status = ?',
              [book_id, 'borrowed'],
              (err, result) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                // 检查是否还有可用副本
                const borrowedCount = result.count || 0;
                if (book.available_copies <= 0) {
                  db.run('ROLLBACK');
                  res.status(400).json({ error: 'Book is not available' });
                  return;
                }
                
                // 更新书籍状态和可用副本数
                // 只有当所有副本都被借出去时才将状态改为borrowed
                const newStatus = (book.available_copies - 1) <= 0 ? 'borrowed' : 'available';
                db.run('UPDATE books SET status = ?, available_copies = available_copies - 1 WHERE id = ?', [newStatus, book_id], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  // 创建借阅记录
                  db.run(
                    'INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
                    [user_id, book_id, borrow_date, due_date_str, 'borrowed'],
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
                        res.json({ id: this.lastID, user_id, book_id, borrow_date, due_date: due_date_str, status: 'borrowed' });
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
};

// 归还书籍（需要登录）
exports.returnBook = (req, res) => {
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
        'SELECT id, due_date FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?',
        [user_id, book_id, 'borrowed'],
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
          
          // 计算罚款
          let fine = 0;
          const due_date = new Date(record.due_date);
          const return_date_obj = new Date(return_date);
          if (return_date_obj > due_date) {
            const days_overdue = Math.ceil((return_date_obj - due_date) / (1000 * 60 * 60 * 24));
            fine = days_overdue * 0.5; // 每天0.5元罚款
          }
          
          // 更新借阅记录为 returning 状态，等待管理员审批
          db.run(
            'UPDATE borrow_records SET return_date = ?, status = ?, fine = ? WHERE id = ?',
            [return_date, 'returning', fine, record.id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              // 不立即更新书籍状态，等待管理员审批
              db.run('COMMIT', (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json({ message: 'Return request submitted successfully. Waiting for librarian approval.', return_date, fine, status: 'returning' });
              });
            }
          );
        }
      );
    });
  });
};

// 获取借阅中列表（需要登录）
exports.getBorrowingList = (req, res) => {
  const { user_id } = req.query;
  
  // 非管理员和非图书管理员只能查看自己的借阅记录
  if (user_id && Number(user_id) !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'librarian') {
    res.status(403).json({ error: 'Forbidden: cannot view other users\' borrowing records' });
    return;
  }

  let sql = `
    SELECT br.id, br.user_id, u.username, u.name as user_name, 
           br.book_id, b.title, b.author, 
           br.borrow_date, br.due_date, br.status, br.fine 
    FROM borrow_records br 
    JOIN users u ON br.user_id = u.id 
    JOIN books b ON br.book_id = b.id 
    WHERE br.status = 'borrowed'
  `;
  const params = [];

  // 如果指定了用户ID，只查询该用户的记录
  if (user_id) {
    sql += ' AND br.user_id = ?';
    params.push(user_id);
  } else if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
    // 非管理员和非图书管理员默认只查询自己的记录
    sql += ' AND br.user_id = ?';
    params.push(req.user.id);
  }

  // 执行查询
  db.all(sql, params, (err, records) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(records);
  });
};

// 预约图书（需要登录）
exports.reserveBook = (req, res) => {
  const { user_id, book_id } = req.body;
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot reserve for other users' });
    return;
  }
  const reservation_date = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查书籍是否存在
      db.get('SELECT id, status, available_copies FROM books WHERE id = ?', [book_id], (err, book) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!book) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Book not found' });
          return;
        }
        
        // 检查书籍是否可用（如果可用，不需要预约）
        if (book.status === 'available' && book.available_copies > 0) {
          db.run('ROLLBACK');
          res.status(400).json({ error: 'Book is available, no need to reserve' });
          return;
        }
        
        // 检查用户是否已经预约了该图书
        db.get(
          'SELECT id FROM reservation_records WHERE user_id = ? AND book_id = ? AND status = ?',
          [user_id, book_id, 'active'],
          (err, existingReservation) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            if (existingReservation) {
              db.run('ROLLBACK');
              res.status(400).json({ error: 'You have already reserved this book' });
              return;
            }
            
            // 创建预约记录
            db.run(
              'INSERT INTO reservation_records (user_id, book_id, reservation_date, status) VALUES (?, ?, ?, ?)',
              [user_id, book_id, reservation_date, 'active'],
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
};

// 取消预约（需要登录）
exports.cancelReservation = (req, res) => {
  const { reservation_id } = req.body;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找预约记录并验证用户权限
      db.get(
        'SELECT id, user_id, status FROM reservation_records WHERE id = ?',
        [reservation_id],
        (err, reservation) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (!reservation) {
            db.run('ROLLBACK');
            res.status(404).json({ error: 'Reservation not found' });
            return;
          }
          if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
            db.run('ROLLBACK');
            res.status(403).json({ error: 'Forbidden: cannot cancel other users\' reservations' });
            return;
          }
          if (reservation.status !== 'active') {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'Reservation is not active' });
            return;
          }
          
          // 更新预约记录状态为 cancelled
          db.run(
            'UPDATE reservation_records SET status = ? WHERE id = ?',
            ['cancelled', reservation_id],
            (err) => {
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
                res.json({ message: 'Reservation cancelled successfully' });
              });
            }
          );
        }
      );
    });
  });
};

// 获取用户的预约记录（需要登录）
exports.getUserReservations = (req, res) => {
  const { user_id } = req.params;
  
  // 非管理员只能查看自己的预约记录
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot view other users\' reservations' });
    return;
  }

  const sql = `
    SELECT rr.id, rr.book_id, b.title, b.author, 
           rr.reservation_date as reserve_date, rr.status, rr.notification_sent 
    FROM reservation_records rr 
    JOIN books b ON rr.book_id = b.id 
    WHERE rr.user_id = ?
    ORDER BY rr.reservation_date DESC
  `;

  db.all(sql, [user_id], (err, reservations) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(reservations);
  });
};

// 续借图书（需要登录）
exports.renewBook = (req, res) => {
  const { user_id, book_id } = req.body;
  
  // 非管理员只能续借自己的图书
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot renew for other users' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找未归还的借阅记录
      db.get(
        'SELECT id, due_date FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?',
        [user_id, book_id, 'borrowed'],
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
          
          // 计算新的到期日期（延长14天）
          const new_due_date = new Date(record.due_date);
          new_due_date.setDate(new_due_date.getDate() + 14);
          const new_due_date_str = new_due_date.toISOString().split('T')[0];
          
          // 更新借阅记录
          db.run(
            'UPDATE borrow_records SET due_date = ? WHERE id = ?',
            [new_due_date_str, record.id],
            (err) => {
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
                res.json({ 
                  message: 'Book renewed successfully', 
                  new_due_date: new_due_date_str 
                });
              });
            }
          );
        }
      );
    });
  });
};

// 审批归还请求（需要管理员或图书管理员权限）
exports.approveReturn = (req, res) => {
  const { record_id } = req.body;
  
  // 只有管理员和图书管理员可以审批归还
  if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can approve returns' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找待审批的借阅记录
      db.get(
        'SELECT id, book_id FROM borrow_records WHERE id = ? AND status = ?',
        [record_id, 'returning'],
        (err, record) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (!record) {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'No returning record found for approval' });
            return;
          }
          
          // 更新借阅记录状态为已归还
          db.run(
            'UPDATE borrow_records SET status = ? WHERE id = ?',
            ['returned', record.id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              // 更新书籍状态和可用副本数
              db.run('UPDATE books SET status = ?, available_copies = available_copies + 1 WHERE id = ?', ['available', record.book_id], (err) => {
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
                  res.json({ message: 'Return approved successfully' });
                });
              });
            }
          );
        }
      );
    });
  });
};

// 获取待审批的归还请求列表（需要管理员或图书管理员权限）
exports.getReturningList = (req, res) => {
  // 只有管理员和图书管理员可以查看待审批的归还请求
  if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can view returning requests' });
    return;
  }

  const sql = `
    SELECT br.id, br.user_id, u.username, u.name as user_name, 
           br.book_id, b.title, b.author, 
           br.borrow_date, br.due_date, br.return_date, br.status, br.fine 
    FROM borrow_records br 
    JOIN users u ON br.user_id = u.id 
    JOIN books b ON br.book_id = b.id 
    WHERE br.status = 'returning'
    ORDER BY br.return_date DESC
  `;

  // 执行查询
  db.all(sql, (err, records) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(records);
  });
};