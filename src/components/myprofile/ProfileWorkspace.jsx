import React, { useState } from 'react';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';
function resolveImg(u, item) {
  if (!u) return getCategoryPlaceholderPhotoUrlOrDefault({ category: item?.category, categoryName: item?.categoryName });
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

const FILTERS = ['Все', 'Ждут', 'В работе', 'Завершены', 'Отменены'];

const DEAL_STATUS_LABEL = {
  NEW:            'Ждут',
  OPEN:           'Открыта',
  IN_NEGOTIATION: 'Ждут',
  ASSIGNED:       'В работе',
  IN_PROGRESS:    'В работе',
  COMPLETED:      'Завершены',
  CANCELLED:      'Отменены',
};

const DEAL_STATUS_FILTER = {
  'Ждут':     ['NEW', 'OPEN', 'IN_NEGOTIATION'],
  'В работе': ['ASSIGNED', 'IN_PROGRESS'],
  'Завершены':['COMPLETED'],
  'Отменены': ['CANCELLED'],
};

const DEAL_STATUS_CLS = {
  NEW:            'new',
  OPEN:           'new',
  IN_NEGOTIATION: 'new',
  ASSIGNED:       'in-progress',
  IN_PROGRESS:    'in-progress',
  COMPLETED:      'completed',
  CANCELLED:      'cancelled',
};

function fmtCard(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ProfileWorkspace({
  deals,            // raw deals from API
  reviews,          // raw reviews from API
  about,            // string
  tags,             // string[]
  dealsTitle,       // string
  quickActions,     // { label, action }[]
  featureCards,     // { badge, title, text }[]
  showcaseTitle,    // string
  portfolio,        // { title, text, image, onClick? }[]
  onSettingsSelect, // (key) => void
  onDealClick,      // (deal) => void
  isWorker,         // bool
}) {
  const [tab, setTab] = useState('deals');
  const [filter, setFilter] = useState('Все');

  const visibleDeals = filter === 'Все'
    ? deals
    : deals.filter(d => (DEAL_STATUS_FILTER[filter] || []).includes(d.status));

  return (
    /* Workspace: left = content, right = settings panel (sticky) */
    <section className="mp-workspace">
      <div className="mp-work-main">

        {/* ── Tab bar ── */}
        <div className="mp-tabs-v2">
          {['deals', 'reviews', 'about'].map((t, i) => (
            <button
              key={t}
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {['Сделки', 'Отзывы', 'О профиле'][i]}
            </button>
          ))}
        </div>

        {/* ── Deals ── */}
        {tab === 'deals' && (
          <div className="mp-glass-card mp-deals-card">
            <div className="mp-card-headline">
              <div>
                <span>Лента сделок</span>
                <h2>{dealsTitle}</h2>
              </div>
            </div>
            <div className="mp-filter-row">
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={filter === f ? 'active' : ''}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mp-deal-list">
              {visibleDeals.length > 0 ? visibleDeals.map((item, i) => (
                <article
                  key={item.id || i}
                  className="mp-deal-item"
                  onClick={() => onDealClick?.(item)}
                >
                  <img
                    src={resolveImg(item.photos?.[0], item)}
                    alt={item.title || ''}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div>
                    <b>{item.title || 'Сделка'}</b>
                    <p>
                      {[
                        fmtCard(item.createdAt),
                        item.categoryName || item.category,
                      ].filter(Boolean).join(' · ')}
                    </p>
                    <strong>
                      {(item.agreedPrice || item.budget || item.price)
                        ? `${Number(item.agreedPrice || item.budget || item.price).toLocaleString('ru-RU')} ₽`
                        : 'Договорная'}
                    </strong>
                  </div>
                  <span className={`mp-deal-status ${DEAL_STATUS_CLS[item.status] || 'new'}`}>
                    {DEAL_STATUS_LABEL[item.status] || item.status}
                  </span>
                </article>
              )) : (
                <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
                  Сделок нет
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {tab === 'reviews' && (
          <div className="mp-glass-card mp-deals-card">
            <div className="mp-card-headline">
              <div>
                <span>Отзывы</span>
                <h2>Что о вас пишут</h2>
              </div>
            </div>
            <div className="mp-inline-reviews">
              {reviews.length > 0 ? reviews.map((r, i) => (
                <article key={i}>
                  <b>{(r.rating || 0).toFixed(1)} ★</b>
                  <p>«{r.text || r.comment || ''}»</p>
                  <span>
                    {[r.authorName || r.customerName || r.workerName, r.authorLastName || r.customerLastName || r.workerLastName]
                      .filter(Boolean).join(' ') || 'Пользователь'}
                  </span>
                </article>
              )) : (
                <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
                  Отзывов пока нет
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── About ── */}
        {tab === 'about' && (
          <div className="mp-glass-card mp-deals-card">
            <div className="mp-card-headline">
              <div>
                <span>О профиле</span>
                <h2>Публичная информация</h2>
              </div>
            </div>
            <p className="mp-about-text">{about || 'Информация о профиле пока не заполнена.'}</p>
            {tags.length > 0 && (
              <div className="mp-about-tags">
                {tags.map((tag, i) => <span key={i}>{tag}</span>)}
              </div>
            )}
          </div>
        )}

        {/* ── Quick actions + feature cards + portfolio ── */}
        <div className="mp-content-grid">
          <section className="mp-glass-card mp-wide-card">
            <div className="mp-section-title">
              <span>Возможности</span>
              <h2>Быстрые действия</h2>
            </div>
            <div className="mp-actions-v2">
              {quickActions.map((a, i) => (
                <button key={i} type="button" onClick={a.action}>{a.label}</button>
              ))}
            </div>
          </section>

          {featureCards.map((card, i) => (
            <article key={i} className="mp-glass-card mp-feature-card">
              <span className="mp-feature-badge">{card.badge}</span>
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
              {portfolio.length > 0 ? portfolio.map((item, i) => (
                <article key={i} onClick={item.onClick}>
                  <img
                    src={resolveImg(item.image, item)}
                    alt={item.title}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                  </div>
                </article>
              )) : (
                <article style={{ gridColumn: '1/-1', padding: '24px', textAlign: 'center', color: '#999' }}>
                  {isWorker ? 'Добавьте услуги, чтобы они появились здесь' : 'Создайте задачи, чтобы они появились здесь'}
                </article>
              )}
            </div>
          </section>
        </div>

      </div>

      {/* Settings panel (sticky right column) */}
      <SettingsPanel onSelect={onSettingsSelect} />
    </section>
  );
}

/* ── Inline settings panel ── */
const SETTINGS = [
  { key: 'personal',      title: 'Личные данные',              sub: 'Имя, город и контакты' },
  { key: 'notifications', title: 'Уведомления',                sub: 'Push и email' },
  { key: 'verification',  title: 'Верификация',                sub: 'Документы и подтверждение' },
  { key: 'guarantee',     title: 'Гарантия и ответственность', sub: 'Доступно после проверки', note: 'Позже' },
];

function SettingsPanel({ onSelect }) {
  return (
    <aside className="mp-settings-panel mp-settings-panel-v2">
      <div className="mp-settings-panel-inner">
        <div className="mp-section-title compact">
          <h2>Профиль</h2>
          <p>Управляйте данными, уведомлениями, проверкой и безопасностью аккаунта.</p>
        </div>
        <div className="mp-settings-list">
          {SETTINGS.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
            >
              <span>
                <b>{item.title}</b>
                <small>{item.sub}</small>
                {item.note && <em>{item.note}</em>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
