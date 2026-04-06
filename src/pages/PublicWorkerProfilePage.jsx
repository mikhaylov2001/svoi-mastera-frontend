import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicWorkerProfile.css';

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

function getMemberSince(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function getExperience(registeredAt) {
  if (!registeredAt) return null;
  const days = Math.floor((Date.now() - new Date(registeredAt)) / 86400000);
  const years = Math.floor(days / 365);
  const months = Math.floor(days / 30);
  if (years >= 1) return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
  if (months >= 1) return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
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
  const [error,          setError]          = useState('');
  const [lightbox,       setLightbox]       = useState(null);
  const [activeTab,      setActiveTab]      = useState('services'); // services | works | reviews
  const [showReviewModal, setShowReviewModal] = useState(false);

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
        id: workerId,
        name: svc?.[0]?.workerName || stats?.displayName || 'Мастер',
        lastName: stats?.lastName || '',
        avatarUrl: stats?.avatarUrl || null,
        city: stats?.city || 'Йошкар-Ола',
        rating: stats?.averageRating || 0,
        reviewsCount: stats?.reviewsCount || 0,
        registeredAt: stats?.registeredAt || null,
        description: stats?.description || null,
      });
    }).catch(err => {
      console.error(err);
      setError('Не удалось загрузить профиль');
    }).finally(() => setLoading(false));
  }, [workerId]);

  if (loading) return (
    <div className="container" style={{ padding:'80px 24px', textAlign:'center', color:'#9ca3af' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      <p>Загружаем профиль...</p>
    </div>
  );

  if (error || !worker) return (
    <div className="container" style={{ padding:'80px 24px', textAlign:'center' }}>
      <p>{error || 'Мастер не найден'}</p>
      <Link to="/find-master" className="btn btn-primary" style={{ marginTop:16 }}>К поиску</Link>
    </div>
  );

  const fullName = [worker.name, worker.lastName].filter(Boolean).join(' ');
  const initials = fullName.split(' ').map(x => x[0]||'').join('').toUpperCase().slice(0,2) || '?';
  const since = getMemberSince(worker.registeredAt);
  const exp   = getExperience(worker.registeredAt);

  // Собираем все фото из выполненных работ для галереи
  const allPhotos = completedWorks.filter(w => w.photos && w.photos.length > 0)
    .flatMap(w => w.photos.map(p => ({ url: p, title: w.title })));

  return (
    <div style={{ background:'#f5f5f5', minHeight:'100vh' }}>

      {/* Хлебная крошка */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'12px 0' }}>
        <div className="container">
          <button onClick={() => navigate(-1)} className="cats-back-link">← Назад</button>
        </div>
      </div>

      <div className="container" style={{ paddingTop:24, paddingBottom:60 }}>
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, alignItems:'flex-start' }}>

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div style={{ position:'sticky', top:72 }}>

            {/* Карточка профиля */}
            <div style={{ background:'#fff', borderRadius:12, padding:'24px 20px', marginBottom:12 }}>
              {worker.avatarUrl ? (
                <img src={worker.avatarUrl} alt={fullName}
                  style={{ width:88, height:88, borderRadius:'50%', objectFit:'cover', margin:'0 auto 14px', display:'block', border:'3px solid #f3f4f6' }} />
              ) : (
                <div style={{ width:88, height:88, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:28, margin:'0 auto 14px' }}>
                  {initials}
                </div>
              )}

              <h1 style={{ fontSize:18, fontWeight:800, color:'#111827', textAlign:'center', margin:'0 0 4px' }}>{fullName}</h1>
              <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', margin:'0 0 10px' }}>📍 {worker.city}</p>

              {/* Рейтинг */}
              {worker.rating > 0 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:12, cursor:'pointer' }}
                  onClick={() => setActiveTab('reviews')}
                >
                  <span style={{ color:'#f59e0b', fontSize:15 }}>{renderStars(worker.rating)}</span>
                  <span style={{ fontSize:15, fontWeight:800, color:'#111827' }}>{worker.rating.toFixed(1)}</span>
                  <span style={{ fontSize:12, color:'#6b7280', textDecoration:'underline' }}>
                    {worker.reviewsCount} {worker.reviewsCount === 1 ? 'отзыв' : worker.reviewsCount < 5 ? 'отзыва' : 'отзывов'}
                  </span>
                </div>
              )}

              {since && <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', margin:'0 0 14px' }}>На сервисе с {since}</p>}

              {/* Статистика */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  [completedWorks.length, 'Заказов', '#e8410a'],
                  [exp || '—', 'Стаж', '#22c55e'],
                ].map(([v, l, c]) => (
                  <div key={l} style={{ background:'#f9fafb', borderRadius:8, padding:'10px 6px', textAlign:'center', border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:c }}>{v}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px' }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Бейджи */}
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                {[
                  ['✓', 'Документы проверены', '#22c55e'],
                  ['⚡', 'Быстрый отклик', '#f59e0b'],
                  ['🛡️', 'Гарантия качества', '#6366f1'],
                ].map(([icon, label, color]) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'#f9fafb', borderRadius:8, fontSize:13, color:'#374151', border:'1px solid #e5e7eb' }}>
                    <span style={{ color, fontWeight:700 }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>

              {/* Кнопки */}
              {userId !== workerId && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <button onClick={() => navigate(`/chat/${workerId}`)}
                    style={{ width:'100%', padding:'12px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#c73208'}
                    onMouseLeave={e => e.currentTarget.style.background='#e8410a'}
                  >
                    💬 Написать мастеру
                  </button>
                </div>
              )}
            </div>

            {/* Услуги в левой колонке (краткий список) */}
            {services.length > 0 && (
              <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                <div style={{ fontSize:13, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Услуги</div>
                {services.slice(0,4).map(s => (
                  <div key={s.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f3f4f6', fontSize:13 }}>
                    <span style={{ color:'#374151', fontWeight:500 }}>{s.title}</span>
                    <span style={{ color:'#e8410a', fontWeight:700, flexShrink:0 }}>
                      {s.priceFrom ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                    </span>
                  </div>
                ))}
                {services.length > 4 && (
                  <button onClick={() => setActiveTab('services')}
                    style={{ background:'none', border:'none', color:'#e8410a', fontSize:12, fontWeight:600, cursor:'pointer', marginTop:8, padding:0 }}>
                    Ещё {services.length - 4} услуг →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div>

            {/* Описание */}
            {worker.description && (
              <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', marginBottom:16 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 12px' }}>О мастере</h2>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{worker.description}</p>
              </div>
            )}

            {/* Табы */}
            <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e5e7eb', marginBottom:16, background:'#fff', borderRadius:'12px 12px 0 0', padding:'0 20px' }}>
              {[
                ['services', `Услуги (${services.length})`],
                ['works',    `Работы (${completedWorks.length})`],
                ['reviews',  `Отзывы (${reviews.length})`],
                ...(allPhotos.length > 0 ? [['photos', `Фото (${allPhotos.length})`]] : []),
              ].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{
                    padding:'14px 18px', background:'none', border:'none', cursor:'pointer',
                    fontSize:14, fontWeight:700, whiteSpace:'nowrap',
                    color: activeTab===key ? '#e8410a' : '#6b7280',
                    borderBottom: activeTab===key ? '2px solid #e8410a' : '2px solid transparent',
                    marginBottom:-2, transition:'all .15s',
                  }}
                >{label}</button>
              ))}
            </div>

            {/* ── УСЛУГИ ── */}
            {activeTab === 'services' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {services.length === 0 ? (
                  <div style={{ background:'#fff', borderRadius:12, padding:'48px 24px', textAlign:'center', color:'#9ca3af' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>🔧</div>
                    <p style={{ fontWeight:600 }}>Мастер пока не добавил услуги</p>
                  </div>
                ) : services.map(s => (
                  <div key={s.id} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', transition:'box-shadow .2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:'0 0 8px' }}>{s.title}</h3>
                        {s.description && <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 10px', lineHeight:1.6 }}>{s.description}</p>}
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:18, fontWeight:900, color:'#111827' }}>
                          {s.priceTo ? `до ${Number(s.priceTo).toLocaleString('ru-RU')} ₽`
                            : s.priceFrom ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽`
                            : 'Договорная'}
                        </div>
                        {userId !== workerId && (
                          <button onClick={() => navigate(`/chat/${workerId}`)}
                            style={{ marginTop:8, padding:'8px 16px', background:'#e8410a', border:'none', borderRadius:6, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            Заказать
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ВЫПОЛНЕННЫЕ РАБОТЫ ── */}
            {activeTab === 'works' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {completedWorks.length === 0 ? (
                  <div style={{ background:'#fff', borderRadius:12, padding:'48px 24px', textAlign:'center', color:'#9ca3af' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>🏆</div>
                    <p style={{ fontWeight:600 }}>Выполненных работ пока нет</p>
                  </div>
                ) : completedWorks.map(work => (
                  <div key={work.id} style={{ background:'#fff', borderRadius:12, overflow:'hidden', transition:'box-shadow .2s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
                  >
                    {/* Фото работы */}
                    {work.photos && work.photos.length > 0 && (
                      <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', cursor:'pointer' }}
                        onClick={() => setLightbox({ photos: work.photos, index: 0 })}
                      >
                        <img src={work.photos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                        {work.photos.length > 1 && (
                          <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999 }}>
                            📷 {work.photos.length}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding:'16px 20px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:8 }}>
                        <h3 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:0 }}>{work.title}</h3>
                        {work.categoryName && (
                          <span style={{ fontSize:11, fontWeight:600, color:'#6366f1', background:'rgba(99,102,241,.08)', padding:'3px 8px', borderRadius:999, flexShrink:0 }}>
                            {work.categoryName}
                          </span>
                        )}
                      </div>
                      {work.description && work.description !== 'Без описания' && (
                        <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 12px', lineHeight:1.6 }}>{work.description}</p>
                      )}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, paddingTop:10, borderTop:'1px solid #f3f4f6', fontSize:12, color:'#9ca3af' }}>
                        <span>👤 {work.customerName}</span>
                        {work.price && <span style={{ fontWeight:800, color:'#22c55e', fontSize:14 }}>{Number(work.price).toLocaleString('ru-RU')} ₽</span>}
                        {work.completedAt && <span>{new Date(work.completedAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ФОТО ГАЛЕРЕЯ ── */}
            {activeTab === 'photos' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8 }}>
                {allPhotos.map((p, i) => (
                  <div key={i} style={{ position:'relative', aspectRatio:'1', borderRadius:8, overflow:'hidden', cursor:'pointer', background:'#f3f4f6' }}
                    onClick={() => setLightbox({ photos: allPhotos.map(x => x.url), index: i })}
                    onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity='1'}
                    onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity='0'}
                  >
                    <img src={p.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                    <div className="overlay" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity .2s', fontSize:24 }}>
                      🔍
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ОТЗЫВЫ ── */}
            {activeTab === 'reviews' && (
              <div>
                {/* Сводка рейтинга */}
                {reviews.length > 0 && (
                  <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', marginBottom:12, display:'flex', gap:24, alignItems:'center' }}>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontSize:48, fontWeight:900, color:'#111827', lineHeight:1 }}>{worker.rating.toFixed(1)}</div>
                      <div style={{ color:'#f59e0b', fontSize:20, marginTop:4 }}>{renderStars(worker.rating)}</div>
                      <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>{reviews.length} отзыв{reviews.length===1?'':reviews.length<5?'а':'ов'}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      {[5,4,3,2,1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct = reviews.length > 0 ? count/reviews.length*100 : 0;
                        return (
                          <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                            <span style={{ color:'#f59e0b', fontSize:12, width:14 }}>{'★'.repeat(star)}</span>
                            <div style={{ flex:1, height:6, background:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:'#f59e0b', borderRadius:3, transition:'width .5s' }} />
                            </div>
                            <span style={{ fontSize:12, color:'#9ca3af', width:16, textAlign:'right' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {reviews.length === 0 ? (
                    <div style={{ background:'#fff', borderRadius:12, padding:'48px 24px', textAlign:'center', color:'#9ca3af' }}>
                      <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
                      <p style={{ fontWeight:600 }}>Отзывов пока нет</p>
                    </div>
                  ) : reviews.map(r => (
                    <div key={r.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                        <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, flexShrink:0 }}>
                          {(r.authorName||'К')[0].toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{r.authorName || 'Клиент'}</div>
                          <div style={{ fontSize:12, color:'#9ca3af' }}>
                            {r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}
                          </div>
                        </div>
                        <div style={{ color:'#f59e0b', fontSize:14, fontWeight:700 }}>
                          {'★'.repeat(r.rating||0)}{'☆'.repeat(5-(r.rating||0))}
                        </div>
                      </div>
                      {r.text && <p style={{ fontSize:14, color:'#374151', margin:0, lineHeight:1.6 }}>{r.text}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLightbox(null)}>
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:8, display:'block', pointerEvents:'none', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }} />
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:999 }}>
              {lightbox.index+1} / {lightbox.photos.length}
            </div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>×</button>
            {lightbox.photos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }}
                  style={{ position:'absolute', left:-50, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }}
                  style={{ position:'absolute', right:-50, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>›</button>
              </>
            )}
          </div>
          {lightbox.photos.length > 1 && (
            <div style={{ display:'flex', gap:6, marginTop:12 }} onClick={e => e.stopPropagation()}>
              {lightbox.photos.map((p,i) => (
                <div key={i} onClick={() => setLightbox(l => ({...l, index:i}))}
                  style={{ width:48, height:36, borderRadius:4, overflow:'hidden', cursor:'pointer', border: i===lightbox.index ? '2px solid #e8410a' : '2px solid rgba(255,255,255,0.2)', opacity: i===lightbox.index ? 1 : 0.55 }}>
                  <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Адаптив */}
      <style>{`
        @media (max-width: 900px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}