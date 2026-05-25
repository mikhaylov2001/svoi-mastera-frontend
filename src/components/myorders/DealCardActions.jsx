import React, { useEffect, useRef, useState } from 'react';

function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="mo-card-icon-chat">
      <path
        d="M20 11.5a7.5 7.5 0 0 1-8.72 7.41L5.5 21l1.79-4.38A7.5 7.5 0 1 1 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.25 10.75h6.5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <path d="M9.25 13.5h3.75" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="mo-card-icon-more">
      <circle cx="5.5" cy="12" r="1.35" fill="currentColor" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.35" fill="currentColor" />
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
