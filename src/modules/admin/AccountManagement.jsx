import { CreateButton, LibrarySearch, MetadataTag } from '../../components/LibraryControls';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Form, Input, Modal, Select, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export const AccountManagement = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultOrganizationId = searchParams.get('organizationId');
  const { ROLE_NAMES } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, modalContext] = Modal.useModal();
  const [notifications, notificationContext] = message.useMessage();

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

  const handleDeleteAccount = (account) => {
    modal.confirm({
      title: t('account.confirmDelete'),
      content: account.username,
      okText: t('common.delete'),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await apiService.request(`/api/users/${account.id}`, { method: 'DELETE' });
          setAccounts(current => current.filter(item => item.id !== account.id));
        } catch (error) {
          notifications.error(error.message || t('common.failed'));
          throw error;
        }
      },
    });
  };

  const query = searchTerm.trim().toLowerCase();
  const filteredAccounts = accounts.filter(account =>
    [account.username, account.name, account.organizationName].some(value => value?.toLowerCase().includes(query))
  );

  return (
    <div className="wb-standard-page">
      {modalContext}
      {notificationContext}
      <header className="wb-library-header">
        <h1>{t('header.userManage')}</h1>
        <CreateButton onClick={openCreateAccount}>{t('account.createAccount')}</CreateButton>
      </header>
      <div className="wb-library-tools">
        <h2 className="wb-section-title">{t('account.listTitle')}</h2>
        <LibrarySearch label={t('account.searchPlaceholder')} value={searchTerm} onChange={setSearchTerm} />
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
                  <MetadataTag>{ROLE_NAMES[account.role] || account.role}</MetadataTag>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--wb-muted)]">{account.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    data-wb-button="danger"
                    data-wb-icon
                    data-wb-size="sm"
                    aria-label={`${t('common.delete')} ${account.username}`}
                    onClick={() => handleDeleteAccount(account)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <PageLoading />}
        {!loading && loadError && (
          <div role="alert" className="wb-library-empty">
            <p>{loadError}</p>
            <button type="button" data-wb-button="secondary" onClick={loadAccounts}>{t('common.retry')}</button>
          </div>
        )}
        {!loading && !loadError && filteredAccounts.length === 0 && (
          <div className="wb-library-empty">
            <p role="status">{t(query && accounts.length ? 'common.noSearchResults' : 'account.noAccounts')}</p>
            {query && !!accounts.length && <button type="button" data-wb-button="secondary" onClick={() => setSearchTerm('')}>{t('common.clearSearch')}</button>}
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
        forceRender
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
