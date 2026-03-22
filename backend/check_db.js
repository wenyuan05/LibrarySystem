const db = require('./db');

// 检查books表的结构
db.all("PRAGMA table_info(books)", (err, columns) => {
  if (err) {
    console.error('Error checking books table structure:', err.message);
    return;
  }
  console.log('Books table columns:');
  columns.forEach(column => {
    console.log(`${column.name} (${column.type})`);
  });
  
  // 检查book_copies表的结构
  db.all("PRAGMA table_info(book_copies)", (err, columns) => {
    if (err) {
      console.error('Error checking book_copies table structure:', err.message);
      return;
    }
    console.log('\nBook_copies table columns:');
    columns.forEach(column => {
      console.log(`${column.name} (${column.type})`);
    });
    
    // 关闭数据库连接
    db.close();
  });
});
