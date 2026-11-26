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
