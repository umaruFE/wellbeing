# H3 直接视频页面

访问地址：http://8.134.177.47/h3-video/

`index.html` 为独立静态页面。`server.mjs` 是无第三方依赖的 Node.js 20 服务，在服务端持有 ComfyUI Token，负责上传图片、提交任务、查询结果和转发视频。`graph.json` 从现有正式 H3 图谱提取；图生视频传 first_frame，文生视频省略 first_frame，不调用分镜、配音或音乐流程。

默认配置：BF16 H3、现有 FL2V Turbo 8 步 LoRA、Euler、Sigma Shift 6/3；864×480、480×864 或480×480，24fps。5/8/10/15秒，生成帧数向上对齐17k+5，输出截取请求时长对应的帧数。没有独立音轨。

服务器文件目录 `/opt/h3-video`，配置文件 `/etc/h3-video.env`，systemd 服务 `h3-video`，监听 `127.0.0.1:18090`。Nginx 的 `/h3-video/` 代理到该服务；原 default.conf 的备份为 `/etc/nginx/conf.d/default.conf.h3-backup`。

配置中须添加 `COMFYUI_TOKEN`，其值为现有 ComfyUI Bearer Token，不包含 Bearer 前缀，然后 `systemctl restart h3-video`。可选 `PAGE_PASSWORD` 启用 HTTP Basic 登录，用户名为 video。不要将凭据添加到仓库或HTML。

页面刷新会恢复浏览器中最近一个任务；服务重启会清空当前内存中的任务索引。视频保存在 ComfyUI 输出目录，通过同源接口播放；本工具不额外上传到永久媒体库。

已检查服务脚本语法、Nginx配置以及页面公网HTTP200。已配置ComfyUI Token（仅存于服务器配置文件）。未启动真实生成测试，两种模式的端到端运行仍待确认。
