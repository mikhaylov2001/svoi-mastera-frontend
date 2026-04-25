import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getMyDeals, getListingsByWorker, completeDeal, createCustomerReview, workerStartDeal, cancelPendingDeal, cancelActiveDeal,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../customer/DealsPage.css'; // те же стили что у клиента

const DEAL_STATUSES = {
  NEW:              { label: 'Новая',           emoji: '🔔', color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  IN_PROGRESS:      { label: 'В работе',         emoji: '⚙️', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:        { label: 'Завершена',         emoji: '✅', color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  CANCELLED:        { label: 'Отменена',          emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,.12)'  },
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

function listingThumb(p) {
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  return `https://svoi-mastera-backend.onrender.com${p}`;
}

export default function WorkerDealsPage() {
  const { userId } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [deals,   setDeals]   = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTab, setPageTab] = useState('orders'); // 'orders' | 'listings'
  const [filter,  setFilter]  = useState('ALL');
  const [dealDetail, setDealDetail] = useState(null);
  const [actionId,   setActionId]   = useState(null);

  // Отмена NEW-сделки (отказ от заявки)
  const [cancelOpen,   setCancelOpen]   = useState(false);
  const [cancelNote,   setCancelNote]   = useState('');
  const [cancelBusy,   setCancelBusy]   = useState(false);
  const [cancelErrMsg, setCancelErrMsg] = useState('');
  const [decliningId,  setDecliningId]  = useState(null);

  // Отмена IN_PROGRESS сделки
  const [cancelActiveOpen,   setCancelActiveOpen]   = useState(false);
  const [cancelActiveNote,   setCancelActiveNote]   = useState('');
  const [cancelActiveBusy,   setCancelActiveBusy]   = useState(false);
  const [cancelActiveErrMsg, setCancelActiveErrMsg] = useState('');

  // Отзыв заказчику
  const [reviewDeal,   setReviewDeal]   = useState(null);
  const [reviewForm,   setReviewForm]   = useState({ rating: 5, text: '' });
  const [reviewStatus, setReviewStatus] = useState('idle');

  const handleCustomerReviewSubmit = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createCustomerReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done');
      await load();
    } catch (err) {
      console.error(err);
      setReviewStatus('error');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, lst] = await Promise.all([
        getMyDeals(userId),
        getListingsByWorker(userId).catch(() => []),
      ]);
      const uid = String(userId || '');
      setDeals((data || []).filter(d => String(d.workerId || '') === uid));
      setListings(Array.isArray(lst) ? lst : []);
    } catch {
      setDeals([]);
      setListings([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Открыть сделку по dealId из URL (?dealId=...)
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const id = qp.get('dealId');
    if (id && deals.length > 0) {
      const found = deals.find(d => d.id === id);
      if (found) setDealDetail(found);
    }
  }, [location.search, deals]);

  // Обновляем dealDetail если данные сделки изменились
  useEffect(() => {
    if (dealDetail?.id) {
      const fresh = deals.find(d => d.id === dealDetail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(dealDetail)) {
        setDealDetail(fresh);
      }
    }
  }, [deals, dealDetail]);

  const handleConfirm = async (dealId) => {
    setActionId(dealId);
    try { await completeDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  const handleStartDeal = async (dealId) => {
    setActionId(dealId);
    try { await workerStartDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  const handleCancelPendingDeal = async () => {
    if (!dealDetail?.id) return;
    setCancelBusy(true);
    setCancelErrMsg('');
    try {
      await cancelPendingDeal(userId, dealDetail.id, cancelNote);
      setCancelOpen(false);
      setCancelNote('');
      await load();
      setDealDetail(null);
    } catch (e) {
      setCancelErrMsg(e?.message || 'Не удалось отменить');
    }
    setCancelBusy(false);
  };

  const handleCancelActiveDeal = async () => {
    if (!dealDetail?.id) return;
    setCancelActiveBusy(true);
    setCancelActiveErrMsg('');
    try {
      await cancelActiveDeal(userId, dealDetail.id, cancelActiveNote);
      setCancelActiveOpen(false);
      setCancelActiveNote('');
      await load();
      setDealDetail(null);
    } catch (e) {
      setCancelActiveErrMsg(e?.message || 'Не удалось отменить сделку');
    }
    setCancelActiveBusy(false);
  };

  const counts = {
    ALL:         deals.length,
    NEW:         deals.filter(d => d.status === 'NEW').length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

  const activeListings = listings.filter(l => l.active);
  const archivedListings = listings.filter(l => !l.active);

  const filtered = filter === 'ALL'
    ? deals
    : deals.filter(d => d.status === filter);

  // ══ DEAL DETAIL ══
  if (dealDetail) {
    const st      = DEAL_STATUSES[dealDetail.status] || DEAL_STATUSES.NEW;
    const myOk    = dealDetail.workerConfirmed;
    const otherOk = dealDetail.customerConfirmed;
    const hasPhoto = dealDetail.photos && dealDetail.photos.length > 0;

    return (
      <div style={{ background:'#f5f5f5', minHeight:'100vh' }}>
        {/* Навигация */}
        <div style={{ background:'#fff', borderBottom:'1.5px solid #e5e7eb', padding:'12px 0' }}>
          <div className="container">
            <button className="cats-back-link" onClick={() => setDealDetail(null)}>
              ← Назад к заказам
            </button>
          </div>
        </div>

        <div className="container" style={{ paddingTop:20, paddingBottom:60 }}>
          {/* Заголовок */}
          <div style={{ marginBottom:16 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#111827', margin:'0 0 6px' }}>{dealDetail.title || 'Задача'}</h1>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <span className="dp-badge" style={{ color: st.color, background: st.bg }}>{st.emoji} {st.label}</span>
              {dealDetail.category && <span style={{ fontSize:13, color:'#9ca3af' }}>🏷 {dealDetail.category}</span>}
              {dealDetail.createdAt && <span style={{ fontSize:13, color:'#9ca3af' }}>🕐 {timeAgo(dealDetail.createdAt)}</span>}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'flex-start' }}>
            {/* Левая колонка */}
            <div>
              {/* Фото заявки */}
              {hasPhoto && (
                <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                  <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden' }}>
                    <img src={dealDetail.photos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' }} />
                    {dealDetail.photos.length > 1 && (
                      <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999 }}>
                        📷 {dealDetail.photos.length}
                      </div>
                    )}
                  </div>
                  {dealDetail.photos.length > 1 && (
                    <div style={{ display:'flex', gap:6, padding:'10px 12px', background:'#fafafa', overflowX:'auto' }}>
                      {dealDetail.photos.map((p, i) => (
                        <div key={i} style={{ width:72, height:54, flexShrink:0, borderRadius:6, overflow:'hidden', border:'2px solid transparent' }}>
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
                  <h2 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'.5px', fontSize:12, color:'#9ca3af' }}>Описание задачи</h2>
                  <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0 }}>{dealDetail.description}</p>
                </div>
              )}

              {/* Подробности */}
              <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:14 }}>Подробности</div>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {[
                    dealDetail.category    && ['Категория',  dealDetail.category],
                    dealDetail.agreedPrice && ['Стоимость',  `${Number(dealDetail.agreedPrice).toLocaleString('ru-RU')} ₽`],
                    dealDetail.createdAt   && ['Создана',    timeAgo(dealDetail.createdAt)],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #f3f4f6', fontSize:14 }}>
                      <span style={{ color:'#9ca3af', fontWeight:500 }}>{label}</span>
                      <span style={{ color:'#111827', fontWeight:600 }}>{value}</span>
                    </div>
                  ))}
                </div>
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

              {/* Карточка заказчика */}
              <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                <div style={{ fontSize:12, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:12 }}>Заказчик</div>
                <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
                  onClick={() => dealDetail.customerId && navigate(`/customers/${dealDetail.customerId}`)}>
                  {dealDetail.customerAvatar && dealDetail.customerAvatar.length > 10 && dealDetail.customerAvatar !== 'null' ? (
                    <img src={dealDetail.customerAvatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }} />
                  ) : (
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16, flexShrink:0 }}>
                      {(dealDetail.customerName||'З')[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                      {[dealDetail.customerName, dealDetail.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                    </div>
                    <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Активный заказчик</div>
                  </div>
                  <div style={{ color:'#9ca3af', fontSize:18 }}>›</div>
                </div>
                <button
                  onClick={() => navigate(`/chat/${dealDetail.customerId}`)}
                  style={{ width:'100%', marginTop:12, padding:'10px', background:'rgba(14,165,233,.07)', border:'1.5px solid rgba(14,165,233,.2)', borderRadius:8, color:'#0ea5e9', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  💬 Написать заказчику
                </button>
              </div>

              {/* ─── NEW: Заказчик принял, мастер должен подтвердить ─── */}
              {dealDetail.status === 'NEW' && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px', border:'1.5px solid #fde68a' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:6 }}>🔔 Новый заказ</div>
                  <p style={{ fontSize:13, color:'#78350f', margin:'0 0 16px', lineHeight:1.55, background:'#fffbeb', borderRadius:8, padding:'10px 12px' }}>
                    Заказчик выбрал вас и ждёт подтверждения.<br/>
                    Примите заказ — и он перейдёт в работу.
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <button
                      disabled={actionId === dealDetail.id}
                      onClick={() => handleStartDeal(dealDetail.id)}
                      style={{ width:'100%', padding:'13px', background: actionId === dealDetail.id ? '#fca98e' : '#e8410a', border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, cursor: actionId === dealDetail.id ? 'not-allowed' : 'pointer', boxShadow:'0 4px 16px rgba(232,65,10,.3)', transition:'background .15s' }}
                    >
                      {actionId === dealDetail.id ? '⏳ Принимаем…' : '✅ Принять заказ'}
                    </button>
                    <button
                      onClick={() => navigate(`/chat/${dealDetail.customerId}`)}
                      style={{ width:'100%', padding:'11px', background:'rgba(14,165,233,.07)', border:'1.5px solid rgba(14,165,233,.2)', borderRadius:10, color:'#0ea5e9', fontSize:13, fontWeight:700, cursor:'pointer' }}
                    >
                      💬 Уточнить детали
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCancelErrMsg(''); setCancelNote(''); setCancelOpen(true); }}
                      style={{ width:'100%', padding:'10px', background:'#fff', border:'1.5px solid #fecaca', borderRadius:10, color:'#b91c1c', fontSize:13, fontWeight:700, cursor:'pointer' }}
                    >
                      Отказаться от заказа
                    </button>
                    <p style={{ margin:0, fontSize:11, color:'#78716c', lineHeight:1.45, textAlign:'center' }}>
                      Если заказ вам не подходит — откажитесь до принятия, заказчик сможет выбрать другого мастера
                    </p>
                  </div>
                </div>
              )}

              {/* Подтверждение */}
              {dealDetail.status === 'IN_PROGRESS' && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:6 }}>Подтверждение выполнения</div>
                  <p style={{ fontSize:12, color:'#9ca3af', margin:'0 0 14px', lineHeight:1.5 }}>
                    Нажмите кнопку когда работа выполнена. Сделка завершится после подтверждения обеих сторон.
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                    {[
                      { confirmed: dealDetail.customerConfirmed, name: 'Заказчик' },
                      { confirmed: dealDetail.workerConfirmed,   name: 'Вы (мастер)' },
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
                    <div className="dp-wait">
                      ✓ Вы подтвердили{!otherOk && ' — ожидаем подтверждения заказчика…'}
                    </div>
                  )}

                  {/* Кнопка отмены активной сделки */}
                  <div style={{ marginTop:12, borderTop:'1px solid #f3f4f6', paddingTop:12 }}>
                    <button
                      onClick={() => { setCancelActiveErrMsg(''); setCancelActiveOpen(true); }}
                      style={{ width:'100%', padding:'10px', background:'transparent', border:'1.5px solid #fca5a5', borderRadius:10, color:'#ef4444', fontSize:13, fontWeight:700, cursor:'pointer' }}
                    >
                      🚫 Отказаться от сделки
                    </button>
                    <p style={{ margin:'6px 0 0', fontSize:11, color:'#a8a29e', textAlign:'center', lineHeight:1.4 }}>
                      После завершения сделки отмена невозможна
                    </p>
                  </div>
                </div>
              )}

              {dealDetail.status === 'CANCELLED' && dealDetail.cancellationReason && (
                <div style={{ background:'rgba(239,68,68,.05)', borderRadius:12, padding:'14px 16px', border:'1px solid rgba(239,68,68,.15)' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#ef4444', marginBottom:4 }}>Причина отмены</div>
                  <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.5 }}>{dealDetail.cancellationReason}</div>
                </div>
              )}

              {dealDetail.status === 'COMPLETED' && (
                <div style={{ background:'rgba(34,197,94,.07)', borderRadius:12, padding:'16px 20px', border:'1px solid rgba(34,197,94,.2)', textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>🏆</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 }}>Работа завершена!</div>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Обе стороны подтвердили выполнение</div>
                  {!dealDetail.hasWorkerReview && dealDetail.customerId && (
                    <button
                      onClick={() => { setReviewForm({ rating: 5, text: '' }); setReviewStatus('idle'); setReviewDeal(dealDetail); }}
                      style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(99,102,241,.28)' }}
                    >⭐ Оставить отзыв о заказчике</button>
                  )}
                  {dealDetail.hasWorkerReview && (
                    <div style={{ fontSize:13, color:'#22c55e', fontWeight:600, background:'rgba(34,197,94,.08)', borderRadius:8, padding:'10px' }}>✓ Вы оставили отзыв</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {cancelOpen && dealDetail?.status === 'NEW' && (
          <div style={{ position:'fixed', inset:0, zIndex:2100, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={() => !cancelBusy && setCancelOpen(false)}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:420, padding:24, boxShadow:'0 20px 50px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:800, color:'#111827' }}>Отказаться от заказа?</h3>
              <p style={{ margin:'0 0 16px', fontSize:14, color:'#6b7280', lineHeight:1.5 }}>
                Заказчик увидит, что вы не приняли заказ. Можно указать причину — это необязательно.
              </p>
              <textarea
                value={cancelNote}
                onChange={e => setCancelNote(e.target.value)}
                placeholder="Например: занят, не мой профиль работ…"
                rows={3}
                style={{ width:'100%', padding:10, borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, resize:'vertical', boxSizing:'border-box', marginBottom:12 }}
              />
              {cancelErrMsg && <div style={{ color:'#dc2626', fontSize:13, marginBottom:12 }}>{cancelErrMsg}</div>}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" disabled={cancelBusy} onClick={() => setCancelOpen(false)}
                  style={{ padding:'10px 18px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', fontWeight:700, cursor: cancelBusy ? 'not-allowed' : 'pointer' }}>Назад</button>
                <button type="button" disabled={cancelBusy} onClick={handleCancelPendingDeal}
                  style={{ padding:'10px 18px', borderRadius:8, border:'none', background:'#b91c1c', color:'#fff', fontWeight:700, cursor: cancelBusy ? 'not-allowed' : 'pointer' }}>
                  {cancelBusy ? 'Отправляем…' : 'Да, отказаться'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модалка отмены IN_PROGRESS сделки для мастера */}
        {cancelActiveOpen && (
          <div style={{ position:'fixed', inset:0, zIndex:2100, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={() => !cancelActiveBusy && setCancelActiveOpen(false)}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:420, padding:24, boxShadow:'0 20px 50px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🚫</div>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:'#111827' }}>Отказаться от сделки?</h3>
              </div>
              <div style={{ background:'rgba(239,68,68,.05)', borderRadius:10, padding:'10px 14px', marginBottom:14, border:'1px solid rgba(239,68,68,.12)' }}>
                <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.5 }}>
                  ⚠️ Сделка уже <b>в работе</b>. Заказчик получит уведомление. Это действие необратимо.
                </p>
              </div>
              <textarea
                value={cancelActiveNote}
                onChange={e => setCancelActiveNote(e.target.value)}
                placeholder="Причина отказа (необязательно)…"
                rows={3}
                style={{ width:'100%', padding:10, borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:13, resize:'vertical', boxSizing:'border-box', marginBottom:12 }}
              />
              {cancelActiveErrMsg && <div style={{ color:'#dc2626', fontSize:13, marginBottom:12 }}>{cancelActiveErrMsg}</div>}
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" disabled={cancelActiveBusy} onClick={() => setCancelActiveOpen(false)}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', fontWeight:700, fontSize:14, cursor: cancelActiveBusy ? 'not-allowed' : 'pointer' }}>
                  Не отменять
                </button>
                <button type="button" disabled={cancelActiveBusy} onClick={handleCancelActiveDeal}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontWeight:700, fontSize:14, cursor: cancelActiveBusy ? 'not-allowed' : 'pointer' }}>
                  {cancelActiveBusy ? 'Отменяем…' : 'Да, отказаться'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модалка отзыва о заказчике */}
        {reviewDeal && (
          <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={() => setReviewDeal(null)}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, padding:28 }} onClick={e => e.stopPropagation()}>
              {reviewStatus === 'done' ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                  <h3 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                  <p style={{ color:'#6b7280', margin:'0 0 20px' }}>Спасибо за вашу оценку</p>
                  <button onClick={() => setReviewDeal(null)}
                    style={{ padding:'10px 28px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                    <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Отзыв о заказчике</h2>
                    <button onClick={() => setReviewDeal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f9fafb', borderRadius:10, marginBottom:20 }}>
                    {reviewDeal.customerAvatar && reviewDeal.customerAvatar.length > 10 ? (
                      <img src={reviewDeal.customerAvatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                    ) : (
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>
                        {(reviewDeal.customerName||'З')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>
                        {[reviewDeal.customerName, reviewDeal.customerLastName].filter(Boolean).join(' ')}
                      </div>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>Заказчик</div>
                    </div>
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Оценка</div>
                    <div style={{ display:'flex', gap:8 }}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => setReviewForm(p => ({...p, rating:star}))}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:32, padding:0, opacity: star <= reviewForm.rating ? 1 : 0.25, color:'#f59e0b' }}>★</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Комментарий</div>
                    <textarea
                      value={reviewForm.text}
                      onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                      placeholder="Как прошла работа с заказчиком? Был ли пунктуален, корректен в общении, вовремя ли оплатил..."
                      style={{ width:'100%', padding:'12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, lineHeight:1.6, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box' }}
                    />
                  </div>

                  {reviewStatus === 'error' && (
                    <div style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>Не удалось отправить отзыв. Попробуйте ещё раз.</div>
                  )}

                  <button
                    onClick={handleCustomerReviewSubmit}
                    disabled={reviewStatus === 'sending' || !reviewForm.text?.trim()}
                    style={{ width:'100%', padding:'13px', background: reviewForm.text?.trim() ? '#e8410a' : '#e5e7eb', border:'none', borderRadius:8, color: reviewForm.text?.trim() ? '#fff' : '#9ca3af', fontSize:15, fontWeight:700, cursor: reviewForm.text?.trim() ? 'pointer' : 'not-allowed' }}>
                    {reviewStatus === 'sending' ? 'Отправляем...' : '⭐ Отправить отзыв'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══ LIST ══
  return (
    <div>
      <div className="page-header-bar dpage-header">
        <div className="container">
          <h1>Мои заказы</h1>
          <p>Сделки с заказчиками и ваши объявления в каталоге — всё подгружается с сервера</p>
        </div>
      </div>

      <div className="container" style={{ padding:'28px 0 60px' }}>

        {/* Заказы vs объявления (данные с бэкенда: /deals и /workers/.../listings) */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`dpage-filter-btn ${pageTab === 'orders' ? 'active' : ''}`}
            onClick={() => setPageTab('orders')}
          >
            Заказы <span>{counts.ALL}</span>
          </button>
          <button
            type="button"
            className={`dpage-filter-btn ${pageTab === 'listings' ? 'active' : ''}`}
            onClick={() => setPageTab('listings')}
          >
            Мои объявления <span>{listings.length}</span>
            {activeListings.length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 11, color: '#16a34a', fontWeight: 800 }}>(активн. {activeListings.length})</span>
            )}
          </button>
        </div>

        {pageTab === 'listings' ? (
          <div className="dpage-list">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="dp-skeleton" style={{ height: 88 }} />)
            ) : listings.length === 0 ? (
              <div className="dpage-empty">
                <span>📢</span>
                <h3>Объявлений пока нет</h3>
                <p>Разместите услугу — она появится в каталоге для заказчиков</p>
                <Link to="/my-listings" className="btn btn-primary btn-sm">Мои объявления</Link>
              </div>
            ) : (
              <>
                {activeListings.length > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', margin: '0 0 10px', letterSpacing: '.04em' }}>АКТИВНЫЕ В КАТАЛОГЕ</div>
                )}
                {activeListings.map(l => {
                  const thumb = listingThumb(l.photos?.[0]);
                  return (
                    <Link
                      key={l.id}
                      to={`/listings/${l.id}`}
                      className="dpage-card-avito"
                      style={{ borderLeft: '4px solid #7c3aed', textDecoration: 'none', color: 'inherit', marginBottom: 10 }}
                    >
                      <div className="dpage-card-avito-img">
                        {thumb ? <img src={thumb} alt="" style={{ pointerEvents: 'none' }} /> : (
                          <div className="dpage-card-avito-img-placeholder"><span>📢</span></div>
                        )}
                      </div>
                      <div className="dpage-card-avito-body">
                        <div className="dpage-card-avito-top">
                          <h3 className="dpage-card-avito-title">{l.title}</h3>
                          <span className="dp-badge" style={{ color: '#15803d', background: 'rgba(34,197,94,.12)' }}>● В каталоге</span>
                        </div>
                        {l.price != null && (
                          <div className="dpage-card-avito-price">
                            {Number(l.price).toLocaleString('ru-RU')} ₽
                            {l.priceUnit && <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}> {l.priceUnit}</span>}
                          </div>
                        )}
                        <div className="dpage-card-avito-meta">
                          {l.category && <span>🏷 {l.category}</span>}
                          {l.createdAt && <span>🕐 {timeAgo(l.createdAt)}</span>}
                        </div>
                      </div>
                      <div className="dpage-card-chevron">›</div>
                    </Link>
                  );
                })}
                {archivedListings.length > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', margin: '18px 0 10px', letterSpacing: '.04em' }}>АРХИВ (СНЯТЫ С ПУБЛИКАЦИИ)</div>
                )}
                {archivedListings.map(l => {
                  const thumb = listingThumb(l.photos?.[0]);
                  return (
                    <Link
                      key={l.id}
                      to="/my-listings"
                      className="dpage-card-avito"
                      style={{ opacity: 0.85, textDecoration: 'none', color: 'inherit', marginBottom: 10 }}
                    >
                      <div className="dpage-card-avito-img">
                        {thumb ? <img src={thumb} alt="" style={{ pointerEvents: 'none' }} /> : (
                          <div className="dpage-card-avito-img-placeholder"><span>📁</span></div>
                        )}
                      </div>
                      <div className="dpage-card-avito-body">
                        <div className="dpage-card-avito-top">
                          <h3 className="dpage-card-avito-title">{l.title}</h3>
                          <span className="dp-badge" style={{ color: '#64748b', background: '#f1f5f9' }}>Архив</span>
                        </div>
                        <div className="dpage-card-avito-meta">
                          <span>Редактировать и вернуть в каталог — в «Мои объявления»</span>
                        </div>
                      </div>
                      <div className="dpage-card-chevron">›</div>
                    </Link>
                  );
                })}
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Link to="/my-listings" style={{ fontSize: 14, fontWeight: 700, color: '#e8410a' }}>Управление объявлениями →</Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
        {/* Фильтры сделок */}
        <div className="dpage-filters">
          {[
            ['ALL',         'Все',            counts.ALL],
            ['NEW',         '🔔 Новые',        counts.NEW],
            ['IN_PROGRESS', 'В работе',        counts.IN_PROGRESS],
            ['COMPLETED',   'Завершены',       counts.COMPLETED],
          ].map(([key, label, count]) => (
            <button
              key={key}
              className={`dpage-filter-btn ${filter === key ? 'active' : ''}`}
              style={key === 'NEW' && counts.NEW > 0 ? { borderColor: '#f59e0b', color: '#92400e' } : {}}
              onClick={() => setFilter(key)}
            >
              {label} <span>{count}</span>
            </button>
          ))}

          <Link to="/find-work" style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            color: '#e8410a',
            background: 'rgba(232,65,10,.08)',
            border: '1.5px solid rgba(232,65,10,.2)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            <svg width="14" height="14" fill="none" stroke="#e8410a" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Найти работу
          </Link>
        </div>

        {/* Список сделок */}
        <div className="dpage-list">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="dp-skeleton" style={{ height:88 }} />
            ))
          ) : filtered.length === 0 ? (
            <div className="dpage-empty">
              <span>🤝</span>
              <h3>Заказов пока нет</h3>
              <p>Откликайтесь на заявки — заказы появятся здесь</p>
              {activeListings.length > 0 && (
                <p style={{ marginTop: 10, fontSize: 14, color: '#64748b', maxWidth: 420 }}>
                  У вас есть <b>{activeListings.length}</b> активн. объявлени{activeListings.length === 1 ? 'е' : 'я'} в каталоге — откройте вкладку «Мои объявления» выше.
                </p>
              )}
              <Link to="/find-work" className="btn btn-primary btn-sm">
                Найти работу
              </Link>
            </div>
          ) : (
            filtered.map(d => {
              const st = DEAL_STATUSES[d.status] || DEAL_STATUSES.NEW;
              const hasPhoto = d.photos && d.photos.length > 0;
              const isNew = d.status === 'NEW';
              return (
                <div
                  key={d.id}
                  className="dpage-card-avito"
                  style={isNew ? { borderLeft: '4px solid #f59e0b', background: '#fffdf7' } : {}}
                  onClick={() => setDealDetail(d)}
                >
                  <div className="dpage-card-avito-img">
                    {hasPhoto ? (
                      <img src={d.photos[0]} alt="" style={{ pointerEvents:'none' }} />
                    ) : (
                      <div className="dpage-card-avito-img-placeholder"><span>{isNew ? '🔔' : '🔨'}</span></div>
                    )}
                  </div>
                  <div className="dpage-card-avito-body">
                    <div className="dpage-card-avito-top">
                      <h3 className="dpage-card-avito-title">{d.title || 'Задача'}</h3>
                      <span className="dp-badge" style={{ color: st.color, background: st.bg, flexShrink:0 }}>
                        {st.emoji} {st.label}
                      </span>
                    </div>
                    {d.agreedPrice && (
                      <div className="dpage-card-avito-price">
                        {Number(d.agreedPrice).toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                    <div className="dpage-card-avito-meta">
                      {d.category && <span>🏷 {d.category}</span>}
                      <span>👤 {d.customerName || 'Заказчик'}</span>
                      <span>🕐 {timeAgo(d.createdAt)}</span>
                    </div>
                    {isNew && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>
                          ⏳ Ждёт вашего подтверждения
                        </span>
                        <button
                          type="button"
                          disabled={actionId === d.id || decliningId === d.id}
                          onClick={(e) => { e.stopPropagation(); handleStartDeal(d.id); }}
                          style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', background: '#e8410a', border: 'none', borderRadius: 6, color: '#fff', cursor: actionId === d.id ? 'not-allowed' : 'pointer', opacity: actionId === d.id ? .6 : 1 }}
                        >
                          {actionId === d.id ? '⏳…' : '✅ Принять'}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === d.id || decliningId === d.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm('Отказаться от заказа? Заказчик сможет выбрать другого мастера.')) return;
                            setDecliningId(d.id);
                            try {
                              await cancelPendingDeal(userId, d.id, '');
                              await load();
                            } catch (err) {
                              window.alert(err?.message || 'Не удалось отменить');
                            } finally {
                              setDecliningId(null);
                            }
                          }}
                          style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, color: '#b91c1c', cursor: decliningId === d.id ? 'not-allowed' : 'pointer', opacity: decliningId === d.id ? .6 : 1 }}
                        >
                          {decliningId === d.id ? '…' : 'Отказать'}
                        </button>
                      </div>
                    )}
                    {d.status === 'IN_PROGRESS' && (
                      <div className="dpage-card-progress" style={{ marginTop:8 }}>
                        <div className={`dp-prog ${d.customerConfirmed ? 'ok' : ''}`}>
                          {d.customerConfirmed ? '✅' : '⏳'} Заказчик
                        </div>
                        <span className="dp-prog-arrow">→</span>
                        <div className={`dp-prog ${d.workerConfirmed ? 'ok' : ''}`}>
                          {d.workerConfirmed ? '✅' : '⏳'} Вы
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="dpage-card-chevron">›</div>
                </div>
              );
            })
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}