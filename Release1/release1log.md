# Release1 修改日志

## 修改时间
2026-03-27

## 修改内容

### 1. 功能配置
- 创建了 `src/config/releaseConfig.js` 文件，定义了Release1的功能开关
- 创建了 `backend/config/releaseConfig.js` 文件，定义了Release1的功能开关

### 2. 前端修改

#### App.jsx
- 移除了Release2和Release3的路由，只保留Release1的路由
- 导入了releaseConfig配置文件

#### Sidebar.jsx
- 移除了Release2和Release3的导航菜单，只保留Release1的菜单
- 导入了releaseConfig配置文件

#### UserList.jsx
- 移除了拉黑/解除拉黑按钮和相关处理函数（Release2功能）
- 导入了releaseConfig配置文件

#### BookDetailsPage.jsx
- 移除了预约按钮和相关处理函数（Release2功能）
- 导入了releaseConfig配置文件

#### BooksPage.jsx
- 移除了分类筛选下拉菜单（Release3功能）
- 移除了热门图书Top 10列表（Release3功能）
- 简化了fetchBooks函数，移除了分类参数
- 导入了releaseConfig配置文件

### 3. 后端修改

#### server.js
- 只注册了Release1需要的路由（用户、图书、借阅）
- 移除了Release2和Release3的路由

#### userRoutes.js
- 移除了密码重置功能路由（Release2功能）
- 移除了拉黑/解除拉黑功能路由（Release2功能）

#### bookRoutes.js
- 移除了编辑、删除图书功能路由（Release2功能）
- 移除了热门图书功能路由（Release3功能）

#### borrowRoutes.js
- 移除了预约、续借功能路由（Release2功能）

### 4. 测试验证
- 成功安装前端和后端依赖
- 成功构建前端项目
- 启动后端服务器和前端开发服务器，验证功能正常运行

## Release1 功能列表

### 用户功能
- 登录/退出系统
- 注册账户
- 浏览和搜索图书列表
- 锁定图书并在一定时间内借阅
- 提交还书请求
- 查看借阅历史

### 图书管理员功能
- 添加新图书
- 处理还书请求
- 查看所有图书信息

### 管理员功能
- 创建账户和管理用户信息
- 修改用户角色

## 注意事项
- Release1只包含上述功能，超前的功能已被隐藏
- 所有修改均基于release_plan.md的要求进行
- 代码修改最小化，不影响核心功能的正常使用