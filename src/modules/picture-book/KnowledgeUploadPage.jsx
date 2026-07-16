import React from 'react';
import { AlertCircle, CheckCircle2, Database, FileText, Trash2, UploadCloud, X, Search, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const categoryOptions = [
  '情绪表达', '自我认知', '人际关系', '家庭与归属', '成长与变化',
  '感恩与善意', '身体与感知', '自然探索', '动物与生命', '勇气与冒险',
  '儿童心理', '睡前故事', '社交技能', '安全教育', '科学科普', '艺术创意',
];

const sourceTypeLabel = {
  docx: 'DOCX',
  pdf: 'PDF',
  txt: 'TXT',
  text: '文本',
};

export const KnowledgeUploadPage = () => {
  const { user } = useAuth();
  const [list, setList] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [searchText, setSearchText] = React.useState('');

  // upload modal state
  const [showModal, setShowModal] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState(categoryOptions[0]);
  const [ageRange, setAgeRange] = React.useState('');
  const [text, setText] = React.useState('');
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');

  const selectedName = file?.name || '';
  const canSubmit = status !== 'uploading' && (file || text.trim()) && title.trim();

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (searchText.trim()) params.set('search', searchText.trim());
      params.set('pageSize', '200');
      const res = await fetch(`/api/rag/knowledge?${params}`);
      const data = await res.json();
      if (data.success) {
        setList(data.data || []);
        setTotal(data.total || 0);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('fetch knowledge list failed:', err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, searchText]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async (id, docTitle) => {
    if (!window.confirm(`确定删除「${docTitle}」吗？此操作会同时删除 Qdrant 中的向量数据。`)) return;
    try {
      const res = await fetch(`/api/rag/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchList();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setText('');
    setCategory(categoryOptions[0]);
    setAgeRange('');
    setStatus('idle');
    setMessage('');
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    if (nextFile) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('uploading');
    setMessage('正在上传并写入知识库...');

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (text.trim()) formData.append('text', text.trim());
      formData.append('userId', String(user?.id || user?.userId || 'anonymous'));
      formData.append('uploaderName', String(user?.name || user?.username || ''));
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('ageRange', ageRange.trim());
      formData.append('visibility', 'private');
      formData.append('sourceType', file ? file.name.split('.').pop().toLowerCase() : 'text');

      const response = await fetch('/api/rag/upload-knowledge', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || '上传失败');
      }

      setStatus('success');
      setMessage(`上传成功！共 ${data.chunkCount || 0} 个切片已写入知识库。`);
      // 立即刷新列表，1.5秒后关闭弹窗
      fetchList();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || '上传失败');
    }
  };

  const grouped = React.useMemo(() => {
    if (filterCategory !== 'all') return { [filterCategory]: list };
    const map = {};
    for (const item of list) {
      const cat = item.category || 'general';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [list, filterCategory]);

  return (
    <div className="min-h-full bg-[#f3f2ed] p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary-muted text-sm font-semibold">
              <Database className="w-4 h-4" />
              绘本 RAG
            </div>
            <h1 className="text-2xl font-bold text-primary mt-1">绘本知识库</h1>
            <p className="text-sm text-primary-muted mt-1">共 {total} 份资料，上传后可用于绘本生成时的参考检索</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="h-11 px-5 rounded-lg bg-brand text-white font-bold border-2 border-brand-active hover:bg-brand-hover transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            上传资料
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-muted" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-10 w-64 rounded-lg border-2 border-stroke-light pl-9 pr-3 text-sm outline-none focus:border-primary bg-white"
              placeholder="搜索标题、文件名、上传者"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 rounded-lg border-2 border-stroke-light px-3 text-sm outline-none focus:border-primary bg-white"
          >
            <option value="all">全部分类</option>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-primary-muted">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-stroke-light rounded-lg bg-white">
            <Database className="w-12 h-12 text-primary-muted mx-auto mb-3 opacity-40" />
            <p className="text-primary-muted">知识库暂无资料，点击右上角「上传资料」开始添加</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-bold text-primary">{cat}</h2>
                  <span className="text-sm text-primary-muted">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => {
                    const srcType = item.source_type || 'text';
                    const srcLabel = sourceTypeLabel[srcType] || srcType.toUpperCase();
                    const srcColor = srcType === 'pdf' ? 'bg-red-100 text-red-700' :
                      srcType === 'docx' ? 'bg-blue-100 text-blue-700' :
                      srcType === 'txt' ? 'bg-gray-100 text-gray-700' :
                      'bg-green-100 text-green-700';
                    return (
                    <div key={item.id} className="bg-white border-2 border-stroke-light rounded-lg p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="relative shrink-0 mt-0.5">
                            <FileText className="w-5 h-5 text-primary-muted" />
                            <span className={`absolute -top-1.5 -right-2 text-[8px] font-bold px-1 py-0.5 rounded ${srcColor}`}>
                              {srcLabel}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-primary truncate">{item.title}</div>
                            {item.filename && (
                              item.oss_url ? (
                                <a href={item.oss_url} target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-brand hover:underline truncate block mt-0.5" title={item.filename}>
                                  {item.filename}
                                </a>
                              ) : (
                                <div className="text-xs text-primary-muted truncate mt-0.5" title={item.filename}>{item.filename}</div>
                              )
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-primary-muted">{item.ageRange || '全年龄'}</span>
                              <span className="text-xs text-primary-placeholder">·</span>
                              <span className="text-xs text-primary-muted">{item.chunk_count} 切片</span>
                            </div>
                            {item.uploader_name && (
                              <div className="text-xs text-primary-muted mt-0.5">上传者: {item.uploader_name}</div>
                            )}
                            <div className="text-xs text-primary-placeholder mt-0.5">
                              {new Date(item.created_at).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="opacity-0 group-hover:opacity-100 text-primary-muted hover:text-red-500 transition-all p-1"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div
            className="bg-white rounded-lg border-2 border-stroke-light shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-stroke-light">
              <h3 className="text-lg font-bold text-primary">上传知识库资料</h3>
              <button type="button" onClick={closeModal} className="text-primary-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-primary">资料标题</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full h-11 rounded-lg border-2 border-stroke-light px-3 text-sm outline-none focus:border-primary"
                    placeholder="例如：5岁儿童害怕黑夜的应对方法"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-primary">分类</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full h-11 rounded-lg border-2 border-stroke-light px-3 text-sm outline-none focus:border-primary bg-white"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-primary">适用年龄</span>
                  <input
                    value={ageRange}
                    onChange={(event) => setAgeRange(event.target.value)}
                    className="w-full h-11 rounded-lg border-2 border-stroke-light px-3 text-sm outline-none focus:border-primary"
                    placeholder="不填表示全年龄段适用"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-bold text-primary">上传文件</span>
                <label className="min-h-[120px] border-2 border-dashed border-stroke rounded-lg bg-surface flex flex-col items-center justify-center px-4 py-4 cursor-pointer hover:bg-surface-alt transition-colors">
                  <UploadCloud className="w-8 h-8 text-primary-muted mb-2" />
                  <span className="text-sm font-bold text-primary">{selectedName || '选择 .docx / .pdf / .txt 文件'}</span>
                  <span className="text-xs text-primary-muted mt-1">上传后会切片、向量化并写入 Qdrant</span>
                  <input type="file" accept=".docx,.pdf,.txt" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-bold text-primary">或直接粘贴文本</span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="w-full min-h-[100px] rounded-lg border-2 border-stroke-light p-3 text-sm outline-none focus:border-primary resize-y"
                  placeholder="可以把参考资料正文粘贴到这里"
                />
              </div>

              {message && (
                <div
                  className={`flex items-start gap-2 rounded-lg border-2 px-3 py-2 text-sm ${
                    status === 'success'
                      ? 'bg-success-light border-success-border text-green-deep'
                      : status === 'error'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-surface border-stroke-light text-primary-secondary'
                  }`}
                >
                  {status === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                  <span>{message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 px-4 rounded-lg bg-white border-2 border-stroke-light text-primary-secondary font-bold hover:bg-surface-alt transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-11 px-5 rounded-lg bg-brand text-white font-bold border-2 border-brand-active disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-hover transition-colors"
                >
                  {status === 'uploading' ? '上传中...' : '上传到知识库'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
