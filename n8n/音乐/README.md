# ACE-Step 整曲 n8n 流程

导入 `gene-music-full-song.json`，默认不激活。只新增独立流程，不覆盖现有 `gene-music`，没有修改或上传线上工作流。

## 与项目现有流程一致的部分

参照 `n8n/图片/🪿单人视频-生成背景音乐-webhook.json`，并只读核对了线上 `gene-music`、`get-resource`、`files` 流程：Webhook → ComfyUI提交 → 立即返回n8n执行ID → Wait → history查询 → If循环 → 认证下载 → 保存本地文件 → 写入tworkflow资源表 → 输出结果。

新流程注入真正的 ComfyUI **API图**，不是将编辑器UI JSON直接发到 `/prompt`；完整歌词传给同一个编码节点，一次生成整曲。共享 duration 和 seed，Turbo 8 steps 为默认测试配置。

## 必须配置的凭据

1. Webhook 使用 `Header Auth`：Name=`X-N8N-API-KEY`，Value与项目后端 `N8N_API_KEY` 一致。流程中未保存密钥。没有这项凭据不能直接激活。
2. `提交ComfyUI整曲任务`、`查询ComfyUI结果`、`认证下载完整歌曲` 三个 HTTP Request 节点，都选择同一 ComfyUI `Bearer Auth` 凭据。项目现有音乐流程使用这一认证类型，本流程没有复制凭据ID；可在你的n8n中选择已有凭据。
3. 该新服务器实际认证机制尚未确认。若不是Bearer，则将三个节点一致改为其要求的Header Auth或Basic Auth。不要将n8n管理API密钥误当ComfyUI密钥。
4. 地址已经填为 `http://117.50.171.219:8188`。如果模型在子目录（例如原模板的 `acestep1.5/acestep_v1.5_turbo.safetensors`），修改配置节点中的 `unet` 为实际路径。
5. 本地目录 `/home/node/files/` 必须可写，并与现有 `/files` 流程使用相同挂载。`写入通用资源表` 节点复用了现有 `tworkflow` 表ID `J3YaofTO0eHhgjAp`；导入同一n8n项目并检查表权限，换实例需要重新选择表。

### Webhook的叹号

“Insert a 'Respond to Webhook' node…” 是选中 `Using Respond to Webhook Node` 响应模式时的说明，不足以证明执行失败。本流程已有连接在提交任务之后的 `立即返回n8n执行ID` 响应节点。

只读检查用户导入版本发现：Webhook选择了Header Auth，但未绑定Header Auth凭据。需要在Webhook的Credentials中选择/创建对应凭据；不能将三个HTTP Request节点的ComfyUI Bearer凭据直接当作Webhook凭据。若叹号仍在，请查看节点具体Issues文字，而不是只看Respond的说明。

认证凭据遵循 [n8n HTTP Request凭据说明](https://docs.n8n.io/integrations/builtin/credentials/httprequest/)。公网HTTP会明文传输凭据与音频；生产环境建议HTTPS或受保护的内网链路。

## 测试输入

在n8n点击Webhook测试监听，向它显示的 **Test URL** 发POST。正式激活后才使用 Production URL：`/webhook/gene-music-full-song`。输入示例：

```json
{
  "caption": "A cheerful English classroom song. Clear lead vocal, ukulele, piano and light hand claps. Simple memorable melody, natural English pronunciation, no ad libs. Sing all supplied lyrics in order.",
  "lyrics": "[Verse]\nClap your hands, feel so happy!\nStomp your feet, feel so happy!\nWave hello, feel so happy!\nSmile so big, feel so happy!\n[Chorus]\nHappy, happy, that is me!\nHappy, happy, you and me!\nHappy, happy, that is me!\nHappy, happy, you and me!",
  "duration": 30,
  "bpm": 100,
  "language": "en"
}
```

`caption`（兼容 `prompt`）与 `lyrics` 必填，lyrics可为完整字符串或 `{text,time}` 数组；数组只取text，忽略预估time。duration支持10–120秒。可选seed用于复现；不传则随机。暂时固定单候选、4/4拍、默认C major。caption不会自动翻译，建议先用英文测试。

Webhook会返回202和 `executionId`、`promptId`、`status: submitted`。这不是生成完成：

- executionId：n8n执行记录ID，供项目 `pollExecution` 查询。
- promptId：ComfyUI任务ID，供ComfyUI history查询。

约每5秒查询一次，最多120次；每次HTTP响应时间额外计入总耗时，执行有30分钟上限。轮询超时不会自动取消ComfyUI任务，避免取消其他人的生成；重新提交前应确认旧任务状态。

完成后在执行记录的 **执行结束返回字段** 节点读取 `url` / `audio_url` / `results[0].url`，现在返回项目现有 `/webhook/files?file=...` 地址，不再返回base64。`comfyAudioUrl`仅供诊断，不能直接用于未认证播放器。

也可以直接复用项目的通用资源查询：

```text
GET http://117.50.218.161:5678/webhook/get-resource?execution_id=<n8n执行ID>
```

现有get-resource从tworkflow表查询并返回 `{ "data": "http://.../webhook/files?file=full_song_....flac" }`。拿到data后再播放/下载音频。`/files`只读取n8n本地文件，并不会替你从ComfyUI下载，所以认证下载与本地保存这两步仍然必须保留。

## 当前接入边界

流程返回整曲混合音频，不生成纯伴奏、逐行片段或实际歌词时间轴。`duration`是请求目标，不是测量到的歌曲长度；alignmentStatus与backingStatus均为not_generated。

项目 `/api/ai/generate-audio` 当前调用 `gene-music`，完成后通过 `get-resource` 查数据表。本流程现在写入同一数据表并复用files下载，但**不是导入后现有页面自动换用的替代品**。正式接入需要：

1. 后端改为调用独立 `gene-music-full-song` 并传完整lyrics；前端停止逐句生成与拼接。
2. 沿用项目的pollExecution和get-resource获取资源；新流程已记录executionId与资源URL。
3. 确认现有files访问策略适合业务，生产可增加同源下载/持久存储方案，不能在前端暴露ComfyUI凭据。
4. 将同一母版分轨，并做实际歌词对齐，再回写毫秒时间轴；旧片段与旧时间轴应失效。

无需LLM节点、FTP凭据或额外自定义n8n节点即可做单独的整曲验证，需要使用项目已有的数据表和可写文件目录。当前只完成离线结构和逻辑测试及线上配置只读核对；尚未导入新版、执行真实GPU生成或写入线上数据表。

## 2026-09-13 FTP/CDN更新

线上原ID `dSzHC0vfUXO3GgTo` 的最终导出为 `gene-music-full-song.ftp.json`。整曲与全部句片段通过现有生产上传API保存到FTP/CDN，通用资源表保存整曲CDN URL；完成结果包含逐句实际歌词/时间/FLAC URL。增加CDN文件头读取检查，上传成功但CDN不可读会失败。当前CDN IIS对.flac返回404，需管理员添加.flac→audio/flac MIME配置；此前“/files音频播放”的说明已由此更新替代，/files仅继续用于转写JSON/LRC/TXT资源。

临时播放策略更新：FTP文件已由用户确认存在。`cdn_with_n8n_fallback` 已部署到原n8n流程，继续要求FTP上传成功，CDN读取检查交由业务后端的签名媒体接口处理；CDN不可读时使用n8n保存的同一FLAC，CDN恢复后自动优先CDN。不是把音频转为base64，也不改变文件类型。业务后端新增接口仍需随项目发布到生产服务。
