import React from 'react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';

export function CreateButton({ children, ...props }) {
  return (
    <button type="button" data-wb-button="primary" data-wb-create="" {...props}>
      <Plus size={16} aria-hidden="true" />
      {children}
    </button>
  );
}

export function DialogCloseButton({ onClick }) {
  const { t } = useTranslation();
  return (
    <button type="button" data-wb-button="quiet" data-wb-icon="" data-wb-size="sm" onClick={onClick} aria-label={t('common.close')}>
      <X size={16} aria-hidden="true" />
    </button>
  );
}

export function FilterChip({ selected, children, ...props }) {
  return (
    <button type="button" data-wb-button="secondary" data-wb-size="sm" data-wb-filter="" aria-pressed={selected} {...props}>
      {children}
    </button>
  );
}

export function StatusFilters({ options, value, onChange, counts, className = '' }) {
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t('common.status')} className={`wb-choice-chips ${className}`.trim()}>
      {options.map((option) => (
        <FilterChip key={option.value} selected={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
          {counts?.[option.value] != null && <span>({counts[option.value]})</span>}
        </FilterChip>
      ))}
    </div>
  );
}

function contentTabId(group, value) {
  return `${group}-tab-${encodeURIComponent(value)}`;
}

export function ContentTabs({ group, label, items, value, onChange, disabled = false, className = '' }) {
  function navigate(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]:enabled'));
    const current = tabs.indexOf(event.target);
    if (current < 0) return;
    event.preventDefault();
    let next = (current + (event.key === 'ArrowLeft' ? -1 : 1) + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    tabs[next].focus();
    tabs[next].click();
  }

  return (
    <div role="tablist" aria-label={label} className={`wb-library-tabs wb-content-tabs ${className}`.trim()} onKeyDown={navigate}>
      {items.map(({ value: key, label: title, count, icon: Icon }) => (
        <button
          key={key} type="button" role="tab" id={contentTabId(group, key)} aria-controls={`${group}-panel`}
          aria-selected={value === key} tabIndex={value === key ? 0 : -1} disabled={disabled}
          onClick={() => onChange(key)}
        >
          {Icon && <Icon size={16} aria-hidden="true" />}
          {title}
          {count != null && <span>{count}</span>}
        </button>
      ))}
    </div>
  );
}

export function ContentTabPanel({ group, value, ...props }) {
  return <section role="tabpanel" id={`${group}-panel`} aria-labelledby={contentTabId(group, value)} tabIndex={0} {...props} />;
}

export function MetadataTag({ tone = 'neutral', children, ...props }) {
  return <span data-wb-tag={tone} {...props}>{children}</span>;
}

export function LibrarySearch({ label, value, onChange, inputRef, className = '', ...inputProps }) {
  return (
    <div className={`wb-library-search ${className}`.trim()} role="search" aria-label={label}>
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
    </div>
  );
}

export function LibraryFilterSelect({ label, className = '', ...props }) {
  return <Select className={`wb-library-select ${className}`.trim()} aria-label={label} {...props} />;
}

/** Native grouped choices keep arrow-key radio navigation and space-key selection. */
export function ChoiceChips({ label, options, multiple = false, clearable = false, value, onChange, id, ...groupProps }) {
  const groupName = React.useId();
  const values = Array.isArray(value) ? value : [];
  return (
    <div className="wb-choice-chips" role={multiple || clearable ? 'group' : 'radiogroup'} aria-label={label} {...groupProps}>
      {options.map((option, index) => {
        const selected = multiple ? values.includes(option.value) : value === option.value;
        const inputId = index === 0 ? id : undefined;
        if (clearable) {
          return (
            <FilterChip key={option.value} id={inputId} selected={selected} onClick={() => onChange?.(selected ? '' : option.value)}>
              {option.label}
            </FilterChip>
          );
        }
        return (
          <label key={option.value} data-wb-filter="" className={selected ? 'is-active' : undefined}>
            <input
              className="sr-only"
              id={inputId}
              name={groupName}
              type={multiple ? 'checkbox' : 'radio'}
              value={option.value}
              checked={selected}
              onChange={(event) => {
                if (!multiple) onChange?.(option.value);
                else if (event.target.checked) onChange?.([...values, option.value]);
                else onChange?.(values.filter((item) => item !== option.value));
              }}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
