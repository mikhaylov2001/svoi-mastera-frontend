import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getCategories,
  getListings,
  acceptListingDeal,
  getMyDeals,
  cancelPendingDeal,
  getWorkerStats,
} from '../../api';
import { fetchStatsMap } from '../../utils/fetchStatsMap';
import { formatCatalogCountShort } from '../../utils/formatCatalogCountShort';
import { formatListingsCount } from '../../utils/formatCountRu';
import CatalogSearchCount from '../../components/CatalogSearchCount';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import { PAGE_HERO_DEFAULT_PHOTO, heroPhotoHiRes } from '../../constants/pageHeroAssets';
import { findCatalogPageCss } from '../shared/findCatalogPageCss';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { smartTextMatchScore, listingHaystack, rankItemsBySmartMatch, searchCatalogItems } from '../../utils/smartSearch';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
} from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import {
  listingMatchesCatalogCategory,
  mergeApiCategoriesWithCatalog,
} from '../../utils/mergeApiCategoriesWithCatalog';
import CardFavoriteSlot from '../../components/CardFavoriteSlot';
import { catalogCatFeedMobileCss } from '../shared/catalogCatFeedMobileCss';
import {
  CatalogSearchDropdownFooter,
  CatalogSearchDropdownHint,
  CatalogSearchDropdownHit,
  formatCatalogSearchHitPrice,
} from '../shared/catalogCategorySearchDropdown';
import { useIsMobileCatalog } from '../../hooks/useIsMobileCatalog';
import '../worker/jobListings.css';

/* Плоский словарь slug → данные категории (фото, описание, цена, …) */
const CAT_ALL = {};
Object.values(CATEGORIES_BY_SECTION).forEach((cats) =>
  cats.forEach((cat) => {
    CAT_ALL[cat.slug] = { ...cat, photo: heroPhotoHiRes(cat.photo) };
  }),
);

/** Заголовок объявления в карточке: первая буква по правилам ru-RU. */
function displayListingTitle(t) {
  const raw = typeof t === 'string' ? t.trim() : '';
  if (!raw) return 'Объявление';
  return raw.charAt(0).toLocaleUpperCase('ru-RU') + raw.slice(1);
}

function listingFeedStatusLabel(s) {
  if (s?.active === false) return 'НЕАКТИВНО';
  const t = s?.createdAt ? new Date(s.createdAt).getTime() : 0;
  if (t && Date.now() - t < 72 * 3600 * 1000) return 'НОВОЕ';
  return 'АКТИВНО';
}

function listingFeedLooksUrgent(s) {
  const hay = `${s?.title || ''} ${s?.description || ''}`.toLowerCase();
  return hay.includes('срочн') || hay.includes('сегодня') || hay.includes('завтра');
}

const HERO_PHOTO = PAGE_HERO_DEFAULT_PHOTO;

function CheckItem({ checked, onChange, children }) {
  return (
    <div className="fmp-check-item" onClick={onChange}>
      <div className={`fmp-check-box${checked ? ' on' : ''}`}>
        {checked && <span className="fmp-check-tick">✓</span>}
      </div>
      <span>{children}</span>
    </div>
  );
}

export default function FindMasterPage() {
  const navigate  = useNavigate();
  const { categorySlug } = useParams();
  const { userId } = useAuth();

  const [categories,  setCategories]  = useState([]);
  const [services,    setServices]    = useState([]);
  const [workerStats, setWorkerStats] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  const [searchTerm,    setSearchTerm]    = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [showActive,    setShowActive]    = useState(true);
  const [onlyVerified,  setOnlyVerified]  = useState(false);
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [sortBy,        setSortBy]        = useState('recency');
  const [priceMin,      setPriceMin]      = useState('');
  const [priceMax,      setPriceMax]      = useState('');
  const [ratingMin,     setRatingMin]     = useState(0);
  const [acceptingId,   setAcceptingId]   = useState(null);
  const [acceptErr,     setAcceptErr]     = useState({});
  // listingId → dealId  (состояние с бэка: NEW-сделка ожидает мастера)
  const [pendingDeals,  setPendingDeals]  = useState({});
  const [cancellingListingId, setCancellingListingId] = useState(null);
  /** Подсветка фона hero при наведении на карточку категории (как на «Найти работу») */
  const [heroCatSlug, setHeroCatSlug] = useState(null);

  const listingPublicUrl = useCallback(
    (listingId) => {
      const q = new URLSearchParams({ from: 'find-master' });
      if (categorySlug) q.set('cat', categorySlug);
      return `/listings/${listingId}?${q.toString()}`;
    },
    [categorySlug],
  );

  const [fmpSearchFocused, setFmpSearchFocused] = useState(false);
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');
  const fmpSearchDdRef = useRef(null);
  const feedListRef = useRef(null);
  const isMobileCat = useIsMobileCatalog();

  const closeCategorySearch = useCallback(() => {
    setFmpSearchFocused(false);
    fmpSearchDdRef.current?.querySelector('input')?.blur();
  }, []);

  // Строим pendingDeals из реальных сделок бэкенда (listingId → dealId)
  const buildPendingFromDeals = useCallback((deals) => {
    const map = {};
    (deals || []).forEach(d => {
      const lid = d.listingId;
      // NEW-сделки из объявлений где мы — заказчик (ждём подтверждения мастера)
      if (lid && d.status === 'NEW' && String(d.customerId) === String(userId)) {
        map[String(lid)] = d.id;
      }
    });
    setPendingDeals(map);
  }, [userId]);

  const handleAcceptListing = useCallback(async (listingId, workerId) => {
    if (!userId) { navigate('/login'); return; }
    if (String(userId) === String(workerId)) {
      setAcceptErr(prev => ({ ...prev, [listingId]: 'Нельзя принять своё объявление' }));
      return;
    }
    setAcceptingId(listingId);
    setAcceptErr(prev => ({ ...prev, [listingId]: '' }));
    try {
      const result = await acceptListingDeal(userId, listingId);
      const dealId = result?.id || result?.dealId || listingId;
      // Мгновенное обновление — listingId как строка
      setPendingDeals(prev => ({ ...prev, [String(listingId)]: dealId }));
      // Фоновое обновление сделок с бэка
      getMyDeals(userId).then(buildPendingFromDeals).catch(() => {});
    } catch (e) {
      setAcceptErr(prev => ({ ...prev, [listingId]: e?.message || 'Не удалось оформить' }));
    } finally {
      setAcceptingId(null);
    }
  }, [userId, navigate, buildPendingFromDeals]);

  const handleCancelPendingListing = useCallback(async (listingId) => {
    const dealId = pendingDeals[String(listingId)];
    if (!dealId || !userId) return;
    if (!window.confirm('Отменить заявку мастеру? Вы сможете оформить заказ снова позже.')) return;
    setCancellingListingId(listingId);
    setAcceptErr(prev => ({ ...prev, [listingId]: '' }));
    try {
      await cancelPendingDeal(userId, dealId, '');
      const fresh = await getMyDeals(userId).catch(() => []);
      buildPendingFromDeals(fresh);
    } catch (e) {
      setAcceptErr(prev => ({ ...prev, [listingId]: e?.message || 'Не удалось отменить' }));
    } finally {
      setCancellingListingId(null);
    }
  }, [userId, pendingDeals, buildPendingFromDeals]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchInput(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!fmpSearchFocused) return;
    const onDoc = (e) => {
      if (fmpSearchDdRef.current && !fmpSearchDdRef.current.contains(e.target)) {
        closeCategorySearch();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [fmpSearchFocused, closeCategorySearch]);

  useEffect(() => {
    if (!fmpSearchFocused) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeCategorySearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fmpSearchFocused, closeCategorySearch]);

  const reloadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    setWorkerStats({});
    try {
      const dealsPromise = userId ? getMyDeals(userId).catch(() => []) : Promise.resolve([]);
      const [cats, listings, deals] = await Promise.all([
        getCategories(),
        getListings(),
        dealsPromise,
      ]);
      setCategories(mergeApiCategoriesWithCatalog(Array.isArray(cats) ? cats : []));
      buildPendingFromDeals(deals);
      const raw = Array.isArray(listings) ? listings : [];
      const processed = raw.map((item) => ({
        ...item,
        workerId: item.workerId,
        workerName: [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
        priceFrom: getListingPublishedPriceNumber(item) || 0,
        verified: item.workerVerified === true,
      }));
      setServices(processed);
      const ids = [...new Set(processed.map((s) => s.workerId).filter(Boolean))];
      setWorkerStats(await fetchStatsMap(ids, getWorkerStats));
    } catch (e) {
      setCategories(mergeApiCategoriesWithCatalog([]));
      setServices([]);
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId, buildPendingFromDeals]);

  useEffect(() => { reloadCatalog(); }, [reloadCatalog]);

  useSameRouteRefetch('/find-master', reloadCatalog);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQ = (searchParams.get('q') || '').trim();

  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    setSearchInput(q);
    setSearchTerm(q);
  }, [searchParams]);

  const selectedCategory = categories.find(c => c.slug === categorySlug);

  useEffect(() => {
    if (!selectedCategory) return;
    const q = debouncedSearchInput.trim();
    if (q.length === 0 || q.length >= 2) {
      setSearchTerm(q);
    }
  }, [debouncedSearchInput, selectedCategory]);

  const fmpDdMatches = useMemo(() => {
    if (!selectedCategory || !debouncedSearchInput || debouncedSearchInput.length < 2) return [];
    const pool = services.filter((s) => {
      const catOk = listingMatchesCatalogCategory(s, selectedCategory);
      return catOk && s.active !== false;
    });
    return rankItemsBySmartMatch(pool, debouncedSearchInput, listingHaystack, { limit: 8 });
  }, [services, selectedCategory, debouncedSearchInput]);

  const showFmpSearchDd = fmpSearchFocused && debouncedSearchInput.length >= 2;
  const showFmpSearchPanel = isMobileCat ? fmpSearchFocused : showFmpSearchDd;

  const applyCategorySearch = useCallback(() => {
    setSearchTerm(searchInput);
    closeCategorySearch();
    requestAnimationFrame(() => {
      feedListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [searchInput, closeCategorySearch]);

  const renderFmpSearchDropdown = () => {
    if (debouncedSearchInput.length < 2) {
      return (
        <CatalogSearchDropdownHint>
          Введите минимум 2 символа или нажмите «Найти», чтобы отфильтровать список ниже.
        </CatalogSearchDropdownHint>
      );
    }
    if (fmpDdMatches.length === 0) {
      return (
        <CatalogSearchDropdownHint>
          В этой категории похожих объявлений не нашлось. Нажмите «Найти», чтобы применить запрос к списку.
        </CatalogSearchDropdownHint>
      );
    }
    return (
      <>
        {fmpDdMatches.map((s) => {
          const mainPhoto =
            (s.photos || [])[0] ||
            getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category, categorySlug }, categories);
          const price = s.priceFrom
            ? formatCatalogSearchHitPrice(s.priceFrom)
            : 'Договорная';
          return (
            <CatalogSearchDropdownHit
              key={s.id}
              photo={mainPhoto}
              title={displayListingTitle(s.title)}
              meta={s.workerName || ''}
              price={price}
              href={listingPublicUrl(s.id)}
              onSelect={closeCategorySearch}
            />
          );
        })}
        <CatalogSearchDropdownFooter onClick={applyCategorySearch} />
      </>
    );
  };

  const globalMatches = useMemo(() => {
    if (!urlQ) return [];
    return searchCatalogItems(services, urlQ, listingHaystack);
  }, [services, urlQ]);

  const globalSearchCategories = useMemo(() => {
    if (!urlQ || globalMatches.length > 0) return [];
    return categories
      .map((cat) => {
        const inCat = services.filter(
          (s) => listingMatchesCatalogCategory(s, cat) && s.active !== false,
        );
        const hits = searchCatalogItems(inCat, urlQ, listingHaystack);
        return hits.length ? { cat, count: hits.length } : null;
      })
      .filter(Boolean)
      .slice(0, 5);
  }, [urlQ, globalMatches.length, categories, services]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSearchInput('');
    setShowActive(true);
    setOnlyVerified(false);
    setOnlyWithPhoto(false);
    setSortBy('recency');
    setPriceMin('');
    setPriceMax('');
    setRatingMin(0);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  /* ══════════════════════════════
     ГЛАВНАЯ — список категорий
  ══════════════════════════════ */
  if (!categorySlug) {
    const totalMasters   = [...new Set(services.map(s => s.workerId))].length;
    const activeListings = services.filter(s => s.active !== false).length;

    return (
      <div className="fmp-page">
        <style>{findCatalogPageCss}</style>

        {/* Hero с фото-фоном */}
        <div className="fmp-hero">
          <img
            src={heroCatSlug ? (CAT_ALL[heroCatSlug]?.photo || HERO_PHOTO) : HERO_PHOTO}
            alt=""
            className="fmp-hero-bg"
          />
          <div className="fmp-hero-overlay"/>
          <div className="fmp-hero-body">
            <h1>Найти мастера<br/>в Йошкар-Оле</h1>
            <p className="fmp-hero-sub">Ремонт, красота, обучение и всё остальное — мастера рядом</p>
            {!loading && (
              <div className="fmp-hero-stats">
                {[
                  { val: categories.length, label: 'категорий' },
                  { val: totalMasters,      label: 'мастеров' },
                  { val: activeListings,    label: 'объявлений' },
                ].map(({ val, label }) => (
                  <div key={label} className="fmp-hero-stat">
                    <span className="fmp-hero-stat-val">{val}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

        {urlQ && (
          <div className="fmp-global-search">
            <div className="fmp-global-search-panel">
              <div className="fmp-global-search-bar">
                <div className="fmp-global-search-head">
                  <span className="fmp-global-search-kicker">Поиск по каталогу</span>
                  <h2 className="fmp-global-search-title">
                    Результаты: <span className="fmp-global-search-query">«{urlQ}»</span>
                  </h2>
                  {!loading && (
                    <CatalogSearchCount count={globalMatches.length} type="listings" />
                  )}
                </div>
                <button type="button" className="fmp-global-search-clear" onClick={() => setSearchParams({}, { replace: true })}>
                  Очистить поиск
                </button>
              </div>

              {loading ? (
                <div className={`fmp-global-grid${globalMatches.length <= 2 ? ' fmp-global-grid--few' : ''}`}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="fmp-gcard fmp-gcard--sk" aria-hidden>
                      <div className="fmp-gcard-photo"><div className="sk" style={{ height: '100%', minHeight: 180 }} /></div>
                      <div className="fmp-gcard-body">
                        <div className="sk" style={{ height: 12, width: '35%' }} />
                        <div className="sk" style={{ height: 18, width: '88%', marginTop: 8 }} />
                        <div className="sk" style={{ height: 14, width: '55%', marginTop: 8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : globalMatches.length === 0 ? (
                <div className="fmp-global-empty">
                  <div className="fmp-global-empty-ico">🔍</div>
                  <h3 className="fmp-global-empty-title">По запросу «{urlQ}» объявлений не найдено</h3>
                  <p className="fmp-global-empty-sub">
                    Попробуйте другое слово, полное название услуги или выберите категорию ниже.
                  </p>
                  {globalSearchCategories.length > 0 && (
                    <div className="fmp-global-empty-cats">
                      <span className="fmp-global-empty-cats-label">Есть совпадения в категориях:</span>
                      <div className="fmp-global-empty-cat-list">
                        {globalSearchCategories.map(({ cat, count }) => (
                          <Link
                            key={cat.slug}
                            to={`/find-master/${cat.slug}?q=${encodeURIComponent(urlQ)}`}
                            className="fmp-global-empty-cat"
                          >
                            {cat.name}
                            <span>{count}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`fmp-global-grid${globalMatches.length <= 2 ? ' fmp-global-grid--few' : ''}`}>
                  {globalMatches.map(s => {
                    const photos = s.photos || [];
                    const mainPhoto =
                      photos[0] ||
                      getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category }, categories);
                    const stats = workerStats[s.workerId];
                    const rating = stats?.averageRating || 0;
                    const reviews = stats?.reviewsCount || 0;
                    const city = (s.city && String(s.city).trim()) || 'Йошкар-Ола';
                    const priceStr = s.priceFrom
                      ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽`
                      : 'Договорная';

                    return (
                      <Link key={s.id} to={listingPublicUrl(s.id)} className="fmp-gcard">
                        <div className="fmp-gcard-photo">
                          <img src={mainPhoto} alt="" />
                          {s.category && <span className="fmp-gcard-tag">{s.category}</span>}
                          <CardFavoriteSlot kind="listing" id={s.id} className="fmp-gcard-fav-slot card-fav-slot" />
                          <span className="fmp-gcard-open">Открыть →</span>
                        </div>
                        <div className="fmp-gcard-body">
                          <div className="fmp-gcard-price-row">
                            <span className="fmp-gcard-price">{priceStr}</span>
                            {s.priceUnit && <span className="fmp-gcard-price-unit">{s.priceUnit}</span>}
                          </div>
                          <div className="fmp-gcard-title">{displayListingTitle(s.title)}</div>
                          <div className="fmp-gcard-meta">
                            <span className="fmp-gcard-worker">{s.workerName}</span>
                            {rating > 0 && (
                              <span className="fmp-gcard-rating">★ {rating.toFixed(1)}{reviews > 0 ? ` · ${reviews}` : ''}</span>
                            )}
                            <span className="fmp-gcard-city">📍 {city}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Сетка категорий */}
        <div className="fmp-cats-wrap">
          <div className="fmp-cats-label">Выберите категорию</div>
          {loading ? (
            <div className="fmp-cats-grid">
              {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1.5px solid #e8e8e8' }}>
                  <div className="sk" style={{ height: 150, borderRadius: 0 }}/>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="sk" style={{ height: 15, width: '70%' }}/>
                    <div className="sk" style={{ height: 12, width: '85%' }}/>
                    <div className="sk" style={{ height: 12, width: '55%' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {error && services.length === 0 && (
                <div className="fmp-catalog-warn" role="status">
                  <span>{error}</span>
                  <button type="button" onClick={reloadCatalog}>Повторить</button>
                </div>
              )}
            <div className="fmp-cats-grid" onMouseLeave={() => setHeroCatSlug(null)}>
              {categories.map(cat => {
                const meta  = CAT_ALL[cat.slug] || {};
                const count = services.filter(
                  (s) => listingMatchesCatalogCategory(s, cat) && s.active !== false
                ).length;

                return (
                  <Link
                    key={cat.slug}
                    to={urlQ ? `/find-master/${cat.slug}?q=${encodeURIComponent(urlQ)}` : `/find-master/${cat.slug}`}
                    className={`fmp-cat-card${count > 0 ? ' fmp-cat-card--has-items' : ''}`}
                    onMouseEnter={() => setHeroCatSlug(cat.slug)}
                  >
                    <div className="fmp-cat-img-wrap">
                      {meta.photo
                        ? <img src={meta.photo} alt={cat.name} loading="lazy"/>
                        : <div className="fmp-cat-img-ph">{meta.emoji || '🛠️'}</div>
                      }
                      {count > 0 && (
                        <span className="fmp-cat-badge fmp-cat-badge--num" aria-label={formatListingsCount(count)}>
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="fmp-cat-body">
                      <div className="fmp-cat-name">{cat.name}</div>
                      <div className="fmp-cat-desc">{meta.desc || cat.description || 'Профессиональные мастера'}</div>
                      <div className="fmp-cat-footer">
                        {count > 0 ? (
                          <span className="fmp-cat-count">{formatCatalogCountShort(count)}</span>
                        ) : (
                          <span className="fmp-cat-count-none">Нет объявлений</span>
                        )}
                        <div className="fmp-cat-go">›</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            </>
          )}
          </div>
      </div>
    );
  }

  /* ══════════════════════════════
     СТРАНИЦА КАТЕГОРИИ
  ══════════════════════════════ */
  if (!loading && !selectedCategory) {
    return (
      <div className="fmp-page">
        <style>{findCatalogPageCss}</style>
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <p style={{ color: '#888', marginBottom: 16 }}>Категория не найдена</p>
          <Link to="/find-master" className="fmp-empty-btn">← К категориям</Link>
        </div>
      </div>
    );
  }

  const catMeta = CAT_ALL[categorySlug] || {};

  const qSearch = searchTerm.trim();

  const visibleFiltered = services.filter((s) => {
      const catOk = listingMatchesCatalogCategory(s, selectedCategory);
      if (!catOk) return false;
      if (showActive && !s.active) return false;
      if (onlyVerified && !s.verified) return false;
      if (onlyWithPhoto && !(s.photos?.length > 0)) return false;
      if (priceMin && Number(s.priceFrom) < Number(priceMin)) return false;
      if (priceMax && Number(s.priceFrom) > Number(priceMax)) return false;
      if (ratingMin > 0) {
        const st = workerStats[s.workerId];
        if (!st || (st.averageRating || 0) < ratingMin) return false;
      }
      if (qSearch) {
        const sc = smartTextMatchScore(listingHaystack(s), qSearch);
        if (sc === null || sc === 0) return false;
      }
      return true;
    });

  const visible = qSearch
    ? rankItemsBySmartMatch(visibleFiltered, qSearch, listingHaystack)
    : [...visibleFiltered].sort((a, b) => {
      if (sortBy === 'priceAsc')  return (a.priceFrom || 0) - (b.priceFrom || 0);
      if (sortBy === 'priceDesc') return (b.priceFrom || 0) - (a.priceFrom || 0);
      if (sortBy === 'rating') {
        const ra = workerStats[a.workerId]?.averageRating || 0;
        const rb = workerStats[b.workerId]?.averageRating || 0;
        return rb - ra;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const hasFilters = !showActive || onlyVerified || onlyWithPhoto || priceMin || priceMax || ratingMin > 0 || searchTerm;

  return (
    <div className={`jl-page fw-jl-cat-feed${fmpSearchFocused ? ' cat-feed-search-active' : ''}`}>
      <style>{findCatalogPageCss}</style>
      <style>{catalogCatFeedMobileCss}</style>

      {fmpSearchFocused ? (
        <button
          type="button"
          className="cat-feed-search-backdrop"
          aria-label="Закрыть поиск"
          onClick={closeCategorySearch}
        />
      ) : null}

      {/* Топ-бар поиска */}
      <div className="fmp-topbar">
        <div className="fmp-topbar-inner">
          <div className="fmp-search-dd-wrap" ref={fmpSearchDdRef}>
            <div className="fmp-search-wrap">
              <svg width="15" height="15" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onFocus={() => setFmpSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyCategorySearch();
                  }
                }}
                placeholder={`Поиск в «${selectedCategory?.name || '...'}»`}
                autoComplete="off"
                aria-expanded={isMobileCat ? fmpSearchFocused : showFmpSearchDd}
                aria-controls="fmp-search-dropdown-list"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: 18, lineHeight: 1, padding: 0 }}>
                  ×
                </button>
              )}
            </div>
            {showFmpSearchPanel ? (
              <div id="fmp-search-dropdown-list" className="fmp-search-dropdown" role="listbox" aria-label="Подсказки поиска">
                {renderFmpSearchDropdown()}
              </div>
            ) : null}
          </div>
          <button type="button" className="fmp-topbar-btn" onClick={applyCategorySearch}>Найти</button>
        </div>
      </div>

      <nav className="jl-crumbs jl-crumbs--full" aria-label="Навигация по категориям">
        <Link to="/find-master" className="jl-crumbs-link">Все категории</Link>
        <span className="sep">›</span>
        <span className="cur">{selectedCategory?.name}</span>
        {!loading && (
          <>
            <span className="sep">·</span>
            <span>
              {formatListingsCount(visible.length)}
            </span>
          </>
        )}
      </nav>

      <div className="jl-wrap">
        <div className="jl-layout">
          <aside className="jl-side">
            <div className="jl-cat-cover">
              {catMeta.photo ? (
                <img src={catMeta.photo} alt={selectedCategory?.name || ''} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,.9)' }}>
                  {catMeta.emoji || '🛠️'}
                </div>
              )}
              <div className="jl-cat-cover-body">
                <div className="jl-cat-cover-title">{selectedCategory?.name}</div>
                <button type="button" className="jl-cat-cover-back" onClick={() => navigate('/find-master')}>
                  ← Все категории
                </button>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Цена, ₽</div>
              <div className="jl-side-row">
                <div className="jl-side-field">
                  <label htmlFor="fmp-price-min">От</label>
                  <input id="fmp-price-min" type="number" min="0" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                </div>
                <div className="jl-side-field">
                  <label htmlFor="fmp-price-max">До</label>
                  <input id="fmp-price-max" type="number" min="0" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Рейтинг</div>
              <div className="jl-rating-opts">
                {[
                  { r: 0, label: 'Любой', stars: '' },
                  { r: 4, label: '4.0+', stars: '★★★★☆' },
                  { r: 4.5, label: '4.5+', stars: '★★★★★' },
                ].map(({ r, label, stars }) => (
                  <button
                    key={String(r)}
                    type="button"
                    className={`jl-rating-opt${ratingMin === r ? ' is-active' : ''}`}
                    onClick={() => setRatingMin(r)}
                  >
                    {stars ? <span className="stars">{stars}</span> : null}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Параметры</div>
              <CheckItem checked={showActive} onChange={() => setShowActive(v => !v)}>Только активные</CheckItem>
              <CheckItem checked={onlyVerified} onChange={() => setOnlyVerified(v => !v)}>Проверенные мастера</CheckItem>
              <CheckItem checked={onlyWithPhoto} onChange={() => setOnlyWithPhoto(v => !v)}>С фотографиями</CheckItem>
            </div>

            {hasFilters && (
              <button type="button" className="jl-cat-feed-reset" onClick={resetFilters}>✕ Сбросить фильтры</button>
            )}
          </aside>

          <main ref={feedListRef}>
            <div className="jl-toolbar">
              <span className="jl-toolbar-label">Сортировать:</span>
              {[
                { val: 'recency', label: 'Новые' },
                { val: 'rating', label: 'Рейтинг' },
                { val: 'priceAsc', label: 'Цена ↑' },
                { val: 'priceDesc', label: 'Цена ↓' },
              ].map(o => (
                <button
                  key={o.val}
                  type="button"
                  className={`jl-chip${sortBy === o.val ? ' is-active' : ''}`}
                  onClick={() => setSortBy(o.val)}
                >
                  {o.label}
                </button>
              ))}
              <span className="jl-toolbar-count">
                {loading ? '…' : formatListingsCount(visible.length)}
              </span>
            </div>

            {loading ? (
              <div className="jl-list">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #ececec', overflow: 'hidden' }}>
                    <div className="sk" style={{ paddingTop: '38%', borderRadius: 0 }} />
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="sk" style={{ height: 12, width: '45%' }} />
                      <div className="sk" style={{ height: 18, width: '80%' }} />
                      <div className="sk" style={{ height: 11, width: '90%' }} />
                      <div className="sk" style={{ height: 22, width: '35%', marginTop: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="jl-feed-empty">
                <div className="jl-feed-empty-ico">🔍</div>
                <h3>Объявлений не найдено</h3>
                <p>{hasFilters ? 'Измените параметры или сбросьте фильтры.' : 'В этой категории пока нет объявлений.'}</p>
                {hasFilters ? (
                  <button type="button" className="jl-bigcard-btn ghost" style={{ marginTop: 16, maxWidth: 280 }} onClick={resetFilters}>
                    Сбросить фильтры
                  </button>
                ) : (
                  <Link to="/find-master" className="jl-bigcard-btn ghost" style={{ marginTop: 16, maxWidth: 280 }}>
                    ← Все категории
                  </Link>
                )}
              </div>
            ) : (
              <div className="jl-list jl-feed-list">
              {visible.map(s => {
                const stats = workerStats[s.workerId];
                const wid = s.workerId;
                const photos = s.photos || [];
                const hasPhoto = photos.length > 0;
                const listingPlaceholder = getCategoryPlaceholderPhotoUrlOrDefault(
                  { category: s.category, categorySlug },
                  categories,
                );
                const ava = stats?.workerAvatar || s.workerAvatar || null;
                const addrShort = (() => {
                  const addr = s.address && String(s.address).trim();
                  if (addr) {
                    const part = addr.split(',')[0].trim();
                    if (part) return part.length > 42 ? `${part.slice(0, 42)}…` : part;
                  }
                  const c = s.city && String(s.city).trim();
                  if (c) return c.length > 42 ? `${c.slice(0, 42)}…` : c;
                  return 'Йошкар-Ола';
                })();
                const urgent = listingFeedLooksUrgent(s);
                const statusUpper = listingFeedStatusLabel(s);
                const cFill = stats
                  ? Math.min(5, Math.max(0, Math.round(Number(stats.averageRating) || 0)))
                  : 0;
                const cAvg = stats?.averageRating ?? 0;
                const cCnt = stats?.reviewsCount ?? 0;

                const jlTags = [
                  {
                    kind: 'green',
                    icon: '✓',
                    label: s.active !== false ? 'Активно' : 'Неактивно',
                  },
                ];
                if (!(urgent && s.active !== false)) {
                  if (s.verified) {
                    jlTags.push({ kind: 'green', icon: '✓', label: 'Проверен' });
                  } else if (s.ownerGuaranteeTermsAccepted) {
                    jlTags.push({ kind: 'amber', icon: '🛡', label: 'Гарантия' });
                  } else {
                    jlTags.push({ kind: 'gray', icon: '⚡', label: 'Объявление' });
                  }
                }

                return (
                  <article key={s.id} className="jl-bigcard">
                    <div
                      className="jl-bigcard-cover"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(listingPublicUrl(s.id))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(listingPublicUrl(s.id));
                        }
                      }}
                    >
                      <img
                        src={hasPhoto ? photos[0] : listingPlaceholder}
                        alt={displayListingTitle(s.title)}
                        draggable={false}
                      />
                      <span className="jl-bigcard-status">{statusUpper}</span>
                      {urgent && s.active !== false && (
                        <span className="jl-bigcard-urgent">⚡ Срочно</span>
                      )}
                      {s.active !== false && (
                        <CardFavoriteSlot kind="listing" id={s.id} className="jl-bigcard-fav-slot card-fav-slot" />
                      )}
                      {photos.length > 1 && (
                        <span className="jl-bigcard-photo-cnt">📷 {photos.length}</span>
                      )}
                    </div>

                    {photos.length > 1 && (
                      <div
                        className="jl-bigcard-thumbs"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(listingPublicUrl(s.id))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(listingPublicUrl(s.id));
                          }
                        }}
                      >
                        {photos.slice(1, 4).map((p, i) => (
                          <img key={i} src={p} alt="" draggable={false} />
                        ))}
                        {photos.length > 4 && (
                          <div className="jl-bigcard-thumb-more">+{photos.length - 4}</div>
                        )}
                      </div>
                    )}

                    <div className="jl-bigcard-body">
                      <Link to={`/workers/${wid}`} className="jl-bigcard-author">
                        {ava && ava.length > 10 ? (
                          <img src={ava} alt="" className="jl-author-ava" />
                        ) : (
                          <div className="jl-author-ava">{(s.workerName || 'М')[0].toUpperCase()}</div>
                        )}
                        <div className="jl-bigcard-author-info">
                          <span className="jl-bigcard-author-name">{s.workerName}</span>
                          <span className="jl-bigcard-author-meta">
                            <span className="ok">{s.active !== false ? 'Активный мастер' : 'Мастер'}</span>
                            <span className="dot">·</span>
                            <span>{addrShort}</span>
                          </span>
                        </div>
                        <span className="jl-bigcard-chevron">›</span>
                      </Link>

                      <div
                        className="jl-bigcard-detail-zone"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(listingPublicUrl(s.id))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(listingPublicUrl(s.id));
                          }
                        }}
                      >
                        <h2 className="jl-bigcard-title">{displayListingTitle(s.title)}</h2>
                        {s.description && <div className="jl-bigcard-sub">{s.description}</div>}
                      </div>

                      <div className="jl-tags">
                        {jlTags.map((b, i) => (
                          <span key={i} className={`jl-tag ${b.kind}`}>
                            <span>{b.icon}</span> {b.label}
                          </span>
                        ))}
                      </div>

                      {stats ? (
                        <Link
                          to={`/workers/${wid}#reviews`}
                          className="jl-rating-line jl-rating-line--link"
                          title="Открыть отзывы о мастере"
                          onClick={e => e.stopPropagation()}
                        >
                          {(stats.reviewsCount || 0) === 0 ? (
                            <>
                              <span className="stars jl-stars-muted">☆☆☆☆☆</span>
                              <span className="fmp-rating-empty">Пока нет отзывов</span>
                            </>
                          ) : (
                            <>
                              <span className="stars">
                                {'★'.repeat(cFill)}
                                {'☆'.repeat(5 - cFill)}
                              </span>
                              <b>{cAvg.toFixed(1)}</b>
                              <span>
                                ({cCnt}{' '}
                                {cCnt === 1 ? 'отзыв' : cCnt < 5 ? 'отзыва' : 'отзывов'})
                              </span>
                              {stats.completedWorksCount > 0 && (
                                <span>· 📦 {stats.completedWorksCount} заказов</span>
                              )}
                            </>
                          )}
                        </Link>
                      ) : null}

                      {pendingDeals[String(s.id)] ? (
                        <div className="fmp-card-footer-pending">
                          <div className="fmp-card-price-block">
                            <div className="fmp-card-price">
                              {s.priceFrom ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                            </div>
                            {s.priceUnit && <span className="fmp-card-price-unit">{s.priceUnit}</span>}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="fmp-pending-link"
                              onClick={e => {
                                e.stopPropagation();
                                navigate('/deals');
                              }}
                            >
                              К сделкам →
                            </button>
                          </div>
                          <div className="fmp-pending-banner">
                            <span>⏳ Ждём подтверждения мастера</span>
                            <span style={{ fontWeight: 400, color: '#78350f' }}>Мастер должен принять заказ</span>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginTop: 4,
                                alignItems: 'center',
                              }}
                            >
                              <button
                                type="button"
                                className="fmp-pending-link"
                                disabled={cancellingListingId === s.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCancelPendingListing(s.id);
                                }}
                                style={{ color: '#b91c1c', fontWeight: 700 }}
                              >
                                {cancellingListingId === s.id ? 'Отменяем…' : 'Отменить заявку'}
                              </button>
                            </div>
                            {acceptErr[s.id] && (
                              <div
                                className="fmp-card-action-err"
                                style={{ alignSelf: 'stretch', textAlign: 'left', maxWidth: 'none' }}
                              >
                                {acceptErr[s.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="jl-bigcard-price-row">
                            {s.priceFrom ? (
                              <>
                                <div className="jl-bigcard-price">
                                  {Number(s.priceFrom).toLocaleString('ru-RU')} ₽
                                </div>
                                <div className="jl-bigcard-price-hint">{s.priceUnit || 'за работу'}</div>
                              </>
                            ) : (
                              <>
                                <div className="jl-bigcard-price-muted">Договорная</div>
                                <div className="jl-bigcard-price-hint">уточните у мастера</div>
                              </>
                            )}
                          </div>
                          <div className="jl-bigcard-actions">
                            <button
                              type="button"
                              className="jl-bigcard-btn primary"
                              disabled={acceptingId === s.id || String(userId) === String(wid)}
                              title={String(userId) === String(wid) ? 'Нельзя принять своё объявление' : ''}
                              onClick={e => {
                                e.stopPropagation();
                                handleAcceptListing(s.id, wid);
                              }}
                            >
                              {acceptingId === s.id ? '⏳ Оформляем…' : 'Принять'}
                            </button>
                            <button
                              type="button"
                              className="jl-bigcard-btn ghost"
                              disabled={!wid}
                              onClick={e => {
                                e.stopPropagation();
                                if (!wid) return;
                                navigate(userId ? `/chat/${wid}` : '/login');
                              }}
                            >
                              Написать
                            </button>
                            {acceptErr[s.id] && (
                              <div className="fmp-card-action-err">{acceptErr[s.id]}</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
