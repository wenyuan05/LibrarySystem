const db = require('./db');

// 删除所有未归还的借阅记录
function clearBorrowedRecords() {
  console.log('开始清理未归还的借阅记录...');
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('开始事务失败:', err.message);
        return;
      }
      
      // 删除所有status为'borrowed'的借阅记录
      db.run('DELETE FROM borrow_records WHERE status = ?', ['borrowed'], function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error('删除借阅记录失败:', err.message);
          return;
        }
        
        console.log(`成功删除 ${this.changes} 条未归还的借阅记录`);
        
        // 更新所有书籍状态为available
        db.run('UPDATE books SET status = ?, available_copies = total_copies', ['available'], function(err) {
          if (err) {
            db.run('ROLLBACK');
            console.error('更新书籍状态失败:', err.message);
            return;
          }
          
          console.log(`成功更新 ${this.changes} 本书籍的状态为可用`);
          
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('提交事务失败:', err.message);
              return;
            }
            
            console.log('清理完成！');
            db.close();
          });
        });
      });
    });
  });
}

// 执行清理操作
clearBorrowedRecords();
