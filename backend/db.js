const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
      isbn TEXT NOT NULL,
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

  // 插入一些示例数据
  const insertBook = db.prepare('INSERT OR IGNORE INTO books (title, author, isbn, status) VALUES (?, ?, ?, ?)');
  insertBook.run('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'available');
  insertBook.run('1984', 'George Orwell', '9780451524935', 'available');
  insertBook.run('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'borrowed');
  insertBook.finalize();

  // 插入示例用户数据
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('admin', 'admin123', 'admin', 'Admin User', 'admin@example.com');
  insertUser.run('user1', 'user123', 'user', 'John Doe', 'user1@example.com');
  insertUser.finalize();

  console.log('Database initialized with sample data');
});

module.exports = db;