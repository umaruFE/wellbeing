# 星光录音棚：整曲生成与毫秒歌词对齐

更新：2026-09-12。此文档与新流程不改动现有线上 n8n 工作流。

## 交付与边界

- `comfy/music-star-quest-full-song.json`：拖入 ComfyUI 的原生节点工作流，一次生成整首带人声的混合歌曲，输出 FLAC。示例为 60 秒英语动作歌。
- 已校验 JSON 与节点连线。尚未在用户 GPU 上执行、试听或测量对齐误差，因此不承诺实际音质、生成速度或同步精度。
- 该 JSON **不包含**分轨和歌词对齐节点。下文是完整生产链路设计，不是已经部署的功能；避免使用未经确认存在的自定义节点。

## 当前项目为何需要调整

`src/modules/creative-workshop/MusicStudioPage.jsx` 的 `generateAllSegments` 目前逐句请求歌曲片段，再通过 `mergeMp3DataUris` 拼接；伴奏另外请求生成。

因此，模型可能每一句换旋律或声音；传入的片段 duration 并不能证明每个词在该时间发生；独立生成的伴奏也不能保证与原唱同一旋律、同一节拍。先写好的 LLM 歌词时间轴属于预估，不是对实际歌曲的测量。

现有前端 `toTimeStr` 会取整秒，`parseTimeRange` 只接受整秒范围；游戏模板 `parseTimeSeconds` 用 `parseInt` 解析秒。即使对齐服务返回毫秒，当前这些位置仍会丢失小数，需要在正式接入时一起修改。

## 生成流程使用方法

1. 更新 ComfyUI，确认能找到 `TextEncodeAceStepAudio1.5`、`EmptyAceStep1.5LatentAudio` 等原生节点。
2. 按 [ComfyUI 官方指南](https://docs.comfy.org/zh/tutorials/audio/ace-step/ace-step-v1-5) 安装模型：
   - `models/diffusion_models/acestep_v1.5_turbo.safetensors`
   - `models/text_encoders/qwen_0.6b_ace15.safetensors`
   - `models/text_encoders/qwen_1.7b_ace15.safetensors`
   - `models/vae/ace_1.5_vae.safetensors`
3. 导入 JSON。若模型放在子目录，在三个 Loader 中选择实际文件路径。
4. 修改 `Full song style and ALL lyrics` 中的风格与**全部歌词**。保留必要的 `[Verse]` / `[Chorus]` 结构标签，但课堂显示歌词须去掉这些标签；不要在模型歌词输入中填写 LRC 时间戳、音符或 emoji。
5. 在共享 Duration 节点设置目标时长。共享 Seed 默认 randomize，重新运行会换 seed；固定 seed 才适合复现或公平调参比较。
6. 初始参数：100 BPM、4/4、C major、英文、启用 audio codes、Turbo 8 steps、KSampler CFG=1、Euler/simple。它们是测试起点，不是保证最佳效果的配置。
7. 输出保存至 ComfyUI `output/music-star-quest/`。如旧版 `SaveAudio` 节点不可用，替换为原生 `Save Audio (Advanced)` 并选 FLAC。

## 完整生产链路

```text
全部歌词 + 音乐风格
  → ComfyUI 一次生成整首混合歌曲（FLAC 母版）
  → 试听／歌词一致性检查，选择合格候选
  → 对同一母版做分轨（人声 + 伴奏）
  → 用实际人声与既定歌词做对齐
  → 检查漏唱、额外歌词、重复段落、低可信度边界
  → 输出逐词／逐行 startMs、endMs 与 LRC
  → 从同一母版按实际时间切出每行练习音频
  → 上传母版、伴奏、片段、时间轴并更新课件
```

分轨可评估 [Demucs](https://github.com/facebookresearch/demucs) 或其他经过歌曲样本验证的分离器。先用同一母版分离伴奏，避免再生成一首“相似但不同”的伴奏。分离会有残留或伪影，仍需试听。

对齐可优先评估 ACE-Step 自带 LRC 能力；[官方仓库](https://github.com/ace-step/ACE-Step-1.5)列出这一功能，但不能据此认为 ComfyUI 原生编码节点就会返回 LRC。目前本流程只输出音频。

另一条可评估路径是人声分离后使用 [WhisperX](https://github.com/m-bain/whisperX)：先识别获得实际语音区间、核对原始歌词，再在确认的区间内用原歌词做 forced alignment。不能把每句歌词都放到同一个整曲区间，也不能靠均分时长或只把时间保留三位小数伪造对齐。歌唱的拖音、和声、重复副歌和漏唱可能使通用语音对齐器失效，失败项应标为待复核，不要无条件插值成“精确”结果。

每一句重复歌词都使用独立 lineId，按歌曲中实际出现顺序对齐；不能仅按文本字符串去重匹配。

## 毫秒到底能不能做到

**可以输出毫秒单位时间轴，不能保证音频边界误差只有 1 毫秒。** `startMs: 5327` 表示一种记录精度，并不证明对齐误差小于 1ms。

推荐让实际音频决定歌词时间，生成完成后回写时间轴。若要求“先固定 5.327 秒唱到指定词，再让模型严格遵守”，本流程和已查阅的接口并不提供这种严格保证；BPM 与目标时长也不能代替逐词约束。

课堂逐行高亮可把人工复核后的边界误差不超过约 100–200ms 作为初期验收目标；逐词高亮需要另行制定和测量更严格标准。这些是项目建议指标，不是模型已达到的实测结果。

建议数据格式（以下数值仅为格式示例，非实测）：

```json
{
  "audioId": "song-13-v2",
  "alignmentStatus": "needs_review",
  "timeUnit": "ms",
  "lines": [
    {
      "lineId": "line-01",
      "text": "Clap your hands, feel so happy!",
      "startMs": 5327,
      "endMs": 8934,
      "words": [
        { "text": "Clap", "startMs": 5327, "endMs": 5756 }
      ]
    }
  ]
}
```

机器逻辑使用整数毫秒，展示时才格式化为 `00:05.327–00:08.934`。LRC 可提供 `[00:05.327]` 扩展格式，但部分播放器只支持百分秒，保留 JSON 为精度主数据。

切片前后可留少量听感余量，但要保存 clipStartMs，避免切片内高亮仍按整曲绝对时间计算。分轨后不能只裁掉人声前导静音；如果重采样或裁剪，必须统一校正所有输出的时间原点。

浏览器以音频 `currentTime * 1000` 作为时间基准，高亮可用 `requestAnimationFrame` 更新；不要把 `timeupdate` 当成每毫秒触发的事件，也不要用独立计时器累加播放时间。

## 与 Suno 的效果怎么比较

[ACE-Step 官方](https://github.com/ace-step/ACE-Step-1.5)将 1.5 质量定位在 Suno v4.5 与 v5 之间。这是发布方评估，并非本项目对当前 Suno 产品的独立盲测，不能承诺“等同 Suno”。

教学歌曲应优先比较：歌词准确率、儿童能否听清、声音与旋律是否一致、伴奏能否同步、重复句是否完整；其次才是复杂编曲。固定同一歌词、风格和目标时长，分别生成数个候选并匿名试听，记录漏词／加词、发音错误、旋律衔接及实际对齐误差；禁止仅挑一首最佳样本代表模型稳定性。

若需要更高质量候选，可评估官方 ACE-Step 1.5 XL 系列。官方标注 XL 需要至少 12GB 显存（offload）、建议 20GB 以上。**不要仅把本 Turbo 流程的文件名改成 XL-SFT 并沿用全部参数**；其兼容节点与推理配置必须按官方部署方式验证。本次交付以项目已有的原生 Turbo 模板为基础，不要求先升级 GPU 或下载额外大模型。

## 正式接入项目时要做的工作

- 将前端逐句生成改为整曲任务；n8n 接收独立 caption、lyrics、duration、seed，不只接收一句 prompt。
- 异步任务阶段分为 generating / separating / aligning / validating / completed / failed，避免把音频生成完成直接等同于歌词对齐完成。
- 全部时间解析、存储、导入及游戏播放支持毫秒；兼容旧的整秒作品。
- 练习继续遵守已有 4:3:2 题量规则；歌词行与片段由对齐结果驱动，而非先验时长均分。
- 重新生成整曲后，所有旧片段和旧时间轴必须失效；切换歌曲库同样需要使用该歌曲对应的时间轴。
- 未通过对齐验收时仍可播放歌曲和查看歌词，但不显示“已精确同步”。

当前工作树有已存在的合并未解决状态（`api/public/templates/music-star-quest.html`）。本次没有修改或解决该文件，也没有重启 GPU、导入线上流程、改变在线模型、安装依赖或消耗生成任务。
