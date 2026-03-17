const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取借阅业务统计数据（管理员和图书管理员）
router.get('/borrow-stats', authenticateToken, requireRole(['admin', 'librarian']), statsController.getBorrowStats);

// 获取月度借阅统计（管理员和图书管理员）
router.get('/monthly-stats', authenticateToken, requireRole(['admin', 'librarian']), statsController.getMonthlyStats);

// 获取热门图书统计（所有登录用户）
router.get('/popular-books', authenticateToken, statsController.getPopularBooksStats);

module.exports = router;