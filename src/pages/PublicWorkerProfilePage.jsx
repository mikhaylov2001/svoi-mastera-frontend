import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function PublicWorkerProfilePage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [worker,         setWorker]        = useState(null);
  const [services,       setServices]      = useState([]);
  const [reviews,        setReviews]       = useState([]);
  const [completedWorks, setCompletedWorks]= useState([]);
  const [loading,        setLoading]       = useState(true);
  const [tab,            setTab]           = useState('works');
  const [lightbox,       setLightbox]      = useState(null);
  const [photoIdx,       setPhotoIdx]      = useState({});

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
      fetch(`${API}/workers/${workerId}/reviews`).then(r => r.ok ? r.json() : []),
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
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#8f8f8f', fontFamily:'Arial,sans-serif' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:32, marginBottom:8 }}>⏳</div><p>Загружаем профиль...</p></div>
    </div>
  );

  const fullName  = [worker?.name, worker?.lastName].filter(Boolean).join(' ');
  const initials  = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since     = memberSince(worker?.registeredAt);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length).toFixed(1)
    : worker?.rating > 0 ? Number(worker.rating).toFixed(1) : null;



  const css = `
    * { box-sizing: border-box; }
    .av-page { background: #fff; min-height: 100vh; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }
    .av-back { background: #f4f5f6; border-bottom: 1px solid #e0e0e0; padding: 10px 0; }
    .av-back-btn { background: none; border: none; cursor: pointer; font-size: 14px; color: #2196f3; padding: 0; display: flex; align-items: center; gap: 4px; }
    .av-wrap { max-width: 1232px; margin: 0 auto; padding: 0 16px; }
    .av-layout { display: grid; grid-template-columns: 300px 1fr; gap: 32px; padding: 24px 0 60px; align-items: flex-start; }
    /* Sidebar */
    .av-sidebar {}
    .av-avatar-box { margin-bottom: 12px; }
    .av-avatar { width: 88px; height: 88px; border-radius: 16px; object-fit: cover; }
    .av-avatar-fallback { width: 88px; height: 88px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 32px; color: #fff; }
    .av-name { font-size: 24px; font-weight: 700; margin: 0 0 4px; line-height: 1.2; }
    .av-meta { font-size: 13px; color: #8f8f8f; margin-bottom: 12px; line-height: 1.6; }
    .av-badges { display: flex; flex-direction: column; gap: 0; margin-bottom: 16px; }
    .av-badge { display: flex; align-items: center; gap: 10; padding: 10px 0; font-size: 14px; color: #333; border-bottom: 1px solid #f0f0f0; }
    .av-badge:last-child { border-bottom: none; }
    .av-badge-icon { width: 20px; text-align: center; flex-shrink: 0; }
    .av-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
    .av-rating-num { font-size: 18px; font-weight: 700; }
    .av-rating-stars { color: #ffb800; font-size: 16px; letter-spacing: 1px; }
    .av-rating-count { font-size: 13px; color: #8f8f8f; }
    .av-btns { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .av-btn-write { background: #04c96f; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 700; padding: 13px; cursor: pointer; width: 100%; transition: background .15s; }
    .av-btn-write:hover { background: #03b362; }
    .av-btn-review { background: #fff; border: 1.5px solid #d0d0d0; border-radius: 8px; color: #333; font-size: 14px; font-weight: 600; padding: 12px; cursor: pointer; width: 100%; transition: border-color .15s; }
    .av-btn-review:hover { border-color: #999; }
    /* Main */
    .av-main {}
    .av-tabs { display: flex; gap: 0; border-bottom: 2px solid #e0e0e0; margin-bottom: 20px; }
    .av-tab { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; padding: 12px 0; margin-right: 24px; cursor: pointer; font-size: 15px; color: #8f8f8f; font-family: Arial, sans-serif; transition: all .15s; }
    .av-tab.active { color: #1a1a1a; border-bottom-color: #1a1a1a; font-weight: 700; }
    .av-tab-count { font-weight: 700; }
    .av-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .av-card { background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; cursor: pointer; transition: box-shadow .2s; }
    .av-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); }
    .av-card-img { position: relative; aspect-ratio: 4/3; background: #f5f5f5; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #ccc; }
    .av-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
    .av-card-badge { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
    .av-card-cat { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 4px; }
    .av-card-body { padding: 10px 12px; }
    .av-card-price { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .av-card-title { font-size: 13px; color: #333; margin-bottom: 6px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; }
    .av-card-meta { font-size: 12px; color: #8f8f8f; }
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

  const renderCard = (work) => {
    const hasPhoto = work.photos && work.photos.length > 0;
    const pi = photoIdx[work.id] || 0;
    return (
      <div key={work.id} className="av-card"
        onClick={hasPhoto ? () => setLightbox({ photos: work.photos, index: pi }) : undefined}>
        <div className="av-card-img">
          {hasPhoto
            ? <img src={work.photos[pi]} alt="" />
            : '🔨'
          }
          {work.categoryName && <div className="av-card-cat">{work.categoryName}</div>}
          <div className="av-card-badge">✅ Завершена</div>
          {hasPhoto && work.photos.length > 1 && (
            <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:11, padding:'2px 6px', borderRadius:4 }}>📷 {work.photos.length}</div>
          )}
        </div>
        <div className="av-card-body">
          {work.price && <div className="av-card-price">{Number(work.price).toLocaleString('ru-RU')} ₽</div>}
          <div className="av-card-title">{work.title || 'Работа'}</div>
          <div className="av-card-meta">
            {work.customerName && <span>{work.customerName} · </span>}
            {work.completedAt && <span>{timeAgo(work.completedAt)}</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderActiveCard = (s) => (
    <div key={s.id} className="av-card">
      <div className="av-card-img" style={{ fontSize:32 }}>⚙️</div>
      <div className="av-card-body">
        <div className="av-card-price">
          {s.priceTo ? `до ${Number(s.priceTo).toLocaleString('ru-RU')} ₽` : s.priceFrom ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
        </div>
        <div className="av-card-title">{s.title}</div>
        {s.categoryName && <div className="av-card-meta">{s.categoryName}</div>}
      </div>
    </div>
  );

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
          <div className="av-sidebar">
            <div className="av-avatar-box">
              {worker?.avatarUrl
                ? <img src={worker.avatarUrl} alt={fullName} className="av-avatar" />
                : <div className="av-avatar-fallback" style={{ background:'linear-gradient(135deg,#257af4,#1a5cbf)' }}>{initials}</div>
              }
            </div>

            <h1 className="av-name">{fullName}</h1>
            <div className="av-meta">
              Мастер{since ? <><br />{since}</> : ''}
            </div>

            {avgRating && (
              <div className="av-rating">
                <span className="av-rating-stars">{'★'.repeat(Math.round(Number(avgRating)))}</span>
                <span className="av-rating-num">{avgRating}</span>
                <span className="av-rating-count">{reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}</span>
              </div>
            )}

            <div className="av-badges">
              <div className="av-badge">
                <span className="av-badge-icon" style={{ color:'#04c96f' }}>✔</span>
                Документы проверены
              </div>
              <div className="av-badge">
                <span className="av-badge-icon">📍</span>
                {worker?.city || 'Йошкар-Ола'}
              </div>
              {completedWorks.length >= 1 && (
                <div className="av-badge">
                  <span className="av-badge-icon">⭐</span>
                  Активный мастер
                </div>
              )}
              {completedWorks.length >= 1 && (
                <div className="av-badge">
                  <span className="av-badge-icon">🤝</span>
                  Есть завершённые работы
                </div>
              )}
            </div>

            {userId && userId !== workerId && (
              <div className="av-btns">
                <button className="av-btn-write" onClick={() => navigate(`/chat/${workerId}`)}>Написать</button>
              </div>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div className="av-main">
            <div className="av-tabs">
              <button className={`av-tab${tab==='works'?' active':''}`} onClick={() => setTab('works')}>
                Работы <span className="av-tab-count">{completedWorks.length}</span>
              </button>
              <button className={`av-tab${tab==='active'?' active':''}`} onClick={() => setTab('active')}>
                Активные <span className="av-tab-count">{services.length}</span>
              </button>
              <button className={`av-tab${tab==='reviews'?' active':''}`} onClick={() => setTab('reviews')}>
                Отзывы <span className="av-tab-count">{reviews.length}</span>
              </button>
            </div>

            {tab === 'works' && (completedWorks.length === 0
              ? <div className="av-empty"><div style={{ fontSize:40, marginBottom:10 }}>🔨</div><p>Выполненных работ пока нет</p></div>
              : <div className="av-grid">{completedWorks.map(renderCard)}</div>
            )}

            {tab === 'active' && (services.length === 0
              ? <div className="av-empty"><div style={{ fontSize:40, marginBottom:10 }}>⚙️</div><p>Нет активных заказов</p></div>
              : <div className="av-grid">{services.map(renderActiveCard)}</div>
            )}

            {tab === 'reviews' && (reviews.length === 0
              ? <div className="av-empty"><div style={{ fontSize:40, marginBottom:10 }}>⭐</div><p>Отзывов пока нет</p></div>
              : <div className="av-reviews">
                  {reviews.map(r => (
                    <div key={r.id} className="av-review">
                      <div className="av-review-top">
                        {r.authorAvatarUrl
                          ? <img src={r.authorAvatarUrl} alt="" className="av-review-ava" />
                          : <div className="av-review-ava-fb" style={{ background:'linear-gradient(135deg,#e8410a,#ff7043)' }}>{(r.authorName||'К')[0].toUpperCase()}</div>
                        }
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:700 }}>{[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент'}</div>
                          <div style={{ fontSize:12, color:'#8f8f8f' }}>{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div>
                        </div>
                        <div style={{ color:'#ffb800', fontSize:18 }}>
                          {'★'.repeat(r.rating||0)}<span style={{ color:'#e0e0e0' }}>{'★'.repeat(5-(r.rating||0))}</span>
                        </div>
                      </div>
                      {(r.text || r.comment) && <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.6 }}>{r.text || r.comment}</p>}
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>

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