import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { acceptListingDeal } from '../api';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const CAT_PHOTOS = {
  'remont-kvartir':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80',
  'santehnika':           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
  'elektrika':            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=80',
  'uborka':               'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=900&q=80',
  'parikhmaher':          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80',
  'manikur':              'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80',
  'krasota-i-zdorovie':   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80',
  'repetitorstvo':        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&q=80',
};

const CAT_SLUGS = {
  'Ремонт квартир': 'remont-kvartir', 'Сантехника': 'santehnika',
  'Электрика': 'elektrika', 'Уборка': 'uborka', 'Парикмахер': 'parikhmaher',
  'Маникюр и педикюр': 'manikur', 'Красота и здоровье': 'krasota-i-zdorovie',
  'Репетиторство': 'repetitorstvo', 'Компьютерная помощь': 'kompyuternaya-pomosh',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .ld * { box-sizing: border-box; }
  .ld { font-family: Inter, Arial, sans-serif; background: #f7f7f7; min-height: 100vh; color: #1a1a1a; }

  /* BREADCRUMB */
  .ld-bread { background: #fff; border-bottom: 1px solid #e8e8e8; }
  .ld-bread-inner { max-width: 1200px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #999; flex-wrap: wrap; }
  .ld-bread a { color: #616161; text-decoration: none; } .ld-bread a:hover { color: #e8410a; text-decoration: underline; }
  .ld-bread-sep { color: #ccc; font-size: 11px; }

  /* LAYOUT */
  .ld-page { max-width: 1200px; margin: 0 auto; padding: 16px 16px 60px; display: grid; grid-template-columns: 1fr 344px; gap: 16px; align-items: flex-start; }

  /* LEFT COLUMN */
  .ld-left { min-width: 0; }

  /* TITLE BLOCK */
  .ld-title-block { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; padding: 16px 20px 14px; margin-bottom: 8px; }
  .ld-title { font-size: 26px; font-weight: 700; margin: 0 0 10px; line-height: 1.25; color: #1a1a1a; letter-spacing: -0.3px; }
  .ld-actions-row { display: flex; gap: 8px; }
  .ld-action-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px; font-weight: 500; color: #555; padding: 7px 12px; cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s; text-decoration: none; }
  .ld-action-btn:hover { background: #f5f5f5; border-color: #ccc; }

  /* GALLERY */
  .ld-gallery { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; overflow: hidden; margin-bottom: 8px; }
  .ld-gallery-main { position: relative; aspect-ratio: 16/10; background: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: zoom-in; }
  .ld-gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .ld-gallery-main:hover img { transform: scale(1.015); }
  .ld-gallery-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border: none; border-radius: 50%; background: rgba(255,255,255,.88); color: #333; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 3; box-shadow: 0 2px 8px rgba(0,0,0,.2); transition: background .15s; }
  .ld-gallery-nav:hover { background: #fff; }
  .ld-gallery-nav-prev { left: 12px; }
  .ld-gallery-nav-next { right: 12px; }
  .ld-gallery-ph { font-size: 64px; color: #ddd; }
  .ld-gallery-count { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,.52); color: #fff; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
  .ld-thumbs { display: flex; gap: 6px; padding: 8px 10px; background: #fafafa; border-top: 1px solid #f0f0f0; overflow-x: auto; }
  .ld-thumb { width: 68px; height: 52px; border-radius: 5px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 2px solid transparent; transition: border-color .15s; opacity: .75; }
  .ld-thumb.active { border-color: #e8410a; opacity: 1; }
  .ld-thumb:hover { opacity: 1; }
  .ld-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* INFO BLOCK */
  .ld-info-block { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; padding: 16px 20px; margin-bottom: 8px; }
  .ld-info-title { font-size: 13px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
  .ld-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .ld-info-row { padding: 10px 0; border-bottom: 1px solid #f0f0f0; display: flex; flex-direction: column; gap: 2px; padding-right: 16px; }
  .ld-info-row:nth-child(even) { padding-right: 0; padding-left: 16px; border-left: 1px solid #f0f0f0; }
  .ld-info-key { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
  .ld-info-val { font-size: 14px; color: #111; font-weight: 600; }

  /* BADGES */
  .ld-badges-block { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; padding: 12px 20px; margin-bottom: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
  .ld-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; padding: 5px 11px; border-radius: 6px; }
  .ld-badge-green { background: #f0fdf4; color: #16a34a; }
  .ld-badge-orange { background: #fff7ed; color: #ea580c; }
  .ld-badge-blue { background: #eff6ff; color: #2563eb; }

  /* DESCRIPTION */
  .ld-desc-block { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; padding: 16px 20px; margin-bottom: 8px; }
  .ld-desc-head { font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #1a1a1a; }
  .ld-desc-text { font-size: 14px; color: #444; line-height: 1.75; margin: 0; white-space: pre-wrap; word-break: break-word; }
  .ld-desc-toggle { background: none; border: none; color: #e8410a; font-size: 13px; font-weight: 600; cursor: pointer; padding: 10px 0 0; font-family: inherit; }
  .ld-empty-desc { font-size: 14px; color: #bbb; font-style: italic; }

  /* META LINE */
  .ld-meta-line { font-size: 12px; color: #bbb; margin-top: 2px; display: flex; gap: 12px; flex-wrap: wrap; }
  .ld-meta-line span { display: flex; align-items: center; gap: 4px; }

  /* RIGHT COLUMN */
  .ld-right { position: sticky; top: 72px; display: flex; flex-direction: column; gap: 10px; }

  /* PRICE PANEL */
  .ld-price-panel { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; padding: 18px 18px 16px; }
  .ld-price-big { font-size: 28px; font-weight: 800; color: #1a1a1a; letter-spacing: -.5px; margin: 0 0 4px; }
  .ld-price-unit { font-size: 13px; color: #888; font-weight: 500; }
  .ld-price-btns { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
  .ld-btn-msg { background: #e8410a; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 700; padding: 13px 16px; cursor: pointer; font-family: inherit; transition: background .15s; display: flex; align-items: center; justify-content: center; gap: 7px; text-decoration: none; }
  .ld-btn-msg:hover { background: #d03a09; }
  .ld-btn-accept { background: #fff; border: 2px solid #2563eb; border-radius: 8px; color: #2563eb; font-size: 15px; font-weight: 700; padding: 12px 16px; cursor: pointer; font-family: inherit; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 7px; }
  .ld-btn-accept:hover { background: #eff6ff; }
  .ld-btn-accept:disabled { opacity: .6; cursor: not-allowed; }
  .ld-pending-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #92400e; line-height: 1.5; display: flex; gap: 7px; align-items: flex-start; }
  .ld-success-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #166534; font-weight: 600; display: flex; gap: 7px; align-items: center; }
  .ld-error-msg { font-size: 12px; color: #ef4444; font-weight: 600; padding: 4px 0; }

  /* SELLER CARD */
  .ld-seller { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; overflow: hidden; }
  .ld-seller-top { padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
  .ld-seller-ava { width: 52px; height: 52px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg,#e8410a,#ff7043); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 800; }
  .ld-seller-ava img { width: 100%; height: 100%; object-fit: cover; }
  .ld-seller-name { font-size: 15px; font-weight: 700; margin: 0 0 2px; color: #1a1a1a; }
  .ld-seller-name a { color: inherit; text-decoration: none; } .ld-seller-name a:hover { color: #e8410a; }
  .ld-seller-since { font-size: 12px; color: #999; }
  .ld-seller-verify { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #16a34a; font-weight: 600; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 2px 7px; margin-top: 4px; }
  .ld-seller-stats { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #f0f0f0; }
  .ld-sstat { text-align: center; padding: 10px 4px; border-right: 1px solid #f0f0f0; }
  .ld-sstat:last-child { border-right: none; }
  .ld-sstat-num { font-size: 16px; font-weight: 800; color: #1a1a1a; display: block; line-height: 1; }
  .ld-sstat-lbl { font-size: 10px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-top: 3px; display: block; }
  .ld-seller-stars { display: flex; align-items: center; gap: 2px; margin-top: 4px; }
  .ld-star { font-size: 13px; }
  .ld-seller-footer { border-top: 1px solid #f0f0f0; padding: 10px 16px; }
  .ld-seller-link { font-size: 13px; color: #e8410a; font-weight: 600; text-decoration: none; display: block; text-align: center; }
  .ld-seller-link:hover { text-decoration: underline; }

  /* SIMILAR */
  .ld-similar { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; padding: 14px 16px; }
  .ld-similar-head { font-size: 14px; font-weight: 700; margin: 0 0 12px; color: #1a1a1a; display: flex; align-items: center; justify-content: space-between; }
  .ld-similar-head a { font-size: 12px; color: #e8410a; text-decoration: none; font-weight: 600; }
  .ld-similar-list { display: flex; flex-direction: column; }
  .ld-sim-item { display: flex; gap: 10px; text-decoration: none; color: #1a1a1a; align-items: center; padding: 8px 6px; border-radius: 6px; transition: background .15s; }
  .ld-sim-item:hover { background: #f7f7f7; }
  .ld-sim-img { width: 56px; height: 42px; border-radius: 5px; overflow: hidden; flex-shrink: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .ld-sim-img img { width: 100%; height: 100%; object-fit: cover; }
  .ld-sim-title { font-size: 13px; font-weight: 600; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.35; color: #333; }
  .ld-sim-price { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }

  /* SKELETON */
  .ld-skel { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: ld-shimmer 1.2s infinite; border-radius: 6px; }
  @keyframes ld-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* LIGHTBOX */
  .ld-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
  .ld-lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 4px; }
  .ld-lb-close { position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,.14); border: none; border-radius: 50%; width: 38px; height: 38px; color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .ld-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.14); border: none; border-radius: 50%; width: 44px; height: 44px; color: #fff; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .ld-lb-prev { left: 18px; }
  .ld-lb-next { right: 18px; }
  .ld-lb-counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.7); font-size: 13px; }

  @media(max-width:900px) { .ld-page { grid-template-columns: 1fr; } .ld-right { position: static; } .ld-info-grid { grid-template-columns: 1fr; } .ld-info-row:nth-child(even) { padding-left: 0; border-left: none; } }
  @media(max-width:600px) { .ld-title { font-size: 20px; } .ld-price-big { font-size: 24px; } }
`;

export default function ListingDetailPage() {
  const { id } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [stats, setStats] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/listings/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setListing(data);
        setActivePhoto(0);
        if (data.workerId) {
          fetch(`${API}/workers/${data.workerId}/stats`)
            .then(r => r.ok ? r.json() : null)
            .then(s => setStats(s)).catch(() => {});
        }
        fetch(`${API}/listings`)
          .then(r => r.ok ? r.json() : [])
          .then(all => {
            setSimilar((Array.isArray(all) ? all : [])
              .filter(l => l.active && l.id !== data.id && l.category === data.category)
              .slice(0, 4));
          }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const photos = listing?.photos?.length ? listing.photos : [];
  const catSlug = CAT_SLUGS[listing?.category] || '';
  const fallbackPhoto = CAT_PHOTOS[catSlug];
  const allPhotos = photos.length ? photos : (fallbackPhoto ? [fallbackPhoto] : []);

  const nextPhoto = useCallback(() => setActivePhoto(i => (allPhotos.length > 1 ? (i + 1) % allPhotos.length : i)), [allPhotos.length]);
  const prevPhoto = useCallback(() => setActivePhoto(i => (allPhotos.length > 1 ? (i - 1 + allPhotos.length) % allPhotos.length : i)), [allPhotos.length]);

  useEffect(() => {
    if (!lightbox || allPhotos.length <= 1) return;
    const onKey = e => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, allPhotos.length, nextPhoto, prevPhoto]);

  const handleAcceptWork = async () => {
    if (!userId) { navigate('/login'); return; }
    setActionError('');
    setAccepting(true);
    try {
      await acceptListingDeal(userId, listing.id);
      setAccepted(true);
    } catch (e) {
      setActionError(e?.message || 'Не удалось принять работу. Попробуйте ещё раз.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return (
    <div className="ld"><style>{css}</style>
      <div className="ld-page">
        <div>
          <div className="ld-skel" style={{height:40,marginBottom:8}}/>
          <div className="ld-skel" style={{height:360,marginBottom:8,borderRadius:8}}/>
          <div className="ld-skel" style={{height:160,borderRadius:8}}/>
        </div>
        <div><div className="ld-skel" style={{height:320,borderRadius:8}}/></div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="ld"><style>{css}</style>
      <div style={{textAlign:'center',padding:'80px 24px'}}>
        <div style={{fontSize:48,marginBottom:16}}>😕</div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Объявление не найдено</h2>
        <Link to="/find-master" style={{color:'#e8410a',fontWeight:600}}>← Вернуться к поиску</Link>
      </div>
    </div>
  );

  const workerName = [listing.workerName, listing.workerLastName].filter(Boolean).join(' ') || 'Мастер';
  const initials = (listing.workerName || 'М')[0].toUpperCase();
  const desc = listing.description || '';
  const descShort = desc.length > 400 ? desc.slice(0, 400) + '…' : desc;
  const rating = stats?.averageRating || listing.workerRating || 0;
  const reviews = stats?.reviewCount || 0;
  const completed = stats?.completedWorksCount || 0;
  const isOwnListing = String(userId) === String(listing.workerId);

  return (
    <div className="ld">
      <style>{css}</style>

      {/* Lightbox */}
      {lightbox && allPhotos.length > 0 && (
        <div className="ld-lightbox" onClick={() => setLightbox(false)}>
          <button className="ld-lb-close" onClick={() => setLightbox(false)}>✕</button>
          {allPhotos.length > 1 && <>
            <button className="ld-lb-nav ld-lb-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}>‹</button>
            <button className="ld-lb-nav ld-lb-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}>›</button>
          </>}
          <img src={allPhotos[activePhoto]} alt="" onClick={e => e.stopPropagation()}/>
          {allPhotos.length > 1 && <div className="ld-lb-counter">{activePhoto + 1} / {allPhotos.length}</div>}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="ld-bread">
        <div className="ld-bread-inner">
          <Link to="/">Главная</Link>
          <span className="ld-bread-sep">›</span>
          <Link to="/find-master">Мастера</Link>
          {listing.category && <>
            <span className="ld-bread-sep">›</span>
            <Link to={`/find-master/${catSlug}`}>{listing.category}</Link>
          </>}
          <span className="ld-bread-sep">›</span>
          <span style={{color:'#555',fontWeight:500}}>{listing.title?.slice(0,35)}{listing.title?.length > 35 ? '…' : ''}</span>
        </div>
      </div>

      <div className="ld-page">
        {/* ── LEFT ── */}
        <div className="ld-left">

          {/* Title */}
          <div className="ld-title-block">
            <h1 className="ld-title">{listing.title}</h1>
            <div className="ld-actions-row">
              <button className="ld-action-btn">♡ В избранное</button>
              <button className="ld-action-btn">📝 Добавить заметку</button>
            </div>
          </div>

          {/* Gallery */}
          <div className="ld-gallery">
            <div className="ld-gallery-main" onClick={() => allPhotos.length && setLightbox(true)}>
              {allPhotos.length > 0
                ? <img src={allPhotos[activePhoto]} alt={listing.title}/>
                : <div className="ld-gallery-ph">🔧</div>
              }
              {allPhotos.length > 1 && <>
                <button className="ld-gallery-nav ld-gallery-nav-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}>‹</button>
                <button className="ld-gallery-nav ld-gallery-nav-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}>›</button>
                <span className="ld-gallery-count">{activePhoto + 1} / {allPhotos.length}</span>
              </>}
            </div>
            {allPhotos.length > 1 && (
              <div className="ld-thumbs">
                {allPhotos.map((p, i) => (
                  <div key={i} className={`ld-thumb${i === activePhoto ? ' active' : ''}`} onClick={() => setActivePhoto(i)}>
                    <img src={p} alt=""/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="ld-info-block">
            <div className="ld-info-grid">
              <div className="ld-info-row">
                <span className="ld-info-key">Формат</span>
                <span className="ld-info-val">{listing.priceUnit || 'За услугу'}</span>
              </div>
              <div className="ld-info-row">
                <span className="ld-info-key">Отклик</span>
                <span className="ld-info-val">Обычно до 30 минут</span>
              </div>
              <div className="ld-info-row">
                <span className="ld-info-key">Способ связи</span>
                <span className="ld-info-val">Через внутренний чат</span>
              </div>
              <div className="ld-info-row">
                <span className="ld-info-key">Сделка</span>
                <span className="ld-info-val">Безопасно в сервисе</span>
              </div>
              <div className="ld-info-row" style={{borderBottom:'none',paddingBottom:0}}>
                <span className="ld-info-key">Город</span>
                <span className="ld-info-val">Йошкар-Ола</span>
              </div>
              <div className="ld-info-row" style={{borderBottom:'none',paddingBottom:0}}>
                <span className="ld-info-key">Категория</span>
                <span className="ld-info-val">{listing.category || '—'}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="ld-badges-block">
            <span className="ld-badge ld-badge-green">✅ Проверен</span>
            <span className="ld-badge ld-badge-orange">⚡ Быстрый отклик</span>
            <span className="ld-badge ld-badge-blue">🛡️ Гарантия</span>
            {completed > 0 && <span className="ld-badge ld-badge-green">🏆 {completed} заказов</span>}
          </div>

          {/* Description */}
          <div className="ld-desc-block">
            <p className="ld-desc-head">Описание</p>
            {desc
              ? <>
                  <p className="ld-desc-text">{showFull ? desc : descShort}</p>
                  {desc.length > 400 && (
                    <button className="ld-desc-toggle" onClick={() => setShowFull(f => !f)}>
                      {showFull ? 'Свернуть ↑' : 'Читать полностью ↓'}
                    </button>
                  )}
                </>
              : <p className="ld-empty-desc">Описание не добавлено</p>
            }
            <div className="ld-meta-line" style={{marginTop:14}}>
              <span>📍 Йошкар-Ола</span>
              {listing.category && <span>🏷️ {listing.category}</span>}
              <span style={{marginLeft:'auto',color:'#d0d0d0'}}>ID {listing.id?.toString().slice(0,8)}</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="ld-right">

          {/* Price + CTA */}
          <div className="ld-price-panel">
            <div className="ld-price-big">{Number(listing.price || 0).toLocaleString('ru-RU')} ₽</div>
            {listing.priceUnit && <div className="ld-price-unit">{listing.priceUnit}</div>}

            {!isOwnListing && (
              <div className="ld-price-btns">
                <Link
                  to={userId ? `/chat/${listing.workerId}` : '/login'}
                  className="ld-btn-msg"
                >
                  💬 Написать мастеру
                </Link>

                {accepted ? (
                  <div className="ld-success-banner">
                    🕐 Заявка отправлена мастеру
                  </div>
                ) : (
                  <button className="ld-btn-accept" onClick={handleAcceptWork} disabled={accepting}>
                    {accepting ? '⏳ Отправляем…' : '✔ Принять работу'}
                  </button>
                )}

                {accepted && (
                  <div className="ld-pending-banner">
                    ℹ️ Сделка создана и ждёт подтверждения мастера. Как только мастер примет — она станет активной. Вы можете следить за статусом в разделе «Мои сделки».
                  </div>
                )}

                {actionError && <div className="ld-error-msg">{actionError}</div>}

                {accepted && (
                  <button
                    onClick={() => navigate('/deals')}
                    style={{background:'none',border:'none',color:'#e8410a',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',textAlign:'center'}}
                  >
                    Перейти к сделкам →
                  </button>
                )}
              </div>
            )}

            {isOwnListing && (
              <div style={{marginTop:12,padding:'10px 12px',background:'#f8f9fa',borderRadius:8,fontSize:13,color:'#666',textAlign:'center'}}>
                Это ваше объявление
              </div>
            )}
          </div>

          {/* Seller */}
          <div className="ld-seller">
            <div className="ld-seller-top">
              <div className="ld-seller-ava">
                {listing.workerAvatar?.length > 10
                  ? <img src={listing.workerAvatar} alt={workerName}/>
                  : initials
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div className="ld-seller-name">
                  <Link to={`/workers/${listing.workerId}`}>{workerName}</Link>
                </div>
                <div className="ld-seller-since">На платформе с 2024 года</div>
                {rating > 0 && (
                  <div className="ld-seller-stars">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className="ld-star" style={{color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}}>★</span>
                    ))}
                    <span style={{fontSize:12,color:'#555',fontWeight:600,marginLeft:3}}>{Number(rating).toFixed(1)}</span>
                    {reviews > 0 && <span style={{fontSize:11,color:'#aaa',marginLeft:3}}>({reviews})</span>}
                  </div>
                )}
                <div className="ld-seller-verify">✅ Документы проверены</div>
              </div>
            </div>

            <div className="ld-seller-stats">
              <div className="ld-sstat">
                <span className="ld-sstat-num">{completed || 0}</span>
                <span className="ld-sstat-lbl">Заказов</span>
              </div>
              <div className="ld-sstat">
                <span className="ld-sstat-num">{rating > 0 ? Number(rating).toFixed(1) : '—'}</span>
                <span className="ld-sstat-lbl">Рейтинг</span>
              </div>
              <div className="ld-sstat">
                <span className="ld-sstat-num">{reviews}</span>
                <span className="ld-sstat-lbl">Отзывов</span>
              </div>
            </div>

            <div className="ld-seller-footer">
              <Link to={`/workers/${listing.workerId}`} className="ld-seller-link">
                Профиль мастера →
              </Link>
            </div>
          </div>

          {/* Similar */}
          {similar.length > 0 && (
            <div className="ld-similar">
              <div className="ld-similar-head">
                Похожие объявления
                <Link to={`/find-master/${catSlug}`}>Все →</Link>
              </div>
              <div className="ld-similar-list">
                {similar.map(s => {
                  const sSlug = CAT_SLUGS[s.category] || '';
                  const sPhoto = s.photos?.[0] || CAT_PHOTOS[sSlug];
                  return (
                    <Link key={s.id} to={`/listings/${s.id}`} className="ld-sim-item">
                      <div className="ld-sim-img">
                        {sPhoto ? <img src={sPhoto} alt=""/> : '🔧'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="ld-sim-title">{s.title}</div>
                        <div className="ld-sim-price">{Number(s.price || 0).toLocaleString('ru-RU')} ₽</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
