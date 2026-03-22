const db = require('./db');

// 简单测试函数
exports.testFunction = (req, res) => {
  console.log('Test function called');
  res.json({ message: 'Test successful' });
};