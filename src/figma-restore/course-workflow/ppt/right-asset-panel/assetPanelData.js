import {
  Activity,
  BookOpen,
  Bot,
  Clapperboard,
  Dumbbell,
  FileText,
  Film,
  Grid2X2,
  Image,
  LayoutTemplate,
  Map,
  Mic,
  Music,
  Network,
  Palette,
  Smile,
  Sparkles,
  Speech,
  UsersRound,
  Volume2,
  Wind,
} from 'lucide-react';

export const imageAssetTypes = [
  { code: 'B1', title: '主题意境图', desc: '背景图，无文字', tone: 'blue', icon: Sparkles },
  { code: 'B2', title: '意境图（有文字）', desc: '海报效果，图文排版', tone: 'purple', icon: LayoutTemplate },
  { code: 'B3', title: '词汇闪卡', desc: '批量生成', tone: 'coral', icon: FileText },
  { code: 'B4', title: '故事配图', desc: '文字留白', tone: 'green', icon: BookOpen },
  { code: 'B5', title: '活动氛围图', desc: '体能/音乐', tone: 'blue', icon: Activity },
  { code: 'B6', title: '主题词图谱', desc: '场景词汇标注', tone: 'coral', icon: Network },
  { code: 'B7', title: '文本配图', desc: '谜题/对话', tone: 'pink', icon: Speech },
  { code: 'B8', title: '知识总结图', desc: '语法/思维导图', tone: 'orange', icon: Map },
  { code: 'B9', title: '绘本故事配图', desc: '多页故事角色一致', tone: 'teal', icon: BookOpen },
  { code: 'B10', title: '四格漫画', desc: '漫画情节和对话', tone: 'lime', icon: Grid2X2 },
  { code: 'B11', title: '动作示意图', desc: 'TPR，IP角色', tone: 'purple', icon: Dumbbell },
  { code: 'B13', title: 'IP角色场景图', desc: '多角色场景合成', tone: 'orange', icon: UsersRound },
];

export const audioAssetTypes = [
  { code: 'C1', title: '情绪氛围BGM', desc: '纯器乐', tone: 'coral', icon: Smile },
  { code: 'C2', title: '活动背景乐', desc: '游戏/冥想', tone: 'purple', icon: Volume2 },
  { code: 'C3', title: '跟读朗读', desc: 'TTS', tone: 'green', icon: Mic },
  { code: 'C4', title: '情景对话', desc: '多角色', tone: 'blue', icon: Speech },
  { code: 'C5', title: '教学歌曲', desc: 'AI词+音乐', tone: 'purple', icon: Mic },
  { code: 'C6', title: '冥想引导', desc: '语音+背景', tone: 'coral', icon: Wind },
];
export const videoAssetTypes = [
  { code: 'V1', title: '体能闯关视频', desc: '单角色·5步向导', tone: 'blue', icon: Dumbbell },
  { code: 'VM', title: '情境叙事视频', desc: '世界观·叙事CG', tone: 'purple', icon: Clapperboard },
  { code: 'V3', title: '教学动画', desc: '即将上线', tone: 'coral', icon: Film, disabled: true },
];

export const ratioOptions = [
  { value: '16:9', label: '16:9', desc: '横版' },
  { value: '9:16', label: '9:16', desc: '竖版' },
  { value: '4:3', label: '4:3', desc: '横版' },
  { value: '1:1', label: '1:1', desc: '方形' },
  { value: 'A4', label: 'A4', desc: '打印' },
];

export const styleOptions = [
  { value: 'cartoon', label: '卡通插画' },
  { value: 'realistic', label: '写实摄影' },
  { value: 'watercolor', label: '水彩绘本' },
];

export const imageSpecificFields = {
  B1: { prompt: '描述场景', placeholder: '例：太空场景，宇宙飞船驾驶舱', note: '中英文均可，适合生成无文字背景。' },
  B2: { prompt: '描述场景与文字', placeholder: '例：森林课堂，标题：Animal Rescue Mission', note: 'AI 会自动进行海报式图文排版。' },
  B3: { prompt: '词汇列表', placeholder: '例：cat, dog, bird, rabbit，每行一个词', note: '每个词生成 1 张闪卡，保持统一版式。' },
  B4: { prompt: '故事片段', placeholder: '例：Poppy在花园里发现一颗发光的种子', note: '可选择文字留白区域，方便后续排版。' },
  B5: { prompt: '活动标题', placeholder: '例：Animal Sports Day / 星际音乐会', note: 'AI 根据活动类型自动补全画面气氛。' },
  B6: { prompt: '主题词', placeholder: '例：Zoo animals, habitats, food', note: '输出带标注的场景词汇图谱。' },
  B7: { prompt: '文本内容', placeholder: '例：Can you find the hidden star?', note: '适合谜题、短对话和课堂提问配图。' },
  B8: { prompt: '知识点', placeholder: '例：一般现在时第三人称单数', note: '默认输出横版 PPT 思维导图。' },
  B9: { prompt: '绘本故事梗概', placeholder: '例：Poppy和朋友一起寻找春天的声音', note: '进入逐帧编辑后固定生成 4 帧。' },
  B10: { prompt: '目标短语/句型', placeholder: '例：Can I have...? / I want to...', note: '固定四格漫画布局，自动编排起承转合。' },
  B11: { prompt: '动作名称', placeholder: '例：jump, crawl, stretch', note: '每个动作生成 1 张动作示意图。' },
  B13: { prompt: '描述场景', placeholder: '例：太空教室，认识星球单词', note: '多选 IP 角色，默认生成独立透明角色图层后合成场景图。' },
};

export const activityThemes = ['艺术', '瑜伽', '体能', '音乐', '游戏', '展示', '庆祝'];
export const whitespaceOptions = ['顶部', '底部', '左侧', '右侧'];
export const chartOptions = ['思维导图', '知识表格', '鱼骨图', '树状图'];
export const comicStyles = ['Q版萌系', '日漫风', '美漫风'];
export const characterOptions = ['Poppy', 'Edi', 'Rolly', 'Milo', 'Ace'];
export const actionOptions = ['站立伸展', '向前跳', '匍匐前进', '单脚平衡', '挥手问好', '转身拍手'];

export const audioConfig = {
  C1: {
    steps: ['选择情绪', '设置时长', '生成结果'],
    fields: [
      { type: 'chips', key: 'emotion', label: '情绪氛围', options: ['安静', '神秘', '温柔', '活泼'] },
      { type: 'chips', key: 'duration', label: '时长', options: ['30秒', '1分钟', '2分钟'] },
    ],
  },
  C2: {
    steps: ['活动场景', '节奏强度', '生成结果'],
    fields: [
      { type: 'chips', key: 'activity', label: '活动场景', options: ['比赛', '游戏', '体能闯关', '冥想'] },
      { type: 'chips', key: 'tempo', label: '节奏', options: ['轻快', '中速', '强节奏'] },
    ],
  },
  C3: {
    steps: ['输入文本', '选择音色', '生成结果'],
    fields: [
      { type: 'textarea', key: 'text', label: '朗读文本', placeholder: '例：Jump like a rabbit. Stretch like a cat.' },
      { type: 'chips', key: 'voice', label: '音色', options: ['女声', '男声', '儿童声'] },
      { type: 'chips', key: 'speed', label: '语速', options: ['慢速', '正常', '稍快'] },
    ],
  },
  C4: {
    steps: ['对话设定', '角色音色', '生成结果'],
    fields: [
      { type: 'textarea', key: 'dialogue', label: '对话脚本', placeholder: '例：A: What can you see? B: I can see a lion.' },
    ],
  },
  C5: {
    steps: ['主题', '歌词', '音乐风格', '生成结果'],
    fields: [
      { type: 'input', key: 'topic', label: '歌曲主题', placeholder: '例：Farm Animals' },
      { type: 'textarea', key: 'lyrics', label: '歌词草稿', placeholder: '可留空，AI 自动生成押韵歌词' },
      { type: 'chips', key: 'style', label: '音乐风格', options: ['儿歌', '律动', '合唱'] },
    ],
  },
  C6: {
    steps: ['引导主题', '语音背景', '生成结果'],
    fields: [
      { type: 'input', key: 'topic', label: '引导主题', placeholder: '例：课前安静呼吸' },
      { type: 'chips', key: 'background', label: '背景声', options: ['森林', '海浪', '轻音乐'] },
    ],
  },
};

export const videoScenes = ['森林', '沙滩', '海洋', '农场', '太空', '雪山'];
export const videoCharacters = ['Poppy', 'Edi', 'Rolly', 'Milo', 'Ace'];
export const videoSteps = ['场景 · 角色', '词汇与句型', '生成'];

export function getAssetGroups(type) {
  if (type === 'image') return [{ title: '选择图片素材类型', items: imageAssetTypes }];
  if (type === 'audio') return [{ title: '选择音频素材类型', items: audioAssetTypes }];
  if (type === 'video') return [{ title: '选择视频素材类型', items: videoAssetTypes }];
  return [
    { title: '选择图片素材类型', items: imageAssetTypes },
    { title: '选择音频素材类型', items: audioAssetTypes },
    { title: '选择视频素材类型', items: videoAssetTypes },
  ];
}

export function buildGeneratedPatch(kind, asset) {
  const title = asset?.title || (kind === 'video' ? '视频素材' : kind === 'audio' ? '音频素材' : '图片素材');
  if (kind === 'video') {
    return { title, width: 300, height: 170, url: asset?.url, taskId: asset?.taskId, statusUrl: asset?.statusUrl, generationStatus: asset?.status, sceneClass: 'wb-scene-lantern', dur: asset?.duration || '02:16', duration: asset?.duration || '' };
  }
  if (kind === 'audio') {
    return { title, width: 230, height: 74, url: asset?.url, taskId: asset?.taskId, statusUrl: asset?.statusUrl, generationStatus: asset?.status, dur: asset?.duration || '01:00', duration: asset?.duration || '' };
  }
  return {
    title,
    width: asset?.width || 280,
    height: asset?.height || 158,
    url: asset?.url,
    taskId: asset?.taskId,
    statusUrl: asset?.statusUrl,
    generationStatus: asset?.status,
    prompt: asset?.prompt,
    assetCode: asset?.assetCode || asset?.code,
    imageSubtype: asset?.imageSubtype,
    raw: asset?.raw,
  };
}

export function getAssetIconFallback(kind) {
  if (kind === 'video') return Film;
  if (kind === 'audio') return Music;
  return Image;
}
