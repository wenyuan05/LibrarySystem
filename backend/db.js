const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

// 初始化数据库
db.serialize(() => {
  // 创建书籍表
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'available'
    )
  `);

  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);

  // 创建借阅记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      borrow_date TEXT NOT NULL,
      return_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  // 将已有用户的明文密码迁移为哈希（兼容旧数据）
  db.all('SELECT id, password FROM users', (err, rows) => {
    if (!err && Array.isArray(rows)) {
      rows.forEach((row) => {
        const pwd = row.password || '';
        // 简单判断：bcrypt 哈希一般以 $2 开头，长度较长
        if (pwd && (!pwd.startsWith('$2a$') && !pwd.startsWith('$2b$') && !pwd.startsWith('$2y$'))) {
          bcrypt.hash(pwd, 10, (hashErr, hashed) => {
            if (!hashErr) {
              db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, row.id]);
            }
          });
        }
      });
    }
  });

  // 插入一些示例数据
  const insertBook = db.prepare('INSERT OR IGNORE INTO books (title, author, isbn, status) VALUES (?, ?, ?, ?)');
  insertBook.run('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'available');
  insertBook.run('1984', 'George Orwell', '9780451524935', 'available');
  insertBook.run('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'borrowed');
  insertBook.finalize();

  // 插入示例用户数据（使用密码哈希）
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)');
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const userPasswordHash = bcrypt.hashSync('user123', 10);
  insertUser.run('admin', adminPasswordHash, 'admin', 'Admin User', 'admin@example.com');
  insertUser.run('user1', userPasswordHash, 'user', 'John Doe', 'user1@example.com');
  insertUser.finalize();

  // 添加索引以提高查询性能
  db.run('CREATE INDEX IF NOT EXISTS idx_borrow_records_user_id ON borrow_records(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_borrow_records_book_id ON borrow_records(book_id)');
  // 添加ISBN唯一索引以确保唯一性
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)');

  console.log('Database initialized with sample data');

});

module.exports = db;