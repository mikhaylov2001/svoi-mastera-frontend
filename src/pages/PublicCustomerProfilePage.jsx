import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicWorkerProfile.css';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес. назад`;
  return `${Math.floor(months / 12)} г. назад`;
}

function getMemberSince(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const STATUS_LABELS = {
  OPEN:        { label: 'Открыта',   color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  IN_PROGRESS: { label: 'В работе',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:   { label: 'Выполнена', color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
  CANCELLED:   { label: 'Отменена',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
};

export default function PublicCustomerProfilePage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();

  const nameFromQuery = new URLSearchParams(location.search).get('name') || '';

  const [customer, setCustomer] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [tab,      setTab]      = useState('open');
  const [photoIdx, setPhotoIdx] = useState({});

  useEffect(() => {
    if (!lightbox) return;
    const h = (e) => {
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
    ]).then(([profileData, requestsData]) => {
      setCustomer(profileData || { id: customerId, displayName: nameFromQuery || 'Заказчик', city: 'Йошкар-Ола' });
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    }).catch(() => {
      setCustomer({ id: customerId, displayName: nameFromQuery || 'Заказчик', city: 'Йошкар-Ола' });
      setRequests([]);
    }).finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return (
    <div className="container" style={{ padding:'80px 24px', textAlign:'center', color:'#9ca3af' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      <p>Загружаем профиль...</p>
    </div>
  );

  const name     = customer?.displayName || nameFromQuery || 'Заказчик';
  const lastName = customer?.lastName || '';
  const fullName = lastName ? `${name} ${lastName}` : name;
  const initials = name.split(' ').map(x => x[0] || '').join('').toUpperCase().slice(0, 2) || '?';
  const openReqs = requests.filter(r => r.status === 'OPEN');
  const completedReqs = requests.filter(r => r.status === 'COMPLETED');
  const displayReqs = tab === 'open' ? openReqs : requests;
  const memberSince = getMemberSince(customer?.registeredAt);
  const totalReqs = customer?.totalRequests ?? requests.length;
  const doneReqs  = customer?.completedRequests ?? completedReqs.length;

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <button className="cats-back-link" onClick={() => navigate(-1)}>← Назад</button>
        </div>
      </div>

      <div className="container" style={{ paddingBottom:60 }}>
        <div className="public-worker-layout">

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div className="public-worker-card">
            {customer?.avatarUrl ? (
              <img src={customer.avatarUrl} alt={fullName}
                style={{ width:96, height:96, borderRadius:'50%', objectFit:'cover', margin:'0 auto 14px', display:'block', border:'3px solid #f3f4f6' }}
              />
            ) : (
              <div className="public-worker-avatar" style={{ background:'linear-gradient(135deg,#e8410a,#ff7043)', color:'#fff' }}>
                {initials}
              </div>
            )}

            <h1 className="public-worker-name">{fullName}</h1>
            <p className="public-worker-city">📍 {customer?.city || 'Йошкар-Ола'}</p>

            {memberSince && (
              <p style={{ fontSize:12, color:'#9ca3af', marginBottom:14 }}>На сервисе с {memberSince}</p>
            )}

            {/* Статистика */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'14px 0' }}>
              {[
                [totalReqs, 'Заявок', '#e8410a'],
                [doneReqs,  'Выполнено', '#22c55e'],
              ].map(([val, label, color]) => (
                <div key={label} style={{ background:'#f9fafb', borderRadius:12, padding:'12px 8px', textAlign:'center', border:'1px solid #e5e7eb' }}>
                  <div style={{ fontSize:22, fontWeight:900, color }}>{val}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px', marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Бейджи */}
            <div className="public-worker-badges">
              <span className="pub-badge">✓ Проверен</span>
              {totalReqs >= 3 && <span className="pub-badge">⭐ Активный</span>}
              {doneReqs >= 1  && <span className="pub-badge">🤝 Надёжный</span>}
            </div>

            {userId && userId !== customerId && (
              <button className="btn btn-primary btn-full" style={{ marginTop:18 }}
                onClick={() => navigate(`/chat/${customerId}`)}
              >
                💬 Написать заказчику
              </button>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <div className="public-worker-main">

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:0 }}>Заявки</h2>
              <div style={{ display:'flex', gap:4, background:'#f3f4f6', borderRadius:12, padding:3 }}>
                {[['open',`Открытые (${openReqs.length})`],['all',`Все (${requests.length})`]].map(([key,label]) => (
                  <button key={key} onClick={() => setTab(key)}
                    style={{ padding:'7px 14px', borderRadius:9, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                      background: tab===key ? '#fff' : 'none', color: tab===key ? '#111827' : '#6b7280',
                      boxShadow: tab===key ? '0 2px 6px rgba(0,0,0,.08)' : 'none', transition:'all .15s' }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {displayReqs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', color:'#9ca3af', background:'#fff', borderRadius:16, border:'1.5px solid #e5e7eb' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
                <p style={{ fontWeight:600 }}>{tab==='open' ? 'Нет открытых заявок' : 'Заявок пока нет'}</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {displayReqs.map(req => {
                  const st = STATUS_LABELS[req.status] || STATUS_LABELS.OPEN;
                  const hasPhoto = req.photos && req.photos.length > 0;
                  const pi = photoIdx[req.id] || 0;

                  return (
                    <div key={req.id}
                      style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:18, overflow:'hidden', transition:'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(232,65,10,.3)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(232,65,10,.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.boxShadow='none'; }}
                    >
                      {hasPhoto && (
                        <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', cursor:'pointer', background:'#f3f4f6' }}
                          onClick={() => setLightbox({ photos: req.photos, index: pi })}
                        >
                          <img src={req.photos[pi]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                          {req.photos.length > 1 && (
                            <>
                              <button onClick={e => { e.stopPropagation(); setPhotoIdx(p => ({...p,[req.id]:((p[req.id]||0)-1+req.photos.length)%req.photos.length})); }}
                                style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', color:'#fff', fontSize:18, cursor:'pointer' }}>‹</button>
                              <button onClick={e => { e.stopPropagation(); setPhotoIdx(p => ({...p,[req.id]:((p[req.id]||0)+1)%req.photos.length})); }}
                                style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', color:'#fff', fontSize:18, cursor:'pointer' }}>›</button>
                              <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999 }}>
                                {pi+1} / {req.photos.length}
                              </div>
                            </>
                          )}
                          {/* Миниатюры */}
                          {req.photos.length > 1 && (
                            <div style={{ position:'absolute', bottom:8, left:8, display:'flex', gap:4 }}>
                              {req.photos.slice(0,4).map((p,i) => i > 0 && (
                                <div key={i} onClick={e => { e.stopPropagation(); setPhotoIdx(prev => ({...prev,[req.id]:i})); }}
                                  style={{ width:36, height:28, borderRadius:4, overflow:'hidden', border: i===pi ? '2px solid #e8410a' : '1.5px solid rgba(255,255,255,0.7)', cursor:'pointer' }}>
                                  <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ padding:'16px 18px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                          <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0, lineHeight:1.3 }}>{req.title}</h3>
                          <span style={{ fontSize:11, fontWeight:700, color:st.color, background:st.bg, padding:'4px 10px', borderRadius:999, flexShrink:0 }}>
                            {st.label}
                          </span>
                        </div>

                        {req.description && req.description !== 'Без описания' && (
                          <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 12px', lineHeight:1.6,
                            display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                            {req.description}
                          </p>
                        )}

                        {req.budgetTo && (
                          <div style={{ fontSize:16, fontWeight:900, color:'#e8410a', marginBottom:10 }}>
                            до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽
                          </div>
                        )}

                        <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:12, color:'#9ca3af', paddingTop:10, borderTop:'1px solid #f3f4f6' }}>
                          {req.addressText && <span>📍 {req.addressText}</span>}
                          {req.createdAt   && <span>🕐 {timeAgo(req.createdAt)}</span>}
                        </div>
                      </div>
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
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLightbox(null)}>
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, display:'block', pointerEvents:'none', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }} />
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:13, fontWeight:700, padding:'4px 10px', borderRadius:999 }}>
              {lightbox.index+1} / {lightbox.photos.length}
            </div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:22, cursor:'pointer' }}>×</button>
            {lightbox.photos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }}
                  style={{ position:'absolute', left:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }}
                  style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>›</button>
              </>
            )}
          </div>
          {lightbox.photos.length > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:14 }} onClick={e => e.stopPropagation()}>
              {lightbox.photos.map((p,i) => (
                <div key={i} onClick={() => setLightbox(l => ({...l, index:i}))}
                  style={{ width:52, height:40, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i===lightbox.index ? '2.5px solid #e8410a' : '2px solid rgba(255,255,255,0.2)', opacity: i===lightbox.index ? 1 : 0.6 }}>
                  <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}