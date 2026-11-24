import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, Search, UserPlus } from 'lucide-react';
import apiService from '../../services/api';

export const OrganizationManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadOrganizations = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await apiService.getOrganizations();
      if (!Array.isArray(result.data)) throw new Error(t('org.loadFailed'));
      setOrganizations(result.data);
    } catch (error) {
      setLoadError(error.message || t('org.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOrganizations(); }, []);

  const handleCreateOrganization = async () => {
    const name = window.prompt(t('org.promptName'))?.trim();
    if (!name) return;
    const code = window.prompt(t('org.orgCode'))?.trim();
    if (!code) return;
    setActionError('');
    try {
      await apiService.createOrganization({ name, code });
      await loadOrganizations();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleSetHours = async (org) => {
    const value = window.prompt(t('org.promptHours'), String(org.total_hours ?? ''));
    if (!value?.trim()) return;
    const totalHours = Number(value);
    if (!Number.isFinite(totalHours) || totalHours < 0) return;
    setActionError('');
    try {
      await apiService.updateOrganization(org.id, { totalHours });
      await loadOrganizations();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    (org.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 min-w-0">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--wb-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('org.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none min-h-11"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[var(--wb-text)]">{t('org.listTitle')}</h2>
        <button
          onClick={handleCreateOrganization}
          className="px-4 py-2 bg-[var(--wb-primary)] text-white rounded-[10px] hover:bg-[var(--wb-primary-hover)] flex items-center gap-2 transition-colors min-h-10 active:bg-[var(--wb-primary-active)]"
        >
          <Plus className="w-4 h-4" />
          {t('org.createOrg')}
        </button>
      </div>

      {actionError && <p role="alert">{actionError}</p>}
      {loading && <PageLoading />}
      {!loading && loadError && (
        <div role="alert">
          <p>{loadError}</p>
          <button type="button" className="wb-button" onClick={loadOrganizations}>{t('common.retry')}</button>
        </div>
      )}
      {!loading && !loadError && filteredOrganizations.length === 0 && <p>{t('org.noOrganizations')}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && !loadError && filteredOrganizations.map(org => (
          <div
            key={org.id}
            className="bg-white rounded-[14px] border border-[var(--wb-border)] p-5 hover:shadow-[0_4px_18px_rgba(48,43,59,0.06)] hover:border-[var(--wb-selected-border)] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--wb-text)]">{org.name}</h3>
                <p className="text-sm text-[var(--wb-muted)] mt-1">{t('org.orgCode')}: {org.code}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-[var(--wb-muted)]">{t('org.accountCount')}</span>
                <span className="font-medium">{org.account_count ?? '—'}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-[var(--wb-muted)]">{t('org.totalHours')}</span>
                <span className="font-medium">{org.total_hours ?? '—'} {t('org.hours')}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-[var(--wb-muted)]">{t('org.usedHours')}</span>
                <span className="font-medium">{org.used_hours ?? '—'} {t('org.hours')}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-[var(--wb-muted)]">{t('org.remainingHours')}</span>
                <span className="font-medium text-success">{org.total_hours != null && org.used_hours != null ? org.total_hours - org.used_hours : '—'} {t('org.hours')}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSetHours(org)}
                className="flex-1 px-3 py-2 bg-[var(--wb-selected)] text-[var(--wb-primary)] rounded-[10px] hover:bg-[var(--wb-selected)] flex items-center justify-center gap-1 transition-colors min-h-10"
              >
                <Clock className="w-4 h-4" />
                {t('org.setHours')}
              </button>
              <button
                onClick={() => navigate(`/accounts?organizationId=${encodeURIComponent(org.id)}`)}
                className="flex-1 px-3 py-2 bg-success-light text-success rounded-[10px] hover:bg-success-light flex items-center justify-center gap-1 transition-colors min-h-10"
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
