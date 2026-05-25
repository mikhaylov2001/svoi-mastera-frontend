import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCategories,
  getListingById,
  getJobRequestById,
  getOpenJobRequests,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { setFavorites } from '../utils/favoritesStorage';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../utils/listingPublishedPrice';
import {
  getJobRequestPublishedBudgetNumber,
  hasJobRequestPublishedPrice,
} from '../utils/jobRequestBudget';
import './favorites.css';

const BACKEND_ORIGIN = 'https://svoi-mastera-backend.onrender.com';
const HERO_IMG = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80';

function mediaUrl(u) {
  if (!u) return null;
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND_ORIGIN + u;
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Сначала новые' },
  { value: 'price-asc', label: 'Цена ↑' },
  { value: 'price-desc', label: 'Цена ↓' },
];

const fmt = (n) => Number(n).toLocaleString('ru-RU');

function categoryEmoji(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('электр')) return '⚡';
  if (n.includes('ремонт') || n.includes('стро')) return '🔨';
  if (n.includes('убор')) return '🧽';
  if (n.includes('сантех')) return '🔧';
  if (n.includes('мебел')) return '🪑';
  if (n.includes('парик') || n.includes('волос')) return '✂️';
  if (n.includes('маник')) return '💅';
  return '📌';
}

function HeartIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#fff' : 'none'} stroke={filled ? '#fff' : 'currentColor'} strokeWidth="2" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function FavoritesPage() {
  const { userId, isWorker } = useAuth();
  const { listingIds, jobRequestIds, toggleListing, toggleJobRequest } = useFavorites();

  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent');
  const [popping, setPopping] = useState(null);

  const listingKey = listingIds.join(',');
  const jobRequestKey = jobRequestIds.join(',');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const C = await getCategories();
        if (cancelled) return;
        setCategories(Array.isArray(C) ? C : []);

        const L = await Promise.all(
          listingIds.map((id) => getListingById(id).catch(() => null)),
        ).then((rows) => rows.filter(Boolean));

        let R = [];
        if (jobRequestIds.length) {
          if (userId) {
            R = await Promise.all(
              jobRequestIds.map((jid) => getJobRequestById(userId, jid).catch(() => null)),
            ).then((rows) => rows.filter(Boolean));
          } else {
            try {
              const open = await getOpenJobRequests();
              const arr = Array.isArray(open) ? open : [];
              const want = new Set(jobRequestIds.map(String));
              R = arr.filter((r) => want.has(String(r.id)));
            } catch {
              R = [];
            }
          }
        }

        if (!cancelled) {
          setListings(L);
          setRequests(R);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, listingKey, jobRequestKey]);

  const catName = useCallback(
    (categoryId) => categories.find((c) => String(c.id) === String(categoryId))?.name || 'Заявка',
    [categories],
  );

  const listingById = useMemo(() => {
    const m = new Map();
    listings.forEach((l) => m.set(String(l.id), l));
    return m;
  }, [listings]);

  const requestById = useMemo(() => {
    const m = new Map();
    requests.forEach((r) => m.set(String(r.id), r));
    return m;
  }, [requests]);

  const items = useMemo(() => {
    const out = [];
    const defaultCity = 'Йошкар-Ола';

    for (const id of listingIds) {
      const sid = String(id);
      const l = listingById.get(sid);
      if (!l) {
        out.push({ kind: 'master', key: `m-${sid}`, missing: true, rawId: sid });
        continue;
      }
      const wname = [l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер';
      const img0 = l.photos?.[0];
      const photo =
        mediaUrl(img0) ||
        getCategoryPlaceholderPhotoUrlOrDefault({ category: l.category }, categories);
      const price = getListingPublishedPriceNumber(l);
      const rating = Number(l.workerRating ?? l.averageRating ?? 0) || null;
      const reviews = Number(l.workerReviewsCount ?? l.reviewsCount ?? l.reviewCount ?? 0) || null;

      out.push({
        kind: 'master',
        key: `m-${l.id}`,
        rawId: String(l.id),
        name: wname,
        title: l.title || 'Услуга',
        desc: (l.description || l.details || '').trim(),
        photo,
        emoji: categoryEmoji(l.category),
        category: l.category || 'Услуга',
        price,
        priceLabel: l.priceUnit || 'за работу',
        city: (l.city || l.cityName || l.address || defaultCity).toString().split(',')[0].trim() || defaultCity,
        savedAt: 'недавно',
        rating: rating && rating > 0 ? rating : null,
        reviews: reviews && reviews > 0 ? reviews : null,
      });
    }

    for (const id of jobRequestIds) {
      const sid = String(id);
      const item = requestById.get(sid);
      if (!item) {
        out.push({ kind: 'job', key: `j-${sid}`, missing: true, rawId: sid });
        continue;
      }
      const catLabel = item.categoryName || catName(item.categoryId);
      const photoSrc =
        mediaUrl(item.photos?.[0] || item.photo) ||
        getCategoryPlaceholderPhotoUrlOrDefault(
          { categoryName: catLabel, categoryId: item.categoryId },
          categories,
        );
      const hasPrice = hasJobRequestPublishedPrice(item);
      const priceNum = getJobRequestPublishedBudgetNumber(item);
      const locLine = (item.cityName || item.address || item.addressText || '').trim();
      const cityShort =
        item.cityName || (locLine ? locLine.split(',')[0].trim() : '') || defaultCity;

      out.push({
        kind: 'job',
        key: `j-${item.id}`,
        rawId: String(item.id),
        name: item.title || 'Заявка',
        title: catLabel,
        desc: (item.description || item.details || '').trim(),
        photo: photoSrc,
        emoji: categoryEmoji(catLabel),
        category: catLabel,
        price: priceNum && priceNum > 0 ? priceNum : null,
        priceLabel: hasPrice ? 'бюджет' : 'договорная',
        city: cityShort,
        savedAt: 'недавно',
        rating: null,
        reviews: null,
      });
    }

    return out;
  }, [listingIds, jobRequestIds, listingById, requestById, categories, catName]);

  const filtered = useMemo(() => {
    let r = items;
    if (tab !== 'all') r = r.filter((i) => i.kind === tab);
    const s = q.trim().toLowerCase();
    if (s) {
      r = r.filter(
        (i) =>
          (i.name && i.name.toLowerCase().includes(s)) ||
          (i.title && i.title.toLowerCase().includes(s)) ||
          (i.category && i.category.toLowerCase().includes(s)),
      );
    }
    if (sort === 'price-asc') r = [...r].sort((a, b) => (a.price ?? 1e12) - (b.price ?? 1e12));
    if (sort === 'price-desc') r = [...r].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return r;
  }, [items, tab, q, sort]);

  const counts = useMemo(() => ({
    all: items.length,
    master: items.filter((i) => i.kind === 'master').length,
    job: items.filter((i) => i.kind === 'job').length,
  }), [items]);

  const TABS = [
    { key: 'all', label: 'Все', count: counts.all },
    { key: 'master', label: 'Мастера', count: counts.master },
    { key: 'job', label: 'Заявки', count: counts.job },
  ];

  const bumpRemove = (key, fn) => {
    setPopping(key);
    setTimeout(() => setPopping(null), 350);
    fn();
  };

  const removeItem = (i) => {
    if (i.kind === 'master') toggleListing(i.rawId);
    else toggleJobRequest(i.rawId);
  };

  const clearAll = () => {
    if (!window.confirm('Убрать все объявления и заявки из избранного?')) return;
    setFavorites(userId, { listings: [], jobRequests: [] });
  };

  const catalogLink = isWorker ? '/find-work' : '/find-master';

  const shareUrl = (path) => {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      navigator.share({ title: 'Свои мастера', url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => {}).catch(() => {});
    }
  };

  return (
    <div className="fav-page">
      {/* ── Hero ── */}
      <div className="fav-hero">
        <img src={HERO_IMG} alt="" />
        <div className="fav-hero-inner">
          <div className="fav-hero-content">
            <div className="fav-hero-badge">
              <span>❤️</span>
              <span>Избранное</span>
            </div>
            <div className="fav-hero-row">
              <div>
                <h1 className="fav-hero-title">Избранное</h1>
                <p className="fav-hero-sub">Мастера и заявки, которые вы сохранили</p>
              </div>
              <Link to={catalogLink} className="fav-cta">
                Найти ещё →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="fav-main">
        {loading ? (
          <div className="fav-loading">⏳ Загружаем избранное…</div>
        ) : err ? (
          <div className="fav-err">{err}</div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="fav-toolbar">
              <div className="fav-tabs">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`fav-tab${tab === t.key ? ' active' : ''}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                    <span className="fav-tab-count">{t.count}</span>
                  </button>
                ))}
              </div>

              <div className="fav-search">
                <SearchIcon />
                <input
                  placeholder="Поиск в избранном…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск в избранном"
                />
              </div>

              <select
                className="fav-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Сортировка"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Info bar */}
            {items.length > 0 && (
              <div className="fav-bulk">
                <span className="fav-bulk-text">
                  Сохранено: {items.length} · можно очистить весь список
                </span>
                <button type="button" className="fav-bulk-btn" onClick={clearAll}>
                  Очистить всё
                </button>
              </div>
            )}

            {/* Grid / empty */}
            {filtered.length === 0 ? (
              <div className="fav-empty">
                <div className="fav-empty-emoji">💔</div>
                <div className="fav-empty-title">
                  {items.length === 0 ? 'В избранном пока пусто' : 'Ничего не нашли'}
                </div>
                <div className="fav-empty-sub">
                  {items.length === 0
                    ? 'Нажмите ❤ на карточке мастера или заявки, чтобы быстро вернуться к ней позже.'
                    : 'Попробуйте изменить фильтр или поисковый запрос.'}
                </div>
                <Link to={catalogLink} className="fav-empty-cta">
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <div className="fav-grid">
                {filtered.map((i) => {
                  if (i.missing) {
                    return (
                      <article key={i.key} className="fav-card fav-card-miss">
                        <div className="fav-card-photo-wrap">
                          <div className="fav-card-photo fav-card-photo--empty">
                            <span className="fav-card-photo-emoji">📭</span>
                          </div>
                          <button
                            type="button"
                            className={`fav-heart on${popping === i.key ? ' pop' : ''}`}
                            onClick={() => bumpRemove(i.key, () => removeItem(i))}
                            title="Убрать из избранного"
                          >
                            <HeartIcon filled />
                          </button>
                          <div className="fav-type-badge">
                            {i.kind === 'master' ? 'Мастер' : 'Заявка'}
                          </div>
                        </div>
                        <div className="fav-card-body">
                          <div className="fav-card-name">
                            {i.kind === 'master' ? 'Объявление недоступно' : 'Заявка закрыта'}
                          </div>
                          <div className="fav-card-subtitle">Уберите запись из избранного</div>
                          <button
                            type="button"
                            className="fav-btn-action"
                            onClick={() => bumpRemove(i.key, () => removeItem(i))}
                          >
                            Убрать из избранного
                          </button>
                        </div>
                      </article>
                    );
                  }

                  const primaryTo =
                    i.kind === 'master'
                      ? `/listings/${i.rawId}`
                      : `/find-work?request=${encodeURIComponent(i.rawId)}`;
                  const sharePath =
                    i.kind === 'master'
                      ? `/listings/${i.rawId}`
                      : `/find-work?request=${encodeURIComponent(i.rawId)}`;

                  return (
                    <article
                      key={i.key}
                      className="fav-card"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(17,24,39,.10)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '';
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      {/* Photo */}
                      <div className="fav-card-photo-wrap">
                        <Link to={primaryTo} className="fav-card-photo-link" tabIndex={-1}>
                          {i.photo ? (
                            <img src={i.photo} alt={i.name} className="fav-card-img" />
                          ) : (
                            <div className="fav-card-photo fav-card-photo--empty">
                              <span className="fav-card-photo-emoji">{i.emoji}</span>
                            </div>
                          )}
                        </Link>
                        {/* Heart */}
                        <button
                          type="button"
                          className={`fav-heart on${popping === i.key ? ' pop' : ''}`}
                          onClick={() => bumpRemove(i.key, () => removeItem(i))}
                          title="Убрать из избранного"
                        >
                          <HeartIcon filled />
                        </button>
                        {/* Type badge */}
                        <div className="fav-type-badge">
                          {i.kind === 'master' ? 'Мастер' : 'Заявка'}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="fav-card-body">
                        <Link to={primaryTo} className="fav-card-link-title">
                          <div className="fav-card-name">{i.name} — {i.title}</div>
                        </Link>
                        <div className="fav-card-subtitle">Подробно в описании</div>

                        <span className="fav-cat">
                          {i.emoji} {i.category}
                        </span>

                        {i.kind === 'master' && i.rating != null && (
                          <div className="fav-rating">
                            <span className="fav-star">★</span>
                            {i.rating.toFixed(1)}
                            {i.reviews != null && (
                              <span className="fav-rating-count">· {i.reviews} отзывов</span>
                            )}
                          </div>
                        )}

                        {i.price ? (
                          <div className="fav-price">
                            {fmt(i.price)} ₽
                            <span className="fav-price-lbl">{i.priceLabel}</span>
                          </div>
                        ) : (
                          <div className="fav-price fav-price--neg">
                            {i.priceLabel === 'договорная' ? 'Договорная' : i.priceLabel}
                          </div>
                        )}

                        <div className="fav-meta-row">
                          <span className="fav-city">📍 {i.city}</span>
                          <span className="fav-saved">сохранено · {i.savedAt}</span>
                        </div>

                        <div className="fav-card-actions">
                          <Link to={primaryTo} className="fav-btn-action">
                            {i.kind === 'master' ? 'Написать мастеру' : 'Открыть заявку'}
                          </Link>
                          <button
                            type="button"
                            className="fav-btn-icon-sm"
                            title="Поделиться"
                            onClick={() => shareUrl(sharePath)}
                          >
                            🔗
                          </button>
                          <button
                            type="button"
                            className="fav-btn-icon-sm fav-btn-icon-sm--del"
                            title="Убрать"
                            onClick={() => bumpRemove(i.key, () => removeItem(i))}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
