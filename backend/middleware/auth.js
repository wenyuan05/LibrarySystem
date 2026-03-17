const jwt = require('jsonwebtoken');

// 解析并验证 JWT 的中间件
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ error: 'Authorization token is required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = { id: payload.id, role: payload.role, username: payload.username };
    next();
  });
};

// 角色控制中间件
exports.requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    return;
  }
  
  const hasRequiredRole = Array.isArray(role) 
    ? role.includes(req.user.role) 
    : req.user.role === role;
  
  if (!hasRequiredRole) {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    return;
  }
  
  next();
};

// 检查是否是用户本人或管理员
exports.requireOwnershipOrAdmin = (req, res, next) => {
  const { id } = req.params;
  if (Number(id) !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    return;
  }
  next();
};