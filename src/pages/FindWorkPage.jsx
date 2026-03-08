import React, { useEffect, useState, useCallback } from 'react';
import { getOpenJobRequestsForWorker, createJobOffer, getMyDeals, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import './FindWorkPage.css';

export default function FindWorkPage() {
  const { userId } = useAuth();

  const [tab, setTab] = useState('feed'); // feed | deals
  const [requests, setRequests] = useState([]);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [catFilter, setCatFilter] = useState('ALL');

  // Offer modal
  const [offerReq, setOfferReq] = useState(null);
  const [offerForm, setOfferForm] = useState({ price: '', comment: '', days: '' });
  const [offerStatus, setOfferStatus] = useState('idle');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [reqs, myDeals, cats] = await Promise.all([
        getOpenJobRequestsForWorker(userId),
        getMyDeals(userId).catch(() => []),
        getCategories(),
      ]);
      setRequests(reqs);
      setDeals(myDeals);
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

  const filteredRequests = catFilter === 'ALL'
    ? requests
    : requests.filter(r => r.categoryId === catFilter);

  const handleSendOffer = async () => {
    if (!offerForm.price || !offerReq) return;
    setOfferStatus('sending');
    try {
      await createJobOffer(userId, offerReq.id, {
        price: Number(offerForm.price),
        comment: offerForm.comment,
        estimatedDays: offerForm.days ? Number(offerForm.days) : null,
      });
      setOfferStatus('done');
      // Remove from feed
      setRequests(prev => prev.filter(r => r.id !== offerReq.id));
    } catch {
      setOfferStatus('error');
    }
  };

  const DEAL_STATUS = {
    NEW: { label: 'Новая', cls: 'badge-new' },
    IN_PROGRESS: { label: 'В работе', cls: 'badge-progress' },
    COMPLETED: { label: 'Выполнена', cls: 'badge-done' },
    CANCELLED: { label: 'Отменена', cls: 'badge-failed' },
  };

  // Unique categories from current requests for filter
  const feedCats = [...new Set(requests.map(r => r.categoryId))];

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Найти работу</h1>
          <p>Открытые заявки и ваши сделки</p>
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className="fw-tabs">
          <button className={`fw-tab ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')}>
            📋 Лента заявок
            {requests.length > 0 && <span className="fw-tab-badge">{requests.length}</span>}
          </button>
          <button className={`fw-tab ${tab === 'deals' ? 'active' : ''}`} onClick={() => setTab('deals')}>
            🤝 Мои сделки
            {deals.length > 0 && <span className="fw-tab-badge">{deals.length}</span>}
          </button>
        </div>

        {/* ═══ FEED TAB ═══ */}
        {tab === 'feed' && (
          <div>
            {/* Category filter */}
            {feedCats.length > 1 && (
              <div className="fw-cat-filters">
                <button
                  className={`fw-cat-btn ${catFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setCatFilter('ALL')}
                >
                  Все категории
                </button>
                {feedCats.map(catId => (
                  <button
                    key={catId}
                    className={`fw-cat-btn ${catFilter === catId ? 'active' : ''}`}
                    onClick={() => setCatFilter(catId)}
                  >
                    {getCategoryName(catId) || 'Другое'}
                  </button>
                ))}
              </div>
            )}

            {status === 'loading' && (
              <div className="fw-list">
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
              </div>
            )}

            {status === 'error' && (
              <div className="orders-error">
                <p>Не удалось загрузить заявки</p>
                <button className="btn btn-primary btn-sm" onClick={load}>Повторить</button>
              </div>
            )}

            {status === 'success' && filteredRequests.length === 0 && (
              <div className="card empty-state">
                <span className="empty-state-icon">🔍</span>
                <h3>Новых заявок нет</h3>
                <p>Когда заказчики создадут задачи, они появятся здесь</p>
              </div>
            )}

            {status === 'success' && filteredRequests.length > 0 && (
              <div className="fw-list">
                {filteredRequests.map((req, i) => {
                  const catName = getCategoryName(req.categoryId);
                  return (
                    <div className="fw-card fade-up" key={req.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="fw-card-top">
                        <div className="fw-card-info">
                          <h3 className="fw-card-title">{req.title}</h3>
                          <div className="fw-card-meta">
                            {catName && <span>🏷️ {catName}</span>}
                            {req.addressText && <span>📍 {req.addressText}</span>}
                            {req.city && <span>🏙️ {req.city}</span>}
                            {req.createdAt && <span>🕐 {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>}
                          </div>
                        </div>
                        {req.budgetTo && (
                          <span className="fw-card-budget">до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</span>
                        )}
                      </div>
                      {req.description && req.description !== 'Без описания' && (
                        <p className="fw-card-desc">{req.description}</p>
                      )}
                      <div className="fw-card-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setOfferReq(req);
                            setOfferForm({ price: '', comment: '', days: '' });
                            setOfferStatus('idle');
                          }}
                        >
                          💬 Откликнуться
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ DEALS TAB ═══ */}
        {tab === 'deals' && (
          <div>
            {deals.length === 0 && (
              <div className="card empty-state">
                <span className="empty-state-icon">🤝</span>
                <h3>Сделок пока нет</h3>
                <p>Откликайтесь на заявки — когда заказчик примет ваш отклик, здесь появится сделка</p>
              </div>
            )}
            <div className="fw-list">
              {deals.map((deal, i) => {
                const st = DEAL_STATUS[deal.status] || { label: deal.status, cls: 'badge-new' };
                return (
                  <div className="fw-card fade-up" key={deal.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="fw-card-top">
                      <div className="fw-card-info">
                        <h3 className="fw-card-title">Сделка</h3>
                        <div className="fw-card-meta">
                          <span>🕐 {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('ru-RU') : '—'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                        <span className="fw-card-budget">
                          {deal.agreedPrice ? `${Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ OFFER MODAL ═══ */}
      {offerReq && (
        <div className="modal-overlay" onClick={() => setOfferReq(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            {offerStatus === 'done' ? (
              <div className="modal-success">
                <span>✅</span>
                <h3>Отклик отправлен!</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', textAlign: 'center' }}>Заказчик рассматривает предложения</p>
                <button className="btn btn-primary btn-sm" onClick={() => setOfferReq(null)}>Закрыть</button>
              </div>
            ) : (
              <>
                <h3 className="modal-title">Откликнуться на задачу</h3>
                <p className="modal-sub">{offerReq.title}</p>
                {offerReq.budgetTo && (
                  <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>
                    Бюджет заказчика: до {Number(offerReq.budgetTo).toLocaleString('ru-RU')} ₽
                  </p>
                )}

                <div className="form-field">
                  <label className="form-label">Ваша цена, ₽ *</label>
                  <input className="form-input" type="number" placeholder="Например: 2500"
                    value={offerForm.price}
                    onChange={e => setOfferForm({ ...offerForm, price: e.target.value })} />
                </div>

                <div className="form-field">
                  <label className="form-label">Срок выполнения (дней)</label>
                  <input className="form-input" type="number" placeholder="Не обязательно"
                    value={offerForm.days}
                    onChange={e => setOfferForm({ ...offerForm, days: e.target.value })} />
                </div>

                <div className="form-field">
                  <label className="form-label">Сообщение заказчику</label>
                  <textarea className="form-input form-textarea"
                    placeholder="Расскажите о себе, опыте, когда можете приехать…"
                    value={offerForm.comment}
                    onChange={e => setOfferForm({ ...offerForm, comment: e.target.value })} />
                </div>

                {offerStatus === 'error' && (
                  <div className="orders-error" style={{ marginBottom: 12 }}>Не удалось отправить отклик</div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary"
                    onClick={handleSendOffer}
                    disabled={!offerForm.price || offerStatus === 'sending'}>
                    {offerStatus === 'sending' ? 'Отправляем…' : 'Отправить отклик'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setOfferReq(null)}>Отмена</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}