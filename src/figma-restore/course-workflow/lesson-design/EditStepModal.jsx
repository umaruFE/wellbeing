import React from 'react';
import { Button, Form, Input } from 'antd';
import { composeFlowFromSteps, composeScriptFromSteps, createFlowStepsForForm } from './lessonDesignUtils';

const { TextArea } = Input;

export function EditStepModal({ open, step, onClose, onSave }) {
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
      flowSteps: createFlowStepsForForm(step),
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
      goal: '通过沉浸式情境激发好奇心，建立学习动机。',
      activity: '全班在任务情境中观察线索、朗读信息，并用目标语言完成初步回应。',
      resources: 'AI图像生成设备、投影仪、任务信件、情境图片。',
      scenario: '通过神秘信号、角色任务和视觉线索，营造需要学生共同解决问题的课堂情境。',
    });
  };

  if (!open || !step) return null;

  return (
    <div className="mo on trd-edit-modal" id="mo-trd-edit" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal tbl-row-drawer open">
        <div className="trd-hd">
          <div>
            <div className="trd-title">编辑环节</div>
            <div className="trd-subtitle">Unit 3: Animals（神奇的动物） · 已有环节</div>
          </div>
          <button className="trd-close" type="button" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <Form form={form} className="trd-body lesson-design-form" layout="vertical">
          <div className="trd-main-panel">
            <div className="trd-intro">
              <div>
                <div className="trd-intro-title">活动草案</div>
                <div className="trd-intro-subtitle">按真实上课顺序填写：先设计活动内容，再补充教师语言与引导动作。</div>
              </div>
              <span className="as-right-tag">编辑中</span>
            </div>

            <div className="as-draft-form trd-draft-form">
              <div className="as-draft-row trd-row-name">
                <Form.Item className="as-draft-field as-draft-name" label="环节名称" name="title">
                  <Input className="as-draft-input" placeholder="例如：神秘来信与情绪感知" />
                </Form.Item>
                <Form.Item className="as-draft-field trd-time-field" label="预估时长" name="duration">
                  <Input className="as-draft-input" placeholder="例如：8分钟" />
                </Form.Item>
              </div>

              <Form.Item className="as-draft-field" label="语言目标" name="goal">
                <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder="例如：通过沉浸式情境激发好奇心，建立学习动机。" />
              </Form.Item>

              <Form.Item className="as-draft-field" label="活动概述" name="activity">
                <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder="例如：全班扮演飞船控制台员。" />
              </Form.Item>

              <div className="as-draft-field">
                <label className="as-draft-lbl">活动流程</label>
                <Form.List name="flowSteps">
                  {(fields, { add, remove }) => (
                    <div className="flow-step-editor" id="trdFlowSteps">
                      <div className="flow-step-editor-head">
                        <div>
                          <div className="flow-step-editor-title">课堂执行流程</div>
                          <div className="flow-step-editor-tip">按真实上课顺序填写：先设计活动内容，再补充教师语言与引导动作。</div>
                        </div>
                        <div className="flow-step-editor-badge">{fields.length} 个步骤</div>
                      </div>

                      {fields.map((field, index) => (
                        <div className="flow-step-row" key={field.key}>
                          <div className="flow-step-rail">
                            <div className="flow-step-index">{index + 1}</div>
                            <div className="flow-step-line" />
                          </div>
                          <div className="flow-step-fields">
                            <div className="flow-step-card-head">
                              <div className="flow-step-mini-label">步骤名称</div>
                              <Form.Item name={[field.name, 'title']} noStyle>
                                <Input className="flow-step-input flow-step-title" placeholder="例如：创设悬念" />
                              </Form.Item>
                              <button type="button" className="flow-step-del" disabled={fields.length <= 1} onClick={() => fields.length > 1 && remove(field.name)} aria-label="删除步骤">×</button>
                            </div>

                            <div className="flow-step-body-grid">
                              <div className="flow-step-section">
                                <div className="flow-step-section-title">活动内容</div>
                                <Form.Item name={[field.name, 'desc']} noStyle>
                                  <TextArea className="flow-step-input flow-step-desc" autoSize={{ minRows: 4, maxRows: 8 }} placeholder="这一步学生会看到什么、做什么、完成什么？" />
                                </Form.Item>
                              </div>
                              <div className="flow-step-section guidance teacher-script">
                                <div className="flow-step-section-title">教师引导 / 教师语言</div>
                                <Form.Item name={[field.name, 'teacher']} noStyle>
                                  <TextArea className="flow-step-input flow-step-script" autoSize={{ minRows: 4, maxRows: 8 }} placeholder="例如：Shhh... Listen, everyone." />
                                </Form.Item>
                              </div>
                              <div className="flow-step-section guidance cue-script">
                                <div className="flow-step-section-title">动作 / 引导提示</div>
                                <Form.Item name={[field.name, 'cue']} noStyle>
                                  <TextArea className="flow-step-input flow-step-cue" autoSize={{ minRows: 4, maxRows: 8 }} placeholder="例如：神秘地举起信封；停顿等待学生自然回应" />
                                </Form.Item>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button type="button" className="flow-step-add" onClick={() => add({ title: '新步骤', desc: '', teacher: '', cue: '' })}>+ 添加步骤</button>
                    </div>
                  )}
                </Form.List>
              </div>

              <div className="as-draft-row trd-resource-row">
                <Form.Item className="as-draft-field" label="教学资源" name="resources">
                  <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder="例如：AI图像生成设备、投影仪" />
                </Form.Item>
                <Form.Item className="as-draft-field" label="情境创设" name="scenario">
                  <TextArea className="as-draft-textarea" autoSize={{ minRows: 3, maxRows: 5 }} placeholder="例如：星际信号接收站场景" />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>

        <div className="trd-ft">
          <button type="button" className="btn-ghost" onClick={onClose}>取消</button>
          <div className="trd-ft-spacer" />
          <button type="button" className="tbl-btn-regen" onClick={rewrite}>AI重写</button>
          <Button type="primary" className="btn-primary" onClick={save}>保存更改</Button>
        </div>
      </div>
    </div>
  );
}
