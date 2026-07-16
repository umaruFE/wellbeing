# 绘本 RAG n8n 工作流

这个目录放的是“参考资料 -> RAG 检索 -> 生成活动方案 -> 生成绘本设计 -> 生成完整绘本结构 -> 调用 ComfyUI 出图”的完整 MVP 工作流模板。


```text
资料上传入库 -> 生成时检索资料 -> 生成活动方案 -> 生成绘本分页设计 -> 生成完整绘本结构（含图片Prompt） -> 提交 ComfyUI 出图任务
```

## 文件说明

- `01_RAG_Upload_Knowledge.json`
  上传参考资料（粘贴文本或 DOCX），清洗、切片（700 字，100 重叠），生成 Embedding，写入 Qdrant。

- `02_RAG_Search_Context.json`
  根据绘本主题检索 Qdrant，按用户私有资料 + 公共资料过滤，返回整理好的参考资料上下文。

- `03_PictureBook_Generate.json`
  绘本生成主流程（一体化）。接收用户需求，调用 RAG 检索，然后生成故事规划、分页文案和每页图片 Prompt。

- `04_Generate_Page_Image_ComfyUI.json`
  图片生成流程。接收单页或多页 `imagePrompt`，构建 ComfyUI 工作流 payload，调用 ComfyUI `/prompt` 出图，返回可轮询的任务 ID 和状态查询地址。

- `05_Activity_Plan_Generate.json`
  活动方案生成流程。接收学生画像（年龄、水平、主题、词汇、语法等），调用 RAG 检索参考资料，然后用大模型生成活动方案（故事名称、故事内容、英文目标、幸福力目标、产出物、物料）。

- `06_Picture_Book_Design_Generate.json`
  绘本分页设计流程。接收活动方案和学生画像，调用 RAG 检索，然后用大模型生成每页的英文文字和中文画面描述（imageDescription）。

## 能跑通什么

这 6 个流程可以跑通完整的“绘本 MVP”：

- 上传资料（文本 / DOCX）
- 检索资料
- 生成活动方案（故事名称、故事内容、英文目标、幸福力目标、产出物、物料）
- 生成绘本分页设计（每页英文文字 + 中文画面描述）
- 生成完整绘本结构（故事规划 + 分页文案 + 图片 Prompt）
- 提交 ComfyUI 图片生成任务并轮询出图结果

注意：ComfyUI 出图是异步任务。第 4 个流程会返回 `statusUrl`，前端或后端需要轮询这个地址，直到返回 `completed` 和图片 `url`。

## 必要环境变量

可以在 n8n 环境变量里配置，也可以直接在 HTTP Request 节点里改成固定地址。

```text
EMBEDDING_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
DOCX_EXTRACT_URL=http://localhost:4000/api/rag/extract-docx
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=picturebook_knowledge
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key
LLM_MODEL=gpt-5-mini
COMFYUI_URL=https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com
API_BASE_URL=http://localhost:4000
N8N_PUBLIC_URL=http://localhost:5678
N8N_RAG_UPLOAD_WEBHOOK=http://localhost:5678/webhook/rag-upload-knowledge
```

说明：

- `EMBEDDING_BASE_URL`：Embedding 服务地址。当前模板按 Ollama 风格接口写的。
- `EMBEDDING_MODEL`：Embedding 模型名，默认 `nomic-embed-text`。
- `DOCX_EXTRACT_URL`：DOCX 解析服务地址。上传 docx 时，n8n 会把文件转发到这个接口并期待返回 `text` 字段。未设置时回退到 `${API_BASE_URL}/api/rag/extract-docx`。
- `QDRANT_URL`：Qdrant 地址。
- `QDRANT_API_KEY`：如果 Qdrant 没开鉴权，可以留空。
- `QDRANT_COLLECTION`：知识库 collection 名称。
- `LLM_BASE_URL`：大模型 API 地址。
- `LLM_API_KEY`：大模型 API Key。
- `LLM_MODEL`：用于生成绘本文案的模型。
- `COMFYUI_URL`：ComfyUI 服务地址。第 4 个图片生成流程会调用 `${COMFYUI_URL}/prompt`。
- `API_BASE_URL`：后端 API 地址。第 4 个流程会返回 `${API_BASE_URL}/api/ai/task-status/...` 作为图片任务轮询地址。
- `N8N_PUBLIC_URL`：n8n 对外可访问地址，主流程会通过它调用 RAG 检索流程。
- `N8N_RAG_UPLOAD_WEBHOOK`：后端上传代理要转发到的 n8n 知识库上传 webhook。如果不配置，会默认使用 `${N8N_PUBLIC_URL}/webhook/rag-upload-knowledge`。

## 重要前提：先创建 Qdrant Collection

上传资料前，需要先在 Qdrant 里创建 collection：

```text
picturebook_knowledge
```

向量维度必须和你的 Embedding 模型一致。

如果使用 `nomic-embed-text`，请先确认你当前部署版本返回的向量维度，再创建 collection。

Qdrant 创建 collection 的示例：

```http
PUT /collections/picturebook_knowledge
Content-Type: application/json
```

```json
{
  "vectors": {
    "size": 768,
    "distance": "Cosine"
  }
}
```

如果你的 embedding 维度不是 `768`，需要把 `size` 改成实际维度。

## 导入顺序

建议按这个顺序导入并激活：

1. 导入 `01_RAG_Upload_Knowledge.json`
2. 导入 `02_RAG_Search_Context.json`
3. 导入 `05_Activity_Plan_Generate.json`
4. 导入 `06_Picture_Book_Design_Generate.json`
5. 导入 `03_PictureBook_Generate.json`（可选，一体化流程）
6. 导入 `04_Generate_Page_Image_ComfyUI.json`

流程 05、06、03 都会调用这个地址：

```text
POST ${N8N_PUBLIC_URL}/webhook/rag-search-context
```

所以 `02_RAG_Search_Context` 需要先激活。

## 资料上传接口

### 页面上传

项目里已经提供了一个上传页面：

```text
/picture-book-knowledge
```

页面会调用后端：

```text
POST /api/rag/upload-knowledge
```

后端再转发到 n8n：

```text
POST /webhook/rag-upload-knowledge
```

这样浏览器不用直接访问 n8n，能避免跨域问题。资料上传成功后会写入 Qdrant，后续生成绘本可以重复检索使用，不需要每次重新上传。

### n8n 原始接口

接口：

```text
POST /webhook/rag-upload-knowledge
```

支持两种上传方式。

### 方式一：直接粘贴文本

```json
{
  "userId": "u_001",
  "title": "5岁儿童害怕黑夜的应对方法",
  "category": "儿童心理",
  "ageRange": "3-6",
  "visibility": "private",
  "sourceType": "text",
  "text": "这里放参考资料全文..."
}
```

### 方式二：上传 DOCX

使用 `multipart/form-data`：

```text
POST /webhook/rag-upload-knowledge
Content-Type: multipart/form-data
```

字段：

```text
file: 选择 .docx 文件
userId: u_001
title: 5岁儿童害怕黑夜的应对方法
category: 儿童心理
ageRange: 3-6
```

`ageRange` 可以不传或留空，表示全年龄段适用。上传页面不暴露可见范围，默认以 `private` 写入当前用户知识库。

上传 docx 时，流程会调用 `DOCX_EXTRACT_URL`（未设置时回退到 `${API_BASE_URL}/api/rag/extract-docx`）。这个接口需要接收 multipart 里的 `file`，并返回：

```json
{
  "text": "从 docx 中提取出的正文文本",
  "filename": "example.docx"
}
```

如果你还没有这个后端接口，可以先临时用前端或脚本把 docx 解析成文本，再走“直接粘贴文本”方式。后续建议在后端加 `/api/rag/extract-docx`，用 `mammoth` 或 `jszip` 提取正文。

返回示例：

```json
{
  "success": true,
  "documentId": "doc_xxx",
  "chunkCount": 12,
  "collection": "picturebook_knowledge"
}
```

切片规则：每片 700 字，相邻片之间重叠 100 字，长度不足 30 字的片段会被丢弃。

## RAG 检索接口

接口：

```text
POST /webhook/rag-search-context
```

请求示例：

```json
{
  "userId": "u_001",
  "topic": "害怕黑夜",
  "targetAge": 5,
  "category": "儿童心理",
  "tone": "安心、亲子共读",
  "goal": "承认害怕是正常的",
  "limit": 8
}
```

检索逻辑（Qdrant filter）：

- `should`：命中当前用户的私有资料（`userId` 匹配）或公共资料（`visibility = public`）
- `must`：如果传了 `category`，按分类过滤
- `limit`：返回条数，默认 8，上限 20

返回里会包含：

- `references`：命中的资料片段（含 score、title、documentId、category、ageRange、text）
- `context`：整理后的上下文文本，给绘本生成流程使用
- `referenceCount`：命中条数

如果没检索到任何资料，`context` 会返回提示文本，让生成流程明确说明参考资料不足并使用通用创作原则。

## 绘本生成接口

接口：

```text
POST /webhook/picturebook-generate
```

请求示例：

```json
{
  "userId": "u_001",
  "message": "给5岁孩子生成一本关于害怕黑夜的绘本",
  "targetAge": 5,
  "pages": 12,
  "visualStyle": "温柔水彩",
  "tone": "安心、亲子共读",
  "outputType": "book"
}
```

参数说明：

- `pages`：页数，范围 4-20，默认 12
- `language`：语言，默认 `zh-CN`
- `tone`：语气，默认“温柔、安心、亲子共读”
- `visualStyle`：画风，默认“温柔水彩绘本，暖色，圆润角色，低对比度”

流程会调用大模型 `/chat/completions`（`response_format: json_object`），生成严格 JSON。

返回示例：

```json
{
  "success": true,
  "outputType": "book",
  "request": {},
  "rag": {
    "referenceCount": 3,
    "references": []
  },
  "book": {
    "title": "小灯和黑夜森林",
    "storyPlan": {
      "theme": "...",
      "mainCharacter": { "name": "...", "visualIdentity": "...", "traits": [] },
      "storyArc": [],
      "visualStyleGuide": "..."
    },
    "pages": [
      {
        "page": 1,
        "text": "晚上到了，小米看着窗边的影子，轻轻抱紧了小兔灯。",
        "scene": "卧室，窗帘边有柔和影子，小女孩抱着兔子夜灯",
        "emotion": "轻微担心",
        "educationalGoal": "承认害怕是正常的",
        "imagePrompt": "A gentle watercolor children's book illustration...",
        "negativePrompt": "scary, horror, violence, distorted hands..."
      }
    ]
  }
}
```

如果实际页数和请求页数不一致，会在 `book.warning` 里提示。

## 活动方案生成接口

接口：

```text
POST /webhook/activity-plan-generate
```

请求示例：

```json
{
  "userId": "u_001",
  "age": "7-9岁",
  "level": "初级（会字母和简单词）",
  "themes": ["情绪表达"],
  "themeOther": "",
  "participants": "小组（2-4人）",
  "duration": "30分钟",
  "vocabulary": "happy, sad, calm, brave, friend",
  "grammar": "My friend is/feels...",
  "materials": ["画纸", "彩笔/蜡笔"],
  "materialOther": "",
  "category": ""
}
```

必填字段：`age`、`level`。其余可选。

流程会先调用 RAG 检索（按 `themes[0]` 或 `themeOther` 作为 topic），然后用大模型生成活动方案。

返回示例：

```json
{
  "success": true,
  "activityPlan": {
    "storyTitleEn": "My Feeling Friend",
    "storyTitleZh": "我的情绪朋友",
    "storyContent": "孩子们在故事中遇到...",
    "englishGoal": "使用核心词汇：happy, sad...；使用核心句型：My friend is/feels...",
    "wellbeingGoal": "将内在感受外化为可被看见的形象...",
    "outputGoal": "一本小组绘本和一张主题创作海报",
    "materials": "画纸、彩笔/蜡笔"
  },
  "rag": {
    "referenceCount": 3,
    "references": []
  }
}
```

## 绘本分页设计接口

接口：

```text
POST /webhook/picture-book-design-generate
```

请求示例：

```json
{
  "userId": "u_001",
  "activityPlan": {
    "storyTitleEn": "My Feeling Friend",
    "storyTitleZh": "我的情绪朋友",
    "storyContent": "孩子们在故事中遇到...",
    "englishGoal": "使用核心词汇：happy...",
    "wellbeingGoal": "...",
    "outputGoal": "...",
    "materials": "画纸、彩笔"
  },
  "basicInfo": {
    "age": "7-9岁",
    "level": "初级",
    "vocabulary": "happy, sad, calm",
    "grammar": "My friend is/feels...",
    "themes": ["情绪表达"]
  },
  "pages": 6,
  "category": ""
}
```

参数说明：

- `activityPlan`：必填，需要至少包含 `storyContent` 或 `storyTitleEn`/`storyTitleZh`
- `basicInfo`：学生画像，用于控制语言难度和融入词汇句型
- `pages`：页数，范围 4-20，默认 6

流程会先调用 RAG 检索（按故事标题作为 topic），然后用大模型生成每页内容。

返回示例：

```json
{
  "success": true,
  "pages": [
    {
      "id": "page-xxx-1",
      "page": 1,
      "imageDescription": "封面。温暖的儿童绘本场景...",
      "text": "My Feeling Friend\n我的情绪朋友",
      "imageUrl": "",
      "status": "placeholder",
      "error": ""
    },
    {
      "id": "page-xxx-2",
      "page": 2,
      "imageDescription": "故事开始。主角发现一个小小的线索...",
      "text": "I see a little friend.",
      "imageUrl": "",
      "status": "placeholder",
      "error": ""
    }
  ],
  "rag": {
    "referenceCount": 3,
    "references": []
  }
}
```

如果实际页数和请求页数不一致，会在 `warning` 里提示。

## ComfyUI 图片生成接口

接口：

```text
POST /webhook/generate-page-image-comfyui
```

### 单页请求

```json
{
  "bookId": "book_001",
  "title": "小灯和黑夜森林",
  "page": 1,
  "pageText": "晚上到了，小米看着窗边的影子，轻轻抱紧了小兔灯。",
  "imagePrompt": "A gentle watercolor children's book illustration. A 5-year-old Chinese girl with a round face, short black hair, pale yellow pajamas, holding a bunny-shaped night light, standing in a cozy bedroom at night. Soft warm light, calm mood, no scary elements.",
  "negativePrompt": "scary, horror, monster, dark face, distorted hands",
  "width": 1280,
  "height": 720
}
```

### 多页请求

可以直接把 `03_PictureBook_Generate` 返回的 `book.pages` 传进来：

```json
{
  "bookId": "book_001",
  "title": "小灯和黑夜森林",
  "visualStyle": "gentle watercolor children picture book illustration, warm soft colors",
  "pages": [
    {
      "page": 1,
      "text": "晚上到了，小米看着窗边的影子，轻轻抱紧了小兔灯。",
      "scene": "卧室，窗帘边有柔和影子，小女孩抱着兔子夜灯",
      "imagePrompt": "A gentle watercolor children's book illustration...",
      "negativePrompt": "scary, horror, monster"
    }
  ]
}
```

### 可选参数

这些参数都可以在请求体里覆盖，不传则用默认值：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `width` | 1280 | 图片宽度，范围 512-2048 |
| `height` | 720 | 图片高度，范围 512-2048 |
| `steps` | 15 | 采样步数，范围 4-40 |
| `cfg` | 1.5 | CFG scale |
| `sampler` | euler | 采样器 |
| `scheduler` | simple | 调度器 |
| `seed` | 随机 | 随机种子 |
| `unetName` | z_image_turbo_bf16.safetensors | UNet 模型 |
| `vaeName` | ae.safetensors | VAE 模型 |
| `comfyuiUrl` | `$COMFYUI_URL` | 覆盖 ComfyUI 地址 |
| `apiBaseUrl` | `$API_BASE_URL` | 覆盖后端轮询地址 |

返回示例：

```json
{
  "success": true,
  "status": "submitted",
  "count": 1,
  "assets": [
    {
      "executionId": "comfyui_prompt_id",
      "promptId": "comfyui_prompt_id",
      "workflowType": "image",
      "status": "submitted",
      "statusUrl": "http://localhost:4000/api/ai/task-status/comfyui_prompt_id?useComfyUI=true&apiUrl=...",
      "page": 1
    }
  ],
  "firstAsset": {}
}
```

轮询 `statusUrl`，完成后会返回：

```json
{
  "status": "completed",
  "url": "/uploads/或代理图片地址",
  "filename": "PictureBook_xxx.png"
}
```

## Embedding 接口注意事项

当前两个节点默认使用 Ollama 风格接口：

```http
POST /api/embeddings
```

请求体：

```json
{
  "model": "nomic-embed-text",
  "prompt": "要向量化的文本"
}
```

如果你的 Nomic Embed 服务不是这个格式，需要修改两个节点：

- `01_RAG_Upload_Knowledge.json` 里的 `Embed Chunks`
- `02_RAG_Search_Context.json` 里的 `Embed Query`

只要最后能拿到数组形式的向量即可。

## 后续建议

跑通这 6 个流程后，下一步建议补：

1. 用户偏好记忆流程：记录用户喜欢的画风、文字长度、年龄段、常用主题。
2. PDF/HTML 排版流程：把图片和文案组合成可阅读绘本。
3. 文件上传解析：支持 PDF、网页 URL，而不只是文本和 DOCX。
4. 图片重绘与局部修改：基于已有页面图片做风格统一或角色一致性微调。
