const db = require('./db');

console.log('开始修复借阅记录与书籍状态的一致性...');

// 首先获取所有书籍
 db.all('SELECT id, title, status FROM books', (err, books) => {
  if (err) {
    console.error('Error fetching books:', err);
    return;
  }

  books.forEach(book => {
    console.log(`检查书籍: ${book.title} (ID: ${book.id}, 状态: ${book.status})`);

    // 检查该书籍的借阅记录
    db.all('SELECT id, user_id, status FROM borrow_records WHERE book_id = ?', [book.id], (err, records) => {
      if (err) {
        console.error(`Error fetching borrow records for book ${book.id}:`, err);
        return;
      }

      console.log(`  发现 ${records.length} 条借阅记录`);

      // 检查是否有状态为 'borrowed' 的记录
      const borrowedRecords = records.filter(record => record.status === 'borrowed');
      console.log(`  其中 ${borrowedRecords.length} 条状态为 'borrowed'`);

      if (book.status === 'available' && borrowedRecords.length > 0) {
        // 书籍状态为 available，但有未归还的借阅记录，需要修复
        console.log(`  发现不一致: 书籍状态为 available，但有 ${borrowedRecords.length} 条未归还的借阅记录`);
        
        // 将这些记录标记为 returned
        borrowedRecords.forEach(record => {
          console.log(`  修复记录 ID: ${record.id}，标记为 returned`);
          db.run('UPDATE borrow_records SET status = ?, return_date = ? WHERE id = ?', 
            ['returned', new Date().toISOString().split('T')[0], record.id],
            (err) => {
              if (err) {
                console.error(`Error updating record ${record.id}:`, err);
              } else {
                console.log(`  成功修复记录 ID: ${record.id}`);
              }
            }
          );
        });
      } else if (book.status === 'borrowed' && borrowedRecords.length === 0) {
        // 书籍状态为 borrowed，但没有对应的借阅记录，需要修复
        console.log(`  发现不一致: 书籍状态为 borrowed，但没有未归还的借阅记录`);
        console.log(`  修复书籍状态为 available`);
        
        db.run('UPDATE books SET status = ? WHERE id = ?', ['available', book.id], (err) => {
          if (err) {
            console.error(`Error updating book ${book.id} status:`, err);
          } else {
            console.log(`  成功修复书籍 ${book.id} 状态为 available`);
          }
        });
      } else {
        // 状态一致，无需修复
        console.log(`  状态一致，无需修复`);
      }

      // 检查是否有状态为 'returning' 的记录，但书籍状态不是 'borrowed'
      const returningRecords = records.filter(record => record.status === 'returning');
      if (returningRecords.length > 0 && book.status !== 'borrowed') {
        console.log(`  发现不一致: 有 ${returningRecords.length} 条状态为 'returning' 的记录，但书籍状态不是 'borrowed'`);
        console.log(`  修复书籍状态为 borrowed`);
        
        db.run('UPDATE books SET status = ? WHERE id = ?', ['borrowed', book.id], (err) => {
          if (err) {
            console.error(`Error updating book ${book.id} status:`, err);
          } else {
            console.log(`  成功修复书籍 ${book.id} 状态为 borrowed`);
          }
        });
      }
    });
  });

  // 完成后关闭数据库连接
  setTimeout(() => {
    console.log('修复完成！');
    db.close();
  }, 1000);
});
