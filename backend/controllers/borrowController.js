const db = require('../db');

// 借阅书籍（需要登录）
exports.borrowBook = function(req, res) {
  const { user_id, book_id } = req.body;
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot borrow for other users' });
    return;
  }
  const borrow_date = new Date().toISOString().split('T')[0];

  // 获取系统参数
  db.all('SELECT key, value FROM system_settings WHERE key IN (?, ?, ?)',
    ['borrow_period_days', 'borrow_confirm_minutes', 'max_borrows'],
    function(err, settings) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const settingsMap = {};
      settings.forEach(s => settingsMap[s.key] = s.value);
      const borrowPeriodDays = parseInt(settingsMap['borrow_period_days']) || 14;
      const confirmMinutes = parseInt(settingsMap['borrow_confirm_minutes']) || 60;
      const maxBorrows = parseInt(settingsMap['max_borrows']) || 5;

      // 计算到期日期
      const due_date = new Date();
      due_date.setDate(due_date.getDate() + borrowPeriodDays);
      const due_date_str = due_date.toISOString().split('T')[0];

      // 计算确认截止时间
      const confirm_deadline = new Date();
      confirm_deadline.setMinutes(confirm_deadline.getMinutes() + confirmMinutes);
      const confirm_deadline_str = confirm_deadline.toISOString();
    
    // 开始事务
    db.serialize(function() {
      db.run('BEGIN TRANSACTION', function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // 检查用户状态是否为活跃
        db.get('SELECT status FROM user_status WHERE user_id = ?', [user_id], function(err, userStatus) {
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

          // 检查用户是否有未结清的罚款
          db.get('SELECT total_fine FROM users WHERE id = ?', [user_id], function(err, user) {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            if (user.total_fine > 0) {
              db.run('ROLLBACK');
              res.status(403).json({ error: 'User has unpaid fines and cannot borrow books' });
              return;
            }

            // 检查用户当前借阅数量是否超过限制
            db.get('SELECT COUNT(*) as cnt FROM borrow_records WHERE user_id = ? AND status IN (?, ?)',
              [user_id, 'borrowing', 'borrowed'], function(err, row) {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                if (row.cnt >= maxBorrows) {
                  db.run('ROLLBACK');
                  res.status(400).json({ error: `You have reached the maximum borrow limit (${maxBorrows})` });
                  return;
                }

                // 检查用户是否已经有该书籍的未完成借阅记录
                db.get('SELECT id FROM borrow_records WHERE user_id = ? AND book_id = ? AND status IN (?, ?)',
                  [user_id, book_id, 'borrowing', 'borrowed'], function(err, existingRecord) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              if (existingRecord) {
                db.run('ROLLBACK');
                res.status(400).json({ error: 'You already have an active borrow request for this book' });
                return;
              }

              // 检查是否有可用副本。借阅申请阶段不绑定具体副本，确认时再选择。
              db.get('SELECT id FROM book_copies WHERE book_id = ? AND status = ? LIMIT 1', [book_id, 'available'], function(err, copy) {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                if (!copy) {
                  db.run('ROLLBACK');
                  res.status(400).json({ error: 'No available copies' });
                  return;
                }

                // 创建借阅记录，状态为borrowing，copy_id暂为空
                db.run(
                  'INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, confirm_deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
                  [user_id, book_id, borrow_date, due_date_str, confirm_deadline_str, 'borrowing'],
                  function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  const recordId = this.lastID;
                  db.run('COMMIT', function(err) {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({
                      id: recordId,
                      user_id,
                      book_id,
                      copy_id: null,
                      copy_code: null,
                      borrow_date,
                      due_date: due_date_str,
                      confirm_deadline: confirm_deadline_str,
                      status: 'borrowing'
                    });
                  });
                }
              );
              });
            });
          });
        });
      });
    });
  });
});
};

// 归还书籍（需要登录）
exports.returnBook = function(req, res) {
  const { user_id, book_id } = req.body;
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot return for other users' });
    return;
  }
  const return_date = new Date().toISOString().split('T')[0];

  // 从系统设置获取每日罚款金额
  db.get('SELECT value FROM system_settings WHERE key = ?', ['fine_per_day'], function(err, row) {
    const parsedFinePerDay = (!err && row) ? parseFloat(row.value) : NaN;
    const finePerDay = Number.isNaN(parsedFinePerDay) ? 0.5 : parsedFinePerDay;

    // 开始事务
    db.serialize(function() {
      db.run('BEGIN TRANSACTION', function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // 查找未归还的借阅记录
        db.get(
          'SELECT id, due_date FROM borrow_records WHERE user_id = ? AND book_id = ? AND status IN (?, ?)',
          [user_id, book_id, 'borrowed', 'overdue'],
          function(err, record) {
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
              fine = days_overdue * finePerDay;
            }

            // 更新借阅记录为 returning 状态，等待管理员审批
            const fineStatus = fine > 0 ? 'unpaid' : 'paid';
            db.run(
              'UPDATE borrow_records SET return_date = ?, status = ?, fine = ?, fine_status = ? WHERE id = ?',
              [return_date, 'returning', fine, fineStatus, record.id],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }

                // 不立即更新书籍状态，等待管理员审批
                db.run('COMMIT', function(err) {
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
  });
};

// 获取借阅中列表（需要登录）
exports.getBorrowingList = function(req, res) {
  const { user_id } = req.query;
  
  // 非管理员和非图书管理员只能查看自己的借阅记录
  if (user_id && Number(user_id) !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'librarian') {
    res.status(403).json({ error: 'Forbidden: cannot view other users\' borrowing records' });
    return;
  }

  // 开始事务
  db.serialize(function() {
    // 先检查和更新超时记录
    const now = new Date().toISOString();
    let timeoutSql = 'UPDATE borrow_records SET status = ? WHERE status = ? AND confirm_deadline < ?';
    const timeoutParams = ['timeout', 'borrowing', now];
    
    // 如果指定了用户ID，只更新该用户的记录
    if (user_id) {
      timeoutSql += ' AND user_id = ?';
      timeoutParams.push(user_id);
    } else if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      // 非管理员和非图书管理员默认只更新自己的记录
      timeoutSql += ' AND user_id = ?';
      timeoutParams.push(req.user.id);
    }
    
    db.run(timeoutSql, timeoutParams, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 然后检查和更新逾期记录
      const today = new Date().toISOString().split('T')[0];
      let overdueSql = 'UPDATE borrow_records SET status = ? WHERE status = ? AND due_date < ?';
      const overdueParams = ['overdue', 'borrowed', today];
      
      // 如果指定了用户ID，只更新该用户的记录
      if (user_id) {
        overdueSql += ' AND user_id = ?';
        overdueParams.push(user_id);
      } else if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
        // 非管理员和非图书管理员默认只更新自己的记录
        overdueSql += ' AND user_id = ?';
        overdueParams.push(req.user.id);
      }
      
      db.run(overdueSql, overdueParams, function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 构建查询语句
        let sql = `
          SELECT br.id, br.user_id, u.username, u.name as user_name,
                 br.book_id, b.title, b.author,
                 br.borrow_date, br.due_date, br.status, br.fine,
                 br.copy_id, bc.copy_code
          FROM borrow_records br
          JOIN users u ON br.user_id = u.id
          JOIN books b ON br.book_id = b.id
          LEFT JOIN book_copies bc ON br.copy_id = bc.id
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
        db.all(sql, params, function(err, records) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json(records);
        });
      });
    });
  });
};

// 预约图书（需要登录）
exports.reserveBook = function(req, res) {
  console.log('reserveBook called with:', req.body);
  const { user_id, book_id } = req.body;
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot reserve for other users' });
    return;
  }
  const reservation_date = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(function() {
    console.log('Beginning transaction');
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        console.error('Error beginning transaction:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查用户状态是否为活跃
      db.get('SELECT status FROM user_status WHERE user_id = ?', [user_id], function(err, userStatus) {
        if (err) {
          console.error('Error checking user status:', err);
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!userStatus || userStatus.status !== 'active') {
          console.log('User is blocked:', user_id);
          db.run('ROLLBACK');
          res.status(403).json({ error: 'User is blocked and cannot reserve books' });
          return;
        }

        // 检查书籍是否存在
        console.log('Checking if book exists:', book_id);
        db.get('SELECT id, available_copies FROM books WHERE id = ?', [book_id], function(err, book) {
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
            function(err, existingReservation) {
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
                  db.run('COMMIT', function(err) {
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
};

// 取消预约（需要登录）
exports.cancelReservation = function(req, res) {
  const { reservation_id } = req.body;
  
  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找预约记录并验证用户权限
      db.get(
        'SELECT id, user_id, status FROM reservation_records WHERE id = ?',
        [reservation_id],
        function(err, reservation) {
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
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              db.run('COMMIT', function(err) {
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
exports.getUserReservations = function(req, res) {
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

  db.all(sql, [user_id], function(err, reservations) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(reservations);
  });
};

// 续借图书（需要登录）
exports.renewBook = function(req, res) {
  const { user_id, book_id } = req.body;
  
  // 非管理员只能续借自己的图书
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot renew for other users' });
    return;
  }
  
  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查用户状态是否为活跃
      db.get('SELECT status FROM user_status WHERE user_id = ?', [user_id], function(err, userStatus) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!userStatus || userStatus.status !== 'active') {
          db.run('ROLLBACK');
          res.status(403).json({ error: 'User is blocked and cannot renew books' });
          return;
        }

        // 查找未归还的借阅记录
        db.get(
          'SELECT id, due_date, renew_count FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?',
          [user_id, book_id, 'borrowed'],
          function(err, record) {
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
            
            // 获取系统设置
            db.all('SELECT key, value FROM system_settings WHERE key IN (?, ?)', ['max_renew_times', 'renew_days'], function(err, settings) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              // 解析系统设置
              let maxRenewTimes = 3; // 默认值
              let renewDays = 7; // 默认值
              
              settings.forEach(function(setting) {
                if (setting.key === 'max_renew_times') {
                  maxRenewTimes = parseInt(setting.value) || 3;
                } else if (setting.key === 'renew_days') {
                  renewDays = parseInt(setting.value) || 7;
                }
              });
              
              // 检查续借次数是否已达到上限
              const currentRenewCount = record.renew_count || 0;
              if (currentRenewCount >= maxRenewTimes) {
                db.run('ROLLBACK');
                res.status(400).json({ error: 'Maximum renewal limit (' + maxRenewTimes + ') reached' });
                return;
              }
              
              // 计算新的到期日期
              const new_due_date = new Date(record.due_date);
              new_due_date.setDate(new_due_date.getDate() + renewDays);
              const new_due_date_str = new_due_date.toISOString().split('T')[0];
              
              // 更新借阅记录
              db.run(
                'UPDATE borrow_records SET due_date = ?, renew_count = ? WHERE id = ?',
                [new_due_date_str, currentRenewCount + 1, record.id],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  db.run('COMMIT', function(err) {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({ 
                      message: 'Book renewed successfully', 
                      new_due_date: new_due_date_str,
                      renew_count: currentRenewCount + 1,
                      max_renew_times: maxRenewTimes
                    });
                  });
                }
              );
            });
          }
        );
      });
    });
  });
};

// 确认借阅（需要登录）
exports.confirmBorrow = function(req, res) {
  const { record_id, copy_id } = req.body;
  
  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找待确认的借阅记录
      db.get(
        'SELECT id, user_id, book_id, copy_id, confirm_deadline FROM borrow_records WHERE id = ? AND status = ?',
        [record_id, 'borrowing'],
        function(err, record) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (!record) {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'No borrowing record found for confirmation' });
            return;
          }
          
          // 检查是否超时
          const now = new Date();
          const deadline = new Date(record.confirm_deadline);
          if (now > deadline) {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'Borrow request has expired' });
            return;
          }
          
          if (!copy_id) {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'Please select a copy before confirming borrow' });
            return;
          }

          // 确认时检查所选副本是否仍可用
          const targetCopyId = copy_id;
          db.get('SELECT id, status FROM book_copies WHERE id = ? AND book_id = ?', [targetCopyId, record.book_id], function(err, copy) {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            const isLegacyReservedCopy = record.copy_id && Number(record.copy_id) === Number(targetCopyId) && copy?.status === 'borrowing';
            if (!copy || (copy.status !== 'available' && !isLegacyReservedCopy)) {
              db.run('ROLLBACK');
              res.status(400).json({ error: 'Selected copy is not available' });
              return;
            }
            
            // 更新借阅记录状态为borrowed，并更新副本ID（如果有变更）
            db.run(
              'UPDATE borrow_records SET status = ?, copy_id = ? WHERE id = ?',
              ['borrowed', targetCopyId, record.id],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                // 更新副本状态为borrowed
                db.run('UPDATE book_copies SET status = ? WHERE id = ?', ['borrowed', targetCopyId], function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }

                  const releaseLegacyCopy = (next) => {
                    if (record.copy_id && Number(record.copy_id) !== Number(targetCopyId)) {
                      db.run('UPDATE book_copies SET status = ? WHERE id = ? AND status = ?', ['available', record.copy_id, 'borrowing'], next);
                    } else {
                      next(null);
                    }
                  };
                  
                  releaseLegacyCopy(function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      res.status(500).json({ error: err.message });
                      return;
                    }

                    // 重新计算可用副本数
                    db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [record.book_id, 'available'], function(err, result) {
                      if (err) {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                      }
                      
                      // 更新书籍表中的可用副本数
                      db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, record.book_id], function(err) {
                        if (err) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: err.message });
                          return;
                        }
                        
                        db.run('COMMIT', function(err) {
                          if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          res.json({ message: 'Borrow confirmed successfully' });
                        });
                      });
                    });
                  });
                });
              }
            );
          });
        }
      );
    });
  });
};

// 处理超时借阅
exports.handleTimeoutBorrows = function(req, res) {
  const now = new Date().toISOString();
  
  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找所有超时的借阅记录
      db.all(
        'SELECT id, copy_id FROM borrow_records WHERE status = ? AND confirm_deadline < ?',
        ['borrowing', now],
        function(err, records) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          
          let processedCount = 0;
          const totalCount = records.length;
          
          if (totalCount === 0) {
            db.run('COMMIT', function(err) {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({ message: 'No timeout borrows found', processed: 0 });
            });
            return;
          }
          
          records.forEach(function(record) {
            // 更新借阅记录状态为timeout
            db.run('UPDATE borrow_records SET status = ? WHERE id = ?', ['timeout', record.id], function(err) {
              if (err) {
                console.error('更新借阅记录失败:', err.message);
              }
              
              // 更新副本状态为available
              if (record.copy_id) {
                db.run('UPDATE book_copies SET status = ? WHERE id = ?', ['available', record.copy_id], function(err) {
                  if (err) {
                    console.error('更新副本状态失败:', err.message);
                  }
                  
                  // 重新计算可用副本数
                  db.get('SELECT book_id FROM borrow_records WHERE id = ?', [record.id], function(err, bookInfo) {
                    if (err) {
                      console.error('获取书籍ID失败:', err.message);
                    } else if (bookInfo) {
                      db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [bookInfo.book_id, 'available'], function(err, result) {
                        if (err) {
                          console.error('计算可用副本数失败:', err.message);
                        } else {
                          // 更新书籍表中的可用副本数
                          db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, bookInfo.book_id], function(err) {
                            if (err) {
                              console.error('更新书籍可用副本数失败:', err.message);
                            }
                          });
                        }
                      });
                    }
                    
                    processedCount++;
                    if (processedCount === totalCount) {
                      db.run('COMMIT', function(err) {
                        if (err) {
                          res.status(500).json({ error: err.message });
                          return;
                        }
                        res.json({ message: 'Timeout borrows processed', processed: processedCount });
                      });
                    }
                  });
                });
              } else {
                processedCount++;
                if (processedCount === totalCount) {
                  db.run('COMMIT', function(err) {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({ message: 'Timeout borrows processed', processed: processedCount });
                  });
                }
              }
            });
          });
        });
    });
  });
};

// 审批归还请求（需要管理员或图书管理员权限）
exports.approveReturn = function(req, res) {
  const { record_id } = req.body;
  
  // 只有管理员和图书管理员可以审批归还
  if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can approve returns' });
    return;
  }
  
  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找待审批的借阅记录
      db.get(
        'SELECT id, book_id, copy_id, user_id, fine, fine_status FROM borrow_records WHERE id = ? AND status = ?',
        [record_id, 'returning'],
        function(err, record) {
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
          
          // 检查是否有罚款需要处理
          if (record.fine > 0 && record.fine_status === 'unpaid') {
            // 更新用户的总罚款金额
            db.run('UPDATE users SET total_fine = total_fine + ? WHERE id = ?', [record.fine, record.user_id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }

              // 更新借阅记录状态为已归还，罚款状态为未支付
              db.run(
                'UPDATE borrow_records SET status = ?, fine_status = ? WHERE id = ?',
                ['returned', 'unpaid', record.id],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  // 更新副本状态为available
                  if (record.copy_id) {
                    db.run('UPDATE book_copies SET status = ? WHERE id = ?', ['available', record.copy_id], function(err) {
                      if (err) {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                      }
                      
                      // 重新计算可用副本数
                      db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [record.book_id, 'available'], function(err, result) {
                        if (err) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: err.message });
                          return;
                        }
                        
                        // 更新书籍表中的可用副本数
                        db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, record.book_id], function(err) {
                          if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          
                          db.run('COMMIT', function(err) {
                            if (err) {
                              res.status(500).json({ error: err.message });
                              return;
                            }
                            res.json({ message: 'Return approved successfully' });
                          });
                        });
                      });
                    });
                  } else {
                    db.run('COMMIT', function(err) {
                      if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                      }
                      res.json({ message: 'Return approved successfully' });
                    });
                  }
                });
              });
            } else {
              // 没有罚款或罚款已支付，直接更新借阅记录状态为已归还
              db.run(
                'UPDATE borrow_records SET status = ? WHERE id = ?',
                ['returned', record.id],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  // 更新副本状态为available
                  if (record.copy_id) {
                    db.run('UPDATE book_copies SET status = ? WHERE id = ?', ['available', record.copy_id], function(err) {
                      if (err) {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                      }
                      
                      // 重新计算可用副本数
                      db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [record.book_id, 'available'], function(err, result) {
                        if (err) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: err.message });
                          return;
                        }
                        
                        // 更新书籍表中的可用副本数
                        db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, record.book_id], function(err) {
                          if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          
                          db.run('COMMIT', function(err) {
                            if (err) {
                              res.status(500).json({ error: err.message });
                              return;
                            }
                            res.json({ message: 'Return approved successfully' });
                          });
                        });
                      });
                    });
                  } else {
                    db.run('COMMIT', function(err) {
                      if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                      }
                      res.json({ message: 'Return approved successfully' });
                    });
                  }
                }
              );
            }
          });
        });
  });
};

// 获取待审批的归还请求列表（需要管理员或图书管理员权限）
exports.getReturningList = function(req, res) {
  // 只有管理员和图书管理员可以查看待审批的归还请求
  if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can view returning requests' });
    return;
  }

  const sql = `
    SELECT br.id, br.user_id, u.username, u.name as user_name,
           br.book_id, b.title, b.author,
           br.borrow_date, br.due_date, br.return_date, br.status, br.fine,
           br.copy_id, bc.copy_code
    FROM borrow_records br
    JOIN users u ON br.user_id = u.id
    JOIN books b ON br.book_id = b.id
    LEFT JOIN book_copies bc ON br.copy_id = bc.id
    WHERE br.status = 'returning'
    ORDER BY br.return_date DESC
  `;

  // 执行查询
  db.all(sql, function(err, records) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(records);
  });
};

// 检查和更新逾期记录
exports.checkOverdueRecords = function(req, res) {
  const today = new Date().toISOString().split('T')[0];
  
  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找所有逾期的借阅记录
      db.all(
        'SELECT id FROM borrow_records WHERE status = ? AND due_date < ?',
        ['borrowed', today],
        function(err, records) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          
          let updatedCount = 0;
          const totalCount = records.length;
          
          if (totalCount === 0) {
            db.run('COMMIT', function(err) {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({ message: 'No overdue records found', updated: 0 });
            });
            return;
          }
          
          records.forEach(function(record) {
            // 更新借阅记录状态为overdue
            db.run('UPDATE borrow_records SET status = ? WHERE id = ?', ['overdue', record.id], function(err) {
              if (err) {
                console.error('更新逾期记录失败:', err.message);
              }
              
              updatedCount++;
              if (updatedCount === totalCount) {
                db.run('COMMIT', function(err) {
                  if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  res.json({ message: 'Overdue records updated', updated: updatedCount });
                });
              }
            });
          });
        }
      );
    });
  });
};

// 获取用户的罚款记录
exports.getUserFines = function(req, res) {
  const { user_id } = req.params;
  
  // 非管理员只能查看自己的罚款记录
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot view other users\' fines' });
    return;
  }

  const sql = `
    SELECT br.id, br.book_id, b.title, b.author,
           br.borrow_date, br.due_date, br.return_date, br.fine, br.fine_status,
           br.copy_id, bc.copy_code
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    LEFT JOIN book_copies bc ON br.copy_id = bc.id
    WHERE br.user_id = ? AND br.fine > 0
    ORDER BY br.fine_status = 'unpaid' DESC, br.return_date DESC
  `;

  db.all(sql, [user_id], function(err, fines) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(fines);
  });
};

// 支付罚款
exports.payFine = function(req, res) {
  const { user_id } = req.body;
  
  // 非管理员只能支付自己的罚款
  if (Number(user_id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: cannot pay other users\' fines' });
    return;
  }

  // 开始事务
  db.serialize(function() {
    db.run('BEGIN TRANSACTION', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 查找用户的总罚款金额
      db.get('SELECT total_fine FROM users WHERE id = ?', [user_id], function(err, user) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (user.total_fine <= 0) {
          db.run('ROLLBACK');
          res.status(400).json({ error: 'No fines to pay' });
          return;
        }

        // 更新用户的总罚款金额为0
        db.run('UPDATE users SET total_fine = 0 WHERE id = ?', [user_id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          // 更新用户所有未支付的罚款记录为已支付
          db.run('UPDATE borrow_records SET fine_status = ? WHERE user_id = ? AND fine_status = ?', ['paid', user_id, 'unpaid'], function(err) {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }

            db.run('COMMIT', function(err) {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({ message: 'Fines paid successfully', amount: user.total_fine });
            });
          });
        });
      });
    });
  });
};
