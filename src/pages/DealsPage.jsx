import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyDeals, completeDeal } from '../api';
import { useAuth } from '../context/AuthContext';
import './DealsPage.css';

const STATUSES = {
  NEW:         { label: 'Новая заявка', emoji: '📋', color: '#6366f1', bg: 'rgba(99,102,241,.1)' },
  IN_PROGRESS: { label: 'В работе',    emoji: '⚙️', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
  COMPLETED:   { label: 'Завершена',   emoji: '✅', color: '#22c55e', bg: 'rgba(34,197,94,.1)'  },
  CANCELLED:   { label: 'Отменена',   emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,.1)'  },
};

const FILTERS = [
  { key: 'ALL',         label: 'Все',         emoji: '📂' },
  { key: 'NEW',         label: 'Новые',       emoji: '📋' },
  { key: 'IN_PROGRESS', label: 'В работе',    emoji: '⚙️' },
  { key: 'COMPLETED',   label: 'Завершены',   emoji: '✅' },
];

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  return `${Math.floor(h / 24)} дн. назад`;
}

export default function DealsPage() {
  const { userId } = useAuth();
  const [deals,   setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [detail,  setDetail]  = useState(null);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDeals(await getMyDeals(userId)); } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (detail?.id) {
      const fresh = deals.find(d => d.id === detail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(detail)) setDetail(fresh);
    }
  }, [deals, detail]);

  const handleConfirm = async (dealId) => {
    setActionId(dealId);
    try { await completeDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  const isCust = (d) => d.customerId === userId;

  const counts = {
    ALL:         deals.length,
    NEW:         deals.filter(d => d.status === 'NEW').length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

  const filtered = filter === 'ALL' ? deals : deals.filter(d => d.status === filter);

  /* ══ DETAIL VIEW ══ */
  if (detail) {
    const st = STATUSES[detail.status] || STATUSES.NEW;
    const im = isCust(detail);
    const myOk    = im ? detail.customerConfirmed : detail.workerConfirmed;
    const otherOk = im ? detail.workerConfirmed   : detail.customerConfirmed;

    return (
      <div className="deals-page">
        <div className="container">
          <button className="deals-back" onClick={() => setDetail(null)}>
            ← Назад к сделкам
          </button>

          <div className="deal-detail-grid">

            {/* Левая часть */}
            <div className="deal-detail-main">
              <div className="deal-detail-card">
                <div className="deal-detail-top">
                  <span
                    className="deal-status-badge"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.emoji} {st.label}
                  </span>
                  {detail.category && (
                    <span className="deal-category-tag">{detail.category}</span>
                  )}
                </div>

                <h1 className="deal-detail-title">{detail.title || 'Задача'}</h1>

                {detail.agreedPrice && (
                  <div className="deal-detail-price">
                    {Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽
                  </div>
                )}

                {detail.description && detail.description !== 'Без описания' && (
                  <>
                    <div className="deal-sep" />
                    <div className="deal-section-title">Описание</div>
                    <p className="deal-desc">{detail.description}</p>
                  </>
                )}

                <div className="deal-sep" />
                <div className="deal-section-title">Участники</div>
                <div className="deal-people">
                  <div className="deal-person">
                    <div className="deal-person-role">Заказчик</div>
                    <div className="deal-person-name">
                      {detail.customerName || '—'}
                      {im && <span className="deal-you"> • вы</span>}
                    </div>
                  </div>
                  <div className="deal-person">
                    <div className="deal-person-role">Мастер</div>
                    <div className="deal-person-name">
                      {detail.workerName || '—'}
                      {!im && <span className="deal-you"> • вы</span>}
                    </div>
                  </div>
                </div>

                {detail.createdAt && (
                  <>
                    <div className="deal-sep" />
                    <div className="deal-date">🕐 Создана: {timeAgo(detail.createdAt)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Правая часть */}
            <div className="deal-detail-side">
              <div className="deal-side-card">
                {detail.status === 'COMPLETED' && (
                  <div className="deal-done">
                    <span>✅</span>
                    <h3>Сделка завершена</h3>
                    <p>Обе стороны подтвердили выполнение работы</p>
                  </div>
                )}

                {detail.status === 'NEW' && (
                  <div className="deal-new-info">
                    <span>📋</span>
                    <h3>Заявка создана</h3>
                    <p>Ожидаем когда мастер примет задачу в работу</p>
                  </div>
                )}

                {detail.status === 'IN_PROGRESS' && (
                  <>
                    <div className="deal-side-title">Подтверждение</div>
                    <p className="deal-side-hint">Сделка завершится когда обе стороны подтвердят выполнение</p>

                    <div className="deal-confirm-list">
                      <div className={`deal-ci ${detail.customerConfirmed ? 'ok' : ''}`}>
                        <span>{detail.customerConfirmed ? '✅' : '⏳'}</span>
                        <div>
                          <div className="deal-ci-name">Заказчик{im && ' (вы)'}</div>
                          <div className="deal-ci-status">
                            {detail.customerConfirmed ? 'Подтвердил' : 'Ожидание'}
                          </div>
                        </div>
                      </div>
                      <div className={`deal-ci ${detail.workerConfirmed ? 'ok' : ''}`}>
                        <span>{detail.workerConfirmed ? '✅' : '⏳'}</span>
                        <div>
                          <div className="deal-ci-name">Мастер{!im && ' (вы)'}</div>
                          <div className="deal-ci-status">
                            {detail.workerConfirmed ? 'Подтвердил' : 'Ожидание'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!myOk ? (
                      <button
                        className="deal-confirm-btn"
                        disabled={actionId === detail.id}
                        onClick={() => handleConfirm(detail.id)}
                      >
                        {actionId === detail.id ? 'Подтверждаем…' : '✅ Подтвердить выполнение'}
                      </button>
                    ) : (
                      <div className="deal-wait-msg">
                        ✓ Вы подтвердили{!otherOk && ' — ожидаем другую сторону…'}
                      </div>
                    )}

                    <Link to="/chat" className="deal-chat-btn">
                      💬 Написать сообщение
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══ LIST VIEW ══ */
  return (
    <div className="deals-page">

      {/* Шапка */}
      <div className="deals-hero">
        <div className="container">
          <h1>Мои сделки</h1>
          <p>Все заявки, активные задачи и завершённые работы</p>
        </div>
      </div>

      <div className="container">

        {/* Фильтры */}
        <div className="deals-filters">
          {FILTERS.map(({ key, label, emoji }) => (
            <button
              key={key}
              className={`deals-filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              <span>{emoji}</span>
              {label}
              <span className="deals-filter-count">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Список */}
        <div className="deals-list">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="deal-skeleton" />)
          ) : filtered.length === 0 ? (
            <div className="deals-empty">
              <span>🤝</span>
              <h3>Сделок нет</h3>
              <p>Создайте заявку — мастера откликнутся в течение 10 минут</p>
              <Link to="/sections" className="btn btn-primary btn-sm">
                Найти мастера
              </Link>
            </div>
          ) : (
            filtered.map(d => {
              const st = STATUSES[d.status] || STATUSES.NEW;
              const im = isCust(d);
              return (
                <div
                  key={d.id}
                  className="deal-card"
                  onClick={() => setDetail(d)}
                >
                  <div className="deal-card-left">
                    <div
                      className="deal-card-status-dot"
                      style={{ background: st.color }}
                    />
                  </div>

                  <div className="deal-card-body">
                    <div className="deal-card-top">
                      <div className="deal-card-info">
                        <h3 className="deal-card-title">{d.title || 'Задача'}</h3>
                        <div className="deal-card-meta">
                          {d.category && <span>🏷 {d.category}</span>}
                          <span>👤 {im ? (d.workerName || 'Мастер не назначен') : d.customerName}</span>
                          <span>🕐 {timeAgo(d.createdAt)}</span>
                        </div>
                      </div>

                      <div className="deal-card-right">
                        <span
                          className="deal-status-badge"
                          style={{ color: st.color, background: st.bg }}
                        >
                          {st.emoji} {st.label}
                        </span>
                        {d.agreedPrice && (
                          <div className="deal-card-price">
                            {Number(d.agreedPrice).toLocaleString('ru-RU')} ₽
                          </div>
                        )}
                      </div>
                    </div>

                    {d.status === 'IN_PROGRESS' && (
                      <div className="deal-card-progress">
                        <div className={`deal-prog-item ${d.customerConfirmed ? 'ok' : ''}`}>
                          {d.customerConfirmed ? '✅' : '⏳'} Заказчик
                        </div>
                        <div className="deal-prog-sep">→</div>
                        <div className={`deal-prog-item ${d.workerConfirmed ? 'ok' : ''}`}>
                          {d.workerConfirmed ? '✅' : '⏳'} Мастер
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="deal-card-arrow">›</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
