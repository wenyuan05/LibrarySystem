const db = require('./db');

// 模拟req对象
const req = {
  body: {
    user_id: 2,
    book_id: 1
  },
  user: {
    id: 2,
    role: 'user'
  }
};

// 模拟res对象
const res = {
  status: function(code) {
    console.log(`Status: ${code}`);
    return this;
  },
  json: function(data) {
    console.log('Response:', data);
  }
};

// 导入reserveBook函数
const { reserveBook } = require('./controllers/borrowController');

// 测试reserveBook函数
console.log('Testing reserveBook function...');
reserveBook(req, res);
