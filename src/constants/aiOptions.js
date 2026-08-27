// TTS / 音乐生成共享选项（原散落在 VoiceGeneratorPage / AssetGeneratorModal /
// VideoGeneratorPage / AudioGeneratorPage 的重复副本，统一收敛到此）
// 注：PromptInputModal 的 HeartMuLa 音乐风格列表是另一套选项，未收编

/** TTS 音色（超集：含试听用 file 字段，不需要试听的页面忽略即可） */
export const VOICE_OPTIONS = [
  { id: '活力女声', name: '活力女声', file: '活力女声.flac', description: '充满活力的女性声音' },
  { id: '不羁男声', name: '不羁男声', file: '不羁男声.flac', description: '自由不羁的男性声音' },
  { id: '沉稳男声', name: '沉稳男声', file: '沉稳男声.flac', description: '沉稳有力的男性声音' },
  { id: '成熟女声', name: '成熟女声', file: '成熟女声.flac', description: '成熟优雅的女性声音' },
  { id: '聪明儿童男声', name: '聪明儿童男声', file: '聪明儿童男声.flac', description: '聪明伶俐的儿童男声' },
  { id: '淡雅女声', name: '淡雅女声', file: '淡雅女声.flac', description: '淡雅温柔的女性声音' },
  { id: '搞笑大爷', name: '搞笑大爷', file: '搞笑大爷.flac', description: '幽默风趣的老年男声' },
  { id: '可爱儿童男声', name: '可爱儿童男声', file: '可爱儿童男声.flac', description: '可爱活泼的儿童男声' },
  { id: '可爱儿童女声', name: '可爱儿童女声', file: '可爱儿童女声.flac', description: '可爱甜美的儿童女声' },
  { id: '老年女声', name: '老年女声', file: '老年女声.flac', description: '慈祥温和的老年女声' },
  { id: '少年男声', name: '少年男声', file: '少年男声.flac', description: '朝气蓬勃的少年男声' },
  { id: '甜美女声', name: '甜美女声', file: '甜美女声.flac', description: '甜美动听的女性声音' },
  { id: '温暖少女', name: '温暖少女', file: '温暖少女.flac', description: '温暖治愈的少女声音' },
  { id: '温润男声', name: '温润男声', file: '温润男声.flac', description: '温润如玉的男性声音' },
];

/** 语速 */
export const SPEED_OPTIONS = [
  { id: 0.8, label: '0.8x（慢）' },
  { id: 1.0, label: '1.0x（标准）' },
  { id: 1.2, label: '1.2x（较快）' },
  { id: 1.5, label: '1.5x（快）' },
];

/** TTS 情感（超集：8 种） */
export const EMOTION_OPTIONS = [
  { id: 'neutral', label: '中性', description: '平静自然的语气', emotion_prompt: '' },
  { id: 'cheerful', label: '愉快', description: '开心快乐的语气', emotion_prompt: '开心快乐的语气' },
  { id: 'sad', label: '悲伤', description: '低沉悲伤的语气', emotion_prompt: '低沉悲伤的语气' },
  { id: 'angry', label: '愤怒', description: '生气激动的语气', emotion_prompt: '生气激动的语气' },
  { id: 'fearful', label: '恐惧', description: '害怕紧张的语气', emotion_prompt: '害怕紧张的语气' },
  { id: 'excited', label: '兴奋', description: '激动兴奋的语气', emotion_prompt: '激动兴奋的语气' },
  { id: 'gentle', label: '温柔', description: '柔和温暖的语气', emotion_prompt: '柔和温暖的语气' },
  { id: 'serious', label: '严肃', description: '认真严肃的语气', emotion_prompt: '认真严肃的语气' },
];

/** 背景音乐情绪五选 */
export const AUDIO_STYLES = [
  { id: 'happy', name: '开心', tags: 'happy, cheerful, upbeat' },
  { id: 'sad', name: '悲伤', tags: 'sad, emotional, melancholic' },
  { id: 'calm', name: '平静', tags: 'calm, peaceful, relaxing' },
  { id: 'excited', name: '兴奋', tags: 'excited, energetic, dynamic' },
  { id: 'narration', name: '旁白', tags: 'narration, clear, storytelling' },
];
