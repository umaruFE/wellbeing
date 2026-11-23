import { randomUUID } from 'node:crypto';

// Only loaded as a Vite development middleware in --mode visual-preview.
// Never forwards requests, uses real tokens, or writes to the production API.
const demoUser = { id: 'preview-teacher', name: '示例教师', username: 'preview', role: 'super_admin', organizationId: 'preview-school' };
const demoToken = 'local-style-preview-only';
const stamp = '2026-11-18T08:30:00.000Z';
const image = '/ppt/backgrounds/kids-storybook-forest.png';
function makeState() {
  const courses = ['森林里的颜色侦探', '天空旅行计划', '动物朋友的秘密', '一起种下小花园', '我的情绪魔法盒', '星际救援小队'].map((title, i) => ({
    id: `preview-course-${i + 1}`, title, status: i === 1 ? 'published' : 'draft',
    age_group: '7-9岁', duration: 40, unit: '9-15人', created_at: stamp, updated_at: stamp,
    thumbnail: ['/ppt/backgrounds/kids-storybook-forest.png', '/ppt/backgrounds/kids-sky-adventure.png', '/ppt/backgrounds/kids-space-adventure.png'][i % 3],
    canvas_data: [{ key: 'engage', title: 'ENGAGE 引入', steps: [{ id: 'preview-step', title: '观察森林', duration: '5 min', slides: [{ id: 'preview-slide', title: 'Look at the forest', background: '#ffffff', backgroundImage: image, layers: [{ id: 'preview-text', type: 'text', title: '标题', x: 80, y: 160, width: 780, height: 100, content: 'What can you see?', fontSize: 48, fontWeight: 'bold', color: '#302b3b', textAlign: 'center', lineHeight: 1.2, rotation: 0 }] }] }] }],
    course_data: {
      courseTitle: title, age: '7-9岁', duration: '40分钟', classSize: '9-15人',
      vocabularies: ['leaf', 'tree', 'flower', 'green'], grammars: ['I can see a ...'],
      languageSkills: ['听', '说'], taskName: title, storyContext: '和伙伴一起走进森林，发现身边的颜色与植物。',
      keyOutcome: '制作一张自然观察卡，并用英语介绍自己的发现。', experiencePath: '艺术表达',
      courseOverview: { courseTitle: title, languageGoals: { vocabulary: ['leaf', 'tree', 'flower'], grammar: ['I can see a ...'] } },
    },
  }));
  const books = ['My Little Nature Garden', 'A Colorful Forest Walk', 'Hello, Animal Friends!'].map((title, i) => ({
    id: `preview-book-${i + 1}`, title, status: 'draft', cover_url: image, created_at: stamp, updated_at: stamp,
    book_data: {
      step: 0,
      basicInfo: { age: '7-9岁', level: '初级（会字母和简单词）', participants: '班级（10+）', themes: ['自然探索'], themeOther: '', materials: ['画纸'], materialOther: '', vocabulary: 'leaf, tree, flower, green', grammar: 'I can see a ...' },
      activityPlan: { storyTitleEn: title, storyTitleZh: '我的自然小花园', storyContent: '孩子们观察一片树叶、一朵小花，合作画出心中的小花园。', englishGoal: '认识常见植物，用 I can see a ... 描述观察结果。', wellbeingGoal: '留意自然之美，练习友善表达与合作。', outputGoal: '每人完成一页自然观察绘本。', materials: '画纸、彩笔、树叶', recommendedPageCount: 4 },
      pages: ['I can see a tree.', 'I can see a flower.', 'The leaves are green.', 'This is our little garden.'].map((text, n) => ({ id: `page-${n}`, page: n + 1, pageNumber: n + 1, title: `Page ${n + 1}`, text, englishText: text, imageUrl: image, imagePrompt: 'A gentle forest garden, watercolor illustration.', imageDescription: '柔和的森林花园插画，孩子们观察身边的植物。' })),
      backgroundMusic: null,
    },
  }));
  return {
    courses, 'picture-books': books,
    'creative-works': [{ id: 'preview-work-1', module_id: 'skills-training', module_name: '能力训练', title: '森林词汇观察卡', parameters: { title: '森林词汇观察卡', goals: '认识树、花与树叶的英文表达。', age: '7–10 岁', duration: '20 分钟' }, status: 'draft', created_at: stamp, updated_at: stamp }],
    textbooks: [{ id: 'preview-textbook', name: '示例英语教材', description: '用于检查教材树与单元布局', children: [{ id: 'preview-grade', name: '三年级', children: [{ id: 'preview-unit', name: 'Unit 1 · Our Garden', content: 'leaf, tree, flower', children: [] }] }] }],
    users: [{ ...demoUser, email: 'preview@example.invalid', organization_name: '示例学校', created_at: stamp }, { id: 'preview-creator', name: '示例教研员', email: 'creator@example.invalid', role: 'creator', organization_name: '示例学校', created_at: stamp }],
    organizations: [{ id: 'preview-school', name: '示例学校', code: 'PREVIEW', account_count: 2 }],
    'ppt-images': [{ id: 'preview-image', name: '森林场景（仓库示例素材）', image_url: image, url: image, tags: ['背景'], created_at: stamp }],
    videos: [], voices: [], 'audio-assets': [], 'song-library': [], 'ip-characters': [],
  };
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export function createPreviewHandler() {
  let state = makeState();
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    if (path === '/__preview/start' || path === '/__preview/reset') {
      if (path.endsWith('/reset')) state = makeState();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>进入本地样式预览</title><script>localStorage.setItem('user',${JSON.stringify(JSON.stringify(demoUser))});localStorage.setItem('token',${JSON.stringify(demoToken)});localStorage.setItem('i18nextLng','zh');location.replace('/');</script><p>正在进入本地样式预览…</p></html>`);
      return;
    }
    if (/^\/ai(?:-video)?(?:\/|$)/.test(path)) return send(res, 503, { error: '本地样式预览未连接 AI 服务。' });
    if (!path.startsWith('/api/')) return next();
    let body = {};
    if (!['GET', 'HEAD'].includes(req.method)) {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      try { body = raw ? JSON.parse(raw) : {}; } catch { return send(res, 400, { error: '预览仅支持 JSON 示例数据，不接收文件上传。' }); }
    }
    if (path === '/api/auth/login') return send(res, 200, { success: true, user: demoUser, token: demoToken });
    if (path === '/api/auth/me') return req.method === 'GET'
      ? send(res, 200, { success: true, user: demoUser, data: demoUser })
      : send(res, 503, { error: '本地预览不修改真实账号。' });
    if (path === '/api/events') return send(res, 200, { success: true });
    if (path === '/api/stats') return send(res, 200, { success: true, data: {
      content: { courses: state.courses.length, pictureBooks: state['picture-books'].length, total: state.courses.length + state['picture-books'].length },
      courses: { total: state.courses.length }, media: { images: 1, videos: 0, audios: 0 },
      tasks: { running: 0, completed: 0, queued: 0 }, todayCompleted: 0,
      compute: { used: 0, total: 0, remaining: 0 },
    } });
    if (path === '/api/background-tasks') return send(res, 200, { success: true, data: { tasks: [] } });
    if (path === '/api/prompt-history') return send(res, 200, []);
    if (path === '/api/ai/task-queue') return send(res, 200, { data: [] });
    const [, , collection, id, action] = path.split('/');
    if (Object.hasOwn(state, collection) && !action) {
      const rows = state[collection];
      const row = id ? rows.find(item => String(item.id) === id) : undefined;
      if (id && !row) return send(res, 404, { error: '找不到这条示例记录，请重置预览后重试。' });
      if (req.method === 'GET') {
        let list = rows;
        if (url.searchParams.get('moduleId')) list = list.filter(item => item.module_id === url.searchParams.get('moduleId'));
        if (url.searchParams.get('status')) list = list.filter(item => item.status === url.searchParams.get('status'));
        return send(res, 200, { success: true, data: id ? row : list, pagination: { total: list.length, totalPages: 1 } });
      }
      if (req.method === 'DELETE') {
        state[collection] = rows.filter(item => item.id !== id);
        return send(res, 200, { success: true });
      }
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const data = { ...(row || {}), ...body, id: id || `preview-${randomUUID()}`, created_at: row?.created_at || stamp, updated_at: new Date().toISOString() };
        if (body.bookData) data.book_data = body.bookData;
        if (body.coverUrl) data.cover_url = body.coverUrl;
        if (body.courseData) data.course_data = body.courseData;
        if (body.moduleId) data.module_id = body.moduleId;
        if (body.moduleName) data.module_name = body.moduleName;
        if (row) rows.splice(rows.indexOf(row), 1, data); else rows.unshift(data);
        return send(res, 200, { success: true, data });
      }
    }
    return send(res, 503, { success: false, error: '本地样式预览未连接此服务；可以查看页面和编辑示例数据。' });
  };
}

export function visualPreviewPlugin() {
  return {
    name: 'isolated-visual-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', "connect-src 'self' ws:; img-src 'self' data: blob:; media-src 'self' data: blob:; frame-src 'self' data: blob:");
        next();
      });
      server.middlewares.use(createPreviewHandler());
    },
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [{ tag: 'style', children: 'body{padding-top:30px;overflow:hidden}#root{height:calc(100dvh - 30px);overflow:auto}#root>div{max-height:100%}#root .wb-app-layout{position:relative}#root .sidebar{height:100%}.preview-bar{position:fixed;inset:0 0 auto;z-index:10000;height:30px;display:flex;align-items:center;justify-content:center;gap:18px;background:#302b3b;color:#fff;font:12px/1.4 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}.preview-bar a{color:#e2d8fa;text-decoration:underline}@media(max-width:600px){.preview-bar{font-size:11px;gap:8px}.preview-bar .preview-note{display:none}}', injectTo: 'head' },
          { tag: 'div', attrs: { class: 'preview-bar' }, children: '本地样式预览 · 示例数据<span class="preview-note">原系统示例保存仅本次运行有效 · 六模块活动保存在本机</span><a href="/__preview/reset">重置原系统示例</a><a href="/login">登录页</a>', injectTo: 'body-prepend' }];
      },
    },
  };
}
