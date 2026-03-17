const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBookBody, validateBookUpdateBody } = require('../middleware/validation');

// 获取所有书籍（无需登录，公开访问）
router.get('/', bookController.getAllBooks);

// 搜索图书（无需登录，公开访问）- 需要放在 /:id 之前
router.get('/search', bookController.searchBooks);

// 获取热门图书（无需登录，公开访问）
router.get('/popular', bookController.getPopularBooks);

// 导出图书信息到CSV（管理员）
router.get('/export', authenticateToken, requireRole('admin'), bookController.exportBooks);

// 添加书籍（管理员或图书管理员）
router.post('/', authenticateToken, requireRole(['admin', 'librarian']), validateBookBody, bookController.addBook);

// 更新书籍信息（管理员或图书管理员）
router.put('/:id', authenticateToken, requireRole(['admin', 'librarian']), validateBookUpdateBody, bookController.updateBook);

// 删除书籍（管理员或图书管理员）
router.delete('/:id', authenticateToken, requireRole(['admin', 'librarian']), bookController.deleteBook);

// 获取单本书籍（无需登录，公开访问）- 需要放在最后
router.get('/:id', bookController.getBookById);

module.exports = router;