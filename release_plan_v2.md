# Release 2 发布计划

## Context
当前 `Fix` 分支相比 `main` 分支新增了 6 个 commits（48 个文件变更），实现了 ISBN 导入、罚款管理、副本位置管理、批量审批等功能。原有 release_plan.md 中的 Release 2 需求（2.1-2.8）大部分已完成。需要制定 Release 2 的发布范围、差距分析及完成步骤。

## Release 2 范围

### 包含的内容
1. **原始 Release 2 需求**（2.1-2.8）
2. **Fix 分支新增功能**：ISBN 导入、罚款机制、副本位置管理、批量归还审批、SVG 图标替换、统一弹窗错误提示
3. **通知功能**（2.3 的补充部分）

### 不包含的内容
Release 3 需求（3.1-3.6）不纳入 Release 2 范围。已在 Fix 分支上部分实现的 Release 3 功能（如个人信息编辑、热门书籍、统计页面、系统日志）保持代码存在但不作为 Release 2 的交付目标。

---

## 已完成状态

| 需求 | 状态 | 说明 |
|------|------|------|
| 2.1 密码重置 | ✅ 完成 | 后端 JWT 重置 + 前端忘记密码流程 |
| 2.2 续借 | ✅ 完成 | `/api/borrow/renew` + 续借按钮，支持次数/天数配置 |
| 2.3 预约与通知 | ✅ 完成 | 预约/取消 API + ReservationsPage + 预约可借站内通知 |
| 2.4 编辑/删除图书 | ✅ 完成 | PUT/DELETE API + EditBookForm |
| 2.5 分类管理 | ✅ 完成 | CRUD + CategoryManagementPage |
| 2.6 封禁读者 | ✅ 完成 | block/unblock API + 用户管理页面操作 |
| 2.7 系统参数 | ✅ 完成 | SystemSettingsPage，配置借阅天数/罚款金额等 |
| 2.8 公告管理 | ✅ 完成 | CRUD + AnnouncementManagementPage，新增/编辑弹窗，未读公告弹窗提醒 |
| ISBN 导入（单本） | ✅ 完成 | OpenLibrary API 查询，填充表单 |
| ISBN 导入（批量） | ✅ 完成 | 批量查询 + `POST /api/books/batch`，返回每项失败原因 |
| 罚款管理 | ✅ 完成 | 计算/支付/拦截 + FineDetailsPage，`fine_per_day` 从系统设置读取 |
| 副本位置管理 | ✅ 完成 | location 字段 + 管理界面 |
| 批量归还审批 | ✅ 完成 | 一键审批全部/按日期审批 |

---

## 已完成收尾工作

### 1. 预约通知功能（2.3 补充部分）

**需求**：当预约的书籍变为可借时，通知用户。

**方案**：采用**站内通知**（in-app notification），不需要邮件/SMTP 集成。

**实现内容**：

**数据库**：新建 `notifications` 表
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'reservation',
  is_read INTEGER DEFAULT 0,
  related_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**后端接口**：
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/notifications/:user_id` | 获取用户通知列表 |
| GET | `/api/notifications/:user_id/unread-count` | 未读通知数 |
| PUT | `/api/notifications/:id/read` | 标记已读 |
| PUT | `/api/notifications/read-all` | 全部已读 |

**触发时机**：在 `approveReturn`（管理员审批归还）中，检查是否有该书的预约记录，如果有则创建通知并将 `notification_sent` 置为 1。

**前端**：
- [Sidebar.tsx](src/components/Sidebar/Sidebar.jsx) 添加通知图标 + 未读计数徽标
- 新建 [NotificationsPage.tsx](src/pages/NotificationsPage.jsx) 通知列表页面
- 在 [App.jsx](src/App.jsx) 添加路由 `/notifications`

**涉及文件**：
- `backend/db.js` — 新增 notifications 表
- `backend/controllers/borrowController.js` — approveReturn 中触发通知
- `backend/controllers/notificationController.js` — 通知列表、未读数、标记已读
- `backend/routes/notificationRoutes.js` — 通知相关路由
- `src/components/Sidebar/Sidebar.jsx` — 添加通知入口
- `src/pages/NotificationsPage.jsx` — 新建通知页面
- `src/utils/api.js` — 添加通知 API 方法
- `src/App.jsx` — 添加路由

### 2. 修复 fine_per_day 硬编码问题

**状态**：已完成。`returnBook` 会读取 `system_settings.fine_per_day`，并保留 `0` 作为有效配置值。

**修改**：在 `returnBook` 函数中查询 `fine_per_day` 设置值替换硬编码。

```javascript
// 改为从系统设置读取
const setting = db.get('SELECT value FROM system_settings WHERE key = ?', ['fine_per_day']);
const parsedFinePerDay = setting ? parseFloat(setting.value) : NaN;
const fine_per_day = Number.isNaN(parsedFinePerDay) ? 0.5 : parsedFinePerDay;
fine = days_overdue * fine_per_day;
```

**涉及文件**：
- `backend/controllers/borrowController.js:177-183`

### 3. 批量 ISBN 导入完善

**问题**：批量导入的错误处理较简单，失败项仅 console.log 不返回给前端。

**改进**：
- 前端在批量导入时添加 ISBN 格式预校验（10位或13位数字）
- 后端批量接口增强错误报告，返回每项失败原因
- 避免重复调用 OpenLibrary 查询已存在于本地数据库的 ISBN
- 前端合并展示预检失败、元数据查询失败和后端导入失败项

**涉及文件**：
- `src/components/Books/AddBookForm.jsx` — 增强批量导入 UI 和错误展示
- `backend/controllers/bookController.js` — batchImportBooks 增强错误返回

### 4. 公告提醒与公告管理弹窗

**实现内容**：
- 新增 `announcement_reads` 表记录用户已读公告
- 新增 `/api/announcements/unread/mine` 和公告已读接口
- `MainLayout` 对未读已发布公告触发弹窗提醒，确认后不重复提醒
- `AnnouncementManagementPage` 新增/编辑表单改为 portal 弹窗，避免被内容层裁切

**涉及文件**：
- `backend/db.js`
- `backend/controllers/announcementController.js`
- `backend/routes/announcementRoutes.js`
- `src/components/layout/MainLayout.jsx`
- `src/pages/AnnouncementManagementPage.jsx`
- `src/pages/AnnouncementManagementPage.css`
- `src/utils/api.js`

### 5. 系统参数增加 fine_per_day 实际使用

**状态**：已完成。SystemSettingsPage 中的 `fine_per_day` 参数可保存，归还罚款计算会读取该参数。

---

## 验证步骤

1. **功能测试**：
   - 借书 → 确认 → 还书 → 审批 → 罚款产生的完整流程
   - 预约一本书 → 管理员归还另一本 → 用户收到通知 → 用户查看通知
   - ISBN 搜索自动填充表单 → 提交添加
   - 批量导入多个 ISBN
   - 副本位置添加/编辑/查看
   - 一键审批归还（全部/按日期）

2. **权限测试**：
   - admin、librarian、user 各角色的功能访问正确
   - 罚款未付时无法借书

3. **回归测试**：
   - 原有 Release 1 功能不受影响（登录、注册、浏览、借书、还书、历史记录）

---

## 发布步骤

1. 完成上述待完成工作
2. 将 `Fix` 分支合并到 `main`
3. 在 main 上创建 git tag（如 `v2.0.0`）
4. 生成 Release Notes（汇总 Release 2 所有功能）
