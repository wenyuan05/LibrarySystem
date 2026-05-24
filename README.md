# 图书馆管理系统开发文档

## 项目概述

图书馆管理系统是一个基于React和Node.js的Web应用，用于管理图书馆的书籍信息，包括添加、查询、借阅和归还书籍等功能。系统支持用户认证、多角色权限管理、个人借阅记录查询等功能。

## 技术栈

- **前端**：React 19 (via Vite)
- **后端**：Node.js + Express 5
- **数据库**：SQLite
- **通信**：REST API
- **状态管理**：React Context API
- **路由**：React Router 7
- **动画**：Framer Motion
- **条形码**：JsBarcode
- **开发模式**：Agile-style development (Vibe-Coding)

## 项目结构

```
LibrarySystem/
├── src/                # 前端源代码
│   ├── components/     # 组件目录
│   │   ├── Books/      # 书籍管理组件
│   │   │   ├── BookList.jsx      # 书籍列表
│   │   │   ├── AddBookForm.jsx    # 添加书籍表单
│   │   │   ├── EditBookForm.jsx   # 编辑书籍表单
│   │   │   ├── BookDetail.jsx     # 书籍详情页
│   │   │   ├── SkeletonLoader.jsx # 加载骨架屏
│   │   │   └── Books.css          # 书籍组件样式
│   │   ├── Borrow/     # 借阅记录组件
│   │   │   ├── BorrowRecords.jsx  # 借阅记录
│   │   │   ├── UserBorrowRecords.jsx  # 用户借阅记录
│   │   │   └── Borrow.css         # 借阅组件样式
│   │   ├── Login/      # 登录组件
│   │   │   ├── Login.jsx          # 登录表单
│   │   │   └── Login.css          # 登录组件样式
│   │   ├── Sidebar/    # 侧边栏组件
│   │   │   ├── Sidebar.jsx        # 侧边栏
│   │   │   └── Sidebar.css        # 侧边栏样式
│   │   ├── Toast/      # 消息通知组件
│   │   │   ├── Toast.jsx          # 消息通知
│   │   │   └── Toast.css          # 消息通知样式
│   │   ├── Users/      # 用户管理组件
│   │   │   ├── UserList.jsx       # 用户列表
│   │   │   ├── AddUserForm.jsx    # 添加用户表单
│   │   │   ├── EditUserForm.jsx   # 编辑用户表单
│   │   │   └── Users.css          # 用户组件样式
│   │   ├── layout/     # 布局组件
│   │   │   └── MainLayout.jsx     # 主布局
│   │   └── ProtectedRoute.jsx     # 受保护路由
│   ├── context/        # 上下文管理
│   │   ├── AuthContext.jsx        # 认证上下文
│   │   └── ToastContext.jsx       # 消息通知上下文
│   ├── hooks/          # 自定义钩子
│   │   └── useApiRequest.jsx  # API请求处理钩子
│   ├── pages/          # 页面组件
│   │   ├── AnnouncementManagementPage.jsx  # 公告管理页面
│   │   ├── AnnouncementManagementPage.css  # 公告管理样式
│   │   ├── AnnouncementsPage.jsx           # 公告页面
│   │   ├── BookDetailsPage.jsx             # 书籍详情页面
│   │   ├── BookManagementPage.jsx          # 书籍管理页面
│   │   ├── BooksPage.jsx                   # 书籍列表页面
│   │   ├── BorrowRecordsPage.jsx           # 借阅记录页面
│   │   ├── CategoryManagementPage.jsx      # 分类管理页面
│   │   ├── LogsPage.jsx                    # 日志页面
│   │   ├── NotificationsPage.jsx           # 站内通知页面
│   │   ├── NotificationsPage.css           # 站内通知样式
│   │   ├── ProfilePage.jsx                 # 个人资料页面
│   │   ├── ReservationsPage.jsx            # 预约页面
│   │   ├── ReturnApprovalPage.jsx          # 归还审批页面
│   │   ├── StatsPage.jsx                   # 统计页面
│   │   ├── SystemSettingsPage.jsx          # 系统设置页面
│   │   └── UserManagementPage.jsx          # 用户管理页面
│   ├── styles/         # 样式文件
│   │   ├── global.css  # 全局样式
│   │   └── variables.css  # CSS变量
│   ├── utils/          # 工具函数
│   │   └── api.js      # API调用封装
│   ├── config/         # 配置文件
│   │   └── privacy.js  # 隐私配置
│   ├── App.jsx         # 主应用组件
│   ├── App.css         # 应用样式
│   ├── main.jsx        # 应用入口
│   ├── index.css       # 全局基础样式
│   └── assets/         # 静态资源
│       └── react.svg   # React图标
├── backend/            # 后端代码
│   ├── controllers/    # 控制器
│   │   ├── announcementController.js  # 公告控制器
│   │   ├── notificationController.js  # 站内通知控制器
│   │   ├── bookController.js          # 书籍控制器
│   │   ├── borrowController.js        # 借阅控制器
│   │   ├── categoryController.js      # 分类控制器
│   │   ├── logController.js           # 日志控制器
│   │   ├── statsController.js         # 统计控制器
│   │   ├── systemController.js        # 系统控制器
│   │   └── userController.js          # 用户控制器
│   ├── middleware/     # 中间件
│   │   ├── auth.js     # 认证中间件
│   │   ├── error.js    # 错误处理中间件
│   │   └── validation.js  # 验证中间件
│   ├── routes/         # 路由
│   │   ├── announcementRoutes.js  # 公告路由
│   │   ├── notificationRoutes.js  # 站内通知路由
│   │   ├── bookRoutes.js          # 书籍路由
│   │   ├── borrowRoutes.js        # 借阅路由
│   │   ├── categoryRoutes.js      # 分类路由
│   │   ├── logRoutes.js           # 日志路由
│   │   ├── statsRoutes.js         # 统计路由
│   │   ├── systemRoutes.js        # 系统路由
│   │   └── userRoutes.js          # 用户路由
│   ├── config/        # 后端运行配置
│   │   └── alipayConfig.js        # 支付宝沙箱/生产配置
│   ├── server.js       # 后端服务器
│   ├── db.js           # 数据库初始化
│   ├── check_borrow_records.js  # 借阅记录检查工具
│   ├── check_db.js     # 数据库检查工具
│   ├── check_indexes.js # 索引检查工具
│   ├── cleanup.js      # 数据清理工具
│   ├── clear_borrowed_records.js # 清理借阅记录工具
│   ├── fix_all_borrow_records.js # 修复所有借阅记录工具
│   ├── fix_book_status.js # 书籍状态修复工具
│   ├── fix_borrow_records.js # 修复借阅记录工具
│   ├── fix_borrow_records_direct.js # 直接修复借阅记录工具
│   ├── update_book_data.js # 书籍数据更新工具
│   ├── package.json    # 后端依赖
│   ├── package-lock.json # 后端依赖锁文件
│   ├── .env.example    # 后端环境变量示例
│   └── library.db      # SQLite数据库文件
├── public/             # 公共静态资源
│   └── vite.svg        # Vite图标
├── package.json        # 前端依赖
├── package-lock.json   # 前端依赖锁文件
├── vite.config.js      # Vite配置
├── .env.example        # 前端环境变量示例
├── .gitignore          # Git忽略文件
├── BUGFIX_LOG.md       # bug修复日志
├── TEST_CASES.md       # 测试用例
├── eslint.config.js    # ESLint配置
├── git-github-guide.md # Git和GitHub使用指南
├── index.html          # 前端入口HTML
└── README.md           # 项目文档
```

## 安装步骤

### 1. 克隆项目

```bash
git clone <项目地址>
cd LibrarySystem
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

# Alipay sandbox payment configuration
ALIPAY_ENABLED=false
ALIPAY_MODE=sandbox
ALIPAY_APP_ID=your_sandbox_app_id
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_app_private_key\n-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nyour_alipay_public_key\n-----END PUBLIC KEY-----"
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_NOTIFY_URL=http://localhost:3001/api/payments/alipay/notify
ALIPAY_RETURN_URL=http://localhost:5173/payment-result
ALIPAY_SIGN_TYPE=RSA2
ALIPAY_CHARSET=utf-8
ALIPAY_FORMAT=json
ALIPAY_TIMEOUT_MS=10000
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

**环境变量说明**：
- `VITE_API_BASE_URL`：后端 API 的基础 URL
- `FRONTEND_URL`：前端应用的 URL，用于 CORS 配置
- `JWT_SECRET`：用于生成和验证 JWT token 的密钥
- `ALIPAY_ENABLED`：是否启用支付宝支付配置校验；沙箱调试时设为 `true`
- `ALIPAY_MODE`：支付宝模式，支持 `sandbox` 和 `production`，默认 `sandbox`
- `ALIPAY_APP_ID`：支付宝开放平台应用 ID，需要由你从沙箱应用提供
- `ALIPAY_PRIVATE_KEY`：应用私钥，只能保存在 `backend/.env` 后端环境变量中
- `ALIPAY_PUBLIC_KEY`：支付宝公钥，用于后续回调验签
- `ALIPAY_NOTIFY_URL`：支付宝异步通知地址；本地模拟配置为 `http://localhost:3001/api/payments/alipay/notify`，真实沙箱回调测试需要换成公网或内网穿透地址
- `ALIPAY_RETURN_URL`：支付完成后的前端返回地址；本地测试默认 `http://localhost:5173/payment-result`
- `ALIPAY_GATEWAY`：支付宝网关；沙箱默认 `https://openapi-sandbox.dl.alipaydev.com/gateway.do`
- `ALIPAY_SIGN_TYPE` / `ALIPAY_CHARSET` / `ALIPAY_FORMAT` / `ALIPAY_TIMEOUT_MS`：支付宝请求签名、编码、格式和超时配置

## 运行方法

### 1. 启动后端服务器

```bash
# 在backend目录中
npm start
```

后端服务器将在 http://localhost:3001 上运行

### 2. 启动前端开发服务器

```bash
# 在根目录中
npm run dev
```

前端应用将在 http://localhost:5173 上运行

## 部署指南

### 云服务器部署

#### 1. 环境准备

1. **安装 Node.js**：确保服务器上安装了 Node.js 20.0.0 或更高版本
2. **安装 Nginx**：用于反向代理和静态文件服务
3. **安装 PM2**：用于管理后端服务

#### 2. 部署步骤

1. **克隆项目**：
   ```bash
   git clone <项目地址>
   cd LibrarySystem
   ```

2. **安装依赖**：
   ```bash
   # 前端依赖
   npm install
   
   # 后端依赖
   cd backend
   npm install
   cd ..
   ```

3. **配置环境变量**：
   - 复制环境变量示例文件并配置：
     ```bash
     cp .env.example .env
     cp backend/.env.example backend/.env
     ```
   - 编辑 `.env` 文件，设置 `JWT_SECRET` 为强随机字符串
   - 编辑 `backend/.env` 文件，确保与根目录的 `.env` 文件中的 `JWT_SECRET` 一致

4. **构建前端**：
   ```bash
   npm run build
   ```
   构建产物将生成在 `dist` 目录中

5. **部署前端静态文件**：
   - 将 `dist` 目录下的文件复制到 Nginx 根目录（如 `/var/www/html`）

6. **启动后端服务**：
   ```bash
   # 安装 PM2（如果未安装）
   npm install -g pm2
   
   # 启动后端服务
   cd backend
   pm2 start server.js --name library-backend
   pm2 save
   ```

7. **配置 Nginx**：
   - 创建或编辑 Nginx 配置文件（如 `/etc/nginx/sites-available/library`）
   - 配置示例：
     ```nginx
     server {
         listen 80;
         server_name your-domain.com;
         
         # 单页应用路由处理
         location / {
             root /var/www/html;
             try_files $uri $uri/ /index.html;
         }
         
         # 后端API代理
         location /api/ {
             proxy_pass http://localhost:3001;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_set_header X-Forwarded-Proto $scheme;
         }
         
         # 静态文件缓存设置
         location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
             root /var/www/html;
             expires 30d;
             add_header Cache-Control "public, no-transform";
         }
     }
     ```
   - 启用配置：
     ```bash
     ln -s /etc/nginx/sites-available/library /etc/nginx/sites-enabled/
     nginx -t
     systemctl reload nginx
     ```

#### 3. 环境变量配置说明

- **VITE_API_BASE_URL**：前端 API 基础路径，生产环境应设置为 `/api`
- **FRONTEND_URL**：前端应用 URL，用于 CORS 配置，生产环境应设置为域名（如 `https://your-domain.com`）
- **JWT_SECRET**：JWT 令牌密钥，生产环境必须设置为强随机字符串

#### 4. 服务管理

- **查看后端服务状态**：
  ```bash
  pm2 status
  ```

- **重启后端服务**：
  ```bash
  pm2 restart library-backend
  ```

- **停止后端服务**：
  ```bash
  pm2 stop library-backend
  ```

## API文档

详细的API文档请参考 `API_DOC.md` 文件。

## 功能说明

### 最新功能状态（2026-05-12）

- 角色数据值仍使用 `user/librarian/admin`，前端展示层将普通用户显示为 `Reader`，不改变后端权限与接口逻辑。
- 借阅确认改为确认时选择副本：用户发起借阅后记录状态为 `borrowing`，不会提前占用或展示某个副本条形码；确认弹窗中选择可用副本后才绑定 `copy_id` 并显示 `copy_code`。
- 书籍信息管理与副本管理拆分：书籍卡片提供 `Edit Info` 与 `Manage Copies`，副本管理弹窗支持新增副本、状态修改、单个位置确认、批量位置更新。
- 每个副本拥有独立数据库 `id`、自动生成的 `copy_code` 条形码编号和 `location`；新增副本默认位置为 `Main Shelf`。
- Reader 与 librarian 的借阅记录页面使用统一表格布局，展示 ID、Title、Barcode、日期、Status badge、Fine、Action，宽屏完整展示，小屏横向滚动；Fine 单元格使用借阅模块专用样式，避免被罚款详情页样式影响。
- 借阅记录、罚款记录、预约记录和日志支持 `Ascending` / `Descending` 顺序切换；借阅和罚款记录优先展示待处理记录，记录过多时分页。
- 罚款接口保留已支付历史记录，页面总额只统计 `fine_status='unpaid'` 的未支付罚款。
- 系统日志接口支持按时间正序/倒序查询。
- Reader 书籍页升级为仪表盘布局：顶部统计卡、紧凑书籍卡片、搜索/分类/快捷状态筛选、右侧热门书籍/最近借阅/系统统计侧栏。
- 书籍管理的 Add New Book 改为 portal 弹窗，脱离书籍页面容器层级；Single Book 只维护书籍元数据，副本数量与位置放到副本管理或批量导入的 Copy Settings。
- Batch Import 使用现代双栏导入界面：左侧 ISBN 列表与 CSV/TXT 上传，右侧实时预览成功/重复/无效 ISBN，下方 Copy Settings 统一生成副本位置、数量和分类。
- Release 2 新增站内通知：预约书籍在归还审批、新增可用副本或副本状态恢复 available 后，系统创建通知并在侧边栏显示未读数量，Reader 可在 `/notifications` 查看和标记已读。
- 公告新增按用户已读状态：登录后如存在未读已发布公告，会触发全局弹窗提醒；确认后写入已读记录，不再重复提醒。
- 公告管理新增/编辑表单改为 portal 弹窗，避免被页面内容层裁切，并优化公告列表为紧凑管理表格。
- System Settings 改为现代 dashboard 分组卡片，仅展示后端业务已实现的参数：借阅功能开关、借阅期限、最大借阅数、借阅确认时长、最大续借次数、续借天数和每日罚款。
- Release 3 新增借阅功能开关：管理员可通过 `borrow_enabled` 全局关闭读者借阅；前端借阅/确认按钮会显示 disabled 状态，后端也会拦截发起借阅和确认借阅请求。
- 批量 ISBN 导入会汇总无效、重复、OpenLibrary 查询失败和后端写入失败项，导入结果会展示完整失败原因。
- 删除未使用的后端 `backend/test*.js` 临时测试脚本，保留数据检查与修复工具。

### 前端功能

1. **用户认证**：登录界面，支持管理员、图书管理员和 Reader 登录
   - 登录、注册、找回密码和重置密码表单均提供字段级前端校验
   - 校验规则与后端保持一致：用户名 3-20 字符、密码至少 6 字符、姓名 2-50 字符、邮箱格式校验
   - 找回密码要求邮箱或手机号至少填写一项，重置密码校验确认密码一致性和 reset token
2. **侧边栏**：折叠式侧边栏，显示用户个人信息和导航菜单
   - 根据用户角色显示不同的导航选项
   - Reader：Books、My Borrows、Profile
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
   - `/profile` - 个人资料
   - `/announcements` - 公告
   - `/announcement-management` - 公告管理（管理员）
   - `/notifications` - 站内通知
   - `/category-management` - 分类管理（管理员/图书管理员）
   - `/stats` - 统计分析
   - `/return-approval` - 归还审批（管理员/图书管理员）
   - `/logs` - 系统日志（管理员）
   - `/system-settings` - 系统设置（管理员）
   - `/reservations` - 预约管理
4. **主布局**：包含侧边栏和顶部导航的响应式布局
   - 侧边栏：显示用户信息和导航菜单
   - 顶部导航：包含应用标题和用户菜单
   - 内容区域：根据路由显示不同的页面内容
5. **书籍管理**：
   - 书籍列表展示，采用现代 dashboard 网格布局
   - 书籍列表在副本详情加载完成前使用 `available_copies` 缓存展示可用状态，避免加载中误标记为 Borrowed
   - 搜索功能（支持按标题、作者、ISBN搜索），搜索栏提供输入框与统一图标按钮，支持分类筛选与 Available/Borrowed/Reserved 快捷筛选
   - 点击书籍查看详情
   - 借阅和归还书籍
   - 删除书籍（管理员/图书管理员）
   - ISBN导入：通过OpenLibrary API查询ISBN自动填充书籍信息（管理员/图书管理员）
   - 右侧侧栏展示热门书籍 Top 10、最近借阅和系统统计
6. **书籍管理专门板块**（管理员/图书管理员）：
   - 通过 Add New Book portal 弹窗添加新书籍（包含ISBN格式验证和重复检查），避免被书籍页面容器裁切或遮挡
   - 编辑书籍基础信息（与副本管理分离）
   - 批量管理书籍
   - 实时状态更新
   - 管理页搜索栏使用独立布局，搜索输入与搜索按钮保持同一行对齐
   - 通过独立弹窗管理书籍副本数量、状态、条形码和位置
   - 新增副本时自动生成副本编号和条形码编号，并填充默认位置
   - 副本位置支持单个确认保存和批量应用到全部副本；批量位置保存会按顺序提交，避免 SQLite 并发事务冲突
   - ISBN单个/批量导入；批量导入支持 ISBN 实时预览、CSV/TXT 上传、导入进度和 Copy Settings
   - 批量导入会在前端和后端同时报告无效 ISBN、重复 ISBN、元数据查询失败和写入失败原因
7. **书籍详情页**：
   - 显示书籍详细信息
   - 显示所有副本信息（ID、条形码、状态、位置）
   - 新的借阅流程：
     - 点击借阅按钮后创建待确认记录，状态为borrowing
     - 显示一小时倒计时
     - 按钮变为confirm borrowing
     - 点击确认后弹出确认界面
     - 提供下拉菜单选择可用副本
     - 用户点击确认后才绑定具体副本并正式借出
8. **用户管理**：
   - 用户列表展示（管理员/图书管理员）
   - 添加新用户（包含用户名重复检查和表单验证）
   - 编辑用户信息
   - 搜索功能（支持按用户名、姓名、邮箱搜索）
   - 用户管理搜索栏使用独立布局，搜索输入与搜索按钮保持同一行对齐
   - 删除用户（管理员，不能删除自己）
   - 查看用户借阅记录（管理员/图书管理员）
9. **借阅记录**：
   - 个人借阅记录查询
   - 借阅历史查看
   - 条形码展示、状态 badge、罚款列和统一操作按钮
   - 罚款金额使用借阅记录专用显示样式，支持数字/字符串金额统一格式化为 `¥0.00`
   - 默认优先显示待确认、待还等待处理记录，再按 ID 展示最新记录
   - 支持 `Ascending` / `Descending` 顺序切换和分页
   - 罚款历史记录查看与未支付罚款支付
   - 管理员/图书管理员查看和管理用户借阅记录，布局与 Reader 借阅记录保持一致
   - 管理员/图书管理员手动归还书籍
10. **归还审批**（管理员/图书管理员）：
   - 查看待审批的归还请求列表
   - 单条审批归还
   - 一键批量审批所有待归还请求
   - 支持按日期筛选审批
11. **消息通知**：使用全局 toast 组件显示成功/失败消息，通过 ToastContext 管理全局消息状态
    - 支持多种消息类型：info、success、error
    - 消息自动消失（默认3秒）
    - 可手动关闭消息
    - 全局可访问的消息通知系统
    - 支持多个消息堆叠显示
    - 平滑的消息出现和消失动画
    - 每个toast独立倒计时，按照创建顺序消失
    - 当一个toast消失时，其他toast会平滑上移
    - 手动关闭toast时也会有平滑的消失动画
12. **站内通知与公告提醒**：
    - 预约书籍归还审批、新增可用副本或副本状态改为 available 后，自动生成站内通知
    - 侧边栏显示未读通知数量，Reader 可进入通知中心查看、单条已读或全部已读；已读操作会即时同步侧边栏 badge
    - 已发布公告按用户记录已读状态；存在未读公告时，全局弹窗提醒一次
    - 公告管理使用弹窗创建/编辑公告，发布开关和列表状态清晰分离
13. **加载状态**：使用 SkeletonLoader 组件显示加载状态
    - 书籍列表加载时显示骨架屏
    - 提升用户体验，减少加载等待感
    - 响应式设计，适配不同屏幕尺寸
14. **数据验证**：
    - 表单字段验证
    - 数据格式检查
    - 重复数据提示
15. **安全性**：
    - 前端输入验证
    - 密码强度检查
    - 登录页所有认证表单提供 inline 错误提示和提交前拦截
    - 实时错误提示
    - 权限控制展示
    - 受保护路由，未登录用户自动跳转到登录页
    - 管理员/图书管理员用户访问普通用户路径时自动重定向到管理员页面
16. **系统设置**：
    - 管理员通过 `/system-settings` 管理全局配置
    - 页面采用分组卡片、搜索、Editable mode、顶部 Save Changes / Reset Defaults 和底部变更保存栏
    - 仅展示已被后端业务逻辑读取的设置项：`borrow_enabled`、`borrow_period_days`、`max_borrows`、`borrow_confirm_minutes`、`max_renew_times`、`renew_days`、`fine_per_day`
    - `borrow_enabled` 为全局借阅功能开关，关闭后读者无法发起或确认借阅，但不影响归还、预约、罚款支付等流程
    - API 仍支持 settings upsert，但未接入业务逻辑的配置不在前端设置页展示

### 后端功能

1. **数据库初始化**：自动创建SQLite数据库和表结构，并插入示例数据
2. **API接口**：提供完整的CRUD操作接口，用于前端与数据库交互
3. **用户认证**：验证用户登录信息，使用JWT进行身份验证
4. **借阅管理**：处理书籍借阅和归还逻辑，更新书籍状态和借阅记录
   - 新的借阅流程：支持借阅请求、确认借阅、超时处理
   - 从系统设置读取借阅参数（借阅功能开关、借阅期限、确认时长、最大借阅数量等）
   - `borrow_enabled = 0` 时，后端会拒绝发起借阅和确认借阅请求并返回 403
   - 借阅前检查用户状态（是否拉黑）、罚款状态、借阅数量限制
   - 图书管理员审批归还（单条或一键批量审批，支持按日期筛选）
   - 逾期自动计算罚款
5. **罚款管理**：
   - 逾期罚款自动计算（基于 fine_per_day 系统设置）
   - `fine_per_day` 支持设置为 `0` 以禁用逾期罚款
   - 用户提交归还申请时罚款立即累计到用户账户（total_fine），无需等待归还审批即可支付
   - 查询用户罚款历史记录，未支付记录优先展示
   - 一键支付所有未支付罚款，支付接口以未支付罚款记录为准并同步 total_fine
   - 管理员和图书管理员可以查看并处理用户罚款
6. **书籍副本管理**：
   - 为每本书创建多个副本
   - 每个副本维护独立 id、copy_code 条形码编号、状态和位置
   - 新增副本自动生成下一位 copy_code 并默认填充 Main Shelf
   - 管理副本状态（available/borrowing/borrowed/reserved）
   - 支持确认借阅时绑定具体可用副本
   - 副本位置管理（如A1-01），方便定位实体书
7. **ISBN导入**：
   - 通过 OpenLibrary API 查询 ISBN 信息
   - 自动填充书籍详情（标题、作者、出版社、封面等）
   - 出版日期会尽量归一为 `YYYY-MM-DD`、`YYYY-MM` 或 `YYYY`，无法解析时显示原始返回值
   - 支持单个和批量 ISBN 导入
   - 批量导入时通过 Copy Settings 指定默认位置、每本副本数和分类，后端自动生成副本编号与条形码编号
   - 批量导入会保留 ISBN 元数据中的语言和页数，缺省时使用默认值
   - 批量导入会返回每个失败 ISBN 的具体原因，包含格式错误、重复、元数据缺失和数据库写入错误
   - 批量导入事务会等待书籍、分类关联和所有副本写入完成后再提交并返回成功/失败统计
8. **站内通知与公告已读**：
   - `notifications` 表保存预约可借通知，支持未读数量、单条已读和全部已读
   - 预约可借通知触发逻辑复用在归还审批、新增副本和副本状态恢复 available 场景
   - `announcement_reads` 表按用户保存公告已读状态，避免已读公告重复弹窗
   - 公告创建/编辑采用弹窗表单，保存后刷新公告列表
9. **用户管理**：处理用户信息的增删改查
10. **数据去重**：
   - 书籍ISBN唯一检查
   - 用户名唯一检查
   - 数据库唯一索引约束
11. **数据验证**：
   - API请求参数验证
   - 数据完整性检查
   - 错误处理和提示
12. **安全性**：
   - 密码加密存储（使用bcrypt）
   - JWT token认证
   - 中间件权限控制
   - 输入验证中间件
   - 防SQL注入保护
   - 严格的角色验证（支持'user'、'librarian'和'admin'）
13. **数据库工具**：
    - `check_db.js` - 检查数据库中的书籍和借阅记录
    - `check_indexes.js` - 检查数据库索引状态和数据
    - `cleanup.js` - 清理数据库重复数据并添加唯一约束
    - `fix_book_status.js` - 修复书籍状态
    - 其他数据修复和管理工具

## 开发指南

### 前端开发

1. **组件结构**：使用React函数组件和Hooks管理状态
2. **状态管理**：使用React Context API管理全局认证状态和消息通知
3. **API调用**：
   - 使用封装的API工具函数与后端通信
   - 使用 `useApiRequest` 自定义 hook 处理API请求，统一管理加载状态和错误处理
4. **样式**：使用CSS变量和模块化样式，支持响应式布局
5. **用户体验**：添加加载状态、错误提示和动画效果
6. **数据验证**：
   - 表单字段必填检查
   - 数据格式验证（如ISBN、邮箱格式）
   - 实时错误提示
   - 重复数据处理
7. **安全性**：
   - 前端输入验证
   - 密码强度检查
   - 权限控制逻辑
   - 安全的API调用

### 后端开发

1. **服务器配置**：使用Express创建RESTful API
2. **数据库操作**：使用SQLite3进行数据库操作
3. **中间件**：
   - 使用CORS中间件处理跨域请求
   - 使用统一错误处理中间件捕获和格式化所有错误
   - 使用认证中间件验证用户身份和权限
4. **事务处理**：在借阅和归还操作中使用事务确保数据一致性
   - 系统设置更新使用 upsert，fresh DB 缺失设置项时会自动创建
5. **数据去重**：
   - 数据库唯一索引约束
   - API层面的重复检查
   - 错误处理和提示
6. **数据验证**：
   - 请求参数验证
   - 数据完整性检查
   - 规范化的错误响应
7. **安全性**：
   - 密码加密存储（使用bcrypt）
   - JWT token生成和验证
   - 中间件权限控制
   - 输入验证中间件
   - 防SQL注入保护
   - 严格的角色验证（支持'user'、'librarian'和'admin'）
8. **环境配置**：使用dotenv加载环境变量，支持不同环境的配置
   - 后端集中读取支付宝配置，启动时只输出是否已配置必要字段，不会打印 app 私钥或支付宝公钥内容
9. **支付宝罚款支付模拟接口**：
   - 后端新增 `/api/payments/fines/alipay` 创建支付宝罚款支付单，返回二维码内容和收款链接
   - 借阅历史区分预计罚款和实际罚款：未归还逾期书籍只显示 Estimated Fine，提交还书后生成的 `returning/returned` 未付罚款才允许支付
   - Fine Records 页面点击 Pay with Alipay 后会显示支付宝模拟支付区域、订单号、二维码内容占位和收款链接，不再直接结清罚款
   - My Borrow Records 的罚款弹窗会跳转到 Fine Records 支付页，避免继续使用旧的直接结清接口
   - 本地模拟支付成功通过 `/api/payments/alipay/simulate-notify/:out_trade_no` 完成，支付成功后同步更新罚款状态和用户实际未付罚款总额
   - 本地 `/payment-result` 页面会根据 `out_trade_no` 查询后端订单状态，模拟支付成功后再次打开链接会显示最新状态
   - 同一用户同一批实际罚款已有 pending 订单时会复用原订单，避免重复创建支付单
   - 支持支付订单列表查询和手动过期 pending 订单，便于本地验证订单状态流转
   - 图书管理员可通过 `/api/payments/income/summary` 查看已支付收入、今日收入、本月收入和最近支付记录
   - 管理员/图书管理员可通过 `/income-dashboard` 查看收入 dashboard、支付订单列表，并过期待支付订单
   - 真实支付宝 notify 路由已预留为 `/api/payments/alipay/notify`，后续接入签名验签后可替换模拟流程

## 示例数据

系统初始化时会自动添加以下示例数据：

### 书籍
1. **The Great Gatsby** - F. Scott Fitzgerald (ISBN: 9780743273565)
2. **1984** - George Orwell (ISBN: 9780451524935)
3. **To Kill a Mockingbird** - Harper Lee (ISBN: 9780061120084)

### 用户
1. **管理员**：用户名 admin，密码 admin123
2. **图书管理员**：用户名 librarian，密码 admin123
3. **普通用户**：用户名 user1，密码 user123

## 注意事项

1. 确保后端服务器和前端开发服务器都已启动
2. 数据库文件会自动创建在backend目录中
3. 系统使用SQLite数据库，无需额外配置数据库服务
4. 前端应用默认连接到http://localhost:3001的后端API
5. 登录信息会存储在本地存储中，刷新页面后仍然保持登录状态
6. 数据唯一性保障：
   - 书籍ISBN必须唯一
   - 用户名必须唯一
   - 系统会在前端和后端双重验证数据唯一性
7. 数据验证：
   - 表单提交前会进行前端验证
   - API请求会进行后端验证
   - 数据库层面有唯一约束保护
8. 数据库迁移：
   - 如果使用旧的 library.db 文件（包含旧的书籍表结构），可能会出现 "no such column: available_copies" 错误
   - 建议删除旧的 library.db 文件，让系统自动重新创建新的数据库结构
   - 或者使用数据库工具（如 SQLite Browser）手动更新表结构

9. 隐私信息配置：
   - 隐私信息（如备案号）存储在 `src/config/privacy.js` 文件中
   - 此文件已添加到 `.gitignore`，不会被提交到版本控制
   - 部署时需要确保此文件存在并包含正确的信息

## 扩展建议

1. 实现前端路由，添加更多页面
2. 优化用户界面，添加更多动画效果
3. 添加深色模式
4. 添加数据可视化图表
5. 优化移动端适配
6. 添加国际化支持
7. 开发移动端应用
8. 添加扫码借书还书功能
9. 集成在线支付罚款功能

## 许可证

MIT License

## Maintenance Update - 2026-05-13

### Dangerous operation safeguards

- User deletion is now admin-only and is blocked when the target user is the current account, an admin account, has active borrow records, or has active reservations.
- Book deletion is blocked when the book has active borrow records, occupied copies, or active reservations.
- Active borrow checks consistently include `borrowing`, `borrowed`, `overdue`, and `returning`, so return-pending and overdue records cannot be bypassed.
- Copy-count reduction validates `total_copies` and refuses to remove more copies than are currently available.
- System log clearing validates the `days` parameter before issuing a delete query.

### Copy management

- Copy Management now supports deleting a single copy through the modal action column.
- Single-copy deletion calls `DELETE /api/books/copies/:id`.
- A copy can be deleted only when it is `available`, is not the last copy for the book, and has no active borrow records.
- After deletion, the backend recalculates `books.total_copies` and `books.available_copies` in the same transaction.
- The Copy Management modal table layout was adjusted so the `Confirm` and `Delete` buttons are visible on desktop without dragging the horizontal scrollbar.

### Books page filters

- The `Reserved` quick filter now uses the current user's reservation records instead of a book-level status field.
- Reservations with status `active` or `pending` are treated as reserved for the current reader.
- After a reader reserves or cancels a reservation from the book card, the Books page refreshes its reservation filter data without requiring a page reload.

### Books page search

- The Books page search bar now reuses the shared icon search button used by other search bars.
- The search button is aligned with the input field and reruns the search using the current title, author, or ISBN query.
