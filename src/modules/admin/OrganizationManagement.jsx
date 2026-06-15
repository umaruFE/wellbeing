import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Clock, Plus, Trash2, Search, UserPlus } from 'lucide-react';

export const OrganizationManagement = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const [organizations, setOrganizations] = useState([
    { id: 1, name: 'Org 1', code: 'ORG001', accountCount: 5, totalHours: 1000, usedHours: 350, createdAt: '2024-01-01' },
    { id: 2, name: 'Org 2', code: 'ORG002', accountCount: 3, totalHours: 500, usedHours: 120, createdAt: '2024-01-05' },
    { id: 3, name: 'Org 3', code: 'ORG003', accountCount: 8, totalHours: 2000, usedHours: 800, createdAt: '2024-01-10' },
  ]);

  const handleCreateOrganization = () => {
    const name = prompt(t('org.promptName'));
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
    const hours = prompt(t('org.promptHours'));
    if (hours && !isNaN(hours)) {
      setOrganizations(organizations.map(o =>
        o.id === orgId ? { ...o, totalHours: parseInt(hours) } : o
      ));
    }
  };

  const handleDeleteOrganization = (orgId) => {
    if (window.confirm(t('org.confirmDelete'))) {
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-placeholder" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('org.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">{t('org.listTitle')}</h2>
        <button
          onClick={handleCreateOrganization}
          className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info-active flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('org.createOrg')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrganizations.map(org => (
          <div
            key={org.id}
            className="bg-white rounded-xl border-2 border-stroke-light p-5 hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:border-primary transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-primary">{org.name}</h3>
                <p className="text-sm text-primary-muted mt-1">{t('org.orgCode')}: {org.code}</p>
              </div>
              <button
                onClick={() => handleDeleteOrganization(org.id)}
                className="text-error hover:text-error-active"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary-secondary">{t('org.accountCount')}</span>
                <span className="font-medium">{org.accountCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary-secondary">{t('org.totalHours')}</span>
                <span className="font-medium">{org.totalHours} {t('org.hours')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary-secondary">{t('org.usedHours')}</span>
                <span className="font-medium">{org.usedHours} {t('org.hours')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary-secondary">{t('org.remainingHours')}</span>
                <span className="font-medium text-success">{org.totalHours - org.usedHours} {t('org.hours')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSetHours(org.id)}
                className="flex-1 px-3 py-2 bg-info-light text-info rounded-lg hover:bg-info-light flex items-center justify-center gap-1 transition-colors"
              >
                <Clock className="w-4 h-4" />
                {t('org.setHours')}
              </button>
              <button
                onClick={handleCreateOrganization}
                className="flex-1 px-3 py-2 bg-success-light text-success rounded-lg hover:bg-success-light flex items-center justify-center gap-1 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {t('org.addAccount')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
