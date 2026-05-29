import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CUSTOMER_HOME_PATH } from '../../constants/homePaths';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import { HOME_MARKET_CSS } from './homeMarketCss';
import { useSameRouteRefetch } from '../hooks/useSameRouteRefetch';

const API = 'https://svoi-mastera-backend-n9om.onrender.com/api/v1';
const BACKEND_ORIGIN = 'https://svoi-mastera-backend-n9om.onrender.com';
const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

function workerListingPhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return BACKEND_ORIGIN + url;
}

const CAT_PHOTOS = {
  'remont-kvartir':       'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
  'santehnika':           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'elektrika':            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
  'uborka':               'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80',
  'parikhmaher':          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
  'manikur':              'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
  'krasota-i-zdorovie':   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'repetitorstvo':        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
};


export function CustomerHomePage({ userId, userName }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [shown, setShown] = useState(8);

  const reloadListings = useCallback(() => {
    fetch(`${API}/listings`).then(r => r.ok ? r.json() : [])
      .then(d => setListings(Array.isArray(d) ? d.filter(l => l.active) : [])).catch(() => {});
  }, []);

  useEffect(() => { reloadListings(); }, [reloadListings]);

  useSameRouteRefetch(CUSTOMER_HOME_PATH, reloadListings);

  return (
    <div className="av-page">
      <style>{HOME_MARKET_CSS}</style>

      {/* ── HERO ── */}
      <div className="av-hero-wrap">
        <div className="av-hero-grid"/>
        <div className="av-hero-glow-top"/>

        {/* Центрированный контент */}
        <div className="av-hero-inner">
          <div className="av-hero-badge">
            <span className="av-hero-badge-dot"/>
            <span className="av-hero-badge-text">
              {userId ? 'Йошкар-Ола · Личный кабинет заказчика' : 'Йошкар-Ола · Найдите мастера рядом'}
            </span>
          </div>
          <h1 className="av-hero-h1">
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
              Найдите мастера в&nbsp;<span className="h1-line2">{cityInLocative('Йошкар-Ола')}</span>
            </span>
            <span style={{ display: 'block' }}>рядом с вами</span>
          </h1>
          <p className="av-hero-sub">
            Ремонт, сантехника, красота и другие услуги — разместите заявку или выберите мастера по объявлениям и отзывам.
          </p>
          <div className="av-hero-actions">
            <button className="av-hero-btn-primary" onClick={() => navigate(userId ? '/my-requests' : '/register')}>
              Разместить заявку →
            </button>
            <Link to="/find-master" className="av-hero-btn-ghost">
              Найти мастера
            </Link>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="av-body">
        <div>
          {/* ── КАТЕГОРИИ ── */}
          <div className="av-cats-block">
            <div className="av-cats-hdr">
              <span className="av-cats-hdr-title">Популярные категории</span>
              <Link to="/find-master" className="av-cats-hdr-link">Все категории →</Link>
            </div>
            <div className="av-cats-scroll">
              {ALL_CATS.map(cat => (
                <Link key={cat.slug} to={`/find-master/${cat.slug}`} className="av-cat-item">
                  <div className="av-cat-photo">
                    {CAT_PHOTOS[cat.slug]
                      ? <img src={CAT_PHOTOS[cat.slug]} alt={cat.name}/>
                      : <div className="av-cat-photo-ph">{cat.emoji||'🛠️'}</div>
                    }
                  </div>
                  <div className="av-cat-name">{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── ОБЪЯВЛЕНИЯ ── */}
          <div className="av-recs-hdr av-recs-hdr--solo">
            <h2 className="av-recs-title">Объявления мастеров</h2>
          </div>

          {listings.length === 0 ? (
            <div className="av-empty">
              <div className="av-empty-ico">🔍</div>
              <h3>Пока нет объявлений</h3>
              <p>Мастера скоро появятся!</p>
            </div>
          ) : (
            <>
              <div className="av-cards-grid">
                {listings.slice(0, shown).map(l => {
                  const img0 = l.photos?.[0];
                  const src = workerListingPhotoUrl(img0);
                  const avUrl = workerListingPhotoUrl(l.workerAvatar);
                  const wname = [l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер';
                  return (
                    <Link key={l.id} to={`/listings/${l.id}`} className="av-card">
                      <div className="av-card-img">
                        {src ? <img src={src} alt="" /> : '🔧'}
                        {l.category ? <span className="av-card-cat">{l.category}</span> : null}
                      </div>
                      <div className="av-card-body">
                        <div className="av-card-price">
                          {l.price ? Number(l.price).toLocaleString('ru-RU') : '—'} ₽
                          {l.priceUnit ? <span className="av-card-price-unit">{l.priceUnit}</span> : null}
                        </div>
                        <div className="av-card-title">{l.title || 'Объявление'}</div>
                        <div className="av-card-footer">
                          <div className="av-card-ava">
                            {avUrl ? <img src={avUrl} alt="" /> : (wname || 'М')[0]}
                          </div>
                          <span className="av-card-wname">{wname}</span>
                          <span className="av-card-city">📍 Йошкар-Ола</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {shown < listings.length && (
                <button type="button" className="av-more-btn" onClick={() => setShown(s => s + 8)}>
                  Показать ещё · осталось {listings.length - shown}
                </button>
              )}
            </>
          )}
        </div>

        {/* ── ПРАВАЯ КОЛОНКА ── */}
        <div className="av-side">
          <div className="av-promo">
            <h3>Нужен мастер прямо сейчас?</h3>
            <p>Опишите задачу — мастера пришлют предложения с ценой и сроками.</p>
            <button type="button" className="av-promo-btn" onClick={() => navigate(userId ? '/my-requests' : '/register')}>
              Разместить заявку →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Город после предлога «в» (предложный падеж) */
function cityInLocative(nominative) {
  const c = (nominative || '').trim();
  if (c === 'Йошкар-Ола') return 'Йошкар-Оле';
  return c || 'Йошкар-Оле';
}

export { WorkerHomeGate, WorkerHomePage } from '../../pages/HomePage';

export default function HomePage() {
  const { userId, userName } = useAuth();
  return <CustomerHomePage userId={userId} userName={userName} />;
}
