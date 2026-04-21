# Wellbeing 项目 AI 功能迁移到 N8N 方案

## 一、背景与目标

### 1.1 现状问题

当前项目中 AI 相关调用存在以下问题：

| 问题类型 | 具体表现 |
|---------|---------|
| **架构混乱** | 部分直接调用 ComfyUI GPU 集群，部分调用 N8N，方式不统一 |
| **端口分散** | ComfyUI 存在多个端口（背景图、IP角色、普通生成），管理困难 |
| **提示词分散** | 提示词分散在各个路由文件中，难以调试和维护 |
| **难以监控** | 无法统一监控 AI 任务的执行状态和性能 |
| **耦合度高** | 业务代码与 AI 服务紧密耦合，切换成本高 |

### 1.2 改造目标

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 React                               │
│                    (wellbeing/src)                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 后端 (wellbeing/api)                  │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│   │   CRUD API   │  │  用户管理   │  │   N8N 统一调用层        ││
│   │ (课程/用户)  │  │ (权限/组织) │  │   /api/ai/* → N8N      ││
│   └─────────────┘  └─────────────┘  └─────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   N8N 工作流引擎                                  │
│                   (http://117.50.218.161:5678)                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ ai-image     │  │ ai-audio     │  │ ai-prompt             │ │
│  │ -generation  │  │ -generation  │  │ -optimization          │ │
│  │              │  │              │  │ -keyword-extract       │ │
│  │ ComfyUI调用   │  │ ComfyUI调用  │  │ -character-extract     │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ ai-video     │  │ ai-task      │  │ ai-oss                │ │
│  │ -generation  │  │ -status      │  │ -upload                │ │
│  │              │  │              │  │ -download              │ │
│  │ LTX Video    │  │ 统一状态轮询 │  │                        │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI 服务层                                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  ComfyUI     │  │  DashScope    │  │    OSS 对象存储       │ │
│  │ GPU集群      │  │ 通义千问      │  │                       │ │
│  │ (多个端口)   │  │ qwen-plus    │  │                       │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、当前 AI 调用分析

### 2.1 直接调用 ComfyUI（需要迁移）

| 路由文件 | 功能描述 | 当前 ComfyUI 端口 | 迁移目标 |
|---------|---------|------------------|---------|
| `generate-images/route.ts` | 图片生成（分镜/背景/IP角色） | `AI_API_BASE_URL_DEFAULT` | N8N Workflow |
| `image-to-image/route.ts` | 图生图 | `AI_API_BASE_URL` | N8N Workflow |
| `generate-audio/route.ts` | 音乐生成 | `AI_API_BASE_URL` | N8N Workflow |
| `generate-voice/route.ts` | TTS 语音合成 | `AI_API_BASE_URL` | N8N Workflow |
| `task-status/[promptId]/route.ts` | ComfyUI 任务状态 | `AI_API_BASE_URL_DEFAULT` | N8N Workflow |

### 2.2 已通过 N8N（新增提示词优化流程）

| 路由文件 | 功能描述 | N8N Webhook | 流程变化 | 状态 |
|---------|---------|-------------|---------|------|
| `generate-video/route.ts` | 视频生成 | `/webhook/gene-video` | 先调用 `/webhook/ai-prompt-optimize` 优化提示词 | 🔴 待改造 |
| `generate-storyboard/route.ts` | 分镜图生成 | `/webhook/gene-images` | 先调用 `/webhook/ai-prompt-optimize` 优化提示词 | 🔴 待改造 |
| `regene-image/route.ts` | 图片重新生成 | `/webhook/regene-image` | 先调用 `/webhook/ai-prompt-optimize` 优化提示词 | 🔴 待改造 |
| `video-status/route.ts` | 视频生成状态 | `/api/v1/executions/` | 无 | ✅ 已有 |
| `get-image/route.ts` | 获取分镜图 | `/webhook/get-image` | 无 | ✅ 已有 |

> **改造说明**：新增 `ai-prompt-optimize` Workflow，所有需要提示词的任务先调用此流程进行优化，再执行原任务。

### 2.3 通过 N8N → DashScope（提示词需迁移到 N8N）

| 路由文件 | 功能描述 | N8N Workflow | 提示词位置 | 状态 |
|---------|---------|--------------|----------|------|
| `extract-keywords/route.ts` | 场景关键词提取 | N8N → DashScope | 后端代码 | 🔴 待迁移 |
| `extract-character/route.ts` | 人物特征提取 | N8N → DashScope | 后端代码 | 🔴 待迁移 |
| `optimize-prompt/route.ts` | 提示词优化 | N8N → DashScope | 后端代码 | 🔴 待迁移 |

> **说明**：虽然这些路由已经通过 N8N 调用，但提示词仍然硬编码在后端代码中。需要将这些提示词也迁移到 N8N Workflow Variables 中统一管理。

---

## 三、目标架构

### 3.1 统一调用流程

```
前端请求
    │
    ▼
┌─────────────────────────┐
│   /api/ai/*             │
│   (业务逻辑路由)         │
│   - 参数验证             │
│   - 权限校验             │
│   - 日志记录             │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   /api/n8n/call         │
│   (统一调用入口)         │
│   - 统一错误处理         │
│   - 超时控制             │
│   - 重试机制             │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   N8N Workflow          │
│   - 任务编排             │
│   - AI 服务调用          │
│   - 结果处理             │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   AI 服务               │
│   - ComfyUI GPU         │
│   - DashScope           │
│   - OSS 存储            │
└─────────────────────────┘
```

### 3.2 目录结构改造

```
api/src/
├── lib/
│   └── n8n/                              # N8N 统一客户端
│       ├── client.js                     # 统一调用客户端
│       ├── workflows.js                  # 工作流定义
│       └── constants.js                  # 常量配置
│
├── app/api/
│   ├── n8n/                               # N8N 统一入口
│   │   └── call/route.ts                 # 统一调用接口
│   │
│   ├── ai/                               # AI 业务路由（改造后）
│   │   ├── generate-images/route.ts      # 调用 N8N
│   │   ├── image-to-image/route.ts       # 调用 N8N
│   │   ├── generate-audio/route.ts       # 调用 N8N
│   │   ├── generate-voice/route.ts       # 调用 N8N
│   │   ├── task-status/[promptId]/route.ts # 调用 N8N
│   │   ├── extract-keywords/route.ts     # 调用 N8N
│   │   ├── extract-character/route.ts    # 调用 N8N
│   │   └── optimize-prompt/route.ts      # 调用 N8N
│   │
│   └── 其他 CRUD 路由...
│
└── app/api/ai/
    ├── generate-video/route.ts           # 已通过 N8N（保持）
    ├── generate-storyboard/route.ts      # 已通过 N8N（保持）
    └── ...
```

> **提示词管理**：所有 AI 提示词统一存储在 **N8N Workflow Variables** 中，由运营人员在 N8N UI 直接维护，无需修改后端代码。

---

## 四、N8N Workflow 设计

### 4.1 Workflow 清单

| Workflow 名称 | Webhook 路径 | 功能 | 提示词位置 | 状态 |
|--------------|-------------|------|----------|------|
| `ai-prompt-optimize` | `/webhook/ai-prompt-optimize` | 提示词优化（通用） | N8N Variables | 🔴 **新增** |
| `ai-prompt-processing` | `/webhook/ai-prompt-processing` | 提示词处理（关键词/人物/优化） | N8N Variables | 待创建 |
| `ai-image-generation` | `/webhook/ai-image-generation` | 图片生成 | N8N Variables | 待创建 |
| `ai-image-to-image` | `/webhook/ai-image-to-image` | 图生图 | N8N Variables | 待创建 |
| `ai-audio-generation` | `/webhook/ai-audio-generation` | 音乐生成 | N8N Variables | 待创建 |
| `ai-voice-generation` | `/webhook/ai-voice-generation` | TTS 语音 | N8N Variables | 待创建 |
| `ai-task-status` | `/webhook/ai-task-status` | 统一状态查询 | 无 | 待创建 |
| `ai-video-generation` | `/webhook/gene-video` | 视频生成 | **先调用 ai-prompt-optimize** | 🔴 改造 |
| `ai-storyboard-generation` | `/webhook/gene-images` | 分镜生成 | **先调用 ai-prompt-optimize** | 🔴 改造 |

### 4.2 ai-image-generation Workflow

```yaml
名称: ai-image-generation
触发: Webhook POST /webhook/ai-image-generation

节点流程:

1. Webhook (接收参数)
   - workflow_type: scene|person|lora-v3|background|ip-character
   - prompt: 提示词
   - width, height: 图片尺寸
   - reference_image: 参考图URL (可选)
   - style: 风格名称

2. Code (构建ComfyUI工作流)
   - 根据workflow_type选择对应工作流模板
   - 填充prompt和参数
   - 处理参考图上传

3. HTTP Request (提交ComfyUI)
   - URL: {COMFYUI_URL}/prompt
   - Method: POST
   - Body: 工作流JSON

4. Set (提取promptId)
   - 从响应中提取prompt_id

5. Webhook Response (返回executionId)
   - status: 202
   - body: { executionId, workflowType }

6. Wait (等待完成，可选)
   - Delay: 3s

7. HTTP Request (查询状态)
   - URL: {COMFYUI_URL}/history/{promptId}

8. IF (检查状态)
   - success: 继续
   - error: 返回错误

9. HTTP Request (下载结果)
   - URL: {COMFYUI_URL}/view

10. HTTP Request (上传OSS)
    - URL: {OSS_UPLOAD_ENDPOINT}

11. Webhook Response (返回结果)
    - body: { url, filename }
```

### 4.3 ai-prompt-optimize Workflow（新增）

```yaml
名称: ai-prompt-optimize
触发: Webhook POST /webhook/ai-prompt-optimize

节点流程:

1. Webhook (接收参数)
   - prompt: 原始提示词
   - task_type: video|storyboard|regene|extract-keywords|extract-character|optimize
   - context: { }  # 可选的上下文信息

2. Code (获取提示词模板)
   - 从 Variables 获取对应的系统提示词模板
   - task_type → Variable Key 映射:
     * video → video-optimize-system-prompt
     * storyboard → storyboard-optimize-system-prompt
     * regene → regene-optimize-system-prompt
     * extract-keywords → extract-keywords-system-prompt
     * extract-character → character-{style}-prompt
     * optimize → optimize-prompt-template

3. Code (构建优化请求)
   - 将原始提示词填充到模板中
   - 构建发送给 DashScope 的请求

4. HTTP Request (调用 DashScope)
   - URL: {DASHSCOPE_API_URL}/v1/services/aigc/text-generation/generation
   - Method: POST
   - Headers: Authorization: Bearer {DASHSCOPE_API_KEY}

5. Code (解析优化结果)
   - 从 DashScope 响应中提取优化后的提示词
   - 验证提示词是否符合要求

6. IF (优化成功)
   - 继续处理
   - ELSE: 返回原始提示词（降级处理）

7. Code (后处理)
   - 添加负面提示词（从 Variables 获取）
   - 格式化为目标格式

8. Webhook Response
   - body: { optimizedPrompt, originalPrompt, status }
```

### 4.5 ai-task-status Workflow

```yaml
名称: ai-task-status
触发: Webhook POST /webhook/ai-task-status

节点流程:

1. Webhook (接收参数)
   - executionId: N8N执行ID
   - workflowType: image|audio|video|voice

2. IF (根据workflowType选择查询方式)
   - image/audio/voice: 查询ComfyUI状态
   - video: 查询N8N内部状态

3. HTTP Request / N8N API (查询状态)
   - 获取执行结果数据

4. IF (检查是否完成)
   - 完成: 下载结果
   - 进行中: 返回pending
   - 失败: 返回error

5. IF (需要下载文件)
   - HTTP Request (下载ComfyUI输出)

6. HTTP Request (上传OSS)
   - 统一上传到OSS

7. Webhook Response
   - body: { status, url?, error? }
```

### 4.6 ai-prompt-processing Workflow

```yaml
名称: ai-prompt-processing
触发: Webhook POST /webhook/ai-prompt-processing

节点流程:

1. Webhook (接收参数)
   - taskType: keyword-extract|character-extract|prompt-optimize
   - content: 处理内容
   - options: 额外选项

2. Switch (根据taskType)
   - keyword-extract: 关键词提取流程
   - character-extract: 人物特征提取流程
   - prompt-optimize: 提示词优化流程

3. 构建消息
   - 组装system prompt和user prompt
   - 从配置中心获取提示词

4. HTTP Request (调用DashScope)
   - URL: {DASHSCOPE_API_URL}
   - Model: qwen-plus
   - Messages: 构建的消息数组

5. Code (解析响应)
   - 提取AI返回内容
   - JSON解析或文本处理

6. Webhook Response
   - body: { success, data }
```

---

## 五、后端代码改造

### 5.1 N8N 统一客户端

```javascript
// api/src/lib/n8n/client.js

const N8N_API_BASE = process.env.N8N_API_BASE_URL || 'http://117.50.218.161:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

class N8NClient {
  constructor() {
    this.baseUrl = N8N_API_BASE;
    this.apiKey = N8N_API_KEY;
  }

  /**
   * 调用 N8N Workflow
   * @param {string} workflowName - 工作流名称
   * @param {object} payload - 传递给 Workflow 的参数
   * @param {object} options - 额外选项
   * @returns {Promise<object>} Workflow 执行结果
   */
  async call(workflowName, payload, options = {}) {
    const webhookUrl = `${this.baseUrl}/webhook/${workflowName}`;
    const timeout = options.timeout || 60000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`N8N调用失败: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`N8N调用超时: ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * 轮询 N8N 执行状态
   * @param {string} executionId - 执行ID
   * @param {object} options - 轮询选项
   * @returns {Promise<object>} 执行结果
   */
  async pollExecution(executionId, options = {}) {
    const maxAttempts = options.maxAttempts || 60;
    const interval = options.interval || 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(
        `${this.baseUrl}/api/v1/executions/${executionId}?includeData=true`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const status = data.data?.status;

        if (status === 'success') {
          return { status: 'completed', data: data };
        } else if (status === 'error') {
          return { status: 'error', error: '执行失败' };
        }
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return { status: 'timeout' };
  }

  /**
   * 获取执行结果数据
   * @param {string} executionId - 执行ID
   * @returns {Promise<object>} 结果数据
   */
  async getExecutionData(executionId) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/executions/${executionId}?includeData=true`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`获取执行数据失败: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.executionData?.resultData?.runData || {};
  }
}

export const n8nClient = new N8NClient();
export default n8nClient;
```

### 5.2 generate-images 改造示例

```typescript
// api/src/app/api/ai/generate-images/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workflow_type,
      prompt,
      width = 1024,
      height = 1024,
      reference_image,
      user_id,
      organization_id
    } = body;

    // 参数验证
    if (!workflow_type || !prompt) {
      return NextResponse.json(
        { error: '缺少必要参数 workflow_type 或 prompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 调用 N8N Workflow
    const result = await n8nClient.call('ai-image-generation', {
      workflow_type,
      prompt,
      width,
      height,
      reference_image,
      user_id,
      organization_id,
      timestamp: Date.now()
    });

    // 返回 executionId，前端轮询
    return NextResponse.json({
      success: true,
      executionId: result.executionId || result.id,
      workflowType: workflow_type
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('图片生成失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
```

### 5.3 task-status 改造示例

```typescript
// api/src/app/api/ai/task-status/[promptId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const { searchParams } = new URL(request.url);
    const workflowType = searchParams.get('workflowType') || 'image';

    if (!promptId) {
      return NextResponse.json(
        { error: '缺少 promptId' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 调用 N8N 统一状态查询
    const result = await n8nClient.call('ai-task-status', {
      executionId: promptId,
      workflowType
    });

    if (result.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        url: result.url,
        filename: result.filename
      }, { headers: corsHeaders() });
    } else if (result.status === 'error') {
      return NextResponse.json({
        status: 'error',
        error: result.error
      }, { headers: corsHeaders() });
    } else {
      return NextResponse.json({
        status: 'pending'
      }, { headers: corsHeaders() });
    }

  } catch (error) {
    console.error('查询任务状态失败:', error);
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : '查询失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
```

---

## 六、N8N Workflow Variables 提示词管理方案

### 6.1 设计理念

所有 AI 提示词统一存储在 **N8N Workflow Variables** 中，由运营人员在 N8N UI 直接维护。

```
┌─────────────────────────────────────────────────────────────────┐
│                        N8N UI                                   │
│                                                                 │
│  Workflow Settings → Variables                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ KEY                          │ VALUE                        │ │
│  ├─────────────────────────────┼──────────────────────────────┤ │
│  │ extract-keywords-prompt     │ 你是一个专业的场景描述...     │ │
│  │ character-default-prompt    │ 你是一位专业的AI图像生成...   │ │
│  │ character-ink-painting      │ 水墨风格角色描述提示词...     │ │
│  │ optimize-prompt-template    │ 提示词优化模板...             │ │
│  │ negative-prompt-default    │ blurry, low quality...        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ✅ 运营人员可直接修改，无需开发介入                             │
│  ✅ 支持版本历史回滚                                             │
│  ✅ 即时生效，无需部署                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 N8N Variables 清单

| Variable Key | 所属 Workflow | 说明 | 当前状态 |
|-------------|-------------|------|---------|
| **提示词优化 Variables** |
| `video-optimize-system-prompt` | ai-prompt-optimize | 视频生成提示词优化模板 | 待配置 |
| `storyboard-optimize-system-prompt` | ai-prompt-optimize | 分镜图提示词优化模板 | 待配置 |
| `regene-optimize-system-prompt` | ai-prompt-optimize | 图片重生成提示词优化模板 | 待配置 |
| `optimize-prompt-template` | ai-prompt-optimize | 通用提示词优化模板 | 待配置 |
| **提示词处理 Variables** |
| `extract-keywords-system-prompt` | ai-prompt-processing | 关键词提取系统提示词 | 待配置 |
| `extract-keywords-user-prompt` | ai-prompt-processing | 关键词提取用户模板 | 待配置 |
| `character-default-prompt` | ai-prompt-processing | 默认风格人物提示词 | 待配置 |
| `character-ink-painting-prompt` | ai-prompt-processing | 水墨风格人物提示词 | 待配置 |
| `character-pixar-prompt` | ai-prompt-processing | 3D皮克斯风格提示词 | 待配置 |
| `character-cartoon-prompt` | ai-prompt-processing | 卡通风格提示词 | 待配置 |
| `character-cyberpunk-prompt` | ai-prompt-processing | 赛博朋克风格提示词 | 待配置 |
| `character-realistic-prompt` | ai-prompt-processing | 写实风格人物提示词 | 待配置 |
| `character-scifi-prompt` | ai-prompt-processing | 科幻风格提示词 | 待配置 |
| `character-fantasy-prompt` | ai-prompt-processing | 奇幻风格提示词 | 待配置 |
| **生成任务 Variables** |
| `negative-prompt-default` | ai-image-generation | 默认负面提示词 | 待配置 |
| `video-system-prompt` | ai-video-generation | 视频生成系统提示词 | 待配置 |
| `storyboard-system-prompt` | ai-storyboard-generation | 分镜图系统提示词 | 待配置 |
| `regene-image-system-prompt` | ai-storyboard-generation | 重新生成图片提示词 | 待配置 |

### 6.3 提示词内容迁移清单

#### A. 待创建 Workflow 的提示词迁移

| 原位置 | Variable Key | 内容摘要 |
|--------|-------------|---------|
| `generate-video/route.ts` 内的提示词 | `video-optimize-system-prompt` | 视频生成提示词优化模板 |
| `generate-storyboard/route.ts` 内的提示词 | `storyboard-optimize-system-prompt` | 分镜图提示词优化模板 |
| `regene-image/route.ts` 内的提示词 | `regene-optimize-system-prompt` | 图片重生成提示词优化模板 |
| `optimize-prompt/route.ts` 内的模板 | `optimize-prompt-template` | 通用提示词优化模板 |
| `extract-keywords/route.ts` 第 58-126 行 | `extract-keywords-system-prompt` | 中文角色限定规则、IP角色固有属性守则 |
| `extract-keywords/route.ts` 第 30-48 行 | `extract-keywords-user-prompt` | 用户提示词模板 |
| `prompt-config.json` `characterExtractionPrompts.default` | `character-default-prompt` | 默认风格人物描述 |
| `prompt-config.json` `characterExtractionPrompts.ink-painting` | `character-ink-painting-prompt` | 水墨风格描述 |
| `prompt-config.json` `characterExtractionPrompts.pixar` | `character-pixar-prompt` | 3D皮克斯风格描述 |
| `prompt-config.json` `characterExtractionPrompts.cartoon` | `character-cartoon-prompt` | 卡通风格描述 |
| `prompt-config.json` `characterExtractionPrompts.cyberpunk` | `character-cyberpunk-prompt` | 赛博朋克风格描述 |
| `prompt-config.json` `characterExtractionPrompts.realistic` | `character-realistic-prompt` | 写实风格描述 |
| `prompt-config.json` `characterExtractionPrompts.scifi` | `character-scifi-prompt` | 科幻风格描述 |
| `prompt-config.json` `characterExtractionPrompts.fantasy` | `character-fantasy-prompt` | 奇幻风格描述 |
| `prompt-config.json` `qwenImageConfig.negativePrompt` | `negative-prompt-default` | 负面提示词 |

#### B. 已存在 Workflow 的提示词迁移（需改造）

| 原位置 | Variable Key | Workflow | 改造说明 |
|--------|-------------|----------|---------|
| `generate-video/route.ts` 内的提示词 | `video-system-prompt` | ai-video-generation | 从代码提取，配置到 N8N Variables |
| `generate-storyboard/route.ts` 内的提示词 | `storyboard-system-prompt` | ai-storyboard-generation | 从代码提取，配置到 N8N Variables |
| `regene-image/route.ts` 内的提示词 | `regene-image-system-prompt` | ai-storyboard-generation | 从代码提取，配置到 N8N Variables |

### 6.4 N8N Workflow 中使用 Variables

#### 方式一：在 Code 节点中引用

```javascript
// N8N Code 节点
const $vars = $getWorkflowStaticData('global');

// 获取提示词
const systemPrompt = $vars.get('extract-keywords-system-prompt');
const userTemplate = $vars.get('extract-keywords-user-prompt');

// 填充模板
const userPrompt = userTemplate
  .replace('${prompt}', $input.item().json.prompt)
  .replace('${selectedRoles}', $input.item().json.selectedRoles?.join(', ') || '');

return [{
  json: {
    systemPrompt,
    userPrompt
  }
}];
```

#### 方式二：在 HTTP Request 节点中引用

```
节点配置:
- URL: {{ $vars.get('DASHSCOPE_API_URL') }}
- Method: POST
- Body: { ... }

认证:
- Header: Authorization: Bearer {{ $vars.get('DASHSCOPE_API_KEY') }}
```

#### 方式三：在 IF 条件节点中引用

```
条件: {{ $vars.get('ENABLE_DEBUG_MODE') === 'true' }}
```

### 6.5 提示词版本管理

N8N 自带 Workflow 版本历史，提示词变更会记录在版本历史中。

```
Workflow 版本历史:

v12 (当前) - 2026-04-08
  ├── 更新: extract-keywords-system-prompt
  │       增加"禁止出现任何角色、小动物"规则
  └── 作者: admin

v11 - 2026-04-07
  ├── 更新: character-ink-painting-prompt
  │       调整墨韵描述权重
  └── 作者:运营人员A

v10 - 2026-04-05
  ├── 创建: 初始提示词配置
  └── 作者: admin
```

### 6.6 优势对比

| 对比项 | 方案 A（代码管理） | 方案 B（N8N Variables）✅ |
|-------|-------------------|-------------------------|
| 修改方式 | 修改代码文件，提交 PR | N8N UI 直接编辑 |
| 部署要求 | 需要重新部署后端 | 即时生效 |
| 权限控制 | 开发者才能操作 | 运营人员也可操作 |
| 版本控制 | Git 版本历史 | N8N + Git 双版本 |
| 调试便利性 | 需要查看代码 | 可在 Workflow 测试 |
| A/B 测试 | 需要代码分支 | 可快速切换 Variable |

### 6.7 运营人员操作指南

#### 1. 配置 Workflow Variables

1. 打开 N8N Workflow 编辑器
2. 点击左上角 **Settings**（齿轮图标）
3. 找到 **Variables** 部分
4. 添加/修改 Key-Value 对
5. 点击 **Save** 保存

#### 2. 测试提示词

1. 在 Workflow 中添加 **Test Workflow** 节点
2. 手动传入测试参数
3. 执行 Workflow 查看结果
4. 调整提示词直到满意

#### 3. 回滚提示词

1. 打开 Workflow 版本历史
2. 选择之前的版本
3. 恢复该版本

---

## 七、实施计划

### 7.1 阶段划分

#### 阶段一：基础设施搭建（预计 2 天）

| 序号 | 任务 | 负责 | 优先级 |
|------|------|------|--------|
| 1.1 | 创建 `api/src/lib/n8n/client.js` 统一客户端 | 后端 | 🔴 P0 |
| 1.2 | 提取提示词内容到迁移对照表 | 后端 | 🔴 P0 |
| 1.3 | 在 N8N Workflow 中配置 Variables | N8N | 🔴 P0 |
| 1.4 | 配置 N8N 环境变量 | 运维 | 🔴 P0 |

#### 阶段二：N8N Workflow 创建与改造（预计 5 天）

| 序号 | 任务 | 负责 | 优先级 |
|------|------|------|--------|
| 2.0 | 创建 `ai-prompt-optimize` Workflow（提示词优化） | N8N | 🔴 **P0 - 新增** |
| 2.1 | 创建 `ai-image-generation` Workflow | N8N | 🔴 P0 |
| 2.2 | 创建 `ai-task-status` Workflow | N8N | 🔴 P0 |
| 2.3 | 创建 `ai-audio-generation` Workflow | N8N | 🟡 P1 |
| 2.4 | 创建 `ai-voice-generation` Workflow | N8N | 🟡 P1 |
| 2.5 | 创建 `ai-prompt-processing` Workflow | N8N | 🟡 P1 |
| 2.6 | 改造 `ai-video-generation` - 先调用 prompt-optimize | N8N | 🔴 P0 |
| 2.7 | 改造 `ai-storyboard-generation` - 先调用 prompt-optimize | N8N | 🔴 P0 |

#### 阶段三：后端路由改造（预计 3 天）

| 序号 | 任务 | 负责 | 优先级 |
|------|------|------|--------|
| 3.1 | 改造 `generate-images/route.ts` | 后端 | 🔴 P0 |
| 3.2 | 改造 `task-status/[promptId]/route.ts` | 后端 | 🔴 P0 |
| 3.3 | 改造 `generate-audio/route.ts` | 后端 | 🟡 P1 |
| 3.4 | 改造 `generate-voice/route.ts` | 后端 | 🟡 P1 |
| 3.5 | 改造 `image-to-image/route.ts` | 后端 | 🟢 P2 |
| 3.6 | 改造 `generate-video/route.ts` - 移除提示词，只传参数 | 后端 | 🔴 P0 |
| 3.7 | 改造 `generate-storyboard/route.ts` - 移除提示词，只传参数 | 后端 | 🔴 P0 |
| 3.8 | 改造 `regene-image/route.ts` - 移除提示词，只传参数 | 后端 | 🟡 P1 |
| 3.9 | 改造 `extract-keywords/route.ts` - 移除提示词，只传参数 | 后端 | 🔴 P0 |
| 3.10 | 改造 `extract-character/route.ts` - 移除提示词，只传参数 | 后端 | 🔴 P0 |
| 3.11 | 改造 `optimize-prompt/route.ts` - 移除提示词，只传参数 | 后端 | 🟡 P1 |

#### 阶段四：测试与部署（预计 2 天）

| 序号 | 任务 | 负责 | 优先级 |
|------|------|------|--------|
| 4.1 | 本地测试所有 AI 功能 | 全员 | 🔴 P0 |
| 4.2 | 性能对比测试 | 后端 | 🔴 P0 |
| 4.3 | 灰度发布 | 运维 | 🔴 P0 |
| 4.4 | 全量上线 | 运维 | 🔴 P0 |

### 7.2 详细任务清单

#### 阶段一详细任务

**1.1 N8N 统一客户端**

```javascript
// 需要实现的方法：
- call(workflowName, payload, options)
- pollExecution(executionId, options)
- getExecutionData(executionId)
```

**1.2 提示词内容提取**

根据 6.3 节的迁移清单，从以下位置提取提示词内容：

| 来源文件 | 需要提取的内容 |
|---------|---------------|
| `api/src/app/api/ai/extract-keywords/route.ts` | 系统提示词（第 58-126 行）、用户模板（第 30-48 行） |
| `api/src/lib/prompt-config.json` | `characterExtractionPrompts`（10 种风格）、`scenePromptOptimizationPrompt`、`qwenImageConfig.negativePrompt` |

提取后的提示词将配置到 N8N Workflow Variables 中（见 6.4 节）。

**1.3 N8N Variables 配置**

在 N8N Workflow Settings → Variables 中添加以下变量：

```
extract-keywords-system-prompt = [从 extract-keywords/route.ts 提取]
extract-keywords-user-prompt = [从 extract-keywords/route.ts 提取]
character-default-prompt = [从 prompt-config.json 提取]
character-ink-painting-prompt = [从 prompt-config.json 提取]
... (其他 8 个风格提示词)
optimize-prompt-template = [从 prompt-config.json 提取]
negative-prompt-default = [从 prompt-config.json 提取]
```

#### 阶段二详细任务

**2.1 ai-image-generation Workflow**

输入参数：
```json
{
  "workflow_type": "scene|person|lora-v3|background|ip-character",
  "prompt": "提示词内容",
  "width": 1024,
  "height": 1024,
  "reference_image": "可选参考图URL",
  "character_name": "IP角色名称（可选）",
  "user_id": "用户ID",
  "organization_id": "组织ID"
}
```

输出：
```json
{
  "executionId": "N8N执行ID",
  "workflowType": "image-generation"
}
```

**2.2 ai-task-status Workflow**

输入参数：
```json
{
  "executionId": "执行ID",
  "workflowType": "image|audio|video|voice"
}
```

输出：
```json
{
  "status": "completed|pending|error",
  "url": "OSS文件URL（完成时）",
  "filename": "文件名",
  "error": "错误信息（失败时）"
}
```

#### 阶段三详细任务

**路由改造对照表**

| 路由文件 | 原调用 | 改为调用 | 改动点 |
|---------|-------|---------|-------|
| `generate-images/route.ts` | 直接调用 ComfyUI | `n8nClient.call('ai-image-generation')` | 替换 HTTP 调用部分 |
| `task-status/[promptId]/route.ts` | 直接查询 ComfyUI | `n8nClient.call('ai-task-status')` | 替换查询逻辑 |
| `generate-audio/route.ts` | 直接调用 ComfyUI | `n8nClient.call('ai-audio-generation')` | 替换 HTTP 调用部分 |
| `generate-voice/route.ts` | 直接调用 ComfyUI | `n8nClient.call('ai-voice-generation')` | 替换 HTTP 调用部分 |
| `image-to-image/route.ts` | 直接调用 ComfyUI | `n8nClient.call('ai-image-to-image')` | 替换 HTTP 调用部分 |
| `generate-video/route.ts` | N8N（提示词在代码） | N8N（提示词在 Variables） | **移除提示词代码，只传参数** |
| `generate-storyboard/route.ts` | N8N（提示词在代码） | N8N（提示词在 Variables） | **移除提示词代码，只传参数** |
| `regene-image/route.ts` | N8N（提示词在代码） | N8N（提示词在 Variables） | **移除提示词代码，只传参数** |
| `extract-keywords/route.ts` | N8N（提示词在代码） | N8N（提示词在 Variables） | **移除提示词代码，只传参数** |
| `extract-character/route.ts` | N8N（提示词在代码） | N8N（提示词在 Variables） | **移除提示词代码，只传参数** |
| `optimize-prompt/route.ts` | N8N（提示词在代码） | N8N（提示词在 Variables） | **移除提示词代码，只传参数** |

> **改造原则**：后端只负责传参数（`{ workflow_type, prompt, style, ... }`），所有提示词由 N8N Workflow 从 Variables 中获取。

---

## 八、环境变量

### 8.1 新增环境变量

```env
# N8N 配置
N8N_API_BASE_URL=http://117.50.218.161:5678
N8N_API_KEY=your-n8n-api-key

# N8N Webhook URL 前缀（可选，用于构建完整URL）
N8N_WEBHOOK_BASE=https://your-n8n-instance/webhook

# 废弃（迁移后不再使用）
# AI_API_BASE_URL=xxx
# AI_API_BASE_URL_DEFAULT=xxx
# AI_API_BASE_URL_BG=xxx
# AI_API_BASE_URL_POPPY=xxx
# AI_API_BASE_URL_EDI=xxx
# AI_API_BASE_URL_ROLLY=xxx
# AI_API_BASE_URL_MILO=xxx
# AI_API_BASE_URL_ACE=xxx
```

---

## 九、回滚方案

### 9.1 回滚触发条件

- N8N Workflow 执行成功率低于 95%
- 单次请求平均响应时间超过原方案的 2 倍
- 出现无法解决的兼容性问题是

### 9.2 回滚步骤

1. 修改环境变量，切换回直接调用 ComfyUI 模式
2. 通过 Feature Flag 控制新旧逻辑切换
3. 保留原有路由代码，标记 `@deprecated`

```typescript
// 通过环境变量控制
const USE_N8N = process.env.USE_N8N === 'true';

if (USE_N8N) {
  // N8N 调用
  return await n8nClient.call('ai-image-generation', payload);
} else {
  // 直接调用 ComfyUI（保留，回滚用）
  return await directComfyUICall(payload);
}
```

---

## 十、监控与告警

### 10.1 N8N 层面监控

- 执行成功率
- 执行时长分布
- 各节点耗时
- 队列积压情况

### 10.2 后端层面监控

```javascript
// 在 n8nClient 中添加监控
async call(workflowName, payload, options = {}) {
  const startTime = Date.now();

  try {
    const result = await fetch(webhookUrl, ...);
    const duration = Date.now() - startTime;

    // 上报监控数据
    metrics.increment('ai.n8n.call.success', { workflow: workflowName });
    metrics.histogram('ai.n8n.call.duration', duration, { workflow: workflowName });

    return result;
  } catch (error) {
    metrics.increment('ai.n8n.call.error', { workflow: workflowName, error: error.message });
    throw error;
  }
}
```

---

## 十一、风险评估

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| N8N 单点故障 | 高 | 低 | N8N 集群部署 |
| 网络延迟增加 | 中 | 中 | 就近部署 N8N |
| Workflow 调试困难 | 中 | 中 | 完善的日志记录 |
| ComfyUI 端口不可达 | 高 | 低 | N8N 与 ComfyUI 同网络部署 |
| 迁移周期长 | 中 | 高 | 分阶段迁移，灰度发布 |

---

## 十二、验收标准

### 12.1 功能验收

- [ ] 所有 AI 功能通过 N8N 调用
- [ ] 提示词统一在 `api/src/lib/prompts/` 管理
- [ ] 前端无需修改
- [ ] 功能完全兼容

### 12.2 性能验收

- [ ] 平均响应时间增加不超过 50%
- [ ] 成功率不低于原方案
- [ ] 任务轮询机制正常

### 12.3 运维验收

- [ ] 支持通过环境变量切换新旧逻辑
- [ ] 支持快速回滚
- [ ] 监控告警配置完成

---

## 附录

### A. 相关文档

- [N8N 官方文档](https://docs.n8n.io/)
- [ComfyUI API 文档](https://github.com/comfyanonymous/ComfyUI)
- [DashScope API 文档](https://help.aliyun.com/zh/dashscope/)

### B. 联系人

| 角色 | 职责 | 联系方式 |
|------|------|---------|
| 后端负责人 | N8N Workflow 开发 | - |
| N8N 管理员 | Workflow 部署与维护 | - |
| 运维 | 环境配置与监控 | - |

### C. 更新记录

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|---------|------|
| 2026-04-08 | v1.0 | 初始方案 | AI Assistant |
