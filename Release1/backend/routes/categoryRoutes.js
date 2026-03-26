const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取所有分类（无需登录，公开访问）
router.get('/', categoryController.getAllCategories);

// 获取单个分类（无需登录，公开访问）
router.get('/:id', categoryController.getCategoryById);

// 创建分类（需要系统管理员或图书管理员）
router.post('/', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can create categories' });
  }
}, categoryController.createCategory);

// 更新分类（需要系统管理员或图书管理员）
router.put('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can update categories' });
  }
}, categoryController.updateCategory);

// 删除分类（需要系统管理员或图书管理员）
router.delete('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can delete categories' });
  }
}, categoryController.deleteCategory);

// 获取图书的分类（无需登录，公开访问）
router.get('/book/:bookId', categoryController.getBookCategories);

// 为图书添加分类（需要系统管理员或图书管理员）
router.post('/book/:bookId', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can add categories to books' });
  }
}, categoryController.addBookCategory);

// 从图书中移除分类（需要系统管理员或图书管理员）
router.delete('/book/:bookId/:categoryId', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can remove categories from books' });
  }
}, categoryController.removeBookCategory);

module.exports = router;