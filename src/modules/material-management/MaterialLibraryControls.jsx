import React from 'react';
import { useTranslation } from 'react-i18next';

export function MaterialLibraryFeedback({ error, onRetry, filtered, onReset, empty }) {
  const { t } = useTranslation();
  const copy = error || (filtered ? t('common.noSearchResults') : empty);
  const action = error ? onRetry : filtered ? onReset : undefined;
  return (
    <div className="wb-library-empty">
      <p role={error ? 'alert' : 'status'}>{copy}</p>
      {action && (
        <button type="button" data-wb-button="secondary" onClick={action}>
          {t(error ? 'common.retry' : 'common.clearFilters')}
        </button>
      )}
    </div>
  );
}
