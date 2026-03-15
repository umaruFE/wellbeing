import React, { useState } from 'react';
import { Building2, Clock, Plus, Trash2, Search, UserPlus } from 'lucide-react';

export const OrganizationManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 模拟机构数据
  const [organizations, setOrganizations] = useState([
    { id: 1, name: '测试机构1', code: 'ORG001', accountCount: 5, totalHours: 1000, usedHours: 350, createdAt: '2024-01-01' },
    { id: 2, name: '测试机构2', code: 'ORG002', accountCount: 3, totalHours: 500, usedHours: 120, createdAt: '2024-01-05' },
    { id: 3, name: '测试机构3', code: 'ORG003', accountCount: 8, totalHours: 2000, usedHours: 800, createdAt: '2024-01-10' },
  ]);

  const handleCreateOrganization = () => {
    const name = prompt('请输入机构名称：');
    if (name) {
      const newOrg = {
        id: organizations.length + 1,
        name,
        code: `ORG${String(organizations.length + 1).padStart(3, '0')}`,
        accountCount: 0,
        totalHours: 0,
        usedHours: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setOrganizations([...organizations, newOrg]);
    }
  };

  const handleSetHours = (orgId) => {
    const hours = prompt('请输入总时长（小时）：');
    if (hours && !isNaN(hours)) {
      setOrganizations(organizations.map(o => 
        o.id === orgId ? { ...o, totalHours: parseInt(hours) } : o
      ));
    }
  };

  const handleDeleteOrganization = (orgId) => {
    if (window.confirm('确定要删除这个机构吗？这将删除该机构下的所有账号。')) {
      setOrganizations(organizations.filter(o => o.id !== orgId));
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索机构..."
            className="w-full pl-10 pr-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">机构列表</h2>
        <button
          onClick={handleCreateOrganization}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建机构
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrganizations.map(org => (
          <div
            key={org.id}
            className="bg-white rounded-xl border-2 border-[#e5e3db] p-5 hover:shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] hover:border-[#2d2d2d] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{org.name}</h3>
                <p className="text-sm text-slate-500 mt-1">机构代码: {org.code}</p>
              </div>
              <button
                onClick={() => handleDeleteOrganization(org.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">账号数量:</span>
                <span className="font-medium">{org.accountCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">总时长:</span>
                <span className="font-medium">{org.totalHours} 小时</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">已用时长:</span>
                <span className="font-medium">{org.usedHours} 小时</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">剩余时长:</span>
                <span className="font-medium text-green-600">{org.totalHours - org.usedHours} 小时</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSetHours(org.id)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors"
              >
                <Clock className="w-4 h-4" />
                设置时长
              </button>
              <button
                onClick={handleCreateOrganization}
                className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center gap-1 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                添加账号
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

