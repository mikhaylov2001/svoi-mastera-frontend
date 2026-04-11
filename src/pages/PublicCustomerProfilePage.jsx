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

export default function PublicCustomerProfilePage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();

  const nameFromQuery = new URLSearchParams(location.search).get('name') || '';

  const [customer,      setCustomer]      = useState(null);
  const [requests,      setRequests]      = useState([]);
  const [deals,         setDeals]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('open');
  const [lightbox,      setLightbox]      = useState(null);
  const [photoIdx,      setPhotoIdx]      = useState({});
  const [reviews,       setReviews]       = useState([]);
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
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#8f8f8f', fontFamily:'Arial,sans-serif' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:32, marginBottom:8 }}>⏳</div><p>Загружаем профиль...</p></div>
    </div>
  );

  const name      = customer?.displayName || nameFromQuery || 'Заказчик';
  const lastName  = customer?.lastName || '';
  const fullName  = lastName ? `${name} ${lastName}` : name;
  const initials  = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since     = memberSince(customer?.registeredAt || customer?.createdAt);
  const avatarUrl = customer?.avatarUrl || null;

  const openReqs       = requests.filter(r => ['OPEN','IN_NEGOTIATION','ASSIGNED','IN_PROGRESS'].includes(r.status));
  const completedReqs  = requests.filter(r => r.status === 'COMPLETED');
  const completedDeals = deals.filter(d => d.status === 'COMPLETED');
  const total = customer?.totalRequests ?? requests.length;
  const done  = customer?.completedRequests ?? (completedReqs.length || completedDeals.length);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length).toFixed(1)
    : null;

  const css = `
    * { box-sizing: border-box; }
    .av-page { background: #fff; min-height: 100vh; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }
    .av-back { background: #f4f5f6; border-bottom: 1px solid #e0e0e0; padding: 10px 0; }
    .av-back-btn { background: none; border: none; cursor: pointer; font-size: 14px; color: #2196f3; padding: 0; display: flex; align-items: center; gap: 4px; }
    .av-wrap { max-width: 1232px; margin: 0 auto; padding: 0 16px; }
    .av-layout { display: grid; grid-template-columns: 300px 1fr; gap: 32px; padding: 24px 0 60px; align-items: flex-start; }
    .av-avatar { width: 88px; height: 88px; border-radius: 16px; object-fit: cover; }
    .av-avatar-fallback { width: 88px; height: 88px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 32px; color: #fff; }
    .av-name { font-size: 24px; font-weight: 700; margin: 0 0 4px; line-height: 1.2; }
    .av-meta { font-size: 13px; color: #8f8f8f; margin-bottom: 12px; line-height: 1.6; }
    .av-badges { display: flex; flex-direction: column; gap: 0; margin-bottom: 16px; }
    .av-badge { display: flex; align-items: center; gap: 10px; padding: 10px 0; font-size: 14px; color: #333; border-bottom: 1px solid #f0f0f0; }
    .av-badge:last-child { border-bottom: none; }
    .av-badge-icon { width: 20px; text-align: center; flex-shrink: 0; }
    .av-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
    .av-btn-write { background: #04c96f; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 700; padding: 13px; cursor: pointer; width: 100%; transition: background .15s; }
    .av-btn-write:hover { background: #03b362; }
    .av-tabs { display: flex; gap: 0; border-bottom: 2px solid #e0e0e0; margin-bottom: 20px; }
    .av-tab { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; padding: 12px 0; margin-right: 24px; cursor: pointer; font-size: 15px; color: #8f8f8f; font-family: Arial, sans-serif; transition: all .15s; }
    .av-tab.active { color: #1a1a1a; border-bottom-color: #1a1a1a; font-weight: 700; }
    .av-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .av-card { background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; transition: box-shadow .2s; }
    .av-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); }
    .av-card-img { position: relative; aspect-ratio: 4/3; background: #f5f5f5; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #ccc; cursor: pointer; }
    .av-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
    .av-card-sticker { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
    .av-card-cat { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 4px; }
    .av-card-body { padding: 10px 12px; }
    .av-card-price { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .av-card-title { font-size: 13px; color: #333; margin-bottom: 6px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; }
    .av-card-meta { font-size: 12px; color: #8f8f8f; }
    .av-card-review-btn { margin-top: 8px; padding: 6px 12px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none; border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; width: 100%; }
    .av-card-review-done { margin-top: 8px; font-size: 12px; color: #04c96f; font-weight: 600; }
    .av-empty { text-align: center; padding: 60px 24px; color: #8f8f8f; border: 1px solid #e5e5e5; border-radius: 8px; }
    .av-reviews { display: flex; flex-direction: column; gap: 0; }
    .av-review { padding: 20px 0; border-bottom: 1px solid #f0f0f0; }
    .av-review:last-child { border-bottom: none; }
    .av-review-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .av-review-ava { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .av-review-ava-fb { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    @media(max-width: 900px) { .av-layout { grid-template-columns: 1fr; } .av-grid { grid-template-columns: repeat(2, 1fr); } }
    @media(max-width: 480px) { .av-grid { grid-template-columns: 1fr; } }
  `;

  const renderCard = (item, isDeal) => {
    const hasPhoto = item.photos && item.photos.length > 0;
    const pi = photoIdx[item.id] || 0;
    const cat = item.categoryName || item.category || null;
    const stLabel = isDeal ? '✅ Завершена' : (STATUS_LABEL[item.status] || item.status);

    return (
      <div key={`${isDeal?'d':'r'}-${item.id}`} className="av-card">
        <div className="av-card-img"
          onClick={hasPhoto ? () => setLightbox({ photos: item.photos, index: pi }) : undefined}
          style={{ cursor: hasPhoto ? 'pointer' : 'default' }}>
          {hasPhoto
            ? <img src={item.photos[pi]} alt="" />
            : (isDeal ? '🤝' : '📋')
          }
          <div className="av-card-sticker">{stLabel}</div>
          {cat && <div className="av-card-cat">{cat}</div>}
          {hasPhoto && item.photos.length > 1 && (
            <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:11, padding:'2px 6px', borderRadius:4 }}>📷 {item.photos.length}</div>
          )}
        </div>
        <div className="av-card-body">
          {(item.agreedPrice || item.budgetTo) && (
            <div className="av-card-price">
              {item.agreedPrice ? `${Number(item.agreedPrice).toLocaleString('ru-RU')} ₽` : `до ${Number(item.budgetTo).toLocaleString('ru-RU')} ₽`}
            </div>
          )}
          <div className="av-card-title">{item.title || 'Задача'}</div>
          <div className="av-card-meta">
            {isDeal && item.workerName && <span>{item.workerName} · </span>}
            {!isDeal && item.addressText && <span>{item.addressText} · </span>}
            {item.createdAt && <span>{timeAgo(item.createdAt)}</span>}
          </div>
          {isDeal && userId === customerId && !item.hasReview && (
            <button className="av-card-review-btn"
              onClick={e => { e.stopPropagation(); setReviewDeal({...item, _reviewByWorker:false}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}>
              ⭐ Оставить отзыв
            </button>
          )}
          {isDeal && userId === customerId && item.hasReview && (
            <div className="av-card-review-done">✓ Отзыв оставлен</div>
          )}
          {isDeal && userId !== customerId && item.workerId === userId && !item.hasWorkerReview && (
            <button className="av-card-review-btn" style={{ background:'linear-gradient(135deg,#e8410a,#ff7043)' }}
              onClick={e => { e.stopPropagation(); setReviewDeal({...item, _reviewByWorker:true}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}>
              ⭐ Отзыв заказчику
            </button>
          )}
          {isDeal && userId !== customerId && item.workerId === userId && item.hasWorkerReview && (
            <div className="av-card-review-done">✓ Отзыв оставлен</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="av-page">
      <style>{css}</style>

      <div className="av-back">
        <div className="av-wrap">
          <button className="av-back-btn" onClick={() => navigate(-1)}>← Назад</button>
        </div>
      </div>

      <div className="av-wrap">
        <div className="av-layout">

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div>
            <div style={{ marginBottom:12 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={fullName} className="av-avatar" />
                : <div className="av-avatar-fallback" style={{ background:'linear-gradient(135deg,#e8410a,#ff7043)' }}>{initials}</div>
              }
            </div>

            <h1 className="av-name">{fullName}</h1>
            <div className="av-meta">
              Заказчик{since ? <><br />{since}</> : ''}
            </div>

            {avgRating && (
              <div className="av-rating">
                <span style={{ color:'#ffb800', fontSize:16 }}>{'★'.repeat(Math.round(Number(avgRating)))}</span>
                <span style={{ fontSize:18, fontWeight:700 }}>{avgRating}</span>
                <span style={{ fontSize:13, color:'#8f8f8f' }}>{reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}</span>
              </div>
            )}

            <div className="av-badges">
              <div className="av-badge">
                <span className="av-badge-icon" style={{ color:'#04c96f' }}>✔</span>
                Документы проверены
              </div>
              <div className="av-badge">
                <span className="av-badge-icon">📍</span>
                {customer?.city || 'Йошкар-Ола'}
              </div>
              {total >= 1 && (
                <div className="av-badge">
                  <span className="av-badge-icon">⭐</span>
                  Активный заказчик
                </div>
              )}
              {done >= 1 && (
                <div className="av-badge">
                  <span className="av-badge-icon">🤝</span>
                  Есть завершённые сделки
                </div>
              )}
            </div>

            {userId && userId !== customerId && (
              <button className="av-btn-write" onClick={() => navigate(`/chat/${customerId}`)}>Написать</button>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div>
            <div className="av-tabs">
              <button className={`av-tab${tab==='open'?' active':''}`} onClick={() => setTab('open')}>
                Активные <span>{openReqs.length}</span>
              </button>
              <button className={`av-tab${tab==='completed'?' active':''}`} onClick={() => setTab('completed')}>
                Завершённые <span>{completedReqs.length || completedDeals.length}</span>
              </button>
              <button className={`av-tab${tab==='reviews'?' active':''}`} onClick={() => setTab('reviews')}>
                Отзывы <span>{reviews.length}</span>
              </button>
            </div>

            {tab === 'open' && (openReqs.length === 0
              ? <div className="av-empty"><div style={{ fontSize:40, marginBottom:10 }}>📋</div><p>Нет активных заявок</p></div>
              : <div className="av-grid">{openReqs.map(r => renderCard(r, false))}</div>
            )}

            {tab === 'completed' && (() => {
              const items = completedReqs.length > 0
                ? completedReqs.map(r => ({...r, _isDeal:false}))
                : completedDeals.map(d => ({...d, _isDeal:true}));
              return items.length === 0
                ? <div className="av-empty"><div style={{ fontSize:40, marginBottom:10 }}>✅</div><p>Завершённых заказов нет</p></div>
                : <div className="av-grid">{items.map(item => renderCard(item, item._isDeal))}</div>;
            })()}

            {tab === 'reviews' && (reviews.length === 0
              ? <div className="av-empty"><div style={{ fontSize:40, marginBottom:10 }}>⭐</div><p>Отзывов пока нет</p></div>
              : <div className="av-reviews">
                  {reviews.map(r => {
                    const ava       = r.authorAvatarUrl || r.workerAvatar || null;
                    const firstName = r.authorName      || r.workerName   || 'Мастер';
                    const lastName  = r.authorLastName  || r.workerLastName || '';
                    const fullN     = [firstName, lastName].filter(Boolean).join(' ');
                    const wId       = r.authorId        || r.workerId      || null;
                    return (
                      <div key={r.id} className="av-review">
                        <div className="av-review-top">
                          {ava && ava.length > 10
                            ? <img src={ava} alt="" className="av-review-ava"
                                onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}
                                style={{ cursor: wId ? 'pointer' : 'default' }} />
                            : <div className="av-review-ava-fb"
                                style={{ background:'linear-gradient(135deg,#257af4,#1a5cbf)', cursor: wId ? 'pointer' : 'default' }}
                                onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}>
                                {firstName[0].toUpperCase()}
                              </div>
                          }
                          <div style={{ flex:1 }}>
                            <div
                              style={{ fontSize:15, fontWeight:700, cursor: wId ? 'pointer' : 'default' }}
                              onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}>
                              {fullN}
                            </div>
                            <div style={{ fontSize:12, color:'#8f8f8f' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                          </div>
                          <div style={{ color:'#ffb800', fontSize:18 }}>
                            {'★'.repeat(r.rating||0)}<span style={{ color:'#e0e0e0' }}>{'★'.repeat(5-(r.rating||0))}</span>
                          </div>
                        </div>
                        {(r.text || r.comment) && <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
                      </div>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* МОДАЛКА ОТЗЫВА */}
      {reviewModal && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setReviewModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, padding:28 }} onClick={e => e.stopPropagation()}>
            {reviewDone ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                <h3 style={{ fontSize:20, fontWeight:700, margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                <button onClick={() => setReviewModal(false)} style={{ marginTop:16, padding:'10px 28px', background:'#04c96f', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>{reviewDeal?._reviewByWorker ? 'Отзыв о заказчике' : 'Отзыв о мастере'}</h2>
                  <button onClick={() => setReviewModal(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8f8f8f' }}>×</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f7f7f7', borderRadius:10, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                    {reviewDeal?._reviewByWorker ? (initials||'З') : (reviewDeal?.workerName?.[0]?.toUpperCase()||'М')}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{reviewDeal?._reviewByWorker ? fullName : reviewDeal?.workerName}</div>
                    <div style={{ fontSize:12, color:'#8f8f8f' }}>{reviewDeal?._reviewByWorker ? 'Заказчик' : 'Мастер'}</div>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Оценка</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewForm(p => ({...p, rating:star}))}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:36, padding:0, color: star <= reviewForm.rating ? '#ffb800' : '#e0e0e0' }}>★</button>
                    ))}
                  </div>
                </div>
                <textarea value={reviewForm.text} onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                  placeholder="Расскажите об опыте работы..."
                  style={{ width:'100%', padding:'12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:14, lineHeight:1.6, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box', marginBottom:16, fontFamily:'Arial,sans-serif' }}
                  onFocus={e => e.target.style.borderColor='#04c96f'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
                <button onClick={handleReviewSubmit} disabled={reviewSending || !reviewForm.text.trim()}
                  style={{ width:'100%', padding:'13px', background: reviewForm.text.trim() ? '#04c96f' : '#e0e0e0', border:'none', borderRadius:8, color: reviewForm.text.trim() ? '#fff' : '#999', fontSize:15, fontWeight:700, cursor: reviewForm.text.trim() ? 'pointer' : 'not-allowed' }}>
                  {reviewSending ? 'Отправляем...' : 'Отправить отзыв'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.95)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setLightbox(null)}>
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:8, display:'block', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,.6)', color:'#fff', fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:999 }}>{lightbox.index+1} / {lightbox.photos.length}</div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.15)', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>×</button>
            {lightbox.photos.length > 1 && (<>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }} style={{ position:'absolute', left:-50, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }} style={{ position:'absolute', right:-50, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>›</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}