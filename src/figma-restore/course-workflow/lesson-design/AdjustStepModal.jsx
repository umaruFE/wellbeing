import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

const tipChips = [
  ['降低难度', '降低活动难度，简化操作步骤', 'Lower Difficulty', 'Lower the activity difficulty and simplify steps'],
  ['增加互动', '增加生生互动环节', 'More Interaction', 'Add more peer interaction'],
  ['强化语言', '强化目标语言融入', 'Strengthen Language', 'Integrate the target language more strongly'],
  ['增加趣味', '增加活动趣味性', 'More Fun', 'Make the activity more engaging'],
  ['简化操作', '降低对老师的能力要求', 'Simplify Teaching', 'Reduce operational complexity for the teacher'],
];

const groups = [
  ['基础设计', 'Basic Design', [['时长', 'Duration'], ['流程', 'Flow'], ['物料/场地', 'Materials / Space']]],
  ['语言目标', 'Language Goals', [['目标语言', 'Target Language'], ['语言要素', 'Language Elements'], ['语言输入', 'Language Input'], ['语言输出', 'Language Output'], ['语言难度', 'Language Difficulty'], ['语言技能', 'Language Skills']]],
  ['体验与互动', 'Experience & Interaction', [['合作与互动趣味度', 'Collaboration & Fun'], ['能量状态', 'Energy Level'], ['感官参与', 'Sensory Engagement']]],
  ['学习者匹配', 'Learner Fit', [['安全感', 'Sense of Safety'], ['文化/背景关联', 'Culture / Context Link'], ['差异化', 'Differentiation']]],
  ['教师操作', 'Teacher Operation', [['能力要求', 'Skill Requirements'], ['教学支持', 'Teaching Support']]],
  ['叙事与连贯性', 'Narrative & Coherence', [['过渡衔接', 'Transitions'], ['任务导向', 'Task Orientation']]],
];

function appendPhrase(currentValue, text) {
  const current = currentValue.trim();
  if (!current) return text;
  return `${current}${/[，,；;]$/.test(current) ? '' : '，'}${text}`;
}

export function AdjustStepModal({
  open,
  loading = false,
  value,
  selected = [],
  onChange,
  onToggle,
  onClose,
  onConfirm,
}) {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const textareaRef = React.useRef(null);

  if (!open) return null;

  const fillTip = (text) => {
    onChange(appendPhrase(value, text));
    requestAnimationFrame(() => textareaRef.current?.focus?.());
  };

  const toggleChip = (chip) => {
    onToggle(chip);
    if (!selected.includes(chip) && !value.includes(chip)) {
      const current = value.trim();
      onChange(current ? `${current}${/[，,；;]$/.test(current) ? '' : '；'}${chip}` : chip);
    }
  };

  return (
    <div className="mo on" id="mo-adjust-step" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal adjust-step-modal">
        <div className="modal-hd">
          <div className="modal-t">{t('lesson.adjustTitle')}</div>
          <button type="button" className="modal-x" onClick={onClose} aria-label={t('common.close')}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body adjust-step-body">
          <div className="adjust-modal-wrap">
            <div className="adjust-section">
              <div className="adjust-section-label">{isChinese ? '调整思路（必填）' : 'Adjustment Idea (required)'}</div>
              <TextArea
                id="adjust-step-intent"
                ref={textareaRef}
                className="adjust-textarea"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={isChinese ? '请描述你希望如何调整这个环节，例如：降低语言难度、增加合作互动等' : 'Describe how you want to adjust this step, e.g. lower language difficulty or add collaboration.'}
              />
              <div className="adjust-hint">{isChinese ? '描述越具体，AI 越能精准调整' : 'The more specific you are, the better AI can adjust it.'}</div>
              <div className="adjust-tip-block">
                <div className="adjust-tip-label">{isChinese ? '思路提示词（点击直接填入）' : 'Prompt ideas (click to fill)'}</div>
                <div className="adjust-chip-row">
                  {tipChips.map(([label, text, labelEn, textEn]) => (
                    <button type="button" className="adjust-chip" key={label} onClick={() => fillTip(isChinese ? text : textEn)}>
                      {isChinese ? label : labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="adjust-category-wrap">
              <div className="adjust-category-title">{isChinese ? '快捷调整方向（可选填）' : 'Quick Adjustment Directions (optional)'}</div>
              {groups.map(([title, titleEn, chips]) => (
                <div className="adjust-section adjust-category-section" key={title}>
                  <div className="adjust-section-label">{isChinese ? title : titleEn}</div>
                  <div className="adjust-chip-row">
                    {chips.map(([chip, chipEn]) => {
                      const chipValue = isChinese ? chip : chipEn;
                      return (
                        <button
                          type="button"
                          className={`adjust-chip ${selected.includes(chipValue) ? 'selected' : ''}`}
                          key={chip}
                          onClick={() => toggleChip(chipValue)}
                        >
                          {chipValue}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-ft">
          <button type="button" className="mo-btn-cancel" disabled={loading} onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="mo-btn-primary" disabled={!value.trim() || loading} onClick={onConfirm}>
            {loading ? <Loader2 size={15} className="adjust-spin" /> : <Check size={15} />}
            {loading ? (isChinese ? '调整中...' : 'Adjusting...') : (isChinese ? '确认调整' : 'Confirm Adjustment')}
          </button>
        </div>
      </div>
    </div>
  );
}
