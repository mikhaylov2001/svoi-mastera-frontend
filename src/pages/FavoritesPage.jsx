import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getListings, getOpenJobRequests, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { setFavorites } from '../utils/favoritesStorage';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
} from '../utils/categoryPlaceholderPhoto';
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

const TABS = [
  { key: 'all', label: 'Всё' },
  { key: 'master', label: 'Мастера' },
  { key: 'job', label: 'Заявки' },
];

const fmt = (n) => n.toLocaleString('ru-RU');

function categoryEmoji(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('электр')) return '⚡';
  if (n.includes('ремонт') || n.includes('стро')) return '🏗';
  if (n.includes('убор')) return '🧽';
  if (n.includes('сантех')) return '🚿';
  if (n.includes('мебел')) return '🪑';
  if (n.includes('парик') || n.includes('волос')) return '✂️';
  if (n.includes('маник')) return '💅';
  return '📌';
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [L, R, C] = await Promise.all([
          getListings(),
          getOpenJobRequests(),
          getCategories(),
        ]);
        if (cancelled) return;
        setListings(Array.isArray(L) ? L : []);
        setRequests(Array.isArray(R) ? R : []);
        setCategories(Array.isArray(C) ? C : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        out.push({
          kind: 'master',
          key: `m-${sid}`,
          missing: true,
          rawId: sid,
        });
        continue;
      }
      const wname =
        [l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер';
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
        title: `${wname} — ${l.title || 'Услуга'}`,
        desc: (l.description || l.details || '').trim(),
        photo,
        emoji: categoryEmoji(l.category),
        category: l.category || 'Услуга',
        price,
        priceLabel: l.priceUnit || 'от · час',
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
        out.push({
          kind: 'job',
          key: `j-${sid}`,
          missing: true,
          rawId: sid,
        });
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
        title: item.title || 'Заявка',
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

  const visible = items;

  const filtered = useMemo(() => {
    let r = visible;
    if (tab !== 'all') r = r.filter((i) => i.kind === tab);
    const s = q.trim().toLowerCase();
    if (s) {
      r = r.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(s)) ||
          (i.desc && i.desc.toLowerCase().includes(s)) ||
          (i.category && i.category.toLowerCase().includes(s)),
      );
    }
    if (sort === 'price-asc') {
      r = [...r].sort((a, b) => (a.price ?? 1e12) - (b.price ?? 1e12));
    }
    if (sort === 'price-desc') {
      r = [...r].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    return r;
  }, [visible, tab, q, sort]);

  const counts = useMemo(
    () => ({
      all: visible.length,
      master: visible.filter((i) => i.kind === 'master').length,
      job: visible.filter((i) => i.kind === 'job').length,
    }),
    [visible],
  );

  const bumpRemove = (key, fn) => {
    setPopping(key);
    setTimeout(() => setPopping(null), 350);
    fn();
  };

  const removeItem = (i) => {
    if (i.missing) {
      if (i.kind === 'master') toggleListing(i.rawId);
      else toggleJobRequest(i.rawId);
      return;
    }
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
      navigator.clipboard?.writeText(url).then(() => alert('Ссылка скопирована')).catch(() => {});
    }
  };

  return (
    <div className="fav-page">
      <header className="fav-hero">
        <img src={HERO_IMG} alt="" />
        <div className="fav-hero-inner">
          <div>
            <h1>
              <span className="heart" aria-hidden>
                ❤
              </span>{' '}
              Избранное
            </h1>
            <p>Мастера и заявки, которые вы сохранили</p>
          </div>
          <Link to={catalogLink} className="fav-cta">
            Найти ещё →
          </Link>
        </div>
      </header>

      <main className="fav-main">
        {loading ? (
          <div className="fav-loading">Загрузка…</div>
        ) : err ? (
          <div className="fav-err">{err}</div>
        ) : (
          <>
            <div className="fav-toolbar">
              <div className="fav-tabs">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`fav-tab ${tab === t.key ? 'active' : ''}`}
                  >
                    {t.label}
                    <span className="fav-tab-count">{counts[t.key]}</span>
                  </button>
                ))}
              </div>
              <div className="fav-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3-3" />
                </svg>
                <input
                  placeholder="Поиск в избранном…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Поиск в избранном"
                />
              </div>
              <select className="fav-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Сначала новые</option>
                <option value="price-asc">Цена ↑</option>
                <option value="price-desc">Цена ↓</option>
              </select>
            </div>

            {visible.length > 0 && (
              <div className="fav-bulk">
                <span className="fav-bulk-text">
                  Сохранено: {visible.length} · можно очистить весь список
                </span>
                <button type="button" className="fav-bulk-btn" onClick={clearAll}>
                  Очистить всё
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="fav-empty">
                <div className="fav-empty-emoji">💔</div>
                <div className="fav-empty-title">
                  {visible.length === 0 ? 'В избранном пока пусто' : 'Ничего не нашли'}
                </div>
                <div className="fav-empty-sub">
                  {visible.length === 0
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
                        <div className="fav-card-top">
                          <div className="fav-card-photo">
                            <button
                              type="button"
                              className={`fav-heart on ${popping === i.key ? 'pop' : ''}`}
                              onClick={() => bumpRemove(i.key, () => removeItem(i))}
                              title="Убрать из избранного"
                            >
                              ❤
                            </button>
                            <span className="emoji">📭</span>
                          </div>
                          <div className="fav-card-body">
                            <div className="fav-card-row">
                              <h3 className="fav-card-title">
                                {i.kind === 'master'
                                  ? 'Объявление недоступно'
                                  : 'Заявка недоступна или закрыта'}
                              </h3>
                              <span className={`fav-type ${i.kind}`}>
                                {i.kind === 'master' ? 'Мастер' : 'Заявка'}
                              </span>
                            </div>
                            <div className="fav-card-desc">Уберите запись из избранного.</div>
                          </div>
                        </div>
                        <div className="fav-meta">
                          <span className="fav-meta-item">—</span>
                          <span className="fav-saved-at">сохранено · —</span>
                        </div>
                        <div className="fav-actions">
                          <button
                            type="button"
                            className="fav-btn fav-btn-primary"
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
                      ? `/listings/${i.rawId}?from=favorites`
                      : `/find-work?request=${encodeURIComponent(i.rawId)}&from=favorites`;
                  const sharePath =
                    i.kind === 'master' ? `/listings/${i.rawId}` : `/find-work?request=${encodeURIComponent(i.rawId)}`;

                  return (
                    <article key={i.key} className="fav-card">
                      <div className="fav-card-top">
                        <div className="fav-card-photo">
                          <button
                            type="button"
                            className={`fav-heart on ${popping === i.key ? 'pop' : ''}`}
                            onClick={() => bumpRemove(i.key, () => removeItem(i))}
                            title="Убрать из избранного"
                          >
                            ❤
                          </button>
                          {i.photo ? (
                            <img src={i.photo} alt="" />
                          ) : (
                            <span className="emoji">{i.emoji}</span>
                          )}
                        </div>
                        <div className="fav-card-body">
                          <div className="fav-card-row">
                            <h3 className="fav-card-title">{i.title}</h3>
                            <span className={`fav-type ${i.kind}`}>
                              {i.kind === 'master' ? 'Мастер' : 'Заявка'}
                            </span>
                          </div>
                          {i.desc ? <div className="fav-card-desc">{i.desc}</div> : null}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              flexWrap: 'wrap',
                              marginTop: 4,
                            }}
                          >
                            <span className="fav-cat">
                              {i.emoji} {i.category}
                            </span>
                            {i.kind === 'master' && i.rating != null && (
                              <span className="fav-rating">
                                <span className="star">★</span>
                                {i.rating.toFixed(1)}
                                {i.reviews != null && (
                                  <span className="fav-rating-count">· {i.reviews} отзывов</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="fav-price-row">
                            <div>
                              {i.price ? (
                                <>
                                  <span className="fav-price-num">{fmt(i.price)} ₽</span>
                                  <span className="fav-price-lbl">{i.priceLabel}</span>
                                </>
                              ) : (
                                <span
                                  className="fav-price-lbl"
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#64748b',
                                    marginLeft: 0,
                                  }}
                                >
                                  {i.priceLabel === 'договорная' ? 'Договорная' : i.priceLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="fav-meta">
                        <span className="fav-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                          {i.city}
                        </span>
                        <span className="fav-saved-at">сохранено · {i.savedAt}</span>
                      </div>

                      <div className="fav-actions">
                        <Link to={primaryTo} className="fav-btn fav-btn-primary">
                          {i.kind === 'master' ? 'Написать мастеру' : 'Открыть заявку'}
                        </Link>
                        <button
                          type="button"
                          className="fav-btn fav-btn-ghost fav-btn-icon"
                          title="Поделиться"
                          onClick={() => shareUrl(sharePath)}
                        >
                          🔗
                        </button>
                        <button
                          type="button"
                          className="fav-btn fav-btn-ghost fav-btn-icon"
                          title="Убрать"
                          onClick={() => bumpRemove(i.key, () => removeItem(i))}
                        >
                          🗑
                        </button>
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
