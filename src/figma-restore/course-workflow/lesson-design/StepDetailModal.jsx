import { DialogCloseButton } from '../../../components/LibraryControls';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit3 } from 'lucide-react';
import { lessonExecution } from './lessonDesignUtils';

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

function ReadonlyField({ label, children, className = '' }) {
  return (
    <div className={`as-draft-field ${className}`}>
      <div className="as-draft-lbl">{label}</div>
      <div className="trd-readonly-card">{children}</div>
    </div>
  );
}

export function StepDetailModal({ open, step, phase, onClose, onEdit }) {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  if (!open || !step) return null;

  const { items: executionItems, script } = lessonExecution(step, !isChinese);
  const emptyText = t('common.none');

  return (
    <div className="mo on trd-detail-modal" id="mo-step-detail" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal tbl-row-drawer open">
        <div className="trd-hd">
          <div>
            <div className="trd-title">{displayText(step.title, isChinese) || t('lesson.lessonDetail')}</div>
            <div className="trd-subtitle">{displayText(phase?.title || t('workflow.lesson.title'), isChinese)}</div>
          </div>
          <DialogCloseButton onClick={onClose} />
        </div>

        <div className="trd-body lesson-design-form">
          <div className="trd-main-panel">
            <div className="trd-intro">
              <div>
                <div className="trd-intro-title">{t('lesson.activityDraft')}</div>
                <div className="trd-intro-subtitle">{t('lesson.flowEditorTip')}</div>
              </div>
              <span className="as-right-tag">{t('editStepUi.previewTag')}</span>
            </div>

            <div className="as-draft-form trd-draft-form">
              <div className="as-draft-row trd-row-name">
                <ReadonlyField label={t('lesson.stepName')}>
                  {displayText(step.title, isChinese) || emptyText}
                </ReadonlyField>
                <ReadonlyField label={t('lesson.stepDuration')} className="trd-time-field">
                  {displayText(step.duration, isChinese) || emptyText}
                </ReadonlyField>
              </div>

              <ReadonlyField label={t('lesson.languageGoal')}>
                {displayText(step.goal, isChinese) || emptyText}
              </ReadonlyField>

              <ReadonlyField label={t('lesson.activitySummary')}>
                {displayText(step.activity, isChinese) || emptyText}
              </ReadonlyField>

              <div className="as-draft-field">
                <div className="as-draft-lbl">{t('lesson.activityFlow')}</div>
                <div className="flow-step-editor" id="trdFlowStepsPreview">
                  <div className="flow-step-editor-head">
                    <div>
                      <div className="flow-step-editor-title">{t('lesson.executionFlow')}</div>
                      <div className="flow-step-editor-tip">{t('lesson.flowEditorTip')}</div>
                    </div>
                    <div className="flow-step-editor-badge">{t('lesson.flowStepCount', { count: executionItems.length })}</div>
                  </div>

                  {!executionItems.length && <div className="flow-step-readonly-text">{emptyText}</div>}
                  {executionItems.map((item, index) => (
                    <div className="flow-step-row" key={`${item.title}-${index}`}>
                      <div className="flow-step-rail">
                        <div className="flow-step-index">{index + 1}</div>
                        <div className="flow-step-line" />
                      </div>
                      <div className="flow-step-fields">
                        <div className="flow-step-card-head">
                          <div className="flow-step-mini-label">{t('lesson.flowStepName')}</div>
                          <div className="flow-step-readonly-title">
                            {displayText(item.title, isChinese) || emptyText}
                          </div>
                        </div>

                        <div className="flow-step-body-grid">
                          <div className="flow-step-section">
                            <div className="flow-step-section-title">{t('lesson.activityContent')}</div>
                            <div className="flow-step-readonly-text">
                              {displayText(item.desc, isChinese) || emptyText}
                            </div>
                          </div>
                          <div className="flow-step-section guidance teacher-script">
                            <div className="flow-step-section-title">{t('lesson.teacherGuidance')}</div>
                            <div className="flow-step-readonly-text">
                              {displayText(item.teacher, isChinese) || emptyText}
                            </div>
                          </div>
                          <div className="flow-step-section guidance cue-script">
                            <div className="flow-step-section-title">{t('lesson.actionCue')}</div>
                            <div className="flow-step-readonly-text">
                              {displayText(item.cue, isChinese) || emptyText}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {script && (
                <ReadonlyField label={t('lesson.teacherGuidance')}>{displayText(script, isChinese)}</ReadonlyField>
              )}
              <div className="as-draft-row trd-resource-row">
                <ReadonlyField label={t('lesson.teachingResources')}>
                  {displayText(step.resources, isChinese) || emptyText}
                </ReadonlyField>
                <ReadonlyField label={t('lesson.sceneSetup')}>
                  {displayText(step.scenario, isChinese) || emptyText}
                </ReadonlyField>
              </div>
            </div>
          </div>
        </div>

        <div className="trd-ft">
          <button type="button" data-wb-button="secondary" onClick={onClose}>{t('editStepUi.closePreview')}</button>
          <div className="trd-ft-spacer" />
          <button type="button" data-wb-button="primary" onClick={onEdit}>
            <Edit3 size={15} />
            {t('lesson.editLessonDetail')}
          </button>
        </div>
      </div>
    </div>
  );
}
