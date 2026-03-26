const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 获取所有公告（无需登录，公开访问）
router.get('/', announcementController.getAllAnnouncements);

// 获取单个公告（无需登录，公开访问）
router.get('/:id', announcementController.getAnnouncementById);

// 创建公告（需要系统管理员）
router.post('/', authenticateToken, requireRole('admin'), announcementController.createAnnouncement);

// 更新公告（需要系统管理员）
router.put('/:id', authenticateToken, requireRole('admin'), announcementController.updateAnnouncement);

// 删除公告（需要系统管理员）
router.delete('/:id', authenticateToken, requireRole('admin'), announcementController.deleteAnnouncement);

module.exports = router;