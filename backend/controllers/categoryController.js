const db = require('../db');

// 获取所有分类
exports.getAllCategories = (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(categories);
  });
};

// 获取单个分类
exports.getCategoryById = (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  });
};

// 创建分类（系统管理员或图书管理员）
exports.createCategory = (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  
  db.run(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.status(201).json({
        id: this.lastID,
        name,
        description
      });
    }
  );
};

// 更新分类（系统管理员或图书管理员）
exports.updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  
  db.run(
    'UPDATE categories SET name = ?, description = ? WHERE id = ?',
    [name, description, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      
      res.json({
        id,
        name,
        description
      });
    }
  );
};

// 删除分类（系统管理员或图书管理员）
exports.deleteCategory = (req, res) => {
  const { id } = req.params;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 删除图书分类关联
      db.run('DELETE FROM book_categories WHERE category_id = ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        // 删除分类
        db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (this.changes === 0) {
            db.run('ROLLBACK');
            res.status(404).json({ error: 'Category not found' });
            return;
          }

          db.run('COMMIT', (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'Category deleted successfully' });
          });
        });
      });
    });
  });
};

// 获取图书的分类
exports.getBookCategories = (req, res) => {
  const { bookId } = req.params;
  
  db.all(
    'SELECT c.id, c.name, c.description FROM categories c JOIN book_categories bc ON c.id = bc.category_id WHERE bc.book_id = ?',
    [bookId],
    (err, categories) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(categories);
    }
  );
};

// 为图书添加分类（系统管理员或图书管理员）
exports.addBookCategory = (req, res) => {
  const { bookId } = req.params;
  const { categoryId } = req.body;
  
  if (!categoryId) {
    res.status(400).json({ error: 'Category ID is required' });
    return;
  }
  
  db.run(
    'INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)',
    [bookId, categoryId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.status(201).json({
        id: this.lastID,
        book_id: bookId,
        category_id: categoryId
      });
    }
  );
};

// 从图书中移除分类（系统管理员或图书管理员）
exports.removeBookCategory = (req, res) => {
  const { bookId, categoryId } = req.params;
  
  db.run(
    'DELETE FROM book_categories WHERE book_id = ? AND category_id = ?',
    [bookId, categoryId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Book-category association not found' });
        return;
      }
      
      res.json({ message: 'Category removed from book successfully' });
    }
  );
};