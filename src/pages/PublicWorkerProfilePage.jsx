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
      fetch(`${API}/workers/${workerId}/listings`).then(r => r.ok ? r.json() : []),
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    .av-page { background: #f5f5f5; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

    /* BACK */
    .av-back { background: #fff; border-bottom: 1px solid #e8e8e8; }
    .av-back-btn { background: none; border: none; cursor: pointer; font-size: 14px; color: #666; padding: 0; display: flex; align-items: center; gap: 5px; font-family: inherit; transition: color .15s; }
    .av-back-btn:hover { color: #e8410a; }
    .av-wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px; }

    /* LAYOUT */
    .av-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; padding: 20px 0 60px; align-items: flex-start; }

    /* ── SIDEBAR ── */
    .av-sidebar { display: flex; flex-direction: column; gap: 10px; }
    .av-sidebar-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 14px; padding: 20px 18px; }

    .av-avatar-wrap { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px; }
    .av-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid #f0f0f0; }
    .av-avatar-fallback { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 28px; color: #fff; flex-shrink: 0; background: linear-gradient(135deg,#e8410a,#ff7043); }
    .av-name { font-size: 20px; font-weight: 700; margin: 0 0 4px; line-height: 1.25; color: #111; }
    .av-since { font-size: 13px; color: #aaa; margin-bottom: 0; }

    /* рейтинг */
    .av-rating-row { display: flex; align-items: center; gap: 7px; padding: 12px 0; border-top: 1px solid #f2f2f2; border-bottom: 1px solid #f2f2f2; margin-bottom: 12px; }
    .av-rating-num { font-size: 22px; font-weight: 800; color: #111; line-height: 1; }
    .av-stars { display: flex; gap: 2px; }
    .av-star-f { color: #f59e0b; font-size: 15px; }
    .av-star-e { color: #e5e7eb; font-size: 15px; }
    .av-rating-cnt { font-size: 13px; color: #aaa; }

    /* значки */
    .av-badge-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .av-badge-item { display: flex; align-items: center; gap: 8px; background: #f7f8fa; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #333; font-weight: 500; }
    .av-badge-item-green { background: #f0fdf4; color: #15803d; }
    .av-badge-ico { font-size: 15px; flex-shrink: 0; }

    /* кнопки */
    .av-btn-write { background: #e8410a; border: none; border-radius: 10px; color: #fff; font-size: 15px; font-weight: 700; padding: 13px 16px; cursor: pointer; width: 100%; font-family: inherit; box-shadow: 0 3px 12px rgba(232,65,10,.28); transition: background .15s, transform .12s; letter-spacing: .01em; }
    .av-btn-write:hover { background: #d03a09; transform: translateY(-1px); }
    .av-btn-write:active { transform: translateY(0); }

    /* stats strip */
    .av-stats-strip { background: #fff; border: 1px solid #e8e8e8; border-radius: 14px; display: grid; grid-template-columns: repeat(3,1fr); overflow: hidden; }
    .av-strip-cell { padding: 14px 8px; text-align: center; border-right: 1px solid #f0f0f0; }
    .av-strip-cell:last-child { border-right: none; }
    .av-strip-num { font-size: 20px; font-weight: 800; color: #111; line-height: 1; }
    .av-strip-lbl { font-size: 10px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-top: 5px; display: block; }

    /* ── MAIN ── */
    .av-main { min-width: 0; }
    .av-tabs { display: flex; gap: 0; border-bottom: 2px solid #e8e8e8; margin-bottom: 16px; background: #fff; border-radius: 14px 14px 0 0; padding: 0 4px; }
    .av-tab { background: none; border: none; border-bottom: 2.5px solid transparent; margin-bottom: -2px; padding: 14px 18px; cursor: pointer; font-size: 14px; font-weight: 600; color: #999; font-family: inherit; transition: color .15s, border-color .15s; white-space: nowrap; }
    .av-tab.active { color: #111; border-bottom-color: #e8410a; }
    .av-tab:hover:not(.active) { color: #555; }
    .av-tab-cnt { font-size: 13px; font-weight: 700; }

    /* карточки */
    .av-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .av-card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e8e8; cursor: pointer; transition: box-shadow .18s, transform .18s; text-decoration: none; color: inherit; display: block; }
    .av-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
    .av-card-img { position: relative; aspect-ratio: 4/3; background: #f5f5f5; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #ccc; }
    .av-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; pointer-events: none; }
    .av-card:hover .av-card-img img { transform: scale(1.04); }
    .av-card-pill { position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,.52); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
    .av-card-cat { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,.52); color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 4px; }
    .av-card-body { padding: 12px 14px 14px; }
    .av-card-price { font-size: 17px; font-weight: 800; margin-bottom: 4px; color: #111; letter-spacing: -.3px; }
    .av-card-title { font-size: 13px; color: #555; line-height: 1.45; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 6px; }
    .av-card-meta { font-size: 12px; color: #bbb; }

    /* пустое состояние */
    .av-empty { text-align: center; padding: 56px 24px; color: #aaa; background: #fff; border-radius: 0 0 14px 14px; border: 1px solid #e8e8e8; border-top: none; }
    .av-empty-ico { font-size: 38px; margin-bottom: 10px; }

    /* отзывы */
    .av-reviews-wrap { background: #fff; border-radius: 0 0 14px 14px; border: 1px solid #e8e8e8; border-top: none; }
    .av-review { padding: 18px 20px; border-bottom: 1px solid #f2f2f2; }
    .av-review:last-child { border-bottom: none; }
    .av-review-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .av-review-ava { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .av-review-ava-fb { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 15px; flex-shrink: 0; background: linear-gradient(135deg,#e8410a,#ff7043); }
    .av-review-stars { color: #f59e0b; font-size: 14px; letter-spacing: 1px; }
    .av-review-empty { color: #e5e7eb; }

    @media(max-width:900px) { .av-layout { grid-template-columns: 1fr; } .av-grid { grid-template-columns: repeat(2,1fr); } }
    @media(max-width:480px) { .av-grid { grid-template-columns: 1fr; } .av-tab { padding: 12px 12px; font-size: 13px; } }
  `;

  const renderCard = (work) => {
    const hasPhoto = work.photos && work.photos.length > 0;
    const pi = photoIdx[work.id] || 0;
    return (
      <div key={work.id} className="av-card"
        onClick={hasPhoto ? () => setLightbox({ photos: work.photos, index: pi }) : undefined}>
        <div className="av-card-img">
          {hasPhoto ? <img src={work.photos[pi]} alt="" /> : '🔨'}
          {work.categoryName && <div className="av-card-cat">{work.categoryName}</div>}
          <div className="av-card-pill">Завершена</div>
          {hasPhoto && work.photos.length > 1 && (
            <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,.52)', color:'#fff', fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:20 }}>
              📷 {work.photos.length}
            </div>
          )}
        </div>
        <div className="av-card-body">
          {work.price && <div className="av-card-price">{Number(work.price).toLocaleString('ru-RU')} ₽</div>}
          <div className="av-card-title">{work.title || 'Работа'}</div>
          <div className="av-card-meta">
            {work.customerName && <span>{work.customerName}</span>}
            {work.completedAt && work.customerName && <span> · </span>}
            {work.completedAt && <span>{timeAgo(work.completedAt)}</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderActiveCard = (s) => {
    const hasPhoto = s.photos && s.photos.length > 0;
    const price = s.price || s.priceFrom || null;
    const cat = s.category || s.categoryName || null;
    return (
      <div key={s.id} className="av-card">
        <div className="av-card-img">
          {hasPhoto
            ? <img src={s.photos[0]} alt="" />
            : <div style={{ fontSize:32 }}>🔧</div>
          }
          {cat && <div className="av-card-cat">{cat}</div>}
        </div>
        <div className="av-card-body">
          {price && (
            <div className="av-card-price">
              {Number(price).toLocaleString('ru-RU')} ₽
              {s.priceUnit && <span style={{fontSize:12,color:'#aaa',fontWeight:500}}> {s.priceUnit}</span>}
            </div>
          )}
          <div className="av-card-title">{s.title}</div>
          {s.description && <div className="av-card-meta">{s.description}</div>}
        </div>
      </div>
    );
  };

  const starsFilled = avgRating ? Math.round(Number(avgRating)) : 0;

  return (
    <div className="av-page">
      <style>{css}</style>

      <div className="av-back">
        <div className="av-wrap" style={{ padding: '10px 20px' }}>
          <button className="av-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Назад
          </button>
        </div>
      </div>

      <div className="av-wrap">
        <div className="av-layout">

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div className="av-sidebar">

            {/* Основная карточка профиля */}
            <div className="av-sidebar-card">
              <div className="av-avatar-wrap">
                {worker?.avatarUrl
                  ? <img src={worker.avatarUrl} alt={fullName} className="av-avatar" />
                  : <div className="av-avatar-fallback">{initials}</div>
                }
                <div>
                  <h1 className="av-name">{fullName}</h1>
                  {since && <div className="av-since">{since}</div>}
                </div>
              </div>

              {avgRating && (
                <div className="av-rating-row">
                  <span className="av-rating-num">{avgRating}</span>
                  <div className="av-stars">
                    {Array.from({length:5}).map((_,i) => (
                      <span key={i} className={i < starsFilled ? 'av-star-f' : 'av-star-e'}>★</span>
                    ))}
                  </div>
                  <span className="av-rating-cnt">
                    {reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}
                  </span>
                </div>
              )}

              <div className="av-badge-list">
                <div className="av-badge-item av-badge-item-green">
                  <span className="av-badge-ico">✔</span>
                  Документы проверены
                </div>
                <div className="av-badge-item">
                  <span className="av-badge-ico">📍</span>
                  {worker?.city || 'Йошкар-Ола'}
                </div>
                {completedWorks.length >= 1 && (
                  <div className="av-badge-item">
                    <span className="av-badge-ico">🤝</span>
                    {completedWorks.length} {completedWorks.length===1?'работа выполнена':completedWorks.length<5?'работы выполнено':'работ выполнено'}
                  </div>
                )}
              </div>

              {userId && userId !== workerId && (
                <button className="av-btn-write" onClick={() => navigate(`/chat/${workerId}`)}>
                  Написать мастеру
                </button>
              )}
            </div>

            {/* Счётчики */}
            <div className="av-stats-strip">
              <div className="av-strip-cell">
                <div className="av-strip-num">{completedWorks.length}</div>
                <span className="av-strip-lbl">Работ</span>
              </div>
              <div className="av-strip-cell">
                <div className="av-strip-num">{services.length}</div>
                <span className="av-strip-lbl">Услуг</span>
              </div>
              <div className="av-strip-cell">
                <div className="av-strip-num">{reviews.length}</div>
                <span className="av-strip-lbl">Отзывов</span>
              </div>
            </div>
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div className="av-main">
            <div className="av-tabs">
              <button className={`av-tab${tab==='works'?' active':''}`} onClick={() => setTab('works')}>
                Работы <span className="av-tab-cnt">{completedWorks.length}</span>
              </button>
              <button className={`av-tab${tab==='active'?' active':''}`} onClick={() => setTab('active')}>
                Активные <span className="av-tab-cnt">{services.length}</span>
              </button>
              <button className={`av-tab${tab==='reviews'?' active':''}`} onClick={() => setTab('reviews')}>
                Отзывы <span className="av-tab-cnt">{reviews.length}</span>
              </button>
            </div>

            {tab === 'works' && (completedWorks.length === 0
              ? <div className="av-empty"><div className="av-empty-ico">🔨</div><p>Выполненных работ пока нет</p></div>
              : <div className="av-grid">{completedWorks.map(renderCard)}</div>
            )}

            {tab === 'active' && (services.length === 0
              ? <div className="av-empty"><div className="av-empty-ico">⚙️</div><p>Нет активных объявлений</p></div>
              : <div className="av-grid">{services.map(renderActiveCard)}</div>
            )}

            {tab === 'reviews' && (reviews.length === 0
              ? <div className="av-empty"><div className="av-empty-ico">⭐</div><p>Отзывов пока нет</p></div>
              : <div className="av-reviews-wrap">
                  {reviews.map(r => {
                    const rStars = r.rating || 0;
                    return (
                      <div key={r.id} className="av-review">
                        <div className="av-review-top">
                          {r.authorAvatarUrl
                            ? <img src={r.authorAvatarUrl} alt="" className="av-review-ava" />
                            : <div className="av-review-ava-fb">{(r.authorName||'К')[0].toUpperCase()}</div>
                          }
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>
                              {[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент'}
                            </div>
                            <div style={{ fontSize:12, color:'#bbb' }}>
                              {r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}
                            </div>
                          </div>
                          <div className="av-review-stars">
                            {Array.from({length:5}).map((_,i) => (
                              <span key={i} className={i < rStars ? '' : 'av-review-empty'}>★</span>
                            ))}
                          </div>
                        </div>
                        {(r.text || r.comment) && (
                          <p style={{ fontSize:14, color:'#333', margin:0, lineHeight:1.65, paddingLeft:54 }}>{r.text || r.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.93)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setLightbox(null)}>
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'86vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'86vh', borderRadius:10, display:'block', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,.55)', color:'#fff', fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:999 }}>{lightbox.index+1} / {lightbox.photos.length}</div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.18)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>×</button>
            {lightbox.photos.length > 1 && (<>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }} style={{ position:'absolute', left:-52, top:'50%', transform:'translateY(-50%)', width:42, height:42, borderRadius:'50%', background:'rgba(255,255,255,.18)', border:'none', color:'#fff', fontSize:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }} style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%)', width:42, height:42, borderRadius:'50%', background:'rgba(255,255,255,.18)', border:'none', color:'#fff', fontSize:28, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}