import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyJobRequests, getOffersForRequest, acceptOffer, getCategories } from '../../api';
import { useAuth } from '../../context/AuthContext';
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

  // ✨ НОВОЕ: модальное окно для просмотра фото
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState(null);

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
    } catch (err) {
      console.error('Load requests error:', err);
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '';
  };

  const toggleOffers = async (reqId) => {
    if (expandedId === reqId) {
      setExpandedId(null);
      setOffers([]);
      return;
    }

    setExpandedId(reqId);
    setOffersLoading(true);
    try {
      const data = await getOffersForRequest(userId, reqId);
      setOffers(data || []);
    } catch (err) {
      console.error('Load offers error:', err);
      setOffers([]);
    }
    setOffersLoading(false);
  };

  const handleAccept = async (offerId) => {
    const conf = window.confirm('Принять этот отклик и начать работу с мастером?');
    if (!conf) return;

    setActionLoading(offerId);
    try {
      await acceptOffer(userId, offerId);
      await load();
      setExpandedId(null);
      setOffers([]);
    } catch (err) {
      alert('Ошибка при принятии отклика: ' + (err.message || ''));
    }
    setActionLoading(null);
  };

  const counts = {
    ALL: requests.length,
    OPEN: requests.filter(r => r.status === 'OPEN').length,
    IN_PROGRESS: requests.filter(r => r.status === 'IN_PROGRESS').length,
    COMPLETED: requests.filter(r => r.status === 'COMPLETED').length,
  };

  const filtered = filter === 'ALL'
    ? requests
    : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мои заказы</h1>
          <p>Заявки, активные сделки и завершённые работы</p>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 0 60px' }}>
        <div className="orders-grid">
          <div className="orders-main">
            <div className="orders-filter-tabs">
              {[
                ['ALL', 'Все', counts.ALL],
                ['OPEN', 'Открытые', counts.OPEN],
                ['IN_PROGRESS', 'В работе', counts.IN_PROGRESS],
                ['COMPLETED', 'Завершённые', counts.COMPLETED],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  className={`filter-tab ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label} <span className="filter-tab-count">{count}</span>
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

                      {/* ✨ НОВОЕ: Отображение фотографий */}
                      {req.photos && req.photos.length > 0 && (
                        <div className="order-photos-grid">
                          {req.photos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="order-photo-item"
                              onClick={() => setLightboxPhoto(photo)}
                            >
                              <img src={photo} alt={`Фото ${idx + 1}`} />
                              <div className="order-photo-overlay">
                                <span>🔍</span>
                              </div>
                            </div>
                          ))}
                        </div>
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
                                      {Number(offer.price) < Number(req.budgetTo)
                                        ? `−${Number(req.budgetTo) - Number(offer.price)} ₽`
                                        : `+${Number(offer.price) - Number(req.budgetTo)} ₽`}
                                    </span>
                                  )}
                                </div>
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={actionLoading === offer.id}
                                  onClick={() => handleAccept(offer.id)}
                                >
                                  {actionLoading === offer.id ? '⏳' : 'Принять'}
                                </button>
                              </div>
                              {offer.message && (
                                <p className="offer-card-msg">{offer.message}</p>
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

          <div className="orders-sidebar">
            <Link to="/sections" className="btn btn-primary btn-full orders-new-btn">
              + Новая заявка
            </Link>

            <div className="card sidebar-tip">
              <h4>💡 Совет</h4>
              <p>Добавляйте фотографии к заявкам — это помогает мастерам точнее оценить объём работы и предложить лучшую цену.</p>
            </div>

            <div className="card sidebar-tip">
              <h4>⚡ Быстрый отклик</h4>
              <p>Первые отклики обычно поступают в течение 10 минут после публикации заявки.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ НОВОЕ: Lightbox для просмотра фото */}
      {lightboxPhoto && (
        <div className="photo-lightbox" onClick={() => setLightboxPhoto(null)}>
          <div className="photo-lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="photo-lightbox-close" onClick={() => setLightboxPhoto(null)}>
              ×
            </button>
            <img src={lightboxPhoto} alt="Просмотр фото" />
          </div>
        </div>
      )}
    </div>
  );
}