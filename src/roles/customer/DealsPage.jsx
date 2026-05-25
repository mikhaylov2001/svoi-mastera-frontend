import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getMyDeals, completeDeal, createReview,
  cancelPendingDeal, cancelActiveDeal,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { dispatchListingArchivedAfterDeal } from '../../utils/listingArchiveEvents';
import OrderCard from '../../components/myorders/OrderCard';
import '../../styles/moCabinetStyle.css';

const HERO = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2400&q=86';
const BACKEND = 'https://svoi-mastera-backend.onrender.com';

const STATUS_TABS = [
  { key: 'ALL',         label: 'Все' },
  { key: 'NEW',         label: 'Ждут' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'COMPLETED',   label: 'Завершены' },
  { key: 'CANCELLED',   label: 'Отменены' },
];

const STATUS_CONFIG = {
  NEW:         { label: 'Ждёт мастера', dot: '#f59e0b', bg: '#fffbeb', color: '#d97706' },
  IN_PROGRESS: { label: 'В работе',     dot: '#3b82f6', bg: '#eff6ff', color: '#2563eb' },
  COMPLETED:   { label: 'Завершена',    dot: '#22c55e', bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED:   { label: 'Отменена',     dot: '#94a3b8', bg: '#f8fafc', color: '#64748b' },
};

const CAT_EMOJI = {
  'Ремонт квартир': '🔨', 'Сантехника': '🔧', 'Электрика': '⚡',
  'Уборка': '🧹', 'Грузоперевозки': '🚚', 'Компьютерная помощь': '💻',
  'Репетиторство': '📚', 'Красота и здоровье': '✨', 'Маникюр и педикюр': '💅',
  'Парикмахер': '✂️', 'Сварочные работы': '🔥',
};
const catEmoji = n => CAT_EMOJI[n] || '📌';

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

/** Map deal → format compatible with OrderCard */
function dealToCard(d) {
  const photos = (d.photos || []).map(resolvePhoto).filter(Boolean);
  if (!photos.length) {
    const placeholder = getCategoryPlaceholderPhotoUrlOrDefault(d.category, null);
    if (placeholder) photos.push(placeholder);
    else photos.push(FALLBACK_PHOTO);
  }

  const workerName = [d.workerName, d.workerLastName].filter(Boolean).join(' ') || 'Мастер';
  const workerInitial = (d.workerName || 'М')[0].toUpperCase();
  const workerAvatar = resolvePhoto(d.workerAvatarUrl);

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

/* ═══════════════════════════════
   DEAL DETAIL PAGE
═══════════════════════════════ */
function DealDetail({ deal, onBack, onComplete, onCancelNew, onCancelActive, onReview, actionId, navigate }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const st = STATUS_CONFIG[deal.status] || STATUS_CONFIG.NEW;
  const photos = (deal.photos || []).map(resolvePhoto).filter(Boolean);
  if (!photos.length) photos.push(FALLBACK_PHOTO);
  const workerName = [deal.workerName, deal.workerLastName].filter(Boolean).join(' ') || 'Мастер';
  const workerInitial = (deal.workerName || 'М')[0].toUpperCase();
  const workerAvatar = resolvePhoto(deal.workerAvatarUrl);
  const myOk = deal.customerConfirmed;
  const workerOk = deal.workerConfirmed;
  const isInProgress = deal.status === 'IN_PROGRESS';
  const isNew = deal.status === 'NEW';
  const isCompleted = deal.status === 'COMPLETED';
  const price = deal.agreedPrice ? `${Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽` : 'Договорная';

  const STEPS = ['Создана', 'Принята', 'В работе', 'Подтверждение', 'Завершена'];
  const stepIdx = deal.status === 'NEW' ? 1 : deal.status === 'IN_PROGRESS' ? 3 : deal.status === 'COMPLETED' ? 4 : -1;
  const progress = stepIdx < 0 ? 0 : Math.round((stepIdx / (STEPS.length - 1)) * 100);
  const progressColor = isCompleted ? '#22c55e' : '#e8410a';

  function arrowBtn(side) {
    return {
      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
      [side]: 14, width: 42, height: 42, borderRadius: '50%', border: 'none',
      background: 'rgba(0,0,0,.5)', color: '#fff', cursor: 'pointer',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2,
    };
  }

  return (
    <div className="mo-detail">
      <div className="mo-detail-nav">
        <button className="mo-detail-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Мои сделки
        </button>
      </div>

      <div className="mo-detail-head">
        <h1>{deal.title || 'Сделка'}</h1>
        <div className="mo-detail-status-pill" style={{ background: st.bg, color: st.color, border: `1px solid ${st.dot}22` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
          {st.label}
        </div>
      </div>

      <div className="mo-detail-grid">
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Gallery */}
          <div className="mo-detail-gallery">
            <div className="mo-detail-gallery-main">
              <img src={photos[photoIdx]} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.18) 0%,transparent 40%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 2 }}>
                <span style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: st.dot, color: '#fff' }}>{st.label}</span>
                {deal.category && (
                  <span style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: 'rgba(0,0,0,.5)', color: '#fff', backdropFilter: 'blur(10px)' }}>
                    {catEmoji(deal.category)} {deal.category}
                  </span>
                )}
              </div>
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)} style={arrowBtn('left')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)} style={arrowBtn('right')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                  <div style={{ position: 'absolute', bottom: 16, right: 16, fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.45)', padding: '5px 12px', borderRadius: 999, backdropFilter: 'blur(8px)', zIndex: 2 }}>
                    {photoIdx + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#111', overflowX: 'auto' }}>
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} style={{ flexShrink: 0, width: 80, height: 58, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `3px solid ${i === photoIdx ? '#ff4b1f' : 'transparent'}`, padding: 0, background: 'none' }}>
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark progress card */}
          <div className="mo-progress-card">
            <div className="mo-progress-card-header">
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>Прогресс сделки</div>
                <div style={{ fontSize: 18, fontWeight: 950, color: '#fff', letterSpacing: '-.3px' }}>
                  {isCompleted ? 'Сделка завершена 🎉' : deal.status === 'CANCELLED' ? 'Сделка отменена' : STEPS[Math.max(0, stepIdx)]}
                </div>
              </div>
              <div className="mo-progress-ring" style={{ background: `conic-gradient(${progressColor} ${progress * 3.6}deg, rgba(255,255,255,.08) 0deg)` }}>
                <div className="mo-progress-ring-inner" style={{ color: isCompleted ? '#22c55e' : '#ff7043' }}>{progress}%</div>
              </div>
            </div>

            <div className="mo-timeline">
              {STEPS.map((s, i) => {
                const done = stepIdx >= 0 && i < stepIdx;
                const curr = i === stepIdx;
                const future = i > stepIdx;
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={s} className="mo-timeline-item">
                    <div className="mo-timeline-track">
                      <div className="mo-timeline-dot" style={{
                        background: done ? 'linear-gradient(135deg,#22c55e,#16a34a)' : curr ? (isCompleted ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ff4b1f,#e8410a)') : 'rgba(255,255,255,.07)',
                        boxShadow: curr ? `0 0 0 4px ${isCompleted ? 'rgba(34,197,94,.2)' : 'rgba(232,65,10,.25)'}` : 'none',
                        color: done || curr ? '#fff' : 'rgba(255,255,255,.22)',
                      }}>
                        {done ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : curr ? <svg width="8" height="8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white"/></svg> : i + 1}
                      </div>
                      {!isLast && <div className="mo-timeline-line" style={{ background: done ? 'linear-gradient(180deg,#22c55e,rgba(232,65,10,.4))' : 'rgba(255,255,255,.06)' }} />}
                    </div>
                    <div style={{ paddingBottom: isLast ? 0 : 18, paddingTop: 7 }}>
                      <div className={`mo-timeline-step-name${future ? ' future' : ''}`}>{s}</div>
                      <div className="mo-timeline-step-sub" style={{ color: done ? 'rgba(34,197,94,.75)' : curr ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.15)' }}>
                        {done ? '✓ Выполнено' : curr ? 'Текущий этап' : '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {deal.description && (
            <div className="mo-info-card">
              <div className="mo-info-label">Описание</div>
              <p style={{ margin: 0, fontSize: 15, color: '#4b5563', lineHeight: 1.75, fontWeight: 600 }}>{deal.description}</p>
            </div>
          )}

          {deal.status === 'CANCELLED' && deal.cancellationReason && (
            <div className="mo-info-card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div className="mo-info-label" style={{ color: '#ef4444' }}>Причина отмены</div>
              <p style={{ margin: 0, fontSize: 14, color: '#7f1d1d', fontWeight: 600 }}>{deal.cancellationReason}</p>
            </div>
          )}
        </div>

        {/* RIGHT sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Price */}
          <div className="mo-info-card">
            <div className="mo-info-label">Согласованная стоимость</div>
            <div style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 950, color: '#111827', letterSpacing: '-1.5px', lineHeight: 1 }}>
              {deal.agreedPrice ? Number(deal.agreedPrice).toLocaleString('ru-RU') : 'Договорная'}
              {deal.agreedPrice && <span style={{ fontSize: 20, color: '#9ca3af', fontWeight: 700, marginLeft: 6 }}>₽</span>}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>Оплата после выполнения и подтверждения обеими сторонами.</p>
          </div>

          {/* NEW status: waiting */}
          {isNew && (
            <div className="mo-confirm-card" style={{ border: '1px solid rgba(245,158,11,.2)' }}>
              <div className="mo-confirm-accent" style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
              <div className="mo-confirm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="mo-confirm-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,.3)' }}>
                    ⏳
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase', color: '#d97706', marginBottom: 1 }}>Статус</div>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#111827' }}>Ждём мастера</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, lineHeight: 1.5 }}>
                  Вы выбрали мастера. После подтверждения заказ перейдёт в работу.
                </div>
              </div>
              <div className="mo-confirm-cta">
                {deal.workerId && (
                  <button className="mo-master-btn" style={{ marginTop: 0, minHeight: 46 }} onClick={() => navigate(`/chat/${deal.workerId}`)}>
                    💬 Написать мастеру
                  </button>
                )}
                <button className="mo-cancel-btn" onClick={onCancelNew}>Отменить заявку</button>
              </div>
            </div>
          )}

          {/* IN_PROGRESS: confirmation */}
          {isInProgress && (
            <div className="mo-confirm-card" style={{ border: myOk ? '1px solid #bbf7d0' : '1px solid rgba(232,65,10,.15)' }}>
              <div className="mo-confirm-accent" style={{ background: myOk ? '#22c55e' : 'linear-gradient(90deg,#e8410a,#ff7043)' }} />
              <div className="mo-confirm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="mo-confirm-icon" style={{ background: myOk ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ff4b1f,#e8410a)', boxShadow: `0 4px 12px ${myOk ? 'rgba(34,197,94,.3)' : 'rgba(232,65,10,.3)'}` }}>
                    {myOk ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase', color: myOk ? '#16a34a' : '#e8410a', marginBottom: 1 }}>Подтверждение</div>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#111827' }}>{myOk ? 'Ваш голос учтён!' : 'Работа выполнена?'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, lineHeight: 1.5 }}>
                  {myOk ? 'Ожидаем подтверждения от мастера' : 'Подтвердите, что мастер выполнил задачу'}
                </div>
              </div>

              <div className="mo-confirm-parties">
                {[
                  { name: 'Заказчик (вы)', sub: myOk ? '✓ Подтверждено' : 'Ожидает вашего действия', confirmed: myOk, icon: '👤' },
                  { name: 'Мастер', sub: workerOk ? '✓ Подтверждено' : 'Ожидает подтверждения', confirmed: workerOk, icon: '🔧' },
                ].map((p, i) => (
                  <div key={i} className="mo-confirm-party" style={{ background: p.confirmed ? 'rgba(34,197,94,.08)' : '#f9fafb', border: `1px solid ${p.confirmed ? 'rgba(34,197,94,.25)' : '#f3f4f6'}` }}>
                    <div className="mo-confirm-party-icon" style={{ background: p.confirmed ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e5e7eb', boxShadow: p.confirmed ? '0 4px 12px rgba(34,197,94,.25)' : 'none' }}>
                      {p.confirmed ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : p.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#111827' }}>{p.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: p.confirmed ? '#16a34a' : '#9ca3af' }}>{p.sub}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: p.confirmed ? '#22c55e' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {p.confirmed && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mo-confirm-cta">
                {!myOk ? (
                  <button className="mo-confirm-btn" disabled={actionId === deal.id} onClick={() => onComplete(deal.id)}>
                    {actionId === deal.id ? 'Подтверждаем…' : '✓ Подтвердить выполнение'}
                  </button>
                ) : !workerOk ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow: '0 8px 22px rgba(245,158,11,.3)' }}>
                    <div style={{ fontSize: 24 }}>⏳</div>
                    <div><div style={{ fontSize: 14, fontWeight: 950, color: '#fff' }}>Вы подтвердили!</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.82)', marginTop: 2 }}>Ожидаем мастера…</div></div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 22px rgba(34,197,94,.3)' }}>
                    <div style={{ fontSize: 24 }}>🎉</div>
                    <div><div style={{ fontSize: 14, fontWeight: 950, color: '#fff' }}>Обе стороны подтвердили!</div></div>
                  </div>
                )}
                <button className="mo-cancel-btn" onClick={onCancelActive}>Отменить сделку в работе</button>
              </div>
            </div>
          )}

          {/* COMPLETED */}
          {isCompleted && (
            <div className="mo-info-card" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0' }}>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 42, marginBottom: 10 }}>🏆</div>
                <div style={{ fontSize: 17, fontWeight: 950, color: '#111827', marginBottom: 8 }}>Сделка завершена!</div>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>Обе стороны подтвердили выполнение.</p>
                {!deal.hasReview && deal.workerId && dealEligibleForReviews(deal) && (
                  <button onClick={onReview} style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: '#e8410a', color: '#fff', cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: 13 }}>
                    ⭐ Оставить отзыв
                  </button>
                )}
                {deal.hasReview && <div style={{ fontSize: 13, fontWeight: 900, color: '#16a34a' }}>✓ Отзыв оставлен</div>}
              </div>
            </div>
          )}

          {/* CANCELLED */}
          {deal.status === 'CANCELLED' && (
            <div className="mo-info-card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#7f1d1d' }}>Сделка отменена</div>
              </div>
            </div>
          )}

          {/* Master card */}
          <div className="mo-info-card">
            <div className="mo-info-label">Мастер</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="mo-master-avatar" onClick={() => deal.workerId && navigate(`/workers/${deal.workerId}`)} style={{ cursor: deal.workerId ? 'pointer' : 'default' }}>
                {workerAvatar ? <img src={workerAvatar} alt="" /> : workerInitial}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#111827', cursor: deal.workerId ? 'pointer' : 'default' }} onClick={() => deal.workerId && navigate(`/workers/${deal.workerId}`)}>
                  {workerName}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, fontWeight: 700 }}>Мастер</div>
              </div>
            </div>
            {deal.workerId && (
              <button className="mo-master-btn" onClick={() => navigate(`/chat/${deal.workerId}`)}>
                Написать мастеру
              </button>
            )}
          </div>
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
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      setDetail(null);
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
      setDetail(null);
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
          onBack={() => setDetail(null)}
          onComplete={handleComplete}
          onCancelNew={() => { setCancelNewErr(''); setCancelNewOpen(true); }}
          onCancelActive={() => { setCancelActErr(''); setCancelActOpen(true); }}
          onReview={() => { setReviewStatus('idle'); setReviewDeal(detail); }}
          actionId={actionId}
          navigate={navigate}
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
    <div className="mo-page">
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
          <select className="mo-sort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
          </select>
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
                onEdit={null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
