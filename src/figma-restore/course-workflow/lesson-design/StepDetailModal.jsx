import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Clock,
  Crosshair,
  Edit3,
  FileText,
  MessageCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { buildStepExecutionItems, splitStepResources } from './lessonDesignUtils';

const displayText = (value, isChinese) => {
  if (value == null) return '';
  let text = String(value);
  if (isChinese) return text;
  [
    ['语言目标：', 'Language Goal: '],
    ['核心词汇：', 'Core Vocabulary: '],
    ['核心句型：', 'Core Sentence Pattern: '],
    ['可能回应：', 'Possible response: '],
    ['分钟', 'min'],
    ['引入', 'Engage'],
    ['赋能', 'Empower'],
    ['实践', 'Execute'],
    ['升华', 'Elevate'],
  ].forEach(([from, to]) => {
    text = text.split(from).join(to);
  });
  return text;
};

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
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
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
                <span className="sdm-title-main">{displayText(step.title, isChinese)}</span>
                <span className="sdm-title-cn">{displayText(phase?.title || t('workflow.lesson.title'), isChinese)}</span>
              </div>
            </div>
            <div className="sdm-head-right">
              <div className="sdm-duration">
                <Clock size={14} />
                {displayText(step.duration, isChinese)}
              </div>
              <button type="button" className="sdm-close" onClick={onClose} aria-label={t('common.close')}>×</button>
            </div>
          </div>

          <div className="sdm-scroll">
            <div className="sdm-overview">
              <div className="sdm-overview-card lang">
                <InfoBlock iconClass="lang" icon={<Target size={15} />} title={t('lesson.languageGoal')}>
                  <div className="sdm-info-content">{displayText(step.goal, isChinese) || t('common.none')}</div>
                </InfoBlock>
              </div>
              <div className="sdm-overview-card activity">
                <InfoBlock iconClass="activity" icon={<FileText size={15} />} title={t('lesson.activitySummary')}>
                  <div className="sdm-info-content">{displayText(step.activity, isChinese) || t('common.none')}</div>
                </InfoBlock>
              </div>
              <div className="sdm-overview-card resource">
                <InfoBlock iconClass="resource" icon={<BookOpen size={15} />} title={t('lesson.teachingResources')}>
                  {resources.length ? (
                    <div className="sdm-tag-list">
                      {resources.map((item) => <span className="sdm-tag" key={item}>{displayText(item, isChinese)}</span>)}
                    </div>
                  ) : (
                    <div className="sdm-info-content">{isChinese ? '投影设备、图片卡、任务材料或课堂道具。' : 'Projector, image cards, task materials, or classroom props.'}</div>
                  )}
                </InfoBlock>
              </div>
              <div className="sdm-overview-card scene">
                <InfoBlock iconClass="scene" icon={<Sparkles size={15} />} title={t('lesson.sceneSetup')}>
                  <div className="sdm-info-content">{displayText(step.scenario, isChinese) || (isChinese ? '通过角色身份、任务线索和空间布置，快速建立沉浸感。' : 'Use roles, task clues, and classroom setup to create immersion quickly.')}</div>
                </InfoBlock>
              </div>
            </div>

            <div className="sdm-section-title">{t('lesson.executionFlow')}</div>

            <div className="sdm-execution">
              {executionItems.map((item, index) => (
                <div className="sdm-exec-item" key={`${item.title}-${index}`}>
                  <div className="sdm-exec-num">{index + 1}</div>
                  <div className="sdm-exec-card">
                    <div className="sdm-exec-left">
                      <h4 className="sdm-exec-title">{displayText(item.title, isChinese)}</h4>
                      <p className="sdm-exec-desc">{displayText(item.desc, isChinese)}</p>
                    </div>
                    <div className="sdm-script-panel">
                      {item.lines.map((line, lineIndex) => (
                        <div className="sdm-script-line" key={`${line.text}-${lineIndex}`}>
                          <span className="sdm-script-icon"><MessageCircle size={15} /></span>
                          <div className="sdm-script-copy">
                            <p className="sdm-teacher-text">{displayText(line.text, isChinese)}</p>
                            {line.cue && (
                              <div className="sdm-cue-line">
                                <span className="sdm-cue-icon"><Crosshair size={14} /></span>
                                {displayText(line.cue, isChinese)}
                              </div>
                            )}
                            {line.response && (
                              <div className="sdm-cue-line">
                                <span className="sdm-cue-icon"><Crosshair size={14} /></span>
                                {isChinese ? '可能回应：' : 'Possible response: '}{displayText(line.response, isChinese)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {!item.lines.length && item.stageCue && (
                        <div className="sdm-script-line">
                          <span className="sdm-script-icon"><MessageCircle size={15} /></span>
                          <div className="sdm-script-copy">
                            <p className="sdm-teacher-text">{displayText(item.stageCue, isChinese)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sdm-footer">
            <div className="sdm-updated">{isChinese ? '最后更新于刚刚' : 'Updated just now'}</div>
            <div className="sdm-footer-actions">
              <button type="button" className="sdm-preview-close" onClick={onClose}>{isChinese ? '关闭预览' : 'Close Preview'}</button>
              <button type="button" className="sdm-edit-btn" onClick={onEdit}>
                <Edit3 size={15} />
                {t('lesson.editLessonDetail')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
