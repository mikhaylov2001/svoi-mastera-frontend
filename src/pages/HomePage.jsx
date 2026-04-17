import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SECTIONS } from './SectionsPage';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';
const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

const CAT_PHOTOS = {
  'remont-kvartir':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  'santehnika':           'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
  'elektrika':            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
  'uborka':               'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
  'parikhmaher':          'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=80',
  'manikur':              'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
  'krasota-i-zdorovie':   'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
  'repetitorstvo':        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
};

const CAT_EMOJIS = {
  'remont-kvartir':'🏠','santehnika':'🔧','elektrika':'⚡','uborka':'🧹',
  'parikhmaher':'💇','manikur':'💅','krasota-i-zdorovie':'✨',
  'repetitorstvo':'📚','kompyuternaya-pomosh':'💻',
};

const css = `
  .hp { background: #f7f8fa; min-height: 100vh; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }

  /* ── ПОИСК ── */
  .hp-search-bar { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 14px 0; }
  .hp-search-inner { max-width: 1200px; margin: 0 auto; padding: 0 16px; display: flex; gap: 10px; align-items: center; }
  .hp-search-box { flex: 1; display: flex; align-items: center; gap: 10px; background: #f5f5f5; border: 1.5px solid transparent; border-radius: 8px; padding: 0 16px; transition: all .15s; }
  .hp-search-box:focus-within { background: #fff; border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08); }
  .hp-search-box input { flex: 1; border: none; background: none; font-size: 15px; padding: 12px 0; outline: none; font-family: Arial, sans-serif; color: #1a1a1a; }
  .hp-search-box input::placeholder { color: #9ca3af; }
  .hp-search-btn { background: #e8410a; border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 700; padding: 12px 24px; cursor: pointer; white-space: nowrap; }
  .hp-search-btn:hover { background: #d03a09; }
  .hp-location { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #374151; white-space: nowrap; font-weight: 600; }

  /* ── СЕТКА ── */
  .hp-layout { max-width: 1200px; margin: 0 auto; padding: 20px 16px 60px; display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }
  .hp-main {}
  .hp-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 72px; }

  /* ── КАТЕГОРИИ-ПЛИТКИ ── */
  .hp-cats-title { font-size: 18px; font-weight: 800; margin: 0 0 14px; color: #1a1a1a; }
  .hp-cats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
  .hp-cat-tile { border-radius: 10px; overflow: hidden; text-decoration: none; color: #fff; position: relative; aspect-ratio: 1; display: flex; flex-direction: column; justify-content: flex-end; transition: transform .18s, box-shadow .18s; }
  .hp-cat-tile:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.2); }
  .hp-cat-tile-img { position: absolute; inset: 0; background-size: cover; background-position: center; }
  .hp-cat-tile-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,.15) 60%, transparent 100%); }
  .hp-cat-tile-body { position: relative; padding: 10px; }
  .hp-cat-tile-name { font-size: 13px; font-weight: 700; line-height: 1.2; }
  .hp-cat-tile-ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 36px; background: linear-gradient(135deg, #e8410a22, #ff704322); }
  .hp-cats-more { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 24px; }
  .hp-cat-chip { background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; padding: 10px 8px; text-align: center; text-decoration: none; color: #374151; font-size: 12px; font-weight: 600; transition: border-color .15s, box-shadow .15s; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .hp-cat-chip:hover { border-color: #e8410a; box-shadow: 0 2px 8px rgba(232,65,10,.1); color: #e8410a; }
  .hp-cat-chip-emoji { font-size: 22px; }

  /* ── ОБЪЯВЛЕНИЯ ── */
  .hp-listings-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .hp-listings-title { font-size: 18px; font-weight: 800; margin: 0; }
  .hp-listings-link { font-size: 13px; color: #e8410a; font-weight: 600; text-decoration: none; }
  .hp-listings-link:hover { text-decoration: underline; }
  .hp-listings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .hp-listing-card { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; overflow: hidden; text-decoration: none; color: #1a1a1a; transition: box-shadow .18s, transform .18s; display: flex; flex-direction: column; }
  .hp-listing-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); transform: translateY(-2px); }
  .hp-listing-img { aspect-ratio: 4/3; background: #f5f5f5; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #d1d5db; }
  .hp-listing-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hp-listing-cat { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,.5); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
  .hp-listing-body { padding: 10px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .hp-listing-price { font-size: 16px; font-weight: 800; color: #1a1a1a; }
  .hp-listing-price-unit { font-size: 11px; color: #9ca3af; font-weight: 500; margin-left: 3px; }
  .hp-listing-title { font-size: 13px; color: #374151; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; }
  .hp-listing-worker { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .hp-listing-ava { width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg,#e8410a,#ff7043); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; font-weight: 800; flex-shrink: 0; overflow: hidden; }
  .hp-listing-ava img { width: 100%; height: 100%; object-fit: cover; }
  .hp-listing-wname { font-size: 11px; color: #9ca3af; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .hp-listing-city { font-size: 11px; color: #9ca3af; }
  .hp-load-more { width: 100%; margin-top: 12px; padding: 12px; background: #fff; border: 1.5px solid #e8e8e8; border-radius: 8px; font-size: 14px; font-weight: 600; color: #374151; cursor: pointer; transition: border-color .15s; }
  .hp-load-more:hover { border-color: #e8410a; color: #e8410a; }

  /* ── ПРАВАЯ КОЛОНКА ── */
  .hp-side-card { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; padding: 16px; }
  .hp-side-title { font-size: 14px; font-weight: 800; color: #1a1a1a; margin: 0 0 12px; }
  .hp-quick-btns { display: flex; flex-direction: column; gap: 8px; }
  .hp-quick-btn { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; transition: background .15s; border: 1.5px solid transparent; }
  .hp-quick-btn-primary { background: #e8410a; color: #fff; }
  .hp-quick-btn-primary:hover { background: #d03a09; }
  .hp-quick-btn-outline { background: #fff; color: #e8410a; border-color: #e8410a; }
  .hp-quick-btn-outline:hover { background: #fff3f0; }
  .hp-quick-btn-gray { background: #f5f5f5; color: #374151; }
  .hp-quick-btn-gray:hover { background: #e8e8e8; }
  .hp-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hp-stat-box { background: #f7f8fa; border-radius: 8px; padding: 12px; text-align: center; }
  .hp-stat-num { font-size: 22px; font-weight: 900; color: #e8410a; display: block; }
  .hp-stat-lbl { font-size: 11px; color: #9ca3af; font-weight: 500; }
  .hp-divider { height: 1px; background: #f0f0f0; margin: 12px 0; }
  .hp-promo { background: linear-gradient(135deg, #1a0a00, #e8410a); border-radius: 10px; padding: 20px; color: #fff; }
  .hp-promo h3 { font-size: 15px; font-weight: 800; margin: 0 0 6px; }
  .hp-promo p { font-size: 12px; color: rgba(255,255,255,.75); margin: 0 0 14px; line-height: 1.5; }
  .hp-promo-btn { background: #fff; border: none; border-radius: 6px; color: #e8410a; font-size: 13px; font-weight: 700; padding: 8px 16px; cursor: pointer; width: 100%; }
  .hp-promo-btn:hover { background: #fff3f0; }

  /* ── МАСТЕР ДАШБОРД ── */
  .hp-worker { background: #f7f8fa; min-height: 100vh; }
  .hp-worker-hero { background: linear-gradient(135deg, #1a0a00 0%, #3d1200 50%, #e8410a 100%); padding: 28px 0; }
  .hp-worker-hero-inner { max-width: 1200px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .hp-worker-greeting h1 { font-size: 26px; font-weight: 900; color: #fff; margin: 0 0 4px; }
  .hp-worker-greeting p { font-size: 14px; color: rgba(255,255,255,.7); margin: 0; }
  .hp-worker-hero-actions { display: flex; gap: 10px; flex-shrink: 0; }
  .hp-worker-btn-w { background: #fff; border: none; border-radius: 8px; color: #e8410a; font-size: 14px; font-weight: 700; padding: 11px 20px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
  .hp-worker-btn-w:hover { background: #fff3f0; }
  .hp-worker-btn-ghost { background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.3); border-radius: 8px; color: #fff; font-size: 14px; font-weight: 700; padding: 10px 20px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
  .hp-worker-btn-ghost:hover { background: rgba(255,255,255,.25); }
  .hp-worker-body { max-width: 1200px; margin: 0 auto; padding: 20px 16px 60px; display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
  .hp-worker-main {}
  .hp-worker-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 72px; }
  .hp-stats-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .hp-stats-card { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; padding: 16px; display: flex; align-items: center; gap: 12px; }
  .hp-stats-card-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .hp-stats-card-num { font-size: 24px; font-weight: 900; color: #1a1a1a; line-height: 1; }
  .hp-stats-card-lbl { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .hp-section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .hp-section-title { font-size: 16px; font-weight: 800; margin: 0; }
  .hp-section-link { font-size: 13px; color: #e8410a; text-decoration: none; font-weight: 600; }
  .hp-section-link:hover { text-decoration: underline; }
  .hp-deals-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  .hp-deal-row { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; padding: 14px 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: box-shadow .15s; text-decoration: none; color: #1a1a1a; }
  .hp-deal-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
  .hp-deal-icon { width: 40px; height: 40px; border-radius: 10px; background: #fff3f0; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .hp-deal-info { flex: 1; min-width: 0; }
  .hp-deal-title { font-size: 14px; font-weight: 700; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-bottom: 2px; }
  .hp-deal-meta { font-size: 12px; color: #9ca3af; }
  .hp-deal-badge { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; flex-shrink: 0; }
  .hp-actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .hp-action-card { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; padding: 16px; text-align: center; text-decoration: none; color: #1a1a1a; transition: box-shadow .15s, border-color .15s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .hp-action-card:hover { box-shadow: 0 4px 16px rgba(232,65,10,.1); border-color: #e8410a; }
  .hp-action-card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .hp-action-card-title { font-size: 13px; font-weight: 700; }
  .hp-action-card-sub { font-size: 11px; color: #9ca3af; }
  .hp-empty-box { background: #fff; border-radius: 10px; border: 1.5px dashed #e8e8e8; padding: 40px 24px; text-align: center; color: #9ca3af; margin-bottom: 20px; }
  .hp-empty-box h3 { font-size: 15px; font-weight: 700; color: #374151; margin: 10px 0 6px; }
  .hp-empty-box p { font-size: 13px; margin: 0 0 16px; }

  @media(max-width:900px) { .hp-layout { grid-template-columns: 1fr; } .hp-side { position:static; } .hp-cats-grid { grid-template-columns: repeat(3,1fr); } .hp-worker-body { grid-template-columns: 1fr; } .hp-worker-side { position:static; } }
  @media(max-width:600px) { .hp-cats-grid { grid-template-columns: repeat(2,1fr); } .hp-listings-grid { grid-template-columns: 1fr; } .hp-stats-cards { grid-template-columns: repeat(2,1fr); } .hp-actions-grid { grid-template-columns: repeat(2,1fr); } }
`;

// ══ ГЛАВНАЯ ДЛЯ ЗАКАЗЧИКА ══
function CustomerHome({ userId, userName }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    fetch(`${API}/listings`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setListings(Array.isArray(data) ? data.filter(l => l.active) : []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/find-master?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const mainCats = ALL_CATS.slice(0, 8);
  const moreCats = ALL_CATS.slice(8);

  return (
    <div className="hp">
      <style>{css}</style>

      {/* Поиск */}
      <div className="hp-search-bar">
        <div className="hp-search-inner">
          <form onSubmit={handleSearch} className="hp-search-box">
            <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Поиск мастера или услуги..." />
          </form>
          <button className="hp-search-btn" onClick={handleSearch}>Найти</button>
          <div className="hp-location">📍 Йошкар-Ола</div>
        </div>
      </div>

      <div className="hp-layout">
        {/* Основная колонка */}
        <div className="hp-main">
          {/* Категории-плитки */}
          <div className="hp-cats-title">Все категории услуг</div>
          <div className="hp-cats-grid">
            {mainCats.map(cat => {
              const photo = CAT_PHOTOS[cat.slug];
              return (
                <Link key={cat.slug} to={`/find-master/${cat.slug}`} className="hp-cat-tile">
                  {photo
                    ? <div className="hp-cat-tile-img" style={{backgroundImage:`url(${photo})`}}/>
                    : <div className="hp-cat-tile-ph">{CAT_EMOJIS[cat.slug]||'🛠️'}</div>
                  }
                  <div className="hp-cat-tile-overlay"/>
                  <div className="hp-cat-tile-body">
                    <div className="hp-cat-tile-name">{cat.name}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {moreCats.length > 0 && (
            <div className="hp-cats-more">
              {moreCats.map(cat => (
                <Link key={cat.slug} to={`/find-master/${cat.slug}`} className="hp-cat-chip">
                  <span className="hp-cat-chip-emoji">{cat.emoji || CAT_EMOJIS[cat.slug] || '🛠️'}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Объявления мастеров */}
          <div className="hp-listings-hdr">
            <h2 className="hp-listings-title">Объявления мастеров</h2>
            <Link to="/find-master" className="hp-listings-link">Смотреть все →</Link>
          </div>

          {listings.length === 0 ? (
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e8e8e8',padding:'40px 24px',textAlign:'center',color:'#9ca3af',marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:10}}>🔍</div>
              <p style={{margin:0,fontSize:14}}>Пока нет объявлений. Мастера скоро появятся!</p>
            </div>
          ) : (
            <>
              <div className="hp-listings-grid">
                {listings.slice(0, visibleCount).map(l => (
                  <Link key={l.id} to={`/workers/${l.workerId}`} className="hp-listing-card">
                    <div className="hp-listing-img">
                      {l.photos?.length
                        ? <img src={l.photos[0]} alt=""/>
                        : '🔧'
                      }
                      {l.category && <span className="hp-listing-cat">{l.category}</span>}
                    </div>
                    <div className="hp-listing-body">
                      <div className="hp-listing-price">
                        {Number(l.price).toLocaleString('ru-RU')} ₽
                        <span className="hp-listing-price-unit">{l.priceUnit}</span>
                      </div>
                      <div className="hp-listing-title">{l.title}</div>
                      <div className="hp-listing-worker">
                        <div className="hp-listing-ava">
                          {l.workerAvatar && l.workerAvatar.length > 10
                            ? <img src={l.workerAvatar} alt=""/>
                            : (l.workerName||'М')[0].toUpperCase()
                          }
                        </div>
                        <span className="hp-listing-wname">{[l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер'}</span>
                      </div>
                      <div className="hp-listing-city">📍 Йошкар-Ола</div>
                    </div>
                  </Link>
                ))}
              </div>
              {visibleCount < listings.length && (
                <button className="hp-load-more" onClick={() => setVisibleCount(v => v + 8)}>
                  Показать ещё ({listings.length - visibleCount})
                </button>
              )}
            </>
          )}
        </div>

        {/* Правая колонка */}
        <div className="hp-side">
          {/* Быстрые действия */}
          <div className="hp-side-card">
            <div className="hp-side-title">Быстрые действия</div>
            <div className="hp-quick-btns">
              <Link to="/categories" className="hp-quick-btn hp-quick-btn-primary">🔍 Найти мастера</Link>
              <Link to="/deals" className="hp-quick-btn hp-quick-btn-outline">📋 Мои сделки</Link>
              <Link to="/chat" className="hp-quick-btn hp-quick-btn-gray">💬 Сообщения</Link>
            </div>
          </div>

          {/* Статистика */}
          <div className="hp-side-card">
            <div className="hp-side-title">Платформа сейчас</div>
            <div className="hp-stats-row">
              <div className="hp-stat-box"><span className="hp-stat-num">24/7</span><span className="hp-stat-lbl">Приём заявок</span></div>
              <div className="hp-stat-box"><span className="hp-stat-num">9</span><span className="hp-stat-lbl">Категорий</span></div>
              <div className="hp-stat-box"><span className="hp-stat-num">5.0★</span><span className="hp-stat-lbl">Рейтинг</span></div>
              <div className="hp-stat-box"><span className="hp-stat-num">≤10</span><span className="hp-stat-lbl">Мин. отклик</span></div>
            </div>
          </div>

          {/* Промо */}
          <div className="hp-promo">
            <h3>Нужен мастер прямо сейчас?</h3>
            <p>Опишите задачу — первые отклики уже через 10 минут</p>
            <button className="hp-promo-btn" onClick={() => navigate('/categories')}>Разместить заявку →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ ГЛАВНАЯ ДЛЯ МАСТЕРА ══
function WorkerHome({ userId, userName }) {
  const [deals, setDeals] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`${API}/deals`, { headers: { 'X-User-Id': userId } }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/workers/${userId}/listings`).then(r => r.ok ? r.json() : []),
    ]).then(([d, l]) => {
      setDeals(Array.isArray(d) ? d : []);
      setListings(Array.isArray(l) ? l : []);
    }).finally(() => setLoading(false));
  }, [userId]);

  const activeDeals    = deals.filter(d => d.status === 'IN_PROGRESS');
  const completedDeals = deals.filter(d => d.status === 'COMPLETED');
  const activeListings = listings.filter(l => l.active);

  const DEAL_STATUS_COLORS = {
    IN_PROGRESS: { bg: '#fff3f0', color: '#e8410a', label: 'В работе' },
    COMPLETED:   { bg: '#f0fdf4', color: '#22c55e', label: 'Завершена' },
    NEW:         { bg: '#eff6ff', color: '#3b82f6', label: 'Новая' },
  };

  return (
    <div className="hp-worker">
      <style>{css}</style>

      {/* Hero */}
      <div className="hp-worker-hero">
        <div className="hp-worker-hero-inner">
          <div className="hp-worker-greeting">
            <h1>👋 Привет, {userName || 'Мастер'}!</h1>
            <p>Добро пожаловать на панель управления</p>
          </div>
          <div className="hp-worker-hero-actions">
            <Link to="/find-work" className="hp-worker-btn-w">📋 Найти работу</Link>
            <Link to="/my-listings" className="hp-worker-btn-ghost">+ Новое объявление</Link>
          </div>
        </div>
      </div>

      <div className="hp-worker-body">
        {/* Основная колонка */}
        <div className="hp-worker-main">
          {/* Статистика */}
          <div className="hp-stats-cards">
            <div className="hp-stats-card">
              <div className="hp-stats-card-icon" style={{background:'#fff3f0'}}>⚙️</div>
              <div>
                <div className="hp-stats-card-num">{activeDeals.length}</div>
                <div className="hp-stats-card-lbl">В работе</div>
              </div>
            </div>
            <div className="hp-stats-card">
              <div className="hp-stats-card-icon" style={{background:'#f0fdf4'}}>✅</div>
              <div>
                <div className="hp-stats-card-num">{completedDeals.length}</div>
                <div className="hp-stats-card-lbl">Выполнено</div>
              </div>
            </div>
            <div className="hp-stats-card">
              <div className="hp-stats-card-icon" style={{background:'#eff6ff'}}>📢</div>
              <div>
                <div className="hp-stats-card-num">{activeListings.length}</div>
                <div className="hp-stats-card-lbl">Объявлений</div>
              </div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="hp-section-hdr"><h2 className="hp-section-title">Быстрые действия</h2></div>
          <div className="hp-actions-grid" style={{marginBottom:20}}>
            {[
              { to:'/find-work',     icon:'🔍', bg:'#fff3f0', title:'Найти работу',    sub:'Новые заявки' },
              { to:'/deals',         icon:'📋', bg:'#f0fdf4', title:'Мои сделки',      sub:`Активных: ${activeDeals.length}` },
              { to:'/my-listings',   icon:'📢', bg:'#eff6ff', title:'Объявления',      sub:`Активных: ${activeListings.length}` },
              { to:'/chat',          icon:'💬', bg:'#fdf4ff', title:'Сообщения',       sub:'Переписка' },
              { to:'/worker-profile',icon:'👤', bg:'#fff9f0', title:'Мой профиль',     sub:'Настройки' },
              { to:'/deals',         icon:'⭐', bg:'#fff3f0', title:'Отзывы',          sub:'Репутация' },
            ].map(a => (
              <Link key={a.to+a.title} to={a.to} className="hp-action-card">
                <div className="hp-action-card-icon" style={{background:a.bg}}>{a.icon}</div>
                <div className="hp-action-card-title">{a.title}</div>
                <div className="hp-action-card-sub">{a.sub}</div>
              </Link>
            ))}
          </div>

          {/* Активные сделки */}
          <div className="hp-section-hdr">
            <h2 className="hp-section-title">Активные сделки</h2>
            <Link to="/deals" className="hp-section-link">Все сделки →</Link>
          </div>
          {loading ? (
            <div className="hp-deals-list">{[1,2].map(i=><div key={i} style={{background:'#fff',borderRadius:10,border:'1px solid #e8e8e8',height:70,marginBottom:8}}/>)}</div>
          ) : activeDeals.length === 0 ? (
            <div className="hp-empty-box">
              <div style={{fontSize:36}}>📋</div>
              <h3>Нет активных сделок</h3>
              <p>Откликайтесь на заявки чтобы получить заказы</p>
              <Link to="/find-work" style={{display:'inline-block',padding:'10px 20px',background:'#e8410a',color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:13}}>Найти работу</Link>
            </div>
          ) : (
            <div className="hp-deals-list">
              {activeDeals.slice(0,5).map(d => {
                const st = DEAL_STATUS_COLORS[d.status] || DEAL_STATUS_COLORS.NEW;
                return (
                  <Link key={d.id} to="/deals" className="hp-deal-row">
                    <div className="hp-deal-icon">⚙️</div>
                    <div className="hp-deal-info">
                      <div className="hp-deal-title">{d.title || 'Сделка'}</div>
                      <div className="hp-deal-meta">👤 {d.customerName || 'Заказчик'} · {d.agreedPrice ? `${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽` : ''}</div>
                    </div>
                    <span className="hp-deal-badge" style={{background:st.bg,color:st.color}}>{st.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Мои объявления */}
          <div className="hp-section-hdr">
            <h2 className="hp-section-title">Мои объявления</h2>
            <Link to="/my-listings" className="hp-section-link">Все объявления →</Link>
          </div>
          {activeListings.length === 0 ? (
            <div className="hp-empty-box">
              <div style={{fontSize:36}}>📢</div>
              <h3>Нет активных объявлений</h3>
              <p>Опубликуйте услуги чтобы заказчики могли вас найти</p>
              <Link to="/my-listings" style={{display:'inline-block',padding:'10px 20px',background:'#e8410a',color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:13}}>+ Разместить объявление</Link>
            </div>
          ) : (
            <div className="hp-listings-grid">
              {activeListings.slice(0,4).map(l => (
                <Link key={l.id} to="/my-listings" className="hp-listing-card">
                  <div className="hp-listing-img">
                    {l.photos?.length ? <img src={l.photos[0]} alt=""/> : '🔧'}
                    {l.category && <span className="hp-listing-cat">{l.category}</span>}
                  </div>
                  <div className="hp-listing-body">
                    <div className="hp-listing-price">{Number(l.price).toLocaleString('ru-RU')} ₽<span className="hp-listing-price-unit">{l.priceUnit}</span></div>
                    <div className="hp-listing-title">{l.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка */}
        <div className="hp-worker-side">
          <div className="hp-side-card">
            <div className="hp-side-title">Навигация</div>
            <div className="hp-quick-btns">
              <Link to="/find-work"    className="hp-quick-btn hp-quick-btn-primary">🔍 Найти работу</Link>
              <Link to="/my-listings"  className="hp-quick-btn hp-quick-btn-outline">📢 Мои объявления</Link>
              <Link to="/deals"        className="hp-quick-btn hp-quick-btn-gray">📋 Сделки</Link>
              <Link to="/chat"         className="hp-quick-btn hp-quick-btn-gray">💬 Сообщения</Link>
              <Link to="/worker-profile" className="hp-quick-btn hp-quick-btn-gray">👤 Профиль</Link>
            </div>
          </div>

          <div className="hp-promo">
            <h3>Новые заявки ждут!</h3>
            <p>Откликайтесь первым и получайте больше заказов</p>
            <button className="hp-promo-btn" onClick={() => window.location.href='/find-work'}>Смотреть заявки →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ ЭКСПОРТ ══
export default function HomePage() {
  const { userId, userRole, userName } = useAuth();

  if (userRole === 'WORKER') {
    return <WorkerHome userId={userId} userName={userName} />;
  }
  if (userId) {
    return <CustomerHome userId={userId} userName={userName} />;
  }

  // Гость — старая hero-страница
  return <GuestHome />;
}

// ══ СТРАНИЦА ДЛЯ ГОСТЕЙ ══
function GuestHome() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div>
      <section style={{background:'linear-gradient(135deg,#111827 0%,#1f2937 100%)',padding:'80px 0 60px',color:'#fff'}}>
        <div className="container">
          <div style={{maxWidth:560}}>
            <h1 style={{fontSize:42,fontWeight:900,margin:'0 0 16px',lineHeight:1.15}}>
              Свои мастера<br/>для <span style={{color:'#e8410a'}}>любых задач</span><br/>в Йошкар-Оле
            </h1>
            <p style={{fontSize:16,color:'rgba(255,255,255,.7)',margin:'0 0 28px',lineHeight:1.6}}>Опишите задачу — мастера откликнутся сами. Выбирайте по рейтингу, договаривайтесь внутри сервиса.</p>
            <div style={{display:'flex',gap:12}}>
              <Link to="/register" style={{background:'#e8410a',color:'#fff',padding:'14px 28px',borderRadius:10,fontWeight:700,fontSize:15,textDecoration:'none'}}>🔍 Найти мастера</Link>
              <Link to="/register?role=WORKER" style={{background:'rgba(255,255,255,.1)',color:'#fff',border:'1.5px solid rgba(255,255,255,.25)',padding:'13px 24px',borderRadius:10,fontWeight:700,fontSize:15,textDecoration:'none'}}>Стать мастером →</Link>
            </div>
          </div>
        </div>
      </section>
      <div style={{background:'#f7f8fa',padding:'40px 0 60px'}}>
        <div className="container">
          <h2 style={{fontSize:22,fontWeight:800,margin:'0 0 20px'}}>Категории услуг</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
            {ALL_CATS.map(cat => (
              <Link key={cat.slug} to="/register" style={{background:'#fff',borderRadius:10,border:'1px solid #e8e8e8',padding:'16px',textAlign:'center',textDecoration:'none',color:'#1a1a1a',display:'flex',flexDirection:'column',alignItems:'center',gap:8,transition:'box-shadow .15s'}}>
                <span style={{fontSize:28}}>{cat.emoji || '🛠️'}</span>
                <span style={{fontSize:13,fontWeight:700}}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}