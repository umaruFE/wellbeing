import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  Layout,
  User
} from 'lucide-react';
import { TextbookManagement } from './TextbookManagement';
import { PptImageManagement } from './PptImageManagement';
import { IpCharacterManagement } from './IpCharacterManagement';

export const KnowledgeBasePage = () => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('textbook'); // textbook, ppt, ip

  // 二级菜单配置
  const subTabs = [
    { id: 'textbook', label: '教材课本', icon: BookOpen },
    { id: 'ppt', label: 'PPT风格图片', icon: Layout },
    { id: 'ip', label: 'IP人物', icon: User },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">知识库管理</h1>
        </div>
      </div>

      {/* 二级菜单 */}
      <div className="bg-white border-b border-slate-200 px-6 shrink-0">
        <div className="flex gap-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'textbook' && <TextbookManagement />}
        {activeSubTab === 'ppt' && <PptImageManagement />}
        {activeSubTab === 'ip' && <IpCharacterManagement />}
      </div>
    </div>
  );
};
