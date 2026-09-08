/**
 * 授课模式：新窗口播放（绘本 / 瑜伽共用）
 *
 * 把页面数据（大图 + 字幕）与可选背景音乐拼成一个自包含的演示 HTML，
 * 转 Blob URL 后在新窗口打开。样式对齐应用内 pbv2-presentation 系统风：
 * 纸面底色、描边舞台、白底黑描边圆形导航/退出钮（贴纸感）。
 * 依赖创建页存活（Blob URL 生命周期），授课时请保持工坊页面开启。
 */

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/** CSS url() 里的地址需要闭合括号/引号转义 */
const encodeCssUrl = (url) => String(url || '').replace(/\\/g, '/').replace(/'/g, "\\'");

/**
 * @param {object} options
 * @param {Array<{imageUrl?: string, img?: string, subtitle?: string}>} options.pages 页面列表
 * @param {string} [options.title] 窗口标题
 * @param {{url: string, name?: string}|null} [options.backgroundMusic] 背景音乐（可选）
 * @returns {boolean} 是否成功打开
 */
export function openTeachingWindow({ pages = [], title = '授课模式', backgroundMusic = null } = {}) {
  const items = pages
    .map((p) => ({ image: p.imageUrl || p.img || '', subtitle: p.subtitle || p.text || '' }))
    .filter((p) => p.image || p.subtitle);
  if (!items.length) return false;

  const payload = {
    title,
    items,
    music: backgroundMusic?.url ? { url: backgroundMusic.url, name: backgroundMusic.name || '背景音乐' } : null,
  };

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
:root{--ink:#2f2a24;--line:#e6e3de;--surface:#f7f4ef;--coral-soft:#fdeee9}
*{margin:0;padding:0;box-sizing:border-box}
body{height:100vh;overflow:hidden;background:var(--surface);color:var(--ink);font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
.stage{width:min(1100px,calc(100% - 176px));height:min(74vh,780px);padding:18px;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:2px 2px 0 rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center}
.stage img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px}
.stage .empty{color:#9ca3af}
.nav,.exit{position:fixed;width:64px;height:64px;border:2px solid var(--ink);border-radius:50%;background:#fff;color:var(--ink);box-shadow:2px 2px 0 rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}
.nav:hover:not(:disabled),.exit:hover{background:var(--coral-soft)}
.nav:disabled{opacity:.35;cursor:default}
.nav svg,.exit svg{width:30px;height:30px}
.nav.prev{left:40px;top:50%;transform:translateY(-50%)}
.nav.next{right:40px;top:50%;transform:translateY(-50%)}
.exit{top:20px;right:24px;width:44px;height:44px}
.counter{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);border:1px solid var(--line);border-radius:10px;background:#fff;padding:6px 16px;font-size:14px;font-weight:700;box-shadow:2px 2px 0 rgba(0,0,0,.12)}
.subtitle{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);max-width:min(860px,90%);border:1px solid var(--line);border-radius:10px;background:#fff;padding:10px 20px;font-size:18px;font-weight:600;text-align:center;box-shadow:2px 2px 0 rgba(0,0,0,.12)}
.subtitle:empty{display:none}
.music{position:fixed;bottom:24px;right:24px;display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;background:#fff;padding:8px 14px;box-shadow:2px 2px 0 rgba(0,0,0,.12);font-size:13px}
.music button{width:30px;height:30px;border:2px solid var(--ink);border-radius:50%;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
.music button:hover{background:var(--coral-soft)}
.music input[type=range]{width:90px}
@media(max-width:768px){.stage{width:calc(100% - 24px);height:70vh}.nav.prev{left:8px}.nav.next{right:8px}.nav,.exit{box-shadow:none}}
</style>
</head>
<body>
<div class="stage" id="stage"></div>
<button class="nav prev" id="prev" aria-label="previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
<button class="nav next" id="next" aria-label="next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
<button class="exit" id="exit" aria-label="exit" title="退出授课"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
<div class="subtitle" id="subtitle"></div>
<div class="counter" id="counter"></div>
<div class="music" id="music" style="display:none"><button id="musicBtn"></button><span id="musicName"></span><input id="musicVol" aria-label="背景音乐音量" type="range" min="0" max="1" step="0.05" value="0.35"></div>
<audio id="bgm" loop></audio>
<script>
var DATA = ${JSON.stringify(payload)};
var index = 0;
var stage = document.getElementById('stage');
var subtitle = document.getElementById('subtitle');
var counter = document.getElementById('counter');
var prevBtn = document.getElementById('prev');
var nextBtn = document.getElementById('next');
var bgm = document.getElementById('bgm');
var musicBox = document.getElementById('music');
var musicBtn = document.getElementById('musicBtn');

function render() {
  var item = DATA.items[index] || {};
  stage.innerHTML = item.image
    ? '<img src="' + item.image + '" alt="Page ' + (index + 1) + '">'
    : '<span class="empty">本页暂无插图</span>';
  subtitle.textContent = item.subtitle || '';
  counter.textContent = (index + 1) + ' / ' + DATA.items.length;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === DATA.items.length - 1;
}
function go(delta) { index = Math.max(0, Math.min(DATA.items.length - 1, index + delta)); render(); }

prevBtn.onclick = function () { go(-1); };
nextBtn.onclick = function () { go(1); };
document.getElementById('exit').onclick = function () { window.close(); };
window.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowLeft') go(-1);
  else if (event.key === 'ArrowRight') go(1);
  else if (event.key === 'Escape') window.close();
});

if (DATA.music) {
  bgm.src = DATA.music.url;
  bgm.volume = 0.35;
  musicBox.style.display = 'flex';
  document.getElementById('musicName').textContent = DATA.music.name;
  var icon = function (playing) {
    return playing
      ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
  };
  var setIcon = function (playing) { musicBtn.innerHTML = icon(playing); };
  musicBtn.onclick = function () { if (bgm.paused) bgm.play().catch(function () {}); else bgm.pause(); };
  bgm.addEventListener('play', function () { setIcon(true); });
  bgm.addEventListener('pause', function () { setIcon(false); });
  document.getElementById('musicVol').oninput = function () { bgm.volume = Number(this.value); };
  bgm.play().catch(function () { setIcon(false); });
  setIcon(true);
}
render();
</script>
</body>
</html>`;

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  return true;
}

/**
 * 歌曲编排屋授课：新窗口播放（带填词、乐器编排与音频播放器）
 *
 * @param {object} options
 * @param {{title: string, lines: string[]}} options.draft 歌名与歌词行（______ 为填空位）
 * @param {Record<string, string>} [options.blankValues] 已填答案（键为 "行号:序号" 或行号）
 * @param {Record<number, Array<{label: string, icon: string}>>} [options.arrangement] 每行乐器编排
 * @param {{name: string, vocalUrl?: string, instrumentalUrl?: string, fallbackUrl?: string}} [options.audio] 音频信息
 * @param {string} [options.backgroundUrl] 背景图地址（叠加半透明纸色层保证可读性）
 * @returns {boolean} 是否成功打开
 */
export function openSongWindow({ draft, blankValues = {}, arrangement = {}, audio = null, backgroundUrl = '' } = {}) {
  const lines = Array.isArray(draft?.lines) ? draft.lines : [];
  if (!lines.length) return false;
  const vocalUrl = audio?.vocalUrl || '';
  const instrumentalUrl = audio?.instrumentalUrl || '';
  const fallbackUrl = audio?.fallbackUrl || '';
  const payload = {
    title: draft?.title || '歌曲授课',
    melodyName: audio?.name || '未选择曲目',
    lines,
    blankValues,
    arrangement: Object.fromEntries(Object.entries(arrangement || {}).map(([k, v]) => [k, Array.isArray(v) ? v : []])),
    audio: { vocalUrl, instrumentalUrl, fallbackUrl },
  };

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(payload.title)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;color:#344255;font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;overflow-y:auto;background-color:#f7f2ee;background-image:linear-gradient(rgba(255,251,247,.68),rgba(255,251,247,.68)),url('${encodeCssUrl(backgroundUrl)}');background-size:cover,cover;background-position:center,center;background-attachment:fixed;background-repeat:no-repeat}
.deco{position:fixed;z-index:0;pointer-events:none;font-weight:900;opacity:.48}
.deco.d1{left:6%;top:12%;color:#9964db;font-size:58px;transform:rotate(-12deg)}
.deco.d2{right:8%;top:15%;color:#efbd31;font-size:54px}
.deco.d3{left:8%;bottom:10%;color:#f4785e;font-size:42px;transform:rotate(10deg)}
.deco.d4{right:7%;bottom:12%;color:#58aaa0;font-size:64px}
.exit{position:fixed;top:20px;right:24px;width:44px;height:44px;border:2px solid #344255;border-radius:50%;background:#fff;color:#344255;box-shadow:2px 2px 0 rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s;z-index:5}
.exit:hover{background:#fdece8}
.exit svg{width:22px;height:22px}
.content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;min-height:100%;padding:72px 24px 40px;max-width:1080px;margin:0 auto;width:100%}
h1{font-size:2.45rem;font-weight:800;color:#344255;text-align:center}
.subtitle{padding:5px 14px;border-radius:999px;background:#fff;color:#7b6a88;box-shadow:1px 1px 0 rgba(52,66,85,.14);margin:10px 0 24px;font-size:1rem}
.player{display:flex;align-items:center;gap:14px;flex-wrap:wrap;width:100%;max-width:940px;margin-bottom:24px;padding:14px 18px;border:2px solid #344255;border-radius:12px;background:#fffdf8;box-shadow:4px 4px 0 #a8e0d8}
.play{width:56px;height:56px;border:2px solid #cf5846;border-radius:8px;background:#f4785e;color:#fff;box-shadow:2px 2px 0 #cf5846;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.play:hover{background:#e86d58}
.play svg{width:24px;height:24px}
.controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;flex:1}
.speed,.mode{display:flex;gap:4px}
.speed button,.mode button{padding:5px 10px;border:1px solid #dedbd5;border-radius:7px;background:#fff;color:#596273;font:600 13px inherit;cursor:pointer;transition:.15s}
.speed button.active,.mode button.active{border-color:#f4785e;background:#fdece8;color:#cf5846}
.volume{display:flex;align-items:center;gap:6px;color:#596273;font-size:13px}
.volume b{color:#344255;min-width:32px}
.volume input{accent-color:#f4785e}
.time{color:#596273;font-size:12px;font-variant-numeric:tabular-nums}
.lyrics{width:100%;max-width:940px;display:flex;flex-direction:column;gap:12px}
.line{display:flex;align-items:center;gap:12px;padding:12px 24px;border:1px solid #dedbd5;border-radius:10px;background:#fff;color:#344255;box-shadow:2px 2px 0 rgba(0,0,0,.1);font-size:1.4rem;text-align:center;line-height:1.8;font-weight:600}
.line:nth-child(4n+1){background:#fff7d9;box-shadow:3px 3px 0 #e8cd68}
.line:nth-child(4n+2){background:#f2eafb;box-shadow:3px 3px 0 #c7a9e7}
.line:nth-child(4n+3){background:#e9f7f4;box-shadow:3px 3px 0 #8fcfc5}
.line:nth-child(4n){background:#fff0eb;box-shadow:3px 3px 0 #efa28d}
.copy{flex:1;text-align:center}
.blank{color:#cf5846;font-weight:800;border-bottom:2px solid #f4785e;padding:0 6px}
.insts{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px;flex:0 0 auto}
.insts span{display:flex;align-items:center;gap:4px;padding:4px 7px;border:1px solid rgba(52,66,85,.28);border-radius:999px;background:rgba(255,255,255,.82)}
.insts img{width:26px;height:26px;object-fit:contain}
.insts small{color:#596273;font-size:11px;font-weight:700}
@media(max-width:720px){.content{padding:70px 16px 28px}.line{padding:12px 16px;font-size:1.08rem;flex-direction:column}.insts{justify-content:center}}
</style>
</head>
<body>
<span class="deco d1">♫</span><span class="deco d2">✦</span><span class="deco d3">♥</span><span class="deco d4">〰</span>
<button class="exit" id="exit" aria-label="exit" title="退出授课"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
<div class="content">
  <h1 id="title"></h1>
  <p class="subtitle" id="subtitle"></p>
  <div class="player">
    <button class="play" id="play"></button>
    <span class="time" id="cur">0:00</span>
    <input id="seek" aria-label="播放进度" type="range" min="0" max="0" step="0.1" value="0" style="flex:1;min-width:120px;accent-color:#f4785e" disabled>
    <span class="time" id="dur">0:00</span>
    <div class="controls">
      <div class="speed" id="speed"></div>
      <label class="volume"><b id="volText">75%</b><input id="vol" aria-label="音量" type="range" min="0" max="1" step="0.05" value="0.75"></label>
      <div class="mode" id="mode" style="display:none"></div>
    </div>
  </div>
  <div class="lyrics" id="lyrics"></div>
</div>
<audio id="audio" preload="auto"></audio>
<script>
var DATA = ${JSON.stringify(payload)};
var BLANK = '______';
var audio = document.getElementById('audio');

function esc(s){return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function fmt(t){if(!Number.isFinite(t))return '0:00';var m=Math.floor(t/60),s=Math.round(t%60);return m+':'+(s<10?'0':'')+s;}

document.getElementById('title').textContent = DATA.title;
document.getElementById('subtitle').textContent = DATA.melodyName;

// 歌词行：填空位替换为已填答案
var lyrics = document.getElementById('lyrics');
DATA.lines.forEach(function(line, index){
  var row = document.createElement('div');
  row.className = 'line';
  var copy = document.createElement('span');
  copy.className = 'copy';
  if (String(line).indexOf(BLANK) === -1) {
    copy.textContent = line;
  } else {
    var parts = String(line).split(BLANK);
    copy.innerHTML = parts.map(function(part, i){
      if (i === parts.length - 1) return esc(part);
      var v = DATA.blankValues[index + ':' + i] != null ? DATA.blankValues[index + ':' + i] : (i === 0 ? DATA.blankValues[index] : '');
      return esc(part) + '<span class="blank">' + esc(v || BLANK) + '</span>';
    }).join('');
  }
  row.appendChild(copy);
  var insts = DATA.arrangement[index] || [];
  if (insts.length) {
    var box = document.createElement('span');
    box.className = 'insts';
    insts.forEach(function(inst){
      box.innerHTML += '<span title="' + esc(inst.label) + '"><img src="' + esc(inst.icon) + '" alt="">' + (inst.label ? '<small>' + esc(inst.label) + '</small>' : '') + '</span>';
    });
    row.appendChild(box);
  }
  lyrics.appendChild(row);
});

// 音频源
function srcOf(){
  if (DATA.audio.instrumentalUrl || DATA.audio.vocalUrl) {
    return mode === 'vocal' ? (DATA.audio.vocalUrl || DATA.audio.instrumentalUrl) : (DATA.audio.instrumentalUrl || DATA.audio.vocalUrl);
  }
  return DATA.audio.fallbackUrl || '';
}
var mode = 'instrumental';
var playBtn = document.getElementById('play');
var icon = function (playing) {
  return playing
    ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
};
function applySrc(){ audio.src = srcOf(); playBtn.innerHTML = icon(false); }
applySrc();

playBtn.onclick = function(){ if (audio.paused) audio.play().catch(function(){}); else audio.pause(); };
audio.addEventListener('play', function(){ playBtn.innerHTML = icon(true); });
audio.addEventListener('pause', function(){ playBtn.innerHTML = icon(false); });
audio.addEventListener('timeupdate', function(){
  document.getElementById('cur').textContent = fmt(audio.currentTime);
  var seek = document.getElementById('seek');
  if (Number.isFinite(audio.duration) && audio.duration > 0 && document.activeElement !== seek) seek.value = audio.currentTime;
});
audio.addEventListener('loadedmetadata', function(){
  var seek = document.getElementById('seek');
  seek.disabled = !Number.isFinite(audio.duration) || !audio.duration;
  seek.max = audio.duration || 0;
  document.getElementById('dur').textContent = fmt(audio.duration);
});
document.getElementById('seek').oninput = function(){ audio.currentTime = Number(this.value); };

// 语速
var speedBox = document.getElementById('speed');
[0.5, 0.75, 1, 1.25, 1.5].forEach(function(item){
  var b = document.createElement('button');
  b.textContent = item + '×';
  if (item === 1) b.className = 'active';
  b.onclick = function(){
    audio.playbackRate = item;
    Array.prototype.forEach.call(speedBox.children, function(x){ x.className = ''; });
    b.className = 'active';
  };
  speedBox.appendChild(b);
});

// 音量
var vol = document.getElementById('vol');
audio.volume = 0.75;
vol.oninput = function(){
  audio.volume = Number(this.value);
  document.getElementById('volText').textContent = Math.round(this.value * 100) + '%';
};

// 演唱/伴奏切换（回到起点，与工坊内行为一致）
if (DATA.audio.vocalUrl && DATA.audio.instrumentalUrl) {
  var modeBox = document.getElementById('mode');
  modeBox.style.display = 'flex';
  [['instrumental', '伴奏版'], ['vocal', '演唱版']].forEach(function(pair){
    var b = document.createElement('button');
    b.textContent = pair[1];
    if (pair[0] === mode) b.className = 'active';
    b.onclick = function(){
      mode = pair[0];
      Array.prototype.forEach.call(modeBox.children, function(x){ x.className = ''; });
      b.className = 'active';
      var wasPlaying = !audio.paused;
      applySrc();
      audio.playbackRate = Number((document.querySelector('.speed button.active') || {textContent:'1'}).textContent) || 1;
      if (wasPlaying) audio.play().catch(function(){});
    };
    modeBox.appendChild(b);
  });
}

document.getElementById('exit').onclick = function(){ audio.pause(); window.close(); };
window.addEventListener('keydown', function(event){
  if (event.key === 'Escape') { audio.pause(); window.close(); }
  else if (event.key === ' ') { event.preventDefault(); playBtn.click(); }
});
</script>
</body>
</html>`;

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  return true;
}
