import React from 'react';
import { Button, message } from 'antd';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { request } from '../../services/api';

export function MediaDomainMigrationPanel() {
  const [preview, setPreview] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const inspect = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await request('/admin/media-domain-migration', { method: 'GET' });
      setPreview(result.data);
    } catch (error) {
      const nextError = error.message || '读取迁移预览失败';
      setErrorMessage(nextError);
      message.error(nextError);
    } finally {
      setLoading(false);
    }
  };

  const migrate = async () => {
    if (!preview?.total) {
      message.info('没有需要替换的旧域名记录');
      return;
    }
    if (!window.confirm(`将替换 ${preview.total} 条数据库记录中的旧媒体域名。此操作会记录审计日志，是否继续？`)) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await request('/admin/media-domain-migration', {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      });
      message.success(`已替换 ${result.data.total} 条记录`);
      await inspect();
    } catch (error) {
      const nextError = error.message || '媒体域名替换失败';
      setErrorMessage(nextError);
      message.error(nextError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-primary">媒体域名迁移</h2>
          <p className="mt-1 text-sm text-slate-600">
            将数据库中的 <code>z.dhr.dhredu.cn</code> 替换为 <code>z.wellbeing.newstaredu.cn</code>。
          </p>
          {preview ? (
            <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700">
              <div>待替换记录：<b>{preview.total}</b> 条</div>
              {preview.matches?.length ? (
                <ul className="mt-2 list-disc pl-5">
                  {preview.matches.map((item) => <li key={`${item.table_name}.${item.column_name}`}>{item.table_name}.{item.column_name}：{item.count} 条</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}
          {loading ? <p className="mt-3 text-sm text-slate-600">正在读取数据库记录，请稍候…</p> : null}
          {errorMessage ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">操作失败：{errorMessage}</p> : null}
          <div className="mt-4 flex gap-3">
            <Button icon={<RefreshCw size={15} />} loading={loading} onClick={inspect}>预览影响范围</Button>
            <Button type="primary" danger disabled={!preview?.total || loading} onClick={migrate}>确认替换</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
