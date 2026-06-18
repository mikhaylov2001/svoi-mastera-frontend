import React from 'react';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';

const BACKEND = 'https://svoi-mastera-backend-ntp0.onrender.com';

function resolveImg(u, item) {
  if (!u) return getCategoryPlaceholderPhotoUrlOrDefault({ category: item?.category, categoryName: item?.categoryName });
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

/**
 * Блок «Возможности → карточки → витрина» — как в макете Base44, под лентой сделок.
 */
export default function ProfileShowcaseGrid({
  quickActions,
  featureCards,
  showcaseTitle,
  portfolio,
  isWorker,
}) {
  return (
    <div className="mp-content-grid">
      <section className="mp-glass-card mp-wide-card">
        <div className="mp-section-title">
          <span>Возможности</span>
          <h2>Быстрые действия</h2>
        </div>
        <div className="mp-actions-v2">
          {quickActions.map((a, i) => (
            <button key={i} type="button" onClick={a.action}>
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {featureCards.map((card, i) => (
        <article key={i} className="mp-glass-card mp-feature-card">
          <span>{card.badge}</span>
          <h3>{card.title}</h3>
          <p>{card.text}</p>
        </article>
      ))}

      <section className="mp-glass-card mp-wide-card">
        <div className="mp-section-title">
          <span>Витрина</span>
          <h2>{showcaseTitle}</h2>
        </div>
        <div className="mp-portfolio-grid">
          {portfolio.length > 0 ? (
            portfolio.map((item, i) => (
              <article key={i} onClick={item.onClick} role={item.onClick ? 'button' : undefined}>
                <img
                  src={resolveImg(item.image, item)}
                  alt={item.title}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </div>
              </article>
            ))
          ) : (
            <article style={{ gridColumn: '1/-1', padding: '24px', textAlign: 'center', color: '#999' }}>
              {isWorker ? 'Добавьте услуги, чтобы они появились здесь' : 'Создайте задачи, чтобы они появились здесь'}
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
