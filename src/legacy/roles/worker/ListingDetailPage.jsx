import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { acceptListingDeal, recordListingView, getMyDeals, workerStartDeal } from '../../api';
import { parseListingDescription } from '../../../components/ListingInfoPanels';
import { listingsDetailJdCss, listingDetailLightboxCss } from '../../../roles/shared/dealsWdStyles';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
  getCategorySlugFromLabel,
} from '../../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../../utils/listingPublishedPrice';
import FavoriteHeartButton from '../../../components/FavoriteHeartButton';

const API = 'https://svoi-mastera-backend-ntp0.onrender.com/api/v1';

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
  back: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  next: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
};

const TERMINAL_DEAL_STATUSES = ['CANCELLED', 'REFUNDED'];

const listingStyles = `${listingsDetailJdCss}\n${listingDetailLightboxCss}`;

export default function ListingDetailPage() {
  const { id } = useParams();
  const { userId, userName, userLastName, userAvatar } = useAuth();
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
  const catSlug = getCategorySlugFromLabel(listing?.category);

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
    if (allPhotos.length <= 1) return;
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
      <div className="jd">
        <style>{listingStyles}</style>
        <div className="jd-wrap">
          <div className="jd-grid">
            <div className="jd-col">
              <div className="jd-skel" style={{ height: 22, width: 180, marginBottom: 12 }} />
              <div className="jd-skel" style={{ height: 360, borderRadius: 16, marginBottom: 16 }} />
              <div className="jd-skel" style={{ height: 140, borderRadius: 16 }} />
            </div>
            <div className="jd-side">
              <div className="jd-skel" style={{ height: 220, borderRadius: 16 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="jd">
        <style>{listingStyles}</style>
        <div className="jd-wrap" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Объявление не найдено</h2>
          <Link to="/find-master" className="jd-own-link">
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
    ? priceUnitTrim || 'за работу'
    : listing.priceUnit || null;

  const budgetDetailVal = priceHasAmount
    ? `${priceNum.toLocaleString('ru-RU')} ₽${priceUnitTrim ? ` ${priceUnitTrim}` : ' за работу'}`
    : listing.priceUnit || 'Договорная';

  const pubStr = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const addressLine = (listing.address || 'Йошкар-Ола • выезд по договорённости').replace(/\s*·\s*/g, ' • ');
  const crumbTitle = `${listing.title?.slice(0, 48) || ''}${listing.title?.length > 48 ? '…' : ''}`;

  const goBack = () => {
    if (isOwnListing) navigate('/my-listings');
    else navigate(catSlug ? `/find-master/${catSlug}` : '/find-master');
  };

  return (
    <div className="jd">
      <style>{listingStyles}</style>

      {lightbox && allPhotos.length > 0 && (
        <div className="jd-lightbox">
          <button type="button" className="jd-lb-close" onClick={() => setLightbox(false)}>
            ✕
          </button>

          {allPhotos.length > 1 && (
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

          <div className="jd-lightbox-img-wrap">
            {allPhotos.length > 1 && (
              <>
                <div className="jd-lb-zone jd-lb-zone-prev" onClick={prevPhoto} role="presentation" />
                <div className="jd-lb-zone jd-lb-zone-next" onClick={nextPhoto} role="presentation" />
              </>
            )}
            <img
              src={allPhotos[activePhoto]}
              alt={listing.title || ''}
              onClick={() => allPhotos.length <= 1 && setLightbox(false)}
            />
          </div>

          {allPhotos.length > 1 && (
            <div className="jd-lb-counter">
              {activePhoto + 1} / {allPhotos.length}
            </div>
          )}
          <div className="jd-lb-hint">← → клавиши или клик по краям · Esc — закрыть</div>
        </div>
      )}

      <div className="jd-wrap">
        <button type="button" className="jd-back" onClick={goBack}>
          {isOwnListing ? '← Назад к моим объявлениям' : '← Назад'}
        </button>

        <nav className="jd-crumbs">
          <Link to="/">Главная</Link>
          <span className="sep"> / </span>
          {isOwnListing ? (
            <Link to="/my-listings">Мои объявления</Link>
          ) : (
            <>
              <Link to="/find-master">Мастера</Link>
              {listing.category && (
                <>
                  <span className="sep"> / </span>
                  <Link to={`/find-master/${catSlug}`}>{listing.category}</Link>
                </>
              )}
            </>
          )}
          <span className="sep"> / </span>
          <span className="cur">{crumbTitle}</span>
        </nav>

        <div className="jd-head">
          <h1 className="jd-title">{listing.title}</h1>
          <FavoriteHeartButton kind="listing" id={listing.id} className="jd-fav-btn" />
        </div>

        <div className="jd-meta-lw">
          {listing.category && (
            <span className="jd-meta-item">
              <span className="jd-meta-emoji" aria-hidden>
                📁
              </span>
              <span>{listing.category}</span>
            </span>
          )}
          <span className="jd-meta-item">
            <span className="jd-meta-emoji" aria-hidden>
              📍
            </span>
            <span>{addressLine}</span>
          </span>
          {listing.createdAt && (
            <span className="jd-meta-item">
              <span className="jd-meta-emoji" aria-hidden>
                📅
              </span>
              <span>{pubStr}</span>
            </span>
          )}
        </div>

        <div className="jd-grid">
          <div className="jd-col">
            <div className="jd-gallery">
              <div className="jd-main" onClick={() => allPhotos.length && setLightbox(true)} role="presentation">
                {allPhotos[activePhoto] ? (
                  <img src={allPhotos[activePhoto]} alt={listing.title} key={activePhoto} />
                ) : (
                  <div className="jd-main-ph">📷</div>
                )}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="jd-arrow l"
                      onClick={e => {
                        e.stopPropagation();
                        prevPhoto();
                      }}
                      aria-label="Предыдущее фото"
                    >
                      <Icon.back />
                    </button>
                    <button
                      type="button"
                      className="jd-arrow r"
                      onClick={e => {
                        e.stopPropagation();
                        nextPhoto();
                      }}
                      aria-label="Следующее фото"
                    >
                      <Icon.next />
                    </button>
                    <div className="jd-counter">
                      {String(activePhoto + 1).padStart(2, '0')} / {String(allPhotos.length).padStart(2, '0')}
                    </div>
                  </>
                )}
              </div>
              {allPhotos.length > 1 && (
                <div className="jd-thumbs">
                  {allPhotos.map((p, i) => (
                    <div
                      key={i}
                      className={`jd-thumb${i === activePhoto ? ' on' : ''}`}
                      onClick={() => setActivePhoto(i)}
                      role="presentation"
                    >
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <section className="jd-card jd-card--soft">
              <h2 className="jd-h2-card">Описание</h2>
              {bodyText ? (
                <>
                  <p className="jd-desc">{visibleBody}</p>
                  {showDescToggle && (
                    <button type="button" className="jd-desc-toggle" onClick={() => setDescExpanded(x => !x)}>
                      {descExpanded ? 'Свернуть ↑' : 'Читать полностью ↓'}
                    </button>
                  )}
                  {urgencyLabel && (
                    <p className="jd-urgency-line">
                      <span className="jd-urgency-ico" aria-hidden>
                        ⏰
                      </span>
                      <strong>Срочность:</strong> {urgencyLabel.replace(/^📅\s*/, '')}
                    </p>
                  )}
                </>
              ) : (
                <p className="jd-empty-desc">Описание не добавлено</p>
              )}
            </section>

            <section className="jd-card jd-card--soft">
              <h2 className="jd-h2-card">Подробности</h2>
              <dl className="jd-rows">
                <div className="jd-row2">
                  <dt className="k">Категория</dt>
                  <dd className="v">{listing.category || '—'}</dd>
                </div>
                <div className="jd-row2">
                  <dt className="k">Адрес</dt>
                  <dd className="v">{addressLine}</dd>
                </div>
                <div className="jd-row2">
                  <dt className="k">Стоимость</dt>
                  <dd className="v">{budgetDetailVal}</dd>
                </div>
                <div className="jd-row2">
                  <dt className="k">Опубликована</dt>
                  <dd className="v">{pubStr}</dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="jd-side">
            <div className="jd-card">
              <div className="jd-eyebrow">Стоимость</div>
              {priceHasAmount ? (
                <div className="jd-price-num">
                  {priceMainLine}
                  <small> ₽</small>
                </div>
              ) : (
                <div className="jd-price-plain">{priceMainLine}</div>
              )}
              {priceSubLine && <p className="jd-price-sub">{priceSubLine}</p>}

              {isOwnListing && (
                <div className="jd-own-banner">
                  <strong>Ваше объявление.</strong>{' '}
                  Здесь видите цену так же, как заказчик. Редактировать список — в «Мои объявления».
                </div>
              )}

              {!isOwnListing && (
                <div className="jd-actions">
                  {customerListingDeal &&
                  !TERMINAL_DEAL_STATUSES.includes(String(customerListingDeal.status || '')) ? (
                    <>
                      {customerListingDeal.status === 'NEW' && (
                        <>
                          <div className="jd-banner-ok">🕐 Заявка отправлена мастеру</div>
                          <div className="jd-banner-info">
                            ℹ️ Сделка создана и ждёт подтверждения мастера. Как только мастер примет — она станет
                            активной. Вы можете следить за статусом в разделе «Мои сделки».
                          </div>
                        </>
                      )}
                      {customerListingDeal.status === 'IN_PROGRESS' && (
                        <>
                          <div className="jd-banner-ok">✓ Мастер принял заказ — сделка в работе</div>
                          <div className="jd-banner-info">
                            ℹ️ Обсуждайте детали в чате и отслеживайте этапы в «Мои сделки».
                          </div>
                        </>
                      )}
                      {customerListingDeal.status === 'COMPLETED' && (
                        <div className="jd-banner-ok">✓ Сделка по этому объявлению завершена</div>
                      )}
                      <Link to={userId ? `/chat/${listing.workerId}` : '/login'} className="jd-btn jd-btn-ghost">
                        Написать сообщение
                      </Link>
                      <button type="button" className="jd-link-deals" onClick={() => navigate('/deals')}>
                        Перейти к сделкам →
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="jd-btn jd-btn-primary" onClick={handleAcceptWork} disabled={accepting}>
                        {accepting ? 'Отправляем…' : 'Откликнуться'}
                      </button>
                      <Link to={userId ? `/chat/${listing.workerId}` : '/login'} className="jd-btn jd-btn-ghost">
                        Написать сообщение
                      </Link>
                    </>
                  )}
                  {actionError && <div className="jd-error">{actionError}</div>}
                </div>
              )}
            </div>

            {isOwnListing && listingDeal?.customerId && (
              <div className="jd-card">
                <div className="jd-eyebrow" style={{ marginBottom: 14, display: 'block' }}>
                  Заказчик
                </div>
                <div
                  className="jd-cust-row"
                  onClick={() => listingDeal.customerId && navigate(`/customers/${listingDeal.customerId}`)}
                  role="presentation"
                >
                  <div className="jd-ava">
                    {listingDeal.customerAvatar && listingDeal.customerAvatar.length > 10 && listingDeal.customerAvatar !== 'null' ? (
                      <img src={listingDeal.customerAvatar} alt="" />
                    ) : (
                      <div className="jd-ava-fallback">{(listingDeal.customerName || 'З')[0].toUpperCase()}</div>
                    )}
                    <span className="jd-ava-dot" />
                  </div>
                  <div className="jd-cust-info">
                    <div className="jd-cust-name">
                      {[listingDeal.customerName, listingDeal.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                    </div>
                    <div className="jd-cust-meta">
                      {listingDeal.status === 'NEW' && 'Ожидает вашего подтверждения'}
                      {listingDeal.status === 'IN_PROGRESS' && 'Сделка в работе'}
                      {listingDeal.status === 'COMPLETED' && 'Сделка завершена'}
                    </div>
                  </div>
                  <span className="jd-cust-chevron">›</span>
                </div>

                <div className="jd-worker-stack">
                  <button type="button" className="jd-btn jd-btn-primary" onClick={() => navigate(`/chat/${listingDeal.customerId}`)}>
                    Написать заказчику
                  </button>
                  {listingDeal.status === 'NEW' && (
                    <button type="button" className="jd-btn jd-btn-ghost" onClick={handleWorkerAcceptOnListing} disabled={workerAccepting}>
                      {workerAccepting ? 'Отправляем…' : 'Принять'}
                    </button>
                  )}
                  {listingDeal.status === 'IN_PROGRESS' && <div className="jd-inline-wait">✓ Вы приняли заказ — сделка активна</div>}
                  {workerDealError && <div className="jd-error">{workerDealError}</div>}
                  <button type="button" className="jd-btn jd-btn-ghost" onClick={() => navigate(`/deals?dealId=${listingDeal.id}`)}>
                    Открыть сделку
                  </button>
                </div>
              </div>
            )}

            {isOwnListing ? (
              <div className="jd-card">
                <div className="jd-eyebrow" style={{ marginBottom: 14, display: 'block' }}>
                  Ваш профиль
                </div>
                <div className="jd-cust-row jd-cust-row-static">
                  <div className="jd-ava jd-ava--round">
                    {ownerAva ? <img src={ownerAva} alt={ownerFullName} /> : <div className="jd-ava-fallback">{(userName || 'М')[0].toUpperCase()}</div>}
                    <span className="jd-ava-dot" />
                  </div>
                  <div className="jd-cust-info">
                    <div className="jd-cust-name">{ownerFullName}</div>
                    <div className="jd-cust-meta">
                      <span className="green">●</span> Мастер
                    </div>
                  </div>
                </div>
                <div className="jd-own-foot">
                  <Link to="/worker-profile" className="jd-own-link">
                    Редактировать профиль →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="jd-card">
                <div className="jd-eyebrow" style={{ marginBottom: 14, display: 'block' }}>
                  Мастер
                </div>
                <Link to={`/workers/${listing.workerId}`} className="jd-cust-row">
                  <div className="jd-ava jd-ava--round">
                    {listing.workerAvatar?.length > 10 ? (
                      <img src={listing.workerAvatar} alt="" />
                    ) : (
                      <div className="jd-ava-fallback jd-ava-fallback--neutral">{initials}</div>
                    )}
                    <span className="jd-ava-dot" />
                  </div>
                  <div className="jd-cust-info">
                    <div className="jd-cust-name">{workerName}</div>
                    <div className="jd-cust-meta">
                      <span className="green">●</span> Активный мастер
                    </div>
                  </div>
                  <span className="jd-cust-chevron">›</span>
                </Link>
                <div className="jd-rating-row">
                  <span className="jd-stars">
                    {'★'.repeat(workerStars)}
                    {'☆'.repeat(5 - workerStars)}
                  </span>
                  <span className="jd-rating-num">{workerRating.toFixed(1)}</span>
                  <span className="jd-rating-sub">({reviewsCountLabel(workerReviews)})</span>
                </div>
              </div>
            )}

            {similar.length > 0 && (
              <div className="jd-similar">
                <div className="jd-similar-head">
                  Похожие объявления
                  <Link to={`/find-master/${catSlug}`}>Все →</Link>
                </div>
                <div className="jd-similar-list">
                  {similar.map(s => {
                    const sPhoto = s.photos?.[0] || getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category });
                    const sp = getListingPublishedPriceNumber(s);
                    return (
                      <Link key={s.id} to={`/listings/${s.id}`} className="jd-sim-item">
                        <div className="jd-sim-img">
                          <img src={sPhoto} alt="" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="jd-sim-title">{s.title}</div>
                          <div className="jd-sim-price">{sp ? `${sp.toLocaleString('ru-RU')} ₽` : '—'}</div>
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
    </div>
  );
}
