import React, { useId, useState } from 'react';
import { Modal } from 'antd';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createCreativeWork, updateCreativeWork } from './workshopStorage';

export const DraftDialog = ({ module, moduleId, activityType, work, onClose, onCreated }) => {
  const { t } = useTranslation();
  const formId = useId();
  const title = activityType?.label || t(`workshopPage.modules.${moduleId}.title`);
  const [form, setForm] = useState(() => ({ goals: '', age: '7–10 岁', duration: '20 分钟', notes: '', ...work?.parameters, title: work?.title || '' }));
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const parameters = activityType ? { ...form, activityType: activityType.title } : form;
      if (work) {
        const changed = await updateCreativeWork(work.id, { title: form.title, parameters, expectedUpdatedAt: work.updatedAt });
        onCreated({ ...work, title: changed.title, parameters: changed.parameters, updatedAt: changed.updated_at });
        onClose();
        return;
      }
      await createCreativeWork({ moduleId, moduleName: module.title, title: form.title, parameters });
      onCreated();
      setSaved(true);
    } catch (err) {
      console.error('保存草稿失败:', err);
      setError(err.message || t('workshopPage.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      centered
      open
      title={work ? t('common.edit') : t(saved ? 'workshopPage.saved' : 'workshopPage.createModule', { title })}
      onCancel={onClose}
      closable={!submitting}
      maskClosable={!submitting}
      keyboard={!submitting}
      footer={saved ? (
        <Link to="/my-works" data-wb-button="primary">{t('workshopPage.viewWorks')} <ArrowRight size={16} aria-hidden="true" /></Link>
      ) : undefined}
      cancelText={t('common.cancel')}
      okText={t(work ? 'common.save' : 'workshopPage.createDraft')}
      cancelButtonProps={{ disabled: submitting }}
      okButtonProps={{ htmlType: 'submit', form: formId }}
      confirmLoading={submitting}
    >
      {saved ? (
        <p role="status">{t('workshopPage.savedHint')}</p>
      ) : (
        <form id={formId} className="cw-draft-form" aria-busy={submitting} onSubmit={submit}>
          <label>{t('workshopPage.workTitle')}<input data-wb-field required disabled={submitting} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('workshopPage.titleExample', { title })} /></label>
          <label>{t('workshopPage.goals')}<textarea data-wb-field required disabled={submitting} value={form.goals} onChange={(event) => setForm({ ...form, goals: event.target.value })} placeholder={t('workshopPage.goalsHint')} /></label>
          <div className="cw-form-grid">
            <label>{t('workshopPage.age')}<select data-wb-field disabled={submitting} value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })}>{['4–6 岁', '7–10 岁', '11–14 岁'].map((age, index) => <option key={age} value={age}>{t(`workshopPage.ageOption${index}`)}</option>)}</select></label>
            <label>{t('workshopPage.duration')}<select data-wb-field disabled={submitting} value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}>{['10 分钟', '20 分钟', '40 分钟', '60 分钟'].map((duration, index) => <option key={duration} value={duration}>{t(`workshopPage.durationOption${index}`)}</option>)}</select></label>
          </div>
          <label>{t('workshopPage.notes')}<textarea data-wb-field disabled={submitting} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={t('workshopPage.notesHint')} /></label>
          {error && <p className="cw-dialog-error" role="alert">{error}</p>}
        </form>
      )}
    </Modal>
  );
};
