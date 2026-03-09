const db = require('./db');

// 修复To Kill a Mockingbird的状态
db.run('UPDATE books SET status = ? WHERE title = ?', ['available', 'To Kill a Mockingbird'], function(err) {
  if (err) {
    console.error('Error updating book status:', err);
    return;
  }
  console.log(`Updated ${this.changes} book(s) status to available`);
  
  // 验证修复
  db.get('SELECT * FROM books WHERE title = ?', ['To Kill a Mockingbird'], (err, book) => {
    if (err) {
      console.error('Error querying book:', err);
      return;
    }
    console.log('Fixed book status:', book);
    db.close();
  });
});
