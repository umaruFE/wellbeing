import React from 'react';
import { Layers } from 'lucide-react';
import { TextbookManagement } from './TextbookManagement';

export const KnowledgeBasePage = () => {
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">知识库管理</h1>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden">
        <TextbookManagement />
      </div>
    </div>
  );
};
