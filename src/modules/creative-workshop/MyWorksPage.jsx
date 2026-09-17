import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, FileText, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { deleteCreativeWork, getCreativeWorks } from './workshopStorage';
import './creativeWorkshop.css';

const formatDate = (value) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const MyWorksPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    let cancelled = false;
    getCreativeWorks()
      .then((data) => { if (!cancelled) setWorks(data); })
      .catch((err) => { if (!cancelled) console.error('加载创作列表失败:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => ['all', ...new Set(works.map((work) => work.moduleName))], [works]);
  const filtered = works.filter((work) => (category === 'all' || work.moduleName === category) && `${work.title} ${work.moduleName}`.toLowerCase().includes(query.toLowerCase()));

  const remove = async (id) => {
    if (!window.confirm(t('myWorksUi.confirmDeleteDraft'))) return;
    try {
      await deleteCreativeWork(id);
      setWorks((prev) => prev.filter((work) => work.id !== id));
    } catch (err) {
      console.error('删除草稿失败:', err);
      window.alert(err.message || t('myWorksUi.deleteFailedRetry'));
    }
  };

  return (
    <div className="works-page">
      <header className="works-header"><div><span className="cw-eyebrow"><LocalizedText id="myWorksUi.55c57bbfa9" /></span><h1><FolderOpen size={28} /> <LocalizedText id="sidebar.myWorks" /></h1><p><LocalizedText id="myWorksUi.2e3e2e9a2a" /></p></div><button className="cw-primary-button" onClick={() => navigate('/workshop/english-plus')}><Plus size={17} /> <LocalizedText id="myWorksUi.2155290c5a" /></button></header>
      <div className="works-toolbar"><div className="works-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={i18next.t('myWorksUi.1c450446f3')} /></div><div className="works-categories">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item === 'all' ? t('common.all') : item}</button>)}</div></div>
      {loading ? (
        <div className="works-empty"><span><BookOpen size={36} /></span><h2><LocalizedText id="myWorksUi.1d08846f05" /></h2></div>
      ) : filtered.length ? (
        <div className="works-grid">{filtered.map((work) => <article className="work-card" key={work.id}><div className="work-card-top"><span><FileText size={19} /></span><em className={work.status === 'done' ? 'work-status-done' : ''}>{work.status === 'done' ? t('myWorksUi.statusDone') : t('myWorksUi.statusDraft')}</em></div><small>{work.moduleName}</small><h2>{work.title}</h2><p>{work.parameters?.goals || work.parameters?.notes || t('myWorksUi.pendingContent')}</p><footer><span><Clock size={13} /> {formatDate(work.createdAt)}</span><span className="work-buttons"><button aria-label={i18next.t('common.delete')} onClick={() => remove(work.id)}><Trash2 size={16} /></button></span></footer></article>)}</div>
      ) : (
        <div className="works-empty"><span><BookOpen size={36} /></span><h2><LocalizedText id="myWorksUi.e645e9a18d" /></h2><p><LocalizedText id="myWorksUi.ba71b49936" /></p><button className="cw-primary-button" onClick={() => navigate('/workshop/english-plus')}><LocalizedText id="myWorksUi.d997bd1f74" /></button></div>
      )}
    </div>
  );
};

export default MyWorksPage;

