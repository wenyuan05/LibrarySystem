# 项目发布计划

## 1. 任务列表

### [ ] 任务 1: 前端构建
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 运行 `npm run build` 命令构建前端项目
  - 确保构建过程成功完成
- **成功标准**:
  - 生成dist目录，包含构建后的前端文件
- **测试要求**:
  - `programmatic` TR-1.1: 构建过程无错误
  - `programmatic` TR-1.2: dist目录存在且包含必要文件

### [ ] 任务 2: 前端部署
- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 选择合适的前端部署平台（如Vercel、Netlify、GitHub Pages等）
  - 部署构建后的前端文件
- **成功标准**:
  - 前端项目成功部署并可通过URL访问
- **测试要求**:
  - `programmatic` TR-2.1: 部署后的前端能够正常加载
  - `human-judgement` TR-2.2: 前端功能正常运行

### [ ] 任务 3: 后端部署
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 选择合适的后端部署平台（如Heroku、Railway、Vercel等）
  - 部署后端代码并配置环境变量
- **成功标准**:
  - 后端服务成功部署并可通过API访问
- **测试要求**:
  - `programmatic` TR-3.1: 后端服务响应正常
  - `programmatic` TR-3.2: 数据库连接正常

### [ ] 任务 4: 配置API路径
- **优先级**: P0
- **依赖**: 任务 2, 任务 3
- **描述**:
  - 更新前端代码中的API基础URL，指向部署后的后端服务
  - 确保前端能够正确连接后端API
- **成功标准**:
  - 前端能够成功调用后端API
- **测试要求**:
  - `programmatic` TR-4.1: 前端与后端API通信正常
  - `human-judgement` TR-4.2: 数据能够正常传输

### [ ] 任务 5: 测试完整流程
- **优先级**: P0
- **依赖**: 任务 2, 任务 3, 任务 4
- **描述**:
  - 测试完整的用户流程
  - 确保所有功能正常工作
- **成功标准**:
  - 所有功能正常运行
- **测试要求**:
  - `human-judgement` TR-5.1: 完整流程测试通过
  - `human-judgement` TR-5.2: 界面响应正常

## 2. 发布步骤详解

### 前端发布步骤

#### 方法 1: 使用Vercel部署
1. 访问 [Vercel](https://vercel.com/) 并登录
2. 点击 "New Project"
3. 选择 "Import Git Repository" 或 "Upload"
4. 如果选择上传，选择构建后的dist目录
5. 点击 "Deploy"
6. 等待部署完成，获取访问URL

#### 方法 2: 使用Netlify部署
1. 访问 [Netlify](https://www.netlify.com/) 并登录
2. 点击 "Add new site"
3. 选择 "Deploy manually"
4. 拖放构建后的dist目录
5. 点击 "Deploy"
6. 等待部署完成，获取访问URL

### 后端发布步骤

#### 方法 1: 使用Heroku部署
1. 访问 [Heroku](https://www.heroku.com/) 并登录
2. 点击 "Create new app"
3. 输入应用名称，点击 "Create app"
4. 在 "Deploy" 标签页，选择部署方式（Git或上传）
5. 配置环境变量（在 "Settings" -> "Config Vars"）
6. 点击 "Deploy"
7. 等待部署完成，获取访问URL

#### 方法 2: 使用Railway部署
1. 访问 [Railway](https://railway.app/) 并登录
2. 点击 "New Project"
3. 选择 "Deploy from GitHub" 或 "Empty Project"
4. 如果选择空项目，上传后端代码
5. 配置环境变量
6. 点击 "Deploy"
7. 等待部署完成，获取访问URL

## 3. 环境变量配置

### 前端环境变量
- `VITE_API_BASE_URL`: 后端API基础URL

### 后端环境变量
- `PORT`: 服务器端口
- `MONGODB_URI`: MongoDB连接字符串
- `JWT_SECRET`: JWT密钥
- `NODE_ENV`: 环境（production）

## 4. 测试与验证

### 前端测试
1. 访问部署后的前端URL
2. 测试登录功能
3. 测试书籍管理功能
4. 测试用户管理功能
5. 测试借阅记录功能

### 后端测试
1. 访问后端API端点
2. 测试API响应
3. 测试数据库连接
4. 测试认证功能

## 5. 注意事项

- 确保环境变量配置正确
- 确保数据库连接字符串正确
- 确保CORS配置正确，允许前端访问
- 测试所有功能在生产环境中正常工作
- 监控部署后的应用性能

## 6. 发布后的维护

- 定期检查应用运行状态
- 监控错误日志
- 及时更新依赖包
- 备份数据库
- 制定回滚计划