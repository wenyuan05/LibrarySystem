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