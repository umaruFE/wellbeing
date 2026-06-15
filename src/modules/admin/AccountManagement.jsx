import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AccountManagement = () => {
  const { t } = useTranslation();
  const { ROLE_NAMES } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [accounts, setAccounts] = useState([
    { id: 1, username: 'org1_admin', name: 'Org 1 Admin', organizationId: 1, organizationName: 'Org 1', role: 'org_admin', createdAt: '2024-01-01' },
    { id: 2, username: 'org1_leader', name: 'Leader 1', organizationId: 1, organizationName: 'Org 1', role: 'research_leader', createdAt: '2024-01-02' },
    { id: 3, username: 'org2_admin', name: 'Org 2 Admin', organizationId: 2, organizationName: 'Org 2', role: 'org_admin', createdAt: '2024-01-05' },
  ]);

  const organizations = [
    { id: 1, name: 'Org 1' },
    { id: 2, name: 'Org 2' },
    { id: 3, name: 'Org 3' },
  ];

  const handleCreateAccount = () => {
    const orgId = prompt(t('account.promptOrgId'));
    const username = prompt(t('account.promptUsername'));
    const name = prompt(t('account.promptName'));
    const role = prompt(t('account.promptRole'));

    if (orgId && username && name && role) {
      const org = organizations.find(o => o.id === parseInt(orgId));
      const newAccount = {
        id: accounts.length + 1,
        username,
        name,
        organizationId: parseInt(orgId),
        organizationName: org?.name || t('account.unknownOrg'),
        role,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setAccounts([...accounts, newAccount]);
    }
  };

  const handleDeleteAccount = (accountId) => {
    if (window.confirm(t('account.confirmDelete'))) {
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-placeholder" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('account.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">{t('account.listTitle')}</h2>
        <button
          onClick={handleCreateAccount}
          className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info-active flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('account.createAccount')}
        </button>
      </div>

      <div className="bg-white rounded-xl border-2 border-stroke-light overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface border-b-2 border-stroke-light">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary-secondary">{t('account.username')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary-secondary">{t('account.name')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary-secondary">{t('account.organization')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary-secondary">{t('admin.role')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary-secondary">{t('course.createdAt')}</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-primary-secondary">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => (
              <tr key={account.id} className="border-b border-stroke-light hover:bg-warning-light">
                <td className="px-4 py-3 text-sm text-primary">{account.username}</td>
                <td className="px-4 py-3 text-sm text-primary-secondary">{account.name}</td>
                <td className="px-4 py-3 text-sm text-primary-secondary">{account.organizationName}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-info-light text-info-active rounded text-xs">
                    {ROLE_NAMES[account.role] || account.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-primary-muted">{account.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-error hover:text-error-active"
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
            <Users className="w-16 h-16 text-primary-placeholder mx-auto mb-4" />
            <p className="text-primary-muted">{t('account.noAccounts')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
