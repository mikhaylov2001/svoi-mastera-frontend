import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const CAT_PHOTOS = {
  'remont-kvartir':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'santehnika':           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'elektrika':            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
  'uborka':               'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&q=80',
  'parikhmaher':          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'manikur':              'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
  'krasota-i-zdorovie':   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
  'repetitorstvo':        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
};

const CAT_SLUGS = {
  'Ремонт квартир': 'remont-kvartir', 'Сантехника': 'santehnika',
  'Электрика': 'elektrika', 'Уборка': 'uborka', 'Парикмахер': 'parikhmaher',
  'Маникюр и педикюр': 'manikur', 'Красота и здоровье': 'krasota-i-zdorovie',
  'Репетиторство': 'repetitorstvo', 'Компьютерная помощь': 'kompyuternaya-pomosh',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
  .ld * { box-sizing: border-box; }
  .ld { font-family: Manrope, Arial, sans-serif; background: #fff; min-height: 100vh; color: #1a1a1a; }

  /* BREADCRUMB */
  .ld-bread { background: #fff; border-bottom: 1px solid #e8e8e8; }
  .ld-bread-inner { max-width: 1200px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #888; flex-wrap: wrap; }
  .ld-bread a { color: #888; text-decoration: none; } .ld-bread a:hover { color: #e8410a; }
  .ld-bread-sep { color: #ccc; }

  /* LAYOUT */
  .ld-wrap { max-width: 1200px; margin: 0 auto; padding: 20px 16px 60px; display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 20px; align-items: flex-start; }

  /* MAIN */
  .ld-main {}

  /* GALLERY */
  .ld-gallery { background: #fff; border-radius: 12px; overflow: hidden; margin-bottom: 12px; border: 1px solid #e8e8e8; }
  .ld-gallery-main { position: relative; aspect-ratio: 4/3; background: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: zoom-in; }
  .ld-gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .ld-gallery-main:hover img { transform: scale(1.02); }
  .ld-gallery-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border: none; border-radius: 50%; background: rgba(0,0,0,.45); color: #fff; font-size: 26px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 3; backdrop-filter: blur(4px); }
  .ld-gallery-nav:hover { background: rgba(0,0,0,.62); }
  .ld-gallery-nav-prev { left: 12px; }
  .ld-gallery-nav-next { right: 12px; }
  .ld-gallery-main-ph { font-size: 64px; color: #ddd; }
  .ld-gallery-count { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,.55); color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .ld-gallery-cat { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,.55); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 5px; letter-spacing: .03em; }
  .ld-thumbs { display: flex; gap: 8px; padding: 10px; overflow-x: auto; }
  .ld-thumb { width: 72px; height: 54px; border-radius: 7px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 2px solid transparent; transition: border-color .15s; }
  .ld-thumb.active { border-color: #e8410a; }
  .ld-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* CARD */
  .ld-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 20px 22px; margin-bottom: 12px; }
  .ld-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
  .ld-price { font-size: 28px; font-weight: 900; color: #1a1a1a; letter-spacing: -.5px; }
  .ld-price-unit { font-size: 14px; color: #888; font-weight: 500; }
  .ld-title { font-size: 20px; font-weight: 800; margin: 0 0 10px; line-height: 1.25; letter-spacing: -.2px; }
  .ld-meta-row { display: flex; align-items: center; gap: 16px; font-size: 13px; color: #888; margin-bottom: 0; flex-wrap: wrap; }
  .ld-meta-item { display: flex; align-items: center; gap: 4px; }
  .ld-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-top: 14px; }
  .ld-fact { border-top: 1px solid #f2f2f2; padding-top: 10px; }
  .ld-fact-k { font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 700; letter-spacing: .04em; margin-bottom: 3px; }
  .ld-fact-v { font-size: 13px; color: #1f2937; font-weight: 700; }

  /* BADGES */
  .ld-badges { display: flex; gap: 8px; flex-wrap: wrap; padding: 14px 22px; background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; margin-bottom: 12px; }
  .ld-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 20px; }
  .ld-badge-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .ld-badge-orange { background: #fff3f0; color: #e8410a; border: 1px solid #fecab5; }
  .ld-badge-blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

  /* DESC */
  .ld-desc-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 20px 22px; margin-bottom: 12px; }
  .ld-desc-title { font-size: 15px; font-weight: 800; margin: 0 0 12px; }
  .ld-desc-text { font-size: 14px; color: #444; line-height: 1.7; margin: 0; white-space: pre-wrap; word-break: break-word; }
  .ld-desc-more { background: none; border: none; color: #e8410a; font-size: 13px; font-weight: 700; cursor: pointer; padding: 8px 0 0; font-family: inherit; }

  /* SIDE */
  .ld-side { position: sticky; top: 72px; display: flex; flex-direction: column; gap: 12px; }

  /* WORKER CARD */
  .ld-worker-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; overflow: hidden; }
  .ld-worker-top { padding: 18px 18px 14px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid #f0f0f0; }
  .ld-worker-ava { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg,#e8410a,#ff7043); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 800; }
  .ld-worker-ava img { width: 100%; height: 100%; object-fit: cover; }
  .ld-worker-name { font-size: 15px; font-weight: 800; margin: 0 0 3px; color: #1a1a1a; }
  .ld-worker-name a { color: inherit; text-decoration: none; }
  .ld-worker-name a:hover { color: #e8410a; }
  .ld-worker-stars { display: flex; align-items: center; gap: 4px; font-size: 13px; }
  .ld-worker-star { color: #f59e0b; font-size: 14px; }
  .ld-worker-rating { font-weight: 800; color: #1a1a1a; }
  .ld-worker-reviews { color: #888; font-size: 12px; }
  .ld-worker-stats { display: grid; grid-template-columns: repeat(3,1fr); padding: 12px 18px; gap: 0; }
  .ld-wstat { text-align: center; padding: 6px 4px; border-right: 1px solid #f0f0f0; }
  .ld-wstat:last-child { border-right: none; }
  .ld-wstat-num { font-size: 17px; font-weight: 900; color: #1a1a1a; display: block; line-height: 1; }
  .ld-wstat-lbl { font-size: 10px; color: #aaa; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-top: 3px; display: block; }
  .ld-worker-btns { padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; }
  .ld-btn-primary { background: #e8410a; border: none; border-radius: 9px; color: #fff; font-size: 15px; font-weight: 800; padding: 13px; cursor: pointer; font-family: inherit; transition: background .15s; display: flex; align-items: center; justify-content: center; gap: 7px; text-decoration: none; }
  .ld-btn-primary:hover { background: #d03a09; }
  .ld-btn-outline { background: #fff; border: 2px solid #e8410a; border-radius: 9px; color: #e8410a; font-size: 15px; font-weight: 800; padding: 12px; cursor: pointer; font-family: inherit; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 7px; text-decoration: none; }
  .ld-btn-outline:hover { background: #fff3f0; }
  .ld-side-note { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #64748b; line-height: 1.5; }

  /* SIMILAR */
  .ld-similar { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 16px; }
  .ld-similar-title { font-size: 13px; font-weight: 800; color: #aaa; text-transform: uppercase; letter-spacing: .07em; margin: 0 0 12px; }
  .ld-similar-list { display: flex; flex-direction: column; gap: 10px; }
  .ld-sim-item { display: flex; gap: 10px; text-decoration: none; color: #1a1a1a; align-items: center; transition: background .15s; border-radius: 8px; padding: 4px; }
  .ld-sim-item:hover { background: #f8f8f8; }
  .ld-sim-img { width: 52px; height: 40px; border-radius: 7px; overflow: hidden; flex-shrink: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .ld-sim-img img { width: 100%; height: 100%; object-fit: cover; }
  .ld-sim-title { font-size: 13px; font-weight: 600; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
  .ld-sim-price { font-size: 13px; font-weight: 800; color: #1a1a1a; margin-top: 2px; }

  /* SKELETON */
  .ld-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 8px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* LIGHTBOX */
  .ld-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
  .ld-lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px; }
  .ld-lightbox-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,.15); border: none; border-radius: 50%; width: 40px; height: 40px; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .ld-lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.14); border: none; border-radius: 999px; width: 44px; height: 44px; color: #fff; font-size: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .ld-lightbox-prev { left: 20px; }
  .ld-lightbox-next { right: 20px; }
  .ld-lightbox-counter { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 13px; font-weight: 700; background: rgba(255,255,255,.14); border-radius: 999px; padding: 6px 12px; }

  @media(max-width:900px) { .ld-wrap { grid-template-columns: 1fr; } .ld-side { position: static; } .ld-facts { grid-template-columns: 1fr; } }
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

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/listings/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setListing(data);
        setActivePhoto(0);
        // Load worker stats
        if (data.workerId) {
          fetch(`${API}/workers/${data.workerId}/stats`)
            .then(r => r.ok ? r.json() : null)
            .then(s => setStats(s)).catch(() => {});
        }
        // Load similar listings
        fetch(`${API}/listings`)
          .then(r => r.ok ? r.json() : [])
          .then(all => {
            const sim = (Array.isArray(all) ? all : [])
              .filter(l => l.active && l.id !== data.id && l.category === data.category)
              .slice(0, 4);
            setSimilar(sim);
          }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const photos = listing?.photos?.length ? listing.photos : [];
  const catSlug = CAT_SLUGS[listing?.category] || '';
  const fallbackPhoto = CAT_PHOTOS[catSlug];
  const allPhotos = photos.length ? photos : (fallbackPhoto ? [fallbackPhoto] : []);

  const nextPhoto = () => {
    setActivePhoto((i) => (allPhotos.length > 1 ? (i + 1) % allPhotos.length : i));
  };

  const prevPhoto = () => {
    setActivePhoto((i) => (allPhotos.length > 1 ? (i - 1 + allPhotos.length) % allPhotos.length : i));
  };

  useEffect(() => {
    if (!lightbox || allPhotos.length <= 1) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setActivePhoto((i) => (i + 1) % allPhotos.length);
      if (e.key === 'ArrowLeft') setActivePhoto((i) => (i - 1 + allPhotos.length) % allPhotos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, allPhotos.length]);

  if (loading) return (
    <div className="ld"><style>{css}</style>
      <div className="ld-wrap">
        <div>
          <div className="ld-skeleton" style={{height:360,marginBottom:12}}/>
          <div className="ld-card">
            <div className="ld-skeleton" style={{height:32,width:'40%',marginBottom:12}}/>
            <div className="ld-skeleton" style={{height:24,width:'70%',marginBottom:8}}/>
            <div className="ld-skeleton" style={{height:16,width:'50%'}}/>
          </div>
        </div>
        <div>
          <div className="ld-skeleton" style={{height:280}}/>
        </div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="ld"><style>{css}</style>
      <div style={{textAlign:'center',padding:'80px 24px'}}>
        <div style={{fontSize:48,marginBottom:16}}>😕</div>
        <h2 style={{fontSize:20,fontWeight:800,marginBottom:8}}>Объявление не найдено</h2>
        <Link to="/find-master" style={{color:'#e8410a',fontWeight:700}}>← Вернуться к поиску</Link>
      </div>
    </div>
  );

  const workerName = [listing.workerName, listing.workerLastName].filter(Boolean).join(' ') || 'Мастер';
  const initials = (listing.workerName||'М')[0].toUpperCase();

  const desc = listing.description || '';
  const descShort = desc.length > 300 ? desc.slice(0, 300) + '...' : desc;

  const rating = stats?.averageRating || listing.workerRating || 0;
  const reviews = stats?.reviewCount || 0;
  const completed = stats?.completedWorksCount || 0;

  return (
    <div className="ld">
      <style>{css}</style>

      {/* Lightbox */}
      {lightbox && allPhotos.length > 0 && (
        <div className="ld-lightbox" onClick={() => setLightbox(false)}>
          <button className="ld-lightbox-close" onClick={() => setLightbox(false)}>✕</button>
          {allPhotos.length > 1 && (
            <>
              <button className="ld-lightbox-nav ld-lightbox-prev" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}>‹</button>
              <button className="ld-lightbox-nav ld-lightbox-next" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}>›</button>
            </>
          )}
          <img src={allPhotos[activePhoto]} alt="" onClick={e => e.stopPropagation()}/>
          {allPhotos.length > 1 && (
            <div className="ld-lightbox-counter">{activePhoto + 1} / {allPhotos.length}</div>
          )}
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
          <span style={{color:'#1a1a1a',fontWeight:600}}>{listing.title?.slice(0,40)}{listing.title?.length>40?'...':''}</span>
        </div>
      </div>

      <div className="ld-wrap">
        {/* ── MAIN ── */}
        <div className="ld-main">

          {/* Gallery */}
          <div className="ld-gallery">
            <div className="ld-gallery-main" onClick={() => allPhotos.length && setLightbox(true)}>
              {allPhotos.length > 0
                ? <img src={allPhotos[activePhoto]} alt={listing.title}/>
                : <div className="ld-gallery-main-ph">🔧</div>
              }
              {allPhotos.length > 1 && (
                <>
                  <button className="ld-gallery-nav ld-gallery-nav-prev" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}>‹</button>
                  <button className="ld-gallery-nav ld-gallery-nav-next" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}>›</button>
                </>
              )}
              {listing.category && <span className="ld-gallery-cat">{listing.category}</span>}
              {allPhotos.length > 1 && (
                <span className="ld-gallery-count">{activePhoto+1} / {allPhotos.length}</span>
              )}
            </div>
            {allPhotos.length > 1 && (
              <div className="ld-thumbs">
                {allPhotos.map((p, i) => (
                  <div key={i} className={`ld-thumb${i===activePhoto?' active':''}`} onClick={() => setActivePhoto(i)}>
                    <img src={p} alt=""/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price + Title */}
          <div className="ld-card">
            <div className="ld-price-row">
              <span className="ld-price">{Number(listing.price||0).toLocaleString('ru-RU')} ₽</span>
              {listing.priceUnit && <span className="ld-price-unit">{listing.priceUnit}</span>}
            </div>
            <h1 className="ld-title">{listing.title}</h1>
            <div className="ld-meta-row">
              <span className="ld-meta-item">📍 Йошкар-Ола</span>
              {listing.category && <span className="ld-meta-item">🏷️ {listing.category}</span>}
              <span className="ld-meta-item" style={{marginLeft:'auto',color:'#bbb',fontSize:12}}>
                ID {listing.id}
              </span>
            </div>
            <div className="ld-facts">
              <div className="ld-fact">
                <div className="ld-fact-k">Формат</div>
                <div className="ld-fact-v">{listing.priceUnit || 'За услугу'}</div>
              </div>
              <div className="ld-fact">
                <div className="ld-fact-k">Отклик</div>
                <div className="ld-fact-v">Обычно до 30 минут</div>
              </div>
              <div className="ld-fact">
                <div className="ld-fact-k">Способ связи</div>
                <div className="ld-fact-v">Через внутренний чат</div>
              </div>
              <div className="ld-fact">
                <div className="ld-fact-k">Сделка</div>
                <div className="ld-fact-v">Безопасно в сервисе</div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="ld-badges">
            <span className="ld-badge ld-badge-green">✅ Проверен</span>
            <span className="ld-badge ld-badge-orange">⚡ Быстрый отклик</span>
            <span className="ld-badge ld-badge-blue">🛡️ Гарантия</span>
            {completed > 0 && <span className="ld-badge ld-badge-green">🏆 {completed} заказов</span>}
          </div>

          {/* Description */}
          {desc && (
            <div className="ld-desc-card">
              <p className="ld-desc-title">Описание</p>
              <p className="ld-desc-text">{showFull ? desc : descShort}</p>
              {desc.length > 300 && (
                <button className="ld-desc-more" onClick={() => setShowFull(f => !f)}>
                  {showFull ? 'Свернуть ↑' : 'Читать полностью ↓'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── SIDE ── */}
        <div className="ld-side">

          {/* Worker card */}
          <div className="ld-worker-card">
            <div className="ld-worker-top">
              <div className="ld-worker-ava">
                {listing.workerAvatar?.length > 10
                  ? <img src={listing.workerAvatar} alt={workerName}/>
                  : initials
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div className="ld-worker-name">
                  <Link to={`/workers/${listing.workerId}`}>{workerName}</Link>
                </div>
                <div className="ld-worker-stars">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="ld-worker-star" style={{color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}}>★</span>
                  ))}
                  {rating > 0 && <span className="ld-worker-rating">{Number(rating).toFixed(1)}</span>}
                  {reviews > 0 && <span className="ld-worker-reviews">({reviews} отзывов)</span>}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="ld-worker-stats">
              <div className="ld-wstat">
                <span className="ld-wstat-num">{completed || 0}</span>
                <span className="ld-wstat-lbl">Заказов</span>
              </div>
              <div className="ld-wstat">
                <span className="ld-wstat-num">{rating > 0 ? Number(rating).toFixed(1) : '—'}</span>
                <span className="ld-wstat-lbl">Рейтинг</span>
              </div>
              <div className="ld-wstat">
                <span className="ld-wstat-num">{reviews}</span>
                <span className="ld-wstat-lbl">Отзывов</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="ld-worker-btns">
              <Link
                to={userId ? `/chat/${listing.workerId}` : '/login'}
                className="ld-btn-primary"
              >
                💬 Написать мастеру
              </Link>
              <Link
                to={catSlug ? `/categories/${catSlug}` : '/categories'}
                className="ld-btn-outline"
              >
                ✅ Оставить заявку по услуге
              </Link>
              <div className="ld-side-note">
                После заявки мастер увидит задачу и сможет сразу ответить в чате.
              </div>
              <Link
                to={`/workers/${listing.workerId}`}
                style={{textAlign:'center',fontSize:13,color:'#888',fontWeight:600,textDecoration:'none',padding:'4px 0'}}
              >
                Профиль мастера →
              </Link>
            </div>
          </div>

          {/* Similar */}
          {similar.length > 0 && (
            <div className="ld-similar">
              <p className="ld-similar-title">Похожие объявления</p>
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
                        <div className="ld-sim-price">{Number(s.price||0).toLocaleString('ru-RU')} ₽</div>
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