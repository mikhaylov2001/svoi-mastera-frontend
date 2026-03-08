import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenJobRequestsForWorker, createJobOffer, getReviewsByWorker } from '../api';
import { useAuth } from '../context/AuthContext';
import './WorkerProfilePage.css';

export default function WorkerProfilePage() {
  const { userId, userName, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [status,   setStatus]   = useState('loading');
  const [tab, setTab] = useState('requests'); // requests | reviews

  // Offer modal
  const [offerRequest, setOfferRequest] = useState(null);
  const [offerForm,    setOfferForm]    = useState({ price: '', comment: '' });
  const [offerStatus,  setOfferStatus]  = useState('idle');

  const initials = (userName || 'Мастер').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);

  useEffect(() => {
    Promise.allSettled([
      getOpenJobRequestsForWorker(userId),
      getReviewsByWorker(userId),
    ]).then(([reqRes, revRes]) => {
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value);
      if (revRes.status === 'fulfilled') setReviews(revRes.value);
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