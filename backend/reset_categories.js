const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

// 重置分类数据
db.serialize(() => {
  // 删除旧的分类关联
  db.run('DELETE FROM book_categories', (err) => {
    if (err) {
      console.error('Error deleting book categories:', err.message);
    } else {
      console.log('Deleted old book categories');
    }
  });

  // 删除旧的分类
  db.run('DELETE FROM categories', (err) => {
    if (err) {
      console.error('Error deleting categories:', err.message);
    } else {
      console.log('Deleted old categories');
    }
  });

  // 插入新的英文分类
  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  insertCategory.run('Literature', 'Literature books');
  insertCategory.run('History', 'History books');
  insertCategory.run('Science', 'Science and technology books');
  insertCategory.run('Art', 'Art books');
  insertCategory.run('Education', 'Education books');
  insertCategory.finalize(() => {
    console.log('Inserted new English categories');

    // 为书籍创建分类关联
    db.run('INSERT INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 1 AND c.name = "Literature"');
    db.run('INSERT INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 2 AND c.name = "History"');
    db.run('INSERT INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 3 AND c.name = "Science"');
    db.run('INSERT INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 1 AND c.name = "Art"');
    db.run('INSERT INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 2 AND c.name = "Education"');

    console.log('Created new book category associations');
    console.log('Categories reset to English successfully!');
    db.close();
  });
});
