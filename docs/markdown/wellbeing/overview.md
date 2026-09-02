# Wellbeing 项目总览

> 本页是 Wellbeing 知识库的入口。介绍项目背景、业务架构、内容产线与各模块导航。

## 1. 项目背景与定位

**Wellbeing（CourseGen AI）** 是一个面向少儿英语 + 身心健康（Wellbeing）教育的 AI 驱动课程内容创作与管理平台。

核心能力：

- AI 自动生成完整课程：课程概览、教案、课件（PPT）、阅读材料、绘本
- AI 生成教学素材：图片 / 音频 / 视频 / 语音
- 以「语言学习 × 幸福力培养」双目标为内容底层逻辑（英文目标 + SEL/PERMA 目标）
- 内容生产知识化：所有创作遵循本知识库中的标准与规范

## 2. 内容产线总览

平台最新信息架构见[幸福力 AI 备课平台逻辑架构](/wellbeing/platform/logic-architecture)。

| 产线 | 产出物 | 核心规范入口 |
|------|--------|-------------|
| 绘本制作 | 艺术表达引导绘本手册（6-12 页） | [绘本创作标准 SOP](/wellbeing/picture-book/sop) |
| 歌曲编排 | 可填词演唱的歌曲 + 教案 | [编曲与作词规范](/wellbeing/music/composition-guide) |
| 课件制作 | 交互式 PPT 课件（可导出 .pptx） | [交互课件标准模板](/wellbeing/courseware/template) |
| 瑜伽动画 | IP 角色体感 / 瑜伽教学视频 | [瑜伽动作拆解与动捕规范](/wellbeing/yoga/action-standard) |
| 小游戏制作 | 课堂互动小游戏 | [游戏策划案 GDD](/wellbeing/games/game-design-doc) |

各产线共享 [通用知识库](/wellbeing/common/design-assets)：视觉规范、IP 角色、教育标准。

## 3. 教学法与内容逻辑（速览）

详细标准见 [儿童与健康教育标准](/wellbeing/common/pedagogy-standard)。

- **4E 教学法**：Engage 引入 → Empower 赋能 → Execute 实践 → Elevate 升华
- **双目标**：每节课同时承载「英文目标（词汇/句型）」与「幸福力目标（SEL + PERMA）」
- **三条体验路径**：艺术表达 / 体感探索 / 音乐律动
- **年龄段**：3-6 / 7-9 / 9-12 岁，课程时长 40 / 60 / 120 分钟
- **核心创作原则**：无标准答案、随机机制驱动个性化、感官锚定、仪式感收尾

## 4. IP 角色体系（速览）

5 个固定 IP 角色：**Poppy（粉）/ Edi（蓝）/ Rolly（橘）/ Milo（黄）/ Ace（紫）**。
详细设定见 [IP角色设定与故事背景](/wellbeing/common/character-setting)。

## 5. 技术架构

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | React 18 + Vite + Tailwind | 画布编辑器、课程工作流、素材管理 |
| 后端 API | Next.js (App Router) | 业务接口、认证、任务管理 |
| AI 编排 | n8n | 课程生成、图片/视频/音频生成工作流 |
| 图片生成 | ComfyUI | 场景图、IP 角色图、绘本插画、分镜图 |
| 语音合成 | edge-tts | 14 种音色，多语速/音调/情感 |
| 向量检索 | Qdrant | 绘本 RAG（700 字切片 / 100 重叠） |
| 数据库 | PostgreSQL 16 | 业务数据 + 知识库（Wiki.js 共用实例） |
| 部署 | Nginx + PM2 + Docker | 前端静态托管、后端进程管理 |

### 知识库（Wiki.js）架构

- Wiki.js + 本地 PostgreSQL 16，通过 GraphQL/REST API 对接业务系统
- 预留 RAG 扩展：Webhook（Page Updated/Created）推流向量化服务，或 Git 存储双向同步 `.md` 文件
- 本知识库目录即按 Git 同步结构组织，源文件位于仓库 `docs/markdown/` 下

## 6. 知识库导航

```
wellbeing/
├── overview               ← 本页
├── common/                （通用知识库）
│   ├── design-assets      视觉风格与设计规范
│   ├── character-setting  IP角色设定与故事背景
│   └── pedagogy-standard  儿童与健康教育标准
├── platform/              （平台产品与实现）
│   ├── logic-architecture 平台逻辑架构与模块归属
│   └── workshop-frontend-implementation 创作工坊前端路由、权限与集成边界
├── workshop/              （创作工坊活动类型）
│   ├── interactive-yoga   互动式情境瑜伽内容与教案规范
│   └── music-star-quest   星光录音棚产品与题型规范
├── picture-book/          （绘本制作）
│   ├── sop                绘本创作标准流程
│   └── scripts            绘本脚本与分镜库
├── music/                 （歌曲编排）
│   ├── composition-guide  编曲与作词规范
│   └── audio-assets       音效与配乐资源库
├── courseware/            （课件制作）
│   ├── template           交互课件标准模板
│   └── interactivity-spec 课件交互与动画逻辑
├── yoga/                  （瑜伽动画制作）
│   ├── action-standard    瑜伽动作拆解与动捕规范
│   └── animation-pipeline 动画制作流水线
└── games/                 （小游戏制作）
    ├── game-design-doc    游戏策划案 GDD
    └── logic-spec         游戏逻辑与数值说明
```

## 7. 平台功能地图（创作者视角）

1. **创作工坊**：六类新建入口；每类均遵循“经典案例 + 生成同款”。
2. **我的作品**：按六类模块管理草稿、编辑、发布和统计。
3. **灵感广场**：官方案例与教师作品的发现、使用和改编。
4. **教材库**：教材章节与创作入口联动，提供结构化教学目标。
5. **系统管理**：用户、权限和平台配置。
6. **课程工作流**：课程地图 → 教案设计（4E）→ PPT 课件与阅读材料。
7. **AI 素材生成**：图片、视频、音频、体式引导图和其他教学素材。
8. **权限体系**：super_admin / org_admin / research_leader / creator / picture_song_creator / viewer。

## 8. 术语表

| 术语 | 含义 |
|------|------|
| 4E | 教学法四阶段：Engage / Empower / Execute / Elevate |
| SEL | 社会情绪学习（Social-Emotional Learning），五大维度见教育标准页 |
| PERMA | 积极心理学幸福模型：P 积极情绪 / E 投入 / R 关系 / M 意义 / A 成就 |
| Word Bank | 歌曲填词环节的候选词库 |
| 随机机制 | 绘本创作引导环节的核心玩法（掷骰子、抽盲袋、转盘、翻牌） |
| 分镜（Storyboard） | 视频/绘本逐页的画面规划，含文案、画面描述与生成 Prompt |
| RAG | 检索增强生成，绘本制作的知识检索管道 |
| IP 角色 | 平台固定虚拟形象：Poppy / Edi / Rolly / Milo / Ace |

## 9. 维护说明

- 本知识库由各模块负责人维护，规范类页面修改需经教研负责人评审
- 源文件与 Git 同步：修改 `docs/markdown/` 下的 `.md` 后提交即自动同步至 Wiki
- 新增页面时请在本页导航目录中登记，并保持 `wellbeing/<模块>/<页面>` 路径规范
