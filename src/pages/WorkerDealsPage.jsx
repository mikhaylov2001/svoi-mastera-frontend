import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getMyDeals, completeDeal } from '../api';
import { useAuth } from '../context/AuthContext';
import './DealsPage.css'; // используем те же стили что у клиента

const DEAL_STATUSES = {
  NEW:         { label: 'Новая',     emoji: '📋', color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  IN_PROGRESS: { label: 'В работе',  emoji: '⚙️',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:   { label: 'Завершена', emoji: '✅',  color: '#22c55e', bg: 'rgba(34,197,94,.12)'   },
  CANCELLED:   { label: 'Отменена',  emoji: '❌',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'   },
};

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  return `${Math.floor(h / 24)} дн. назад`;
}

export default function WorkerDealsPage() {
  const { userId } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [deals,   setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [dealDetail, setDealDetail] = useState(null);
  const [actionId,   setActionId]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyDeals(userId);
      // Только сделки где мы — мастер
      setDeals((data || []).filter(d => d.workerId === userId));
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Открыть сделку по dealId из URL (?dealId=...)
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const id = qp.get('dealId');
    if (id && deals.length > 0) {
      const found = deals.find(d => d.id === id);
      if (found) setDealDetail(found);
    }
  }, [location.search, deals]);

  // Обновляем dealDetail если данные сделки изменились
  useEffect(() => {
    if (dealDetail?.id) {
      const fresh = deals.find(d => d.id === dealDetail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(dealDetail)) {
        setDealDetail(fresh);
      }
    }
  }, [deals, dealDetail]);

  const handleConfirm = async (dealId) => {
    setActionId(dealId);
    try { await completeDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  const counts = {
    ALL:         deals.length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

  const filtered = filter === 'ALL'
    ? deals
    : deals.filter(d => d.status === filter);

  // ══ DEAL DETAIL ══
  if (dealDetail) {
    const st    = DEAL_STATUSES[dealDetail.status] || DEAL_STATUSES.NEW;
    const myOk    = dealDetail.workerConfirmed;
    const otherOk = dealDetail.customerConfirmed;

    return (
      <div>
        <div className="page-header-bar">
          <div className="container">
            <button className="cats-back-link" onClick={() => setDealDetail(null)}>
              ← Назад к заказам
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:10 }}>
              <div className="dp-status-icon" style={{ background: st.bg }}>
                <span>{st.emoji}</span>
              </div>
              <div>
                <h1>{dealDetail.title || 'Задача'}</h1>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4, flexWrap:'wrap' }}>
                  <span className="dp-badge" style={{ color: st.color, background: st.bg }}>
                    {st.emoji} {st.label}
                  </span>
                  {dealDetail.category && (
                    <span style={{ fontSize:13, color:'var(--gray-400)' }}>{dealDetail.category}</span>
                  )}
                  {dealDetail.agreedPrice && (
                    <span style={{ fontSize:13, color:'var(--gray-500)', fontWeight:700 }}>
                      💰 {Number(dealDetail.agreedPrice).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="dp-grid">
            {/* Левая колонка */}
            <div>
              {dealDetail.description && dealDetail.description !== 'Без описания' && (
                <div className="dp-card">
                  <div className="dp-card-label">Описание задачи</div>
                  <p className="dp-desc">{dealDetail.description}</p>
                </div>
              )}

              <div className="dp-card">
                <div className="dp-card-label">Участники</div>
                <div className="dp-people">
                  <div className="dp-person">
                    <div className="dp-person-role">👤 Заказчик</div>
                    <div className="dp-person-name">{dealDetail.customerName || '—'}</div>
                  </div>
                  <div className="dp-person">
                    <div className="dp-person-role">🔨 Мастер</div>
                    <div className="dp-person-name">
                      {dealDetail.workerName || 'Вы'}
                      <span className="dp-you"> • вы</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dp-card">
                <div className="dp-card-label">Информация</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13, color:'#6b7280' }}>
                  {dealDetail.createdAt && (
                    <span>🕐 Создана: {timeAgo(dealDetail.createdAt)}</span>
                  )}
                  {dealDetail.agreedPrice && (
                    <span>💰 Стоимость: {Number(dealDetail.agreedPrice).toLocaleString('ru-RU')} ₽</span>
                  )}
                  {dealDetail.category && (
                    <span>🏷 Категория: {dealDetail.category}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Правая колонка — действия */}
            <div className="dp-side">
              {dealDetail.status === 'COMPLETED' && (
                <div className="dp-state">
                  <span>✅</span>
                  <h3>Работа завершена</h3>
                  <p>Обе стороны подтвердили выполнение. Отличная работа!</p>
                </div>
              )}

              {dealDetail.status === 'NEW' && (
                <div className="dp-state">
                  <span>📋</span>
                  <h3>Заявка создана</h3>
                  <p>Ожидаем начала работы</p>
                </div>
              )}

              {dealDetail.status === 'IN_PROGRESS' && (
                <>
                  <div className="dp-side-title">Подтверждение выполнения</div>
                  <p className="dp-side-hint">
                    Когда работа выполнена — нажмите кнопку. Сделка закроется после подтверждения обеих сторон.
                  </p>

                  <div className="dp-ci-list">
                    {[
                      { confirmed: dealDetail.customerConfirmed, name: `Заказчик`, sub: dealDetail.customerName },
                      { confirmed: dealDetail.workerConfirmed,   name: `Вы (мастер)`, sub: dealDetail.workerName },
                    ].map(({ confirmed, name, sub }) => (
                      <div key={name} className={`dp-ci ${confirmed ? 'ok' : ''}`}>
                        <span>{confirmed ? '✅' : '⏳'}</span>
                        <div>
                          <div className="dp-ci-name">{name}</div>
                          <div className="dp-ci-status">
                            {confirmed ? 'Подтвердил выполнение' : 'Ожидание подтверждения'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!myOk ? (
                    <button
                      className="dp-confirm-btn"
                      disabled={actionId === dealDetail.id}
                      onClick={() => handleConfirm(dealDetail.id)}
                    >
                      {actionId === dealDetail.id ? 'Подтверждаем…' : '✅ Подтвердить выполнение'}
                    </button>
                  ) : (
                    <div className="dp-wait">
                      ✓ Вы подтвердили выполнение
                      {!otherOk && ' — ожидаем подтверждения заказчика…'}
                    </div>
                  )}

                  <button
                    className="dp-chat-btn"
                    onClick={() => navigate(`/chat/${dealDetail.customerId}`)}
                  >
                    💬 Написать заказчику
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ LIST ══
  return (
    <div>
      <div className="page-header-bar dpage-header">
        <div className="container">
          <h1>Мои заказы</h1>
          <p>Активные сделки и завершённые работы</p>
        </div>
      </div>

      <div className="container" style={{ padding:'28px 0 60px' }}>

        {/* Фильтры */}
        <div className="dpage-filters">
          {[
            ['ALL',         'Все',       counts.ALL],
            ['IN_PROGRESS', 'В работе',  counts.IN_PROGRESS],
            ['COMPLETED',   'Завершены', counts.COMPLETED],
          ].map(([key, label, count]) => (
            <button
              key={key}
              className={`dpage-filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label} <span>{count}</span>
            </button>
          ))}

          <Link to="/find-work" style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            color: '#e8410a',
            background: 'rgba(232,65,10,.08)',
            border: '1.5px solid rgba(232,65,10,.2)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            <svg width="14" height="14" fill="none" stroke="#e8410a" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Найти работу
          </Link>
        </div>

        {/* Список */}
        <div className="dpage-list">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="dp-skeleton" style={{ height:88 }} />
            ))
          ) : filtered.length === 0 ? (
            <div className="dpage-empty">
              <span>🤝</span>
              <h3>Заказов пока нет</h3>
              <p>Откликайтесь на заявки — заказы появятся здесь</p>
              <Link to="/find-work" className="btn btn-primary btn-sm">
                Найти работу
              </Link>
            </div>
          ) : (
            filtered.map(d => {
              const st = DEAL_STATUSES[d.status] || DEAL_STATUSES.NEW;
              return (
                <div
                  key={d.id}
                  className="dpage-card"
                  onClick={() => setDealDetail(d)}
                >
                  <div className="dpage-card-accent" style={{ background: st.color }} />
                  <div className="dpage-card-body">
                    <div className="dpage-card-top">
                      <div className="dpage-card-info">
                        <h3 className="dpage-card-title">{d.title || 'Задача'}</h3>
                        <div className="dpage-card-meta">
                          {d.category && <span>🏷 {d.category}</span>}
                          <span>👤 {d.customerName || 'Заказчик'}</span>
                          <span>🕐 {timeAgo(d.createdAt)}</span>
                        </div>
                      </div>
                      <div className="dpage-card-right">
                        <span className="dp-badge" style={{ color: st.color, background: st.bg }}>
                          {st.emoji} {st.label}
                        </span>
                        {d.agreedPrice && (
                          <div className="dpage-card-price">
                            {Number(d.agreedPrice).toLocaleString('ru-RU')} ₽
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Прогресс подтверждения */}
                    {d.status === 'IN_PROGRESS' && (
                      <div className="dpage-card-progress">
                        <div className={`dp-prog ${d.customerConfirmed ? 'ok' : ''}`}>
                          {d.customerConfirmed ? '✅' : '⏳'} Заказчик
                        </div>
                        <span className="dp-prog-arrow">→</span>
                        <div className={`dp-prog ${d.workerConfirmed ? 'ok' : ''}`}>
                          {d.workerConfirmed ? '✅' : '⏳'} Вы
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="dpage-card-chevron">›</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}