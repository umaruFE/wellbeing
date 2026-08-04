import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { OrganizationManagement } from './OrganizationManagement';

export const SuperAdminPage = () => {
  const { t } = useTranslation();
  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <div className="bg-white border-b-2 border-stroke-light px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-info" />
          <h1 className="text-2xl font-bold text-primary">{t('admin.title')}</h1>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden">
        <OrganizationManagement />
      </div>
    </div>
  );
};
