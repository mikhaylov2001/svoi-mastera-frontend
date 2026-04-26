import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ListingInfoPanels from '../../components/ListingInfoPanels';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const CATEGORIES = [
  'Ремонт квартир','Сантехника','Электрика','Компьютерная помощь',
  'Уборка','Парикмахер','Маникюр и педикюр','Красота и здоровье',
  'Репетиторство','Грузоперевозки','Сварочные работы','Другое',
];
const PRICE_UNITS = ['за работу','за час','за день','договорная'];
const EMPTY_FORM = { title:'', description:'', price:'', priceUnit:'за работу', category:'', photos:[] };

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const css = `
  .ml-page { background: #f7f8fa; min-height: 100vh; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }

  /* ── СПИСОК ── */
  .ml-hdr { background:#fff; border-bottom:1px solid #e8e8e8; padding:16px 0; }
  .ml-hdr-inner { max-width:1000px; margin:0 auto; padding:0 16px; display:flex; align-items:center; justify-content:space-between; }
  .ml-h1 { font-size:22px; font-weight:800; margin:0; }
  .ml-new-btn { background:#e8410a; border:none; border-radius:8px; color:#fff; font-size:14px; font-weight:700; padding:10px 20px; cursor:pointer; }
  .ml-new-btn:hover { background:#d03a09; }
  .ml-wrap { max-width:1000px; margin:0 auto; padding:0 16px 60px; }
  .ml-tabs { display:flex; border-bottom:2px solid #e8e8e8; background:#fff; margin-bottom:0; }
  .ml-tab { background:none; border:none; border-bottom:3px solid transparent; padding:14px 20px; font-size:14px; font-weight:600; color:#8f8f8f; cursor:pointer; margin-bottom:-2px; }
  .ml-tab.on { color:#e8410a; border-bottom-color:#e8410a; }
  .ml-tab-n { font-size:12px; background:#f0f0f0; border-radius:10px; padding:1px 7px; margin-left:5px; color:#666; }
  .ml-tab.on .ml-tab-n { background:#fde8e0; color:#e8410a; }
  .ml-list { background:#fff; border:1px solid #e8e8e8; border-top:none; }
  .ml-row { display:flex; gap:0; border-bottom:1px solid #f0f0f0; transition:background .15s; cursor:pointer; }
  .ml-row:last-child { border-bottom:none; }
  .ml-row:hover { background:#fafafa; }
  .ml-row-img { width:130px; height:100px; flex-shrink:0; background:#f5f5f5; overflow:hidden; position:relative; }
  .ml-row-img img { width:100%; height:100%; object-fit:cover; display:block; }
  .ml-row-img-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; color:#d1d5db; }
  .ml-row-img-cnt { position:absolute; bottom:4px; right:4px; background:rgba(0,0,0,.5); color:#fff; font-size:10px; font-weight:700; padding:2px 5px; border-radius:3px; }
  .ml-row-body { flex:1; padding:14px 16px; min-width:0; }
  .ml-row-title { font-size:15px; font-weight:700; color:#1a1a1a; margin:0 0 4px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .ml-row-price { font-size:18px; font-weight:800; margin-bottom:3px; }
  .ml-row-unit { font-size:12px; color:#8f8f8f; font-weight:500; margin-left:4px; }
  .ml-row-cat { display:inline-block; font-size:11px; color:#fff; background:#e8410a; border-radius:4px; padding:2px 8px; margin-bottom:5px; font-weight:600; }
  .ml-row-desc { font-size:13px; color:#6b6b6b; overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; margin-bottom:4px; }
  .ml-row-date { font-size:12px; color:#9ca3af; }
  .ml-row-stats { width:180px; flex-shrink:0; padding:14px 12px; display:flex; flex-direction:column; gap:4px; border-left:1px solid #f0f0f0; }
  .ml-row-stat { font-size:12px; color:#8f8f8f; display:flex; align-items:center; gap:5px; }
  .ml-row-actions { width:160px; flex-shrink:0; padding:14px 12px; display:flex; flex-direction:column; gap:8px; border-left:1px solid #f0f0f0; justify-content:center; }
  .ml-btn-edit { background:#fff; border:1.5px solid #d6d6d6; border-radius:6px; padding:7px 0; font-size:13px; font-weight:600; color:#333; cursor:pointer; width:100%; }
  .ml-btn-edit:hover { border-color:#e8410a; color:#e8410a; }
  .ml-btn-arch { background:none; border:none; font-size:12px; color:#8f8f8f; cursor:pointer; text-decoration:underline; text-underline-offset:2px; text-align:center; }
  .ml-btn-arch:hover { color:#e8410a; }
  .ml-btn-restore { background:none; border:none; font-size:12px; color:#e8410a; cursor:pointer; text-decoration:underline; text-underline-offset:2px; text-align:center; }
  .ml-empty { text-align:center; padding:80px 24px; background:#fff; border:1px solid #e8e8e8; border-top:none; color:#8f8f8f; }

  /* ── ДЕТАЛЬНАЯ СТРАНИЦА ── */
  .ml-detail { background:#f7f8fa; min-height:100vh; }
  .ml-detail-nav { background:#fff; border-bottom:1.5px solid #e5e7eb; padding:12px 0; }
  .ml-detail-wrap { max-width:1000px; margin:0 auto; padding:20px 16px 60px; display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:flex-start; }
  .ml-detail-left {}
  .ml-detail-gallery { background:#fff; border-radius:12px; overflow:hidden; margin-bottom:16px; }
  .ml-detail-main-img { position:relative; aspect-ratio:16/9; overflow:hidden; cursor:pointer; background:#f5f5f5; display:flex; align-items:center; justify-content:center; }
  .ml-detail-main-img img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; }
  .ml-detail-thumbs { display:flex; gap:6px; padding:10px 12px; background:#fafafa; overflow-x:auto; }
  .ml-detail-thumb { width:72px; height:54px; flex-shrink:0; border-radius:6px; overflow:hidden; cursor:pointer; border:2px solid transparent; }
  .ml-detail-thumb.on { border-color:#e8410a; }
  .ml-detail-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
  .ml-detail-info { background:#fff; border-radius:12px; padding:20px 24px; margin-bottom:16px; }
  .ml-detail-desc-block { background:#fff; border-radius:12px; padding:20px 24px; }
  .ml-detail-right { display:flex; flex-direction:column; gap:12px; position:sticky; top:72px; }
  .ml-detail-price-card { background:#fff; border-radius:12px; padding:20px; }
  .ml-detail-price { font-size:28px; font-weight:900; color:#1a1a1a; }
  .ml-detail-price-unit { font-size:13px; color:#8f8f8f; margin-top:2px; }
  .ml-detail-actions-card { background:#fff; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:8px; }
  .ml-btn-primary { background:#e8410a; border:none; border-radius:8px; color:#fff; font-size:14px; font-weight:700; padding:13px; cursor:pointer; width:100%; }
  .ml-btn-primary:hover { background:#d03a09; }
  .ml-btn-outline { background:#fff; border:1.5px solid #e8410a; border-radius:8px; color:#e8410a; font-size:14px; font-weight:700; padding:12px; cursor:pointer; width:100%; }
  .ml-btn-outline:hover { background:#fde8e0; }
  .ml-btn-danger { background:none; border:none; font-size:13px; color:#ef4444; cursor:pointer; text-decoration:underline; text-align:center; }
  .ml-section-label { font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
  .ml-detail-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f3f4f6; font-size:14px; }
  .ml-detail-row:last-child { border-bottom:none; }
  .ml-tag { display:inline-block; background:#fde8e0; color:#e8410a; border-radius:20px; font-size:12px; font-weight:700; padding:4px 12px; }

  /* ── МОДАЛКА ── */
  .ml-overlay { position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; padding:16px; }
  .ml-modal { background:#fff; border-radius:14px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; padding:26px; }
  .ml-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .ml-modal-title { font-size:18px; font-weight:800; margin:0; }
  .ml-modal-x { background:none; border:none; font-size:24px; cursor:pointer; color:#9ca3af; line-height:1; }
  .ml-field { margin-bottom:14px; }
  .ml-label { font-size:13px; font-weight:600; color:#374151; margin-bottom:6px; display:block; }
  .ml-input { width:100%; padding:10px 13px; border-radius:7px; border:1.5px solid #e0e0e0; font-size:14px; outline:none; box-sizing:border-box; font-family:Arial,sans-serif; transition:border-color .15s; }
  .ml-input:focus { border-color:#e8410a; }
  .ml-textarea { resize:vertical; min-height:90px; line-height:1.6; }
  .ml-2col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .ml-photos-row { display:flex; gap:8px; flex-wrap:wrap; }
  .ml-photo-thumb { position:relative; width:76px; height:76px; border-radius:7px; overflow:hidden; }
  .ml-photo-thumb img { width:100%; height:100%; object-fit:cover; }
  .ml-photo-del { position:absolute; top:2px; right:2px; width:18px; height:18px; border-radius:50%; background:rgba(0,0,0,.6); border:none; color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .ml-photo-add { width:76px; height:76px; border-radius:7px; border:2px dashed #d1d5db; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; color:#9ca3af; font-size:11px; gap:3px; }
  .ml-photo-add:hover { border-color:#e8410a; color:#e8410a; }
  .ml-modal-footer { display:flex; gap:10px; margin-top:20px; }
  .ml-btn-cancel { flex:1; padding:12px; background:#f5f5f5; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; color:#333; }
  .ml-btn-save { flex:2; padding:12px; background:#e8410a; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; color:#fff; }
  .ml-btn-save:disabled { background:#e0e0e0; color:#999; cursor:not-allowed; }

  @media(max-width:720px) {
    .ml-detail-wrap { grid-template-columns:1fr; }
    .ml-detail-right { position:static; }
    .ml-row-stats, .ml-row-actions { display:none; }
  }
`;

export default function MyListingsPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('active');
  const [detail, setDetail]       = useState(null); // listing obj или null
  const [photoIdx, setPhotoIdx]   = useState(0);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const photoRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/workers/${userId}/listings`);
      if (r.ok) {
        const data = await r.json();
        setListings(data);
        // обновляем detail если он открыт
        setDetail(prev => {
          if (!prev) return null;
          const fresh = data.find(l => l.id === prev.id);
          return fresh || prev;
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  // Клавиатурная навигация лайтбокса
  React.useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') setLightbox(l => l ? {...l, index:(l.index+1)%l.photos.length} : l);
      if (e.key === 'ArrowLeft')  setLightbox(l => l ? {...l, index:(l.index-1+l.photos.length)%l.photos.length} : l);
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  const active  = listings.filter(l => l.active);
  const archive = listings.filter(l => !l.active);
  const shown   = tab === 'active' ? active : archive;

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit   = (l) => {
    setForm({ title:l.title, description:l.description||'', price:l.price, priceUnit:l.priceUnit||'за работу', category:l.category||'', photos:l.photos||[] });
    setModal(l);
  };

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    if ((form.photos?.length||0)+files.length > 5) { alert('Максимум 5 фото'); return; }
    const compressed = await Promise.all(files.map(compressImage));
    setForm(p => ({ ...p, photos:[...(p.photos||[]),...compressed] }));
    e.target.value='';
  };

  const removePhoto = (i) => setForm(p => ({ ...p, photos:p.photos.filter((_,idx)=>idx!==i) }));

  const handleSave = async () => {
    if (!form.title.trim()||!form.price||!form.category) return;
    setSaving(true);
    try {
      const isEdit = modal!=='create';
      const r = await fetch(isEdit ? `${API}/listings/${modal.id}` : `${API}/listings`, {
        method: isEdit?'PUT':'POST',
        headers: { 'Content-Type':'application/json','X-User-Id':userId },
        body: JSON.stringify({ title:form.title.trim(), description:form.description.trim()||null, price:Number(form.price), priceUnit:form.priceUnit, category:form.category, photos:form.photos?.length?form.photos:null }),
      });
      if (r.ok) {
        setModal(false);
        await load();
        // Если редактируем текущее открытое объявление — обновляем detail
        if (detail && modal !== 'create' && modal.id === detail.id) {
          const updated = await fetch(`${API}/workers/${userId}/listings`).then(r=>r.json()).catch(()=>null);
          if (updated) {
            const fresh = updated.find(x => x.id === detail.id);
            if (fresh) setDetail(fresh);
          }
        }
      }
    } catch {}
    setSaving(false);
  };

  const handleToggle = async (l, e) => {
    e?.stopPropagation();
    // Оптимистичное обновление — сразу меняем UI
    const newActive = !l.active;
    setListings(prev => prev.map(x => x.id === l.id ? {...x, active: newActive} : x));
    if (detail?.id === l.id) setDetail(prev => ({...prev, active: newActive}));
    try {
      if (l.active) {
        // Снять с публикации — DELETE
        await fetch(`${API}/listings/${l.id}`, { method:'DELETE', headers:{'X-User-Id':userId} });
      } else {
        // Восстановить — отдельный endpoint
        await fetch(`${API}/listings/${l.id}/restore`, {
          method:'POST',
          headers:{'X-User-Id':userId},
        });
      }
      // Перезагружаем для синхронизации с сервером
      await load();
    } catch {
      // Откатываем если ошибка
      setListings(prev => prev.map(x => x.id === l.id ? {...x, active: l.active} : x));
      if (detail?.id === l.id) setDetail(prev => ({...prev, active: l.active}));
    }
  };

  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Мастер';
  const BACKEND  = 'https://svoi-mastera-backend.onrender.com';
  const ava      = userAvatar ? (userAvatar.startsWith('data:')||userAvatar.startsWith('http') ? userAvatar : BACKEND+userAvatar) : null;

  // ══ ДЕТАЛЬНАЯ СТРАНИЦА ══
  if (detail) {
    const hasPhoto = detail.photos?.length > 0;
    return (
      <div className="ml-detail">
        <style>{css}</style>
        <div className="ml-detail-nav">
          <div style={{maxWidth:1000,margin:'0 auto',padding:'0 16px'}}>
            <button className="cats-back-link" onClick={() => { setDetail(null); setPhotoIdx(0); }}>← Мои объявления</button>
          </div>
        </div>

        <div className="ml-detail-wrap">
          {/* Левая колонка */}
          <div className="ml-detail-left">
            {/* Галерея */}
            <div className="ml-detail-gallery">
              <div className="ml-detail-main-img" onClick={() => hasPhoto && setLightbox({photos:detail.photos,index:photoIdx})}>
                {hasPhoto
                  ? <img src={detail.photos[photoIdx]} alt="" />
                  : <div style={{fontSize:64,color:'#d1d5db'}}>🔧</div>
                }
                {hasPhoto && detail.photos.length > 1 && (<>
                  {/* Стрелка влево */}
                  <button onClick={e=>{e.stopPropagation();setPhotoIdx(i=>(i-1+detail.photos.length)%detail.photos.length);}}
                    style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>‹</button>
                  {/* Стрелка вправо */}
                  <button onClick={e=>{e.stopPropagation();setPhotoIdx(i=>(i+1)%detail.photos.length);}}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>›</button>
                  {/* Счётчик */}
                  <div style={{position:'absolute',bottom:10,right:10,background:'rgba(0,0,0,.5)',color:'#fff',fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:999,zIndex:2}}>
                    {photoIdx+1} / {detail.photos.length}
                  </div>
                </>)}
              </div>
              {hasPhoto && detail.photos.length > 1 && (
                <div className="ml-detail-thumbs">
                  {detail.photos.map((p,i) => (
                    <div key={i} className={`ml-detail-thumb${i===photoIdx?' on':''}`} onClick={() => setPhotoIdx(i)}>
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ListingInfoPanels
              description={detail.description}
              category={detail.category}
              address={detail.address || 'Йошкар-Ола · выезд по договорённости'}
              budgetLabel={
                detail.price != null && Number(detail.price) > 0
                  ? `${Number(detail.price).toLocaleString('ru-RU')} ₽${detail.priceUnit ? ` ${detail.priceUnit}` : ''}`
                  : (detail.priceUnit || 'Договорная')
              }
              publishedAt={detail.createdAt}
            />
          </div>

          {/* Правая колонка */}
          <div className="ml-detail-right">
            {/* Цена */}
            <div className="ml-detail-price-card">
              <div className="ml-detail-price">{Number(detail.price).toLocaleString('ru-RU')} ₽</div>
              <div className="ml-detail-price-unit">{detail.priceUnit}</div>
              {detail.category && <div style={{marginTop:8}}><span className="ml-tag">{detail.category}</span></div>}
            </div>

            {/* Действия */}
            <div className="ml-detail-actions-card">
              <div className="ml-section-label" style={{marginBottom:4}}>Управление</div>
              <button className="ml-btn-primary" onClick={() => openEdit(detail)}>✏️ Редактировать</button>
              <button className="ml-btn-outline" onClick={(e) => handleToggle(detail, e)}>
                {detail.active ? '📦 Снять с публикации' : '🔄 Восстановить'}
              </button>
            </div>

            {/* Профиль мастера */}
            <div style={{background:'#fff',borderRadius:12,padding:'16px 20px'}}>
              <div className="ml-section-label">Ваш профиль</div>
              <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={() => navigate('/worker-profile')}>
                {ava
                  ? <img src={ava} alt="" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
                  : <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#e8410a,#ff7043)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0}}>
                      {(userName||'М')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{fullName}</div>
                  <div style={{fontSize:12,color:'#22c55e',fontWeight:600}}>● Мастер</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,.93)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setLightbox(null)}>
            {/* Стрелки — на уровне оверлея, не обрезаются */}
            {lightbox.photos.length>1&&(<>
              <button onClick={e=>{e.stopPropagation();setLightbox(l=>({...l,index:(l.index-1+l.photos.length)%l.photos.length}));}}
                style={{position:'absolute',left:20,top:'50%',transform:'translateY(-50%)',zIndex:10001,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.18)',border:'none',color:'#fff',fontSize:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
              <button onClick={e=>{e.stopPropagation();setLightbox(l=>({...l,index:(l.index+1)%l.photos.length}));}}
                style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',zIndex:10001,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.18)',border:'none',color:'#fff',fontSize:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
            </>)}
            <div style={{position:'relative',maxWidth:'85vw',maxHeight:'80vh'}} onClick={e=>e.stopPropagation()}>
              <img src={lightbox.photos[lightbox.index]} alt="" style={{maxWidth:'85vw',maxHeight:'80vh',borderRadius:10,display:'block',userSelect:'none'}} />
              {/* Счётчик */}
              <div style={{position:'absolute',top:12,left:12,background:'rgba(0,0,0,.55)',color:'#fff',fontSize:13,fontWeight:700,padding:'4px 10px',borderRadius:999}}>
                {lightbox.index+1} / {lightbox.photos.length}
              </div>
              {/* Закрыть */}
              <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:12,right:12,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.18)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
            {/* Миниатюры */}
            {lightbox.photos.length>1&&(
              <div style={{position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',display:'flex',gap:8}} onClick={e=>e.stopPropagation()}>
                {lightbox.photos.map((p,i)=>(
                  <div key={i} onClick={()=>setLightbox(l=>({...l,index:i}))}
                    style={{width:52,height:40,borderRadius:5,overflow:'hidden',cursor:'pointer',border:i===lightbox.index?'2.5px solid #e8410a':'2px solid rgba(255,255,255,.25)',opacity:i===lightbox.index?1:0.6}}>
                    <img src={p} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Модалка редактирования */}
        {modal && (
          <div className="ml-overlay" onClick={()=>setModal(false)}>
            <div className="ml-modal" onClick={e=>e.stopPropagation()}>
              <div className="ml-modal-hdr">
                <h2 className="ml-modal-title">Редактировать объявление</h2>
                <button className="ml-modal-x" onClick={()=>setModal(false)}>×</button>
              </div>
              <div className="ml-field"><label className="ml-label">Название *</label>
                <input className="ml-input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Название услуги" /></div>
              <div className="ml-field"><label className="ml-label">Категория *</label>
                <select className="ml-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  <option value="">Выберите категорию</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="ml-field ml-2col">
                <div><label className="ml-label">Цена (₽) *</label>
                  <input className="ml-input" type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} placeholder="1500" /></div>
                <div><label className="ml-label">Единица</label>
                  <select className="ml-input" value={form.priceUnit} onChange={e=>setForm(p=>({...p,priceUnit:e.target.value}))}>
                    {PRICE_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                  </select></div>
              </div>
              <div className="ml-field"><label className="ml-label">Описание</label>
                <textarea className="ml-input ml-textarea" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Расскажите об услуге..." /></div>
              <div className="ml-field">
                <label className="ml-label">Фото (до 5)</label>
                <div className="ml-photos-row">
                  {(form.photos||[]).map((p,i)=>(
                    <div key={i} className="ml-photo-thumb"><img src={p} alt=""/><button className="ml-photo-del" onClick={()=>removePhoto(i)}>×</button></div>
                  ))}
                  {(form.photos||[]).length<5&&(
                    <div className="ml-photo-add" onClick={()=>photoRef.current?.click()}><span style={{fontSize:20}}>📷</span><span>Добавить</span></div>
                  )}
                  <input ref={photoRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handlePhoto}/>
                </div>
              </div>
              <div className="ml-modal-footer">
                <button className="ml-btn-cancel" onClick={()=>setModal(false)}>Отмена</button>
                <button className="ml-btn-save" disabled={saving||!form.title.trim()||!form.price||!form.category} onClick={handleSave}>
                  {saving?'Сохраняем...':'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══ СПИСОК ══
  return (
    <div className="ml-page">
      <style>{css}</style>

      <div className="ml-hdr">
        <div className="ml-hdr-inner">
          <h1 className="ml-h1">Мои объявления</h1>
          <button className="ml-new-btn" onClick={openCreate}>+ Разместить объявление</button>
        </div>
      </div>

      <div className="ml-wrap" style={{paddingTop:0}}>
        <div className="ml-tabs">
          <button className={`ml-tab${tab==='active'?' on':''}`} onClick={()=>setTab('active')}>
            Активные <span className="ml-tab-n">{active.length}</span>
          </button>
          <button className={`ml-tab${tab==='archive'?' on':''}`} onClick={()=>setTab('archive')}>
            Архив <span className="ml-tab-n">{archive.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="ml-list">
            {[1,2,3].map(i=>(
              <div key={i} className="ml-row" style={{cursor:'default'}}>
                <div className="ml-row-img" style={{background:'#f0f0f0'}}/>
                <div className="ml-row-body">
                  <div style={{height:15,background:'#f0f0f0',borderRadius:4,width:'50%',marginBottom:8}}/>
                  <div style={{height:20,background:'#f0f0f0',borderRadius:4,width:'25%'}}/>
                </div>
              </div>
            ))}
          </div>
        ) : shown.length===0 ? (
          <div className="ml-empty">
            <div style={{fontSize:52,marginBottom:16}}>{tab==='active'?'📋':'📦'}</div>
            <h3 style={{fontSize:17,fontWeight:700,color:'#1a1a1a',margin:'0 0 8px'}}>{tab==='active'?'Нет активных объявлений':'Архив пуст'}</h3>
            <p style={{fontSize:14,margin:'0 0 20px'}}>{tab==='active'?'Разместите объявление чтобы заказчики могли вас найти':'Снятые объявления появятся здесь'}</p>
            {tab==='active'&&<button className="ml-new-btn" onClick={openCreate}>+ Разместить объявление</button>}
          </div>
        ) : (
          <div className="ml-list">
            {shown.map(l=>(
              <div key={l.id} className="ml-row" onClick={()=>{setDetail(l);setPhotoIdx(0);}}>
                {/* Фото */}
                <div className="ml-row-img">
                  {l.photos?.length
                    ? <><img src={l.photos[0]} alt=""/>{l.photos.length>1&&<span className="ml-row-img-cnt">📷{l.photos.length}</span>}</>
                    : <div className="ml-row-img-ph">🔧</div>
                  }
                </div>

                {/* Контент */}
                <div className="ml-row-body">
                  <div className="ml-row-title">{l.title}</div>
                  <div className="ml-row-price">
                    {l.priceUnit === 'договорная' || !l.price || Number(l.price) <= 0 ? (
                      <span style={{ fontSize:15, fontWeight:700, color:'#64748b' }}>Цена в объявлении — по договорённости</span>
                    ) : (
                      <>{Number(l.price).toLocaleString('ru-RU')} ₽<span className="ml-row-unit">{l.priceUnit}</span></>
                    )}
                  </div>
                  {l.category&&<span className="ml-row-cat">{l.category}</span>}
                  {l.description&&<div className="ml-row-desc">{l.description}</div>}
                  <div className="ml-row-date">📅 {l.createdAt?new Date(l.createdAt).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'—'}</div>
                </div>

                {/* Статистика */}
                <div className="ml-row-stats">
                  <div className="ml-row-stat">👁 — просмотров</div>
                  <div className="ml-row-stat">💬 — новых чатов</div>
                  <div className="ml-row-stat" style={{color: l.active?'#22c55e':'#ef4444', fontWeight:600}}>
                    ● {l.active?'Активно':'В архиве'}
                  </div>
                </div>

                {/* Кнопки */}
                <div className="ml-row-actions" onClick={e=>e.stopPropagation()}>
                  <button className="ml-btn-edit" onClick={e=>{e.stopPropagation();openEdit(l);}}>Редактировать</button>
                  <button className={l.active?'ml-btn-arch':'ml-btn-restore'} onClick={e=>handleToggle(l,e)}>
                    {l.active?'Снять с публикации':'Восстановить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка создания */}
      {modal && (
        <div className="ml-overlay" onClick={()=>setModal(false)}>
          <div className="ml-modal" onClick={e=>e.stopPropagation()}>
            <div className="ml-modal-hdr">
              <h2 className="ml-modal-title">{modal==='create'?'Новое объявление':'Редактировать'}</h2>
              <button className="ml-modal-x" onClick={()=>setModal(false)}>×</button>
            </div>
            <div className="ml-field"><label className="ml-label">Название *</label>
              <input className="ml-input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Например: Установка розеток" /></div>
            <div className="ml-field"><label className="ml-label">Категория *</label>
              <select className="ml-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="ml-field ml-2col">
              <div><label className="ml-label">Цена (₽) *</label>
                <input className="ml-input" type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} placeholder="1500"/></div>
              <div><label className="ml-label">Единица</label>
                <select className="ml-input" value={form.priceUnit} onChange={e=>setForm(p=>({...p,priceUnit:e.target.value}))}>
                  {PRICE_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </select></div>
            </div>
            <div className="ml-field"><label className="ml-label">Описание</label>
              <textarea className="ml-input ml-textarea" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Расскажите подробнее об услуге..."/></div>
            <div className="ml-field">
              <label className="ml-label">Фото (до 5)</label>
              <div className="ml-photos-row">
                {(form.photos||[]).map((p,i)=>(
                  <div key={i} className="ml-photo-thumb"><img src={p} alt=""/><button className="ml-photo-del" onClick={()=>removePhoto(i)}>×</button></div>
                ))}
                {(form.photos||[]).length<5&&(
                  <div className="ml-photo-add" onClick={()=>photoRef.current?.click()}><span style={{fontSize:20}}>📷</span><span>Добавить</span></div>
                )}
                <input ref={photoRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handlePhoto}/>
              </div>
            </div>
            <div className="ml-modal-footer">
              <button className="ml-btn-cancel" onClick={()=>setModal(false)}>Отмена</button>
              <button className="ml-btn-save" disabled={saving||!form.title.trim()||!form.price||!form.category} onClick={handleSave}>
                {saving?'Сохраняем...':'Опубликовать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}