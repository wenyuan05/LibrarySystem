# 图书馆管理系统前后端设计文档

## 1. 系统架构概览

### 1.1 整体架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  前端应用       │─────│  后端API        │─────│  数据库         │
│  (React 19)     │     │  (Express 5)    │     │  (SQLite)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 1.2 技术栈

| 类别 | 技术/框架 | 版本 | 用途 |
|------|-----------|------|------|
| 前端 | React | 19.2.0 | UI构建 |
| 前端 | React Router | 7.13.1 | 路由管理 |
| 前端 | Framer Motion | 12.35.1 | 动画效果 |
| 后端 | Node.js | >=20.0.0 | 运行环境 |
| 后端 | Express | 5.2.1 | API服务器 |
| 后端 | SQLite3 | 5.1.7 | 数据库 |
| 后端 | bcrypt | 6.0.0 | 密码加密 |
| 后端 | jsonwebtoken | 9.0.3 | JWT认证 |
| 后端 | cors | 2.8.6 | 跨域支持 |
| 构建工具 | Vite | 7.3.1 | 前端构建 |
| 前端 | JsBarcode | 3.12.3 | 副本条形码渲染 |

### 1.3 最新设计状态（2026-05-12）

- 数据模型仍保留 `user/librarian/admin` 三种角色值；前端展示层将 `user` 显示为 `Reader`，权限判断和接口协议不变。
- 副本从书籍基础信息中拆分为独立管理弹窗：书籍卡片负责编辑书籍信息，`Manage Copies` 负责新增副本、状态调整、单个位置确认、批量位置更新和删除单个可用副本。
- 每个副本拥有数据库 `id`、唯一 `copy_code`、`status`、`location`；前端通过 `Barcode.jsx` 统一渲染条形码。
- 借阅流程采用“先创建待确认记录，确认时选择副本”的设计，避免待确认阶段提前占用或展示错误副本。
- Reader 与 librarian 的借阅记录页面复用同一套宽表格布局，包含条形码列、状态 badge、罚款列、分页、排序、关键词搜索、状态筛选和借阅日期范围筛选；罚款单元格使用 `borrow-fine-*` 专用类名，避免与罚款详情页、个人页的 `.fine-amount` 全局样式冲突。
- 历史记录默认最新优先，排序切换按钮显示为 `Ascending` / `Descending`；借阅与罚款记录优先展示待确认、待还、未支付等待处理项；借阅记录、预约记录、归还审批、罚款记录、支付订单、系统日志和用户管理列表在记录过多时分页，并提供对应的关键词/状态/日期过滤入口。
- 罚款接口返回历史罚款记录，已支付记录不再从历史中消失，前端总额仅统计未支付罚款。
- Reader 书籍页采用企业 SaaS dashboard 布局：固定顶部导航、统计卡、紧凑书籍网格、搜索/分类/快捷筛选工具栏和右侧综合信息侧栏。
- 书籍卡片增加封面缩略图、状态 badge、紧凑元数据、可用率进度条和 hover elevation，提升库存浏览密度。
- Add New Book 采用 portal 弹窗承载，挂载到 `document.body` 以脱离书籍页面容器层级；单本添加只维护书籍元数据，批量导入通过 Copy Settings 统一生成副本位置、数量和分类。
- Batch Import 页面使用左侧 ISBN 输入/CSV 上传、右侧实时预览、底部 Copy Settings 和导入进度，清晰分离“元数据导入”和“副本生成”。
- Release 2 站内通知由后端持久化：预约书籍在归还审批、新增可用副本或副本状态恢复 available 后写入 `notifications`，侧边栏通过共享通知状态即时显示未读数量，通知中心支持单条/全部已读。
- 公告提醒按用户持久化已读状态：`announcement_reads` 记录用户确认过的公告，MainLayout 仅对未读已发布公告弹窗提醒。
- 公告管理页采用 portal 弹窗创建/编辑公告，避免受内容层裁切；公告列表改为紧凑表格，展示标题、内容预览、发布状态和操作。
- System Settings 页面采用 dashboard 化分组卡片，包含搜索、Editable mode、批量保存和 sticky save bar；前端仅展示已被业务逻辑消费的配置项，布尔功能开关使用滑动式 toggle 控件而非原生打勾 checkbox。
- Release 3 借阅功能开关通过 `borrow_enabled` 接入前后端：管理员可全局关闭借阅，普通登录用户通过 feature flags 接口读取开关，前端禁用借阅/确认入口，后端对借阅和确认借阅做强制拦截。
- Release 3 支付宝沙箱接入先建立后端配置层：`backend/config/alipayConfig.js` 统一读取启用状态、沙箱/生产模式、APP_ID、应用私钥、支付宝公钥、网关、notify/return URL、签名和超时配置；本地测试默认使用 `localhost:3001` notify URL 和 `localhost:5173` return URL，启动时只输出安全摘要和缺失项。
- 支付宝 key 配置层兼容完整 PEM 和支付宝沙箱常见的一行 base64 key body：后端会自动补齐 `BEGIN/END PRIVATE KEY` 或 `BEGIN/END PUBLIC KEY` 包装并按 64 字符换行；签名层在 RSA2 (`RSA-SHA256`) 下会同时尝试 PKCS#8 `PRIVATE KEY` 与 PKCS#1 `RSA PRIVATE KEY` 私钥容器，避免 Node `crypto` 因 key 格式报 `DECODER routines::unsupported`。
- Release 3 支付宝沙箱收银台链接由 `backend/services/alipayClient.js` 生成：后端使用应用私钥按 `alipay.trade.page.pay` 参数排序签名生成浏览器收银台链接，同时调用 `alipay.trade.precreate` 获取支付宝专用短二维码内容，避免把超长 page-pay URL 直接编码成难以扫描的二维码；已启用支付宝沙箱时 precreate 失败会阻止创建订单，已有 pending 旧订单会在复用前刷新二维码；配置未启用或缺失时保留本地 `/payment-result` 模拟链接作为课程演示兜底。`/api/payments/alipay/notify` 已支持表单回调解析和支付宝公钥验签，验签通过且交易成功后复用统一支付完成逻辑。
- Release 3 支付宝沙箱订单状态同步支持主动查询：当 `GET /api/payments/:id` 或 `GET /api/payments/trade/:out_trade_no` 读取 pending 订单且支付宝配置完整时，后端会调用 `alipay.trade.query` 同步沙箱交易状态；`TRADE_SUCCESS/TRADE_FINISHED` 会完成罚款支付，`TRADE_CLOSED` 会过期本地订单，查询失败时保留本地状态以避免前端轮询中断。
- Release 3 支付宝模拟支付接口新增 `payments` 表，Fine Records 页面区分 Estimated Fine 与 Payable Fine：未归还逾期记录只展示预计罚款，只有 `returning/returned` 且未支付的实际罚款能创建支付单；支付面板展示二维码和本地可打开的模拟收款链接，并每 2.5 秒轮询订单状态，`paid` 自动刷新罚款记录并在二维码上叠加 `public/打勾.png` 完成标记、`expired` 提示重新创建订单；模拟支付成功按钮受 `ALIPAY_MODE=sandbox` / `ALIPAY_SIMULATION_ENABLED` 控制，模拟成功后再标记支付单和关联罚款为 `paid`；同一批罚款复用 pending 订单，expired 订单不能模拟成功，paid 订单不能过期，管理员/图书管理员可通过 Income Dashboard 查看收入汇总、订单列表并过期待支付订单。
- My Borrow Records 的罚款弹窗使用 React portal 渲染到 `document.body`，避免被借阅记录容器宽度或滚动上下文影响；罚款列表使用覆盖基础 `modal-content` 宽度限制的宽屏专用 modal 和可横向滚动的固定列宽表格，保证大量记录、长书名、Estimated/Unpaid 状态不会挤压成窄列。
- Books 列表卡片在副本明细异步加载前回退使用书籍 `available_copies` 缓存值展示可用状态，避免加载中把全部书籍误显示为 Borrowed。
- Books 页面在搜索、分类和可用性筛选后按每页 12 本进行前端分页，只向 `BookList` 传入当前页数据，减少列表副本详情加载压力；`Reserved` 快捷筛选按当前用户 `active` / `pending` 预约记录匹配图书，预约取消后无需整页刷新即可更新筛选结果。
- Books 页面搜索栏使用统一图标搜索按钮，按钮与输入框同排对齐，点击后按当前标题、作者或 ISBN 关键词重新查询。
- Category Management 页面采用更窄的左侧创建/搜索卡片和更宽的右侧双栏分类列表布局；分类列表每页展示 8 个条目并提供分页控制，分类名支持悬停查看完整名称，搜索框通过放大镜按钮执行过滤并重置分页，编辑态使用固定按钮列避免 Save/Cancel 被裁切。
- 批量 ISBN 导入错误处理前后端合并展示，覆盖格式错误、重复记录、OpenLibrary 查询失败和数据库写入失败。
- Release 3 ISBN 导入支持可选查询节点：后端统一管理 OpenLibrary、Google Books 和 ShowAPI ISBN provider，前端 Add New Book 提供节点选择、可用性测试、延迟/错误展示，并将单本查询和批量预览都路由到选定节点。
- ShowAPI ISBN 返回值按系统书籍模型归一化，包含 `gist -> description`、`img -> cover_image`、`pubdate -> publish_date`、`page -> page_count`；当前模型未覆盖的 provider 专有字段不落库。
- 后端 ISBN provider 出站请求支持自动代理：`BACKEND_PROXY_MODE=auto` 时检测 `BACKEND_PROXY_HOST:BACKEND_PROXY_PORT`，代理可用则通过 `undici.ProxyAgent` 使用代理，不可用则回退默认网络。
- Release 3 邮件功能通过 `backend/config/emailConfig.js`、`backend/services/emailService.js` 和 `backend/services/emailVerificationService.js` 接入 QQ 邮箱 SMTP：支持 `EMAIL_MODE=log` 本地演示和 `EMAIL_MODE=smtp` 真实发信，注册成功、密码重置请求和预约到书通知会写入 `email_logs` 并在启用时发送邮件；注册和重置密码需要 6 位邮箱验证码，验证码哈希保存到 `email_verification_codes`、10 分钟过期且验证后失效；管理员可通过系统接口查看配置状态并发送测试邮件，System Settings 右侧 Email Test 卡片提供前端触发入口。
- 批量 ISBN 导入错误处理前后端合并展示，覆盖格式错误、重复记录、ISBN provider 查询失败和数据库写入失败。

## 2. 前端设计

### 2.1 目录结构

```
src/
├── components/       # 可复用组件
│   ├── Books/        # 书籍相关组件
│   │   ├── BookList.jsx      # 书籍列表
│   │   ├── AddBookForm.jsx    # 添加书籍表单
│   │   ├── EditBookForm.jsx   # 编辑书籍表单
│   │   ├── BookDetail.jsx     # 书籍详情页
│   │   ├── SkeletonLoader.jsx # 加载骨架屏
│   │   └── Books.css          # 书籍组件样式
│   ├── Borrow/       # 借阅相关组件
│   │   ├── BorrowRecords.jsx  # 借阅记录
│   │   ├── UserBorrowRecords.jsx  # 用户借阅记录
│   │   └── Borrow.css         # 借阅组件样式
│   ├── Login/        # 登录组件
│   │   ├── Login.jsx          # 登录表单
│   │   └── Login.css          # 登录组件样式
│   ├── Sidebar/      # 侧边栏组件
│   │   ├── Sidebar.jsx        # 侧边栏
│   │   └── Sidebar.css        # 侧边栏样式
│   ├── Toast/        # 消息通知组件
│   │   ├── Toast.jsx          # 消息通知
│   │   └── Toast.css          # 消息通知样式
│   ├── Users/        # 用户相关组件
│   │   ├── UserList.jsx       # 用户列表
│   │   ├── AddUserForm.jsx    # 添加用户表单
│   │   ├── EditUserForm.jsx   # 编辑用户表单
│   │   └── Users.css          # 用户组件样式
│   ├── layout/       # 布局组件
│   │   └── MainLayout.jsx     # 主布局
│   └── ProtectedRoute.jsx  # 路由保护
├── context/          # 上下文管理
│   ├── AuthContext.jsx     # 认证上下文
│   └── ToastContext.jsx    # 消息通知上下文
├── hooks/            # 自定义钩子
│   └── useApiRequest.jsx   # API请求处理
├── pages/            # 页面组件
│   ├── AnnouncementManagementPage.jsx  # 公告管理
│   ├── AnnouncementManagementPage.css  # 公告管理样式
│   ├── AnnouncementsPage.jsx           # 公告列表
│   ├── BookDetailsPage.jsx             # 书籍详情
│   ├── BookManagementPage.jsx          # 书籍管理
│   ├── BooksPage.jsx                   # 书籍列表
│   ├── BorrowRecordsPage.jsx           # 借阅记录
│   ├── CategoryManagementPage.jsx      # 分类管理
│   ├── IncomeDashboardPage.jsx         # 收入 dashboard
│   ├── LogsPage.jsx                    # 系统日志
│   ├── NotificationsPage.jsx           # 站内通知
│   ├── NotificationsPage.css           # 站内通知样式
│   ├── ProfilePage.jsx                 # 个人资料
│   ├── ReservationsPage.jsx            # 预约管理
│   ├── ReturnApprovalPage.jsx          # 归还审批
│   ├── StatsPage.jsx                   # 统计分析
│   ├── SystemSettingsPage.jsx          # 系统设置
│   └── UserManagementPage.jsx          # 用户管理
├── styles/           # 样式文件
│   ├── global.css    # 全局样式
│   └── variables.css # CSS变量
├── utils/            # 工具函数
│   └── api.js        # API调用封装
├── config/           # 配置文件
│   └── privacy.js    # 隐私配置
├── App.jsx           # 主应用组件
├── App.css           # 应用样式
├── main.jsx          # 应用入口
├── index.css         # 全局基础样式
└── assets/           # 静态资源
    └── react.svg     # React图标
```

### 2.2 核心组件设计

#### 2.2.1 布局组件

**MainLayout.jsx**
- **功能**：应用主布局，包含侧边栏和内容区域
- **结构**：
  - 侧边栏（Sidebar）
  - 顶部导航栏
  - 内容区域（动态路由内容）
- **特点**：响应式设计，支持移动端适配

#### 2.2.2 路由保护

**ProtectedRoute.jsx**
- **功能**：保护需要认证的路由
- **逻辑**：
  - 检查用户是否登录
  - 检查用户角色权限
  - 未登录用户重定向到登录页
  - 权限不足用户重定向到对应页面

#### 2.2.3 认证管理

**AuthContext.jsx**
- **功能**：全局认证状态管理
- **状态**：
  - isAuthenticated：是否认证
  - user：用户信息
  - loading：加载状态
- **方法**：
  - login：登录
  - logout：登出
  - updateUser：更新用户信息
- **登录页表单校验**：
  - 登录表单校验用户名和密码
  - 注册表单校验用户名、密码、姓名和邮箱
  - 找回密码表单校验邮箱/手机号至少一项和格式
  - 重置密码表单校验新密码、确认密码一致性和 reset token
  - 字段级错误以内联提示展示，提交前拦截无效输入

#### 2.2.4 消息通知

**ToastContext.jsx**
- **功能**：全局消息通知管理
- **状态**：
  - toasts：消息列表
- **方法**：
  - addToast：添加消息
  - removeToast：移除消息

### 2.3 页面设计

| 页面名称 | 路径 | 权限 | 主要功能 |
|----------|------|------|----------|
| 登录页 | /login | 无 | 用户登录 |
| 书籍列表 | /books | user | 浏览书籍、搜索、借阅 |
| 书籍详情 | /books/:id | user | 查看书籍详情、副本信息；从记录页进入时 Back 返回来源页 |
| 个人借阅记录 | /borrow-records | user | 查看个人借阅记录、点击记录跳转图书详情、归还书籍、查看罚款 |
| 个人资料 | /profile | user | 查看和更新个人信息、查看罚款、支付罚款 |
| 公告列表 | /announcements | user | 查看系统公告，点击公告弹窗展示完整公告信息 |
| 书籍管理 | /book-management | admin/librarian | 管理书籍（增删改查）、ISBN导入、批量导入、副本位置管理 |
| 用户管理 | /users | admin/librarian | 管理用户（增删改查）、搜索和分页 |
| 用户借阅记录 | /user-borrow-records/:userId | admin/librarian | 查看用户借阅记录、搜索过滤分页，点击记录跳转图书详情 |
| 归还审批 | /return-approval | admin/librarian | 审批书籍归还、一键批量审批、搜索过滤分页 |
| 分类管理 | /category-management | admin/librarian | 管理图书分类 |
| 预约管理 | /reservations | user | 管理书籍预约、搜索过滤分页，点击预约记录跳转图书详情 |
| 公告管理 | /announcement-management | admin | 管理系统公告 |
| 系统设置 | /system-settings | admin | 管理已实现的借阅开关、借阅、续借和罚款参数（分组卡片、批量保存、显示默认值） |
| 系统日志 | /logs | admin | 查看系统操作日志、搜索过滤分页 |
| 统计分析 | /stats | user | 查看借阅统计数据 |

### 2.4 状态管理

**Context API + Hooks**
- **AuthContext**：管理认证状态
- **ToastContext**：管理消息通知
- **组件级状态**：使用useState管理组件内部状态
- **API请求状态**：使用useApiRequest自定义hook管理API请求状态

### 2.5 样式设计

**CSS变量 + 模块化样式**
- **variables.css**：定义全局CSS变量
- **global.css**：全局样式、重置和跨页面共享 UI 样式（如 history toolbar/pagination）
- **组件样式**：每个组件独立的CSS文件
- **响应式设计**：使用媒体查询适配不同屏幕尺寸

### 2.6 用户体验设计

- **加载状态**：使用SkeletonLoader显示加载骨架屏
- **消息通知**：使用Toast组件显示操作结果
- **动画效果**：使用Framer Motion添加平滑过渡动画
- **表单验证**：实时表单验证和错误提示
- **权限控制**：基于角色的权限控制和界面展示

## 3. 后端设计

### 3.1 目录结构

```
backend/
├── controllers/      # 控制器
│   ├── announcementController.js  # 公告控制器
│   ├── bookController.js          # 书籍控制器
│   ├── borrowController.js        # 借阅控制器
│   ├── categoryController.js      # 分类控制器
│   ├── logController.js           # 日志控制器
│   ├── notificationController.js  # 站内通知控制器
│   ├── paymentController.js       # 支付控制器
│   ├── statsController.js         # 统计控制器
│   ├── systemController.js        # 系统控制器
│   └── userController.js          # 用户控制器
├── config/           # 后端运行配置
│   └── alipayConfig.js            # 支付宝沙箱/生产配置
├── middleware/       # 中间件
│   ├── auth.js       # 认证中间件
│   ├── error.js      # 错误处理中间件
│   └── validation.js # 验证中间件
├── routes/           # 路由
│   ├── announcementRoutes.js  # 公告路由
│   ├── bookRoutes.js          # 书籍路由
│   ├── borrowRoutes.js        # 借阅路由
│   ├── categoryRoutes.js      # 分类路由
│   ├── logRoutes.js           # 日志路由
│   ├── notificationRoutes.js  # 站内通知路由
│   ├── paymentRoutes.js       # 支付路由
│   ├── statsRoutes.js         # 统计路由
│   ├── systemRoutes.js        # 系统路由
│   └── userRoutes.js          # 用户路由
├── server.js         # 服务器入口
├── db.js             # 数据库初始化
├── package.json      # 依赖配置
└── .env.example      # 环境变量示例
```

### 3.2 核心模块设计

#### 3.2.1 认证模块

**auth.js** 中间件
- **功能**：验证JWT token，检查用户权限
- **逻辑**：
  - 从请求头获取token
  - 验证token有效性
  - 解析用户信息
  - 检查用户权限
  - 将用户信息添加到请求对象

**userController.js**
- **功能**：处理用户相关操作
- **方法**：
  - login：用户登录
  - register：用户注册
  - getUserById：获取用户信息
  - getAllUsers：获取所有用户
  - addUser：添加用户
  - updateUser：更新用户信息
  - deleteUser：删除用户
  - getUserBorrowRecords：获取用户借阅记录
  - blockUser：拉黑用户
  - unblockUser：解除拉黑
  - requestPasswordReset：请求密码重置
  - resetPassword：重置密码

#### 3.2.2 书籍模块

**bookController.js**
- **功能**：处理书籍相关操作
- **方法**：
  - getAllBooks：获取书籍列表
  - getBookById：获取书籍详情
  - addBook：添加书籍
  - updateBook：更新书籍信息
  - deleteBook：删除书籍
  - searchBooks：搜索书籍
  - getPopularBooks：获取热门书籍
  - exportBooks：导出书籍信息
  - getBookCopies：获取书籍的所有副本
  - addBookCopy：新增副本并自动生成 copy_code
  - getCopyById：获取单个副本信息
  - updateCopyStatus：更新副本状态
  - deleteBookCopy：删除单个可用副本
  - getIsbnProviders：获取 ISBN 查询节点列表
  - testIsbnProvider：测试指定 ISBN 查询节点可用性
  - searchByISBN：通过选定 ISBN provider 查询书籍信息
  - batchAddBooks：批量导入书籍
  - updateCopyLocation：更新副本位置信息

**categoryController.js**
- **功能**：处理分类相关操作
- **方法**：
  - getAllCategories：获取分类列表
  - getCategoryById：获取单个分类
  - createCategory：创建分类
  - updateCategory：更新分类
  - deleteCategory：删除分类
  - getBookCategories：获取图书的分类
  - addBookCategory：为图书添加分类
  - removeBookCategory：从图书中移除分类

#### 3.2.3 借阅模块

**borrowController.js**
- **功能**：处理借阅相关操作
- **方法**：
  - borrowBook：借阅书籍（开始借阅流程）
  - returnBook：归还书籍（计算逾期罚款）
  - confirmBorrow：确认借阅
  - handleTimeoutBorrows：处理超时借阅
  - approveReturn：审批归还请求（确认归还、释放副本、触发预约通知）
  - approveAllReturns：一键审批所有待归还请求（支持按日期筛选）
  - getBorrowingList：获取借阅中列表
  - getReturningList：获取待审批的归还请求列表
  - reserveBook：预约图书
  - getUserReservations：获取用户的预约记录
  - renewBook：续借图书
  - cancelReservation：取消预约
  - getUserFines：获取用户罚款历史记录（未支付优先）
  - payFine：支付所有未支付罚款

#### 3.2.4 系统模块

**systemController.js**
- **功能**：处理系统相关操作
- **方法**：
  - getSystemSettings：获取系统设置
  - getFeatureFlags：获取普通登录用户可见的功能开关
  - updateSystemSettings：更新系统设置

**logController.js**
- **功能**：处理系统日志
- **方法**：
  - getSystemLogs：获取系统日志
  - clearSystemLogs：清除系统日志
  - addLog：添加系统日志

**announcementController.js**
- **功能**：处理公告相关操作
- **方法**：
  - getAllAnnouncements：获取公告列表
  - getAnnouncementById：获取单个公告
  - getUnreadAnnouncements：获取当前登录用户未读公告
  - markAnnouncementsRead：标记单个或多个公告已读
  - createAnnouncement：创建公告
  - updateAnnouncement：更新公告
  - deleteAnnouncement：删除公告

**notificationController.js**
- **功能**：处理站内通知
- **方法**：
  - getUserNotifications：获取用户通知列表
  - getUnreadCount：获取未读通知数量
  - markAsRead：标记单条通知已读
  - markAllAsRead：标记用户全部通知已读

#### 3.2.5 统计模块

**statsController.js**
- **功能**：处理统计相关操作
- **方法**：
  - getBorrowStats：获取借阅统计
  - getMonthlyStats：获取月度借阅统计
  - getPopularBooksStats：获取热门图书统计

### 3.3 数据库设计

**详细数据库设计请参考 `DATABASE_DOC.md`**

### 3.4 路由设计

| 模块 | 路由前缀 | 主要接口 |
|------|----------|----------|
| 用户管理 | /api/users | 登录、注册、用户CRUD、状态管理 |
| 书籍管理 | /api/books | 书籍CRUD、副本新增、状态管理、条形码、ISBN provider 查询与测试、ISBN导入、批量导入、位置管理 |
| 借阅管理 | /api/borrow | 借阅、归还、预约、续借、罚款管理、批次审批 |
| 分类管理 | /api/categories | 分类CRUD、图书分类关联 |
| 系统管理 | /api/system | 系统设置（支持部分更新和缺失 key upsert）、当前用户可见功能开关 |
| 公告管理 | /api/announcements | 公告CRUD、当前用户未读公告、公告已读记录 |
| 站内通知 | /api/notifications | 预约可借通知、未读数量、标记已读 |
| 日志管理 | /api/logs | 系统日志 |
| 统计分析 | /api/stats | 各种统计数据 |

### 3.5 安全设计

- **密码加密**：使用bcrypt对密码进行哈希处理
- **JWT认证**：使用jsonwebtoken进行身份验证
- **JWT密钥保护**：生产环境缺少 `JWT_SECRET` 时拒绝启动；开发环境仅生成临时随机密钥
- **输入验证**：对所有用户输入进行验证
- **SQL注入防护**：使用参数化查询
- **CORS配置**：正确配置CORS策略
- **权限控制**：基于角色的权限控制
- **默认账号控制**：生产环境默认不插入示例账号，演示环境需显式启用 `SEED_DEFAULT_USERS`
- **危险操作护栏**：删除用户、删除书籍、删除副本和减少副本数量都由后端做完整性校验，不只依赖前端确认
- **活跃借阅状态**：`borrowing`、`borrowed`、`overdue`、`returning` 均视为活跃状态，用于阻止用户删除、书籍删除和重复借阅
- **删除用户限制**：禁止删除当前账号、管理员账号、存在活跃借阅记录或存在 `active` / `pending` 预约记录的用户
- **删除书籍限制**：存在活跃借阅记录、活跃预约，或存在 `borrowing`、`borrowed`、`reserved` 状态副本时禁止删除
- **副本库存一致性**：单副本删除只能删除 `available` 副本且必须保留至少一个副本；新增、删除或状态变化后会在事务中重新计算 `books.total_copies` 与 `books.available_copies`
- **日志清理校验**：系统日志清理会校验 `days` 范围后再执行删除，避免非法参数触发非预期清理

### 3.6 错误处理

**error.js** 中间件
- **功能**：统一处理系统错误
- **逻辑**：
  - 捕获所有错误
  - 格式化错误响应
  - 记录错误日志
  - 返回适当的错误状态码

## 4. 系统流程

### 4.1 用户认证流程

1. 用户访问登录页面
2. 输入用户名和密码
3. 前端校验用户名和密码格式
4. 前端发送登录请求到 `/api/users/login`
5. 后端验证用户凭据
6. 生成JWT token并返回
7. 前端存储token到本地存储
8. 重定向到首页

### 4.2 书籍借阅流程

1. 用户浏览书籍列表
2. 选择要借阅的书籍
3. 点击借阅按钮
4. 前端发送借阅请求到 `/api/borrow/borrow`
5. 后端读取 `borrow_enabled`，如果借阅功能已关闭则返回 403，停止借阅流程
6. 后端检查用户状态（是否拉黑）、罚款状态、借阅数量限制
7. 从系统设置读取 borrow_period_days、borrow_confirm_minutes、max_borrows 等参数
8. 检查书籍是否存在可用副本，但不预先绑定副本
9. 创建借阅记录，`copy_id` 和 `copy_code` 暂为空，状态为 "borrowing"，设置确认截止时间
10. 返回借阅请求启动成功响应
11. 前端显示倒计时和确认借阅按钮，不在记录表提前显示条形码；确认弹窗中的倒计时来自 `confirm_deadline`，关闭弹窗不会清空待确认记录或倒计时状态
12. 用户点击确认借阅按钮并在弹窗中选择可用副本；确认接口也会再次检查 `borrow_enabled`
13. 前端发送 `record_id` 和 `copy_id` 到 `/api/borrow/confirm-borrow`
14. 后端校验当前用户是否为记录本人、管理员或图书管理员，再检查是否超时，并校验所选副本是否属于该书且可用
15. 更新借阅记录状态为 "borrowed"，写入 `copy_id`
16. 更新副本状态为 "borrowed"
17. 返回确认成功响应
18. 前端刷新记录并显示条形码

**确认弹窗取消语义**：
- `Cancel Lock` 会调用 `/api/borrow/cancel-borrow-lock`，将待确认记录置为 "timeout"，并释放兼容旧数据时可能已锁定的副本。
- `Not Now` 和右上角关闭按钮只隐藏弹窗，保留待确认记录；用户从书籍列表、书籍详情或借阅记录再次打开时继续展示剩余倒计时。

**超时处理**：
- 如果用户在确认截止时间内未确认，系统会自动处理超时
- 借阅记录状态变为 "timeout"
- 因待确认阶段不绑定副本，通常无需释放副本；兼容旧数据时会释放已预选副本

### 4.3 书籍归还与罚款流程

1. 用户访问个人借阅记录页面
2. 选择要归还的书籍
3. 点击归还按钮
4. 前端发送归还请求到 `/api/borrow/return`
5. 后端检查借阅记录（支持 borrowed 和 overdue 状态）
6. 从系统设置读取 fine_per_day 计算逾期罚款，并按 max_fine 限制单条记录最高金额（0 表示不封顶）
7. 更新借阅记录状态为 "returning"，设置罚款金额和 fine_status='unpaid'
8. 如果产生罚款，立即累计到用户 total_fine，用户可马上支付
9. 返回归还成功响应，包含罚款信息
10. 用户可在个人资料、借阅记录或罚款详情中查看并支付罚款，无需等待归还审批
11. 用户通过 pay fine 功能一次性支付所有未支付罚款，系统标记相关记录 fine_status='paid' 并同步 total_fine
12. 图书管理员在归还审批页面查看待审批请求
13. 管理员批准归还（可单条或一键批量审批，支持按日期筛选）
14. 后端更新借阅记录状态为 "returned"，不会重复累计已入账罚款
15. 副本状态变回 "available"

### 4.4 书籍预约流程

1. 用户查看书籍详情
2. 如果所有副本均已借出，可点击预约按钮
3. 系统创建预约记录，状态为 `active`，并将 `notification_sent` 置为 `0`
4. 当归还审批、新增副本或副本状态恢复 available 使该书存在可用副本时，后端重新计算 `available_copies`
5. 如果该书存在未通知的有效预约，系统写入 `notifications` 并更新 `notification_sent = 1`
6. Reader 侧边栏通过 NotificationContext 显示未读通知数量，用户进入 `/notifications` 查看并标记已读
7. 单条/全部已读操作会更新共享 unread count，使侧边栏 badge 立即同步

### 4.5 公告提醒流程

1. 管理员在 `/announcement-management` 通过弹窗创建或编辑公告
2. 已发布公告对用户可见
3. 用户登录并进入受保护布局后，MainLayout 请求 `/api/announcements/unread/mine`
4. 如果存在未读已发布公告，前端展示公告弹窗
5. 用户点击确认后，前端调用 `/api/announcements/read` 写入 `announcement_reads`
6. 已读公告不会再次触发弹窗提醒

## 5. 性能优化

### 5.1 前端优化

1. **代码分割**：使用React.lazy和Suspense实现代码分割
2. **组件缓存**：使用React.memo缓存组件
3. **状态管理优化**：合理使用Context和useState
4. **API请求优化**：使用useApiRequest统一管理请求状态
5. **图片优化**：使用适当的图片格式和大小
6. **样式优化**：使用CSS变量和CSS-in-JS

### 5.2 后端优化

1. **数据库索引**：为常用查询字段创建索引
2. **查询优化**：使用JOIN操作减少查询次数
3. **缓存策略**：对频繁访问的数据使用缓存
4. **批量操作**：支持批量添加、删除等操作
5. **连接池**：使用数据库连接池
6. **中间件优化**：合理使用中间件，避免过多的中间件嵌套

## 6. 部署与运维

### 6.1 前端部署

1. **构建**：`npm run build`
2. **构建清理**：`prebuild` 会先执行 `scripts/clean-dist.mjs` 清理旧 `dist`
3. **部署**：将dist目录部署到静态文件服务器
4. **环境变量**：配置生产环境的API地址

### 6.2 后端部署

1. **依赖安装**：`npm install`
2. **环境配置**：设置生产环境的环境变量，尤其是 `JWT_SECRET`、`FRONTEND_URL` 和 `SEED_DEFAULT_USERS`
3. **启动**：使用PM2或其他进程管理工具启动
4. **监控**：设置日志监控和错误告警

### 6.3 数据库维护

1. **备份**：定期备份数据库文件
2. **清理**：定期清理过期数据和日志
3. **优化**：定期运行数据库优化工具

## 7. 扩展性设计

### 7.1 功能扩展

- **书籍推荐系统**：基于用户借阅历史推荐书籍
- **多语言支持**：添加国际化支持
- **移动端应用**：开发React Native或Flutter应用
- **扫码功能**：添加扫码借书还书功能
- **支付系统生产化**：完善真实生产支付、对账、退款和异常订单处理

### 7.2 技术扩展

- **数据库迁移**：支持从SQLite迁移到PostgreSQL或MySQL
- **微服务架构**：将系统拆分为多个微服务
- **容器化部署**：使用Docker和Kubernetes部署
- **CI/CD**：配置持续集成和持续部署

## 8. 总结

图书馆管理系统采用了现代化的前后端分离架构，使用React 19和Express 5构建，具有完整的功能和良好的用户体验。系统支持多角色权限管理，实现了书籍管理、借阅管理、用户管理等核心功能，并提供了统计分析、系统设置等高级功能。

系统设计考虑了可扩展性和可维护性，采用了模块化的代码结构和清晰的数据流管理。通过合理的数据库设计和API设计，确保了系统的性能和可靠性。

未来可以通过添加更多功能和优化现有功能，进一步提升系统的用户体验和管理效率。
