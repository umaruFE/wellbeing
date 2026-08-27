# 提示词库索引（全量）

> 业务系统所有 LLM / n8n / 前端提示词的**唯一台账**。后端统一走注册表 `api/src/prompts/registry.ts`：
> - 后端直调 LLM：`getPrompt(key, vars)` / `getPromptPair(key, vars)`
> - 下发 n8n 工作流：`getRawTemplate(key)` 原文下发，n8n Code 节点渲染
> - 前端拉取：`GET /api/prompts/<key>`（`src/services/promptLibrary.js`）
>
> 启用 `WIKI_PROMPT_ENABLED` 后 Wiki 同名页面优先生效（默认 5 分钟缓存），builtin 为兜底。**改提示词先查本页，找到 key 再去对应位置改。**

## 一、已收编（registry + builtin，Wiki 可覆盖）

改法：启用知识库后直接建/改 Wiki 页面 `wellbeing/prompts/<key>`；未启用时改 `api/src/prompts/builtin.ts`。

### 后端路由直调（getPrompt / getPromptPair）

| key | 用途 | 调用方 |
|-----|------|--------|
| `ai.word-emojis` | 儿童英文词卡 emoji 匹配 | ai/generate-word-emojis |
| `picture-book-activity-plan` | 绘本活动计划（step 1） | rag/generate |
| `picture-book-design` | 绘本逐页设计（step 2） | rag/generate |
| `course.theme-image-requirement` | 无文字封面插画要求 | ai/generate-course-overview |
| `course.overview.output-instruction.en` / `.zh` | 课程概览输出指令 | ai/generate-course-overview |
| `course.output-instruction.en` / `.zh` | 教案输出指令 | ai/generate-course |
| `course.overview-text.en` / `.zh` | 已有概览注入文本 | ai/generate-course |
| `ppt.poster-b2` | B2 海报生图模板 | ai/generate-ppt-asset |
| `ppt.flashcard-b3` | B3 词卡生图模板 | ai/generate-ppt-asset |
| `scene.negative.background` | 背景图负面提示词 | ai/generate-scene |
| `scene.negative.character` | IP 角色图负面提示词 | ai/generate-scene |

### n8n 工作流（二期收编：getRawTemplate 原文下发，n8n Code 节点 `__renderPrompt` 渲染）

模板快照在 `api/src/prompts/n8n-templates.json`（由 `api/scripts/n8n-prompt-inject.mjs` 生成，勿手改）；builtin 加载后同样可被 Wiki 覆盖。

| key | 用途 | 后端路由 → n8n 工作流 |
|-----|------|----------------------|
| `n8n.course-idea` | 课程创意任务名生成 | generate-course-idea → course-idea-generator |
| `n8n.course-polish` | 任务名/内容润色 | polish-course-content → course-content-polisher |
| `n8n.overview-tips` | 概览调整建议 | generate-course-overview-adjustment-tips → course-overview-adjustment-tips-generator |
| `n8n.course-step` | 单步骤课程生成 | generate-step → course-step-generator |
| `n8n.course-step-regen` | 单环节重新生成 | generate-step(regen)、regenerate-step → course-step-regenerator |
| `n8n.course-phase-regen` | 单阶段课程重新生成 | regenerate-phase → course-phase-regenerator |
| `n8n.ppt-plan` | PPT 整体规划（页面分配） | generate-ppt-content → ppt-content-generator |
| `n8n.ppt-slide` | PPT 单页内容与布局 | generate-ppt-content → ppt-content-generator（promptTemplateSlide 字段下发） |
| `n8n.optimize.video` | 视频提示词优化模板 | optimize-prompt(task_type=video) → ai-prompt-optimize |
| `n8n.optimize.storyboard` | 分镜提示词优化模板 | optimize-prompt(task_type=storyboard) → ai-prompt-optimize |
| `n8n.optimize.regene` | 重生成图提示词模板 | optimize-prompt(task_type=regene) → ai-prompt-optimize |
| `n8n.optimize.extract-keywords` | 场景关键词抽取模板 | extract-keywords、optimize-prompt → ai-prompt-optimize |
| `n8n.optimize.extract-character` | 角色形象抽取模板 | optimize-prompt(task_type=extract-character) → ai-prompt-optimize |
| `n8n.optimize.optimize` | 通用提示词优化模板 | optimize-prompt(task_type=optimize) → ai-prompt-optimize |
| `n8n.optimize.general` | 兜底优化模板 | optimize-prompt(task_type 缺省) → ai-prompt-optimize |
| `n8n.scene-keywords` | 场景关键词/人物/风格提取 | extract-character → ai-prompt-processing |

### 前端组装（二期收编：前端经 /api/prompts/<key> 拉取，本地常量仅兜底）

| key | 用途 | 前端位置 |
|-----|------|---------|
| `frontend.storybook-visual-style` | 绘本整页视觉风格 | picture-book/PictureBookStudioPage |
| `frontend.storybook-negative` | 绘本页面生图负面提示词 | picture-book/PictureBookStudioPage |
| `frontend.comfyui-negative-zh` | ComfyUI 通用负面提示词（中文） | services/aiAssetService |
| `frontend.character-reference-zh` | 视频人物参考图提示词（`{{characterDescription}}`） | services/videoStoryboardService |

## 二、集中在 prompts/ 模块（改代码文件）

复杂构建函数（含旋律/分级等动态规则），暂未模板化：

| key | 位置 | 用途 |
|-----|------|------|
| `course-journey` | prompts/course-journey.ts | 课堂旅程四阶段生成 |
| `song-writing` | prompts/song-writing.ts | 整首英文填空歌曲 |
| `song-writing-line` | prompts/song-writing.ts | 单行歌词重生成 |
| `video-optimization` | prompts/video.ts | 视频提示词优化 |
| `storyboard-script` | prompts/video.ts | 分镜脚本生成 |

## 三、前端自由组装（去前端改）

后端只透传 `prompt` 字段，文本在前端页面按用户输入即时组装（用户输入即提示词，无固定模板可收编）：

| key | 字段 | 调用方 |
|-----|------|--------|
| `image-generation` | prompt / negative_prompt | ai/generate-images、free-image-generation、regene-image |
| `music-generation` | prompt | ai/generate-audio |
| `voice-emotion` | emotion_prompt | ai/generate-voice |
| `storyboard` | story | ai/generate-storyboard |

UI 选项常量（非提示词）已去重收敛到 `src/constants/aiOptions.js`：`VOICE_OPTIONS`（14 音色）、`EMOTION_OPTIONS`（8 情感）、`SPEED_OPTIONS`、`AUDIO_STYLES`（音乐情绪五选）。

## 新增提示词流程

1. 文本放 `builtin.ts`（复杂逻辑放独立模块），格式：纯文本 + `{{var}}`，条件文案由调用方组装为变量
2. `registry.ts` 的 `PROMPT_META` 登记用途与调用方
3. 调用方只 import registry：
   - 后端直调：`getPrompt` / `getPromptPair`
   - 走 n8n：路由 payload 附 `promptTemplate: await getRawTemplate(key)`
   - 前端使用：`getPromptTemplate(key, 本地兜底)`（src/services/promptLibrary.js）
4. 本页对应分区登记（或迁移到「已收编」）

## 生效机制

```
后端路由 ──► getPrompt(key, vars) / getPromptPair(key, vars)      → 直接调 LLM
         ──► getRawTemplate(key) ──► n8nClient.call(payload)      → n8n Code 节点 __renderPrompt 渲染 → LLM 节点
前端     ──► GET /api/prompts/<key>（promptLibrary.js，失败回落本地兜底）
              │
              ├─ WIKI_PROMPT_ENABLED → Wiki 页面 wellbeing/prompts/<key>（5min 缓存）
              ├─ builtin.ts / n8n-templates.json 内置模板 → {{var}} 渲染
              └─ 未注册 → 抛错（强制走登记流程）
```

### n8n 侧部署顺序与 v2 共存（重要）

工作流改造后依赖后端下发的 `promptTemplate`。n8n 渲染占位符语法与后端一致（`{{var}}`），嵌套字段用双下划线（`slidePlan__id`）。

由于 n8n 实例无测试/正式区分，9 个改造后的工作流**调用名已统一加 `-v2` 后缀**（webhook path、webhookId、工作流名），与 v1 老流程共存：

| 后端调用名（v2） | 工作流文件 |
|---|---|
| `course-idea-generator-v2` | n8n/概览/根据课程参数生成创意任务名称.json |
| `course-content-polisher-v2` | n8n/概览/润色优化已有的任务名称.json |
| `course-overview-adjustment-tips-generator-v2` | n8n/概览/课程概览调整建议生成.json |
| `course-step-generator-v2` | n8n/教案/单步骤课程生成.json |
| `course-step-regenerator-v2` | n8n/教案/单环节重新生成.json |
| `course-phase-regenerator-v2` | n8n/教案/单阶段课程重新生成.json |
| `ppt-content-generator-v2` | n8n/PPT/PPT英文内容与布局生成.json |
| `ai-prompt-optimize-v2` | n8n/图片/ai-prompt-optimize.json |
| `ai-prompt-processing-v2` | n8n/图片/ai-prompt-processing.json |

部署顺序：① n8n 导入 v2 工作流并激活（不影响线上 v1）→ ② 部署 api（流量切到 v2）→ ③ 前端 → ④ 冒烟验证 → ⑤ 稳定后删除 9 个 v1 老流程。回滚只需回退 api 版本。
