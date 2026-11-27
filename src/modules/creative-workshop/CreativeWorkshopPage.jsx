import { CreateButton, MetadataTag } from '../../components/LibraryControls';
import React, { useEffect, useMemo, useState } from 'react';
import { DraftDialog } from './DraftDialog';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Gamepad2, MessageCircle, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WORKSHOP_MODULES, workStatusKey, workStatusTone } from './workshopData';
import { getCreativeWorks } from './workshopStorage';
import './creativeWorkshop.css';

const addedModulePaths = [
  { titleKey: 'sidebar.spinSpeak', descriptionKey: 'workshopPage.spinSpeakDescription', icon: MessageCircle, path: '/workshop/spin-speak' },
  { titleKey: 'sidebar.doodleGame', descriptionKey: 'workshopPage.doodleDescription', icon: Palette, path: '/workshop/doodle' },
  { titleKey: 'sidebar.moveMatch', descriptionKey: 'workshopPage.moveMatchDescription', icon: Gamepad2, path: '/workshop/move-match' },
];

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
                <button type="button" data-wb-button="secondary" onClick={() => setDraftSelection({ moduleKey, work })}>{t('pictureBook.continuePreparing')}</button>
                <div><MetadataTag tone={workStatusTone(work.status)}>{t(workStatusKey(work.status))}</MetadataTag></div>
              </article>
            ))}
          </div>
        ) : <p className="wb-library-empty" role="status">{t('myWorksUi.noWorks')}</p>}
      </section>

      {draftSelection?.moduleKey === moduleKey && <DraftDialog module={module} moduleId={moduleKey} activityType={draftSelection.activityType} work={draftSelection.work} onClose={() => setDraftSelection(null)} onCreated={reloadWorks} />}
    </div>
  );
};

export default CreativeWorkshopPage;
