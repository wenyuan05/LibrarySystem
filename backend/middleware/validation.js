// 登录请求体验证中间件
exports.validateLoginBody = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  next();
};

// 注册请求体验证中间件
exports.validateRegisterBody = (req, res, next) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name || !email) {
    res.status(400).json({ error: 'Username, password, name and email are required' });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  next();
};

// 书籍请求体验证中间件
exports.validateBookBody = (req, res, next) => {
  const { title, author, isbn } = req.body;
  if (!title || !author || !isbn) {
    res.status(400).json({ error: 'Title, author and ISBN are required' });
    return;
  }
  if (title.length < 1 || title.length > 100) {
    res.status(400).json({ error: 'Title must be between 1 and 100 characters' });
    return;
  }
  if (author.length < 1 || author.length > 50) {
    res.status(400).json({ error: 'Author must be between 1 and 50 characters' });
    return;
  }
  const isbnRegex = /^\d{10}(?:\d{3})?$/;
  if (!isbnRegex.test(isbn)) {
    res.status(400).json({ error: 'ISBN must be 10 or 13 digits' });
    return;
  }
  next();
};

// 书籍部分更新验证中间件
exports.validateBookUpdateBody = (req, res, next) => {
  const { title, author, isbn, status } = req.body;
  
  // 验证title字段
  if (title !== undefined) {
    if (typeof title !== 'string') {
      res.status(400).json({ error: 'Title must be a string' });
      return;
    }
    if (title.length < 1 || title.length > 100) {
      res.status(400).json({ error: 'Title must be between 1 and 100 characters' });
      return;
    }
  }
  
  // 验证author字段
  if (author !== undefined) {
    if (typeof author !== 'string') {
      res.status(400).json({ error: 'Author must be a string' });
      return;
    }
    if (author.length < 1 || author.length > 50) {
      res.status(400).json({ error: 'Author must be between 1 and 50 characters' });
      return;
    }
  }
  
  // 验证isbn字段
  if (isbn !== undefined) {
    if (typeof isbn !== 'string') {
      res.status(400).json({ error: 'ISBN must be a string' });
      return;
    }
    const isbnRegex = /^\d{10}(?:\d{3})?$/;
    if (!isbnRegex.test(isbn)) {
      res.status(400).json({ error: 'ISBN must be 10 or 13 digits' });
      return;
    }
  }
  
  // 验证status字段（白名单）
  if (status !== undefined) {
    if (typeof status !== 'string') {
      res.status(400).json({ error: 'Status must be a string' });
      return;
    }
    if (!['available', 'borrowed'].includes(status)) {
      res.status(400).json({ error: 'Status must be either "available" or "borrowed"' });
      return;
    }
  }
  
  next();
};

// 管理员添加用户请求体验证中间件
exports.validateAdminAddUserBody = (req, res, next) => {
  const { username, password, role, name, email } = req.body;
  if (!username || !password || !role || !name || !email) {
    res.status(400).json({ error: 'Username, password, role, name and email are required' });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  // 严格验证role字段，只允许'user'或'admin'
  if (!['user', 'admin', 'librarian'].includes(role)) {
    res.status(400).json({ error: 'Role must be either "user", "admin", or "librarian"' });
    return;
  }
  next();
};