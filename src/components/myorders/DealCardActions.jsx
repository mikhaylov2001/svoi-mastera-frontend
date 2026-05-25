import React, { useEffect, useRef, useState } from 'react';

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10.5h8M8 14h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6 19l-1.5 3 3.2-1.6c1.2.7 2.6 1.1 4.1 1.1 4.4 0 8-3.1 8-7s-3.6-7-8-7-8 3.1-8 7c0 1.4.4 2.7 1.2 3.8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="18" cy="12" r="1.75" fill="currentColor" />
    </svg>
  );
}

/**
 * Панель действий карточки сделки: «Открыть сделку» + чат + меню.
 */
export default function DealCardActions({
  onOpen,
  onChat,
  menuItems = [],
  openLabel = 'Открыть сделку',
  className = '',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const hasMenu = menuItems.length > 0;

  return (
    <div className={`mo-card-actions ${className}`.trim()} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="mo-card-btn-primary" onClick={onOpen}>
        {openLabel}
      </button>

      {onChat ? (
        <button
          type="button"
          className="mo-card-btn-icon"
          title="Сообщения"
          aria-label="Сообщения"
          onClick={(e) => {
            e.stopPropagation();
            onChat();
          }}
        >
          <IconChat />
        </button>
      ) : null}

      {hasMenu ? (
        <div className="mo-card-more-wrap" ref={wrapRef}>
          <button
            type="button"
            className="mo-card-btn-icon"
            title="Ещё"
            aria-label="Ещё"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            <IconMore />
          </button>
          {menuOpen ? (
            <div className="mo-card-more-menu" role="menu">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={`mo-card-more-item${item.danger ? ' mo-card-more-item--danger' : ''}`}
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    item.onClick?.();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="mo-card-btn-icon"
          title="Подробнее"
          aria-label="Подробнее"
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
        >
          <IconMore />
        </button>
      )}
    </div>
  );
}
