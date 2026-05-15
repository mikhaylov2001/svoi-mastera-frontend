import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  API_BASE,
  getUserProfile,
  getOpenJobRequestsForWorker,
  getOpenJobRequests,
  getCategories,
  getListings,
} from '../api';
import { formatJobRequestBudgetLabel, hasJobRequestPublishedPrice } from '../utils/jobRequestBudget';
import { getListingPublishedPriceNumber } from '../utils/listingPublishedPrice';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
  CATEGORY_PLACEHOLDER_PHOTO_BY_SLUG as CAT_PHOTOS,
} from '../utils/categoryPlaceholderPhoto';
import { CUSTOMER_HOME_PATH, WORKER_HOME_PATH } from '../constants/homePaths';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import { useSameRouteRefetch } from '../hooks/useSameRouteRefetch';
import GuestLandingHome from './GuestLandingHome';
import FavoriteHeartButton from '../components/FavoriteHeartButton';
import '../roles/worker/jobListings.css';
import './customerHomeLovable.css';

const BACKEND_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, '');
const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

const FEED_AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#e8410a,#ff7043)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0ea5e9,#22d3ee)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
];

/** Демо-лента «Сейчас на платформе», если с API мало событий (как у мастера). */
const FEED_PLATFORM_DEFAULT = [
  { who: 'Ольга', what: 'ищет мастера «Установка двери»', time: '1 мин', color: 'linear-gradient(135deg,#e8410a,#ff7043)' },
  { who: 'Сергей', what: 'принял отклик на заявку', time: '4 мин', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { who: 'Мария', what: 'опубликовала «Генеральная уборка»', time: '6 мин', color: 'linear-gradient(135deg,#0ea5e9,#22d3ee)' },
];

const CHIPS_WORKER = ['⚡ Электрика', '🔧 Сантехника', '🧹 Уборка', '💻 IT', '🚚 Перевозки', '🎨 Отделка', '🔨 Ремонт', '✂️ Красота'];
const QUICK_WORKER = ['⚡ срочные заявки', '📍 рядом с вами', '💰 от 1500 ₽', '⭐ с бюджетом'];
const SOCIAL_WORKER = [
  ['12 480', 'заказов'],
  ['4.9 ★', 'рейтинг'],
  ['87', 'свежих'],
  ['~7 мин', 'отклик'],
  ['98%', 'довольны'],
];

function timeAgoShort(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн назад`;
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** Короткое время для ленты в hero (как на макете: «4 мин»). */
function timeAgoFeed(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн`;
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function buildPlatformFeedFromOpenRequests(openRequests) {
  const sorted = [...(Array.isArray(openRequests) ? openRequests : [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
  return sorted.slice(0, 24).map((req, idx) => {
    const full = [req.customerName, req.customerLastName].filter(Boolean).join(' ').trim();
    const who = full.split(/\s+/)[0] || 'Заказчик';
    const title = (req.title || 'Заявка').trim();
    const short = title.length > 44 ? `${title.slice(0, 42)}…` : title;
    return {
      key: String(req.id ?? `req-${idx}`),
      who,
      what: `ищет мастера «${short}»`,
      time: timeAgoFeed(req.createdAt),
      color: FEED_AVATAR_GRADIENTS[idx % FEED_AVATAR_GRADIENTS.length],
    };
  });
}

/** ≥3 пункта: с API и/или демо; иначе только демо-ротация как у мастера. */
function resolvePlatformFeedCycle(openRequests) {
  const fromApi = buildPlatformFeedFromOpenRequests(openRequests);
  if (fromApi.length >= 3) return fromApi;
  if (fromApi.length > 0) {
    const merged = [...fromApi];
    for (let i = 0; merged.length < 3; i += 1) {
      const d = FEED_PLATFORM_DEFAULT[i % FEED_PLATFORM_DEFAULT.length];
      merged.push({ ...d, key: `def-${i}` });
    }
    return merged;
  }
  return FEED_PLATFORM_DEFAULT.map((row, i) => ({ ...row, key: `def-${i}` }));
}

function visiblePlatformFeedRows(feedCycle, feedIdx) {
  const n = Math.max(1, feedCycle.length);
  return [0, 1, 2].map((k) => {
    const row = feedCycle[(feedIdx + k) % n];
    return { ...row, _k: `${row.key}-${k}` };
  });
}

function listingRatingValue(l) {
  if (typeof l?.workerRating === 'number' && !Number.isNaN(l.workerRating)) return l.workerRating;
  if (typeof l?.rating === 'number' && !Number.isNaN(l.rating)) return l.rating;
  return null;
}

function averageListingRating(rows) {
  const vals = (Array.isArray(rows) ? rows : []).map(listingRatingValue).filter((x) => typeof x === 'number');
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function uniqueWorkerCountFromListings(rows) {
  const keys = new Set();
  (Array.isArray(rows) ? rows : []).forEach((l) => {
    if (l?.workerId != null && String(l.workerId).trim()) keys.add(`id:${l.workerId}`);
    else {
      const nm = [l?.workerName, l?.workerLastName].filter(Boolean).join(' ').trim();
      if (nm) keys.add(`n:${nm}`);
    }
  });
  return keys.size;
}

function openJobRequestsCreatedToday(openRequests) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  return (Array.isArray(openRequests) ? openRequests : []).filter((r) => {
    if (!r?.createdAt) return false;
    const t = new Date(r.createdAt).getTime();
    return !Number.isNaN(t) && t >= t0;
  }).length;
}

function workerListingPhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return BACKEND_ORIGIN + url;
}

export function CustomerHomePage({ userId }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [categoriesApi, setCategoriesApi] = useState([]);
  const [shown, setShown] = useState(8);
  const [city, setCity] = useState('Йошкар-Ола');
  const [masterListCat, setMasterListCat] = useState('ALL');
  const [sortBy, setSortBy] = useState('new');
  const [q, setQ] = useState('');
  const [feedIdx, setFeedIdx] = useState(0);

  const reloadCustomerHome = useCallback(async () => {
    try {
      const [rawListings, rawOpen, cats] = await Promise.all([
        getListings().catch(() => []),
        getOpenJobRequests().catch(() => []),
        getCategories().catch(() => []),
      ]);
      setListings(Array.isArray(rawListings) ? rawListings.filter((l) => l.active) : []);
      setOpenRequests(Array.isArray(rawOpen) ? rawOpen : []);
      setCategoriesApi(Array.isArray(cats) ? cats : []);

      if (userId != null) {
        const prof = await getUserProfile(userId).catch(() => null);
        const c = prof?.city && String(prof.city).trim();
        if (c) setCity(c);
      }
    } catch {
      setListings([]);
      setOpenRequests([]);
    }
  }, [userId]);

  useEffect(() => {
    reloadCustomerHome();
  }, [reloadCustomerHome]);

  useSameRouteRefetch(CUSTOMER_HOME_PATH, reloadCustomerHome);

  useEffect(() => {
    setShown(8);
  }, [masterListCat, sortBy]);

  const masterListingCategoryChips = useMemo(() => {
    const s = new Map();
    listings.forEach((l) => {
      const name = (l.category || '').trim();
      if (name) s.set(name, (s.get(name) || 0) + 1);
    });
    return Array.from(s, ([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  }, [listings]);

  const visibleMasterListings = useMemo(() => {
    const base =
      masterListCat === 'ALL' ? listings : listings.filter((l) => (l.category || '').trim() === masterListCat);
    const rows = [...base];
    if (sortBy === 'new') {
      rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'cheap') {
      rows.sort(
        (a, b) => (getListingPublishedPriceNumber(a) ?? 1e15) - (getListingPublishedPriceNumber(b) ?? 1e15),
      );
    } else if (sortBy === 'rating') {
      rows.sort((a, b) => (listingRatingValue(b) ?? -1) - (listingRatingValue(a) ?? -1));
    }
    return rows;
  }, [listings, masterListCat, sortBy]);

  const bentoCats = useMemo(() => {
    const raw =
      categoriesApi.length > 0
        ? categoriesApi
            .filter((c) => c && String(c.name || '').trim() && String(c.slug || '').trim())
            .map((c) => ({ slug: String(c.slug).trim(), name: String(c.name).trim(), emoji: null }))
        : ALL_CATS.map((c) => ({ slug: c.slug, name: c.name, emoji: c.emoji }));
    const countName = (name) => listings.filter((l) => (l.category || '').trim() === name).length;
    return [...raw].sort((a, b) => countName(b.name) - countName(a.name)).slice(0, 5);
  }, [categoriesApi, listings]);

  const countInCategory = useCallback(
    (catName) => listings.filter((l) => (l.category || '').trim() === catName).length,
    [listings],
  );

  const sidebarSpotlights = useMemo(() => {
    const seen = new Set();
    const rows = [];
    for (const l of listings) {
      const key = l.workerId ?? `${l.workerName}-${l.workerLastName}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const name = [l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер';
      rows.push({ name, cat: (l.category || '').trim() || 'Услуга', rate: listingRatingValue(l) });
      if (rows.length >= 3) break;
    }
    return rows;
  }, [listings]);

  const platformFeedCycle = useMemo(() => resolvePlatformFeedCycle(openRequests), [openRequests]);

  const feedCycleMod = Math.max(1, platformFeedCycle.length);

  useEffect(() => {
    const t = setInterval(() => setFeedIdx((i) => (i + 1) % feedCycleMod), 3500);
    return () => clearInterval(t);
  }, [feedCycleMod]);

  const visibleFeed = useMemo(
    () => visiblePlatformFeedRows(platformFeedCycle, feedIdx),
    [platformFeedCycle, feedIdx],
  );

  const avgRatingListings = useMemo(() => averageListingRating(listings), [listings]);
  const masterCount = useMemo(() => uniqueWorkerCountFromListings(listings), [listings]);
  const openCount = openRequests.length;
  const todayReqCount = useMemo(() => openJobRequestsCreatedToday(openRequests), [openRequests]);

  const socialCustomerStats = useMemo(
    () => [
      [listings.length ? listings.length.toLocaleString('ru-RU') : '0', 'объявлений'],
      [avgRatingListings != null ? `${avgRatingListings.toFixed(1)} ★` : '—', 'ср. оценка'],
      [masterCount ? masterCount.toLocaleString('ru-RU') : '0', 'мастеров'],
      [openCount ? openCount.toLocaleString('ru-RU') : '0', 'открытых заявок'],
      [todayReqCount ? todayReqCount.toLocaleString('ru-RU') : '0', 'заявок сегодня'],
    ],
    [listings.length, avgRatingListings, masterCount, openCount, todayReqCount],
  );

  const discoveryChips = useMemo(() => {
    const top = masterListingCategoryChips.slice(0, 10);
    if (top.length) {
      return top.map((x) => ({ label: x.name, href: `/find-master?q=${encodeURIComponent(x.name)}` }));
    }
    return ALL_CATS.slice(0, 8).map((c) => ({
      label: c.name,
      href: `/find-master/${c.slug}`,
    }));
  }, [masterListingCategoryChips]);

  const quickSearchChips = useMemo(() => {
    const sorted = [...openRequests].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
    return sorted.slice(0, 4).map((r) => {
      const t = (r.title || '').trim();
      const label = t.length > 36 ? `${t.slice(0, 34)}…` : t || 'Заявка';
      return { label, q: t || 'заявка' };
    });
  }, [openRequests]);

  const onSearch = (e) => {
    e.preventDefault();
    const s = q.trim();
    navigate(s ? `/find-master?q=${encodeURIComponent(s)}` : '/find-master');
  };

  const quickGo = (text) => {
    navigate(`/find-master?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="chpv">
      <section className="chpv-hero">
        <div className="chpv-hero-inner">
          <div>
            <div className="chpv-eyebrow">
              <span className="chpv-dot" />
              {userId ? `${city} · Личный кабинет заказчика` : `${city} · Найдите мастера рядом`}
            </div>
            <h1 className="chpv-h1">
              Найдите мастера в <span className="chpv-h1-city">{cityInLocative(city)}</span>
              <br />
              рядом с вами
            </h1>
            <p className="chpv-sub">
              Ремонт, сантехника, красота и другие услуги — разместите заявку или выберите мастера по объявлениям и
              отзывам.
            </p>

            <form className="chpv-search" onSubmit={onSearch}>
              <div className="chpv-search-loc">📍 {city}</div>
              <div className="chpv-search-input">
                <span style={{ color: 'rgba(255,255,255,.4)' }} aria-hidden>
                  🔍
                </span>
                <input
                  placeholder="Что нужно сделать? Например: починить кран"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск мастера"
                />
              </div>
              <button type="submit" className="chpv-search-go">
                Найти →
              </button>
            </form>

            <div className="chpv-quick">
              {quickSearchChips.length ? (
                quickSearchChips.map((item, idx) => (
                  <button key={`${item.q}-${idx}`} type="button" className="chpv-quick-chip" onClick={() => quickGo(item.q)}>
                    {item.label}
                  </button>
                ))
              ) : (
                <button type="button" className="chpv-quick-chip" onClick={() => navigate('/find-master')}>
                  Каталог мастеров
                </button>
              )}
            </div>

            <div className="chpv-trust">
              <div className="chpv-trust-item">
                <strong>{listings.length.toLocaleString('ru-RU')}</strong>
                объявлений в каталоге
              </div>
              <div className="chpv-trust-item">
                <strong>{avgRatingListings != null ? `${avgRatingListings.toFixed(1)} ★` : '—'}</strong>
                средняя оценка в объявлениях
              </div>
              <div className="chpv-trust-item">
                <strong>{openCount.toLocaleString('ru-RU')}</strong>
                открытых заявок
              </div>
            </div>
          </div>

          <aside className="chpv-livecard">
            <div className="chpv-live-head">
              <span className="chpv-live-title">Сейчас на платформе</span>
              <span className="chpv-live-online">Онлайн</span>
            </div>
            <div className="chpv-feed">
              {visibleFeed.map((f) => (
                <div className="chpv-feed-row" key={f._k}>
                  <div className="chpv-feed-ava" style={{ background: f.color }}>
                    {(f.who && f.who[0]) || '·'}
                  </div>
                  <div className="chpv-feed-text">
                    <b>{f.who}</b> {f.what}
                  </div>
                  <div className="chpv-feed-time">{f.time}</div>
                </div>
              ))}
            </div>
            <div className="chpv-mini-stats">
              <div className="chpv-mini-stat">
                <b>{masterCount.toLocaleString('ru-RU')}</b>
                <span>мастеров с объявлениями</span>
              </div>
              <div className="chpv-mini-stat">
                <b>{todayReqCount.toLocaleString('ru-RU')}</b>
                <span>заявок сегодня</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="chpv-social">
        <div className="chpv-social-inner">
          {socialCustomerStats.map(([bold, lbl], i) => (
            <React.Fragment key={`soc-${lbl}-${i}`}>
              {i > 0 ? <div className="chpv-social-divider" /> : null}
              <div className="chpv-social-item">
                <b>{bold}</b>
                <span>{lbl}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="chpv-body">
        <main>
          <div className="chpv-section-hdr">
            <h2>Популярные категории</h2>
            <Link to="/find-master">Все категории →</Link>
          </div>
          <div className="chpv-bento">
            {bentoCats.map((cat, i) => {
              const n = countInCategory(cat.name);
              const img =
                CAT_PHOTOS[cat.slug] ||
                getCategoryPlaceholderPhotoUrlOrDefault(
                  { category: cat.name, categorySlug: cat.slug },
                  categoriesApi,
                );
              return (
                <Link key={cat.slug} className={`chpv-bento-tile ${i === 0 ? 'big' : ''}`} to={`/find-master/${cat.slug}`}>
                  {img ? (
                    <div className="chpv-bento-bg" style={{ backgroundImage: `url(${img})` }} />
                  ) : (
                    <div className="chpv-bento-bg chpv-bento-ph">{cat.emoji || '🛠️'}</div>
                  )}
                  <div className="chpv-bento-overlay" />
                  <div className="chpv-bento-body">
                    <div className="chpv-bento-name">{cat.name}</div>
                    <div className="chpv-bento-meta">
                      <span>{n ? `${n} объявлений` : 'мастера'}</span>
                      <span>в каталоге</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="chpv-chips">
            {discoveryChips.map((chip, idx) => (
              <Link key={`${chip.href}-${idx}`} className="chpv-chip" to={chip.href}>
                {chip.label}
              </Link>
            ))}
          </div>

          <div className="chpv-section-hdr" style={{ marginTop: 28 }}>
            <div>
              <h2 style={{ margin: 0 }}>Объявления мастеров</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888', fontWeight: 600 }}>
                {pluralListingsSubtitle(listings.length)}
              </p>
            </div>
            <Link to="/find-master">Все мастера →</Link>
          </div>

          <div className="chpv-filter-row">
            <button
              type="button"
              className={`chpv-filter${masterListCat === 'ALL' ? ' active' : ''}`}
              onClick={() => setMasterListCat('ALL')}
            >
              Все
            </button>
            {masterListingCategoryChips.slice(0, 6).map((c) => (
              <button
                key={c.name}
                type="button"
                className={`chpv-filter${masterListCat === c.name ? ' active' : ''}`}
                onClick={() => setMasterListCat(c.name)}
              >
                {c.name} · {c.n}
              </button>
            ))}
            <select
              className="chpv-sort"
              aria-label="Сортировка"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="new">Новые</option>
              <option value="cheap">Дешевле</option>
              <option value="rating">Рейтинг</option>
            </select>
          </div>

          <div className="chpv-grid">
            {listings.length === 0 ? (
              <div className="chpv-empty">
                <h3>Пока нет объявлений</h3>
                <p>Мастера скоро появятся — загляните позже или разместите заявку.</p>
              </div>
            ) : visibleMasterListings.length === 0 ? (
              <div className="chpv-empty">
                <h3>В этой категории нет объявлений</h3>
                <p>Попробуйте другой фильтр или раздел «Все мастера».</p>
              </div>
            ) : (
              visibleMasterListings.slice(0, shown).map((l) => {
                const img0 = l.photos?.[0];
                const src =
                  workerListingPhotoUrl(img0) ||
                  getCategoryPlaceholderPhotoUrlOrDefault({ category: l.category }, categoriesApi);
                const wname = [l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер';
                const priceNum = getListingPublishedPriceNumber(l);
                const priceStr = priceNum ? `${priceNum.toLocaleString('ru-RU')} ₽` : '— ₽';
                const rating = listingRatingValue(l);
                const locCity = (l.city && String(l.city).trim()) || city;
                const detail = `/listings/${l.id}?from=home`;
                return (
                  <article className="chpv-card" key={l.id}>
                    <div className="chpv-card-img">
                      <Link to={detail}>
                        <img src={src} alt="" loading="lazy" />
                      </Link>
                      {l.category ? <div className="chpv-card-tag">{l.category}</div> : null}
                      <div className="chpv-card-fav-slot">
                        <FavoriteHeartButton kind="listing" id={l.id} />
                      </div>
                      <div className="chpv-card-quick">
                        <Link to={detail} className="chpv-quick-btn primary" onClick={(e) => e.stopPropagation()}>
                          Написать
                        </Link>
                        <Link to={detail} className="chpv-quick-btn" onClick={(e) => e.stopPropagation()}>
                          Подробнее
                        </Link>
                      </div>
                    </div>
                    <Link to={detail} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="chpv-card-body">
                        <div>
                          <span className="chpv-card-price">{priceStr}</span>
                          <span className="chpv-card-unit">{l.priceUnit || 'за работу'}</span>
                        </div>
                        <div className="chpv-card-title">{l.title || 'Объявление'}</div>
                        <div className="chpv-card-meta">
                          {rating != null ? (
                            <span className="chpv-card-rate">★ {rating.toFixed(1)}</span>
                          ) : (
                            <span style={{ color: '#64748b', fontWeight: 600 }}>{wname}</span>
                          )}
                          <span className="chpv-card-verified">✓ На сервисе</span>
                          <span className="chpv-card-city">📍 {locCity}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })
            )}
          </div>
          {listings.length > 0 && shown < visibleMasterListings.length ? (
            <button type="button" className="chpv-cta-btn" style={{ marginTop: 14 }} onClick={() => setShown((s) => s + 8)}>
              Показать ещё · осталось {visibleMasterListings.length - shown}
            </button>
          ) : null}
        </main>

        <aside className="chpv-side">
          <div className="chpv-widget">
            <h3 className="chpv-widget-title">Заявка за 30 секунд</h3>
            <div className="chpv-step">
              <div className="chpv-step-num">1</div>
              <div className="chpv-step-text">
                <b>Опишите задачу</b>
                <span>Что и когда нужно сделать</span>
              </div>
            </div>
            <div className="chpv-step">
              <div className="chpv-step-num">2</div>
              <div className="chpv-step-text">
                <b>Получите отклики</b>
                <span>В среднем за несколько минут</span>
              </div>
            </div>
            <div className="chpv-step">
              <div className="chpv-step-num">3</div>
              <div className="chpv-step-text">
                <b>Выберите мастера</b>
                <span>Сравните цены и отзывы</span>
              </div>
            </div>
            <Link className="chpv-cta-btn" to={userId ? '/my-requests' : '/register'}>
              Разместить заявку →
            </Link>
          </div>

          <div className="chpv-widget">
            <h3 className="chpv-widget-title">Мастера с объявлениями</h3>
            {sidebarSpotlights.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                Здесь появятся мастера из актуальных объявлений.
              </p>
            ) : (
              sidebarSpotlights.map((m) => (
                <div className="chpv-top-master" key={m.name}>
                  <div className="chpv-tm-ava">{m.name[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="chpv-tm-name">{m.name}</div>
                    <div className="chpv-tm-cat">{m.cat}</div>
                  </div>
                  <div className="chpv-tm-rate">{m.rate != null ? `★ ${m.rate.toFixed(1)}` : '★ —'}</div>
                </div>
              ))
            )}
          </div>

          <div className="chpv-promo">
            <h3>Стать мастером</h3>
            <p>Получайте заказы каждый день. Регистрация бесплатно.</p>
            <Link className="chpv-promo-btn" to="/register?role=WORKER">
              Начать →
            </Link>
          </div>
        </aside>
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

export function WorkerHomePage({ userId, userName }) {
  const navigate = useNavigate();
  const [openRequests, setOpenRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [city, setCity] = useState('Йошкар-Ола');
  const [loading, setLoading] = useState(true);
  const [homeListCat, setHomeListCat] = useState('ALL');
  const [q, setQ] = useState('');
  const [feedIdx, setFeedIdx] = useState(0);
  const [shown, setShown] = useState(8);

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

  useEffect(() => {
    reloadWorkerHome();
  }, [reloadWorkerHome]);

  useSameRouteRefetch(WORKER_HOME_PATH, reloadWorkerHome);

  useEffect(() => {
    setShown(8);
  }, [homeListCat]);

  const platformFeedCycle = useMemo(() => resolvePlatformFeedCycle(openRequests), [openRequests]);

  const feedCycleMod = Math.max(1, platformFeedCycle.length);

  useEffect(() => {
    const t = setInterval(() => setFeedIdx((i) => (i + 1) % feedCycleMod), 3500);
    return () => clearInterval(t);
  }, [feedCycleMod]);

  const sortedOpenRequests = useMemo(
    () => [...openRequests].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [openRequests],
  );

  const catName = useCallback(
    (categoryId) => categories.find((c) => String(c.id) === String(categoryId))?.name || 'Заявка',
    [categories],
  );

  const homeListingCats = useMemo(() => {
    const s = new Map();
    sortedOpenRequests.forEach((i) => {
      const name = i.categoryName || catName(i.categoryId);
      if (name) s.set(name, (s.get(name) || 0) + 1);
    });
    return Array.from(s, ([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  }, [sortedOpenRequests, catName]);

  const homeVisibleRequests = useMemo(() => {
    if (homeListCat === 'ALL') return sortedOpenRequests;
    return sortedOpenRequests.filter((i) => {
      const name = i.categoryName || catName(i.categoryId);
      return name === homeListCat;
    });
  }, [sortedOpenRequests, homeListCat, catName]);

  const firstName = (userName || 'Мастер').trim().split(/\s+/)[0] || 'Мастер';
  const cityPrep = cityInLocative(city);
  const bentoCats = useMemo(() => ALL_CATS.slice(0, 5), []);

  const countRequestsInCategory = useCallback(
    (catDisplayName) =>
      sortedOpenRequests.filter((r) => (r.categoryName || catName(r.categoryId)) === catDisplayName).length,
    [sortedOpenRequests, catName],
  );

  const visibleFeed = useMemo(
    () => visiblePlatformFeedRows(platformFeedCycle, feedIdx),
    [platformFeedCycle, feedIdx],
  );

  const sidebarRequests = useMemo(() => sortedOpenRequests.slice(0, 3), [sortedOpenRequests]);

  const onSearch = (e) => {
    e.preventDefault();
    const s = q.trim();
    navigate(s ? `/find-work?q=${encodeURIComponent(s)}` : '/find-work');
  };

  const quickGo = (text) => {
    navigate(`/find-work?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="chpv">
      <section className="chpv-hero">
        <div className="chpv-hero-inner">
          <div>
            <div className="chpv-eyebrow">
              <span className="chpv-dot" />
              {city} · Личный кабинет мастера
            </div>
            <h1 className="chpv-h1">
              Заказы и клиенты в <span className="chpv-h1-city">{cityPrep}</span>
              <br />
              рядом с вами
            </h1>
            <p className="chpv-sub">
              Привет, {firstName}! Заявки заказчиков с открытыми задачами — ищите в каталоге или откликайтесь из карточек
              ниже.
            </p>

            <form className="chpv-search" onSubmit={onSearch}>
              <div className="chpv-search-loc">📍 {city}</div>
              <div className="chpv-search-input">
                <span style={{ color: 'rgba(255,255,255,.4)' }} aria-hidden>
                  🔍
                </span>
                <input
                  placeholder="Что ищете? Например: электрика на сегодня"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск заявок"
                />
              </div>
              <button type="submit" className="chpv-search-go">
                Найти →
              </button>
            </form>

            <div className="chpv-quick">
              {QUICK_WORKER.map((t) => (
                <button key={t} type="button" className="chpv-quick-chip" onClick={() => quickGo(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div className="chpv-trust">
              <div className="chpv-trust-item">
                <strong>{openRequests.length || '—'}</strong>
                заявок в ленте
              </div>
              <div className="chpv-trust-item">
                <strong>4.9 ★</strong>
                доверие заказчиков
              </div>
              <div className="chpv-trust-item">
                <strong>~7 мин</strong>
                средний отклик
              </div>
            </div>
          </div>

          <aside className="chpv-livecard">
            <div className="chpv-live-head">
              <span className="chpv-live-title">Сейчас на платформе</span>
              <span className="chpv-live-online">Онлайн</span>
            </div>
            <div className="chpv-feed">
              {visibleFeed.map((f) => (
                <div className="chpv-feed-row" key={f._k}>
                  <div className="chpv-feed-ava" style={{ background: f.color }}>
                    {f.who[0]}
                  </div>
                  <div className="chpv-feed-text">
                    <b>{f.who}</b> {f.what}
                  </div>
                  <div className="chpv-feed-time">{f.time}</div>
                </div>
              ))}
            </div>
            <div className="chpv-mini-stats">
              <div className="chpv-mini-stat">
                <b>{openRequests.length}</b>
                <span>в вашей ленте</span>
              </div>
              <div className="chpv-mini-stat">
                <b>{homeListingCats.length}</b>
                <span>направлений</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="chpv-social">
        <div className="chpv-social-inner">
          {SOCIAL_WORKER.map(([bold, lbl], i) => (
            <React.Fragment key={`w-soc-${i}`}>
              {i > 0 ? <div className="chpv-social-divider" /> : null}
              <div className="chpv-social-item">
                <b>{bold}</b>
                <span>{lbl}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="chpv-body">
        <main>
          <div className="chpv-section-hdr">
            <h2>Популярные направления</h2>
            <Link to="/find-work">Все заявки →</Link>
          </div>
          <div className="chpv-bento">
            {bentoCats.map((cat, i) => {
              const n = countRequestsInCategory(cat.name);
              const img = CAT_PHOTOS[cat.slug];
              return (
                <Link key={cat.slug} className={`chpv-bento-tile ${i === 0 ? 'big' : ''}`} to={`/find-work?q=${encodeURIComponent(cat.name)}`}>
                  {img ? (
                    <div className="chpv-bento-bg" style={{ backgroundImage: `url(${img})` }} />
                  ) : (
                    <div className="chpv-bento-bg chpv-bento-ph">{cat.emoji || '🛠️'}</div>
                  )}
                  <div className="chpv-bento-overlay" />
                  <div className="chpv-bento-body">
                    <div className="chpv-bento-name">{cat.name}</div>
                    <div className="chpv-bento-meta">
                      <span>{n ? `${n} заявок` : 'заявки'}</span>
                      <span>рядом</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="chpv-chips">
            {CHIPS_WORKER.map((chip) => (
              <Link key={chip} className="chpv-chip" to={`/find-work?q=${encodeURIComponent(chip)}`}>
                {chip}
              </Link>
            ))}
          </div>

          <div className="chpv-section-hdr" style={{ marginTop: 28 }}>
            <div>
              <h2 style={{ margin: 0 }}>Свежие заявки</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888', fontWeight: 600 }}>
                {loading ? 'Загрузка…' : `${pluralRequestsLabel(openRequests.length)} ждут отклика`}
              </p>
            </div>
            <Link to="/find-work">Все заявки →</Link>
          </div>

          <div className="chpv-filter-row">
            <button
              type="button"
              className={`chpv-filter${homeListCat === 'ALL' ? ' active' : ''}`}
              onClick={() => setHomeListCat('ALL')}
            >
              Все
            </button>
            {homeListingCats.slice(0, 6).map((c) => (
              <button
                key={c.name}
                type="button"
                className={`chpv-filter${homeListCat === c.name ? ' active' : ''}`}
                onClick={() => setHomeListCat(c.name)}
              >
                {c.name} · {c.n}
              </button>
            ))}
            <select className="chpv-sort" aria-label="Сортировка" defaultValue="new">
              <option value="new">Новые</option>
              <option value="cheap">По бюджету</option>
            </select>
          </div>

          <div className="chpv-grid">
            {loading ? (
              <div className="chpv-empty">
                <h3>Загружаем заявки…</h3>
                <p>Подождите несколько секунд.</p>
              </div>
            ) : homeVisibleRequests.length === 0 ? (
              <div className="chpv-empty">
                <h3>{homeListCat === 'ALL' ? 'Пока нет открытых заявок' : 'В этой категории пока нет заявок'}</h3>
                <p>
                  {homeListCat === 'ALL'
                    ? 'Когда заказчики опубликуют задачи, они появятся здесь и в разделе «Найти работу».'
                    : 'Попробуйте другой фильтр.'}
                </p>
              </div>
            ) : (
              homeVisibleRequests.slice(0, shown).map((item) => {
                const catLabel = item.categoryName || catName(item.categoryId);
                const photoSrc =
                  workerListingPhotoUrl(item.photos?.[0] || item.photo) ||
                  getCategoryPlaceholderPhotoUrlOrDefault({ categoryName: catLabel, categoryId: item.categoryId }, categories);
                const budgetLabel = formatJobRequestBudgetLabel(item);
                const hasPrice = hasJobRequestPublishedPrice(item);
                const locLine = (item.cityName || item.address || item.addressText || '').trim();
                const cityShort =
                  item.cityName || (locLine ? locLine.split(',')[0].trim() : '') || city;
                const custName =
                  [item.customerName, item.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
                const detail = `/find-work?request=${encodeURIComponent(item.id)}&from=home`;
                return (
                  <article className="chpv-card" key={item.id}>
                    <div className="chpv-card-img">
                      <Link to={detail}>
                        <img src={photoSrc} alt="" loading="lazy" />
                      </Link>
                      {catLabel ? <div className="chpv-card-tag">{catLabel}</div> : null}
                      <div className="chpv-card-fav-slot">
                        <FavoriteHeartButton kind="jobRequest" id={item.id} />
                      </div>
                      <div className="chpv-card-quick">
                        <Link to={detail} className="chpv-quick-btn primary" onClick={(e) => e.stopPropagation()}>
                          Откликнуться
                        </Link>
                        <Link to={detail} className="chpv-quick-btn" onClick={(e) => e.stopPropagation()}>
                          Подробнее
                        </Link>
                      </div>
                    </div>
                    <Link to={detail} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="chpv-card-body">
                        <div>
                          <span className="chpv-card-price">{hasPrice ? budgetLabel : '— ₽'}</span>
                          <span className="chpv-card-unit">{hasPrice ? 'в заявке' : 'бюджет'}</span>
                        </div>
                        <div className="chpv-card-title">{item.title}</div>
                        <div className="chpv-card-meta">
                          <span style={{ color: '#64748b', fontWeight: 600 }}>{custName}</span>
                          <span className="chpv-card-verified">● Открыта</span>
                          <span className="chpv-card-city">📍 {cityShort}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })
            )}
          </div>
          {!loading && homeVisibleRequests.length > 0 && shown < homeVisibleRequests.length ? (
            <button type="button" className="chpv-cta-btn" style={{ marginTop: 14 }} onClick={() => setShown((s) => s + 8)}>
              Показать ещё · осталось {homeVisibleRequests.length - shown}
            </button>
          ) : null}
        </main>

        <aside className="chpv-side">
          <div className="chpv-widget">
            <h3 className="chpv-widget-title">Отклик за минуту</h3>
            <div className="chpv-step">
              <div className="chpv-step-num">1</div>
              <div className="chpv-step-text">
                <b>Откройте заявку</b>
                <span>Подходит по городу и задаче</span>
              </div>
            </div>
            <div className="chpv-step">
              <div className="chpv-step-num">2</div>
              <div className="chpv-step-text">
                <b>Предложите цену</b>
                <span>Срок и комментарий в одном окне</span>
              </div>
            </div>
            <div className="chpv-step">
              <div className="chpv-step-num">3</div>
              <div className="chpv-step-text">
                <b>Договоритесь в чате</b>
                <span>Уточните детали с заказчиком</span>
              </div>
            </div>
            <Link className="chpv-cta-btn" to="/find-work">
              Смотреть заявки →
            </Link>
          </div>

          <div className="chpv-widget">
            <h3 className="chpv-widget-title">Свежие в ленте</h3>
            {sidebarRequests.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.5 }}>Заявки появятся здесь после загрузки.</p>
            ) : (
              sidebarRequests.map((r) => {
                const title = (r.title || 'Заявка').slice(0, 80);
                const budget = hasJobRequestPublishedPrice(r) ? formatJobRequestBudgetLabel(r) : 'бюджет уточняется';
                return (
                  <Link key={r.id} to={`/find-work?request=${encodeURIComponent(r.id)}`} className="chpv-top-master" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="chpv-tm-ava" style={{ fontSize: 12 }}>
                      {(r.customerName || '?')[0]}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="chpv-tm-name" style={{ fontSize: 12, lineHeight: 1.25 }}>
                        {title}
                      </div>
                      <div className="chpv-tm-cat">{budget}</div>
                    </div>
                    <div className="chpv-tm-rate" style={{ fontSize: 11, color: '#94a3b8' }}>
                      →
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="chpv-promo">
            <h3>Разместите объявление</h3>
            <p>Заказчики найдут вас сами. Публикация — несколько минут.</p>
            <Link className="chpv-promo-btn" to="/my-listings">
              Мои объявления →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}


/** Главная мастера: только для роли WORKER (отдельный URL `/worker-home`). */
export function WorkerHomeGate() {
  const { userId, userRole, userName } = useAuth();
  if (!userId) return <Navigate to="/login" replace />;
  if (userRole !== 'WORKER') return <Navigate to={CUSTOMER_HOME_PATH} replace />;
  return <WorkerHomePage userId={userId} userName={userName} />;
}

/** Главная заказчика и гостя — только витрина `/` (редирект мастера — в роутере App). */
export default function HomePage() {
  const { userId } = useAuth();
  if (userId == null || String(userId).trim() === '') {
    return <GuestLandingHome />;
  }
  return <CustomerHomePage userId={userId} />;
}
