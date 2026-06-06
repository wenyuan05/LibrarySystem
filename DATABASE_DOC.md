# 图书馆管理系统数据库文档

## 1. 数据库结构概览

本系统使用 SQLite 数据库，包含以下主要表：

| 表名 | 描述 |
|------|------|
| system_settings | 系统参数配置 |
| categories | 图书分类 |
| book_categories | 图书分类关联 |
| user_status | 用户状态 |
| books | 书籍信息 |
| book_copies | 书籍副本信息 |
| users | 用户信息 |
| borrow_records | 借阅记录 |
| reservation_records | 预约记录 |
| payments | 支付记录 |
| notifications | 站内通知 |
| email_logs | 邮件发送记录 |
| email_verification_codes | 邮箱验证码记录 |
| system_logs | 系统日志 |
| announcements | 公告信息 |
| announcement_reads | 公告已读记录 |

## 2. 表结构详情

### 2.1 system_settings 表

**功能**：存储系统配置参数

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| key | TEXT | NOT NULL UNIQUE | 参数键 |
| value | TEXT | NOT NULL | 参数值 |
| description | TEXT | | 参数描述 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**默认值**：
- borrow_enabled: 1 (是否启用借阅功能，1=启用，0=关闭)
- borrow_period_days: 14 (借阅期限，天)
- fine_per_day: 0.5 (每天罚款金额)
- max_fine: 0 (单条借阅记录最高罚款金额，0=不封顶)
- max_borrows: 5 (最大借阅数量)
- max_reservations: 3 (最大预约数量)
- blacklist_days: 30 (拉黑天数)
- borrow_confirm_minutes: 60 (借阅确认时长，分钟)
- max_renew_times: 3 (最大续借次数)
- renew_days: 7 (续借延长天数)
- system_name: "Library Management System" (系统名称)
- system_version: "1.0.0" (系统版本)

### 2.2 categories 表

**功能**：存储图书分类信息

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| name | TEXT | NOT NULL UNIQUE | 分类名称 |
| description | TEXT | | 分类描述 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**默认分类**：Literature、History、Science、Art、Education

### 2.3 book_categories 表

**功能**：存储书籍与分类的多对多关联

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| book_id | INTEGER | NOT NULL | 书籍ID，外键关联books表 |
| category_id | INTEGER | NOT NULL | 分类ID，外键关联categories表 |
| UNIQUE(book_id, category_id) | | | 确保一本书籍在一个分类中只出现一次 |

### 2.4 user_status 表

**功能**：存储用户状态信息

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | NOT NULL UNIQUE | 用户ID，外键关联users表 |
| status | TEXT | DEFAULT 'active' | 用户状态（active/blocked） |
| blacklisted_until | TEXT | | 拉黑截止时间 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2.5 books 表

**功能**：存储书籍基本信息

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| title | TEXT | NOT NULL | 书名 |
| author | TEXT | NOT NULL | 作者 |
| isbn | TEXT | NOT NULL UNIQUE | ISBN号 |
| description | TEXT | | 描述 |
| cover_image | TEXT | | 封面图片 |
| total_copies | INTEGER | DEFAULT 1 | 总副本数 |
| available_copies | INTEGER | DEFAULT 1 | 可借副本数 |
| publisher | TEXT | | 出版社 |
| publish_date | TEXT | | 出版日期 |
| language | TEXT | DEFAULT 'Chinese' | 语言 |
| page_count | INTEGER | | 页数 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2.6 book_copies 表

**功能**：存储书籍副本信息

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| book_id | INTEGER | NOT NULL | 书籍ID，外键关联books表 |
| copy_code | TEXT | UNIQUE | 副本条形码编号，按书籍生成，如CP-1-001 |
| status | TEXT | DEFAULT 'available' | 状态（available/borrowing/borrowed/reserved） |
| location | TEXT | | 副本位置（如A1-01、Main Shelf） |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**说明**：
- `copy_code` 用于前端条形码渲染和实体副本识别。
- 旧数据启动时会自动补齐 `copy_code`，新增副本会按同一本书已有最大序号递增。

### 2.7 users 表

**功能**：存储用户信息

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| username | TEXT | NOT NULL UNIQUE | 用户名 |
| password | TEXT | NOT NULL | 密码（bcrypt哈希） |
| role | TEXT | DEFAULT 'user' | 角色（user/librarian/admin） |
| name | TEXT | NOT NULL | 姓名 |
| email | TEXT | NOT NULL | 邮箱 |
| phone | TEXT | | 电话 |
| address | TEXT | | 地址 |
| total_fine | REAL | DEFAULT 0 | 实际未付罚款总额（仅统计已归还/归还中记录，不统计未归还逾期书籍的预计罚款） |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2.8 borrow_records 表

**功能**：存储书籍借阅记录

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | NOT NULL | 用户ID，外键关联users表 |
| book_id | INTEGER | NOT NULL | 书籍ID，外键关联books表 |
| copy_id | INTEGER | | 副本ID，外键关联book_copies表 |
| borrow_date | TEXT | NOT NULL | 借阅日期 |
| due_date | TEXT | NOT NULL | 应还日期 |
| return_date | TEXT | | 实际归还日期 |
| confirm_deadline | TEXT | | 确认截止时间 |
| status | TEXT | DEFAULT 'borrowed' | 状态（borrowing/borrowed/returning/returned/overdue/timeout） |
| fine | REAL | DEFAULT 0 | 罚款金额 |
| fine_status | TEXT | DEFAULT 'unpaid' | 罚款状态（unpaid/paid） |
| renew_count | INTEGER | DEFAULT 0 | 续借次数 |

**说明**：
- 归还申请提交时会立即计算并写入 `borrow_records.fine` / `fine_status`。
- `status='overdue'` 且未归还的记录只用于预计罚款展示，不能直接创建支付订单。
- 若归还后产生实际未支付罚款，`users.total_fine` 会同步增加；支付罚款时以 `borrow_records` 中 `status IN ('returning','returned') AND fine_status='unpaid'` 的记录为准，并重新同步 `users.total_fine`。
- 图书管理员审批归还只确认归还状态和释放副本，不重复累计罚款。

### 2.9 reservation_records 表

**功能**：存储书籍预约记录

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | NOT NULL | 用户ID，外键关联users表 |
| book_id | INTEGER | NOT NULL | 书籍ID，外键关联books表 |
| reservation_date | TEXT | NOT NULL | 预约日期 |
| status | TEXT | DEFAULT 'pending' | 状态（pending/confirmed/canceled） |
| notification_sent | INTEGER | DEFAULT 0 | 是否已发送通知 |

### 2.10 payments 表

**功能**：存储支付宝罚款支付单和本地模拟支付结果

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | NOT NULL | 用户ID，外键关联users表 |
| provider | TEXT | DEFAULT 'alipay' | 支付渠道 |
| payment_type | TEXT | DEFAULT 'fine' | 支付类型 |
| out_trade_no | TEXT | NOT NULL UNIQUE | 商户订单号 |
| provider_trade_no | TEXT | | 支付宝交易号，真实接入后写入 |
| amount | REAL | NOT NULL | 支付金额 |
| status | TEXT | DEFAULT 'pending' | 支付状态（pending/paid/failed/expired） |
| subject | TEXT | | 订单标题 |
| qr_code | TEXT | | 二维码内容或收款链接 |
| payment_url | TEXT | | 支付链接 |
| borrow_record_ids | TEXT | | 关联罚款借阅记录ID JSON |
| raw_notify | TEXT | | 支付通知原始数据 |
| paid_at | TEXT | | 支付完成时间 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**说明**：
- 创建支付宝罚款支付单时写入 `pending` 记录，不立即改变罚款状态。
- 本地模拟支付成功后，关联 `borrow_records.fine_status` 改为 `paid`，并重新同步 `users.total_fine`。
- 真实支付宝 notify 接入后应继续复用该表的 `out_trade_no`、`provider_trade_no`、`raw_notify` 和 `paid_at` 字段。

### 2.11 email_logs 表

**功能**：记录注册、密码重置、通知和测试邮件的处理结果

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | | 关联用户ID，外键关联users表 |
| to_email | TEXT | NOT NULL | 收件邮箱 |
| subject | TEXT | NOT NULL | 邮件标题 |
| scenario | TEXT | | 发送场景（registration/registration_verification/password_reset/password_reset_verification/notification/test/general） |
| status | TEXT | NOT NULL | 处理状态（skipped/logged/sent/failed） |
| error_message | TEXT | | 失败或跳过原因 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**说明**：
- `EMAIL_ENABLED=false` 时不会发信，但会记录 `skipped`，便于本地确认触发点。
- `EMAIL_MODE=log` 时只写日志和控制台输出，不连接 QQ 邮箱 SMTP。
- `EMAIL_MODE=smtp` 且配置完整时通过 QQ 邮箱 SMTP 发信，失败原因写入 `error_message`。

### 2.12 email_verification_codes 表

**功能**：保存注册和密码重置邮箱验证码的哈希、用途和过期状态

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| email | TEXT | NOT NULL | 验证邮箱 |
| purpose | TEXT | NOT NULL | 用途（registration/password_reset） |
| code_hash | TEXT | NOT NULL | bcrypt 哈希后的验证码 |
| expires_at | TEXT | NOT NULL | 过期时间 |
| used_at | TEXT | | 使用时间，非空表示已消费 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**说明**：
- 每次发送同一邮箱同一用途的新验证码时，旧的未使用验证码会被标记为已使用。
- 验证码有效期为 10 分钟，校验通过后立即写入 `used_at` 防止重复使用。
- 数据库只保存验证码哈希，不保存明文验证码。

### 2.13 system_logs 表

**功能**：存储系统操作日志

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | | 操作用户ID，外键关联users表 |
| action | TEXT | NOT NULL | 操作类型 |
| description | TEXT | | 操作描述 |
| ip_address | TEXT | | 操作IP地址 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 操作时间 |

### 2.14 notifications 表

**功能**：存储站内通知，当前用于预约书籍可借提醒

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | NOT NULL | 接收用户ID，外键关联users表 |
| title | TEXT | NOT NULL | 通知标题 |
| message | TEXT | NOT NULL | 通知内容 |
| type | TEXT | DEFAULT 'reservation' | 通知类型 |
| is_read | INTEGER | DEFAULT 0 | 是否已读 |
| related_id | INTEGER | | 关联业务记录ID，如 reservation_records.id |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2.15 announcements 表

**功能**：存储系统公告

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| title | TEXT | NOT NULL | 公告标题 |
| content | TEXT | NOT NULL | 公告内容 |
| author_id | INTEGER | NOT NULL | 发布者ID，外键关联users表 |
| is_published | INTEGER | DEFAULT 1 | 是否发布 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 2.16 announcement_reads 表

**功能**：按用户记录已读公告，避免已读公告重复触发弹窗提醒

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 主键 |
| user_id | INTEGER | NOT NULL | 用户ID，外键关联users表 |
| announcement_id | INTEGER | NOT NULL | 公告ID，外键关联announcements表 |
| read_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 已读时间 |
| UNIQUE(user_id, announcement_id) | | | 同一用户对同一公告只记录一次 |

## 3. 索引设计

| 索引名 | 表名 | 字段 | 类型 | 描述 |
|--------|------|------|------|------|
| idx_books_isbn | books | isbn | UNIQUE | 加速ISBN查询 |
| idx_book_copies_copy_code | book_copies | copy_code | UNIQUE | 保证副本条形码编号唯一 |
| idx_users_username | users | username | UNIQUE | 加速用户名查询 |
| idx_users_role | users | role | | 加速角色查询 |
| idx_borrow_records_user_id | borrow_records | user_id | | 加速用户借阅记录查询 |
| idx_borrow_records_book_id | borrow_records | book_id | | 加速书籍借阅记录查询 |
| idx_borrow_records_status | borrow_records | status | | 加速借阅状态查询 |
| idx_payments_out_trade_no | payments | out_trade_no | UNIQUE | 加速支付宝订单号查询 |
| idx_payments_user_id | payments | user_id | | 加速用户支付记录查询 |
| idx_payments_status | payments | status | | 加速收入统计和状态查询 |
| idx_email_logs_user_id | email_logs | user_id | | 加速用户邮件记录查询 |
| idx_email_logs_status | email_logs | status | | 加速邮件状态筛选 |
| idx_email_logs_created_at | email_logs | created_at | | 加速邮件发送时间排序 |
| idx_email_verification_codes_email_purpose | email_verification_codes | email, purpose | | 加速验证码校验 |
| idx_email_verification_codes_expires_at | email_verification_codes | expires_at | | 加速验证码过期筛选 |
| idx_reservation_records_user_id | reservation_records | user_id | | 加速用户预约记录查询 |
| idx_reservation_records_book_id | reservation_records | book_id | | 加速书籍预约记录查询 |
| idx_reservation_records_status | reservation_records | status | | 加速预约状态查询 |
| idx_book_categories_book_id | book_categories | book_id | | 加速书籍分类查询 |
| idx_book_categories_category_id | book_categories | category_id | | 加速分类书籍查询 |
| idx_user_status_user_id | user_status | user_id | UNIQUE | 加速用户状态查询 |
| idx_user_status_status | user_status | status | | 加速状态统计 |
| idx_system_logs_user_id | system_logs | user_id | | 加速用户操作日志查询 |
| idx_system_logs_created_at | system_logs | created_at | | 加速时间范围查询 |
| idx_notifications_user_id | notifications | user_id | | 加速用户通知查询 |
| idx_notifications_is_read | notifications | is_read | | 加速未读通知统计 |
| idx_notifications_created_at | notifications | created_at | | 加速通知时间排序 |
| idx_announcements_is_published | announcements | is_published | | 加速已发布公告查询 |
| idx_announcements_created_at | announcements | created_at | | 加速最新公告查询 |
| idx_announcement_reads_user_id | announcement_reads | user_id | | 加速用户已读公告查询 |
| idx_announcement_reads_announcement_id | announcement_reads | announcement_id | | 加速公告已读关联查询 |

## 4. 数据关系图

```
users ── user_status
users ── borrow_records ── books ── book_copies
users ── payments ── borrow_records
users ── reservation_records ── books
users ── notifications
users ── email_logs
users.email ── email_verification_codes.email
reservation_records ── notifications.related_id
announcements ── announcement_reads ── users
books ── book_categories ── categories
users ── system_logs
system_settings
```

## 5. 数据初始化

系统启动时会自动初始化以下数据：

### 5.1 示例书籍
- The Great Gatsby (9780743273565)
- 1984 (9780451524935)
- To Kill a Mockingbird (9780061120084)

### 5.2 示例用户
- 管理员：admin / admin123
- 图书管理员：librarian / admin123
- 普通用户：user1 / user123

### 5.3 系统参数
- borrow_enabled: 1
- borrow_period_days: 14
- fine_per_day: 0.5
- max_fine: 0
- max_borrows: 5
- max_reservations: 3
- blacklist_days: 30
- borrow_confirm_minutes: 60

### 5.4 图书分类
- Literature
- History
- Science
- Art
- Education

### 5.5 书籍副本
- 为每本书创建3个副本
- 第三本书的第一个副本初始状态为borrowed，其他为available

## 6. 数据安全

1. **密码存储**：使用 bcrypt 对密码进行哈希处理
2. **数据验证**：在 API 层面和数据库层面都有数据验证
3. **权限控制**：基于角色的权限控制
4. **事务处理**：在关键操作中使用事务确保数据一致性
5. **数据去重**：使用唯一索引和唯一约束确保数据唯一性
6. **活跃记录定义**：
   - 借阅记录中 `borrowing`、`borrowed`、`overdue`、`returning` 都视为活跃状态，用于删除保护和重复借阅保护
   - 预约记录中 `active`、`pending` 视为活跃预约，用于删除保护
   - 副本状态中 `borrowing`、`borrowed`、`reserved` 视为占用状态，用于书籍删除保护
7. **删除与库存一致性**：
   - 用户存在活跃借阅或活跃预约时不能删除
   - 图书存在活跃借阅、活跃预约或占用副本时不能删除
   - `book_copies` 只能删除 `available` 状态副本，且每本书至少保留一个副本
   - 删除副本后在同一事务中从 `book_copies` 重新计算 `books.total_copies` 和 `books.available_copies`
   - 减少 `books.total_copies` 时只移除可用副本；如果可用副本不足，则拒绝减少数量
   - `returning` 记录可能已有 `return_date` 但仍等待审批，因此删除保护以状态字段为准，不以 `return_date IS NULL` 为准

## 7. 性能优化

1. **索引优化**：为常用查询字段创建索引
2. **查询优化**：使用 JOIN 操作减少查询次数
3. **事务管理**：合理使用事务提高数据操作效率
4. **数据缓存**：在应用层面实现适当的缓存策略

## 8. 维护建议

1. **定期备份**：定期备份数据库文件
2. **日志清理**：定期清理系统日志，避免数据库过大
3. **索引维护**：定期检查和优化索引
4. **数据清理**：定期清理过期的预约记录和借阅记录
5. **性能监控**：监控数据库性能，及时调整优化策略
