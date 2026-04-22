import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { acceptListingDeal } from '../../api';

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
  .ld { font-family: Inter, Arial, sans-serif; background: #f2f3f5; min-height: 100vh; color: #111; }

  /* BREADCRUMB */
  .ld-bread { background: #fff; border-bottom: 1px solid #eaeaea; }
  .ld-bread-inner { max-width: 1180px; margin: 0 auto; padding: 11px 20px; display: flex; align-items: center; gap: 7px; font-size: 13px; color: #aaa; flex-wrap: wrap; }
  .ld-bread a { color: #888; text-decoration: none; transition: color .15s; }
  .ld-bread a:hover { color: #e8410a; }
  .ld-bread-sep { color: #ddd; }

  /* PAGE LAYOUT */
  .ld-page { max-width: 1180px; margin: 0 auto; padding: 20px 20px 64px; display: grid; grid-template-columns: 1fr 348px; gap: 20px; align-items: flex-start; }
  .ld-left { min-width: 0; display: flex; flex-direction: column; gap: 12px; }

  /* CARDS BASE */
  .ld-card { background: #fff; border-radius: 16px; border: 1px solid #eaeaea; overflow: hidden; }

  /* TITLE */
  .ld-title-block { background: #fff; border: 1px solid #e6e6e6; border-radius: 14px; padding: 22px 24px 18px; }
  .ld-title { font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.3; color: #111; letter-spacing: -0.3px; }
  .ld-actions-row { display: flex; gap: 8px; }
  .ld-action-btn { display: inline-flex; align-items: center; gap: 6px; background: #f5f5f7; border: none; border-radius: 10px; font-size: 13px; font-weight: 500; color: #555; padding: 8px 14px; cursor: pointer; font-family: inherit; transition: background .15s, color .15s; }
  .ld-action-btn:hover { background: #ececec; color: #222; }

  /* GALLERY */
  .ld-gallery-wrap { position: relative; background: #111; border-radius: 16px 16px 0 0; overflow: hidden; user-select: none; }
  .ld-gallery-main { position: relative; aspect-ratio: 16/10; background: #1a1a1a; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .ld-gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity .22s ease; image-rendering: -webkit-optimize-contrast; }
  .ld-gallery-ph { font-size: 56px; color: #555; }
  .ld-gallery-nav-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(255,255,255,.65); background: rgba(255,255,255,.9); color: #111; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 14px rgba(0,0,0,.22); z-index: 5; transition: transform .15s, background .15s; line-height: 1; }
  .ld-gallery-nav-btn:hover { transform: translateY(-50%) scale(1.06); background: #fff; }
  .ld-gallery-nav-btn.prev { left: 12px; }
  .ld-gallery-nav-btn.next { right: 12px; }

  /* кнопка открыть лайтбокс */
  .ld-gallery-zoom { position: absolute; bottom: 14px; right: 14px; z-index: 4; width: 36px; height: 36px; background: rgba(0,0,0,.48); border: 1.5px solid rgba(255,255,255,.25); border-radius: 8px; color: #fff; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: zoom-in; backdrop-filter: blur(4px); transition: background .15s; }
  .ld-gallery-zoom:hover { background: rgba(0,0,0,.68); }
  .ld-gallery-count { position: absolute; bottom: 14px; left: 14px; background: rgba(0,0,0,.48); color: #fff; font-size: 12px; font-weight: 600; padding: 5px 11px; border-radius: 20px; backdrop-filter: blur(4px); z-index: 4; pointer-events: none; }

  /* точки-индикаторы */
  .ld-gallery-dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 4; pointer-events: none; }
  .ld-gallery-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.45); transition: all .2s; }
  .ld-gallery-dot.active { background: #fff; width: 18px; border-radius: 3px; }

  /* миниатюры */
  .ld-thumbs { display: flex; gap: 8px; padding: 10px 14px; background: #f5f5f7; border-top: 1px solid #eaeaea; overflow-x: auto; scrollbar-width: none; }
  .ld-thumbs::-webkit-scrollbar { display: none; }
  .ld-thumb { width: 80px; height: 60px; border-radius: 10px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 2.5px solid transparent; transition: all .18s; opacity: .55; flex-shrink: 0; }
  .ld-thumb.active { border-color: #e8410a; opacity: 1; box-shadow: 0 0 0 3px rgba(232,65,10,.15); }
  .ld-thumb:hover { opacity: .85; transform: scale(1.04); }
  .ld-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; image-rendering: -webkit-optimize-contrast; }

  /* INFO GRID */
  .ld-info-block { background: #fff; border: 1px solid #e6e6e6; border-radius: 14px; padding: 16px; }
  .ld-info-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ececec; border-radius: 12px; overflow: hidden; background: #fff; }
  .ld-info-row { background: #fff; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid #ececec; border-bottom: 1px solid #ececec; }
  .ld-info-row:nth-child(2n) { border-right: none; }
  .ld-info-row:nth-last-child(-n+2) { border-bottom: none; }
  .ld-info-key { font-size: 11px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }
  .ld-info-val { font-size: 14px; color: #111; font-weight: 600; }

  /* BADGES */
  .ld-badges-block { background: #fff; border: 1px solid #e6e6e6; border-radius: 14px; padding: 14px 16px; display: flex; gap: 8px; flex-wrap: wrap; }
  .ld-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600; padding: 6px 12px; border-radius: 8px; }
  .ld-badge-green { background: #f0fdf4; color: #16a34a; }
  .ld-badge-orange { background: #fff7ed; color: #ea580c; }
  .ld-badge-blue { background: #eff6ff; color: #2563eb; }

  /* DESCRIPTION */
  .ld-desc-block { background: #fff; border: 1px solid #e6e6e6; border-radius: 14px; padding: 20px 24px; }
  .ld-desc-head { font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #111; }
  .ld-desc-text { font-size: 14px; color: #555; line-height: 1.8; margin: 0; white-space: pre-wrap; word-break: break-word; }
  .ld-desc-toggle { background: none; border: none; color: #e8410a; font-size: 13px; font-weight: 600; cursor: pointer; padding: 10px 0 0; font-family: inherit; transition: opacity .15s; }
  .ld-desc-toggle:hover { opacity: .75; }
  .ld-empty-desc { font-size: 14px; color: #ccc; font-style: italic; }
  .ld-meta-line { font-size: 12px; color: #c0c0c0; margin-top: 14px; display: flex; gap: 14px; flex-wrap: wrap; }

  /* RIGHT COLUMN */
  .ld-right { position: sticky; top: 72px; display: flex; flex-direction: column; gap: 12px; }

  /* PRICE PANEL */
  .ld-price-panel { background: #fff; border-radius: 16px; border: 1px solid #eaeaea; padding: 22px 22px 20px; box-shadow: 0 4px 24px rgba(0,0,0,.05); }
  .ld-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 18px; }
  .ld-price-big { font-size: 30px; font-weight: 800; color: #111; letter-spacing: -1px; }
  .ld-price-unit { font-size: 14px; color: #999; font-weight: 500; }
  .ld-price-btns { display: flex; flex-direction: column; gap: 10px; }

  /* КНОПКА: НАПИСАТЬ */
  .ld-btn-msg {
    background: #e8410a;
    border: none; border-radius: 10px;
    color: #fff; font-size: 15px; font-weight: 700;
    padding: 14px 18px; cursor: pointer;
    font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    text-decoration: none;
    letter-spacing: .01em;
    box-shadow: 0 3px 14px rgba(232,65,10,.30);
    transition: background .15s, transform .15s, box-shadow .15s;
  }
  .ld-btn-msg:hover { background: #d03a09; transform: translateY(-1px); box-shadow: 0 5px 18px rgba(232,65,10,.36); }
  .ld-btn-msg:active { transform: translateY(0); }

  /* КНОПКА: ПРИНЯТЬ */
  .ld-btn-accept {
    background: #fff;
    border: 1.5px solid #e8410a; border-radius: 10px;
    color: #e8410a; font-size: 15px; font-weight: 700;
    padding: 13px 18px; cursor: pointer;
    font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    letter-spacing: .01em;
    transition: background .15s, transform .15s;
  }
  .ld-btn-accept:hover { background: #fff4f1; transform: translateY(-1px); }
  .ld-btn-accept:active { transform: translateY(0); }
  .ld-btn-accept:disabled { opacity: .5; cursor: not-allowed; }

  /* BANNERS */
  .ld-success-banner { background: linear-gradient(135deg,#f0fdf4,#dcfce7); border: 1px solid #86efac; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #15803d; font-weight: 600; display: flex; gap: 8px; align-items: center; }
  .ld-pending-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 14px; font-size: 12.5px; color: #92400e; line-height: 1.55; }
  .ld-error-msg { font-size: 12px; color: #ef4444; font-weight: 600; padding: 2px 0; }
  .ld-deals-link { display: block; text-align: center; font-size: 13px; color: #e8410a; font-weight: 600; background: none; border: none; cursor: pointer; font-family: inherit; padding: 2px 0; transition: opacity .15s; }
  .ld-deals-link:hover { opacity: .75; }

  /* SELLER */
  .ld-seller { background: #fff; border-radius: 16px; border: 1px solid #eaeaea; overflow: hidden; }
  .ld-seller-top { padding: 18px 18px 14px; display: flex; align-items: flex-start; gap: 14px; }
  .ld-seller-ava { width: 54px; height: 54px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg,#e8410a,#ff8c55); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 800; box-shadow: 0 4px 12px rgba(232,65,10,.25); }
  .ld-seller-ava img { width: 100%; height: 100%; object-fit: cover; }
  .ld-seller-name { font-size: 15px; font-weight: 700; margin: 0 0 3px; color: #111; }
  .ld-seller-name a { color: inherit; text-decoration: none; }
  .ld-seller-name a:hover { color: #e8410a; }
  .ld-seller-since { font-size: 12px; color: #aaa; margin-bottom: 6px; }
  .ld-seller-verify { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: #16a34a; font-weight: 600; background: #f0fdf4; border-radius: 6px; padding: 3px 8px; }
  .ld-seller-stars { display: flex; align-items: center; gap: 2px; margin-bottom: 6px; }
  .ld-star { font-size: 12px; }
  .ld-seller-stats { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #f4f4f4; }
  .ld-sstat { text-align: center; padding: 12px 4px; border-right: 1px solid #f4f4f4; }
  .ld-sstat:last-child { border-right: none; }
  .ld-sstat-num { font-size: 18px; font-weight: 800; color: #111; display: block; line-height: 1; }
  .ld-sstat-lbl { font-size: 10px; color: #bbb; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin-top: 4px; display: block; }
  .ld-seller-footer { border-top: 1px solid #f4f4f4; padding: 12px 18px; }
  .ld-seller-link { font-size: 13px; color: #e8410a; font-weight: 600; text-decoration: none; display: block; text-align: center; transition: opacity .15s; }
  .ld-seller-link:hover { opacity: .75; }

  /* SIMILAR */
  .ld-similar { background: #fff; border-radius: 16px; border: 1px solid #eaeaea; padding: 16px 18px; }
  .ld-similar-head { font-size: 14px; font-weight: 700; margin: 0 0 12px; color: #111; display: flex; align-items: center; justify-content: space-between; }
  .ld-similar-head a { font-size: 12px; color: #e8410a; text-decoration: none; font-weight: 600; }
  .ld-similar-list { display: flex; flex-direction: column; gap: 2px; }
  .ld-sim-item { display: flex; gap: 12px; text-decoration: none; color: #111; align-items: center; padding: 8px 8px; border-radius: 10px; transition: background .15s; }
  .ld-sim-item:hover { background: #f7f7f7; }
  .ld-sim-img { width: 58px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .ld-sim-img img { width: 100%; height: 100%; object-fit: cover; }
  .ld-sim-title { font-size: 13px; font-weight: 500; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; color: #333; }
  .ld-sim-price { font-size: 13px; font-weight: 700; color: #111; margin-top: 2px; }

  /* SKELETON */
  .ld-skel { background: linear-gradient(90deg,#f4f4f4 25%,#eaeaea 50%,#f4f4f4 75%); background-size: 200% 100%; animation: ld-shimmer 1.2s infinite; border-radius: 12px; }
  @keyframes ld-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* LIGHTBOX */
  .ld-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.95); z-index: 9999; display: flex; align-items: center; justify-content: center; }
  .ld-lightbox-img-wrap { position: relative; max-width: 92vw; max-height: 92vh; display: flex; align-items: center; justify-content: center; }
  .ld-lightbox img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 6px; display: block; image-rendering: -webkit-optimize-contrast; box-shadow: 0 24px 80px rgba(0,0,0,.6); }

  /* зоны клика в лайтбоксе */
  .ld-lb-zone { position: absolute; top: 0; bottom: 0; width: 50%; cursor: pointer; z-index: 2; }
  .ld-lb-zone-prev { left: -60px; width: calc(50% + 60px); }
  .ld-lb-zone-next { right: -60px; width: calc(50% + 60px); }

  /* кнопки лайтбокса */
  .ld-lb-close { position: fixed; top: 20px; right: 20px; background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.2); border-radius: 10px; width: 42px; height: 42px; color: #fff; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; z-index: 10; font-weight: 300; }
  .ld-lb-close:hover { background: rgba(255,255,255,.2); }
  .ld-lb-nav { position: fixed; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.18); border-radius: 50%; width: 52px; height: 52px; color: #fff; font-size: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, transform .15s; z-index: 10; line-height: 1; }
  .ld-lb-nav:hover { background: rgba(255,255,255,.2); transform: translateY(-50%) scale(1.06); }
  .ld-lb-prev { left: 20px; }
  .ld-lb-next { right: 20px; }
  .ld-lb-counter { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.7); font-size: 14px; font-weight: 600; background: rgba(255,255,255,.1); padding: 5px 16px; border-radius: 20px; z-index: 10; }
  .ld-lb-hint { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.35); font-size: 12px; white-space: nowrap; pointer-events: none; }

  @media(max-width:900px) { .ld-page { grid-template-columns: 1fr; } .ld-right { position: static; } .ld-info-grid { grid-template-columns: 1fr; } .ld-info-row { border-right: none; } .ld-info-row:nth-last-child(-n+2) { border-bottom: 1px solid #ececec; } .ld-info-row:last-child { border-bottom: none; } }
  @media(max-width:580px) { .ld-page { padding: 12px 12px 48px; } .ld-title { font-size: 19px; } .ld-price-big { font-size: 26px; } .ld-title-block,.ld-info-block,.ld-desc-block { padding-left: 16px; padding-right: 16px; } }
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
    if (allPhotos.length <= 1) return;
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
        <div className="ld-lightbox">
          <button className="ld-lb-close" onClick={() => setLightbox(false)}>✕</button>

          {allPhotos.length > 1 && <>
            <button className="ld-lb-nav ld-lb-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}>‹</button>
            <button className="ld-lb-nav ld-lb-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}>›</button>
          </>}

          <div className="ld-lightbox-img-wrap">
            {/* Зоны клика по половинам */}
            {allPhotos.length > 1 && <>
              <div className="ld-lb-zone ld-lb-zone-prev" onClick={prevPhoto}/>
              <div className="ld-lb-zone ld-lb-zone-next" onClick={nextPhoto}/>
            </>}
            <img
              src={allPhotos[activePhoto]}
              alt={listing?.title || ''}
              onClick={() => allPhotos.length <= 1 && setLightbox(false)}
            />
          </div>

          {allPhotos.length > 1 && <div className="ld-lb-counter">{activePhoto + 1} / {allPhotos.length}</div>}
          <div className="ld-lb-hint">← → клавиши или клик по краям · Esc — закрыть</div>
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
          <div className="ld-card" style={{overflow:'hidden'}}>
            <div className="ld-gallery-wrap">
              <div className="ld-gallery-main" onClick={() => allPhotos.length && setLightbox(true)}>
                {allPhotos.length > 0
                  ? <img src={allPhotos[activePhoto]} alt={listing.title} key={activePhoto}/>
                  : <div className="ld-gallery-ph">🔧</div>
                }

                {allPhotos.length > 1 && <>
                  <button className="ld-gallery-nav-btn prev" onClick={e => { e.stopPropagation(); prevPhoto(); }} aria-label="Предыдущее фото">‹</button>
                  <button className="ld-gallery-nav-btn next" onClick={e => { e.stopPropagation(); nextPhoto(); }} aria-label="Следующее фото">›</button>
                </>}

                {/* Кнопка открыть */}
                {allPhotos.length > 0 && (
                  <div className="ld-gallery-zoom" onClick={() => setLightbox(true)} title="Открыть полноэкранно">⤢</div>
                )}

                {/* Точки-индикаторы */}
                {allPhotos.length > 1 && allPhotos.length <= 8 && (
                  <div className="ld-gallery-dots">
                    {allPhotos.map((_, i) => (
                      <div key={i} className={`ld-gallery-dot${i === activePhoto ? ' active' : ''}`}/>
                    ))}
                  </div>
                )}

                {/* Счётчик если много фото */}
                {allPhotos.length > 8 && (
                  <div className="ld-gallery-count">{activePhoto + 1} / {allPhotos.length}</div>
                )}
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
              <div className="ld-info-row">
                <span className="ld-info-key">Город</span>
                <span className="ld-info-val">Йошкар-Ола</span>
              </div>
              <div className="ld-info-row">
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
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="ld-right">

          {/* Price + CTA */}
          <div className="ld-price-panel">
            <div className="ld-price-row">
              <span className="ld-price-big">{Number(listing.price || 0).toLocaleString('ru-RU')} ₽</span>
              {listing.priceUnit && <span className="ld-price-unit">{listing.priceUnit}</span>}
            </div>

            {!isOwnListing && (
              <div className="ld-price-btns">
                <Link
                  to={userId ? `/chat/${listing.workerId}` : '/login'}
                  className="ld-btn-msg"
                >
                  Написать мастеру
                </Link>

                {accepted ? (
                  <div className="ld-success-banner">
                    🕐 Заявка отправлена мастеру
                  </div>
                ) : (
                  <button className="ld-btn-accept" onClick={handleAcceptWork} disabled={accepting}>
                    {accepting ? 'Отправляем…' : 'Принять работу'}
                  </button>
                )}

                {accepted && (
                  <div className="ld-pending-banner">
                    ℹ️ Сделка создана и ждёт подтверждения мастера. Как только мастер примет — она станет активной. Вы можете следить за статусом в разделе «Мои сделки».
                  </div>
                )}

                {actionError && <div className="ld-error-msg">{actionError}</div>}

                {accepted && (
                  <button className="ld-deals-link" onClick={() => navigate('/deals')}>
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
