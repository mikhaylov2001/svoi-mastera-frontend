import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMyDeals, completeDeal,
  getMyJobRequests, getOffersForRequest, acceptOffer, getCategories,
  createReview,
} from '../api';
import { useAuth } from '../context/AuthContext';
import './DealsPage.css';

const DEAL_STATUSES = {
  NEW:         { label: 'Новая',     emoji: '📋', color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  IN_PROGRESS: { label: 'В работе',  emoji: '⚙️',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:   { label: 'Завершена', emoji: '✅',  color: '#22c55e', bg: 'rgba(34,197,94,.12)'   },
  CANCELLED:   { label: 'Отменена',  emoji: '❌',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'   },
};

const REQ_STATUSES = {
  DRAFT:          { label: 'Черновик',   emoji: '📝', color: '#9ca3af', bg: 'rgba(156,163,175,.12)' },
  OPEN:           { label: 'Открыта',    emoji: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,.12)'   },
  IN_NEGOTIATION: { label: 'Обсуждение', emoji: '💬', color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  ASSIGNED:       { label: 'Назначена',  emoji: '👷', color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
  IN_PROGRESS:    { label: 'В работе',   emoji: '⚙️',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:      { label: 'Выполнена',  emoji: '✅',  color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  CANCELLED:      { label: 'Отменена',   emoji: '❌',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
  EXPIRED:        { label: 'Истекла',    emoji: '⏰',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
};

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  return `${Math.floor(h / 24)} дн. назад`;
}

export default function DealsPage() {
  const { userId } = useAuth();
  const navigate   = useNavigate();

  const [deals,      setDeals]      = useState([]);
  const [requests,   setRequests]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [tab,        setTab]        = useState('requests');
  const [reqFilter,  setReqFilter]  = useState('ALL');
  const [dealFilter, setDealFilter] = useState('ALL');
  const [unifiedFilter, setUnifiedFilter] = useState('ALL');

  const [dealDetail, setDealDetail] = useState(null);
  const [reqDetail,  setReqDetail]  = useState(null);

  const [offers,        setOffers]        = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const [actionId, setActionId] = useState(null);

  // ✅ ДОБАВЛЕНО: Стейты для отзыва
  const [reviewDeal, setReviewDeal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewStatus, setReviewStatus] = useState('idle');

  // Lightbox для фото
  const [lightbox, setLightbox] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0); // { photos: [], index: 0 }

  // Клавиатурная навигация lightbox
  React.useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') setLightbox(l => l ? {...l, index: l.index < l.photos.length - 1 ? l.index + 1 : 0} : l);
      if (e.key === 'ArrowLeft')  setLightbox(l => l ? {...l, index: l.index > 0 ? l.index - 1 : l.photos.length - 1} : l);
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r, c] = await Promise.all([
        getMyDeals(userId),
        getMyJobRequests(userId),
        getCategories(),
      ]);
      setDeals(d);
      console.log('🔍 DEALS DATA:', d.map(deal => ({
        id: deal.id?.substring(0,8),
        customerAvatar: deal.customerAvatar ? `YES (${deal.customerAvatar.length} chars)` : `NO (${deal.customerAvatar})`,
        workerAvatar: deal.workerAvatar ? `YES (${deal.workerAvatar.length} chars)` : `NO (${deal.workerAvatar})`,
      })));
      setRequests(r);
      setCategories(c);
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (dealDetail?.id) {
      const fresh = deals.find(d => d.id === dealDetail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(dealDetail)) setDealDetail(fresh);
    }
  }, [deals, dealDetail]);

  const getCatName = (id) => categories.find(c => c.id === id)?.name || '';

  const loadOffers = async (reqId) => {
    setOffersLoading(true);
    try { setOffers(await getOffersForRequest(reqId)); } catch { setOffers([]); }
    setOffersLoading(false);
  };

  const handleAccept = async (req, offer) => {
    setActionId(offer.id);
    try {
      await acceptOffer(userId, req.id, offer.id);
      await load();
      setReqDetail(null);
      setOffers([]);
      setTab('deals');
    } catch {}
    setActionId(null);
  };

  const handleConfirm = async (dealId) => {
    setActionId(dealId);
    try { await completeDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  // ✅ ДОБАВЛЕНО: Обработчик отправки отзыва
  const handleReviewSubmit = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done');
      await load();
    } catch (err) {
      console.error(err);
      setReviewStatus('error');
    }
  };

  const isCust = (d) => d.customerId === userId;

  // Заявки у которых уже есть сделка — скрываем из таба заявок
  const dealsJobRequestIds = new Set(deals.map(d => d.jobRequestId).filter(Boolean));
  const activeRequests = requests.filter(r => !dealsJobRequestIds.has(r.id));

  const reqCounts = {
    ALL:         activeRequests.length,
    OPEN:        activeRequests.filter(r => r.status === 'OPEN').length,
    IN_PROGRESS: activeRequests.filter(r => ['IN_PROGRESS','ASSIGNED','IN_NEGOTIATION'].includes(r.status)).length,
    COMPLETED:   activeRequests.filter(r => r.status === 'COMPLETED').length,
  };
  const dealCounts = {
    ALL:         deals.length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

  const filteredReqs = reqFilter === 'ALL' ? activeRequests
    : reqFilter === 'IN_PROGRESS'
      ? activeRequests.filter(r => ['IN_PROGRESS','ASSIGNED','IN_NEGOTIATION'].includes(r.status))
      : activeRequests.filter(r => r.status === reqFilter);

  const filteredDeals = dealFilter === 'ALL' ? deals
    : deals.filter(d => d.status === dealFilter);

  /* ══ DEAL DETAIL ══ */
  if (dealDetail) {
    const st       = DEAL_STATUSES[dealDetail.status] || DEAL_STATUSES.NEW;
    const im       = isCust(dealDetail);
    const myOk     = im ? dealDetail.customerConfirmed : dealDetail.workerConfirmed;
    const otherOk  = im ? dealDetail.workerConfirmed   : dealDetail.customerConfirmed;
    const hasPhoto = dealDetail.photos && dealDetail.photos.length > 0;

    return (
      <div style={{ background:'#f5f5f5', minHeight:'100vh' }}>
        {/* Навигация */}
        <div style={{ background:'#fff', borderBottom:'1.5px solid #e5e7eb', padding:'12px 0' }}>
          <div className="container">
            <button className="cats-back-link" onClick={() => setDealDetail(null)}>
              ← Назад к сделкам
            </button>
          </div>
        </div>

        <div className="container" style={{ paddingTop:20, paddingBottom:60 }}>
          {/* Заголовок */}
          <div style={{ marginBottom:16 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#111827', margin:'0 0 6px' }}>{dealDetail.title || 'Задача'}</h1>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <span className="dp-badge" style={{ color:st.color, background:st.bg }}>{st.emoji} {st.label}</span>
              {dealDetail.category && <span style={{ fontSize:13, color:'#9ca3af' }}>🏷 {dealDetail.category}</span>}
              {dealDetail.createdAt && <span style={{ fontSize:13, color:'#9ca3af' }}>🕐 {timeAgo(dealDetail.createdAt)}</span>}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'flex-start' }}>
            {/* Левая колонка */}
            <div>
              {/* Фото */}
              {hasPhoto && (
                <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                  <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', cursor:'pointer' }}
                    onClick={() => setLightbox({ photos: dealDetail.photos, index:0 })}>
                    <img src={dealDetail.photos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' }} />
                    {dealDetail.photos.length > 1 && (
                      <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999 }}>
                        📷 {dealDetail.photos.length}
                      </div>
                    )}
                  </div>
                  {dealDetail.photos.length > 1 && (
                    <div style={{ display:'flex', gap:6, padding:'10px 12px', overflowX:'auto', background:'#fafafa' }}>
                      {dealDetail.photos.map((p,i) => (
                        <div key={i} onClick={() => setLightbox({ photos: dealDetail.photos, index:i })}
                          style={{ width:72, height:54, flexShrink:0, borderRadius:6, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===0?'#e8410a':'transparent'}` }}>
                          <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Описание */}
              {dealDetail.description && dealDetail.description !== 'Без описания' && (
                <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Описание задачи</div>
                  <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0 }}>{dealDetail.description}</p>
                </div>
              )}

              {/* Подробности */}
              <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:14 }}>Подробности</div>
                {[
                  dealDetail.category    && ['Категория', dealDetail.category],
                  dealDetail.agreedPrice && ['Стоимость', `${Number(dealDetail.agreedPrice).toLocaleString('ru-RU')} ₽`],
                  dealDetail.createdAt   && ['Создана',   timeAgo(dealDetail.createdAt)],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid #f3f4f6', fontSize:14 }}>
                    <span style={{ color:'#9ca3af', fontWeight:500 }}>{label}</span>
                    <span style={{ color:'#111827', fontWeight:600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая колонка */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, position:'sticky', top:72 }}>

              {/* Цена */}
              {dealDetail.agreedPrice && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:26, fontWeight:900, color:'#111827' }}>
                    {Number(dealDetail.agreedPrice).toLocaleString('ru-RU')} ₽
                  </div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>Договорная стоимость</div>
                </div>
              )}

              {/* Карточка мастера (видит заказчик) */}
              {im && dealDetail.workerName && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:12, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:12 }}>Мастер</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', marginBottom:12 }}
                    onClick={() => dealDetail.workerId && navigate(`/workers/${dealDetail.workerId}`)}>
                    {dealDetail.workerAvatar && dealDetail.workerAvatar.length > 10 && dealDetail.workerAvatar !== 'null' ? (
                      <img src={dealDetail.workerAvatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }}
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex'); }} />
                    ) : null}
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display: dealDetail.workerAvatar && dealDetail.workerAvatar.length > 10 && dealDetail.workerAvatar !== 'null' ? 'none' : 'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16, flexShrink:0 }}>
                      {(dealDetail.workerName||'М')[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                        {[dealDetail.workerName, dealDetail.workerLastName].filter(Boolean).join(' ')}
                      </div>
                      <div style={{ fontSize:12, color:'#6366f1', fontWeight:600 }}>● Мастер</div>
                    </div>
                    <div style={{ color:'#9ca3af', fontSize:18 }}>›</div>
                  </div>
                  <button onClick={() => navigate(`/chat/${dealDetail.workerId}`)}
                    style={{ width:'100%', padding:'10px', background:'rgba(14,165,233,.07)', border:'1.5px solid rgba(14,165,233,.2)', borderRadius:8, color:'#0ea5e9', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    💬 Написать мастеру
                  </button>
                </div>
              )}

              {/* Карточка заказчика (видит мастер) */}
              {!im && dealDetail.customerName && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:12, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:12 }}>Заказчик</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', marginBottom:12 }}
                    onClick={() => dealDetail.customerId && navigate(`/customers/${dealDetail.customerId}`)}>
                    {dealDetail.customerAvatar && dealDetail.customerAvatar.length > 10 && dealDetail.customerAvatar !== 'null' ? (
                      <img src={dealDetail.customerAvatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }}
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex'); }} />
                    ) : null}
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display: dealDetail.customerAvatar && dealDetail.customerAvatar.length > 10 && dealDetail.customerAvatar !== 'null' ? 'none' : 'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16, flexShrink:0 }}>
                      {(dealDetail.customerName||'З')[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                        {[dealDetail.customerName, dealDetail.customerLastName].filter(Boolean).join(' ')}
                      </div>
                      <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Активный заказчик</div>
                    </div>
                    <div style={{ color:'#9ca3af', fontSize:18 }}>›</div>
                  </div>
                  <button onClick={() => navigate(`/chat/${dealDetail.customerId}`)}
                    style={{ width:'100%', padding:'10px', background:'rgba(14,165,233,.07)', border:'1.5px solid rgba(14,165,233,.2)', borderRadius:8, color:'#0ea5e9', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    💬 Написать заказчику
                  </button>
                </div>
              )}

              {/* Подтверждение */}
              {dealDetail.status === 'IN_PROGRESS' && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:6 }}>Подтверждение выполнения</div>
                  <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 14px', lineHeight:1.5 }}>
                    Нажмите кнопку когда работа выполнена. Сделка завершится после подтверждения обеих сторон.
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                    {[
                      { confirmed: dealDetail.customerConfirmed, name: `Заказчик${im ? ' (вы)' : ''}` },
                      { confirmed: dealDetail.workerConfirmed,   name: `Мастер${!im ? ' (вы)' : ''}` },
                    ].map(({ confirmed, name }) => (
                      <div key={name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, background: confirmed ? 'rgba(34,197,94,.07)' : '#f9fafb', border:`1px solid ${confirmed ? 'rgba(34,197,94,.2)' : '#e5e7eb'}` }}>
                        <span style={{ fontSize:16 }}>{confirmed ? '✅' : '⏳'}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{name}</div>
                          <div style={{ fontSize:11, color: confirmed ? '#22c55e' : '#9ca3af' }}>
                            {confirmed ? 'Подтвердил выполнение' : 'Ожидание подтверждения'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!myOk ? (
                    <button className="dp-confirm-btn" disabled={actionId === dealDetail.id} onClick={() => handleConfirm(dealDetail.id)}>
                      {actionId === dealDetail.id ? 'Подтверждаем…' : '✅ Подтвердить выполнение'}
                    </button>
                  ) : (
                    <div className="dp-wait">✓ Вы подтвердили{!otherOk && ' — ожидаем другую сторону…'}</div>
                  )}
                </div>
              )}

              {dealDetail.status === 'COMPLETED' && (
                <div style={{ background:'rgba(34,197,94,.07)', borderRadius:12, padding:'16px 20px', border:'1px solid rgba(34,197,94,.2)', textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>🏆</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 }}>Сделка завершена!</div>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Обе стороны подтвердили выполнение</div>
                  {im && !dealDetail.hasReview && (
                    <button
                      onClick={() => setReviewDeal(dealDetail)}
                      style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(99,102,241,.28)', transition:'transform .15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
                    >⭐ Оставить отзыв мастеру</button>
                  )}
                  {im && dealDetail.hasReview && (
                    <div style={{ fontSize:13, color:'#22c55e', fontWeight:600, background:'rgba(34,197,94,.08)', borderRadius:8, padding:'10px' }}>✓ Вы оставили отзыв</div>
                  )}
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
              <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'block', pointerEvents:'none' }} />
              <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:999 }}>
                {lightbox.index+1} / {lightbox.photos.length}
              </div>
              <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>×</button>
              {lightbox.photos.length > 1 && (<>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }}
                  style={{ position:'absolute', left:-50, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }}
                  style={{ position:'absolute', right:-50, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:24, cursor:'pointer' }}>›</button>
              </>)}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══ REQUEST DETAIL ══ */
  if (reqDetail) {
    const st      = REQ_STATUSES[reqDetail.status] || REQ_STATUSES.OPEN;
    const catName = getCatName(reqDetail.categoryId);

    return (
      <>
      <div>
        <div style={{ background:'#fff', borderBottom:'1.5px solid #e5e7eb', padding:'12px 0' }}>
          <div className="container">
            <button className="cats-back-link" onClick={() => { setReqDetail(null); setOffers([]); }}>
              ← Назад к заказам
            </button>
          </div>
        </div>
        <div className="page-header-bar">
          <div className="container">
            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:10 }}>
              <div style={{ width:52, height:52, borderRadius:14, overflow:'hidden', flexShrink:0, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                {reqDetail.photos && reqDetail.photos.length > 0
                  ? <img src={reqDetail.photos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                  : '📋'
                }
              </div>
              <div>
                <h1 style={{ fontSize:22 }}>{reqDetail.title}</h1>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
                  <span className="dp-badge" style={{ color: st.color, background: st.bg }}>{st.emoji} {st.label}</span>
                  {catName && <span style={{ fontSize:13, color:'#9ca3af' }}>🏷 {catName}</span>}
                  {reqDetail.budgetTo && <span style={{ fontSize:14, color:'#111827', fontWeight:800 }}>💰 до {Number(reqDetail.budgetTo).toLocaleString('ru-RU')} ₽</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="dp-grid" style={{ paddingTop:24 }}>
            {/* Левая колонка */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Фото — первыми, большие */}
              {reqDetail.photos && reqDetail.photos.length > 0 && (
                <div className="dp-card" style={{ padding:0, overflow:'hidden' }}>
                  {/* Главное фото */}
                  <div style={{ width:'100%', aspectRatio:'16/9', overflow:'hidden', position:'relative' }}>
                    <img
                      src={reqDetail.photos[activePhotoIndex]}
                      alt=""
                      style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block', transition:'opacity .2s' }}
                    />
                    {/* Стрелки навигации */}
                    {reqDetail.photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setActivePhotoIndex(i => i > 0 ? i - 1 : reqDetail.photos.length - 1)}
                          style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:38, height:38, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
                        >‹</button>
                        <button
                          onClick={() => setActivePhotoIndex(i => i < reqDetail.photos.length - 1 ? i + 1 : 0)}
                          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:38, height:38, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
                        >›</button>
                      </>
                    )}
                    {/* Счётчик + кнопка увеличения */}
                    <div style={{ position:'absolute', bottom:10, right:10, display:'flex', gap:6, alignItems:'center' }}>
                      <div style={{ background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:999, backdropFilter:'blur(4px)' }}>
                        {activePhotoIndex + 1} / {reqDetail.photos.length}
                      </div>
                      <button
                        onClick={() => setLightbox({ photos: reqDetail.photos, index: activePhotoIndex })}
                        style={{ background:'rgba(0,0,0,0.55)', border:'none', color:'#fff', fontSize:14, padding:'4px 10px', borderRadius:999, cursor:'pointer', backdropFilter:'blur(4px)' }}
                        title="Открыть на весь экран"
                      >⛶</button>
                    </div>
                  </div>
                  {/* Полоса миниатюр */}
                  {reqDetail.photos.length > 1 && (
                    <div style={{ display:'flex', gap:6, padding:'10px 12px', background:'#f9fafb', overflowX:'auto' }}>
                      {reqDetail.photos.map((p, i) => (
                        <div
                          key={i}
                          onClick={() => setActivePhotoIndex(i)}
                          style={{ width:72, height:54, userSelect:'none', flexShrink:0, borderRadius:8, overflow:'hidden', cursor:'pointer', border: i === activePhotoIndex ? '2.5px solid #e8410a' : '2px solid transparent', opacity: i === activePhotoIndex ? 1 : 0.6, transition:'all .15s' }}
                        >
                          <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Описание */}
              {reqDetail.description && reqDetail.description !== 'Без описания' && (
                <div className="dp-card">
                  <div className="dp-card-label">Описание задачи</div>
                  <p className="dp-desc">{reqDetail.description}</p>
                </div>
              )}

              {/* Детали в сетке */}
              <div className="dp-card">
                <div className="dp-card-label">Детали заявки</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {catName && (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Категория</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>🏷 {catName}</div>
                    </div>
                  )}
                  {reqDetail.budgetTo && (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Бюджет</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>💰 до {Number(reqDetail.budgetTo).toLocaleString('ru-RU')} ₽</div>
                    </div>
                  )}
                  {reqDetail.addressText && (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Адрес</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>📍 {reqDetail.addressText}</div>
                    </div>
                  )}
                  <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Создана</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>🕐 {timeAgo(reqDetail.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка — отклики */}
            <div className="dp-side">
              {reqDetail.status === 'OPEN' ? (
                <>
                  <div className="dp-side-title">Отклики мастеров</div>
                  <p className="dp-side-hint">Примите подходящий отклик — и начнётся сделка</p>
                  {offersLoading ? (
                    <div className="dp-skeleton" style={{ height:64, borderRadius:12 }} />
                  ) : offers.length === 0 ? (
                    <div className="dp-empty-offers">
                      <span>⏳</span>
                      <p>Мастера ещё не откликнулись. Обычно первые отклики приходят в течение 10 минут.</p>
                    </div>
                  ) : (
                    offers.map(offer => (
                      <div key={offer.id} className="dp-offer">
                        <div className="dp-offer-top">
                          <span className="dp-offer-price">{Number(offer.price).toLocaleString('ru-RU')} ₽</span>
                          {offer.estimatedDays && <span className="dp-offer-days">· {offer.estimatedDays} дн.</span>}
                        </div>
                        {offer.message && <p className="dp-offer-msg">{offer.message}</p>}
                        <div className="dp-offer-date">{timeAgo(offer.createdAt)}</div>
                        {offer.status === 'CREATED' && (
                          <div className="dp-offer-actions">
                            <button className="dp-confirm-btn" disabled={actionId === offer.id} onClick={() => handleAccept(reqDetail, offer)}>
                              {actionId === offer.id ? 'Принимаем…' : '✅ Принять'}
                            </button>
                            {(offer.workerUserId || offer.workerId) && (
                              <button className="dp-chat-btn" onClick={() => navigate(`/chat/${offer.workerUserId || offer.workerId}?jobRequestId=${reqDetail.id}`)}>
                                💬 Написать
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="dp-state">
                  <span>{st.emoji}</span>
                  <h3>{st.label}</h3>
                  <p>Статус заявки обновлён</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lightbox прямо здесь — без конфликта с router */}
        {lightbox && (
          <div
            style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
            onClick={() => setLightbox(null)}
          >
            <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
              <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'block' }} />
              <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:13, fontWeight:700, padding:'4px 10px', borderRadius:999 }}>
                {lightbox.index + 1} / {lightbox.photos.length}
              </div>
              <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              {lightbox.index > 0 && (
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index - 1})); }} style={{ position:'absolute', left:-56, top:'50%', transform:'translateY(-50%)', width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:28, cursor:'pointer' }}>‹</button>
              )}
              {lightbox.index < lightbox.photos.length - 1 && (
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index + 1})); }} style={{ position:'absolute', right:-56, top:'50%', transform:'translateY(-50%)', width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:28, cursor:'pointer' }}>›</button>
              )}
            </div>
            {lightbox.photos.length > 1 && (
              <div style={{ display:'flex', gap:8, marginTop:16 }} onClick={e => e.stopPropagation()}>
                {lightbox.photos.map((p, i) => (
                  <div key={i} onClick={() => setLightbox(l => ({...l, index: i}))} style={{ width:56, height:56, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i === lightbox.index ? '2.5px solid #e8410a' : '2px solid rgba(255,255,255,0.2)', opacity: i === lightbox.index ? 1 : 0.6 }}>
                    <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </>
    );
  }

    /* ══ LIST ══ */
  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мои сделки</h1>
          <p>Активные сделки и завершённые работы</p>
        </div>
      </div>

      <div className="container" style={{ padding:'28px 0 60px' }}>

        {/* Единые фильтры */}
        <div className="dpage-filters">
          {[
            ['ALL',         'Все',          deals.length + activeRequests.length],
            ['IN_PROGRESS', 'В работе',     dealCounts.IN_PROGRESS],
            ['REQUESTS',    'Мои заявки',   activeRequests.length],
            ['COMPLETED',   'Завершены',    dealCounts.COMPLETED],
          ].map(([key, label, count]) => (
            <button
              key={key}
              className={`dpage-filter-btn ${unifiedFilter === key ? 'active' : ''}`}
              onClick={() => setUnifiedFilter(key)}
            >
              {label} <span>{count}</span>
            </button>
          ))}
          <Link to="/sections" style={{
            marginLeft: 'auto', display:'inline-flex', alignItems:'center', gap:6,
            padding:'8px 16px', borderRadius:999, fontSize:13, fontWeight:700,
            color:'#e8410a', background:'rgba(232,65,10,.08)',
            border:'1.5px solid rgba(232,65,10,.2)', textDecoration:'none', whiteSpace:'nowrap',
          }}>
            <svg width="14" height="14" fill="none" stroke="#e8410a" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Найти мастера
          </Link>
        </div>

        {/* ── ЕДИНЫЙ СПИСОК ── */}
        <div className="dpage-list">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="dp-skeleton" style={{ height:88 }} />)
          ) : (() => {
            let items = [];
            if (unifiedFilter === 'ALL') {
              items = [
                ...deals.map(d => ({ _type:'deal', ...d })),
                ...activeRequests.map(r => ({ _type:'req', ...r })),
              ].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (unifiedFilter === 'IN_PROGRESS') {
              items = deals.filter(d => d.status === 'IN_PROGRESS').map(d => ({ _type:'deal', ...d }));
            } else if (unifiedFilter === 'REQUESTS') {
              items = activeRequests.map(r => ({ _type:'req', ...r }));
            } else if (unifiedFilter === 'COMPLETED') {
              items = deals.filter(d => d.status === 'COMPLETED').map(d => ({ _type:'deal', ...d }));
            }
            if (items.length === 0) return (
              <div className="dpage-empty">
                <span>📋</span>
                <h3>Ничего нет</h3>
                <p>Здесь появятся ваши заявки и сделки</p>
                <Link to="/sections" className="btn btn-primary btn-sm">Найти мастера</Link>
              </div>
            );
            return items.map(item => {
              if (item._type === 'req') {
                const req = item;
                const st = REQ_STATUSES[req.status] || REQ_STATUSES.OPEN;
                const hasPhoto = req.photos && req.photos.length > 0;
                return (
                  <div key={`req-${req.id}`} className="dpage-card-avito"
                    onClick={() => { setReqDetail(req); loadOffers(req.id); setActivePhotoIndex(0); }}>
                    <div className="dpage-card-avito-img"
                      onClick={hasPhoto ? e => { e.stopPropagation(); setLightbox({ photos: req.photos, index:0 }); } : undefined}
                      style={hasPhoto ? { cursor:'pointer' } : {}}>
                      {hasPhoto ? (
                        <><img src={req.photos[0]} alt="" style={{ pointerEvents:'none' }} />
                          {req.photos.length > 1 && <div className="dpage-card-avito-img-count">📷 {req.photos.length}</div>}
                        </>
                      ) : <div className="dpage-card-avito-img-placeholder"><span>📋</span></div>}
                    </div>
                    <div className="dpage-card-avito-body">
                      <div className="dpage-card-avito-top">
                        <h3 className="dpage-card-avito-title">{req.title}</h3>
                        <span className="dp-badge" style={{ color:st.color, background:st.bg, flexShrink:0 }}>{st.emoji} {st.label}</span>
                      </div>
                      {req.budgetTo && <div className="dpage-card-avito-price">до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</div>}
                      {req.description && req.description !== 'Без описания' && <p className="dpage-card-avito-desc">{req.description}</p>}
                      <div className="dpage-card-avito-meta">
                        {req.categoryId && <span>🏷 {getCatName(req.categoryId)}</span>}
                        {req.addressText && <span>📍 {req.addressText}</span>}
                        <span>🕐 {timeAgo(req.createdAt)}</span>
                      </div>
                    </div>
                    <div className="dpage-card-chevron">›</div>
                  </div>
                );
              } else {
                const d = item;
                const st = DEAL_STATUSES[d.status] || DEAL_STATUSES.NEW;
                const im = isCust(d);
                const hasPhoto = d.photos && d.photos.length > 0;
                return (
                  <div key={`deal-${d.id}`} className="dpage-card-avito" onClick={() => setDealDetail(d)}>
                    <div className="dpage-card-avito-img">
                      {hasPhoto ? <img src={d.photos[0]} alt="" style={{ pointerEvents:'none' }} />
                        : <div className="dpage-card-avito-img-placeholder"><span>🤝</span></div>}
                    </div>
                    <div className="dpage-card-avito-body">
                      <div className="dpage-card-avito-top">
                        <h3 className="dpage-card-avito-title">{d.title || 'Задача'}</h3>
                        <span className="dp-badge" style={{ color:st.color, background:st.bg, flexShrink:0 }}>{st.emoji} {st.label}</span>
                      </div>
                      {d.agreedPrice && <div className="dpage-card-avito-price">{Number(d.agreedPrice).toLocaleString('ru-RU')} ₽</div>}
                      <div className="dpage-card-avito-meta">
                        {d.category && <span>🏷 {d.category}</span>}
                        <span>👤 {im ? (d.workerName || 'Мастер') : d.customerName}</span>
                        <span>🕐 {timeAgo(d.createdAt)}</span>
                      </div>
                      {d.status === 'IN_PROGRESS' && (
                        <div className="dpage-card-progress" style={{ marginTop:8 }}>
                          <div className={`dp-prog ${d.customerConfirmed ? 'ok' : ''}`}>{d.customerConfirmed ? '✅' : '⏳'} Заказчик</div>
                          <span className="dp-prog-arrow">→</span>
                          <div className={`dp-prog ${d.workerConfirmed ? 'ok' : ''}`}>{d.workerConfirmed ? '✅' : '⏳'} Мастер</div>
                        </div>
                      )}
                    </div>
                    <div className="dpage-card-chevron">›</div>
                  </div>
                );
              }
            });
          })()}
        </div>
      </div>

      {/* Модалка отзыва */}
      {reviewDeal && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setReviewDeal(null)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, padding:28 }}
            onClick={e => e.stopPropagation()}>
            {reviewStatus === 'done' ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                <h3 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                <p style={{ color:'#6b7280', margin:'0 0 20px' }}>Спасибо за вашу оценку</p>
                <button onClick={() => setReviewDeal(null)}
                  style={{ padding:'10px 28px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Отзыв о мастере</h2>
                  <button onClick={() => setReviewDeal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                {/* Карточка мастера */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f9fafb', borderRadius:10, marginBottom:20 }}>
                  {reviewDeal.workerAvatar ? (
                    <img src={reviewDeal.workerAvatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                  ) : (
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                      {(reviewDeal.workerName||'М')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>
                      {[reviewDeal.workerName, reviewDeal.workerLastName].filter(Boolean).join(' ')}
                    </div>
                    <div style={{ fontSize:12, color:'#9ca3af' }}>Мастер</div>
                  </div>
                </div>

                {/* Звёзды */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Оценка</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setReviewForm(p => ({...p, rating:star}))}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:32, padding:0, opacity: star <= reviewForm.rating ? 1 : 0.25, transition:'opacity .15s', color:'#f59e0b' }}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Текст */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Комментарий</div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(p => ({...p, comment: e.target.value}))}
                    placeholder="Расскажите о качестве работы, пунктуальности, общении..."
                    style={{ width:'100%', padding:'12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, lineHeight:1.6, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='#e8410a'}
                    onBlur={e => e.target.style.borderColor='#e5e7eb'}
                  />
                </div>

                {reviewStatus === 'error' && (
                  <div style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>Не удалось отправить отзыв. Попробуйте ещё раз.</div>
                )}

                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewStatus === 'sending' || !reviewForm.comment?.trim()}
                  style={{ width:'100%', padding:'13px', background: reviewForm.comment?.trim() ? '#e8410a' : '#e5e7eb', border:'none', borderRadius:8, color: reviewForm.comment?.trim() ? '#fff' : '#9ca3af', fontSize:15, fontWeight:700, cursor: reviewForm.comment?.trim() ? 'pointer' : 'not-allowed', transition:'background .15s' }}>
                  {reviewStatus === 'sending' ? 'Отправляем...' : '⭐ Отправить отзыв'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* ══ LIGHTBOX ══ */}
      {lightbox && (
        <div
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLightbox(null)}
        >
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'block' }} />
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:13, fontWeight:700, padding:'4px 10px', borderRadius:999 }}>
              {lightbox.index + 1} / {lightbox.photos.length}
            </div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            {lightbox.index > 0 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index - 1})); }} style={{ position:'absolute', left:-56, top:'50%', transform:'translateY(-50%)', width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:28, cursor:'pointer' }}>‹</button>
            )}
            {lightbox.index < lightbox.photos.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index + 1})); }} style={{ position:'absolute', right:-56, top:'50%', transform:'translateY(-50%)', width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:28, cursor:'pointer' }}>›</button>
            )}
          </div>
          {lightbox.photos.length > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:16 }} onClick={e => e.stopPropagation()}>
              {lightbox.photos.map((p, i) => (
                <div key={i} onClick={() => setLightbox(l => ({...l, index: i}))} style={{ width:56, height:56, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i === lightbox.index ? '2.5px solid #e8410a' : '2px solid rgba(255,255,255,0.2)', opacity: i === lightbox.index ? 1 : 0.6 }}>
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