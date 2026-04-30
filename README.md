# 课程管理系统

## 项目概述

这是一个前端课程管理系统，包含工作看板、课程管理、课程广场和素材管理四大模块。系统提供了丰富的课程编辑功能，支持AI资产生成、拖拽编辑、撤销/重做等操作，为用户提供了直观、高效的课程创建和管理体验。

## 项目结构

项目采用模块化的文件结构，按照业务逻辑进行组织：

```
src/
├── components/         # 通用组件
│   ├── AssetEditorPanel.jsx      # 资产编辑器面板
│   ├── BookmarkIcon.jsx          # 书签图标组件
│   ├── CanvasAssetRenderer.jsx   # 画布资产渲染器
│   ├── CardSelectionModal.jsx    # 卡片选择模态框
│   ├── HistoryVersionView.jsx    # 历史版本视图
│   ├── ImagePreviewModal.jsx     # 图片预览模态框
│   ├── MainLayout.jsx            # 主布局组件
│   ├── PromptInputModal.jsx      # 提示词输入模态框
│   ├── ProtectedRoute.jsx        # 受保护路由组件
│   ├── RequireAuth.jsx           # 权限验证组件
│   ├── SlideRenderer.jsx         # 幻灯片渲染器
│   └── VideoStoryboardModal.jsx  # 视频分镜模态框
├── contexts/           # React上下文
│   └── AuthContext.jsx # 认证上下文
├── modules/            # 业务模块
│   ├── admin/          # 管理员模块
│   │   ├── AccountManagement.jsx      # 账户管理
│   │   ├── OrganizationManagement.jsx # 组织管理
│   │   └── SuperAdminPage.jsx         # 超级管理员页面
│   ├── auth/           # 认证模块
│   │   ├── LoginPage.jsx       # 登录页面
│   │   └── UnauthorizedPage.jsx # 未授权页面
│   ├── course-management/  # 课程管理模块
│   │   ├── CourseManagementPage.jsx   # 课程管理页面
│   │   ├── table-view/                # 表格视图
│   │   │   └── TableView.jsx
│   │   ├── ppt-canvas/                # PPT画布
│   │   │   ├── CanvasView.jsx
│   │   │   ├── CanvasView.LeftSidebar.jsx
│   │   │   ├── CanvasView.Modals.jsx
│   │   │   ├── CanvasView.assets.js
│   │   │   ├── CanvasView.asset-generation.js
│   │   │   └── CanvasView.history.js
│   │   └── reading-material/          # 阅读材料
│   │       ├── ReadingMaterialCanvasView.jsx
│   │       ├── ReadingMaterialCanvasView.LeftSidebar.jsx
│   │       ├── ReadingMaterialCanvasView.Modals.jsx
│   │       └── ReadingMaterialEditor.jsx
│   ├── course-square/  # 课程广场模块
│   │   └── CourseSquarePage.jsx
│   ├── dashboard/      # 工作看板模块
│   └── material-management/ # 素材管理模块
│       ├── KnowledgeBasePage.jsx      # 知识库页面
│       ├── IpCharacterManagement.jsx  # IP角色管理
│       ├── textbook/                  # 教材管理
│       │   └── TextbookManagement.jsx
│       ├── image/                     # 图片管理
│       │   └── PptImageManagement.jsx
│       ├── video/                     # 视频管理
│       │   └── VideoMaterialManagement.jsx
│       └── audio/                     # 音频管理
│           └── VoiceManagementPage.jsx
├── services/           # 服务层
│   ├── aiAssetService.js    # AI资产生成服务
│   ├── api.js               # API基础服务
│   ├── dashscope.js         # n8n API 调用服务
│   ├── promptService.js     # 提示词服务
│   └── uploadService.js     # 文件上传服务
├── utils/              # 工具函数
│   └── index.js
├── App.jsx             # 应用入口组件
├── home.jsx            # 主页组件
└── index.css           # 全局样式
```

## 主要模块介绍

### 1. 工作看板 (Dashboard)

- 展示用户的课程概览
- 提供快速访问课程的入口
- 显示课程统计数据

### 2. 课程管理 (Course Management)

#### 2.1 表格视图 (Table View)
- 以表格形式展示课程列表
- 支持搜索、筛选和排序
- 提供课程预览功能
- 支持课程复制和删除

#### 2.2 PPT画布 (PPT Canvas)
- 提供可视化的课程编辑界面
- 支持资产的添加、编辑、拖拽、缩放和旋转
- 支持撤销/重做功能
- 集成AI资产生成功能
- 支持文本、图片、视频、音频等多种资产类型
- 提供历史版本管理

#### 2.3 阅读材料 (Reading Material)
- 管理课程相关的阅读材料
- 支持A4竖版和横版布局
- 提供画板编辑功能
- 支持资产的添加和编辑

### 3. 课程广场 (Course Square)

- 展示公共课程
- 支持课程搜索和分类筛选
- 提供课程复制功能

### 4. 素材管理 (Material Management)

#### 4.1 教材 (Textbook)
- 管理教材资源
- 支持层级树结构（教材-年级-单元）
- 提供教材内容的增删改查

#### 4.2 图片 (Image)
- 管理图片素材
- 支持图片上传和预览
- 提供图片分类管理

#### 4.3 视频 (Video)
- 管理视频素材
- 支持视频上传和预览
- 提供视频分类管理

#### 4.4 音频 (Audio)
- 管理音频素材
- 支持音频上传和播放
- 提供音频分类和标签管理

## 核心功能

### AI资产生成
- 支持文本、图片、视频、音频的AI生成
- 提供提示词优化功能
- 支持图片抽卡选择
- 保存生成历史记录

### 画布编辑
- 支持资产的拖拽定位
- 支持资产的缩放和旋转
- 支持图层顺序调整
- 支持文本双击编辑
- 支持撤销/重做操作

### 历史版本管理
- 自动保存编辑历史
- 支持恢复到历史版本
- 支持页面级别的历史管理

## 技术栈

- **React 18** - 前端框架
- **React Router** - 路由管理
- **Lucide React** - 图标库
- **Tailwind CSS** - CSS框架
- **Vite** - 构建工具

## 开发环境设置

1. 克隆项目：
   ```bash
   git clone <项目地址>
   cd wellbeing
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   cd ./api
   npm run dev
   ```

## 运行项目

开发模式：
```bash
npm run dev
```

构建生产版本：
```bash
npm run build
```

预览生产构建：
```bash
npm run preview
```

## 部署说明

1. 构建生产版本：
   ```bash
   npm run build
   ```

2. 将 `dist` 目录中的构建产物部署到服务器或托管平台

## 代码规范

- 使用 ES6+ 语法
- 组件命名使用 PascalCase
- 函数和变量命名使用 camelCase
- 代码缩进使用 2 个空格
- 每个文件不超过 1000 行
- 为关键代码添加注释
- 按业务模块组织代码文件

## 文件组织原则

1. **模块化组织**：按业务功能将代码放入对应的模块文件夹
2. **组件复用**：通用组件放在 `components` 目录
3. **服务分离**：API调用和业务逻辑放在 `services` 目录
4. **工具函数**：通用工具函数放在 `utils` 目录

## 联系方式

如有问题或建议，请联系项目维护者。
