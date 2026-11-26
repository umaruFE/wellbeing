import { CreateButton, LibraryFilterSelect, LibrarySearch, MetadataTag } from '../../components/LibraryControls';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React from 'react';
import { Modal, message as notification } from 'antd';
import { AlertCircle, CheckCircle2, FileText, Trash2, UploadCloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialLibraryFeedback } from '../material-management/MaterialLibraryControls';

const categoryOptions = [
  '情绪表达', '自我认知', '人际关系', '家庭与归属', '成长与变化',
  '感恩与善意', '身体与感知', '自然探索', '动物与生命', '勇气与冒险',
  '儿童心理', '睡前故事', '社交技能', '安全教育', '科学科普', '艺术创意',
];

const sourceTypeLabel = {
  docx: 'DOCX',
  pdf: 'PDF',
  txt: 'TXT',
};

export const KnowledgeUploadPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const listRequest = React.useRef(0);
  const [modal, modalContext] = Modal.useModal();
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [searchText, setSearchText] = React.useState('');

  // upload modal state
  const [showModal, setShowModal] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState(categoryOptions[0]);
  const [ageRange, setAgeRange] = React.useState('');
  const [text, setText] = React.useState('');
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');

  const selectedNames = files.length > 0 ? files.map(f => f.name).join(', ') : '';
  const canSubmit = status !== 'uploading' && (files.length > 0 || text.trim());

  const fetchList = React.useCallback(async () => {
    const requestId = ++listRequest.current;
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (searchText.trim()) params.set('search', searchText.trim());
      params.set('pageSize', '200');
      const res = await fetch(`/api/rag/knowledge?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Knowledge request failed');
      if (requestId !== listRequest.current) return;
      setList(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('fetch knowledge list failed:', err);
      if (requestId === listRequest.current) setLoadError(true);
    } finally {
      if (requestId === listRequest.current) setLoading(false);
    }
  }, [filterCategory, searchText]);

  React.useEffect(() => {
    fetchList();
    return () => { listRequest.current += 1; };
  }, [fetchList]);

  const handleDelete = (id, docTitle) => modal.confirm({
    title: t('common.confirmDelete'),
    content: t('knowledgeUploadUi.confirmDeleteDoc', { title: docTitle }),
    okText: t('common.delete'),
    cancelText: t('common.cancel'),
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        const response = await fetch(`/api/rag/knowledge/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t('knowledgeUploadUi.deleteFailed'));
        }
        await fetchList();
      } catch (error) {
        notification.error(t('knowledgeUploadUi.deleteFailedReason', { msg: error.message }));
        throw error;
      }
    },
  });

  const resetForm = () => {
    setFiles([]);
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
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;
    setFiles(selected);
    // Auto-fill title from first file if empty
    if (selected.length === 1) {
      setTitle(selected[0].name.replace(/\.[^.]+$/, ''));
    } else {
      setTitle('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('uploading');
    const fileCount = files.length;
    setMessage(fileCount > 1 ? t('knowledgeUploadUi.uploadingFiles', { count: fileCount }) : t('knowledgeUploadUi.uploadingToKb'));

    try {
      let successCount = 0;
      let totalChunks = 0;
      const errors = [];

      if (files.length > 0) {
        // Upload files one by one
        for (const f of files) {
          const formData = new FormData();
          formData.append('file', f);
          formData.append('userId', String(user?.id || user?.userId || 'anonymous'));
          formData.append('uploaderName', String(user?.name || user?.username || ''));
          // For multiple files, use filename as title if title is empty
          formData.append('title', title.trim() || f.name.replace(/\.[^.]+$/, ''));
          formData.append('category', category);
          formData.append('ageRange', ageRange.trim());
          formData.append('visibility', 'private');

          try {
            const response = await fetch('/api/rag/upload-knowledge', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            if (response.ok && data.success !== false) {
              successCount++;
              totalChunks += data.chunkCount || 0;
            } else {
              errors.push(`${f.name}: ${data.error || t('knowledgeUploadUi.failedShort')}`);
            }
          } catch (err) {
            errors.push(`${f.name}: ${err.message}`);
          }
        }
      } else if (text.trim()) {
        // Pasted text upload
        const formData = new FormData();
        formData.append('text', text.trim());
        formData.append('userId', String(user?.id || user?.userId || 'anonymous'));
        formData.append('uploaderName', String(user?.name || user?.username || ''));
        formData.append('title', title.trim());
        formData.append('category', category);
        formData.append('ageRange', ageRange.trim());
        formData.append('visibility', 'private');

        const response = await fetch('/api/rag/upload-knowledge', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (response.ok && data.success !== false) {
          successCount++;
          totalChunks += data.chunkCount || 0;
        } else {
          errors.push(data.error || t('knowledgeUploadUi.failedShort'));
        }
      }

      if (successCount > 0) {
        setStatus('success');
        setMessage(t('knowledgeUploadUi.uploadSuccess', { docs: successCount, chunks: totalChunks }) + (errors.length > 0 ? t('knowledgeUploadUi.uploadPartFailed', { count: errors.length }) : ''));
        fetchList();
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setStatus('error');
        setMessage(errors.join('; ') || t('knowledgeUploadUi.uploadFailed'));
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || t('knowledgeUploadUi.uploadFailed'));
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
    <div className="min-h-full bg-[var(--wb-page)] px-4 sm:px-7 py-7">
      {modalContext}
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* Header */}
        <header className="wb-library-header flex min-h-[66px] flex-wrap items-center justify-between gap-4">
          <div>
            <h1><LocalizedText id="knowledgeUploadUi.edf216cb00" /></h1>
            <p className="text-sm text-[var(--wb-muted)] mt-1"><LocalizedText id="knowledgeUploadUi.3b6ef811b8" /> {total} <LocalizedText id="knowledgeUploadUi.2df2ccaaaf" /></p>
          </div>
          <CreateButton onClick={() => setShowModal(true)}><LocalizedText id="knowledgeUploadUi.da905dfb4f" /></CreateButton>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <LibrarySearch value={searchText} onChange={setSearchText} label={t('knowledgeUploadUi.335ac1602e')} />
          <LibraryFilterSelect
            label={t('knowledgeUploadUi.435c5259e4')}
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: 'all', label: t('knowledgeUploadUi.a8e369c4b6') },
              ...categoryOptions.map((value) => ({ value, label: value })),
            ]}
          />
        </div>

        {/* List */}
        {loading ? (
          <PageLoading />
        ) : loadError ? (
          <MaterialLibraryFeedback error={t('common.loadFailed')} onRetry={fetchList} />
        ) : list.length === 0 ? (
          <MaterialLibraryFeedback
            empty={t('common.noData')}
            filtered={Boolean(searchText.trim() || filterCategory !== 'all')}
            onReset={() => { setSearchText(''); setFilterCategory('all'); }}
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-bold text-[var(--wb-text)]">{cat}</h2>
                  <span className="text-sm text-[var(--wb-muted)]">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => {
                    const srcType = item.source_type || 'text';
                    const srcLabel = srcType === 'text' ? t('knowledgeUploadUi.srcTypeText') : sourceTypeLabel[srcType] || srcType.toUpperCase();
                    return (
                    <div key={item.id} className="bg-white border border-[var(--wb-border)] rounded-[14px] p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <FileText className="w-5 h-5 text-[var(--wb-muted)]" />
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-[var(--wb-text)] truncate">{item.title}</div>
                            {item.filename && (
                              item.oss_url ? (
                                <a href={item.oss_url} target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-[var(--wb-primary)] hover:underline truncate block mt-0.5" title={item.filename}>
                                  {item.filename}
                                </a>
                              ) : (
                                <div className="text-xs text-[var(--wb-muted)] truncate mt-0.5" title={item.filename}>{item.filename}</div>
                              )
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <MetadataTag>{srcLabel}</MetadataTag>
                              <span className="text-xs text-[var(--wb-muted)]">{item.ageRange || t('knowledgeUploadUi.allAges')}</span>
                              <span className="text-xs text-[var(--wb-muted)]">·</span>
                              <span className="text-xs text-[var(--wb-muted)]">{item.chunk_count} <LocalizedText id="knowledgeUploadUi.1a37ffe775" /></span>
                            </div>
                            {item.uploader_name && (
                              <div className="text-xs text-[var(--wb-muted)] mt-0.5"><LocalizedText id="knowledgeUploadUi.4938caca56" /> {item.uploader_name}</div>
                            )}
                            <div className="text-xs text-[var(--wb-muted)] mt-0.5">
                              {new Date(item.created_at).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          data-wb-button="danger" data-wb-size="sm" data-wb-icon aria-label={t('common.delete')}
                          title={i18next.t('common.delete')}
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
      <Modal
        open={showModal}
        title={t('knowledgeUploadUi.7316801812')}
        onCancel={closeModal}
        footer={null}
        maskClosable={false}
        keyboard={status !== 'uploading'}
        closable={status !== 'uploading'}
        width={576}
      >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[var(--wb-text)]"><LocalizedText id="knowledgeUploadUi.84428a4828" /></span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    data-wb-field
                    placeholder={i18next.t('knowledgeUploadUi.e72899cd3a')}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-[var(--wb-text)]"><LocalizedText id="knowledgeUploadUi.435c5259e4" /></span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    data-wb-field
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-[var(--wb-text)]"><LocalizedText id="knowledgeUploadUi.753e22e76a" /></span>
                  <input
                    value={ageRange}
                    onChange={(event) => setAgeRange(event.target.value)}
                    data-wb-field
                    placeholder={i18next.t('knowledgeUploadUi.b7324fb85e')}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-bold text-[var(--wb-text)]"><LocalizedText id="knowledgeUploadUi.926e52784a" /></span>
                <label className="min-h-[120px] border border-dashed border-[var(--wb-border)] rounded-[10px] bg-[var(--wb-surface)] flex flex-col items-center justify-center px-4 py-4 cursor-pointer hover:bg-[var(--wb-page)] transition-colors">
                  <UploadCloud className="w-8 h-8 text-[var(--wb-muted)] mb-2" />
                  <span className="text-sm font-bold text-[var(--wb-text)]">{selectedNames || t('knowledgeUploadUi.pickFiles')}</span>
                  <span className="text-xs text-[var(--wb-muted)] mt-1">{files.length > 0 ? t('knowledgeUploadUi.filesSelected', { count: files.length }) : t('knowledgeUploadUi.multiFileHint')}</span>
                  <input type="file" accept=".docx,.pdf,.txt" multiple className="sr-only" onChange={handleFileChange} />
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-bold text-[var(--wb-text)]"><LocalizedText id="knowledgeUploadUi.1fbf57e317" /></span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  data-wb-field aria-label={t('knowledgeUploadUi.1fbf57e317')}
                  placeholder={i18next.t('knowledgeUploadUi.a5f43336b1')}
                />
              </div>

              {message && (
                <div
                  className={`flex items-start gap-2 rounded-[10px] border px-3 py-2 text-sm ${
                    status === 'success'
                      ? 'bg-success-light border-success-border text-green-deep'
                      : status === 'error'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : "bg-[var(--wb-surface)] border-[var(--wb-border)] text-[var(--wb-muted)]"
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
                  data-wb-button="secondary" disabled={status === 'uploading'}
                >
                  <LocalizedText id="common.cancel" />
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  data-wb-button="primary"
                >
                  {status === 'uploading' ? t('common.uploading') : t('knowledgeUploadUi.uploadToKb')}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
};
