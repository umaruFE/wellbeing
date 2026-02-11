import React, { useState } from 'react';
import { Building2, Users, Clock, Plus, Edit, Trash2, Search, Settings, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const SuperAdminPage = () => {
  const { hasRole, ROLE_NAMES } = useAuth();
  const [activeTab, setActiveTab] = useState('organizations'); // organizations, accounts, settings
  const [searchTerm, setSearchTerm] = useState('');

  // 模拟机构数据
  const [organizations, setOrganizations] = useState([
    { id: 1, name: '测试机构1', code: 'ORG001', accountCount: 5, totalHours: 1000, usedHours: 350, createdAt: '2024-01-01' },
    { id: 2, name: '测试机构2', code: 'ORG002', accountCount: 3, totalHours: 500, usedHours: 120, createdAt: '2024-01-05' },
    { id: 3, name: '测试机构3', code: 'ORG003', accountCount: 8, totalHours: 2000, usedHours: 800, createdAt: '2024-01-10' },
  ]);

  // 模拟账号数据
  const [accounts, setAccounts] = useState([
    { id: 1, username: 'org1_admin', name: '机构1管理员', organizationId: 1, organizationName: '测试机构1', role: 'org_admin', createdAt: '2024-01-01' },
    { id: 2, username: 'org1_leader', name: '教研组长1', organizationId: 1, organizationName: '测试机构1', role: 'research_leader', createdAt: '2024-01-02' },
    { id: 3, username: 'org2_admin', name: '机构2管理员', organizationId: 2, organizationName: '测试机构2', role: 'org_admin', createdAt: '2024-01-05' },
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

  const handleCreateAccount = () => {
    const orgId = prompt('请输入机构ID：');
    const username = prompt('请输入用户名：');
    const name = prompt('请输入姓名：');
    const role = prompt('请输入角色（org_admin/research_leader/creator/viewer）：');
    
    if (orgId && username && name && role) {
      const org = organizations.find(o => o.id === parseInt(orgId));
      const newAccount = {
        id: accounts.length + 1,
        username,
        name,
        organizationId: parseInt(orgId),
        organizationName: org?.name || '未知机构',
        role,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setAccounts([...accounts, newAccount]);
      if (org) {
        setOrganizations(organizations.map(o => 
          o.id === parseInt(orgId) ? { ...o, accountCount: o.accountCount + 1 } : o
        ));
      }
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
      setAccounts(accounts.filter(a => a.organizationId !== orgId));
    }
  };

  const handleDeleteAccount = (accountId) => {
    if (window.confirm('确定要删除这个账号吗？')) {
      const account = accounts.find(a => a.id === accountId);
      setAccounts(accounts.filter(a => a.id !== accountId));
      if (account) {
        setOrganizations(organizations.map(o => 
          o.id === account.organizationId ? { ...o, accountCount: Math.max(0, o.accountCount - 1) } : o
        ));
      }
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccounts = accounts.filter(account =>
    account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              超级管理端
            </h1>
            <p className="text-sm text-slate-500 mt-1">管理机构和账号</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'organizations'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            机构管理
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'accounts'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            账号管理
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'organizations' ? '搜索机构...' : '搜索账号...'}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {activeTab === 'organizations' && (
          <>
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
                  className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-lg transition-shadow"
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
                      onClick={handleCreateAccount}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center gap-1 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      添加账号
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'accounts' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">账号列表</h2>
              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                创建账号
              </button>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">用户名</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">姓名</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">所属机构</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">创建时间</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(account => (
                    <tr key={account.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-800">{account.username}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{account.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{account.organizationName}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {ROLE_NAMES[account.role] || account.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{account.createdAt}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAccounts.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">暂无账号</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

