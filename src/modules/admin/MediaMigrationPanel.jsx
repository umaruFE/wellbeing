import React, { useState } from 'react';
import { DatabaseBackup, RefreshCw } from 'lucide-react';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const MediaMigrationPanel = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const scan = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/media-migration', {
        headers: authHeaders(),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || '扫描失败');
      setSummary(body.data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const migrate = async () => {
    if (!summary?.occurrences) return;
    const confirmed = window.confirm(
      `确认把 ${summary.uniqueSources} 张旧 GPU 图片上传到 FTP，并更新 ${summary.occurrences} 处数据库引用吗？执行前会自动备份数据库记录。`,
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage('正在迁移，请不要关闭页面……');
    try {
      let result;
      do {
        const response = await fetch('/api/admin/media-migration', {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: '{}',
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || '迁移失败');
        result = body.data;
        if (!result.done) {
          setMessage(`正在迁移：已上传 ${result.migrated}/${result.total} 张，请不要关闭页面……`);
        }
      } while (!result.done);
      setSummary(result);
      setMessage(`迁移完成：已转存 ${result.migrated} 张图片，GPU 地址残留 0 处。`);
    } catch (error) {
      setMessage(`迁移失败：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-6 mt-6 rounded-xl border-2 border-stroke-light bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DatabaseBackup className="h-5 w-5 text-info" />
            <h2 className="text-lg font-semibold text-primary">旧图片迁移</h2>
          </div>
          <p className="mt-1 text-sm text-primary-secondary">
            将历史 GPU 图片转存到生产 FTP，并更新课程、绘本和 PPT 图片库引用。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={scan}
            className="flex items-center gap-2 rounded-lg border-2 border-stroke-light px-4 py-2 font-medium disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            扫描旧图片
          </button>
          <button
            type="button"
            disabled={loading || !summary?.occurrences || summary?.provider !== 'ftp'}
            onClick={migrate}
            className="rounded-lg bg-info px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            上传 FTP 并更新数据
          </button>
        </div>
      </div>
      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
          <div>当前存储：<strong>{summary.provider?.toUpperCase()}</strong></div>
          <div>不同图片：<strong>{summary.uniqueSources}</strong></div>
          <div>引用总数：<strong>{summary.occurrences}</strong></div>
          <div>课程：<strong>{summary.affected?.courses || 0}</strong></div>
          <div>PPT 图片库：<strong>{summary.affected?.pptImages || 0}</strong></div>
        </div>
      )}
      {message && <p className="mt-3 text-sm text-primary-secondary">{message}</p>}
    </div>
  );
};
