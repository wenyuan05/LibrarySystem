const db = require('../db');

const canAccessUserNotifications = (req, userId) => {
  return Number(userId) === req.user.id || req.user.role === 'admin' || req.user.role === 'librarian';
};

exports.getUserNotifications = (req, res) => {
  const { user_id } = req.params;

  if (!canAccessUserNotifications(req, user_id)) {
    res.status(403).json({ error: 'Forbidden: cannot view other users\' notifications' });
    return;
  }

  db.all(
    `SELECT id, user_id, title, message, type, is_read, related_id, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [user_id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows || []);
    }
  );
};

exports.getUnreadCount = (req, res) => {
  const { user_id } = req.params;

  if (!canAccessUserNotifications(req, user_id)) {
    res.status(403).json({ error: 'Forbidden: cannot view other users\' notifications' });
    return;
  }

  db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [user_id],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ count: row?.count || 0 });
    }
  );
};

exports.markAsRead = (req, res) => {
  const { id } = req.params;

  db.get('SELECT user_id FROM notifications WHERE id = ?', [id], (err, notification) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    if (!canAccessUserNotifications(req, notification.user_id)) {
      res.status(403).json({ error: 'Forbidden: cannot update other users\' notifications' });
      return;
    }

    db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id], (updateErr) => {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }
      res.json({ message: 'Notification marked as read' });
    });
  });
};

exports.markAllAsRead = (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }
  if (!canAccessUserNotifications(req, user_id)) {
    res.status(403).json({ error: 'Forbidden: cannot update other users\' notifications' });
    return;
  }

  db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user_id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'All notifications marked as read', updated: this.changes });
  });
};
