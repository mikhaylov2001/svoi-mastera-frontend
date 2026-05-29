import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  getMyDeals, completeDeal, createReview,
  cancelPendingDeal, cancelActiveDeal,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { dispatchListingArchivedAfterDeal } from '../../utils/listingArchiveEvents';
import { stripSearchParams } from '../../utils/navigationHelpers';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import SortDropdown from '../../components/SortDropdown';
import {
  dealsWdCss,
  edListingDetailMergedCss,
  dealsMoConfirmDarkCss,
  dealCategoryEmoji,
} from '../shared/dealsWdStyles';
import OrderCard from '../../components/myorders/OrderCard';
import PhotoLightbox from '../../components/PhotoLightbox';
import '../../styles/moCabinetStyle.css';

const HERO = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2400&q=86';
const BACKEND = 'https://svoi-mastera-backend-n9om.onrender.com';

const STATUS_TABS = [
  { key: 'ALL',         label: 'Все' },
  { key: 'NEW',         label: 'Ждут' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'COMPLETED',   label: 'Завершены' },
  { key: 'CANCELLED',   label: 'Отменены' },
];

const ST = {
  NEW:         { label: 'Ждёт мастера', color: '#d97706', bg: 'rgba(245,158,11,.12)',  dot: '#f59e0b' },
  IN_PROGRESS: { label: 'В работе',     color: '#2563eb', bg: 'rgba(37,99,235,.11)',   dot: '#3b82f6' },
  COMPLETED:   { label: 'Завершена',    color: '#16a34a', bg: 'rgba(34,197,94,.11)',   dot: '#22c55e' },
  CANCELLED:   { label: 'Отменена',     color: '#dc2626', bg: 'rgba(239,68,68,.1)',    dot: '#ef4444' },
};

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=70';

function resolvePhoto(u) {
  if (!u) return null;
  if (String(u).startsWith('http') || String(u).startsWith('data:')) return u;
  return BACKEND + u;
}

function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин. назад`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} ч. назад`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'вчера';
  if (d < 7) return `${d} дн. назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function workerFullName(deal) {
  return [deal.workerName, deal.workerLastName].filter(Boolean).join(' ') || 'Мастер';
}

function workerAvatarUrl(deal) {
  return resolvePhoto(deal.workerAvatarUrl);
}

function dealPhotoList(deal) {
  const photos = (deal.photos || []).map(resolvePhoto).filter(Boolean);
  if (photos.length) return photos;
  const placeholder = getCategoryPlaceholderPhotoUrlOrDefault(deal.category, null);
  return [placeholder || FALLBACK_PHOTO];
}

/** Map deal → format compatible with OrderCard */
function dealToCard(d) {
  const photos = dealPhotoList(d);
  const workerName = workerFullName(d);
  const workerInitial = (d.workerName || 'М')[0].toUpperCase();
  const workerAvatar = workerAvatarUrl(d);
  const statusMap = {
    NEW: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  };
  return {
    ...d,
    status: statusMap[d.status] || d.status,
    _dealStatus: d.status,
    budget: d.agreedPrice ? Number(d.agreedPrice) : null,
    category: d.category || '',
    photos,
    offers: [{ name: workerName, initial: workerInitial, avatarUrl: workerAvatar }],
    offersCount: 0,
  };
}

function EmptyState({ icon, title, text, btnLabel, onBtn }) {
  return (
    <div className="mo-empty">
      <div className="mo-empty-emoji">{icon}</div>
      <div className="mo-empty-title">{title}</div>
      <div className="mo-empty-sub">{text}</div>
      {btnLabel && <div className="mo-empty-actions"><button type="button" className="mo-cta" onClick={onBtn}>{btnLabel}</button></div>}
    </div>
  );
}

import {
  DealDarkProgress,
  DealConfirmCard,
  DealNewStatusCard,
} from '../shared/DealDetailBlocks';

/* ═══════════════════════════════
   DEAL DETAIL — ed--listing-detail (как заявки / объявления / сделки мастера)
═══════════════════════════════ */
function DealDetail({
  deal, onBack, onComplete, onCancelNew, onCancelActive, onReview, actionId, navigate,
  userName, userLastName, userAvatar,
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const st = ST[deal.status] || ST.NEW;
  const photoList = dealPhotoList(deal);
  const hasPhoto = photoList.length > 0;
  const customerOk = deal.customerConfirmed;
  const workerOk = deal.workerConfirmed;
  const taskDescShown = formatListingOriginDescription('CUSTOMER', deal.description);
  const workerLabel = workerFullName(deal);
  const workerAva = workerAvatarUrl(deal);
  const pulseShadow = `0 0 0 3px ${st.dot}26`;
  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Заказчик';
  const customerAva = resolvePhoto(userAvatar);

  useEffect(() => {
    setPhotoIdx(0);
    setLightbox(null);
  }, [deal.id]);

  const handleBack = () => {
    setLightbox(null);
    onBack();
  };

  return (
    <div className="ed ed--listing-detail">
      <style>{`${dealsWdCss}\n${edListingDetailMergedCss}\n${dealsMoConfirmDarkCss}`}</style>

      <PhotoLightbox
        lightbox={lightbox}
        setLightbox={setLightbox}
        onIndexChange={setPhotoIdx}
        alt={deal.title || ''}
      />

      <div className="ed-wrap">
        <button type="button" className="ed-back" onClick={handleBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Мои сделки
        </button>

        <div className="ed-head">
          <div className="ed-head-left">
            <h1>{deal.title || 'Сделка'}</h1>
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
                  <img src={photoList[photoIdx]} alt={deal.title || ''} />
                ) : (
                  <div className="ed-main-placeholder" aria-hidden>
                    {dealCategoryEmoji(deal.category)}
                  </div>
                )}
                <div className="ed-floats">
                  <div className="ed-chip">
                    <span className="pulse" style={{ background: st.dot, boxShadow: pulseShadow }} />
                    <span className="ed-chip-text">{st.label}</span>
                  </div>
                  {deal.category ? (
                    <div className="ed-chip">
                      <span className="ed-chip-text">
                        {dealCategoryEmoji(deal.category)} {deal.category}
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

            <DealDarkProgress deal={deal} />

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
                  deal.category && ['Категория', deal.category],
                  deal.agreedPrice && ['Стоимость', `${Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽`],
                  deal.createdAt && ['Создана', timeAgo(deal.createdAt)],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} className="ed-row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {deal.status === 'CANCELLED' && deal.cancellationReason ? (
              <div className="ed-reason-box">
                <div className="ed-reason-label">Причина отмены</div>
                <p className="ed-reason-text">{deal.cancellationReason}</p>
              </div>
            ) : null}
          </div>

          <aside className="ed-side">
            <div className="ed-card">
              <div className="ed-eyebrow">Согласованная стоимость</div>
              {deal.agreedPrice ? (
                <div className="ed-price-num">
                  {Number(deal.agreedPrice).toLocaleString('ru-RU')}
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

            {deal.status === 'NEW' ? (
              <DealNewStatusCard
                viewAs="customer"
                dealId={deal.id}
                chatUserId={deal.workerId}
                onCancel={onCancelNew}
                onChat={() => navigate(`/chat/${deal.workerId}`)}
              />
            ) : null}

            {deal.status === 'IN_PROGRESS' ? (
              <DealConfirmCard
                viewAs="customer"
                customerOk={customerOk}
                workerOk={workerOk}
                actionId={actionId}
                dealId={deal.id}
                onComplete={onComplete}
                onCancelActive={onCancelActive}
              />
            ) : null}

            {deal.status === 'COMPLETED' ? (
              <div className="ed-card">
                <div className="ed-done-banner">
                  <div className="ed-done-emoji" aria-hidden>🏆</div>
                  <div className="ed-done-title">Сделка завершена!</div>
                  <div className="ed-done-sub">Обе стороны подтвердили выполнение</div>
                  {!deal.hasReview && deal.workerId && dealEligibleForReviews(deal) ? (
                    <button type="button" className="ed-btn-review" onClick={onReview}>
                      ⭐ Оставить отзыв мастеру
                    </button>
                  ) : deal.hasReview ? (
                    <div className="ed-review-done">✓ Вы оставили отзыв</div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {deal.status === 'CANCELLED' ? (
              <div className="ed-card">
                <div className="ed-cancel-banner">
                  <div className="ed-cancel-emoji" aria-hidden>❌</div>
                  <div className="ed-cancel-title">Сделка отменена</div>
                  {deal.cancellationReason ? (
                    <div style={{ fontSize: 12, color: '#71717a' }}>{deal.cancellationReason}</div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="ed-card">
              <div className="ed-eyebrow" style={{ marginBottom: 14, display: 'block' }}>Мастер</div>
              <div
                className="ed-cust-row"
                onClick={() => deal.workerId && navigate(`/workers/${deal.workerId}`)}
                role="presentation"
              >
                <div className="ed-ava">
                  {workerAva ? <img src={workerAva} alt="" /> : (
                    <div className="ed-ava-fallback">{(deal.workerName || 'М')[0].toUpperCase()}</div>
                  )}
                </div>
                <div className="ed-cust-info">
                  <div className="ed-cust-name">{workerLabel}</div>
                  <div className="ed-cust-meta">Мастер</div>
                </div>
                <div className="ed-cust-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              {deal.workerId ? (
                <button type="button" className="ed-msg-btn" onClick={() => navigate(`/chat/${deal.workerId}`)}>
                  Написать мастеру
                </button>
              ) : null}
            </div>

            <div className="ed-card">
              <div className="ed-eyebrow" style={{ marginBottom: 14, display: 'block' }}>Ваш профиль</div>
              <div className="ed-cust-row" onClick={() => navigate('/profile')} role="presentation">
                <div className="ed-ava">
                  {customerAva ? <img src={customerAva} alt="" /> : (
                    <div className="ed-ava-fallback">{(userName || 'З')[0].toUpperCase()}</div>
                  )}
                </div>
                <div className="ed-cust-info">
                  <div className="ed-cust-name">{fullName}</div>
                  <div className="ed-cust-meta">Заказчик</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   CANCEL MODAL
═══════════════════════════════ */
function CancelModal({ title, subtitle, warning, onClose, onConfirm, busy, err }) {
  const [note, setNote] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => !busy && onClose()}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '28px 28px 24px', width: '100%', maxWidth: 440, boxShadow: '0 28px 80px rgba(17,24,39,.3)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 950, color: '#111827' }}>{title}</h3>
        {subtitle && <p style={{ margin: '0 0 14px', fontSize: 14, color: '#6b7280', lineHeight: 1.55 }}>{subtitle}</p>}
        {warning && <div style={{ padding: '10px 14px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{warning}</div>}
        <textarea style={{ width: '100%', minHeight: 90, border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '12px 14px', fontFamily: 'Manrope,sans-serif', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} placeholder="Причина отмены (необязательно)…" value={note} onChange={e => setNote(e.target.value)} />
        {err && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button disabled={busy} onClick={onClose} style={{ flex: 1, minHeight: 46, border: '1.5px solid #e5e7eb', borderRadius: 14, background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: 14 }}>Назад</button>
          <button disabled={busy} onClick={() => onConfirm(note)} style={{ flex: 1, minHeight: 46, border: 'none', borderRadius: 14, background: '#e8410a', color: '#fff', cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontWeight: 900, fontSize: 14, boxShadow: '0 8px 20px rgba(232,65,10,.28)' }}>
            {busy ? 'Отменяем…' : 'Да, отменить'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   REVIEW MODAL
═══════════════════════════════ */
function ReviewModal({ deal, onClose, onSubmit, status }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '28px', width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 950, color: '#111827', marginBottom: 8 }}>Отзыв опубликован!</div>
            <button onClick={onClose} style={{ marginTop: 16, padding: '12px 24px', border: 'none', borderRadius: 14, background: '#e8410a', color: '#fff', cursor: 'pointer', fontWeight: 900, fontFamily: 'Manrope,sans-serif' }}>Закрыть</button>
          </div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 950 }}>Оставить отзыв мастеру</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating ? 1 : 0.3, transition: 'opacity .15s' }}>⭐</button>
              ))}
            </div>
            <textarea style={{ width: '100%', minHeight: 100, border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '12px 14px', fontFamily: 'Manrope,sans-serif', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} placeholder="Расскажите о мастере…" value={text} onChange={e => setText(e.target.value)} />
            {status === 'error' && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>Ошибка при отправке. Попробуйте ещё раз.</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={onClose} style={{ flex: 1, minHeight: 46, border: '1.5px solid #e5e7eb', borderRadius: 14, background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontWeight: 800 }}>Отмена</button>
              <button disabled={status === 'sending'} onClick={() => onSubmit({ rating, text })} style={{ flex: 1, minHeight: 46, border: 'none', borderRadius: 14, background: '#e8410a', color: '#fff', cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontWeight: 900, boxShadow: '0 8px 20px rgba(232,65,10,.28)' }}>
                {status === 'sending' ? 'Отправляем…' : 'Опубликовать'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   MAIN PAGE
═══════════════════════════════ */
export default function DealsPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  const [deals, setDeals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusTab, setStatusTab]   = useState('ALL');
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('newest');
  const [detail, setDetail]         = useState(null);
  const [actionId, setActionId]     = useState(null);

  const [cancelNewOpen, setCancelNewOpen]   = useState(false);
  const [cancelNewBusy, setCancelNewBusy]   = useState(false);
  const [cancelNewErr, setCancelNewErr]     = useState('');
  const [cancelActOpen, setCancelActOpen]   = useState(false);
  const [cancelActBusy, setCancelActBusy]   = useState(false);
  const [cancelActErr, setCancelActErr]     = useState('');

  const [reviewDeal, setReviewDeal]     = useState(null);
  const [reviewStatus, setReviewStatus] = useState('idle');

  const lastRefreshRef = useRef(0);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getMyDeals(userId);
      const uid = String(userId || '');
      setDeals((data || []).filter(d => String(d.customerId || '') === uid));
    } catch {
      setDeals([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);
  useSameRouteRefetch('/deals', load);

  const closeDetail = useCallback(() => {
    setDetail(null);
    stripSearchParams(setSearchParams, ['dealId']);
  }, [setSearchParams]);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('dealId');
    if (id && deals.length > 0) {
      const found = deals.find(d => d.id === id);
      if (found) setDetail(found);
    }
  }, [location.search, deals]);

  useEffect(() => {
    if (detail?.id) {
      const fresh = deals.find(d => d.id === detail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(detail)) setDetail(fresh);
    }
  }, [deals, detail]);

  useEffect(() => {
    if (!userId) return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRefreshRef.current < 25000) return;
      lastRefreshRef.current = now;
      load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [userId, load]);

  /* ── Actions ── */
  const handleComplete = async (dealId) => {
    setActionId(dealId);
    try {
      const deal = await completeDeal(userId, dealId);
      dispatchListingArchivedAfterDeal(deal);
      await load();
    } catch { /* noop */ }
    setActionId(null);
  };

  const handleCancelNew = async (note) => {
    setCancelNewBusy(true);
    setCancelNewErr('');
    try {
      await cancelPendingDeal(userId, detail.id, note || '');
      setCancelNewOpen(false);
      await load();
      closeDetail();
    } catch (e) { setCancelNewErr(e?.message || 'Не удалось отменить'); }
    setCancelNewBusy(false);
  };

  const handleCancelActive = async (note) => {
    setCancelActBusy(true);
    setCancelActErr('');
    try {
      await cancelActiveDeal(userId, detail.id, note || '');
      setCancelActOpen(false);
      await load();
      closeDetail();
    } catch (e) { setCancelActErr(e?.message || 'Не удалось отменить'); }
    setCancelActBusy(false);
  };

  const handleReviewSubmit = async ({ rating, text }) => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createReview(userId, reviewDeal.id, { rating, text });
      setReviewStatus('done');
      await load();
    } catch { setReviewStatus('error'); }
  };

  const dealCardMenuItems = useCallback((deal) => {
    const items = [];
    if (
      deal.status === 'COMPLETED'
      && !deal.hasReview
      && deal.workerId
      && dealEligibleForReviews(deal)
    ) {
      items.push({
        label: '★ Оставить отзыв',
        onClick: () => {
          setReviewStatus('idle');
          setReviewDeal(deal);
        },
      });
    }
    if (deal.status === 'NEW') {
      items.push({
        label: 'Отменить заявку',
        danger: true,
        onClick: () => {
          setDetail(deal);
          setCancelNewErr('');
          setCancelNewOpen(true);
        },
      });
    }
    if (deal.status === 'IN_PROGRESS') {
      items.push({
        label: 'Отменить сделку',
        danger: true,
        onClick: () => {
          setDetail(deal);
          setCancelActErr('');
          setCancelActOpen(true);
        },
      });
    }
    if (deal.workerId) {
      items.push({
        label: 'Профиль мастера',
        onClick: () => navigate(`/workers/${deal.workerId}`),
      });
    }
    return items;
  }, [navigate]);

  /* ── Filter / sort ── */
  const shown = deals
    .filter(d => statusTab === 'ALL' || d.status === statusTab)
    .filter(d => !search || `${d.title || ''} ${d.category || ''} ${d.workerName || ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'newest'
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  /* ── Detail view ── */
  if (detail) {
    return (
      <>
        <DealDetail
          deal={detail}
          onBack={closeDetail}
          onComplete={handleComplete}
          onCancelNew={() => { setCancelNewErr(''); setCancelNewOpen(true); }}
          onCancelActive={() => { setCancelActErr(''); setCancelActOpen(true); }}
          onReview={() => { setReviewStatus('idle'); setReviewDeal(detail); }}
          actionId={actionId}
          navigate={navigate}
          userName={userName}
          userLastName={userLastName}
          userAvatar={userAvatar}
        />
        {cancelNewOpen && (
          <CancelModal title="Отменить заявку?" subtitle="Мастер получит уведомление. Можно указать причину." onClose={() => !cancelNewBusy && setCancelNewOpen(false)} onConfirm={handleCancelNew} busy={cancelNewBusy} err={cancelNewErr} />
        )}
        {cancelActOpen && (
          <CancelModal title="Отменить сделку?" warning="⚠️ Сделка уже в работе. Это действие необратимо." onClose={() => !cancelActBusy && setCancelActOpen(false)} onConfirm={handleCancelActive} busy={cancelActBusy} err={cancelActErr} />
        )}
        {reviewDeal && (
          <ReviewModal deal={reviewDeal} onClose={() => setReviewDeal(null)} onSubmit={handleReviewSubmit} status={reviewStatus} />
        )}
      </>
    );
  }

  /* ── List view ── */
  return (
    <>
    <div className="mo-page mo-orders-root">
      {/* Hero */}
      <header className="mo-hero">
        <img src={HERO} alt="" />
        <div className="mo-hero-inner">
          <div>
            <h1>Мои сделки</h1>
            <p>Сделки с мастерами — отслеживайте прогресс и подтверждайте</p>
          </div>
          <button type="button" className="mo-cta" onClick={() => navigate('/my-requests?create=1')}>
            + Найти мастера
          </button>
        </div>
      </header>

      <main className="mo-main">
        {/* Toolbar */}
        <div className="mo-toolbar">
          <div className="mo-status-tabs">
            {STATUS_TABS.map(t => {
              const count = t.key === 'ALL' ? deals.length : deals.filter(d => d.status === t.key).length;
              return (
                <button key={t.key} type="button" className={`mo-status-tab${statusTab === t.key ? ' active' : ''}`} onClick={() => setStatusTab(t.key)}>
                  {t.label}
                  {count > 0 && <span className="mo-status-tab-count">{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="mo-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
            <input type="search" placeholder="Поиск по сделкам или мастеру…" value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
          </div>
          <SortDropdown
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: 'Сначала новые' },
              { value: 'oldest', label: 'Сначала старые' },
            ]}
            variant="toolbar"
            ariaLabel="Сортировка сделок"
          />
        </div>

        {loading ? (
          <EmptyState icon="⏳" title="Загружаем сделки…" text="Пожалуйста, подождите" />
        ) : shown.length === 0 ? (
          <EmptyState
            icon="🤝"
            title={statusTab === 'ALL' ? 'Сделок пока нет' : 'Нет сделок в этой категории'}
            text={statusTab === 'ALL' ? 'Найдите мастера и создайте первую сделку' : ''}
            btnLabel={statusTab === 'ALL' ? '+ Найти мастера' : undefined}
            onBtn={() => navigate('/my-requests?create=1')}
          />
        ) : (
          <div className="mo-grid">
            {shown.map(deal => (
              <OrderCard
                key={deal.id}
                order={dealToCard(deal)}
                onOpen={() => setDetail(deal)}
                onChat={deal.workerId ? () => navigate(`/chat/${deal.workerId}`) : undefined}
                menuItems={dealCardMenuItems(deal)}
              />
            ))}
          </div>
        )}
      </main>
    </div>

    {cancelNewOpen && detail && (
      <CancelModal title="Отменить заявку?" subtitle="Мастер получит уведомление. Можно указать причину." onClose={() => !cancelNewBusy && setCancelNewOpen(false)} onConfirm={handleCancelNew} busy={cancelNewBusy} err={cancelNewErr} />
    )}
    {cancelActOpen && detail && (
      <CancelModal title="Отменить сделку?" warning="⚠️ Сделка уже в работе. Это действие необратимо." onClose={() => !cancelActBusy && setCancelActOpen(false)} onConfirm={handleCancelActive} busy={cancelActBusy} err={cancelActErr} />
    )}
    {reviewDeal && (
      <ReviewModal deal={reviewDeal} onClose={() => setReviewDeal(null)} onSubmit={handleReviewSubmit} status={reviewStatus} />
    )}
    </>
  );
}
