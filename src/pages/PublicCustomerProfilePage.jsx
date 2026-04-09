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

const STATUS = {
  OPEN:           { label: 'Открыта',    color: '#1a8c3a', bg: 'rgba(76,217,100,.15)' },
  IN_NEGOTIATION: { label: 'Обсуждение', color: '#0088cc', bg: 'rgba(0,170,255,.12)'  },
  ASSIGNED:       { label: 'Назначена',  color: '#b45309', bg: 'rgba(245,158,11,.12)' },
  IN_PROGRESS:    { label: 'В работе',   color: '#b45309', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:      { label: 'Завершена',  color: '#1a8c3a', bg: 'rgba(76,217,100,.15)' },
  CANCELLED:      { label: 'Отменена',   color: '#c0392b', bg: 'rgba(239,68,68,.12)'  },
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
      setRequests([]);
      setReviews([]);
      setDeals([]);
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
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#8f8f8f' }}>
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

  const tabs = [
    { key: 'open',      label: 'Активные',    count: openReqs.length },
    { key: 'completed', label: 'Завершённые', count: completedReqs.length || completedDeals.length },
    { key: 'reviews',   label: 'Отзывы',      count: reviews.length },
  ];

  const renderCard = (item, isDeal) => {
    const st = isDeal ? { label:'Завершена', color:'#1a8c3a', bg:'rgba(76,217,100,.15)' } : (STATUS[item.status] || STATUS.OPEN);
    const hasPhoto = item.photos && item.photos.length > 0;
    const pi = photoIdx[item.id] || 0;
    const cat = item.categoryName || item.category || null;

    return (
      <div key={`${isDeal?'d':'r'}-${item.id}`}
        style={{ background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #e5e5e5', cursor: hasPhoto ? 'pointer' : 'default', transition:'box-shadow .2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
        onClick={hasPhoto ? () => setLightbox({ photos: item.photos, index: pi }) : undefined}>
        {/* Фото */}
        <div style={{ position:'relative', aspectRatio:'4/3', background:'#f0f0f0', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, color:'#ccc' }}>
          {hasPhoto
            ? <img src={item.photos[pi]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' }} />
            : (isDeal ? '🤝' : '📋')
          }
          <div style={{ position:'absolute', top:8, left:8 }}>
            <span style={{ background: isDeal ? 'rgba(76,217,100,.9)' : 'rgba(0,0,0,.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>
              {isDeal ? '✅ Завершена' : st.label}
            </span>
          </div>
          {cat && <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)', color:'#fff', fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:6 }}>{cat}</div>}
          {hasPhoto && item.photos.length > 1 && <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:11, padding:'2px 6px', borderRadius:4 }}>📷 {item.photos.length}</div>}
        </div>
        {/* Контент */}
        <div style={{ padding:'12px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', marginBottom:4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{item.title || 'Задача'}</div>
          {(item.agreedPrice || item.budgetTo) && (
            <div style={{ fontSize:16, fontWeight:800, color:'#1a1a1a', marginBottom:4 }}>
              {item.agreedPrice ? `${Number(item.agreedPrice).toLocaleString('ru-RU')} ₽` : `до ${Number(item.budgetTo).toLocaleString('ru-RU')} ₽`}
            </div>
          )}
          <div style={{ fontSize:12, color:'#8f8f8f', display:'flex', gap:8, flexWrap:'wrap', marginBottom: isDeal ? 8 : 0 }}>
            {isDeal && item.workerName && <span>👤 {item.workerName}</span>}
            {!isDeal && item.addressText && <span>📍 {item.addressText}</span>}
            {item.createdAt && <span>{timeAgo(item.createdAt)}</span>}
          </div>
          {/* Кнопки отзыва */}
          {isDeal && userId === customerId && !item.hasReview && (
            <button onClick={e => { e.stopPropagation(); setReviewDeal({...item, _reviewByWorker:false}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}
              style={{ padding:'7px 12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ⭐ Оставить отзыв
            </button>
          )}
          {isDeal && userId === customerId && item.hasReview && (
            <div style={{ fontSize:12, color:'#4cd964', fontWeight:600 }}>✓ Отзыв оставлен</div>
          )}
          {isDeal && userId !== customerId && item.workerId === userId && !item.hasWorkerReview && (
            <button onClick={e => { e.stopPropagation(); setReviewDeal({...item, _reviewByWorker:true}); setReviewModal(true); setReviewDone(false); setReviewForm({rating:5,text:''}); }}
              style={{ padding:'7px 12px', background:'linear-gradient(135deg,#e8410a,#ff7043)', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ⭐ Отзыв заказчику
            </button>
          )}
          {isDeal && userId !== customerId && item.workerId === userId && item.hasWorkerReview && (
            <div style={{ fontSize:12, color:'#4cd964', fontWeight:600 }}>✓ Отзыв оставлен</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background:'#f4f4f4', minHeight:'100vh', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>

      {/* Топбар */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e5e5', padding:'10px 0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 20px' }}>
          <button onClick={() => navigate(-1)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#00aaff', fontWeight:500, display:'flex', alignItems:'center', gap:4, padding:0 }}>
            ← Назад
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px 60px', display:'grid', gridTemplateColumns:'280px 1fr', gap:24, alignItems:'flex-start' }}>

        {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
        <div>
          <div style={{ background:'#fff', borderRadius:16, padding:'24px 20px', marginBottom:12, border:'1px solid #e5e5e5' }}>
            {/* Аватар */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:16 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} style={{ width:120, height:120, borderRadius:'50%', objectFit:'cover', border:'3px solid #f0f0f0' }} />
              ) : (
                <div style={{ width:120, height:120, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:40 }}>
                  {initials}
                </div>
              )}
              <h1 style={{ fontSize:22, fontWeight:700, color:'#1a1a1a', margin:'14px 0 4px', textAlign:'center' }}>{fullName}</h1>
              <div style={{ fontSize:14, color:'#8f8f8f', marginBottom:8 }}>Заказчик</div>
              {avgRating && (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'#ffb800', fontSize:18 }}>★</span>
                  <span style={{ fontSize:16, fontWeight:700, color:'#1a1a1a' }}>{avgRating}</span>
                  <span style={{ fontSize:13, color:'#8f8f8f' }}>· {reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}</span>
                </div>
              )}
              {since && <div style={{ fontSize:12, color:'#8f8f8f', marginTop:6 }}>{since}</div>}
            </div>

            {/* Статы */}
            <div style={{ display:'flex', justifyContent:'center', gap:24, padding:'14px 0', borderTop:'1px solid #f0f0f0', borderBottom:'1px solid #f0f0f0', marginBottom:16 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#1a1a1a' }}>{total}</div>
                <div style={{ fontSize:11, color:'#8f8f8f', textTransform:'uppercase', letterSpacing:.5 }}>заявок</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#1a1a1a' }}>{done}</div>
                <div style={{ fontSize:11, color:'#8f8f8f', textTransform:'uppercase', letterSpacing:.5 }}>выполнено</div>
              </div>
            </div>

            {/* Бейджи */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#f7f7f7', borderRadius:8, fontSize:14, color:'#333' }}>
                <span style={{ color:'#4cd964' }}>✔</span> Документы проверены
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#f7f7f7', borderRadius:8, fontSize:14, color:'#333' }}>
                <span>📍</span> {customer?.city || 'Йошкар-Ола'}
              </div>
              {total >= 1 && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#f7f7f7', borderRadius:8, fontSize:14, color:'#333' }}>
                  <span>⭐</span> Активный заказчик
                </div>
              )}
              {done >= 1 && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#f7f7f7', borderRadius:8, fontSize:14, color:'#333' }}>
                  <span>🤝</span> Есть завершённые сделки
                </div>
              )}
            </div>

            {/* Кнопка написать */}
            {userId && userId !== customerId && (
              <button onClick={() => navigate(`/chat/${customerId}`)}
                style={{ width:'100%', padding:'13px', background:'#00aaff', border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                Написать
              </button>
            )}
          </div>
        </div>

        {/* ══ ПРАВАЯ КОЛОНКА ══ */}
        <div>
          {/* Вкладки как авито */}
          <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'2px solid #e5e5e5' }}>
            {tabs.map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  padding:'12px 20px', background:'none', border:'none',
                  borderBottom: tab===key ? '2px solid #000' : '2px solid transparent',
                  marginBottom:-2, cursor:'pointer',
                  fontSize:16, fontWeight: tab===key ? 700 : 500,
                  color: tab===key ? '#1a1a1a' : '#8f8f8f',
                  transition:'all .15s',
                }}>
                {label} <span style={{ fontSize:14 }}>{count}</span>
              </button>
            ))}
          </div>

          {/* АКТИВНЫЕ */}
          {tab === 'open' && (openReqs.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', color:'#8f8f8f', border:'1px solid #e5e5e5' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
              <p style={{ fontWeight:600, fontSize:16 }}>Нет активных заявок</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
              {openReqs.map(r => renderCard(r, false))}
            </div>
          ))}

          {/* ЗАВЕРШЁННЫЕ */}
          {tab === 'completed' && (() => {
            const items = completedReqs.length > 0
              ? completedReqs.map(r => ({...r, _isDeal: false}))
              : completedDeals.map(d => ({...d, _isDeal: true}));
            return items.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', color:'#8f8f8f', border:'1px solid #e5e5e5' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
                <p style={{ fontWeight:600, fontSize:16 }}>Завершённых заказов нет</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
                {items.map(item => renderCard(item, item._isDeal))}
              </div>
            );
          })()}

          {/* ОТЗЫВЫ */}
          {tab === 'reviews' && (reviews.length === 0 ? (
            <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', color:'#8f8f8f', border:'1px solid #e5e5e5' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
              <p style={{ fontWeight:600, fontSize:16 }}>Отзывов пока нет</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', border:'1px solid #e5e5e5' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    {r.authorAvatarUrl
                      ? <img src={r.authorAvatarUrl} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                      : <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#257af4,#1a5cbf)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 }}>{(r.authorName||'М')[0].toUpperCase()}</div>
                    }
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>{[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Мастер'}</div>
                      <div style={{ fontSize:12, color:'#8f8f8f' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                    </div>
                    <div style={{ display:'flex', gap:2 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:18, color: s <= (r.rating||0) ? '#ffb800' : '#e0e0e0' }}>★</span>)}
                    </div>
                  </div>
                  {(r.text || r.comment) && <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* МОДАЛКА ОТЗЫВА */}
      {reviewModal && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setReviewModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, padding:28 }} onClick={e => e.stopPropagation()}>
            {reviewDone ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                <h3 style={{ fontSize:20, fontWeight:800, margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                <button onClick={() => setReviewModal(false)} style={{ marginTop:16, padding:'10px 28px', background:'#00aaff', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>{reviewDeal?._reviewByWorker ? 'Отзыв о заказчике' : 'Отзыв о мастере'}</h2>
                  <button onClick={() => setReviewModal(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8f8f8f' }}>×</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f7f7f7', borderRadius:10, marginBottom:20 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                    {reviewDeal?._reviewByWorker ? (initials||'З') : (reviewDeal?.workerName?.[0]?.toUpperCase()||'М')}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{reviewDeal?._reviewByWorker ? fullName : reviewDeal?.workerName}</div>
                    <div style={{ fontSize:12, color:'#8f8f8f' }}>{reviewDeal?._reviewByWorker ? 'Заказчик' : 'Мастер'}</div>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#333', marginBottom:8 }}>Оценка</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewForm(p => ({...p, rating:star}))}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:36, padding:0, color: star <= reviewForm.rating ? '#ffb800' : '#e0e0e0' }}>★</button>
                    ))}
                  </div>
                </div>
                <textarea value={reviewForm.text} onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                  placeholder="Расскажите об опыте работы..."
                  style={{ width:'100%', padding:'12px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:14, lineHeight:1.6, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box', marginBottom:16, fontFamily:'inherit' }}
                  onFocus={e => e.target.style.borderColor='#00aaff'} onBlur={e => e.target.style.borderColor='#e0e0e0'} />
                <button onClick={handleReviewSubmit} disabled={reviewSending || !reviewForm.text.trim()}
                  style={{ width:'100%', padding:'13px', background: reviewForm.text.trim() ? '#00aaff' : '#e0e0e0', border:'none', borderRadius:10, color: reviewForm.text.trim() ? '#fff' : '#999', fontSize:15, fontWeight:700, cursor: reviewForm.text.trim() ? 'pointer' : 'not-allowed' }}>
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