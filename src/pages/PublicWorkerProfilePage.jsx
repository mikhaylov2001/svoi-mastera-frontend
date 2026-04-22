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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pw-page {
    background: #fff;
    min-height: 100vh;
    font-family: Inter, Arial, sans-serif;
    color: #1a1a1a;
  }

  /* ── breadcrumb ── */
  .pw-breadcrumb {
    background: #f6f6f6;
    border-bottom: 1px solid #e8e8e8;
    padding: 8px 0;
  }
  .pw-breadcrumb-btn {
    background: none; border: none; cursor: pointer;
    font-size: 13px; color: #757575; font-family: inherit;
    display: inline-flex; align-items: center; gap: 4px;
    padding: 0;
  }
  .pw-breadcrumb-btn:hover { color: #333; text-decoration: underline; }

  /* ── wrap & layout ── */
  .pw-wrap { max-width: 1176px; margin: 0 auto; padding: 0 20px; }
  .pw-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    padding: 20px 0 60px;
    align-items: flex-start;
  }

  /* ══════════ SIDEBAR ══════════ */
  .pw-sidebar {}

  .pw-avatar {
    width: 88px; height: 88px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin-bottom: 12px;
  }
  .pw-avatar-fb {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: linear-gradient(135deg, #64748b, #475569);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 800; color: #fff;
    margin-bottom: 12px;
  }

  .pw-name {
    font-size: 22px; font-weight: 700;
    line-height: 1.2; margin-bottom: 4px;
  }

  .pw-review-link {
    display: inline-block;
    font-size: 14px; color: #2563eb;
    text-decoration: none; margin-bottom: 6px;
    cursor: pointer; background: none; border: none;
    font-family: inherit; padding: 0;
  }
  .pw-review-link:hover { text-decoration: underline; }

  .pw-meta {
    font-size: 13px; color: #777;
    line-height: 1.7; margin-bottom: 14px;
  }

  /* бейджи */
  .pw-badges { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .pw-badge {
    display: flex; align-items: center; gap: 8px;
    background: #e8f4ff;
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 13px; color: #1464b0; font-weight: 500;
  }
  .pw-badge svg { flex-shrink: 0; }

  .pw-responds { font-size: 13px; color: #777; margin-bottom: 14px; }

  /* кнопки */
  .pw-btn-msg {
    display: block; width: 100%;
    background: #2563eb; border: none; border-radius: 8px;
    color: #fff; font-size: 15px; font-weight: 700;
    padding: 13px 0; cursor: pointer;
    font-family: inherit; text-align: center;
    margin-bottom: 8px;
    transition: background .15s;
  }
  .pw-btn-msg:hover { background: #1d4ed8; }

  /* ══════════ MAIN ══════════ */
  .pw-main {}

  /* табы */
  .pw-tabs {
    display: flex; gap: 0;
    border-bottom: 1px solid #e8e8e8;
    margin-bottom: 20px;
  }
  .pw-tab {
    background: none; border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    padding: 12px 0;
    margin-right: 28px;
    cursor: pointer;
    font-size: 16px; font-weight: 400;
    color: #777; font-family: inherit;
    transition: color .15s;
    white-space: nowrap;
  }
  .pw-tab.active {
    color: #1a1a1a; font-weight: 700;
    border-bottom-color: #1a1a1a;
  }
  .pw-tab:hover:not(.active) { color: #333; }

  /* листинг-сетка */
  .pw-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
  }

  .pw-card {
    display: block;
    text-decoration: none; color: inherit;
    padding: 12px;
    cursor: pointer;
    transition: background .15s;
    border-radius: 8px;
    position: relative;
  }
  .pw-card:hover { background: #f7f7f7; }

  .pw-card-img-wrap {
    position: relative;
    aspect-ratio: 4/3;
    background: #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; color: #ccc;
  }
  .pw-card-img-wrap img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .pw-card-heart {
    position: absolute; top: 8px; right: 8px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,.85);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; cursor: pointer;
    border: none;
  }
  .pw-card-cat {
    position: absolute; top: 8px; left: 8px;
    background: rgba(0,0,0,.48); color: #fff;
    font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 4px;
  }
  .pw-card-done {
    position: absolute; bottom: 8px; left: 8px;
    background: rgba(0,0,0,.48); color: #fff;
    font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 4px;
  }

  .pw-card-title {
    font-size: 14px; font-weight: 400; line-height: 1.4;
    color: #1a1a1a; margin-bottom: 4px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .pw-card-price {
    font-size: 16px; font-weight: 700;
    color: #1a1a1a; margin-bottom: 3px;
  }
  .pw-card-price-sub { font-size: 12px; font-weight: 400; color: #999; }
  .pw-card-loc {
    font-size: 12px; color: #999;
    display: flex; align-items: center; gap: 3px;
    margin-bottom: 2px;
  }
  .pw-card-date { font-size: 12px; color: #bbb; }

  /* пагинация */
  .pw-pagination {
    display: flex; align-items: center; gap: 8px;
    margin-top: 16px;
  }
  .pw-pag-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: none; border: 1px solid #d0d0d0;
    cursor: pointer; font-size: 18px; color: #555;
    display: flex; align-items: center; justify-content: center;
    transition: border-color .15s;
  }
  .pw-pag-btn:hover { border-color: #888; }
  .pw-pag-btn:disabled { opacity: .35; cursor: not-allowed; }

  /* пустое */
  .pw-empty {
    padding: 48px 0;
    text-align: center; color: #aaa; font-size: 15px;
  }
  .pw-empty-ico { font-size: 40px; margin-bottom: 10px; }

  /* ══════════ СЕКЦИЯ ОТЗЫВОВ (под контентом) ══════════ */
  .pw-reviews-section { margin-top: 32px; border-top: 1px solid #e8e8e8; padding-top: 28px; }
  .pw-reviews-heading { font-size: 22px; font-weight: 700; margin-bottom: 20px; }

  .pw-rating-block {
    display: flex; gap: 32px; margin-bottom: 24px;
  }
  .pw-rating-left { text-align: center; flex-shrink: 0; }
  .pw-rating-big { font-size: 48px; font-weight: 800; line-height: 1; color: #1a1a1a; }
  .pw-rating-stars-big { color: #334155; font-size: 18px; letter-spacing: 2px; display: block; margin: 6px 0 4px; }
  .pw-rating-hint { font-size: 12px; color: #aaa; }

  .pw-rating-bars { flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .pw-bar-row { display: flex; align-items: center; gap: 8px; }
  .pw-bar-stars { font-size: 12px; color: #334155; white-space: nowrap; width: 80px; }
  .pw-bar-track { flex: 1; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
  .pw-bar-fill { height: 100%; background: #334155; border-radius: 3px; transition: width .3s; }
  .pw-bar-cnt { font-size: 12px; color: #aaa; width: 20px; text-align: right; }

  .pw-review-list { display: flex; flex-direction: column; }
  .pw-review-item { padding: 20px 0; border-bottom: 1px solid #f0f0f0; }
  .pw-review-item:last-child { border-bottom: none; }
  .pw-review-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .pw-review-ava {
    width: 46px; height: 46px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
  }
  .pw-review-ava-fb {
    width: 46px; height: 46px; border-radius: 50%;
    background: linear-gradient(135deg, #64748b, #475569);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 17px; flex-shrink: 0;
  }
  .pw-review-author { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  .pw-review-date { font-size: 12px; color: #aaa; }
  .pw-review-rating { color: #334155; font-size: 15px; margin-left: auto; letter-spacing: 1px; }
  .pw-review-rating-empty { color: #e0e0e0; }
  .pw-review-text { font-size: 14px; color: #333; line-height: 1.65; padding-left: 58px; }

  /* ── LIGHTBOX ── */
  .pw-lb-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,.92);
    display: flex; align-items: center; justify-content: center;
  }
  .pw-lb-inner { position: relative; max-width: 90vw; max-height: 86vh; }
  .pw-lb-img { max-width: 90vw; max-height: 86vh; border-radius: 10px; display: block; }
  .pw-lb-counter {
    position: absolute; top: 12px; left: 12px;
    background: rgba(0,0,0,.55); color: #fff;
    font-size: 12px; font-weight: 700;
    padding: 4px 10px; border-radius: 999px;
  }
  .pw-lb-close {
    position: absolute; top: 12px; right: 12px;
    width: 38px; height: 38px; border-radius: 50%;
    background: rgba(255,255,255,.18); border: none;
    color: #fff; font-size: 22px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .pw-lb-prev, .pw-lb-next {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255,255,255,.18); border: none;
    color: #fff; font-size: 28px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .pw-lb-prev { left: -56px; }
  .pw-lb-next { right: -56px; }

  @media(max-width: 960px) {
    .pw-layout { grid-template-columns: 1fr; }
    .pw-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media(max-width: 520px) {
    .pw-grid { grid-template-columns: 1fr; }
    .pw-tab { font-size: 14px; margin-right: 18px; }
  }
`;

const PAGE_SIZE = 8;

export default function PublicWorkerProfilePage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [worker,         setWorker]        = useState(null);
  const [services,       setServices]      = useState([]);
  const [reviews,        setReviews]       = useState([]);
  const [completedWorks, setCompletedWorks]= useState([]);
  const [loading,        setLoading]       = useState(true);
  const [tab,            setTab]           = useState('active');
  const [page,           setPage]          = useState(0);
  const [lightbox,       setLightbox]      = useState(null);

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
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#999', fontFamily:'Inter,Arial,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>⏳</div>
        <p>Загружаем профиль...</p>
      </div>
    </div>
  );

  const fullName  = [worker?.name, worker?.lastName].filter(Boolean).join(' ');
  const initials  = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since     = memberSince(worker?.registeredAt);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length)
    : (worker?.rating > 0 ? Number(worker.rating) : 0);
  const avgRatingStr = avgRating > 0 ? avgRating.toFixed(1) : '0,0';
  const starsFilled = Math.round(avgRating);

  // rating distribution
  const starCounts = [5,4,3,2,1].map(s => reviews.filter(r => r.rating === s).length);
  const maxStarCount = Math.max(...starCounts, 1);

  // current tab items + pagination
  const tabItems = tab === 'active' ? services : completedWorks;
  const totalPages = Math.ceil(tabItems.length / PAGE_SIZE);
  const pageItems = tabItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const switchTab = (t) => { setTab(t); setPage(0); };

  return (
    <div className="pw-page">
      <style>{css}</style>

      {/* Хлебная крошка */}
      <div className="pw-breadcrumb">
        <div className="pw-wrap" style={{ padding:'8px 20px' }}>
          <button className="pw-breadcrumb-btn" onClick={() => navigate(-1)}>
            ← Назад
          </button>
        </div>
      </div>

      <div className="pw-wrap">
        <div className="pw-layout">

          {/* ══════════ САЙДБАР ══════════ */}
          <div className="pw-sidebar">

            {worker?.avatarUrl
              ? <img src={worker.avatarUrl} alt={fullName} className="pw-avatar" />
              : <div className="pw-avatar-fb">{initials}</div>
            }

            <h1 className="pw-name">{fullName}</h1>

            {reviews.length === 0
              ? <button className="pw-review-link" onClick={() => document.getElementById('pw-reviews-anchor')?.scrollIntoView({behavior:'smooth'})}>
                  Оставить первый отзыв
                </button>
              : <button className="pw-review-link" onClick={() => document.getElementById('pw-reviews-anchor')?.scrollIntoView({behavior:'smooth'})}>
                  {reviews.length} {reviews.length===1?'отзыв':reviews.length<5?'отзыва':'отзывов'}
                </button>
            }

            <div className="pw-meta">
              {completedWorks.length > 0 && <span>{completedWorks.length} завершённых работ<br /></span>}
              {since && <span>{since}</span>}
            </div>

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
                {worker?.city || 'Йошкар-Ола'}
              </div>
            </div>

            <div className="pw-responds">Отвечает в течение дня</div>

            {userId && userId !== workerId && (
              <button className="pw-btn-msg" onClick={() => navigate(`/chat/${workerId}`)}>
                Написать
              </button>
            )}
          </div>

          {/* ══════════ ПРАВАЯ КОЛОНКА ══════════ */}
          <div className="pw-main">

            {/* Табы */}
            <div className="pw-tabs">
              <button
                className={`pw-tab${tab==='active'?' active':''}`}
                onClick={() => switchTab('active')}
              >
                Активные {services.length > 0 && <sup style={{fontSize:13,fontWeight:700}}>{services.length}</sup>}
              </button>
              <button
                className={`pw-tab${tab==='works'?' active':''}`}
                onClick={() => switchTab('works')}
              >
                Завершённые {completedWorks.length > 0 && <sup style={{fontSize:13,fontWeight:700}}>{completedWorks.length}</sup>}
              </button>
            </div>

            {/* Карточки */}
            {pageItems.length === 0
              ? (
                <div className="pw-empty">
                  <div className="pw-empty-ico">{tab === 'active' ? '⚙️' : '🔨'}</div>
                  <p>{tab === 'active' ? 'Нет активных объявлений' : 'Выполненных работ пока нет'}</p>
                </div>
              )
              : (
                <>
                  <div className="pw-grid">
                    {pageItems.map(item => {
                      const hasPhoto = item.photos && item.photos.length > 0;
                      const price    = item.price || item.priceFrom || null;
                      const cat      = item.category || item.categoryName || null;
                      return (
                        <div
                          key={item.id}
                          className="pw-card"
                          onClick={hasPhoto ? () => setLightbox({ photos: item.photos, index: 0 }) : undefined}
                        >
                          <div className="pw-card-img-wrap">
                            {hasPhoto
                              ? <img src={item.photos[0]} alt={item.title} />
                              : (tab === 'active' ? '🔧' : '🔨')
                            }
                            {cat && <div className="pw-card-cat">{cat}</div>}
                            {tab === 'works' && <div className="pw-card-done">Завершена</div>}
                            <button className="pw-card-heart" onClick={e => e.stopPropagation()}>♡</button>
                          </div>
                          <div className="pw-card-title">{item.title || 'Без названия'}</div>
                          {price && (
                            <div className="pw-card-price">
                              {Number(price).toLocaleString('ru-RU')} ₽
                              {item.priceUnit && <span className="pw-card-price-sub"> {item.priceUnit}</span>}
                            </div>
                          )}
                          <div className="pw-card-loc">
                            <span>📍</span>
                            <span>{worker?.city || 'Йошкар-Ола'}</span>
                          </div>
                          {(item.createdAt || item.completedAt) && (
                            <div className="pw-card-date">
                              {new Date(item.completedAt || item.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="pw-pagination">
                      <button className="pw-pag-btn" disabled={page===0} onClick={() => setPage(p=>p-1)}>‹</button>
                      {Array.from({length:totalPages}).map((_,i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          style={{
                            width:36,height:36,borderRadius:'50%',border:'none',
                            background: i===page ? '#1a1a1a' : 'none',
                            color: i===page ? '#fff' : '#555',
                            cursor:'pointer', fontWeight: i===page?700:400,
                            fontSize:14,
                          }}
                        >{i+1}</button>
                      ))}
                      <button className="pw-pag-btn" disabled={page===totalPages-1} onClick={() => setPage(p=>p+1)}>›</button>
                    </div>
                  )}
                </>
              )
            }

            {/* ══ СЕКЦИЯ ОТЗЫВОВ ══ */}
            <div className="pw-reviews-section" id="pw-reviews-anchor">
              <h2 className="pw-reviews-heading">Отзывы о {worker?.name || 'мастере'}</h2>

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
                        <div className="pw-bar-fill" style={{ width: `${(starCounts[idx]/maxStarCount)*100}%` }} />
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
                      const rStars = r.rating || 0;
                      return (
                        <div key={r.id} className="pw-review-item">
                          <div className="pw-review-head">
                            {r.authorAvatarUrl
                              ? <img src={r.authorAvatarUrl} alt="" className="pw-review-ava" />
                              : <div className="pw-review-ava-fb">{(r.authorName||'К')[0].toUpperCase()}</div>
                            }
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="pw-review-author">
                                {[r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент'}
                              </div>
                              <div className="pw-review-date">
                                {r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}
                              </div>
                            </div>
                            <div className="pw-review-rating">
                              {Array.from({length:5}).map((_,i) => (
                                <span key={i} className={i < rStars ? '' : 'pw-review-rating-empty'}>★</span>
                              ))}
                            </div>
                          </div>
                          {(r.text || r.comment) && (
                            <p className="pw-review-text">{r.text || r.comment}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>

          </div>{/* pw-main */}
        </div>
      </div>

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
