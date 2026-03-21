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
  const { title, author, isbn } = req.body;
  
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
  
  next();
};

// 管理员添加用户请求体验证中间件
exports.validateAdminAddUserBody = (req, res, next) => {
  const { username, password, role, name, email } = req.body;
  if (!username || !password || !role || !name || !email) {
    res.status(400).json({ error: 'Username, password, role, name and email are required' });
    return;
  }
  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || !emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  // 严格验证role字段，只允许'user'或'admin'
  if (typeof role !== 'string' || !['user', 'admin', 'librarian'].includes(role)) {
    res.status(400).json({ error: 'Role must be either "user", "admin", or "librarian"' });
    return;
  }
  next();
};

// 借阅书籍请求体验证中间件
exports.validateBorrowBody = (req, res, next) => {
  const { user_id, book_id } = req.body;
  if (!user_id || !book_id) {
    res.status(400).json({ error: 'User ID and book ID are required' });
    return;
  }
  if (typeof user_id !== 'number' || user_id <= 0) {
    res.status(400).json({ error: 'User ID must be a positive number' });
    return;
  }
  if (typeof book_id !== 'number' || book_id <= 0) {
    res.status(400).json({ error: 'Book ID must be a positive number' });
    return;
  }
  next();
};

// 归还书籍请求体验证中间件
exports.validateReturnBody = (req, res, next) => {
  const { user_id, book_id } = req.body;
  if (!user_id || !book_id) {
    res.status(400).json({ error: 'User ID and book ID are required' });
    return;
  }
  if (typeof user_id !== 'number' || user_id <= 0) {
    res.status(400).json({ error: 'User ID must be a positive number' });
    return;
  }
  if (typeof book_id !== 'number' || book_id <= 0) {
    res.status(400).json({ error: 'Book ID must be a positive number' });
    return;
  }
  next();
};

// 确认借阅请求体验证中间件
exports.validateConfirmBorrowBody = (req, res, next) => {
  const { record_id, copy_id } = req.body;
  if (!record_id) {
    res.status(400).json({ error: 'Record ID is required' });
    return;
  }
  if (typeof record_id !== 'number' || record_id <= 0) {
    res.status(400).json({ error: 'Record ID must be a positive number' });
    return;
  }
  if (copy_id && (typeof copy_id !== 'number' || copy_id <= 0)) {
    res.status(400).json({ error: 'Copy ID must be a positive number' });
    return;
  }
  next();
};

// 审批归还请求体验证中间件
exports.validateApproveReturnBody = (req, res, next) => {
  const { record_id } = req.body;
  if (!record_id) {
    res.status(400).json({ error: 'Record ID is required' });
    return;
  }
  if (typeof record_id !== 'number' || record_id <= 0) {
    res.status(400).json({ error: 'Record ID must be a positive number' });
    return;
  }
  next();
};

// 预约书籍请求体验证中间件
exports.validateReserveBody = (req, res, next) => {
  const { user_id, book_id } = req.body;
  if (!user_id || !book_id) {
    res.status(400).json({ error: 'User ID and book ID are required' });
    return;
  }
  if (typeof user_id !== 'number' || user_id <= 0) {
    res.status(400).json({ error: 'User ID must be a positive number' });
    return;
  }
  if (typeof book_id !== 'number' || book_id <= 0) {
    res.status(400).json({ error: 'Book ID must be a positive number' });
    return;
  }
  next();
};

// 取消预约请求体验证中间件
exports.validateCancelReservationBody = (req, res, next) => {
  const { reservation_id } = req.body;
  if (!reservation_id) {
    res.status(400).json({ error: 'Reservation ID is required' });
    return;
  }
  if (typeof reservation_id !== 'number' || reservation_id <= 0) {
    res.status(400).json({ error: 'Reservation ID must be a positive number' });
    return;
  }
  next();
};

// 续借书籍请求体验证中间件
exports.validateRenewBody = (req, res, next) => {
  const { user_id, book_id } = req.body;
  if (!user_id || !book_id) {
    res.status(400).json({ error: 'User ID and book ID are required' });
    return;
  }
  if (typeof user_id !== 'number' || user_id <= 0) {
    res.status(400).json({ error: 'User ID must be a positive number' });
    return;
  }
  if (typeof book_id !== 'number' || book_id <= 0) {
    res.status(400).json({ error: 'Book ID must be a positive number' });
    return;
  }
  next();
};

// 密码重置请求体验证中间件
exports.validatePasswordResetRequest = (req, res, next) => {
  const { email, phone } = req.body;
  if (!email && !phone) {
    res.status(400).json({ error: 'Email or phone is required' });
    return;
  }
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }
  }
  next();
};

// 密码重置体验证中间件
exports.validatePasswordReset = (req, res, next) => {
  const { token, newPassword } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }
  if (!newPassword) {
    res.status(400).json({ error: 'New password is required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }
  next();
};