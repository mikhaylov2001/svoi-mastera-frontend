import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getMyDeals, completeDeal, createCustomerReview,
  workerStartDeal, cancelPendingDeal, cancelActiveDeal,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { dealsWdCss } from '../shared/dealsWdStyles';
import { PAGE_HERO_DEFAULT_PHOTO } from '../../constants/pageHeroAssets';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { dispatchListingArchivedAfterDeal } from '../../utils/listingArchiveEvents';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import { categoryChipToneClass } from '../../utils/categoryChipTone';

const DEFAULT_BG = PAGE_HERO_DEFAULT_PHOTO;
const BACKEND    = 'https://svoi-mastera-backend-mf3h.onrender.com';

const ST = {
  NEW:         { label: 'Новый заказ',  color: '#d97706', bg: 'rgba(245,158,11,.12)',  dot: '#f59e0b' },
  IN_PROGRESS: { label: 'В работе',     color: '#2563eb', bg: 'rgba(37,99,235,.11)',   dot: '#3b82f6' },
  COMPLETED:   { label: 'Завершена',    color: '#16a34a', bg: 'rgba(34,197,94,.11)',   dot: '#22c55e' },
  CANCELLED:   { label: 'Отменена',     color: '#dc2626', bg: 'rgba(239,68,68,.1)',    dot: '#ef4444' },
};

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн. назад`;
  return new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'long' });
}

export default function WorkerDealsPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [deals,    setDeals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [detail,   setDetail]   = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [actionId, setActionId] = useState(null);
  const [declId,   setDeclId]   = useState(null);

  // Modals
  const [cancelNewOpen,  setCancelNewOpen]  = useState(false);
  const [cancelNewNote,  setCancelNewNote]  = useState('');
  const [cancelNewBusy,  setCancelNewBusy]  = useState(false);
  const [cancelNewErr,   setCancelNewErr]   = useState('');

  const [cancelActOpen,  setCancelActOpen]  = useState(false);
  const [cancelActNote,  setCancelActNote]  = useState('');
  const [cancelActBusy,  setCancelActBusy]  = useState(false);
  const [cancelActErr,   setCancelActErr]   = useState('');

  const [reviewDeal,    setReviewDeal]    = useState(null);
  const [reviewForm,    setReviewForm]    = useState({ rating: 5, text: '' });
  const [reviewStatus,  setReviewStatus]  = useState('idle');

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyDeals(userId);
      const uid = String(userId || '');
      setDeals((data || []).filter(d => String(d.workerId || '') === uid));
    } catch {
      setDeals([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useSameRouteRefetch('/deals', load);

  // open deal from URL ?dealId=...
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('dealId');
    if (id && deals.length > 0) {
      const found = deals.find(d => d.id === id);
      if (found) { setDetail(found); setPhotoIdx(0); }
    }
  }, [location.search, deals]);

  // sync detail with fresh data
  useEffect(() => {
    if (detail?.id) {
      const fresh = deals.find(d => d.id === detail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(detail)) setDetail(fresh);
    }
  }, [deals, detail]);

  /* ── actions ── */
  const handleStart = async (dealId, e) => {
    e?.stopPropagation?.();
    setActionId(dealId);
    try {
      const updated = await workerStartDeal(userId, dealId);
      if (updated?.id) {
        const uid = String(updated.id);
        setDeals(prev => prev.map(d => String(d.id) === uid ? { ...d, ...updated } : d));
        setDetail(prev => (prev && String(prev.id) === uid ? { ...prev, ...updated } : prev));
      }
      await load();
    } catch {}
    setActionId(null);
  };

  const handleComplete = async (dealId, e) => {
    e?.stopPropagation?.();
    setActionId(dealId);
    try {
      const deal = await completeDeal(userId, dealId);
      dispatchListingArchivedAfterDeal(deal);
      await load();
    } catch {}
    setActionId(null);
  };

  const handleCancelNew = async () => {
    if (!detail?.id) return;
    setCancelNewBusy(true); setCancelNewErr('');
    try {
      await cancelPendingDeal(userId, detail.id, cancelNewNote);
      setCancelNewOpen(false); setCancelNewNote('');
      await load(); setDetail(null);
    } catch (e) { setCancelNewErr(e?.message || 'Не удалось отменить'); }
    setCancelNewBusy(false);
  };

  const handleCancelActive = async () => {
    if (!detail?.id) return;
    setCancelActBusy(true); setCancelActErr('');
    try {
      await cancelActiveDeal(userId, detail.id, cancelActNote);
      setCancelActOpen(false); setCancelActNote('');
      await load(); setDetail(null);
    } catch (e) { setCancelActErr(e?.message || 'Не удалось отменить'); }
    setCancelActBusy(false);
  };

  const handleReviewSubmit = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createCustomerReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done'); await load();
    } catch { setReviewStatus('error'); }
  };

  /* ── derived ── */
  const counts = {
    ALL:         deals.length,
    NEW:         deals.filter(d => d.status === 'NEW').length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };
  const filtered       = filter === 'ALL' ? deals : deals.filter(d => d.status === filter);

  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Мастер';
  const ava = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar)
    : null;

  /* ══ DETAIL ══ */
  if (detail) {
    const st      = ST[detail.status] || ST.NEW;
    const hasPhoto = detail.photos?.length > 0;
    const myOk    = detail.workerConfirmed;
    const custOk  = detail.customerConfirmed;
    const taskDescShown = formatListingOriginDescription('WORKER', detail.description);

    return (
      <div className="wd-detail">
        <style>{dealsWdCss}</style>
        <div className="wd-detail-nav">
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
            <button
              style={{ background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:14, fontFamily:'Inter,sans-serif', padding:0 }}
              onClick={() => { setDetail(null); setPhotoIdx(0); }}
            >← Мои сделки</button>
          </div>
        </div>

        <div className="wd-detail-wrap">
          {/* LEFT */}
          <div>
            {/* Gallery */}
            <div className="wd-detail-gallery">
              <div className="wd-detail-main">
                {hasPhoto
                  ? <img src={detail.photos[photoIdx]} alt="" />
                  : <div style={{ fontSize: 64, color: '#d1d5db' }}>🔨</div>
                }
                {hasPhoto && detail.photos.length > 1 && (<>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + detail.photos.length) % detail.photos.length); }}
                    style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,.45)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>‹</button>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % detail.photos.length); }}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,.45)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>›</button>
                  <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,.52)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:999, zIndex:2 }}>
                    {photoIdx + 1} / {detail.photos.length}
                  </div>
                </>)}
              </div>
              {hasPhoto && detail.photos.length > 1 && (
                <div className="wd-detail-thumbs">
                  {detail.photos.map((p, i) => (
                    <div key={i} className={`wd-detail-thumb${i === photoIdx ? ' on' : ''}`} onClick={() => setPhotoIdx(i)}>
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {taskDescShown && (
              <div className="wd-info-card">
                <div className="wd-info-label">Описание задачи</div>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.75, margin:0 }}>{taskDescShown}</p>
              </div>
            )}

            {/* Details table */}
            <div className="wd-info-card">
              <div className="wd-info-label">Подробности</div>
              <dl style={{ margin:0 }}>
                {[
                  detail.category    && ['Категория',  detail.category],
                  detail.agreedPrice && ['Стоимость',  `${Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽`],
                  detail.createdAt   && ['Создана',    timeAgo(detail.createdAt)],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} className="wd-info-row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Cancellation reason */}
            {detail.status === 'CANCELLED' && detail.cancellationReason && (
              <div style={{ background:'rgba(239,68,68,.05)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(239,68,68,.15)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#ef4444', marginBottom:4 }}>Причина отмены</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.55 }}>{detail.cancellationReason}</div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="wd-right">
            {/* Price */}
            {detail.agreedPrice && (
              <div className="wd-price-card">
                <div className="wd-price-big">{Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽</div>
                <div className="wd-price-sub">Договорная стоимость</div>
                <div style={{ marginTop:10 }}>
                  <span className="wd-status-badge" style={{ color: st.color, background: st.bg }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background: st.dot, display:'inline-block', flexShrink:0 }} />
                    {st.label}
                  </span>
                </div>
              </div>
            )}

            {/* NEW order — accept/decline */}
            {detail.status === 'NEW' && (
              <div className="wd-action-card" style={{ border:'1.5px solid #fde68a' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 }}>Новый заказ</div>
                <p style={{ fontSize:13, color:'#78350f', margin:'0 0 14px', lineHeight:1.55, background:'#fffbeb', borderRadius:8, padding:'10px 12px' }}>
                  Заказчик выбрал вас и ждёт подтверждения. Примите заказ — он перейдёт в работу.
                </p>
                <button className="wd-btn-full-primary" disabled={actionId === detail.id} onClick={e => handleStart(detail.id, e)}>
                  {actionId === detail.id ? '⏳ Принимаем…' : '✅ Принять заказ'}
                </button>
                <button className="wd-btn-full-outline" onClick={() => navigate(`/chat/${detail.customerId}`)}>
                  Уточнить детали
                </button>
                <button className="wd-btn-full-red" onClick={() => { setCancelNewErr(''); setCancelNewNote(''); setCancelNewOpen(true); }}>
                  Отказаться от заказа
                </button>
                <p style={{ margin:0, fontSize:11, color:'#78716c', lineHeight:1.45, textAlign:'center' }}>
                  Можно отказаться до принятия — заказчик выберет другого мастера
                </p>
              </div>
            )}

            {/* IN_PROGRESS — confirm */}
            {detail.status === 'IN_PROGRESS' && (
              <div className="wd-action-card">
                <div className="wd-action-label">Подтверждение выполнения</div>
                <div className={`wd-confirm-row${detail.customerConfirmed ? ' ok' : ' wait'}`}>
                  <span style={{ fontSize:16 }}>{custOk ? '✅' : '⏳'}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Заказчик</div>
                    <div style={{ fontSize:11, color: custOk ? '#22c55e' : '#9ca3af' }}>{custOk ? 'Подтвердил выполнение' : 'Ожидание подтверждения'}</div>
                  </div>
                </div>
                <div className={`wd-confirm-row${myOk ? ' ok' : ' wait'}`} style={{ marginTop:6 }}>
                  <span style={{ fontSize:16 }}>{myOk ? '✅' : '⏳'}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Вы (мастер)</div>
                    <div style={{ fontSize:11, color: myOk ? '#22c55e' : '#9ca3af' }}>{myOk ? 'Подтвердили выполнение' : 'Ожидание вашего подтверждения'}</div>
                  </div>
                </div>
                {!myOk ? (
                  <button className="wd-btn-full-green" style={{ marginTop:10 }} disabled={actionId === detail.id} onClick={e => handleComplete(detail.id, e)}>
                    {actionId === detail.id ? 'Подтверждаем…' : 'Подтвердить выполнение'}
                  </button>
                ) : (
                  <div style={{ marginTop:10, textAlign:'center', fontSize:13, color:'#16a34a', fontWeight:700, padding:'10px', background:'rgba(34,197,94,.07)', borderRadius:8 }}>
                    ✓ Вы подтвердили{!custOk && ' — ожидаем заказчика…'}
                  </div>
                )}
                <div style={{ marginTop:10, borderTop:'1px solid #f3f4f6', paddingTop:10 }}>
                  <button className="wd-btn-full-red" onClick={() => { setCancelActErr(''); setCancelActOpen(true); }}>
                    Отказаться от сделки
                  </button>
                  <p style={{ margin:'5px 0 0', fontSize:11, color:'#a8a29e', textAlign:'center', lineHeight:1.4 }}>После завершения сделки отмена невозможна</p>
                </div>
              </div>
            )}

            {/* COMPLETED */}
            {detail.status === 'COMPLETED' && (
              <div className="wd-action-card" style={{ background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:4 }}>🏆</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 }}>Работа завершена!</div>
                <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Обе стороны подтвердили выполнение</div>
                {!detail.hasWorkerReview && detail.customerId && dealEligibleForReviews(detail) ? (
                  <button
                    onClick={() => { setReviewForm({ rating: 5, text: '' }); setReviewStatus('idle'); setReviewDeal(detail); }}
                    style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(99,102,241,.28)' }}
                  >⭐ Оставить отзыв о заказчике</button>
                ) : detail.hasWorkerReview ? (
                  <div style={{ fontSize:13, color:'#16a34a', fontWeight:600, background:'rgba(34,197,94,.08)', borderRadius:8, padding:'8px 12px' }}>✓ Вы оставили отзыв</div>
                ) : null}
              </div>
            )}

            {/* CANCELLED */}
            {detail.status === 'CANCELLED' && (
              <div className="wd-action-card" style={{ background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.15)', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:4 }}>❌</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#ef4444', marginBottom:4 }}>Сделка отменена</div>
                {detail.cancellationReason && <div style={{ fontSize:12, color:'#9ca3af' }}>{detail.cancellationReason}</div>}
              </div>
            )}

            {/* Customer card */}
            <div className="wd-customer-card">
              <div className="wd-info-label">Заказчик</div>
              <div className="wd-customer-row" onClick={() => detail.customerId && navigate(`/customers/${detail.customerId}`)}>
                {detail.customerAvatar && detail.customerAvatar.length > 10 && detail.customerAvatar !== 'null'
                  ? <img src={detail.customerAvatar} alt="" className="wd-customer-avatar" />
                  : <div className="wd-customer-fallback">{(detail.customerName||'З')[0].toUpperCase()}</div>
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                    {[detail.customerName, detail.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                  </div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: detail.status === 'NEW' || detail.status === 'IN_PROGRESS' ? '#22c55e' : '#64748b',
                  }}>
                    {detail.status === 'NEW' || detail.status === 'IN_PROGRESS' ? '● Активный заказчик' : '● Заказчик'}
                  </div>
                </div>
                <div style={{ color:'#d1d5db', fontSize:20 }}>›</div>
              </div>
              <button
                onClick={() => navigate(`/chat/${detail.customerId}`)}
                className="wd-btn-full-outline"
                style={{ marginTop:12 }}
              >Написать заказчику</button>
            </div>

            {/* My profile */}
            <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px' }}>
              <div className="wd-info-label">Ваш профиль</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => navigate('/worker-profile')}>
                {ava
                  ? <img src={ava} alt="" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }} />
                  : <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15, flexShrink:0 }}>
                      {(userName||'М')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{fullName}</div>
                  <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Мастер</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: cancel NEW */}
        {cancelNewOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelNewBusy && setCancelNewOpen(false)}>
            <div className="wd-modal" onClick={e => e.stopPropagation()}>
              <h3 className="wd-modal-title">Отказаться от заказа?</h3>
              <p className="wd-modal-sub">Заказчик увидит, что вы отказались. Можно указать причину — это необязательно.</p>
              <textarea className="wd-modal-textarea" rows={3} value={cancelNewNote} onChange={e => setCancelNewNote(e.target.value)} placeholder="Например: занят, не мой профиль работ…" />
              {cancelNewErr && <div className="wd-modal-error">{cancelNewErr}</div>}
              <div className="wd-modal-btns">
                <button className="wd-modal-cancel" disabled={cancelNewBusy} onClick={() => setCancelNewOpen(false)}>Назад</button>
                <button className="wd-modal-confirm" disabled={cancelNewBusy} onClick={handleCancelNew}>{cancelNewBusy ? 'Отправляем…' : 'Да, отказаться'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: cancel IN_PROGRESS */}
        {cancelActOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelActBusy && setCancelActOpen(false)}>
            <div className="wd-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚫</div>
                <h3 className="wd-modal-title" style={{ margin:0 }}>Отказаться от сделки?</h3>
              </div>
              <div className="wd-modal-warn">⚠️ Сделка уже <b>в работе</b>. Заказчик получит уведомление. Это действие необратимо.</div>
              <textarea className="wd-modal-textarea" rows={3} value={cancelActNote} onChange={e => setCancelActNote(e.target.value)} placeholder="Причина отказа (необязательно)…" />
              {cancelActErr && <div className="wd-modal-error">{cancelActErr}</div>}
              <div className="wd-modal-btns">
                <button className="wd-modal-cancel" disabled={cancelActBusy} onClick={() => setCancelActOpen(false)}>Не отменять</button>
                <button className="wd-modal-confirm" disabled={cancelActBusy} onClick={handleCancelActive}>{cancelActBusy ? 'Отменяем…' : 'Да, отказаться'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: review */}
        {reviewDeal && (
          <div className="wd-modal-bg" onClick={() => setReviewDeal(null)}>
            <div className="wd-modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
              {reviewStatus === 'done' ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                  <h3 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                  <p style={{ color:'#6b7280', margin:'0 0 20px' }}>Спасибо за вашу оценку</p>
                  <button onClick={() => setReviewDeal(null)} style={{ padding:'10px 28px', background:'#e8410a', border:'none', borderRadius:9, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                    <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Отзыв о заказчике</h2>
                    <button onClick={() => setReviewDeal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#f9fafb', borderRadius:10, marginBottom:18 }}>
                    {reviewDeal.customerAvatar && reviewDeal.customerAvatar.length > 10
                      ? <img src={reviewDeal.customerAvatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                      : <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>{(reviewDeal.customerName||'З')[0].toUpperCase()}</div>
                    }
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{[reviewDeal.customerName, reviewDeal.customerLastName].filter(Boolean).join(' ')}</div>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>Заказчик</div>
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Оценка</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setReviewForm(p => ({...p, rating:s}))}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:32, padding:0, opacity: s <= reviewForm.rating ? 1 : 0.22, color:'#f59e0b' }}>★</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Комментарий</div>
                    <textarea
                      value={reviewForm.text}
                      onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                      placeholder="Как прошла работа с заказчиком? Был ли пунктуален, корректен в общении, вовремя ли оплатил..."
                      className="wd-modal-textarea"
                      rows={4}
                    />
                  </div>
                  {reviewStatus === 'error' && <div className="wd-modal-error">Не удалось отправить отзыв. Попробуйте ещё раз.</div>}
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewStatus === 'sending' || !reviewForm.text?.trim()}
                    style={{ width:'100%', padding:'13px', background: reviewForm.text?.trim() ? '#e8410a' : '#e5e7eb', border:'none', borderRadius:9, color: reviewForm.text?.trim() ? '#fff' : '#9ca3af', fontSize:15, fontWeight:700, cursor: reviewForm.text?.trim() ? 'pointer' : 'not-allowed', transition:'background .15s' }}
                  >{reviewStatus === 'sending' ? 'Отправляем...' : 'Отправить отзыв'}</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══ LIST ══ */
  return (
    <div className="wd-page">
      <style>{dealsWdCss}</style>

      {/* Hero */}
      <div className="wd-hero">
        <img src={DEFAULT_BG} alt="" className="wd-hero-img" />
        <div className="wd-hero-overlay" />
        <div className="wd-hero-body">
          <div>
            <h1 className="wd-h1">Мои сделки</h1>
            <p className="wd-hsub">Заказы от клиентов — принимайте и управляйте</p>
          </div>
          <Link to="/find-work" className="wd-find-btn">Найти работу</Link>
        </div>
      </div>

      <div className="wd-wrap" style={{ paddingTop: 20 }}>

        {/* ══ DEALS ══ */}
          <div className="wd-filters">
            {[
              ['ALL',         'Все',       counts.ALL],
              ['NEW',         'Новые',     counts.NEW],
              ['IN_PROGRESS', 'В работе',  counts.IN_PROGRESS],
              ['COMPLETED',   'Завершены', counts.COMPLETED],
            ].map(([key, label, cnt]) => (
              <button
                key={key}
                type="button"
                className={`wd-filter${filter === key ? ' on' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="wd-filter-n">{cnt}</span>
              </button>
            ))}
          </div>

          <div className="wd-list">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="wd-card" style={{ cursor:'default', pointerEvents:'none' }}>
                  <div className="wd-card-img"><div className="wd-sk" style={{ width:'100%', height:'100%', borderRadius:0 }} /></div>
                  <div className="wd-card-body" style={{ display:'flex', flexDirection:'column', gap:8, justifyContent:'center' }}>
                    <div className="wd-sk" style={{ height:14, width:'55%' }} />
                    <div className="wd-sk" style={{ height:20, width:'30%' }} />
                    <div className="wd-sk" style={{ height:12, width:'42%' }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="wd-empty">
                <div style={{ fontSize:52, marginBottom:16 }}>{filter === 'COMPLETED' ? '✅' : '🤝'}</div>
                {filter === 'COMPLETED' ? (
                  <>
                    <h3 style={{ fontSize:17, fontWeight:700, color:'#1a1a1a', margin:'0 0 8px' }}>Нет завершённых сделок</h3>
                    <p style={{ fontSize:14, margin:'0 0 20px', color:'#64748b', maxWidth:440 }}>
                      Завершённые заказы появятся здесь после подтверждения вами и заказчиком.
                    </p>
                    <button
                      type="button"
                      className="wd-find-btn"
                      style={{ display:'inline-block', border:'none', cursor:'pointer', fontFamily:'inherit' }}
                      onClick={() => setFilter('ALL')}
                    >
                      Все сделки
                    </button>
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize:17, fontWeight:700, color:'#1a1a1a', margin:'0 0 8px' }}>Заказов пока нет</h3>
                    <p style={{ fontSize:14, margin:'0 0 20px' }}>Откликайтесь на заявки — заказы появятся здесь</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', alignItems:'center' }}>
                      <Link to="/find-work" className="wd-find-btn" style={{ display:'inline-block' }}>Найти работу</Link>
                      <Link
                        to="/my-listings"
                        className="wd-btn-outline"
                        style={{ width:'auto', padding:'11px 20px', display:'inline-block', textDecoration:'none' }}
                      >
                        Мои объявления
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ) : (
              filtered.map(d => {
                const st     = ST[d.status] || ST.NEW;
                const img    = d.photos?.[0];
                const isNew  = d.status === 'NEW';
                const isProg = d.status === 'IN_PROGRESS';
                const isDone = d.status === 'COMPLETED';
                const cardCls = isNew ? ' new' : isProg ? ' prog' : isDone ? ' done' : '';
                return (
                  <div
                    key={d.id}
                    className={`wd-card${cardCls}`}
                    onClick={() => { setDetail(d); setPhotoIdx(0); }}
                  >
                    {/* Photo */}
                    <div className="wd-card-img">
                      {img
                        ? <img src={img} alt="" />
                        : <div className="wd-card-img-ph">{isNew ? '🔔' : isProg ? '⚙️' : isDone ? '✅' : '🔨'}</div>
                      }
                    </div>

                    {/* Body */}
                    <div className="wd-card-body">
                      <div className="wd-card-title">{d.title || 'Задача'}</div>
                      {d.agreedPrice && (
                        <div className="wd-card-price">{Number(d.agreedPrice).toLocaleString('ru-RU')} ₽</div>
                      )}
                      {d.category && <span className={`wd-card-cat ${categoryChipToneClass(d.category)}`}>{d.category}</span>}
                      <div className="wd-card-meta">
                        <span>{d.customerName || 'Заказчик'}</span>
                        <span>{timeAgo(d.createdAt)}</span>
                      </div>
                      <div className="wd-card-stats">
                        <span className="wd-status-badge" style={{ color: st.color, background: st.bg }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background: st.dot, display:'inline-block', flexShrink:0 }} />
                          {st.label}
                        </span>
                        {isProg && (
                          <div className="wd-prog-row" style={{ marginLeft:'auto' }}>
                            <span className="wd-prog-dot" style={{ background: d.customerConfirmed ? '#22c55e' : '#d1d5db' }} />
                            <span style={{ color: d.customerConfirmed ? '#16a34a' : '#9ca3af' }}>Заказчик</span>
                            <span style={{ color:'#d1d5db', margin:'0 2px' }}>·</span>
                            <span className="wd-prog-dot" style={{ background: d.workerConfirmed ? '#22c55e' : '#d1d5db' }} />
                            <span style={{ color: d.workerConfirmed ? '#16a34a' : '#9ca3af' }}>Вы</span>
                          </div>
                        )}
                        {isNew && (
                          <span style={{ fontSize:11, fontWeight:700, color:'#92400e', background:'#fef3c7', borderRadius:6, padding:'2px 8px', marginLeft:'auto' }}>
                            ⏳ Ждёт подтверждения
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="wd-card-actions" onClick={e => e.stopPropagation()}>
                      {isNew && (<>
                        <button
                          type="button"
                          className="wd-btn-primary"
                          disabled={actionId === d.id}
                          onClick={e => handleStart(d.id, e)}
                        >
                          {actionId === d.id ? '⏳…' : '✅ Принять'}
                        </button>
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => navigate(`/chat/${d.customerId}`)}
                        >Написать</button>
                        <div className="wd-actions-divider" />
                        <button
                          type="button"
                          className="wd-btn-danger"
                          disabled={declId === d.id}
                          onClick={async e => {
                            e.stopPropagation();
                            if (!window.confirm('Отказаться от заказа? Заказчик сможет выбрать другого мастера.')) return;
                            setDeclId(d.id);
                            try { await cancelPendingDeal(userId, d.id, ''); await load(); } catch (err) { window.alert(err?.message || 'Не удалось'); } finally { setDeclId(null); }
                          }}
                        >{declId === d.id ? '…' : 'Отказать'}</button>
                      </>)}
                      {isProg && (<>
                        {!d.workerConfirmed ? (
                          <button
                            type="button"
                            className="wd-btn-green"
                            disabled={actionId === d.id}
                            onClick={e => handleComplete(d.id, e)}
                          >{actionId === d.id ? '⏳…' : '✅ Подтвердить'}</button>
                        ) : (
                          <div className="wd-done-label">✓ Вы подтвердили</div>
                        )}
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => navigate(`/chat/${d.customerId}`)}
                        >Написать</button>
                      </>)}
                      {isDone && (<>
                        {!d.hasWorkerReview && d.customerId && dealEligibleForReviews(d) && (
                          <button
                            type="button"
                            className="wd-btn-primary"
                            onClick={e => { e.stopPropagation(); setReviewForm({ rating:5, text:'' }); setReviewStatus('idle'); setReviewDeal(d); }}
                          >⭐ Отзыв</button>
                        )}
                        {d.hasWorkerReview && <div className="wd-done-label">✓ Отзыв оставлен</div>}
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => navigate(`/chat/${d.customerId}`)}
                        >Написать</button>
                      </>)}
                      {d.status === 'CANCELLED' && (
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => { setDetail(d); setPhotoIdx(0); }}
                        >Подробнее</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

      </div>
    </div>
  );
}
