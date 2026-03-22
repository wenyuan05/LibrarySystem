const db = require('./db');

console.log('开始直接修复所有借阅记录...');

// 直接更新所有状态为 'borrowed' 的记录为 'returned'
const fixDate = new Date().toISOString().split('T')[0];

db.run(
  'UPDATE borrow_records SET status = ?, return_date = ? WHERE status = ?',
  ['returned', fixDate, 'borrowed'],
  function(err) {
    if (err) {
      console.error('Error updating borrowed records:', err);
      return;
    }
    console.log(`成功修复 ${this.changes} 条状态为 'borrowed' 的记录`);

    // 同时更新状态为 'returning' 的记录为 'returned'
    db.run(
      'UPDATE borrow_records SET status = ? WHERE status = ?',
      ['returned', 'returning'],
      function(err) {
        if (err) {
          console.error('Error updating returning records:', err);
          return;
        }
        console.log(`成功修复 ${this.changes} 条状态为 'returning' 的记录`);

        // 确保所有书籍状态为 available
        db.run(
          'UPDATE books SET status = ? WHERE status != ?',
          ['available', 'available'],
          function(err) {
            if (err) {
              console.error('Error updating book statuses:', err);
              return;
            }
            console.log(`成功修复 ${this.changes} 本书籍状态为 available`);

            // 验证修复结果
            db.all('SELECT id, status FROM borrow_records WHERE status = ? OR status = ?', ['borrowed', 'returning'], (err, records) => {
              if (err) {
                console.error('Error verifying fix:', err);
                return;
              }
              console.log(`\n修复后，仍有 ${records.length} 条记录状态为 borrowed 或 returning`);
              if (records.length > 0) {
                records.forEach(record => {
                  console.log(`  记录 ID: ${record.id}, 状态: ${record.status}`);
                });
              } else {
                console.log('✅ 所有记录都已修复！');
              }

              // 检查书籍状态
              db.all('SELECT id, title, status FROM books WHERE status != ?', ['available'], (err, books) => {
                if (err) {
                  console.error('Error checking book statuses:', err);
                  return;
                }
                console.log(`\n修复后，仍有 ${books.length} 本书籍状态不是 available`);
                if (books.length > 0) {
                  books.forEach(book => {
                    console.log(`  书籍 ID: ${book.id}, 标题: ${book.title}, 状态: ${book.status}`);
                  });
                } else {
                  console.log('✅ 所有书籍状态都已修复为 available！');
                }

                console.log('\n修复完成！现在所有书籍都应该可以正常借阅了。');
                db.close();
              });
            });
          }
        );
      }
    );
  }
);
