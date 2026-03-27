# 图书归还审批系统 - 实现计划

## 项目概述

修改当前的图书归还流程，从直接归还改为用户提交归还请求，图书管理员审批后确认归还。同时确保图书管理员能够查看所有借阅记录。

## 任务分解与优先级

### [x] 任务 1: 后端修改 - 更新归还流程
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 `returnBook` 函数，将状态设置为 "returning" 而不是 "returned"
  - 添加 `approveReturn` 函数，处理图书管理员的审批
  - 更新 `getBorrowingList` 函数，让图书管理员能看到所有借阅记录
- **Success Criteria**:
  - 用户归还图书时，状态变为 "returning"
  - 图书管理员可以审批归还请求
  - 图书管理员可以查看所有借阅记录
- **Test Requirements**:
  - `programmatic` TR-1.1: 用户归还图书后，API 返回状态为 "returning"
  - `programmatic` TR-1.2: 图书管理员审批后，API 返回状态为 "returned"
  - `programmatic` TR-1.3: 图书管理员调用获取借阅记录 API 时，返回所有用户的记录

### [x] 任务 2: 前端修改 - 用户归还流程
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 更新 `BorrowRecords` 组件，修改归还按钮的行为
  - 更新状态显示，增加 "Returning" 状态
  - 调整 UI 以反映新的归还流程
- **Success Criteria**:
  - 用户点击归还按钮后，状态变为 "Returning"
  - 用户界面显示明确的归还请求提交成功信息
- **Test Requirements**:
  - `programmatic` TR-2.1: 用户点击归还按钮后，调用正确的 API 端点
  - `human-judgement` TR-2.2: 用户界面显示清晰的 "Returning" 状态

### [x] 任务 3: 前端修改 - 图书管理员审批界面
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 创建新的 `ReturnApprovalPage` 组件
  - 添加到路由配置，只对管理员和图书管理员开放
  - 在侧边栏添加相应的导航链接
- **Success Criteria**:
  - 图书管理员可以查看所有待审批的归还请求
  - 图书管理员可以批准或拒绝归还请求
  - 审批后状态正确更新
- **Test Requirements**:
  - `programmatic` TR-3.1: 图书管理员登录后可以访问审批页面
  - `programmatic` TR-3.2: 审批页面显示所有 "returning" 状态的记录
  - `programmatic` TR-3.3: 点击批准按钮后，API 调用成功且状态更新

### [x] 任务 4: 数据库更新
- **Priority**: P1
- **Depends On**: None
- **Description**:
  - 确保 `borrow_records` 表的 `status` 字段能够存储 "returning" 状态
  - 检查是否需要其他数据库结构调整
- **Success Criteria**:
  - 数据库能够正确存储和处理 "returning" 状态
- **Test Requirements**:
  - `programmatic` TR-4.1: 插入带有 "returning" 状态的记录成功
  - `programmatic` TR-4.2: 查询 "returning" 状态的记录成功

### [x] 任务 5: 测试和验证
- **Priority**: P1
- **Depends On**: 任务 1, 2, 3, 4
- **Description**:
  - 测试完整的归还审批流程
  - 验证图书管理员权限
  - 检查边界情况和错误处理
- **Success Criteria**:
  - 完整的归还审批流程正常工作
  - 权限控制正确
  - 错误处理完善
- **Test Requirements**:
  - `programmatic` TR-5.1: 完整流程测试通过
  - `human-judgement` TR-5.2: 界面交互流畅，错误提示清晰

## 技术实现细节

### 后端实现
- 修改 `borrowController.js` 中的 `returnBook` 函数
- 添加 `approveReturn` 函数
- 更新 `getBorrowingList` 函数的权限检查

### 前端实现
- 更新 `BorrowRecords.jsx` 组件
- 创建 `ReturnApprovalPage.jsx` 组件
- 更新 `App.jsx` 路由配置
- 更新 `Sidebar.jsx` 导航菜单

### 数据库
- 确保 `borrow_records` 表的 `status` 字段支持 "returning" 值

## 风险评估

- **风险**: 现有借阅记录的状态处理
  - **缓解措施**: 确保向后兼容，只对新的归还请求使用 "returning" 状态

- **风险**: 权限控制不当
  - **缓解措施**: 严格检查 API 端点的权限，确保只有图书管理员和管理员可以审批归还

- **风险**: 用户体验不佳
  - **缓解措施**: 提供清晰的状态反馈和操作指导

## 成功指标

- 用户可以提交归还请求
- 图书管理员可以审批归还请求
- 图书管理员可以查看所有借阅记录
- 整个流程顺畅，用户体验良好