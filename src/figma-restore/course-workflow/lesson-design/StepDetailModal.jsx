import React from 'react';
import { Clock, Edit3 } from 'lucide-react';
import { buildStepExecutionItems, splitStepResources } from './lessonDesignUtils';

function InfoBlock({ iconClass, icon, title, children }) {
  return (
    <div className="sdm-info-block">
      <div className="sdm-info-title">
        <span className={`sdm-info-icon ${iconClass}`}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

export function StepDetailModal({ open, step, phase, onClose, onEdit }) {
  if (!open || !step) return null;
  const resources = splitStepResources(step.resources);
  const executionItems = buildStepExecutionItems(step);

  return (
    <div className="mo on" id="mo-step-detail" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal step-detail-preview-modal">
        <div className="sdm-page">
          <div className="sdm-head">
            <div className="sdm-title-wrap">
              <div className="sdm-title">
                <span className="sdm-title-main">{step.title}</span>
                <span className="sdm-title-cn">{phase?.title || '教案设计'}</span>
              </div>
            </div>
            <div className="sdm-head-right">
              <div className="sdm-duration">
                <Clock size={14} />
                {step.duration}
              </div>
              <button type="button" className="sdm-close" onClick={onClose} aria-label="关闭">×</button>
            </div>
          </div>

          <div className="sdm-scroll">
            <div className="sdm-overview">
              <div className="sdm-overview-card">
                <InfoBlock iconClass="lang" icon="◎" title="语言目标">
                  <div className="sdm-info-content">{step.goal || '待补充'}</div>
                </InfoBlock>
              </div>
              <div className="sdm-overview-card">
                <InfoBlock iconClass="activity" icon="□" title="活动概述">
                  <div className="sdm-info-content">{step.activity || '待补充'}</div>
                </InfoBlock>
              </div>
              <div className="sdm-overview-card">
                <InfoBlock iconClass="resource" icon="▣" title="教学资源">
                  {resources.length ? (
                    <div className="sdm-tag-list">
                      {resources.map((item) => <span className="sdm-tag" key={item}>{item}</span>)}
                    </div>
                  ) : (
                    <div className="sdm-info-content">投影设备、图片卡、任务材料或课堂道具。</div>
                  )}
                </InfoBlock>
              </div>
              <div className="sdm-overview-card">
                <InfoBlock iconClass="scene" icon="⌖" title="情境创设">
                  <div className="sdm-info-content">{step.scenario || '通过角色身份、任务线索和空间布置，快速建立沉浸感。'}</div>
                </InfoBlock>
              </div>
            </div>

            <div className="sdm-divider"><span>TEACHING EXECUTION 教学执行</span></div>

            <div className="sdm-execution">
              {executionItems.map((item, index) => (
                <div className="sdm-exec-item" key={`${item.title}-${index}`}>
                  <div className="sdm-exec-num">{index + 1}</div>
                  <div className="sdm-exec-card">
                    <div className="sdm-exec-card-head">
                      <h4 className="sdm-exec-title">{item.title}</h4>
                      <p className="sdm-exec-desc"><span className="sdm-play" /><span>{item.desc}</span></p>
                    </div>
                    <div className="sdm-exec-card-body">
                      <div className="sdm-stage-cue"><span>上课提示</span><div>{item.stageCue}</div></div>
                      <div className="sdm-script-list">
                        {item.lines.map((line, lineIndex) => (
                          <div className="sdm-teacher-line" key={`${line.text}-${lineIndex}`}>
                            <span className="sdm-t-badge">T</span>
                            <div>
                              <p className="sdm-teacher-text">{line.text}</p>
                              <div className="sdm-script-meta">
                                {line.cue && <span className="sdm-teacher-cue">{line.cue}</span>}
                                {line.response && <span className="sdm-student-response">可能回应：{line.response}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sdm-footer">
            <div className="sdm-updated">最后更新于刚刚</div>
            <div className="sdm-footer-actions">
              <button type="button" className="sdm-preview-close" onClick={onClose}>关闭预览</button>
              <button type="button" className="sdm-edit-btn" onClick={onEdit}>
                <Edit3 size={15} />
                编辑教案细节
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
