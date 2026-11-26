import { ArrowLeft, Download, Loader2, Pause, Play, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function GeneratorPageLayout({ title, children }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="wb-standard-page wb-standard-page--narrow">
      <header className="wb-library-header">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" data-wb-button="quiet" data-wb-icon aria-label={t('common.back')} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <h1>{title}</h1>
        </div>
      </header>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function GenerateButton({ busy, disabled, label, onClick }) {
  const { t } = useTranslation();
  const Icon = busy ? Loader2 : Wand2;

  return (
    <button type="button" data-wb-button="primary" className="w-full" aria-busy={busy} disabled={busy || disabled} onClick={onClick}>
      <Icon size={16} aria-hidden="true" className={busy ? 'animate-spin' : undefined} />
      {busy ? t('common.generating') : label}
    </button>
  );
}

export function GeneratedAudioActions({ playing, onPlay, onDownload }) {
  const { t } = useTranslation();
  const Icon = playing ? Pause : Play;

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" data-wb-button="secondary" className="flex-1" onClick={onPlay}>
        <Icon size={16} aria-hidden="true" />{t(playing ? 'voice.pause' : 'voice.play')}
      </button>
      <button type="button" data-wb-button="secondary" data-wb-icon aria-label={t('common.download')} title={t('common.download')} onClick={onDownload}>
        <Download size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
