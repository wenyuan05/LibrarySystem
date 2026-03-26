const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBookBody, validateBookUpdateBody } = require('../middleware/validation');

// 获取所有书籍（无需登录，公开访问）
router.get('/', bookController.getAllBooks);

// 搜索图书（无需登录，公开访问）- 需要放在 /:id 之前
router.get('/search', bookController.searchBooks);

// 添加书籍（管理员或图书管理员）
router.post('/', authenticateToken, requireRole(['admin', 'librarian']), validateBookBody, bookController.addBook);

// 更新副本状态（管理员或图书管理员）
router.put('/copies/:id/status', authenticateToken, requireRole(['admin', 'librarian']), bookController.updateCopyStatus);

// 获取单个副本信息（无需登录，公开访问）
router.get('/copies/:id', bookController.getCopyById);

// 获取书籍的所有副本（无需登录，公开访问）
router.get('/:book_id/copies', bookController.getBookCopies);

// 获取单本书籍（无需登录，公开访问）- 需要放在最后
router.get('/:id', bookController.getBookById);

module.exports = router;