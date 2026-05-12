# 图书馆管理系统API接口文档

## 1. 接口概览

| 模块 | 主要功能 | 接口数量 |
|------|----------|----------|
| 用户管理 | 用户认证、信息管理、状态管理 | 12 |
| 书籍管理 | 书籍CRUD、分类管理、ISBN导入、副本条形码与位置管理 | 19 |
| 借阅管理 | 借阅、归还、预约、续借、罚款管理 | 14 |
| 系统管理 | 系统设置、公告、日志 | 8 |
| 统计分析 | 借阅统计、用户统计 | 5 |

## 2. 认证机制

### 2.1 JWT认证
- **认证方式**：Bearer Token
- **Header格式**：`Authorization: Bearer <token>`
- **Token有效期**：7天
- **刷新机制**：无自动刷新，过期后需重新登录

### 2.2 权限控制
- **user**：普通用户，只能操作自己的信息和借阅记录
- **librarian**：图书管理员，可管理书籍、借阅和用户
- **admin**：系统管理员，拥有所有权限

## 3. 接口详情

### 3.1 用户管理接口

#### 3.1.1 POST /api/users/login
**功能**：用户登录

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

#### 3.1.2 POST /api/users/register
**功能**：用户注册

**请求体**：
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "New User",
  "email": "newuser@example.com"
}
```

**响应**：
```json
{
  "id": 4,
  "username": "newuser",
  "role": "user",
  "name": "New User",
  "email": "newuser@example.com",
  "token": "<JWT_TOKEN>"
}
```

#### 3.1.3 GET /api/users
**功能**：获取所有用户列表
**权限**：admin/librarian

**响应**：
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": "13800138000",
    "address": "北京市"
  }
]
```

#### 3.1.4 GET /api/users/:id
**功能**：获取用户信息
**权限**：本人或admin/librarian

**响应**：
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "name": "Admin User",
  "email": "admin@example.com",
  "phone": "13800138000",
  "address": "北京市"
}
```

#### 3.1.5 POST /api/users
**功能**：添加用户
**权限**：admin/librarian

**请求体**：
```json
{
  "username": "librarian",
  "password": "librarian123",
  "role": "librarian",
  "name": "Librarian User",
  "email": "librarian@example.com"
}
```

**响应**：
```json
{
  "id": 3,
  "username": "librarian",
  "role": "librarian",
  "name": "Librarian User",
  "email": "librarian@example.com"
}
```

#### 3.1.6 PUT /api/users/:id
**功能**：更新用户信息
**权限**：本人或admin/librarian

**请求体**：
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "13900139000",
  "address": "上海市"
}
```

**响应**：
```json
{
  "id": 2,
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "13900139000",
  "address": "上海市"
}
```

#### 3.1.7 DELETE /api/users/:id
**功能**：删除用户
**权限**：admin/librarian

**响应**：
```json
{
  "message": "User deleted"
}
```

#### 3.1.8 GET /api/users/:id/borrow-records
**功能**：获取用户借阅记录
**权限**：本人或admin/librarian

**响应**：
```json
[
  {
    "id": 1,
    "book_id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "borrow_date": "2024-01-01",
    "due_date": "2024-01-15",
    "return_date": "2024-01-10",
    "status": "returned",
    "fine": 0,
    "fine_status": "paid",
    "copy_id": 1,
    "copy_code": "CP-1-001"
  }
]
```

#### 3.1.9 POST /api/users/:id/block
**功能**：拉黑用户
**权限**：admin/librarian

**响应**：
```json
{
  "message": "User blocked successfully"
}
```

#### 3.1.10 POST /api/users/:id/unblock
**功能**：解除拉黑
**权限**：admin/librarian

**响应**：
```json
{
  "message": "User unblocked successfully"
}
```

#### 3.1.11 GET /api/users/:id/status
**功能**：获取用户状态
**权限**：本人或admin/librarian

**响应**：
```json
{
  "user_id": 1,
  "status": "active"
}
```

#### 3.1.12 POST /api/users/reset-password/request
**功能**：请求密码重置

**请求体**：
```json
{
  "email": "user@example.com"
}
```

**响应**：
```json
{
  "message": "User found. You can now reset your password.",
  "token": "<reset_token>",
  "user": {
    "id": 2,
    "username": "user1",
    "name": "Test User"
  }
}
```

### 3.2 书籍管理接口

#### 3.2.1 GET /api/books
**功能**：获取书籍列表

**查询参数**：
- `search`：搜索关键词
- `category`：分类ID
- `status`：状态

**响应**：
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "status": "available",
    "publisher": "Scribner",
    "publish_date": "1925-04-10",
    "language": "English",
    "page_count": 180
  }
]
```

#### 3.2.2 GET /api/books/:id
**功能**：获取书籍详情

**响应**：
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "status": "available",
  "description": "A classic novel about the American Dream",
  "cover_image": "https://example.com/cover.jpg",
  "total_copies": 1,
  "available_copies": 1,
  "publisher": "Scribner",
  "publish_date": "1925-04-10",
  "language": "English",
  "page_count": 180,
  "categories": ["Literature"]
}
```

#### 3.2.3 POST /api/books
**功能**：添加书籍
**权限**：admin/librarian

**请求体**：
```json
{
  "title": "New Book",
  "author": "Author Name",
  "isbn": "1234567890",
  "description": "Book description",
  "publisher": "Publisher",
  "publish_date": "2024-01-01",
  "language": "Chinese",
  "page_count": 200,
  "categories": [1, 2]
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

#### 3.2.4 PUT /api/books/:id
**功能**：更新书籍信息
**权限**：admin/librarian

**请求体**：
```json
{
  "title": "Updated Title",
  "author": "Updated Author",
  "description": "Updated description",
  "categories": [1, 3]
}
```

**响应**：
```json
{
  "id": 1,
  "title": "Updated Title",
  "author": "Updated Author",
  "isbn": "9780743273565",
  "status": "available"
}
```

#### 3.2.5 DELETE /api/books/:id
**功能**：删除书籍
**权限**：admin/librarian

**响应**：
```json
{
  "message": "Book deleted"
}
```

#### 3.2.6 GET /api/books/search
**功能**：搜索书籍

**查询参数**：
- `q`：搜索关键词

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

#### 3.2.7 GET /api/books/popular
**功能**：获取热门书籍

**响应**：
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "borrow_count": 10
  }
]
```

#### 3.2.8 GET /api/books/export
**功能**：导出书籍信息到CSV
**权限**：admin/librarian

**响应**：
- CSV文件下载

#### 3.2.9 GET /api/books/:book_id/copies
**功能**：获取书籍的所有副本

**响应**：
```json
[
  {
    "id": 1,
    "book_id": 1,
    "copy_code": "CP-1-001",
    "status": "available",
    "location": "Main Shelf"
  }
]
```

#### 3.2.10 POST /api/books/:book_id/copies
**功能**：为指定书籍新增一个副本，并自动生成 `copy_code`
**权限**：admin/librarian

**请求体**：
```json
{
  "location": "Main Shelf"
}
```

**说明**：
- `location` 可选，未传时默认使用 `Main Shelf`
- `copy_code` 按当前书籍已有副本编号递增生成，例如 `CP-1-001`
- 新增成功后会同步更新 `books.total_copies` 与 `books.available_copies`

**响应**：
```json
{
  "id": 4,
  "book_id": 1,
  "copy_code": "CP-1-004",
  "status": "available",
  "location": "Main Shelf"
}
```

#### 3.2.11 GET /api/books/copies/:id
**功能**：获取单个副本信息

**响应**：
```json
{
  "id": 1,
  "book_id": 1,
  "copy_code": "CP-1-001",
  "status": "available",
  "location": "Main Shelf"
}
```

#### 3.2.12 PUT /api/books/copies/:id/status
**功能**：更新副本状态
**权限**：admin/librarian

**请求体**：
```json
{
  "status": "available"
}
```

**响应**：
```json
{
  "id": 1,
  "copy_code": "CP-1-001",
  "status": "available",
  "location": "Main Shelf"
}
```

#### 3.2.13 GET /api/books/isbn/:isbn
**功能**：通过ISBN查询书籍信息（调用OpenLibrary API）
**权限**：admin/librarian

**说明**：
- `cover_image` 优先使用 OpenLibrary 返回的 `cover.large`、`cover.medium`、`cover.small` URL。
- 如仅返回旧式 `cover.id`，会回退为 OpenLibrary cover id URL；没有封面时返回空字符串。
- `publish_date` 会尽量归一为 `YYYY-MM-DD`、`YYYY-MM` 或 `YYYY`；无法解析时保留 OpenLibrary 原始返回值。

**响应**：
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "publish_date": "1925-04-10",
  "language": "English",
  "page_count": 180,
  "cover_image": "https://covers.openlibrary.org/..."
}
```

#### 3.2.14 POST /api/books/batch
**功能**：批量导入书籍
**权限**：admin/librarian

**请求体**：
```json
{
  "books": [
    {
      "title": "Book 1", "author": "Author 1", "isbn": "9780743273565",
      "publisher": "Pub", "publish_date": "2024-01-01", "language": "English",
      "page_count": 200, "total_copies": 2, "location": "Main Shelf", "category_id": 1
    }
  ]
}
```

**说明**：
- `total_copies` 可选，未传时默认创建 1 个副本。
- `location` 可选，未传时默认使用 `Main Shelf`。
- `category_id` 可选；传入时批量导入会同步写入图书分类关联。
- `language` 与 `page_count` 会随导入元数据一起保存；未传时分别默认使用 `Chinese` 与 `0`。
- 前端 Batch Import 页面通过 Copy Settings 统一生成 `total_copies`、`location` 和 `category_id`。
- 接口会等待书籍、分类关联、副本插入和 statement finalize 完成后再提交事务并返回统计结果。

**响应**：
```json
{
  "success": 2,
  "failed": 0,
  "errors": []
}
```

#### 3.2.15 PUT /api/books/copies/:id/location
**功能**：更新副本位置
**权限**：admin/librarian

**请求体**：
```json
{
  "location": "A1-01"
}
```

**响应**：
```json
{
  "message": "Location updated successfully"
}
```

### 3.3 借阅管理接口

#### 3.3.1 POST /api/borrow/borrow
**功能**：借阅书籍（开始借阅流程）

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
  "id": 10,
  "user_id": 2,
  "book_id": 1,
  "copy_id": null,
  "copy_code": null,
  "borrow_date": "2024-01-01",
  "due_date": "2024-01-15",
  "confirm_deadline": "2024-01-01T10:00:00Z",
  "status": "borrowing"
}
```

**说明**：发起借阅时只创建待确认记录，不预先占用副本。具体 `copy_id` 和 `copy_code` 在确认借阅时由前端弹窗选择可用副本后写入。

#### 3.3.2 POST /api/borrow/return
**功能**：归还书籍

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
  "message": "Return request submitted successfully. Waiting for librarian approval.",
  "return_date": "2024-01-10",
  "fine": 0,
  "status": "returning"
}
```

#### 3.3.3 POST /api/borrow/confirm-borrow
**功能**：确认借阅

**请求体**：
```json
{
  "record_id": 10,
  "copy_id": 1
}
```

**响应**：
```json
{
  "message": "Borrow confirmed successfully"
}
```

**说明**：`copy_id` 必须是当前书籍的可用副本；兼容旧数据中已预选副本的记录，若确认时改选其他副本，会释放原副本。

#### 3.3.4 POST /api/borrow/handle-timeout
**功能**：处理超时借阅
**权限**：admin/librarian

**响应**：
```json
{
  "message": "Timeout borrows processed",
  "processed": 2
}
```

#### 3.3.5 POST /api/borrow/approve-return
**功能**：审批归还请求
**权限**：admin/librarian

**请求体**：
```json
{
  "record_id": 10
}
```

**响应**：
```json
{
  "message": "Return approved successfully"
}
```

#### 3.3.6 GET /api/borrow/returning
**功能**：获取待审批的归还请求列表
**权限**：admin/librarian

**响应**：
```json
[
  {
    "id": 10,
    "user_id": 2,
    "username": "user1",
    "book_id": 1,
    "title": "The Great Gatsby",
    "borrow_date": "2024-01-01",
    "due_date": "2024-01-15",
    "return_date": "2024-01-10",
    "status": "returning",
    "fine": 0
  }
]
```

#### 3.3.7 GET /api/borrow/borrowing
**功能**：获取借阅中列表
**权限**：admin/librarian

**响应**：
```json
[
  {
    "id": 10,
    "user_id": 2,
    "username": "user1",
    "book_id": 1,
    "title": "The Great Gatsby",
    "borrow_date": "2024-01-01",
    "due_date": "2024-01-15",
    "status": "borrowed"
  }
]
```

#### 3.3.8 POST /api/borrow/reserve
**功能**：预约书籍

**请求体**：
```json
{
  "book_id": 1
}
```

**响应**：
```json
{
  "id": 1,
  "user_id": 2,
  "book_id": 1,
  "reservation_date": "2024-01-01",
  "status": "pending"
}
```

#### 3.3.9 GET /api/borrow/reservations/:user_id
**功能**：获取用户的预约记录

**响应**：
```json
[
  {
    "id": 1,
    "user_id": 2,
    "book_id": 1,
    "title": "The Great Gatsby",
    "reservation_date": "2024-01-01",
    "status": "pending"
  }
]
```

#### 3.3.10 POST /api/borrow/renew
**功能**：续借图书

**请求体**：
```json
{
  "record_id": 10
}
```

**响应**：
```json
{
  "message": "Book renewed successfully",
  "new_due_date": "2024-01-29"
}
```

#### 3.3.11 GET /api/borrow/fines/:user_id
**功能**：获取用户罚款历史记录
**权限**：本人或admin/librarian

**说明**：返回 `fine > 0` 的罚款历史，包含未支付和已支付记录；未支付记录优先，再按记录 ID 倒序。前端总额只统计 `fine_status = "unpaid"`。

**响应**：
```json
[
  {
    "id": 1,
    "book_id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "borrow_date": "2024-01-01",
    "due_date": "2024-01-15",
    "return_date": "2024-01-20",
    "fine": 2.5,
    "fine_status": "unpaid",
    "copy_id": 1,
    "copy_code": "CP-1-001"
  }
]
```

#### 3.3.12 POST /api/borrow/pay-fine
**功能**：支付所有未支付罚款
**权限**：本人或admin/librarian

**请求体**：
```json
{
  "user_id": 2
}
```

**响应**：
```json
{
  "message": "All fines paid successfully",
  "amount": 2.5
}
```

### 3.4 分类管理接口

#### 3.4.1 GET /api/categories
**功能**：获取分类列表

**响应**：
```json
[
  {
    "id": 1,
    "name": "Literature",
    "description": "Literature books"
  }
]
```

#### 3.4.2 GET /api/categories/:id
**功能**：获取单个分类

**响应**：
```json
{
  "id": 1,
  "name": "Literature",
  "description": "Literature books"
}
```

#### 3.4.3 POST /api/categories
**功能**：添加分类
**权限**：admin/librarian

**请求体**：
```json
{
  "name": "Philosophy",
  "description": "Philosophy books"
}
```

**响应**：
```json
{
  "id": 6,
  "name": "Philosophy",
  "description": "Philosophy books"
}
```

#### 3.4.4 PUT /api/categories/:id
**功能**：更新分类
**权限**：admin/librarian

**请求体**：
```json
{
  "name": "Updated Category",
  "description": "Updated description"
}
```

**响应**：
```json
{
  "id": 1,
  "name": "Updated Category",
  "description": "Updated description"
}
```

#### 3.4.5 DELETE /api/categories/:id
**功能**：删除分类
**权限**：admin/librarian

**响应**：
```json
{
  "message": "Category deleted"
}
```

#### 3.4.6 GET /api/categories/book/:bookId
**功能**：获取图书的分类

**响应**：
```json
[
  {
    "id": 1,
    "name": "Literature",
    "description": "Literature books"
  }
]
```

#### 3.4.7 POST /api/categories/book/:bookId
**功能**：为图书添加分类
**权限**：admin/librarian

**请求体**：
```json
{
  "category_id": 2
}
```

**响应**：
```json
{
  "message": "Category added to book"
}
```

#### 3.4.8 DELETE /api/categories/book/:bookId/:categoryId
**功能**：从图书中移除分类
**权限**：admin/librarian

**响应**：
```json
{
  "message": "Category removed from book"
}
```

### 3.5 系统管理接口

#### 3.5.1 GET /api/system/settings
**功能**：获取系统设置
**权限**：admin

**响应**：
```json
{
  "system_name": "Library Management System",
  "system_version": "1.0.0",
  "borrow_period_days": "14",
  "fine_per_day": "0.5",
  "max_borrows": "5",
  "borrow_confirm_minutes": "60",
  "max_renew_times": "3",
  "renew_days": "7",
  "blacklist_days": "30",
  "max_reservations": "3"
}
```

#### 3.5.2 PUT /api/system/settings
**功能**：更新系统设置（支持部分更新）
**权限**：admin

**说明**：
- 更新接口使用 upsert 语义；当某个 key 在 `system_settings` 中不存在时会自动创建。
- 前端系统设置页会对缺失 key 使用默认值兜底显示。

**请求体**（支持单项或多项更新）：
```json
{
  "borrow_period_days": "21",
  "fine_per_day": "1.0"
}
```

`fine_per_day` 可以设置为 `"0"`，表示禁用逾期罚款。

**响应**：
```json
{
  "message": "System settings updated successfully"
}
```

#### 3.5.3 GET /api/announcements
**功能**：获取公告列表

**响应**：
```json
[
  {
    "id": 1,
    "title": "系统更新通知",
    "content": "图书馆系统已完成更新",
    "author_id": 1,
    "author_name": "Admin User",
    "is_published": 1,
    "created_at": "2024-01-01 00:00:00"
  }
]
```

#### 3.5.4 GET /api/announcements/:id
**功能**：获取单个公告

**响应**：
```json
{
  "id": 1,
  "title": "系统更新通知",
  "content": "图书馆系统已完成更新",
  "author_id": 1,
  "author_name": "Admin User",
  "is_published": 1,
  "created_at": "2024-01-01 00:00:00"
}
```

#### 3.5.5 POST /api/announcements
**功能**：添加公告
**权限**：admin

**请求体**：
```json
{
  "title": "新公告",
  "content": "公告内容",
  "is_published": 1
}
```

**响应**：
```json
{
  "id": 2,
  "title": "新公告",
  "content": "公告内容",
  "author_id": 1,
  "is_published": 1
}
```

#### 3.5.6 PUT /api/announcements/:id
**功能**：更新公告
**权限**：admin

**请求体**：
```json
{
  "title": "更新的公告",
  "content": "更新的内容",
  "is_published": 1
}
```

**响应**：
```json
{
  "id": 1,
  "title": "更新的公告",
  "content": "更新的内容",
  "is_published": 1
}
```

#### 3.5.7 DELETE /api/announcements/:id
**功能**：删除公告
**权限**：admin

**响应**：
```json
{
  "message": "Announcement deleted"
}
```

#### 3.5.8 GET /api/logs
**功能**：获取系统日志
**权限**：admin

**查询参数**：
- `limit`：返回数量，默认 50
- `offset`：分页偏移，默认 0
- `order`：时间排序，`desc` 为最新优先，`asc` 为最旧优先

**响应**：
```json
[
  {
    "id": 1,
    "user_id": 1,
    "username": "admin",
    "action": "login",
    "description": "User logged in",
    "ip_address": "127.0.0.1",
    "created_at": "2024-01-01 00:00:00"
  }
]
```

#### 3.5.9 DELETE /api/logs/clear
**功能**：清除系统日志
**权限**：admin

**响应**：
```json
{
  "message": "Logs cleared successfully"
}
```

### 3.6 统计分析接口

#### 3.6.1 GET /api/stats/borrow-stats
**功能**：获取借阅统计
**权限**：admin/librarian

**响应**：
```json
{
  "total_borrows": 100,
  "active_borrows": 20,
  "returned_borrows": 80,
  "overdue_borrows": 5
}
```

#### 3.6.2 GET /api/stats/monthly-stats
**功能**：获取月度借阅统计
**权限**：admin/librarian

**响应**：
```json
{
  "months": ["Jan", "Feb", "Mar"],
  "borrow_counts": [10, 15, 20]
}
```

#### 3.6.3 GET /api/stats/popular-books
**功能**：获取热门图书统计
**权限**：所有登录用户

**响应**：
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "borrow_count": 10
  }
]
```

## 4. 错误处理

### 4.1 常见错误码

| 错误码 | 描述 | 原因 |
|--------|------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如用户名已存在） |
| 500 | Internal Server Error | 服务器内部错误 |

### 4.2 错误响应格式

```json
{
  "error": "错误消息"
}
```

## 5. 接口调用示例

### 5.1 使用Fetch API调用

```javascript
// 登录
fetch('http://localhost:3001/api/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => {
  const token = data.token;
  // 存储token
  localStorage.setItem('token', token);
});

// 获取书籍列表（带认证）
fetch('http://localhost:3001/api/books', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### 5.2 使用Axios调用

```javascript
import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器添加认证
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 登录
api.post('/users/login', {
  username: 'admin',
  password: 'admin123'
}).then(response => {
  localStorage.setItem('token', response.data.token);
});

// 获取书籍列表
api.get('/books').then(response => {
  console.log(response.data);
});
```

## 6. 性能优化建议

1. **缓存策略**：对不经常变化的数据（如分类列表）使用客户端缓存
2. **分页查询**：对大量数据的接口实现分页功能
3. **批量操作**：支持批量添加、删除等操作
4. **压缩传输**：启用Gzip压缩减少传输数据量
5. **索引优化**：确保数据库查询使用正确的索引

## 7. 安全建议

1. **HTTPS**：在生产环境中使用HTTPS
2. **CORS**：正确配置CORS策略
3. **输入验证**：对所有用户输入进行严格验证
4. **SQL注入防护**：使用参数化查询
5. **XSS防护**：对输出进行适当转义
6. **CSRF防护**：实现CSRF令牌验证
7. **密码安全**：使用强密码哈希算法
8. **Token管理**：实现token过期和刷新机制
