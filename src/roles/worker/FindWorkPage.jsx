import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer, getCategories, getCustomerStats, recordJobRequestView } from '../../api';
import {
  formatJobRequestBudgetLabel,
  getJobRequestPublishedBudgetNumber,
  hasJobRequestPublishedPrice,
  JOB_REQUEST_PRICE_MISSING_LABEL,
} from '../../utils/jobRequestBudget';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import './FindWorkPage.css';
import './jobListings.css';
import { PAGE_HERO_DEFAULT_PHOTO, heroPhotoHiRes } from '../../constants/pageHeroAssets';
import { WORKER_HOME_PATH } from '../../constants/homePaths';
import { findCatalogPageCss } from '../shared/findCatalogPageCss';
import { goBackOr } from '../../utils/navigationHelpers';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import PhotoLightbox from '../../components/PhotoLightbox';
import { searchCatalogItems, smartTextMatchScore, jobRequestHaystack, rankItemsBySmartMatch } from '../../utils/smartSearch';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import { formatCatalogCountShort } from '../../utils/formatCatalogCountShort';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
} from '../../utils/categoryPlaceholderPhoto';
import { jobRequestMatchesCatalogCategory, mergeApiCategoriesWithCatalog } from '../../utils/mergeApiCategoriesWithCatalog';
import CardFavoriteSlot from '../../components/CardFavoriteSlot';
import { edListingDetailMergedCss, dealCategoryEmoji } from '../shared/dealsWdStyles';
import { catalogCatFeedMobileCss } from '../shared/catalogCatFeedMobileCss';
import { useIsMobileCatalog } from '../../hooks/useIsMobileCatalog';

const JOB_REQUEST_DETAIL_STYLES = edListingDetailMergedCss;

const FW_DEFAULT_BG = PAGE_HERO_DEFAULT_PHOTO;

const JD_BACKEND = 'https://svoi-mastera-backend-n9om.onrender.com';
const jdPhotoUrl = (u) =>
  !u ? null : u.startsWith('http') || u.startsWith('data:') ? u : JD_BACKEND + u;

const jdFmtDateLong = (d) =>
  !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн. назад`;
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

const CAT_ALL = {};
Object.values(CATEGORIES_BY_SECTION).forEach(cats =>
  cats.forEach(cat => { CAT_ALL[cat.slug] = { ...cat, photo: heroPhotoHiRes(cat.photo) }; })
);

function reviewsCountLabel(n) {
  const x = Number(n) || 0;
  const abs = x % 100;
  const d = x % 10;
  if (abs > 10 && abs < 20) return `${x} отзывов`;
  if (d === 1) return `${x} отзыв`;
  if (d >= 2 && d <= 4) return `${x} отзыва`;
  return `${x} отзывов`;
}

/** Бейдж на карточке заявки в ленте: свежие — «НОВОЕ», остальные — «АКТИВНО». */
function jobRequestFeedStatusLabel(req) {
  const t = req?.createdAt ? new Date(req.createdAt).getTime() : 0;
  if (t && Date.now() - t < 72 * 3600 * 1000) return 'НОВОЕ';
  return 'АКТИВНО';
}

function jobRequestFeedLooksUrgent(req) {
  const hay = `${req?.title || ''} ${req?.description || ''}`.toLowerCase();
  return hay.includes('срочн') || hay.includes('сегодня') || hay.includes('завтра');
}

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

const CATEGORY_STYLES = {
  'remont-kvartir':       { emoji: '🏠', color: '#fff3e0' },
  'santehnika':           { emoji: '🔧', color: '#e3f2fd' },
  'elektrika':            { emoji: '⚡', color: '#fffde7' },
  'uborka':               { emoji: '🧹', color: '#fce4ec' },
  'parikhmaher':          { emoji: '💇', color: '#fce4ec' },
  'manikur':              { emoji: '💅', color: '#fce4ec' },
  'krasota-i-zdorovie':   { emoji: '✨', color: '#f3e5f5' },
  'repetitorstvo':        { emoji: '📚', color: '#e3f2fd' },
  'kompyuternaya-pomosh': { emoji: '💻', color: '#e8f5e9' },
};

function pluralRequests(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} заявка`;
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} заявки`;
  return `${n} заявок`;
}

function jobRequestListPrice(req) {
  return getJobRequestPublishedBudgetNumber(req);
}

function OfferModal({ request, offerForm, setOfferForm, onClose, onSubmit, submitting }) {
  if (!request) return null;
  return (
    <div className="fw-modal-overlay" onClick={onClose}>
      <div className="fw-modal" onClick={e => e.stopPropagation()}>
        <div className="fw-modal-header">
          <h3 className="fw-modal-title">📩 Отклик на заявку</h3>
          <p className="fw-modal-subtitle">{request.title}</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="fw-modal-body">
            <div className="fw-modal-field">
              <label className="fw-modal-label">Ваша цена за работу, ₽ *</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 5000"
                value={offerForm.price}
                onChange={e => setOfferForm(prev => ({ ...prev, price: e.target.value }))}
                required
                min="1"
                autoFocus
              />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                Оплата — наличными или переводом напрямую заказчику после работы. Условия уточняйте в личных сообщениях.
              </p>
            </div>
            <div className="fw-modal-field">
              <label className="fw-modal-label">Срок выполнения (дней)</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 3"
                value={offerForm.estimatedDays}
                onChange={e => setOfferForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                min="1"
              />
            </div>
            <div className="fw-modal-field">
              <label className="fw-modal-label">Комментарий</label>
              <textarea
                className="fw-modal-input fw-modal-textarea"
                placeholder="Опишите как вы выполните работу, ваш опыт..."
                value={offerForm.comment}
                onChange={e => setOfferForm(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>
          </div>
          <div className="fw-modal-footer">
            <button type="button" className="fw-modal-cancel" onClick={onClose}>Отмена</button>
            <button type="submit" className="fw-modal-submit" disabled={submitting || !offerForm.price}>
              {submitting ? 'Отправка...' : '📩 Отправить отклик'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests,         setRequests]         = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRequest,  setSelectedRequest]  = useState(null);
  /** Откуда открыли деталь заявки: главная / избранное / раздел «Найти работу» */
  const [jobDetailFrom, setJobDetailFrom] = useState('find-work');
  const [activePhotoIdx,   setActivePhotoIdx]   = useState(0);
  const [showOfferModal,   setShowOfferModal]   = useState(null);
  const [offerForm,        setOfferForm]        = useState({ price: '', comment: '', estimatedDays: '' });
  const [submitting,       setSubmitting]       = useState(false);
  const [lightbox,         setLightbox]         = useState(null);
  const [heroCatSlug,      setHeroCatSlug]      = useState(null); // hover на карточке категории
  // Фильтры/поиск для экрана 2
  const [searchInput,   setSearchInput]   = useState('');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [priceMin,      setPriceMin]      = useState('');
  const [priceMax,      setPriceMax]      = useState('');
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [sortBy,        setSortBy]        = useState('recency');
  const [ratingMin,     setRatingMin]     = useState(0);
  const [customerStats, setCustomerStats] = useState({});

  /** Один POST на заявку за сессию страницы, чтобы не дублировать счётчик при серии кликов. */
  const jobRequestViewSentRef = useRef(new Set());
  const bumpJobRequestView = useCallback((reqId) => {
    if (!userId || reqId == null) return;
    const id = String(reqId);
    if (jobRequestViewSentRef.current.has(id)) return;
    jobRequestViewSentRef.current.add(id);
    recordJobRequestView(userId, id).catch(() => {});
  }, [userId]);

  const [debouncedFwSearch, setDebouncedFwSearch] = useState('');
  const [fwSearchFocused, setFwSearchFocused] = useState(false);
  const fwSearchDdRef = useRef(null);
  const feedListRef = useRef(null);
  const isMobileCat = useIsMobileCatalog();

  const closeCategorySearch = useCallback(() => {
    setFwSearchFocused(false);
    fwSearchDdRef.current?.querySelector('input')?.blur();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFwSearch(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedCategory) return;
    const q = debouncedFwSearch.trim();
    if (q.length === 0 || q.length >= 2) {
      setSearchTerm(q);
    }
  }, [debouncedFwSearch, selectedCategory]);

  useEffect(() => {
    if (!fwSearchFocused) return;
    const onDoc = (e) => {
      if (fwSearchDdRef.current && !fwSearchDdRef.current.contains(e.target)) {
        closeCategorySearch();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [fwSearchFocused, closeCategorySearch]);

  useEffect(() => {
    if (!fwSearchFocused) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeCategorySearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fwSearchFocused, closeCategorySearch]);

  const fwDdMatches = useMemo(() => {
    if (!selectedCategory || !debouncedFwSearch || debouncedFwSearch.length < 2) return [];
    const pool = requests.filter((r) => jobRequestMatchesCatalogCategory(r, selectedCategory));
    return rankItemsBySmartMatch(pool, debouncedFwSearch, jobRequestHaystack, { limit: 8 });
  }, [requests, selectedCategory, debouncedFwSearch]);

  const showFwSearchDd = fwSearchFocused && debouncedFwSearch.length >= 2;
  const showFwSearchPanel = isMobileCat ? fwSearchFocused : showFwSearchDd;

  const applyCategorySearch = useCallback(() => {
    setSearchTerm(searchInput);
    closeCategorySearch();
    requestAnimationFrame(() => {
      feedListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [searchInput, closeCategorySearch]);

  const renderFwSearchDropdown = () => {
    if (debouncedFwSearch.length < 2) {
      return (
        <div className="fmp-search-hint">
          Введите минимум 2 символа или нажмите «Найти», чтобы отфильтровать список ниже.
        </div>
      );
    }
    if (fwDdMatches.length === 0) {
      return (
        <div className="fmp-search-hint">
          Подходящих заявок не нашлось. Нажмите «Найти», чтобы применить запрос к списку.
        </div>
      );
    }
    return (
      <>
        {fwDdMatches.map((req) => {
          const ph = (req.photos || [])[0];
          const phSrc =
            ph ||
            getCategoryPlaceholderPhotoUrlOrDefault(
              { categoryName: req.categoryName, categoryId: req.categoryId },
              categories,
            );
          const custLabel = [req.customerName, req.customerLastName].filter(Boolean).join(' ');
          const ddPrice = formatJobRequestBudgetLabel(req);
          return (
            <button
              key={req.id}
              type="button"
              className="fmp-search-hit"
              onClick={() => {
                closeCategorySearch();
                openRequestDetail(req);
              }}
            >
              <div className="fmp-search-hit-ph">
                <img src={phSrc} alt="" />
              </div>
              <div className="fmp-search-hit-body">
                <div className="fmp-search-hit-title">{req.title || 'Заявка'}</div>
                <div className="fmp-search-hit-meta">{custLabel || 'Заказчик'}</div>
                <div className="fmp-search-hit-price">{ddPrice}</div>
              </div>
            </button>
          );
        })}
        <button type="button" className="fmp-search-footer" onClick={applyCategorySearch}>
          Показать все совпадения в списке →
        </button>
      </>
    );
  };

  const urlQ = (searchParams.get('q') || '').trim();

  const globalMatches = useMemo(() => {
    if (!urlQ || selectedCategory) return [];
    return searchCatalogItems(requests, urlQ, jobRequestHaystack);
  }, [requests, urlQ, selectedCategory]);

  const jobDetailUploadedPhotos = useMemo(() => {
    if (!selectedRequest?.photos?.length) return [];
    return selectedRequest.photos.map(jdPhotoUrl).filter(Boolean);
  }, [selectedRequest]);

  const jobDetailPhotoCount = jobDetailUploadedPhotos.length;
  const jobDetailCanSwipe = jobDetailPhotoCount > 1;

  const jobDetailPrevPhoto = useCallback(() => {
    setActivePhotoIdx((i) =>
      jobDetailPhotoCount > 1 ? (i - 1 + jobDetailPhotoCount) % jobDetailPhotoCount : i,
    );
  }, [jobDetailPhotoCount]);

  const jobDetailNextPhoto = useCallback(() => {
    setActivePhotoIdx((i) => (jobDetailPhotoCount > 1 ? (i + 1) % jobDetailPhotoCount : i));
  }, [jobDetailPhotoCount]);

  const jobGallerySwipe = useSwipeNavigation(
    jobDetailPrevPhoto,
    jobDetailNextPhoto,
    !!selectedRequest && jobDetailCanSwipe,
  );
  const jobThumbStripRef = useRef(null);

  useEffect(() => {
    if (!jobDetailCanSwipe || !jobThumbStripRef.current) return;
    const active = jobThumbStripRef.current.querySelector('.ed-thumb.on');
    active?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activePhotoIdx, jobDetailCanSwipe]);

  const requestIdFromUrl = searchParams.get('request');

  useEffect(() => {
    if (!requestIdFromUrl || loading) return;
    const fromParam = searchParams.get('from');
    const nextFrom = fromParam === 'home' || fromParam === 'favorites' ? fromParam : 'find-work';
    setJobDetailFrom(nextFrom);
    const req = requests.find(r => String(r.id) === String(requestIdFromUrl));
    if (!req) {
      if (requests.length > 0) {
        showToast('Заявка закрыта или недоступна', 'info');
        setSearchParams(p => { const next = new URLSearchParams(p); next.delete('request'); next.delete('from'); return next; }, { replace: true });
      }
      return;
    }
    const cat = categories.find((c) => jobRequestMatchesCatalogCategory(req, c));
    if (cat) setSelectedCategory(cat);
    setSelectedRequest(req);
    setActivePhotoIdx(0);
    bumpJobRequestView(req.id);
    setSearchParams(p => { const next = new URLSearchParams(p); next.delete('request'); next.delete('from'); return next; }, { replace: true });
  }, [requestIdFromUrl, loading, requests, categories, setSearchParams, showToast, bumpJobRequestView, searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, reqs] = await Promise.all([
        getCategories(),
        getOpenJobRequestsForWorker(userId),
      ]);
      setCategories(mergeApiCategoriesWithCatalog(Array.isArray(cats) ? cats : []));
      setRequests(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setCategories(mergeApiCategoriesWithCatalog([]));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  useSameRouteRefetch('/find-work', loadData);

  useEffect(() => {
    if (!requests?.length) return undefined;
    const ids = [...new Set(requests.map(r => r.customerId).filter(Boolean))];
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        ids.map(async (cid) => {
          try {
            const st = await getCustomerStats(cid);
            return [String(cid), st];
          } catch {
            return [String(cid), { averageRating: 0, reviewsCount: 0 }];
          }
        }),
      );
      if (!cancelled) {
        setCustomerStats(prev => {
          const next = { ...prev };
          pairs.forEach(([id, st]) => {
            next[id] = st;
          });
          return next;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [requests]);

  const getRequestsForCategory = (cat) =>
    requests.filter((r) => jobRequestMatchesCatalogCategory(r, cat));

  const openRequestDetail = useCallback((req) => {
    bumpJobRequestView(req?.id);
    setJobDetailFrom('find-work');
    setSelectedRequest(req);
    setActivePhotoIdx(0);
  }, [bumpJobRequestView]);

  const handleOpenOfferModal = (request) => {
    bumpJobRequestView(request?.id);
    setShowOfferModal(request);
    const p = jobRequestListPrice(request);
    setOfferForm({
      price: p != null && !Number.isNaN(p) ? String(p) : '',
      comment: '',
      estimatedDays: '',
    });
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(null);
    setOfferForm({ price: '', comment: '', estimatedDays: '' });
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.price) { showToast('Укажите цену', 'error'); return; }
    setSubmitting(true);
    try {
      await createJobOffer(userId, showOfferModal.id, {
        price:         Number(offerForm.price),
        message:       offerForm.comment || 'Готов выполнить работу',
        estimatedDays: offerForm.estimatedDays ? Number(offerForm.estimatedDays) : null,
      });
      showToast('Отклик отправлен!', 'success');
      handleCloseOfferModal();
      loadData();
    } catch (err) {
      console.error('Failed to create offer:', err);
      showToast('Не удалось отправить отклик', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCategoryFilters = useCallback(() => {
    setSearchInput(''); setSearchTerm('');
    setPriceMin(''); setPriceMax('');
    setOnlyWithPhoto(false); setSortBy('recency'); setRatingMin(0);
  }, []);

  // ═══ ЭКРАН 3: детальная заявка (вёрстка jd-* из jobListings.css) ═══
  if (selectedRequest) {
    const req = selectedRequest;
    const catStyle = CATEGORY_STYLES[selectedCategory?.slug] || { emoji: '📋', color: '#f3f4f6' };
    const jdPhotosRaw = (req.photos || []).map(jdPhotoUrl).filter(Boolean);
    const jdPlaceholder = getCategoryPlaceholderPhotoUrlOrDefault(
      { categoryName: req.categoryName, categoryId: req.categoryId },
      categories,
    );
    const jdPhotos = jdPhotosRaw.length ? jdPhotosRaw : [jdPlaceholder];
    const mainSrc = jdPhotos[activePhotoIdx] || null;
    const budget = formatJobRequestBudgetLabel(req);
    const priceIsNegotiable = !hasJobRequestPublishedPrice(req);
    const addressLine = (req.addressText || req.address || req.cityName || '').trim();
    const jobCity =
      (req.cityName && String(req.cityName).trim()) ||
      (req.city && String(req.city).trim()) ||
      (addressLine.includes(',') ? addressLine.split(',')[0].trim() : '—');
    const custNameFull = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
    const categoryLabel = selectedCategory?.name || req.categoryName;
    const priceNum = getJobRequestPublishedBudgetNumber(req);
    const photoCount = jdPhotos.length;
    const hasMultiplePhotos = photoCount > 1;
    const openStatusPill = { label: 'Открыта', dot: '#22c55e', shadow: '0 0 0 3px rgba(34,197,94,.2)' };
    const jobBackLabel =
      jobDetailFrom === 'home' ? 'Главная' : jobDetailFrom === 'favorites' ? 'Избранное' : 'Заявки';

    return (
      <>
        <div className="ed ed--listing-detail">
          <style>{JOB_REQUEST_DETAIL_STYLES}</style>

          <PhotoLightbox
            lightbox={lightbox}
            setLightbox={setLightbox}
            onIndexChange={setActivePhotoIdx}
            alt={req.title || ''}
          />

          <div className="ed-wrap">
            <button
              type="button"
              className="ed-back"
              onClick={() => {
                setLightbox(null);
                if (jobDetailFrom === 'home') {
                  setSelectedRequest(null);
                  setSelectedCategory(null);
                  setActivePhotoIdx(0);
                  setJobDetailFrom('find-work');
                  goBackOr(navigate, WORKER_HOME_PATH);
                  return;
                }
                if (jobDetailFrom === 'favorites') {
                  setSelectedRequest(null);
                  setSelectedCategory(null);
                  setActivePhotoIdx(0);
                  setJobDetailFrom('find-work');
                  goBackOr(navigate, '/favorites');
                  return;
                }
                setSelectedRequest(null);
                setActivePhotoIdx(0);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {jobBackLabel}
            </button>

            <div className="ed-head">
              <div className="ed-head-left" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h1>{req.title || 'Заявка'}</h1>
                </div>
                <div className="ed-listing-meta">
                  {categoryLabel && (
                    <span>
                      {dealCategoryEmoji(categoryLabel)} {categoryLabel}
                    </span>
                  )}
                  {jobCity && jobCity !== '—' ? <span>📍 {jobCity}</span> : null}
                </div>
              </div>
              <div className="ed-head-right">
                <span className="ed-status-pill">
                  <span className="dot" style={{ background: openStatusPill.dot, boxShadow: openStatusPill.shadow }} />
                  {openStatusPill.label}
                </span>
              </div>
            </div>

            <div className="ed-grid">
              <div className="ed-col">
                <div className="ed-gallery">
                  <div
                    className={`ed-main ${jobGallerySwipe.className}`}
                    role="presentation"
                    onClick={() => jdPhotos.length > 0 && setLightbox({ photos: jdPhotos, index: activePhotoIdx })}
                    onClickCapture={jobGallerySwipe.onClickCapture}
                    onPointerDown={jobGallerySwipe.onPointerDown}
                    onPointerUp={jobGallerySwipe.onPointerUp}
                    onPointerCancel={jobGallerySwipe.onPointerCancel}
                    style={jobGallerySwipe.style}
                  >
                    {mainSrc ? (
                      <img src={mainSrc} alt={req.title || ''} key={`${photoCount}-${activePhotoIdx}`} />
                    ) : (
                      <div className="ed-main-placeholder" aria-hidden>
                        {catStyle.emoji}
                      </div>
                    )}
                    <div className="ed-floats">
                      <div className="ed-chip">
                        <span className="pulse" style={{ background: openStatusPill.dot, boxShadow: openStatusPill.shadow }} />
                        <span className="ed-chip-text">{openStatusPill.label}</span>
                      </div>
                      {categoryLabel ? (
                        <div className="ed-chip">
                          <span className="ed-chip-text">
                            {dealCategoryEmoji(categoryLabel)} {categoryLabel}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <CardFavoriteSlot
                      kind="jobRequest"
                      id={req.id}
                      className="ed-gallery-fav-slot card-fav-slot"
                    />
                    {hasMultiplePhotos ? (
                      <>
                        <button
                          type="button"
                          className="ed-arrow l"
                          aria-label="Предыдущее фото"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((i) => (i > 0 ? i - 1 : jdPhotos.length - 1));
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="ed-arrow r"
                          aria-label="Следующее фото"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((i) => (i < jdPhotos.length - 1 ? i + 1 : 0));
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="ed-counter">
                          {String(activePhotoIdx + 1).padStart(2, '0')} / {String(photoCount).padStart(2, '0')}
                        </div>
                      </>
                    ) : null}
                  </div>
                  {hasMultiplePhotos ? (
                    <div className="ed-thumbs" ref={jobThumbStripRef}>
                      {jdPhotos.map((p, i) => (
                        <div
                          key={i}
                          className={`ed-thumb${i === activePhotoIdx ? ' on' : ''}`}
                          onClick={() => setActivePhotoIdx(i)}
                          role="presentation"
                        >
                          <img src={p} alt="" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {req.description && req.description !== 'Без описания' ? (
                  <section className="ed-card">
                    <h3 className="ed-section-title">Описание</h3>
                    <p className="ed-desc">{formatListingOriginDescription('WORKER', req.description)}</p>
                    {req.urgency ? (
                      <p className="ed-desc" style={{ marginTop: 14, color: '#c2410c', fontWeight: 600 }}>
                        <b>Срочность:</b> {req.urgency}
                      </p>
                    ) : null}
                  </section>
                ) : (
                  <section className="ed-card">
                    <h3 className="ed-section-title">Описание</h3>
                    <p className="ed-desc" style={{ color: '#a1a1aa', fontStyle: 'italic' }}>
                      Описание не добавлено
                    </p>
                  </section>
                )}

                <section className="ed-card">
                  <h3 className="ed-section-title">Условия</h3>
                  <dl className="ed-rows">
                    {[
                      ['Город', jobCity],
                      addressLine && ['Адрес', addressLine],
                      req.createdAt && ['Опубликована', timeAgo(req.createdAt) || jdFmtDateLong(req.createdAt)],
                    ]
                      .filter(Boolean)
                      .map(([label, value]) => (
                        <div key={String(label)} className="ed-row">
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                  </dl>
                </section>
              </div>

              <aside className="ed-side">
                <div className="ed-card">
                  <div className="ed-eyebrow">Стоимость</div>
                  {priceNum != null ? (
                    <div className="ed-price-num">
                      {priceNum.toLocaleString('ru-RU')}
                      <small> ₽</small>
                    </div>
                  ) : (
                    <div className="ed-price-num" style={{ fontSize: 22, fontWeight: 700 }}>
                      {JOB_REQUEST_PRICE_MISSING_LABEL}
                    </div>
                  )}
                  <p className="ed-price-sub">
                    {priceIsNegotiable
                      ? 'Заказчик не указал сумму — уточните в чате'
                      : 'Окончательная цена согласовывается в чате с заказчиком'}
                  </p>
                  <div className="ed-actions">
                    <button type="button" className="ed-btn ed-btn-confirm" onClick={() => handleOpenOfferModal(req)}>
                      Откликнуться
                    </button>
                    {req.customerId ? (
                      <Link to={`/chat/${req.customerId}?jobRequestId=${req.id}`} className="ed-btn ed-btn-ghost">
                        Написать в чат
                      </Link>
                    ) : null}
                  </div>
                </div>

                {(req.customerName || req.customerId) && (
                  <div className="ed-card">
                    <div className="ed-eyebrow ed-eyebrow--block">Заказчик</div>
                    {req.customerId ? (
                      <div
                        className="ed-cust-row"
                        onClick={() =>
                          navigate(`/customers/${req.customerId}?name=${encodeURIComponent(custNameFull)}`)
                        }
                        role="presentation"
                      >
                        {req.customerAvatar ? (
                          <div className="ed-ava">
                            <img src={jdPhotoUrl(req.customerAvatar)} alt="" />
                          </div>
                        ) : (
                          <div className="ed-ava">
                            <div className="ed-ava-fallback">{(custNameFull[0] || '?').toUpperCase()}</div>
                          </div>
                        )}
                        <div className="ed-cust-info">
                          <div className="ed-cust-name">{custNameFull}</div>
                          <div className="ed-cust-meta ed-cust-meta--active">Активный заказчик</div>
                        </div>
                        <div className="ed-cust-arrow">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="ed-cust-row" style={{ cursor: 'default', pointerEvents: 'none' }}>
                        <div className="ed-ava">
                          <div className="ed-ava-fallback">{(custNameFull[0] || '?').toUpperCase()}</div>
                        </div>
                        <div className="ed-cust-info">
                          <div className="ed-cust-name">{custNameFull}</div>
                          <div className="ed-cust-meta ed-cust-meta--active">Активный заказчик</div>
                        </div>
                      </div>
                    )}
                    {req.customerId ? (
                      <Link to={`/chat/${req.customerId}?jobRequestId=${req.id}`} className="ed-msg-btn">
                        Написать в чат
                      </Link>
                    ) : null}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>

        <OfferModal
          request={showOfferModal}
          offerForm={offerForm}
          setOfferForm={setOfferForm}
          onClose={handleCloseOfferModal}
          onSubmit={handleSubmitOffer}
          submitting={submitting}
        />
      </>
    );
  }

  // ═══ ЭКРАН 2: заявки внутри категории ═══
  if (selectedCategory) {
    const catMeta = CAT_ALL[selectedCategory.slug] || {};
    const allCatRequests = getRequestsForCategory(selectedCategory);

    const qFw = searchTerm.trim();

    const filteredRaw = allCatRequests
      .filter(req => {
        if (onlyWithPhoto && !(req.photos?.length > 0)) return false;
        if (priceMin) {
          const p = jobRequestListPrice(req);
          if (p == null || p < Number(priceMin)) return false;
        }
        if (priceMax) {
          const p = jobRequestListPrice(req);
          if (p == null || p > Number(priceMax)) return false;
        }
        if (qFw) {
          const sc = smartTextMatchScore(jobRequestHaystack(req), qFw);
          if (sc === null || sc === 0) return false;
        }
        if (ratingMin > 0) {
          const cid = req.customerId;
          const st = cid ? customerStats[String(cid)] : null;
          const avg = st?.averageRating ?? 0;
          if (avg < ratingMin) return false;
        }
        return true;
      });

    const filtered = qFw
      ? rankItemsBySmartMatch(filteredRaw, qFw, jobRequestHaystack)
      : filteredRaw.sort((a, b) => {
        if (sortBy === 'priceAsc') {
          const pa = jobRequestListPrice(a) ?? Infinity;
          const pb = jobRequestListPrice(b) ?? Infinity;
          return pa - pb;
        }
        if (sortBy === 'priceDesc') {
          const pa = jobRequestListPrice(a) ?? -Infinity;
          const pb = jobRequestListPrice(b) ?? -Infinity;
          return pb - pa;
        }
        if (sortBy === 'ratingDesc') {
          const ra = a.customerId ? (customerStats[String(a.customerId)]?.averageRating ?? 0) : 0;
          const rb = b.customerId ? (customerStats[String(b.customerId)]?.averageRating ?? 0) : 0;
          if (rb !== ra) return rb - ra;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

    const hasFilters = onlyWithPhoto || priceMin || priceMax || searchTerm || ratingMin > 0;

    return (
      <div className={`jl-page fw-jl-cat-feed${fwSearchFocused ? ' cat-feed-search-active' : ''}`}>
        <style>{findCatalogPageCss}</style>
        <style>{catalogCatFeedMobileCss}</style>

        {fwSearchFocused ? (
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
            <div className="fmp-search-dd-wrap" ref={fwSearchDdRef}>
              <div className="fmp-search-wrap">
                <svg width="15" height="15" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onFocus={() => setFwSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyCategorySearch();
                    }
                  }}
                  placeholder={`Поиск в «${selectedCategory.name}»`}
                  autoComplete="off"
                  aria-expanded={isMobileCat ? fwSearchFocused : showFwSearchDd}
                  aria-controls="fmp-search-dropdown-list"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                    style={{ border:'none', background:'none', cursor:'pointer', color:'#bbb', fontSize:18, lineHeight:1, padding:0 }}>
                    ×
                  </button>
                )}
              </div>
              {showFwSearchPanel ? (
                <div id="fmp-search-dropdown-list" className="fmp-search-dropdown" role="listbox" aria-label="Подсказки поиска">
                  {renderFwSearchDropdown()}
                </div>
              ) : null}
            </div>
            <button type="button" className="fmp-topbar-btn" onClick={applyCategorySearch}>Найти</button>
          </div>
        </div>

        <nav className="jl-crumbs jl-crumbs--full" aria-label="Навигация по категориям">
          <button type="button" className="jl-crumbs-link" onClick={() => { setSelectedCategory(null); resetCategoryFilters(); }}>Все категории</button>
          <span className="sep">›</span>
          <span className="cur">{selectedCategory.name}</span>
          {!loading && (
            <>
              <span className="sep">·</span>
              <span>{pluralRequests(filtered.length)}</span>
            </>
          )}
        </nav>

        <div className="jl-wrap">
        <div className="jl-layout">

          <aside className="jl-side">

            <div className="jl-cat-cover">
              {catMeta.photo ? (
                <img src={catMeta.photo} alt={selectedCategory.name} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,.9)' }}>
                  {catMeta.emoji || '🛠️'}
                </div>
              )}
              <div className="jl-cat-cover-body">
                <div className="jl-cat-cover-title">{selectedCategory.name}</div>
                <button type="button" className="jl-cat-cover-back" onClick={() => { setSelectedCategory(null); resetCategoryFilters(); }}>
                  ← Все категории
                </button>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Цена, ₽</div>
              <div className="jl-side-row">
                <div className="jl-side-field">
                  <label htmlFor="fw-price-min">От</label>
                  <input id="fw-price-min" type="number" min="0" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                </div>
                <div className="jl-side-field">
                  <label htmlFor="fw-price-max">До</label>
                  <input id="fw-price-max" type="number" min="0" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Рейтинг заказчика</div>
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
              <CheckItem checked={onlyWithPhoto} onChange={() => setOnlyWithPhoto(v => !v)}>С фотографиями</CheckItem>
            </div>

            {hasFilters && (
              <button type="button" className="jl-cat-feed-reset" onClick={resetCategoryFilters}>✕ Сбросить фильтры</button>
            )}
          </aside>

          <main ref={feedListRef}>
            <div className="jl-toolbar">
              <span className="jl-toolbar-label">Сортировать:</span>
              {[
                { val: 'recency', label: 'Новые' },
                { val: 'ratingDesc', label: 'Рейтинг' },
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
              <span className="jl-toolbar-count">{loading ? '…' : pluralRequests(filtered.length)}</span>
            </div>

            {/* Карточки */}
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
            ) : filtered.length === 0 ? (
              <div className="jl-feed-empty">
                <div className="jl-feed-empty-ico">🔍</div>
                <h3>Заявок не найдено</h3>
                <p>{hasFilters ? 'Измените параметры или сбросьте фильтры.' : 'В этой категории пока нет активных заявок.'}</p>
                {hasFilters ? (
                  <button type="button" className="jl-bigcard-btn ghost" style={{ marginTop: 16, maxWidth: 280 }} onClick={resetCategoryFilters}>
                    Сбросить фильтры
                  </button>
                ) : (
                  <button type="button" className="jl-bigcard-btn ghost" style={{ marginTop: 16, maxWidth: 280 }} onClick={() => { setSelectedCategory(null); resetCategoryFilters(); }}>
                    ← Все категории
                  </button>
                )}
              </div>
            ) : (
              <div className="jl-list jl-feed-list">
                {filtered.map(req => {
                  const photos = req.photos || [];
                  const hasPhoto = photos.length > 0;
                  const placeholderBg = getCategoryPlaceholderPhotoUrlOrDefault(
                    { categoryName: req.categoryName, categoryId: req.categoryId },
                    categories,
                  );
                  const budgetLabel = formatJobRequestBudgetLabel(req);
                  const custName = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';

                  const customerHref = req.customerId
                    ? `/customers/${req.customerId}?name=${encodeURIComponent(custName)}`
                    : null;
                  const addrShort = (() => {
                    const addr = req.addressText && String(req.addressText).trim();
                    if (addr) {
                      const part = addr.split(',')[0].trim();
                      if (part) return part.length > 42 ? `${part.slice(0, 42)}…` : part;
                    }
                    const c = req.city && String(req.city).trim();
                    if (c) return c.length > 42 ? `${c.slice(0, 42)}…` : c;
                    return 'Йошкар-Ола';
                  })();
                  const urgent = jobRequestFeedLooksUrgent(req);
                  const statusUpper = jobRequestFeedStatusLabel(req);
                  const cst = req.customerId ? customerStats[String(req.customerId)] : null;
                  const cAvg = cst?.averageRating ?? 0;
                  const cCnt = cst?.reviewsCount ?? 0;
                  const cFill = Math.min(5, Math.max(0, Math.round(Number(cAvg) || 0)));

                  const customerReviewsPath = req.customerId
                    ? `/customers/${req.customerId}${custName ? `?name=${encodeURIComponent(custName)}` : ''}#reviews`
                    : null;

                  const secondBadges = urgent
                    ? []
                    : hasPhoto
                      ? [{ kind: 'gray', icon: '📷', label: 'Есть фото' }]
                      : [{ kind: 'gray', icon: '📋', label: 'Заявка' }];

                  return (
                    <article key={req.id} className="jl-bigcard">
                      <div
                        className="jl-bigcard-cover"
                        role="button"
                        tabIndex={0}
                        onClick={() => openRequestDetail(req)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openRequestDetail(req);
                          }
                        }}
                      >
                        <img src={hasPhoto ? photos[0] : placeholderBg} alt="" draggable={false} />
                        <span className="jl-bigcard-status">{statusUpper}</span>
                        {urgent && <span className="jl-bigcard-urgent">⚡ Срочно</span>}
                        <CardFavoriteSlot kind="jobRequest" id={req.id} className="jl-bigcard-fav-slot card-fav-slot" />
                        {photos.length > 1 && (
                          <span className="jl-bigcard-photo-cnt">📷 {photos.length}</span>
                        )}
                      </div>

                      {photos.length > 1 && (
                        <div
                          className="jl-bigcard-thumbs"
                          role="button"
                          tabIndex={0}
                          onClick={() => openRequestDetail(req)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openRequestDetail(req);
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
                        {customerHref ? (
                          <Link to={customerHref} className="jl-bigcard-author">
                            {req.customerAvatar ? (
                              <img src={req.customerAvatar} alt="" className="jl-author-ava" />
                            ) : (
                              <div className="jl-author-ava">{(custName || 'З')[0].toUpperCase()}</div>
                            )}
                            <div className="jl-bigcard-author-info">
                              <span className="jl-bigcard-author-name">{custName}</span>
                              <span className="jl-bigcard-author-meta">
                                <span className="ok">Активный заказчик</span>
                                <span className="dot">·</span>
                                <span>{addrShort}</span>
                              </span>
                            </div>
                            <span className="jl-bigcard-chevron">›</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="jl-bigcard-author jl-bigcard-author--btn"
                            onClick={() => openRequestDetail(req)}
                          >
                            {req.customerAvatar ? (
                              <img src={req.customerAvatar} alt="" className="jl-author-ava" />
                            ) : (
                              <div className="jl-author-ava">{(custName || 'З')[0].toUpperCase()}</div>
                            )}
                            <div className="jl-bigcard-author-info">
                              <span className="jl-bigcard-author-name">{custName}</span>
                              <span className="jl-bigcard-author-meta">
                                <span className="ok">Активный заказчик</span>
                                <span className="dot">·</span>
                                <span>{addrShort}</span>
                              </span>
                            </div>
                            <span className="jl-bigcard-chevron">›</span>
                          </button>
                        )}

                        <div
                          className="jl-bigcard-detail-zone"
                          role="button"
                          tabIndex={0}
                          onClick={() => openRequestDetail(req)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openRequestDetail(req);
                            }
                          }}
                        >
                          <h2 className="jl-bigcard-title">{req.title || 'Заявка'}</h2>
                          {req.description && req.description !== 'Без описания' && (
                            <div className="jl-bigcard-sub">{formatListingOriginDescription('WORKER', req.description)}</div>
                          )}
                          {req.createdAt && (
                            <div className="jl-bigcard-date">
                              🗓 {new Date(req.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>

                        <div className="jl-tags">
                          <span className="jl-tag green">
                            <span>✓</span> Открыта
                          </span>
                          {secondBadges.map((b, i) => (
                            <span key={i} className={`jl-tag ${b.kind}`}>
                              <span>{b.icon}</span> {b.label}
                            </span>
                          ))}
                        </div>

                        {customerReviewsPath ? (
                          <Link
                            to={customerReviewsPath}
                            className="jl-rating-line jl-rating-line--link"
                            title="Открыть отзывы о заказчике"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="stars">
                              {'★'.repeat(cFill)}
                              {'☆'.repeat(5 - cFill)}
                            </span>
                            <b>{cAvg.toFixed(1)}</b>
                            <span>({reviewsCountLabel(cCnt)})</span>
                          </Link>
                        ) : (
                          <div className="jl-rating-line">
                            <span className="stars">
                              {'★'.repeat(cFill)}
                              {'☆'.repeat(5 - cFill)}
                            </span>
                            <b>{cAvg.toFixed(1)}</b>
                            <span>({reviewsCountLabel(cCnt)})</span>
                          </div>
                        )}

                        <div className="jl-bigcard-price-row">
                          {hasJobRequestPublishedPrice(req) ? (
                            <>
                              <div className="jl-bigcard-price">{budgetLabel}</div>
                              <div className="jl-bigcard-price-hint">за работу</div>
                            </>
                          ) : (
                            <>
                              <div className="jl-bigcard-price-muted">{JOB_REQUEST_PRICE_MISSING_LABEL}</div>
                              <div className="jl-bigcard-price-hint">уточните сумму в личных сообщениях</div>
                            </>
                          )}
                        </div>

                        <div className="jl-bigcard-actions">
                          <button
                            type="button"
                            className="jl-bigcard-btn primary"
                            onClick={e => { e.stopPropagation(); handleOpenOfferModal(req); }}
                          >
                            Откликнуться
                          </button>
                          <button
                            type="button"
                            className="jl-bigcard-btn ghost"
                            disabled={!req.customerId}
                            title={!req.customerId ? 'Чат будет доступен после появления профиля заказчика' : undefined}
                            onClick={e => {
                              e.stopPropagation();
                              if (req.customerId) {
                                bumpJobRequestView(req.id);
                                navigate(`/chat/${req.customerId}?jobRequestId=${req.id}`);
                              }
                            }}
                          >
                            Написать
                          </button>
                        </div>
                      </div>
                    </article>
                  );
              })}
            </div>
          )}
          </main>
        </div>
        </div>

        <OfferModal
          request={showOfferModal}
          offerForm={offerForm}
          setOfferForm={setOfferForm}
          onClose={handleCloseOfferModal}
          onSubmit={handleSubmitOffer}
          submitting={submitting}
        />
      </div>
    );
  }

  // ═══ ЭКРАН 1: сетка категорий с hero ═══
  const totalRequests = requests.length;

  return (
    <div className="fmp-page">
      <style>{findCatalogPageCss}</style>

      {/* Hero */}
      <div className="fmp-hero">
        <img src={heroCatSlug ? (CAT_ALL[heroCatSlug]?.photo || FW_DEFAULT_BG) : FW_DEFAULT_BG} alt="" className="fmp-hero-bg" />
        <div className="fmp-hero-overlay" />
        <div className="fmp-hero-body">
          <h1>Найти работу<br/>в Йошкар-Оле</h1>
          <p className="fmp-hero-sub">Откликайтесь на заявки заказчиков — первый отклик получает заказ чаще</p>
          {!loading && (
            <div className="fmp-hero-stats">
              {[
                { val: categories.length, label: 'категорий' },
                { val: totalRequests,     label: 'активных заявок' },
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

      {urlQ && !selectedCategory && (
        <div className="fmp-global-search">
          <div className="fmp-global-search-panel">
            <div className="fmp-global-search-bar">
              <div className="fmp-global-search-head">
                <span className="fmp-global-search-kicker">Поиск по заявкам</span>
                <h2 className="fmp-global-search-title">
                  Результаты: <span className="fmp-global-search-query">«{urlQ}»</span>
                </h2>
                {!loading && (
                  <span className="fmp-global-search-count">
                    {globalMatches.length} {pluralRequests(globalMatches.length)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="fmp-global-search-clear"
                onClick={() => setSearchParams({}, { replace: true })}
              >
                Очистить поиск
              </button>
            </div>

            {loading ? (
              <div className="fmp-global-grid fmp-global-grid--few">
                {[1, 2].map((i) => (
                  <div key={i} className="fmp-gcard fmp-gcard--sk" aria-hidden>
                    <div className="fmp-gcard-photo"><div className="sk" style={{ height: '100%', minHeight: 180 }} /></div>
                    <div className="fmp-gcard-body">
                      <div className="sk" style={{ height: 18, width: '88%' }} />
                      <div className="sk" style={{ height: 14, width: '55%', marginTop: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : globalMatches.length === 0 ? (
              <div className="fmp-global-empty">
                <div className="fmp-global-empty-ico">🔍</div>
                <h3 className="fmp-global-empty-title">По запросу «{urlQ}» заявок не найдено</h3>
                <p className="fmp-global-empty-sub">
                  Попробуйте другое слово или выберите категорию ниже.
                </p>
              </div>
            ) : (
              <div className={`fmp-global-grid${globalMatches.length <= 2 ? ' fmp-global-grid--few' : ''}`}>
                {globalMatches.map((req) => {
                  const photos = req.photos || [];
                  const mainPhoto =
                    photos[0] ||
                    getCategoryPlaceholderPhotoUrlOrDefault(
                      { categoryName: req.categoryName, categoryId: req.categoryId },
                      categories,
                    );
                  const catLabel = req.categoryName || categories.find((c) => String(c.id) === String(req.categoryId))?.name;
                  const budgetLabel = hasJobRequestPublishedPrice(req)
                    ? formatJobRequestBudgetLabel(req)
                    : JOB_REQUEST_PRICE_MISSING_LABEL;
                  const customerName = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';

                  return (
                    <Link
                      key={req.id}
                      to={`/find-work?request=${encodeURIComponent(req.id)}`}
                      className="fmp-gcard"
                    >
                      <div className="fmp-gcard-photo">
                        <img src={mainPhoto} alt="" />
                        {catLabel ? <span className="fmp-gcard-tag">{catLabel}</span> : null}
                        <span className="fmp-gcard-open">Открыть →</span>
                      </div>
                      <div className="fmp-gcard-body">
                        <div className="fmp-gcard-price-row">
                          <span className="fmp-gcard-price">{budgetLabel}</span>
                          <span className="fmp-gcard-price-unit">в заявке</span>
                        </div>
                        <div className="fmp-gcard-title">{req.title || 'Заявка'}</div>
                        <div className="fmp-gcard-meta">
                          <span className="fmp-gcard-worker">{customerName}</span>
                          {req.city ? <span className="fmp-gcard-city">📍 {req.city}</span> : null}
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

      <div className="fmp-cats-wrap">
        <div className="fmp-cats-label">Выберите категорию</div>
        {loading ? (
          <div className="fmp-cats-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1.5px solid #e8e8e8' }}>
                  <div className="sk" style={{ height: 150, borderRadius: 0 }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="sk" style={{ height: 15, width: '70%' }} />
                    <div className="sk" style={{ height: 12, width: '85%' }} />
                    <div className="sk" style={{ height: 12, width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fmp-cats-grid" onMouseLeave={() => setHeroCatSlug(null)}>
              {categories.map(cat => {
                const meta = CAT_ALL[cat.slug] || {};
                const count = getRequestsForCategory(cat).length;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    className={`fmp-cat-card${count > 0 ? ' fmp-cat-card--has-items' : ''}`}
                    onMouseEnter={() => setHeroCatSlug(cat.slug)}
                    onClick={() => {
                      setSelectedCategory(cat);
                      resetCategoryFilters();
                    }}
                  >
                    <div className="fmp-cat-img-wrap">
                      {meta.photo ? (
                        <img src={meta.photo} alt={cat.name} loading="lazy" />
                      ) : (
                        <div className="fmp-cat-img-ph">{meta.emoji || '🛠️'}</div>
                      )}
                      {count > 0 && (
                        <span className="fmp-cat-badge fmp-cat-badge--num" aria-label={pluralRequests(count)}>
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="fmp-cat-body">
                      <div className="fmp-cat-name">{cat.name}</div>
                      <div className="fmp-cat-desc">{meta.desc || cat.description || 'Профессиональные заказы'}</div>
                      <div className="fmp-cat-footer">
                        {count > 0 ? (
                          <span className="fmp-cat-count">{formatCatalogCountShort(count)}</span>
                        ) : (
                          <span className="fmp-cat-count-none">Нет заявок</span>
                        )}
                        <div className="fmp-cat-go">›</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
        )}
      </div>
    </div>
  );
}
