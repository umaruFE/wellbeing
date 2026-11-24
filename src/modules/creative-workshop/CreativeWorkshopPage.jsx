import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Gamepad2, MessageCircle, Palette, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WORKSHOP_MODULES } from './workshopData';
import { createCreativeWork, getCreativeWorks } from './workshopStorage';
import './creativeWorkshop.css';

const addedModulePaths = [
  { titleKey: 'sidebar.spinSpeak', descriptionKey: 'workshopPage.spinSpeakDescription', icon: MessageCircle, path: '/workshop/spin-speak' },
  { titleKey: 'sidebar.doodleGame', descriptionKey: 'workshopPage.doodleDescription', icon: Palette, path: '/workshop/doodle' },
  { titleKey: 'sidebar.moveMatch', descriptionKey: 'workshopPage.moveMatchDescription', icon: Gamepad2, path: '/workshop/move-match' },
];

const GenerateDialog = ({ module, moduleId, onClose, onCreated }) => {
  const { t } = useTranslation();
  const moduleTitle = t(`workshopPage.modules.${moduleId}.title`);
  const navigate = useNavigate();
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
      await createCreativeWork({ moduleId, moduleName: module.title, title: form.title, parameters: form });
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
    <div className="cw-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="cw-dialog" role="dialog" aria-modal="true" aria-label={t('workshopPage.createModule', { title: moduleTitle })} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="cw-icon-button cw-dialog-close" onClick={onClose} aria-label={t('common.close')}><X size={18} /></button>
        {saved ? (
          <div className="cw-success">
            <span className="cw-success-icon"><Check size={30} /></span>
            <h2>{t('workshopPage.saved')}</h2>
            <p>{t('workshopPage.savedHint')}</p>
            <button type="button" className="cw-primary-button" onClick={() => navigate('/my-works')}>{t('workshopPage.viewWorks')} <ArrowRight size={16} /></button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <span className="cw-eyebrow">{t('workshopPage.sameStyle')}</span>
            <h2>{t('workshopPage.createModule', { title: moduleTitle })}</h2>
            <p className="cw-dialog-intro">{t('workshopPage.intro')}</p>
            <label>{t('workshopPage.workTitle')}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('workshopPage.titleExample', { title: moduleTitle })} /></label>
            <label>{t('workshopPage.goals')}<textarea required value={form.goals} onChange={(event) => setForm({ ...form, goals: event.target.value })} placeholder={t('workshopPage.goalsHint')} /></label>
            <div className="cw-form-grid">
              <label>{t('workshopPage.age')}<select value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })}>{['4–6 岁', '7–10 岁', '11–14 岁'].map((age, index) => <option key={age} value={age}>{t(`workshopPage.ageOption${index}`)}</option>)}</select></label>
              <label>{t('workshopPage.duration')}<select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}>{['10 分钟', '20 分钟', '40 分钟', '60 分钟'].map((duration, index) => <option key={duration} value={duration}>{t(`workshopPage.durationOption${index}`)}</option>)}</select></label>
            </div>
            <label>{t('workshopPage.notes')}<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={t('workshopPage.notesHint')} /></label>
            <div className="cw-dialog-actions">
              <button type="button" className="cw-secondary-button" onClick={onClose}>{t('common.cancel')}</button>
              <button type="submit" className="cw-primary-button" disabled={submitting}><Sparkles size={16} /> {t(submitting ? 'workshopPage.saving' : 'workshopPage.createDraft')}</button>
            </div>
            {error && <p className="cw-dialog-error" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export const CreativeWorkshopPage = () => {
  const { t } = useTranslation();
  const { moduleId = 'english-plus' } = useParams();
  const moduleKey = WORKSHOP_MODULES[moduleId] ? moduleId : 'english-plus';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
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

  if (works?.moduleKey !== moduleKey) {
    return <PageLoading layout="fill" />;
  }

  return (
    <div className="cw-page" style={{ '--cw-accent': 'var(--wb-primary)' }}>
      <section className="cw-hero">
        <div className="cw-hero-copy">
          <h1><span className="cw-title-icon"><Icon size={20} /></span>{t(`workshopPage.modules.${moduleKey}.title`)}</h1>
          <p>{t(`workshopPage.modules.${moduleKey}.description`)}</p>
        </div>
        <div className="cw-hero-actions">
          <button type="button" className="cw-primary-button" onClick={() => setShowGenerator(true)}><Sparkles size={17} /> {t('workshopPage.sameStyle')}</button>
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-section-heading"><div><span>{t('workshopPage.paths')}</span><h2>{t('workshopPage.choose')}</h2></div><p>{t('workshopPage.pathsHint')}</p></div>
        <div className="cw-path-grid">
          {modulePaths
            .filter((path) => path.path !== '/song-writing' || user?.role !== 'viewer')
            .map((path) => {
              const PathIcon = path.icon;
              return (
                <article key={path.titleKey || path.title} className="cw-path-card">
                  <span className="cw-path-icon"><PathIcon size={22} /></span>
                  <h3>{t(path.titleKey || `${path.translationKey}.title`)}</h3><p>{t(path.descriptionKey || `${path.translationKey}.description`)}</p>
                  {path.path ? (
                    <button type="button" onClick={() => navigate(path.path)}>{path.action ? t(`${path.translationKey}.action`) : t('workshopPage.enter')} <ArrowRight size={15} /></button>
                  ) : (
                    <button type="button" onClick={() => setShowGenerator(true)}>{t('workshopPage.sameStyle')} <ArrowRight size={15} /></button>
                  )}
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
          <div role="alert">
            <p>{currentWorks.error.message || t('workshopPage.loadWorksFailed')}</p>
            <button type="button" className="cw-secondary-button" onClick={reloadWorks}>{t('common.retry')}</button>
          </div>
        ) : currentWorks.data.length ? (
          <div className="cw-path-grid">
            {currentWorks.data.map((work) => (
              <article className="cw-path-card" key={work.id}>
                <h3>{work.title}</h3>
                <p>{t(work.status === 'done' ? 'myWorksUi.statusDone' : 'myWorksUi.statusDraft')}</p>
              </article>
            ))}
          </div>
        ) : <p>{t('myWorksUi.e645e9a18d')}</p>}
      </section>

      {showGenerator && <GenerateDialog key={moduleKey} module={module} moduleId={moduleKey} onClose={() => setShowGenerator(false)} onCreated={reloadWorks} />}
    </div>
  );
};

export default CreativeWorkshopPage;
