const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { getAlipayConfig, getSafeAlipayConfig, validateAlipayConfig } = require('./config/alipayConfig');
const { getEmailConfig, getSafeEmailConfig, validateEmailConfig } = require('./config/emailConfig');

console.log('Starting server...');

// 引入数据库
try {
  const db = require('./db');
  console.log('Database module loaded successfully');
} catch (error) {
  console.error('Error loading database module:', error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// 检查 JWT_SECRET 是否设置
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET environment variable not set. Using a temporary secret for development only.');
  console.warn('⚠️  This is insecure for production environments.');
  // 仅在开发环境中使用默认值
  process.env.JWT_SECRET = 'dev-secret';
}

const alipayConfig = getAlipayConfig();
const missingAlipayConfig = validateAlipayConfig(alipayConfig);
console.log('Alipay configuration:', getSafeAlipayConfig(alipayConfig));
if (missingAlipayConfig.length > 0) {
  console.warn(`⚠️  Alipay is enabled but missing required configuration: ${missingAlipayConfig.join(', ')}`);
}
const emailConfig = getEmailConfig();
const missingEmailConfig = validateEmailConfig(emailConfig);
console.log('Email configuration:', getSafeEmailConfig(emailConfig));
if (missingEmailConfig.length > 0) {
  console.warn(`⚠️  Email SMTP is enabled but missing required configuration: ${missingEmailConfig.join(', ')}`);
}

// 中间件
const frontendUrl = process.env.FRONTEND_URL || '*';
const allowedOrigins = frontendUrl
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (frontendUrl === '*' || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: frontendUrl !== '*'
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 引入路由
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const systemRoutes = require('./routes/systemRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const statsRoutes = require('./routes/statsRoutes');
const logRoutes = require('./routes/logRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// 统一错误处理中间件
app.use(errorHandler);

// 启动服务器
try {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}

