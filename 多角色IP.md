# IP角色场景生成组件设计方案

## 1. 组件概述

创建一个交互式组件，允许用户选择IP角色、设置图片比例、输入提示词，然后生成背景图和角色图片，并在画布上自由排列角色，最终合成完整场景。

## 2. 组件功能

### 2.1 功能流程

1. **角色选择**：用户选择需要出现的IP角色（Poppy、Edi、Rolly、Milo、Ace）
2. **比例设置**：用户选择生成图片的比例
3. **提示词输入**：用户输入场景描述提示词
4. **资源生成**：
   - 生成背景图（使用背景生成工作流）
   - 生成选中角色的图片（使用生成单个IP人物动作工作流）
5. **画布编辑**：
   - 在画布上显示背景图
   - 允许用户拖动角色到任意位置
   - 提供角色缩放、旋转等编辑功能
6. **合成导出**：
   - 获取角色在背景上的坐标
   - 调用合成图片工作流生成最终图片
   - 提供下载和保存功能

### 2.2 技术依赖

- React 18+
- Lucide React（图标库）
- ComfyUI API（用于生成图片）
- HTML5 Canvas 或第三方拖拽库（用于画布编辑）

## 3. 组件结构

### 3.1 文件结构

```
src/
└── components/
    └── IPSceneGenerator/
        ├── index.jsx          # 主组件
        ├── RoleSelection.jsx  # 角色选择子组件
        ├── CanvasEditor.jsx   # 画布编辑子组件
        ├── styles.css         # 样式文件
        └── utils.js           # 工具函数
```

### 3.2 状态管理

```javascript
const [state, setState] = useState({
  // 角色选择状态
  selectedRoles: [],
  // 比例设置
  aspectRatio: { id: '16:9', width: 1920, height: 1080 },
  // 提示词
  prompt: '',
  // 生成状态
  isGenerating: false,
  // 生成的资源
  generatedAssets: {
    background: null,  // 背景图URL
    roles: {}          // 角色图URL { roleName: url }
  },
  // 画布状态
  canvasState: {
    roles: {}  // 角色位置 { roleName: { x, y, scale, rotation } }
  },
  // 合成状态
  isCompositing: false,
  compositeResult: null  // 合成结果URL
});
```

## 4. 界面设计

### 4.1 主界面布局

1. **顶部导航**：组件标题和操作按钮
2. **左侧面板**：
   - 角色选择区域（带缩略图）
   - 比例选择区域
   - 提示词输入区域
   - 生成按钮
3. **右侧画布**：
   - 背景图显示
   - 角色图层管理
   - 拖拽编辑区域
4. **底部操作栏**：
   - 重置按钮
   - 合成按钮
   - 下载按钮

### 4.2 交互流程

1. 用户选择角色（可多选）
2. 用户选择图片比例
3. 用户输入场景描述提示词
4. 点击"生成资源"按钮
5. 系统调用API生成背景和角色图片
6. 生成完成后，在画布上显示背景和角色
7. 用户拖动角色到合适位置
8. 点击"合成图片"按钮
9. 系统调用API合成最终图片
10. 显示合成结果并提供下载选项

## 5. API调用设计

### 5.1 生成背景图

**API端点**：`/api/ai/generate-images`
**请求参数**：
```javascript
{
  prompt: 用户输入的提示词,
  width: 所选比例的宽度,
  height: 所选比例的高度,
  workflow_type: 'background'  // 自定义工作流类型
}
```

**工作流**：使用 `背景生成.json` 配置

### 5.2 生成角色图片

**API端点**：`/api/ai/generate-images`
**请求参数**：
```javascript
{
  prompt: 用户输入的提示词,
  width: 1024,
  height: 1024,
  workflow_type: 'ip-character',  // 自定义工作流类型
  character_name: 'poppy'  // 角色名称
}
```

**工作流**：使用 `生成单个IP人物动作.json` 配置

### 5.3 合成图片

**API端点**：`/api/ai/generate-images`
**请求参数**：
```javascript
{
  background_url: 背景图URL,
  roles: [
    {
      name: 'poppy',
      url: 角色图URL,
      x: 坐标X,
      y: 坐标Y,
      scale: 缩放比例,
      rotation: 旋转角度
    },
    // 其他角色...
  ],
  workflow_type: 'composite'  // 自定义工作流类型
}
```

**工作流**：使用 `合成图片.json` 配置

## 6. 实现步骤

### 6.1 后端准备

1. 在 `/api/src/app/api/ai/generate-images/route.ts` 中添加新的工作流类型：
   - `background`：使用背景生成配置
   - `ip-character`：使用IP角色生成配置
   - `composite`：使用图片合成配置

2. 实现相应的工作流创建函数：
   - `createBackgroundWorkflow()`
   - `createIPCharacterWorkflow()`
   - `createCompositeWorkflow()`

### 6.2 前端实现

1. 创建 `IPSceneGenerator` 组件目录和文件
2. 实现 `RoleSelection` 子组件，显示角色缩略图和选择功能
3. 实现 `CanvasEditor` 子组件，支持背景显示和角色拖拽
4. 实现主组件 `index.jsx`，管理整体状态和流程
5. 实现API调用函数，处理资源生成和合成
6. 添加样式和交互效果

### 6.3 测试和优化

1. 测试角色选择功能
2. 测试背景和角色生成功能
3. 测试画布编辑和拖拽功能
4. 测试图片合成功能
5. 优化用户体验和性能

## 7. 技术挑战和解决方案

### 7.1 挑战：角色拖拽和定位

**解决方案**：使用 HTML5 Drag and Drop API 或第三方库（如 react-draggable）实现角色拖拽功能，记录角色在画布上的相对坐标。

### 7.2 挑战：多角色并发生成

**解决方案**：使用 `Promise.all` 并发请求多个角色的生成，提高效率。

### 7.3 挑战：合成图片的坐标转换

**解决方案**：在前端维护画布坐标系统，转换为后端合成所需的坐标格式。

### 7.4 挑战：用户体验优化

**解决方案**：
- 添加加载状态和进度指示
- 实现错误处理和重试机制
- 提供预览和撤销功能
- 优化响应速度和交互流畅度

## 8. 后续扩展

1. **角色表情和动作定制**：允许用户为每个角色指定不同的表情和动作
2. **场景模板**：提供预设的场景模板，快速生成常见场景
3. **批量生成**：支持一次生成多个场景变体
4. **角色库扩展**：支持添加自定义角色和资产
5. **导出格式选项**：支持导出不同格式和分辨率的图片

## 9. 结论

本组件将为用户提供一个直观、高效的IP角色场景生成工具，通过简单的几步操作即可创建专业的IP角色场景图片。组件设计遵循模块化和可扩展性原则，便于后续功能扩展和维护。