import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

function getExperience(registeredAt) {
  if (!registeredAt) return null;
  const days = Math.floor((Date.now() - new Date(registeredAt)) / 86400000);
  const years = Math.floor(days / 365);
  const months = Math.floor(days / 30);
  if (years >= 1) return `${years} ${years===1?'год':years<5?'года':'лет'}`;
  if (months >= 1) return `${months} ${months===1?'месяц':months<5?'месяца':'месяцев'}`;
  return 'Новичок';
}

export default function PublicWorkerProfilePage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [worker,         setWorker]         = useState(null);
  const [services,       setServices]       = useState([]);
  const [reviews,        setReviews]        = useState([]);
  const [completedWorks, setCompletedWorks] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState('works');
  const [lightbox,       setLightbox]       = useState(null);
  const [photoIdx,       setPhotoIdx]       = useState({});
  const [showReviews,    setShowReviews]    = useState(false);
  const [reviewModal,    setReviewModal]    = useState(false);
  const [reviewForm,     setReviewForm]     = useState({ rating: 5, text: '' });
  const [reviewSending,  setReviewSending]  = useState(false);
  const [reviewDone,     setReviewDone]     = useState(false);

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
    if (!workerId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/workers/${workerId}/services`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/workers/${workerId}/stats`).then(r => r.ok ? r.json() : {}),
      fetch(`${API}/reviews/worker/${workerId}`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/workers/${workerId}/completed-works`).then(r => r.ok ? r.json() : []),
    ]).then(([svc, stats, rev, works]) => {
      setServices(Array.isArray(svc) ? svc : []);
      setReviews(Array.isArray(rev) ? rev : []);
      setCompletedWorks(Array.isArray(works) ? works : []);
      setWorker({
        name: stats?.displayName || svc?.[0]?.workerName || 'Мастер',
        lastName: stats?.lastName || '',
        avatarUrl: stats?.avatarUrl || null,
        city: stats?.city || 'Йошкар-Ола',
        rating: stats?.averageRating || 0,
        reviewsCount: stats?.reviewsCount || 0,
        registeredAt: stats?.registeredAt || null,
      });
    }).catch(() => {
      setWorker({ name: 'Мастер', lastName: '', city: 'Йошкар-Ола', rating: 0, reviewsCount: 0 });
    }).finally(() => setLoading(false));
  }, [workerId]);

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:32, marginBottom:8 }}>⏳</div><p>Загружаем профиль...</p></div>
    </div>
  );

  const fullName  = [worker?.name, worker?.lastName].filter(Boolean).join(' ');
  const initials  = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since     = memberSince(worker?.registeredAt);
  const exp       = getExperience(worker?.registeredAt);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length).toFixed(1)
    : worker?.rating > 0 ? Number(worker.rating).toFixed(1) : null;

  const badgeIcons  = { polite:'😊', fast:'⚡', quality:'💎', price:'💰' };
  const badgeLabels = { polite:'Вежливый', fast:'Быстро', quality:'Качественно', price:'Цена/качество' };

  const handleReviewSubmit = async () => {
    if (!reviewForm.text.trim()) return;
    setReviewSending(true);
    try {
      // Ищем dealId — последнюю завершённую сделку с этим мастером
      const res = await fetch(`${API}/deals`, { headers: { 'X-User-Id': userId } });
      const deals = res.ok ? await res.json() : [];
      const completedDeal = deals.find(d => d.workerId === workerId && d.status === 'COMPLETED' && !d.hasReview);
      if (!completedDeal) { alert('Нет завершённых сделок для отзыва'); setReviewSending(false); return; }
      await fetch(`${API}/deals/${completedDeal.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ rating: reviewForm.rating, text: reviewForm.text, comment: reviewForm.text }),
      });
      setReviewDone(true);
      // Перезагружаем отзывы
      const r = await fetch(`${API}/reviews/worker/${workerId}`);
      if (r.ok) setReviews(await r.json());
    } catch (e) { console.error(e); }
    setReviewSending(false);
  };

  return (
    <div style={{ background:'#f5f5f5', minHeight:'100vh' }}>

      {/* Навигация */}
      <div style={{ background:'#fff', borderBottom:'1.5px solid #e5e7eb', padding:'12px 0' }}>
        <div className="container">
          <button onClick={() => navigate(-1)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, fontWeight:600, color:'#6b7280', padding:0, display:'flex', alignItems:'center', gap:6 }}
            onMouseEnter={e => e.currentTarget.style.color='#111827'}
            onMouseLeave={e => e.currentTarget.style.color='#6b7280'}
          >← Назад</button>
        </div>
      </div>

      <div className="container" style={{ paddingTop:24, paddingBottom:60 }}>
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'flex-start' }}>

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div>
            <div style={{ background:'#fff', borderRadius:12, padding:'24px 20px', marginBottom:12 }}>

              {/* Аватар */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:16 }}>
                {worker?.avatarUrl ? (
                  <img src={worker.avatarUrl} alt={fullName}
                    style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid #e5e7eb' }} />
                ) : (
                  <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:26 }}>
                    {initials}
                  </div>
                )}
              </div>

              <h1 style={{ fontSize:18, fontWeight:700, color:'#111827', textAlign:'center', margin:'0 0 4px' }}>{fullName}</h1>

              {/* Рейтинг */}
              {avgRating ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, margin:'4px 0 8px', cursor:'pointer' }}
                  onClick={() => setShowReviews(true)}>
                  <span style={{ fontSize:16, fontWeight:900, color:'#111827' }}>{avgRating}</span>
                  <span style={{ color:'#f59e0b', fontSize:14 }}>{'★'.repeat(Math.round(Number(avgRating)))}</span>
                  <span style={{ fontSize:12, color:'#6b7280', textDecoration:'underline' }}>
                    {reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}
                  </span>
                </div>
              ) : (
                <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', margin:'0 0 4px' }}>Нет отзывов</p>
              )}
              {since && <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', margin:'0 0 16px' }}>{since}</p>}

              {/* Статистика */}
              <div style={{ display:'flex', alignItems:'center', borderRadius:12, padding:'16px 8px', marginBottom:12 }}>
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:900, color:'#111827', lineHeight:1, marginBottom:4 }}>{completedWorks.length}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px' }}>ЗАКАЗОВ</div>
                </div>
                <div style={{ width:1.5, height:36, background:'#e5e7eb', flexShrink:0 }} />
                <div style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:900, color:'#111827', lineHeight:1, marginBottom:4 }}>{reviews.length || 0}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px' }}>ОТЗЫВОВ</div>
                </div>
              </div>

              {/* Бейджи */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', fontSize:14, fontWeight:600, color:'#374151' }}>
                  <span style={{ color:'#22c55e', fontSize:15 }}>✔</span> Документы проверены
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', fontSize:14, fontWeight:600, color:'#374151', borderTop:'1px solid #f3f4f6' }}>
                  <span style={{ fontSize:15 }}>📍</span> {worker?.city || 'Йошкар-Ола'}
                </div>
                {completedWorks.length >= 1 && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', fontSize:14, fontWeight:600, color:'#374151', borderTop:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:15 }}>⭐</span> Активный мастер
                  </div>
                )}
                {completedWorks.length >= 1 && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', fontSize:14, fontWeight:600, color:'#374151', borderTop:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:15 }}>🤝</span> Есть завершённые работы
                  </div>
                )}
              </div>

              {/* Кнопка написать */}
              {userId && userId !== workerId && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <button onClick={() => navigate(`/chat/${workerId}`)}
                    style={{ width:'100%', padding:'12px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='#c73208'}
                    onMouseLeave={e => e.currentTarget.style.background='#e8410a'}
                  >💬 Написать</button>
                  <button onClick={() => { setReviewModal(true); setReviewDone(false); setReviewForm({ rating:5, text:'' }); }}
                    style={{ width:'100%', padding:'11px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, color:'#374151', fontSize:14, fontWeight:700, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#374151'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='#e5e7eb'}
                  >⭐ Оставить отзыв</button>
                </div>
              )}
            </div>
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div>
            <div style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 12px' }}>Профиль мастера</h2>
              <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e5e7eb' }}>
                {[
                  ['active', 'Активные', services.length],
                  ['works',  'Завершённые', completedWorks.length],
                  ['reviews','Отзывы', reviews.length],
                ].map(([key,label,count]) => (
                  <button key={key} onClick={() => setTab(key)}
                    style={{ padding:'10px 20px', background:'none', border:'none', cursor:'pointer', fontSize:14, fontWeight:700,
                      color:tab===key?'#e8410a':'#6b7280', borderBottom:tab===key?'2px solid #e8410a':'2px solid transparent', marginBottom:-2, transition:'all .15s' }}>
                    {label} <span style={{ fontSize:13, fontWeight:600 }}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* АКТИВНЫЕ */}
            {tab === 'active' && (services.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', color:'#9ca3af' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>⚙️</div>
                <p style={{ fontWeight:600, fontSize:15 }}>Нет активных заказов</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {services.map(s => (
                  <div key={s.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{s.title}</div>
                          <span style={{ background:'rgba(245,158,11,.12)', color:'#f59e0b', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:4, whiteSpace:'nowrap' }}>⚙️ В работе</span>
                        </div>
                        {s.description && <p style={{ fontSize:13, color:'#6b7280', margin:0, lineHeight:1.6 }}>{s.description}</p>}
                      </div>
                      <div style={{ fontSize:16, fontWeight:800, color:'#111827', flexShrink:0 }}>
                        {s.priceTo ? `до ${Number(s.priceTo).toLocaleString('ru-RU')} ₽`
                          : s.priceFrom ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽`
                          : 'Договорная'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {tab === 'works' && (completedWorks.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', color:'#9ca3af' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🔨</div>
                <p style={{ fontWeight:600, fontSize:15 }}>Выполненных работ пока нет</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:12 }}>
                {completedWorks.map(work => {
                  const hasPhoto = work.photos && work.photos.length > 0;
                  const pi = photoIdx[work.id] || 0;
                  return (
                    <div key={work.id}
                      style={{ background:'#fff', borderRadius:12, overflow:'hidden', transition:'box-shadow .2s', cursor:'default' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.12)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                      {/* Фото */}
                      {hasPhoto ? (
                        <div style={{ position:'relative', aspectRatio:'4/3', overflow:'hidden', cursor:'pointer', background:'#f3f4f6' }}
                          onClick={() => setLightbox({ photos: work.photos, index: pi })}>
                          <img src={work.photos[pi]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                          {work.photos.length > 1 && (
                            <>
                              <button onClick={e => { e.stopPropagation(); setPhotoIdx(p => ({...p,[work.id]:((p[work.id]||0)-1+work.photos.length)%work.photos.length})); }}
                                style={{ position:'absolute', left:6, top:'50%', transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                              <button onClick={e => { e.stopPropagation(); setPhotoIdx(p => ({...p,[work.id]:((p[work.id]||0)+1)%work.photos.length})); }}
                                style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                              <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:999 }}>
                                {pi+1}/{work.photos.length}
                              </div>
                            </>
                          )}
                          {/* Статус поверх фото */}
                          <div style={{ position:'absolute', top:8, left:8, background:'rgba(255,255,255,0.92)', color:'#22c55e', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:4 }}>
                            ✅ Завершена
                          </div>
                          {work.categoryName && (
                            <div style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.92)', color:'#6366f1', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:4 }}>
                              {work.categoryName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ aspectRatio:'4/3', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, color:'#d1d5db', position:'relative' }}>
                          🔨
                          <div style={{ position:'absolute', top:8, left:8, background:'rgba(255,255,255,0.92)', color:'#22c55e', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:4 }}>
                            ✅ Завершена
                          </div>
                          {work.categoryName && (
                            <div style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.92)', color:'#6366f1', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:4 }}>
                              {work.categoryName}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Контент */}
                      <div style={{ padding:'12px 14px' }}>
                        <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:'0 0 6px', lineHeight:1.3,
                          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {work.title}
                        </h3>
                        {work.price && (
                          <div style={{ fontSize:16, fontWeight:900, color:'#111827', margin:'0 0 6px' }}>
                            {Number(work.price).toLocaleString('ru-RU')} ₽
                          </div>
                        )}
                        {work.description && work.description !== 'Без описания' && (
                          <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 8px', lineHeight:1.5,
                            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                            {work.description}
                          </p>
                        )}
                        <div style={{ fontSize:12, color:'#9ca3af', display:'flex', flexDirection:'column', gap:2 }}>
                          {work.customerName && <span>👤 {work.customerName}</span>}
                          {work.completedAt  && <span>{timeAgo(work.completedAt)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* ОТЗЫВЫ */}
            {tab === 'reviews' && (reviews.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:12, padding:'60px 24px', textAlign:'center', color:'#9ca3af' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
                <p style={{ fontWeight:600, fontSize:15 }}>Отзывов пока нет</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, flexShrink:0 }}>
                        {(r.authorName||'К')[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                          {[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент'}
                        </div>
                        <div style={{ fontSize:12, color:'#9ca3af' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                      </div>
                      <div style={{ color:'#f59e0b', fontWeight:700 }}>{'★'.repeat(r.rating||0)}{'☆'.repeat(5-(r.rating||0))}</div>
                    </div>
                    {r.badges && r.badges.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                        {r.badges.map(b => (
                          <span key={b} style={{ fontSize:12, fontWeight:600, color:'#374151', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 10px' }}>
                            {badgeIcons[b]} {badgeLabels[b]}
                          </span>
                        ))}
                      </div>
                    )}
                    {(r.text || r.comment) && <p style={{ fontSize:14, color:'#374151', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* МОДАЛКА ОТЗЫВОВ */}
      {showReviews && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setShowReviews(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'80vh', overflow:'auto', padding:28 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:20, fontWeight:800, margin:0 }}>Отзывы о мастере</h2>
              <button onClick={() => setShowReviews(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>×</button>
            </div>
            {avgRating && (
              <div style={{ display:'flex', gap:24, alignItems:'center', padding:'16px 20px', background:'#f9fafb', borderRadius:12, marginBottom:20 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:48, fontWeight:900, color:'#111827', lineHeight:1 }}>{avgRating}</div>
                  <div style={{ color:'#f59e0b', fontSize:20, marginTop:4 }}>{'★'.repeat(Math.round(Number(avgRating)))}</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{reviews.length} отзыв{reviews.length===1?'':reviews.length<5?'а':'ов'}</div>
                </div>
                <div style={{ flex:1 }}>
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => r.rating===star).length;
                    const pct = reviews.length > 0 ? (count/reviews.length*100) : 0;
                    return (
                      <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ color:'#f59e0b', fontSize:12, width:12 }}>{'★'.repeat(star)}</span>
                        <div style={{ flex:1, height:6, background:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:'#f59e0b', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:12, color:'#9ca3af', width:16, textAlign:'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ borderBottom:'1px solid #f3f4f6', paddingBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>
                      {(r.authorName||'К')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                        {[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент'}
                      </div>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                    </div>
                    <div style={{ marginLeft:'auto', color:'#f59e0b', fontWeight:700 }}>{'★'.repeat(r.rating||0)}{'☆'.repeat(5-(r.rating||0))}</div>
                  </div>
                  {(r.text || r.comment) && <p style={{ fontSize:14, color:'#374151', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLightbox(null)}>
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:8, display:'block', pointerEvents:'none', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }} />
            <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:999 }}>
              {lightbox.index+1} / {lightbox.photos.length}
            </div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>×</button>
            {lightbox.photos.length > 1 && (<>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }}
                style={{ position:'absolute', left:-50, top:'50%', transform:'translateY(-50%)', width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }}
                style={{ position:'absolute', right:-50, top:'50%', transform:'translateY(-50%)', width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>›</button>
            </>)}
          </div>
          {lightbox.photos.length > 1 && (
            <div style={{ display:'flex', gap:6, marginTop:12 }} onClick={e => e.stopPropagation()}>
              {lightbox.photos.map((p,i) => (
                <div key={i} onClick={() => setLightbox(l => ({...l, index:i}))}
                  style={{ width:48, height:36, borderRadius:4, overflow:'hidden', cursor:'pointer', border:i===lightbox.index?'2px solid #e8410a':'2px solid rgba(255,255,255,0.2)', opacity:i===lightbox.index?1:0.55 }}>
                  <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* МОДАЛКА ОТЗЫВА */}
      {reviewModal && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setReviewModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, padding:28 }}
            onClick={e => e.stopPropagation()}>
            {reviewDone ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                <h3 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                <p style={{ color:'#6b7280', margin:'0 0 20px' }}>Спасибо за вашу оценку</p>
                <button onClick={() => setReviewModal(false)}
                  style={{ padding:'10px 28px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Отзыв о мастере</h2>
                  <button onClick={() => setReviewModal(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                {/* Мастер */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f9fafb', borderRadius:10, marginBottom:20 }}>
                  {worker?.avatarUrl ? (
                    <img src={worker.avatarUrl} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                  ) : (
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                      {initials}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{fullName}</div>
                    <div style={{ fontSize:12, color:'#9ca3af' }}>Мастер</div>
                  </div>
                </div>

                {/* Звёзды */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Оценка</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewForm(p => ({...p, rating:star}))}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:32, padding:0, opacity: star <= reviewForm.rating ? 1 : 0.25, transition:'opacity .15s' }}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Текст */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Комментарий</div>
                  <textarea
                    value={reviewForm.text}
                    onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                    placeholder="Расскажите о качестве работы, пунктуальности, общении..."
                    style={{ width:'100%', padding:'12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, lineHeight:1.6, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='#e8410a'}
                    onBlur={e => e.target.style.borderColor='#e5e7eb'}
                  />
                </div>

                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewSending || !reviewForm.text.trim()}
                  style={{ width:'100%', padding:'13px', background: reviewForm.text.trim() ? '#e8410a' : '#e5e7eb', border:'none', borderRadius:8, color: reviewForm.text.trim() ? '#fff' : '#9ca3af', fontSize:15, fontWeight:700, cursor: reviewForm.text.trim() ? 'pointer' : 'not-allowed', transition:'background .15s' }}>
                  {reviewSending ? 'Отправляем...' : '⭐ Отправить отзыв'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}