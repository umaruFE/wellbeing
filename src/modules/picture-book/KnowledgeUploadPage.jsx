import React from 'react';
import { AlertCircle, CheckCircle2, Database, FileText, UploadCloud, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const HISTORY_KEY = 'picturebook_knowledge_upload_history';

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export const KnowledgeUploadPage = () => {
  const { user } = useAuth();
  const [file, setFile] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('儿童心理');
  const [ageRange, setAgeRange] = React.useState('');
  const [text, setText] = React.useState('');
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [history, setHistory] = React.useState(() => readHistory());

  const selectedName = file?.name || '';
  const canSubmit = status !== 'uploading' && (file || text.trim()) && title.trim();

  const saveHistory = (entry) => {
    const next = [entry, ...history].slice(0, 12);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    if (nextFile && !title.trim()) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, ''));
    }
    setResult(null);
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('uploading');
    setMessage('正在上传并写入知识库...');
    setResult(null);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (text.trim()) formData.append('text', text.trim());
      formData.append('userId', String(user?.id || user?.userId || 'anonymous'));
      formData.append('title', title.trim());
      formData.append('category', category.trim() || 'general');
      formData.append('ageRange', ageRange.trim());
      formData.append('visibility', 'private');
      formData.append('sourceType', file ? 'docx' : 'text');

      const response = await fetch('/api/rag/upload-knowledge', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || '上传失败');
      }

      const entry = {
        id: data.documentId || `${Date.now()}`,
        title: title.trim(),
        category,
        ageRange: ageRange.trim(),
        filename: selectedName || 'pasted-text',
        chunkCount: data.chunkCount || 0,
        uploadedAt: new Date().toISOString(),
      };

      saveHistory(entry);
      setResult(data);
      setStatus('success');
      setMessage('已写入知识库，后续生成绘本时可以重复检索使用。');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || '上传失败');
    }
  };

  const clearForm = () => {
    setFile(null);
    setTitle('');
    setText('');
    setResult(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="min-h-full bg-[#f3f2ed] p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary-muted text-sm font-semibold">
              <Database className="w-4 h-4" />
              绘本 RAG
            </div>
            <h1 className="text-2xl font-bold text-primary mt-1">绘本知识库上传</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-stroke-light rounded-lg p-5 space-y-5">
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
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full h-11 rounded-lg border-2 border-stroke-light px-3 text-sm outline-none focus:border-primary"
                  placeholder="儿童心理、睡前故事、科普..."
                />
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
              <span className="text-sm font-bold text-primary">上传 DOCX</span>
              <label className="min-h-[150px] border-2 border-dashed border-stroke rounded-lg bg-surface flex flex-col items-center justify-center px-4 py-6 cursor-pointer hover:bg-surface-alt transition-colors">
                <UploadCloud className="w-8 h-8 text-primary-muted mb-3" />
                <span className="text-sm font-bold text-primary">{selectedName || '选择 .docx 文件'}</span>
                <span className="text-xs text-primary-muted mt-1">上传后会切片、向量化并写入 Qdrant</span>
                <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold text-primary">或直接粘贴文本</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="w-full min-h-[150px] rounded-lg border-2 border-stroke-light p-3 text-sm outline-none focus:border-primary resize-y"
                placeholder="可以把参考资料正文粘贴到这里。上传 DOCX 和粘贴文本二选一即可。"
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

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="h-11 px-5 rounded-lg bg-dark text-white font-bold border-2 border-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warning hover:text-primary transition-colors"
              >
                {status === 'uploading' ? '上传中...' : '上传到知识库'}
              </button>
              <button
                type="button"
                onClick={clearForm}
                className="h-11 px-4 rounded-lg bg-white border-2 border-stroke-light text-primary-secondary font-bold hover:bg-surface-alt transition-colors"
              >
                清空
              </button>
            </div>

            {result && (
              <div className="rounded-lg bg-surface border-2 border-stroke-light p-4 text-sm text-primary-secondary">
                <div className="font-bold text-primary mb-2">入库结果</div>
                <div>Document ID: {result.documentId || '-'}</div>
                <div>切片数量: {result.chunkCount || 0}</div>
                <div>Collection: {result.collection || 'picturebook_knowledge'}</div>
              </div>
            )}
          </form>

          <aside className="space-y-5">
            <div className="bg-white border-2 border-stroke-light rounded-lg p-5">
              <h2 className="text-lg font-bold text-primary mb-3">复用方式</h2>
              <div className="space-y-3 text-sm text-primary-secondary leading-6">
                <p>资料只需要上传一次。后续生成绘本时，RAG 会根据主题、年龄、分类和用户 ID 从 Qdrant 检索这些资料。</p>
                <p>适用年龄可以留空，留空时会按全年龄资料处理。</p>
              </div>
            </div>

            <div className="bg-white border-2 border-stroke-light rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-primary">本机上传记录</h2>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem(HISTORY_KEY);
                    }}
                    className="text-xs text-primary-muted hover:text-primary flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    清除
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="text-sm text-primary-muted py-6 text-center border-2 border-dashed border-stroke-light rounded-lg">
                    暂无上传记录
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="border-2 border-stroke-light rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-primary-muted mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-primary truncate">{item.title}</div>
                          <div className="text-xs text-primary-muted mt-1">
                            {item.category} · {item.ageRange || '全年龄'} · {item.chunkCount} 个切片
                          </div>
                          <div className="text-xs text-primary-placeholder mt-1">
                            {new Date(item.uploadedAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
