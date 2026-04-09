// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 从本地存储读取 token
const getAuthToken = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    const parsed = JSON.parse(storedUser);
    return parsed.token || null;
  } catch (e) {
    console.error('Failed to read auth token from localStorage', e);
    return null;
  }
};

// 通用请求函数
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = getAuthToken();
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// 认证相关API
export const authAPI = {
  // 用户登录
  login: async (username, password) => {
    return request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // 用户注册
  register: async ({ username, password, name, email }) => {
    return request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, email }),
    });
  },

  // 请求密码重置
  requestPasswordReset: async (resetData) => {
    return request('/users/reset-password/request', {
      method: 'POST',
      body: JSON.stringify(resetData),
    });
  },

  // 重置密码
  resetPassword: async (token, newPassword) => {
    return request('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

// 书籍相关API
export const booksAPI = {
  // 获取所有书籍
  getAll: async () => {
    return request('/books');
  },
  
  // 获取单本书籍
  getById: async (id) => {
    return request(`/books/${id}`);
  },
  
  // 添加书籍
  add: async (book) => {
    return request('/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  },
  

  
  // 更新书籍信息
  update: async (id, bookData) => {
    return request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  },
  
  // 删除书籍
  delete: async (id) => {
    return request(`/books/${id}`, {
      method: 'DELETE',
    });
  },
  
  // 搜索书籍
  search: async (query, category) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    return request(`/books/search?${params.toString()}`);
  },
  
  // 获取热门书籍
  getPopular: async (limit = 10) => {
    return request(`/books/popular?limit=${limit}`);
  },
  
  // 导出书籍到CSV
  export: async () => {
    return request('/books/export', {
      responseType: 'blob'
    });
  },
  
  // 获取书籍的所有副本
  getCopies: async (bookId) => {
    return request(`/books/${bookId}/copies`);
  },
  
  // 获取单个副本信息
  getCopyById: async (copyId) => {
    return request(`/books/copies/${copyId}`);
  },
  
  // 更新副本状态
  updateCopyStatus: async (copyId, status) => {
    return request(`/books/copies/${copyId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // 更新副本位置
  updateCopyLocation: async (copyId, location) => {
    return request(`/books/copies/${copyId}/location`, {
      method: 'PUT',
      body: JSON.stringify({ location }),
    });
  },
};

// 用户相关API
export const usersAPI = {
  // 获取所有用户
  getAll: async () => {
    return request('/users');
  },
  
  // 获取单个用户
  getById: async (id) => {
    return request(`/users/${id}`);
  },
  
  // 添加用户
  add: async (user) => {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
  
  // 更新用户信息
  update: async (id, userData) => {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  // 删除用户
  delete: async (id) => {
    return request(`/users/${id}`, {
      method: 'DELETE',
    });
  },
  
  // 获取用户借阅记录
  getBorrowRecords: async (userId) => {
    return request(`/users/${userId}/borrow-records`);
  },
  
  // 拉黑用户
  block: async (userId) => {
    return request(`/users/${userId}/block`, {
      method: 'POST',
    });
  },
  
  // 解除拉黑用户
  unblock: async (userId) => {
    return request(`/users/${userId}/unblock`, {
      method: 'POST',
    });
  },
};

// 借阅相关API
export const borrowAPI = {
  // 借阅书籍
  borrow: async (userId, bookId) => {
    return request('/borrow/borrow', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, book_id: bookId }),
    });
  },
  
  // 归还书籍
  return: async (userId, bookId) => {
    return request('/borrow/return', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, book_id: bookId }),
    });
  },
  
  // 获取借阅中列表
  getBorrowingList: async (userId) => {
    return request(`/borrow/borrowing${userId ? `?user_id=${userId}` : ''}`);
  },
  
  // 预约图书
  reserve: async (userId, bookId) => {
    return request('/borrow/reserve', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, book_id: bookId }),
    });
  },
  
  // 获取用户预约记录
  getReservations: async (userId) => {
    return request(`/borrow/reservations/${userId}`);
  },
  
  // 续借图书
  renew: async (userId, bookId) => {
    return request('/borrow/renew', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, book_id: bookId }),
    });
  },
  
  // 取消预约
  cancelReservation: async (reservationId) => {
    return request('/borrow/cancel-reservation', {
      method: 'POST',
      body: JSON.stringify({ reservation_id: reservationId }),
    });
  },
  
  // 审批归还请求
  approveReturn: async (recordId) => {
    return request('/borrow/approve-return', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId }),
    });
  },
  
  // 获取待审批的归还请求列表
  getReturningList: async () => {
    return request('/borrow/returning');
  },
  
  // 确认借阅
  confirmBorrow: async (recordId, copyId) => {
    return request('/borrow/confirm-borrow', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, copy_id: copyId }),
    });
  },
  
  // 处理超时借阅
  handleTimeout: async () => {
    return request('/borrow/handle-timeout', {
      method: 'POST',
    });
  },
};

// 系统相关API
export const systemAPI = {
  // 获取系统设置
  getSettings: async () => {
    return request('/system/settings');
  },
  
  // 更新系统设置
  updateSettings: async (settings) => {
    return request('/system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// 公告相关API
export const announcementAPI = {
  // 获取所有公告
  getAll: async () => {
    return request('/announcements');
  },
  
  // 获取单个公告
  getById: async (id) => {
    return request(`/announcements/${id}`);
  },
  
  // 创建公告
  create: async (announcement) => {
    return request('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcement),
    });
  },
  
  // 更新公告
  update: async (id, announcement) => {
    return request(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(announcement),
    });
  },
  
  // 删除公告
  delete: async (id) => {
    return request(`/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};

// 分类相关API
export const categoryAPI = {
  // 获取所有分类
  getAll: async () => {
    return request('/categories');
  },
  
  // 获取单个分类
  getById: async (id) => {
    return request(`/categories/${id}`);
  },
  
  // 创建分类
  create: async (category) => {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },
  
  // 更新分类
  update: async (id, category) => {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },
  
  // 删除分类
  delete: async (id) => {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
  
  // 获取图书的分类
  getBookCategories: async (bookId) => {
    return request(`/categories/book/${bookId}`);
  },
  
  // 为图书添加分类
  addBookCategory: async (bookId, categoryId) => {
    return request(`/categories/book/${bookId}`, {
      method: 'POST',
      body: JSON.stringify({ categoryId }),
    });
  },
  
  // 从图书中移除分类
  removeBookCategory: async (bookId, categoryId) => {
    return request(`/categories/book/${bookId}/${categoryId}`, {
      method: 'DELETE',
    });
  },
};

// 统计相关API
export const statsAPI = {
  // 获取借阅业务统计数据
  getBorrowStats: async () => {
    return request('/stats/borrow-stats');
  },
  
  // 获取月度借阅统计
  getMonthlyStats: async (year) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    return request(`/stats/monthly-stats?${params.toString()}`);
  },
  
  // 获取热门图书统计
  getPopularBooksStats: async (limit = 10) => {
    return request(`/stats/popular-books?limit=${limit}`);
  },
};

// 日志相关API
export const logAPI = {
  // 获取系统日志
  getLogs: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.offset) searchParams.append('offset', params.offset);
    if (params.level) searchParams.append('level', params.level);
    if (params.module) searchParams.append('module', params.module);
    return request(`/logs?${searchParams.toString()}`);
  },
  
  // 清除系统日志
  clearLogs: async (days) => {
    return request('/logs/clear', {
      method: 'DELETE',
      body: JSON.stringify({ days }),
    });
  },
};

export default {
  auth: authAPI,
  books: booksAPI,
  users: usersAPI,
  borrow: borrowAPI,
  system: systemAPI,
  announcement: announcementAPI,
  category: categoryAPI,
  stats: statsAPI,
  log: logAPI,
};