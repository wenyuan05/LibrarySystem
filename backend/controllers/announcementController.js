const db = require('../db');

// 获取所有公告
exports.getAllAnnouncements = (req, res) => {
  db.all(
    'SELECT * FROM announcements ORDER BY created_at DESC',
    (err, announcements) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(announcements);
    }
  );
};

// 获取单个公告
exports.getAnnouncementById = (req, res) => {
  const { id } = req.params;
  db.get(
    'SELECT * FROM announcements WHERE id = ?',
    [id],
    (err, announcement) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!announcement) {
        res.status(404).json({ error: 'Announcement not found' });
        return;
      }
      res.json(announcement);
    }
  );
};

// 获取当前用户未读公告
exports.getUnreadAnnouncements = (req, res) => {
  const sql = `
    SELECT a.*
    FROM announcements a
    LEFT JOIN announcement_reads ar
      ON ar.announcement_id = a.id
      AND ar.user_id = ?
    WHERE a.is_published = 1
      AND ar.id IS NULL
    ORDER BY a.created_at DESC, a.id DESC
  `;

  db.all(sql, [req.user.id], (err, announcements) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(announcements || []);
  });
};

// 标记公告已读
exports.markAnnouncementsRead = (req, res) => {
  const announcementIds = Array.isArray(req.body.announcement_ids)
    ? req.body.announcement_ids
    : [req.body.announcement_id || req.params.id].filter(Boolean);

  const normalizedIds = [...new Set(
    announcementIds
      .map(id => parseInt(id, 10))
      .filter(id => Number.isInteger(id) && id > 0)
  )];

  if (normalizedIds.length === 0) {
    res.status(400).json({ error: 'announcement_ids is required' });
    return;
  }

  const insertRead = db.prepare('INSERT OR IGNORE INTO announcement_reads (user_id, announcement_id) VALUES (?, ?)');
  let processed = 0;
  let failed = false;

  normalizedIds.forEach((announcementId) => {
    insertRead.run(req.user.id, announcementId, (err) => {
      if (failed) return;
      if (err) {
        failed = true;
        insertRead.finalize();
        res.status(500).json({ error: err.message });
        return;
      }

      processed++;
      if (processed === normalizedIds.length) {
        insertRead.finalize((finalizeErr) => {
          if (finalizeErr) {
            res.status(500).json({ error: finalizeErr.message });
            return;
          }
          res.json({ message: 'Announcements marked as read', updated: processed });
        });
      }
    });
  });
};

// 创建公告（系统管理员）
exports.createAnnouncement = (req, res) => {
  const { title, content, is_published } = req.body;
  
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }
  
  const created_at = new Date().toISOString().split('T')[0];
  
  db.run(
    'INSERT INTO announcements (title, content, is_published, created_at, author_id) VALUES (?, ?, ?, ?, ?)',
    [title, content, is_published || false, created_at, req.user.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 记录系统日志
      db.run('INSERT INTO system_logs (action, user_id, description) VALUES (?, ?, ?)', 
        ['create_announcement', req.user.id, 'Announcement created by admin'], (err) => {
          if (err) {
            console.error('Failed to log announcement creation:', err);
          }
        }
      );
      
      res.status(201).json({
        id: this.lastID,
        title,
        content,
        is_published: is_published || false,
        created_at
      });
    }
  );
};

// 更新公告（系统管理员）
exports.updateAnnouncement = (req, res) => {
  const { id } = req.params;
  const { title, content, is_published } = req.body;
  
  // 构建更新语句
  const updateFields = [];
  const updateValues = [];
  
  if (title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(title);
  }
  if (content !== undefined) {
    updateFields.push('content = ?');
    updateValues.push(content);
  }
  if (is_published !== undefined) {
    updateFields.push('is_published = ?');
    updateValues.push(is_published);
  }
  
  if (updateFields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  
  // 添加 id 到参数列表
  updateValues.push(id);
  
  // 执行更新
  const sql = `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`;
  db.run(sql, updateValues, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    
    // 记录系统日志
    db.run('INSERT INTO system_logs (action, user_id, description) VALUES (?, ?, ?)', 
      ['update_announcement', req.user.id, 'Announcement updated by admin'], (err) => {
        if (err) {
          console.error('Failed to log announcement update:', err);
        }
      }
    );
    
    // 返回更新后的公告
    db.get('SELECT * FROM announcements WHERE id = ?', [id], (err, announcement) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(announcement);
    });
  });
};

// 删除公告（系统管理员）
exports.deleteAnnouncement = (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM announcements WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    
    // 记录系统日志
    db.run('INSERT INTO system_logs (action, user_id, description) VALUES (?, ?, ?)', 
      ['delete_announcement', req.user.id, 'Announcement deleted by admin'], (err) => {
        if (err) {
          console.error('Failed to log announcement deletion:', err);
        }
      }
    );
    
    res.json({ message: 'Announcement deleted successfully' });
  });
};
