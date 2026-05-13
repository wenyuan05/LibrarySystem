const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateLoginBody, validateRegisterBody, validateAdminAddUserBody, validatePasswordResetRequest, validatePasswordReset } = require('../middleware/validation');

// 用户登录
router.post('/login', validateLoginBody, userController.login);

// 用户注册（普通用户自助注册）
router.post('/register', validateRegisterBody, userController.register);

// 获取用户信息（需要登录，允许本人、管理员或图书管理员）
router.get('/:id', authenticateToken, (req, res, next) => {
  const { id } = req.params;
  if (Number(id) === req.user.id || req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
}, userController.getUserById);

// 获取所有用户（管理员或图书管理员）
router.get('/', authenticateToken, requireRole(['admin', 'librarian']), userController.getAllUsers);

// 添加用户（管理员或图书管理员）
router.post('/', authenticateToken, requireRole(['admin', 'librarian']), validateAdminAddUserBody, userController.addUser);

// 更新用户信息（需要登录，允许本人、管理员或图书管理员）
router.put('/:id', authenticateToken, (req, res, next) => {
  const { id } = req.params;
  if (Number(id) === req.user.id || req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
}, userController.updateUser);

// 删除用户（管理员或图书管理员）
router.delete('/:id', authenticateToken, requireRole('admin'), userController.deleteUser);

// 获取用户借阅记录（需要登录，允许本人、管理员或图书管理员）
router.get('/:id/borrow-records', authenticateToken, (req, res, next) => {
  const { id } = req.params;
  if (Number(id) === req.user.id || req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
}, userController.getUserBorrowRecords);

// 获取用户状态（需要登录，允许本人、管理员或图书管理员）
router.get('/:id/status', authenticateToken, (req, res, next) => {
  const { id } = req.params;
  if (Number(id) === req.user.id || req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
}, userController.getUserStatus);

// 拉黑用户（图书管理员或系统管理员）
router.post('/:id/block', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can block users' });
  }
}, userController.blockUser);

// 解除拉黑用户（图书管理员或系统管理员）
router.post('/:id/unblock', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'librarian') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: only admin or librarian can unblock users' });
  }
}, userController.unblockUser);

// 请求密码重置（不需要认证）
router.post('/reset-password/request', validatePasswordResetRequest, userController.requestPasswordReset);

// 重置密码（不需要认证）
router.post('/reset-password', validatePasswordReset, userController.resetPassword);

module.exports = router;
