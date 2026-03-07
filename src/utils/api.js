// API基础URL
const API_BASE_URL = 'http://localhost:3001/api';

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
    return request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // 用户注册
  register: async ({ username, password, name, email }) => {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, email }),
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
  
  // 更新书籍状态
  updateStatus: async (id, status) => {
    return request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  
  // 删除书籍
  delete: async (id) => {
    return request(`/books/${id}`, {
      method: 'DELETE',
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
};

// 借阅相关API
export const borrowAPI = {
  // 借阅书籍
  borrow: async (userId, bookId) => {
    return request('/borrow', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, book_id: bookId }),
    });
  },
  
  // 归还书籍
  return: async (userId, bookId) => {
    return request('/return', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, book_id: bookId }),
    });
  },
};

export default {
  auth: authAPI,
  books: booksAPI,
  users: usersAPI,
  borrow: borrowAPI,
};