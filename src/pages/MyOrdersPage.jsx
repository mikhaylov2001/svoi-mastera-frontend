import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyJobRequests, getOffersForRequest, acceptOffer, getCategories, sendMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import './MyOrdersPage.css';

const STATUS_LABELS = {
  DRAFT: 'Черновик',
  OPEN: 'Открыта',
  IN_NEGOTIATION: 'Обсуждение',
  ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнена',
  CANCELLED: 'Отменена',
  EXPIRED: 'Истекла',
};
const STATUS_CLS = {
  OPEN: 'badge-new',
  IN_PROGRESS: 'badge-progress',
  COMPLETED: 'badge-done',
  CANCELLED: 'badge-failed',
  EXPIRED: 'badge-failed',
};

export default function MyOrdersPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [filter, setFilter] = useState('ALL');

  // Expanded request (show offers)
  const [expandedId, setExpandedId] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState(null);
  const [offerMessageDraft, setOfferMessageDraft] = useState({});
  const [offerMessageStatus, setOfferMessageStatus] = useState({});
  const [offerMessageError, setOfferMessageError] = useState({});

  const sendOfferMessage = async (req, offer) => {
    const receiverId = offer.workerUserId || offer.workerId;
    const text = (offerMessageDraft[offer.id] || '').trim();
    if (!receiverId || !text) return;
    setOfferMessageStatus(prev => ({ ...prev, [offer.id]: 'sending' }));
    setOfferMessageError(prev => ({ ...prev, [offer.id]: '' }));
    try {
      await sendMessage(userId, receiverId, text, req.id);
      setOfferMessageDraft(prev => ({ ...prev, [offer.id]: '' }));
      setOfferMessageStatus(prev => ({ ...prev, [offer.id]: 'sent' }));
    } catch (e) {
      setOfferMessageStatus(prev => ({ ...prev, [offer.id]: 'error' }));
      setOfferMessageError(prev => ({ ...prev, [offer.id]: e?.message || 'Ошибка отправки сообщения' }));
    }
  };

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [reqs, cats] = await Promise.all([
        getMyJobRequests(userId),
        getCategories(),
      ]);
      setRequests(reqs);
      setCategories(cats);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  const toggleOffers = async (reqId) => {
    if (expandedId === reqId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(reqId);
    setOffersLoading(true);
    try {
      const data = await getOffersForRequest(reqId);
      setOffers(data);
    } catch {
      setOffers([]);
    }
    setOffersLoading(false);
  };

  const handleAccept = async (req, offer) => {
    setActionLoading(offer.id);
    try {
      await acceptOffer(userId, req.id, offer.id);
      await load();
      setExpandedId(null);
    } catch { /* handled by api.js */ }
    setActionLoading(null);
  };

  const counts = {
    ALL: requests.length,
    OPEN: requests.filter(r => r.status === 'OPEN').length,
    IN_PROGRESS: requests.filter(r => ['IN_PROGRESS', 'ASSIGNED', 'IN_NEGOTIATION'].includes(r.status)).length,
    COMPLETED: requests.filter(r => r.status === 'COMPLETED').length,
  };

  const filtered = filter === 'ALL'
    ? requests
    : filter === 'IN_PROGRESS'
      ? requests.filter(r => ['IN_PROGRESS', 'ASSIGNED', 'IN_NEGOTIATION'].includes(r.status))
      : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мои заказы</h1>
          <p>Ваши заявки и отклики мастеров</p>
        </div>
      </div>

      <div className="container">
        <div className="orders-layout">

          {/* Sidebar filters */}
          <aside className="orders-sidebar">
            <div className="orders-sidebar-title">Статус</div>
            {[
              ['ALL', 'Все заявки'],
              ['OPEN', 'Открытые'],
              ['IN_PROGRESS', 'В работе'],
              ['COMPLETED', 'Выполнены'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`orders-filter-btn ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="orders-filter-count">{counts[key] ?? 0}</span>
              </button>
            ))}
            <div className="orders-sidebar-divider" />
            <Link to="/sections" className="btn btn-primary btn-full">+ Новая заявка</Link>
          </aside>

          {/* Main */}
          <div className="orders-main">

            {/* Mobile filters */}
            <div className="orders-mobile-filters">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map(key => (
                <button
                  key={key}
                  className={`orders-mobile-filter ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {key === 'ALL' ? 'Все' : key === 'OPEN' ? 'Открытые' : key === 'IN_PROGRESS' ? 'В работе' : 'Выполнены'}
                  <span>{counts[key] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="orders-list-header">
              <span className="orders-list-count">{filtered.length} заявок</span>
              <Link to="/sections" className="btn btn-primary btn-sm orders-new-btn-mobile">+ Новая</Link>
            </div>

            {status === 'loading' && (
              <div className="orders-list">
                {[1, 2, 3].map(i => (
                  <div key={i} className="order-skeleton">
                    <div className="skeleton" style={{ width: '55%', height: 18, marginBottom: 10 }} />
                    <div className="skeleton" style={{ width: '90%', height: 14, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: '40%', height: 14 }} />
                  </div>
                ))}
              </div>
            )}

            {status === 'error' && (
              <div className="orders-error">
                <p>Не удалось загрузить заявки</p>
                <button className="btn btn-primary btn-sm" onClick={load}>Повторить</button>
              </div>
            )}

            {status === 'success' && filtered.length === 0 && (
              <div className="card empty-state">
                <span className="empty-state-icon">📋</span>
                <h3>Заявок пока нет</h3>
                <p>Создайте первую заявку — мастера откликнутся</p>
                <Link to="/sections" className="btn btn-primary">Найти мастера</Link>
              </div>
            )}

            {status === 'success' && filtered.length > 0 && (
              <div className="orders-list">
                {filtered.map((req, i) => {
                  const stLabel = STATUS_LABELS[req.status] || req.status;
                  const stCls = STATUS_CLS[req.status] || 'badge-new';
                  const isExpanded = expandedId === req.id;
                  const catName = getCategoryName(req.categoryId);

                  return (
                    <div className={`order-card fade-up ${isExpanded ? 'expanded' : ''}`} key={req.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="order-card-top">
                        <div className="order-card-info">
                          <h3 className="order-card-title">{req.title}</h3>
                          <div className="order-card-meta">
                            {catName && <span>🏷️ {catName}</span>}
                            {req.addressText && <span>📍 {req.addressText}</span>}
                            {req.createdAt && <span>🕐 {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>}
                          </div>
                        </div>
                        <div className="order-card-right">
                          <span className={`badge ${stCls}`}>{stLabel}</span>
                          {req.budgetTo && (
                            <span className="order-card-price">до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</span>
                          )}
                        </div>
                      </div>

                      {req.description && req.description !== 'Без описания' && (
                        <p className="order-card-desc">{req.description}</p>
                      )}

                      <div className="order-card-actions">
                        {req.status === 'OPEN' && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => toggleOffers(req.id)}
                          >
                            {isExpanded ? '▲ Скрыть отклики' : '📩 Смотреть отклики'}
                          </button>
                        )}
                      </div>

                      {/* Offers panel */}
                      {isExpanded && (
                        <div className="order-offers-panel">
                          <div className="order-offers-title">Отклики мастеров</div>

                          {offersLoading && (
                            <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
                          )}

                          {!offersLoading && offers.length === 0 && (
                            <p className="order-offers-empty">Откликов пока нет. Мастера увидят вашу заявку и предложат цену.</p>
                          )}

                          {!offersLoading && offers.map(offer => (
                            <div className="offer-card" key={offer.id}>
                              <div className="offer-card-top">
                                <div>
                                  <span className="offer-card-price">{Number(offer.price).toLocaleString('ru-RU')} ₽</span>
                                  {offer.estimatedDays && (
                                    <span className="offer-card-days"> · {offer.estimatedDays} дн.</span>
                                  )}
                                  {req.budgetTo && Number(offer.price) !== Number(req.budgetTo) && (
                                    <span className="offer-card-diff">
                                      {Number(offer.price) <= Number(req.budgetTo) ? ' ✓ дешевле' : ' ↑ дороже'}
                                    </span>
                                  )}
                                  {req.budgetTo && Number(offer.price) === Number(req.budgetTo) && (
                                    <span className="offer-card-match"> ✓ ваша цена</span>
                                  )}
                                </div>
                                <span className={`badge ${offer.status === 'ACCEPTED' ? 'badge-done' : 'badge-new'}`}>
                                  {offer.status === 'ACCEPTED' ? 'Принят' : offer.status === 'REJECTED' ? 'Отклонён' : 'Новый'}
                                </span>
                              </div>
                              {offer.message && <p className="offer-card-msg">{offer.message}</p>}
                              <div className="offer-card-date">
                                {offer.createdAt && new Date(offer.createdAt).toLocaleDateString('ru-RU')}
                              </div>
                              {offer.status === 'CREATED' && (
                                <div className="offer-card-actions" style={{ flexDirection: 'column', gap: 8 }}>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      disabled={actionLoading === offer.id}
                                      onClick={() => handleAccept(req, offer)}
                                    >
                                      {actionLoading === offer.id ? 'Принимаем…' : '✅ Принять'}
                                    </button>
                                    {(offer.workerUserId || offer.workerId) && (
                                      <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setOfferMessageDraft(prev => ({ ...prev, [offer.id]: prev[offer.id] ?? '' }))}
                                      >
                                        💬 Написать прямо здесь
                                      </button>
                                    )}
                                  </div>

                                  {(offer.workerUserId || offer.workerId) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <textarea
                                        rows={2}
                                        className="form-input"
                                        style={{ fontSize: 13, borderRadius: 8, minHeight: 64 }}
                                        placeholder="Написать сообщение мастеру..."
                                        value={offerMessageDraft[offer.id] || ''}
                                        onChange={(e) => setOfferMessageDraft(prev => ({ ...prev, [offer.id]: e.target.value }))}
                                      />
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button
                                          className="btn btn-primary btn-sm"
                                          disabled={offerMessageStatus[offer.id] === 'sending' || !(offerMessageDraft[offer.id] || '').trim()}
                                          onClick={() => sendOfferMessage(req, offer)}
                                        >
                                          {offerMessageStatus[offer.id] === 'sending' ? 'Отправка…' : 'Отправить'}
                                        </button>
                                        {offerMessageStatus[offer.id] === 'sent' && (
                                          <span style={{ color: '#2b8a3e', fontSize: 13 }}>Отправлено</span>
                                        )}
                                        {offerMessageStatus[offer.id] === 'error' && (
                                          <span style={{ color: '#b91c1c', fontSize: 13 }}>{offerMessageError[offer.id]}</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}