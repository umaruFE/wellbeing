import React from 'react';
import { useTranslation } from 'react-i18next';
import { TextbookManagement } from './textbook/TextbookManagement';

export const KnowledgeBasePage = () => {
  const { t } = useTranslation();
  return (
    <div className="h-full min-h-0 flex flex-col bg-[var(--wb-page)]">
      <header className="wb-library-header border-b border-[var(--wb-border-soft)] px-4 sm:px-7 pt-7 pb-5 shrink-0">
        <h1>{t('sidebar.textbookLibrary')}</h1>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <TextbookManagement />
      </div>
    </div>
  );
};
