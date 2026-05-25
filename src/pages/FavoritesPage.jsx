import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  formatJobRequestBudgetLabel,
  getJobRequestPublishedBudgetNumber,
  hasJobRequestPublishedPrice,
} from '../utils/jobRequestBudget';
import CardFavoriteSlot from '../components/CardFavoriteSlot';
import SortDropdown from '../components/SortDropdown';
import { moOrdersListShellCss } from '../styles/moOrdersListShellCss.js';
import '../styles/moCabinetStyle.css';
import './favorites.css';

const BACKEND_ORIGIN = 'https://svoi-mastera-backend.onrender.com';
const HERO_IMG = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2400&q=86';

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

export default function FavoritesPage() {
  const navigate = useNavigate();
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
      const custName =
        [item.customerName, item.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
      const locLine = (item.cityName || item.address || item.addressText || '').trim();
      const cityShort =
        item.cityName || (locLine ? locLine.split(',')[0].trim() : '') || defaultCity;

      out.push({
        kind: 'job',
        key: `j-${item.id}`,
        rawId: String(item.id),
        name: custName,
        title: item.title || 'Заявка',
        desc: (item.description || item.details || '').trim(),
        photo: photoSrc,
        emoji: categoryEmoji(catLabel),
        category: catLabel,
        hasPrice,
        budgetLabel: formatJobRequestBudgetLabel(item),
        price: priceNum && priceNum > 0 ? priceNum : null,
        priceLabel: hasPrice ? 'в заявке' : 'бюджет',
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

  const bumpRemove = (_key, fn) => fn();

  const removeItem = (i) => {
    if (i.kind === 'master') toggleListing(i.rawId);
    else toggleJobRequest(i.rawId);
  };

  const clearAll = () => {
    if (!window.confirm('Убрать все объявления и заявки из избранного?')) return;
    setFavorites(userId, { listings: [], jobRequests: [] });
  };

  const catalogLink = isWorker ? '/find-work' : '/find-master';

  const openItem = (i) => {
    const to =
      i.kind === 'master'
        ? `/listings/${i.rawId}?from=favorites`
        : `/find-work?request=${encodeURIComponent(i.rawId)}&from=favorites`;
    navigate(to);
  };

  const renderCard = (i) => {
    if (i.missing) {
      return (
        <article key={i.key} className="mo-card fav-card-miss">
          <div className="mo-card-media">
            <div className="fav-card-ph-empty">{i.kind === 'master' ? '🔨' : '📋'}</div>
            <CardFavoriteSlot
              kind={i.kind === 'master' ? 'listing' : 'jobRequest'}
              id={i.rawId}
              className="mo-card-fav-slot card-fav-slot"
              forcedActive
              onToggle={() => bumpRemove(i.key, () => removeItem(i))}
            />
          </div>
          <div className="mo-card-content fav-card-catalog-body">
            <h3 className="mo-card-title">
              {i.kind === 'master' ? 'Объявление недоступно' : 'Заявка закрыта'}
            </h3>
          </div>
          <div className="mo-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mo-btn mo-btn-secondary"
              onClick={() => bumpRemove(i.key, () => removeItem(i))}
            >
              Убрать из избранного
            </button>
          </div>
        </article>
      );
    }

    const writeLabel = i.kind === 'master' ? 'Написать' : 'Открыть';
    const priceStr =
      i.kind === 'master'
        ? (i.price ? `${fmt(i.price)} ₽` : '— ₽')
        : (i.hasPrice ? i.budgetLabel : '— ₽');
    const unitLabel =
      i.kind === 'master' ? (i.priceLabel || 'за работу') : (i.hasPrice ? 'в заявке' : 'бюджет');
    const ratingVal = i.rating != null ? i.rating.toFixed(1) : '0.0';
    const statusLabel = i.kind === 'master' ? '✓ На сервисе' : '● Открыта';

    return (
      <article
        key={i.key}
        className="mo-card fav-card"
        role="button"
        tabIndex={0}
        onClick={() => openItem(i)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openItem(i);
          }
        }}
      >
        <div className="mo-card-media">
          {i.photo ? (
            <img src={i.photo} alt="" loading="lazy" />
          ) : (
            <div className="fav-card-ph-empty">{i.emoji}</div>
          )}
          {i.category ? <span className="fav-cat-tag">{i.category}</span> : null}
          <CardFavoriteSlot
            kind={i.kind === 'master' ? 'listing' : 'jobRequest'}
            id={i.rawId}
            className="mo-card-fav-slot card-fav-slot"
          />
        </div>

        <div className="mo-card-content fav-card-catalog-body">
          <div className="fav-price-row">
            <span className="fav-price">{priceStr}</span>
            <span className="fav-price-unit">{unitLabel}</span>
          </div>
          <h3 className="mo-card-title fav-card-title">{i.title || i.name}</h3>
          <div className="fav-card-meta">
            {i.kind === 'master' ? (
              <span className="fav-card-rate">★ {ratingVal}</span>
            ) : (
              <span className="fav-card-author">{i.name}</span>
            )}
            <span className="fav-card-status">{statusLabel}</span>
            <span className="fav-card-city">📍 {i.city}</span>
          </div>
        </div>

        <div className="mo-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="mo-btn mo-btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              openItem(i);
            }}
          >
            {writeLabel}
          </button>
          <button
            type="button"
            className="mo-btn mo-btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              openItem(i);
            }}
          >
            Подробнее
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="mo-page mo-orders-root fav-page">
      <style>{moOrdersListShellCss}</style>
      <header className="mo-hero">
        <img src={HERO_IMG} alt="" />
        <div className="mo-hero-inner">
          <div className="mo-hero-copy">
            <h1>Избранное</h1>
            <p>Мастера и заявки, которые вы сохранили</p>
          </div>
          <Link to={catalogLink} className="mo-cta">
            {isWorker ? '+ Найти работу' : '+ Найти ещё'}
          </Link>
        </div>
      </header>

      <main className="mo-main">
        {loading ? (
          <div className="mo-empty">
            <div className="mo-empty-emoji">⏳</div>
            <div className="mo-empty-title">Загружаем избранное…</div>
          </div>
        ) : err ? (
          <div className="fav-err">{err}</div>
        ) : (
          <>
            <div className="mo-toolbar">
              <div className="mo-status-tabs">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`mo-status-tab${tab === t.key ? ' active' : ''}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                    <span className="mo-status-tab-count">{t.count}</span>
                  </button>
                ))}
              </div>

              <div className="mo-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3-3" />
                </svg>
                <input
                  type="search"
                  placeholder="Поиск в избранном…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск в избранном"
                  autoComplete="off"
                />
              </div>

              <SortDropdown
                value={sort}
                onChange={setSort}
                options={SORT_OPTIONS}
                variant="toolbar"
                ariaLabel="Сортировка избранного"
              />
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
              <div className="mo-empty">
                <div className="mo-empty-emoji">💔</div>
                <div className="mo-empty-title">
                  {items.length === 0 ? 'В избранном пока пусто' : 'Ничего не нашли'}
                </div>
                <div className="mo-empty-sub">
                  {items.length === 0
                    ? 'Нажмите ❤ на карточке мастера или заявки, чтобы быстро вернуться к ней позже.'
                    : 'Попробуйте изменить фильтр или поисковый запрос.'}
                </div>
                <div className="mo-empty-actions">
                  <Link to={catalogLink} className="mo-cta">
                    {isWorker ? '+ Найти работу' : '+ Перейти в каталог'}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mo-grid listing-grid fav-grid">
                {filtered.map(renderCard)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
