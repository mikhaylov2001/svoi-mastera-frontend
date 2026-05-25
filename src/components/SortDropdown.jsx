import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
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

  useEffect(() => {
    if (!open || !rootRef.current) {
      setMenuPos(null);
      return undefined;
    }

    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
        minWidth: Math.max(rect.width, variant === 'toolbar' ? 168 : 148),
      });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, variant]);

  const pick = (next) => {
    onChange(next);
    setOpen(false);
  };

  const menu = open && menuPos ? (
    <div
      ref={menuRef}
      className="sort-dd__menu sort-dd__menu--portal"
      role="listbox"
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        top: menuPos.top,
        right: menuPos.right,
        minWidth: menuPos.minWidth,
        zIndex: 10000,
      }}
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
  ) : null;

  return (
    <>
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
      </div>
      {menu && createPortal(menu, document.body)}
    </>
  );
}
