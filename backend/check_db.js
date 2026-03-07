const db = require('./db');

// 检查书籍状态
db.all('SELECT * FROM books', (err, books) => {
  if (err) {
    console.error('Error querying books:', err);
    return;
  }
  console.log('Books:');
  books.forEach(book => {
    console.log(`ID: ${book.id}, Title: ${book.title}, Status: ${book.status}`);
  });
  
  // 检查借阅记录
  db.all('SELECT * FROM borrow_records', (err, records) => {
    if (err) {
      console.error('Error querying borrow records:', err);
      return;
    }
    console.log('\nBorrow Records:');
    records.forEach(record => {
      console.log(`ID: ${record.id}, User ID: ${record.user_id}, Book ID: ${record.book_id}, Borrow Date: ${record.borrow_date}, Return Date: ${record.return_date}`);
    });
    
    // 关闭数据库连接
    db.close();
  });
});
