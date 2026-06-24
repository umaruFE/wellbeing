import React from 'react';
import { Button, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { composeFlowFromSteps, composeScriptFromSteps, createFlowStepsForForm } from './lessonDesignUtils';

const { TextArea } = Input;

export function EditStepModal({ open, step, onClose, onSave }) {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (!open || !step) return;
    form.setFieldsValue({
      title: step.title,
      duration: step.duration,
      goal: step.goal,
      activity: step.activity,
      resources: step.resources,
      scenario: step.scenario,
      flowSteps: createFlowStepsForForm(step, !isChinese),
    });
  }, [form, open, step]);

  const save = async () => {
    const values = await form.validateFields();
    const flow = composeFlowFromSteps(values.flowSteps);
    const teacherScript = composeScriptFromSteps(values.flowSteps) || step.teacherScript;
    onSave({
      ...step,
      title: values.title,
      duration: values.duration,
      goal: values.goal,
      activity: values.activity,
      flow,
      resources: values.resources,
      scenario: values.scenario,
      teacherScript,
    });
  };

  const rewrite = () => {
    form.setFieldsValue({
      goal: isChinese ? '通过沉浸式情境激发好奇心，建立学习动机。' : 'Spark curiosity through an immersive scenario and build learning motivation.',
      activity: isChinese ? '全班在任务情境中观察线索、朗读信息，并用目标语言完成初步回应。' : 'Students observe clues, read mission information, and respond with the target language.',
      resources: isChinese ? 'AI图像生成设备、投影仪、任务信件、情境图片。' : 'AI image generator, projector, mission letter, scenario images.',
      scenario: isChinese ? '通过神秘信号、角色任务和视觉线索，营造需要学生共同解决问题的课堂情境。' : 'Use mystery signals, role tasks, and visual clues to create a collaborative classroom challenge.',
    });
  };

  if (!open || !step) return null;

  return (
    <div className="mo on trd-edit-modal" id="mo-trd-edit" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal tbl-row-drawer open">
        <div className="trd-hd">
          <div>
            <div className="trd-title">{t('lesson.editLessonDetail')}</div>
            <div className="trd-subtitle">{isChinese ? 'Unit 3: Animals（神奇的动物） · 已有环节' : 'Unit 3: Animals · Existing Step'}</div>
          </div>
          <button className="trd-close" type="button" onClick={onClose} aria-label={t('common.close')}>×</button>
        </div>

        <Form form={form} className="trd-body lesson-design-form" layout="vertical">
          <div className="trd-main-panel">
            <div className="trd-intro">
              <div>
                <div className="trd-intro-title">{t('lesson.activityDraft')}</div>
                <div className="trd-intro-subtitle">{t('lesson.flowEditorTip')}</div>
              </div>
              <span className="as-right-tag">{isChinese ? '编辑中' : 'Editing'}</span>
            </div>

            <div className="as-draft-form trd-draft-form">
              <div className="as-draft-row trd-row-name">
                <Form.Item className="as-draft-field as-draft-name" label={t('lesson.stepName')} name="title">
                  <Input className="as-draft-input" placeholder={isChinese ? '例如：神秘来信与情绪感知' : 'Example: Mystery Letter and Emotion Sensing'} />
                </Form.Item>
                <Form.Item className="as-draft-field trd-time-field" label={t('lesson.stepDuration')} name="duration">
                  <Input className="as-draft-input" placeholder={isChinese ? '例如：8分钟' : 'Example: 8 min'} />
                </Form.Item>
              </div>

              <Form.Item className="as-draft-field" label={t('lesson.languageGoal')} name="goal">
                <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={isChinese ? '例如：通过沉浸式情境激发好奇心，建立学习动机。' : 'Example: Spark curiosity through an immersive scenario and build learning motivation.'} />
              </Form.Item>

              <Form.Item className="as-draft-field" label={t('lesson.activitySummary')} name="activity">
                <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={isChinese ? '例如：全班扮演飞船控制台员。' : 'Example: The class acts as spaceship control operators.'} />
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
                                  <TextArea className="flow-step-input flow-step-script" autoSize={{ minRows: 4, maxRows: 8 }} placeholder="例如：Shhh... Listen, everyone." />
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

                      <button type="button" className="flow-step-add" onClick={() => add({ title: isChinese ? '新步骤' : 'New Step', desc: '', teacher: '', cue: '' })}>+ {t('common.add')}</button>
                    </div>
                  )}
                </Form.List>
              </div>

              <div className="as-draft-row trd-resource-row">
                <Form.Item className="as-draft-field" label={t('lesson.teachingResources')} name="resources">
                  <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={isChinese ? '例如：AI图像生成设备、投影仪' : 'Example: AI image generator, projector'} />
                </Form.Item>
                <Form.Item className="as-draft-field" label={t('lesson.sceneSetup')} name="scenario">
                  <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder={isChinese ? '例如：星际信号接收站场景' : 'Example: Interstellar signal station'} />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>

        <div className="trd-ft">
          <button type="button" className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <div className="trd-ft-spacer" />
          <button type="button" className="tbl-btn-regen" onClick={rewrite}>{t('lesson.aiRewrite')}</button>
          <Button type="primary" className="btn-primary" onClick={save}>{t('lesson.saveChanges')}</Button>
        </div>
      </div>
    </div>
  );
}
