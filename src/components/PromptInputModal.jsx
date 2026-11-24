import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { LocalizedText } from '../i18n/LocalizedText.jsx';
import React, { useState } from 'react';
import { X, Type, Edit, Wand2, RectangleHorizontal, Upload, Image as ImageIcon, Clock, Music, Video, Plus, Trash2 } from 'lucide-react';
import PromptOptimizer from './PromptOptimizer';
import { VideoStoryboardModal } from './VideoStoryboardModal';

// description 为 promptInputUi 命名空间下的 i18n key
const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', width: 1920, height: 1080, description: 'landscapeWidescreen' },
  { id: '4:3', label: '4:3', width: 1024, height: 768, description: 'landscapeStandard' },
  { id: '1:1', label: '1:1', width: 1024, height: 1024, description: 'square' },
  { id: '3:4', label: '3:4', width: 768, height: 1024, description: 'portraitStandard' },
  { id: '9:16', label: '9:16', width: 1080, height: 1920, description: 'portraitTall' },
];

export const PromptInputModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = i18next.t('promptInputUi.defaultTitle'),
  description = i18next.t('promptInputUi.defaultDescription'),
  placeholder = i18next.t('promptInputUi.defaultPlaceholder'),
  initialContent = '',
  type = 'text',
  assetType = null,
  isLoading = false,
  userId = null,
  organizationId = null,
  onVideoConfirm = null
}) => {
  const [content, setContent] = useState(initialContent);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceImages, setReferenceImages] = useState([]); // 视频支持多张参考图
  const [lyrics, setLyrics] = useState('');
  const [audioDuration, setAudioDuration] = useState(30);
  const [audioStyle, setAudioStyle] = useState('');
  const { t } = useTranslation();

  // HeartMuLa 要求最小 10 秒
  const MIN_AUDIO_DURATION = 10;

  // HeartMuLa 音乐风格选项（label 复用 assetEditor 命名空间的风格文案）
  const AUDIO_STYLES = [
    { id: '', label: t('assetEditor.9741bc8c5f'), tags: '' },
    { id: 'pop', label: t('assetEditor.61d5ebf290'), tags: 'pop, catchy, upbeat' },
    { id: 'rnb', label: 'R&B', tags: 'R&B, smooth, soulful' },
    { id: 'rock', label: t('assetEditor.3a1544429a'), tags: 'rock, electric guitar, energetic' },
    { id: 'electronic', label: t('assetEditor.9e5a9d1f1d'), tags: 'electronic, synthesizer, modern' },
    { id: 'jazz', label: t('assetEditor.6728028cc8'), tags: 'jazz, improvisation, sophisticated' },
    { id: 'classical', label: t('assetEditor.106ec2422d'), tags: 'classical, orchestral, elegant' },
    { id: 'folk', label: t('assetEditor.4e4951a5c3'), tags: 'folk, acoustic, storytelling' },
    { id: 'cafe', label: t('assetEditor.eb40341bd8'), tags: 'cafe, warm, reflection, relaxed' },
    { id: 'piano', label: t('assetEditor.e11cedb864'), tags: 'piano, keyboard, melodic' },
    { id: 'guitar', label: t('assetEditor.4ae01ed99c'), tags: 'guitar, strings, acoustic' },
    { id: 'soft', label: t('assetEditor.b7e48ef10f'), tags: 'soft, gentle, calming' },
    { id: 'upbeat', label: t('assetEditor.0eaffd210a'), tags: 'upbeat, happy, energetic' },
    { id: 'emotional', label: t('assetEditor.a3ef720b90'), tags: 'emotional, heartfelt, moving' },
    { id: 'ambient', label: t('assetEditor.1830f0764b'), tags: 'ambient, atmospheric, ethereal' }
  ];

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
      setSelectedRatio(ASPECT_RATIOS[0]);
      setReferenceImage(null);
      setReferenceImages([]);
      setLyrics('');
      setAudioDuration(30);
      setAudioStyle('');
    }
  }, [isOpen, initialContent]);

  // 如果是视频类型，直接显示 VideoStoryboardModal
  if (assetType === 'video' && isOpen) {
    return (
      <VideoStoryboardModal
        isOpen={isOpen}
        onClose={onClose}
        initialDescription={initialContent}
        initialReferenceImages={[]}
        userId={userId}
        organizationId={organizationId}
        onConfirm={(videoData) => {
          if (onVideoConfirm) {
            onVideoConfirm(videoData);
          } else {
            // 如果没有提供 onVideoConfirm，调用默认的 onConfirm
            // 传递视频数据，但保持兼容性
            onConfirm(
              videoData.description || '',
              'ai',
              null,
              null,
              null,
              null,
              null,
              videoData.referenceImages || []
            );
          }
          onClose();
        }}
      />
    );
  }

  if (!isOpen) return null;

  const handleConfirm = () => {
    // 图片使用direct模式（不自动优化，但仍然会调用AI生成）
    // 视频和音频保持ai模式（需要AI辅助生成）
    const inputMode = (assetType === 'video' || assetType === 'audio') ? 'ai' : 'direct';
    const videoStyle = null;
    const imageSize = (assetType === 'image') ? { width: selectedRatio.width, height: selectedRatio.height } : null;
    const selectedStyle = AUDIO_STYLES.find(s => s.id === audioStyle);
    const audioConfig = assetType === 'audio' ? { 
      duration: audioDuration,
      style: selectedStyle?.tags || ''
    } : null;
    const videoReferenceImages = assetType === 'video' ? referenceImages : null;
    onConfirm(content, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig, videoReferenceImages);
    setContent('');
    setReferenceImage(null);
    setReferenceImages([]);
    setLyrics('');
    setAudioDuration(30);
    setAudioStyle('');
  };

  const handleClose = () => {
    setContent('');
    setReferenceImage(null);
    setReferenceImages([]);
    setLyrics('');
    onClose();
  };

  // 视频类型：上传多张参考图片
  const handleVideoReferenceUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 删除视频参考图片
  const handleRemoveVideoReferenceImage = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReferenceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[18px] shadow-[0_20px_64px_rgba(48,43,59,0.16)] w-full max-w-md">
        <div className="p-6 border-b border-[var(--wb-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--wb-primary)] p-2 rounded-lg text-white">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--wb-text)]">{title}</h3>
              <p className="text-xs text-[var(--wb-muted)]">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-[var(--wb-muted)] hover:text-[var(--wb-muted)] disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--wb-text)] mb-2 block"><LocalizedText id="musicStudio.contentLabel" /></label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full border border-[var(--wb-border)] rounded-[var(--wb-control-radius)] p-3 text-sm focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-primary)] outline-none resize-none h-32 transition-all"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[var(--wb-muted)]">
                {assetType === 'audio'
                  ? t('promptInputUi.audioHint')
                  : t('promptInputUi.textHint')}
              </p>
              {(type === 'image' || type === 'script' || type === 'activity' || type === 'ppt' ||
                assetType === 'image' || assetType === 'script' || assetType === 'activity' || assetType === 'ppt' ||
                assetType === 'audio') && (
                <button
                  onClick={() => setShowOptimizer(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs text-[var(--wb-primary)] hover:text-[var(--wb-primary)] disabled:opacity-50"
                >
                  <Wand2 className="w-3 h-3" />
                  <LocalizedText id="promptInputUi.779dd81c9d" />
                </button>
              )}
            </div>
          </div>

          {assetType === 'image' && (
            <div>
              <label className="text-sm font-medium text-[var(--wb-text)] mb-2 flex items-center gap-2">
                <LocalizedText id="ipCharacter.imageRatio" />
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio)}
                    disabled={isLoading}
                    className={`flex flex-col items-center justify-center p-2 rounded-[var(--wb-control-radius)] border transition-all ${
                      selectedRatio.id === ratio.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border border-[var(--wb-border)] hover:border-[var(--wb-selected-border)] text-dark hover:bg-[var(--wb-selected)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div 
                      className="bg-current rounded-sm mb-1"
                      style={{
                        width: ratio.id === '16:9' ? '32px' :
                               ratio.id === '4:3' ? '24px' :
                               ratio.id === '1:1' ? '20px' :
                               ratio.id === '3:4' ? '15px' : '12px',
                        height: ratio.id === '16:9' ? '18px' :
                                ratio.id === '4:3' ? '18px' :
                                ratio.id === '1:1' ? '20px' :
                                ratio.id === '3:4' ? '20px' : '21px'
                      }}
                    />
                    <span className="text-xs font-medium">{ratio.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--wb-muted)] mt-1">
                <LocalizedText id="lesson.selected" />{selectedRatio.label} ({selectedRatio.width}×{selectedRatio.height}) - {t(`promptInputUi.${selectedRatio.description}`)}
              </p>
            </div>
          )}

          {(assetType === 'image' || assetType === 'video') && (
            <div>
              <label className="text-sm font-medium text-[var(--wb-text)] mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <LocalizedText id="promptInputUi.dc33859347" />
              </label>
              {!referenceImage ? (
                <div className="border border-dashed border-[var(--wb-border)] rounded-xl p-4 flex flex-col items-center justify-center bg-surface hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] transition-all cursor-pointer relative group/upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleReferenceUpload}
                    disabled={isLoading}
                  />
                  <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover/upload:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-[var(--wb-muted)]" />
                  </div>
                  <span className="text-xs text-[var(--wb-muted)] font-medium"><LocalizedText id="promptInputUi.7f4eac35c3" /></span>
                  <span className="text-[10px] text-[var(--wb-muted)] mt-1"><LocalizedText id="promptInputUi.43be4c02af" /></span>
                </div>
              ) : (
                <div className="relative group/ref">
                  <img src={referenceImage} alt="Reference" className="w-full h-32 object-cover rounded-xl border border-[var(--wb-border)] opacity-90" />
                  <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors rounded"></div>
                  <button
                    onClick={() => setReferenceImage(null)}
                    disabled={isLoading}
                    className="absolute top-2 right-2 bg-white text-[var(--wb-muted)] hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover/ref:opacity-100 transition-opacity disabled:opacity-50"
                    title={i18next.t('promptInputUi.6c72b99216')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {assetType === 'audio' && (
            <>
              <div>
                <label className="text-sm font-medium text-[var(--wb-text)] mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <LocalizedText id="audioGenerator.style" />
                </label>
                <select
                  value={audioStyle}
                  onChange={(e) => setAudioStyle(e.target.value)}
                  className="min-h-11 w-full border border-[var(--wb-border)] rounded-[var(--wb-control-radius)] p-3 text-sm focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-primary)] outline-none bg-white transition-all"
                  disabled={isLoading}
                >
                  {AUDIO_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--wb-muted)] mt-1">
                  <LocalizedText id="promptInputUi.e544333be2" />
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--wb-text)] mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <LocalizedText id="promptInputUi.afeeda8e62" />
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="240"
                    step="10"
                    value={audioDuration}
                    onChange={(e) => setAudioDuration(Number(e.target.value))}
                    className="flex-1 h-2 bg-[#e5e3db] rounded-[var(--wb-control-radius)] appearance-none cursor-pointer accent-dark"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-[var(--wb-text)] min-w-[60px]">
                    {audioDuration} <LocalizedText id="videoWizard.eb6aaba1a1" />
                  </span>
                </div>
                <p className="text-xs text-[var(--wb-muted)] mt-1">
                  <LocalizedText id="promptInputUi.bbc79101b4" />
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--wb-text)] mb-2 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  <LocalizedText id="promptInputUi.c530a5f793" />
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder={i18next.t('promptInputUi.a6e06a0792')}
                  className="w-full border border-[var(--wb-border)] rounded-[var(--wb-control-radius)] p-3 text-sm focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-primary)] outline-none resize-none h-24 transition-all"
                  disabled={isLoading}
                />
                <p className="text-xs text-[var(--wb-muted)] mt-1">
                  <LocalizedText id="promptInputUi.3302e78670" />
                </p>
              </div>
            </>
          )}

          {assetType === 'video' && (
            <>
              <div>
                <label className="text-sm font-medium text-[var(--wb-text)] mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <LocalizedText id="promptInputUi.61d75fa446" />
                </label>
                <p className="text-xs text-[var(--wb-muted)] mb-2">
                  <LocalizedText id="promptInputUi.e95820cfce" />
                </p>
                <div className="space-y-2">
                  {referenceImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img} 
                        alt={t('promptInputUi.referenceIndex', { index: index + 1 })}
                        className="w-full h-20 object-cover rounded-xl border border-[var(--wb-border)]"
                      />
                      <button
                        onClick={() => handleRemoveVideoReferenceImage(index)}
                        disabled={isLoading}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center w-full h-20 border border-dashed border-[var(--wb-border)] rounded-xl cursor-pointer hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)] transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleVideoReferenceUpload}
                      disabled={isLoading}
                    />
                    <div className="flex flex-col items-center">
                      <Plus className="w-5 h-5 text-[var(--wb-muted)] mb-1" />
                      <span className="text-xs text-[var(--wb-muted)]"><LocalizedText id="promptInputUi.7f4eac35c3" /></span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-[var(--wb-selected)] border border-[var(--wb-selected-border)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-[var(--wb-primary)] mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-[var(--wb-primary)]"><LocalizedText id="promptInputUi.cc3b8d4221" /></h4>
                    <ol className="text-xs text-[var(--wb-primary)] mt-1 space-y-1 list-decimal list-inside">
                      <li><LocalizedText id="promptInputUi.3c0ba76d32" /></li>
                      <li><LocalizedText id="promptInputUi.80cd3fe66b" /></li>
                      <li><LocalizedText id="promptInputUi.bdacf1c776" /></li>
                      <li><LocalizedText id="promptInputUi.7f863710d1" /></li>
                      <li><LocalizedText id="promptInputUi.cf5963aba5" /></li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="min-h-10 flex-1 px-4 py-2 border border-[var(--wb-border)] rounded-[var(--wb-control-radius)] text-dark hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] disabled:opacity-50 transition-all font-medium"
            >
              <LocalizedText id="common.cancel" />
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (assetType === 'text' && !content.trim())}
              className="min-h-10 flex-1 px-4 py-2 bg-[var(--wb-primary)] text-white rounded-[var(--wb-control-radius)] hover:bg-[var(--wb-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <LocalizedText id="promptInputUi.dde1db5771" />
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <LocalizedText id="promptInputUi.f4f917cf1b" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showOptimizer && (
        <PromptOptimizer
          elementType={assetType || type}
          onOptimize={(optimizedPrompt) => {
            setContent(optimizedPrompt);
            setShowOptimizer(false);
          }}
          onClose={() => setShowOptimizer(false)}
        />
      )}
    </div>
  );
};
