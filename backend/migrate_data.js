const db = require('./db');

console.log('开始数据迁移...');

db.serialize(() => {
  // 1. 为现有书籍创建副本记录
  console.log('为现有书籍创建副本记录...');
  db.all('SELECT id, title, total_copies FROM books', (err, books) => {
    if (err) {
      console.error('获取书籍列表失败:', err.message);
      db.close();
      return;
    }

    let totalCopiesCreated = 0;
    const insertCopy = db.prepare('INSERT INTO book_copies (book_id, status) VALUES (?, ?)');

    books.forEach(book => {
      const totalCopies = book.total_copies || 1;
      console.log(`为书籍 "${book.title}" (ID: ${book.id}) 创建 ${totalCopies} 个副本`);
      
      for (let i = 0; i < totalCopies; i++) {
        insertCopy.run(book.id, 'available', (err) => {
          if (err) {
            console.error(`创建副本失败:`, err.message);
          } else {
            totalCopiesCreated++;
          }
        });
      }
    });

    insertCopy.finalize(() => {
      console.log(`总共创建了 ${totalCopiesCreated} 个副本记录`);
      
      // 2. 检查迁移结果
      db.get('SELECT COUNT(*) as count FROM book_copies', (err, result) => {
        if (err) {
          console.error('检查副本数量失败:', err.message);
        } else {
          console.log(`当前副本总数: ${result.count}`);
        }
        
        console.log('数据迁移完成');
        db.close();
      });
    });
  });
});
