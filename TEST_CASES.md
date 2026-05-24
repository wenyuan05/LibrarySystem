# 图书馆管理系统测试用例

## 1. 登录功能测试

### 测试用例 1.1：正常登录（管理员）
- **测试场景**：使用管理员账号登录系统
- **输入数据**：
  - 用户名：admin
  - 密码：admin123
- **预期结果**：
  - 登录成功
  - 跳转到系统主页
  - 显示管理员权限的功能菜单

### 测试用例 1.2：正常登录（普通用户）
- **测试场景**：使用普通用户账号登录系统
- **输入数据**：
  - 用户名：user1
  - 密码：user123
- **预期结果**：
  - 登录成功
  - 跳转到系统主页
  - 显示普通用户权限的功能菜单

### 测试用例 1.3：登录失败（用户名不存在）
- **测试场景**：使用不存在的用户名登录
- **输入数据**：
  - 用户名：nonexistent
  - 密码：123456
- **预期结果**：
  - 登录失败
  - 显示错误信息："Invalid username or password"

### 测试用例 1.4：登录失败（密码错误）
- **测试场景**：使用正确的用户名但错误的密码登录
- **输入数据**：
  - 用户名：admin
  - 密码：wrongpassword
- **预期结果**：
  - 登录失败
  - 显示错误信息："Invalid username or password"

### 测试用例 1.5：登录失败（输入校验）
- **测试场景**：使用不符合规则的用户名和密码登录
- **输入数据**：
  - 用户名：te（少于3个字符）
  - 密码：123（少于6个字符）
- **预期结果**：
  - 前端验证失败
  - 显示错误信息："Username must be between 3 and 20 characters" 和 "Password must be at least 6 characters"

## 2. 注册功能测试

### 测试用例 2.1：正常注册
- **测试场景**：使用符合规则的信息注册新用户
- **输入数据**：
  - 用户名：newuser
  - 密码：password123
  - 姓名：New User
  - 邮箱：newuser@example.com
- **预期结果**：
  - 注册成功
  - 自动登录系统
  - 跳转到系统主页

### 测试用例 2.2：注册失败（用户名已存在）
- **测试场景**：使用已存在的用户名注册
- **输入数据**：
  - 用户名：admin
  - 密码：password123
  - 姓名：Test User
  - 邮箱：test@example.com
- **预期结果**：
  - 注册失败
  - 显示错误信息："Username already exists"

### 测试用例 2.3：注册失败（输入校验）
- **测试场景**：使用不符合规则的信息注册
- **输入数据**：
  - 用户名：te（少于3个字符）
  - 密码：123（少于6个字符）
  - 姓名：T（少于2个字符）
  - 邮箱：invalid-email（无效邮箱格式）
- **预期结果**：
  - 前端验证失败
  - 显示相应的错误信息

### 测试用例 2.4：找回密码输入校验
- **测试场景**：使用无效邮箱或手机号找回密码
- **操作步骤**：
  1. 打开登录页
  2. 点击 Forgot password?
  3. 不填写邮箱和手机号直接提交
  4. 输入格式错误的邮箱或手机号再次提交
- **预期结果**：
  - 页面显示字段级错误提示
  - 无效输入不会提交到后端
  - 修正输入后错误提示清除

### 测试用例 2.5：重置密码输入校验
- **测试场景**：重置密码时输入无效新密码
- **操作步骤**：
  1. 进入 Reset Password 表单
  2. 输入少于 6 位的新密码
  3. 输入与新密码不一致的确认密码
  4. 提交表单
- **预期结果**：
  - 页面显示新密码长度错误和确认密码不一致错误
  - 无效输入不会提交到后端
  - 两次密码一致且满足长度后可继续提交

## 3. 书籍管理功能测试（管理员）

### 测试用例 3.1：添加书籍
- **测试场景**：添加一本新书籍
- **输入数据**：
  - 标题：Test Book
  - 作者：Test Author
  - ISBN：9781234567890
- **预期结果**：
  - 书籍添加成功
  - 显示成功提示
  - 书籍列表中显示新添加的书籍

### 测试用例 3.2：添加书籍失败（ISBN已存在）
- **测试场景**：添加一本ISBN已存在的书籍
- **输入数据**：
  - 标题：Duplicate Book
  - 作者：Test Author
  - ISBN：9781234567890（已存在）
- **预期结果**：
  - 添加失败
  - 显示错误信息："Book with this ISBN already exists"

### 测试用例 3.3：添加书籍失败（输入校验）
- **测试场景**：使用不符合规则的信息添加书籍
- **输入数据**：
  - 标题：（空）
  - 作者：（空）
  - ISBN：123（无效ISBN格式）
- **预期结果**：
  - 前端验证失败
  - 显示相应的错误信息

### 测试用例 3.4：删除书籍
- **测试场景**：删除一本存在的书籍
- **操作步骤**：
  1. 登录管理员账号
  2. 进入书籍管理页面
  3. 选择一本书籍
  4. 点击删除按钮
- **预期结果**：
  - 书籍删除成功
  - 显示成功提示
  - 书籍列表中不再显示该书籍

## 4. 用户管理功能测试（管理员）

### 测试用例 4.1：查看用户列表
- **测试场景**：查看系统中的所有用户
- **操作步骤**：
  1. 登录管理员账号
  2. 进入用户管理页面
- **预期结果**：
  - 显示所有用户的列表
  - 包含用户名、角色、姓名、邮箱等信息

### 测试用例 4.2：添加用户
- **测试场景**：添加一个新用户
- **输入数据**：
  - 用户名：adminuser
  - 密码：password123
  - 角色：admin
  - 姓名：Admin User
  - 邮箱：adminuser@example.com
- **预期结果**：
  - 用户添加成功
  - 显示成功提示
  - 用户列表中显示新添加的用户

### 测试用例 4.3：删除用户
- **测试场景**：删除一个存在的用户
- **操作步骤**：
  1. 登录管理员账号
  2. 进入用户管理页面
  3. 选择一个用户
  4. 点击删除按钮
- **预期结果**：
  - 用户删除成功
  - 显示成功提示
  - 用户列表中不再显示该用户

## 5. 借阅功能测试

### 测试用例 5.1：借阅书籍
- **测试场景**：用户借阅一本可用的书籍
- **操作步骤**：
  1. 登录用户账号
  2. 进入书籍列表页面
  3. 选择一本状态为"available"的书籍
  4. 点击借阅按钮
- **预期结果**：
  - 借阅成功
  - 显示成功提示
  - 书籍状态变为"borrowed"
  - 借阅记录中显示该记录

### 测试用例 5.2：归还书籍
- **测试场景**：用户归还一本已借阅的书籍
- **操作步骤**：
  1. 登录用户账号
  2. 进入借阅记录页面
  3. 选择一本已借阅但未归还的书籍
  4. 点击归还按钮
- **预期结果**：
  - 归还成功
  - 显示成功提示
  - 书籍状态变为"available"
  - 借阅记录中显示归还日期

### 测试用例 5.3：借阅失败（书籍不可用）
- **测试场景**：尝试借阅一本已被借阅的书籍
- **操作步骤**：
  1. 登录用户账号
  2. 进入书籍列表页面
  3. 选择一本状态为"borrowed"的书籍
  4. 点击借阅按钮
- **预期结果**：
  - 借阅失败
  - 显示错误信息："Book is not available"

## 6. 权限控制测试

### 测试用例 6.1：普通用户访问管理员功能
- **测试场景**：普通用户尝试访问用户管理页面
- **操作步骤**：
  1. 登录普通用户账号
  2. 尝试访问用户管理页面
- **预期结果**：
  - 访问被拒绝
  - 显示错误信息："Forbidden: insufficient permissions"

### 测试用例 6.2：未登录用户访问受保护页面
- **测试场景**：未登录用户尝试访问系统主页
- **操作步骤**：
  1. 清除浏览器缓存和登录状态
  2. 直接访问系统主页URL
- **预期结果**：
  - 自动跳转到登录页面
  - 显示登录表单

## 7. 数据验证测试

### 测试用例 7.1：ISBN唯一性验证
- **测试场景**：尝试添加两本ISBN相同的书籍
- **操作步骤**：
  1. 登录管理员账号
  2. 添加一本ISBN为9781234567890的书籍
  3. 再次尝试添加ISBN为9781234567890的书籍
- **预期结果**：
  - 第二次添加失败
  - 显示错误信息："Book with this ISBN already exists"

### 测试用例 7.2：用户名唯一性验证
- **测试场景**：尝试注册两个相同用户名的用户
- **操作步骤**：
  1. 注册一个用户名为testuser的用户
  2. 再次尝试注册用户名为testuser的用户
- **预期结果**：
  - 第二次注册失败
  - 显示错误信息："Username already exists"

## 8. Release 2 通知与公告测试

### 测试用例 8.1：预约可借站内通知
- **测试场景**：预约图书在归还审批后恢复可借，预约用户收到通知
- **操作步骤**：
  1. 使用 Reader A 借出一本书并确认借阅
  2. 使用 Reader B 对同一本无可用副本的书创建预约
  3. Reader A 提交归还申请
  4. 管理员或图书管理员进入归还审批页面并审批该记录
  5. Reader B 登录系统
- **预期结果**：
  - 系统在 `notifications` 表生成一条预约可借通知
  - Reader B 侧边栏显示未读通知数量
  - Reader B 进入 `/notifications` 可看到通知内容

### 测试用例 8.1.1：新增可用副本触发预约通知
- **测试场景**：预约图书无可用副本，管理员新增可用副本后预约用户收到通知
- **操作步骤**：
  1. 使用 Reader B 对一本无可用副本的书创建预约
  2. 管理员或图书管理员进入书籍副本管理
  3. 为该书新增一个副本，默认状态为 available
  4. Reader B 查看侧边栏和通知中心
- **预期结果**：
  - 系统在 `notifications` 表生成一条预约可借通知
  - 预约记录 `notification_sent` 更新为 1
  - Reader B 侧边栏未读 badge 立即显示通知数量

### 测试用例 8.1.2：副本状态恢复 available 触发预约通知
- **测试场景**：管理员将副本状态改为 available 后预约用户收到通知
- **操作步骤**：
  1. 使用 Reader B 对一本无可用副本的书创建预约
  2. 管理员或图书管理员将该书某个副本状态从 unavailable/borrowed/reserved 改为 available
  3. Reader B 查看侧边栏和通知中心
- **预期结果**：
  - 系统创建预约可借通知并标记预约已通知
  - Reader B 可在 `/notifications` 看到通知内容

### 测试用例 8.1.3：归还后审批前可支付罚款
- **测试场景**：用户逾期归还后，在图书管理员审批前即可支付罚款
- **操作步骤**：
  1. 准备一条已逾期且状态为 `borrowed` 或 `overdue` 的借阅记录
  2. Reader 提交归还申请
  3. Reader 打开罚款详情或借阅记录中的罚款弹窗
  4. 点击 Pay Fine
  5. 图书管理员再审批该归还申请
- **预期结果**：
  - 提交归还后记录状态为 `returning`，罚款记录显示为 `unpaid`
  - Pay Fine 在审批前成功，罚款记录更新为 `paid`
  - 用户 `total_fine` 同步为 0
  - 管理员审批后记录状态为 `returned`，罚款状态保持 `paid`，不会重复累计罚款

### 测试用例 8.2：通知已读不重复计数
- **测试场景**：用户标记通知已读后，未读数量减少且不再显示为未读
- **操作步骤**：
  1. 使用有未读通知的 Reader 登录
  2. 进入通知页面
  3. 点击单条未读通知或点击 Mark All Read
  4. 切换页面或刷新
- **预期结果**：
  - 被处理的通知 `is_read` 更新为 1
  - 侧边栏未读数量同步减少
  - 已读通知不再以未读状态展示
  - 不需要刷新页面或切换路由即可看到 badge 更新

### 测试用例 8.3：未读公告弹窗提醒
- **测试场景**：用户登录后存在未读已发布公告，系统弹窗提醒
- **操作步骤**：
  1. 管理员进入公告管理页面
  2. 通过 Add Announcement 弹窗创建并发布公告
  3. 使用普通用户登录并进入任意受保护页面
- **预期结果**：
  - 页面显示公告提醒弹窗
  - 弹窗中展示未读公告标题、内容和创建日期
  - 点击 Got It 后写入公告已读记录

### 测试用例 8.4：已读公告不重复提醒
- **测试场景**：用户确认公告后，再次进入系统不重复弹窗
- **操作步骤**：
  1. 使用普通用户确认公告提醒弹窗
  2. 刷新页面或重新登录
  3. 再次进入受保护页面
- **预期结果**：
  - 已确认公告不会再次触发弹窗
  - `/api/announcements/unread/mine` 不返回已读公告

### 测试用例 8.5：公告管理弹窗表单
- **测试场景**：管理员通过弹窗新增和编辑公告
- **操作步骤**：
  1. 管理员进入 `/announcement-management`
  2. 点击 Add Announcement
  3. 填写标题和内容，切换 Publish Announcement 开关
  4. 保存公告
  5. 点击列表中的 Edit 修改公告
- **预期结果**：
  - 新增/编辑表单以弹窗形式显示，不被页面内容层裁切
  - 保存后弹窗关闭并刷新列表
  - 列表展示标题、内容预览、发布状态、创建时间和操作按钮

### 测试用例 8.6：批量 ISBN 导入失败项展示
- **测试场景**：批量导入混合有效、重复、无效和查不到元数据的 ISBN
- **操作步骤**：
  1. 管理员或图书管理员进入书籍管理页面
  2. 打开 Add New Book 的 Batch Import
  3. 输入有效 ISBN、重复 ISBN、格式错误 ISBN 和 OpenLibrary 查不到的 ISBN
  4. 执行导入
- **预期结果**：
  - 有效书籍导入成功并生成副本
  - 失败项在导入结果中逐条展示 ISBN 和失败原因
  - 重复或无效 ISBN 不会被静默忽略

### 测试用例 8.7：添加书籍弹窗层级
- **测试场景**：管理员在书籍管理页打开 Add New Book
- **操作步骤**：
  1. 登录管理员账号
  2. 打开 `/book-management`
  3. 点击 Add New Book
- **预期结果**：
  - Add New Book 弹窗显示在书籍页面容器之上
  - 弹窗不被页面卡片、滚动容器或背景内容裁切
  - 点击遮罩或关闭按钮可正常关闭弹窗

### 测试用例 8.8：列表排序按钮文案
- **测试场景**：检查列表排序切换按钮显示
- **操作步骤**：
  1. 打开借阅记录、罚款详情、预约列表和日志页面
  2. 查看排序按钮
  3. 点击排序按钮切换顺序
- **预期结果**：
  - 排序按钮显示 `Ascending` 或 `Descending`
  - 不再显示 `Oldest First` 或 `Newest First`
  - 点击后列表顺序正常切换

### 测试用例 8.9：系统设置分组与可用项
- **测试场景**：管理员查看和编辑系统设置
- **操作步骤**：
  1. 登录管理员账号
  2. 打开 `/system-settings`
  3. 查看设置分组和字段
  4. 开启 Editable mode，修改一个已实现设置并保存
- **预期结果**：
  - 页面以 Borrow Rules 和 Fine Rules 分组卡片展示
  - 仅显示 `borrow_period_days`、`max_borrows`、`borrow_confirm_minutes`、`max_renew_times`、`renew_days`、`fine_per_day` 对应设置
  - 不显示未接入业务逻辑的 System Name、System Version、Max Reservations、Blacklist Days、Late Return Policy、Lost Book Compensation
  - 修改后出现 pending save bar，点击 Save Changes 后保存成功并显示成功提示
## Test Cases Update - 2026-05-13

### Test Case: Prevent deleting users with active lending state

- **Scenario**: Admin attempts to delete users with active records.
- **Steps**:
  1. Create or select a user with a `borrowing`, `borrowed`, `overdue`, or `returning` borrow record.
  2. Attempt to delete the user from User Management.
  3. Create or select a user with an active reservation and attempt deletion.
  4. Attempt to delete the currently logged-in admin account.
  5. Attempt to delete another admin account.
- **Expected result**:
  - Delete is rejected for active borrow records.
  - Delete is rejected for active reservations.
  - Delete is rejected for the current account.
  - Delete is rejected for admin accounts.
  - The frontend displays the backend error message.

### Test Case: Prevent deleting books with active lending or reservation state

- **Scenario**: Admin or librarian attempts to delete books that are still operationally active.
- **Steps**:
  1. Select a book with a `borrowing`, `borrowed`, `overdue`, or `returning` record.
  2. Attempt to delete the book.
  3. Select a book with an occupied copy status (`borrowing`, `borrowed`, or `reserved`) and attempt deletion.
  4. Select a book with an active reservation and attempt deletion.
- **Expected result**:
  - Delete is rejected in all active or occupied states.
  - No book, copy, category link, borrow record, or reservation record is orphaned.
  - The frontend displays the backend error message.

### Test Case: Delete one available copy

- **Scenario**: Admin or librarian deletes a surplus available copy.
- **Steps**:
  1. Open Book Management.
  2. Click `Manage Copies` for a book with at least two copies.
  3. Choose a copy whose status is `available`.
  4. Click `Delete`.
  5. Confirm the browser confirmation prompt.
- **Expected result**:
  - The copy row is removed from the modal.
  - `books.total_copies` decreases by one.
  - `books.available_copies` is recalculated correctly.
  - The book still has at least one copy.

### Test Case: Block unsafe copy deletion

- **Scenario**: Admin or librarian attempts to delete a copy that should not be removable.
- **Steps**:
  1. Try deleting a copy with status `borrowed`, `borrowing`, `reserved`, or `unavailable`.
  2. Try deleting the only remaining copy of a book.
  3. Try deleting an available copy that still has an active borrow record in the database.
- **Expected result**:
  - The UI disables obvious unsafe copy deletes.
  - The backend rejects all unsafe delete attempts even if called directly.
  - Book counters remain unchanged after rejected attempts.

### Test Case: Copy Management desktop layout

- **Scenario**: Confirm that action buttons are visible without horizontal dragging.
- **Steps**:
  1. Open Copy Management on a desktop viewport.
  2. Confirm the table displays Barcode, Status, Location, and Action columns.
  3. Verify `Confirm` and `Delete` buttons are visible without dragging the bottom horizontal scrollbar.
  4. Resize to a small mobile-width viewport.
- **Expected result**:
  - Desktop layout shows action buttons immediately.
  - Small screens may use horizontal scrolling while keeping controls readable.

### Test Case: Log clear validation

- **Scenario**: Admin clears logs with valid and invalid age filters.
- **Steps**:
  1. Call `DELETE /api/logs/clear` with `days = 7`.
  2. Call it with `days = 0`.
  3. Call it with invalid values such as `-1`, `1.5`, or a string.
- **Expected result**:
  - Valid values clear matching logs.
  - `0` clears all logs.
  - Invalid values return HTTP 400 and do not delete logs.

### Test Case: Books page Reserved filter

- **Scenario**: Reader filters the Books page to show books they have reserved.
- **Steps**:
  1. Log in as a reader.
  2. Reserve a book from the Books page, or use an existing active reservation.
  3. Return to the Books page.
  4. Click the `Reserved` quick filter.
  5. Cancel the reservation from the book card and check the filter again.
- **Expected result**:
  - Books with the current reader's `active` or `pending` reservation records are displayed.
  - Books are matched by reservation `book_id`, not by a book-level `status` field.
  - After canceling a reservation, the book disappears from the `Reserved` filter without a full page reload.

### Test Case: Books page search button

- **Scenario**: Reader searches books from the Books page toolbar.
- **Steps**:
  1. Log in as a reader.
  2. Open the Books page.
  3. Enter a title, author, or ISBN in the search field.
  4. Click the search icon button beside the input.
  5. Clear the input and click the search icon button again.
- **Expected result**:
  - The search icon button is visible beside the Books page search input.
  - Clicking the button reruns the search using the current input value.
  - Clearing the input and clicking the button reloads the full book list.

### Test Case: Books list availability fallback

- **Scenario**: Reader opens Books while per-book copy details are still loading.
- **Steps**:
  1. Log in as a reader.
  2. Open the Books page.
  3. Observe book cards immediately after the main book list loads.
  4. Wait for copy details to finish loading.
- **Expected result**:
  - Book cards use `available_copies` from the book list response until copy details are available.
  - Available books are not temporarily marked as `Borrowed` while copy details are loading.
  - Once copy details load, card status matches the actual available copy count.

### Test Case: Borrowing feature toggle

- **Scenario**: Admin globally disables and re-enables reader borrowing.
- **Steps**:
  1. Log in as admin and open `/system-settings`.
  2. Enable Editable mode, switch `Borrowing Enabled` off, and save changes.
  3. Log in as a reader and open the Books page or a book detail page with available copies.
  4. Check the Borrow and Confirm Borrow controls.
  5. Call `POST /api/borrow/borrow` and `POST /api/borrow/confirm-borrow` directly while the setting is off.
  6. Re-enable `Borrowing Enabled` and save changes.
- **Expected result**:
  - Reader-facing borrow and confirm-borrow buttons are disabled and show `Borrowing Disabled` while the setting is off.
  - `GET /api/system/feature-flags` returns `borrow_enabled: false`.
  - Both borrow endpoints return HTTP 403 with `Borrowing is currently disabled by the system administrator`.
  - Re-enabling the setting restores normal borrow controls and `borrow_enabled: true`.

### Test Case: Alipay backend configuration

- **Scenario**: Backend loads Alipay sandbox configuration without exposing secrets.
- **Steps**:
  1. Copy `backend/.env.example` to `backend/.env`.
  2. Set `ALIPAY_ENABLED=true` and leave one required Alipay value empty.
  3. Start the backend server.
  4. Fill all required Alipay values and restart the backend server.
- **Expected result**:
  - Backend startup logs include a safe Alipay configuration summary.
  - Local test configuration uses `http://localhost:3001/api/payments/alipay/notify` and `http://localhost:5173/payment-result`.
  - Startup warns about missing required values only when `ALIPAY_ENABLED=true`.
  - Startup logs do not print the application private key or Alipay public key contents.
  - When all required values are present, no missing-configuration warning is shown.

### Test Case: Alipay fine payment simulation API

- **Scenario**: User creates a simulated Alipay fine payment and completes it through the local notify simulation endpoint.
- **Steps**:
  1. Prepare a user with one or more `borrow_records` where `fine > 0` and `fine_status = unpaid`.
  2. Call `POST /api/payments/fines/alipay` as the same user with `{ "user_id": <userId> }`.
  3. Confirm the response contains `out_trade_no`, `qr_code`, `payment_url`, `status = pending`, and linked `borrow_record_ids`.
  4. Call `GET /api/payments/:id` and confirm the payment is still `pending`.
  5. Call `POST /api/payments/alipay/simulate-notify/:out_trade_no`.
  6. Reload the user's fine records and income summary.
  7. Create another payment, expire it with `POST /api/payments/:id/expire`, then try to simulate success for the expired order.
  8. Try to expire an already paid order.
- **Expected result**:
  - Creating a payment includes only `returning` / `returned` actual unpaid fines and excludes unreturned overdue estimated fines.
  - Creating a payment does not immediately mark fines as paid.
  - Simulated notify marks the payment as `paid`.
  - Linked fine records become `fine_status = paid`.
  - `users.total_fine` is recalculated from remaining unpaid fines.
  - `GET /api/payments/income/summary` includes the paid amount for admin/librarian users.
  - Repeating the simulated notify call is idempotent and does not duplicate income.
  - If linked fines were already paid by another flow while the payment was pending, simulated notify is rejected and does not add income.
  - Expired orders cannot be simulated as paid.
  - Paid orders cannot be expired.

### Test Case: Alipay sandbox page-pay link generation

- **Scenario**: Backend creates a sandbox Alipay cashier link when Alipay is enabled and configured.
- **Steps**:
  1. Configure backend `.env` with `ALIPAY_ENABLED=true`, `ALIPAY_MODE=sandbox`, sandbox `ALIPAY_APP_ID`, app private key, Alipay public key, notify URL, and return URL.
  2. Restart the backend.
  3. Create a payable fine payment with `POST /api/payments/fines/alipay`.
  4. Open the returned `payment_url`.
- **Expected result**:
  - `payment_url` and `qr_code` point to the configured Alipay sandbox gateway instead of local `/payment-result`.
  - The URL contains a signed `alipay.trade.page.pay` request with the local `out_trade_no` and amount.
  - If Alipay configuration is disabled or incomplete, payment creation falls back to the local `/payment-result` simulation link.

### Test Case: Alipay sandbox notify verification

- **Scenario**: Backend receives a verified sandbox notify and completes the linked fine payment.
- **Steps**:
  1. Complete or simulate a sandbox payment so Alipay sends `POST /api/payments/alipay/notify`.
  2. Confirm the backend receives form fields including `out_trade_no`, `trade_status`, and `sign`.
  3. Reload `GET /api/payments/trade/:out_trade_no` and the user's fine records.
- **Expected result**:
  - Valid signed notifications with `TRADE_SUCCESS` or `TRADE_FINISHED` mark the payment as `paid`.
  - Linked actual unpaid fines become `fine_status = paid`.
  - Invalid signatures or unknown order numbers return `fail` and do not change fine state.

### Test Case: Alipay sandbox active status query

- **Scenario**: Local deployment has no public notify URL, so the frontend polling path synchronizes payment status by querying Alipay.
- **Steps**:
  1. Enable and configure Alipay sandbox settings in backend `.env`.
  2. Create a payable fine payment and open the returned sandbox cashier URL.
  3. Complete payment in the sandbox cashier.
  4. Refresh Fine Records or `/payment-result`, or wait for their polling interval.
- **Expected result**:
  - `GET /api/payments/:id` and `GET /api/payments/trade/:out_trade_no` query `alipay.trade.query` for pending orders.
  - If Alipay reports `TRADE_SUCCESS` or `TRADE_FINISHED`, the local payment becomes `paid` and linked fines become paid.
  - If Alipay reports `TRADE_CLOSED`, the local payment becomes `expired`.
  - If the Alipay query times out or fails, the local payment remains pending and the frontend polling keeps working.

### Test Case: Fine page Alipay simulation flow

- **Scenario**: User pays fines from Fine Records through the simulated Alipay payment panel.
- **Steps**:
  1. Log in as a user with unpaid fines.
  2. Open the Fine Records page.
  3. Click `Pay with Alipay`.
  4. Confirm the Alipay payment panel appears with an order number, amount, QR image, and payment link.
  5. Confirm `Simulate Payment Success` is visible only when `ALIPAY_MODE=sandbox` or `ALIPAY_SIMULATION_ENABLED=true`.
  6. Reload fine records before clicking simulate success.
  7. Click `Simulate Payment Success`.
- **Expected result**:
  - Fine Records shows Payable Fine separately from Estimated Fine.
  - Clicking `Pay with Alipay` creates a pending payment order only for actual unpaid fines and does not immediately mark fines as paid.
  - The page shows the simulated Alipay payment UI instead of directly calling the legacy fine settlement API.
  - The simulated Alipay payment UI displays a real QR image and a browser-openable `/payment-result` link.
  - Fine Records polls `GET /api/payments/:id` every 2-3 seconds while a payment order is open.
  - Clicking `Simulate Payment Success` marks the payment and linked fines as paid, then refreshes the unpaid fine total.
  - If another page or dashboard expires the order, Fine Records updates the order status to `expired` and prompts the user to create a new order.
  - Opening the `/payment-result` link after simulated success shows the latest backend payment status as `paid`.
  - `/payment-result` can refresh manually and also polls automatically every 2-3 seconds.

### Test Case: Payment order management and income dashboard

- **Scenario**: Librarian manages simulated Alipay fine payment orders locally.
- **Steps**:
  1. Create a payable fine payment for a user.
  2. Create the same payment again before completing or expiring the first order.
  3. Log in as librarian or admin and open `/income-dashboard`.
  4. Filter payments by `Pending`.
  5. Expire a pending payment order.
  6. Complete another payment with `Simulate Payment Success` and refresh the dashboard.
  7. Create the same payment again after the first pending order was expired.
- **Expected result**:
  - The second create call reuses the existing pending order for the same fine records instead of creating a duplicate.
  - `/income-dashboard` shows total income, today income, month income, paid count, pending count, and payment rows.
  - Pending rows can be marked expired.
  - Expired payments do not mark fines as paid.
  - After a pending order is expired, creating the payment again creates a new pending order rather than reusing the expired one.
  - Paid payments appear in the income totals after simulated success.

### Test Case: Borrow records fine modal payment route

- **Scenario**: User starts fine payment from the My Borrow Records fine modal.
- **Steps**:
  1. Log in as a user with unpaid fines.
  2. Open My Borrow Records.
  3. Click `View Fines`.
  4. Click `Pay with Alipay` in the fine modal.
- **Expected result**:
  - The modal closes and the app navigates to `/fines/:userId`.
  - No direct `/api/borrow/pay-fine` request is made from the frontend.
  - The user completes payment through the Fine Records Alipay simulation panel.
