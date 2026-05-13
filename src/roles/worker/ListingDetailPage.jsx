import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { acceptListingDeal, recordListingView, getMyDeals, workerStartDeal } from '../../api';
import { parseListingDescription } from '../../components/ListingInfoPanels';
import { dealsDetailEdCss, listingDetailLightboxCss, dealCategoryEmoji } from '../shared/dealsWdStyles';
import DealDetailEdProgress from '../shared/DealDetailEdProgress';
import { getDealEdProgress } from '../../utils/dealDetailEdProgress';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
  getCategorySlugFromLabel,
} from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const listingViewPostedIds = new Set();
const COLLAPSE = 420;

const listingPageExtraCss = `
/* Узкий сайдбар и компактные карточки (стоимость / мастер и др.) */
.ed--listing-detail .ed-grid {
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
  gap: 18px;
}
@media (max-width: 1020px) {
  .ed--listing-detail .ed-grid { grid-template-columns: 1fr; }
}
.ed--listing-detail .ed-side { gap: 12px; min-width: 0; }
.ed--listing-detail .ed-side .ed-card {
  padding: 14px 16px;
  border-radius: 14px;
}
.ed--listing-detail .ed-price-num { font-size: 26px; margin-top: 6px; letter-spacing: -0.03em; }
.ed--listing-detail .ed-price-num small { font-size: 15px; }
.ed--listing-detail .ed-price-sub { margin-top: 6px; font-size: 12px; line-height: 1.45; }
.ed--listing-detail .ed-actions { margin-top: 10px; gap: 6px; }
.ed--listing-detail .ed-btn,
.ed--listing-detail .ed-msg-btn {
  padding: 9px 14px;
  font-size: 13px;
  border-radius: 10px;
}
.ed--listing-detail .ed-msg-btn svg { width: 14px; height: 14px; }
.ed--listing-detail .ed-cust-row { padding: 0 0 10px; }
.ed--listing-detail .ed-eyebrow--block { display: block; margin-bottom: 8px; }
.ed--listing-detail .ed-rating-line { margin-top: 10px; padding-top: 10px; gap: 6px; font-size: 12px; }
.ed--listing-detail .ed-rating-stars { font-size: 13px; letter-spacing: 1px; }
.ed--listing-detail .ed-own-note { margin-top: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.45; }
.ed--listing-detail .ed-link-deals { padding: 6px 0 0; font-size: 12px; }
.ed--listing-detail .ed-similar-head { margin-bottom: 10px; }
.ed--listing-detail .ed-similar-head strong { font-size: 14px; }

.ed-head { align-items: flex-start; }
.ed-head-right { display: flex; align-items: flex-start; gap: 10px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.ed-fav.ulc-fav-heart {
  width: 40px; height: 40px; border-radius: 10px; border: 1px solid #ececef; background: #fff; color: #71717a;
  display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: none; cursor: pointer;
}
.ed-fav.ulc-fav-heart:hover,
.ed-fav.ulc-fav-heart--on { color: #f45b31; border-color: #ffd4c2; background: #fff7f3; }
.ed-fav.ulc-fav-heart svg { width: 18px; height: 18px; }
.ed-listing-meta { margin-top: 10px; font-size: 13px; color: #71717a; line-height: 1.5; display: flex; flex-wrap: wrap; gap: 10px 16px; }
.ed-listing-meta span { display: inline-flex; align-items: center; gap: 6px; }
.ed-ava-fallback.neutral { background: #e4e4e8 !important; color: #52525b !important; }
.ed-rating-line { margin-top: 14px; padding-top: 14px; border-top: 1px solid #f4f4f5; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 13px; }
.ed-rating-stars { letter-spacing: 2px; font-size: 14px; }
.ed-rating-stars .on { color: #f45b31; }
.ed-rating-stars .off { color: #d4d4d8; }
.ed-rating-num { font-weight: 700; color: #0a0a0a; }
.ed-rating-sub { color: #a1a1aa; font-size: 12px; margin-left: 4px; }
.ed-similar-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ed-similar-head strong { font-size: 15px; font-weight: 600; color: #0a0a0a; letter-spacing: -.02em; }
.ed-similar-head a { font-size: 12px; color: #f45b31; font-weight: 600; text-decoration: none; }
.ed-similar-head a:hover { text-decoration: underline; }
.ed-sim-item { display: flex; gap: 12px; text-decoration: none; color: inherit; padding: 10px 8px; border-radius: 10px; transition: background .15s; }
.ed-sim-item:hover { background: #fafafa; }
.ed-sim-img { width: 58px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f4f4f5; }
.ed-sim-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ed-sim-title { font-size: 13px; font-weight: 500; color: #52525b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ed-sim-price { font-size: 13px; font-weight: 700; color: #0a0a0a; margin-top: 2px; }
.ed-error { font-size: 12px; color: #ef4444; font-weight: 600; padding: 4px 0; }
.ed-link-deals { display: block; text-align: center; font-size: 13px; color: #f45b31; font-weight: 600; background: none; border: none; cursor: pointer; font-family: inherit; padding: 8px 0 0; }
.ed-link-deals:hover { text-decoration: underline; }
.ed-own-note { margin-top: 14px; padding: 12px 14px; background: #fafafa; border-radius: 10px; font-size: 13px; color: #52525b; line-height: 1.5; border: 1px solid #ececef; }
`;

function reviewsCountLabel(n) {
  const x = Number(n) || 0;
  const abs = x % 100;
  const d = x % 10;
  if (abs > 10 && abs < 20) return `${x} отзывов`;
  if (d === 1) return `${x} отзыв`;
  if (d >= 2 && d <= 4) return `${x} отзыва`;
  return `${x} отзывов`;
}

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

const TERMINAL_DEAL_STATUSES = ['CANCELLED', 'REFUNDED'];

const listingStyles = `${dealsDetailEdCss}\n${listingDetailLightboxCss}\n${listingPageExtraCss}`;

export default function ListingDetailPage() {
  const { id } = useParams();
  const { userId, userName, userLastName, userAvatar, userRole } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [listingDeal, setListingDeal] = useState(null);
  const [stats, setStats] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [customerListingDeal, setCustomerListingDeal] = useState(null);
  const [actionError, setActionError] = useState('');
  const [workerAccepting, setWorkerAccepting] = useState(false);
  const [workerDealError, setWorkerDealError] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/listings/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return;
        setListing(data);
        setActivePhoto(0);
        setDescExpanded(false);
        if (
          data.id &&
          String(data.workerId || '') !== String(userId || '') &&
          !listingViewPostedIds.has(data.id)
        ) {
          listingViewPostedIds.add(data.id);
          recordListingView(data.id).catch(() => {});
        }
        if (data.workerId) {
          fetch(`${API}/workers/${data.workerId}/stats`)
            .then(r => (r.ok ? r.json() : null))
            .then(s => setStats(s))
            .catch(() => {});
        }
        fetch(`${API}/listings`)
          .then(r => (r.ok ? r.json() : []))
          .then(all => {
            setSimilar(
              (Array.isArray(all) ? all : [])
                .filter(l => l.active && l.id !== data.id && l.category === data.category)
                .slice(0, 4),
            );
          })
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, userId]);

  useEffect(() => {
    if (!listing?.id || !userId || String(userId) === String(listing.workerId)) {
      setCustomerListingDeal(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const deals = await getMyDeals(userId);
        if (cancelled) return;
        const lid = String(listing.id);
        const uid = String(userId);
        const match = (deals || []).find(
          d => String(d.listingId || '') === lid && String(d.customerId || '') === uid,
        );
        if (!match || TERMINAL_DEAL_STATUSES.includes(String(match.status || ''))) {
          setCustomerListingDeal(null);
        } else {
          setCustomerListingDeal(match);
        }
      } catch {
        if (!cancelled) setCustomerListingDeal(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listing?.id, listing?.workerId, userId]);

  useEffect(() => {
    if (!listing || !userId || String(userId) !== String(listing.workerId)) {
      setListingDeal(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyDeals(userId);
        if (cancelled) return;
        const lid = String(listing.id);
        const wid = String(userId);
        const matches = (data || []).filter(
          d =>
            String(d.workerId || '') === wid &&
            String(d.listingId || '') === lid &&
            !TERMINAL_DEAL_STATUSES.includes(d.status || ''),
        );
        matches.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setListingDeal(matches[0] || null);
      } catch {
        if (!cancelled) setListingDeal(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listing, userId]);

  const photos = listing?.photos?.length ? listing.photos : [];
  const fallbackPhoto = getCategoryPlaceholderPhotoUrlOrDefault({ category: listing?.category });
  const hasUploadedPhotos = photos.length > 0;
  const photoList = hasUploadedPhotos ? photos : [];
  const displayPhoto = hasUploadedPhotos ? photos[activePhoto] : fallbackPhoto;
  const catSlug = getCategorySlugFromLabel(listing?.category) || '';

  const { bodyText, urgencyLabel } = useMemo(
    () => parseListingDescription(listing?.description || ''),
    [listing?.description],
  );
  const showDescToggle = bodyText.length > COLLAPSE;
  const visibleBody =
    !descExpanded && showDescToggle ? `${bodyText.slice(0, COLLAPSE).trim()}…` : bodyText;

  const photoCount = photoList.length;
  const nextPhoto = useCallback(
    () => setActivePhoto(i => (photoCount > 1 ? (i + 1) % photoCount : i)),
    [photoCount],
  );
  const prevPhoto = useCallback(
    () => setActivePhoto(i => (photoCount > 1 ? (i - 1 + photoCount) % photoCount : i)),
    [photoCount],
  );

  useEffect(() => {
    if (!lightbox || photoCount <= 1) return;
    const onKey = e => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, photoCount, nextPhoto, prevPhoto]);

  const handleAcceptWork = async () => {
    if (!userId) {
      navigate('/login');
      return;
    }
    setActionError('');
    setAccepting(true);
    try {
      await acceptListingDeal(userId, listing.id);
      const deals = await getMyDeals(userId);
      const lid = String(listing.id);
      const uid = String(userId);
      const match = (deals || []).find(
        d => String(d.listingId || '') === lid && String(d.customerId || '') === uid,
      );
      if (match && !TERMINAL_DEAL_STATUSES.includes(String(match.status || ''))) {
        setCustomerListingDeal(match);
      } else {
        setCustomerListingDeal(null);
      }
    } catch (e) {
      setActionError(e?.message || 'Не удалось принять работу. Попробуйте ещё раз.');
    } finally {
      setAccepting(false);
    }
  };

  const reloadListingDealForWorker = async () => {
    if (!listing?.id || !userId) return;
    const data = await getMyDeals(userId);
    const lid = String(listing.id);
    const wid = String(userId);
    const matches = (data || []).filter(
      d =>
        String(d.workerId || '') === wid &&
        String(d.listingId || '') === lid &&
        !TERMINAL_DEAL_STATUSES.includes(String(d.status || '')),
    );
    matches.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setListingDeal(matches[0] || null);
  };

  const handleWorkerAcceptOnListing = async () => {
    if (!userId || !listingDeal?.id) {
      navigate('/login');
      return;
    }
    setWorkerDealError('');
    setWorkerAccepting(true);
    try {
      await workerStartDeal(userId, listingDeal.id);
      await reloadListingDealForWorker();
    } catch (e) {
      setWorkerDealError(e?.message || 'Не удалось принять заказ. Попробуйте ещё раз.');
    } finally {
      setWorkerAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="ed ed--listing-detail">
        <style>{listingStyles}</style>
        <div className="ed-wrap">
          <div
            style={{
              height: 40,
              width: 160,
              borderRadius: 10,
              background: 'linear-gradient(90deg,#f4f4f4 25%,#eaeaea 50%,#f4f4f4 75%)',
              backgroundSize: '200% 100%',
              marginBottom: 20,
            }}
          />
          <div
            style={{
              height: 320,
              borderRadius: 16,
              background: 'linear-gradient(90deg,#f4f4f4 25%,#eaeaea 50%,#f4f4f4 75%)',
              backgroundSize: '200% 100%',
              marginBottom: 16,
            }}
          />
          <div
            style={{
              height: 120,
              borderRadius: 16,
              background: 'linear-gradient(90deg,#f4f4f4 25%,#eaeaea 50%,#f4f4f4 75%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="ed ed--listing-detail">
        <style>{listingStyles}</style>
        <div className="ed-wrap" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Объявление не найдено</h2>
          <Link to="/find-master" style={{ color: '#f45b31', fontWeight: 600 }}>
            ← Вернуться к поиску
          </Link>
        </div>
      </div>
    );
  }

  const workerName = [listing.workerName, listing.workerLastName].filter(Boolean).join(' ') || 'Мастер';
  const initials = (listing.workerName || 'М')[0].toUpperCase();
  const workerRating = Number(stats?.averageRating ?? listing.workerRating ?? 0);
  const workerReviews = Number(stats?.reviewsCount ?? stats?.reviewCount ?? 0);
  const workerStars = Math.min(5, Math.max(0, Math.round(workerRating)));
  const isOwnListing = String(userId) === String(listing.workerId);
  const ownerFullName = [userName, userLastName].filter(Boolean).join(' ') || 'Мастер';
  const ownerAva = userAvatar
    ? userAvatar.startsWith('data:') || userAvatar.startsWith('http')
      ? userAvatar
      : `${API.replace(/\/api\/v1$/, '')}${userAvatar.startsWith('/') ? '' : '/'}${userAvatar}`
    : null;

  const priceNum = getListingPublishedPriceNumber(listing);
  const priceHasAmount = priceNum != null;
  const priceUnitTrim = listing.priceUnit && String(listing.priceUnit).trim();
  const priceMainLine = priceHasAmount
    ? `${priceNum.toLocaleString('ru-RU')}`
    : listing.priceUnit || 'Договорная';
  const priceSubLine = priceHasAmount
    ? `${priceUnitTrim || 'за работу'} · оплата по договорённости`
    : listing.priceUnit || null;

  const pubStr = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const addressLine = (listing.address || 'Йошкар-Ола, выезд по договорённости').replace(/\s*·\s*/g, ', ');
  const listingCity =
    (listing.city && String(listing.city).trim()) ||
    (addressLine.includes(',') ? addressLine.split(',')[0].trim() : '—');

  const goBack = () => {
    if (isOwnListing) {
      navigate('/my-listings');
      return;
    }
    if (!userId) {
      navigate(catSlug ? `/find-master/${catSlug}` : '/find-master');
      return;
    }
    if (userRole === 'WORKER') navigate('/find-work');
    else navigate('/my-orders');
  };

  const backLabel = isOwnListing
    ? 'Мои объявления'
    : !userId
      ? 'К поиску'
      : userRole === 'WORKER'
        ? 'Заявки'
        : 'Мои заказы';

  const listingActive = listing.active !== false;
  const statusPill = listingActive
    ? { label: 'Активна', dot: '#22c55e', shadow: '0 0 0 3px rgba(34,197,94,.2)' }
    : { label: 'В архиве', dot: '#a1a1aa', shadow: '0 0 0 3px rgba(161,161,161,.2)' };

  const progressDeal =
    customerListingDeal && !TERMINAL_DEAL_STATUSES.includes(String(customerListingDeal.status || ''))
      ? { deal: customerListingDeal, role: 'customer' }
      : isOwnListing && listingDeal && !TERMINAL_DEAL_STATUSES.includes(String(listingDeal.status || ''))
        ? { deal: listingDeal, role: 'worker' }
        : null;

  const lightboxPhotos = hasUploadedPhotos ? photoList : [fallbackPhoto];
  const lbIdx = hasUploadedPhotos ? activePhoto : 0;

  return (
    <div className="ed ed--listing-detail">
      <style>{listingStyles}</style>

      {lightbox && (
        <div className="jd-lightbox" onClick={() => setLightbox(false)} role="presentation">
          <button type="button" className="jd-lb-close" onClick={e => { e.stopPropagation(); setLightbox(false); }}>
            ✕
          </button>
          {lightboxPhotos.length > 1 && (
            <>
              <button
                type="button"
                className="jd-lb-nav jd-lb-prev"
                onClick={e => {
                  e.stopPropagation();
                  prevPhoto();
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="jd-lb-nav jd-lb-next"
                onClick={e => {
                  e.stopPropagation();
                  nextPhoto();
                }}
              >
                ›
              </button>
            </>
          )}
          <div className="jd-lightbox-img-wrap" onClick={e => e.stopPropagation()}>
            {lightboxPhotos.length > 1 && (
              <>
                <div className="jd-lb-zone jd-lb-zone-prev" onClick={prevPhoto} role="presentation" />
                <div className="jd-lb-zone jd-lb-zone-next" onClick={nextPhoto} role="presentation" />
              </>
            )}
            <img
              src={lightboxPhotos[lbIdx]}
              alt={listing.title || ''}
              onClick={() => lightboxPhotos.length <= 1 && setLightbox(false)}
            />
          </div>
          {lightboxPhotos.length > 1 && (
            <div className="jd-lb-counter">
              {lbIdx + 1} / {lightboxPhotos.length}
            </div>
          )}
          <div className="jd-lb-hint">← → по краям · Esc — закрыть</div>
        </div>
      )}

      <div className="ed-wrap">
        <button type="button" className="ed-back" onClick={goBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>

        <div className="ed-head">
          <div className="ed-head-left" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1>{listing.title || 'Объявление'}</h1>
              <span className="ed-head-id">#{listing.id}</span>
            </div>
            <div className="ed-listing-meta">
              {listing.category && (
                <span>
                  {dealCategoryEmoji(listing.category)} {listing.category}
                </span>
              )}
              <span>📍 {addressLine}</span>
              {listing.createdAt && <span>📅 {pubStr}</span>}
            </div>
          </div>
          <div className="ed-head-right">
            <FavoriteHeartButton kind="listing" id={listing.id} className="ulc-fav-heart ed-fav" />
            <span className="ed-status-pill">
              <span className="dot" style={{ background: statusPill.dot, boxShadow: statusPill.shadow }} />
              {statusPill.label}
            </span>
          </div>
        </div>

        <div className="ed-grid">
          <div className="ed-col">
            <div className="ed-gallery">
              <div
                className="ed-main"
                onClick={() => (hasUploadedPhotos || displayPhoto) && setLightbox(true)}
                role="presentation"
              >
                {displayPhoto ? (
                  <img src={displayPhoto} alt={listing.title || ''} key={`${hasUploadedPhotos}-${activePhoto}`} />
                ) : (
                  <div className="ed-main-placeholder" aria-hidden>
                    🔨
                  </div>
                )}
                <div className="ed-floats">
                  <div className="ed-chip">
                    <span className="pulse" style={{ background: statusPill.dot, boxShadow: statusPill.shadow }} />
                    <span className="ed-chip-text">{statusPill.label}</span>
                  </div>
                  {listing.category ? (
                    <div className="ed-chip">
                      <span className="ed-chip-text">
                        {dealCategoryEmoji(listing.category)} {listing.category}
                      </span>
                    </div>
                  ) : null}
                </div>
                {hasUploadedPhotos && photoCount > 1 ? (
                  <>
                    <button
                      type="button"
                      className="ed-arrow l"
                      aria-label="Предыдущее фото"
                      onClick={e => {
                        e.stopPropagation();
                        prevPhoto();
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
                      onClick={e => {
                        e.stopPropagation();
                        nextPhoto();
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="ed-counter">
                      {String(activePhoto + 1).padStart(2, '0')} / {String(photoCount).padStart(2, '0')}
                    </div>
                  </>
                ) : null}
              </div>
              {hasUploadedPhotos && photoCount > 1 ? (
                <div className="ed-thumbs">
                  {photoList.map((p, i) => (
                    <div
                      key={i}
                      className={`ed-thumb${i === activePhoto ? ' on' : ''}`}
                      onClick={() => setActivePhoto(i)}
                      role="presentation"
                    >
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {progressDeal ? (
              <DealDetailEdProgress {...getDealEdProgress(progressDeal.deal, progressDeal.role, timeAgo)} />
            ) : null}

            {bodyText ? (
              <section className="ed-card">
                <div className="ed-eyebrow">Описание</div>
                <p className="ed-desc">{visibleBody}</p>
                {showDescToggle && (
                  <button
                    type="button"
                    className="ed-btn ed-btn-ghost"
                    style={{ marginTop: 12, width: 'auto', alignSelf: 'flex-start' }}
                    onClick={() => setDescExpanded(x => !x)}
                  >
                    {descExpanded ? 'Свернуть ↑' : 'Читать полностью ↓'}
                  </button>
                )}
                {urgencyLabel ? (
                  <p className="ed-desc" style={{ marginTop: 14, color: '#c2410c', fontWeight: 600 }}>
                    ⏰ Срочность: {urgencyLabel.replace(/^📅\s*/, '')}
                  </p>
                ) : null}
              </section>
            ) : (
              <section className="ed-card">
                <div className="ed-eyebrow">Описание</div>
                <p className="ed-desc" style={{ color: '#a1a1aa', fontStyle: 'italic' }}>
                  Описание не добавлено
                </p>
              </section>
            )}

            <section className="ed-card">
              <div className="ed-eyebrow">Условия</div>
              <dl className="ed-rows">
                {[
                  listing.category && ['Категория', listing.category],
                  ['Город', listingCity],
                  ['Адрес', addressLine],
                  priceHasAmount && ['Стоимость', `${priceMainLine} ₽${priceUnitTrim ? ` ${priceUnitTrim}` : ''}`],
                  !priceHasAmount && listing.priceUnit && ['Стоимость', listing.priceUnit],
                  listing.createdAt && ['Опубликована', timeAgo(listing.createdAt) || pubStr],
                ]
                  .filter(Boolean)
                  .map(([label, value]) => (
                    <div key={label} className="ed-row">
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
              {priceHasAmount ? (
                <div className="ed-price-num">
                  {priceMainLine}
                  <small> ₽</small>
                </div>
              ) : (
                <div className="ed-price-num" style={{ fontSize: 22, fontWeight: 700 }}>
                  {priceMainLine}
                </div>
              )}
              {priceSubLine ? <p className="ed-price-sub">{priceSubLine}</p> : null}

              {isOwnListing && (
                <div className="ed-own-note">
                  <strong>Ваше объявление.</strong> Цена так же видна заказчику. Редактировать список — в «Мои объявления».
                </div>
              )}

              {!isOwnListing && (
                <div className="ed-actions">
                  {customerListingDeal &&
                  !TERMINAL_DEAL_STATUSES.includes(String(customerListingDeal.status || '')) ? (
                    <>
                      {customerListingDeal.status === 'NEW' && (
                        <div className="ed-callout ed-callout-warn" style={{ marginTop: 12 }}>
                          Заявка отправлена мастеру. Сделка ждёт подтверждения.
                        </div>
                      )}
                      {customerListingDeal.status === 'IN_PROGRESS' && (
                        <div className="ed-callout ed-callout-warn" style={{ marginTop: 12 }}>
                          Сделка в работе. Обсуждайте детали в чате.
                        </div>
                      )}
                      {customerListingDeal.status === 'COMPLETED' && (
                        <div className="ed-inline-wait" style={{ marginTop: 12 }}>
                          ✓ Сделка по объявлению завершена
                        </div>
                      )}
                      <Link to={userId ? `/chat/${listing.workerId}` : '/login'} className="ed-msg-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                        Написать сообщение
                      </Link>
                      <button type="button" className="ed-link-deals" onClick={() => navigate('/deals')}>
                        Перейти к сделкам →
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="ed-btn ed-btn-confirm"
                        onClick={handleAcceptWork}
                        disabled={accepting}
                      >
                        {accepting ? 'Отправляем…' : 'Откликнуться'}
                      </button>
                      <Link to={userId ? `/chat/${listing.workerId}` : '/login'} className="ed-btn ed-btn-ghost">
                        Написать сообщение
                      </Link>
                    </>
                  )}
                  {actionError ? <div className="ed-error">{actionError}</div> : null}
                </div>
              )}
            </div>

            {isOwnListing && listingDeal?.customerId ? (
              <div className="ed-card">
                <div className="ed-eyebrow ed-eyebrow--block">
                  Заказчик
                </div>
                <div
                  className="ed-cust-row"
                  onClick={() => listingDeal.customerId && navigate(`/customers/${listingDeal.customerId}`)}
                  role="presentation"
                >
                  <div className="ed-ava">
                    {listingDeal.customerAvatar &&
                    listingDeal.customerAvatar.length > 10 &&
                    listingDeal.customerAvatar !== 'null' ? (
                      <img src={listingDeal.customerAvatar} alt="" />
                    ) : (
                      <div className="ed-ava-fallback">{(listingDeal.customerName || 'З')[0].toUpperCase()}</div>
                    )}
                    <span className="ed-ava-dot" />
                  </div>
                  <div className="ed-cust-info">
                    <div className="ed-cust-name">
                      {[listingDeal.customerName, listingDeal.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                    </div>
                    <div className="ed-cust-meta">
                      {listingDeal.status === 'NEW' && 'Ожидает вашего подтверждения'}
                      {listingDeal.status === 'IN_PROGRESS' && 'Сделка в работе'}
                      {listingDeal.status === 'COMPLETED' && 'Сделка завершена'}
                    </div>
                  </div>
                  <div className="ed-cust-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <button type="button" className="ed-msg-btn" onClick={() => navigate(`/chat/${listingDeal.customerId}`)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Написать заказчику
                </button>
                {listingDeal.status === 'NEW' && (
                  <button
                    type="button"
                    className="ed-btn ed-btn-ghost"
                    style={{ marginTop: 8 }}
                    onClick={handleWorkerAcceptOnListing}
                    disabled={workerAccepting}
                  >
                    {workerAccepting ? 'Отправляем…' : 'Принять заказ'}
                  </button>
                )}
                {listingDeal.status === 'IN_PROGRESS' && (
                  <div className="ed-inline-wait" style={{ marginTop: 10 }}>
                    ✓ Вы приняли заказ — сделка активна
                  </div>
                )}
                {workerDealError ? <div className="ed-error">{workerDealError}</div> : null}
                <button
                  type="button"
                  className="ed-btn ed-btn-ghost"
                  style={{ marginTop: 8 }}
                  onClick={() => navigate(`/deals?dealId=${listingDeal.id}`)}
                >
                  Открыть сделку
                </button>
              </div>
            ) : null}

            {isOwnListing ? (
              <div className="ed-card">
                <div className="ed-eyebrow ed-eyebrow--block">
                  Ваш профиль
                </div>
                <div className="ed-cust-row ed-cust-row-static" onClick={() => navigate('/worker-profile')} role="presentation">
                  <div className="ed-ava">
                    {ownerAva ? <img src={ownerAva} alt={ownerFullName} /> : (
                      <div className="ed-ava-fallback">{(userName || 'М')[0].toUpperCase()}</div>
                    )}
                    <span className="ed-ava-dot" />
                  </div>
                  <div className="ed-cust-info">
                    <div className="ed-cust-name">{ownerFullName}</div>
                    <div className="ed-cust-meta">Мастер</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ed-card">
                <div className="ed-eyebrow ed-eyebrow--block">
                  Мастер
                </div>
                <div
                  className="ed-cust-row"
                  onClick={() => navigate(`/workers/${listing.workerId}`)}
                  role="presentation"
                >
                  <div className="ed-ava">
                    {listing.workerAvatar?.length > 10 ? (
                      <img src={listing.workerAvatar} alt="" />
                    ) : (
                      <div className="ed-ava-fallback neutral">{initials}</div>
                    )}
                    <span className="ed-ava-dot" />
                  </div>
                  <div className="ed-cust-info">
                    <div className="ed-cust-name">{workerName}</div>
                    <div className="ed-cust-meta">Активный мастер</div>
                  </div>
                  <div className="ed-cust-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <Link to={userId ? `/chat/${listing.workerId}` : '/login'} className="ed-msg-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Написать мастеру
                </Link>
                <div className="ed-rating-line">
                  <span className="ed-rating-stars" aria-hidden>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < workerStars ? 'on' : 'off'}>
                        {i < workerStars ? '★' : '☆'}
                      </span>
                    ))}
                  </span>
                  <span>
                    <span className="ed-rating-num">{workerRating.toFixed(1)}</span>
                    <span className="ed-rating-sub">({reviewsCountLabel(workerReviews)})</span>
                  </span>
                </div>
              </div>
            )}

            {similar.length > 0 ? (
              <div className="ed-card">
                <div className="ed-similar-head">
                  <strong>Похожие объявления</strong>
                  <Link to={catSlug ? `/find-master/${catSlug}` : '/find-master'}>Все →</Link>
                </div>
                {similar.map(s => {
                  const sPhoto = s.photos?.[0] || getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category });
                  const sp = getListingPublishedPriceNumber(s);
                  return (
                    <Link key={s.id} to={`/listings/${s.id}`} className="ed-sim-item">
                      <div className="ed-sim-img">
                        <img src={sPhoto} alt="" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ed-sim-title">{s.title}</div>
                        <div className="ed-sim-price">{sp ? `${sp.toLocaleString('ru-RU')} ₽` : '—'}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
