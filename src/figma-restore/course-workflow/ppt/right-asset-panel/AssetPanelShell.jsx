import { ArrowLeft, X } from 'lucide-react';

export function AssetPanelShell({ title, onBack, onClose, children, footer, className = '' }) {
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
      <div className="ppt-asset-scroll">{children}</div>
      {footer ? <div className="ppt-asset-footer">{footer}</div> : null}
    </aside>
  );
}
