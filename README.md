# 图书馆管理系统开发文档

## 项目概述

图书馆管理系统是一个基于 React 和 Node.js 的 Web 应用，覆盖读者借阅、预约、归还、罚款支付，图书管理员书籍/副本管理、归还审批、收入看板，以及管理员用户、公告、分类、系统设置和日志管理等流程。系统支持多角色权限、站内通知、邮件验证码、支付宝沙箱支付、分页搜索和数据导出，适合中小型图书馆或课程项目验收演示。

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
   - 编辑 `backend/.env` 文件，设置后端专用配置

**根目录 .env 文件示例**：

```env
# Frontend API configuration
VITE_API_BASE_URL=/api
```

**backend 目录 .env 文件示例**：

```env
# Server configuration
PORT=3001

# CORS configuration
FRONTEND_URL=*

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Development seed accounts
SEED_DEFAULT_USERS=false
DEFAULT_ADMIN_PASSWORD=change-this-admin-password
DEFAULT_USER_PASSWORD=change-this-user-password

# Alipay sandbox payment configuration
ALIPAY_ENABLED=false
ALIPAY_MODE=sandbox
ALIPAY_APP_ID=your_sandbox_app_id
# 支持完整 PEM，也支持直接粘贴支付宝沙箱里的一行 base64 key body
ALIPAY_PRIVATE_KEY=your_app_private_key_body
ALIPAY_PUBLIC_KEY=your_alipay_public_key_body
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_NOTIFY_URL=http://localhost:3001/api/payments/alipay/notify
ALIPAY_RETURN_URL=http://localhost:5173/payment-result
ALIPAY_SIMULATION_ENABLED=true
ALIPAY_SIGN_TYPE=RSA2
ALIPAY_CHARSET=utf-8
ALIPAY_FORMAT=json
ALIPAY_TIMEOUT_MS=10000

# ISBN lookup provider configuration
SHOWAPI_ISBN_APP_KEY=your_showapi_app_key

# Backend outbound proxy for external ISBN APIs
BACKEND_PROXY_MODE=auto
BACKEND_PROXY_HOST=127.0.0.1
BACKEND_PROXY_PORT=7890

# Email delivery configuration
# QQ Mail uses an SMTP authorization code instead of the mailbox login password.
EMAIL_ENABLED=false
EMAIL_MODE=log
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_qq_email@qq.com
SMTP_PASS=your_qq_mail_smtp_authorization_code
EMAIL_FROM="Library System <your_qq_email@qq.com>"
APP_PUBLIC_URL=http://localhost:5173
```

**重要安全注意事项**：
- 不要将 `.env` 文件提交到版本控制系统中
- 后端生产环境必须设置强随机 `JWT_SECRET`；未设置时服务会拒绝启动
- 开发环境缺少 `JWT_SECRET` 时会生成临时随机密钥，重启后旧 token 会失效
- 定期旋转 JWT_SECRET 以增强安全性
- 生产环境默认不会插入示例账号；仅在明确需要时设置 `SEED_DEFAULT_USERS=true`
- 确保 `.env` 文件的权限设置为只有所有者可以读取

**环境变量说明**：
- `VITE_API_BASE_URL`：后端 API 的基础 URL
- `FRONTEND_URL`：前端应用的 URL，用于 CORS 配置
- `JWT_SECRET`：用于生成和验证 JWT token 的密钥
- `SEED_DEFAULT_USERS`：是否插入示例账号。开发环境默认插入，生产环境默认不插入；生产演示环境需要示例账号时显式设为 `true`
- `DEFAULT_ADMIN_PASSWORD` / `DEFAULT_USER_PASSWORD`：示例管理员/普通用户初始密码，未配置时开发环境使用 `admin123` / `user123`
- `ALIPAY_ENABLED`：是否启用支付宝支付配置校验；沙箱调试时设为 `true`
- `ALIPAY_MODE`：支付宝模式，支持 `sandbox` 和 `production`，默认 `sandbox`
- `ALIPAY_APP_ID`：支付宝开放平台应用 ID，需要由你从沙箱应用提供
- `ALIPAY_PRIVATE_KEY`：应用私钥，只能保存在 `backend/.env` 后端环境变量中；可填写完整 PEM，也可直接粘贴支付宝工具/沙箱生成的一行私钥 body
- `ALIPAY_PUBLIC_KEY`：支付宝公钥，用于回调验签；可填写完整 PEM，也可直接粘贴支付宝沙箱的一行公钥 body
- `ALIPAY_SIGN_TYPE`：签名算法，默认 `RSA2`，后端会使用 `RSA-SHA256`；应用私钥支持 PKCS#8 `PRIVATE KEY` 和 PKCS#1 `RSA PRIVATE KEY` 两种 PEM 容器
- `ALIPAY_NOTIFY_URL`：支付宝异步通知地址；本地模拟配置为 `http://localhost:3001/api/payments/alipay/notify`，真实沙箱回调测试需要换成公网或内网穿透地址
- `ALIPAY_RETURN_URL`：支付完成后的前端返回地址；本地测试默认 `http://localhost:5173/payment-result`
- `ALIPAY_SIMULATION_ENABLED`：是否显示并允许本地模拟支付成功按钮；默认在 `ALIPAY_MODE=sandbox` 时开启，生产环境应设为 `false`
- `ALIPAY_GATEWAY`：支付宝网关；沙箱默认 `https://openapi-sandbox.dl.alipaydev.com/gateway.do`
- `ALIPAY_SIGN_TYPE` / `ALIPAY_CHARSET` / `ALIPAY_FORMAT` / `ALIPAY_TIMEOUT_MS`：支付宝请求签名、编码、格式和超时配置
- `SHOWAPI_ISBN_APP_KEY`：ShowAPI ISBN 查询节点的 appKey，应配置在 `backend/.env` 中
- `BACKEND_PROXY_MODE`：后端访问外部 ISBN API 时的代理模式，`auto` 表示检测到代理可用才使用，`on` 表示总是使用，`off` 表示禁用代理
- `BACKEND_PROXY_HOST` / `BACKEND_PROXY_PORT`：后端出站代理地址，默认 `127.0.0.1:7890`
- `EMAIL_ENABLED`：是否启用邮件处理；关闭时仅记录 skipped 日志
- `EMAIL_MODE`：`log` 表示本地只记录/打印邮件，`smtp` 表示真实发信
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE`：QQ 邮箱默认 `smtp.qq.com`、`465`、`true`
- `SMTP_USER`：QQ 邮箱地址
- `SMTP_PASS`：QQ 邮箱 SMTP 授权码，不是 QQ 登录密码
- `EMAIL_FROM`：发件人显示名称和邮箱
- `APP_PUBLIC_URL`：前端公开地址，用于生成重置密码链接

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

   `sqlite3` 是原生依赖，不能直接复用其他系统或容器中生成的 `node_modules`。本项目将后端
   `sqlite3` 固定为 `5.1.7`，用于兼容宝塔面板中较旧 Linux/glibc 环境。如果服务器曾安装过
   `sqlite3@6.x` 并报 `/lib64/libm.so.6: version 'GLIBC_2.38' not found`，请删除服务器上的
   `backend/node_modules` 和旧 lockfile 后重新执行后端 `npm install`。

3. **配置环境变量**：
   - 复制环境变量示例文件并配置：
     ```bash
     cp .env.example .env
     cp backend/.env.example backend/.env
     ```
   - 编辑 `.env` 文件，设置前端 `VITE_API_BASE_URL`
   - 编辑 `backend/.env` 文件，设置生产 `JWT_SECRET`、`FRONTEND_URL` 和支付/邮件等后端配置

4. **构建前端**：
   ```bash
   npm run build
   ```
   构建前会通过 `prebuild` 自动清理旧 `dist`，构建产物将生成在 `dist` 目录中

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

### 角色与权限

- **Reader**：浏览书籍、查看详情、发起借阅、确认借阅、预约、续借、提交归还、查看个人借阅/罚款/通知/公告和个人资料。
- **图书管理员**：管理书籍、分类、副本、用户、借阅记录、归还审批、预约记录、罚款记录、收入看板和图书副本组合导出。
- **管理员**：拥有全部图书管理员能力，并额外管理公告、系统设置、系统日志和全局开关。

### 读者端功能

- 书籍首页采用 dashboard 布局，支持标题、作者、ISBN 搜索，分类筛选，以及 Available、Borrowed、Reserved 快捷筛选。
- 书籍列表按每页 12 本分页展示，分页跳转后自动滚动到列表顶部；右侧模块包含可折叠热门书籍 Top 10、最近借阅和系统统计。
- 书籍详情展示图书信息、简介和所有副本状态；从借阅记录或预约记录跳转详情时会保留来源地址，返回时回到原页面。
- 借阅采用“发起后确认”流程：发起借阅后生成 `borrowing` 记录并保留倒计时，确认弹窗中选择可用副本后正式借出。
- 确认弹窗中 `Cancel` 用于取消锁定，`Not Now` 和右上角关闭按钮用于暂时关闭弹窗；倒计时状态在列表页和借阅记录页之间保持一致。
- 支持预约可借图书；预约功能关闭后不能发起新预约，但可以取消已有预约。
- My Borrows 支持分页、关键词、状态和借阅日期范围过滤，记录行可跳转到对应图书详情；图书不存在时弹出错误提示。
- Fine Records 支持关键词、罚款状态和日期范围过滤，未支付罚款通过支付宝订单支付。
- 站内通知展示预约到书提醒，支持单条已读和全部已读。
- 公告列表支持点击公告打开弹窗，完整展示公告标题、日期和正文；未读公告登录后只弹出提醒一次。

### 图书与副本管理

- Book Management 支持分页、关键词搜索和保留当前页编辑；编辑、添加和副本管理均使用居中 portal 弹窗。
- 书籍基础信息与副本管理分离：`Edit Info` 维护图书元数据，`Manage Copies` 维护副本数量、状态、条形码和位置。
- 副本拥有独立 `id`、`copy_code`、状态和位置；新增副本自动生成下一位编号并默认填充 `Main Shelf`。
- 副本位置支持单个确认保存和批量应用到全部副本；批量保存按顺序提交，避免 SQLite 并发事务冲突。
- 支持通过 OpenLibrary、Google Books、ShowAPI ISBN 节点进行单本 ISBN 查询和批量导入，导入前可测试节点可用性。
- 批量导入支持 CSV/TXT 上传、实时预览、导入进度、默认副本数量/位置/分类设置，并返回无效、重复、查询失败和写入失败原因。
- 图书管理员可导出图书与副本组合 CSV，按副本展开并拼接图书表和副本表字段。
- 分类管理支持创建、搜索和分页展示，分类名过长时省略显示并可悬停查看完整名称。

### 借阅、预约与归还

- 借阅记录统一表格布局，展示 ID、书名、条形码、日期、状态、罚款和操作按钮。
- Reader、图书管理员和管理员相关记录页面均支持分页；核心记录列表提供关键词、状态和时间范围过滤。
- 归还审批支持单条审批、一键批量审批、按归还日期筛选和分页展示。
- 预约记录支持分页、关键词搜索、状态筛选和时间过滤；点击记录可跳转对应图书详情。
- 系统会在归还审批、新增可用副本或副本状态恢复 available 后，为预约用户生成站内通知。

### 罚款、支付与收入

- 逾期罚款基于 `fine_per_day` 自动计算；提交归还申请时将实际罚款累计到用户账户。
- `fine_enabled` 可全局暂停新罚款产生和未归还逾期记录的预计罚款增长；`fine_per_day = 0` 表示仍保留罚款流程但费率为零。
- 罚款支付通过支付宝订单完成，支付成功后同步罚款记录、用户未付罚款总额和收入流水。
- 本地开发可使用模拟支付，沙箱配置完整时可生成支付宝沙箱 page pay 链接和 precreate 二维码内容。
- 支付订单列表支持分页、关键词过滤、状态过滤、创建时间过滤和手动过期 pending 订单。
- Income Dashboard 展示已支付收入、今日收入、本月收入、最近支付记录和收入折线图。
- 未指定范围时收入折线图按月展示过去一年收入；指定日期范围时自动按日、7 天区间或月份划分标度。
- Income Dashboard 的支付记录支持分页、关键词过滤和时间过滤，分页数据返回后自动滚动到列表顶部。

### 用户、公告与系统管理

- 用户管理支持新增、编辑、删除、搜索和分页；邮箱字段提供格式校验。
- 管理员不能删除自己；删除用户会受到活跃借阅、预约和角色规则保护。
- 公告管理支持创建、编辑、发布开关和列表管理；公告弹窗脱离页面容器限制，完整展示文本。
- 系统日志支持分页、升序/降序、关键词、操作类型、用户 ID 和创建日期范围过滤。
- System Settings 只展示已接入业务逻辑的设置项：`borrow_enabled`、`reservation_enabled`、`borrow_period_days`、`max_borrows`、`borrow_confirm_minutes`、`max_renew_times`、`renew_days`、`fine_enabled`、`fine_per_day`。
- `borrow_enabled` 关闭后读者无法发起或确认借阅，但不影响归还、预约取消、罚款支付等流程。
- `reservation_enabled` 关闭后读者无法发起新预约，但不影响取消已有预约。
- `fine_enabled` 关闭后不再产生新的逾期罚款，未归还逾期记录的预计罚款不再增长，不影响已有未支付罚款的正常支付。

### 认证、通知与安全

- 登录用户信息保存在当前标签页 `sessionStorage` 中，同一浏览器多个标签页可登录不同账号，互不覆盖。
- 注册和重置密码流程使用 6 位邮箱验证码，验证码哈希保存、10 分钟过期且验证后失效。
- 支持 QQ 邮箱 SMTP 发信和本地 log 模式；注册、重置密码和预约到书通知可触发邮件发送。
- 密码使用 bcrypt 加密存储，后端通过 JWT、认证中间件、角色权限和输入验证保护接口。
- 前后端均提供必要的数据校验，包括必填项、ISBN、邮箱、用户名、密码、重复数据和权限检查。

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
   - 当 `ALIPAY_ENABLED=true` 且沙箱配置完整时，支付单会生成支付宝沙箱 `alipay.trade.page.pay` 收银台签名链接，并优先调用 `alipay.trade.precreate` 获取支付宝专用二维码内容；未启用或配置缺失时继续使用本地 `/payment-result` 模拟链接
   - 支付宝沙箱启用时不会再把 page-pay 长链接作为二维码兜底；已有 pending 订单如果仍保存旧长链接二维码，后端会在复用订单前刷新为 precreate 二维码
   - 借阅历史区分预计罚款和实际罚款：未归还逾期书籍只显示 Estimated Fine，提交还书后生成的 `returning/returned` 未付罚款才允许支付
   - Fine Records 页面点击 Pay with Alipay 后会显示支付宝模拟支付区域、订单号、二维码内容占位和收款链接，不再直接结清罚款
   - Fine Records 支付面板会每 2.5 秒轮询 `/api/payments/:id`；订单变为 `paid` 时自动刷新罚款记录并在二维码上叠加 `public/打勾.png` 完成标记，变为 `expired` 时提示重新创建订单
   - 启用支付宝沙箱配置后，订单查询接口会对 pending 订单主动调用 `alipay.trade.query`；即使本地没有公网 notify，刷新或轮询也能在沙箱支付完成后同步本地订单状态
   - My Borrow Records 的罚款弹窗会跳转到 Fine Records 支付页，避免继续使用旧的直接结清接口
   - 旧的 `/api/borrow/pay-fine` 直接结清接口已移除，避免绕过支付宝订单和收入流水
   - My Borrow Records 的罚款弹窗通过 portal 挂到页面根节点，确保始终按浏览器视口居中，并使用覆盖基础弹窗宽度限制的宽屏表格布局展示大量罚款记录
   - 后端 ISBN provider 代理使用 `undici` 的 `ProxyAgent`，该依赖记录在 `backend/package.json` 中；切换到 Release 3 分支后需要在 `backend` 目录执行 `npm install`
   - 本地模拟支付成功通过 `/api/payments/alipay/simulate-notify/:out_trade_no` 完成，只有 `ALIPAY_MODE=sandbox` 或 `ALIPAY_SIMULATION_ENABLED=true` 时前端显示模拟按钮，支付成功后同步更新罚款状态和用户实际未付罚款总额
   - 本地 `/payment-result` 页面会根据 `out_trade_no` 查询后端订单状态，支持手动刷新并每 2.5 秒轮询，模拟支付成功后会显示最新状态
   - 同一用户同一批实际罚款已有 pending 订单时会复用原订单，避免重复创建支付单
   - 支持支付订单列表分页查询、关键词过滤、创建时间过滤和手动过期 pending 订单；过期订单不能模拟成功，已支付订单不能再过期，过期后再次支付会创建新订单
   - 图书管理员可通过 `/api/payments/income/summary` 查看已支付收入、今日收入、本月收入和最近支付记录
   - 图书管理员可通过 `/api/payments/income/analytics` 获取收入折线图数据；未指定范围时按月展示过去一年收入，指定范围时自动按日、7 天区间或月份划分标度
   - 管理员/图书管理员可通过 `/income-dashboard` 查看收入 dashboard、动态收入折线图、日期区间收入查询、分页支付订单列表，并按关键词、状态、创建时间过滤订单
   - `/api/payments/alipay/notify` 支持支付宝表单回调验签；沙箱回调成功后会按 `out_trade_no` 完成对应罚款支付单
10. **QQ 邮箱邮件服务**：
   - 后端新增邮件配置、邮件发送服务和 `email_logs` 发送记录表
   - 支持 `EMAIL_MODE=log` 本地演示模式和 `EMAIL_MODE=smtp` 真实 QQ 邮箱发信模式
   - 注册成功、请求重置密码、预约到书通知会触发邮件发送
   - 注册和重置密码流程新增 6 位邮箱验证码，验证码哈希保存到 `email_verification_codes`，10 分钟过期且验证后失效
   - 注册页提供 Send Code 按钮，重置密码页要求输入随重置邮件发送的验证码
   - 管理员可通过 `/api/system/email/status` 查看安全配置摘要，通过 `/api/system/email/test` 发送测试邮件
   - System Settings 右侧提供 Email Test 卡片，管理员可在前端查看模式/配置状态并触发测试邮件

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

> 示例用户仅用于开发/演示。生产环境默认不插入这些账号；如确需演示账号，请显式设置 `SEED_DEFAULT_USERS=true` 并通过 `DEFAULT_ADMIN_PASSWORD` / `DEFAULT_USER_PASSWORD` 覆盖默认密码。

## 注意事项

1. 确保后端服务器和前端开发服务器都已启动
2. 数据库文件会自动创建在backend目录中
3. 系统使用SQLite数据库，无需额外配置数据库服务
4. 前端应用默认连接到http://localhost:3001的后端API
5. 登录信息会存储在当前标签页会话中，刷新当前标签页后仍然保持登录状态；关闭该标签页后需要重新登录
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

## 许可证

MIT License
