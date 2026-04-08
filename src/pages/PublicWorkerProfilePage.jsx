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
      setReviews(Array.isArray(rev) ? rev.filter(r => r.status === 'APPROVED') : []);
      setCompletedWorks(Array.isArray(works) ? works : []);
      setWorker({
        name: stats?.displayName || 'Мастер',
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
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'#8f8f8f' }}>
        <div style={{ fontSize:32, marginBottom:8 }}>⏳</div><p>Загружаем профиль...</p>
      </div>
    </div>
  );

  const fullName  = [worker?.name, worker?.lastName].filter(Boolean).join(' ');
  const initials  = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since     = memberSince(worker?.registeredAt);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length).toFixed(1)
    : worker?.rating > 0 ? Number(worker.rating).toFixed(1) : null;

  const handleReviewSubmit = async () => {
    if (!reviewForm.text.trim()) return;
    setReviewSending(true);
    try {
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
      const r = await fetch(`${API}/reviews/worker/${workerId}`);
      if (r.ok) setReviews((await r.json()).filter(r => r.status === 'APPROVED'));
    } catch (e) { console.error(e); }
    setReviewSending(false);
  };

  const css = `
    .pwp-page { background:#f2f3f5; min-height:100vh; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .pwp-topbar { background:#fff; border-bottom:1px solid #e8e8e8; padding:10px 0; }
    .pwp-container { max-width:1060px; margin:0 auto; padding:0 16px; }
    .pwp-grid { display:grid; grid-template-columns:300px 1fr; gap:16px; padding-top:16px; padding-bottom:60px; align-items:flex-start; }
    .pwp-card { background:#fff; border-radius:12px; padding:20px; margin-bottom:12px; }
    .pwp-tab-panel { background:#fff; border-radius:12px; overflow:hidden; }
    .pwp-tab-bar { display:flex; border-bottom:1px solid #f0f0f0; padding:0 8px; }
    .pwp-tab { padding:14px 16px; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-1px; cursor:pointer; font-size:14px; font-weight:700; color:#8f8f8f; transition:all .15s; white-space:nowrap; }
    .pwp-tab.active { color:#e8410a; border-bottom-color:#e8410a; }
    .pwp-tab-content { padding:16px; }
    .pwp-work-card { background:#f8f9fa; border-radius:10px; display:flex; overflow:hidden; margin-bottom:10px; border:1px solid #eee; transition:box-shadow .2s; }
    .pwp-work-card:hover { box-shadow:0 2px 12px rgba(0,0,0,.1); }
    .pwp-work-img { width:130px; min-width:130px; height:100px; object-fit:cover; background:#e8e8e8; display:flex; align-items:center; justify-content:center; font-size:28px; color:#ccc; position:relative; flex-shrink:0; overflow:hidden; }
    .pwp-work-body { flex:1; padding:12px 14px; display:flex; flex-direction:column; gap:4; }
    .pwp-badge-row { display:flex; align-items:center; gap:6; flex-wrap:wrap; }
    .pwp-badge-green { background:rgba(76,217,100,.15); color:#1a8c3a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; }
    .pwp-badge-blue { background:rgba(37,122,244,.12); color:#1a5cbf; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; }
    .pwp-badge-orange { background:rgba(245,158,11,.12); color:#b45309; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; }
    .pwp-review-card { background:#f8f9fa; border-radius:10px; padding:14px 16px; margin-bottom:10px; border:1px solid #eee; }
    .pwp-empty { text-align:center; padding:50px 24px; color:#8f8f8f; }
    .pwp-info-row { display:flex; align-items:center; gap:10; padding:10px 0; font-size:14px; color:#333; border-bottom:1px solid #f5f5f5; }
    .pwp-info-row:last-child { border-bottom:none; }
    .pwp-btn-primary { width:100%; padding:13px; background:#e8410a; border:none; border-radius:10px; color:#fff; font-size:15px; font-weight:700; cursor:pointer; margin-bottom:8px; transition:opacity .15s; }
    .pwp-btn-primary:hover { opacity:.88; }
    .pwp-btn-secondary { width:100%; padding:12px; background:#fff; border:1.5px solid #e0e0e0; border-radius:10px; color:#333; font-size:14px; font-weight:600; cursor:pointer; transition:border-color .15s; }
    .pwp-btn-secondary:hover { border-color:#333; }
    .pwp-stat-row { display:flex; padding-top:16px; margin-top:16px; border-top:1px solid #f0f0f0; }
    .pwp-stat { flex:1; text-align:center; }
    .pwp-stat-num { font-size:22px; font-weight:800; color:#1a1a1a; line-height:1; }
    .pwp-stat-label { font-size:11px; color:#8f8f8f; text-transform:uppercase; letter-spacing:.5px; margin-top:3px; }
    .pwp-stat-divider { width:1px; background:#f0f0f0; margin:4px 0; }
    @media(max-width:768px){ .pwp-grid{ grid-template-columns:1fr!important; } }
  `;

  return (
    <div className="pwp-page">
      <style>{css}</style>

      <div className="pwp-topbar">
        <div className="pwp-container">
          <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#257af4', fontWeight:500, display:'flex', alignItems:'center', gap:4, padding:0 }}
            onClick={() => navigate(-1)}>
            <span style={{ fontSize:18 }}>‹</span> Назад
          </button>
        </div>
      </div>

      <div className="pwp-container">
        <div className="pwp-grid">

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div>
            <div className="pwp-card">
              {/* Аватар + имя */}
              <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  {worker?.avatarUrl
                    ? <img src={worker.avatarUrl} alt={fullName} style={{ width:76, height:76, borderRadius:'50%', objectFit:'cover' }} />
                    : <div style={{ width:76, height:76, borderRadius:'50%', background:'linear-gradient(135deg,#257af4,#1a5cbf)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:26 }}>{initials}</div>
                  }
                  <div style={{ position:'absolute', bottom:2, right:2, width:14, height:14, borderRadius:'50%', background:'#4cd964', border:'2px solid #fff' }} />
                </div>
                <div style={{ flex:1 }}>
                  <h1 style={{ fontSize:20, fontWeight:700, color:'#1a1a1a', margin:'0 0 2px' }}>{fullName}</h1>
                  <div style={{ fontSize:13, color:'#8f8f8f', marginBottom:6 }}>Мастер</div>
                  {avgRating ? (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, cursor:'pointer' }} onClick={() => setShowReviews(true)}>
                      <span style={{ fontSize:16, fontWeight:800, color:'#1a1a1a' }}>{avgRating}</span>
                      <span style={{ color:'#ffb800', fontSize:14 }}>{'★'.repeat(Math.round(Number(avgRating)))}</span>
                      <span style={{ fontSize:12, color:'#257af4', textDecoration:'underline' }}>
                        {reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:'#8f8f8f', marginBottom:4 }}>Нет отзывов</div>
                  )}
                  {since && <div style={{ fontSize:12, color:'#8f8f8f' }}>{since}</div>}
                </div>
              </div>

              {/* Статистика */}
              <div className="pwp-stat-row">
                <div className="pwp-stat">
                  <div className="pwp-stat-num">{completedWorks.length}</div>
                  <div className="pwp-stat-label">Заказов</div>
                </div>
                <div className="pwp-stat-divider" />
                <div className="pwp-stat">
                  <div className="pwp-stat-num">{reviews.length}</div>
                  <div className="pwp-stat-label">Отзывов</div>
                </div>
                {avgRating && <>
                  <div className="pwp-stat-divider" />
                  <div className="pwp-stat">
                    <div className="pwp-stat-num">{avgRating}</div>
                    <div className="pwp-stat-label">Рейтинг</div>
                  </div>
                </>}
              </div>
            </div>

            {/* Бейджи */}
            <div className="pwp-card">
              <div className="pwp-info-row"><span style={{ color:'#4cd964', fontSize:16 }}>✔</span> Документы проверены</div>
              <div className="pwp-info-row"><span style={{ fontSize:16 }}>📍</span> {worker?.city || 'Йошкар-Ола'}</div>
              {completedWorks.length >= 1 && <div className="pwp-info-row"><span style={{ fontSize:16 }}>⭐</span> Активный мастер</div>}
              {completedWorks.length >= 1 && <div className="pwp-info-row"><span style={{ fontSize:16 }}>🤝</span> Есть завершённые работы</div>}
            </div>

            {/* Кнопки */}
            {userId && userId !== workerId && (
              <div>
                <button className="pwp-btn-primary" onClick={() => navigate(`/chat/${workerId}`)}>💬 Написать</button>
                <button className="pwp-btn-secondary" onClick={() => { setReviewModal(true); setReviewDone(false); setReviewForm({ rating:5, text:'' }); }}>⭐ Оставить отзыв</button>
              </div>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div>
            <div className="pwp-tab-panel">
              <div className="pwp-tab-bar">
                {[
                  ['works',   `Работы`,   completedWorks.length],
                  ['active',  `Активные`, services.length],
                  ['reviews', `Отзывы`,   reviews.length],
                ].map(([key, label, count]) => (
                  <button key={key} className={`pwp-tab${tab===key?' active':''}`} onClick={() => setTab(key)}>
                    {label} <span style={{ fontSize:13, fontWeight:600, color: tab===key ? '#e8410a' : '#bbb' }}>{count}</span>
                  </button>
                ))}
              </div>

              <div className="pwp-tab-content">

                {/* РАБОТЫ */}
                {tab === 'works' && (completedWorks.length === 0 ? (
                  <div className="pwp-empty"><div style={{ fontSize:40, marginBottom:10 }}>🔨</div><p style={{ fontWeight:600 }}>Выполненных работ пока нет</p></div>
                ) : completedWorks.map(work => {
                  const hasPhoto = work.photos && work.photos.length > 0;
                  const pi = photoIdx[work.id] || 0;
                  return (
                    <div key={work.id} className="pwp-work-card">
                      <div className="pwp-work-img" onClick={hasPhoto ? () => setLightbox({ photos: work.photos, index: pi }) : undefined}
                        style={{ cursor: hasPhoto ? 'pointer' : 'default' }}>
                        {hasPhoto
                          ? <img src={work.photos[pi]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                          : <span>🔨</span>
                        }
                        <div style={{ position:'absolute', top:6, left:6 }}>
                          <span style={{ background:'rgba(76,217,100,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4 }}>✅ Завершена</span>
                        </div>
                        {work.categoryName && <div style={{ position:'absolute', top:6, right:6, background:'rgba(37,122,244,.9)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4 }}>{work.categoryName}</div>}
                        {hasPhoto && work.photos.length > 1 && <div style={{ position:'absolute', bottom:4, right:4, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:4 }}>📷 {work.photos.length}</div>}
                      </div>
                      <div className="pwp-work-body">
                        <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>{work.title || 'Работа'}</div>
                        {work.price && <div style={{ fontSize:16, fontWeight:800, color:'#1a1a1a' }}>{Number(work.price).toLocaleString('ru-RU')} ₽</div>}
                        {work.description && work.description !== 'Без описания' && (
                          <p style={{ fontSize:13, color:'#666', margin:0, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{work.description}</p>
                        )}
                        <div style={{ fontSize:12, color:'#8f8f8f', display:'flex', gap:10, flexWrap:'wrap', marginTop:'auto' }}>
                          {work.customerName && <span>👤 {work.customerName}</span>}
                          {work.completedAt && <span>{timeAgo(work.completedAt)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                }))}

                {/* АКТИВНЫЕ */}
                {tab === 'active' && (services.length === 0 ? (
                  <div className="pwp-empty"><div style={{ fontSize:40, marginBottom:10 }}>⚙️</div><p style={{ fontWeight:600 }}>Нет активных заказов</p></div>
                ) : services.map(s => (
                  <div key={s.id} style={{ background:'#f8f9fa', borderRadius:10, padding:'14px 16px', border:'1px solid #eee', marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', marginBottom:6 }}>{s.title}</div>
                        <div className="pwp-badge-row" style={{ marginBottom: s.description ? 6 : 0 }}>
                          <span className="pwp-badge-orange">⚙️ В работе</span>
                          {s.categoryName && <span className="pwp-badge-blue">🏷 {s.categoryName}</span>}
                        </div>
                        {s.description && <p style={{ fontSize:13, color:'#666', margin:0, lineHeight:1.5 }}>{s.description}</p>}
                      </div>
                      <div style={{ fontSize:16, fontWeight:800, color:'#1a1a1a', flexShrink:0 }}>
                        {s.priceTo ? `до ${Number(s.priceTo).toLocaleString('ru-RU')} ₽` : s.priceFrom ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                      </div>
                    </div>
                  </div>
                )))}

                {/* ОТЗЫВЫ */}
                {tab === 'reviews' && (reviews.length === 0 ? (
                  <div className="pwp-empty"><div style={{ fontSize:40, marginBottom:10 }}>⭐</div><p style={{ fontWeight:600 }}>Отзывов пока нет</p></div>
                ) : reviews.map(r => (
                  <div key={r.id} className="pwp-review-card">
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                      {r.authorAvatarUrl
                        ? <img src={r.authorAvatarUrl} alt="" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                        : <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, flexShrink:0 }}>{(r.authorName||'К')[0].toUpperCase()}</div>
                      }
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>{[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент'}</div>
                        <div style={{ fontSize:12, color:'#8f8f8f' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                      </div>
                      <div style={{ color:'#ffb800', fontSize:16 }}>{'★'.repeat(r.rating||0)}<span style={{ color:'#e0e0e0' }}>{'★'.repeat(5-(r.rating||0))}</span></div>
                    </div>
                    {(r.text || r.comment) && <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
                  </div>
                )))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* МОДАЛКА ОТЗЫВОВ */}
      {showReviews && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setShowReviews(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'80vh', overflow:'auto', padding:28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Отзывы о мастере</h2>
              <button onClick={() => setShowReviews(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#8f8f8f' }}>×</button>
            </div>
            {reviews.map(r => (
              <div key={r.id} style={{ borderBottom:'1px solid #f0f0f0', paddingBottom:16, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  {r.authorAvatarUrl
                    ? <img src={r.authorAvatarUrl} alt="" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                    : <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, flexShrink:0 }}>{(r.authorName||'К')[0].toUpperCase()}</div>
                  }
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>{[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент'}</div>
                    <div style={{ fontSize:12, color:'#8f8f8f' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                  </div>
                  <div style={{ marginLeft:'auto', color:'#ffb800', fontWeight:700 }}>{'★'.repeat(r.rating||0)}</div>
                </div>
                {(r.text || r.comment) && <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Отзыв о мастере</h2>
                  <button onClick={() => setReviewModal(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#8f8f8f' }}>×</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f8f9fa', borderRadius:10, marginBottom:20 }}>
                  {worker?.avatarUrl
                    ? <img src={worker.avatarUrl} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                    : <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#257af4,#1a5cbf)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>{initials}</div>
                  }
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>{fullName}</div>
                    <div style={{ fontSize:12, color:'#8f8f8f' }}>Мастер</div>
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
                    placeholder="Расскажите о качестве работы, пунктуальности, общении..."
                    style={{ width:'100%', padding:'12px', borderRadius:10, border:'1.5px solid #e0e0e0', fontSize:14, lineHeight:1.6, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                    onFocus={e => e.target.style.borderColor='#257af4'}
                    onBlur={e => e.target.style.borderColor='#e0e0e0'} />
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