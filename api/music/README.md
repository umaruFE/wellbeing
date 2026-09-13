# 星光录音棚：同曲伴奏（本地后端）

AI 整曲生成与歌词切句仍由原 n8n 工作流完成。本地 `/api/creative-works/:id/music` 查询到实际整曲后，启动独立伴奏任务，使用 [Demucs](https://github.com/facebookresearch/demucs) 的 `htdemucs` 分离该整曲，并合并非人声声部。不会另行生成一首旋律不同的伴奏。

任务完成、伴奏 FTP 上传成功后，歌曲接口才返回 `completed`。等待期间返回 `pending`、`phase: backing`；页面显示伴奏处理中。失败会明确报错，重试同一个尚未完成的任务时只重新处理伴奏。

- Python 通过 `soundfile` 读写 FLAC；输出恢复到原采样率及原采样数，保持原曲时间线，包含前奏和尾奏。分离可能存在少量残留人声或音色损失，不保证完全消除人声。
- 伴奏上传生产上传服务的 `music-star-quest/audio`，数据库只存 URL 和来源、时长、采样等元数据。
- CDN 的 FLAC 暂不可读时，签名播放接口读取本地 `.music-runtime/audio` 的伴奏；整曲和句片段仍从 n8n 备用目录读取。支持字节范围与拖动。CDN 恢复后自动优先使用 CDN。
- `.music-runtime/jobs` 保存任务状态和日志；独立 Node/Python 子进程可继续运行，不依赖 Next 开发服务器热更新。每个整曲文件只启动一个分离任务。
- 详细作品与课件渲染接口重新签发当前主机的伴奏地址，页面与 HTML 均沿用 `audio.backing`。不修改或解决冲突模板。

## 本地安装

在 `api/` 下运行（当前开发机已安装）：

```sh
python3 -m venv --system-site-packages .venv-music
.venv-music/bin/python -m pip install -r music/requirements.txt
```

当前验证环境为 Python 3.12、torch/torchaudio 2.7.1。若新环境没有 torch，先安装兼容版本的 torch 与 torchaudio；如已有 torch，请让 torchaudio 版本与它一致。首次运行下载官方模型约 80MB，缓存到 `.music-runtime/models`。

可配置 `MUSIC_SEPARATION_PYTHON` 指定 Python 路径，`MUSIC_RUNTIME_DIR` 指定持久化任务/音频/模型目录。尚未部署生产后端；当前范围为本地测试。

## 实际验证

`node music/verify-backing.mjs <实际FTP结果清单.json>` 用已有实际生成的音频验证分离、FTP 保存、歌曲结果、详情和课件的伴奏引用及 Range 播放，临时数据库作品和临时 n8n 工作流用完删除。
