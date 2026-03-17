const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取系统设置（需要系统管理员）
router.get('/settings', authenticateToken, requireRole('admin'), systemController.getSystemSettings);

// 更新系统设置（需要系统管理员）
router.put('/settings', authenticateToken, requireRole('admin'), systemController.updateSystemSettings);

module.exports = router;