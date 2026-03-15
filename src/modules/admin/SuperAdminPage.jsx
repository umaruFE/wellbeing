import React from 'react';
import { Settings } from 'lucide-react';
import { OrganizationManagement } from './OrganizationManagement';

export const SuperAdminPage = () => {
  return (
    <div className="h-screen flex flex-col bg-[#fcfbf9]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#e5e3db] px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">超级管理端</h1>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden">
        <OrganizationManagement />
      </div>
    </div>
  );
};
