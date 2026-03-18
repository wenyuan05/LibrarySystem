const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

// 书籍补充数据
const bookData = [
  {
    id: 1,
    publisher: 'Scribner',
    publish_date: '1925-04-10',
    language: 'English',
    page_count: 180,
    description: 'A story of wealth, love, and tragedy set in the Roaring Twenties.'
  },
  {
    id: 2,
    publisher: 'Secker & Warburg',
    publish_date: '1949-06-08',
    language: 'English',
    page_count: 328,
    description: 'A dystopian novel set in a totalitarian society.'
  },
  {
    id: 3,
    publisher: 'J.B. Lippincott & Co.',
    publish_date: '1960-07-11',
    language: 'English',
    page_count: 281,
    description: 'A coming-of-age story dealing with racial injustice in the American South.'
  }
];

// 检查现有书籍数据
const checkExistingBooks = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, title, author, isbn, publisher, publish_date, language, page_count FROM books', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

// 更新书籍数据
const updateBookData = (book) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE books 
      SET publisher = ?, publish_date = ?, language = ?, page_count = ?, description = ?
      WHERE id = ?
    `;
    db.run(
      sql,
      [book.publisher, book.publish_date, book.language, book.page_count, book.description, book.id],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: book.id, changes: this.changes });
      }
    );
  });
};

// 主函数
const main = async () => {
  try {
    console.log('Checking existing book data...');
    const existingBooks = await checkExistingBooks();
    
    console.log('Existing books:');
    existingBooks.forEach(book => {
      console.log(`ID: ${book.id}, Title: ${book.title}, Publisher: ${book.publisher || 'N/A'}, Publish Date: ${book.publish_date || 'N/A'}`);
    });
    
    console.log('\nUpdating book data...');
    for (const book of bookData) {
      try {
        const result = await updateBookData(book);
        console.log(`Updated book ID ${result.id}: ${result.changes} row(s) affected`);
      } catch (err) {
        console.error(`Error updating book ID ${book.id}:`, err.message);
      }
    }
    
    console.log('\nVerification after update:');
    const updatedBooks = await checkExistingBooks();
    updatedBooks.forEach(book => {
      console.log(`ID: ${book.id}, Title: ${book.title}, Publisher: ${book.publisher || 'N/A'}, Publish Date: ${book.publish_date || 'N/A'}, Language: ${book.language || 'N/A'}, Page Count: ${book.page_count || 'N/A'}`);
    });
    
    console.log('\nBook data update completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    db.close();
  }
};

// 运行主函数
main();