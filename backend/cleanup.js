const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

console.log('开始清理数据库重复数据...');

// 处理书籍表的重复数据
function cleanupBooks() {
  return new Promise((resolve, reject) => {
    console.log('\n1. 检查书籍表中的重复ISBN...');
    db.all('SELECT isbn, COUNT(*) as count FROM books GROUP BY isbn HAVING count > 1', (err, rows) => {
      if (err) {
        reject('查询书籍重复数据失败:', err);
        return;
      }
      
      if (rows.length === 0) {
        console.log('书籍表中没有重复的ISBN');
        resolve();
      } else {
        console.log(`发现 ${rows.length} 个重复的ISBN:`);
        let completed = 0;
        
        rows.forEach(row => {
          console.log(`ISBN: ${row.isbn}, 重复次数: ${row.count}`);
          
          // 保留第一个记录，删除其他重复记录
          db.run(
            'DELETE FROM books WHERE isbn = ? AND id NOT IN (SELECT MIN(id) FROM books WHERE isbn = ?)',
            [row.isbn, row.isbn],
            function(err) {
              if (err) {
                console.error(`删除重复书籍失败 (ISBN: ${row.isbn}):`, err);
              } else {
                console.log(`已删除 ${this.changes - 1} 条重复记录 (ISBN: ${row.isbn})`);
              }
              
              completed++;
              if (completed === rows.length) {
                resolve();
              }
            }
          );
        });
      }
    });
  });
}

// 处理用户表的重复数据
function cleanupUsers() {
  return new Promise((resolve, reject) => {
    console.log('\n2. 检查用户表中的重复用户名...');
    db.all('SELECT username, COUNT(*) as count FROM users GROUP BY username HAVING count > 1', (err, rows) => {
      if (err) {
        reject('查询用户重复数据失败:', err);
        return;
      }
      
      if (rows.length === 0) {
        console.log('用户表中没有重复的用户名');
        resolve();
      } else {
        console.log(`发现 ${rows.length} 个重复的用户名:`);
        let completed = 0;
        
        rows.forEach(row => {
          console.log(`用户名: ${row.username}, 重复次数: ${row.count}`);
          
          // 保留第一个记录，删除其他重复记录
          db.run(
            'DELETE FROM users WHERE username = ? AND id NOT IN (SELECT MIN(id) FROM users WHERE username = ?)',
            [row.username, row.username],
            function(err) {
              if (err) {
                console.error(`删除重复用户失败 (用户名: ${row.username}):`, err);
              } else {
                console.log(`已删除 ${this.changes - 1} 条重复记录 (用户名: ${row.username})`);
              }
              
              completed++;
              if (completed === rows.length) {
                resolve();
              }
            }
          );
        });
      }
    });
  });
}

// 添加唯一约束
function addUniqueConstraints() {
  return new Promise((resolve, reject) => {
    console.log('\n3. 为数据库表添加唯一约束...');
    let completed = 0;
    const total = 2;
    
    // 为书籍表的ISBN添加唯一约束
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)', (err) => {
      if (err) {
        console.error('为书籍表添加ISBN唯一索引失败:', err);
      } else {
        console.log('已为书籍表的ISBN添加唯一索引');
      }
      
      completed++;
      if (completed === total) {
        resolve();
      }
    });
    
    // 为用户表的用户名添加唯一约束
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)', (err) => {
      if (err) {
        console.error('为用户表添加用户名唯一索引失败:', err);
      } else {
        console.log('已为用户表的用户名添加唯一索引');
      }
      
      completed++;
      if (completed === total) {
        resolve();
      }
    });
  });
}

// 主流程
async function main() {
  try {
    await cleanupBooks();
    await cleanupUsers();
    await addUniqueConstraints();
    
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err);
      } else {
        console.log('\n数据库清理完成！');
      }
    });
  } catch (error) {
    console.error('清理过程中发生错误:', error);
    db.close();
  }
}

// 执行主流程
main();