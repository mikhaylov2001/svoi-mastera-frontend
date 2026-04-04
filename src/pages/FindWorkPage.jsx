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

  // ═══ ЭКРАН 3: детальная заявка ═══
  if (selectedRequest) {
    const req = selectedRequest;
    const hasPhoto = req.photos && req.photos.length > 0;
    const style = CATEGORY_STYLES[selectedCategory?.slug] || { emoji: '📋', color: '#f3f4f6' };

    return (
      <>
      <div>
        <div className="page-header-bar">
          <div className="container">
            <button className="cats-back-link" onClick={() => { setSelectedRequest(null); setActivePhotoIdx(0); }}>
              ← Назад к заявкам
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:10 }}>
              <div style={{ width:52, height:52, borderRadius:14, overflow:'hidden', flexShrink:0, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                {hasPhoto
                  ? <img src={req.photos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                  : style.emoji}
              </div>
              <div>
                <h1 style={{ fontSize:22 }}>{req.title}</h1>
                <div style={{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:16, fontWeight:900, color:'#e8410a' }}>
                    {req.budgetTo ? `до ${Number(req.budgetTo).toLocaleString('ru-RU')} ₽`
                      : req.budgetFrom ? `от ${Number(req.budgetFrom).toLocaleString('ru-RU')} ₽`
                      : 'Договорная'}
                  </span>
                  {selectedCategory && <span style={{ fontSize:13, color:'#9ca3af' }}>🏷 {selectedCategory.name}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="dp-grid" style={{ paddingTop:24 }}>
            {/* Левая колонка */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Фото-галерея */}
              {hasPhoto && (
                <div className="dp-card" style={{ padding:0, overflow:'hidden' }}>
                  <div style={{ position:'relative', width:'100%', aspectRatio:'16/9', overflow:'hidden', cursor:'pointer' }}
                    onClick={() => setLightbox({ photos: req.photos, index: activePhotoIdx })}
                  >
                    <img src={req.photos[activePhotoIdx]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                    {req.photos.length > 1 && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setActivePhotoIdx(i => i > 0 ? i - 1 : req.photos.length - 1); }}
                          style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                        <button onClick={e => { e.stopPropagation(); setActivePhotoIdx(i => i < req.photos.length - 1 ? i + 1 : 0); }}
                          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.45)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                      </>
                    )}
                    <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:999, backdropFilter:'blur(4px)' }}>
                      {activePhotoIdx + 1} / {req.photos.length}
                    </div>
                  </div>
                  {req.photos.length > 1 && (
                    <div style={{ display:'flex', gap:6, padding:'10px 12px', background:'#f9fafb', overflowX:'auto' }}>
                      {req.photos.map((p, i) => (
                        <div key={i} onClick={() => setActivePhotoIdx(i)}
                          style={{ width:72, height:54, flexShrink:0, borderRadius:8, overflow:'hidden', cursor:'pointer', border: i === activePhotoIdx ? '2.5px solid #e8410a' : '2px solid transparent', opacity: i === activePhotoIdx ? 1 : 0.6, transition:'all .15s' }}>
                          <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Описание */}
              {req.description && req.description !== 'Без описания' && (
                <div className="dp-card">
                  <div className="dp-card-label">Описание задачи</div>
                  <p className="dp-desc">{req.description}</p>
                </div>
              )}

              {/* Детали */}
              <div className="dp-card">
                <div className="dp-card-label">Детали заявки</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {req.budgetTo && (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Бюджет</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>💰 до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽</div>
                    </div>
                  )}
                  {selectedCategory && (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Категория</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>🏷 {selectedCategory.name}</div>
                    </div>
                  )}
                  {req.addressText && (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Адрес</div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>📍 {req.addressText}</div>
                    </div>
                  )}
                  <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:4 }}>Опубликована</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>🕐 {new Date(req.createdAt).toLocaleDateString('ru-RU')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка — действия */}
            <div className="dp-side">
              {/* Заказчик */}
              <CustomerCard req={req} />

              {/* Откликнуться */}
              <button
                className="dp-confirm-btn"
                onClick={() => handleOpenOfferModal(req)}
              >
                📩 Откликнуться
              </button>

              <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', marginTop:10, lineHeight:1.5 }}>
                После принятия отклика заказчиком начнётся сделка
              </p>
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