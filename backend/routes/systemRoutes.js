const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取当前登录用户可见的功能开关
router.get('/feature-flags', authenticateToken, systemController.getFeatureFlags);

// 获取系统设置（需要系统管理员）
router.get('/settings', authenticateToken, requireRole('admin'), systemController.getSystemSettings);

// 获取邮件配置状态（需要系统管理员）
router.get('/email/status', authenticateToken, requireRole('admin'), systemController.getEmailStatus);

// 发送测试邮件（需要系统管理员）
router.post('/email/test', authenticateToken, requireRole('admin'), systemController.sendTestEmail);

// 更新系统设置（需要系统管理员）
router.put('/settings', authenticateToken, requireRole('admin'), systemController.updateSystemSettings);

module.exports = router;
