import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, FileText, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { deleteCreativeWork, getCreativeWorks } from './workshopStorage';
import './creativeWorkshop.css';

const formatDate = (value) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const MyWorksPage = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState(() => getCreativeWorks());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => ['all', ...new Set(works.map((work) => work.moduleName))], [works]);
  const filtered = works.filter((work) => (category === 'all' || work.moduleName === category) && `${work.title} ${work.moduleName}`.toLowerCase().includes(query.toLowerCase()));

  const remove = (id) => {
    if (!window.confirm('确认删除这份创作草稿？')) return;
    deleteCreativeWork(id);
    setWorks(getCreativeWorks());
  };

  return (
    <div className="works-page">
      <header className="works-header"><div><span className="cw-eyebrow">内容管理</span><h1><FolderOpen size={28} /> 我的作品</h1><p>集中查看、继续编辑和管理自己创建的课程、活动与素材。</p></div><button className="cw-primary-button" onClick={() => navigate('/workshop/english-plus')}><Plus size={17} /> 开始新创作</button></header>
      <div className="works-toolbar"><div className="works-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索作品" /></div><div className="works-categories">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item === 'all' ? '全部' : item}</button>)}</div></div>
      {filtered.length ? (
        <div className="works-grid">{filtered.map((work) => <article className="work-card" key={work.id}><div className="work-card-top"><span><FileText size={19} /></span><em>草稿</em></div><small>{work.moduleName}</small><h2>{work.title}</h2><p>{work.parameters?.goals || work.parameters?.notes || '等待继续完善创作内容'}</p><footer><span><Clock size={13} /> {formatDate(work.createdAt)}</span><button aria-label="删除" onClick={() => remove(work.id)}><Trash2 size={16} /></button></footer></article>)}</div>
      ) : (
        <div className="works-empty"><span><BookOpen size={36} /></span><h2>还没有符合条件的作品</h2><p>从创作工坊选择一种内容，输入参数生成你的第一份草稿。</p><button className="cw-primary-button" onClick={() => navigate('/workshop/english-plus')}>进入创作工坊</button></div>
      )}
    </div>
  );
};

export default MyWorksPage;

