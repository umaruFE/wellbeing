import { Check, LoaderCircle, Pause } from 'lucide-react';

const steps = ['组装 Prompt 模板', '调用生成工作流', '轮询任务状态', '获取生成结果'];

export function GenerationProgress({ title, subtitle, progress = 58, batch, onViewResult }) {
  return (
    <div className="ppt-gen-progress">
      <LoaderCircle className="ppt-gen-spinner" size={34} />
      <strong>{title}</strong>
      <span>{subtitle}</span>
      {batch ? (
        <div className="ppt-gen-batch">
          已完成 <b>{batch.done}</b> / <b>{batch.total}</b> {batch.unit}
        </div>
      ) : null}
      <div className="ppt-gen-bar"><span style={{ width: `${progress}%` }} /></div>
      <small>准备生成预览结果...</small>
      <div className="ppt-gen-step-list">
        {steps.map((step, index) => (
          <div className="ppt-gen-step" key={step}>
            <span>{index === 0 ? <Check size={13} /> : index === 1 ? <LoaderCircle size={13} /> : '○'}</span>
            <strong>{step}</strong>
            <em className={index === 0 ? 'done' : index === 1 ? 'running' : ''}>{index === 0 ? '完成' : index === 1 ? '进行中' : '等待'}</em>
          </div>
        ))}
      </div>
      <button type="button" className="ppt-hang-btn"><Pause size={13} />挂起后台，继续编辑课件</button>
      {onViewResult ? (
        <button type="button" className="ppt-primary-btn" onClick={onViewResult}>查看生成结果</button>
      ) : null}
    </div>
  );
}
