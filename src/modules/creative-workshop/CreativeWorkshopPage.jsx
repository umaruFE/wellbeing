import { CreateButton, MetadataTag } from '../../components/LibraryControls';
import React, { useEffect, useId, useMemo, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Gamepad2, MessageCircle, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WORKSHOP_MODULES, workStatusKey, workStatusTone } from './workshopData';
import { createCreativeWork, getCreativeWorks } from './workshopStorage';
import './creativeWorkshop.css';

const addedModulePaths = [
  { titleKey: 'sidebar.spinSpeak', descriptionKey: 'workshopPage.spinSpeakDescription', icon: MessageCircle, path: '/workshop/spin-speak' },
  { titleKey: 'sidebar.doodleGame', descriptionKey: 'workshopPage.doodleDescription', icon: Palette, path: '/workshop/doodle' },
  { titleKey: 'sidebar.moveMatch', descriptionKey: 'workshopPage.moveMatchDescription', icon: Gamepad2, path: '/workshop/move-match' },
];

const DraftDialog = ({ module, moduleId, activityType, onClose, onCreated }) => {
  const { t } = useTranslation();
  const formId = useId();
  const title = activityType?.label || t(`workshopPage.modules.${moduleId}.title`);
  const [form, setForm] = useState({ title: '', goals: '', age: '7–10 岁', duration: '20 分钟', notes: '' });
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
      title={t(saved ? 'workshopPage.saved' : 'workshopPage.createModule', { title })}
      onCancel={onClose}
      closable={!submitting}
      maskClosable={!submitting}
      keyboard={!submitting}
      footer={saved ? (
        <Link to="/my-works" data-wb-button="primary">{t('workshopPage.viewWorks')} <ArrowRight size={16} aria-hidden="true" /></Link>
      ) : undefined}
      cancelText={t('common.cancel')}
      okText={t('workshopPage.createDraft')}
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

export const CreativeWorkshopPage = () => {
  const { t } = useTranslation();
  const { moduleId = 'english-plus' } = useParams();
  const moduleKey = WORKSHOP_MODULES[moduleId] ? moduleId : 'english-plus';
  const { user } = useAuth();
  const [draftSelection, setDraftSelection] = useState(null);
  const [works, setWorks] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const canOpen = user?.role !== 'picture_song_creator' || moduleId === 'english-plus';
  const module = useMemo(() => WORKSHOP_MODULES[moduleKey], [moduleKey]);
  const modulePaths = useMemo(() => {
    const paths = module.paths.map((path, index) => ({ ...path, translationKey: `workshopPage.modules.${moduleKey}.paths.${index}` }));
    if (moduleKey !== 'english-plus') return paths;
    const existingModuleOrder = ['/song-writing', '/workshop/music-star-quest', '/workshop/interactive-yoga'];
    // Keep the picture-book entry, then the six integrated modules in navigation order.
    paths.sort((left, right) => existingModuleOrder.indexOf(left.path) - existingModuleOrder.indexOf(right.path));
    return [...paths, ...addedModulePaths];
  }, [module, moduleKey]);
  const Icon = module.icon;
  const draftButton = t(moduleKey === 'teaching-materials' ? 'workshopPage.createDraft' : 'common.newActivity');
  const reloadWorks = () => setAttempt((value) => value + 1);
  const currentWorks = works?.moduleKey === moduleKey && works.attempt === attempt ? works : null;

  useEffect(() => {
    if (!canOpen) return undefined;
    let cancelled = false;
    getCreativeWorks(moduleKey).then(
      (data) => { if (!cancelled) setWorks({ moduleKey, attempt, data }); },
      (error) => { if (!cancelled) setWorks({ moduleKey, attempt, error }); },
    );
    return () => { cancelled = true; };
  }, [moduleKey, attempt, canOpen]);

  if (!canOpen) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="cw-page">
      <header className="cw-hero wb-library-header">
        <div className="cw-hero-copy">
          <h1><span className="cw-title-icon"><Icon size={20} aria-hidden="true" /></span>{t(`workshopPage.modules.${moduleKey}.title`)}</h1>
          <p>{t(`workshopPage.modules.${moduleKey}.description`)}</p>
        </div>
        <div className="cw-hero-actions">
          <CreateButton aria-haspopup="dialog" onClick={() => setDraftSelection({ moduleKey })}>{draftButton}</CreateButton>
        </div>
      </header>

      <section className="cw-section">
        <div className="cw-section-heading"><h2>{t('workshopPage.choose')}</h2></div>
        <div className="wb-work-grid">
          {modulePaths
            .filter((path) => path.path !== '/song-writing' || user?.role !== 'viewer')
            .map((path) => {
              const PathIcon = path.icon;
              const label = t(path.titleKey || `${path.translationKey}.title`);
              return (
                <article key={path.titleKey || path.title} className="cw-path-card">
                  <span className="cw-path-icon"><PathIcon size={22} aria-hidden="true" /></span>
                  <h3>{label}</h3><p>{t(path.descriptionKey || `${path.translationKey}.description`)}</p>
                  <div className="cw-path-action">
                    {path.path ? (
                      <Link to={path.path} data-wb-button="secondary">{t('common.openModule')} <ArrowRight size={16} aria-hidden="true" /></Link>
                    ) : (
                      <CreateButton aria-haspopup="dialog" onClick={() => setDraftSelection({ moduleKey, activityType: { label, title: path.title } })}>{draftButton}</CreateButton>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-section-heading"><h2>{t('sidebar.myWorks')}</h2></div>
        {!currentWorks ? (
          <PageLoading />
        ) : currentWorks.error ? (
          <div className="wb-library-empty" role="alert">
            <p>{currentWorks.error.message || t('workshopPage.loadWorksFailed')}</p>
            <button type="button" data-wb-button="primary" onClick={reloadWorks}>{t('common.retry')}</button>
          </div>
        ) : currentWorks.data.length ? (
          <div className="wb-work-grid">
            {currentWorks.data.map((work) => (
              <article className="cw-path-card" key={work.id}>
                <h3>{work.title}</h3>
                <div><MetadataTag tone={workStatusTone(work.status)}>{t(workStatusKey(work.status))}</MetadataTag></div>
              </article>
            ))}
          </div>
        ) : <p className="wb-library-empty" role="status">{t('myWorksUi.noWorks')}</p>}
      </section>

      {draftSelection?.moduleKey === moduleKey && <DraftDialog module={module} moduleId={moduleKey} activityType={draftSelection.activityType} onClose={() => setDraftSelection(null)} onCreated={reloadWorks} />}
    </div>
  );
};

export default CreativeWorkshopPage;
