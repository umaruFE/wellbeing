# 创作工坊前端实现与维护说明

> 本页记录逻辑架构在前端的路由、权限、数据和当前集成边界，供产品、前端、后端与测试共同维护。

## 1. 路由映射

| 菜单 | 路由 | 当前承载 |
|------|------|----------|
| “英语+”融合活动 | `/workshop/english-plus` | 三条融合路径与经典案例入口 |
| 互动式情境瑜伽 | `/workshop/interactive-yoga` | 活动介绍、经典案例、生成同款 |
| 星光录音棚 | `/workshop/music-star-quest` | 活动介绍、完整四关案例、生成同款 |
| 能力训练 | `/workshop/skills-training` | 六项技能入口、案例与建稿 |
| 趣味练习 | `/workshop/fun-practice` | 三种玩法入口、案例与建稿 |
| 完整课程 | `/workshop/complete-course` | 创建课程与课程管理入口 |
| 主题活动 | `/workshop/themed-activities` | 主题分类、案例与建稿 |
| 教学素材 | `/workshop/teaching-materials` | 素材类型与现有生成器入口 |
| 我的作品 | `/my-works` | 本地创作草稿查询、筛选与删除 |
| 灵感广场 | `/course-square` | 复用现有课程广场 |
| 教材库 | `/knowledge-base` | 复用现有教材资源页 |

## 2. 权限

- `super_admin`、`org_admin`、`research_leader`、`creator`、`viewer`：显示完整新版菜单。
- `picture_song_creator`：显示创作工坊中的“英语+”融合活动，包含艺术表达、互动式情境瑜伽、星光录音棚与歌曲编唱屋。
- 系统管理页面仍由既有路由权限控制，当前只允许 `super_admin`。

## 3. 生成同款当前边界

前端已完成参数采集、校验、草稿建立、本地保存、“我的作品”列表、搜索、分类和删除。草稿暂存于浏览器 `localStorage` 的 `wellbeing:creative-works`。

后端正式接入时应替换为持久化业务 API，并增加：

1. AI 任务创建和任务中心进度。
2. 按模块保存结构化参数与生成产物。
3. 编辑、版本、发布到灵感广场和使用统计。
4. 从教材库选择章节并自动解析教学目标。
5. 组织级数据隔离与审计。

## 4. 代码位置

- 菜单：`src/figma-restore/Sidebar.jsx`、`Sidebar.css`。
- 路由：`src/App.jsx`。
- 页面与数据：`src/modules/creative-workshop/`。
- 客户演示原型及音频：`public/demos/`。
- 中英文菜单：`src/i18n/locales/zh.json`、`en.json`。

## 5. 文档维护规则

- 信息架构变更先更新[逻辑架构](/wellbeing/platform/logic-architecture)，再改菜单和路由。
- 活动内容规则分别维护在互动瑜伽与 Music Star Quest 页面，不把业务规范写入组件注释。
- 原型升级时保留来源版本和验收记录，并同步更新本页“当前边界”。
- 接入后端后删除“本地草稿”说明，补充接口、字段、错误码和任务状态机。

