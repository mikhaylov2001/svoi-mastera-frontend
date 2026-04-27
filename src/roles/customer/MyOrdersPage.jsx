import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [tab, setTab] = useState('active'); // active | archive
  const [copyFlashId, setCopyFlashId] = useState(null);

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
      const data = await getOffersForRequest(reqId);
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

  const isActiveStatus = (s) => ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED', 'IN_PROGRESS'].includes(s);
  const active = requests.filter(r => isActiveStatus(r.status));
  const archive = requests.filter(r => !isActiveStatus(r.status));
  const filtered = tab === 'active' ? active : archive;

  const copyRequestLink = (reqId, e) => {
    e?.stopPropagation?.();
    const url = `${window.location.origin}/my-requests?request=${reqId}`;
    const done = () => {
      setCopyFlashId(reqId);
      window.setTimeout(() => setCopyFlashId((cur) => (cur === reqId ? null : cur)), 2200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done);
    } else {
      done();
    }
  };

  return (
    <div className="my-req-page">
      <div className="my-req-hero">
        <img
          className="my-req-hero-img"
          src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80"
          alt=""
        />
        <div className="my-req-hero-overlay" />
        <div className="my-req-hero-body container">
          <div>
            <h1>Мои заявки</h1>
            <p>Управляйте заявками и откликами мастеров</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/sections')}>
            + Разместить заявку
          </button>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 0 60px' }}>
        <div className="orders-main">
          <div className="orders-filter-tabs">
            <button className={`filter-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
              Активные <span className="filter-tab-count">{active.length}</span>
            </button>
            <button className={`filter-tab ${tab === 'archive' ? 'active' : ''}`} onClick={() => setTab('archive')}>
              Архив <span className="filter-tab-count">{archive.length}</span>
            </button>
          </div>

          <div className="orders-list-header">
            <span className="orders-list-count">{filtered.length} заявок</span>
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
                <h3>{tab === 'active' ? 'Нет активных заявок' : 'Архив пуст'}</h3>
                <p>{tab === 'active' ? 'Разместите заявку, чтобы мастера откликнулись' : 'Завершенные и закрытые заявки будут здесь'}</p>
                {tab === 'active' && <button className="btn btn-primary" onClick={() => navigate('/sections')}>Разместить заявку</button>}
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
                      <div className="order-row-main">
                        <div className="order-card-info">
                          <h3 className="order-card-title">{req.title}</h3>
                          <div className="order-card-meta">
                            {catName && <span>{catName}</span>}
                            {req.addressText && <span>{req.addressText}</span>}
                            {req.createdAt && <span>{new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>}
                          </div>
                          {req.description && req.description !== 'Без описания' && (
                            <p className="order-card-desc">{req.description}</p>
                          )}
                          <div className="order-row-stats">
                            <span><b>{offersLoading && expandedId === req.id ? '...' : (isExpanded ? offers.length : 0)}</b> откликов</span>
                            <span><b>{stLabel}</b></span>
                          </div>
                        </div>
                        <div className="order-card-right order-actions">
                          <span className={`badge ${stCls}`}>{stLabel}</span>
                          {req.budgetTo && (
                            <span className="order-card-price">до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</span>
                          )}
                          {req.status === 'OPEN' && (
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/sections')}>
                              Редактировать
                            </button>
                          )}
                          <button className="btn btn-outline btn-sm" onClick={(e) => copyRequestLink(req.id, e)}>
                            {copyFlashId === req.id ? 'Ссылка скопирована' : 'Копировать ссылку'}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => toggleOffers(req.id)}
                          >
                            {isExpanded ? 'Скрыть отклики' : 'Смотреть отклики'}
                          </button>
                        </div>
                      </div>

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

                          {!offersLoading && offers.map(offer => {
                            const agreedPrice = req.budgetTo && Number(offer.price) === Number(req.budgetTo);
                            const cheaper = req.budgetTo && Number(offer.price) < Number(req.budgetTo);
                            return (
                            <div
                              className="offer-card"
                              key={offer.id}
                              style={agreedPrice ? { borderColor: '#22c55e', background: '#f0fdf4' } : {}}
                            >
                              <div className="offer-card-top">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="offer-card-price">{Number(offer.price).toLocaleString('ru-RU')} ₽</span>
                                    {offer.estimatedDays && (
                                      <span className="offer-card-days">· {offer.estimatedDays} дн.</span>
                                    )}
                                    {agreedPrice && (
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 12 }}>
                                        ✅ Принял вашу цену
                                      </span>
                                    )}
                                    {cheaper && !agreedPrice && (
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 12 }}>
                                        −{(Number(req.budgetTo) - Number(offer.price)).toLocaleString('ru-RU')} ₽ дешевле
                                      </span>
                                    )}
                                    {req.budgetTo && Number(offer.price) > Number(req.budgetTo) && (
                                      <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: 12 }}>
                                        +{(Number(offer.price) - Number(req.budgetTo)).toLocaleString('ru-RU')} ₽ к бюджету
                                      </span>
                                    )}
                                  </div>
                                  {offer.workerName && (
                                    <div style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{offer.workerName}</div>
                                  )}
                                </div>
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={actionLoading === offer.id}
                                  onClick={() => handleAccept(offer.id)}
                                >
                                  {actionLoading === offer.id ? '...' : 'Принять'}
                                </button>
                              </div>
                              {offer.message && (
                                <p className="offer-card-msg">{offer.message}</p>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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