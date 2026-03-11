import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenJobRequestsForWorker, createJobOffer, getReviewsByWorker, getMyWorkerServices, createWorkerService, updateWorkerService, deleteWorkerService } from '../api';
import { useAuth } from '../context/AuthContext';
import './WorkerProfilePage.css';

export default function WorkerProfilePage() {
  const { userId, userName, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [services, setServices] = useState([]);
  const [status,   setStatus]   = useState('loading');
  const [tab, setTab] = useState('requests'); // requests | reviews | services

  // Offer modal
  const [offerRequest, setOfferRequest] = useState(null);
  const [offerForm,    setOfferForm]    = useState({ price: '', comment: '' });
  const [offerStatus,  setOfferStatus]  = useState('idle');

  // Services
  const [svcForm, setSvcForm] = useState({ title: '', description: '', priceFrom: '', priceTo: '', active: true });
  const [svcStatus, setSvcStatus] = useState('idle'); // idle | sending | error
  const [svcEditId, setSvcEditId] = useState(null);

  const initials = (userName || 'Мастер').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);

  useEffect(() => {
    Promise.allSettled([
      getOpenJobRequestsForWorker(userId),
      getReviewsByWorker(userId),
      getMyWorkerServices(userId),
    ]).then(([reqRes, revRes, svcRes]) => {
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value);
      if (revRes.status === 'fulfilled') setReviews(revRes.value);
      if (svcRes.status === 'fulfilled') setServices(svcRes.value);
      setStatus('success');
    });
  }, [userId]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSendOffer = async () => {
    if (!offerForm.price) return;
    setOfferStatus('sending');
    try {
      await createJobOffer(userId, offerRequest.id, {
        price: Number(offerForm.price),
        comment: offerForm.comment,
      });
      setOfferStatus('done');
      setRequests(prev => prev.filter(r => r.id !== offerRequest.id));
    } catch {
      setOfferStatus('error');
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';

  const resetSvcForm = () => {
    setSvcForm({ title: '', description: '', priceFrom: '', priceTo: '', active: true });
    setSvcEditId(null);
    setSvcStatus('idle');
  };

  const submitSvc = async () => {
    if (!svcForm.title.trim()) return;
    setSvcStatus('sending');
    try {
      const payload = {
        title: svcForm.title.trim(),
        description: svcForm.description.trim() ? svcForm.description.trim() : null,
        priceFrom: svcForm.priceFrom ? Number(svcForm.priceFrom) : null,
        priceTo: svcForm.priceTo ? Number(svcForm.priceTo) : null,
        active: !!svcForm.active,
      };
      if (svcEditId) {
        await updateWorkerService(userId, svcEditId, payload);
      } else {
        await createWorkerService(userId, payload);
      }
      const fresh = await getMyWorkerServices(userId);
      setServices(fresh);
      resetSvcForm();
    } catch {
      setSvcStatus('error');
    }
  };

  const startEditSvc = (s) => {
    setSvcEditId(s.id);
    setSvcForm({
      title: s.title || '',
      description: s.description || '',
      priceFrom: s.priceFrom != null ? String(s.priceFrom) : '',
      priceTo: s.priceTo != null ? String(s.priceTo) : '',
      active: s.active !== false,
    });
    setSvcStatus('idle');
  };

  const removeSvc = async (id) => {
    if (!window.confirm('Удалить услугу?')) return;
    setSvcStatus('sending');
    try {
      await deleteWorkerService(userId, id);
      const fresh = await getMyWorkerServices(userId);
      setServices(fresh);
      if (svcEditId === id) resetSvcForm();
    } catch {
      setSvcStatus('error');
    }
    setSvcStatus('idle');
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Кабинет мастера</h1>
          <p>Заявки от заказчиков и ваш рейтинг</p>
        </div>
      </div>

      <div className="container">
        <div className="worker-layout">

          {/* ─── Sidebar ─── */}
          <aside>
            <div className="worker-card">
              <div className="worker-avatar">{initials}</div>
              <div className="worker-name">{userName || 'Мастер'}</div>
              <div className="worker-role-badge">Мастер</div>

              <div className="worker-stats">
                <div className="worker-stat">
                  <div className="worker-stat-num">{avgRating}</div>
                  <div className="worker-stat-lbl">Рейтинг</div>
                </div>
                <div className="worker-stat">
                  <div className="worker-stat-num">{reviews.length}</div>
                  <div className="worker-stat-lbl">Отзывов</div>
                </div>
                <div className="worker-stat">
                  <div className="worker-stat-num">{requests.length}</div>
                  <div className="worker-stat-lbl">Заявок</div>
                </div>
              </div>

              <button className="btn btn-outline btn-full worker-logout-btn" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </aside>

          {/* ─── Main ─── */}
          <div>
            {/* Tabs */}
            <div className="worker-tabs">
              <button className={`worker-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
                📋 Открытые заявки
                {requests.length > 0 && <span className="worker-tab-badge">{requests.length}</span>}
              </button>
              <button className={`worker-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
                ⭐ Мои отзывы
                {reviews.length > 0 && <span className="worker-tab-badge">{reviews.length}</span>}
              </button>
              <button className={`worker-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>
                🧰 Мои услуги
                {services.length > 0 && <span className="worker-tab-badge">{services.length}</span>}
              </button>
            </div>

            {/* ── Requests tab ── */}
            {tab === 'requests' && (
              <div>
                {status === 'loading' && (
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:100, borderRadius:16}} />)}
                  </div>
                )}

                {status === 'success' && requests.length === 0 && (
                  <div className="card empty-state">
                    <span className="empty-state-icon">🔍</span>
                    <h3>Новых заявок нет</h3>
                    <p>Когда заказчики создадут задачи в ваших категориях, они появятся здесь</p>
                  </div>
                )}

                {requests.map((req, i) => (
                  <div className="worker-request-card fade-up" key={req.id} style={{animationDelay:`${i*0.05}s`}}>
                    <div className="worker-req-top">
                      <h3 className="worker-req-title">{req.title || 'Задача'}</h3>
                      {req.budget && (
                        <span className="worker-req-budget">до {Number(req.budget).toLocaleString('ru-RU')} ₽</span>
                      )}
                    </div>
                    {req.description && <p className="worker-req-desc">{req.description}</p>}
                    <div className="worker-req-meta">
                      {req.address && <span>📍 {req.address}</span>}
                      {req.categoryName && <span>🏷️ {req.categoryName}</span>}
                      {req.createdAt && <span>🕐 {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setOfferRequest(req); setOfferForm({price:'',comment:''}); setOfferStatus('idle'); }}
                    >
                      💬 Откликнуться
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Reviews tab ── */}
            {tab === 'reviews' && (
              <div>
                {reviews.length === 0 && (
                  <div className="card empty-state">
                    <span className="empty-state-icon">⭐</span>
                    <h3>Отзывов пока нет</h3>
                    <p>Завершите первые сделки, чтобы получить отзывы</p>
                  </div>
                )}
                {reviews.map((rev, i) => (
                  <div className="worker-review-card fade-up" key={rev.id || i} style={{animationDelay:`${i*0.05}s`}}>
                    <div className="worker-review-top">
                      <div className="worker-review-stars">
                        {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                      </div>
                      <span className="worker-review-date">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('ru-RU') : ''}
                      </span>
                    </div>
                    {rev.comment && <p className="worker-review-text">{rev.comment}</p>}
                    {rev.customerName && <div className="worker-review-author">— {rev.customerName}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* ── Services tab ── */}
            {tab === 'services' && (
              <div>
                <div className="card" style={{ padding: 16, marginBottom: 14 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 10 }}>{svcEditId ? 'Редактировать услугу' : 'Добавить услугу'}</h3>
                  <div className="form-field">
                    <label className="form-label">Название *</label>
                    <input className="form-input" value={svcForm.title} onChange={e => setSvcForm({ ...svcForm, title: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Описание</label>
                    <textarea className="form-input form-textarea" value={svcForm.description} onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-field">
                      <label className="form-label">Цена от, ₽</label>
                      <input className="form-input" type="number" value={svcForm.priceFrom} onChange={e => setSvcForm({ ...svcForm, priceFrom: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Цена до, ₽</label>
                      <input className="form-input" type="number" value={svcForm.priceTo} onChange={e => setSvcForm({ ...svcForm, priceTo: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 8 }}>
                    <input
                      id="svc-active"
                      type="checkbox"
                      checked={!!svcForm.active}
                      onChange={e => setSvcForm({ ...svcForm, active: e.target.checked })}
                    />
                    <label htmlFor="svc-active" style={{ fontSize: 13, color: 'var(--gray-600)' }}>Показывать клиентам</label>
                  </div>
                  {svcStatus === 'error' && <div className="cat-form-error">Не удалось сохранить</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" onClick={submitSvc} disabled={!svcForm.title.trim() || svcStatus === 'sending'}>
                      {svcStatus === 'sending' ? 'Сохраняем…' : (svcEditId ? 'Сохранить' : 'Добавить')}
                    </button>
                    {(svcEditId || svcForm.title || svcForm.description || svcForm.priceFrom || svcForm.priceTo) && (
                      <button className="btn btn-outline" onClick={resetSvcForm}>Сбросить</button>
                    )}
                  </div>
                </div>

                {services.length === 0 ? (
                  <div className="card empty-state">
                    <span className="empty-state-icon">🧰</span>
                    <h3>Услуг пока нет</h3>
                    <p>Добавьте 2–3 услуги — клиентам будет проще написать вам и понять цены</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {services.map(s => (
                      <div className="card" key={s.id} style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: 'var(--gray-800)', marginBottom: 4 }}>
                            {s.title} {!s.active && <span style={{ fontWeight: 700, color: 'var(--gray-400)' }}>(скрыто)</span>}
                          </div>
                          {s.description && <div style={{ color: 'var(--gray-600)', fontSize: 13, marginBottom: 6 }}>{s.description}</div>}
                          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--gray-500)' }}>
                            {(s.priceFrom != null || s.priceTo != null) ? (
                              <span>
                                💰 {s.priceFrom != null ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : ''}
                                {s.priceFrom != null && s.priceTo != null ? ' ' : ''}
                                {s.priceTo != null ? `до ${Number(s.priceTo).toLocaleString('ru-RU')} ₽` : ''}
                              </span>
                            ) : (
                              <span>💰 Цена договорная</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => startEditSvc(s)}>Редактировать</button>
                          <button className="btn btn-outline btn-sm" onClick={() => removeSvc(s.id)}>Удалить</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Offer Modal ─── */}
      {offerRequest && (
        <div className="modal-overlay" onClick={() => setOfferRequest(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            {offerStatus === 'done' ? (
              <div className="modal-success">
                <span>✅</span>
                <h3>Отклик отправлен!</h3>
                <p style={{fontSize:13, color:'var(--gray-500)', textAlign:'center'}}>Заказчик рассматривает предложения</p>
                <button className="btn btn-primary btn-sm" onClick={() => setOfferRequest(null)}>Закрыть</button>
              </div>
            ) : (
              <>
                <h3 className="modal-title">Откликнуться на задачу</h3>
                <p className="modal-sub">{offerRequest.title}</p>

                <div className="form-field">
                  <label className="form-label">Ваша цена, ₽ *</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Например: 2500"
                    value={offerForm.price}
                    onChange={e => setOfferForm({...offerForm, price: e.target.value})}
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Комментарий</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Расскажите о себе, опыте, когда можете приехать…"
                    value={offerForm.comment}
                    onChange={e => setOfferForm({...offerForm, comment: e.target.value})}
                  />
                </div>

                {offerStatus === 'error' && (
                  <div className="cat-form-error">Не удалось отправить отклик</div>
                )}

                <div style={{display:'flex',gap:10}}>
                  <button
                    className="btn btn-primary"
                    onClick={handleSendOffer}
                    disabled={!offerForm.price || offerStatus === 'sending'}
                  >
                    {offerStatus === 'sending' ? 'Отправляем…' : 'Отправить отклик'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setOfferRequest(null)}>Отмена</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}