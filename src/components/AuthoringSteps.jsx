import React from 'react';

export function AuthoringSteps({ steps, current, onChange, label, className = '', disabled = false }) {
  return (
    <nav className={`wb-authoring-steps ${className}`.trim()} aria-label={label}>
      {steps.map((name, index) => (
        <button
          type="button"
          key={name}
          className={`wb-authoring-step${index === current ? ' active' : index < current ? ' complete' : ''}`}
          aria-current={index === current ? 'step' : undefined}
          disabled={disabled}
          onClick={() => onChange(index)}
        >
          <span className="wb-step-number" aria-hidden="true">{index + 1}</span>
          <span className="wb-step-label">{name}</span>
        </button>
      ))}
    </nav>
  );
}
