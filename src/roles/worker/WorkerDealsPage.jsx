import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  getMyDeals, completeDeal, createCustomerReview,
  workerStartDeal, cancelPendingDeal, cancelActiveDeal,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  dealsWdCss,
  edListingDetailMergedCss,
  dealsMoConfirmDarkCss,
  dealCategoryEmoji,
} from '../shared/dealsWdStyles';
import SortDropdown from '../../components/SortDropdown';
import {
  DealDarkProgress,
  DealConfirmCard,
  DealNewStatusCard,
} from '../shared/DealDetailBlocks';
import OrderCard from '../../components/myorders/OrderCard';
import PhotoLightbox from '../../components/PhotoLightbox';
import '../../styles/moCabinetStyle.css';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { dispatchListingArchivedAfterDeal } from '../../utils/listingArchiveEvents';
import { stripSearchParams } from '../../utils/navigationHelpers';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { dealCategoryLabel } from '../../utils/categoryLabel';
import { asPhotoArray } from '../../utils/photoArray';
import { normalizeDealForView } from '../../utils/normalizeDeal';
import { initialChar } from '../../utils/safeText';
import { BACKEND_ORIGIN } from '../../constants/backend';

const MY_DEALS_HERO_PHOTO =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=max&w=2400&q=86';

const ST = {
  NEW:         { label: 'Новый заказ',  color: '#d97706', bg: 'rgba(245,158,11,.12)',  dot: '#f59e0b' },
  IN_PROGRESS: { label: 'В работе',     color: '#2563eb', bg: 'rgba(37,99,235,.11)',   dot: '#3b82f6' },
  COMPLETED:   { label: 'Завершена',    color: '#16a34a', bg: 'rgba(34,197,94,.11)',   dot: '#22c55e' },
  CANCELLED:   { label: 'Отменена',     color: '#dc2626', bg: 'rgba(239,68,68,.1)',    dot: '#ef4444' },
};

const WORKER_STATUS_TABS = [
  { key: 'ALL',         label: 'Все' },
  { key: 'NEW',         label: 'Ждут' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'COMPLETED',   label: 'Завершены' },
  { key: 'CANCELLED',   label: 'Отменены' },
];

function EmptyState({ icon, title, text, btnLabel, onBtn, secondaryBtnLabel, onSecondaryBtn }) {
  return (
    <div className="mo-empty">
      <div className="mo-empty-emoji">{icon}</div>
      <div className="mo-empty-title">{title}</div>
      <div className="mo-empty-sub">{text}</div>
      {(btnLabel || secondaryBtnLabel) && (
        <div className="mo-empty-actions">
          {btnLabel && <button type="button" className="mo-cta" onClick={onBtn}>{btnLabel}</button>}
          {secondaryBtnLabel && (
            <button type="button" className="mo-cta mo-cta--outline" onClick={onSecondaryBtn}>{secondaryBtnLabel}</button>
          )}
        </div>
      )}
    </div>
  );
}

function dealToCardWorker(d) {
  const photos = dealPhotoList(d);
  const custName = customerFullName(d);
  const custInitial = initialChar(custName, 'З');
  const custAvatar = dealCustomerAvatarUrl(d);
  return {
    ...d,
    status: d.status,
    _dealStatus: d.status,
    budget: d.agreedPrice ? Number(d.agreedPrice) : null,
    category: dealCategoryLabel(d) || '',
    photos,
    offers: [{ name: custName, initial: custInitial, avatarUrl: custAvatar }],
  };
}

function workerFooterHint(d) {
  if (d.status === 'CANCELLED') return { text: '✕ Сделка отменена', color: '#dc2626' };
  if (d.status === 'COMPLETED') {
    return {
      text: d.customerConfirmed && d.workerConfirmed ? '✓ Завершена обеими сторонами' : '✓ Сделка завершена',
      color: '#16a34a',
    };
  }
  if (d.status === 'IN_PROGRESS') {
    if (!d.customerConfirmed) return { text: '⏳ Ждём заказчика', color: '#d97706' };
    if (!d.workerConfirmed) return { text: '⏳ Подтвердите выполнение', color: '#d97706' };
    return { text: '✓ Подтверждена', color: '#16a34a' };
  }
  if (d.status === 'NEW') return { text: '⏳ Ждёт вашего ответа', color: '#d97706' };
  return null;
}

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=70';

function resolvePhoto(u) {
  if (!u) return null;
  if (String(u).startsWith('http') || String(u).startsWith('data:')) return u;
  return BACKEND_ORIGIN + u;
}

function dealPhotoList(deal) {
  const categoryLabel = dealCategoryLabel(deal);
  const photos = asPhotoArray(deal.photos).map(resolvePhoto).filter(Boolean);
  if (photos.length) return photos;
  const placeholder = getCategoryPlaceholderPhotoUrlOrDefault({ categoryName: categoryLabel }, null);
  return [placeholder || FALLBACK_PHOTO];
}

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн. назад`;
  return new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'long' });
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function customerFullName(deal) {
  if (!deal) return 'Заказчик';
  const first = firstNonEmpty(
    deal.customerName,
    deal.customerFirstName,
    deal.customer?.name,
    deal.customer?.firstName,
  );
  const last = firstNonEmpty(
    deal.customerLastName,
    deal.customerSurname,
    deal.lastName,
    deal.customer?.lastName,
    deal.customer?.surname,
  );
  return [first, last].filter(Boolean).join(' ') || 'Заказчик';
}

function dealCustomerAvatarUrl(detail) {
  const a = detail?.customerAvatar;
  if (!a || String(a).length <= 10 || a === 'null') return null;
  const s = String(a);
  if (s.startsWith('http') || s.startsWith('data:')) return s;
  return BACKEND_ORIGIN + s;
}

export default function WorkerDealsPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [, setSearchParams] = useSearchParams();

  const [deals,    setDeals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [detail,   setDetail]   = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [declId,   setDeclId]   = useState(null);

  const [listSearch, setListSearch] = useState('');
  const [dealSort, setDealSort] = useState('new');

  // Modals
  const [cancelNewOpen,  setCancelNewOpen]  = useState(false);
  const [cancelNewNote,  setCancelNewNote]  = useState('');
  const [cancelNewBusy,  setCancelNewBusy]  = useState(false);
  const [cancelNewErr,   setCancelNewErr]   = useState('');

  const [cancelActOpen,  setCancelActOpen]  = useState(false);
  const [cancelActNote,  setCancelActNote]  = useState('');
  const [cancelActBusy,  setCancelActBusy]  = useState(false);
  const [cancelActErr,   setCancelActErr]   = useState('');

  const [reviewDeal,    setReviewDeal]    = useState(null);
  const [reviewForm,    setReviewForm]    = useState({ rating: 5, text: '' });
  const [reviewStatus,  setReviewStatus]  = useState('idle');

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyDeals(userId);
      const uid = String(userId || '');
      setDeals((data || [])
        .filter(d => String(d.workerId || '') === uid)
        .map(normalizeDealForView));
    } catch {
      setDeals([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useSameRouteRefetch('/deals', load);

  const closeDetail = useCallback(() => {
    setLightbox(null);
    setDetail(null);
    setPhotoIdx(0);
    stripSearchParams(setSearchParams, ['dealId']);
  }, [setSearchParams]);

  const openDetail = useCallback((deal) => {
    setDetail(normalizeDealForView(deal));
    setPhotoIdx(0);
    setLightbox(null);
  }, []);

  // open deal from URL ?dealId=...
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('dealId');
    if (id && deals.length > 0) {
      const found = deals.find(d => d.id === id);
      if (found) openDetail(found);
    }
  }, [location.search, deals, openDetail]);

  // sync detail with fresh data
  useEffect(() => {
    if (detail?.id) {
      const fresh = deals.find(d => d.id === detail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(detail)) openDetail(fresh);
    }
  }, [deals, detail, openDetail]);

  /* ── actions ── */
  const handleStart = async (dealId, e) => {
    e?.stopPropagation?.();
    setActionId(dealId);
    try {
      const updated = await workerStartDeal(userId, dealId);
      if (updated?.id) {
        const uid = String(updated.id);
        setDeals(prev => prev.map(d => String(d.id) === uid ? normalizeDealForView({ ...d, ...updated }) : d));
        setDetail(prev => (prev && String(prev.id) === uid ? normalizeDealForView({ ...prev, ...updated }) : prev));
      }
      await load();
    } catch {}
    setActionId(null);
  };

  const handleComplete = async (dealId, e) => {
    e?.stopPropagation?.();
    setActionId(dealId);
    try {
      const deal = await completeDeal(userId, dealId);
      dispatchListingArchivedAfterDeal(deal);
      await load();
    } catch {}
    setActionId(null);
  };

  const handleCancelNew = async () => {
    if (!detail?.id) return;
    setCancelNewBusy(true); setCancelNewErr('');
    try {
      await cancelPendingDeal(userId, detail.id, cancelNewNote);
      setCancelNewOpen(false); setCancelNewNote('');
      await load(); closeDetail();
    } catch (e) { setCancelNewErr(e?.message || 'Не удалось отменить'); }
    setCancelNewBusy(false);
  };

  const handleCancelActive = async () => {
    if (!detail?.id) return;
    setCancelActBusy(true); setCancelActErr('');
    try {
      await cancelActiveDeal(userId, detail.id, cancelActNote);
      setCancelActOpen(false); setCancelActNote('');
      await load(); closeDetail();
    } catch (e) { setCancelActErr(e?.message || 'Не удалось отменить'); }
    setCancelActBusy(false);
  };

  const handleReviewSubmit = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createCustomerReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done'); await load();
    } catch { setReviewStatus('error'); }
  };

  /* ── derived ── */
  const counts = {
    ALL:         deals.length,
    NEW:         deals.filter(d => d.status === 'NEW').length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
    CANCELLED:   deals.filter(d => d.status === 'CANCELLED').length,
  };

  const listSearchNorm = listSearch.trim().toLowerCase();
  const filteredBase = useMemo(
    () => (filter === 'ALL' ? deals : deals.filter((d) => d.status === filter)),
    [deals, filter],
  );
  const filtered = useMemo(() => {
    let r = filteredBase;
    if (listSearchNorm) {
      r = r.filter((d) => {
        const t = String(d.title || '').toLowerCase();
        const c = String(d.category || '').toLowerCase();
        const cust = customerFullName(d).toLowerCase();
        return t.includes(listSearchNorm) || c.includes(listSearchNorm) || cust.includes(listSearchNorm);
      });
    }
    if (dealSort === 'price') {
      r = [...r].sort((a, b) => Number(b.agreedPrice || 0) - Number(a.agreedPrice || 0));
    } else {
      r = [...r].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return r;
  }, [filteredBase, listSearchNorm, dealSort]);

  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Мастер';
  const ava = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND_ORIGIN + userAvatar)
    : null;

  const dealCardMenuItems = useCallback((deal) => {
    const items = [];
    if (
      deal.status === 'COMPLETED'
      && !deal.hasWorkerReview
      && deal.customerId
      && dealEligibleForReviews(deal)
    ) {
      items.push({
        label: '★ Оставить отзыв',
        onClick: () => {
          setReviewForm({ rating: 5, text: '' });
          setReviewStatus('idle');
          setReviewDeal(deal);
        },
      });
    }
    if (deal.status === 'NEW') {
      items.push({
        label: 'Отказаться от заказа',
        danger: true,
        disabled: declId === deal.id,
        onClick: async () => {
          if (!window.confirm('Отказаться от заказа? Заказчик сможет выбрать другого мастера.')) return;
          setDeclId(deal.id);
          try {
            await cancelPendingDeal(userId, deal.id, '');
            await load();
          } catch (err) {
            window.alert(err?.message || 'Не удалось');
          } finally {
            setDeclId(null);
          }
        },
      });
    }
    if (deal.customerId) {
      items.push({
        label: 'Профиль заказчика',
        onClick: () => navigate(`/customers/${deal.customerId}`),
      });
    }
    return items;
  }, [userId, declId, load, navigate]);

  /* ══ DETAIL ══ */
  if (detail) {
    const st = ST[detail.status] || ST.NEW;
    const categoryLabel = dealCategoryLabel(detail);
    const photoList = dealPhotoList(detail);
    const hasPhoto = photoList.length > 0;
    const workerOk = detail.workerConfirmed;
    const customerOk = detail.customerConfirmed;
    const taskDescShown = formatListingOriginDescription('WORKER', detail.description);
    const custLabel = customerFullName(detail);
    const customerAva = dealCustomerAvatarUrl(detail);
    const pulseShadow = `0 0 0 3px ${st.dot}26`;

    const handleDetailBack = closeDetail;

    return (
      <div className="ed ed--listing-detail">
        <style>{`${dealsWdCss}\n${edListingDetailMergedCss}\n${dealsMoConfirmDarkCss}`}</style>

        <PhotoLightbox
          lightbox={lightbox}
          setLightbox={setLightbox}
          onIndexChange={setPhotoIdx}
          alt={detail.title || ''}
        />

        <div className="ed-wrap">
          <button
            type="button"
            className="ed-back"
            onClick={handleDetailBack}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Мои сделки
          </button>

          <div className="ed-head">
            <div className="ed-head-left">
              <h1>{detail.title || 'Задача'}</h1>
            </div>
            <span className="ed-status-pill">
              <span className="dot" style={{ background: st.dot, boxShadow: pulseShadow }} />
              {st.label}
            </span>
          </div>

          <div className="ed-grid">
            <div className="ed-col">
              <div className="ed-gallery">
                <div
                  className="ed-main"
                  role="presentation"
                  onClick={() => hasPhoto && setLightbox({ photos: photoList, index: photoIdx })}
                  style={hasPhoto ? { cursor: 'zoom-in' } : undefined}
                >
                  {hasPhoto ? (
                    <img src={photoList[photoIdx]} alt={detail.title || ''} />
                  ) : (
                    <div className="ed-main-placeholder" aria-hidden>
                      {dealCategoryEmoji(categoryLabel)}
                    </div>
                  )}
                  <div className="ed-floats">
                    <div className="ed-chip">
                      <span className="pulse" style={{ background: st.dot, boxShadow: pulseShadow }} />
                      <span className="ed-chip-text">{st.label}</span>
                    </div>
                    {categoryLabel ? (
                      <div className="ed-chip">
                        <span className="ed-chip-text">
                          {dealCategoryEmoji(categoryLabel)} {categoryLabel}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  {hasPhoto && photoList.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="ed-arrow l"
                        aria-label="Предыдущее фото"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoIdx((i) => (i - 1 + photoList.length) % photoList.length);
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
                          setPhotoIdx((i) => (i + 1) % photoList.length);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="ed-counter">
                        {String(photoIdx + 1).padStart(2, '0')} / {String(photoList.length).padStart(2, '0')}
                      </div>
                    </>
                  ) : null}
                </div>
                {hasPhoto && photoList.length > 1 ? (
                  <div className="ed-thumbs">
                    {photoList.map((p, i) => (
                      <div
                        key={i}
                        className={`ed-thumb${i === photoIdx ? ' on' : ''}`}
                        onClick={() => setPhotoIdx(i)}
                        role="presentation"
                      >
                        <img src={p} alt="" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <DealDarkProgress deal={detail} />

              {taskDescShown ? (
                <section className="ed-card">
                  <div className="ed-eyebrow">Описание</div>
                  <p className="ed-desc">{taskDescShown}</p>
                </section>
              ) : null}

              <section className="ed-card">
                <div className="ed-eyebrow">Условия</div>
                <dl className="ed-rows">
                  {[
                    categoryLabel && ['Категория', categoryLabel],
                    detail.agreedPrice && ['Стоимость', `${Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽`],
                    detail.createdAt && ['Создана', timeAgo(detail.createdAt)],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} className="ed-row">
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {detail.status === 'CANCELLED' && detail.cancellationReason ? (
                <div className="ed-reason-box">
                  <div className="ed-reason-label">Причина отмены</div>
                  <p className="ed-reason-text">{detail.cancellationReason}</p>
                </div>
              ) : null}
            </div>

            <aside className="ed-side">
              <div className="ed-card">
                <div className="ed-eyebrow">Согласованная стоимость</div>
                {detail.agreedPrice ? (
                  <div className="ed-price-num">
                    {Number(detail.agreedPrice).toLocaleString('ru-RU')}
                    <small> ₽</small>
                  </div>
                ) : (
                  <div className="ed-price-num" style={{ fontSize: 22, fontWeight: 700 }}>
                    По договорённости
                  </div>
                )}
                <p className="ed-price-sub">
                  Оплата после выполнения и подтверждения обеими сторонами.
                </p>
              </div>

              {detail.status === 'NEW' ? (
                <DealNewStatusCard
                  viewAs="worker"
                  dealId={detail.id}
                  actionId={actionId}
                  chatUserId={detail.customerId}
                  onAccept={(id) => handleStart(id, null)}
                  onCancel={() => { setCancelNewErr(''); setCancelNewNote(''); setCancelNewOpen(true); }}
                  onChat={() => navigate(`/chat/${detail.customerId}`)}
                />
              ) : null}

              {detail.status === 'IN_PROGRESS' ? (
                <DealConfirmCard
                  viewAs="worker"
                  customerOk={customerOk}
                  workerOk={workerOk}
                  actionId={actionId}
                  dealId={detail.id}
                  onComplete={(id) => handleComplete(id, null)}
                  onCancelActive={() => { setCancelActErr(''); setCancelActOpen(true); }}
                />
              ) : null}

              {detail.status === 'COMPLETED' ? (
                <div className="ed-card">
                  <div className="ed-done-banner">
                    <div className="ed-done-emoji" aria-hidden>🏆</div>
                    <div className="ed-done-title">Работа завершена!</div>
                    <div className="ed-done-sub">Обе стороны подтвердили выполнение</div>
                    {!detail.hasWorkerReview && detail.customerId && dealEligibleForReviews(detail) ? (
                      <button
                        type="button"
                        className="ed-btn-review"
                        onClick={() => {
                          setReviewForm({ rating: 5, text: '' });
                          setReviewStatus('idle');
                          setReviewDeal(detail);
                        }}
                      >
                        ⭐ Оставить отзыв о заказчике
                      </button>
                    ) : detail.hasWorkerReview ? (
                      <div className="ed-review-done">✓ Вы оставили отзыв</div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {detail.status === 'CANCELLED' ? (
                <div className="ed-card">
                  <div className="ed-cancel-banner">
                    <div className="ed-cancel-emoji" aria-hidden>❌</div>
                    <div className="ed-cancel-title">Сделка отменена</div>
                    {detail.cancellationReason ? (
                      <div style={{ fontSize: 12, color: '#71717a' }}>{detail.cancellationReason}</div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="ed-card">
                <div className="ed-eyebrow" style={{ marginBottom: 14, display: 'block' }}>Заказчик</div>
                <div
                  className="ed-cust-row"
                  onClick={() => detail.customerId && navigate(`/customers/${detail.customerId}`)}
                  role="presentation"
                >
                  <div className="ed-ava">
                    {customerAva ? <img src={customerAva} alt="" /> : (
                      <div className="ed-ava-fallback">{(custLabel[0] || 'З').toUpperCase()}</div>
                    )}
                  </div>
                  <div className="ed-cust-info">
                    <div className="ed-cust-name">{custLabel}</div>
                    <div className="ed-cust-meta">
                      {detail.status === 'NEW' || detail.status === 'IN_PROGRESS' ? 'Активный заказчик' : 'Заказчик'}
                    </div>
                  </div>
                  <div className="ed-cust-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <button type="button" className="ed-msg-btn" onClick={() => navigate(`/chat/${detail.customerId}`)}>
                  Написать заказчику
                </button>
              </div>

              <div className="ed-card">
                <div className="ed-eyebrow" style={{ marginBottom: 14, display: 'block' }}>Ваш профиль</div>
                <div className="ed-cust-row" onClick={() => navigate('/worker-profile')} role="presentation">
                  <div className="ed-ava">
                    {ava ? <img src={ava} alt="" /> : (
                      <div className="ed-ava-fallback">{initialChar(userName, 'М')}</div>
                    )}
                  </div>
                  <div className="ed-cust-info">
                    <div className="ed-cust-name">{fullName}</div>
                    <div className="ed-cust-meta">Мастер</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {cancelNewOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelNewBusy && setCancelNewOpen(false)}>
            <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="wd-modal-title">Отказаться от заказа?</h3>
              <p className="wd-modal-sub">Заказчик увидит, что вы отказались. Можно указать причину — это необязательно.</p>
              <textarea className="wd-modal-textarea" rows={3} value={cancelNewNote} onChange={(e) => setCancelNewNote(e.target.value)} placeholder="Например: занят, не мой профиль работ…" />
              {cancelNewErr && <div className="wd-modal-error">{cancelNewErr}</div>}
              <div className="wd-modal-btns">
                <button type="button" className="wd-modal-cancel" disabled={cancelNewBusy} onClick={() => setCancelNewOpen(false)}>Назад</button>
                <button type="button" className="wd-modal-confirm" disabled={cancelNewBusy} onClick={handleCancelNew}>{cancelNewBusy ? 'Отправляем…' : 'Да, отказаться'}</button>
              </div>
            </div>
          </div>
        )}

        {cancelActOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelActBusy && setCancelActOpen(false)}>
            <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚫</div>
                <h3 className="wd-modal-title" style={{ margin: 0 }}>Отказаться от сделки?</h3>
              </div>
              <div className="wd-modal-warn">⚠️ Сделка уже <b>в работе</b>. Заказчик получит уведомление. Это действие необратимо.</div>
              <textarea className="wd-modal-textarea" rows={3} value={cancelActNote} onChange={(e) => setCancelActNote(e.target.value)} placeholder="Причина отказа (необязательно)…" />
              {cancelActErr && <div className="wd-modal-error">{cancelActErr}</div>}
              <div className="wd-modal-btns">
                <button type="button" className="wd-modal-cancel" disabled={cancelActBusy} onClick={() => setCancelActOpen(false)}>Не отменять</button>
                <button type="button" className="wd-modal-confirm" disabled={cancelActBusy} onClick={handleCancelActive}>{cancelActBusy ? 'Отменяем…' : 'Да, отказаться'}</button>
              </div>
            </div>
          </div>
        )}

        {reviewDeal && (
          <div className="wd-modal-bg" onClick={() => setReviewDeal(null)}>
            <div className="wd-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
              {reviewStatus === 'done' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Отзыв отправлен!</h3>
                  <p style={{ color: '#6b7280', margin: '0 0 20px' }}>Спасибо за вашу оценку</p>
                  <button type="button" onClick={() => setReviewDeal(null)} style={{ padding: '10px 28px', background: '#e8410a', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Закрыть</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Отзыв о заказчике</h2>
                    <button type="button" onClick={() => setReviewDeal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, marginBottom: 18 }}>
                    {reviewDeal.customerAvatar && reviewDeal.customerAvatar.length > 10
                      ? <img src={reviewDeal.customerAvatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#e8410a,#ff7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>{(customerFullName(reviewDeal)[0] || 'З').toUpperCase()}</div>}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{customerFullName(reviewDeal)}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Заказчик</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Оценка</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, padding: 0, opacity: s <= reviewForm.rating ? 1 : 0.22, color: '#f59e0b' }}>★</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Комментарий</div>
                    <textarea
                      value={reviewForm.text}
                      onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                      placeholder="Как прошла работа с заказчиком? Был ли пунктуален, корректен в общении, вовремя ли оплатил..."
                      className="wd-modal-textarea"
                      rows={4}
                    />
                  </div>
                  {reviewStatus === 'error' && <div className="wd-modal-error">Не удалось отправить отзыв. Попробуйте ещё раз.</div>}
                  <button
                    type="button"
                    onClick={handleReviewSubmit}
                    disabled={reviewStatus === 'sending' || !reviewForm.text?.trim()}
                    style={{ width: '100%', padding: '13px', background: reviewForm.text?.trim() ? '#e8410a' : '#e5e7eb', border: 'none', borderRadius: 9, color: reviewForm.text?.trim() ? '#fff' : '#9ca3af', fontSize: 15, fontWeight: 700, cursor: reviewForm.text?.trim() ? 'pointer' : 'not-allowed', transition: 'background .15s' }}
                  >{reviewStatus === 'sending' ? 'Отправляем...' : 'Отправить отзыв'}</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══ LIST ══ */
  return (
    <>
    <div className="mo-page mo-orders-root">
      <header className="mo-hero">
        <img src={MY_DEALS_HERO_PHOTO} alt="" />
        <div className="mo-hero-inner">
          <div>
            <h1>Мои сделки</h1>
            <p>Сделки с заказчиками — отслеживайте прогресс и подтверждайте</p>
          </div>
          <button type="button" className="mo-cta" onClick={() => navigate('/find-work')}>
            + Найти работу
          </button>
        </div>
      </header>

      <main className="mo-main">
        <div className="mo-toolbar">
          <div className="mo-status-tabs">
            {WORKER_STATUS_TABS.map((t) => {
              const count = t.key === 'ALL' ? counts.ALL : counts[t.key] ?? 0;
              return (
                <button
                  key={t.key}
                  type="button"
                  className={`mo-status-tab${filter === t.key ? ' active' : ''}`}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                  {count > 0 && <span className="mo-status-tab-count">{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="mo-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
            <input
              type="search"
              placeholder="Поиск по сделкам или заказчику…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <SortDropdown
            value={dealSort}
            onChange={setDealSort}
            options={[
              { value: 'new', label: 'Сначала новые' },
              { value: 'price', label: 'По цене' },
            ]}
            variant="toolbar"
            ariaLabel="Сортировка сделок"
          />
        </div>

        {loading ? (
          <EmptyState icon="⏳" title="Загружаем сделки…" text="Пожалуйста, подождите" />
        ) : deals.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="Здесь появятся ваши сделки"
            text="Откликайтесь на заявки и принимайте заказы — они появятся в этом списке."
            btnLabel="+ Найти работу"
            onBtn={() => navigate('/find-work')}
            secondaryBtnLabel="Мои объявления"
            onSecondaryBtn={() => navigate('/my-listings')}
          />
        ) : filteredBase.length === 0 && filter !== 'ALL' ? (
          <EmptyState
            icon={filter === 'COMPLETED' ? '✅' : '📋'}
            title="В этой категории пока пусто"
            text="Переключите вкладку или посмотрите все сделки."
            btnLabel="Все сделки"
            onBtn={() => setFilter('ALL')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Ничего не найдено"
            text="Попробуйте изменить запрос, вкладку или сортировку."
            btnLabel="Сбросить фильтры"
            onBtn={() => { setListSearch(''); setFilter('ALL'); }}
          />
        ) : (
          <div className="mo-grid">
            {filtered.map((d) => {
              const hint = workerFooterHint(d);
              return (
                <OrderCard
                  key={d.id}
                  order={dealToCardWorker(d)}
                  partnerRole="Заказчик"
                  footerHint={hint?.text}
                  footerHintColor={hint?.color}
                  onOpen={() => openDetail(d)}
                  onChat={d.customerId ? () => navigate(`/chat/${d.customerId}`) : undefined}
                  menuItems={dealCardMenuItems(d)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>

    {reviewDeal && !detail && (
        <div className="wd-modal-bg" onClick={() => setReviewDeal(null)}>
          <div className="wd-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            {reviewStatus === 'done' ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Отзыв отправлен!</h3>
                <p style={{ color: '#6b7280', margin: '0 0 20px' }}>Спасибо за вашу оценку</p>
                <button type="button" onClick={() => setReviewDeal(null)} style={{ padding: '10px 28px', background: '#e8410a', border: 'none', borderRadius: 9, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Закрыть</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Отзыв о заказчике</h2>
                  <button type="button" onClick={() => setReviewDeal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, marginBottom: 18 }}>
                  {reviewDeal.customerAvatar && reviewDeal.customerAvatar.length > 10
                    ? <img src={reviewDeal.customerAvatar.startsWith('http') ? reviewDeal.customerAvatar : BACKEND_ORIGIN + reviewDeal.customerAvatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#e8410a,#ff7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>{(customerFullName(reviewDeal)[0] || 'З').toUpperCase()}</div>}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{customerFullName(reviewDeal)}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Заказчик</div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Оценка</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, padding: 0, opacity: s <= reviewForm.rating ? 1 : 0.22, color: '#f59e0b' }}>★</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Комментарий</div>
                  <textarea
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                    placeholder="Как прошла работа с заказчиком? Был ли пунктуален, корректен в общении…"
                    className="wd-modal-textarea"
                    rows={4}
                  />
                </div>
                {reviewStatus === 'error' && <div className="wd-modal-error">Не удалось отправить отзыв. Попробуйте ещё раз.</div>}
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={reviewStatus === 'sending' || !reviewForm.text?.trim()}
                  style={{ width: '100%', padding: '13px', background: reviewForm.text?.trim() ? '#e8410a' : '#e5e7eb', border: 'none', borderRadius: 9, color: reviewForm.text?.trim() ? '#fff' : '#9ca3af', fontSize: 15, fontWeight: 700, cursor: reviewForm.text?.trim() ? 'pointer' : 'not-allowed', transition: 'background .15s' }}
                >
                  {reviewStatus === 'sending' ? 'Отправляем...' : 'Отправить отзыв'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
