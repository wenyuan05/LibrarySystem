const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateBorrowBody, 
  validateReturnBody, 
  validateConfirmBorrowBody, 
  validateApproveReturnBody 
} = require('../middleware/validation');

// 借阅书籍（需要登录）
router.post('/borrow', authenticateToken, validateBorrowBody, borrowController.borrowBook);

// 归还书籍（需要登录）
router.post('/return', authenticateToken, validateReturnBody, borrowController.returnBook);

// 获取借阅中列表（需要登录）
router.get('/borrowing', authenticateToken, borrowController.getBorrowingList);

// 审批归还请求（需要登录，且只有管理员或图书管理员可以操作）
router.post('/approve-return', authenticateToken, validateApproveReturnBody, borrowController.approveReturn);

// 获取待审批的归还请求列表（需要登录，且只有管理员或图书管理员可以操作）
router.get('/returning', authenticateToken, borrowController.getReturningList);

// 确认借阅（需要登录）
router.post('/confirm-borrow', authenticateToken, validateConfirmBorrowBody, borrowController.confirmBorrow);

module.exports = router;