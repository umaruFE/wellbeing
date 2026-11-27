import { DialogCloseButton } from '../../../components/LibraryControls';
import React from 'react';
import { Button, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { composeFlowFromSteps, composeScriptFromSteps, createFlowStepsForForm } from './lessonDesignUtils';

const { TextArea } = Input;

export function EditStepModal({ open, step, courseTitle, onClose, onSave, onRewrite }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const request = React.useRef(0);
  const [rewriting, setRewriting] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    request.current++;
    setRewriting(false);
    setError('');
    if (!open || !step) return;
    form.setFieldsValue({
      title: step.title,
      duration: step.duration,
      goal: step.goal,
      activity: step.activity,
      resources: step.resources,
      scenario: step.scenario,
      flowSteps: createFlowStepsForForm(step),
    });
  }, [form, open, step]);

  const readDraft = values => {
    const original = createFlowStepsForForm(step);
    const flow = composeFlowFromSteps(values.flowSteps);
    const script = composeScriptFromSteps(values.flowSteps);
    const { flowSteps, ...fields } = values;
    return {
      ...step, ...fields,
      flow: flow === composeFlowFromSteps(original) ? step.flow : flow,
      teacherScript: script === composeScriptFromSteps(original) ? step.teacherScript : script,
    };
  };

  const save = async () => {
    const values = await form.validateFields().catch(() => null);
    if (values) onSave(readDraft(values));
  };

  const rewrite = async () => {
    const id = ++request.current;
    setError('');
    setRewriting(true);
    try {
      const revised = await onRewrite(readDraft(form.getFieldsValue()));
      if (request.current === id) form.setFieldsValue({ ...revised, flowSteps: createFlowStepsForForm(revised) });
    } catch (err) {
      if (request.current === id) setError(err.message);
    } finally {
      if (request.current === id) setRewriting(false);
    }
  };

  if (!open || !step) return null;

  return (
    <div className="mo on trd-edit-modal" id="mo-trd-edit" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal tbl-row-drawer open">
        <div className="trd-hd">
          <div>
            <div className="trd-title">{t('lesson.editLessonDetail')}</div>
            {courseTitle && <div className="trd-subtitle">{courseTitle}</div>}
          </div>
          <DialogCloseButton onClick={onClose} />
        </div>

        <Form form={form} disabled={rewriting} className="trd-body lesson-design-form" layout="vertical">
          <div className="trd-main-panel">
            <div className="trd-intro">
              <div>
                <div className="trd-intro-title">{t('lesson.activityDraft')}</div>
                <div className="trd-intro-subtitle">{t('lesson.flowEditorTip')}</div>
              </div>
              <span className="as-right-tag">{t('editStepUi.editingTag')}</span>
            </div>

            <div className="as-draft-form trd-draft-form">
              <div className="as-draft-row trd-row-name">
                <Form.Item className="as-draft-field as-draft-name" label={t('lesson.stepName')} name="title" rules={[{ required: true, whitespace: true, message: t('lesson.nameRequired') }]}>
                  <Input className="as-draft-input" placeholder={t('lesson.stepNamePlaceholder')} />
                </Form.Item>
                <Form.Item className="as-draft-field trd-time-field" label={t('lesson.stepDuration')} name="duration">
                  <Input className="as-draft-input" placeholder={t('lesson.durationPlaceholder')} />
                </Form.Item>
              </div>

              <Form.Item className="as-draft-field" label={t('lesson.languageGoal')} name="goal">
                <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={t('lesson.languageGoalPlaceholder')} />
              </Form.Item>

              <Form.Item className="as-draft-field" label={t('lesson.activitySummary')} name="activity">
                <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={t('lesson.activitySummaryPlaceholder')} />
              </Form.Item>

              <div className="as-draft-field">
                <label className="as-draft-lbl">{t('lesson.activityFlow')}</label>
                <Form.List name="flowSteps">
                  {(fields, { add, remove }) => (
                    <div className="flow-step-editor" id="trdFlowSteps">
                      <div className="flow-step-editor-head">
                        <div>
                          <div className="flow-step-editor-title">{t('lesson.executionFlow')}</div>
                          <div className="flow-step-editor-tip">{t('lesson.flowEditorTip')}</div>
                        </div>
                        <div className="flow-step-editor-badge">{t('lesson.flowStepCount', { count: fields.length })}</div>
                      </div>

                      {fields.map((field, index) => (
                        <div className="flow-step-row" key={field.key}>
                          <div className="flow-step-rail">
                            <div className="flow-step-index">{index + 1}</div>
                            <div className="flow-step-line" />
                          </div>
                          <div className="flow-step-fields">
                            <div className="flow-step-card-head">
                              <div className="flow-step-mini-label">{t('lesson.flowStepName')}</div>
                              <Form.Item name={[field.name, 'title']} noStyle>
                                <Input className="flow-step-input flow-step-title" placeholder={t('lesson.flowStepNamePlaceholder')} />
                              </Form.Item>
                              <button type="button" className="flow-step-del" disabled={fields.length <= 1} onClick={() => fields.length > 1 && remove(field.name)} aria-label={t('lesson.deleteStep')}>×</button>
                            </div>

                            <div className="flow-step-body-grid">
                              <div className="flow-step-section">
                                <div className="flow-step-section-title">{t('lesson.activityContent')}</div>
                                <Form.Item name={[field.name, 'desc']} noStyle>
                                  <TextArea className="flow-step-input flow-step-desc" autoSize={{ minRows: 4, maxRows: 8 }} placeholder={t('lesson.activityContentPlaceholder')} />
                                </Form.Item>
                              </div>
                              <div className="flow-step-section guidance teacher-script">
                                <div className="flow-step-section-title">{t('lesson.teacherGuidance')}</div>
                                <Form.Item name={[field.name, 'teacher']} noStyle>
                                  <TextArea className="flow-step-input flow-step-script" autoSize={{ minRows: 4, maxRows: 8 }} placeholder={t('lesson.teacherPlaceholder')} />
                                </Form.Item>
                              </div>
                              <div className="flow-step-section guidance cue-script">
                                <div className="flow-step-section-title">{t('lesson.actionCue')}</div>
                                <Form.Item name={[field.name, 'cue']} noStyle>
                                  <TextArea className="flow-step-input flow-step-cue" autoSize={{ minRows: 4, maxRows: 8 }} placeholder={t('lesson.actionCuePlaceholder')} />
                                </Form.Item>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button type="button" className="flow-step-add" onClick={() => add({ title: '', desc: '', teacher: '', cue: '' })}>+ {t('common.add')}</button>
                    </div>
                  )}
                </Form.List>
              </div>

              <div className="as-draft-row trd-resource-row">
                <Form.Item className="as-draft-field" label={t('lesson.teachingResources')} name="resources">
                  <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={t('lesson.resourcesPlaceholder')} />
                </Form.Item>
                <Form.Item className="as-draft-field" label={t('lesson.sceneSetup')} name="scenario">
                  <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={t('lesson.scenarioPlaceholder')} />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>

        <div className="trd-ft">
          <button type="button" data-wb-button="secondary" onClick={onClose}>{t('common.cancel')}</button>
          <div className="trd-ft-spacer" />
          {error && <span role="alert">{error}</span>}
          <Button data-wb-button="secondary" loading={rewriting} onClick={rewrite}>{t('lesson.aiRewrite')}</Button>
          <Button type="primary" data-wb-button="primary" disabled={rewriting} onClick={save}>{t('lesson.saveChanges')}</Button>
        </div>
      </div>
    </div>
  );
}
