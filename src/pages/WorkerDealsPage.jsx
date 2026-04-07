import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getMyDeals, completeDeal } from '../api';
import { useAuth } from '../context/AuthContext';
import './DealsPage.css'; // используем те же стили что у клиента

const DEAL_STATUSES = {
  NEW:         { label: 'Новая',     emoji: '📋', color: '#6366f1', bg: 'rgba(99,102,241,.12)'  },
  IN_PROGRESS: { label: 'В работе',  emoji: '⚙️',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  COMPLETED:   { label: 'Завершена', emoji: '✅',  color: '#22c55e', bg: 'rgba(34,197,94,.12)'   },
  CANCELLED:   { label: 'Отменена',  emoji: '❌',  color: '#ef4444', bg: 'rgba(239,68,68,.12)'   },
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

export default function WorkerDealsPage() {
  const { userId } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [deals,   setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [dealDetail, setDealDetail] = useState(null);
  const [actionId,   setActionId]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyDeals(userId);
      // Только сделки где мы — мастер
      setDeals((data || []).filter(d => d.workerId === userId));
    } catch {}
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

  const counts = {
    ALL:         deals.length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

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
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16, flexShrink:0 }}>
                    {(dealDetail.customerName||'З')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{dealDetail.customerName || 'Заказчик'}</div>
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

              {/* Подтверждение */}
              {dealDetail.status === 'IN_PROGRESS' && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
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
                      ✓ Вы подтвердили{!otherOk && ' — ожидаем заказчика…'}
                    </div>
                  )}
                </div>
              )}

              {dealDetail.status === 'COMPLETED' && (
                <div style={{ background:'rgba(34,197,94,.07)', borderRadius:12, padding:'16px 20px', border:'1px solid rgba(34,197,94,.2)', textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>🏆</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 }}>Работа завершена!</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>Обе стороны подтвердили выполнение</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ LIST ══
  return (
    <div>
      <div className="page-header-bar dpage-header">
        <div className="container">
          <h1>Мои заказы</h1>
          <p>Активные сделки и завершённые работы</p>
        </div>
      </div>

      <div className="container" style={{ padding:'28px 0 60px' }}>

        {/* Фильтры */}
        <div className="dpage-filters">
          {[
            ['ALL',         'Все',       counts.ALL],
            ['IN_PROGRESS', 'В работе',  counts.IN_PROGRESS],
            ['COMPLETED',   'Завершены', counts.COMPLETED],
          ].map(([key, label, count]) => (
            <button
              key={key}
              className={`dpage-filter-btn ${filter === key ? 'active' : ''}`}
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

        {/* Список */}
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
              <Link to="/find-work" className="btn btn-primary btn-sm">
                Найти работу
              </Link>
            </div>
          ) : (
            filtered.map(d => {
              const st = DEAL_STATUSES[d.status] || DEAL_STATUSES.NEW;
              const hasPhoto = d.photos && d.photos.length > 0;
              return (
                <div key={d.id} className="dpage-card-avito" onClick={() => setDealDetail(d)}>
                  <div className="dpage-card-avito-img">
                    {hasPhoto ? (
                      <img src={d.photos[0]} alt="" style={{ pointerEvents:'none' }} />
                    ) : (
                      <div className="dpage-card-avito-img-placeholder"><span>🔨</span></div>
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
      </div>
    </div>
  );
}