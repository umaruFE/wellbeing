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

export function getImageAssetTypes(t) {
  return [
    { code: 'B1', title: t('assetPanel.b1Title'), desc: t('assetPanel.b1Desc'), tone: 'blue', icon: Sparkles },
    { code: 'B2', title: t('assetPanel.b2Title'), desc: t('assetPanel.b2Desc'), tone: 'purple', icon: LayoutTemplate },
    { code: 'B3', title: t('assetPanel.b3Title'), desc: t('assetPanel.b3Desc'), tone: 'coral', icon: FileText },
    { code: 'B4', title: t('assetPanel.b4Title'), desc: t('assetPanel.b4Desc'), tone: 'green', icon: BookOpen },
    { code: 'B5', title: t('assetPanel.b5Title'), desc: t('assetPanel.b5Desc'), tone: 'blue', icon: Activity },
    { code: 'B6', title: t('assetPanel.b6Title'), desc: t('assetPanel.b6Desc'), tone: 'coral', icon: Network },
    { code: 'B7', title: t('assetPanel.b7Title'), desc: t('assetPanel.b7Desc'), tone: 'pink', icon: Speech },
    { code: 'B8', title: t('assetPanel.b8Title'), desc: t('assetPanel.b8Desc'), tone: 'orange', icon: Map },
    { code: 'B9', title: t('assetPanel.b9Title'), desc: t('assetPanel.b9Desc'), tone: 'teal', icon: BookOpen },
    { code: 'B10', title: t('assetPanel.b10Title'), desc: t('assetPanel.b10Desc'), tone: 'lime', icon: Grid2X2 },
    { code: 'B11', title: t('assetPanel.b11Title'), desc: t('assetPanel.b11Desc'), tone: 'purple', icon: Dumbbell },
    { code: 'B13', title: t('assetPanel.b13Title'), desc: t('assetPanel.b13Desc'), tone: 'orange', icon: UsersRound },
  ];
}

export function getAudioAssetTypes(t) {
  return [
    { code: 'C1', title: t('assetPanel.c1Title'), desc: t('assetPanel.c1Desc'), tone: 'coral', icon: Smile },
    { code: 'C2', title: t('assetPanel.c2Title'), desc: t('assetPanel.c2Desc'), tone: 'purple', icon: Volume2 },
    { code: 'C3', title: t('assetPanel.c3Title'), desc: t('assetPanel.c3Desc'), tone: 'green', icon: Mic },
    { code: 'C4', title: t('assetPanel.c4Title'), desc: t('assetPanel.c4Desc'), tone: 'blue', icon: Speech },
    { code: 'C5', title: t('assetPanel.c5Title'), desc: t('assetPanel.c5Desc'), tone: 'purple', icon: Mic },
    { code: 'C6', title: t('assetPanel.c6Title'), desc: t('assetPanel.c6Desc'), tone: 'coral', icon: Wind },
  ];
}

export function getVideoAssetTypes(t) {
  return [
    { code: 'V1', title: t('assetPanel.v1Title'), desc: t('assetPanel.v1Desc'), tone: 'blue', icon: Dumbbell },
    { code: 'VM', title: t('assetPanel.vmTitle'), desc: t('assetPanel.vmDesc'), tone: 'purple', icon: Clapperboard },
    { code: 'V3', title: t('assetPanel.v3Title'), desc: t('assetPanel.v3Desc'), tone: 'coral', icon: Film, disabled: true },
  ];
}

export function getRatioOptions(t) {
  return [
    { value: '16:9', label: '16:9', desc: t('assetPanel.ratio169') },
    { value: '9:16', label: '9:16', desc: t('assetPanel.ratio916') },
    { value: '4:3', label: '4:3', desc: t('assetPanel.ratio43') },
    { value: '1:1', label: '1:1', desc: t('assetPanel.ratio11') },
    { value: 'A4', label: 'A4', desc: t('assetPanel.ratioA4') },
  ];
}

export function getStyleOptions(t) {
  return [
    { value: 'cartoon', label: t('assetPanel.styleCartoon') },
    { value: 'realistic', label: t('assetPanel.styleRealistic') },
    { value: 'watercolor', label: t('assetPanel.styleWatercolor') },
  ];
}

export function getImageSpecificFields(t) {
  return {
    B1: { prompt: t('assetPanel.fB1Prompt'), placeholder: t('assetPanel.fB1Placeholder'), note: t('assetPanel.fB1Note') },
    B2: { prompt: t('assetPanel.fB2Prompt'), placeholder: t('assetPanel.fB2Placeholder'), note: t('assetPanel.fB2Note') },
    B3: { prompt: t('assetPanel.fB3Prompt'), placeholder: t('assetPanel.fB3Placeholder'), note: t('assetPanel.fB3Note') },
    B4: { prompt: t('assetPanel.fB4Prompt'), placeholder: t('assetPanel.fB4Placeholder'), note: t('assetPanel.fB4Note') },
    B5: { prompt: t('assetPanel.fB5Prompt'), placeholder: t('assetPanel.fB5Placeholder'), note: t('assetPanel.fB5Note') },
    B6: { prompt: t('assetPanel.fB6Prompt'), placeholder: t('assetPanel.fB6Placeholder'), note: t('assetPanel.fB6Note') },
    B7: { prompt: t('assetPanel.fB7Prompt'), placeholder: t('assetPanel.fB7Placeholder'), note: t('assetPanel.fB7Note') },
    B8: { prompt: t('assetPanel.fB8Prompt'), placeholder: t('assetPanel.fB8Placeholder'), note: t('assetPanel.fB8Note') },
    B9: { prompt: t('assetPanel.fB9Prompt'), placeholder: t('assetPanel.fB9Placeholder'), note: t('assetPanel.fB9Note') },
    B10: { prompt: t('assetPanel.fB10Prompt'), placeholder: t('assetPanel.fB10Placeholder'), note: t('assetPanel.fB10Note') },
    B11: { prompt: t('assetPanel.fB11Prompt'), placeholder: t('assetPanel.fB11Placeholder'), note: t('assetPanel.fB11Note') },
    B13: { prompt: t('assetPanel.fB13Prompt'), placeholder: t('assetPanel.fB13Placeholder'), note: t('assetPanel.fB13Note') },
  };
}

export function getActivityThemes(t) {
  return [t('assetPanel.themeArt'), t('assetPanel.themeYoga'), t('assetPanel.themeFitness'), t('assetPanel.themeMusic'), t('assetPanel.themeGame'), t('assetPanel.themeShow'), t('assetPanel.themeCelebrate')];
}

export function getWhitespaceOptions(t) {
  return [t('assetPanel.wsTop'), t('assetPanel.wsBottom'), t('assetPanel.wsLeft'), t('assetPanel.wsRight')];
}

export function getChartOptions(t) {
  return [t('assetPanel.chartMindMap'), t('assetPanel.chartTable'), t('assetPanel.chartFishbone'), t('assetPanel.chartTree')];
}

export function getComicStyles(t) {
  return [t('assetPanel.comicCute'), t('assetPanel.comicAnime'), t('assetPanel.comicWestern')];
}

export const characterOptions = ['Poppy', 'Edi', 'Rolly', 'Milo', 'Ace'];

export function getActionOptions(t) {
  return [t('assetPanel.actStretch'), t('assetPanel.actJump'), t('assetPanel.actCrawl'), t('assetPanel.actBalance'), t('assetPanel.actWave'), t('assetPanel.actClap')];
}

export function getAudioConfig(t) {
  return {
    C1: {
      steps: [t('assetPanel.stepSelectEmotion'), t('assetPanel.stepSetDuration'), t('assetPanel.stepGenResult')],
      fields: [
        { type: 'chips', key: 'emotion', label: t('assetPanel.stepSelectEmotion'), options: [t('assetPanel.audioQuiet'), t('assetPanel.audioMysterious'), t('assetPanel.audioGentle'), t('assetPanel.audioLively')] },
        { type: 'chips', key: 'duration', label: t('assetPanel.stepSetDuration'), options: [t('assetPanel.audio30s'), t('assetPanel.audio1m'), t('assetPanel.audio2m')] },
      ],
    },
    C2: {
      steps: [t('assetPanel.stepActivityScene'), t('assetPanel.stepTempo'), t('assetPanel.stepGenResult')],
      fields: [
        { type: 'chips', key: 'activity', label: t('assetPanel.stepActivityScene'), options: [t('assetPanel.audioCompetition'), t('assetPanel.audioGame'), t('assetPanel.audioFitness'), t('assetPanel.audioMeditation')] },
        { type: 'chips', key: 'tempo', label: t('assetPanel.stepTempo'), options: [t('assetPanel.audioTempoFast'), t('assetPanel.audioTempoMid'), t('assetPanel.audioTempoStrong')] },
      ],
    },
    C3: {
      steps: [t('assetPanel.stepInputText'), t('assetPanel.stepSelectVoice'), t('assetPanel.stepGenResult')],
      fields: [
        { type: 'textarea', key: 'text', label: t('assetPanel.audioReadText'), placeholder: t('assetPanel.audioReadPlaceholder') },
        { type: 'chips', key: 'voice', label: t('assetPanel.stepSelectVoice'), options: [t('assetPanel.audioVoiceFemale'), t('assetPanel.audioVoiceMale'), t('assetPanel.audioVoiceChild')] },
        { type: 'chips', key: 'speed', label: t('assetPanel.stepTempo'), options: [t('assetPanel.audioSpeedSlow'), t('assetPanel.audioSpeedNormal'), t('assetPanel.audioSpeedFast')] },
      ],
    },
    C4: {
      steps: [t('assetPanel.stepDialogueSetup'), t('assetPanel.stepRoleVoice'), t('assetPanel.stepGenResult')],
      fields: [
        { type: 'textarea', key: 'dialogue', label: t('assetPanel.audioDialogueScript'), placeholder: t('assetPanel.audioDialoguePlaceholder') },
      ],
    },
    C5: {
      steps: [t('assetPanel.stepTopic'), t('assetPanel.stepLyrics'), t('assetPanel.stepMusicStyle'), t('assetPanel.stepGenResult')],
      fields: [
        { type: 'input', key: 'topic', label: t('assetPanel.audioSongTopic'), placeholder: t('assetPanel.audioSongPlaceholder') },
        { type: 'textarea', key: 'lyrics', label: t('assetPanel.audioLyrics'), placeholder: t('assetPanel.audioLyricsPlaceholder') },
        { type: 'chips', key: 'style', label: t('assetPanel.audioSongStyle'), options: [t('assetPanel.audioStyleKids'), t('assetPanel.audioStyleRhythm'), t('assetPanel.audioStyleChoir')] },
      ],
    },
    C6: {
      steps: [t('assetPanel.stepGuideTopic'), t('assetPanel.stepVoiceBg'), t('assetPanel.stepGenResult')],
      fields: [
        { type: 'input', key: 'topic', label: t('assetPanel.audioGuideTopic'), placeholder: t('assetPanel.audioGuidePlaceholder') },
        { type: 'chips', key: 'background', label: t('assetPanel.audioBgSound'), options: [t('assetPanel.audioBgForest'), t('assetPanel.audioBgOcean'), t('assetPanel.audioBgSoftMusic')] },
      ],
    },
  };
}

export function getVideoScenes(t) {
  return [t('assetPanel.videoSceneForest'), t('assetPanel.videoSceneBeach'), t('assetPanel.videoSceneOcean'), t('assetPanel.videoSceneFarm'), t('assetPanel.videoSceneSpace'), t('assetPanel.videoSceneSnow')];
}

export const videoCharacters = ['Poppy', 'Edi', 'Rolly', 'Milo', 'Ace'];

export function getVideoSteps(t) {
  return [t('assetPanel.stepSceneCharacter'), t('assetPanel.stepVocabSentence'), t('assetPanel.stepGenerate')];
}

export function getAssetGroups(type, t) {
  if (type === 'image') return [{ title: t('assetPanel.selectImageType'), items: getImageAssetTypes(t) }];
  if (type === 'audio') return [{ title: t('assetPanel.selectAudioType'), items: getAudioAssetTypes(t) }];
  if (type === 'video') return [{ title: t('assetPanel.selectVideoType'), items: getVideoAssetTypes(t) }];
  return [
    { title: t('assetPanel.selectImageType'), items: getImageAssetTypes(t) },
    { title: t('assetPanel.selectAudioType'), items: getAudioAssetTypes(t) },
    { title: t('assetPanel.selectVideoType'), items: getVideoAssetTypes(t) },
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
    items: asset?.items,
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
