const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

// 初始化数据库
db.serialize(() => {
  // 创建系统参数表
  db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建图书分类表
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建图书分类关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS book_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(book_id, category_id)
    )
  `);

  // 创建用户状态表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      status TEXT DEFAULT 'active',
      blacklisted_until TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建书籍表
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT NOT NULL UNIQUE,
      description TEXT,
      cover_image TEXT,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      publisher TEXT,
      publish_date TEXT,
      language TEXT DEFAULT 'Chinese',
      page_count INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建书籍副本表
  db.run(`
    CREATE TABLE IF NOT EXISTS book_copies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      copy_code TEXT UNIQUE,
      status TEXT DEFAULT 'available',
      location TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id)
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
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      total_fine REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建借阅记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      copy_id INTEGER,
      borrow_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT,
      confirm_deadline TEXT,
      status TEXT DEFAULT 'borrowed',
      fine REAL DEFAULT 0,
      fine_status TEXT DEFAULT 'unpaid',
      renew_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (copy_id) REFERENCES book_copies(id)
    )
  `);

  // 创建预约记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS reservation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      reservation_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      notification_sent INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  // 创建系统日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      description TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建公告表
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
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

  // 为现有书籍表添加新字段
  db.run('ALTER TABLE books ADD COLUMN publisher TEXT', (err) => {
    // 字段已存在，忽略错误
  });
  db.run('ALTER TABLE books ADD COLUMN publish_date TEXT', (err) => {
    // 字段已存在，忽略错误
  });
  db.run('ALTER TABLE books ADD COLUMN language TEXT DEFAULT "Chinese"', (err) => {
    // 字段已存在，忽略错误
  });
  db.run('ALTER TABLE books ADD COLUMN page_count INTEGER', (err) => {
    // 字段已存在，忽略错误
  });
  
  // 为现有书籍副本表添加 location 字段
  db.run('ALTER TABLE book_copies ADD COLUMN location TEXT', (err) => {
    // 字段已存在，忽略错误
  });

  // 为现有书籍副本表添加 copy_code 字段
  db.run('ALTER TABLE book_copies ADD COLUMN copy_code TEXT', (err) => {
    // 字段已存在，忽略错误
  });
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_book_copies_copy_code ON book_copies(copy_code)', (err) => {
    // 索引已存在，忽略错误
  });

  // 为现有副本生成 copy_code（如果为空）
  db.all("SELECT bc.id, bc.book_id, bc.copy_code, (SELECT COUNT(*) FROM book_copies WHERE book_id = bc.book_id AND id <= bc.id) as seq FROM book_copies bc WHERE bc.copy_code IS NULL", (err, rows) => {
    if (!err && rows) {
      rows.forEach(row => {
        const copyCode = `CP-${row.book_id}-${String(row.seq).padStart(3, '0')}`;
        db.run('UPDATE book_copies SET copy_code = ? WHERE id = ?', [copyCode, row.id]);
      });
    }
  });

  // 为现有借阅记录表添加renew_count字段
  db.run('ALTER TABLE borrow_records ADD COLUMN renew_count INTEGER DEFAULT 0', (err) => {
    // 字段已存在，忽略错误
  });

  // 为现有借阅记录表添加 fine_status 字段
  db.run('ALTER TABLE borrow_records ADD COLUMN fine_status TEXT DEFAULT "unpaid"', (err) => {
    // 字段已存在，忽略错误
  });

  // 为现有用户表添加 total_fine 字段
  db.run('ALTER TABLE users ADD COLUMN total_fine REAL DEFAULT 0', (err) => {
    // 字段已存在，忽略错误
  });

  // 插入一些示例数据
  const insertBook = db.prepare('INSERT OR IGNORE INTO books (title, author, isbn, publisher, publish_date, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertBook.run('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Scribner', '1925-04-10', 'English', 180);
  insertBook.run('1984', 'George Orwell', '9780451524935', 'Secker & Warburg', '1949-06-08', 'English', 328);
  insertBook.run('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'J.B. Lippincott & Co.', '1960-07-11', 'English', 281);
  insertBook.finalize();

  // 插入系统参数默认值
  const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)');
  insertSetting.run('system_name', 'Library Management System', '系统名称');
  insertSetting.run('system_version', '1.0.0', '系统版本');
  insertSetting.run('borrow_period_days', '14', '借阅期限（天）');
  insertSetting.run('fine_per_day', '0.5', '每天罚款金额');
  insertSetting.run('max_borrows', '5', '最大借阅数量');
  insertSetting.run('max_reservations', '3', '最大预约数量');
  insertSetting.run('blacklist_days', '30', '拉黑天数');
  insertSetting.run('borrow_confirm_minutes', '60', '借阅确认时长（分钟）');
  insertSetting.run('max_renew_times', '3', '最大续借次数');
  insertSetting.run('renew_days', '7', '续借天数');
  insertSetting.finalize();

  // 插入图书分类示例数据
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  insertCategory.run('Literature', 'Literature books');
  insertCategory.run('History', 'History books');
  insertCategory.run('Science', 'Science and technology books');
  insertCategory.run('Art', 'Art books');
  insertCategory.run('Education', 'Education books');
  insertCategory.finalize();

  // 为书籍创建分类关联
  db.run('INSERT OR IGNORE INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 1 AND c.name = "Literature"');
  db.run('INSERT OR IGNORE INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 2 AND c.name = "History"');
  db.run('INSERT OR IGNORE INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 3 AND c.name = "Science"');
  db.run('INSERT OR IGNORE INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 1 AND c.name = "Art"');
  db.run('INSERT OR IGNORE INTO book_categories (book_id, category_id) SELECT b.id, c.id FROM books b, categories c WHERE b.id = 2 AND c.name = "Education"');

  // 为示例书籍创建副本，确保每本书只有3个副本
  for (let bookId = 1; bookId <= 3; bookId++) {
    // 检查当前副本数量
    db.get('SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?', [bookId], (err, result) => {
      if (err) {
        console.error('Error checking copy count:', err.message);
        return;
      }
      
      const currentCount = result.count || 0;
      const targetCount = 3;
      
      // 只创建需要的副本
      if (currentCount < targetCount) {
        const insertCopy = db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)');

        for (let i = currentCount; i < targetCount; i++) {
          // 第一本书的第一个副本设为borrowed，其他为available
          const status = (bookId === 3 && i === 0) ? 'borrowed' : 'available';
          const copyCode = `CP-${bookId}-${String(i + 1).padStart(3, '0')}`;
          insertCopy.run(bookId, copyCode, status, null);
        }
        
        insertCopy.finalize();
      }
    });
  }

  // 插入示例用户数据（使用密码哈希）
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)');
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const userPasswordHash = bcrypt.hashSync('user123', 10);
  insertUser.run('admin', adminPasswordHash, 'admin', 'Admin User', 'admin@example.com');
  insertUser.run('user1', userPasswordHash, 'user', 'Test User', 'user@example.com');
  insertUser.finalize();


  
  // 插入额外的用户
  const insertAdditionalUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)');
  insertAdditionalUser.run('librarian', adminPasswordHash, 'librarian', 'Librarian User', 'librarian@example.com');
  insertAdditionalUser.finalize();

  // 为用户创建状态记录
  db.run('INSERT OR IGNORE INTO user_status (user_id, status) SELECT id, "active" FROM users');

  // 添加索引以提高查询性能
  // 书籍表索引
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)');
  
  // 用户表索引
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
  
  // 借阅记录表索引
  db.run('CREATE INDEX IF NOT EXISTS idx_borrow_records_user_id ON borrow_records(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_borrow_records_book_id ON borrow_records(book_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON borrow_records(status)');
  
  // 预约记录表索引
  db.run('CREATE INDEX IF NOT EXISTS idx_reservation_records_user_id ON reservation_records(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reservation_records_book_id ON reservation_records(book_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reservation_records_status ON reservation_records(status)');
  
  // 图书分类关联表索引
  db.run('CREATE INDEX IF NOT EXISTS idx_book_categories_book_id ON book_categories(book_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_book_categories_category_id ON book_categories(category_id)');
  
  // 用户状态表索引
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_status_user_id ON user_status(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_user_status_status ON user_status(status)');
  
  // 系统日志表索引
  db.run('CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)');
  
  // 公告表索引
  db.run('CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON announcements(is_published)');
  db.run('CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at)');

  console.log('Database initialized with sample data and extended structure');

 
});

module.exports = db;
