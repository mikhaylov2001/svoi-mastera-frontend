import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import {
  formatJobRequestBudgetLabel,
  getJobRequestPublishedBudgetNumber,
  hasJobRequestPublishedPrice,
} from '../../utils/jobRequestBudget';
import {
  publicTimeAgo,
  publicMemberSince,
  publicReviewsLabel,
  publicStarsRow,
  publicFirstName,
} from '../../utils/publicProfileUtils';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';
import '../../styles/publicProfilePage.css';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const MSG_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PIN_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M8 1.75a3.25 3.25 0 00-3.25 3.25c0 2.44 3.25 6 3.25 6s3.25-3.56 3.25-6A3.25 3.25 0 008 1.75z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <circle cx="8" cy="5" r="1" fill="currentColor" />
  </svg>
);

const LISTING_PIN = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M8 1.75a3.25 3.25 0 00-3.25 3.25c0 2.44 3.25 6 3.25 6s3.25-3.56 3.25-6A3.25 3.25 0 008 1.75z"
      stroke="#9ca3af"
      strokeWidth="1.2"
    />
    <circle cx="8" cy="5" r="1" fill="#9ca3af" />
  </svg>
);

const STATUS_LABEL = {
  OPEN: 'Открыта', IN_NEGOTIATION: 'Обсуждение', ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе', COMPLETED: 'Завершена', CANCELLED: 'Отменена',
};

export default function PublicCustomerProfilePage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();

  const nameFromQuery = new URLSearchParams(location.search).get('name') || '';

  const [customer,      setCustomer]      = useState(null);
  const [requests,      setRequests]      = useState([]);
  const [deals,         setDeals]         = useState([]);
  const [reviews,       setReviews]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('open');
  const [lightbox,      setLightbox]      = useState(null);
  const [reviewModal,   setReviewModal]   = useState(false);
  const [reviewDeal,    setReviewDeal]    = useState(null);
  const [reviewForm,    setReviewForm]    = useState({ rating: 5, text: '' });
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewDone,    setReviewDone]    = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const h = e => {
      if (e.key === 'ArrowRight') setLightbox(l => l ? {...l, index:(l.index+1)%l.photos.length} : l);
      if (e.key === 'ArrowLeft')  setLightbox(l => l ? {...l, index:(l.index-1+l.photos.length)%l.photos.length} : l);
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightbox]);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/customers/${customerId}/profile`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/customers/${customerId}/requests`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/customers/${customerId}/reviews`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/deals`, { headers: { 'X-User-Id': customerId } }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([p, r, rev, d]) => {
      setCustomer(p || { displayName: nameFromQuery || 'Заказчик', city: 'Йошкар-Ола' });
      setRequests(Array.isArray(r) ? r : []);
      setReviews(Array.isArray(rev) ? rev : []);
      setDeals(Array.isArray(d) ? d.filter(deal => deal.customerId === customerId) : []);
    }).finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => {
    if (loading) return;
    if (location.hash !== '#reviews') return;
    const timer = window.setTimeout(() => {
      document.getElementById('pw-reviews-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [loading, location.hash, customerId]);

  const handleReviewSubmit = async () => {
    if (!reviewForm.text.trim() || !reviewDeal) return;
    setReviewSending(true);
    try {
      const endpoint = reviewDeal._reviewByWorker
        ? `${API}/deals/${reviewDeal.id}/reviews/worker`
        : `${API}/deals/${reviewDeal.id}/reviews`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ rating: reviewForm.rating, text: reviewForm.text }),
      });
      setReviewDone(true);
      const rev = await fetch(`${API}/customers/${customerId}/reviews`);
      if (rev.ok) {
        const list = await rev.json();
        setReviews(Array.isArray(list) ? list : []);
      }
    } catch(e) { console.error(e); }
    setReviewSending(false);
  };

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#999', fontFamily:'Inter,Arial,sans-serif' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:36, marginBottom:8 }}>⏳</div><p>Загружаем профиль...</p></div>
    </div>
  );

  const name     = customer?.displayName || nameFromQuery || 'Заказчик';
  const lastName = customer?.lastName || '';
  const fullName = lastName ? `${name} ${lastName}` : name;
  const initials = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since    = publicMemberSince(customer?.registeredAt || customer?.createdAt);
  const avatarUrl = customer?.avatarUrl || null;

  const openReqs      = requests.filter(r => ['OPEN','IN_NEGOTIATION','ASSIGNED','IN_PROGRESS'].includes(r.status));
  const completedReqs = requests.filter(r => r.status === 'COMPLETED');
  const completedDeals = deals.filter(d => d.status === 'COMPLETED');
  const total = customer?.totalRequests ?? requests.length;
  const done  = customer?.completedRequests ?? (completedReqs.length || completedDeals.length);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length)
    : 0;
  const avgRatingStr = avgRating > 0 ? avgRating.toFixed(1) : '0,0';
  const starsFilled = Math.round(avgRating);
  const starCounts = [5,4,3,2,1].map(s => reviews.filter(r => r.rating === s).length);
  const reviewsTotal = reviews.length || 1;

  const renderCard = (item, isDeal) => {
    const hasPhoto = item.photos && item.photos.length > 0;
    const noPhotoThumb = !hasPhoto && (
      isDeal
        ? getCategoryPlaceholderPhotoUrlOrDefault({ category: item.category })
        : getCategoryPlaceholderPhotoUrlOrDefault({
          categoryName: item.categoryName,
          categoryId: item.categoryId,
        })
    );
    const stLabel = isDeal ? 'Завершена' : (STATUS_LABEL[item.status] || item.status);
    const isOpen = !isDeal && ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status);
    const badgeClass = isOpen ? 'pw-listing-badge-open' : 'pw-card-done';
    return (
      <article key={`${isDeal?'d':'r'}-${item.id}`} className="pw-card"
        onClick={hasPhoto ? () => setLightbox({ photos: item.photos, index: 0 }) : undefined}
        role={hasPhoto ? 'button' : undefined}
        tabIndex={hasPhoto ? 0 : undefined}>
        <div className="pw-card-img-wrap">
          {hasPhoto ? (
            <img src={item.photos[0]} alt={item.title} />
          ) : (
            <img src={noPhotoThumb} alt="" />
          )}
          <span className={badgeClass}>{isOpen ? 'Открыта' : stLabel}</span>
          {isOpen ? (
            <div className="pw-listing-fav" onClick={(e) => e.stopPropagation()}>
              <FavoriteHeartButton kind="jobRequest" id={item.id} />
            </div>
          ) : null}
        </div>
        <div className="pw-card-body">
        <h3 className="pw-card-title">{item.title || 'Задача'}</h3>
        {(() => {
          if (isDeal && item.agreedPrice != null && Number(item.agreedPrice) > 0) {
            return (
              <div className="pw-card-price">{Number(item.agreedPrice).toLocaleString('ru-RU')} ₽</div>
            );
          }
          if (isDeal) {
            const b = getJobRequestPublishedBudgetNumber(item);
            if (b == null) return null;
            return <div className="pw-card-price">{b.toLocaleString('ru-RU')} ₽</div>;
          }
          if (!hasJobRequestPublishedPrice(item)) return null;
          return <div className="pw-card-price">{formatJobRequestBudgetLabel(item)}</div>;
        })()}
        <div className="pw-listing-meta">
          <div className="pw-card-loc">{LISTING_PIN}{customer?.city || 'Йошкар-Ола'}</div>
          {item.createdAt && <div className="pw-card-date">{publicTimeAgo(item.createdAt)}</div>}
        </div>

        {isDeal && userId === customerId && dealEligibleForReviews(item) && !item.hasReview && (
          <button className="pw-card-review-btn" onClick={e => { e.stopPropagation(); setReviewDeal({...item,_reviewByWorker:false}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}>
            ⭐ Оставить отзыв
          </button>
        )}
        {isDeal && userId === customerId && item.hasReview && (
          <div className="pw-card-review-done">✓ Отзыв оставлен</div>
        )}
        {isDeal && userId !== customerId && item.workerId === userId && dealEligibleForReviews(item) && !item.hasWorkerReview && (
          <button className="pw-card-review-btn" onClick={e => { e.stopPropagation(); setReviewDeal({...item,_reviewByWorker:true}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}>
            ⭐ Отзыв заказчику
          </button>
        )}
        {isDeal && userId !== customerId && item.workerId === userId && item.hasWorkerReview && (
          <div className="pw-card-review-done">✓ Отзыв оставлен</div>
        )}
        </div>
      </article>
    );
  };

  const completedCount = completedReqs.length || completedDeals.length;

  return (
    <div className="pw-page">
      <div className="pw-wrap">
        <button type="button" className="pw-back" onClick={() => navigate(-1)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Назад
        </button>

        <div className="pw-layout">
          <div className="pw-sidebar-wrap">
          <aside className="pw-sidebar-card">
            <div className="pw-sidebar-inner">
              <div className="pw-avatar-wrap">
              {avatarUrl
                ? <img src={avatarUrl} alt={fullName} className="pw-avatar" />
                : <div className="pw-avatar-fb">{initials}</div>}
              </div>

              <h1 className="pw-name">{fullName}</h1>

              {reviews.length > 0 ? (
                <div className="pw-rating-inline">
                  <span className="pw-stars" aria-hidden>{publicStarsRow(avgRating)}</span>
                  <span className="pw-rating-num-bold">{avgRatingStr.replace('.', ',')}</span>
                  <span className="pw-rating-count-muted">({publicReviewsLabel(reviews.length)})</span>
                </div>
              ) : (
                <div className="pw-no-reviews">Отзывов пока нет</div>
              )}

              {since ? <p className="pw-meta-since">{since}</p> : null}

              <div className="pw-city-pill">
                {PIN_ICON}
                {customer?.city || 'Йошкар-Ола'}
              </div>

              {customer?.verified === true ? (
                <div className="pw-badge-verified">✓ Документы проверены</div>
              ) : null}

              <p className="pw-responds">Отвечает в течение дня</p>

              <div className="pw-stats-strip">
                <div className="pw-strip-cell">
                  <div className="pw-strip-num">{total}</div>
                  <span className="pw-strip-lbl">заявок</span>
                </div>
                <div className="pw-strip-cell">
                  <div className="pw-strip-num">{done}</div>
                  <span className="pw-strip-lbl">закрыто</span>
                </div>
                <div className="pw-strip-cell">
                  <div className="pw-strip-num">{reviews.length}</div>
                  <span className="pw-strip-lbl">отзывов</span>
                </div>
              </div>

              <button
                type="button"
                className="pw-btn-msg"
                onClick={() => (userId ? navigate(`/chat/${customerId}`) : navigate('/login'))}
              >
                {MSG_ICON}
                Написать
              </button>
            </div>
          </aside>
          </div>

          <div className="pw-main">

            <div className="pw-tabs">
              <button type="button" className={`pw-tab${tab === 'open' ? ' active' : ''}`} onClick={() => setTab('open')}>
                Активные
                {openReqs.length > 0 ? <span className="pw-tab-count">{openReqs.length}</span> : null}
              </button>
              <button type="button" className={`pw-tab${tab === 'completed' ? ' active' : ''}`} onClick={() => setTab('completed')}>
                Завершённые
                {completedCount > 0 ? <span className="pw-tab-count">{completedCount}</span> : null}
              </button>
            </div>

            {tab === 'open' && (openReqs.length === 0
              ? <div className="pw-empty"><div className="pw-empty-ico">📋</div><p>Нет активных заявок</p></div>
              : <div className="pw-grid">{openReqs.map(r => renderCard(r, false))}</div>
            )}

            {tab === 'completed' && (() => {
              const items = completedReqs.length > 0
                ? completedReqs.map(r => ({...r, _isDeal:false}))
                : completedDeals.map(d => ({...d, _isDeal:true}));
              return items.length === 0
                ? <div className="pw-empty"><div className="pw-empty-ico">✅</div><p>Завершённых заказов нет</p></div>
                : <div className="pw-grid">{items.map(item => renderCard(item, item._isDeal))}</div>;
            })()}

            <div className="pw-reviews-card" id="pw-reviews-anchor">
              <h2 className="pw-reviews-heading">Отзывы о {publicFirstName(fullName)}</h2>

              <div className="pw-rating-block">
                <div className="pw-rating-left">
                  <div className="pw-rating-big">{avgRatingStr.replace('.', ',')}</div>
                  <div className="pw-rating-stars-big" aria-hidden>
                    {Array.from({length:5}).map((_,i) => (
                      <span key={i} style={{ color: i < starsFilled ? '#f59e0b' : '#e5e7eb' }}>★</span>
                    ))}
                  </div>
                  <div className="pw-rating-hint">{reviews.length > 0 ? 'рейтинг' : 'рейтинг пока нет'}</div>
                </div>
                <div className="pw-rating-bars">
                  {[5,4,3,2,1].map((s,idx) => (
                    <div className="pw-bar-row" key={s}>
                      <span className="pw-bar-stars">{'★'.repeat(s)}</span>
                      <div className="pw-bar-track">
                        <div className="pw-bar-fill" style={{ width: reviews.length > 0 ? `${(starCounts[idx]/reviewsTotal)*100}%` : '0%' }} />
                      </div>
                      <span className="pw-bar-cnt">{starCounts[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.length === 0
                ? <p className="pw-reviews-empty">Отзывов пока нет</p>
                : (
                  <div className="pw-review-list">
                    {reviews.map(r => {
                      const ava     = r.authorAvatarUrl || r.workerAvatar || null;
                      const firstName = r.authorName || r.workerName || 'Мастер';
                      const rLast   = r.authorLastName || r.workerLastName || '';
                      const fullN   = [firstName, rLast].filter(Boolean).join(' ');
                      const wId     = r.authorUserId || r.authorId || r.workerId || null;
                      const rStars  = r.rating || 0;
                      const goWorker = wId ? () => navigate(`/workers/${wId}`) : undefined;
                      return (
                        <div key={r.id} className="pw-review-item">
                          <div className="pw-review-head">
                            {ava && ava.length > 10
                              ? <img src={ava} alt="" className="pw-review-ava" onClick={goWorker} style={{ cursor: wId ? 'pointer':'default' }} />
                              : <div className="pw-review-ava-fb" style={{ cursor: wId ? 'pointer':'default' }} onClick={goWorker}>{firstName[0].toUpperCase()}</div>
                            }
                            <div className="pw-review-meta">
                              <div className="pw-review-author" style={{ cursor: wId ? 'pointer':'default' }} onClick={goWorker}>{fullN}</div>
                              <div className="pw-review-sub">
                                <span className="pw-review-stars-inline">{'★'.repeat(rStars)}{'☆'.repeat(5 - rStars)}</span>
                                {r.createdAt ? <span className="pw-review-date">· {publicTimeAgo(r.createdAt)}</span> : null}
                              </div>
                            </div>
                          </div>
                          {(r.text || r.comment) && <p className="pw-review-text">{r.text || r.comment}</p>}
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>

          </div>
        </div>
      </div>

      {/* МОДАЛКА ОТЗЫВА */}
      {reviewModal && (
        <div className="pw-modal-overlay" onClick={() => setReviewModal(false)}>
          <div className="pw-modal" onClick={e => e.stopPropagation()}>
            {reviewDone ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                <h3 style={{ fontSize:20, fontWeight:700, margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                <button onClick={() => setReviewModal(false)} style={{ marginTop:16, padding:'10px 28px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <h2 className="pw-modal-title">{reviewDeal?._reviewByWorker ? 'Отзыв о заказчике' : 'Отзыв о мастере'}</h2>
                  <button className="pw-modal-close" onClick={() => setReviewModal(false)}>×</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f7f7f7', borderRadius:10, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                    {reviewDeal?._reviewByWorker ? (initials||'З') : (reviewDeal?.workerName?.[0]?.toUpperCase()||'М')}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{reviewDeal?._reviewByWorker ? fullName : reviewDeal?.workerName}</div>
                    <div style={{ fontSize:12, color:'#aaa' }}>{reviewDeal?._reviewByWorker ? 'Заказчик' : 'Мастер'}</div>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Оценка</div>
                  <div className="pw-modal-stars" style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewForm(p => ({...p, rating:star}))}
                        style={{ color: star <= reviewForm.rating ? '#f59e0b' : '#e0e0e0' }}>★</button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="pw-modal-textarea"
                  value={reviewForm.text}
                  onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                  placeholder="Расскажите об опыте работы..."
                />
                <button className="pw-modal-submit" onClick={handleReviewSubmit} disabled={reviewSending || !reviewForm.text.trim()}>
                  {reviewSending ? 'Отправляем...' : 'Отправить отзыв'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="pw-lb-overlay" onClick={() => setLightbox(null)}>
          <div className="pw-lb-inner" onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" className="pw-lb-img" />
            <div className="pw-lb-counter">{lightbox.index+1} / {lightbox.photos.length}</div>
            <button className="pw-lb-close" onClick={() => setLightbox(null)}>×</button>
            {lightbox.photos.length > 1 && (<>
              <button className="pw-lb-prev" onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }}>‹</button>
              <button className="pw-lb-next" onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }}>›</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
