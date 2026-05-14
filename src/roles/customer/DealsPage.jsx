import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getMyDeals, getMyJobRequests, completeDeal, createReview,
  cancelPendingDeal, cancelActiveDeal,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  dealsWdCss, dealsMdListCss, dealsDetailEdCss, dealCategoryEmoji, dealInitialsFromFullName, dealToUiStatus,
} from '../shared/dealsWdStyles';
import DealDetailEdProgress, { DealDetailEdCheck, DealDetailEdHourglass } from '../shared/DealDetailEdProgress';
import { getDealEdProgress } from '../../utils/dealDetailEdProgress';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { dispatchListingArchivedAfterDeal } from '../../utils/listingArchiveEvents';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import { listingDetailSurfaceExtraCss } from '../shared/listingDetailSurfaceExtraCss';

const MY_DEALS_HERO_PHOTO =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=max&w=2400&q=86';
const BACKEND = 'https://svoi-mastera-backend.onrender.com';

const ST = {
  NEW:         { label: 'Новый заказ',  color: '#d97706', bg: 'rgba(245,158,11,.12)',  dot: '#f59e0b' },
  IN_PROGRESS: { label: 'В работе',     color: '#2563eb', bg: 'rgba(37,99,235,.11)',   dot: '#3b82f6' },
  COMPLETED:   { label: 'Завершена',    color: '#16a34a', bg: 'rgba(34,197,94,.11)',   dot: '#22c55e' },
  CANCELLED:   { label: 'Отменена',     color: '#dc2626', bg: 'rgba(239,68,68,.1)',    dot: '#ef4444' },
};

const UI_STATUS_LABEL = { new: 'Ждёт мастера', work: 'В работе', done: 'Завершена', cancel: 'Отменена' };

const MD_STEPS = [
  { key: 'create', label: 'Создана' },
  { key: 'work', label: 'В работе' },
  { key: 'done', label: 'Завершена' },
];

function DealsMdStepBar({ status }) {
  const idx = status === 'new' ? 0 : status === 'work' ? 1 : status === 'done' ? 2 : -1;
  const pct = status === 'new' ? 15 : status === 'work' ? 60 : status === 'done' ? 100 : 30;
  const headLbl =
    status === 'cancel'
      ? 'Сделка отменена'
      : status === 'done'
        ? 'Сделка завершена'
        : status === 'work'
          ? 'Идёт работа'
          : 'Ожидает старта';

  return (
    <>
      <div className="md-progress-head">
        <span className="md-progress-title">{headLbl}</span>
        <span className="md-progress-pct">
          <span className="md-pct-bar">
            <span className="md-pct-fill" style={{ width: `${pct}%` }} />
          </span>
          {pct}%
        </span>
      </div>
      <div className="md-steps">
        {MD_STEPS.map((s, i) => {
          let cls = '';
          if (status === 'cancel') cls = i === 0 ? 'done' : 'cancel';
          else if (status === 'done') cls = 'done';
          else if (i < idx) cls = 'done';
          else if (i === idx) cls = 'current';
          return (
            <div key={s.key} className={`md-step ${cls}`}>
              <div className="md-step-dot">
                {cls === 'done' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12l5 5L20 7" /></svg>
                ) : cls === 'cancel' ? (
                  '✕'
                ) : (
                  i + 1
                )}
              </div>
              <div className="md-step-lbl">{s.label}</div>
              {i < MD_STEPS.length - 1 && <span className="md-step-bar" />}
            </div>
          );
        })}
      </div>
    </>
  );
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
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function dealWorkerAvatarUrl(detail) {
  const a = detail?.workerAvatar;
  if (!a || String(a).length <= 10 || a === 'null') return null;
  const s = String(a);
  if (s.startsWith('http') || s.startsWith('data:')) return s;
  return BACKEND + s;
}

export default function DealsPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [deals, setDeals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [detail, setDetail] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [actionId, setActionId] = useState(null);
  const [declId, setDeclId] = useState(null);

  const [listSearch, setListSearch] = useState('');
  const [dealSort, setDealSort] = useState('new');

  const [cancelNewOpen, setCancelNewOpen] = useState(false);
  const [cancelNewNote, setCancelNewNote] = useState('');
  const [cancelNewBusy, setCancelNewBusy] = useState(false);
  const [cancelNewErr, setCancelNewErr] = useState('');

  const [cancelActOpen, setCancelActOpen] = useState(false);
  const [cancelActNote, setCancelActNote] = useState('');
  const [cancelActBusy, setCancelActBusy] = useState(false);
  const [cancelActErr, setCancelActErr] = useState('');

  const [reviewDeal, setReviewDeal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [reviewStatus, setReviewStatus] = useState('idle');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, req] = await Promise.all([
        getMyDeals(userId),
        getMyJobRequests(userId).catch(() => []),
      ]);
      const uid = String(userId || '');
      setDeals((data || []).filter(d => String(d.customerId || '') === uid));
      setRequests(Array.isArray(req) ? req : []);
    } catch {
      setDeals([]);
      setRequests([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useSameRouteRefetch('/deals', load);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('dealId');
    if (id && deals.length > 0) {
      const found = deals.find(d => d.id === id);
      if (found) { setDetail(found); setPhotoIdx(0); }
    }
  }, [location.search, deals]);

  useEffect(() => {
    if (detail?.id) {
      const fresh = deals.find(d => d.id === detail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(detail)) setDetail(fresh);
    }
  }, [deals, detail]);

  const handleComplete = async (dealId, e) => {
    e?.stopPropagation?.();
    setActionId(dealId);
    try {
      const deal = await completeDeal(userId, dealId);
      dispatchListingArchivedAfterDeal(deal);
      await load();
    } catch { /* noop */ }
    setActionId(null);
  };

  const handleCancelNew = async () => {
    if (!detail?.id) return;
    setCancelNewBusy(true);
    setCancelNewErr('');
    try {
      await cancelPendingDeal(userId, detail.id, cancelNewNote);
      setCancelNewOpen(false);
      setCancelNewNote('');
      await load();
      setDetail(null);
    } catch (e) { setCancelNewErr(e?.message || 'Не удалось отменить'); }
    setCancelNewBusy(false);
  };

  const handleCancelActive = async () => {
    if (!detail?.id) return;
    setCancelActBusy(true);
    setCancelActErr('');
    try {
      await cancelActiveDeal(userId, detail.id, cancelActNote);
      setCancelActOpen(false);
      setCancelActNote('');
      await load();
      setDetail(null);
    } catch (e) { setCancelActErr(e?.message || 'Не удалось отменить'); }
    setCancelActBusy(false);
  };

  const handleReviewSubmit = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done');
      await load();
    } catch { setReviewStatus('error'); }
  };

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
        const w = [d.workerName, d.workerLastName].filter(Boolean).join(' ').toLowerCase();
        return t.includes(listSearchNorm) || c.includes(listSearchNorm) || w.includes(listSearchNorm);
      });
    }
    if (dealSort === 'price') {
      r = [...r].sort((a, b) => Number(b.agreedPrice || 0) - Number(a.agreedPrice || 0));
    } else {
      r = [...r].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return r;
  }, [filteredBase, listSearchNorm, dealSort]);

  const dealsJobRequestIds = new Set(deals.map(d => d.jobRequestId).filter(Boolean));
  const requestsWithoutDeal = requests.filter(r => !dealsJobRequestIds.has(r.id));
  const openRequestsHint = requestsWithoutDeal.length;

  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Заказчик';
  const ava = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar)
    : null;

  /* ══ DETAIL ══ */
  if (detail) {
    const st = ST[detail.status] || ST.NEW;
    const photoList = detail.photos || [];
    const hasPhoto = photoList.length > 0;
    const myOk = detail.customerConfirmed;
    const workerOk = detail.workerConfirmed;
    const taskDescShown = formatListingOriginDescription('CUSTOMER', detail.description);
    const prog = getDealEdProgress(detail, 'customer', timeAgo);
    const workerAva = dealWorkerAvatarUrl(detail);
    const workerLabel = [detail.workerName, detail.workerLastName].filter(Boolean).join(' ') || 'Мастер';
    const pulseShadow = `0 0 0 3px ${st.dot}26`;

    return (
      <div className="ed ed--listing-detail">
        <style>{`${dealsWdCss}\n${dealsDetailEdCss}\n${listingDetailSurfaceExtraCss}`}</style>
        <div className="ed-wrap">
          <button
            type="button"
            className="ed-back"
            onClick={() => { setDetail(null); setPhotoIdx(0); }}
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
                <div className="ed-main">
                  {hasPhoto ? (
                    <img src={photoList[photoIdx]} alt="" />
                  ) : (
                    <div className="ed-main-placeholder" aria-hidden>🤝</div>
                  )}
                  <div className="ed-floats">
                    <div className="ed-chip">
                      <span className="pulse" style={{ background: st.dot, boxShadow: pulseShadow }} />
                      <span className="ed-chip-text">{st.label}</span>
                    </div>
                    {detail.category ? (
                      <div className="ed-chip">
                        <span className="ed-chip-text">
                          {dealCategoryEmoji(detail.category)} {detail.category}
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

              <DealDetailEdProgress {...prog} />

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
                    detail.category && ['Категория', detail.category],
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
                <div className="ed-card">
                  <div className="ed-eyebrow">Статус</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>Ждём ответа мастера</div>
                  <div className="ed-callout ed-callout-warn">
                    Вы выбрали мастера. После подтверждения заказ перейдёт в работу.
                  </div>
                  <div className="ed-actions">
                    {detail.workerId ? (
                      <button type="button" className="ed-msg-btn" onClick={() => navigate(`/chat/${detail.workerId}`)}>
                        Написать мастеру
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="ed-btn ed-btn-cancel"
                      onClick={() => { setCancelNewErr(''); setCancelNewNote(''); setCancelNewOpen(true); }}
                    >
                      Отменить заявку
                    </button>
                    <p className="ed-callout-muted">Пока мастер не принял заказ, отмена без последствий</p>
                  </div>
                </div>
              ) : null}

              {detail.status === 'IN_PROGRESS' ? (
                <div className="ed-card">
                  <div className="ed-eyebrow">Подтверждение</div>
                  <div className="ed-conf-rows">
                    <div className={`ed-conf-row ${myOk ? 'ok' : 'wait'}`}>
                      <div className="ed-conf-icon">{myOk ? <DealDetailEdCheck /> : <DealDetailEdHourglass />}</div>
                      <div>
                        <div className="ed-conf-name">Заказчик (вы)</div>
                        <div className="ed-conf-status">
                          {myOk ? 'Подтвердили выполнение' : 'Ожидание вашего подтверждения'}
                        </div>
                      </div>
                    </div>
                    <div className={`ed-conf-row ${workerOk ? 'ok' : 'wait'}`}>
                      <div className="ed-conf-icon">{workerOk ? <DealDetailEdCheck /> : <DealDetailEdHourglass />}</div>
                      <div>
                        <div className="ed-conf-name">Мастер</div>
                        <div className="ed-conf-status">
                          {workerOk ? 'Подтвердил выполнение' : 'Ожидание подтверждения'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ed-actions">
                    {!myOk ? (
                      <button
                        type="button"
                        className="ed-btn ed-btn-confirm"
                        disabled={actionId === detail.id}
                        onClick={(e) => handleComplete(detail.id, e)}
                      >
                        {actionId === detail.id ? 'Подтверждаем…' : 'Подтвердить выполнение'}
                      </button>
                    ) : (
                      <div className="ed-inline-wait">
                        ✓ Вы подтвердили{!workerOk ? ' — ожидаем мастера…' : ''}
                      </div>
                    )}
                    <div className="ed-actions-split">
                      <button
                        type="button"
                        className="ed-btn ed-btn-cancel"
                        onClick={() => { setCancelActErr(''); setCancelActOpen(true); }}
                      >
                        Отменить сделку в работе
                      </button>
                      <p className="ed-callout-muted">После завершения отмена невозможна</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {detail.status === 'COMPLETED' ? (
                <div className="ed-card">
                  <div className="ed-done-banner">
                    <div className="ed-done-emoji" aria-hidden>🏆</div>
                    <div className="ed-done-title">Сделка завершена!</div>
                    <div className="ed-done-sub">Обе стороны подтвердили выполнение</div>
                    {!detail.hasReview && detail.workerId && dealEligibleForReviews(detail) ? (
                      <button
                        type="button"
                        className="ed-btn-review"
                        onClick={() => {
                          setReviewForm({ rating: 5, text: '' });
                          setReviewStatus('idle');
                          setReviewDeal(detail);
                        }}
                      >
                        ⭐ Оставить отзыв мастеру
                      </button>
                    ) : detail.hasReview ? (
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
                <div className="ed-eyebrow" style={{ marginBottom: 14, display: 'block' }}>Мастер</div>
                <div
                  className="ed-cust-row"
                  onClick={() => detail.workerId && navigate(`/workers/${detail.workerId}`)}
                  role="presentation"
                >
                  <div className="ed-ava">
                    {workerAva ? <img src={workerAva} alt="" /> : (
                      <div className="ed-ava-fallback">{(detail.workerName || 'М')[0].toUpperCase()}</div>
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
                {detail.workerId ? (
                  <button type="button" className="ed-msg-btn" onClick={() => navigate(`/chat/${detail.workerId}`)}>
                    Написать мастеру
                  </button>
                ) : null}
              </div>

              <div className="ed-card">
                <div className="ed-eyebrow" style={{ marginBottom: 14, display: 'block' }}>Ваш профиль</div>
                <div className="ed-cust-row" onClick={() => navigate('/profile')} role="presentation">
                  <div className="ed-ava">
                    {ava ? <img src={ava} alt="" /> : (
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

        {cancelNewOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelNewBusy && setCancelNewOpen(false)}>
            <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="wd-modal-title">Отменить заявку?</h3>
              <p className="wd-modal-sub">Мастер получит уведомление. Можно указать причину — необязательно.</p>
              <textarea className="wd-modal-textarea" rows={3} value={cancelNewNote} onChange={(e) => setCancelNewNote(e.target.value)} placeholder="Например: передумал, нашёл другого мастера…" />
              {cancelNewErr && <div className="wd-modal-error">{cancelNewErr}</div>}
              <div className="wd-modal-btns">
                <button type="button" className="wd-modal-cancel" disabled={cancelNewBusy} onClick={() => setCancelNewOpen(false)}>Назад</button>
                <button type="button" className="wd-modal-confirm" disabled={cancelNewBusy} onClick={handleCancelNew}>{cancelNewBusy ? 'Отправляем…' : 'Да, отменить'}</button>
              </div>
            </div>
          </div>
        )}

        {cancelActOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelActBusy && setCancelActOpen(false)}>
            <div className="wd-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚫</div>
                <h3 className="wd-modal-title" style={{ margin: 0 }}>Отменить сделку?</h3>
              </div>
              <div className="wd-modal-warn">⚠️ Сделка уже <b>в работе</b>. Мастер получит уведомление. Это действие необратимо.</div>
              <textarea className="wd-modal-textarea" rows={3} value={cancelActNote} onChange={(e) => setCancelActNote(e.target.value)} placeholder="Причина отмены (необязательно)…" />
              {cancelActErr && <div className="wd-modal-error">{cancelActErr}</div>}
              <div className="wd-modal-btns">
                <button type="button" className="wd-modal-cancel" disabled={cancelActBusy} onClick={() => setCancelActOpen(false)}>Не отменять</button>
                <button type="button" className="wd-modal-confirm" disabled={cancelActBusy} onClick={handleCancelActive}>{cancelActBusy ? 'Отменяем…' : 'Да, отменить'}</button>
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
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Отзыв о мастере</h2>
                    <button type="button" onClick={() => setReviewDeal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, marginBottom: 18 }}>
                    {reviewDeal.workerAvatar && reviewDeal.workerAvatar.length > 10
                      ? <img src={reviewDeal.workerAvatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>{(reviewDeal.workerName || 'М')[0].toUpperCase()}</div>}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{[reviewDeal.workerName, reviewDeal.workerLastName].filter(Boolean).join(' ')}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Мастер</div>
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
                      placeholder="Расскажите о качестве работы, пунктуальности, общении…"
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
    <div className="md-page">
      <style>{`${dealsWdCss}\n${dealsMdListCss}`}</style>

      <header className="md-hero">
        <img src={MY_DEALS_HERO_PHOTO} alt="" />
        <div className="md-hero-inner">
          <div>
            <h1>Мои сделки</h1>
            <p>Сделки с мастерами — отслеживайте прогресс и подтверждайте</p>
          </div>
          <Link to="/find-master" className="md-cta">+ Найти мастера</Link>
        </div>
      </header>

      <main className="md-main">
        <div className="md-toolbar">
          <div className="md-tabs">
            {[
              ['ALL', 'Все', counts.ALL],
              ['NEW', 'Ждут', counts.NEW],
              ['IN_PROGRESS', 'В работе', counts.IN_PROGRESS],
              ['COMPLETED', 'Завершены', counts.COMPLETED],
              ['CANCELLED', 'Отменены', counts.CANCELLED],
            ].map(([key, label, cnt]) => (
              <button
                key={key}
                type="button"
                className={`md-tab${filter === key ? ' active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="md-tab-count">{cnt}</span>
              </button>
            ))}
          </div>
          <div className="md-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
            <input
              type="search"
              placeholder="Поиск по сделкам или мастеру…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <select className="md-sort" value={dealSort} onChange={(e) => setDealSort(e.target.value)}>
            <option value="new">Сначала новые</option>
            <option value="price">По цене</option>
          </select>
        </div>

        {loading ? (
          <div className="md-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="md-card" style={{ cursor: 'default', pointerEvents: 'none' }} aria-hidden>
                <div className="md-card-cover"><div className="wd-sk" style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
                <div className="md-top">
                  <div className="md-body">
                    <div className="wd-sk" style={{ height: 16, width: '70%' }} />
                    <div className="wd-sk" style={{ height: 12, width: '40%', marginTop: 10 }} />
                    <div className="wd-sk" style={{ height: 36, width: '100%', marginTop: 12, borderRadius: 12 }} />
                    <div className="wd-sk" style={{ height: 28, width: '45%', marginTop: 14 }} />
                  </div>
                </div>
                <div className="md-progress">
                  <div className="wd-sk" style={{ height: 14, width: '100%', marginBottom: 14 }} />
                  <div className="wd-sk" style={{ height: 40, width: '100%' }} />
                </div>
                <div className="md-foot">
                  <div className="wd-sk" style={{ height: 12, width: 100 }} />
                  <div className="wd-sk" style={{ height: 12, width: 140, marginLeft: 'auto' }} />
                </div>
                <div className="md-actions">
                  <div className="wd-sk md-btn" style={{ flex: 1, minHeight: 44, borderRadius: 13 }} />
                  <div className="wd-sk md-btn md-btn-icon" style={{ width: 42, height: 42, borderRadius: 13 }} />
                  <div className="wd-sk md-btn md-btn-icon" style={{ width: 42, height: 42, borderRadius: 13 }} />
                </div>
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="md-empty">
            <div className="md-empty-emoji">🤝</div>
            <div className="md-empty-title">Здесь появятся ваши сделки</div>
            <div className="md-empty-sub">Найдите подходящего мастера — и первая сделка появится прямо здесь.</div>
            {openRequestsHint > 0 && (
              <div className="md-empty-sub" style={{ marginTop: 14 }}>
                У вас <b>{openRequestsHint}</b> заявок без активной сделки — отклики в разделе «<Link to="/my-requests" style={{ color: '#e8410a', fontWeight: 800 }}>Мои заявки</Link>».
              </div>
            )}
            <Link to="/find-master" className="md-cta">Найти мастера</Link>
          </div>
        ) : filteredBase.length === 0 && filter !== 'ALL' ? (
          <div className="md-empty">
            <div className="md-empty-emoji">{filter === 'COMPLETED' ? '✅' : '📋'}</div>
            <div className="md-empty-title">В этой категории пока пусто</div>
            <div className="md-empty-sub">Переключите вкладку или посмотрите все сделки.</div>
            <button type="button" className="md-cta" onClick={() => setFilter('ALL')}>Все сделки</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="md-empty">
            <div className="md-empty-emoji">🔍</div>
            <div className="md-empty-title">Ничего не найдено</div>
            <div className="md-empty-sub">Попробуйте изменить запрос, вкладку или сортировку.</div>
            <button type="button" className="md-cta" onClick={() => { setListSearch(''); setFilter('ALL'); }}>Сбросить фильтры</button>
          </div>
        ) : (
          <div className="md-grid">
            {filtered.map((d) => {
              const ui = dealToUiStatus(d.status);
              const img = d.photos?.[0] || getCategoryPlaceholderPhotoUrlOrDefault({ category: d.category });
              const workerLabel = [d.workerName, d.workerLastName].filter(Boolean).join(' ') || 'Мастер';
              const workerAva = d.workerAvatar && String(d.workerAvatar).length > 10
                ? (String(d.workerAvatar).startsWith('http') || String(d.workerAvatar).startsWith('data:')
                  ? d.workerAvatar
                  : BACKEND + d.workerAvatar)
                : null;
              const isNew = d.status === 'NEW';
              const isProg = d.status === 'IN_PROGRESS';
              const isDone = d.status === 'COMPLETED';
              const isCancel = d.status === 'CANCELLED';
              const cardAccent = isNew ? 's-new' : isProg ? 's-work' : isDone ? 's-done' : isCancel ? 's-cancel' : '';

              let footRight = null;
              if (isCancel) {
                footRight = <span className="md-confirm" style={{ color: '#b91c1c' }}>✕ Сделка отменена</span>;
              } else if (isDone) {
                footRight = (
                  <span className="md-confirm ok">
                    {d.customerConfirmed && d.workerConfirmed ? '✓ Завершена обеими сторонами' : '✓ Сделка завершена'}
                  </span>
                );
              } else if (isProg) {
                if (!d.customerConfirmed) {
                  footRight = <span className="md-confirm wait">⏳ Требует подтверждения</span>;
                } else if (!d.workerConfirmed) {
                  footRight = <span className="md-confirm wait">⏳ Ждём мастера</span>;
                } else {
                  footRight = <span className="md-confirm ok">✓ Подтверждена</span>;
                }
              } else {
                footRight = <span className="md-confirm wait">⏳ Ждём мастера</span>;
              }

              const openDeal = () => { setDetail(d); setPhotoIdx(0); };

              return (
                <article
                  key={d.id}
                  className={`md-card ${cardAccent}`}
                  role="button"
                  tabIndex={0}
                  onClick={openDeal}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDeal();
                    }
                  }}
                >
                  <div className="md-card-cover">
                    {img ? <img src={img} alt="" /> : <span className="emoji" aria-hidden>🤝</span>}
                  </div>
                  <div className="md-top">
                    <div className="md-body">
                      <div className="md-row">
                        <h3 className="md-title">{d.title || 'Задача'}</h3>
                        <span className={`md-status ${ui}`}>
                          <span className="dot" aria-hidden />
                          {UI_STATUS_LABEL[ui]}
                        </span>
                      </div>
                      {d.category && (
                        <span className="md-cat">
                          {dealCategoryEmoji(d.category)} {d.category}
                        </span>
                      )}
                      <div className="md-master">
                        <div className="md-ava">
                          {workerAva ? <img src={workerAva} alt="" /> : dealInitialsFromFullName(workerLabel)}
                        </div>
                        <div className="md-master-info">
                          <div className="md-master-name">{workerLabel}</div>
                          <div className="md-master-role">Мастер</div>
                        </div>
                        {d.workerId ? (
                          <button
                            type="button"
                            className="md-msg-mini"
                            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${d.workerId}`); }}
                          >
                            Написать
                          </button>
                        ) : null}
                      </div>
                      <div className="md-price-row">
                        {d.agreedPrice ? (
                          <>
                            <span className="md-price-num">{Number(d.agreedPrice).toLocaleString('ru-RU')} ₽</span>
                            <span className="md-price-lbl">согласовано</span>
                          </>
                        ) : (
                          <span className="md-price-lbl" style={{ fontSize: 15, fontWeight: 700, color: '#64748b' }}>Цена по договорённости</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md-progress">
                    <DealsMdStepBar status={ui} />
                  </div>

                  <div className="md-foot">
                    <span className="md-foot-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      {timeAgo(d.createdAt)}
                    </span>
                    {footRight}
                  </div>

                  <div className="md-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="md-btn md-btn-primary" onClick={openDeal}>
                      Открыть сделку
                    </button>
                    {isDone && !d.hasReview && d.workerId && dealEligibleForReviews(d) && (
                      <button
                        type="button"
                        className="md-btn md-btn-review"
                        onClick={() => {
                          setReviewForm({ rating: 5, text: '' });
                          setReviewStatus('idle');
                          setReviewDeal(d);
                        }}
                      >
                        ★ Отзыв
                      </button>
                    )}
                    {d.workerId && (
                      <button
                        type="button"
                        className="md-btn md-btn-ghost md-btn-icon"
                        title="Сообщения"
                        aria-label="Сообщения"
                        onClick={() => navigate(`/chat/${d.workerId}`)}
                      >
                        💬
                      </button>
                    )}
                    {isNew && d.workerId ? (
                      <button
                        type="button"
                        className="md-btn md-btn-ghost md-btn-icon"
                        title="Отменить заявку"
                        aria-label="Отменить заявку"
                        disabled={declId === d.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm('Отменить заявку? Мастер ещё не принял — отмена без последствий.')) return;
                          setDeclId(d.id);
                          try {
                            await cancelPendingDeal(userId, d.id, '');
                            await load();
                          } catch (err) {
                            window.alert(err?.message || 'Не удалось');
                          } finally {
                            setDeclId(null);
                          }
                        }}
                      >
                        {declId === d.id ? '…' : '✕'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="md-btn md-btn-ghost md-btn-icon"
                        title="Подробнее"
                        aria-label="Подробнее"
                        onClick={openDeal}
                      >
                        ⋯
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {reviewDeal && !detail && (
        <div className="wd-modal-bg" onClick={() => setReviewDeal(null)}>
          <div className="wd-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
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
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Отзыв о мастере</h2>
                  <button type="button" onClick={() => setReviewDeal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, marginBottom: 18 }}>
                  {reviewDeal.workerAvatar && reviewDeal.workerAvatar.length > 10
                    ? <img src={reviewDeal.workerAvatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>{(reviewDeal.workerName || 'М')[0].toUpperCase()}</div>}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{[reviewDeal.workerName, reviewDeal.workerLastName].filter(Boolean).join(' ')}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Мастер</div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Оценка</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, padding: 0, opacity: s <= reviewForm.rating ? 1 : 0.22, color: '#f59e0b' }}>★</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Комментарий</div>
                  <textarea
                    value={reviewForm.text}
                    onChange={e => setReviewForm(p => ({ ...p, text: e.target.value }))}
                    placeholder="Расскажите о качестве работы, пунктуальности, общении…"
                    className="wd-modal-textarea"
                    rows={4}
                  />
                </div>
                {reviewStatus === 'error' && <div className="wd-modal-error">Не удалось отправить отзыв. Попробуйте ещё раз.</div>}
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={reviewStatus === 'sending' || !reviewForm.text?.trim()}
                  style={{ width: '100%', padding: '13px', background: reviewForm.text?.trim() ? '#e8410a' : '#e5e7eb', border: 'none', borderRadius: 9, color: reviewForm.text?.trim() ? '#fff' : '#9ca3af', fontSize: 15, fontWeight: 700, cursor: reviewForm.text?.trim() ? 'pointer' : 'not-allowed' }}
                >{reviewStatus === 'sending' ? 'Отправляем...' : 'Отправить отзыв'}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
