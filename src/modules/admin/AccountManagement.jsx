import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Trash2, Search } from 'lucide-react';
import { Form, Input, Modal, Select } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export const AccountManagement = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultOrganizationId = searchParams.get('organizationId');
  const { ROLE_NAMES } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [form] = Form.useForm();

  const loadAccounts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await apiService.getUsers();
      if (!Array.isArray(result.data)) throw new Error(t('account.loadFailed'));
      setAccounts(result.data.map((account) => ({
        id: account.id,
        username: account.email,
        name: account.name,
        organizationId: account.organization_id,
        organizationName: account.organization?.name || '未分配机构',
        role: account.role,
        createdAt: account.created_at ? new Date(account.created_at).toLocaleDateString('zh-CN') : '-',
      })));
    } catch (error) {
      console.error('load accounts failed:', error);
      setLoadError(error.message || t('account.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const openCreateAccount = async () => {
    form.resetFields();
    setFormError('');
    setFormOpen(true);
    setOrganizationOptions([]);
    setOrganizationLoading(true);
    try {
      const result = await apiService.getOrganizations();
      if (!Array.isArray(result.data)) throw new Error(t('account.loadOrganizationsFailed'));
      const options = result.data.map(({ id, name }) => ({ value: id, label: name }));
      setOrganizationOptions(options);
      if (options.some(({ value }) => value === defaultOrganizationId)) {
        form.setFieldValue('organizationId', defaultOrganizationId);
      }
    } catch (error) {
      setFormError(error.message || t('account.loadOrganizationsFailed'));
    } finally {
      setOrganizationLoading(false);
    }
  };

  useEffect(() => { if (defaultOrganizationId) void openCreateAccount(); }, [defaultOrganizationId]);

  const handleCreateAccount = async ({ email, name, role, organizationId }) => {
    setCreating(true);
    setFormError('');
    try {
      await apiService.createUser({ email, name, role, organizationId: organizationId || null });
      setFormOpen(false);
      await loadAccounts();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm(t('account.confirmDelete'))) {
      try {
        await apiService.request(`/api/users/${accountId}`, { method: 'DELETE' });
        setAccounts(accounts.filter(a => a.id !== accountId));
      } catch (error) {
        alert(error instanceof Error ? error.message : '删除失败');
      }
    }
  };

  const filteredAccounts = accounts.filter(account =>
    (account.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 min-w-0">
      <h1 className="mb-6 text-[28px] leading-tight font-bold text-[var(--wb-text)]">{t('header.userManage')}</h1>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--wb-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('account.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none min-h-11"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[var(--wb-text)]">{t('account.listTitle')}</h2>
        <button
          onClick={openCreateAccount}
          className="px-4 py-2 bg-[var(--wb-primary)] text-white rounded-[10px] hover:bg-[var(--wb-primary-hover)] flex items-center gap-2 transition-colors min-h-10 active:bg-[var(--wb-primary-active)]"
        >
          <Plus className="w-4 h-4" />
          {t('account.createAccount')}
        </button>
      </div>

      <p className="sm:hidden text-xs text-[var(--wb-muted)] mb-2">{t('account.scrollHint', '左右滑动查看完整信息')}</p>
      <div tabIndex={0} role="region" aria-label={t('account.listTitle')} className="bg-white rounded-[14px] border border-[var(--wb-border)] overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-[var(--wb-surface)] border-b border-[var(--wb-border)]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--wb-muted)]">{t('account.username')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--wb-muted)]">{t('account.name')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--wb-muted)]">{t('account.organization')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--wb-muted)]">{t('admin.role')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--wb-muted)]">{t('course.createdAt')}</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--wb-muted)]">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !loadError && filteredAccounts.map(account => (
              <tr key={account.id} className="border-b border-[var(--wb-border)] hover:bg-[var(--wb-selected)]">
                <td className="px-4 py-3 text-sm text-[var(--wb-text)]">{account.username}</td>
                <td className="px-4 py-3 text-sm text-[var(--wb-muted)]">{account.name}</td>
                <td className="px-4 py-3 text-sm text-[var(--wb-muted)]">{account.organizationName}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-[var(--wb-selected)] text-[var(--wb-primary-hover)] rounded text-xs">
                    {ROLE_NAMES[account.role] || account.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--wb-muted)]">{account.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-error hover:text-error-active min-h-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <PageLoading />}
        {!loading && loadError && (
          <div role="alert" className="text-center py-12">
            <p>{loadError}</p>
            <button type="button" className="wb-button" onClick={loadAccounts}>{t('common.retry')}</button>
          </div>
        )}
        {!loading && !loadError && filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-[var(--wb-muted)] mx-auto mb-4" />
            <p className="text-[var(--wb-muted)]">{t('account.noAccounts')}</p>
          </div>
        )}
      </div>
      <Modal
        title={t('account.createAccount')}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => form.submit()}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={creating}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAccount}>
          <Form.Item name="email" label={t('account.username')} rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
          <Form.Item name="name" label={t('account.name')} rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
          <Form.Item name="role" label={t('admin.role')} rules={[{ required: true }]}>
            <Select options={Object.entries(ROLE_NAMES).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="organizationId" label={t('account.organization')}>
            <Select allowClear options={organizationOptions} loading={organizationLoading} />
          </Form.Item>
        </Form>
        {formError && <p role="alert">{formError}</p>}
      </Modal>
    </div>
  );
};
