import { CreateButton, LibrarySearch } from '../../components/LibraryControls';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { useNavigate } from 'react-router-dom';
import { Clock, UserPlus } from 'lucide-react';
import { Form, Input, InputNumber, Modal } from 'antd';
import apiService from '../../services/api';

export const OrganizationManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

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

  const openDialog = (organization = null) => {
    form.resetFields();
    if (organization?.total_hours != null) form.setFieldValue('totalHours', Number(organization.total_hours));
    setActionError('');
    setDialog(organization ? { organization } : {});
  };

  const handleSaveOrganization = async (values) => {
    if (!dialog || saving) return;
    setSaving(true);
    setActionError('');
    try {
      if (dialog.organization) {
        await apiService.updateOrganization(dialog.organization.id, { totalHours: values.totalHours });
      } else {
        await apiService.createOrganization({ name: values.name.trim(), code: values.code.trim() });
      }
      setDialog(null);
      await loadOrganizations();
    } catch (error) {
      setActionError(error.message || t('common.failed'));
    } finally {
      setSaving(false);
    }
  };

  const query = searchTerm.trim().toLowerCase();
  const filteredOrganizations = organizations.filter(org =>
    [org.name, org.code].some(value => String(value ?? '').toLowerCase().includes(query))
  );

  return (
    <div className="wb-standard-page">
      <header className="wb-library-header">
        <h1>{t('header.systemSettings')}</h1>
        <CreateButton onClick={() => openDialog()}>{t('org.createOrg')}</CreateButton>
      </header>
      <div className="wb-library-tools">
        <h2 className="wb-section-title">{t('org.listTitle')}</h2>
        <LibrarySearch label={t('org.searchPlaceholder')} value={searchTerm} onChange={setSearchTerm} />
      </div>

      {loading && <PageLoading />}
      {!loading && loadError && (
        <div role="alert" className="wb-library-empty">
          <p>{loadError}</p>
          <button type="button" data-wb-button="secondary" onClick={loadOrganizations}>{t('common.retry')}</button>
        </div>
      )}
      {!loading && !loadError && filteredOrganizations.length === 0 && (
        <div className="wb-library-empty">
          <p role="status">{t(query && organizations.length ? 'common.noSearchResults' : 'org.noOrganizations')}</p>
          {query && !!organizations.length && <button type="button" data-wb-button="secondary" onClick={() => setSearchTerm('')}>{t('common.clearSearch')}</button>}
        </div>
      )}
      <div className="wb-work-grid">
        {!loading && !loadError && filteredOrganizations.map(org => (
          <div
            key={org.id}
            className="wb-surface-panel flex flex-col"
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
            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                data-wb-button="secondary"
                onClick={() => openDialog(org)}
                className="flex-1"
              >
                <Clock size={16} aria-hidden="true" />
                {t('org.setHours')}
              </button>
              <button
                type="button"
                data-wb-button="secondary"
                onClick={() => navigate(`/accounts?organizationId=${encodeURIComponent(org.id)}`)}
                className="flex-1"
              >
                <UserPlus size={16} aria-hidden="true" />
                {t('org.addAccount')}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Modal
        title={t(dialog?.organization ? 'org.setHours' : 'org.createOrg')}
        open={!!dialog}
        onCancel={() => { if (!saving) setDialog(null); }}
        onOk={() => form.submit()}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleSaveOrganization}>
          {dialog?.organization ? (
            <Form.Item name="totalHours" label={t('org.totalHours')} rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          ) : (
            <>
              <Form.Item name="name" label={t('org.name')} rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
              <Form.Item name="code" label={t('org.orgCode')} rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
            </>
          )}
        </Form>
        {actionError && <p role="alert" className="text-error-active">{actionError}</p>}
      </Modal>
    </div>
  );
};
