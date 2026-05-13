import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { acceptListingDeal, recordListingView, getMyDeals, workerStartDeal } from '../../api';
import { parseListingDescription } from '../../components/ListingInfoPanels';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
  getCategorySlugFromLabel,
} from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';
import './listingDetailLovable.css';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

/** Одна отправка просмотра на id за сессию (React StrictMode и повторные fetch) */
const listingViewPostedIds = new Set();

const COLLAPSE = 420;

function reviewsCountLabel(n) {
  const x = Number(n) || 0;
  const abs = x % 100;
  const d = x % 10;
  if (abs > 10 && abs < 20) return `${x} отзывов`;
  if (d === 1) return `${x} отзыв`;
  if (d >= 2 && d <= 4) return `${x} отзыва`;
  return `${x} отзывов`;
}

const Icon = {
  pin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" />
    </svg>
  ),
  cal: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.5" />
      <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 2" />
    </svg>
  ),
  msg: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"
      />
    </svg>
  ),
  arrL: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  arrR: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  zoom: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" />
    </svg>
  ),
};

const TERMINAL_DEAL_STATUSES = ['CANCELLED', 'REFUNDED'];

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
  const allPhotos = photos.length ? photos : [fallbackPhoto];
  const catSlug = getCategorySlugFromLabel(listing?.category) || '';

  const { bodyText, urgencyLabel } = useMemo(
    () => parseListingDescription(listing?.description || ''),
    [listing?.description],
  );
  const showDescToggle = bodyText.length > COLLAPSE;
  const visibleBody =
    !descExpanded && showDescToggle ? `${bodyText.slice(0, COLLAPSE).trim()}…` : bodyText;

  const nextPhoto = useCallback(
    () => setActivePhoto(i => (allPhotos.length > 1 ? (i + 1) % allPhotos.length : i)),
    [allPhotos.length],
  );
  const prevPhoto = useCallback(
    () => setActivePhoto(i => (allPhotos.length > 1 ? (i - 1 + allPhotos.length) % allPhotos.length : i)),
    [allPhotos.length],
  );

  useEffect(() => {
    if (!lightbox || allPhotos.length <= 1) return;
    const onKey = e => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, allPhotos.length, nextPhoto, prevPhoto]);

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
      <div className="ld">
        <div className="ld-page">
          <div className="ld-left">
            <div className="ld-skel" style={{ height: 22, width: 200, marginBottom: 12 }} />
            <div className="ld-skel" style={{ height: 280, borderRadius: 14, marginBottom: 16 }} />
            <div className="ld-skel" style={{ height: 120, borderRadius: 14 }} />
          </div>
          <div className="ld-right">
            <div className="ld-skel" style={{ height: 200, borderRadius: 14 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="ld">
        <div className="ld-page" style={{ display: 'block', textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Объявление не найдено</h2>
          <Link to="/find-master" className="ld-own-link">
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

  const listingsHubPath = !userId ? '/find-master' : userRole === 'WORKER' ? '/find-work' : '/my-orders';
  const listingsHubLabel = !userId ? 'Объявления' : userRole === 'WORKER' ? 'Заявки' : 'Мои заказы';

  const breadTitle =
    (listing.title || '').length > 35 ? `${(listing.title || '').slice(0, 35)}…` : listing.title || '';

  const catLink = catSlug ? `/find-master/${catSlug}` : '/find-master';

  return (
    <div className="ld">
      {lightbox && allPhotos.length > 0 && (
        <div className="ld-lightbox" onClick={() => setLightbox(false)} role="presentation">
          <button type="button" className="ld-lb-close" onClick={e => { e.stopPropagation(); setLightbox(false); }}>
            ✕
          </button>
          {allPhotos.length > 1 && (
            <>
              <button
                type="button"
                className="ld-lb-nav ld-lb-prev"
                onClick={e => {
                  e.stopPropagation();
                  prevPhoto();
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="ld-lb-nav ld-lb-next"
                onClick={e => {
                  e.stopPropagation();
                  nextPhoto();
                }}
              >
                ›
              </button>
            </>
          )}
          <div className="ld-lightbox-img-wrap" onClick={e => e.stopPropagation()}>
            {allPhotos.length > 1 && (
              <>
                <div className="ld-lb-zone ld-lb-zone-prev" onClick={prevPhoto} role="presentation" />
                <div className="ld-lb-zone ld-lb-zone-next" onClick={nextPhoto} role="presentation" />
              </>
            )}
            <img
              src={allPhotos[activePhoto]}
              alt={listing.title || ''}
              onClick={() => allPhotos.length <= 1 && setLightbox(false)}
            />
          </div>
          {allPhotos.length > 1 && (
            <div className="ld-lb-counter">
              {activePhoto + 1} / {allPhotos.length}
            </div>
          )}
          <div className="ld-lb-hint">← → по краям · Esc — закрыть</div>
        </div>
      )}

      <div className="ld-bread">
        <div className="ld-bread-inner">
          <button type="button" className="ld-back-btn" onClick={goBack} aria-label="Назад">
            <span className="ld-back-ico" aria-hidden>
              ←
            </span>
            Назад
          </button>
          <span className="ld-bread-sep" style={{ color: '#e5e5e5' }}>
            |
          </span>
          <Link to="/">Главная</Link>
          <span className="ld-bread-sep">›</span>
          <Link to={listingsHubPath}>{listingsHubLabel}</Link>
          <span className="ld-bread-sep">›</span>
          <Link to={catLink}>{listing.category || 'Категория'}</Link>
          <span className="ld-bread-sep">›</span>
          <span className="ld-bread-cur">{breadTitle}</span>
        </div>
      </div>

      <div className="ld-page">
        <div className="ld-left">
          <div className="ld-fw-head">
            <div className="ld-fw-title-row">
              <h1 className="ld-fw-title">{listing.title}</h1>
              <div className="ld-actions-row">
                <FavoriteHeartButton kind="listing" id={listing.id} />
              </div>
            </div>
            <div className="ld-fw-meta">
              {listing.category && <span className="ld-cat-chip">{listing.category}</span>}
              <span className="meta-item">
                {Icon.pin()}
                {addressLine}
              </span>
              {listing.createdAt && (
                <span className="meta-item">
                  {Icon.cal()}
                  {pubStr}
                </span>
              )}
            </div>
          </div>

          <div className="ld-fw-gallery-card">
            <div className="ld-gallery-wrap">
              <div
                className="ld-gallery-main"
                onClick={() => allPhotos.length && setLightbox(true)}
                role="presentation"
              >
                {allPhotos[activePhoto] ? (
                  <img src={allPhotos[activePhoto]} alt={listing.title || ''} key={activePhoto} />
                ) : (
                  <div className="ld-gallery-ph">📷</div>
                )}

                <div className="ld-floats">
                  {listing.active !== false ? (
                    <div className="ld-chip">
                      <span className="pulse" aria-hidden />
                      Активна
                    </div>
                  ) : (
                    <div className="ld-chip ld-chip--muted">
                      <span className="pulse" aria-hidden />
                      В архиве
                    </div>
                  )}
                </div>

                {allPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="ld-gallery-nav-btn prev"
                      onClick={e => {
                        e.stopPropagation();
                        prevPhoto();
                      }}
                      aria-label="Предыдущее фото"
                    >
                      {Icon.arrL()}
                    </button>
                    <button
                      type="button"
                      className="ld-gallery-nav-btn next"
                      onClick={e => {
                        e.stopPropagation();
                        nextPhoto();
                      }}
                      aria-label="Следующее фото"
                    >
                      {Icon.arrR()}
                    </button>
                  </>
                )}

                {allPhotos.length > 0 && (
                  <button
                    type="button"
                    className="ld-gallery-zoom"
                    onClick={e => {
                      e.stopPropagation();
                      setLightbox(true);
                    }}
                    title="Открыть полноэкранно"
                  >
                    {Icon.zoom()}
                  </button>
                )}

                {allPhotos.length > 1 && allPhotos.length <= 8 && (
                  <div className="ld-gallery-dots">
                    {allPhotos.map((_, i) => (
                      <div key={i} className={`ld-gallery-dot${i === activePhoto ? ' active' : ''}`} />
                    ))}
                  </div>
                )}

                {allPhotos.length > 8 && (
                  <div className="ld-gallery-count">
                    {activePhoto + 1} / {allPhotos.length}
                  </div>
                )}
              </div>

              {allPhotos.length > 1 && (
                <div className="ld-thumbs">
                  {allPhotos.map((p, i) => (
                    <div
                      key={i}
                      className={`ld-thumb${i === activePhoto ? ' active' : ''}`}
                      onClick={() => setActivePhoto(i)}
                      role="presentation"
                    >
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <section className="ld-card">
            <span className="ld-eyebrow">Описание</span>
            {bodyText ? (
              <>
                <p className="ld-desc-text">{visibleBody}</p>
                {showDescToggle && (
                  <button type="button" className="ld-desc-toggle" onClick={() => setDescExpanded(x => !x)}>
                    {descExpanded ? 'Свернуть ↑' : 'Читать полностью ↓'}
                  </button>
                )}
                {urgencyLabel && (
                  <div className="ld-urgency">
                    {Icon.clock()}
                    Срочность: {urgencyLabel.replace(/^📅\s*/, '')}
                  </div>
                )}
              </>
            ) : (
              <p className="ld-empty-desc">Описание не добавлено</p>
            )}
          </section>

          <section className="ld-card">
            <span className="ld-eyebrow">Подробности</span>
            <div className="ld-info-grid">
              <div className="ld-info-row">
                <span className="ld-info-key">Категория</span>
                <span className="ld-info-val">{listing.category || '—'}</span>
              </div>
              <div className="ld-info-row">
                <span className="ld-info-key">Город</span>
                <span className="ld-info-val">{listingCity}</span>
              </div>
              <div className="ld-info-row">
                <span className="ld-info-key">Адрес</span>
                <span className="ld-info-val">{addressLine}</span>
              </div>
              <div className="ld-info-row">
                <span className="ld-info-key">Опубликована</span>
                <span className="ld-info-val">{pubStr}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="ld-right">
          <div className="ld-price-panel">
            <div className="ld-price-label">Стоимость</div>
            {priceHasAmount ? (
              <div className="ld-price-big">
                {priceMainLine}
                <small> ₽</small>
              </div>
            ) : (
              <div className="ld-price-plain">{priceMainLine}</div>
            )}
            {priceSubLine && <div className="ld-price-sub">{priceSubLine}</div>}

            {isOwnListing && (
              <div className="ld-own-banner">
                <strong>Ваше объявление.</strong> Здесь видите цену так же, как заказчик. Редактировать список — в
                «Мои объявления».
              </div>
            )}

            {!isOwnListing && (
              <div className="ld-price-btns">
                {customerListingDeal &&
                !TERMINAL_DEAL_STATUSES.includes(String(customerListingDeal.status || '')) ? (
                  <>
                    {customerListingDeal.status === 'NEW' && (
                      <>
                        <div className="ld-banner-ok">🕐 Заявка отправлена мастеру</div>
                        <div className="ld-banner-info">
                          Сделка создана и ждёт подтверждения мастера. Статус — в «Мои сделки».
                        </div>
                      </>
                    )}
                    {customerListingDeal.status === 'IN_PROGRESS' && (
                      <>
                        <div className="ld-banner-ok">✓ Мастер принял заказ — сделка в работе</div>
                        <div className="ld-banner-info">Обсуждайте детали в чате и отслеживайте этапы в «Мои сделки».</div>
                      </>
                    )}
                    {customerListingDeal.status === 'COMPLETED' && (
                      <div className="ld-banner-ok">✓ Сделка по этому объявлению завершена</div>
                    )}
                    <Link to={userId ? `/chat/${listing.workerId}` : '/login'} className="ld-btn-contact">
                      {Icon.msg()}
                      Написать сообщение
                    </Link>
                    <button type="button" className="ld-link-deals" onClick={() => navigate('/deals')}>
                      Перейти к сделкам →
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ld-btn-msg"
                      onClick={handleAcceptWork}
                      disabled={accepting}
                    >
                      {accepting ? 'Отправляем…' : 'Откликнуться'}
                    </button>
                    <Link to={userId ? `/chat/${listing.workerId}` : '/login'} className="ld-btn-contact">
                      {Icon.msg()}
                      Написать сообщение
                    </Link>
                  </>
                )}
                {actionError && <div className="ld-error">{actionError}</div>}
              </div>
            )}
          </div>

          {isOwnListing && listingDeal?.customerId && (
            <div className="ld-fw-person-card">
              <div className="ld-fw-person-label">Заказчик</div>
              <div
                className="ld-fw-person-row"
                onClick={() => listingDeal.customerId && navigate(`/customers/${listingDeal.customerId}`)}
                role="presentation"
              >
                <div className="ld-fw-person-ava">
                  {listingDeal.customerAvatar &&
                  listingDeal.customerAvatar.length > 10 &&
                  listingDeal.customerAvatar !== 'null' ? (
                    <img className="ld-fw-person-ava-img" src={listingDeal.customerAvatar} alt="" />
                  ) : (
                    <div className="ld-fw-person-ava-fallback">
                      {(listingDeal.customerName || 'З')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="ld-fw-person-ava-dot" />
                </div>
                <div className="ld-fw-person-info">
                  <div className="ld-fw-person-name">
                    {[listingDeal.customerName, listingDeal.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                  </div>
                  <div className="ld-fw-person-meta">
                    {listingDeal.status === 'NEW' && 'Ожидает вашего подтверждения'}
                    {listingDeal.status === 'IN_PROGRESS' && 'Сделка в работе'}
                    {listingDeal.status === 'COMPLETED' && 'Сделка завершена'}
                  </div>
                </div>
                <div className="ld-fw-person-chevron">›</div>
              </div>

              <div className="ld-worker-stack">
                <button type="button" className="ld-btn-msg" onClick={() => navigate(`/chat/${listingDeal.customerId}`)}>
                  Написать заказчику
                </button>
                {listingDeal.status === 'NEW' && (
                  <button
                    type="button"
                    className="ld-btn-contact"
                    onClick={handleWorkerAcceptOnListing}
                    disabled={workerAccepting}
                  >
                    {workerAccepting ? 'Отправляем…' : 'Принять'}
                  </button>
                )}
                {listingDeal.status === 'IN_PROGRESS' && (
                  <div className="ld-inline-wait">✓ Вы приняли заказ — сделка активна</div>
                )}
                {workerDealError && <div className="ld-error">{workerDealError}</div>}
                <button type="button" className="ld-btn-contact" onClick={() => navigate(`/deals?dealId=${listingDeal.id}`)}>
                  Открыть сделку
                </button>
              </div>
            </div>
          )}

          {isOwnListing ? (
            <div className="ld-fw-person-card">
              <div className="ld-fw-person-label">Ваш профиль</div>
              <div className="ld-fw-person-row ld-fw-person-row--static">
                <div className="ld-fw-person-ava">
                  {ownerAva ? (
                    <img className="ld-fw-person-ava-img" src={ownerAva} alt={ownerFullName} />
                  ) : (
                    <div className="ld-fw-person-ava-fallback">{(userName || 'М')[0].toUpperCase()}</div>
                  )}
                  <span className="ld-fw-person-ava-dot" />
                </div>
                <div className="ld-fw-person-info">
                  <div className="ld-fw-person-name">{ownerFullName}</div>
                  <div className="ld-fw-person-meta">
                    <span className="green">●</span> Мастер
                  </div>
                </div>
              </div>
              <div className="ld-own-foot">
                <Link to="/worker-profile" className="ld-own-link">
                  Редактировать профиль →
                </Link>
              </div>
            </div>
          ) : (
            <div className="ld-fw-person-card">
              <div className="ld-fw-person-label">Мастер</div>
              <Link to={`/workers/${listing.workerId}`} className="ld-fw-person-link">
                <div className="ld-fw-person-ava">
                  {listing.workerAvatar?.length > 10 ? (
                    <img className="ld-fw-person-ava-img" src={listing.workerAvatar} alt="" />
                  ) : (
                    <div className="ld-fw-person-ava-fallback ld-fw-person-ava-fallback--neutral">{initials}</div>
                  )}
                  <span className="ld-fw-person-ava-dot" />
                </div>
                <div className="ld-fw-person-info">
                  <div className="ld-fw-person-name">{workerName}</div>
                  <div className="ld-fw-person-meta">
                    <span className="green">●</span> Активный мастер
                  </div>
                </div>
                <div className="ld-fw-person-chevron">›</div>
              </Link>
              <div className="ld-rating-row">
                <span className="ld-stars" aria-hidden>
                  <span className="ld-stars-fill">{'★'.repeat(workerStars)}</span>
                  <span className="ld-stars-empty">{'☆'.repeat(5 - workerStars)}</span>
                </span>
                <span>
                  <span className="ld-rating-num">{workerRating.toFixed(1)}</span>
                  <span className="ld-rating-sub">({reviewsCountLabel(workerReviews)})</span>
                </span>
              </div>
            </div>
          )}

          {similar.length > 0 && (
            <div className="ld-similar">
              <div className="ld-similar-head">
                Похожие объявления
                <Link to={catSlug ? `/find-master/${catSlug}` : '/find-master'}>Все →</Link>
              </div>
              <div className="ld-similar-list">
                {similar.map(s => {
                  const sPhoto = s.photos?.[0] || getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category });
                  const sp = getListingPublishedPriceNumber(s);
                  return (
                    <Link key={s.id} to={`/listings/${s.id}`} className="ld-sim-item">
                      <div className="ld-sim-img">
                        <img src={sPhoto} alt="" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ld-sim-title">{s.title}</div>
                        <div className="ld-sim-price">{sp ? `${sp.toLocaleString('ru-RU')} ₽` : '—'}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
