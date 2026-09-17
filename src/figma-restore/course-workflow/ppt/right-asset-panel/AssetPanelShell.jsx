import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, X } from 'lucide-react';

export function AssetPanelShell({ title, onBack, onClose, children, footer, className = '' }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;

    const updateScrollable = () => {
      setScrollable(element.scrollHeight > element.clientHeight + 1);
    };

    updateScrollable();
    const observer = new ResizeObserver(updateScrollable);
    observer.observe(element);
    Array.from(element.children).forEach((child) => observer.observe(child));
    window.addEventListener('resize', updateScrollable);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScrollable);
    };
  }, [children]);

  return (
    <aside className={`ppt-right ppt-asset-panel ${className}`}>
      <div className="ppt-asset-head">
        {onBack ? (
          <button type="button" className="ppt-asset-icon-btn" onClick={onBack} aria-label={t('common.back')} title={t('common.back')}>
            <ArrowLeft size={15} />
          </button>
        ) : null}
        <div className="ppt-asset-title">{title}</div>
        <button type="button" className="ppt-asset-icon-btn" onClick={onClose} aria-label={t('common.close')} title={t('common.close')}>
          <X size={15} />
        </button>
      </div>
      <div ref={scrollRef} className={`ppt-asset-scroll ${scrollable ? 'is-scrollable' : ''}`}>{children}</div>
      {footer ? <div className="ppt-asset-footer">{footer}</div> : null}
    </aside>
  );
}
