import React from 'react';
import { Link } from 'react-router-dom';
import './BrandLogo.css';

/**
 * Фирменный знак: молоток + «Свои» / «Мастера», опционально подпись города.
 */
export default function BrandLogo({ to = '/', showCity = false, className = '', onClick }) {
  const Tag = to ? Link : 'div';
  const linkProps = to ? { to, onClick } : { onClick };

  return (
    <Tag className={`brand-logo ${className}`.trim()} {...linkProps}>
      <span className="brand-logo-icon" aria-hidden>
        🔨
      </span>
      <span className="brand-logo-wordmark">
        <span className="brand-logo-name">
          <span className="brand-logo-a">Свои</span>
          <span className="brand-logo-b">Мастера</span>
        </span>
        {showCity ? <span className="brand-logo-city">Йошкар-Ола</span> : null}
      </span>
    </Tag>
  );
}
