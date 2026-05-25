import React from 'react';
import DealCardActions from './DealCardActions';

export const STATUS_CONFIG = {
  NEW:            { label: 'Новый заказ', dot: '#f59e0b', bg: '#fffbeb', color: '#d97706' },
  OPEN:           { label: 'Открыта',    dot: '#22c55e', bg: '#f0fdf4', color: '#16a34a' },
  IN_NEGOTIATION: { label: 'Ждёт откликов', dot: '#f59e0b', bg: '#fffbeb', color: '#d97706' },
  ASSIGNED:       { label: 'Назначена',  dot: '#f59e0b', bg: '#fffbeb', color: '#d97706' },
  IN_PROGRESS:    { label: 'В работе',   dot: '#3b82f6', bg: '#eff6ff', color: '#2563eb' },
  COMPLETED:      { label: 'Завершена',  dot: '#22c55e', bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED:      { label: 'Отменена',   dot: '#94a3b8', bg: '#f8fafc', color: '#64748b' },
  EXPIRED:        { label: 'Истекла',    dot: '#94a3b8', bg: '#f8fafc', color: '#64748b' },
};

const STEPS = ['Создана', 'В работе', 'Завершена'];
const STEP_MAP = {
  NEW: 0,
  OPEN: 0, IN_NEGOTIATION: 0, ASSIGNED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: -1, EXPIRED: -1,
};

const CAT_EMOJI = {
  'Ремонт квартир': '🔨', 'Сантехника': '🔧', 'Электрика': '⚡',
  'Уборка': '🧹', 'Грузоперевозки': '🚚', 'Компьютерная помощь': '💻',
  'Репетиторство': '📚', 'Красота и здоровье': '✨', 'Маникюр и педикюр': '💅',
  'Парикмахер': '✂️', 'Сварочные работы': '🔥',
};
const catEmoji = n => CAT_EMOJI[n] || '📌';

const FALLBACK = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=70';

export function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1)   return 'только что';
  if (mins < 60)  return `${mins} мин. назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} ч. назад`;
  const d = Math.floor(hrs / 24);
  if (d === 1)    return 'вчера';
  if (d < 7)      return `${d} дн. назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function OrderCard({
  order,
  onOpen,
  onChat,
  menuItems,
  partnerRole = 'Мастер',
  footerHint,
  footerHintColor,
  onOpenOffers,
  onEdit,
}) {
  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.OPEN;
  const thumb = order.photos?.[0] || FALLBACK;
  const stepIdx = STEP_MAP[order.status] ?? 0;
  const price = order.budget ? `${Number(order.budget).toLocaleString('ru-RU')} ₽` : 'Договорная';
  const partner = order.offers?.[0];
  const progressPct = stepIdx < 0 ? 0 : Math.round((stepIdx / (STEPS.length - 1)) * 100);
  const progressColor = progressPct === 100 ? '#22c55e' : '#e8410a';

  return (
    <article className="mo-card" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen()}>
      {/* Photo */}
      <div className="mo-card-photo">
        <img src={thumb} alt="" />
        <div className="mo-card-photo-gradient" />

        {/* Status badge */}
        <div className="mo-card-status-badge">
          <span className="mo-card-status-dot" style={{ background: st.dot }} />
          <span style={{ color: st.color }}>{st.label}</span>
        </div>

        {/* Price + master */}
        <div className="mo-card-overlay-bottom">
          <div>
            <div className="mo-card-price-num">{price}</div>
            <div className="mo-card-price-lbl">согласовано</div>
          </div>
          {partner && (
            <div className="mo-card-master-pill">
              <div className="mo-card-master-avatar">
                {partner.avatarUrl
                  ? <img src={partner.avatarUrl} alt={partner.name} />
                  : <span>{partner.initial || (partner.name?.[0] || 'М')}</span>
                }
              </div>
              <div>
                <div className="mo-card-master-name">{partner.name || partner.workerName || partnerRole}</div>
                <div className="mo-card-master-role">{partnerRole}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mo-card-body">
        <div>
          <h3 className="mo-card-title">{order.title}</h3>
          <span className="mo-card-cat-chip">{catEmoji(order.category)} {order.category}</span>
        </div>

        {/* Progress */}
        {stepIdx >= 0 && (
          <div className="mo-card-progress">
            <div className="mo-card-progress-header">
              <span className="mo-card-progress-label">
                {order.status === 'IN_PROGRESS'
                  ? 'Идёт работа'
                  : order.status === 'COMPLETED'
                    ? 'Сделка завершена'
                    : order.status === 'NEW'
                      ? 'Ожидает старта'
                      : 'Статус сделки'}
              </span>
              <span className="mo-card-progress-pct" style={{ color: progressColor }}>{progressPct}%</span>
            </div>

            <div className="mo-card-progress-bar">
              <div className="mo-card-progress-fill" style={{ width: `${progressPct}%`, background: progressColor === '#22c55e' ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #e8410a, #ff7043)' }} />
            </div>

            <div className="mo-card-steps" style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}>
              <div className="mo-card-steps-line">
                <div className="mo-card-steps-line-fill" style={{ width: `${progressPct}%`, background: progressColor }} />
              </div>
              {STEPS.map((step, i) => {
                const done = i < stepIdx;
                const curr = i === stepIdx;
                return (
                  <div key={step} className="mo-card-step">
                    <div className="mo-card-step-dot" style={{
                      background: done ? '#111827' : curr ? progressColor : '#f3f4f6',
                      color: done || curr ? '#fff' : '#9ca3af',
                      boxShadow: curr ? `0 4px 14px ${progressColor}66` : 'none',
                      border: i > stepIdx ? '2px solid #e5e7eb' : 'none',
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className="mo-card-step-label" style={{ color: i > stepIdx ? '#9ca3af' : '#374151' }}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mo-card-footer">
          <span className="mo-card-date">🗓 {timeAgo(order.createdAt)}</span>
          {footerHint ? (
            <span style={{ fontSize: 11, fontWeight: 900, color: footerHintColor || '#6b7280' }}>{footerHint}</span>
          ) : (
            <>
              {order.status === 'IN_PROGRESS' && (
                <span style={{ fontSize: 11, fontWeight: 900, color: '#d97706' }}>⏳ Требует подтверждения</span>
              )}
              {order.status === 'COMPLETED' && (
                <span style={{ fontSize: 11, fontWeight: 900, color: '#16a34a' }}>✓ Завершена</span>
              )}
            </>
          )}
        </div>
      </div>

      <DealCardActions onOpen={onOpen} onChat={onChat} menuItems={menuItems} />
    </article>
  );
}
