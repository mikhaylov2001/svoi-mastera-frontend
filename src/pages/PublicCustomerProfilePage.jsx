import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

function timeAgo(d) {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 30) return `${days} дн. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес. назад`;
  return `${Math.floor(months / 12)} г. назад`;
}

function memberSince(d) {
  if (!d) return null;
  return 'На сервисе с ' + new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const STATUS_LABEL = {
  OPEN: 'Открыта', IN_NEGOTIATION: 'Обсуждение', ASSIGNED: 'Назначена',
  IN_PROGRESS: 'В работе', COMPLETED: 'Завершена', CANCELLED: 'Отменена',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pw-page { background: #fff; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  .pw-breadcrumb { background: #f6f6f6; border-bottom: 1px solid #e8e8e8; }
  .pw-breadcrumb-btn { background: none; border: none; cursor: pointer; font-size: 13px; color: #757575; font-family: inherit; display: inline-flex; align-items: center; gap: 4px; padding: 0; }
  .pw-breadcrumb-btn:hover { color: #333; text-decoration: underline; }

  .pw-wrap { max-width: 1176px; margin: 0 auto; padding: 0 20px; }
  .pw-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; padding: 20px 0 60px; align-items: flex-start; }

  /* ── SIDEBAR ── */
  .pw-avatar { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; display: block; margin-bottom: 12px; border: 2px solid #f0f0f0; }
  .pw-avatar-fb { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, #64748b, #475569); display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 800; color: #fff; margin-bottom: 12px; }

  .pw-name { font-size: 22px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; }
  .pw-review-link { display: inline-block; font-size: 14px; color: #2563eb; text-decoration: none; margin-bottom: 6px; cursor: pointer; background: none; border: none; font-family: inherit; padding: 0; }
  .pw-review-link:hover { text-decoration: underline; }
  .pw-meta { font-size: 13px; color: #777; line-height: 1.7; margin-bottom: 14px; }

  .pw-rating-row { display: flex; align-items: center; gap: 7px; padding: 12px 0; border-top: 1px solid #f2f2f2; border-bottom: 1px solid #f2f2f2; margin-bottom: 12px; }
  .pw-rating-num { font-size: 22px; font-weight: 800; color: #111; line-height: 1; }
  .pw-stars { display: flex; gap: 2px; }
  .pw-star-f { color: #334155; font-size: 15px; }
  .pw-star-e { color: #e5e7eb; font-size: 15px; }
  .pw-rating-cnt { font-size: 13px; color: #aaa; }

  .pw-badges { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .pw-badge { display: flex; align-items: center; gap: 8px; background: #e8f4ff; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #1464b0; font-weight: 500; }
  .pw-badge svg { flex-shrink: 0; }

  .pw-responds { font-size: 13px; color: #777; margin-bottom: 14px; }

  .pw-stats-strip { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
  .pw-strip-cell { padding: 12px 6px; text-align: center; border-right: 1px solid #f0f0f0; }
  .pw-strip-cell:last-child { border-right: none; }
  .pw-strip-num { font-size: 20px; font-weight: 800; color: #111; line-height: 1; }
  .pw-strip-lbl { font-size: 10px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-top: 4px; display: block; }

  .pw-btn-msg { display: block; width: 100%; background: #2563eb; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 700; padding: 13px 0; cursor: pointer; font-family: inherit; text-align: center; margin-bottom: 8px; transition: background .15s; }
  .pw-btn-msg:hover { background: #1d4ed8; }

  /* ── MAIN ── */
  .pw-tabs { display: flex; gap: 0; border-bottom: 1px solid #e8e8e8; margin-bottom: 20px; }
  .pw-tab { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; padding: 12px 0; margin-right: 28px; cursor: pointer; font-size: 16px; font-weight: 400; color: #777; font-family: inherit; transition: color .15s; white-space: nowrap; }
  .pw-tab.active { color: #1a1a1a; font-weight: 700; border-bottom-color: #1a1a1a; }
  .pw-tab:hover:not(.active) { color: #333; }

  .pw-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .pw-card { display: block; text-decoration: none; color: inherit; padding: 12px; cursor: pointer; transition: background .15s; border-radius: 8px; position: relative; }
  .pw-card:hover { background: #f7f7f7; }
  .pw-card-img-wrap { position: relative; aspect-ratio: 4/3; background: #f0f0f0; border-radius: 8px; overflow: hidden; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #ccc; }
  .pw-card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pw-card-heart { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.85); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; border: none; }
  .pw-card-pill { position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,.48); color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
  .pw-card-cat { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,.48); color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 4px; }
  .pw-card-title { font-size: 14px; font-weight: 400; line-height: 1.4; color: #1a1a1a; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pw-card-price { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
  .pw-card-loc { font-size: 12px; color: #999; display: flex; align-items: center; gap: 3px; margin-bottom: 2px; }
  .pw-card-date { font-size: 12px; color: #bbb; }
  .pw-card-review-btn { margin-top: 8px; padding: 7px 12px; background: #1a1a1a; border: none; border-radius: 7px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; width: 100%; font-family: inherit; transition: background .15s; }
  .pw-card-review-btn:hover { background: #333; }
  .pw-card-review-done { margin-top: 8px; font-size: 12px; color: #16a34a; font-weight: 600; }

  .pw-empty { padding: 48px 0; text-align: center; color: #aaa; font-size: 15px; }
  .pw-empty-ico { font-size: 38px; margin-bottom: 10px; }

  /* ── СЕКЦИЯ ОТЗЫВОВ ── */
  .pw-reviews-section { margin-top: 32px; border-top: 1px solid #e8e8e8; padding-top: 28px; }
  .pw-reviews-heading { font-size: 22px; font-weight: 700; margin-bottom: 20px; }
  .pw-rating-block { display: flex; gap: 32px; margin-bottom: 24px; }
  .pw-rating-left { text-align: center; flex-shrink: 0; }
  .pw-rating-big { font-size: 48px; font-weight: 800; line-height: 1; color: #1a1a1a; }
  .pw-rating-stars-big { color: #334155; font-size: 18px; letter-spacing: 2px; display: block; margin: 6px 0 4px; }
  .pw-rating-hint { font-size: 12px; color: #aaa; }
  .pw-rating-bars { flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .pw-bar-row { display: flex; align-items: center; gap: 8px; }
  .pw-bar-stars { font-size: 12px; color: #334155; white-space: nowrap; width: 80px; }
  .pw-bar-track { flex: 1; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
  .pw-bar-fill { height: 100%; background: #334155; border-radius: 3px; }
  .pw-bar-cnt { font-size: 12px; color: #aaa; width: 20px; text-align: right; }
  .pw-review-list { display: flex; flex-direction: column; }
  .pw-review-item { padding: 18px 0; border-bottom: 1px solid #f2f2f2; }
  .pw-review-item:last-child { border-bottom: none; }
  .pw-review-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .pw-review-ava { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; flex-shrink: 0; cursor: pointer; }
  .pw-review-ava-fb { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg,#64748b,#475569); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 15px; flex-shrink: 0; }
  .pw-review-author { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .pw-review-date { font-size: 12px; color: #aaa; }
  .pw-review-rating { color: #334155; font-size: 15px; margin-left: auto; letter-spacing: 1px; }
  .pw-review-text { font-size: 14px; color: #333; line-height: 1.65; padding-left: 54px; }

  /* ── МОДАЛКА ОТЗЫВА ── */
  .pw-modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .pw-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 460px; padding: 28px; }
  .pw-modal-title { font-size: 18px; font-weight: 700; }
  .pw-modal-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #aaa; padding: 0; line-height: 1; }
  .pw-modal-stars button { background: none; border: none; cursor: pointer; font-size: 36px; padding: 0; transition: transform .1s; }
  .pw-modal-stars button:hover { transform: scale(1.15); }
  .pw-modal-textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1.5px solid #e0e0e0; font-size: 14px; line-height: 1.6; resize: vertical; min-height: 100px; outline: none; font-family: inherit; margin-bottom: 16px; transition: border-color .15s; }
  .pw-modal-textarea:focus { border-color: #2563eb; }
  .pw-modal-submit { width: 100%; padding: 13px; background: #2563eb; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .15s; }
  .pw-modal-submit:hover { background: #1d4ed8; }
  .pw-modal-submit:disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }

  /* ── LIGHTBOX ── */
  .pw-lb-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.92); display: flex; align-items: center; justify-content: center; }
  .pw-lb-inner { position: relative; max-width: 90vw; max-height: 86vh; }
  .pw-lb-img { max-width: 90vw; max-height: 86vh; border-radius: 10px; display: block; }
  .pw-lb-counter { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,.55); color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
  .pw-lb-close { position: absolute; top: 12px; right: 12px; width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.18); border: none; color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .pw-lb-prev, .pw-lb-next { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.18); border: none; color: #fff; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .pw-lb-prev { left: -56px; }
  .pw-lb-next { right: -56px; }

  @media(max-width:960px) { .pw-layout { grid-template-columns: 1fr; } .pw-grid { grid-template-columns: repeat(2,1fr); } }
  @media(max-width:520px) { .pw-grid { grid-template-columns: 1fr; } .pw-tab { font-size: 14px; margin-right: 18px; } }
`;

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
      setReviews(Array.isArray(rev) ? rev.filter(x => x.status === 'APPROVED') : []);
      setDeals(Array.isArray(d) ? d.filter(deal => deal.customerId === customerId) : []);
    }).finally(() => setLoading(false));
  }, [customerId]);

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
      if (rev.ok) setReviews((await rev.json()).filter(r => r.status === 'APPROVED'));
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
  const since    = memberSince(customer?.registeredAt || customer?.createdAt);
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
  const maxStarCount = Math.max(...starCounts, 1);

  const renderCard = (item, isDeal) => {
    const hasPhoto = item.photos && item.photos.length > 0;
    const cat = item.categoryName || item.category || null;
    const stLabel = isDeal ? 'Завершена' : (STATUS_LABEL[item.status] || item.status);
    return (
      <div key={`${isDeal?'d':'r'}-${item.id}`} className="pw-card"
        onClick={hasPhoto ? () => setLightbox({ photos: item.photos, index: 0 }) : undefined}>
        <div className="pw-card-img-wrap">
          {hasPhoto ? <img src={item.photos[0]} alt={item.title} /> : (isDeal ? '🤝' : '📋')}
          {cat && <div className="pw-card-cat">{cat}</div>}
          <div className="pw-card-pill">{stLabel}</div>
          <button className="pw-card-heart" onClick={e => e.stopPropagation()}>♡</button>
        </div>
        <div className="pw-card-title">{item.title || 'Задача'}</div>
        {(item.agreedPrice || item.budgetTo) && (
          <div className="pw-card-price">
            {item.agreedPrice ? `${Number(item.agreedPrice).toLocaleString('ru-RU')} ₽` : `до ${Number(item.budgetTo).toLocaleString('ru-RU')} ₽`}
          </div>
        )}
        <div className="pw-card-loc"><span>📍</span><span>{customer?.city || 'Йошкар-Ола'}</span></div>
        {item.createdAt && <div className="pw-card-date">{new Date(item.createdAt).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'})}</div>}

        {isDeal && userId === customerId && !item.hasReview && (
          <button className="pw-card-review-btn" onClick={e => { e.stopPropagation(); setReviewDeal({...item,_reviewByWorker:false}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}>
            ⭐ Оставить отзыв
          </button>
        )}
        {isDeal && userId === customerId && item.hasReview && (
          <div className="pw-card-review-done">✓ Отзыв оставлен</div>
        )}
        {isDeal && userId !== customerId && item.workerId === userId && !item.hasWorkerReview && (
          <button className="pw-card-review-btn" onClick={e => { e.stopPropagation(); setReviewDeal({...item,_reviewByWorker:true}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}>
            ⭐ Отзыв заказчику
          </button>
        )}
        {isDeal && userId !== customerId && item.workerId === userId && item.hasWorkerReview && (
          <div className="pw-card-review-done">✓ Отзыв оставлен</div>
        )}
      </div>
    );
  };

  return (
    <div className="pw-page">
      <style>{css}</style>

      <div className="pw-breadcrumb">
        <div className="pw-wrap" style={{ padding:'10px 20px' }}>
          <button className="pw-breadcrumb-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Назад
          </button>
        </div>
      </div>

      <div className="pw-wrap">
        <div className="pw-layout">

          {/* ══ САЙДБАР ══ */}
          <div className="pw-sidebar">
            {avatarUrl
              ? <img src={avatarUrl} alt={fullName} className="pw-avatar" />
              : <div className="pw-avatar-fb">{initials}</div>
            }

            <h1 className="pw-name">{fullName}</h1>

            {reviews.length === 0
              ? null
              : <button className="pw-review-link" onClick={() => document.getElementById('pw-reviews-anchor')?.scrollIntoView({behavior:'smooth'})}>
                  {reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}
                </button>
            }

            <div className="pw-meta">
              {done > 0 && <span>{done} завершённых сделок<br /></span>}
              {since && <span>{since}</span>}
            </div>

            {avgRating > 0 && (
              <div className="pw-rating-row">
                <span className="pw-rating-num">{avgRatingStr}</span>
                <div className="pw-stars">
                  {Array.from({length:5}).map((_,i) => (
                    <span key={i} className={i < starsFilled ? 'pw-star-f' : 'pw-star-e'}>★</span>
                  ))}
                </div>
                <span className="pw-rating-cnt">
                  {reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}
                </span>
              </div>
            )}

            <div className="pw-badges">
              <div className="pw-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7.5" stroke="#257af4" strokeWidth="1"/>
                  <path d="M5 8l2 2 4-4" stroke="#257af4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Документы проверены
              </div>
              <div className="pw-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7.5" stroke="#257af4" strokeWidth="1"/>
                  <path d="M5 8l2 2 4-4" stroke="#257af4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {customer?.city || 'Йошкар-Ола'}
              </div>
              {done >= 1 && (
                <div className="pw-badge">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="#257af4" strokeWidth="1"/>
                    <path d="M5 8l2 2 4-4" stroke="#257af4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {done} {done===1?'сделка завершена':done<5?'сделки завершено':'сделок завершено'}
                </div>
              )}
            </div>

            <div className="pw-responds">Отвечает в течение дня</div>

            <div className="pw-stats-strip">
              <div className="pw-strip-cell">
                <div className="pw-strip-num">{total}</div>
                <span className="pw-strip-lbl">Заявок</span>
              </div>
              <div className="pw-strip-cell">
                <div className="pw-strip-num">{done}</div>
                <span className="pw-strip-lbl">Закрыто</span>
              </div>
              <div className="pw-strip-cell">
                <div className="pw-strip-num">{reviews.length}</div>
                <span className="pw-strip-lbl">Отзывов</span>
              </div>
            </div>

            {userId && userId !== customerId && (
              <button className="pw-btn-msg" onClick={() => navigate(`/chat/${customerId}`)}>
                Написать
              </button>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div className="pw-main">

            <div className="pw-tabs">
              <button className={`pw-tab${tab==='open'?' active':''}`} onClick={() => setTab('open')}>
                Активные {openReqs.length > 0 && <sup style={{fontSize:13,fontWeight:700}}>{openReqs.length}</sup>}
              </button>
              <button className={`pw-tab${tab==='completed'?' active':''}`} onClick={() => setTab('completed')}>
                Завершённые {(completedReqs.length||completedDeals.length) > 0 && <sup style={{fontSize:13,fontWeight:700}}>{completedReqs.length||completedDeals.length}</sup>}
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

            {/* ══ ОТЗЫВЫ СЕКЦИЯ ══ */}
            <div className="pw-reviews-section" id="pw-reviews-anchor">
              <h2 className="pw-reviews-heading">Отзывы о {name}</h2>

              <div className="pw-rating-block">
                <div className="pw-rating-left">
                  <div className="pw-rating-big">{avgRatingStr.replace('.', ',')}</div>
                  <span className="pw-rating-stars-big">
                    {Array.from({length:5}).map((_,i) => (
                      <span key={i} style={{ color: i < starsFilled ? '#334155' : '#e0e0e0' }}>★</span>
                    ))}
                  </span>
                  <div className="pw-rating-hint">рейтинг{reviews.length===0?' пока нет':''}</div>
                </div>
                <div className="pw-rating-bars">
                  {[5,4,3,2,1].map((s,idx) => (
                    <div className="pw-bar-row" key={s}>
                      <span className="pw-bar-stars">{'★'.repeat(s)}</span>
                      <div className="pw-bar-track">
                        <div className="pw-bar-fill" style={{ width:`${(starCounts[idx]/maxStarCount)*100}%` }} />
                      </div>
                      <span className="pw-bar-cnt">{starCounts[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.length === 0
                ? <p style={{ color:'#aaa', fontSize:14 }}>Отзывов пока нет</p>
                : (
                  <div className="pw-review-list">
                    {reviews.map(r => {
                      const ava     = r.authorAvatarUrl || r.workerAvatar || null;
                      const firstName = r.authorName || r.workerName || 'Мастер';
                      const rLast   = r.authorLastName || r.workerLastName || '';
                      const fullN   = [firstName, rLast].filter(Boolean).join(' ');
                      const wId     = r.authorId || r.workerId || null;
                      const rStars  = r.rating || 0;
                      return (
                        <div key={r.id} className="pw-review-item">
                          <div className="pw-review-head">
                            {ava && ava.length > 10
                              ? <img src={ava} alt="" className="pw-review-ava" onClick={wId ? () => navigate(`/workers/${wId}`) : undefined} style={{ cursor: wId ? 'pointer':'default' }} />
                              : <div className="pw-review-ava-fb" style={{ cursor: wId ? 'pointer':'default' }} onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}>{firstName[0].toUpperCase()}</div>
                            }
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="pw-review-author" style={{ cursor: wId ? 'pointer':'default' }} onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}>{fullN}</div>
                              <div className="pw-review-date">{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'})}</div>
                            </div>
                            <div className="pw-review-rating">
                              {Array.from({length:5}).map((_,i) => (
                                <span key={i} style={{ color: i < rStars ? '#334155' : '#e0e0e0' }}>★</span>
                              ))}
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
                <button onClick={() => setReviewModal(false)} style={{ marginTop:16, padding:'10px 28px', background:'#2563eb', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <h2 className="pw-modal-title">{reviewDeal?._reviewByWorker ? 'Отзыв о заказчике' : 'Отзыв о мастере'}</h2>
                  <button className="pw-modal-close" onClick={() => setReviewModal(false)}>×</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f7f7f7', borderRadius:10, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,#64748b,#475569)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
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
                        style={{ color: star <= reviewForm.rating ? '#334155' : '#e0e0e0' }}>★</button>
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
