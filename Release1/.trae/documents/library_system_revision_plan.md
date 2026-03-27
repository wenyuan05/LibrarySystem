# 图书馆管理系统 - 业务流程修改计划

## 项目现状分析

当前系统使用SQLite数据库，主要表结构包括：
- `books`：存储书籍基本信息，包含总副本数和可用副本数
- `borrow_records`：存储借阅记录
- `system_settings`：存储系统配置参数

当前借阅流程：
1. 用户在书籍详情页点击"Borrow Now"按钮
2. 系统直接创建借阅记录，更新书籍状态
3. 没有副本级别的管理，只有书籍级别的状态管理

## 需求分析

需要实现以下功能：
1. **书籍副本管理**：每个副本在数据库中要有独立的id
2. **副本信息展示**：在书籍详情页显示所有副本信息，包含id和状态
3. **借阅流程优化**：
   - 点击borrow后书籍状态变为borrowing
   - 进入一小时倒计时
   - 按钮变为confirm borrowing
   - 按下按钮后弹出确认界面
   - 显示用户账户和书籍具体副本id
   - 提供下拉菜单选择副本（默认填充一个可用副本）
   - 确认后书籍正式借出（状态变为borrowed）
   - 超过一小时没确认则书籍状态变回available，借阅记录状态变为超时
4. **系统设置**：管理员可以设置确认时长
5. **图书管理员操作**：添加、编辑、删除图书时的规则相应变化

## 实现计划

### [ ] 任务1：数据库结构修改
- **优先级**：P0
- **Depends On**：None
- **Description**：
  - 创建`book_copies`表，存储书籍副本信息
  - 在`system_settings`表中添加`borrow_confirm_minutes`配置项
  - 修改`borrow_records`表，添加`copy_id`字段关联副本
  - 修改`books`表，移除`total_copies`和`available_copies`字段
- **Success Criteria**：
  - 数据库结构正确创建
  - 所有表之间的关联关系正确建立
  - 系统设置项正确添加
- **Test Requirements**：
  - `programmatic` TR-1.1：数据库迁移脚本执行成功
  - `programmatic` TR-1.2：所有表结构验证正确
  - `programmatic` TR-1.3：系统设置项默认值正确设置

### [ ] 任务2：后端API修改
- **优先级**：P0
- **Depends On**：任务1
- **Description**：
  - 修改`bookController.js`，添加副本管理相关API
  - 修改`borrowController.js`，实现新的借阅流程
  - 添加`copy_id`参数到借阅相关API
  - 实现借阅确认倒计时逻辑
  - 实现超时处理逻辑
- **Success Criteria**：
  - 所有API接口正常工作
  - 借阅流程按新逻辑执行
  - 超时处理正确执行
- **Test Requirements**：
  - `programmatic` TR-2.1：所有API接口测试通过
  - `programmatic` TR-2.2：借阅流程测试通过
  - `programmatic` TR-2.3：超时处理测试通过

### [ ] 任务3：前端书籍详情页修改
- **优先级**：P0
- **Depends On**：任务2
- **Description**：
  - 修改`BookDetailsPage.jsx`，显示书籍所有副本信息
  - 实现新的借阅流程UI
  - 添加确认界面和副本选择下拉菜单
  - 实现倒计时显示
- **Success Criteria**：
  - 书籍详情页正确显示所有副本信息
  - 借阅流程UI正常工作
  - 倒计时功能正确显示
  - 确认界面正确显示和操作
- **Test Requirements**：
  - `human-judgment` TR-3.1：页面布局美观，信息清晰
  - `programmatic` TR-3.2：所有交互功能测试通过
  - `programmatic` TR-3.3：倒计时功能测试通过

### [ ] 任务4：系统设置页面修改
- **优先级**：P1
- **Depends On**：任务1
- **Description**：
  - 修改`SystemSettingsPage.jsx`，添加借阅确认时长设置
  - 实现设置保存和加载功能
- **Success Criteria**：
  - 系统设置页面正确显示借阅确认时长设置项
  - 设置保存和加载功能正常工作
- **Test Requirements**：
  - `human-judgment` TR-4.1：设置界面美观，操作便捷
  - `programmatic` TR-4.2：设置保存和加载测试通过

### [ ] 任务5：图书管理员操作修改
- **优先级**：P1
- **Depends On**：任务1
- **Description**：
  - 修改`AddBookForm.jsx`，支持添加多副本
  - 修改`EditBookForm.jsx`，支持编辑副本信息
  - 修改删除书籍逻辑，同时删除相关副本
- **Success Criteria**：
  - 添加书籍时正确创建副本
  - 编辑书籍时正确更新副本信息
  - 删除书籍时正确删除相关副本
- **Test Requirements**：
  - `programmatic` TR-5.1：添加书籍测试通过
  - `programmatic` TR-5.2：编辑书籍测试通过
  - `programmatic` TR-5.3：删除书籍测试通过

### [ ] 任务6：数据迁移
- **优先级**：P0
- **Depends On**：任务1
- **Description**：
  - 编写数据迁移脚本，将现有书籍数据转换为新结构
  - 为现有书籍创建相应的副本记录
- **Success Criteria**：
  - 数据迁移脚本执行成功
  - 现有数据正确转换为新结构
  - 所有书籍都有相应的副本记录
- **Test Requirements**：
  - `programmatic` TR-6.1：数据迁移脚本执行成功
  - `programmatic` TR-6.2：迁移后数据验证正确

### [ ] 任务7：测试和优化
- **优先级**：P2
- **Depends On**：所有任务
- **Description**：
  - 进行全面的系统测试
  - 优化性能和用户体验
  - 修复可能的bug
- **Success Criteria**：
  - 所有功能测试通过
  - 系统性能良好
  - 用户体验流畅
- **Test Requirements**：
  - `programmatic` TR-7.1：所有功能测试通过
  - `human-judgment` TR-7.2：系统性能和用户体验良好

## 技术实现要点

1. **数据库设计**：
   - `book_copies`表：id, book_id, status, created_at, updated_at
   - `borrow_records`表添加`copy_id`字段
   - `system_settings`表添加`borrow_confirm_minutes`配置项

2. **后端实现**：
   - 实现副本管理API
   - 实现新的借阅流程，包含borrowing状态和倒计时
   - 实现定时任务处理超时借阅

3. **前端实现**：
   - 书籍详情页显示副本列表
   - 实现借阅确认流程和倒计时
   - 实现副本选择下拉菜单

4. **数据迁移**：
   - 编写脚本将现有书籍数据转换为新结构
   - 确保数据完整性和一致性

## 预期完成时间

- 任务1-2：2天
- 任务3-4：1天
- 任务5：1天
- 任务6：1天
- 任务7：1天

总计：6天

## 风险评估

1. **数据迁移风险**：现有数据转换可能出现问题，需要备份数据
2. **兼容性风险**：修改数据库结构可能影响现有功能，需要充分测试
3. **性能风险**：增加副本管理可能增加数据库负担，需要优化查询
4. **用户体验风险**：新的借阅流程可能需要用户适应，需要设计友好的界面

## 应对策略

1. **数据迁移**：先备份数据库，编写详细的迁移脚本，测试迁移过程
2. **兼容性**：进行全面的测试，确保现有功能正常工作
3. **性能**：优化数据库查询，使用适当的索引
4. **用户体验**：设计清晰的界面和流程，提供明确的操作指引