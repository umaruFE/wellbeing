import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { TextbookManagement } from './textbook/TextbookManagement';

export const KnowledgeBasePage = () => {
  const { t } = useTranslation();
  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <div className="bg-white border-b-2 border-stroke-light px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-dark" />
          <h1 className="text-2xl font-bold text-primary">{t('asset.title')}</h1>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden">
        <TextbookManagement />
      </div>
    </div>
  );
};
