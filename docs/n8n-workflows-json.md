# N8N Workflow JSON 配置文件

本文档包含所有 N8N Workflow 的 JSON 配置，可直接导入 N8N 使用。

## 📁 文件清单

| Workflow 名称 | JSON 文件名 | Webhook 路径 | 优先级 |
|--------------|------------|-------------|--------|
| ai-prompt-optimize | `ai-prompt-optimize.json` | `/webhook/ai-prompt-optimize` | 🔴 P0 |
| ai-task-status | `ai-task-status.json` | `/webhook/ai-task-status` | 🔴 P0 |
| ai-image-generation | `ai-image-generation.json` | `/webhook/ai-image-generation` | 🔴 P0 |
| ai-storyboard-generation | `ai-storyboard-generation.json` | `/webhook/ai-storyboard-generation` | 🔴 P0 |
| ai-video-generation | `ai-video-generation.json` | `/webhook/gene-video`（原路径） | 🔴 P0 |
| ai-prompt-processing | `ai-prompt-processing.json` | `/webhook/ai-prompt-processing` | 🟡 P1 |
| ai-audio-generation | `ai-audio-generation.json` | `/webhook/ai-audio-generation` | 🟡 P1 |
| ai-voice-generation | `ai-voice-generation.json` | `/webhook/ai-voice-generation` | 🟡 P1 |
| ai-image-to-image | `ai-image-to-image.json` | `/webhook/ai-image-to-image` | 🟡 P1 |

---

## ⚙️ 环境变量配置

在 N8N 的 **Settings → Variables** 中配置以下环境变量：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `DASHSCOPE_API_URL` | `https://dashscope.aliyuncs.com` | DashScope API 地址 |
| `DASHSCOPE_API_KEY` | `sk-xxx` | DashScope API Key |
| `COMFYUI_URL` | `http://localhost:8188` | ComfyUI 地址 |

---

## 📦 Workflow Variables 配置

在 N8N 的 **Settings → Workflow Variables** 中配置以下全局变量（每个 Workflow 独立配置）：

### ai-prompt-optimize Workflow Variables

| Variable Key | 示例值 |
|-------------|-------|
| `video-optimize-system-prompt` | 请优化以下视频生成提示词，使其包含：场景描述（环境、光照）、角色动作（姿势、表情）、镜头语言（景别、运动）、画面风格（色彩、质感）、艺术流派。输出格式：英文提示词，逗号分隔。 |
| `storyboard-optimize-system-prompt` | 请优化以下分镜图生成提���词，为每个分镜添加详细的画面描述、构图说明、色彩风格、镜头角度。输出格式：JSON 数组，每个元素包含 `prompt` 字段。 |
| `regene-optimize-system-prompt` | 请基于原始提示词和重新生成需求，优化提示词。保持核心元素不变，调整风格或细节。 |
| `optimize-prompt-template` | 请优化以下提示词，使其更加详细、精准、符合专业要求。输出优化后的英文提示词。 |
| `negative-prompt-default` | `blurry, low quality, deformed, ugly, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body, ugly, disgusting, poorly drawn, childish, mutilated, mangled, old, surreal, text, watermark, signature` |

### ai-image-generation Workflow Variables

| Variable Key | 示例值 |
|-------------|-------|
| `negative-prompt-default` | 同上 |

### ai-storyboard-generation Workflow Variables

| Variable Key | 示例值 |
|-------------|-------|
| `storyboard-system-prompt` | 生成分镜图... |
| `regene-image-system-prompt` | 重新生成图片... |

### ai-video-generation Workflow Variables

| Variable Key | 示例值 |
|-------------|-------|
| `video-system-prompt` | 生成视频... |

---

## 📥 导入步骤

1. 打开 N8N → 点击 **+** 新建 Workflow
2. 点击左上角菜单 → **Import from JSON**
3. 复制下方对��� Workflow 的 JSON 代码
4. 粘贴并导入
5. 配置 **Workflow Variables**（如上所示）
6. 激活（Activate）Workflow

---

## 🔗 Workflow JSON 配置

### 1. ai-prompt-optimize Workflow

**说明**：提示词优化 Workflow，接收原始提示词，调用 DashScope 优化后返回。

**Webhook 路径**：`/webhook/ai-prompt-optimize`

**输入参数**：
```json
{
  "prompt": "原始提示词",
  "task_type": "video|storyboard|regene|extract-keywords|extract-character|optimize|general",
  "context": {}
}
```

**输出参数**：
```json
{
  "status": "success",
  "original_prompt": "原始提示词",
  "optimized_prompt": "优化后的提示词",
  "negative_prompt": "负面提示词",
  "task_type": "video",
  "variable_key": "video-optimize-system-prompt"
}
```

```json:ai-prompt-optimize.json
{
  "name": "ai-prompt-optimize",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-prompt-optimize",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-prompt-optimize"
    },
    {
      "parameters": {
        "jsCode": "// 获取提示词优化模板\nconst $vars = $getWorkflowStaticData('global');\nconst item = $input.item().json;\nconst taskType = item.task_type || 'general';\nconst originalPrompt = item.prompt || '';\nconst context = item.context || {};\n\n// task_type → Variable Key 映射\nconst promptMap = {\n  'video': 'video-optimize-system-prompt',\n  'storyboard': 'storyboard-optimize-system-prompt',\n  'regene': 'regene-optimize-system-prompt',\n  'extract-keywords': 'extract-keywords-system-prompt',\n  'extract-character': 'character-default-prompt',\n  'optimize': 'optimize-prompt-template',\n  'general': 'optimize-prompt-template'\n};\n\nconst variableKey = promptMap[taskType] || 'optimize-prompt-template';\nlet systemPrompt = $vars.get(variableKey);\n\n// 降级处理：如果 Variables 未配置，使用默认提示词\nif (!systemPrompt) {\n  systemPrompt = '请优化以下提示词，使其更加详细、精准、符合专业要求。';\n}\n\nreturn [{\n  json: {\n    task_type: taskType,\n    original_prompt: originalPrompt,\n    system_prompt: systemPrompt,\n    variable_key: variableKey,\n    context: context\n  }\n}];"
      },
      "name": "🔧 获取优化模板",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.DASHSCOPE_API_URL}}/v1/services/aigc/text-generation/generation",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.DASHSCOPE_API_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "model",
              "value": "qwen-max"
            },
            {
              "name": "input",
              "value": "={{\\\"messages\\\": [{\\\"role\\\": \\\"system\\\", \\\"content\\\": $json.system_prompt}, {\\\"role\\\": \\\"user\\\", \\\"content\\\": $json.original_prompt}], \\\"parameters\\\": {\\\"max_tokens\\\": 2000, \\\"temperature\\\": 0.7}}}"
            }
          ]
        },
        "options": {
          "timeout": 30000
        }
      },
      "name": "🚀 调用 DashScope 优化",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 解析 DashScope 响应\nconst response = $input.item().json;\nconst choices = response?.output?.choices || [];\nconst message = choices[0]?.message || {};\nconst optimizedPrompt = message.content || $input.item().json.original_prompt;\n\n// 获取负面提示词\nconst $vars = $getWorkflowStaticData('global');\nconst negativePrompt = $vars.get('negative-prompt-default') || '';\n\nreturn [{\n  json: {\n    status: 'success',\n    original_prompt: $input.item().json.original_prompt,\n    optimized_prompt: optimizedPrompt.trim(),\n    negative_prompt: negativePrompt,\n    task_type: $input.item().json.task_type,\n    variable_key: $input.item().json.variable_key\n  }\n}];"
      },
      "name": "✅ 解析优化结果",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回结果",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🔧 获取优化模板", "type": "main", "index": 0 }]]
    },
    "🔧 获取优化模板": {
      "main": [[{ "node": "🚀 调用 DashScope 优化", "type": "main", "index": 0 }]]
    },
    "🚀 调用 DashScope 优化": {
      "main": [[{ "node": "✅ 解析优化结果", "type": "main", "index": 0 }]]
    },
    "✅ 解析优化结果": {
      "main": [[{ "node": "📤 返回结果", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 2. ai-task-status Workflow

**说明**：任务状态查询 Workflow，查询 ComfyUI 或 N8N 内部任务状态。

**Webhook 路径**：`/webhook/ai-task-status`

**输入参数**：
```json
{
  "executionId": "任务ID",
  "workflowType": "image|audio|video|voice"
}
```

**输出参数**：
```json
{
  "status": "pending|running|completed|failed",
  "progress": 0-100,
  "message": "状态描述",
  "result_url": "结果URL（完成后）"
}
```

```json:ai-task-status.json
{
  "name": "ai-task-status",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-task-status",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-task-status"
    },
    {
      "parameters": {
        "jsCode": "// 解析输入参数\nconst item = $input.item().json;\nconst executionId = item.executionId;\nconst workflowType = item.workflowType || 'image';\nconst taskId = item.taskId;\n\nreturn [{\n  json: {\n    executionId,\n    workflowType,\n    taskId,\n    timestamp: new Date().toISOString()\n  }\n}];"
      },
      "name": "🔍 解析参数",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "options": {},
        "values": {
          "string": [
            {
              "name": "status",
              "value": "={{ $json.status || 'pending' }}"
            },
            {
              "name": "message",
              "value": "={{ $json.message || '任务处理中' }}"
            },
            {
              "name": "progress",
              "value": "={{ $json.progress || 0 }}"
            }
          ]
        }
      },
      "name": "📊 构建状态响应",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回结果",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🔍 解析参数", "type": "main", "index": 0 }]]
    },
    "🔍 解析参数": {
      "main": [[{ "node": "📊 构建状态响应", "type": "main", "index": 0 }]]
    },
    "📊 构建状态响应": {
      "main": [[{ "node": "📤 返回结果", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 3. ai-prompt-processing Workflow

**说明**：提示词处理 Workflow，提取关键词、人物特征、风格等。

**Webhook 路径**：`/webhook/ai-prompt-processing`

**输入参数**：
```json
{
  "text": "待处理的文本",
  "type": "keywords|character|scene"
}
```

**输出参数**：
```json
{
  "keywords": ["关键词1", "关键词2"],
  "characters": ["人物1", "人物2"],
  "style": "艺术风格",
  "raw": "原始AI响应"
}
```

```json:ai-prompt-processing.json
{
  "name": "ai-prompt-processing",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-prompt-processing",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-prompt-processing"
    },
    {
      "parameters": {
        "jsCode": "// 提取关键词、人物、风格\nconst item = $input.item().json;\nconst text = item.text || item.prompt || '';\nconst type = item.type || 'keywords';\n\n// 调用 DashScope 提取\nreturn [{\n  json: {\n    original_text: text,\n    type: type,\n    timestamp: new Date().toISOString()\n  }\n}];"
      },
      "name": "🔍 解析与提取",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.DASHSCOPE_API_URL}}/v1/services/aigc/text-generation/generation",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$env.DASHSCOPE_API_KEY}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "model",
              "value": "qwen-max"
            },
            {
              "name": "input",
              "value": "={{\\\"messages\\\": [{\\\"role\\\": \\\"system\\\", \\\"content\\\": \\\"你是一个专业的提示词分析助手，请从以下文本中提取：\\\\n1. 关键词（5-10个）\\\\n2. 人物特征（性别、年龄、外貌）\\\\n3. 艺术风格（如：水墨、皮克斯、写实等）\\\\n\\\\n以 JSON 格式返回：{\\\\\\\"keywords\\\\\\\": [], \\\\\\\"characters\\\\\\\": [], \\\\\\\"style\\\\\\\": \\\"\\\"}\\\"}, {\\\"role\\\": \\\"user\\\", \\\"content\\\": $json.original_text}]}}"
            }
          ]
        },
        "options": {
          "timeout": 30000
        }
      },
      "name": "🤖 调用 AI 提取",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 解析提取结果\nconst response = $input.item().json;\nconst content = response?.output?.choices?.[0]?.message?.content || '{}';\n\ntry {\n  // 尝试解析 JSON\n  const extracted = JSON.parse(content);\n  return [{ json: { ...extracted, raw: content } }];\n} catch (e) {\n  // 如果不是 JSON，返回原始内容\n  return [{ json: { keywords: [], characters: [], style: null, raw: content } }];\n}"
      },
      "name": "✅ 解析提取结果",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回结果",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🔍 解析与提取", "type": "main", "index": 0 }]]
    },
    "🔍 解析与提取": {
      "main": [[{ "node": "🤖 调用 AI 提取", "type": "main", "index": 0 }]]
    },
    "🤖 调用 AI 提取": {
      "main": [[{ "node": "✅ 解析提取结果", "type": "main", "index": 0 }]]
    },
    "✅ 解析提取结果": {
      "main": [[{ "node": "📤 返回结果", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 4. ai-image-generation Workflow

**说明**：图片生成 Workflow，将优化后的提示词提交给 ComfyUI。

**Webhook 路径**：`/webhook/ai-image-generation`

**输入参数**：
```json
{
  "prompt": "提示词（已优化）",
  "negative_prompt": "负面提示词",
  "width": 1024,
  "height": 1024
}
```

**输出参数**：
```json
{
  "executionId": "ComfyUI 任务ID",
  "workflowType": "image",
  "status": "submitted"
}
```

```json:ai-image-generation.json
{
  "name": "ai-image-generation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-image-generation",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-image-generation"
    },
    {
      "parameters": {
        "jsCode": "// 接收优化后的提示词，提交到 ComfyUI\nconst item = $input.item().json;\nconst prompt = item.optimized_prompt || item.prompt;\nconst negativePrompt = item.negative_prompt || '';\nconst width = item.width || 1024;\nconst height = item.height || 1024;\n\nreturn [{\n  json: {\n    workflow_type: 'image',\n    prompt: prompt,\n    negative_prompt: negativePrompt,\n    width: width,\n    height: height\n  }\n}];"
      },
      "name": "🎨 准备生成参数",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.COMFYUI_URL}}/prompt",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{$json.prompt}}"
            },
            {
              "name": "negative_prompt",
              "value": "={{$json.negative_prompt}}"
            },
            {
              "name": "width",
              "value": "={{$json.width}}"
            },
            {
              "name": "height",
              "value": "={{$json.height}}"
            }
          ]
        },
        "options": {
          "timeout": 60000
        }
      },
      "name": "🎬 提交 ComfyUI",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 提取 prompt_id\nconst response = $input.item().json;\nconst promptId = response?.prompt_id || response?.id;\n\nreturn [{\n  json: {\n    executionId: promptId,\n    workflowType: 'image',\n    status: 'submitted'\n  }\n}];"
      },
      "name": "📌 提取任务ID",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回任务ID",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🎨 准备生成参数", "type": "main", "index": 0 }]]
    },
    "🎨 准备生成参数": {
      "main": [[{ "node": "🎬 提交 ComfyUI", "type": "main", "index": 0 }]]
    },
    "🎬 提交 ComfyUI": {
      "main": [[{ "node": "📌 提取任务ID", "type": "main", "index": 0 }]]
    },
    "📌 提取任务ID": {
      "main": [[{ "node": "📤 返回任务ID", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 5. ai-image-to-image Workflow

**说明**：图生图 Workflow。

**Webhook 路径**：`/webhook/ai-image-to-image`

**输入参数**：
```json
{
  "prompt": "提示词（已优化）",
  "image_url": "源图片URL",
  "strength": 0.75
}
```

**输出参数**：
```json
{
  "executionId": "ComfyUI 任务ID",
  "workflowType": "image-to-image",
  "status": "submitted"
}
```

```json:ai-image-to-image.json
{
  "name": "ai-image-to-image",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-image-to-image",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-image-to-image"
    },
    {
      "parameters": {
        "jsCode": "// 图生图参数准备\nconst item = $input.item().json;\nconst prompt = item.optimized_prompt || item.prompt;\nconst negativePrompt = item.negative_prompt || '';\nconst initImage = item.image_url || item.image_base64;\nconst strength = item.strength || 0.75;\n\nreturn [{\n  json: {\n    workflow_type: 'image-to-image',\n    prompt: prompt,\n    negative_prompt: negativePrompt,\n    init_image: initImage,\n    strength: strength\n  }\n}];"
      },
      "name": "🎨 准备图生图参数",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.COMFYUI_URL}}/prompt",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{$json.prompt}}"
            },
            {
              "name": "init_image",
              "value": "={{$json.init_image}}"
            },
            {
              "name": "strength",
              "value": "={{$json.strength}}"
            }
          ]
        },
        "options": {
          "timeout": 60000
        }
      },
      "name": "🎬 提交图生图",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 提取 prompt_id\nconst response = $input.item().json;\nconst promptId = response?.prompt_id || response?.id;\n\nreturn [{\n  json: {\n    executionId: promptId,\n    workflowType: 'image-to-image',\n    status: 'submitted'\n  }\n}];"
      },
      "name": "📌 提取任务ID",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回任务ID",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🎨 准备图生图参数", "type": "main", "index": 0 }]]
    },
    "🎨 准备图生图参数": {
      "main": [[{ "node": "🎬 提交图生图", "type": "main", "index": 0 }]]
    },
    "🎬 提交图生图": {
      "main": [[{ "node": "📌 提取任务ID", "type": "main", "index": 0 }]]
    },
    "📌 提取任务ID": {
      "main": [[{ "node": "📤 返回任务ID", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 6. ai-audio-generation Workflow

**说明**：音乐生成 Workflow。

**Webhook 路径**：`/webhook/ai-audio-generation`

**输入参数**：
```json
{
  "prompt": "提示词（已优化）",
  "duration": 30,
  "genre": "background"
}
```

**输出参数**：
```json
{
  "executionId": "ComfyUI 任务ID",
  "workflowType": "audio",
  "status": "submitted"
}
```

```json:ai-audio-generation.json
{
  "name": "ai-audio-generation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-audio-generation",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-audio-generation"
    },
    {
      "parameters": {
        "jsCode": "// 音乐生成参数准备\nconst item = $input.item().json;\nconst prompt = item.optimized_prompt || item.prompt;\nconst duration = item.duration || 30;\nconst genre = item.genre || 'background';\n\nreturn [{\n  json: {\n    workflow_type: 'audio',\n    prompt: prompt,\n    duration: duration,\n    genre: genre\n  }\n}];"
      },
      "name": "🎵 准备音乐参数",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.COMFYUI_URL}}/prompt",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{$json.prompt}}"
            },
            {
              "name": "duration",
              "value": "={{$json.duration}}"
            },
            {
              "name": "genre",
              "value": "={{$json.genre}}"
            }
          ]
        },
        "options": {
          "timeout": 120000
        }
      },
      "name": "🎼 提交音乐生成",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 提取 prompt_id\nconst response = $input.item().json;\nconst promptId = response?.prompt_id || response?.id;\n\nreturn [{\n  json: {\n    executionId: promptId,\n    workflowType: 'audio',\n    status: 'submitted'\n  }\n}];"
      },
      "name": "📌 提取任务ID",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回任务ID",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🎵 准备音乐参数", "type": "main", "index": 0 }]]
    },
    "🎵 准备音乐参数": {
      "main": [[{ "node": "🎼 提交音乐生成", "type": "main", "index": 0 }]]
    },
    "🎼 提交音乐生成": {
      "main": [[{ "node": "📌 提取任务ID", "type": "main", "index": 0 }]]
    },
    "📌 提取任务ID": {
      "main": [[{ "node": "📤 返回任务ID", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 7. ai-voice-generation Workflow

**说明**：TTS 语音生成 Workflow。

**Webhook 路径**：`/webhook/ai-voice-generation`

**输入参数**：
```json
{
  "text": "待合成文本",
  "voice": "female-1",
  "speed": 1.0,
  "pitch": 1.0
}
```

**输出参数**：
```json
{
  "executionId": "ComfyUI 任务ID",
  "workflowType": "voice",
  "status": "submitted"
}
```

```json:ai-voice-generation.json
{
  "name": "ai-voice-generation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-voice-generation",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-voice-generation"
    },
    {
      "parameters": {
        "jsCode": "// TTS 语音生成参数准备\nconst item = $input.item().json;\nconst text = item.text || item.content || '';\nconst voice = item.voice || 'female-1';\nconst speed = item.speed || 1.0;\nconst pitch = item.pitch || 1.0;\n\nreturn [{\n  json: {\n    workflow_type: 'voice',\n    text: text,\n    voice: voice,\n    speed: speed,\n    pitch: pitch\n  }\n}];"
      },
      "name": "🗣️ 准备TTS参数",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.COMFYUI_URL}}/prompt",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "text",
              "value": "={{$json.text}}"
            },
            {
              "name": "voice",
              "value": "={{$json.voice}}"
            },
            {
              "name": "speed",
              "value": "={{$json.speed}}"
            },
            {
              "name": "pitch",
              "value": "={{$json.pitch}}"
            }
          ]
        },
        "options": {
          "timeout": 60000
        }
      },
      "name": "🎙️ 提交TTS",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 提取 prompt_id\nconst response = $input.item().json;\nconst promptId = response?.prompt_id || response?.id;\n\nreturn [{\n  json: {\n    executionId: promptId,\n    workflowType: 'voice',\n    status: 'submitted'\n  }\n}];"
      },
      "name": "📌 提取任务ID",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回任务ID",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🗣️ 准备TTS参数", "type": "main", "index": 0 }]]
    },
    "🗣️ 准备TTS参数": {
      "main": [[{ "node": "🎙️ 提交TTS", "type": "main", "index": 0 }]]
    },
    "🎙️ 提交TTS": {
      "main": [[{ "node": "📌 提取任务ID", "type": "main", "index": 0 }]]
    },
    "📌 提取任务ID": {
      "main": [[{ "node": "📤 返回任务ID", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 8. ai-video-generation Workflow

**说明**：视频生成 Workflow（改造版）。注意：此 Workflow **不再直接接收 prompt 参数**，而是等待 `ai-prompt-optimize` 优化完成后，接收 `optimized_prompt` 参数。

**Webhook 路径**：`/webhook/gene-video`（保持原有路径不变）

**输入参数**：
```json
{
  "prompt": "原始提示词（可选）",
  "optimized_prompt": "优化后的提示词",
  "negative_prompt": "负面提示词",
  "duration": 5,
  "fps": 24
}
```

**输出参数**：
```json
{
  "executionId": "ComfyUI 任务ID",
  "workflowType": "video",
  "status": "submitted"
}
```

```json:ai-video-generation.json
{
  "name": "ai-video-generation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-video-generation",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-video-generation"
    },
    {
      "parameters": {
        "jsCode": "// 视频生成参数准备（接收优化后的提示词）\nconst item = $input.item().json;\nconst prompt = item.optimized_prompt || item.prompt;\nconst negativePrompt = item.negative_prompt || '';\nconst duration = item.duration || 5;\nconst fps = item.fps || 24;\n\nreturn [{\n  json: {\n    workflow_type: 'video',\n    prompt: prompt,\n    negative_prompt: negativePrompt,\n    duration: duration,\n    fps: fps\n  }\n}];"
      },
      "name": "🎬 准备视频参数",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.COMFYUI_URL}}/prompt",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{$json.prompt}}"
            },
            {
              "name": "duration",
              "value": "={{$json.duration}}"
            },
            {
              "name": "fps",
              "value": "={{$json.fps}}"
            }
          ]
        },
        "options": {
          "timeout": 120000
        }
      },
      "name": "🎥 提交视频生成",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 提取 prompt_id\nconst response = $input.item().json;\nconst promptId = response?.prompt_id || response?.id;\n\nreturn [{\n  json: {\n    executionId: promptId,\n    workflowType: 'video',\n    status: 'submitted'\n  }\n}];"
      },
      "name": "📌 提取任务ID",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回任务ID",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🎬 准备视频参数", "type": "main", "index": 0 }]]
    },
    "🎬 准备视频参数": {
      "main": [[{ "node": "🎥 提交视频生成", "type": "main", "index": 0 }]]
    },
    "🎥 提交视频生成": {
      "main": [[{ "node": "📌 提取任务ID", "type": "main", "index": 0 }]]
    },
    "📌 提取任务ID": {
      "main": [[{ "node": "📤 返回任务ID", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

### 9. ai-storyboard-generation Workflow

**说明**：分镜图生成 Workflow（改造版）。同样先经过 `ai-prompt-optimize` 优化提示词。

**Webhook 路径**：`/webhook/gene-images`（保持原有路径不变）

**输入参数**：
```json
{
  "prompt": "原始提示词（可选）",
  "optimized_prompt": "优化后的提示词",
  "negative_prompt": "负面提示词",
  "scene_count": 4,
  "style": "default"
}
```

**输出参数**：
```json
{
  "executionId": "ComfyUI 任务ID",
  "workflowType": "storyboard",
  "status": "submitted"
}
```

```json:ai-storyboard-generation.json
{
  "name": "ai-storyboard-generation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-storyboard-generation",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "📥 Webhook 接收",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "ai-storyboard-generation"
    },
    {
      "parameters": {
        "jsCode": "// 分镜图生成参数准备（接收优化后的提示词）\nconst item = $input.item().json;\nconst prompt = item.optimized_prompt || item.prompt;\nconst negativePrompt = item.negative_prompt || '';\nconst sceneCount = item.scene_count || 4;\nconst style = item.style || 'default';\n\nreturn [{\n  json: {\n    workflow_type: 'storyboard',\n    prompt: prompt,\n    negative_prompt: negativePrompt,\n    scene_count: sceneCount,\n    style: style\n  }\n}];"
      },
      "name": "🎨 准备分镜参数",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "={{$env.COMFYUI_URL}}/prompt",
        "method": "POST",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{$json.prompt}}"
            },
            {
              "name": "scene_count",
              "value": "={{$json.scene_count}}"
            },
            {
              "name": "style",
              "value": "={{$json.style}}"
            }
          ]
        },
        "options": {
          "timeout": 120000
        }
      },
      "name": "🎬 提交分镜生成",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 提取 prompt_id\nconst response = $input.item().json;\nconst promptId = response?.prompt_id || response?.id;\n\nreturn [{\n  json: {\n    executionId: promptId,\n    workflowType: 'storyboard',\n    status: 'submitted'\n  }\n}];"
      },
      "name": "📌 提取任务ID",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {}
      },
      "name": "📤 返回任务ID",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "📥 Webhook 接收": {
      "main": [[{ "node": "🎨 准备分镜参数", "type": "main", "index": 0 }]]
    },
    "🎨 准备分镜参数": {
      "main": [[{ "node": "🎬 提交分镜生成", "type": "main", "index": 0 }]]
    },
    "🎬 提交分镜生成": {
      "main": [[{ "node": "📌 提取任务ID", "type": "main", "index": 0 }]]
    },
    "📌 提取任务ID": {
      "main": [[{ "node": "📤 返回任务ID", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

## 🧪 N8N 流程测试方法

### 测试 ai-prompt-optimize Workflow

```bash
# 使用 curl 测试
curl -X POST http://localhost:5678/webhook/ai-prompt-optimize \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只猫坐在窗台上",
    "task_type": "video"
  }'
```

**预期响应**：
```json
{
  "status": "success",
  "original_prompt": "一只猫坐在窗台上",
  "optimized_prompt": "A fluffy cat sitting gracefully on a windowsill, soft sunlight streaming through, detailed fur, peaceful atmosphere, cinematic lighting, high quality, 8K resolution",
  "negative_prompt": "blurry, low quality...",
  "task_type": "video",
  "variable_key": "video-optimize-system-prompt"
}
```

### 测试 ai-image-generation Workflow

```bash
curl -X POST http://localhost:5678/webhook/ai-image-generation \
  -H "Content-Type: application/json" \
  -d '{
    "optimized_prompt": "A fluffy cat sitting gracefully on a windowsill...",
    "negative_prompt": "blurry, low quality",
    "width": 1024,
    "height": 1024
  }'
```

**预期响应**：
```json
{
  "executionId": "abc123-def456",
  "workflowType": "image",
  "status": "submitted"
}
```

---

## 📋 检查清单

- [ ] 在 N8N 中配置环境变量（`DASHSCOPE_API_URL`、`DASHSCOPE_API_KEY`、`COMFYUI_URL`）
- [ ] 为每个 Workflow 配置对应的 Variables（提示词模板）
- [ ] 导入所有 9 个 Workflow JSON
- [ ] 激活（Activate）所有 Workflow
- [ ] 测试 `ai-prompt-optimize` Webhook
- [ ] 测试 `ai-image-generation` Webhook
- [ ] 记录测试结果到 `docs/ai-migration-to-n8n-plan.md`

