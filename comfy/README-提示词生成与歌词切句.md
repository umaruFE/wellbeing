# 提示词生成歌曲、实际歌词转写与短句音频

## 两个可导入JSON

- `music-star-quest-existing-song-transcribe-split.json`：已有歌曲 → 识别歌词 → 短句切割。先用这一份验证；可以直接处理之前ComfyUI/n8n生成的歌曲。
- `music-star-quest-prompt-song-transcribe-split.json`：提示词 → 内部自动创作 → 完整歌曲 → 实际歌词识别 → 短句音频。不是把原来的原生节点的lyrics留空；那样不能等同于自动创作带人声歌曲。

这些是新增流程，不替换之前 `music-star-quest-full-song.json` 或线上n8n流程，也不会仅因导入就自动接通页面。

## 必须先安装的节点

1. [STT7](https://github.com/Setmaster/comfyui-stt7)：ComfyUI Manager搜索 `STT7` 安装。默认 faster-whisper / medium / CPU / int8，避免与歌曲模型争抢显存，识别可能比较慢。模型首次运行需要下载。
2. 附带的 `custom_nodes/music_star_lyrics`：通过服务器文件管理面板把该目录放到 `ComfyUI/custom_nodes/music_star_lyrics`，然后重启ComfyUI。依赖soundfile（通常已有）；若缺失需在ComfyUI对应Python环境安装soundfile。JSON不能安装这个节点的Python实现。
3. **只在提示词生成版本中需要** [ComfyUI-MPC-Ace-Step](https://github.com/MPC2026/Ace-Step)：需要其ACE-Step依赖和子模块安装完整。若Manager搜索不到，或安装后提示缺少acestep，按仓库安装说明处理，不能只导入JSON解决。

提示词生成版本还需要模型目录 `ComfyUI/models/Ace-Step1.5/`：`acestep-v15-turbo/`、`acestep-5Hz-lm-1.7B/`、`vae/`、`Qwen3-Embedding-0.6B/`，按MPC仓库说明下载完整目录。**你已有的4个原生分拆safetensors文件不能直接替代这一套目录格式。**现有歌曲处理版本不需要更换你的歌曲模型。

节点安装与模型下载会占磁盘/内存，导入本身不会完成这些操作。缺失节点时先停止队列，安装对应节点，不要用无关节点替代。

## 操作

先导入「existing-song」版，在LoadAudio上传/选择整曲，点击运行。不要把教学目标填进STT7 initial_prompt（默认留空），避免用期望歌词诱导识别。切割节点target_points里按行填写想检查的词或短语。

v2切句不含固定歌曲、动作词或歌词模板。参考当前ASR标点、超过0.65秒的词间停顿、ASR分段边界，以及句首大小写线索（只是启发式，专有名词可能造成误分）。max_words=8、max_seconds=6均为软上限，超过只标exceedsSoftLimit，不强行切断未知句子。用户每次输入的目标短语会保护完整词组；目标检查使用完整ASR文本，不受显示分行影响。全部句子标needsReview，lowConfidence单独表示词置信度。两端默认留0.08秒缓冲，不越过相邻识别句边界。

更新节点：下载 `music_star_lyrics-v2.zip`，在服务器解压到临时目录；备份现有节点目录后，把其中 `__init__.py` 与 `timing.py` 替换到 `ComfyUI/custom_nodes/music_star_lyrics/`，再重启ComfyUI。无需更换工作流JSON或重新下载Whisper模型。不要把备份节点目录留在custom_nodes中，避免重复注册。

输出在 `ComfyUI/output/music-star-quest/<随机目录>/`：

- `lyrics.txt`：逐短句实际识别歌词，保留重复句。
- `lyrics.lrc`：每个短句的开始时间，三位小数。
- `lyrics.json`：逐短句开始/结束时间、实际音频时长、对应片段文件、词识别概率及目标短语覆盖检查。
- `line_001.flac` 等：对应每个短句的音频，含原歌曲伴奏，不是分离的人声。

目标检查目前只检查词/短语是否出现，不判断语法教学目标是否达成。低概率词会标needsReview；遗漏/非法词时间会记录warnings，不用均分时长补齐。

## 时间准确度与限制

来源是Whisper的词时间估计，不是已验证的强制对齐。Singing、拖音、和声、重复副歌可能识别错误。识别分句不保证正好等同于音乐的乐句；词级时间也不保证毫秒级准确。所有结果默认 `alignmentStatus: needs_review`。先试听核对，不能无条件用于精确同步高亮。

此版不做独立伴奏生成、人声分离、强制对齐，也不把草稿歌词当成实际歌词。LRC只带开始时间；JSON保存每句实际估计的结束时间，接页面时应优先使用JSON，避免把尾奏算进末句。

## 与原n8n流程的关系

旧流程继续做：提交整曲 → 获取prompt_id → history轮询 → 受保护view下载 → 保存通用资源表。旧页面接口继续用旧工作流，不因这些JSON自动改变。

要自动串起来，下一步n8n在整曲下载完成后提交「existing-song」处理图：把已有音频放到ComfyUI input目录，使用实际文件名替换LoadAudio输入。具体上传接口需先确认你的ComfyUI版本，并沿用现有Bearer凭证；手动测试先用界面的LoadAudio上传按钮。不能把HTTP URL直接写到LoadAudio中。

继续history轮询，处理节点21输出位于 `history[prompt_id].outputs['21']`：`text[0]`是清单JSON；`files`包含歌词JSON/LRC/TXT与所有FLAC片段。下载每个文件仍需沿用受保护 `/view?filename=...&subfolder=...&type=output`，再交给现有资源保存机制。旧n8n只读取节点12的单个音频，尚需增设处理任务与多资源保存，不应声称旧流程已自动支持切句。

当前只完成JSON结构与切句算法的本地验证；没有在你的远程ComfyUI安装这些扩展或做GPU运行验证。
