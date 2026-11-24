import { useTranslation } from 'react-i18next';

export function PageLoading({ label, layout = 'section' }) {
  const { t } = useTranslation();

  return (
    <div className={`page-loading page-loading--${layout}`} role="status">
      <div className="page-loading__card">
        <div className="page-loading__orbit" aria-hidden="true">
          <span className="page-loading__paper page-loading__paper--front" />
          <span className="page-loading__paper page-loading__paper--back" />
          <span className="page-loading__pencil" />
          <span className="page-loading__spark page-loading__spark--top" />
          <span className="page-loading__spark page-loading__spark--bottom" />
        </div>
        <div className="page-loading__copy">
          <strong>{label || t('common.pageLoading')}</strong>
          <span className="page-loading__dots" aria-hidden="true"><i /><i /><i /></span>
        </div>
      </div>
    </div>
  );
}
