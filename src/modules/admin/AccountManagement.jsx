import React, { useState } from 'react';
import { Users, Plus, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AccountManagement = () => {
  const { ROLE_NAMES } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // 模拟账号数据
  const [accounts, setAccounts] = useState([
    { id: 1, username: 'org1_admin', name: '机构1管理员', organizationId: 1, organizationName: '测试机构1', role: 'org_admin', createdAt: '2024-01-01' },
    { id: 2, username: 'org1_leader', name: '教研组长1', organizationId: 1, organizationName: '测试机构1', role: 'research_leader', createdAt: '2024-01-02' },
    { id: 3, username: 'org2_admin', name: '机构2管理员', organizationId: 2, organizationName: '测试机构2', role: 'org_admin', createdAt: '2024-01-05' },
  ]);

  // 模拟机构数据（用于创建账号时选择）
  const organizations = [
    { id: 1, name: '测试机构1' },
    { id: 2, name: '测试机构2' },
    { id: 3, name: '测试机构3' },
  ];

  const handleCreateAccount = () => {
    const orgId = prompt('请输入机构ID（1-3）：');
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
    }
  };

  const handleDeleteAccount = (accountId) => {
    if (window.confirm('确定要删除这个账号吗？')) {
      setAccounts(accounts.filter(a => a.id !== accountId));
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="搜索账号..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

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
    </div>
  );
};

