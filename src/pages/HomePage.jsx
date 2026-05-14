import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getOpenJobRequestsForWorker, getCategories } from '../api';
import { formatJobRequestBudgetLabel, hasJobRequestPublishedPrice } from '../utils/jobRequestBudget';
import { getListingPublishedPriceNumber } from '../utils/listingPublishedPrice';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
  CATEGORY_PLACEHOLDER_PHOTO_BY_SLUG as CAT_PHOTOS,
} from '../utils/categoryPlaceholderPhoto';
import { CUSTOMER_HOME_PATH, WORKER_HOME_PATH } from '../constants/homePaths';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import { HOME_MARKET_CSS } from './homeMarketCss';
import { useSameRouteRefetch } from '../hooks/useSameRouteRefetch';
import FavoriteHeartButton from '../components/FavoriteHeartButton';
import '../roles/worker/jobListings.css';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';
const BACKEND_ORIGIN = 'https://svoi-mastera-backend.onrender.com';
const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

function workerListingPhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return BACKEND_ORIGIN + url;
}

function CustomerHome({ userId }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [shown, setShown] = useState(8);
  const [city, setCity] = useState('Йошкар-Ола');
  const [masterListCat, setMasterListCat] = useState('ALL');

  const reloadListings = useCallback(async () => {
    try {
      const raw = await fetch(`${API}/listings`).then((r) => (r.ok ? r.json() : []));
      const prof =
        userId != null
          ? await getUserProfile(userId).catch(() => null)
          : null;
      setListings(Array.isArray(raw) ? raw.filter((l) => l.active) : []);
      const c = prof?.city && String(prof.city).trim();
      if (c) setCity(c);
    } catch {
      setListings([]);
    }
  }, [userId]);

  useEffect(() => {
    reloadListings();
  }, [reloadListings]);

  useSameRouteRefetch('/', reloadListings);

  useEffect(() => {
    setShown(8);
  }, [masterListCat]);

  const masterListingCategoryChips = useMemo(() => {
    const s = new Map();
    listings.forEach((l) => {
      const name = (l.category || '').trim();
      if (name) s.set(name, (s.get(name) || 0) + 1);
    });
    return Array.from(s, ([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  }, [listings]);

  const visibleMasterListings = useMemo(() => {
    if (masterListCat === 'ALL') return listings;
    return listings.filter((l) => (l.category || '').trim() === masterListCat);
  }, [listings, masterListCat]);

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
              {userId ? `${city} · Личный кабинет заказчика` : `${city} · Найдите мастера рядом`}
            </span>
          </div>
          <h1 className="av-hero-h1">
            <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
              Найдите мастера в&nbsp;<span className="h1-line2">{cityInLocative(city)}</span>
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
          <div className="av-recs-filter-block">
            <div className="av-recs-hdr av-recs-hdr--customer-requests">
              <div>
                <h2 className="av-recs-title">Объявления мастеров</h2>
                <p className="av-recs-sub">{pluralListingsSubtitle(listings.length)}</p>
              </div>
              <Link to="/find-master" className="av-recs-link">
                Все мастера →
              </Link>
            </div>
            {listings.length > 0 ? (
              <div className="av-recs-chips">
                <button
                  type="button"
                  className={`jl-chip${masterListCat === 'ALL' ? ' is-active' : ''}`}
                  onClick={() => setMasterListCat('ALL')}
                >
                  Все
                </button>
                {masterListingCategoryChips.slice(0, 8).map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`jl-chip${masterListCat === c.name ? ' is-active' : ''}`}
                    onClick={() => setMasterListCat(c.name)}
                  >
                    {c.name} · {c.n}
                  </button>
                ))}
              </div>
            ) : null}

            {listings.length === 0 ? (
              <div className="av-empty">
                <div className="av-empty-ico">🔍</div>
                <h3>Пока нет объявлений</h3>
                <p>Мастера скоро появятся!</p>
              </div>
            ) : visibleMasterListings.length === 0 ? (
              <div className="av-empty">
                <div className="av-empty-ico">🔍</div>
                <h3>В этой категории нет объявлений</h3>
                <p>Попробуйте другой фильтр или раздел «Все мастера»</p>
              </div>
            ) : (
              <>
                <div className="av-cards-grid">
                  {visibleMasterListings.slice(0, shown).map((l) => {
                    const img0 = l.photos?.[0];
                    const src =
                      workerListingPhotoUrl(img0) ||
                      getCategoryPlaceholderPhotoUrlOrDefault({ category: l.category });
                    const avUrl = workerListingPhotoUrl(l.workerAvatar);
                    const wname =
                      [l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер';
                    return (
                      <Link key={l.id} to={`/listings/${l.id}?from=home`} className="av-card">
                        <div className="av-card-img">
                          <FavoriteHeartButton kind="listing" id={l.id} />
                          <img src={src} alt="" />
                          {l.category ? <span className="av-card-cat">{l.category}</span> : null}
                        </div>
                        <div className="av-card-body">
                          <div className="av-card-price">
                            {(() => {
                              const p = getListingPublishedPriceNumber(l);
                              return p ? `${p.toLocaleString('ru-RU')} ₽` : '— ₽';
                            })()}
                            {l.priceUnit ? (
                              <span className="av-card-price-unit">{l.priceUnit}</span>
                            ) : null}
                          </div>
                          <div className="av-card-title">{l.title || 'Объявление'}</div>
                          <div className="av-card-footer">
                            <div className="av-card-ava">
                              {avUrl ? <img src={avUrl} alt="" /> : (wname || 'М')[0]}
                            </div>
                            <span className="av-card-wname">{wname}</span>
                            <span className="av-card-city">📍 {city}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {shown < visibleMasterListings.length && (
                  <button type="button" className="av-more-btn" onClick={() => setShown((s) => s + 8)}>
                    Показать ещё · осталось {visibleMasterListings.length - shown}
                  </button>
                )}
              </>
            )}
          </div>
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

function pluralRequestsLabel(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} заявка`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} заявки`;
  return `${n} заявок`;
}

function pluralListingsSubtitle(n) {
  if (n <= 0) return 'Пока нет объявлений';
  if (n % 10 === 1 && n % 100 !== 11) return `${n} объявление`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} объявления`;
  return `${n} объявлений`;
}

function WorkerHome({ userId, userName }) {
  const navigate = useNavigate();
  const [openRequests, setOpenRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [city, setCity] = useState('Йошкар-Ола');
  const [loading, setLoading] = useState(true);
  const [homeListCat, setHomeListCat] = useState('ALL');

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

  const homeListingCats = useMemo(() => {
    const s = new Map();
    sortedOpenRequests.forEach((i) => {
      const name = i.categoryName || catName(i.categoryId);
      if (name) s.set(name, (s.get(name) || 0) + 1);
    });
    return Array.from(s, ([name, n]) => ({ name, n }));
  }, [sortedOpenRequests, categories]);

  const homeVisibleRequests = useMemo(() => {
    if (homeListCat === 'ALL') return sortedOpenRequests;
    return sortedOpenRequests.filter((i) => {
      const name = i.categoryName || catName(i.categoryId);
      return name === homeListCat;
    });
  }, [sortedOpenRequests, homeListCat, categories]);

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

          <div className="jl-page jl-home-embed">
            <div className="jl-wrap">
              <div className="jl-head">
                <div>
                  <h2 className="jl-title">Актуальные заявки</h2>
                  <div className="jl-sub">
                    {loading
                      ? 'Загрузка…'
                      : `${pluralRequestsLabel(openRequests.length)} ждут отклика`}
                  </div>
                </div>
                <div className="jl-filters">
                  <button
                    type="button"
                    className={`jl-chip${homeListCat === 'ALL' ? ' is-active' : ''}`}
                    onClick={() => setHomeListCat('ALL')}
                  >
                    Все
                  </button>
                  {homeListingCats.slice(0, 6).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className={`jl-chip${homeListCat === c.name ? ' is-active' : ''}`}
                      onClick={() => setHomeListCat(c.name)}
                    >
                      {c.name} · {c.n}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="av-empty">
                  <div className="av-empty-ico">⏳</div>
                  <h3>Загружаем заявки…</h3>
                </div>
              ) : homeVisibleRequests.length === 0 ? (
                <div className="av-empty">
                  <div className="av-empty-ico">📋</div>
                  <h3>
                    {homeListCat === 'ALL'
                      ? 'Пока нет открытых заявок'
                      : 'В этой категории пока нет заявок'}
                  </h3>
                  {homeListCat === 'ALL' ? (
                    <p>Когда заказчики опубликуют задачи, они появятся здесь и в «Найти работу»</p>
                  ) : null}
                </div>
              ) : (
                <div className="av-cards-grid">
                  {homeVisibleRequests.map((item) => {
                    const catLabel = item.categoryName || catName(item.categoryId);
                    const photoSrc =
                      workerListingPhotoUrl(item.photos?.[0] || item.photo) ||
                      getCategoryPlaceholderPhotoUrlOrDefault(
                        { categoryName: catLabel, categoryId: item.categoryId },
                        categories,
                      );
                    const budgetLabel = formatJobRequestBudgetLabel(item);
                    const hasPrice = hasJobRequestPublishedPrice(item);
                    const locLine = (item.cityName || item.address || item.addressText || '').trim();
                    const cityShort =
                      item.cityName ||
                      (locLine ? locLine.split(',')[0].trim() : '') ||
                      city;
                    const custName =
                      [item.customerName, item.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
                    return (
                      <Link
                        key={item.id}
                        to={`/find-work?request=${encodeURIComponent(item.id)}&from=home`}
                        className="av-card"
                      >
                        <div className="av-card-img">
                          <FavoriteHeartButton kind="jobRequest" id={item.id} />
                          <img src={photoSrc} alt={item.title || ''} loading="lazy" />
                          {catLabel ? <span className="av-card-cat">{catLabel}</span> : null}
                        </div>
                        <div className="av-card-body">
                          <div className="av-card-price">
                            {hasPrice ? budgetLabel : '— ₽'}
                            {hasPrice ? <span className="av-card-price-unit">в заявке</span> : null}
                          </div>
                          <div className="av-card-title">{item.title}</div>
                          <div className="av-card-footer">
                            <div className="av-card-ava">
                              {item.customerAvatar ? (
                                <img src={workerListingPhotoUrl(item.customerAvatar)} alt="" />
                              ) : (
                                (custName[0] || '?').toUpperCase()
                              )}
                            </div>
                            <span className="av-card-wname">{custName}</span>
                            <span className="av-card-city">📍 {cityShort}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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


/** Главная мастера: только для роли WORKER (отдельный URL `/worker-home`). */
export function WorkerHomeGate() {
  const { userId, userRole, userName } = useAuth();
  if (!userId) return <Navigate to="/login" replace />;
  if (userRole !== 'WORKER') return <Navigate to={CUSTOMER_HOME_PATH} replace />;
  return <WorkerHome userId={userId} userName={userName} />;
}

/** Главная заказчика и гостя — `/`. Мастер с аккаунта перенаправляется на свою главную. */
export default function HomePage() {
  const { userId, userRole } = useAuth();
  if (userId && userRole === 'WORKER') return <Navigate to={WORKER_HOME_PATH} replace />;
  return <CustomerHome userId={userId} />;
}
