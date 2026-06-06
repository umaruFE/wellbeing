import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';

export function AssetPanelShell({ title, onBack, onClose, children, footer, className = '' }) {
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
          <button type="button" className="ppt-asset-icon-btn" onClick={onBack} aria-label="返回" title="返回">
            <ArrowLeft size={15} />
          </button>
        ) : null}
        <div className="ppt-asset-title">{title}</div>
        <button type="button" className="ppt-asset-icon-btn" onClick={onClose} aria-label="关闭" title="关闭">
          <X size={15} />
        </button>
      </div>
      <div ref={scrollRef} className={`ppt-asset-scroll ${scrollable ? 'is-scrollable' : ''}`}>{children}</div>
      {footer ? <div className="ppt-asset-footer">{footer}</div> : null}
    </aside>
  );
}
