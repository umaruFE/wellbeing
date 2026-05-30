import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Input } from 'antd';

const { TextArea } = Input;

const tipChips = [
  ['降低难度', '降低活动难度，简化操作步骤'],
  ['增加互动', '增加生生互动环节'],
  ['强化语言', '强化目标语言融入'],
  ['增加趣味', '增加活动趣味性'],
  ['简化操作', '降低对老师的能力要求'],
];

const groups = [
  ['基础设计', ['时长', '流程', '物料/场地']],
  ['语言目标', ['目标语言', '语言要素', '语言输入', '语言输出', '语言难度', '语言技能']],
  ['体验与互动', ['合作与互动趣味度', '能量状态', '感官参与']],
  ['学习者匹配', ['安全感', '文化/背景关联', '差异化']],
  ['教师操作', ['能力要求', '教学支持']],
  ['叙事与连贯性', ['过渡衔接', '任务导向']],
];

export function AdjustStepModal({ open, loading = false, value, selected = [], onChange, onToggle, onClose, onConfirm }) {
  if (!open) return null;

  const fillTip = (text) => {
    const current = value.trim();
    onChange(current ? `${current}${/[，,；;]$/.test(current) ? '' : '，'}${text}` : text);
  };

  const toggleChip = (chip) => {
    onToggle(chip);
    if (!value.includes(chip)) {
      const current = value.trim();
      onChange(current ? `${current}${/[，,；;]$/.test(current) ? '' : '；'}${chip}` : chip);
    }
  };

  return (
    <div className="mo on" id="mo-adjust-step" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal adjust-step-modal">
        <div className="modal-hd">
          <div className="modal-t">调整环节</div>
          <button type="button" className="modal-x" onClick={onClose} aria-label="关闭">×</button>
        </div>
        <div className="modal-body adjust-step-body">
          <div className="adjust-modal-wrap">
            <div className="adjust-section">
              <div className="adjust-section-label">调整思路（必填）</div>
              <TextArea
                className="adjust-textarea"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="请描述你希望如何调整这个环节，例如：降低语言难度、增加合作互动等"
              />
              <div className="adjust-hint">描述越具体，AI 越能精准调整</div>
              <div className="adjust-tip-block">
                <div className="adjust-tip-label">思路提示词（点击直接填入）</div>
                <div className="adjust-chip-row">
                  {tipChips.map(([label, text]) => (
                    <button type="button" className="adjust-chip" key={label} onClick={() => fillTip(text)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="adjust-category-wrap">
              <div className="adjust-category-title">快捷调整方向（可选填）</div>
              {groups.map(([title, chips]) => (
                <div className="adjust-section adjust-category-section" key={title}>
                  <div className="adjust-section-label">{title}</div>
                  <div className="adjust-chip-row">
                    {chips.map((chip) => (
                      <button
                        type="button"
                        className={`adjust-chip ${selected.includes(chip) ? 'selected' : ''}`}
                        key={chip}
                        onClick={() => toggleChip(chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-ft">
          <button type="button" className="mo-btn-cancel" disabled={loading} onClick={onClose}>取消</button>
          <button type="button" className="mo-btn-primary" disabled={!value.trim() || loading} onClick={onConfirm}>
            {loading ? <Loader2 size={13} style={{ animation: 'spin .8s linear infinite' }} /> : <Check size={13} />}
            {loading ? '调整中...' : '确认调整'}
          </button>
        </div>
      </div>
    </div>
  );
}
