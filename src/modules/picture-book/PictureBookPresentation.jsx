import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PictureBookPresentation({ pages, title, music, trigger, onExit }) {
  const { t } = useTranslation();
  const dialogRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const [index, setIndex] = React.useState(0);
  const [failedImage, setFailedImage] = React.useState('');
  const [musicError, setMusicError] = React.useState(false);
  const page = pages[index];

  React.useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const audio = audioRef.current;
    dialog.showModal();
    if (audio) {
      audio.volume = 0.35;
      audio.play().catch(() => { /* Manual playback remains available. */ });
    }
    return () => {
      audio?.pause();
      dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [trigger]);

  const turnPage = delta => setIndex(current => Math.max(0, Math.min(pages.length - 1, current + delta)));
  const handleKey = event => {
    if (event.target === audioRef.current || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    turnPage(event.key === 'ArrowLeft' ? -1 : 1);
  };
  const showImage = page.image && page.image !== failedImage;

  return (
    <dialog ref={dialogRef} className="pbv2-presentation" aria-labelledby="pbv2-teaching-title"
      onKeyDown={handleKey} onCancel={event => { event.preventDefault(); onExit(); }}>
      <header className="pbv2-presentation-header">
        <h2 id="pbv2-teaching-title">{title}</h2>
        <button type="button" data-wb-button="secondary" onClick={onExit}>
          <X size={16} aria-hidden="true" />{t('pictureBook.exitTeaching')}
        </button>
      </header>
      <figure className={`pbv2-presentation-page${showImage ? '' : ' text-only'}`}>
        {showImage && <img key={page.image} src={page.image} alt={t('pictureBook.pageNumber', { page: index + 1 })}
          onError={() => setFailedImage(page.image)} />}
        {page.image && !showImage && <div className="pbv2-presentation-unavailable">
          <span role="status">{t('pictureBook.illustrationUnavailable')}</span>
          <button type="button" data-wb-button="quiet" onClick={() => setFailedImage('')}>{t('common.retry')}</button>
        </div>}
        {page.text && <figcaption>{page.text}</figcaption>}
      </figure>
      <footer className="pbv2-presentation-footer">
        <div className="pbv2-presentation-pagination">
          <button type="button" data-wb-button="secondary" disabled={index === 0} onClick={() => turnPage(-1)} aria-label={t('pictureBook.previousPage')}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <span role="status" aria-live="polite" aria-atomic="true">{index + 1} / {pages.length}</span>
          <button type="button" data-wb-button="secondary" disabled={index === pages.length - 1} onClick={() => turnPage(1)} aria-label={t('pictureBook.nextPage')}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
        {music?.url && <div className="pbv2-presentation-music">
          <span>{musicError ? t('pictureBook.musicUnavailable') : music.name || t('pictureBook.bgmFallback')}</span>
          <audio ref={audioRef} src={music.url} controls loop aria-label={music.name || t('pictureBook.bgmFallback')}
            onError={() => setMusicError(true)} onCanPlay={() => setMusicError(false)} />
        </div>}
      </footer>
    </dialog>
  );
}
