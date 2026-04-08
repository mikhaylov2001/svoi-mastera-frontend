import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

function timeAgo(d) {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 30)  return `${days} дн. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес. назад`;
  return `${Math.floor(months / 12)} г. назад`;
}

function memberSince(d) {
  if (!d) return null;
  return 'На сервисе с ' + new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const STATUS = {
  OPEN:           { label: 'Открыта',    color: '#1a8c3a', bg: 'rgba(76,217,100,.15)' },
  IN_NEGOTIATION: { label: 'Обсуждение', color: '#1a5cbf', bg: 'rgba(37,122,244,.12)' },
  ASSIGNED:       { label: 'Назначена',  color: '#b45309', bg: 'rgba(245,158,11,.12)'  },
  IN_PROGRESS:    { label: 'В работе',   color: '#b45309', bg: 'rgba(245,158,11,.12)'  },
  COMPLETED:      { label: 'Завершена',  color: '#1a8c3a', bg: 'rgba(76,217,100,.15)'  },
  CANCELLED:      { label: 'Отменена',   color: '#c0392b', bg: 'rgba(239,68,68,.12)'   },
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
      fetch(`${API}/customers/${customerId}/profile`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/customers/${customerId}/requests`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/customers/${customerId}/reviews`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/deals`, { headers: { 'X-User-Id': customerId } }).then(r => r.ok ? r.json() : []),
    ]).then(([p, r, rev, d]) => {
      setCustomer(p || { displayName: nameFromQuery || 'Заказчик', city: 'Йошкар-Ола' });
      setRequests(Array.isArray(r) ? r : []);
      setReviews(Array.isArray(rev) ? rev.filter(r => r.status === 'APPROVED') : []);
      setDeals(Array.isArray(d) ? d.filter(deal => deal.customerId === customerId) : []);
    }).catch(() => {
      setCustomer({ displayName: nameFromQuery || 'Заказчик', city: 'Йошкар-Ола' });
      setRequests([]); setReviews([]); setDeals([]);
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
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'#8f8f8f' }}>
        <div style={{ fontSize:32, marginBottom:8 }}>⏳</div><p>Загружаем профиль...</p>
      </div>
    </div>
  );

  const name     = customer?.displayName || nameFromQuery || 'Заказчик';
  const lastName = customer?.lastName || '';
  const fullName = lastName ? `${name} ${lastName}` : name;
  const initials = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since    = memberSince(customer?.registeredAt);
  const avatarUrl = customer?.avatarUrl || null;

  const openReqs       = requests.filter(r => r.status === 'OPEN' || r.status === 'IN_NEGOTIATION' || r.status === 'ASSIGNED');
  const completedReqs  = requests.filter(r => r.status === 'COMPLETED');
  const completedDealsData = deals.filter(d => d.status === 'COMPLETED');
  const total = customer?.totalRequests ?? requests.length;
  const done  = customer?.completedRequests ?? (completedReqs.length || completedDealsData.length);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const css = `
    .pcp-page{background:#f2f3f5;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .pcp-topbar{background:#fff;border-bottom:1px solid #e8e8e8;padding:10px 0}
    .pcp-container{max-width:1060px;margin:0 auto;padding:0 16px}
    .pcp-grid{display:grid;grid-template-columns:300px 1fr;gap:16px;padding:16px 0 60px;align-items:flex-start}
    .pcp-card{background:#fff;border-radius:12px;padding:20px;margin-bottom:12px}
    .pcp-panel{background:#fff;border-radius:12px;overflow:hidden}
    .pcp-tabbar{display:flex;border-bottom:1px solid #f0f0f0;padding:0 8px}
    .pcp-tab{padding:14px 16px;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;font-size:14px;font-weight:700;color:#8f8f8f;transition:all .15s;white-space:nowrap}
    .pcp-tab.active{color:#e8410a;border-bottom-color:#e8410a}
    .pcp-content{padding:16px}
    .pcp-item{background:#f8f9fa;border-radius:10px;display:flex;overflow:hidden;margin-bottom:10px;border:1px solid #eee;transition:box-shadow .2s}
    .pcp-item:hover{box-shadow:0 2px 12px rgba(0,0,0,.1)}
    .pcp-thumb{width:130px;min-width:130px;height:100px;background:#e8e8e8;display:flex;align-items:center;justify-content:center;font-size:28px;color:#ccc;position:relative;flex-shrink:0;overflow:hidden}
    .pcp-body{flex:1;padding:12px 14px;display:flex;flex-direction:column;gap:4}
    .pcp-review{background:#f8f9fa;border-radius:10px;padding:14px 16px;margin-bottom:10px;border:1px solid #eee}
    .pcp-empty{text-align:center;padding:50px 24px;color:#8f8f8f}
    .pcp-inforow{display:flex;align-items:center;gap:10;padding:10px 0;font-size:14px;color:#333;border-bottom:1px solid #f5f5f5}
    .pcp-inforow:last-child{border-bottom:none}
    .pcp-statrow{display:flex;padding-top:16px;margin-top:16px;border-top:1px solid #f0f0f0}
    .pcp-stat{flex:1;text-align:center}
    .pcp-statnum{font-size:22px;font-weight:800;color:#1a1a1a;line-height:1}
    .pcp-statlabel{font-size:11px;color:#8f8f8f;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
    .pcp-statdiv{width:1px;background:#f0f0f0;margin:4px 0}
    .pcp-btn{width:100%;padding:13px;background:#e8410a;border:none;border-radius:10px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s}
    .pcp-btn:hover{opacity:.88}
    @media(max-width:768px){.pcp-grid{grid-template-columns:1fr!important}}
  `;

  const renderItem = (item, isDeal) => {
    const st = isDeal ? { label:'Завершена', color:'#1a8c3a', bg:'rgba(76,217,100,.15)' } : (STATUS[item.status] || STATUS.OPEN);
    const hasPhoto = item.photos && item.photos.length > 0;
    const pi = photoIdx[item.id] || 0;
    const cat = item.categoryName || item.category || null;
    return (
      <div key={`${isDeal?'d':'r'}-${item.id}`} className="pcp-item">
        <div className="pcp-thumb"
          onClick={hasPhoto ? () => setLightbox({ photos: item.photos, index: pi }) : undefined}
          style={{ cursor: hasPhoto ? 'pointer' : 'default' }}>
          {hasPhoto
            ? <img src={item.photos[pi]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
            : <span>{isDeal ? '🤝' : '📋'}</span>
          }
          <div style={{ position:'absolute', top:6, left:6 }}>
            <span style={{ background: isDeal ? 'rgba(76,217,100,.85)' : 'rgba(0,0,0,.5)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4 }}>
              {isDeal ? '✅ Завершена' : st.label}
            </span>
          </div>
          {cat && <div style={{ position:'absolute', top:6, right:6, background:'rgba(37,122,244,.85)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4 }}>{cat}</div>}
          {hasPhoto && item.photos.length > 1 && <div style={{ position:'absolute', bottom:4, right:4, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:4 }}>📷 {item.photos.length}</div>}
        </div>
        <div className="pcp-body">
          <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>{item.title || 'Задача'}</div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            <span style={{ background: isDeal ? 'rgba(76,217,100,.15)' : st.bg, color: isDeal ? '#1a8c3a' : st.color, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>
              {isDeal ? '✅ Завершена' : st.label}
            </span>
            {cat && <span style={{ background:'rgba(37,122,244,.12)', color:'#1a5cbf', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>🏷 {cat}</span>}
          </div>
          {(item.agreedPrice || item.budgetTo) && (
            <div style={{ fontSize:16, fontWeight:800, color:'#1a1a1a' }}>
              {item.agreedPrice ? `${Number(item.agreedPrice).toLocaleString('ru-RU')} ₽` : `до ${Number(item.budgetTo).toLocaleString('ru-RU')} ₽`}
            </div>
          )}
          {!isDeal && item.description && item.description !== 'Без описания' && (
            <p style={{ fontSize:13, color:'#666', margin:0, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{item.description}</p>
          )}
          <div style={{ fontSize:12, color:'#8f8f8f', display:'flex', gap:10, flexWrap:'wrap', marginTop:'auto' }}>
            {isDeal && item.workerName && <span>👤 {item.workerName}</span>}
            {!isDeal && item.addressText && <span>📍 {item.addressText}</span>}
            {item.createdAt && <span>{timeAgo(item.createdAt)}</span>}
          </div>
          {isDeal && userId === customerId && !item.hasReview && (
            <button onClick={() => { setReviewDeal({...item, _reviewByWorker:false}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}
              style={{ padding:'7px 12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', marginTop:4, alignSelf:'flex-start' }}>
              ⭐ Оставить отзыв
            </button>
          )}
          {isDeal && userId === customerId && item.hasReview && (
            <div style={{ fontSize:12, color:'#4cd964', fontWeight:600, marginTop:4 }}>✓ Отзыв оставлен</div>
          )}
          {isDeal && userId !== customerId && item.workerId === userId && !item.hasWorkerReview && (
            <button onClick={() => { setReviewDeal({...item, _reviewByWorker:true}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}
              style={{ padding:'7px 12px', background:'linear-gradient(135deg,#e8410a,#ff7043)', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', marginTop:4, alignSelf:'flex-start' }}>
              ⭐ Отзыв заказчику
            </button>
          )}
          {isDeal && userId !== customerId && item.workerId === userId && item.hasWorkerReview && (
            <div style={{ fontSize:12, color:'#4cd964', fontWeight:600, marginTop:4 }}>✓ Отзыв оставлен</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pcp-page">
      <style>{css}</style>
      <div className="pcp-topbar">
        <div className="pcp-container">
          <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#257af4', fontWeight:500, display:'flex', alignItems:'center', gap:4, padding:0 }} onClick={() => navigate(-1)}>
            <span style={{ fontSize:18 }}>‹</span> Назад
          </button>
        </div>
      </div>

      <div className="pcp-container">
        <div className="pcp-grid">
          {/* ЛЕВАЯ */}
          <div>
            <div className="pcp-card">
              <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ flexShrink:0 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={fullName} style={{ width:76, height:76, borderRadius:'50%', objectFit:'cover' }} />
                    : <div style={{ width:76, height:76, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:26 }}>{initials}</div>
                  }
                </div>
                <div style={{ flex:1 }}>
                  <h1 style={{ fontSize:20, fontWeight:700, color:'#1a1a1a', margin:'0 0 2px' }}>{fullName}</h1>
                  <div style={{ fontSize:13, color:'#8f8f8f', marginBottom:6 }}>Заказчик</div>
                  {avgRating ? (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:16, fontWeight:800, color:'#1a1a1a' }}>{avgRating}</span>
                      <span style={{ color:'#ffb800', fontSize:14 }}>{'★'.repeat(Math.round(Number(avgRating)))}</span>
                      <span style={{ fontSize:12, color:'#257af4' }}>{reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}</span>
                    </div>
                  ) : <div style={{ fontSize:12, color:'#8f8f8f', marginBottom:4 }}>Нет отзывов</div>}
                  {since && <div style={{ fontSize:12, color:'#8f8f8f' }}>{since}</div>}
                </div>
              </div>
              <div className="pcp-statrow">
                <div className="pcp-stat"><div className="pcp-statnum">{total}</div><div className="pcp-statlabel">Заявок</div></div>
                <div className="pcp-statdiv" />
                <div className="pcp-stat"><div className="pcp-statnum">{done}</div><div className="pcp-statlabel">Выполнено</div></div>
                {avgRating && <><div className="pcp-statdiv" /><div className="pcp-stat"><div className="pcp-statnum">{avgRating}</div><div className="pcp-statlabel">Рейтинг</div></div></>}
              </div>
            </div>
            <div className="pcp-card">
              <div className="pcp-inforow"><span style={{ color:'#4cd964', fontSize:16 }}>✔</span> Документы проверены</div>
              <div className="pcp-inforow"><span style={{ fontSize:16 }}>📍</span> {customer?.city || 'Йошкар-Ола'}</div>
              {total >= 1 && <div className="pcp-inforow"><span style={{ fontSize:16 }}>⭐</span> Активный заказчик</div>}
              {done >= 1 && <div className="pcp-inforow"><span style={{ fontSize:16 }}>🤝</span> Есть завершённые сделки</div>}
            </div>
            {userId && userId !== customerId && (
              <button className="pcp-btn" onClick={() => navigate(`/chat/${customerId}`)}>💬 Написать</button>
            )}
          </div>

          {/* ПРАВАЯ */}
          <div>
            <div className="pcp-panel">
              <div className="pcp-tabbar">
                {[
                  ['open',      'Активные',    openReqs.length],
                  ['completed', 'Завершённые', completedReqs.length || completedDealsData.length],
                  ['reviews',   'Отзывы',      reviews.length],
                ].map(([key, label, count]) => (
                  <button key={key} className={`pcp-tab${tab===key?' active':''}`} onClick={() => setTab(key)}>
                    {label} <span style={{ fontSize:13, fontWeight:600, color: tab===key ? '#e8410a' : '#bbb' }}>{count}</span>
                  </button>
                ))}
              </div>
              <div className="pcp-content">
                {tab === 'open' && (openReqs.length === 0
                  ? <div className="pcp-empty"><div style={{ fontSize:40, marginBottom:10 }}>📋</div><p style={{ fontWeight:600 }}>Нет активных заявок</p></div>
                  : openReqs.map(r => renderItem(r, false))
                )}
                {tab === 'completed' && (() => {
                  const items = completedReqs.length > 0 ? completedReqs.map(r=>({...r,_isDeal:false})) : completedDealsData.map(d=>({...d,_isDeal:true}));
                  return items.length === 0
                    ? <div className="pcp-empty"><div style={{ fontSize:40, marginBottom:10 }}>✅</div><p style={{ fontWeight:600 }}>Завершённых заказов нет</p></div>
                    : items.map(item => renderItem(item, item._isDeal));
                })()}
                {tab === 'reviews' && (reviews.length === 0
                  ? <div className="pcp-empty"><div style={{ fontSize:40, marginBottom:10 }}>⭐</div><p style={{ fontWeight:600 }}>Отзывов пока нет</p></div>
                  : reviews.map(r => (
                    <div key={r.id} className="pcp-review">
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                        {r.authorAvatarUrl
                          ? <img src={r.authorAvatarUrl} alt="" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                          : <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#257af4,#1a5cbf)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, flexShrink:0 }}>{(r.authorName||'М')[0].toUpperCase()}</div>
                        }
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>{[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Мастер'}</div>
                          <div style={{ fontSize:12, color:'#8f8f8f' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                        </div>
                        <div style={{ color:'#ffb800', fontSize:16 }}>{'★'.repeat(r.rating||0)}<span style={{ color:'#e0e0e0' }}>{'★'.repeat(5-(r.rating||0))}</span></div>
                      </div>
                      {(r.text || r.comment) && <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
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
                <h3 style={{ fontSize:20, fontWeight:800, color:'#1a1a1a', margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                <p style={{ color:'#8f8f8f', margin:'0 0 20px' }}>Спасибо за вашу оценку</p>
                <button onClick={() => setReviewModal(false)} style={{ padding:'10px 28px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>{reviewDeal?._reviewByWorker ? 'Отзыв о заказчике' : 'Отзыв о мастере'}</h2>
                  <button onClick={() => setReviewModal(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8f8f8f' }}>×</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f8f9fa', borderRadius:10, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                    {reviewDeal?._reviewByWorker ? (initials||'З') : (reviewDeal?.workerName?.[0]?.toUpperCase()||'М')}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>{reviewDeal?._reviewByWorker ? fullName : reviewDeal?.workerName}</div>
                    <div style={{ fontSize:12, color:'#8f8f8f' }}>{reviewDeal?._reviewByWorker ? 'Заказчик' : 'Мастер'}</div>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:8 }}>Оценка</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewForm(p => ({...p, rating:star}))}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:36, padding:0, color: star <= reviewForm.rating ? '#ffb800' : '#e0e0e0', transition:'color .1s' }}>★</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:8 }}>Комментарий</div>
                  <textarea value={reviewForm.text} onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                    placeholder="Расскажите об опыте работы..."
                    style={{ width:'100%', padding:'12px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:14, lineHeight:1.6, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                    onFocus={e => e.target.style.borderColor='#257af4'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
                </div>
                <button onClick={handleReviewSubmit} disabled={reviewSending || !reviewForm.text.trim()}
                  style={{ width:'100%', padding:'13px', background: reviewForm.text.trim() ? '#e8410a' : '#e0e0e0', border:'none', borderRadius:10, color: reviewForm.text.trim() ? '#fff' : '#999', fontSize:15, fontWeight:700, cursor: reviewForm.text.trim() ? 'pointer' : 'not-allowed' }}>
                  {reviewSending ? 'Отправляем...' : '⭐ Отправить отзыв'}
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