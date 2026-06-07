import React from 'react';
import { Link } from 'react-router-dom';

/** Цена в подсказке поиска — как у заказчика, без «слипания» цифр. */
export function formatCatalogSearchHitPrice(amount) {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) {
    return 'Договорная';
  }
  const n = Number(amount);
  if (n <= 0) return 'Договорная';
  const grouped = n.toLocaleString('ru-RU').replace(/\u202f/g, ' ');
  return `${grouped} ₽`;
}

export function CatalogSearchDropdownHint({ children }) {
  return <div className="fmp-search-hint">{children}</div>;
}

export function CatalogSearchDropdownHit({ photo, title, meta, price, href, onSelect }) {
  const body = (
    <>
      <div className="fmp-search-hit-ph">
        <img src={photo} alt="" />
      </div>
      <div className="fmp-search-hit-body">
        <div className="fmp-search-hit-title">{title}</div>
        <div className="fmp-search-hit-meta">{meta}</div>
        <div className="fmp-search-hit-price">{price}</div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link to={href} className="fmp-search-hit" onClick={onSelect}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" className="fmp-search-hit" onClick={onSelect}>
      {body}
    </button>
  );
}

export function CatalogSearchDropdownFooter({ onClick, children = 'Показать все совпадения в списке →' }) {
  return (
    <button type="button" className="fmp-search-footer" onClick={onClick}>
      {children}
    </button>
  );
}
