# 图书馆管理系统API接口文档

## 1. 接口概览

| 模块 | 主要功能 | 接口数量 |
|------|----------|----------|
| 用户管理 | 用户认证、信息管理、状态管理 | 12 |
| 书籍管理 | 书籍CRUD、分类管理、ISBN导入、副本条形码与位置管理 | 22 |
| 借阅管理 | 借阅、归还、预约、续借、罚款管理、预约可借通知触发 | 15 |
| 系统管理 | 系统设置、功能开关、公告、公告已读、日志 | 13 |
| 站内通知 | 通知列表、未读数量、标记已读 | 4 |
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
  "email": "newuser@example.com",
  "verificationCode": "123456"
}
```

**说明**：注册前需先调用 `POST /api/users/email-verification/send`，`purpose` 传 `registration`，并提交邮箱收到的 6 位验证码。

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

**说明**：普通用户和图书管理员更新个人资料时应省略 `role` 字段；如果请求中携带的 `role` 与目标用户当前角色一致，后端会忽略该字段。只有 admin 可以实际修改用户角色，且不能将用户设置为 admin。请求中包含 `email` 时，后端会校验邮箱格式并拒绝无效邮箱。

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
**功能**：删除用户（软删除）
**权限**：admin

**安全规则**：
- 不能删除当前登录账号
- 不能删除管理员账号
- 存在 `borrowing`、`borrowed`、`overdue`、`returning` 借阅记录时禁止删除
- 存在 `active` 或 `pending` 预约记录时禁止删除
- 存在 `returning` 或 `returned` 实际未支付罚款时禁止删除
- 存在 `pending` 支付订单时禁止删除
- 删除不会物理移除 `users` 记录，而是将 `user_status.status` 更新为 `deleted`；用户列表和登录会排除 deleted 账号，借阅、罚款和支付历史保留用于审计

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
    "confirm_deadline": "2024-01-01T10:00:00Z",
    "copy_id": 1,
    "copy_code": "CP-1-001"
  }
]
```

**说明**：`status = "borrowing"` 的待确认记录会返回 `confirm_deadline`，前端用它在书籍列表、书籍详情和借阅记录确认弹窗中恢复剩余确认倒计时。

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
  "message": "User found. Password reset email and verification code sent if email delivery is enabled.",
  "token": "<reset_token>",
  "user": {
    "id": 2,
    "username": "user1",
    "name": "Test User"
  }
}
```

**说明**：
- 当后端 `EMAIL_ENABLED=true` 时会向账户邮箱发送重置链接和 6 位验证码。
- 当前版本仍返回 `token`，用于兼容现有前端本地重置流程。

#### 3.1.13 POST /api/users/email-verification/send
**功能**：发送邮箱验证码

**请求体**：
```json
{
  "email": "user@example.com",
  "purpose": "registration"
}
```

`purpose` 可选值：
- `registration`：注册邮箱验证码
- `password_reset`：重置密码邮箱验证码

**响应**：
```json
{
  "message": "Verification code sent",
  "email": "user@example.com",
  "purpose": "registration",
  "expires_at": "2026-05-25T10:30:00.000Z"
}
```

#### 3.1.14 POST /api/users/reset-password
**功能**：重置密码

**请求体**：
```json
{
  "token": "<reset_token>",
  "newPassword": "newpassword123",
  "verificationCode": "123456"
}
```

**响应**：
```json
{
  "message": "Password reset successfully"
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

**安全规则**：
- 存在 `borrowing`、`borrowed`、`overdue`、`returning` 借阅记录时禁止删除
- 存在 `active` 或 `pending` 预约记录时禁止删除
- 存在 `borrowing`、`borrowed` 或 `reserved` 状态副本时禁止删除
- 删除检查以借阅状态为准，不依赖 `return_date IS NULL`；`returning` 记录可能已有归还日期但仍未审批完成

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
**功能**：导出图书与副本组合信息到CSV
**权限**：admin/librarian

**说明**：导出结果按副本展开，每个副本一行并重复展示所属图书字段；没有副本的图书也会保留一行且副本字段为空。CSV 包含图书 ID、标题、作者、ISBN、馆藏数量、分类、图书创建/更新时间，以及副本 ID、编号、状态、位置、创建/更新时间。

**响应**：
- `text/csv; charset=utf-8` 文件下载，默认文件名 `books_with_copies_YYYY-MM-DD.csv`

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

#### 3.2.13 GET /api/books/isbn-providers
**功能**：获取可用 ISBN 查询 API 节点
**权限**：admin/librarian

**响应**：
```json
[
  {
    "id": "openlibrary",
    "name": "OpenLibrary",
    "endpoint": "https://openlibrary.org/api/books",
    "test_isbn": "9780743273565"
  },
  {
    "id": "googlebooks",
    "name": "Google Books",
    "endpoint": "https://www.googleapis.com/books/v1/volumes",
    "test_isbn": "9780743273565"
  },
  {
    "id": "showapi",
    "name": "ShowAPI ISBN",
    "endpoint": "https://route.showapi.com/1626-1",
    "test_isbn": "9787302124887",
    "requires_app_key": true,
    "configured": false
  }
]
```

#### 3.2.14 POST /api/books/isbn-providers/test
**功能**：测试指定 ISBN 查询 API 节点是否可用
**权限**：admin/librarian

**请求体**：
```json
{
  "provider": "openlibrary",
  "isbn": "9780743273565"
}
```

**说明**：
- `isbn` 可选；未传时使用该节点的默认测试 ISBN。
- 接口始终返回测试结果对象；节点不可用时 `available` 为 `false`，并包含错误原因。
- ShowAPI ISBN 节点需要后端环境变量 `SHOWAPI_ISBN_APP_KEY`，请求方式为 `application/x-www-form-urlencoded`，请求体包含 `isbn`。
- 后端访问外部 ISBN API 时支持自动代理。默认配置为 `BACKEND_PROXY_MODE=auto`、`BACKEND_PROXY_HOST=127.0.0.1`、`BACKEND_PROXY_PORT=7890`。

**响应**：
```json
{
  "provider": "openlibrary",
  "provider_name": "OpenLibrary",
  "endpoint": "https://openlibrary.org/api/books",
  "available": true,
  "status": 200,
  "latency_ms": 350,
  "last_tested_at": "2026-05-24T01:00:00.000Z",
  "test_isbn": "9780743273565"
}
```

#### 3.2.15 GET /api/books/isbn/:isbn
**功能**：通过ISBN查询书籍信息（调用选定 ISBN API 节点）
**权限**：admin/librarian

**查询参数**：
- `provider`：可选，ISBN 查询节点 ID。当前支持 `openlibrary`、`googlebooks` 和 `showapi`，未传时默认 `openlibrary`。

**说明**：
- 前端单本 ISBN 查询和批量导入预览都会通过该接口，并传入当前选中的 provider。
- ShowAPI ISBN 的 `showapi_res_body.data` 会归一化为系统书籍字段：`title`、`author`、`publisher`、`pubdate -> publish_date`、`gist -> description`、`img -> cover_image`、`page -> page_count`、`isbn`。
- ShowAPI 样例中的 `edition`、`paper`、`format`、`price`、`binding`、`produce` 当前没有对应书籍表字段，暂不落库。
- `cover_image` 会根据 provider 返回值归一化；没有封面时返回空字符串。
- `publish_date` 会尽量归一为 `YYYY-MM-DD`、`YYYY-MM` 或 `YYYY`；无法解析时保留原始返回值。

**响应**：
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "publish_date": "1925-04-10",
  "description": "Book description",
  "language": "English",
  "page_count": 180,
  "cover_image": "https://covers.openlibrary.org/...",
  "provider": "openlibrary",
  "provider_name": "OpenLibrary"
}
```

#### 3.2.16 POST /api/books/batch
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
- 后端会再次校验 ISBN 格式、标题、作者和本地重复 ISBN，并为每个失败项返回具体错误原因。
- 接口会等待书籍、分类关联、副本插入和 statement finalize 完成后再提交事务并返回统计结果。

**响应**：
```json
{
  "success": 2,
  "failed": 1,
  "errors": [
    { "isbn": "123", "error": "ISBN must be 10 or 13 digits" }
  ]
}
```

#### 3.2.17 PUT /api/books/copies/:id/location
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

#### 3.2.18 DELETE /api/books/copies/:id
**功能**：删除单个实体副本
**权限**：admin/librarian

**安全规则**：
- 副本 id 必须为正整数
- 副本必须存在
- 只能删除 `available` 状态的副本
- 所属图书至少保留一个副本
- 副本不能存在活跃借阅记录
- 删除成功后会在同一事务中重新计算 `books.total_copies` 和 `books.available_copies`

**响应**：
```json
{
  "message": "Copy deleted successfully"
}
```

**可能错误**：
```json
{ "error": "Cannot delete copy: only available copies can be deleted" }
```

```json
{ "error": "Cannot delete copy: a book must keep at least one copy" }
```

```json
{ "error": "Cannot delete copy: it has active borrowing records" }
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

**说明**：
- 发起借阅时只创建待确认记录，不预先绑定具体副本。后端会先清理过期待确认记录，再用 `available` 副本数减去当前 `borrowing` 待确认记录数计算可确认名额；没有剩余名额时返回 HTTP 400：`{"error":"No available copies. All available copies are already awaiting confirmation."}`。
- 具体 `copy_id` 和 `copy_code` 在确认借阅时由前端弹窗选择可用副本后写入。
- 当系统设置 `borrow_enabled = "0"` 时，接口返回 HTTP 403：`{"error":"Borrowing is currently disabled by the system administrator"}`。

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

**说明**：归还申请提交时会立即计算逾期罚款，并按 `max_fine` 限制单条借阅记录最高罚款金额（`max_fine = "0"` 表示不封顶）。如果 `fine > 0`，记录会进入 `returning` 状态并标记 `fine_status = "unpaid"`，同时将罚款计入用户 `total_fine`。用户无需等待图书管理员审批即可通过支付宝支付订单支付实际罚款。当系统设置 `fine_enabled = "0"` 时，新逾期记录不再产生罚款，已逾期未归还记录的预计罚款不会继续增长；归还时使用当前冻结的罚款金额。

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

**说明**：
- `copy_id` 必须是当前书籍的可用副本；兼容旧数据中已预选副本的记录，若确认时改选其他副本，会释放原副本。
- 当系统设置 `borrow_enabled = "0"` 时，接口返回 HTTP 403：`{"error":"Borrowing is currently disabled by the system administrator"}`。

#### 3.3.4 POST /api/borrow/cancel-borrow-lock
**功能**：取消待确认的借阅锁定
**权限**：借阅记录本人或admin/librarian

**请求体**：
```json
{
  "record_id": 10
}
```

**响应**：
```json
{
  "message": "Borrow lock cancelled successfully"
}
```

**说明**：
- 仅允许取消 `status = "borrowing"` 的待确认借阅记录。
- 取消后记录状态变为 `timeout`；若兼容旧数据时该记录已经绑定 `copy_id` 且副本仍为 `borrowing`，会释放该副本并重新计算书籍可用副本数。
- 读者端 Confirm 弹窗中 `Cancel Lock` 调用该接口；`Not Now` 和右上角关闭按钮只隐藏弹窗，不取消锁定。

#### 3.3.5 POST /api/borrow/handle-timeout
**功能**：处理超时借阅
**权限**：admin/librarian

**响应**：
```json
{
  "message": "Timeout borrows processed",
  "processed": 2
}
```

#### 3.3.6 POST /api/borrow/approve-return
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

**说明**：审批只确认归还状态、释放副本并触发预约可借通知。罚款已在用户提交归还时入账，审批阶段不会重复累计罚款；如果用户已提前支付，`fine_status` 保持 `"paid"`。

#### 3.3.7 GET /api/borrow/returning
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

#### 3.3.8 GET /api/borrow/borrowing
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

#### 3.3.9 POST /api/borrow/reserve
**功能**：预约书籍

**说明**：当系统设置 `reservation_enabled = "0"` 时，接口返回 HTTP 403：`{"error":"Reservations are currently disabled by the system administrator"}`。关闭预约不会影响用户取消已有预约。

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

#### 3.3.10 GET /api/borrow/reservations/:user_id
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

#### 3.3.11 POST /api/borrow/renew
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

#### 3.3.12 GET /api/borrow/fines/:user_id
**功能**：获取用户罚款历史记录
**权限**：本人或admin/librarian

**说明**：返回 `fine > 0` 的罚款历史，包含预计罚款、实际未支付罚款和已支付罚款。`status = "overdue"` 且未归还的记录只作为预计罚款展示，不能创建支付订单；`status = "returning"` 或 `"returned"` 且 `fine_status = "unpaid"` 的记录才是可支付的实际罚款。

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
    "status": "returning",
    "fine": 2.5,
    "fine_status": "unpaid",
    "copy_id": 1,
    "copy_code": "CP-1-001"
  }
]
```

#### 3.3.13 POST /api/borrow/pay-fine
**状态**：已移除

**说明**：旧的直接结清罚款接口已移除，避免绕过 Release 3 的支付宝支付订单、支付状态和收入流水。请使用 `POST /api/payments/fines/alipay` 创建罚款支付单，并通过支付宝通知、主动查询或本地模拟通知完成支付。

### 3.4 支付接口

#### 3.4.1 GET /api/payments/alipay/status
**功能**：获取支付宝后端配置状态
**权限**：已登录用户

**说明**：只返回安全摘要和缺失项，不返回应用私钥或支付宝公钥内容。Fine Records 用该接口判断本地模拟按钮是否应显示。

**响应**：
```json
{
  "enabled": true,
  "mode": "sandbox",
  "gateway": "https://openapi-sandbox.dl.alipaydev.com/gateway.do",
  "notifyUrl": "http://localhost:3001/api/payments/alipay/notify",
  "returnUrl": "http://localhost:5173/payment-result",
  "simulationEnabled": true,
  "hasAppId": true,
  "hasPrivateKey": true,
  "hasAlipayPublicKey": true,
  "missing": []
}
```

#### 3.4.2 GET /api/payments
**功能**：查询支付订单列表
**权限**：本人订单或admin/librarian查看全部

**查询参数**：
- `user_id`：可选，admin/librarian 可按用户筛选
- `status`：可选，`pending`、`paid`、`expired`、`failed`
- `provider`：可选，默认 `alipay`
- `payment_type`：可选，例如 `fine`
- `date_from` / `date_to`：可选，按创建日期筛选
- `keyword`：可选，按订单号、用户名、姓名、状态或用户 ID 模糊筛选
- `page`：可选，页码，默认 `1`
- `page_size`：可选，每页数量，默认 `10`，最大 `100`

**说明**：普通用户只能看到自己的支付订单；admin/librarian 可查看全部或按用户筛选。

**响应**：
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 2,
      "username": "reader",
      "name": "Reader",
      "out_trade_no": "ALI202606040101010000A1B2C3D4",
      "amount": 5,
      "status": "paid",
      "provider": "alipay",
      "payment_type": "fine",
      "created_at": "2026-06-04 10:00:00",
      "paid_at": "2026-06-04T02:01:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 23,
    "total_pages": 3
  }
}
```

#### 3.4.3 POST /api/payments/fines/alipay
**功能**：创建支付宝罚款支付单（本地模拟）
**权限**：本人或admin/librarian

**说明**：接口只汇总当前用户 `status IN ("returning", "returned")` 且 `fine_status = "unpaid"` 的实际罚款记录，创建 `pending` 支付单并返回二维码内容和支付链接。创建支付单不会立即修改罚款状态。未归还逾期书籍的预计罚款不会进入支付单。若同一用户同一批实际罚款已有 `pending` 支付单，接口会复用并返回已有订单。
当 `ALIPAY_ENABLED=true` 且配置完整时，`payment_url` 为后端签名生成的支付宝沙箱 `alipay.trade.page.pay` 收银台 URL，`qr_code` 优先使用 `alipay.trade.precreate` 返回的支付宝专用二维码内容；若 precreate 失败则临时回退到 page-pay URL。未启用或配置缺失时两者为本地 `/payment-result` 模拟链接。
Fine Records 页面使用该接口替代旧的直接结清接口；用户需要在支付宝模拟支付区域完成模拟通知后，罚款才会变为已支付。前端创建订单后每 2.5 秒调用 `GET /api/payments/:id` 轮询最新状态，`paid` 时自动刷新罚款记录，`expired` 时提示重新创建订单。

**请求体**：
```json
{
  "user_id": 2
}
```

**响应**：
```json
{
  "id": 1,
  "user_id": 2,
  "provider": "alipay",
  "payment_type": "fine",
  "out_trade_no": "ALI202605240101010000A1B2C3D4",
  "amount": 2.5,
  "status": "pending",
  "subject": "Library fine payment #ALI202605240101010000A1B2C3D4",
  "qr_code": "http://localhost:5173/payment-result?out_trade_no=...",
  "payment_url": "http://localhost:5173/payment-result?out_trade_no=...",
  "payment_url_source": "alipay-precreate",
  "borrow_record_ids": [1, 2],
  "reused": false,
  "simulate_notify_path": "/api/payments/alipay/simulate-notify/ALI202605240101010000A1B2C3D4"
}
```

#### 3.4.4 GET /api/payments/:id
**功能**：查询支付单状态
**权限**：本人或admin/librarian

**说明**：当订单为 `pending` 且支付宝配置完整时，接口会先调用 `alipay.trade.query` 主动同步沙箱订单状态。支付宝返回 `TRADE_SUCCESS` / `TRADE_FINISHED` 时本地订单会变为 `paid` 并结清关联罚款；返回 `TRADE_CLOSED` 时本地订单会变为 `expired`。支付宝查询失败时保留本地状态返回，避免前端轮询中断。

#### 3.4.5 GET /api/payments/trade/:out_trade_no
**功能**：按商户订单号查询支付单状态
**权限**：本人或admin/librarian

**说明**：本地 `/payment-result` 页面使用该接口根据 `out_trade_no` 读取最新支付状态，而不是信任 URL 中的静态状态参数。
支付结果页支持手动刷新并每 2.5 秒轮询该接口，便于本地模拟或支付宝沙箱支付后验证订单状态变化。该接口同样会对 pending 沙箱订单主动执行 `alipay.trade.query` 状态同步。

#### 3.4.6 POST /api/payments/alipay/simulate-notify/:out_trade_no
**功能**：模拟支付宝支付成功通知
**权限**：本人或admin/librarian

**说明**：本地测试用接口，仅当 `ALIPAY_MODE=sandbox` 或 `ALIPAY_SIMULATION_ENABLED=true` 时允许调用。调用后将支付单标记为 `paid`，关联的罚款记录标记为 `paid`，并重新同步用户 `total_fine`。接口具备幂等性，已支付订单重复调用不会重复入账；`expired` 订单不能模拟成功。

#### 3.4.7 POST /api/payments/alipay/notify
**功能**：支付宝异步通知入口
**权限**：公开入口

**说明**：接收支付宝沙箱/网关 `application/x-www-form-urlencoded` 异步通知，使用 `ALIPAY_PUBLIC_KEY` 验签，并校验 `app_id` 与 `total_amount`。`trade_status` 为 `TRADE_SUCCESS` 或 `TRADE_FINISHED` 时，按 `out_trade_no` 查询本地支付单并完成罚款结算，保存支付宝 `trade_no`；成功响应支付宝要求的纯文本 `success`，失败响应 `fail`。

#### 3.4.8 GET /api/payments/income/summary
**功能**：图书管理员收入 dashboard 数据
**权限**：admin/librarian

**响应**：
```json
{
  "total_income": 20,
  "today_income": 5,
  "month_income": 20,
  "paid_count": 4,
  "pending_count": 1,
  "recent_payments": []
}
```

#### 3.4.9 GET /api/payments/income/analytics
**功能**：收入趋势和任意日期范围收入查询
**权限**：admin/librarian

**查询参数**：
- `start_date`：可选，查询起始日期，格式 `YYYY-MM-DD`
- `end_date`：可选，查询结束日期，格式 `YYYY-MM-DD`

**说明**：不传日期参数时，`trend` 默认返回过去一年按月统计的已支付支付宝罚款收入。传入 `start_date` / `end_date` 后，折线图数据会限定在指定范围内，并自动选择标度：31 天内按日、180 天内按 7 天区间、超过 180 天按月。只传其中一个日期时按单日查询。

**响应**：
```json
{
  "trend": {
    "granularity": "month",
    "start_date": "2025-07-01",
    "end_date": "2026-06-04",
    "buckets": [
      {
        "key": "2025-07",
        "label": "2025-07",
        "start_date": "2025-07-01",
        "end_date": "2025-07-31",
        "income": 15,
        "paid_count": 3
      }
    ]
  },
  "range": {
    "start_date": "2025-07-01",
    "end_date": "2026-06-04",
    "total_income": 20,
    "paid_count": 4
  }
}
```

#### 3.4.10 POST /api/payments/:id/expire
**功能**：手动过期待支付订单
**权限**：本人或admin/librarian

**说明**：仅 `pending` 订单可以过期。过期订单不会改变罚款状态，已支付订单不能过期；已有 `pending` 订单被过期后，用户再次创建同一批罚款支付单会生成新订单。

### 3.5 分类管理接口

#### 3.5.1 GET /api/categories
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

#### 3.5.2 GET /api/categories/:id
**功能**：获取单个分类

**响应**：
```json
{
  "id": 1,
  "name": "Literature",
  "description": "Literature books"
}
```

#### 3.5.3 POST /api/categories
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

#### 3.5.4 PUT /api/categories/:id
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

#### 3.5.5 DELETE /api/categories/:id
**功能**：删除分类
**权限**：admin/librarian

**响应**：
```json
{
  "message": "Category deleted"
}
```

#### 3.5.6 GET /api/categories/book/:bookId
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

#### 3.5.7 POST /api/categories/book/:bookId
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

#### 3.5.8 DELETE /api/categories/book/:bookId/:categoryId
**功能**：从图书中移除分类
**权限**：admin/librarian

**响应**：
```json
{
  "message": "Category removed from book"
}
```

### 3.6 系统管理接口

#### 3.6.1 GET /api/system/settings
**功能**：获取系统设置
**权限**：admin

**响应**：
```json
{
  "system_name": "Library Management System",
  "system_version": "1.0.0",
  "borrow_enabled": "1",
  "reservation_enabled": "1",
  "borrow_period_days": "14",
  "fine_enabled": "1",
  "fine_per_day": "0.5",
  "max_fine": "0",
  "max_borrows": "5",
  "borrow_confirm_minutes": "60",
  "max_renew_times": "3",
  "renew_days": "7",
  "blacklist_days": "30",
  "max_reservations": "3"
}
```

#### 3.6.2 PUT /api/system/settings
**功能**：更新系统设置（支持部分更新）
**权限**：admin

**说明**：
- 更新接口使用 upsert 语义；当某个 key 在 `system_settings` 中不存在时会自动创建。
- 前端系统设置页会对缺失 key 使用默认值兜底显示。

**请求体**（支持单项或多项更新）：
```json
{
  "borrow_enabled": "1",
  "reservation_enabled": "1",
  "borrow_period_days": "21",
  "fine_enabled": "1",
  "fine_per_day": "1.0",
  "max_fine": "50"
}
```

`fine_enabled` 设置为 `"0"` 时会暂停新罚款产生和未归还逾期记录的预计罚款增长，但不影响已生成实际罚款的支付。`fine_per_day` 可以设置为 `"0"`，表示启用罚款功能时费率为 0。`max_fine` 限制单条借阅记录最高逾期罚款，设置为 `"0"` 表示不封顶。

**响应**：
```json
{
  "message": "System settings updated successfully"
}
```

#### 3.6.3 GET /api/system/feature-flags
**功能**：获取当前登录用户可见的功能开关
**权限**：任意已登录用户

**说明**：
- 该接口只暴露前端业务需要知道的功能开关，不返回完整系统设置。
- `borrow_enabled` 为 `false` 时，读者端应禁用发起借阅和确认借阅入口；后端仍会在借阅接口强制校验。
- `reservation_enabled` 为 `false` 时，读者端应禁用发起预约入口；后端仍会在预约接口强制校验，取消已有预约不受影响。

**响应**：
```json
{
  "borrow_enabled": true,
  "reservation_enabled": true
}
```

#### 3.6.4 GET /api/system/email/status
**功能**：查看邮件服务安全配置摘要
**权限**：admin

**说明**：
- 不返回 `SMTP_PASS` 等敏感配置值。
- `missing` 仅在启用 SMTP 模式且缺少必需配置时列出缺失项。

**响应**：
```json
{
  "enabled": true,
  "mode": "smtp",
  "host": "smtp.qq.com",
  "port": 465,
  "secure": true,
  "from": "Library System <example@qq.com>",
  "appPublicUrl": "http://localhost:5173",
  "hasUser": true,
  "hasPass": true,
  "missing": []
}
```

#### 3.6.5 POST /api/system/email/test
**功能**：发送测试邮件
**权限**：admin

**请求体**：
```json
{
  "to": "user@example.com"
}
```

**响应**：
```json
{
  "message": "Test email processed",
  "result": {
    "sent": true,
    "mode": "smtp"
  }
}
```

#### 3.6.6 GET /api/announcements
**功能**：获取公告列表

**响应**：
```json
[
  {
    "id": 1,
    "title": "系统更新通知",
    "content": "图书馆系统已完成更新",
    "author_id": 1,
    "is_published": 1,
    "created_at": "2024-01-01 00:00:00"
  }
]
```

#### 3.6.7 GET /api/announcements/:id
**功能**：获取单个公告

**响应**：
```json
{
  "id": 1,
  "title": "系统更新通知",
  "content": "图书馆系统已完成更新",
  "author_id": 1,
  "is_published": 1,
  "created_at": "2024-01-01 00:00:00"
}
```

#### 3.6.8 POST /api/announcements
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
  "is_published": 1,
  "created_at": "2026-05-12"
}
```

#### 3.6.9 PUT /api/announcements/:id
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

#### 3.6.10 DELETE /api/announcements/:id
**功能**：删除公告
**权限**：admin

**响应**：
```json
{
  "message": "Announcement deleted successfully"
}
```

#### 3.6.11 GET /api/announcements/unread/mine
**功能**：获取当前登录用户未读的已发布公告，用于全局公告弹窗提醒
**权限**：登录用户

**响应**：
```json
[
  {
    "id": 1,
    "title": "系统更新通知",
    "content": "图书馆系统已完成更新",
    "author_id": 1,
    "is_published": 1,
    "created_at": "2026-05-12"
  }
]
```

#### 3.6.12 PUT /api/announcements/read
**功能**：批量标记公告已读，写入 `announcement_reads`，已读公告不会再次触发弹窗
**权限**：登录用户

**请求体**：
```json
{
  "announcement_ids": [1, 2]
}
```

**响应**：
```json
{
  "message": "Announcements marked as read",
  "updated": 2
}
```

#### 3.6.13 PUT /api/announcements/:id/read
**功能**：标记单条公告已读
**权限**：登录用户

**响应**：
```json
{
  "message": "Announcements marked as read",
  "updated": 1
}
```

#### 3.6.14 GET /api/logs
**功能**：获取系统日志
**权限**：admin

**查询参数**：
- `limit`：返回数量，默认 50
- `offset`：分页偏移，默认 0
- `order`：时间排序，`desc` 为最新优先，`asc` 为最旧优先
- `keyword`：可选，按操作类型、描述或用户 ID 模糊筛选
- `action`：可选，按操作类型模糊筛选
- `user_id`：可选，按用户 ID 精确筛选
- `date_from`：可选，按创建日期起始值筛选，格式 `YYYY-MM-DD`
- `date_to`：可选，按创建日期结束值筛选，格式 `YYYY-MM-DD`

**响应**：
```json
{
  "logs": [
    {
      "id": 1,
      "user_id": 1,
      "action": "login",
      "description": "User logged in",
      "created_at": "2024-01-01 00:00:00"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### 3.6.15 DELETE /api/logs/clear
**功能**：清除系统日志
**权限**：admin

**请求体**：
```json
{
  "days": 30
}
```

**说明**：`days` 必须是 `1` 到 `3650` 的整数，或 `0` 表示清除全部日志。非法值返回 HTTP 400，且不会删除日志。

**响应**：
```json
{
  "message": "Logs cleared successfully"
}
```

**可能错误**：
```json
{
  "error": "Days must be an integer between 1 and 3650, or 0 to clear all logs"
}
```

### 3.7 统计分析接口

#### 3.7.1 GET /api/stats/borrow-stats
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

#### 3.7.2 GET /api/stats/monthly-stats
**功能**：获取月度借阅统计
**权限**：admin/librarian

**响应**：
```json
{
  "months": ["Jan", "Feb", "Mar"],
  "borrow_counts": [10, 15, 20]
}
```

#### 3.7.3 GET /api/stats/popular-books
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

### 3.8 站内通知接口

#### 3.8.1 GET /api/notifications/:user_id
**功能**：获取用户通知列表
**权限**：本人/admin/librarian

**响应**：
```json
[
  {
    "id": 1,
    "user_id": 2,
    "title": "Reserved book available",
    "message": "\"1984\" is now available. Please borrow it when convenient.",
    "type": "reservation",
    "is_read": 0,
    "related_id": 3,
    "created_at": "2026-05-12 10:00:00"
  }
]
```

#### 3.8.2 GET /api/notifications/:user_id/unread-count
**功能**：获取用户未读通知数量
**权限**：本人/admin/librarian

**响应**：
```json
{
  "count": 2
}
```

#### 3.8.3 PUT /api/notifications/:id/read
**功能**：标记单条通知已读
**权限**：通知接收者/admin/librarian

**响应**：
```json
{
  "message": "Notification marked as read"
}
```

#### 3.8.4 PUT /api/notifications/read-all
**功能**：标记用户全部通知已读
**权限**：本人/admin/librarian

**请求体**：
```json
{
  "user_id": 2
}
```

**响应**：
```json
{
  "message": "All notifications marked as read",
  "updated": 2
}
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
  // 当前前端按标签页隔离登录态，使用 sessionStorage 保存 token
  sessionStorage.setItem('token', token);
});

// 获取书籍列表（带认证）
fetch('http://localhost:3001/api/books', {
  headers: {
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
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
  const token = sessionStorage.getItem('token');
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
  sessionStorage.setItem('token', response.data.token);
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
9. **JWT密钥**：生产环境必须设置强随机 `JWT_SECRET`，未设置时后端拒绝启动
10. **示例账号**：生产环境默认不插入 `admin/admin123` 等示例账号，演示环境需显式设置 `SEED_DEFAULT_USERS=true` 并覆盖默认密码
11. **前端会话隔离**：当前前端使用 `sessionStorage` 保存登录 token，同一浏览器不同标签页可以使用不同账号

## 7.1 运行与审计说明

- 前端 `npm run build` 会先执行 `prebuild` 清理旧 `dist`，再运行 Vite 构建。
- 后端依赖使用 `nodemailer@8` 与 `sqlite3@5.1.7`；`sqlite3` 固定在 5.1.7 是为了兼容宝塔面板中较旧 Linux/glibc 环境。
- `/api/borrow/confirm-borrow` 只允许借阅记录本人、管理员或图书管理员确认。
- `/api/borrow/handle-timeout` 与 `/api/borrow/check-overdue` 只允许管理员或图书管理员触发。
