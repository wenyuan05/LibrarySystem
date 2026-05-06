const db = require('../db');

// 获取所有书籍（无需登录，公开访问）
exports.getAllBooks = (req, res) => {
  db.all('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

// 获取单本书籍（无需登录，公开访问）
exports.getBookById = (req, res) => {
  const { id } = req.params;
  db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, row) => {
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
};

// 添加书籍（管理员）
exports.addBook = (req, res) => {
  const { title, author, isbn, description, cover_image, total_copies, publisher, publish_date, language, page_count, location } = req.body;
  
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
    
    // 开始事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // 插入新书籍
        const copies = total_copies || 1;
        db.run(
          'INSERT INTO books (title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, author, isbn, description, cover_image, copies, copies, publisher, publish_date, language || 'Chinese', page_count],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            
            const bookId = this.lastID;
            const insertCopy = db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)');
            let copyCount = 0;
            const totalCopies = copies;

            // 创建副本记录
        for (let i = 0; i < totalCopies; i++) {
          const copyCode = `CP-${bookId}-${String(i + 1).padStart(3, '0')}`;
          insertCopy.run(bookId, copyCode, 'available', location, (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                copyCount++;
                if (copyCount === totalCopies) {
                  insertCopy.finalize(() => {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                      }
                      res.json({ 
                        id: bookId, 
                        title, 
                        author, 
                        isbn, 
                        description,
                        cover_image,
                        total_copies: copies,
                        available_copies: copies,
                        publisher,
                        publish_date,
                        language: language || 'Chinese',
                        page_count
                      });
                    });
                  });
                }
              });
            }
          }
        );
      });
    });
  });
};

// 更新书籍信息（管理员）
exports.updateBook = (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, description, cover_image, total_copies, publisher, publish_date, language, page_count } = req.body;
  
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

  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description);
  }
  if (cover_image !== undefined) {
    updateFields.push('cover_image = ?');
    updateValues.push(cover_image);
  }
  if (total_copies !== undefined) {
    updateFields.push('total_copies = ?');
    updateValues.push(total_copies);
  }
  if (publisher !== undefined) {
    updateFields.push('publisher = ?');
    updateValues.push(publisher);
  }
  if (publish_date !== undefined) {
    updateFields.push('publish_date = ?');
    updateValues.push(publish_date);
  }
  if (language !== undefined) {
    updateFields.push('language = ?');
    updateValues.push(language);
  }
  if (page_count !== undefined) {
    updateFields.push('page_count = ?');
    updateValues.push(page_count);
  }
  
  if (updateFields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 执行更新
      const sql = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
      db.run(sql, [...updateValues, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Book not found' });
          return;
        }
        
        // 如果更新了副本数量，处理副本记录
        if (total_copies !== undefined) {
          // 获取当前副本数量
          db.get('SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?', [id], (err, result) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            
            const currentCount = result.count || 0;
            const targetCount = parseInt(total_copies);
            
            if (currentCount < targetCount) {
              // 需要添加副本
              db.get('SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?', [id], (err, countResult) => {
                if (err) { db.run('ROLLBACK'); res.status(500).json({ error: err.message }); return; }

                const insertCopy = db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)');
                let addedCount = 0;
                const addCount = targetCount - currentCount;

                for (let i = 0; i < addCount; i++) {
                  const seq = countResult.count + i + 1;
                  const copyCode = `CP-${id}-${String(seq).padStart(3, '0')}`;
                  insertCopy.run(id, copyCode, 'available', null, (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  addedCount++;
                  if (addedCount === addCount) {
                    insertCopy.finalize(() => {
                      // 重新计算可用副本数
                      db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [id, 'available'], (err, result) => {
                        if (err) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: err.message });
                          return;
                        }
                        
                        // 更新可用副本数
                        db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, id], (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          
                          // 返回更新后的书籍信息
                          db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
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
                              res.json(book);
                            });
                          });
                        });
                      });
                    });
                  }
                });
              }
            });
          } else if (currentCount > targetCount) {
              // 需要删除副本（只删除可用状态的副本）
              db.all('SELECT id FROM book_copies WHERE book_id = ? AND status = ? LIMIT ?', [id, 'available', currentCount - targetCount], (err, copies) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                if (copies.length === 0) {
                  // 没有可用副本可以删除
                  db.run('ROLLBACK');
                  res.status(400).json({ error: 'Cannot reduce copies: no available copies to remove' });
                  return;
                }
                
                const deleteCopy = db.prepare('DELETE FROM book_copies WHERE id = ?');
                let deletedCount = 0;
                const deleteCount = copies.length;
                
                copies.forEach(copy => {
                  deleteCopy.run(copy.id, (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    
                    deletedCount++;
                    if (deletedCount === deleteCount) {
                      deleteCopy.finalize(() => {
                        // 重新计算可用副本数
                        db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [id, 'available'], (err, result) => {
                          if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          
                          // 更新可用副本数
                          db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, id], (err) => {
                            if (err) {
                              db.run('ROLLBACK');
                              res.status(500).json({ error: err.message });
                              return;
                            }
                            
                            // 返回更新后的书籍信息
                            db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
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
                                res.json(book);
                              });
                            });
                          });
                        });
                      });
                    }
                  });
                });
              });
            } else {
              // 副本数量不变，直接返回
              db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
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
                  res.json(book);
                });
              });
            }
          });
        } else {
          // 没有更新副本数量，直接返回
          db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
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
              res.json(book);
            });
          });
        }
      });
    });
  });
};

// 删除书籍（管理员）
exports.deleteBook = (req, res) => {
  const { id } = req.params;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 检查是否有正常借阅的记录（排除逾期记录）
      db.get('SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND status IN (?, ?, ?) AND return_date IS NULL', [id, 'borrowing', 'borrowed', 'returning'], (err, result) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        if (result.count > 0) {
          db.run('ROLLBACK');
          res.status(400).json({ error: 'Cannot delete book: it has active borrowing records' });
          return;
        }

        // 删除图书分类关联
        db.run('DELETE FROM book_categories WHERE book_id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          // 删除书籍副本
          db.run('DELETE FROM book_copies WHERE book_id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }

            // 删除书籍
            db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              if (this.changes === 0) {
                db.run('ROLLBACK');
                res.status(404).json({ error: 'Book not found' });
                return;
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json({ message: 'Book deleted' });
              });
            });
          });
        });
      });
    });
  });
};

// 搜索图书（无需登录，公开访问）
exports.searchBooks = (req, res) => {
  const { query, category } = req.query;
  
  if (!query && !category) {
    res.status(400).json({ error: 'Search query or category is required' });
    return;
  }

  let sql = 'SELECT b.id, b.title, b.author, b.isbn, b.description, b.cover_image, b.total_copies, b.available_copies, b.publisher, b.publish_date, b.language, b.page_count, b.created_at, b.updated_at FROM books b';
  const params = [];

  // 如果指定了分类，添加分类关联
  if (category) {
    sql += ' JOIN book_categories bc ON b.id = bc.book_id';
  }

  // 添加 WHERE 子句
  sql += ' WHERE';
  
  if (query) {
    sql += ' (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)';
    params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  if (category) {
    if (query) sql += ' AND';
    sql += ' bc.category_id = ?';
    params.push(parseInt(category));
  }

  // 执行查询
  db.all(sql, params, (err, books) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // 返回空数组而不是404错误
    res.json(books || []);
  });
};

// 获取热门图书（无需登录，公开访问）
exports.getPopularBooks = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  // 通过统计借阅次数来获取热门图书
  const sql = `
    SELECT b.id, b.title, b.author, b.isbn, b.description, b.cover_image, b.total_copies, b.available_copies, b.publisher, b.publish_date, b.language, b.page_count, b.created_at, b.updated_at, COUNT(br.id) as borrow_count 
    FROM books b
    LEFT JOIN borrow_records br ON b.id = br.book_id
    GROUP BY b.id
    ORDER BY borrow_count DESC
    LIMIT ?
  `;
  
  db.all(sql, [limit], (err, books) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(books);
  });
};

// 导出图书信息到CSV（管理员）
exports.exportBooks = (req, res) => {
  // 查询所有图书信息
  const sql = `
    SELECT b.id, b.title, b.author, b.isbn, 
           b.description, b.total_copies, b.available_copies,
           b.publisher, b.publish_date, b.language, b.page_count,
           GROUP_CONCAT(c.name, ', ') as categories
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
    GROUP BY b.id
  `;
  
  db.all(sql, (err, books) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 生成CSV内容
    const headers = ['ID', 'Title', 'Author', 'ISBN', 'Status', 'Description', 'Total Copies', 'Available Copies', 'Publisher', 'Publish Date', 'Language', 'Page Count', 'Categories'];
    const csvContent = [
      headers.join(','),
      ...books.map(book => [
        book.id,
        `"${book.title}"`,
        `"${book.author}"`,
        book.isbn,
        book.available_copies > 0 ? 'Available' : 'Not Available',
        `"${book.description || ''}"`,
        book.total_copies,
        book.available_copies,
        `"${book.publisher || ''}"`,
        book.publish_date || '',
        `"${book.language || ''}"`,
        book.page_count || '',
        `"${book.categories || ''}"`
      ].join(','))
    ].join('\n');
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=books_${new Date().toISOString().split('T')[0]}.csv`);
    
    // 发送CSV内容
    res.send(csvContent);
  });
};

// 获取书籍的所有副本（公开访问）
exports.getBookCopies = (req, res) => {
  const { book_id } = req.params;
  
  db.all('SELECT * FROM book_copies WHERE book_id = ? ORDER BY id', [book_id], (err, copies) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(copies);
  });
};

// 添加单个书籍副本（管理员/图书管理员）
exports.addBookCopy = (req, res) => {
  const { book_id } = req.params;
  const location = (req.body.location || 'Main Shelf').trim() || 'Main Shelf';

  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get('SELECT id FROM books WHERE id = ?', [book_id], (err, book) => {
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

        db.all('SELECT copy_code FROM book_copies WHERE book_id = ?', [book_id], (err, copies) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          const maxSeq = copies.reduce((max, copy) => {
            const match = (copy.copy_code || '').match(/-(\d+)$/);
            const seq = match ? parseInt(match[1], 10) : 0;
            return Math.max(max, seq);
          }, 0);
          const copyCode = `CP-${book_id}-${String(maxSeq + 1).padStart(3, '0')}`;

          db.run(
            'INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)',
            [book_id, copyCode, 'available', location],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }

              const copyId = this.lastID;
              db.get('SELECT COUNT(*) as total_count FROM book_copies WHERE book_id = ?', [book_id], (err, totalResult) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }

                db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [book_id, 'available'], (err, availableResult) => {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }

                  db.run(
                    'UPDATE books SET total_copies = ?, available_copies = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [totalResult.total_count, availableResult.available_count, book_id],
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
                        res.status(201).json({
                          id: copyId,
                          book_id: Number(book_id),
                          copy_code: copyCode,
                          status: 'available',
                          location
                        });
                      });
                    }
                  );
                });
              });
            }
          );
        });
      });
    });
  });
};

// 获取单个副本信息（公开访问）
exports.getCopyById = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM book_copies WHERE id = ?', [id], (err, copy) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!copy) {
      res.status(404).json({ error: 'Copy not found' });
      return;
    }
    res.json(copy);
  });
};

// 更新副本状态（管理员/图书管理员）
exports.updateCopyStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log('Update copy status request received:', { id, status });
  
  // 验证状态值
  const validStatuses = ['available', 'unavailable', 'borrowing', 'borrowed', 'reserved'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status. Valid statuses are: available, unavailable, borrowing, borrowed, reserved' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 更新副本状态
      db.run('UPDATE book_copies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Copy not found' });
          return;
        }

        // 获取副本信息以获取book_id
        db.get('SELECT book_id FROM book_copies WHERE id = ?', [id], (err, copy) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          // 重新计算可用副本数
          db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [copy.book_id, 'available'], (err, result) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }

            // 更新书籍表中的可用副本数
            db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, copy.book_id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }

              // 提交事务
              db.run('COMMIT', (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json({ message: 'Copy status updated successfully' });
              });
            });
          });
        });
      });
    });
  });
};

// 更新副本位置（管理员/图书管理员）
exports.updateCopyLocation = (req, res) => {
  const { id } = req.params;
  const { location } = req.body;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 更新副本位置
      db.run('UPDATE book_copies SET location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [location, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Copy not found' });
          return;
        }

        // 提交事务
        db.run('COMMIT', (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ message: 'Copy location updated successfully' });
        });
      });
    });
  });
};

// 通过 ISBN 查询书籍信息
exports.searchByISBN = (req, res) => {
  const { isbn } = req.params;
  const https = require('https');
  
  // 构建 OpenLibrary API URL
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  
  https.get(url, (apiRes) => {
    let data = '';
    
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    
    apiRes.on('end', () => {
      try {
        const response = JSON.parse(data);
        const bookKey = `ISBN:${isbn}`;
        
        if (response[bookKey]) {
          const bookData = response[bookKey];
          
          // 清洗数据，只返回需要的信息
          const cleanedData = {
            title: bookData.title || '',
            author: bookData.authors ? bookData.authors.map(author => author.name).join(', ') : '',
            publisher: bookData.publishers ? bookData.publishers.map(publisher => publisher.name).join(', ') : '',
            publish_date: bookData.publish_date || '',
            isbn: isbn,
            description: bookData.description ? (typeof bookData.description === 'string' ? bookData.description : bookData.description.value) : '',
            cover_image: bookData.cover ? `https://covers.openlibrary.org/b/id/${bookData.cover.id}-L.jpg` : '',
            language: 'Chinese',
            page_count: bookData.number_of_pages || 0
          };
          
          res.json(cleanedData);
        } else {
          res.status(404).json({ error: 'Book not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to parse API response' });
      }
    });
  }).on('error', (error) => {
    res.status(500).json({ error: 'Failed to fetch book information' });
  });
};

// 批量导入书籍
exports.batchImportBooks = (req, res) => {
  const { books } = req.body;
  
  if (!books || !Array.isArray(books)) {
    res.status(400).json({ error: 'Invalid request data' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      let processedCount = 0;
      const totalCount = books.length;
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      if (totalCount === 0) {
        db.run('COMMIT', (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json(results);
        });
        return;
      }
      
      books.forEach((bookData) => {
        const { title, author, publisher, publish_date, isbn, description, cover_image, total_copies = 1, location = 'Main Shelf', category_id } = bookData;
        
        // 检查ISBN是否已存在
        db.get('SELECT id FROM books WHERE isbn = ?', [isbn], (err, existingBook) => {
          if (err) {
            results.failed++;
            results.errors.push({ isbn, error: err.message });
            processedCount++;
            
            if (processedCount === totalCount) {
              db.run('COMMIT', (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json(results);
              });
            }
            return;
          }
          
          if (existingBook) {
            results.failed++;
            results.errors.push({ isbn, error: 'Book with this ISBN already exists' });
            processedCount++;
            
            if (processedCount === totalCount) {
              db.run('COMMIT', (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json(results);
              });
            }
            return;
          }
          
          // 插入书籍信息
          const copies = total_copies || 1;
          db.run(
            'INSERT INTO books (title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, author, isbn, description, cover_image, copies, copies, publisher, publish_date, 'Chinese', 0],
            function(err) {
              if (err) {
                results.failed++;
                results.errors.push({ isbn, error: err.message });
              } else {
                const bookId = this.lastID;
                if (category_id) {
                  db.run(
                    'INSERT OR IGNORE INTO book_categories (book_id, category_id) VALUES (?, ?)',
                    [bookId, category_id],
                    (err) => {
                      if (err) {
                        console.error('批量导入分类关联失败:', err.message);
                      }
                    }
                  );
                }
                const insertCopy = db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)');
                let copyCount = 0;
                const totalCopies = copies;
                const copyLocation = (location || 'Main Shelf').trim() || 'Main Shelf';

                // 创建副本记录
                for (let i = 0; i < totalCopies; i++) {
                  const copyCode = `CP-${bookId}-${String(i + 1).padStart(3, '0')}`;
                  insertCopy.run(bookId, copyCode, 'available', copyLocation, (err) => {
                    if (err) {
                      console.error('创建副本失败:', err.message);
                    }
                    
                    copyCount++;
                    if (copyCount === totalCopies) {
                      insertCopy.finalize(() => {
                        results.success++;
                      });
                    }
                  });
                }
              }
              
              processedCount++;
              
              if (processedCount === totalCount) {
                db.run('COMMIT', (err) => {
                  if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  res.json(results);
                });
              }
            }
          );
        });
      });
    });
  });
};
