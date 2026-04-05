import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer, getCategories } from '../api';
import './FindWorkPage.css';

const CATEGORY_STYLES = {
  'remont-kvartir':       { emoji: '🏠', color: '#fff3e0' },
  'santehnika':           { emoji: '🔧', color: '#e3f2fd' },
  'elektrika':            { emoji: '⚡', color: '#fffde7' },
  'uborka':               { emoji: '🧹', color: '#fce4ec' },
  'parikhmaher':          { emoji: '💇', color: '#fce4ec' },
  'manikur':              { emoji: '💅', color: '#fce4ec' },
  'krasota-i-zdorovie':   { emoji: '✨', color: '#f3e5f5' },
  'repetitorstvo':        { emoji: '📚', color: '#e3f2fd' },
  'kompyuternaya-pomosh': { emoji: '💻', color: '#e8f5e9' },
};

function pluralRequests(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} заявка`;
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} заявки`;
  return `${n} заявок`;
}

// ═══ Модалка вынесена за пределы основного компонента ═══
// Это критично — иначе при каждом вводе компонент пересоздаётся
function OfferModal({ request, offerForm, setOfferForm, onClose, onSubmit, submitting }) {
  if (!request) return null;

  return (
    <div className="fw-modal-overlay" onClick={onClose}>
      <div className="fw-modal" onClick={e => e.stopPropagation()}>

        <div className="fw-modal-header">
          <h3 className="fw-modal-title">📩 Отклик на заявку</h3>
          <p className="fw-modal-subtitle">{request.title}</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="fw-modal-body">

            <div className="fw-modal-field">
              <label className="fw-modal-label">Ваша цена, ₽ *</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 5000"
                value={offerForm.price}
                onChange={e => setOfferForm(prev => ({ ...prev, price: e.target.value }))}
                required
                min="1"
                autoFocus
              />
              {request.budgetTo && (
                <span className="fw-modal-hint">
                  Бюджет заказчика: до {Number(request.budgetTo).toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>

            <div className="fw-modal-field">
              <label className="fw-modal-label">Срок выполнения (дней)</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 3"
                value={offerForm.estimatedDays}
                onChange={e => setOfferForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                min="1"
              />
            </div>

            <div className="fw-modal-field">
              <label className="fw-modal-label">Комментарий</label>
              <textarea
                className="fw-modal-input fw-modal-textarea"
                placeholder="Опишите как вы выполните работу, ваш опыт..."
                value={offerForm.comment}
                onChange={e => setOfferForm(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>

          </div>

          <div className="fw-modal-footer">
            <button type="button" className="fw-modal-cancel" onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              className="fw-modal-submit"
              disabled={submitting || !offerForm.price}
            >
              {submitting ? 'Отправка...' : '📩 Отправить отклик'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// ═══ Карточка заказчика ═══
function CustomerCard({ req }) {
  if (!req.customerName && !req.customerId) return null;
  const initial = (req.customerName || 'А')[0].toUpperCase();

  return (
    <div style={{ marginBottom:16 }}>
      <div className="dp-side-title" style={{ marginBottom:10 }}>Заказчик</div>

      {/* Карточка — кликабельна, ведёт на профиль */}
      <a
        href={req.customerId ? `/customers/${req.customerId}?name=${encodeURIComponent(req.customerName || '')}` : undefined}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', background:'#f9fafb', borderRadius:14, border:'1.5px solid #e5e7eb', textDecoration:'none', transition:'all .15s', marginBottom:8 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.background='rgba(99,102,241,.04)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.background='#f9fafb'; }}
      >
        <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18, flexShrink:0 }}>
          {initial}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{req.customerName || 'Заказчик'}</div>
          <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Активный заказчик</div>
        </div>
        {req.customerId && <div style={{ fontSize:18, color:'#9ca3af' }}>›</div>}
      </a>

      {/* Кнопка написать */}
      {req.customerId && (
        <a href={`/chat/${req.customerId}?jobRequestId=${req.id}`}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px', borderRadius:10, background:'rgba(14,165,233,.06)', border:'1.5px solid rgba(14,165,233,.2)', color:'#0ea5e9', fontWeight:700, fontSize:13, textDecoration:'none', transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(14,165,233,.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(14,165,233,.06)'; }}
        >
          💬 Написать заказчику
        </a>
      )}
    </div>
  );
}

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests]                 = useState([]);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRequest,  setSelectedRequest]  = useState(null);
  const [activePhotoIdx,   setActivePhotoIdx]   = useState(0);
  const [showOfferModal, setShowOfferModal]     = useState(null);
  const [offerForm, setOfferForm]               = useState({ price: '', comment: '', estimatedDays: '' });
  const [submitting, setSubmitting]             = useState(false);
  const [lightbox,   setLightbox]               = useState(null); // { photos, index }

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

  useEffect(() => { loadData(); }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, reqs] = await Promise.all([
        getCategories(),
        getOpenJobRequestsForWorker(userId),
      ]);
      setCategories(cats || []);
      setRequests(reqs || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRequestsForCategory = (cat) =>
    requests.filter(r => r.categoryId === cat.id);

  const handleOpenOfferModal = (request) => {
    setShowOfferModal(request);
    setOfferForm({ price: '', comment: '', estimatedDays: '' });
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(null);
    setOfferForm({ price: '', comment: '', estimatedDays: '' });
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.price) { showToast('Укажите цену', 'error'); return; }
    setSubmitting(true);
    try {
      await createJobOffer(userId, showOfferModal.id, {
        price:         Number(offerForm.price),
        message:       offerForm.comment || 'Готов выполнить работу',
        estimatedDays: offerForm.estimatedDays ? Number(offerForm.estimatedDays) : null,
      });
      showToast('Отклик отправлен!', 'success');
      handleCloseOfferModal();
      loadData();
    } catch (err) {
      console.error('Failed to create offer:', err);
      showToast('Не удалось отправить отклик', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══ ЭКРАН 3: детальная заявка (стиль Авито) ═══
  if (selectedRequest) {
    const req = selectedRequest;
    const hasPhoto = req.photos && req.photos.length > 0;
    const catStyle = CATEGORY_STYLES[selectedCategory?.slug] || { emoji: '📋', color: '#f3f4f6' };
    const budget = req.budgetTo
      ? `до ${Number(req.budgetTo).toLocaleString('ru-RU')} ₽`
      : req.budgetFrom
      ? `от ${Number(req.budgetFrom).toLocaleString('ru-RU')} ₽`
      : 'Договорная';

    return (
      <>
      <div style={{ background:'#f5f5f5', minHeight:'100vh' }}>

        {/* Хлебная крошка */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'10px 0' }}>
          <div className="container">
            <button className="cats-back-link" onClick={() => { setSelectedRequest(null); setActivePhotoIdx(0); }}>
              ← Назад к заявкам
            </button>
          </div>
        </div>

        <div className="container" style={{ paddingTop:20, paddingBottom:60 }}>

          {/* Заголовок */}
          <div style={{ marginBottom:16 }}>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#111827', margin:'0 0 6px' }}>{req.title}</h1>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', fontSize:13, color:'#9ca3af' }}>
              {selectedCategory && <span>🏷 {selectedCategory.name}</span>}
              {req.addressText && <span>📍 {req.addressText}</span>}
              {req.createdAt && <span>📅 {new Date(req.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</span>}
            </div>
          </div>

          {/* Основная сетка */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'flex-start' }}>

            {/* Левая колонка */}
            <div>
              {/* Фото */}
              <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                {hasPhoto ? (
                  <>
                    <div style={{ position:'relative', width:'100%', aspectRatio:'4/3', overflow:'hidden', cursor:'pointer', background:'#f3f4f6' }}
                      onClick={() => setLightbox({ photos: req.photos, index: activePhotoIdx })}
                    >
                      <img src={req.photos[activePhotoIdx]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                      {req.photos.length > 1 && (
                        <>
                          <button onClick={e => { e.stopPropagation(); setActivePhotoIdx(i => i > 0 ? i-1 : req.photos.length-1); }}
                            style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.85)', border:'none', color:'#111827', fontSize:22, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>‹</button>
                          <button onClick={e => { e.stopPropagation(); setActivePhotoIdx(i => i < req.photos.length-1 ? i+1 : 0); }}
                            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.85)', border:'none', color:'#111827', fontSize:22, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>›</button>
                        </>
                      )}
                    </div>
                    {req.photos.length > 1 && (
                      <div style={{ display:'flex', gap:6, padding:'10px 12px', overflowX:'auto', background:'#fafafa', borderTop:'1px solid #f0f0f0' }}>
                        {req.photos.map((p, i) => (
                          <div key={i} onClick={() => setActivePhotoIdx(i)}
                            style={{ width:80, height:60, flexShrink:0, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i === activePhotoIdx ? '2px solid #e8410a' : '2px solid transparent', opacity: i === activePhotoIdx ? 1 : 0.65, transition:'all .15s' }}>
                            <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ aspectRatio:'4/3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64, color:'#d1d5db', background:'#f9fafb' }}>
                    {catStyle.emoji}
                  </div>
                )}
              </div>

              {/* Описание */}
              {req.description && req.description !== 'Без описания' && (
                <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', marginBottom:16 }}>
                  <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 12px' }}>Описание</h2>
                  <p style={{ fontSize:15, color:'#374151', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{req.description}</p>
                </div>
              )}

              {/* Подробности */}
              <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', marginBottom:16 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 16px' }}>Подробности</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {[
                    selectedCategory && ['Категория', selectedCategory.name],
                    req.addressText  && ['Адрес',     req.addressText],
                    req.budgetTo     && ['Бюджет',    `до ${Number(req.budgetTo).toLocaleString('ru-RU')} ₽`],
                    req.createdAt    && ['Опубликована', new Date(req.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #f3f4f6', fontSize:14 }}>
                      <span style={{ color:'#9ca3af', fontWeight:500 }}>{label}</span>
                      <span style={{ color:'#111827', fontWeight:600, textAlign:'right', maxWidth:'60%' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Правая колонка — sticky */}
            <div style={{ position:'sticky', top:72, display:'flex', flexDirection:'column', gap:12 }}>

              {/* Цена и кнопки */}
              <div style={{ background:'#fff', borderRadius:12, padding:'20px' }}>
                <div style={{ fontSize:28, fontWeight:900, color:'#111827', marginBottom:16 }}>
                  {budget}
                </div>

                <button
                  onClick={() => handleOpenOfferModal(req)}
                  style={{ width:'100%', padding:'14px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:10, transition:'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#c73208'}
                  onMouseLeave={e => e.currentTarget.style.background='#e8410a'}
                >
                  📩 Откликнуться
                </button>

                {req.customerId && (
                  <a href={`/chat/${req.customerId}?jobRequestId=${req.id}`}
                    style={{ display:'block', width:'100%', padding:'13px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, color:'#374151', fontSize:15, fontWeight:600, textAlign:'center', textDecoration:'none', transition:'all .15s', boxSizing:'border-box' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#374151'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; }}
                  >
                    💬 Написать сообщение
                  </a>
                )}
              </div>

              {/* Карточка заказчика */}
              {(req.customerName || req.customerId) && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:13, color:'#9ca3af', fontWeight:600, marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>Заказчик</div>
                  <a href={req.customerId ? `/customers/${req.customerId}?name=${encodeURIComponent(req.customerName||'')}` : undefined}
                    style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
                    {req.customerAvatar ? (
                      <img src={req.customerAvatar} alt="" style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }} />
                    ) : (
                      <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18, flexShrink:0 }}>
                        {(req.customerName||'А')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>
                        {[req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                      </div>
                      <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Активный заказчик</div>
                    </div>
                    <div style={{ color:'#9ca3af', fontSize:18 }}>›</div>
                  </a>
                </div>
              )}

              {/* Инфо */}
              <div style={{ background:'#fff', borderRadius:12, padding:'14px 20px' }}>
                <div style={{ fontSize:12, color:'#9ca3af', lineHeight:1.6 }}>
                  ✅ Безопасная сделка — оплата только после выполнения работы
                </div>
              </div>
            </div>
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
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:22, cursor:'pointer' }}>×</button>
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

      <OfferModal
        request={showOfferModal}
        offerForm={offerForm}
        setOfferForm={setOfferForm}
        onClose={handleCloseOfferModal}
        onSubmit={handleSubmitOffer}
        submitting={submitting}
      />
      </>
    );
  }

  // ═══ ЭКРАН 2: заявки внутри категории ═══
  if (selectedCategory) {
    const style = CATEGORY_STYLES[selectedCategory.slug] || { emoji: '📋', color: '#f3f4f6' };
    const catRequests = getRequestsForCategory(selectedCategory);

    return (
      <div>
        <div className="page-header-bar">
          <div className="container">
            <button className="cats-back-link" onClick={() => setSelectedCategory(null)}>
              ← Все категории
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
              <div className="cat-page-icon" style={{ background: style.color }}>
                {style.emoji}
              </div>
              <div>
                <h1>{selectedCategory.name}</h1>
                <p>{pluralRequests(catRequests.length)} от заказчиков</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {catRequests.length === 0 ? (
            <div className="fw-empty">
              <span>📋</span>
              <p>Заявок в этой категории пока нет</p>
            </div>
          ) : (
            <div className="fw-requests-grid">
              {catRequests.map((req, idx) => {
                const hasPhoto = req.photos && req.photos.length > 0;
                return (
                  <div
                    key={req.id}
                    className="fw-request-card fade-up"
                    style={{ animationDelay: `${idx * 0.05}s`, padding:0, overflow:'hidden', display:'flex', flexDirection:'column', cursor:'pointer' }}
                    onClick={() => { setSelectedRequest(req); setActivePhotoIdx(0); }}
                  >
                    {/* Фото */}
                    {hasPhoto && (
                      <div style={{ position:'relative', width:'100%', aspectRatio:'16/9', overflow:'hidden', background:'#f3f4f6', cursor:'pointer' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <img src={req.photos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                        {req.photos.length > 1 && (
                          <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999, backdropFilter:'blur(4px)' }}>
                            📷 {req.photos.length}
                          </div>
                        )}
                        {/* Миниатюры */}
                        <div style={{ position:'absolute', bottom:8, left:8, display:'flex', gap:4 }}>
                          {req.photos.slice(0,4).map((p, i) => i > 0 && (
                            <div key={i}
                              onClick={e => { e.stopPropagation(); setLightbox({ photos: req.photos, index: i }); }}
                              style={{ width:36, height:28, borderRadius:4, overflow:'hidden', border:'1.5px solid rgba(255,255,255,0.7)', cursor:'pointer' }}
                            >
                              <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Контент */}
                    <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                      <div className="fw-request-top">
                        <span className="fw-request-budget">
                          {req.budgetTo
                            ? `до ${Number(req.budgetTo).toLocaleString('ru-RU')} ₽`
                            : req.budgetFrom
                            ? `от ${Number(req.budgetFrom).toLocaleString('ru-RU')} ₽`
                            : 'Договорная'}
                        </span>
                        <span className="fw-request-date">
                          {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>

                      <h3 className="fw-request-title" style={{ margin:0 }}>{req.title}</h3>

                      {req.description && req.description !== 'Без описания' && (
                        <p className="fw-request-desc" style={{ margin:0 }}>{req.description}</p>
                      )}

                      <div className="fw-request-meta">
                        {req.addressText && <span>📍 {req.addressText}</span>}
                        {req.city && !req.addressText && <span>🏙️ {req.city}</span>}
                        {req.scheduledAt && (
                          <span>📅 {new Date(req.scheduledAt).toLocaleDateString('ru-RU')}</span>
                        )}
                      </div>

                      <button
                        className="btn btn-primary btn-full"
                        style={{ marginTop:'auto' }}
                        onClick={e => { e.stopPropagation(); handleOpenOfferModal(req); }}
                      >
                        📩 Откликнуться
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <OfferModal
          request={showOfferModal}
          offerForm={offerForm}
          setOfferForm={setOfferForm}
          onClose={handleCloseOfferModal}
          onSubmit={handleSubmitOffer}
          submitting={submitting}
        />

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLightbox(null)}
        >
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'block', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:13, fontWeight:700, padding:'4px 10px', borderRadius:999 }}>
              {lightbox.index + 1} / {lightbox.photos.length}
            </div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            {lightbox.photos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index > 0 ? l.index - 1 : l.photos.length - 1})); }} style={{ position:'absolute', left:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index < l.photos.length - 1 ? l.index + 1 : 0})); }} style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>›</button>
              </>
            )}
          </div>
          {lightbox.photos.length > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:14 }} onClick={e => e.stopPropagation()}>
              {lightbox.photos.map((p, i) => (
                <div key={i} onClick={() => setLightbox(l => ({...l, index: i}))}
                  style={{ width:52, height:40, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i === lightbox.index ? '2.5px solid #e8410a' : '2px solid rgba(255,255,255,0.2)', opacity: i === lightbox.index ? 1 : 0.6 }}
                >
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

  // ═══ ЭКРАН 1: сетка категорий ═══
  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Найти работу</h1>
          <p>Выберите категорию — откликайтесь на заявки заказчиков</p>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="cats-grid">
            {[1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} className="cat-skeleton">
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 'var(--r-md)' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '85%', height: 13 }} />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="fw-empty">
            <span>📋</span>
            <p>Категории не загружены</p>
          </div>
        ) : (
          <div className="cats-grid">
            {categories.map((cat, idx) => {
              const style = CATEGORY_STYLES[cat.slug] || { emoji: '📋', color: '#f3f4f6' };
              const count = getRequestsForCategory(cat).length;
              return (
                <button
                  key={cat.id}
                  className="cat-card fade-up"
                  onClick={() => setSelectedCategory(cat)}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="cat-card-icon" style={{ background: style.color }}>
                    {style.emoji}
                  </div>
                  <div className="cat-card-body">
                    <h2>{cat.name}</h2>
                    <p>{count > 0 ? pluralRequests(count) : 'Нет активных заявок'}</p>
                  </div>
                  <div className="cat-card-arrow">›</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}