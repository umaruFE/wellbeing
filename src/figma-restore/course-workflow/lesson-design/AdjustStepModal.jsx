import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

const tipChips = [
  ['adjustStepUi.tipLowerDifficulty', 'adjustStepUi.tipLowerDifficultyText'],
  ['adjustStepUi.tipMoreInteraction', 'adjustStepUi.tipMoreInteractionText'],
  ['adjustStepUi.tipStrengthenLanguage', 'adjustStepUi.tipStrengthenLanguageText'],
  ['adjustStepUi.tipMoreFun', 'adjustStepUi.tipMoreFunText'],
  ['adjustStepUi.tipSimplifyTeaching', 'adjustStepUi.tipSimplifyTeachingText'],
];

const groups = [
  ['adjustStepUi.groupBasicDesign', ['adjustStepUi.chipDuration', 'adjustStepUi.chipFlow', 'adjustStepUi.chipMaterials']],
  ['adjustStepUi.groupLanguageGoals', ['adjustStepUi.chipTargetLanguage', 'adjustStepUi.chipLanguageElements', 'adjustStepUi.chipLanguageInput', 'adjustStepUi.chipLanguageOutput', 'adjustStepUi.chipLanguageDifficulty', 'adjustStepUi.chipLanguageSkills']],
  ['adjustStepUi.groupExperience', ['adjustStepUi.chipCollaborationFun', 'adjustStepUi.chipEnergyLevel', 'adjustStepUi.chipSensory']],
  ['adjustStepUi.groupLearnerFit', ['adjustStepUi.chipSafety', 'adjustStepUi.chipCultureLink', 'adjustStepUi.chipDifferentiation']],
  ['adjustStepUi.groupTeacherOps', ['adjustStepUi.chipSkillRequirements', 'adjustStepUi.chipTeachingSupport']],
  ['adjustStepUi.groupNarrative', ['adjustStepUi.chipTransitions', 'adjustStepUi.chipTaskOrientation']],
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
  const { t } = useTranslation();
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
              <div className="adjust-section-label">{t('adjustStepUi.ideaLabel')}</div>
              <TextArea
                id="adjust-step-intent"
                ref={textareaRef}
                className="adjust-textarea"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('adjustStepUi.ideaPlaceholder')}
              />
              <div className="adjust-hint">{t('adjustStepUi.ideaHint')}</div>
              <div className="adjust-tip-block">
                <div className="adjust-tip-label">{t('adjustStepUi.tipLabel')}</div>
                <div className="adjust-chip-row">
                  {tipChips.map(([labelKey, textKey]) => (
                    <button type="button" className="adjust-chip" key={labelKey} onClick={() => fillTip(t(textKey))}>
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="adjust-category-wrap">
              <div className="adjust-category-title">{t('adjustStepUi.quickTitle')}</div>
              {groups.map(([titleKey, chips]) => (
                <div className="adjust-section adjust-category-section" key={titleKey}>
                  <div className="adjust-section-label">{t(titleKey)}</div>
                  <div className="adjust-chip-row">
                    {chips.map((chipKey) => {
                      const chipValue = t(chipKey);
                      return (
                        <button
                          type="button"
                          className={`adjust-chip ${selected.includes(chipValue) ? 'selected' : ''}`}
                          key={chipKey}
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
            {loading ? t('adjustStepUi.adjusting') : t('adjustStepUi.confirmAdjust')}
          </button>
        </div>
      </div>
    </div>
  );
}
