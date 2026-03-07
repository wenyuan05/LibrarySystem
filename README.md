# 图书馆管理系统开发文档

## 项目概述

图书馆管理系统是一个基于React和Node.js的Web应用，用于管理图书馆的书籍信息，包括添加、查询、借阅和归还书籍等功能。系统支持用户认证、管理员权限管理、个人借阅记录查询等功能。

## 技术栈

- **前端**：React (via Vite)
- **后端**：Node.js + Express
- **数据库**：SQLite
- **通信**：REST API
- **开发模式**：Agile-style development (Vibe-Coding)

## 项目结构

```
LibrarySystem/
├── src/                # 前端源代码
│   ├── components/     # 组件目录
│   │   ├── Books/      # 书籍管理组件
│   │   ├── Borrow/     # 借阅记录组件
│   │   ├── Login/      # 登录组件
│   │   ├── Sidebar/    # 侧边栏组件
│   │   └── Users/      # 用户管理组件
│   ├── context/        # 上下文管理
│   │   └── AuthContext.jsx  # 认证上下文
│   ├── styles/         # 样式文件
│   │   ├── global.css  # 全局样式
│   │   └── variables.css  # CSS变量
│   ├── utils/          # 工具函数
│   │   └── api.js      # API调用封装
│   ├── App.jsx         # 主应用组件
│   ├── App.css         # 应用样式
│   ├── main.jsx        # 应用入口
│   └── assets/         # 静态资源
├── backend/            # 后端代码
│   ├── server.js       # 后端服务器
│   ├── db.js           # 数据库初始化
│   ├── package.json    # 后端依赖
│   └── library.db      # SQLite数据库文件
├── package.json        # 前端依赖
├── vite.config.js      # Vite配置
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

## API文档

### 用户管理

#### POST /api/login

用户登录（返回 JWT）

**请求体**：
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**：
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "name": "Admin User",
  "email": "admin@example.com",
  "token": "<JWT_TOKEN>"
}
```

#### 通用认证说明

除 `/api/login` 外，其他需要登录的接口都必须在 HTTP 头中携带 JWT：

```http
Authorization: Bearer <JWT_TOKEN>
```

管理员专用接口需要用户角色为 `admin`。

#### GET /api/users

获取所有用户列表（管理员）

需要管理员权限。

**响应**：
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  {
    "id": 2,
    "username": "user1",
    "role": "user",
    "name": "John Doe",
    "email": "user1@example.com"
  }
]
```

#### POST /api/users

添加新用户（管理员）

需要管理员权限。

**请求体**：
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "user",
  "name": "New User",
  "email": "newuser@example.com"
}
```

**响应**：
```json
{
  "id": 3,
  "username": "newuser",
  "role": "user",
  "name": "New User",
  "email": "newuser@example.com"
}
```

#### PUT /api/users/:id

更新用户信息

**请求体**：
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**响应**：
```json
{
  "id": 2,
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### DELETE /api/users/:id

删除用户（管理员）

需要管理员权限。

**响应**：
```json
{
  "message": "User deleted"
}
```

### 书籍管理

#### GET /api/books

获取所有书籍列表

**响应**：
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "status": "available"
  }
]
```

#### GET /api/books/:id

获取单本书籍详情

**响应**：
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "status": "available"
}
```

#### POST /api/books

添加新书籍

**请求体**：
```json
{
  "title": "New Book",
  "author": "Author Name",
  "isbn": "1234567890"
}
```

**响应**：
```json
{
  "id": 4,
  "title": "New Book",
  "author": "Author Name",
  "isbn": "1234567890",
  "status": "available"
}
```

#### PUT /api/books/:id

更新书籍状态

**请求体**：
```json
{
  "status": "borrowed"
}
```

**响应**：
```json
{
  "id": 1,
  "status": "borrowed"
}
```

#### DELETE /api/books/:id

删除书籍

**响应**：
```json
{
  "message": "Book deleted"
}
```

### 借阅管理

#### GET /api/users/:id/borrow-records

获取用户借阅记录（本人或管理员）

**说明**：
- 普通用户只能查看自己的借阅记录；
- 管理员可以查看任意用户的借阅记录。

**响应**：
```json
[
  {
    "id": 1,
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "borrow_date": "2024-01-01",
    "return_date": null
  }
]
```

#### POST /api/borrow

借阅书籍

**请求体**：
```json
{
  "user_id": 2,
  "book_id": 1
}
```

**响应**：
```json
{
  "id": 2,
  "user_id": 2,
  "book_id": 1,
  "borrow_date": "2024-01-02"
}
```

#### POST /api/return

归还书籍

**请求体**：
```json
{
  "user_id": 2,
  "book_id": 1
}
```

**响应**：
```json
{
  "message": "Book returned successfully",
  "return_date": "2024-01-10"
}
```

## 功能说明

### 前端功能

1. **用户认证**：登录界面，支持管理员和普通用户登录
2. **侧边栏**：折叠式侧边栏，显示用户个人信息和导航菜单
3. **书籍管理**：
   - 书籍列表展示
   - 添加新书籍（包含ISBN格式验证和重复检查）
   - 借阅和归还书籍
   - 删除书籍（管理员）
4. **用户管理**：
   - 用户列表展示（管理员）
   - 添加新用户（包含用户名重复检查和表单验证）
   - 编辑用户信息
   - 删除用户（管理员）
5. **借阅记录**：
   - 个人借阅记录查询
   - 借阅历史查看
6. **数据验证**：
   - 表单字段验证
   - 数据格式检查
   - 重复数据提示

### 后端功能

1. **数据库初始化**：自动创建SQLite数据库和表结构，并插入示例数据
2. **API接口**：提供完整的CRUD操作接口，用于前端与数据库交互
3. **用户认证**：验证用户登录信息
4. **借阅管理**：处理书籍借阅和归还逻辑，更新书籍状态和借阅记录
5. **用户管理**：处理用户信息的增删改查
6. **数据去重**：
   - 书籍ISBN唯一检查
   - 用户名唯一检查
   - 数据库唯一索引约束
7. **数据验证**：
   - API请求参数验证
   - 数据完整性检查
   - 错误处理和提示

## 开发指南

### 前端开发

1. **组件结构**：使用React函数组件和Hooks管理状态
2. **状态管理**：使用React Context API管理全局认证状态
3. **API调用**：使用封装的API工具函数与后端通信
4. **样式**：使用CSS变量和模块化样式，支持响应式布局
5. **用户体验**：添加加载状态、错误提示和动画效果
6. **数据验证**：
   - 表单字段必填检查
   - 数据格式验证（如ISBN、邮箱格式）
   - 实时错误提示
   - 重复数据处理

### 后端开发

1. **服务器配置**：使用Express创建RESTful API
2. **数据库操作**：使用SQLite3进行数据库操作
3. **中间件**：使用CORS中间件处理跨域请求
4. **事务处理**：在借阅和归还操作中使用事务确保数据一致性
5. **数据去重**：
   - 数据库唯一索引约束
   - API层面的重复检查
   - 错误处理和提示
6. **数据验证**：
   - 请求参数验证
   - 数据完整性检查
   - 规范化的错误响应

## 示例数据

系统初始化时会自动添加以下示例数据：

### 书籍
1. **The Great Gatsby** - F. Scott Fitzgerald (ISBN: 9780743273565)
2. **1984** - George Orwell (ISBN: 9780451524935)
3. **To Kill a Mockingbird** - Harper Lee (ISBN: 9780061120084)

### 用户
1. **管理员**：用户名 admin，密码 admin123
2. **普通用户**：用户名 user1，密码 user123

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

## 扩展建议

1. 添加书籍分类和搜索功能
2. 实现前端路由，添加更多页面
3. 优化用户界面，添加更多动画效果
4. 实现书籍预约功能
5. 添加借阅期限和逾期提醒功能
6. 实现数据导出功能
7. 添加多语言支持

## 许可证

MIT License