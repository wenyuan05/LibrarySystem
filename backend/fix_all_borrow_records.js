const db = require('./db');

console.log('开始全面修复借阅记录与书籍状态的一致性...');

// 首先获取所有书籍
db.all('SELECT id, title, status FROM books', (err, books) => {
  if (err) {
    console.error('Error fetching books:', err);
    return;
  }

  let totalFixedRecords = 0;
  let totalFixedBooks = 0;

  books.forEach(book => {
    console.log(`\n处理书籍: ${book.title} (ID: ${book.id}, 状态: ${book.status})`);

    // 检查该书籍的所有借阅记录
    db.all('SELECT id, user_id, status FROM borrow_records WHERE book_id = ?', [book.id], (err, records) => {
      if (err) {
        console.error(`Error fetching borrow records for book ${book.id}:`, err);
        return;
      }

      console.log(`  发现 ${records.length} 条借阅记录`);

      // 检查是否有状态为 'borrowed' 的记录
      const borrowedRecords = records.filter(record => record.status === 'borrowed');
      console.log(`  其中 ${borrowedRecords.length} 条状态为 'borrowed'`);

      if (borrowedRecords.length > 0) {
        // 将所有状态为 'borrowed' 的记录标记为 'returned'
        console.log(`  修复 ${borrowedRecords.length} 条状态为 'borrowed' 的记录...`);
        
        borrowedRecords.forEach(record => {
          db.run('UPDATE borrow_records SET status = ?, return_date = ? WHERE id = ?', 
            ['returned', new Date().toISOString().split('T')[0], record.id],
            (err) => {
              if (err) {
                console.error(`Error updating record ${record.id}:`, err);
              } else {
                totalFixedRecords++;
                console.log(`  成功修复记录 ID: ${record.id}`);
              }
            }
          );
        });

        // 确保书籍状态为 available
        if (book.status !== 'available') {
          console.log(`  修复书籍状态为 available`);
          db.run('UPDATE books SET status = ? WHERE id = ?', ['available', book.id], (err) => {
            if (err) {
              console.error(`Error updating book ${book.id} status:`, err);
            } else {
              totalFixedBooks++;
              console.log(`  成功修复书籍 ${book.id} 状态为 available`);
            }
          });
        }
      } else {
        // 没有未归还的借阅记录，确保书籍状态为 available
        if (book.status !== 'available') {
          console.log(`  修复书籍状态为 available`);
          db.run('UPDATE books SET status = ? WHERE id = ?', ['available', book.id], (err) => {
            if (err) {
              console.error(`Error updating book ${book.id} status:`, err);
            } else {
              totalFixedBooks++;
              console.log(`  成功修复书籍 ${book.id} 状态为 available`);
            }
          });
        } else {
          console.log(`  状态一致，无需修复`);
        }
      }

      // 检查是否有状态为 'returning' 的记录
      const returningRecords = records.filter(record => record.status === 'returning');
      if (returningRecords.length > 0) {
        // 将状态为 'returning' 的记录也标记为 'returned'
        console.log(`  修复 ${returningRecords.length} 条状态为 'returning' 的记录...`);
        returningRecords.forEach(record => {
          db.run('UPDATE borrow_records SET status = ? WHERE id = ?', 
            ['returned', record.id],
            (err) => {
              if (err) {
                console.error(`Error updating record ${record.id}:`, err);
              } else {
                totalFixedRecords++;
                console.log(`  成功修复记录 ID: ${record.id}`);
              }
            }
          );
        });
      }
    });
  });

  // 完成后关闭数据库连接
  setTimeout(() => {
    console.log(`\n修复完成！`);
    console.log(`修复了 ${totalFixedRecords} 条借阅记录`);
    console.log(`修复了 ${totalFixedBooks} 本书籍状态`);
    console.log('现在所有书籍都应该可以正常借阅了。');
    db.close();
  }, 2000);
});
