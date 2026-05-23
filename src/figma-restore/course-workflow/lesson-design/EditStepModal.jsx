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

  if (!open || !step) return null;

  return (
    <div className="mo on trd-edit-modal" id="mo-trd-edit" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal tbl-row-drawer open">
        <div className="trd-hd">
          <div>
            <div className="trd-title">编辑教案细节</div>
            <div className="trd-subtitle">字段与新增环节草案保持一致；保存后会同步更新环节卡片与详情页。</div>
          </div>
          <button className="trd-close" type="button" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <Form form={form} className="trd-body lesson-design-form" layout="vertical">
          <section className="trd-section">
            <div className="trd-section-title">基础信息</div>
            <div className="trd-grid-2">
              <Form.Item className="fg" label="环节名称" name="title">
                <Input className="fi" placeholder="例如：神秘来信与情绪感知" />
              </Form.Item>
              <Form.Item className="fg" label="环节时长" name="duration">
                <Input className="fi" placeholder="例如：4分钟" />
              </Form.Item>
            </div>
          </section>

          <section className="trd-section">
            <div className="trd-section-title">目标与概述</div>
            <Form.Item className="fg" label="语言目标" name="goal">
              <TextArea className="fi" placeholder="例如：听力输入：核心情绪词（sad, happy, lonely, bored），核心句型 Let’s help…" />
            </Form.Item>
            <Form.Item className="fg" label="活动概述" name="activity">
              <TextArea className="fi" placeholder="用 1-2 句话说明老师和学生在本环节中主要做什么。" />
            </Form.Item>
          </section>

          <section className="trd-section">
            <div className="trd-section-title">教学执行</div>
            <div className="fg">
              <label className="fl">活动流程</label>
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
                          </div>
                          <div className="flow-step-body-grid">
                            <div className="flow-step-section">
                              <div className="flow-step-section-title">活动内容</div>
                              <Form.Item name={[field.name, 'desc']} noStyle>
                                <TextArea className="flow-step-input flow-step-desc" placeholder="这一步学生会看到什么、做什么、完成什么？" />
                              </Form.Item>
                            </div>
                            <div className="flow-step-section guidance">
                              <div className="flow-step-section-title">教师引导</div>
                              <div className="flow-step-script-grid">
                                <div>
                                  <div className="flow-step-mini-label">教师语言</div>
                                  <Form.Item name={[field.name, 'teacher']} noStyle>
                                    <TextArea className="flow-step-input flow-step-script" placeholder="例如：Shhh... Listen, everyone." />
                                  </Form.Item>
                                </div>
                                <div>
                                  <div className="flow-step-mini-label">动作/引导提示</div>
                                  <Form.Item name={[field.name, 'cue']} noStyle>
                                    <TextArea className="flow-step-input flow-step-cue" placeholder="例如：神秘地举起信封；停顿等待学生自然回应" />
                                  </Form.Item>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button type="button" className="flow-step-del" disabled={fields.length <= 1} onClick={() => fields.length > 1 && remove(field.name)}>×</button>
                      </div>
                    ))}
                    <button type="button" className="flow-step-add" onClick={() => add({ title: '新步骤', desc: '', teacher: '', cue: '' })}>+ 添加步骤</button>
                  </div>
                )}
              </Form.List>
            </div>
          </section>

          <section className="trd-section">
            <div className="trd-section-title">资源与情境</div>
            <div className="trd-grid-even">
              <Form.Item className="fg" label="教学资源" name="resources">
                <TextArea className="fi" placeholder="例如：特大号装饰信封、求救信、动物轮廓表情图。" />
              </Form.Item>
              <Form.Item className="fg" label="情境创设" name="scenario">
                <TextArea className="fi" placeholder="例如：教室布置森林或动物园元素，教师佩戴园长徽章。" />
              </Form.Item>
            </div>
          </section>
        </Form>

        <div className="trd-ft">
          <button type="button" className="tbl-btn-regen" onClick={() => form.setFieldsValue({
            goal: '听力输入核心词汇与核心句型，在情境中理解并尝试回应。',
            activity: '教师通过道具、图片和角色扮演引入任务，激发学生观察、猜测与表达。',
            resources: '任务信件、情境图片、投影设备、角色道具',
            scenario: '通过角色身份、任务线索和教室布置建立沉浸式情境。',
          })}
          >
            ↺ AI重写
          </button>
          <Button type="primary" className="neo-btn-primary" onClick={save}>保存更改</Button>
        </div>
      </div>
    </div>
  );
}
