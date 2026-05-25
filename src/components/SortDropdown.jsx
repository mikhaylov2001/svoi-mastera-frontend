import React, { useEffect, useRef, useState } from 'react';
import './SortDropdown.css';

/**
 * Кастомный выпадающий список сортировки (iOS / Base44).
 * variant: toolbar — в mo-toolbar; pill — компактная pill на главной.
 */
export default function SortDropdown({
  value,
  onChange,
  options,
  variant = 'toolbar',
  className = '',
  ariaLabel = 'Сортировка',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (next) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`sort-dd sort-dd--${variant}${open ? ' is-open' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="sort-dd__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sort-dd__trigger-label">{selected?.label}</span>
        <span className={`sort-dd__chevron${open ? ' is-open' : ''}`} aria-hidden />
      </button>

      {open && (
        <div
          className="sort-dd__menu"
          role="listbox"
          aria-label={ariaLabel}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`sort-dd__option${isSelected ? ' is-selected' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pick(opt.value);
                }}
              >
                <span className="sort-dd__check" aria-hidden>
                  {isSelected ? '✓' : ''}
                </span>
                <span className="sort-dd__option-label">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
