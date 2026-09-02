import {
  BookOpen, Brain, Dumbbell, FileImage, Gamepad2, Headphones,
  MessageCircle, Mic2, Music, Palette, PenLine, Puzzle, Sparkles,
  Star, Theater, Volume2,
} from 'lucide-react';

export const WORKSHOP_MODULES = {
  'english-plus': {
    eyebrow: '创作工坊 · 模块 1',
    title: '“英语+”融合活动',
    description: '把语言学习与艺术、身体和音乐融合，让学生通过真实体验自然内化英语。',
    accent: '#f4785e',
    icon: Sparkles,
    paths: [
      { title: '艺术表达', description: '视觉创作 + 情绪表达', icon: Palette, path: '/picture-books', action: '进入绘本制作' },
      { title: '体感探索', description: '身体叙事 + 语言嵌入', icon: Dumbbell, path: '/workshop/interactive-yoga', action: '查看互动瑜伽' },
      { title: '音乐律动', description: '节奏 + 身体 + 语言', icon: Music, path: '/workshop/music-star-quest', action: '查看星光录音棚' },
      { title: '歌曲编唱屋', description: '围绕教学目标创作英语歌曲', icon: Mic2, path: '/song-writing', action: '开始歌曲创作' },
    ],
    examples: ['情绪颜色绘本', 'A Walk in Wonder', 'Where Are You From'],
  },
  'skills-training': {
    eyebrow: '创作工坊 · 模块 2', title: '能力训练', icon: Brain, accent: '#4482e5',
    description: '按语言技能创建强调身体参与、情感体验和自然内化的训练活动。',
    paths: [
      { title: '语法', description: '把规则放进情境任务', icon: Puzzle },
      { title: '词汇', description: '多感官词汇练习', icon: PenLine },
      { title: '听力', description: '分层听辨与反馈', icon: Headphones },
      { title: '口语', description: '真实表达与合作任务', icon: MessageCircle },
      { title: '阅读', description: '情境阅读与思维支架', icon: BookOpen },
      { title: '写作', description: '从体验到结构化表达', icon: PenLine },
    ],
    examples: ['Grammar Detective', 'Vocabulary Mission', 'Listen & Move'],
  },
  'fun-practice': {
    eyebrow: '创作工坊 · 模块 3', title: '趣味练习', icon: Gamepad2, accent: '#9966d0',
    description: '把练习题转化为可推进、可探索、可获得即时反馈的课堂游戏。',
    paths: [
      { title: '密室闯关', description: '答题解锁下一空间', icon: Gamepad2 },
      { title: '侦探解谜', description: '收集线索、推理与答题', icon: Puzzle },
      { title: '盲盒答题', description: '随机惊喜与挑战', icon: Star },
    ],
    examples: ['Lost Classroom Escape', 'The Missing Word', 'Lucky Question Box'],
  },
  'complete-course': {
    eyebrow: '创作工坊 · 模块 4', title: '完整课程', icon: BookOpen, accent: '#509f69',
    description: '输入教学目标，生成符合幸福力设计框架的完整课程方案与 PPT 课件。',
    paths: [
      { title: '创建完整课程', description: '从教学目标开始完整备课', icon: Sparkles, path: '/create', action: '开始创建' },
      { title: '管理课程', description: '继续编辑已有课程和课件', icon: BookOpen, path: '/figma-courses', action: '查看课程' },
    ],
    examples: ['自然拼读完整课', '主题阅读完整课', '幸福力口语课'],
  },
  'themed-activities': {
    eyebrow: '创作工坊 · 模块 5', title: '主题活动', icon: Theater, accent: '#f5a233',
    description: '围绕节日、成长主题或机构活动快速生成可直接执行的活动方案。',
    paths: [
      { title: '节日活动', description: '新年、圣诞节、母亲节等', icon: Star },
      { title: '成长主题', description: '友情、自信、感恩与合作', icon: Theater },
      { title: '学科主题', description: '动物、自然、城市与太空', icon: Sparkles },
    ],
    examples: ['Christmas Kindness Quest', 'Friendship Day', 'Animal World Festival'],
  },
  'teaching-materials': {
    eyebrow: '创作工坊 · 模块 6', title: '教学素材', icon: FileImage, accent: '#cf5846',
    description: '使用针对幸福力英语教学优化的模板和工作流生成课堂素材。',
    paths: [
      { title: 'Flash Card', description: '生成统一风格词汇卡', icon: FileImage, path: '/test/ip-scene', action: '开始生成' },
      { title: '四格漫画', description: '把语言点转化成短故事', icon: Palette, path: '/picture-books', action: '开始创作' },
      { title: '体式引导图', description: '生成动作清晰的体式素材', icon: Dumbbell, path: '/workshop/interactive-yoga', action: '查看案例' },
      { title: '音频素材', description: '生成课堂配音与音效', icon: Volume2, path: '/test/audio-generator', action: '生成音频' },
    ],
    examples: ['Nature Flash Cards', 'Emotion Comic', 'Yoga Pose Guide'],
  },
};

export const EXPERIENCE_CONFIG = {
  yoga: {
    type: '互动式情境瑜伽',
    title: 'A Walk in Wonder Yoga Adventure',
    subtitle: '身体叙事 × 情境探索 × 英语内化',
    description: '教师以探险向导和瑜伽教练的双重角色，带领学生在连续故事中完成语言学习与身体探索。',
    demoUrl: '/demos/a-walk-in-wonder.html',
    accent: '#509f69',
    icon: Dumbbell,
    features: ['6–12 页连续故事', '4–8 个情境体式', '教师逐页讲稿', '背景音乐与音效配置'],
    fields: [
      ['theme', '情境主题', '例如：海洋探险', 'text'],
      ['goals', '目标语言点', '例如：ocean, wave, What can you see?', 'textarea'],
      ['age', '年龄段', '7–10 岁', 'select'],
      ['duration', '活动时长', '15 分钟', 'select'],
      ['requirements', '特殊要求', '角色、道具或体式偏好', 'textarea'],
    ],
  },
  star: {
    type: '音乐律动',
    title: 'Music Star Quest',
    subtitle: '歌词理解 × 动作编排 × 分级跟唱 × 作品录制',
    description: '以四关闯关方式完成一首英语歌曲的理解、表演、演唱与录制。',
    demoUrl: '/demos/music-star-quest.html',
    accent: '#9966d0',
    icon: Music,
    features: ['四关渐进式任务', '歌词与音频同步', '动作和乐器编排', '分组演唱与本地录音'],
    fields: [
      ['goals', '目标语言点', '例如：China, USA, Where are you from?', 'textarea'],
      ['theme', '歌曲主题', '例如：国家与问候', 'text'],
      ['age', '年龄段', '7–10 岁', 'select'],
      ['level', '英文水平', '初级', 'select'],
      ['style', '风格偏好', '欢快', 'select'],
      ['duration', '歌曲时长', '60–90 秒', 'select'],
      ['requirements', '特殊要求', '例如：加入问答呼应', 'textarea'],
    ],
  },
};

