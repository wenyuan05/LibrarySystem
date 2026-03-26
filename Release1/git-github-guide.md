# Git和GitHub使用指南

## 目录

- [Git和GitHub使用指南](#git和github使用指南)
  - [目录](#目录)
  - [1. 什么是Git和GitHub？](#1-什么是git和github)
  - [2. 安装Git](#2-安装git)
  - [3. Git基础操作](#3-git基础操作)
  - [4. GitHub基础操作](#4-github基础操作)
  - [5. Git和GitHub协作流程](#5-git和github协作流程)
  - [6. 常见问题和解决方案](#6-常见问题和解决方案)
  - [7. 实用技巧和最佳实践](#7-实用技巧和最佳实践)

## 1. 什么是Git和GitHub？

Git是一个分布式版本控制系统，用于跟踪项目中文件的变化。GitHub是一个基于Git的代码托管平台，允许开发者存储、管理和协作开发代码。

## 2. 安装Git

### 2.1 Windows系统

1. 访问[Git官网](https://git-scm.com/downloads)
2. 下载Windows版本的Git安装包
3. 运行安装程序，按照默认选项安装即可
4. 安装完成后，打开命令提示符或Git Bash，输入 `git --version` 检查是否安装成功

### 2.2 Mac系统

1. 使用Homebrew安装：`brew install git`
2. 或从[Git官网](https://git-scm.com/downloads)下载Mac版本的安装包
3. 安装完成后，打开终端，输入 `git --version` 检查是否安装成功

### 2.3 Linux系统

1. Ubuntu/Debian：`sudo apt-get install git`
2. CentOS/RHEL：`sudo yum install git`
3. 安装完成后，打开终端，输入 `git --version` 检查是否安装成功

## 3. Git基础操作

### 3.1 初始化仓库

1. 创建一个新目录并进入：
   ```bash
   mkdir my-project
   cd my-project
   ```

2. 初始化Git仓库：
   ```bash
   git init
   ```

### 3.2 配置Git

设置用户名和邮箱（用于提交记录）：

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3.3 基本命令

#### 添加文件到暂存区

```bash
git add 文件名
# 或添加所有文件
git add .
```

#### 提交更改

```bash
git commit -m "提交信息"
```

#### 查看状态

```bash
git status
```

#### 查看提交历史

```bash
git log
```

#### 查看文件差异

```bash
git diff
```

### 3.4 分支操作

#### 创建分支

```bash
git branch 分支名
```

#### 切换分支

```bash
git checkout 分支名
# 或创建并切换分支
git checkout -b 分支名
```

#### 合并分支

```bash
git merge 分支名
```

#### 删除分支

```bash
git branch -d 分支名
```

## 4. GitHub基础操作

### 4.1 注册GitHub账号

1. 访问[GitHub官网](https://github.com/)
2. 点击"Sign up"按钮
3. 填写用户名、邮箱和密码
4. 完成验证和注册流程

### 4.2 创建仓库

1. 登录GitHub账号
2. 点击右上角的"+"号，选择"New repository"
3. 填写仓库名称、描述
4. 选择仓库类型（公开或私有）
5. 选择是否初始化README文件
6. 点击"Create repository"按钮

### 4.3 克隆仓库

将GitHub上的仓库克隆到本地：

```bash
git clone https://github.com/用户名/仓库名.git
```

### 4.4 推送代码到GitHub

1. 关联本地仓库与远程仓库：
   ```bash
   git remote add origin https://github.com/用户名/仓库名.git
   ```

2. 推送代码：
   ```bash
   git push -u origin main
   ```

### 4.5 拉取代码从GitHub

```bash
git pull origin main
```

### 4.6 创建和管理Issue

1. 在仓库页面点击"Issues"标签
2. 点击"New issue"按钮
3. 填写标题和描述
4. 点击"Submit new issue"按钮

### 4.7 创建和管理Pull Request

1. 在GitHub上fork一个仓库
2. 克隆fork后的仓库到本地
3. 创建并切换到新分支
4. 进行修改并提交
5. 推送分支到GitHub
6. 在GitHub上点击"Pull request"按钮
7. 填写PR描述并提交

## 5. Git和GitHub协作流程

### 5.1 团队协作基本流程

1. **克隆仓库**：将GitHub上的仓库克隆到本地
   ```bash
   git clone https://github.com/团队名/项目名.git
   cd 项目名
   ```

2. **创建分支**：为新功能或修复创建一个新分支
   ```bash
   git checkout -b feature/新功能名
   # 或修复分支
   git checkout -b fix/问题描述
   ```

3. **修改代码**：在本地进行代码修改

4. **提交更改**：
   ```bash
   git add .
   git commit -m "描述你的更改"
   ```

5. **推送分支**：将分支推送到GitHub
   ```bash
   git push origin feature/新功能名
   ```

6. **创建Pull Request**：在GitHub上创建PR，等待团队成员审核

7. **代码审查**：团队成员查看代码，提出修改建议

8. **合并PR**：审核通过后，将PR合并到主分支

9. **更新本地主分支**：
   ```bash
   git checkout main
   git pull origin main
   ```

### 5.2 分支管理策略

#### 常用分支类型

- **main/master**：主分支，用于发布稳定版本
- **develop**：开发分支，集成所有功能开发
- **feature/xxx**：功能分支，用于开发新功能
- **fix/xxx**：修复分支，用于修复bug
- **release/xxx**：发布分支，用于准备发布版本

### 5.3 冲突解决

当多人修改同一文件时，可能会产生冲突。解决冲突的步骤：

1. 拉取最新代码：`git pull`
2. 查看冲突文件：`git status`
3. 手动编辑冲突文件，解决冲突
4. 标记冲突已解决：`git add 冲突文件`
5. 提交解决冲突：`git commit -m "解决冲突"`
6. 推送代码：`git push`

## 6. 常见问题和解决方案

### 6.1 Git常见问题

#### 6.1.1 推送失败

**问题**：`git push` 失败，提示权限不足或分支不存在

**解决方案**：
- 检查远程仓库地址是否正确：`git remote -v`
- 确保有仓库的推送权限
- 确保分支存在：`git branch -a`
- 如果是首次推送，使用：`git push -u origin 分支名`

#### 6.1.2 提交信息错误

**问题**：提交后发现提交信息有误

**解决方案**：
```bash
git commit --amend -m "新的提交信息"
```

#### 6.1.3 误删除文件

**问题**：不小心删除了文件，如何恢复

**解决方案**：
```bash
git checkout HEAD -- 文件名
```

### 6.2 GitHub常见问题

#### 6.2.1 克隆速度慢

**问题**：`git clone` 速度很慢

**解决方案**：
- 使用SSH协议克隆：`git clone git@github.com:用户名/仓库名.git`
- 考虑使用国内镜像源

#### 6.2.2 无法推送代码

**问题**：推送代码时提示认证失败

**解决方案**：
- 检查GitHub账号密码是否正确
- 使用SSH密钥认证
- 检查网络连接

#### 6.2.3 合并冲突

**问题**：PR合并时出现冲突

**解决方案**：
- 按照5.3节的冲突解决步骤操作
- 或者在本地解决冲突后重新提交

## 7. 实用技巧和最佳实践

### 7.1 Git实用技巧

#### 7.1.1 设置Git别名

为常用命令设置别名，提高工作效率：

```bash
# 设置别名
git config --global alias.st status
git config --global alias.ci commit
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.logg "log --oneline --graph --decorate"
```

使用别名：
```bash
git st  # 相当于 git status
git ci -m "提交信息"  # 相当于 git commit -m "提交信息"
git logg  # 查看简洁的提交历史
```

#### 7.1.2 使用.gitignore文件

创建`.gitignore`文件，忽略不需要版本控制的文件：

```gitignore
# 忽略node_modules目录
node_modules/

# 忽略日志文件
*.log

# 忽略环境变量文件
.env

# 忽略编译产物
dist/
build/

# 忽略编辑器配置文件
.vscode/
.idea/
*.swp
*.swo
```

#### 7.1.3 查看特定文件的修改历史

```bash
git log -p -- 文件名
```

### 7.2 GitHub实用技巧

#### 7.2.1 使用SSH密钥认证

设置SSH密钥，避免每次推送都输入密码：

1. 生成SSH密钥：
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

2. 复制公钥到GitHub：
   - 查看公钥：`cat ~/.ssh/id_ed25519.pub`
   - 登录GitHub，进入Settings → SSH and GPG keys → New SSH key
   - 粘贴公钥并保存

3. 使用SSH协议克隆仓库：
   ```bash
   git clone git@github.com:用户名/仓库名.git
   ```

#### 7.2.2 使用GitHub Actions

GitHub Actions可以自动化CI/CD流程，例如：
- 自动运行测试
- 自动构建项目
- 自动部署

### 7.3 最佳实践

#### 7.3.1 提交信息规范

使用清晰、简洁的提交信息：

```
类型(范围): 描述

详细说明（可选）

关闭的Issue（可选）
```

类型包括：
- feat: 新功能
- fix: 修复bug
- docs: 文档修改
- style: 代码风格修改
- refactor: 代码重构
- test: 测试相关
- chore: 构建或依赖更新

#### 7.3.2 分支管理最佳实践

- 主分支（main/master）保持稳定
- 开发分支（develop）集成所有功能
- 功能分支（feature/*）用于开发新功能
- 修复分支（fix/*）用于修复bug
- 发布分支（release/*）用于准备发布

#### 7.3.3 代码审查最佳实践

- 每次PR不要太大，尽量控制在200行以内
- 提供清晰的PR描述
- 及时回应代码审查评论
- 尊重团队的代码风格和规范

#### 7.3.4 定期清理

- 定期清理本地无用分支：`git branch -d 分支名`
- 定期拉取最新代码：`git pull`
- 定期检查并解决潜在的问题