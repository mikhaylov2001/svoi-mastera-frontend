import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSettingsPanel from './ProfileSettingsPanel';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { BACKEND_ORIGIN } from '../../constants/backend';

function resolveImg(u, item) {
  if (!u) return getCategoryPlaceholderPhotoUrlOrDefault({ category: item?.category, categoryName: item?.categoryName });
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND_ORIGIN + u;
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

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ProfileWorkspace({
  deals,
  reviews,
  about,
  tags,
  dealsTitle,
  dealsListPath,
  onSettingsSelect,
  onDealClick,
}) {
  const navigate = useNavigate();
  const [tab, setTab]       = useState('deals');
  const [filter, setFilter] = useState('Все');

  const visibleDeals = filter === 'Все'
    ? deals
    : deals.filter(d => (DEAL_STATUS_FILTER[filter] || []).includes(d.status));

  return (
    <section className="mp-workspace">
      <div className="mp-work-main">
        <div className="mp-tabs-v2">
          <button
            type="button"
            className={tab === 'deals' ? 'active' : ''}
            onClick={() => setTab('deals')}
          >
            Сделки
          </button>
          <button
            type="button"
            className={tab === 'reviews' ? 'active' : ''}
            onClick={() => setTab('reviews')}
          >
            Отзывы
          </button>
          <button
            type="button"
            className={tab === 'about' ? 'active' : ''}
            onClick={() => setTab('about')}
          >
            О профиле
          </button>
        </div>

        {tab === 'deals' && (
          <div className="mp-glass-card mp-deals-card">
            <div className="mp-card-headline">
              <div>
                <span>Лента сделок</span>
                <h2>{dealsTitle}</h2>
              </div>
              {dealsListPath && (
                <button type="button" onClick={() => navigate(dealsListPath)}>
                  Все →
                </button>
              )}
            </div>

            <div className="mp-filter-row">
              {FILTERS.map(f => (
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
                      {[fmtDate(item.createdAt), item.categoryName || item.category]
                        .filter(Boolean).join(' · ')}
                    </p>
                    <strong>
                      {(item.agreedPrice || item.budget || item.price)
                        ? `${Number(item.agreedPrice || item.budget || item.price).toLocaleString('ru-RU')} ₽`
                        : 'Договорная'}
                    </strong>
                  </div>
                  <span>{DEAL_STATUS_LABEL[item.status] || item.status}</span>
                </article>
              )) : (
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
              {reviews.length > 0 ? reviews.map((r, i) => (
                <article key={i}>
                  <b>{(r.rating || 0).toFixed(1)} ★</b>
                  <p>«{r.text || r.comment || ''}»</p>
                  <span>
                    {[r.authorName || r.customerName || r.workerName,
                      r.authorLastName || r.customerLastName || r.workerLastName]
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

        {tab === 'about' && (
          <div className="mp-glass-card mp-deals-card">
            <div className="mp-card-headline">
              <div>
                <span>О профиле</span>
                <h2>Публичная информация</h2>
              </div>
            </div>
            <p className="mp-about-text">{about || 'Информация о профиле пока не заполнена.'}</p>
            {tags?.length > 0 && (
              <div className="mp-about-tags">
                {tags.map((tag, i) => <span key={i}>{tag}</span>)}
              </div>
            )}
          </div>
        )}
      </div>

      <ProfileSettingsPanel onSelect={onSettingsSelect} />
    </section>
  );
}
