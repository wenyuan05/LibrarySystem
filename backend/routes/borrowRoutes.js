const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateBorrowBody, 
  validateReturnBody, 
  validateConfirmBorrowBody, 
  validateApproveReturnBody, 
  validateReserveBody, 
  validateCancelReservationBody, 
  validateRenewBody 
} = require('../middleware/validation');

// 借阅书籍（需要登录）
router.post('/borrow', authenticateToken, validateBorrowBody, borrowController.borrowBook);

// 归还书籍（需要登录）
router.post('/return', authenticateToken, validateReturnBody, borrowController.returnBook);

// 获取借阅中列表（需要登录）
router.get('/borrowing', authenticateToken, borrowController.getBorrowingList);

// 预约图书（需要登录）
router.post('/reserve', authenticateToken, validateReserveBody, borrowController.reserveBook);

// 获取用户的预约记录（需要登录）
router.get('/reservations/:user_id', authenticateToken, borrowController.getUserReservations);

// 续借图书（需要登录）
router.post('/renew', authenticateToken, validateRenewBody, borrowController.renewBook);

// 取消预约（需要登录）
router.post('/cancel-reservation', authenticateToken, validateCancelReservationBody, borrowController.cancelReservation);

// 审批归还请求（需要登录，且只有管理员或图书管理员可以操作）
router.post('/approve-return', authenticateToken, validateApproveReturnBody, borrowController.approveReturn);

// 获取待审批的归还请求列表（需要登录，且只有管理员或图书管理员可以操作）
router.get('/returning', authenticateToken, borrowController.getReturningList);

// 确认借阅（需要登录）
router.post('/confirm-borrow', authenticateToken, validateConfirmBorrowBody, borrowController.confirmBorrow);

// 处理超时借阅（需要登录，且只有管理员或图书管理员可以操作）
router.post('/handle-timeout', authenticateToken, borrowController.handleTimeoutBorrows);

module.exports = router;