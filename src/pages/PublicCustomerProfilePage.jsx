import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicWorkerProfile.css';
import './PublicCustomerProfile.css';

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
  if (!d) return 'Недавно';
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
  const { userId } = useAuth();

  const [customer,  setCustomer]  = useState(null);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lightbox,  setLightbox]  = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'reviews'

  // Клавиатурная навигация lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') setLightbox(l => l ? {...l, index: l.index < l.photos.length - 1 ? l.index + 1 : 0} : l);
      if (e.key === 'ArrowLeft')  setLightbox(l => l ? {...l, index: l.index > 0 ? l.index - 1 : l.photos.length - 1} : l);
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);

    Promise.all([
      // Профиль заказчика
      fetch(`${API}/customers/${customerId}/profile`).then(r => r.ok ? r.json() : null),
      // Открытые заявки заказчика
      fetch(`${API}/customers/${customerId}/requests`).then(r => r.ok ? r.json() : []),
    ])
      .then(([profileData, requestsData]) => {
        setCustomer(profileData || { id: customerId, displayName: 'Заказчик', city: 'Йошкар-Ола' });
        setRequests(Array.isArray(requestsData) ? requestsData : []);
        setLoading(false);
      })
      .catch(() => {
        // Если API нет — показываем заглушку
        setCustomer({ id: customerId, displayName: 'Заказчик', city: 'Йошкар-Ола' });
        setRequests([]);
        setLoading(false);
      });
  }, [customerId]);

  if (loading) {
    return (
      <div className="container" style={{ padding:'60px 24px', textAlign:'center' }}>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container" style={{ padding:'60px 24px', textAlign:'center' }}>
        <p>{error || 'Профиль не найден'}</p>
        <Link to="/find-work" className="btn btn-primary" style={{ marginTop:16 }}>
          К заявкам
        </Link>
      </div>
    );
  }

  const name = customer.displayName || customer.name || 'Заказчик';
  const initials = name.split(' ').map(x => x[0] || '').join('').toUpperCase().slice(0, 2) || '?';
  const openRequests = requests.filter(r => r.status === 'OPEN');
  const completedRequests = requests.filter(r => r.status === 'COMPLETED');

  return (
    <div>
      {/* Шапка */}
      <div className="page-header-bar">
        <div className="container">
          <button className="cats-back-link" onClick={() => navigate(-1)}>
            ← Назад
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingBottom:60 }}>
        <div className="public-worker-layout">

          {/* ══ ЛЕВАЯ КОЛОНКА — карточка профиля ══ */}
          <div className="public-worker-card">

            {/* Аватар */}
            {customer.avatarUrl ? (
              <img src={customer.avatarUrl} alt={name}
                style={{ width:88, height:88, borderRadius:'50%', objectFit:'cover', margin:'0 auto 12px', display:'block', border:'3px solid #e5e7eb' }}
              />
            ) : (
              <div className="public-worker-avatar">{initials}</div>
            )}

            <h1 className="public-worker-name">{name}</h1>
            {customer.lastName && <p style={{ fontSize:13, color:'#9ca3af', marginTop:-8, marginBottom:8 }}>{customer.lastName}</p>}
            <p className="public-worker-city">📍 {customer.city || 'Йошкар-Ола'}</p>

            {/* Статистика */}
            <div className="public-worker-stats">
              <div className="pub-stat-item">
                <div className="pub-stat-value">{requests.length}</div>
                <div className="pub-stat-label">Заявок</div>
              </div>
              <div className="pub-stat-item">
                <div className="pub-stat-value">{completedRequests.length}</div>
                <div className="pub-stat-label">Выполнено</div>
              </div>
              <div className="pub-stat-item">
                <div className="pub-stat-value">{openRequests.length}</div>
                <div className="pub-stat-label">Открытых</div>
              </div>
            </div>

            {/* Бейджи */}
            <div className="public-worker-badges">
              <span className="pub-badge">✓ Проверен</span>
              {requests.length >= 3 && <span className="pub-badge">⭐ Активный</span>}
              {completedRequests.length >= 1 && <span className="pub-badge">🤝 Надёжный</span>}
            </div>

            {/* Дата регистрации */}
            {customer.registeredAt && (
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:12 }}>
                На сервисе с {getMemberSince(customer.registeredAt)}
              </p>
            )}

            {/* Кнопка написать — только если не сам себе */}
            {userId && userId !== customerId && (
              <button
                className="btn btn-primary btn-full"
                style={{ marginTop:16 }}
                onClick={() => navigate(`/chat/${customerId}`)}
              >
                💬 Написать заказчику
              </button>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА — контент ══ */}
          <div className="public-worker-main">

            {/* Табы */}
            <div style={{ display:'flex', gap:4, background:'#f3f4f6', borderRadius:14, padding:4, marginBottom:20, width:'fit-content' }}>
              {[
                ['requests', `Заявки (${openRequests.length})`],
                ['all',      `Все (${requests.length})`],
              ].map(([key, label]) => (
                <button key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding:'9px 18px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                    background: activeTab === key ? '#fff' : 'none',
                    color: activeTab === key ? '#111827' : '#6b7280',
                    boxShadow: activeTab === key ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
                    transition:'all .15s',
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Список заявок */}
            {(activeTab === 'requests' ? openRequests : requests).length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <p>{activeTab === 'requests' ? 'Нет открытых заявок' : 'Заявок пока нет'}</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {(activeTab === 'requests' ? openRequests : requests).map(req => {
                  const st = STATUS_LABELS[req.status] || STATUS_LABELS.OPEN;
                  const hasPhoto = req.photos && req.photos.length > 0;
                  return (
                    <div key={req.id} style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:16, overflow:'hidden', transition:'all .2s' }}
                      className="pc-req-card"
                    >
                      {/* Фото */}
                      {hasPhoto && (
                        <div style={{ position:'relative', width:'100%', aspectRatio:'16/9', overflow:'hidden', cursor:'pointer', background:'#f3f4f6' }}
                          onClick={() => setLightbox({ photos: req.photos, index: 0 })}
                        >
                          <img src={req.photos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                          {req.photos.length > 1 && (
                            <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999 }}>
                              📷 {req.photos.length}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Контент */}
                      <div style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:8 }}>
                          <h3 style={{ fontSize:15, fontWeight:700, color:'#111827', margin:0 }}>{req.title}</h3>
                          <span style={{ fontSize:11, fontWeight:700, color: st.color, background: st.bg, padding:'3px 9px', borderRadius:999, flexShrink:0 }}>
                            {st.label}
                          </span>
                        </div>

                        {req.description && req.description !== 'Без описания' && (
                          <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 10px', lineHeight:1.5,
                            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                            {req.description}
                          </p>
                        )}

                        <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:12, color:'#9ca3af' }}>
                          {req.budgetTo && <span>💰 до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</span>}
                          {req.addressText && <span>📍 {req.addressText}</span>}
                          {req.createdAt && <span>🕐 {timeAgo(req.createdAt)}</span>}
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
          onClick={() => setLightbox(null)}
        >
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'block', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:13, fontWeight:700, padding:'4px 10px', borderRadius:999 }}>
              {lightbox.index + 1} / {lightbox.photos.length}
            </div>
            <button onClick={() => setLightbox(null)}
              style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            {lightbox.photos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index > 0 ? l.index - 1 : l.photos.length - 1})); }}
                  style={{ position:'absolute', left:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index < l.photos.length - 1 ? l.index + 1 : 0})); }}
                  style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>›</button>
              </>
            )}
          </div>
          {lightbox.photos.length > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:14 }} onClick={e => e.stopPropagation()}>
              {lightbox.photos.map((p, i) => (
                <div key={i} onClick={() => setLightbox(l => ({...l, index: i}))}
                  style={{ width:52, height:40, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i === lightbox.index ? '2.5px solid #e8410a' : '2px solid rgba(255,255,255,0.2)', opacity: i === lightbox.index ? 1 : 0.6 }}>
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