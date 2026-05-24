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

// 导出图书信息到CSV（管理员或图书管理员）
router.get('/export', authenticateToken, requireRole(['admin', 'librarian']), bookController.exportBooks);

// 添加书籍（管理员或图书管理员）
router.post('/', authenticateToken, requireRole(['admin', 'librarian']), validateBookBody, bookController.addBook);

// 获取和测试 ISBN 查询节点（管理员或图书管理员）
router.get('/isbn-providers', authenticateToken, requireRole(['admin', 'librarian']), bookController.getIsbnProviders);
router.post('/isbn-providers/test', authenticateToken, requireRole(['admin', 'librarian']), bookController.testIsbnProvider);

// 通过 ISBN 查询书籍信息（管理员或图书管理员）
router.get('/isbn/:isbn', authenticateToken, requireRole(['admin', 'librarian']), bookController.searchByISBN);

// 批量导入书籍（管理员或图书管理员）
router.post('/batch', authenticateToken, requireRole(['admin', 'librarian']), bookController.batchImportBooks);

// 获取书籍的所有副本（无需登录，公开访问）
router.get('/:book_id/copies', bookController.getBookCopies);

// 添加书籍副本（管理员或图书管理员）
router.post('/:book_id/copies', authenticateToken, requireRole(['admin', 'librarian']), bookController.addBookCopy);

// 更新副本状态（管理员或图书管理员）
router.put('/copies/:id/status', authenticateToken, requireRole(['admin', 'librarian']), bookController.updateCopyStatus);

// 更新副本位置（管理员或图书管理员）
router.put('/copies/:id/location', authenticateToken, requireRole(['admin', 'librarian']), bookController.updateCopyLocation);

// 获取单个副本信息（无需登录，公开访问）
router.delete('/copies/:id', authenticateToken, requireRole(['admin', 'librarian']), bookController.deleteBookCopy);

router.get('/copies/:id', bookController.getCopyById);

// 更新书籍信息（管理员或图书管理员）
router.put('/:id', authenticateToken, requireRole(['admin', 'librarian']), validateBookUpdateBody, bookController.updateBook);

// 删除书籍（管理员或图书管理员）
router.delete('/:id', authenticateToken, requireRole(['admin', 'librarian']), bookController.deleteBook);

// 获取单本书籍（无需登录，公开访问）- 需要放在最后
router.get('/:id', bookController.getBookById);

module.exports = router;
