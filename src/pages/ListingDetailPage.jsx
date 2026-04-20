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
  .ld { font-family: Manrope, Arial, sans-serif; background: #f4f4f4; min-height: 100vh; color: #141414; }

  /* BREADCRUMB */
  .ld-bread { background: #fff; border-bottom: 1px solid #e0e0e0; }
  .ld-bread-inner { max-width: 1200px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #999; flex-wrap: wrap; }
  .ld-bread a { color: #999; text-decoration: none; transition: color .12s; } .ld-bread a:hover { color: #e8410a; }
  .ld-bread-sep { color: #d9d9d9; }

  /* LAYOUT */
  .ld-wrap { max-width: 1200px; margin: 0 auto; padding: 20px 16px 60px; display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: flex-start; }

  /* GALLERY */
  .ld-gallery { background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
  .ld-gallery-main { position: relative; aspect-ratio: 4/3; background: #f5f5f5; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: zoom-in; }
  .ld-gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ld-gallery-main-ph { font-size: 64px; color: #ddd; }
  .ld-gallery-count { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,.6); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; backdrop-filter: blur(4px); }
  .ld-gallery-cat { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,.6); color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; backdrop-filter: blur(4px); }
  .ld-gallery-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.85); border: none; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
  .ld-gallery-nav:hover { background: #fff; }
  .ld-gallery-nav-left { left: 12px; }
  .ld-gallery-nav-right { right: 12px; }
  .ld-thumbs { display: flex; gap: 6px; padding: 10px 12px; overflow-x: auto; }
  .ld-thumb { width: 80px; height: 60px; border-radius: 4px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 2px solid transparent; transition: border-color .15s; opacity: .7; }
  .ld-thumb.active { border-color: #e8410a; opacity: 1; }
  .ld-thumb:hover { opacity: 1; }
  .ld-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* PRICE + TITLE */
  .ld-info { background: #fff; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px; }
  .ld-price { font-size: 32px; font-weight: 900; color: #141414; letter-spacing: -.5px; margin-bottom: 4px; }
  .ld-price-unit { font-size: 15px; color: #999; font-weight: 500; margin-left: 4px; }
  .ld-title { font-size: 22px; font-weight: 800; margin: 0 0 14px; line-height: 1.25; color: #141414; }
  .ld-meta-row { display: flex; align-items: center; gap: 14px; font-size: 13px; color: #999; flex-wrap: wrap; }
  .ld-meta-item { display: flex; align-items: center; gap: 4px; }
  .ld-meta-id { margin-left: auto; font-size: 12px; color: #ccc; }

  /* DESC */
  .ld-desc-card { background: #fff; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px; }
  .ld-desc-title { font-size: 18px; font-weight: 800; margin: 0 0 12px; color: #141414; }
  .ld-desc-text { font-size: 15px; color: #333; line-height: 1.7; margin: 0; white-space: pre-wrap; word-break: break-word; }
  .ld-desc-more { background: none; border: none; color: #e8410a; font-size: 14px; font-weight: 700; cursor: pointer; padding: 10px 0 0; font-family: inherit; }

  /* SIDE */
  .ld-side { position: sticky; top: 16px; display: flex; flex-direction: column; gap: 12px; }

  /* WORKER CARD — Avito seller style */
  .ld-worker-card { background: #fff; border-radius: 8px; overflow: hidden; }
  .ld-worker-top { padding: 20px 20px 16px; display: flex; align-items: center; gap: 14px; }
  .ld-worker-ava { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg,#e8410a,#ff7043); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 800; }
  .ld-worker-ava img { width: 100%; height: 100%; object-fit: cover; }
  .ld-worker-name { font-size: 18px; font-weight: 800; margin: 0 0 4px; color: #141414; }
  .ld-worker-name a { color: inherit; text-decoration: none; }
  .ld-worker-name a:hover { color: #e8410a; }
  .ld-worker-stars { display: flex; align-items: center; gap: 3px; }
  .ld-worker-star { font-size: 14px; }
  .ld-worker-rating { font-weight: 800; color: #141414; font-size: 14px; margin-right: 4px; }
  .ld-worker-reviews { color: #e8410a; font-size: 13px; font-weight: 600; text-decoration: none; }
  .ld-worker-reviews:hover { text-decoration: underline; }
  .ld-worker-info { padding: 0 20px 14px; font-size: 13px; color: #999; line-height: 1.7; }

  /* Stats row */
  .ld-worker-stats { display: grid; grid-template-columns: repeat(3,1fr); padding: 0 20px 16px; gap: 0; }
  .ld-wstat { text-align: center; padding: 10px 4px; border-right: 1px solid #f0f0f0; }
  .ld-wstat:last-child { border-right: none; }
  .ld-wstat-num { font-size: 18px; font-weight: 900; color: #141414; display: block; line-height: 1; }
  .ld-wstat-lbl { font-size: 10px; color: #999; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-top: 4px; display: block; }

  /* Buttons */
  .ld-worker-btns { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 8px; }
  .ld-btn-primary { background: #e8410a; border: none; border-radius: 8px; color: #fff; font-size: 16px; font-weight: 800; padding: 14px; cursor: pointer; font-family: inherit; transition: background .15s; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
  .ld-btn-primary:hover { background: #d03a09; }
  .ld-btn-outline { background: #fff; border: 2px solid #141414; border-radius: 8px; color: #141414; font-size: 16px; font-weight: 800; padding: 12px; cursor: pointer; font-family: inherit; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
  .ld-btn-outline:hover { border-color: #e8410a; color: #e8410a; }
  .ld-profile-link { display: block; text-align: center; font-size: 14px; color: #999; font-weight: 600; text-decoration: none; padding: 6px 0; transition: color .12s; }
  .ld-profile-link:hover { color: #e8410a; }

  /* SIMILAR */
  .ld-similar { background: #fff; border-radius: 8px; padding: 18px 20px; }
  .ld-similar-title { font-size: 18px; font-weight: 800; color: #141414; margin: 0 0 14px; }
  .ld-similar-list { display: flex; flex-direction: column; gap: 10px; }
  .ld-sim-item { display: flex; gap: 10px; text-decoration: none; color: #141414; align-items: center; transition: background .12s; border-radius: 6px; padding: 6px; }
  .ld-sim-item:hover { background: #f8f8f8; }
  .ld-sim-img { width: 64px; height: 48px; border-radius: 4px; overflow: hidden; flex-shrink: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .ld-sim-img img { width: 100%; height: 100%; object-fit: cover; }
  .ld-sim-title { font-size: 13px; font-weight: 600; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; color: #333; }
  .ld-sim-price { font-size: 14px; font-weight: 800; color: #141414; margin-top: 2px; }

  /* SKELETON */
  .ld-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 8px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* LIGHTBOX */
  .ld-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
  .ld-lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 4px; }
  .ld-lightbox-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,.15); border: none; border-radius: 50%; width: 40px; height: 40px; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; }
  .ld-lightbox-close:hover { background: rgba(255,255,255,.3); }

  @media(max-width:900px) { .ld-wrap { grid-template-columns: 1fr; } .ld-side { position: static; } }
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

  const photos = listing.photos?.length ? listing.photos : [];
  const catSlug = CAT_SLUGS[listing.category] || '';
  const fallbackPhoto = CAT_PHOTOS[catSlug];
  const allPhotos = photos.length ? photos : (fallbackPhoto ? [fallbackPhoto] : []);

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
          <img src={allPhotos[activePhoto]} alt="" onClick={e => e.stopPropagation()}/>
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
              {listing.category && <span className="ld-gallery-cat">{listing.category}</span>}
              {allPhotos.length > 1 && (
                <span className="ld-gallery-count">{activePhoto+1} / {allPhotos.length}</span>
              )}
              {allPhotos.length > 1 && (
                <>
                  <button className="ld-gallery-nav ld-gallery-nav-left" onClick={e => { e.stopPropagation(); setActivePhoto(i => i > 0 ? i-1 : allPhotos.length-1); }}>‹</button>
                  <button className="ld-gallery-nav ld-gallery-nav-right" onClick={e => { e.stopPropagation(); setActivePhoto(i => i < allPhotos.length-1 ? i+1 : 0); }}>›</button>
                </>
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

          {/* Price + Title — Avito style */}
          <div className="ld-info">
            <div className="ld-price">
              {Number(listing.price||0).toLocaleString('ru-RU')} ₽
              {listing.priceUnit && <span className="ld-price-unit">{listing.priceUnit}</span>}
            </div>
            <h1 className="ld-title">{listing.title}</h1>
            <div className="ld-meta-row">
              <span className="ld-meta-item">📍 Йошкар-Ола</span>
              {listing.category && <span className="ld-meta-item">🏷️ {listing.category}</span>}
              <span className="ld-meta-id">ID {listing.id}</span>
            </div>
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

          {/* Worker card — Avito seller style */}
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
                  {rating > 0 && <span className="ld-worker-rating">{Number(rating).toFixed(1)}</span>}
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="ld-worker-star" style={{color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}}>★</span>
                  ))}
                  {reviews > 0 && <>&nbsp;<Link to={`/workers/${listing.workerId}`} className="ld-worker-reviews">{reviews} {reviews === 1 ? 'отзыв' : reviews < 5 ? 'отзыва' : 'отзывов'}</Link></>}
                </div>
              </div>
            </div>

            <div className="ld-worker-info">
              Частное лицо · На СвоиМастера
              {completed > 0 && <> · {completed} {completed === 1 ? 'заказ' : completed < 5 ? 'заказа' : 'заказов'} выполнено</>}
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
                📋 Разместить заявку
              </Link>
              <Link
                to={`/workers/${listing.workerId}`}
                className="ld-profile-link"
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