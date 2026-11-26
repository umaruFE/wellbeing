import { FilterChip, LibrarySearch, MetadataTag } from '../../components/LibraryControls';
import { useTranslation } from 'react-i18next';
import { Modal } from 'antd';
import { PageLoading } from '../../components/PageLoading';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, FileText, FolderOpen, Trash2 } from 'lucide-react';
import { deleteCreativeWork, getCreativeWorks } from './workshopStorage';
import { workStatusKey, workStatusTone } from './workshopData';
import './creativeWorkshop.css';

export const MyWorksPage = () => {
  const { t, i18n } = useTranslation();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [deleteWork, setDeleteWork] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const searchInput = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getCreativeWorks()
      .then((data) => { if (!cancelled) setWorks(data); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  const categories = ['all', ...new Set(works.map((work) => work.moduleName).filter(Boolean))];
  const activeCategory = categories.includes(category) ? category : 'all';
  const keyword = query.trim().toLowerCase();
  const filtered = works.filter((work) => (activeCategory === 'all' || work.moduleName === activeCategory)
    && [work.title, work.moduleName].join(' ').toLowerCase().includes(keyword));
  const locale = i18n.resolvedLanguage || i18n.language;
  const formatDate = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }), [locale]);

  const clearSearch = () => {
    setQuery('');
    setCategory('all');
    searchInput.current?.focus();
  };

  const remove = async () => {
    if (!deleteWork || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteCreativeWork(deleteWork.id);
      setWorks((prev) => prev.filter((work) => work.id !== deleteWork.id));
      setDeleteWork(null);
    } catch (err) {
      setDeleteError(err.message || t('myWorksUi.deleteFailedRetry'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="works-page">
      <header className="works-header wb-library-header">
        <h1><span className="cw-title-icon"><FolderOpen size={20} aria-hidden="true" /></span>{t('sidebar.myWorks')}</h1>
        <Link to="/workshop/english-plus" data-wb-button="primary">
          {t('myWorksUi.d997bd1f74')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>
      <div className="works-toolbar wb-library-tools">
        <div className="works-categories" role="group" aria-label={t('myWorksUi.filterByModule')}>
          {categories.map((item) => (
            <FilterChip key={item} selected={activeCategory === item} onClick={() => setCategory(item)}>
              {item === 'all' ? t('common.all') : item}
            </FilterChip>
          ))}
        </div>
        <LibrarySearch label={t('myWorksUi.1c450446f3')} value={query} onChange={setQuery} inputRef={searchInput} />
      </div>
      {loading ? (
        <PageLoading />
      ) : loadError ? (
        <div className="wb-library-empty" role="alert">
          <p>{loadError}</p>
          <button type="button" data-wb-button="primary" onClick={() => { setLoadError(''); setLoading(true); setAttempt((value) => value + 1); }}>{t('common.retry')}</button>
        </div>
      ) : filtered.length ? (
        <div className="works-grid wb-work-grid">
          {filtered.map((work) => {
            const created = work.createdAt ? new Date(work.createdAt) : null;
            return (
              <article className="work-card" key={work.id}>
                <div className="work-card-top">
                  <span className="work-type-icon"><FileText size={20} aria-hidden="true" /></span>
                  <MetadataTag tone={workStatusTone(work.status)}>{t(workStatusKey(work.status))}</MetadataTag>
                </div>
                <small>{work.moduleName}</small>
                <h2>{work.title}</h2>
                <p>{work.parameters?.goals || work.parameters?.notes || t('myWorksUi.pendingContent')}</p>
                <footer>
                  <span>{created && !Number.isNaN(created.getTime()) && <><Clock size={14} aria-hidden="true" /><time dateTime={created.toISOString()}>{formatDate.format(created)}</time></>}</span>
                  <button type="button" data-wb-button="danger" data-wb-size="sm" data-wb-icon aria-haspopup="dialog" aria-label={`${t('common.delete')} ${work.title}`} onClick={() => { setDeleteError(''); setDeleteWork(work); }}><Trash2 size={16} aria-hidden="true" /></button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="wb-library-empty">
          <p role="status">{t(works.length ? 'myWorksUi.noMatchingWorks' : 'myWorksUi.noWorks')}</p>
          {works.length > 0 && <button type="button" data-wb-button="secondary" onClick={clearSearch}>{t(activeCategory === 'all' ? 'common.clearSearch' : 'common.clearFilters')}</button>}
        </div>
      )}
      <Modal
        open={Boolean(deleteWork)}
        title={t('myWorksUi.deleteWorkTitle')}
        centered
        okText={t('imageLib.confirmDeleteBtn')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        onOk={remove}
        onCancel={() => setDeleteWork(null)}
        closable={!deleting}
        maskClosable={!deleting}
        keyboard={!deleting}
        cancelButtonProps={{ disabled: deleting }}
        confirmLoading={deleting}
      >
        <p>{t('myWorksUi.confirmDeleteWork', { title: deleteWork?.title || '' })}</p>
        {deleteError && <p className="cw-dialog-error" role="alert">{deleteError}</p>}
      </Modal>
    </div>
  );
};

export default MyWorksPage;

