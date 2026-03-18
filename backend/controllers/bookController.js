const db = require('../db');

// 获取所有书籍（无需登录，公开访问）
exports.getAllBooks = (req, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
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
};

// 添加书籍（管理员）
exports.addBook = (req, res) => {
  const { title, author, isbn, description, cover_image, total_copies, publisher, publish_date, language, page_count } = req.body;
  
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
    const available_copies = total_copies || 1;
    db.run(
      'INSERT INTO books (title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, author, isbn, description, cover_image, total_copies || 1, available_copies, publisher, publish_date, language || 'Chinese', page_count],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          id: this.lastID, 
          title, 
          author, 
          isbn, 
          status: 'available',
          description,
          cover_image,
          total_copies: total_copies || 1,
          available_copies,
          publisher,
          publish_date,
          language: language || 'Chinese',
          page_count
        });
      }
    );
  });
};

// 更新书籍信息（管理员）
exports.updateBook = (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, status, description, cover_image, total_copies, publisher, publish_date, language, page_count } = req.body;
  
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
    // 自动更新可用副本数
    updateFields.push('available_copies = ?');
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

      // 删除图书分类关联
      db.run('DELETE FROM book_categories WHERE book_id = ?', [id], (err) => {
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
};

// 搜索图书（无需登录，公开访问）
exports.searchBooks = (req, res) => {
  const { query, category } = req.query;
  
  if (!query && !category) {
    res.status(400).json({ error: 'Search query or category is required' });
    return;
  }

  let sql = 'SELECT b.* FROM books b';
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
    SELECT b.*, COUNT(br.id) as borrow_count 
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
    SELECT b.id, b.title, b.author, b.isbn, b.status, 
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
        book.status,
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