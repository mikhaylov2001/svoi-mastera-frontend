import React, { useState } from 'react';
import { STATUS_CONFIG, timeAgo } from './OrderCard';

const STEPS = ['Создана', 'Принята', 'В работе', 'Подтверждение', 'Завершена'];
const STEP_TIMES = ['', '—', 'сейчас', '—', '—'];

const STATUS_STEP = {
  OPEN: 0, IN_NEGOTIATION: 1, ASSIGNED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 4,
  CANCELLED: -1, EXPIRED: -1,
};

const CAT_EMOJI = {
  'Ремонт квартир': '🔨', 'Сантехника': '🔧', 'Электрика': '⚡',
  'Уборка': '🧹', 'Грузоперевозки': '🚚', 'Компьютерная помощь': '💻',
};
const catEmoji = n => CAT_EMOJI[n] || '📌';

const FALLBACK = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80';

function pluralOffers(n) {
  const a = Math.abs(Number(n)) % 100, b = a % 10;
  if (a > 10 && a < 20) return 'откликов';
  if (b > 1 && b < 5) return 'отклика';
  if (b === 1) return 'отклик';
  return 'откликов';
}

function arrowBtn(side) {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: 14, width: 42, height: 42, borderRadius: '50%', border: 'none',
    background: 'rgba(0,0,0,.5)', color: '#fff', cursor: 'pointer',
    backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background .18s', zIndex: 2,
  };
}

export default function OrderDetail({ order, onBack, onOpenOffers, onEdit, onCancel, onConfirm }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.OPEN;
  const photos = order.photos?.length ? order.photos : [FALLBACK];
  const isCompleted = order.status === 'COMPLETED';
  const isInProgress = order.status === 'IN_PROGRESS';
  const isActive = ['OPEN','IN_NEGOTIATION','ASSIGNED','IN_PROGRESS'].includes(order.status);
  const stepIdx = STATUS_STEP[order.status] ?? 0;
  const progress = stepIdx < 0 ? 0 : Math.round((stepIdx / (STEPS.length - 1)) * 100);
  const price = order.budget ? `${Number(order.budget).toLocaleString('ru-RU')} ₽` : 'Договорная';
  const master = order.offers?.[0];
  const progressColor = isCompleted ? '#22c55e' : '#e8410a';

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm?.();
  };

  return (
    <div className="mo-detail">
      {/* Back */}
      <div className="mo-detail-nav">
        <button className="mo-detail-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Мои сделки
        </button>
      </div>

      {/* Title */}
      <div className="mo-detail-head">
        <h1>{order.title}</h1>
        <div className="mo-detail-status-pill" style={{ background: st.bg, color: st.color, border: `1px solid ${st.dot}22` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
          {st.label}
        </div>
      </div>

      {/* Grid */}
      <div className="mo-detail-grid">
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Gallery */}
          <div className="mo-detail-gallery">
            <div className="mo-detail-gallery-main">
              <img src={photos[photoIdx]} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.18) 0%, transparent 40%)', pointerEvents: 'none' }} />

              {/* Chips */}
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 2 }}>
                <span style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: st.dot, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>{st.label}</span>
                <span style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: 'rgba(0,0,0,.5)', color: '#fff', backdropFilter: 'blur(10px)' }}>
                  {catEmoji(order.category)} {order.category}
                </span>
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
                  <button key={i} onClick={() => setPhotoIdx(i)} style={{
                    flexShrink: 0, width: 80, height: 58, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    border: `3px solid ${i === photoIdx ? '#ff4b1f' : 'transparent'}`,
                    padding: 0, background: 'none', transition: 'border-color .18s, transform .15s',
                    transform: i === photoIdx ? 'scale(1.04)' : 'scale(1)',
                  }}>
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress card */}
          <div className="mo-progress-card">
            <div className="mo-progress-card-header">
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>Прогресс сделки</div>
                <div style={{ fontSize: 18, fontWeight: 950, color: '#fff', letterSpacing: '-.3px' }}>
                  {isCompleted ? 'Сделка завершена 🎉' : STEPS[Math.max(0, stepIdx)]}
                </div>
              </div>
              <div className="mo-progress-ring" style={{ background: `conic-gradient(${progressColor} ${progress * 3.6}deg, rgba(255,255,255,.08) 0deg)` }}>
                <div className="mo-progress-ring-inner" style={{ color: isCompleted ? '#22c55e' : '#ff7043' }}>
                  {progress}%
                </div>
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
                        {done
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                          : curr
                            ? <svg width="8" height="8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white"/></svg>
                            : i + 1
                        }
                      </div>
                      {!isLast && (
                        <div className="mo-timeline-line" style={{ background: done ? 'linear-gradient(180deg,#22c55e,rgba(232,65,10,.4))' : 'rgba(255,255,255,.06)' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: isLast ? 0 : 18, paddingTop: 7 }}>
                      <div className={`mo-timeline-step-name${future ? ' future' : ''}`}>{s}</div>
                      <div className="mo-timeline-step-sub" style={{ color: done ? 'rgba(34,197,94,.75)' : curr ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.15)' }}>
                        {done ? '✓ Выполнено' : curr ? (STEP_TIMES[i] || 'Текущий этап') : '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {order.description && (
            <div className="mo-info-card">
              <div className="mo-info-label">Описание</div>
              <p style={{ margin: 0, fontSize: 15, color: '#4b5563', lineHeight: 1.75, fontWeight: 600 }}>{order.description}</p>
            </div>
          )}

          {order.address && (
            <div className="mo-info-card">
              <div className="mo-info-label">Адрес</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#111827', fontWeight: 700 }}>
                <span style={{ fontSize: 22 }}>📍</span> {order.address}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Price */}
          <div className="mo-info-card">
            <div className="mo-info-label">Согласованная стоимость</div>
            <div style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 950, color: '#111827', letterSpacing: '-1.5px', lineHeight: 1 }}>
              {order.budget ? Number(order.budget).toLocaleString('ru-RU') : 'Договорная'}
              {order.budget && <span style={{ fontSize: 20, color: '#9ca3af', fontWeight: 700, marginLeft: 6 }}>₽</span>}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>Оплата после выполнения и подтверждения обеими сторонами.</p>
          </div>

          {/* Confirmation block */}
          {isInProgress && (
            <div className="mo-confirm-card" style={{ border: confirmed ? '1px solid #bbf7d0' : '1px solid rgba(232,65,10,.15)' }}>
              <div className="mo-confirm-accent" style={{ background: confirmed ? '#22c55e' : 'linear-gradient(90deg,#e8410a,#ff7043)' }} />
              <div className="mo-confirm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className="mo-confirm-icon" style={{ background: confirmed ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ff4b1f,#e8410a)', boxShadow: `0 4px 12px ${confirmed ? 'rgba(34,197,94,.3)' : 'rgba(232,65,10,.3)'}` }}>
                    {confirmed
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase', color: confirmed ? '#16a34a' : '#e8410a', marginBottom: 1 }}>Подтверждение</div>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#111827', letterSpacing: '-.3px' }}>{confirmed ? 'Ваш голос учтён!' : 'Работа выполнена?'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, lineHeight: 1.5 }}>
                  {confirmed ? 'Ожидаем подтверждения от мастера' : 'Подтвердите, что мастер выполнил задачу'}
                </div>
              </div>

              <div className="mo-confirm-parties">
                {[
                  { name: 'Заказчик (вы)', sub: confirmed ? '✓ Подтверждено' : 'Ожидает вашего действия', confirmed, icon: '👤' },
                  { name: 'Мастер', sub: 'Ожидает подтверждения', confirmed: false, icon: '🔧' },
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
                {!confirmed ? (
                  <button className="mo-confirm-btn" onClick={handleConfirm}>✓ Подтвердить выполнение</button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 22px rgba(34,197,94,.3)' }}>
                    <div style={{ fontSize: 24 }}>🎉</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 950, color: '#fff' }}>Вы подтвердили!</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.82)', marginTop: 2 }}>Ожидаем мастера…</div>
                    </div>
                  </div>
                )}
                <button className="mo-cancel-btn" onClick={onCancel}>Отменить сделку</button>
              </div>
            </div>
          )}

          {/* Completed */}
          {isCompleted && (
            <div className="mo-info-card" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0' }}>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 42, marginBottom: 10 }}>🏆</div>
                <div style={{ fontSize: 17, fontWeight: 950, color: '#111827', marginBottom: 8 }}>Сделка завершена!</div>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>Обе стороны подтвердили выполнение.</p>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#16a34a' }}>✓ Завершена обеими сторонами</div>
              </div>
            </div>
          )}

          {/* Offers button */}
          {['OPEN','ASSIGNED'].includes(order.status) && (order.offersCount > 0 || order.offers?.length > 0) && (
            <button onClick={onOpenOffers} style={{ width: '100%', minHeight: 52, border: 'none', borderRadius: 16, background: 'linear-gradient(135deg,#ff4b1f,#e8410a)', color: '#fff', cursor: 'pointer', fontFamily: 'Manrope,sans-serif', fontSize: 14, fontWeight: 900, boxShadow: '0 10px 28px rgba(232,65,10,.32)' }}>
              🔔 {order.offersCount || order.offers?.length} {pluralOffers(order.offersCount || order.offers?.length)} — выбрать мастера
            </button>
          )}

          {/* Master */}
          {master && (
            <div className="mo-info-card">
              <div className="mo-info-label">Мастер</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="mo-master-avatar">
                  {master.avatarUrl
                    ? <img src={master.avatarUrl} alt="" />
                    : (master.initial || master.name?.[0] || 'М')
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>{master.name || 'Мастер'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, fontWeight: 700 }}>
                    Мастер{master.rating ? ` · ⭐ ${master.rating}` : ''}{master.reviews ? ` (${master.reviews} отзывов)` : ''}
                  </div>
                </div>
              </div>
              <button className="mo-master-btn">Написать мастеру</button>
            </div>
          )}

          {/* Edit / Delete */}
          {isActive && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="mo-ghost-btn" onClick={onEdit}>✏️ Изменить</button>
              <button className="mo-ghost-btn" style={{ color: '#ef4444', borderColor: '#fee2e2' }} onClick={onCancel}>🗑 Удалить</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
