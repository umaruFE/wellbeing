import React from 'react';
import { Button, Form, Input, InputNumber } from 'antd';
import {
  ChevronRight,
  Clock,
  ClipboardList,
  Copy,
  Heart,
  Image as ImageIcon,
  ListChecks,
  MoreVertical,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Sparkles,
  SlidersHorizontal,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { AdjustStepModal } from './lesson-design/AdjustStepModal';
import { EditStepModal } from './lesson-design/EditStepModal';
import { StepCardActions } from './lesson-design/StepCardActions';
import { StepDetailModal } from './lesson-design/StepDetailModal';
import { buildStepFlowItems } from './lesson-design/lessonDesignUtils';

const { TextArea } = Input;

const quickIdeas = [
  { label: '角色扮演', text: '设计一个让学生通过角色扮演来练习目标句型的活动' },
  { label: '小组合作', text: '设计一个通过小组合作完成任务的活动' },
  { label: '游戏化', text: '设计一个利用游戏机制激发学生参与的活动' },
  { label: '真实情境', text: '设计一个结合真实情境让学生运用目标语言的活动' },
  { label: '动手操作', text: '设计一个需要学生动手操作的活动' },
];

const classicActivities = [
  { icon: '🎱', name: 'Bingo 游戏', meta: '词汇复习' },
  { icon: '🤔', name: '猜单词', meta: '听说练习' },
  { icon: '🎭', name: '情景对话', meta: '口语输出' },
  { icon: '🃏', name: '闪卡翻转', meta: '词汇记忆' },
  { icon: '🧩', name: '拼图阅读', meta: '阅读理解' },
  { icon: '🎨', name: '我画你猜', meta: '词汇运用' },
];

const defaultFlowSteps = [
  { title: '创设悬念', desc: '', teacher: '', cue: '' },
  { title: '朗读来信', desc: '', teacher: '', cue: '' },
  { title: '情绪感知', desc: '', teacher: '', cue: '' },
  { title: '发布任务', desc: '', teacher: '', cue: '' },
];

const defaultDraft = {
  title: '',
  time: 8,
  goal: '',
  activity: '',
  flowSteps: defaultFlowSteps,
  resources: '',
  scenario: '',
};

const lessonDesignPhases = [
  {
    key: 'eng',
    phase: 'Engage',
    title: 'E-Engage',
    name: '引入',
    duration: '15 分钟',
    steps: [
      {
        title: '星际信号接收站',
        duration: '8分钟',
        goal: '通过沉浸式情境激发好奇心，建立学习动机',
        activity: '全班扮演宇飞船控制台员',
        flow: '教师激活AI生成图像，引入情境',
        resources: 'AI图像生成设备、投影仪',
        scenario: '星际信号接收站场景',
        teacherScript: '大家注意！激活频道1——动物星球信号已锁定！',
      },
      {
        title: '动物能量球在哪里？',
        duration: '8分钟',
        goal: '自然语言方位介词，建立个人意义感',
        activity: '展示透明亚克力能量球',
        flow: '教师出示能量球，引导学生观察',
        resources: '透明亚克力能量球、毛绒动物玩具',
        scenario: '能量球发现场景',
        teacherScript: '看！这就是Nebula的能量球——里面住着谁？',
      },
    ],
  },
  {
    key: 'emp',
    phase: 'Empower',
    title: 'E-Empower',
    name: '赋能',
    duration: '15 分钟',
    steps: [
      {
        title: '救援地图解码器',
        duration: '8分钟',
        goal: '高频互动输入目标词汇，建立听觉-视觉-动觉三重联结',
        activity: '教师用AI闪卡展示动物图像',
        flow: '学生跟读并做TPR动作',
        resources: 'AI闪卡、动物图片',
        scenario: '救援地图解码场景',
        teacherScript: "Look at the map! There's a cat — where is it? Point! It's ON the rock!",
      },
      {
        title: '动物位置快闪挑战',
        duration: '5分钟',
        goal: '在快速辨认中巩固 in / on / under 的听辨与口头回应',
        activity: '学生根据闪卡和教师指令快速做动作或回答',
        flow: '快速示范：教师展示动物与位置卡。\n听音判断：学生根据指令站到对应区域。\n同伴互问：两人一组用 Where is...? 互相提问。\n全班校对：教师强化易错发音和介词。',
        resources: '动物闪卡、位置地垫、计时器',
        scenario: '控制台正在解锁救援路线，需要快速输入正确位置密码',
        teacherScript: 'Where is the fox? Is it in the box or under the box?',
      },
      {
        title: '小队口令训练',
        duration: '4分钟',
        goal: '用目标句型完成小组内低压力输出',
        activity: '小队轮流发布位置口令并完成动作回应',
        flow: '分配角色：队长发布口令。\n轮流挑战：队员按口令移动动物卡。\n语言升级：加入完整回答 It is...。\n小队加分：完成三轮获得能量徽章。',
        resources: '动物卡、任务徽章、小队计分板',
        scenario: '救援小队进行出发前的口令校准',
        teacherScript: 'Captain, give your team one command. Team, answer in a full sentence.',
      },
    ],
  },
  {
    key: 'exc',
    phase: 'Execute',
    title: 'E-Execute',
    name: '实践',
    duration: '15 分钟',
    steps: [
      {
        title: '建造动物家园发射台',
        duration: '8分钟',
        goal: '在真实任务驱动下综合运用方位介词与句型',
        activity: '小组合作布置动物家园模型',
        flow: '学生选择动物、摆放位置并描述位置关系',
        resources: '积木、动物卡、位置标签',
        scenario: '动物星球基地建设现场',
        teacherScript: 'Put the rabbit under the tree. Tell your team where it is.',
      },
      {
        title: '动物家园设计图',
        duration: '5分钟',
        goal: '把口语表达转化为可视化设计，强化空间关系表达',
        activity: '学生画出动物家园草图并标注位置',
        flow: '选择动物：每组领取三张动物卡。\n绘制草图：画出树、河、房子等场景。\n标注位置：写下 in / on / under。\n同伴检查：互相读出位置并修正。',
        resources: '设计纸、彩笔、动物贴纸',
        scenario: '发射台需要先提交动物家园建设蓝图',
        teacherScript: 'Draw your animal home. Write one sentence: The cat is on the roof.',
      },
      {
        title: '小组搭建与彩排',
        duration: '6分钟',
        goal: '在协作中整合语言工具并准备最终展示',
        activity: '小组搭建模型并练习介绍台词',
        flow: '分工搭建：学生负责动物、场景、介绍。\n语言排练：每人至少说一句位置句。\n教师巡视：及时提供词汇和句型支持。\n完成定稿：准备展示顺序。',
        resources: '积木、纸板、动物模型、句型提示卡',
        scenario: '动物星球基地进入最终组装阶段',
        teacherScript: 'Everyone needs one sentence. Practice with your group before launch.',
      },
      {
        title: '救援路线测试',
        duration: '4分钟',
        goal: '用问答方式验证作品中的位置表达是否清晰',
        activity: '小组互访并根据对方描述找到动物',
        flow: '互访开始：一组描述，另一组寻找。\n提问确认：Where is the...?。\n修正表达：根据同伴反应调整句子。\n记录亮点：写下一个最清楚的表达。',
        resources: '互评卡、路线贴纸、动物模型',
        scenario: '发射前最后一次路线校准',
        teacherScript: 'Ask your friends. Can they find the animal with your English?',
      },
    ],
  },
  {
    key: 'elv',
    phase: 'Elevate',
    title: 'E-Elevate',
    name: '升华',
    duration: '15 分钟',
    steps: [
      {
        title: '星球救援发布会',
        duration: '8分钟',
        goal: '通过展示与反馈建立成就感，迁移课堂语言到真实表达',
        activity: '每组展示动物家园并接受同伴提问',
        flow: '小组展示、同伴提问、教师总结语言亮点',
        resources: '展示台、贴纸奖励、评价卡',
        scenario: '救援任务总结发布会',
        teacherScript: 'Tell us your animal home. Where is the cat? What did your team make?',
      },
      {
        title: '救援徽章复盘',
        duration: '5分钟',
        goal: '回顾语言收获和团队协作体验，形成可迁移的成长感',
        activity: '学生选择一枚徽章并说出自己的课堂贡献',
        flow: '选择徽章：语言星、合作星、创意星。\n说出证据：学生用一句话描述贡献。\n同伴感谢：对队友表达感谢。\n教师总结：连接到下次真实使用场景。',
        resources: '徽章贴纸、出口条、反思卡',
        scenario: '救援任务完成后的成长认证仪式',
        teacherScript: 'Choose one badge. Why did you earn it today?',
      },
    ],
  },
];

export function LessonPlanView({ onPhasesChange, onNext }) {
  const [addForm] = Form.useForm();
  const [data, setData] = React.useState(lessonDesignPhases);
  const [openCards, setOpenCards] = React.useState(() => new Set(['eng-1', 'emp-0', 'exc-0', 'elv-0']));
  const [menuKey, setMenuKey] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [detailTarget, setDetailTarget] = React.useState(null);
  const [adjustTarget, setAdjustTarget] = React.useState(null);
  const [adjustText, setAdjustText] = React.useState('');
  const [adjustChips, setAdjustChips] = React.useState([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addPhase, setAddPhase] = React.useState(null);
  const [genMode, setGenMode] = React.useState('ai');
  const [selectedClassic, setSelectedClassic] = React.useState(null);
  const [ideaText, setIdeaText] = React.useState('');

  const updateData = (next) => {
    setData(next);
    onPhasesChange?.(next);
  };

  const toggleCard = (cardKey) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardKey)) next.delete(cardKey);
      else next.add(cardKey);
      return next;
    });
  };

  const openEdit = (phaseKey, stepIndex, step) => {
    const phase = data.find((item) => item.key === phaseKey);
    setEditing({ phaseKey, stepIndex, step, phase });
    setMenuKey(null);
  };

  const openDetail = (phaseKey, stepIndex, step) => {
    const phase = data.find((item) => item.key === phaseKey);
    setDetailTarget({ phaseKey, stepIndex, step, phase });
    setMenuKey(null);
  };

  const openAdjust = (phaseKey, stepIndex, step) => {
    const phase = data.find((item) => item.key === phaseKey);
    setAdjustTarget({ phaseKey, stepIndex, step, phase });
    setAdjustText('');
    setAdjustChips([]);
    setMenuKey(null);
  };

  const openAddStep = (phase) => {
    setAddPhase(phase);
    setGenMode('ai');
    setSelectedClassic(null);
    setIdeaText('');
    addForm.setFieldsValue(defaultDraft);
    setAddOpen(true);
  };

  const fillIdea = (text) => {
    setIdeaText((current) => (current ? `${current}，${text}` : text));
  };

  const fillDraftFromIdea = (source = ideaText, classicName = '') => {
    const theme = classicName || source || '小组合作挑战';
    addForm.setFieldsValue({
      title: classicName || '星球任务挑战',
      time: 8,
      goal: '在真实任务中理解并运用目标词汇与句型，提升听说表达的自信。',
      activity: `学生围绕“${theme}”完成分组互动，并在过程中使用目标语言进行沟通。`,
      flowSteps: [
        {
          title: '创设悬念',
          desc: '教师展示任务线索，快速建立活动情境和角色身份。',
          teacher: 'Shhh... Listen, everyone. A new mission is coming.',
          cue: '神秘地展示任务线索；停顿等待学生自然回应',
        },
        {
          title: '朗读来信',
          desc: '教师示范目标表达，学生跟读并理解关键语言。',
          teacher: 'Let me read the message. Please listen for the key words.',
          cue: '放慢语速朗读；指向关键词图片或板书',
        },
        {
          title: '情绪感知',
          desc: '学生分组完成互动任务，教师巡视并提供语言支持。',
          teacher: 'How do they feel? Can you show me with your face?',
          cue: '用表情和手势示范；鼓励学生用短句回应',
        },
        {
          title: '发布任务',
          desc: '小组展示结果，教师总结语言亮点并给出下一步挑战。',
          teacher: "Now let's try it together. Work with your team.",
          cue: '指向任务卡；确认每组知道要完成的产出',
        },
      ],
      resources: '任务卡、图片卡、计时器、奖励贴纸',
      scenario: '课堂变成任务现场，学生以小队身份完成阶段挑战。',
    });
  };

  const addDraftStep = async () => {
    const values = await addForm.validateFields();
    const target = addPhase || data[0];
    const flowSteps = (values.flowSteps?.length ? values.flowSteps : defaultFlowSteps)
      .map((item, index) => ({
        title: item?.title || defaultFlowSteps[index]?.title || `步骤${index + 1}`,
        desc: item?.desc || '',
        teacher: item?.teacher || '',
        cue: item?.cue || '',
      }));
    const flow = flowSteps.map((item) => `${item.title}：${item.desc}`).join('\n');
    const teacherScript = flowSteps
      .map((item) => [item.teacher, item.cue ? `【动作/引导】${item.cue}` : ''].filter(Boolean).join(' '))
      .filter(Boolean)
      .join('\n');
    const nextStep = {
      title: values.title || '新活动环节',
      duration: `${values.time || 8}分钟`,
      goal: values.goal || '',
      activity: values.activity || '',
      flow,
      resources: values.resources || '',
      scenario: values.scenario || '',
      teacherScript: teacherScript || 'Let’s try this mission together. Listen, speak, and help your team.',
    };
    updateData(data.map((phase) => (
      phase.key === target.key ? { ...phase, steps: [...phase.steps, nextStep] } : phase
    )));
    setOpenCards((prev) => new Set(prev).add(`${target.key}-${target.steps.length}`));
    setAddOpen(false);
  };

  const saveEdit = (values) => {
    updateData(data.map((phase) => {
      if (phase.key !== editing.phaseKey) return phase;
      return {
        ...phase,
        steps: phase.steps.map((step, index) => (index === editing.stepIndex ? values : step)),
      };
    }));
    setEditing(null);
    setDetailTarget(null);
  };

  const confirmAdjust = () => {
    if (!adjustTarget || !adjustText.trim()) return;
    updateData(data.map((phase) => {
      if (phase.key !== adjustTarget.phaseKey) return phase;
      return {
        ...phase,
        steps: phase.steps.map((step, index) => (
          index === adjustTarget.stepIndex
            ? { ...step, goal: `${step.goal}\n调整方向：${adjustText.trim()}` }
            : step
        )),
      };
    }));
    setAdjustTarget(null);
  };

  return (
    <div id="ed-tbl">
      <div className="tbl-inner-toolbar">
        <div className="tbl-ib-left">
          <button type="button" className="tbl-ib-btn" disabled title="撤回 (Ctrl+Z)"><RotateCcw size={14} /></button>
          <button type="button" className="tbl-ib-btn" disabled title="恢复 (Ctrl+Y)"><RotateCw size={14} /></button>
          <span className="tbl-ib-sep" />
          <span className="tbl-ib-label">教案设计</span>
        </div>
        <div className="tbl-ib-right">
          <div className="asi-dot-sm" />
          <span className="asi-label-sm">已保存</span>
        </div>
      </div>

      <div className="tbl-kanban">
        {data.map((phase) => (
          <section className={`tbl-phase-card ${phase.key}`} data-fixed="true" data-duration="15" key={phase.key}>
            <div className="tbl-phase-hd">
              <div className="tbl-phase-hd-left">
                <span className="tbl-phase-title">{phase.title}</span>
                <span className="tbl-phase-cn">{phase.name}</span>
                <button className="tbl-phase-edit-btn" title="查看阶段详情" aria-label="查看阶段详情">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
            <div className="tbl-phase-meta">
              <span className="tbl-phase-sub">{phase.steps.length} 个环节</span>
              <span className="tbl-phase-meta-dur"><Clock />{phase.duration}</span>
            </div>

            <div className="tbl-steps-list">
              <div className="tbl-add-step-top">
                <button type="button" className="tbl-add-step-btn" onClick={() => openAddStep(phase)}>
                  <Plus size={12} />
                  添加环节
                </button>
              </div>

              {phase.steps.map((step, index) => {
                const cardKey = `${phase.key}-${index}`;
                const isOpen = openCards.has(cardKey);
                return (
                  <article
                    className={`step-card ${isOpen ? 'open' : ''}`}
                    key={cardKey}
                    onClick={() => toggleCard(cardKey)}
                  >
                    <div className="step-summary">
                      <div className="step-chevron"><ChevronRight size={12} /></div>
                      <button type="button" className="step-thumb-placeholder" title="点击生成图片" onClick={(event) => event.stopPropagation()}>
                        <ImageIcon size={20} />
                      </button>
                      <div className="step-main">
                        <div className="step-name">
                          <span className="step-title-text">{step.title}</span>
                          <span className="step-dur-badge">{step.duration}</span>
                        </div>
                        <div className="step-lo-preview">{step.goal}</div>
                      </div>
                      <div className="step-right-ctrl" onClick={(event) => event.stopPropagation()}>
                        <button
                          className={`step-menu-btn ${menuKey === cardKey ? 'active' : ''}`}
                          title="操作"
                          onClick={() => setMenuKey(menuKey === cardKey ? null : cardKey)}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {!isOpen && (
                          <StepMenu
                            open={menuKey === cardKey}
                            onRegen={() => {
                              setMenuKey(null);
                              openAddStep(phase);
                            }}
                            onAdjust={() => openAdjust(phase.key, index, step)}
                          />
                        )}
                      </div>
                    </div>

                    <div className="step-detail" data-brief-enhanced="1" onClick={(event) => event.stopPropagation()}>
                      <div className="step-brief-list">
                        <div className="step-brief-item">
                          <div className="step-detail-label"><Target size={13} />语言目标</div>
                          <div className="step-detail-body tbl-lo" contentEditable suppressContentEditableWarning spellCheck={false}>
                            {step.goal}
                          </div>
                        </div>
                        <div className="step-brief-item">
                          <div className="step-detail-label"><ClipboardList size={13} />活动概述</div>
                          <div className="step-detail-body" contentEditable suppressContentEditableWarning spellCheck={false}>
                            {step.activity}
                          </div>
                        </div>
                        <div className="step-brief-item">
                          <div className="step-detail-label"><ListChecks size={13} />活动流程</div>
                          <div className="step-flow-card">
                            <div className="step-flow-list">
                              {buildStepFlowItems(step).map((item) => (
                                <div className="step-flow-item" key={`${cardKey}-${item.title}`}>
                                  <span className="step-flow-dot" />
                                  <div>
                                    <div className="step-flow-title">{item.title}</div>
                                    <div className="step-flow-desc">{item.desc}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="step-hidden-fields">
                          <div className="step-detail-label">活动流程原文</div>
                          <div className="step-detail-body" contentEditable suppressContentEditableWarning spellCheck={false}>{step.flow}</div>
                          <div className="step-detail-label">教学资源</div>
                          <div className="step-detail-body" contentEditable suppressContentEditableWarning spellCheck={false}>{step.resources}</div>
                          <div className="step-detail-label">情境创设</div>
                          <div className="step-detail-body" contentEditable suppressContentEditableWarning spellCheck={false}>{step.scenario}</div>
                          <div className="step-detail-label">教师语言与引导</div>
                          <div className="step-script tbl-script" contentEditable suppressContentEditableWarning spellCheck={false}>
                            <span className="tbl-q">“</span>{step.teacherScript}
                          </div>
                        </div>
                      </div>
                      <StepCardActions
                        onDetail={() => openDetail(phase.key, index, step)}
                        onEdit={() => openEdit(phase.key, index, step)}
                        onAdjust={() => openAdjust(phase.key, index, step)}
                        onMore={() => setMenuKey(menuKey === cardKey ? null : cardKey)}
                        menu={(
                          <StepMenu
                            open={isOpen && menuKey === cardKey}
                            placement="footer"
                            onRegen={() => {
                              setMenuKey(null);
                              openAddStep(phase);
                            }}
                            onAdjust={() => openAdjust(phase.key, index, step)}
                          />
                        )}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {addOpen && (
        <div className="mo on" id="mo-add-step" onMouseDown={(event) => event.target === event.currentTarget && setAddOpen(false)}>
          <div className="modal modal-add-step">
            <div className="modal-hd">
              <div>
                <div className="modal-t" id="addStepTitle">
                  添加 <strong className={`as-phase-${addPhase?.key || 'eng'}`}>{addPhase?.phase || 'Engage'}</strong>（{addPhase?.name || '引入'}）环节
                </div>
                <div id="asPhaseTag">Unit 3 · 三年级 G3</div>
              </div>
              <button type="button" className="modal-x" onClick={() => setAddOpen(false)} aria-label="关闭"><X size={22} /></button>
            </div>

            <div className="modal-body as-modal-body">
              <div className="as-left-panel">
                <div className="as-gen-tabs">
                  <button className={`as-gen-tab ${genMode === 'ai' ? 'active' : ''}`} type="button" onClick={() => setGenMode('ai')}>
                    <Sparkles size={13} /> AI 生成
                  </button>
                  <button className={`as-gen-tab ${genMode === 'classic' ? 'active' : ''}`} type="button" onClick={() => setGenMode('classic')}>
                    <Star size={13} /> 经典活动
                  </button>
                  <button className={`as-gen-tab ${genMode === 'mine' ? 'active' : ''}`} type="button" onClick={() => setGenMode('mine')}>
                    <Heart size={13} /> 我的收藏
                  </button>
                </div>

                <div className={`as-gen-panel ${genMode === 'ai' ? 'active' : ''}`} id="asPanel-ai">
                  <div className="as-quick-hint">
                    <div className="as-qh-label">💡 提示词（点击直接填入）</div>
                    <div className="as-qh-chips">
                      {quickIdeas.map((item) => (
                        <button className="as-qh-chip" type="button" key={item.label} onClick={() => fillIdea(item.text)}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="as-panel-label">输入活动核心思路</div>
                  <TextArea
                    className="as-gen-textarea"
                    value={ideaText}
                    onChange={(event) => setIdeaText(event.target.value)}
                    placeholder={'描述你想要设计的活动核心思路，AI 将生成完整活动方案\n例如：设计一个让学生通过角色扮演来练习目标句型的活动'}
                  />
                  <button type="button" className="as-gen-btn" onClick={() => fillDraftFromIdea()}>
                    <Sparkles size={14} />
                    AI 生成草案
                  </button>
                </div>

                <div className={`as-gen-panel ${genMode === 'classic' ? 'active' : ''}`} id="asPanel-classic">
                  <div className="as-panel-label classic-label">选择一种经典活动</div>
                  <div className="as-classic-grid" id="asClassicGrid">
                    {classicActivities.map((activity) => (
                      <button
                        type="button"
                        className={`as-classic-card ${selectedClassic === activity.name ? 'selected' : ''}`}
                        key={activity.name}
                        onClick={() => {
                          setSelectedClassic(activity.name);
                          fillDraftFromIdea('', activity.name);
                        }}
                      >
                        <div className="as-classic-icon">{activity.icon}</div>
                        <div className="as-classic-name">{activity.name}</div>
                        <div className="as-classic-meta">{activity.meta}</div>
                      </button>
                    ))}
                  </div>
                  {selectedClassic && <div className="as-selected-hint">已选择：<strong>{selectedClassic}</strong></div>}
                  {selectedClassic && (
                    <button type="button" className="as-gen-btn classic-gen" onClick={() => fillDraftFromIdea('', selectedClassic)}>
                      <Sparkles size={14} />
                      AI 生成草案
                    </button>
                  )}
                </div>

                <div className={`as-gen-panel ${genMode === 'mine' ? 'active' : ''}`} id="asPanel-mine">
                  <div id="asSavedList" className="as-saved-empty">
                    暂无收藏环节或保存的活动<br />
                    <span>在环节卡片右上角菜单中点击「收藏此环节」存入此处</span>
                  </div>
                  <div id="asCurrentDraft">
                    <div className="as-current-title">当前草案</div>
                    <div className="as-current-summary">
                      环节名称：<span>—</span><br />
                      教学目标：<span>—</span>
                    </div>
                    <button type="button">★ 保存到我的收藏</button>
                  </div>
                </div>
              </div>

              <div className="as-right-panel">
                <div className="as-right-hd">
                  <span className="as-right-title">📝 活动草案</span>
                  <span className={`as-right-tag ${genMode === 'ai' ? 'ai' : genMode === 'mine' ? 'mine' : ''}`}>
                    {genMode === 'ai' ? '等待生成...' : genMode === 'classic' ? '等待选择...' : '选择收藏环节'}
                  </span>
                </div>

                <Form form={addForm} className="as-draft-form" layout="vertical">
                  <div className="as-draft-row">
                    <Form.Item className="as-draft-field as-draft-name" label="环节名称" name="title">
                      <Input className="as-draft-input" placeholder="起一个吸引人的名字" />
                    </Form.Item>
                    <Form.Item className="as-draft-field as-draft-time" label="预估时长" name="time">
                      <InputNumber className="as-draft-input" min={1} max={40} controls={false} />
                    </Form.Item>
                  </div>
                  <Form.Item className="as-draft-field" label="语言目标" name="goal">
                    <TextArea className="as-draft-textarea" placeholder="例如：听力输入：核心情绪词（sad, happy, lonely, bored），核心句型 Let’s help…" />
                  </Form.Item>
                  <Form.Item className="as-draft-field" label="活动概述" name="activity">
                    <TextArea className="as-draft-textarea" placeholder="简要描述活动内容..." />
                  </Form.Item>
                  <div className="as-draft-field">
                    <label className="as-draft-lbl">活动流程</label>
                    <Form.List name="flowSteps">
                      {(fields, { add, remove }) => (
                        <div className="flow-step-editor" id="drFlowSteps">
                          <div className="flow-step-editor-head">
                            <div>
                              <div className="flow-step-editor-title">课堂执行流程</div>
                              <div className="flow-step-editor-tip">
                                按真实上课顺序填写：先设计活动内容，再补充教师语言与引导动作。
                              </div>
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
                                      <TextArea
                                        className="flow-step-input flow-step-desc"
                                        placeholder="这一步学生会看到什么、做什么、完成什么？"
                                      />
                                    </Form.Item>
                                  </div>
                                  <div className="flow-step-section guidance">
                                    <div className="flow-step-section-title">教师引导</div>
                                    <div className="flow-step-script-grid">
                                      <div>
                                        <div className="flow-step-mini-label">教师语言</div>
                                        <Form.Item name={[field.name, 'teacher']} noStyle>
                                          <TextArea
                                            className="flow-step-input flow-step-script"
                                            placeholder="例如：Shhh... Listen, everyone."
                                          />
                                        </Form.Item>
                                      </div>
                                      <div>
                                        <div className="flow-step-mini-label">动作/引导提示</div>
                                        <Form.Item name={[field.name, 'cue']} noStyle>
                                          <TextArea
                                            className="flow-step-input flow-step-cue"
                                            placeholder="例如：神秘地举起信封；停顿等待学生自然回应"
                                          />
                                        </Form.Item>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="flow-step-del"
                                aria-label="删除步骤"
                                disabled={fields.length <= 1}
                                onClick={() => fields.length > 1 && remove(field.name)}
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="flow-step-add"
                            onClick={() => add({
                              title: '新步骤',
                              desc: '',
                              teacher: '',
                              cue: '',
                            })}
                          >
                            + 添加步骤
                          </button>
                        </div>
                      )}
                    </Form.List>
                  </div>
                  <div className="as-draft-row">
                    <Form.Item className="as-draft-field" label="教学资源" name="resources">
                      <TextArea className="as-draft-textarea" placeholder="用顿号、逗号或换行分隔，例如：装饰信封、求救信、动物轮廓表情图" />
                    </Form.Item>
                    <Form.Item className="as-draft-field" label="情境创设" name="scenario">
                      <TextArea className="as-draft-textarea" placeholder="创设的情境背景..." />
                    </Form.Item>
                  </div>
                </Form>

                <div className="as-right-ft">
                  <button className="as-regen-btn" type="button" onClick={() => fillDraftFromIdea()}>
                    <RefreshCw size={11} />
                    重新生成
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button type="button" className="as-ft-cancel" onClick={() => setAddOpen(false)}>取消</button>
              <div className="as-ft-spacer" />
              <button type="button" className="as-ft-confirm" id="asConfirmBtn" onClick={addDraftStep}>
                添加到大纲
              </button>
            </div>
          </div>
        </div>
      )}

      <StepDetailModal
        open={!!detailTarget}
        step={detailTarget?.step}
        phase={detailTarget?.phase}
        onClose={() => setDetailTarget(null)}
        onEdit={() => {
          if (!detailTarget) return;
          setEditing(detailTarget);
          setDetailTarget(null);
        }}
      />
      <EditStepModal
        open={!!editing}
        step={editing?.step}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
      />
      <AdjustStepModal
        open={!!adjustTarget}
        value={adjustText}
        selected={adjustChips}
        onChange={setAdjustText}
        onToggle={(chip) => setAdjustChips((current) => (
          current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]
        ))}
        onClose={() => setAdjustTarget(null)}
        onConfirm={confirmAdjust}
      />
    </div>
  );
}

function StepMenu({ open, onRegen, onAdjust, placement }) {
  return (
    <div className={`step-menu-dropdown ${placement === 'footer' ? 'footer-menu' : ''} ${open ? 'open' : ''}`}>
      <button type="button" className="step-menu-item" onClick={onRegen}><RefreshCw size={12} />重新生成</button>
      <button type="button" className="step-menu-item" onClick={onAdjust}><SlidersHorizontal size={12} />调整环节</button>
      <button type="button" className="step-menu-item"><Heart size={12} />收藏此环节</button>
      <button type="button" className="step-menu-item"><Copy size={12} />置顶</button>
      <div className="step-menu-sep" />
      <button type="button" className="step-menu-item danger"><Trash2 size={12} />删除</button>
    </div>
  );
}
