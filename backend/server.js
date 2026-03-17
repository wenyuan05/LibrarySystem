const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = 3001;

// 检查 JWT_SECRET 是否设置
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET environment variable not set. Using a temporary secret for development only.');
  console.warn('⚠️  This is insecure for production environments.');
  // 仅在开发环境中使用默认值
  process.env.JWT_SECRET = 'dev-secret';
}

// 中间件
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// 引入路由
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const systemRoutes = require('./routes/systemRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const statsRoutes = require('./routes/statsRoutes');
const logRoutes = require('./routes/logRoutes');

// 引入错误处理中间件
const { errorHandler } = require('./middleware/error');

// 注册路由
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 统一错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});