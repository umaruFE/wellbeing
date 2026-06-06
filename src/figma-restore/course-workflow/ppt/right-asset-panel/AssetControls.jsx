import { Input } from 'antd';
import { WandSparkles } from 'lucide-react';

export function OptionGrid({ options, value, onChange, columns = 3, className = '' }) {
  return (
    <div className={`ppt-option-grid ${className}`} style={{ '--option-cols': columns }}>
      {options.map((option) => {
        const item = typeof option === 'string' ? { value: option, label: option } : option;
        const active = value === item.value || value === item.label;
        return (
          <button
            type="button"
            key={item.value || item.label}
            className={active ? 'is-active' : ''}
            onClick={() => onChange(item.value || item.label)}
          >
            <strong>{item.label}</strong>
            {item.desc ? <span>{item.desc}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function FieldBlock({ label, children }) {
  return (
    <div className="ppt-asset-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function PromptField({ label, value, onChange, placeholder, maxLength = 80 }) {
  return (
    <FieldBlock label={label}>
      <Input.TextArea
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="ppt-prompt-foot">
        <span>{value.length} / {maxLength}</span>
        <button type="button"><WandSparkles size={13} />帮我写</button>
      </div>
    </FieldBlock>
  );
}

export function Tip({ children }) {
  return <div className="ppt-asset-tip">{children}</div>;
}
