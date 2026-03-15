import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMyDeals, completeDeal,
  getMyJobRequests, getOffersForRequest, acceptOffer, getCategories,
} from '../api';
import { useAuth } from '../context/AuthContext';
import './DealsPage.css';

const DEAL_STATUSES = {
  NEW:         { label: 'Новая',     emoji: '📋', color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  IN_PROGRESS: { label: 'В работе',  emoji: '⚙️',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:   { label: 'Завершена', emoji: '✅',  color: '#22c55e', bg: 'rgba(34,197,94,.12)'   },
  CANCELLED:   { label: 'Отменена',  emoji: '❌',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'   },
};

const REQ_STATUSES = {
  DRAFT:          { label: 'Черновик',   emoji: '📝', color: '#9ca3af', bg: 'rgba(156,163,175,.12)' },
  OPEN:           { label: 'Открыта',    emoji: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,.12)'   },
  IN_NEGOTIATION: { label: 'Обсуждение', emoji: '💬', color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  ASSIGNED:       { label: 'Назначена',  emoji: '👷', color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
  IN_PROGRESS:    { label: 'В работе',   emoji: '⚙️',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:      { label: 'Выполнена',  emoji: '✅',  color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  CANCELLED:      { label: 'Отменена',   emoji: '❌',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
  EXPIRED:        { label: 'Истекла',    emoji: '⏰',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
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

export default function DealsPage() {
  const { userId } = useAuth();
  const navigate   = useNavigate();

  const [deals,      setDeals]      = useState([]);
  const [requests,   setRequests]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [tab,        setTab]        = useState('requests');
  const [reqFilter,  setReqFilter]  = useState('ALL');
  const [dealFilter, setDealFilter] = useState('ALL');

  const [dealDetail, setDealDetail] = useState(null);
  const [reqDetail,  setReqDetail]  = useState(null);

  const [offers,        setOffers]        = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r, c] = await Promise.all([
        getMyDeals(userId),
        getMyJobRequests(userId),
        getCategories(),
      ]);
      setDeals(d);
      setRequests(r);
      setCategories(c);
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (dealDetail?.id) {
      const fresh = deals.find(d => d.id === dealDetail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(dealDetail)) setDealDetail(fresh);
    }
  }, [deals, dealDetail]);

  const getCatName = (id) => categories.find(c => c.id === id)?.name || '';

  const loadOffers = async (reqId) => {
    setOffersLoading(true);
    try { setOffers(await getOffersForRequest(reqId)); } catch { setOffers([]); }
    setOffersLoading(false);
  };

  const handleAccept = async (req, offer) => {
    setActionId(offer.id);
    try {
      await acceptOffer(userId, req.id, offer.id);
      await load();
      setReqDetail(null);
      setOffers([]);
      setTab('deals');
    } catch {}
    setActionId(null);
  };

  const handleConfirm = async (dealId) => {
    setActionId(dealId);
    try { await completeDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  const isCust = (d) => d.customerId === userId;

  // Заявки у которых уже есть сделка — скрываем из таба заявок
  const dealsJobRequestIds = new Set(deals.map(d => d.jobRequestId).filter(Boolean));
  const activeRequests = requests.filter(r => !dealsJobRequestIds.has(r.id));

  const reqCounts = {
    ALL:         activeRequests.length,
    OPEN:        activeRequests.filter(r => r.status === 'OPEN').length,
    IN_PROGRESS: activeRequests.filter(r => ['IN_PROGRESS','ASSIGNED','IN_NEGOTIATION'].includes(r.status)).length,
    COMPLETED:   activeRequests.filter(r => r.status === 'COMPLETED').length,
  };
  const dealCounts = {
    ALL:         deals.length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

  const filteredReqs = reqFilter === 'ALL' ? activeRequests
    : reqFilter === 'IN_PROGRESS'
      ? activeRequests.filter(r => ['IN_PROGRESS','ASSIGNED','IN_NEGOTIATION'].includes(r.status))
      : activeRequests.filter(r => r.status === reqFilter);

  const filteredDeals = dealFilter === 'ALL' ? deals
    : deals.filter(d => d.status === dealFilter);

  /* ══ DEAL DETAIL ══ */
  if (dealDetail) {
    const st      = DEAL_STATUSES[dealDetail.status] || DEAL_STATUSES.NEW;
    const im      = isCust(dealDetail);
    const myOk    = im ? dealDetail.customerConfirmed : dealDetail.workerConfirmed;
    const otherOk = im ? dealDetail.workerConfirmed   : dealDetail.customerConfirmed;

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
            <div>
              {dealDetail.description && dealDetail.description !== 'Без описания' && (
                <div className="dp-card">
                  <div className="dp-card-label">Описание</div>
                  <p className="dp-desc">{dealDetail.description}</p>
                </div>
              )}
              <div className="dp-card">
                <div className="dp-card-label">Участники</div>
                <div className="dp-people">
                  <div className="dp-person">
                    <div className="dp-person-role">👤 Заказчик</div>
                    <div className="dp-person-name">
                      {dealDetail.customerName || '—'}
                      {im && <span className="dp-you"> • вы</span>}
                    </div>
                  </div>
                  <div className="dp-person">
                    <div className="dp-person-role">🔨 Мастер</div>
                    <div className="dp-person-name">
                      {dealDetail.workerName || 'Не назначен'}
                      {!im && dealDetail.workerName && <span className="dp-you"> • вы</span>}
                    </div>
                  </div>
                </div>
              </div>
              {dealDetail.createdAt && (
                <div className="dp-card">
                  <div className="dp-card-label">Информация</div>
                  <div style={{ fontSize:13, color:'#6b7280' }}>
                    🕐 Создана: {timeAgo(dealDetail.createdAt)}
                  </div>
                </div>
              )}
            </div>

            <div className="dp-side">
              {dealDetail.status === 'NEW' && (
                <div className="dp-state">
                  <span>📋</span>
                  <h3>Заявка создана</h3>
                  <p>Ожидаем когда мастер примет задачу в работу</p>
                </div>
              )}
              {dealDetail.status === 'COMPLETED' && (
                <div className="dp-state">
                  <span>✅</span>
                  <h3>Сделка завершена</h3>
                  <p>Обе стороны подтвердили выполнение</p>
                </div>
              )}
              {dealDetail.status === 'IN_PROGRESS' && (
                <>
                  <div className="dp-side-title">Подтверждение</div>
                  <p className="dp-side-hint">Завершится когда обе стороны подтвердят</p>
                  <div className="dp-ci-list">
                    {[
                      { confirmed: dealDetail.customerConfirmed, name: `Заказчик${im ? ' (вы)' : ''}` },
                      { confirmed: dealDetail.workerConfirmed,   name: `Мастер${!im ? ' (вы)' : ''}` },
                    ].map(({ confirmed, name }) => (
                      <div key={name} className={`dp-ci ${confirmed ? 'ok' : ''}`}>
                        <span>{confirmed ? '✅' : '⏳'}</span>
                        <div>
                          <div className="dp-ci-name">{name}</div>
                          <div className="dp-ci-status">{confirmed ? 'Подтвердил' : 'Ожидание'}</div>
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
                      ✓ Вы подтвердили{!otherOk && ' — ожидаем другую сторону…'}
                    </div>
                  )}
                  <Link to="/chat" className="dp-chat-btn">💬 Написать сообщение</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══ REQUEST DETAIL ══ */
  if (reqDetail) {
    const st      = REQ_STATUSES[reqDetail.status] || REQ_STATUSES.OPEN;
    const catName = getCatName(reqDetail.categoryId);

    return (
      <div>
        <div className="page-header-bar">
          <div className="container">
            <button className="cats-back-link" onClick={() => { setReqDetail(null); setOffers([]); }}>
              ← Назад к заказам
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:10 }}>
              {catName && (
                <div className="cat-page-icon" style={{ background: '#f3f4f6' }}>
                  📋
                </div>
              )}
              <div>
                <h1>{reqDetail.title}</h1>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4, flexWrap:'wrap' }}>
                  <span className="dp-badge" style={{ color: st.color, background: st.bg }}>
                    {st.emoji} {st.label}
                  </span>
                  {catName && (
                    <span style={{ fontSize:13, color:'var(--gray-400)' }}>🏷 {catName}</span>
                  )}
                  {reqDetail.budgetTo && (
                    <span style={{ fontSize:13, color:'var(--gray-500)', fontWeight:700 }}>
                      💰 до {Number(reqDetail.budgetTo).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="dp-grid">
            <div>
              {reqDetail.description && reqDetail.description !== 'Без описания' && (
                <div className="dp-card">
                  <div className="dp-card-label">Описание</div>
                  <p className="dp-desc">{reqDetail.description}</p>
                </div>
              )}
              {reqDetail.addressText && (
                <div className="dp-card">
                  <div className="dp-card-label">Адрес</div>
                  <p style={{ fontSize:14, color:'#374151' }}>📍 {reqDetail.addressText}</p>
                </div>
              )}
              <div className="dp-card">
                <div className="dp-card-label">Информация</div>
                <div style={{ fontSize:13, color:'#6b7280' }}>
                  🕐 Создана: {timeAgo(reqDetail.createdAt)}
                </div>
              </div>
            </div>

            <div className="dp-side">
              {reqDetail.status === 'OPEN' ? (
                <>
                  <div className="dp-side-title">Отклики мастеров</div>
                  <p className="dp-side-hint">Примите подходящий отклик — и начнётся сделка</p>
                  {offersLoading ? (
                    <div className="dp-skeleton" style={{ height:64, borderRadius:12 }} />
                  ) : offers.length === 0 ? (
                    <div className="dp-empty-offers">
                      <span>⏳</span>
                      <p>Мастера ещё не откликнулись. Обычно первые отклики приходят в течение 10 минут.</p>
                    </div>
                  ) : (
                    offers.map(offer => (
                      <div key={offer.id} className="dp-offer">
                        <div className="dp-offer-top">
                          <span className="dp-offer-price">
                            {Number(offer.price).toLocaleString('ru-RU')} ₽
                          </span>
                          {offer.estimatedDays && (
                            <span className="dp-offer-days">· {offer.estimatedDays} дн.</span>
                          )}
                        </div>
                        {offer.message && <p className="dp-offer-msg">{offer.message}</p>}
                        <div className="dp-offer-date">{timeAgo(offer.createdAt)}</div>
                        {offer.status === 'CREATED' && (
                          <div className="dp-offer-actions">
                            <button
                              className="dp-confirm-btn"
                              disabled={actionId === offer.id}
                              onClick={() => handleAccept(reqDetail, offer)}
                            >
                              {actionId === offer.id ? 'Принимаем…' : '✅ Принять'}
                            </button>
                            {(offer.workerUserId || offer.workerId) && (
                              <button
                                className="dp-chat-btn"
                                onClick={() => navigate(
                                  `/chat/${offer.workerUserId || offer.workerId}?jobRequestId=${reqDetail.id}`
                                )}
                              >
                                💬 Написать
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="dp-state">
                  <span>{st.emoji}</span>
                  <h3>{st.label}</h3>
                  <p>Статус заявки обновлён</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══ LIST ══ */
  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мои заказы</h1>
          <p>Заявки, активные сделки и завершённые работы</p>
        </div>
      </div>

      <div className="container" style={{ padding:'28px 0 60px' }}>

        {/* Tabs */}
        <div className="dpage-tabs">
          <button
            className={`dpage-tab ${tab === 'requests' ? 'active' : ''}`}
            onClick={() => setTab('requests')}
          >
            📋 Мои заявки
            <span className="dpage-tab-count">{activeRequests.length}</span>
          </button>
          <button
            className={`dpage-tab ${tab === 'deals' ? 'active' : ''}`}
            onClick={() => setTab('deals')}
          >
            🤝 Сделки
            <span className="dpage-tab-count">{deals.length}</span>
          </button>
        </div>

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <>
            <div className="dpage-filters">
              {[
                ['ALL',         'Все',       reqCounts.ALL],
                ['OPEN',        'Открытые',  reqCounts.OPEN],
                ['IN_PROGRESS', 'В работе',  reqCounts.IN_PROGRESS],
                ['COMPLETED',   'Завершены', reqCounts.COMPLETED],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  className={`dpage-filter-btn ${reqFilter === key ? 'active' : ''}`}
                  onClick={() => setReqFilter(key)}
                >
                  {label} <span>{count}</span>
                </button>
              ))}
              <Link to="/sections" className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }}>
                + Новая заявка
              </Link>
            </div>

            <div className="dpage-list">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="dp-skeleton" style={{ height:88 }} />)
              ) : filteredReqs.length === 0 ? (
                <div className="dpage-empty">
                  <span>📋</span>
                  <h3>Заявок нет</h3>
                  <p>Создайте заявку — мастера откликнутся в течение 10 минут</p>
                  <Link to="/sections" className="btn btn-primary btn-sm">Найти мастера</Link>
                </div>
              ) : (
                filteredReqs.map(req => {
                  const st = REQ_STATUSES[req.status] || REQ_STATUSES.OPEN;
                  return (
                    <div
                      key={req.id}
                      className="dpage-card"
                      onClick={() => { setReqDetail(req); loadOffers(req.id); }}
                    >
                      <div className="dpage-card-accent" style={{ background: st.color }} />
                      <div className="dpage-card-body">
                        <div className="dpage-card-top">
                          <div className="dpage-card-info">
                            <h3 className="dpage-card-title">{req.title}</h3>
                            <div className="dpage-card-meta">
                              {req.categoryId && <span>🏷 {getCatName(req.categoryId)}</span>}
                              {req.addressText && <span>📍 {req.addressText}</span>}
                              <span>🕐 {timeAgo(req.createdAt)}</span>
                            </div>
                          </div>
                          <div className="dpage-card-right">
                            <span className="dp-badge" style={{ color: st.color, background: st.bg }}>
                              {st.emoji} {st.label}
                            </span>
                            {req.budgetTo && (
                              <div className="dpage-card-price">
                                до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="dpage-card-chevron">›</div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── DEALS TAB ── */}
        {tab === 'deals' && (
          <>
            <div className="dpage-filters">
              {[
                ['ALL',         'Все',       dealCounts.ALL],
                ['IN_PROGRESS', 'В работе',  dealCounts.IN_PROGRESS],
                ['COMPLETED',   'Завершены', dealCounts.COMPLETED],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  className={`dpage-filter-btn ${dealFilter === key ? 'active' : ''}`}
                  onClick={() => setDealFilter(key)}
                >
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>

            <div className="dpage-list">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="dp-skeleton" style={{ height:88 }} />)
              ) : filteredDeals.length === 0 ? (
                <div className="dpage-empty">
                  <span>🤝</span>
                  <h3>Сделок пока нет</h3>
                  <p>Сделки появятся после того как вы примете отклик мастера</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setTab('requests')}>
                    Перейти к заявкам
                  </button>
                </div>
              ) : (
                filteredDeals.map(d => {
                  const st = DEAL_STATUSES[d.status] || DEAL_STATUSES.NEW;
                  const im = isCust(d);
                  return (
                    <div key={d.id} className="dpage-card" onClick={() => setDealDetail(d)}>
                      <div className="dpage-card-accent" style={{ background: st.color }} />
                      <div className="dpage-card-body">
                        <div className="dpage-card-top">
                          <div className="dpage-card-info">
                            <h3 className="dpage-card-title">{d.title || 'Задача'}</h3>
                            <div className="dpage-card-meta">
                              {d.category && <span>🏷 {d.category}</span>}
                              <span>👤 {im ? (d.workerName || 'Мастер не назначен') : d.customerName}</span>
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
                        {d.status === 'IN_PROGRESS' && (
                          <div className="dpage-card-progress">
                            <div className={`dp-prog ${d.customerConfirmed ? 'ok' : ''}`}>
                              {d.customerConfirmed ? '✅' : '⏳'} Заказчик
                            </div>
                            <span className="dp-prog-arrow">→</span>
                            <div className={`dp-prog ${d.workerConfirmed ? 'ok' : ''}`}>
                              {d.workerConfirmed ? '✅' : '⏳'} Мастер
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
          </>
        )}
      </div>
    </div>
  );
}
