# 图书馆管理系统 - Release1

## 项目概述

图书馆管理系统是一个基于React和Node.js的Web应用，用于管理图书馆的书籍信息，包括添加、查询、借阅和归还书籍等功能。系统支持用户认证、多角色权限管理、个人借阅记录查询等功能。

## Release1 特性

### 包含的功能

#### 前端功能
1. **用户认证**：登录界面，支持管理员、图书管理员和普通读者登录
2. **侧边栏**：折叠式侧边栏，显示用户个人信息和导航菜单
   - 根据用户角色显示不同的导航选项
   - 普通读者：Books、My Borrows
   - 图书管理员：Book Management、User Management、Borrow Records、Return Approval
   - 管理员：所有功能
3. **前端路由**：使用 React Router 实现多页面路由，包括：
   - `/login` - 登录页面
   - `/` - 首页（书籍列表）
   - `/books` - 书籍列表
   - `/books/:id` - 书籍详情
   - `/borrow-records` - 个人借阅记录
   - `/user-borrow-records/:userId` - 用户借阅记录管理（管理员/图书管理员）
   - `/book-management` - 书籍管理（管理员/图书管理员）
   - `/users` - 用户管理（管理员/图书管理员）
4. **书籍管理**：
   - 书籍列表展示
   - 搜索功能（支持按标题、作者、ISBN搜索）
   - 点击书籍查看详情
   - 借阅和归还书籍
5. **书籍管理专门板块**（管理员/图书管理员）：
   - 添加新书籍（包含ISBN格式验证和重复检查）
6. **书籍详情页**：
   - 显示书籍详细信息
   - 显示所有副本信息（ID和状态）
   - 借阅流程：点击借阅按钮后书籍状态变为borrowing，显示一小时倒计时，按钮变为confirm borrowing，点击确认后弹出确认界面，显示用户账户和书籍具体副本ID，提供下拉菜单选择副本（默认填充可用副本），用户点击确认后书籍正式借出
7. **用户管理**：
   - 用户列表展示（管理员/图书管理员）
   - 添加新用户（包含用户名重复检查和表单验证）
   - 编辑用户信息
   - 搜索功能（支持按用户名、姓名、邮箱搜索）
   - 查看用户借阅记录（管理员/图书管理员）
8. **借阅记录**：
   - 个人借阅记录查询
   - 借阅历史查看
   - 管理员/图书管理员查看和管理用户借阅记录
   - 管理员/图书管理员手动归还书籍
9. **消息通知**：使用全局 toast 组件显示成功/失败消息，通过 ToastContext 管理全局消息状态
10. **加载状态**：使用 SkeletonLoader 组件显示加载状态
11. **数据验证**：
    - 表单字段验证
    - 数据格式检查
    - 重复数据提示
12. **安全性**：
    - 前端输入验证
    - 密码强度检查
    - 实时错误提示
    - 权限控制展示
    - 受保护路由，未登录用户自动跳转到登录页
    - 管理员/图书管理员用户访问普通用户路径时自动重定向到管理员页面

#### 后端功能
1. **数据库初始化**：自动创建SQLite数据库和表结构，并插入示例数据
2. **API接口**：提供完整的CRUD操作接口，用于前端与数据库交互
3. **用户认证**：验证用户登录信息，使用JWT进行身份验证
4. **借阅管理**：处理书籍借阅和归还逻辑，更新书籍状态和借阅记录
   - 借阅流程：支持借阅请求、确认借阅、超时处理
   - 图书管理员审批归还
5. **书籍副本管理**：
   - 为每本书创建多个副本
   - 管理副本状态（available/borrowing/borrowed）
   - 支持副本级别的借阅操作
6. **用户管理**：处理用户信息的增删改查
7. **数据去重**：
   - 书籍ISBN唯一检查
   - 用户名唯一检查
   - 数据库唯一索引约束
8. **数据验证**：
   - API请求参数验证
   - 数据完整性检查
   - 错误处理和提示
9. **安全性**：
   - 密码加密存储（使用bcrypt）
   - JWT token认证
   - 中间件权限控制
   - 输入验证中间件
   - 防SQL注入保护
   - 严格的角色验证（支持'user'、'librarian'和'admin'）

### 不包含的功能（将在后续版本中提供）

#### Release2 功能
- 书籍预约功能
- 借阅记录续借功能
- 用户密码重置功能
- 用户拉黑/解封功能
- 图书编辑和删除功能
- 忘记密码功能

#### Release3 功能
- 公告管理功能
- 个人资料管理功能
- 书籍按分类显示功能
- 统计分析功能
- 系统日志功能
- 系统设置功能

## 技术栈

- **前端**：React 19 (via Vite)
- **后端**：Node.js + Express 5
- **数据库**：SQLite
- **通信**：REST API
- **状态管理**：React Context API
- **路由**：React Router 7
- **动画**：Framer Motion

## 项目结构

```
Release1/
├── src/                # 前端源代码
│   ├── components/     # 组件目录
│   │   ├── Books/      # 书籍管理组件
│   │   ├── Borrow/     # 借阅记录组件
│   │   ├── Login/      # 登录组件
│   │   ├── Sidebar/    # 侧边栏组件
│   │   ├── Toast/      # 消息通知组件
│   │   ├── Users/      # 用户管理组件
│   │   ├── layout/     # 布局组件
│   │   └── ProtectedRoute.jsx     # 受保护路由
│   ├── context/        # 上下文管理
│   ├── hooks/          # 自定义钩子
│   ├── pages/          # 页面组件
│   ├── styles/         # 样式文件
│   ├── utils/          # 工具函数
│   ├── config/         # 配置文件
│   ├── App.jsx         # 主应用组件
│   ├── App.css         # 应用样式
│   ├── main.jsx        # 应用入口
│   ├── index.css       # 全局基础样式
│   └── assets/         # 静态资源
├── backend/            # 后端代码
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── routes/         # 路由
│   ├── server.js       # 后端服务器
│   ├── db.js           # 数据库初始化
│   ├── package.json    # 后端依赖
│   ├── package-lock.json # 后端依赖锁文件
│   ├── .env.example    # 后端环境变量示例
│   └── library.db      # SQLite数据库文件
├── public/             # 公共静态资源
├── package.json        # 前端依赖
├── package-lock.json   # 前端依赖锁文件
├── vite.config.js      # Vite配置
├── .env.example        # 前端环境变量示例
├── .gitignore          # Git忽略文件
├── release1log.md      # Release1修改日志
├── index.html          # 前端入口HTML
└── README.md           # 项目文档
```

## 安装步骤

### 1. 克隆项目

```bash
git clone <项目地址>
cd LibrarySystem/Release1
```

### 2. 安装前端依赖

```bash
npm install
```

### 3. 安装后端依赖

```bash
cd backend
npm install
```

### 4. 配置环境变量

1. **复制环境变量示例文件**：
   - 将 `.env.example` 复制为 `.env`
   - 将 `backend/.env.example` 复制为 `backend/.env`

2. **配置环境变量**：
   - 编辑 `.env` 文件，设置适当的值
   - 编辑 `backend/.env` 文件，确保与根目录的 `.env` 文件中的 JWT_SECRET 一致

**根目录 .env 文件示例**：

```env
# API Configuration
VITE_API_BASE_URL=/api
FRONTEND_URL=

# JWT Configuration
JWT_SECRET=your-secret-key-here
```

**backend 目录 .env 文件示例**：

```env
# API Configuration
FRONTEND_URL=

# JWT Configuration
JWT_SECRET=your-secret-key-here
```

**重要安全注意事项**：
- 不要将 `.env` 文件提交到版本控制系统中
- 使用强随机生成的 JWT_SECRET，特别是在生产环境中
- 定期旋转 JWT_SECRET 以增强安全性
- 确保 `.env` 文件的权限设置为只有所有者可以读取

## 运行方法

### 1. 启动后端服务器

```bash
# 在backend目录中
npm start
```

后端服务器将在 http://localhost:3001 上运行

### 2. 启动前端开发服务器

```bash
# 在Release1目录中
npm run dev
```

前端应用将在 http://localhost:5173 上运行

## 示例数据

系统初始化时会自动添加以下示例数据：

### 书籍
1. **The Great Gatsby** - F. Scott Fitzgerald (ISBN: 9780743273565)
2. **1984** - George Orwell (ISBN: 9780451524935)
3. **To Kill a Mockingbird** - Harper Lee (ISBN: 9780061120084)

### 用户
1. **管理员**：用户名 admin，密码 admin123
2. **图书管理员**：用户名 librarian，密码 librarian123
3. **普通读者**：用户名 user1，密码 user123

## 注意事项

1. 确保后端服务器和前端开发服务器都已启动
2. 数据库文件会自动创建在backend目录中
3. 系统使用SQLite数据库，无需额外配置数据库服务
4. 前端应用默认连接到http://localhost:3002的后端API
5. 登录信息会存储在本地存储中，刷新页面后仍然保持登录状态
6. 数据唯一性保障：
   - 书籍ISBN必须唯一
   - 用户名必须唯一
   - 系统会在前端和后端双重验证数据唯一性
7. 数据验证：
   - 表单提交前会进行前端验证
   - API请求会进行后端验证
   - 数据库层面有唯一约束保护

## 后续版本计划

- **Release2**：添加预约、续借、密码重置、用户拉黑/解封、图书编辑和删除、忘记密码等功能
- **Release3**：添加公告管理、个人资料管理、书籍按分类显示、统计分析、系统日志、系统设置等功能

## 许可证

MIT License