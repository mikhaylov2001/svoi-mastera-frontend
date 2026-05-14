import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getOpenJobRequestsForWorker, getCategories } from '../api';
import { formatJobRequestBudgetLabel } from '../utils/jobRequestBudget';
import { CUSTOMER_HOME_PATH, WORKER_HOME_PATH } from '../../constants/homePaths';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import { HOME_MARKET_CSS } from './homeMarketCss';
import { useSameRouteRefetch } from '../hooks/useSameRouteRefetch';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';
const BACKEND_ORIGIN = 'https://svoi-mastera-backend.onrender.com';
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

  useSameRouteRefetch('/', reloadListings);

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

export function WorkerHomePage({ userId, userName }) {
  const navigate = useNavigate();
  const [openRequests, setOpenRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [city, setCity] = useState('Йошкар-Ола');
  const [loading, setLoading] = useState(true);

  const reloadWorkerHome = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [reqs, prof, cats] = await Promise.all([
        getOpenJobRequestsForWorker(userId).catch(() => []),
        getUserProfile(userId).catch(() => null),
        getCategories().catch(() => []),
      ]);
      setOpenRequests(Array.isArray(reqs) ? reqs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      const c = (prof && prof.city && String(prof.city).trim()) || '';
      if (c) setCity(c);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { reloadWorkerHome(); }, [reloadWorkerHome]);

  useSameRouteRefetch(WORKER_HOME_PATH, reloadWorkerHome);

  const sortedOpenRequests = useMemo(
    () => [...openRequests].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [openRequests],
  );

  const catName = (categoryId) => categories.find(c => String(c.id) === String(categoryId))?.name || 'Заявка';

  const firstName = (userName || 'Мастер').trim().split(/\s+/)[0] || 'Мастер';
  const cityPrep = cityInLocative(city);

  return (
    <div className="av-page">
      <style>{HOME_MARKET_CSS}</style>

      <div className="av-hero-wrap">
        <div className="av-hero-grid" />
        <div className="av-hero-glow-top" />

        <div className="av-hero-inner">
          <div className="av-hero-badge">
            <span className="av-hero-badge-dot" />
            <span className="av-hero-badge-text">{city} · Личный кабинет мастера</span>
          </div>
          <h1 className="av-hero-h1">
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
              Заказы и клиенты в&nbsp;<span className="h1-line2">{cityPrep}</span>
            </span>
            <span style={{ display: 'block' }}>рядом с вами</span>
          </h1>
          <p className="av-hero-sub">
            Привет, {firstName}! Здесь заявки заказчиков с открытыми задачами — откликайтесь в разделе «Найти работу».
          </p>
          <div className="av-hero-actions">
            <Link to="/find-work" className="av-hero-btn-primary" style={{ textDecoration: 'none' }}>
              Найти работу →
            </Link>
            <Link to="/my-listings" className="av-hero-btn-ghost">
              + Моё объявление
            </Link>
          </div>
        </div>
      </div>

      <div className="av-body">
        <div>
          <div className="av-cats-block">
            <div className="av-cats-hdr">
              <span className="av-cats-hdr-title">Категории заявок</span>
              <Link to="/find-work" className="av-cats-hdr-link">
                Все заявки →
              </Link>
            </div>
            <div className="av-cats-scroll">
              {ALL_CATS.map(cat => (
                <Link key={cat.slug} to="/find-work" className="av-cat-item">
                  <div className="av-cat-photo">
                    {CAT_PHOTOS[cat.slug] ? (
                      <img src={CAT_PHOTOS[cat.slug]} alt={cat.name} />
                    ) : (
                      <div className="av-cat-photo-ph">{cat.emoji || '🛠️'}</div>
                    )}
                  </div>
                  <div className="av-cat-name">{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="av-recs-hdr av-recs-hdr--solo">
            <h2 className="av-recs-title">Актуальные заявки</h2>
          </div>

          {loading ? (
            <div className="av-empty">
              <div className="av-empty-ico">⏳</div>
              <h3>Загружаем заявки…</h3>
            </div>
          ) : sortedOpenRequests.length === 0 ? (
            <div className="av-empty">
              <div className="av-empty-ico">📋</div>
              <h3>Пока нет открытых заявок</h3>
              <p>Когда заказчики опубликуют задачи, они появятся здесь и в «Найти работу»</p>
            </div>
          ) : (
            <div className="av-cards-grid">
              {sortedOpenRequests.map(req => {
                const img0 = req.photos?.[0];
                const src = workerListingPhotoUrl(img0);
                const budget = formatJobRequestBudgetLabel(req);
                const custName = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
                const loc = req.addressText || req.city || city;
                const cname = catName(req.categoryId);
                return (
                  <Link
                    key={req.id}
                    to={`/find-work?request=${encodeURIComponent(req.id)}`}
                    className="av-card"
                  >
                    <div className="av-card-img">
                      {src ? <img src={src} alt="" /> : '👤'}
                      <span className="av-card-cat">{cname}</span>
                    </div>
                    <div className="av-card-body">
                      <div className="av-card-price">{budget}</div>
                      <div className="av-card-title">{req.title}</div>
                      <div className="av-card-footer">
                        <div className="av-card-ava">
                          {req.customerAvatar ? (
                            <img src={workerListingPhotoUrl(req.customerAvatar)} alt="" />
                          ) : (
                            (custName || 'З')[0]
                          )}
                        </div>
                        <span className="av-card-wname">{custName}</span>
                        <span className="av-card-city">📍 {loc}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="av-side">
          <div className="av-promo">
            <h3>Новые заявки ждут</h3>
            <p>Откликнитесь первым в разделе «Найти работу» — так вы чаще получаете заказ.</p>
            <button type="button" className="av-promo-btn" onClick={() => navigate('/find-work')}>
              Смотреть заявки →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkerHomeGate() {
  const { userId, userRole, userName } = useAuth();
  if (!userId) return <Navigate to="/login" replace />;
  if (userRole !== 'WORKER') return <Navigate to={CUSTOMER_HOME_PATH} replace />;
  return <WorkerHomePage userId={userId} userName={userName} />;
}

export default function HomePage() {
  const { userId, userName } = useAuth();
  return <CustomerHomePage userId={userId} userName={userName} />;
}
