const db = require('./db');

console.log('检查状态为 borrowed 的借阅记录...');

// 检查所有状态为 borrowed 的借阅记录
db.all('SELECT id, book_id, user_id, status FROM borrow_records WHERE status = ?', ['borrowed'], (err, records) => {
  if (err) {
    console.error('Error fetching borrowed records:', err);
    return;
  }

  console.log(`找到 ${records.length} 条状态为 'borrowed' 的借阅记录:`);
  
  // 按书籍ID分组
  const recordsByBook = {};
  records.forEach(record => {
    if (!recordsByBook[record.book_id]) {
      recordsByBook[record.book_id] = [];
    }
    recordsByBook[record.book_id].push(record);
  });

  // 遍历每个书籍的借阅记录
  for (const bookId in recordsByBook) {
    const bookRecords = recordsByBook[bookId];
    console.log(`\n书籍 ID ${bookId} 有 ${bookRecords.length} 条未归还的借阅记录:`);
    bookRecords.forEach(record => {
      console.log(`  记录 ID: ${record.id}, 用户 ID: ${record.user_id}, 状态: ${record.status}`);
    });

    // 检查书籍状态
    db.get('SELECT title, status FROM books WHERE id = ?', [bookId], (err, book) => {
      if (err) {
        console.error(`Error fetching book ${bookId}:`, err);
        return;
      }
      console.log(`  书籍信息: ${book.title}, 状态: ${book.status}`);
    });
  }

  // 检查状态为 available 的书籍
  console.log('\n检查状态为 available 的书籍...');
  db.all('SELECT id, title, status FROM books WHERE status = ?', ['available'], (err, books) => {
    if (err) {
      console.error('Error fetching available books:', err);
      return;
    }

    console.log(`找到 ${books.length} 本状态为 'available' 的书籍:`);
    books.forEach(book => {
      console.log(`  书籍 ID: ${book.id}, 标题: ${book.title}, 状态: ${book.status}`);
      
      // 检查这些书籍是否有未归还的借阅记录
      db.all('SELECT id, user_id, status FROM borrow_records WHERE book_id = ? AND status = ?', [book.id, 'borrowed'], (err, bookRecords) => {
        if (err) {
          console.error(`Error fetching records for book ${book.id}:`, err);
          return;
        }
        if (bookRecords.length > 0) {
          console.log(`  ⚠️  警告: 该书籍状态为 available，但有 ${bookRecords.length} 条未归还的借阅记录`);
          bookRecords.forEach(record => {
            console.log(`    记录 ID: ${record.id}, 用户 ID: ${record.user_id}, 状态: ${record.status}`);
          });
        } else {
          console.log(`  ✅  该书籍状态为 available，且没有未归还的借阅记录`);
        }
      });
    });

    // 完成后关闭数据库连接
    setTimeout(() => {
      console.log('\n检查完成！');
      db.close();
    }, 1000);
  });
});
