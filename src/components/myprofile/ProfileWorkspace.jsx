import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function resolveImg(u, item) {
  if (!u) return getCategoryPlaceholderPhotoUrlOrDefault({ category: item?.category, categoryName: item?.categoryName });
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

const FILTERS = ['Все', 'Ждут', 'В работе', 'Завершены', 'Отменены'];

const DEAL_STATUS_LABEL = {
  NEW: 'Ждут',
  OPEN: 'Открыта',
  IN_NEGOTIATION: 'Ждут',
  ASSIGNED: 'В работе',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершены',
  CANCELLED: 'Отменены',
};

const DEAL_STATUS_FILTER = {
  Ждут: ['NEW', 'OPEN', 'IN_NEGOTIATION'],
  'В работе': ['ASSIGNED', 'IN_PROGRESS'],
  Завершены: ['COMPLETED'],
  Отменены: ['CANCELLED'],
};

const DEAL_STATUS_CLS = {
  NEW: 'new',
  OPEN: 'new',
  IN_NEGOTIATION: 'new',
  ASSIGNED: 'in-progress',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

function fmtCard(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ProfileWorkspace({
  deals,
  reviews,
  about,
  tags,
  dealsTitle,
  onSettingsSelect,
  onDealClick,
  dealsListPath,
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('deals');
  const [filter, setFilter] = useState('Все');

  const visibleDeals = filter === 'Все'
    ? deals
    : deals.filter((d) => (DEAL_STATUS_FILTER[filter] || []).includes(d.status));

  const onViewAll = () => {
    if (dealsListPath) navigate(dealsListPath);
  };

  return (
    <section className="mp-workspace">
      <div className="mp-work-main">
        <div className="mp-activity-block">
          <div className="mp-tabs-v2">
            {['deals', 'reviews', 'about'].map((t, i) => (
              <button
                key={t}
                type="button"
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {['Сделки', 'Отзывы', 'О профиле'][i]}
              </button>
            ))}
          </div>

          {tab === 'deals' && (
            <div className="mp-glass-card mp-deals-card">
              <div className="mp-card-headline">
                <div>
                  <span>Лента сделок</span>
                  <h2>{dealsTitle}</h2>
                </div>
                <button type="button" onClick={onViewAll}>
                  Все →
                </button>
              </div>
              <div className="mp-filter-row">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={filter === f ? 'active' : ''}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="mp-deal-list">
                {visibleDeals.length > 0 ? (
                  visibleDeals.map((item, i) => (
                    <article
                      key={item.id || i}
                      className="mp-deal-item"
                      onClick={() => onDealClick?.(item)}
                    >
                      <img
                        src={resolveImg(item.photos?.[0], item)}
                        alt={item.title || ''}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                  ))
                ) : (
                  <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
                    Сделок нет
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="mp-glass-card mp-deals-card">
              <div className="mp-card-headline">
                <div>
                  <span>Отзывы</span>
                  <h2>Что о вас пишут</h2>
                </div>
              </div>
              <div className="mp-inline-reviews">
                {reviews.length > 0 ? (
                  reviews.map((r, i) => (
                    <article key={i}>
                      <b>{(r.rating || 0).toFixed(1)} ★</b>
                      <p>«{r.text || r.comment || ''}»</p>
                      <span>
                        {[r.authorName || r.customerName || r.workerName, r.authorLastName || r.customerLastName || r.workerLastName]
                          .filter(Boolean).join(' ') || 'Пользователь'}
                      </span>
                    </article>
                  ))
                ) : (
                  <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
                    Отзывов пока нет
                  </p>
                )}
              </div>
            </div>
          )}

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
                  {tags.map((tag, i) => (
                    <span key={i}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SettingsPanel onSelect={onSettingsSelect} />
    </section>
  );
}

const SETTINGS = [
  { key: 'personal', title: 'Личные данные', sub: 'Имя, город и контакты' },
  { key: 'notifications', title: 'Уведомления', sub: 'Push и email' },
  { key: 'verification', title: 'Верификация', sub: 'Документы и подтверждение' },
  { key: 'guarantee', title: 'Гарантия и ответственность', sub: 'Доступно после проверки', note: 'Позже' },
  { key: 'payments', title: 'Платёжные данные', sub: 'Скоро появится', status: 'Скоро', disabled: true },
];

function SettingsPanel({ onSelect }) {
  return (
    <aside className="mp-settings-panel mp-settings-panel-v2 mp-apple-settings">
      <h1 className="mp-apple-settings-title">Настройки</h1>

      <div className="mp-apple-settings-card">
        <div className="mp-section-title compact">
          <h2>Профиль</h2>
          <p>Управляйте данными, уведомлениями, проверкой и безопасностью аккаунта.</p>
        </div>

        <div className="mp-settings-list">
          {SETTINGS.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              className={item.disabled ? 'is-disabled' : ''}
              onClick={() => !item.disabled && onSelect(item.key)}
            >
              <span>
                <b>{item.title}</b>
                <small>{item.sub}</small>
                {item.note && <em>{item.note}</em>}
                {item.status && <em>{item.status}</em>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
