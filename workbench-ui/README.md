# 新平台备课界面维护源

这里维护口语、涂鸦和分类在新版 Wellbeing 中的教师界面，起点为当前总集成加载的模块源。仅列入 `scripts/package-external-workbench.py` 的文件参与打包；原 `prototype/` 保持只读。涂鸦已按2026-11-19用户截图接入手填单词与配图版本，其余两模块保持已统一的教师界面。

- `app.js`：页面模板、按钮语义及对应的表现适配；保留模块业务控制器与原数据模型。
- `styles.css`：模块内容布局，公共标题、步骤、表单、按钮、底栏由 `public/workbench-v6/authoring.css` 提供。
- 涂鸦另外维护 `index.html`、`model.js`、`runtime.js`、`classroom-wordbank.js` 和新增 `word-images.js`，来自 `prototype/doodle-guess-v1-manual-words-dev/`；图片随草稿、授课快照及课堂启动隔离传递。来源及必要适配见涂鸦目录 `manual-source.json`。
- `public/workbench-v6/authoring.js`：测量操作栏与工作区尺寸；不读写业务数据，不参与导航或授课状态。

艺术表达仍由 `src/modules/picture-book/` 的 React 页面维护，加载相同的 authoring CSS/JS。歌曲、音乐棚保持已接入的冻结页面；瑜伽以冻结页面为底稿，应用下述案例替换维护源。

修改后在项目目录运行 `npm run package:workbench:external`，然后执行相关检查与 `npm run build`。打包器先验证原始版本，再应用本目录维护源，最后进行一次账号范围转换，并运行存储隔离检查。涂鸦本地模型沿用原 `wellbeing-doodle-v1-activities` 键，经包装后与平台已有账号范围键完全一致；不使用开发副本的独立键。不要直接修改生成在 `public/workbench-v6/{spin-speak-v1,doodle-guess-v1,move-match-v1}/` 的同名文件。

完整交付包中也可只同步指定的本地维护文件，无需历史原型目录。例如修改分类界面后运行 `python3 scripts/package-external-workbench.py --local-ui move-match-v1/app.js move-match-v1/styles.css`，再执行 `npm run build`。此模式复用原账号隔离转换，核对现有运行文件哈希，检查依赖与存储隔离，并更新输出清单。

`external-manifest.json` 同时记录原始哈希、本目录文件哈希、转换和输出哈希；重新打包不会丢失本轮调整。原课堂HTML、案例资源及口语/分类模型继续保留冻结来源。涂鸦模型新增的 `wordImages` 与旧记录兼容，但不要用旧模型重新保存带图片的新活动。

## 情境瑜伽新版案例

`yoga/` 由 `npm run package:workbench` 单独打包，维护冻结 V6 的 `model.js`、`library.js`、`app.js` 以及新增的 `wonder-case.js`、`wonder-scene.js/css`、`wonder-motion.js`、`wonder-motion-renderer.js`。案例库用 11 页 **A Walk in Wonder** 替换森林案例，预览和制作同款使用同一套原稿内容。`wonder-source.css` 仅为原版式参考，不直接注入页面。

素材来自 `output/yoga-wonder-visual-v2-2-20261119/` 已选定的 A 淡晴蓝版本；`wonder-assets.json` 登记 24 份图片与字体的来源和哈希。重打包先验证冻结 V6，再应用本地维护源和账号隔离转换，最后复制登记素材。原型目录与原案例交付均不修改。运行包自带素材，不依赖 8802 服务。

新案例通过 `wonder-v2-2` 标记识别，原六页活动继续使用原模型与渲染器；不能靠历史 `sourceCaseId` 改写旧活动。新案例角色为原稿蓝色伙伴，八个动作使用原 PNG 纹理及分部位网格动画，保留既有朗读、翻页、编辑、独立授课版与撤销流程。未提供的新角色或整套情境不会替换进原插画。验证：`node --test dev/yoga-wonder-case.test.mjs dev/yoga-wonder-motion.test.mjs dev/yoga-wonder-motion-renderer.test.mjs` 与 `npm run build`。

2026-11-19 画面精简：八个动作页的课堂画面不显示瑜伽动作名称，保留故事英文，并放大、调整角色及垫子位置；封面、引入、结尾文字保持原样。教师动作参考、动作选择及备课标签继续显示动作名称。这是显示层调整，不修改原稿文案或保存的课程内容。

同日角色动画：`wonder-motion.js` 提供八组关节与准备、伸展、停留、还原的纯进度采样；`wonder-motion-renderer.js` 在教师主动播放时按原 PNG 裁切创建 WebGL 纹理网格。课堂「播放本页」和配乐整课预览跟随既有语音进度，教师备课「播放动作」提供约 10 秒无音频动作循环。原播放器继续负责暂停、继续、翻页和离开，渲染器无独立计时器；页面移除时释放图形资源。减少动态偏好显示固定目标姿势，图形不可用时保留原图片并提示。动作只影响显示，不改草稿、版本与素材文件。
