import React from 'react';
import { Button, Checkbox, Form, Input, Radio, Select, Upload } from 'antd';
import {
  Clock,
  Heart,
  ListChecks,
  MessageSquare,
  Paperclip,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Star,
  Target,
  Users,
  X,
} from 'lucide-react';
import { buildCourseMap } from './workflowData';

const { TextArea } = Input;

const ageOptions = ['3-6岁', '7-9岁', '9-12岁'];
const durationOptions = ['40分钟', '60分钟', '120分钟'];
const classSizeOptions = ['≤ 8人', '9-15人', '≥ 16人'];
const languageSkillOptions = ['听力理解', '口语表达', '阅读理解', '书面表达', '综合能力'];
const pathOptions = ['艺术表达', '体感探索', '音乐律动', 'AI 自动匹配'];
const atmosphereOptions = ['神秘探险感', '戏剧表演感', '温馨治愈感', '团队协作感', 'AI 自动匹配'];
const regenTips = [
  '希望在Execute创作运用阶段能有一个小组竞赛游戏，让产出更有挑战性。',
  '情境可以更科幻一些，比如在外星球完成这个任务。',
  '希望Engage情境启动更有悬念，像收到一封神秘任务信。',
  '希望成长罗盘更突出团队协作和解决问题的成就感。',
];

const journeyItems = [
  { title: 'Engage 情境启动', color: '#ff705f', key: 'engage' },
  { title: 'Empower 语言赋能', color: '#3b82f6', key: 'empower' },
  { title: 'Execute 创作运用', color: '#4f9f69', key: 'execute' },
  { title: 'Execute 创作运用', color: '#9b62d1', key: 'elevate' },
];

export function CourseMapView({ course, onCourseChange, onNext }) {
  const [editForm] = Form.useForm();
  const [regenForm] = Form.useForm();
  const [editOpen, setEditOpen] = React.useState(false);
  const [regenOpen, setRegenOpen] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const map = buildCourseMap(course);

  const taskName = course.taskName || course.theme || '情境任务';
  const journey = {
    engage: course.journey?.engage || `接到与“${taskName}”相关的任务线索，全班进入角色并明确今天要解决的问题。`,
    empower: course.journey?.empower || '学习完成任务所需的关键词、句型和表达策略，在示范与同伴练习中建立语言工具箱。',
    execute: course.journey?.execute || '小组合作完成创意产出，把语言工具用于真实表达，并根据同伴反馈优化作品。',
    elevate: course.journey?.elevate || '展示最终作品，回顾本节课的语言收获、合作表现和可迁移到生活中的成长经验。',
  };

  const openEdit = () => {
    editForm.setFieldsValue({
      courseTitle: map.title,
      age: course.age || map.age,
      duration: course.duration || map.duration,
      classSize: course.classSize || map.classSize,
      vocabularies: course.vocabularies || [],
      grammars: course.grammars || [],
      languageSkills: course.languageSkills || ['听力理解', '口语表达'],
      taskName,
      storyContext: course.storyContext || map.storyline,
      keyOutcome: course.keyOutcome || map.keyOutcome,
      experiencePath: course.experiencePath || map.path,
      specialRequirements: course.specialRequirements || '',
      atmosphere: course.atmosphere || 'AI 自动匹配',
      attachments: [],
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const values = await editForm.validateFields();
    const attachments = (values.attachments || []).map((file) => file.name).filter(Boolean);
    onCourseChange?.({
      ...course,
      ...values,
      title: values.courseTitle,
      theme: values.taskName,
      attachments: attachments.length ? attachments : course.attachments,
    });
    setEditOpen(false);
  };

  const fillRegenTip = (tip) => {
    const current = regenForm.getFieldValue('request')?.trim();
    regenForm.setFieldValue('request', current ? `${current}；${tip}` : tip);
  };

  const submitRegen = async () => {
    const values = await regenForm.validateFields();
    setRegenOpen(false);
    setRegenerating(true);
    window.setTimeout(() => {
      const request = values.request?.trim();
      onCourseChange?.({
        ...course,
        storyContext: request ? `${map.storyline} 根据调整需求：${request}` : map.storyline,
      });
      setRegenerating(false);
      regenForm.resetFields();
    }, 900);
  };

  return (
    <div className="fr-workflow-map-step view-overview-active">
      <div className="overview-panel-header">
        <h2 className="overview-panel-title">课程地图|Course Map</h2>
        <div className="overview-panel-actions">
          <Button className="btn-ghost" icon={<RefreshCw size={16} />} onClick={() => setRegenOpen(true)}>
            重新生成
          </Button>
          <Button className="btn-ghost primary" icon={<PencilLine size={16} />} onClick={openEdit}>编辑</Button>
        </div>
      </div>

      {regenerating ? (
        <div className="overview-regen-loading">
          <div className="spinner" />
          <span>正在重新生成课程地图...</span>
        </div>
      ) : (
        <div className="course-map-v2">
          <section className="course-map-v2-card">
            <div className="course-map-v2-tag">{map.path}</div>
            <h2 className="course-map-v2-title">{map.title}</h2>
            <div className="course-map-v2-meta">
              <span><Users />{map.age}</span>
              <span><Clock />{map.duration}</span>
              <span><ShieldCheck />{map.classSize}</span>
            </div>

            <div className="course-map-v2-core">
              <div className="course-map-v2-core-title">
                <Star size={18} />
                核心情境
                <span>Storyline</span>
              </div>
              <div className="course-map-v2-core-text">{map.storyline}</div>
            </div>

            <div className="course-map-v2-cover">
              <div className="overview-hero-img">
                <div className="course-map-cover-art" aria-hidden="true">
                  <div className="cm-kitchen-wall">
                    <span className="cm-cabinet left" />
                    <span className="cm-hood" />
                    <span className="cm-cabinet right" />
                    <span className="cm-stove" />
                    <span className="cm-counter" />
                  </div>
                  <div className="cm-character pear"><span className="cm-eye one" /><span className="cm-eye two" /><span className="cm-mouth" /></div>
                  <div className="cm-character brain"><span className="cm-eye one" /><span className="cm-eye two" /><span className="cm-mouth" /></div>
                  <div className="cm-character orange"><span className="cm-eye one" /><span className="cm-eye two" /><span className="cm-mouth" /></div>
                  <div className="cm-floor" />
                </div>
                <div className="img-overlay">
                  <Button icon={<RefreshCw size={16} />}>重新生成</Button>
                </div>
              </div>
            </div>
          </section>

          <section className="course-map-v2-panel">
            <div className="course-map-v2-panel-head">
              <div>
                <h3 className="course-map-v2-panel-title">课程目标解构</h3>
                <div className="course-map-v2-panel-kicker">
                  把故事、语言工具、成长目标和课堂旅程拆成可执行的设计依据。
                </div>
              </div>
              <div className="course-map-v2-panel-badge">Course Map</div>
            </div>

            <div className="course-map-v2-grid">
              <CourseGoal icon={MessageSquare} title="语言工具箱" en="Language Toolkit" color="#3b82f6">
                {map.toolkit}
              </CourseGoal>
              <CourseGoal icon={Target} title="最终产出" en="Key Outcome" color="#ff705f">
                {map.keyOutcome}
              </CourseGoal>
              <CourseGoal icon={Heart} title="成长罗盘" en="Growth Compass" color="#9b62d1">
                {map.growth}
              </CourseGoal>
              <CourseGoal icon={Users} title="核心体验" en="How We Learn" color="#4f9f69">
                {map.experience}
              </CourseGoal>

              <article className="course-map-v2-goal wide">
                <div className="course-map-v2-goal-title">
                  <span className="course-map-v2-icon" style={{ '--goal-color': '#ff705f' }}>
                    <ListChecks size={18} />
                  </span>
                  课堂旅程
                  <span className="course-map-v2-title-en">Class Journey</span>
                </div>
                <div className="course-map-v2-journey">
                  {journeyItems.map((item, index) => (
                    <div className="course-map-v2-journey-step" style={{ '--phase-color': item.color }} key={item.key}>
                      <div className="course-map-v2-journey-body">
                        <strong>
                          <span className="course-map-v2-journey-node">{index + 1}</span>
                          {item.title}
                        </strong>
                        <div>{journey[item.key]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      )}

      {regenOpen && (
        <div className="modal-overlay overview-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setRegenOpen(false)}>
          <div className="modal overview-regen-modal">
            <div className="modal-hd">
              <div className="modal-t">重新生成课程地图</div>
              <button type="button" className="modal-x" onClick={() => setRegenOpen(false)}><X size={22} /></button>
            </div>
            <div className="modal-body">
              <Form form={regenForm} layout="vertical" className="overview-ant-form">
                <Form.Item label="请告诉我们，您希望如何调整？" name="request">
                  <TextArea
                    className="fi textarea"
                    rows={5}
                    placeholder={'例如：\n希望在Execute创作运用阶段能有一个小组竞赛游戏，让产出更有挑战性。\n\n情境可以更科幻一些，比如在外星球完成这个任务。'}
                  />
                </Form.Item>
              </Form>
              <div className="regen-tips">
                <span className="regen-tip-label">AI生成调整需求参考：</span>
                {regenTips.map((tip) => (
                  <button type="button" className="regen-tip-chip" key={tip} onClick={() => fillRegenTip(tip)}>
                    {tip}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-ft">
              <button type="button" className="mo-btn-cancel" onClick={() => setRegenOpen(false)}>取消</button>
              <button type="button" className="mo-btn-primary" onClick={submitRegen}>
                <RefreshCw size={14} />
                重新生成
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="modal-overlay overview-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setEditOpen(false)}>
          <div className="modal overview-adjust-modal">
            <div className="modal-hd">
              <div>
                <div className="modal-t">编辑课程地图生成输入</div>
                <div className="modal-sub">
                  与新建课程保持同一套信息结构；保存后会重新生成课程地图中的故事线、语言工具箱、课堂旅程与成长体验。
                </div>
              </div>
              <button type="button" className="modal-x" onClick={() => setEditOpen(false)}><X size={22} /></button>
            </div>
            <div className="modal-body overview-adjust-body">
              <Form form={editForm} layout="vertical" className="overview-ant-form">
                <ModalSection title="设定课程起点" en="Set the Course" desc="明确本节课的语言“工具箱”与学员画像。">
                  <Form.Item label="课程名称" name="courseTitle" rules={[{ required: true, message: '请输入课程名称' }]}>
                    <Input className="fi" placeholder="例如：Unit 3: Animals（神奇的动物）" autoComplete="off" />
                  </Form.Item>
                  <div className="overview-adjust-three">
                    <Form.Item label="学生年龄" name="age">
                      <Radio.Group optionType="button" buttonStyle="solid" options={ageOptions} />
                    </Form.Item>
                    <Form.Item label="课程时长" name="duration">
                      <Radio.Group optionType="button" buttonStyle="solid" options={durationOptions} />
                    </Form.Item>
                    <Form.Item label="班级规模" name="classSize">
                      <Radio.Group optionType="button" buttonStyle="solid" options={classSizeOptions} />
                    </Form.Item>
                  </div>
                  <div className="overview-adjust-two">
                    <Form.Item label="核心词汇" name="vocabularies">
                      <Select mode="tags" tokenSeparators={['、', ',', '，']} placeholder="例如：happy、sad、angry、calm" />
                    </Form.Item>
                    <Form.Item label="核心语法/句型" name="grammars">
                      <Select mode="tags" tokenSeparators={['、', ',', '，']} placeholder="例如：I feel... because... / Can you...?" />
                    </Form.Item>
                  </div>
                  <Form.Item label="语言能力培养侧重（可多选）" name="languageSkills">
                    <Checkbox.Group options={languageSkillOptions} />
                  </Form.Item>
                </ModalSection>

                <ModalSection title="构思情境任务" en="Design the Adventure" desc="设计一个需要用到这个“工具箱”的有趣故事和挑战。">
                  <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请输入任务名称' }]}>
                    <Input className="fi" placeholder="例如：森林星光音乐会策划案、情绪怪兽安抚行动" autoComplete="off" />
                  </Form.Item>
                  <Form.Item label="故事情境" name="storyContext">
                    <TextArea className="fi textarea" rows={4} placeholder="用一两句话设定角色、场景、问题/需求与要做的关键事。" />
                  </Form.Item>
                  <Form.Item label="终极产出/作品" name="keyOutcome">
                    <TextArea className="fi textarea" rows={3} placeholder="例如：每个小组将创作并表演一段30秒的“情绪天气广播剧”。" />
                  </Form.Item>
                </ModalSection>

                <ModalSection title="选择体验路径" en="Choose the Path" desc="选择一种最能让孩子们沉浸其中的探索方式。">
                  <Form.Item name="experiencePath">
                    <Radio.Group optionType="button" buttonStyle="solid" options={pathOptions} />
                  </Form.Item>
                </ModalSection>

                <ModalSection title="添加个性魔法" en="Add Your Magic" desc="（可选）融入你的独特巧思与具体要求。">
                  <Form.Item label="特定要求/资源链接" name="specialRequirements">
                    <TextArea
                      className="fi textarea"
                      rows={4}
                      placeholder="例如：必须使用附件中的绘本故事；请避免使用某类教具；希望融入关于分享的小故事。"
                    />
                  </Form.Item>
                  <Form.Item name="attachments" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList || []}>
                    <Upload beforeUpload={() => false} multiple>
                      <button type="button" className="attachment-btn">
                        <Paperclip size={13} />
                        添加附件
                      </button>
                    </Upload>
                  </Form.Item>
                  <Form.Item label="氛围偏好（可选，不选则由 AI 自动匹配）" name="atmosphere">
                    <Radio.Group optionType="button" buttonStyle="solid" options={atmosphereOptions} />
                  </Form.Item>
                </ModalSection>
              </Form>
            </div>
            <div className="modal-ft">
              <button type="button" className="mo-btn-cancel" onClick={() => setEditOpen(false)}>取消</button>
              <button type="button" className="mo-btn-primary" onClick={saveEdit}>保存并刷新地图</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalSection({ title, en, desc, children }) {
  return (
    <section className="overview-adjust-section">
      <div className="overview-adjust-section-title">
        {title}
        <span>| {en}</span>
      </div>
      <div className="overview-adjust-section-desc">{desc}</div>
      {children}
    </section>
  );
}

function CourseGoal({ icon: Icon, title, en, color, children }) {
  return (
    <article className="course-map-v2-goal">
      <div className="course-map-v2-goal-title">
        <span className="course-map-v2-icon" style={{ '--goal-color': color }}>
          {React.createElement(Icon, { size: 18 })}
        </span>
        {title}
        <span className="course-map-v2-title-en">{en}</span>
      </div>
      <div className="course-map-v2-text">{children}</div>
    </article>
  );
}
