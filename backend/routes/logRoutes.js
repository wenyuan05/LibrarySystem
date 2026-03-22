const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取系统日志（管理员）
router.get('/', authenticateToken, requireRole('admin'), logController.getSystemLogs);

// 清除系统日志（管理员）
router.delete('/clear', authenticateToken, requireRole('admin'), logController.clearSystemLogs);

module.exports = router;