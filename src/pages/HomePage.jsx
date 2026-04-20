import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';
const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

const CAT_PHOTOS = {
  'remont-kvartir':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
  'santehnika':           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'elektrika':            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
  'uborka':               'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80',
  'parikhmaher':          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
  'manikur':              'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
  'krasota-i-zdorovie':   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'repetitorstvo':        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
};

/* ═══════════════════════════════════════════════════════════
   CUSTOMER HOME — Авито-стиль
   ═══════════════════════════════════════════════════════════ */
function CustomerHome({ userId, userName }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [listings, setListings] = useState([]);
  const [shown, setShown] = useState(8);

  useEffect(() => {
    fetch(`${API}/listings`).then(r => r.ok ? r.json() : [])
      .then(d => setListings(Array.isArray(d) ? d.filter(l => l.active) : [])).catch(() => {});
  }, []);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .av * { box-sizing: border-box; margin: 0; padding: 0; }
    .av { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f2f2f2; min-height: 100vh; color: #141414; -webkit-font-smoothing: antialiased; }

    /* ── SEARCH BAR ── */
    .av-topbar { background: #fff; border-bottom: 1px solid #e0e0e0; padding: 10px 0; position: sticky; top: 0; z-index: 100; }
    .av-topbar-inner { max-width: 1260px; margin: 0 auto; padding: 0 20px; display: flex; gap: 10px; align-items: center; }
    .av-location-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid #d9d9d9; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-weight: 600; color: #141414; cursor: pointer; white-space: nowrap; font-family: inherit; transition: border-color .15s; }
    .av-location-btn:hover { border-color: #999; }
    .av-location-btn svg { flex-shrink: 0; }
    .av-search-wrap { flex: 1; display: flex; gap: 0; }
    .av-search-input { flex: 1; border: 1px solid #d9d9d9; border-right: none; border-radius: 8px 0 0 8px; padding: 10px 14px; font-size: 15px; outline: none; font-family: inherit; color: #141414; transition: border-color .15s; }
    .av-search-input:focus { border-color: #3d9be9; box-shadow: inset 0 0 0 1px #3d9be9; }
    .av-search-input::placeholder { color: #999; }
    .av-search-btn { background: #3d9be9; border: none; border-radius: 0 8px 8px 0; color: #fff; font-size: 15px; font-weight: 700; padding: 10px 24px; cursor: pointer; font-family: inherit; transition: background .15s; white-space: nowrap; }
    .av-search-btn:hover { background: #2b8ad6; }

    /* ── MAIN LAYOUT ── */
    .av-main { max-width: 1260px; margin: 0 auto; padding: 16px 20px 60px; }

    /* ── CATEGORIES BLOCK ── */
    .av-cats { background: #fff; border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
    .av-cats-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 8px; }
    .av-cats-title { font-size: 20px; font-weight: 800; color: #141414; }
    .av-cats-all { font-size: 14px; color: #3d9be9; text-decoration: none; font-weight: 600; }
    .av-cats-all:hover { text-decoration: underline; }
    .av-cats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 4px; padding: 8px 12px 16px; }
    .av-cat-link { display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; color: #141414; padding: 8px 4px; border-radius: 10px; transition: background .12s; }
    .av-cat-link:hover { background: #f5f5f5; }
    .av-cat-photo { width: 100%; aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; background: #f0f0f0; }
    .av-cat-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .25s; }
    .av-cat-link:hover .av-cat-photo img { transform: scale(1.05); }
    .av-cat-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 28px; background: linear-gradient(135deg, #e8f0fe, #d4e4fc); }
    .av-cat-name { font-size: 12px; font-weight: 600; text-align: center; line-height: 1.25; color: #333; }

    /* ── CONTENT GRID ── */
    .av-content { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }

    /* ── LISTINGS ── */
    .av-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .av-section-title { font-size: 20px; font-weight: 800; color: #141414; }
    .av-section-link { font-size: 14px; color: #3d9be9; text-decoration: none; font-weight: 600; }
    .av-section-link:hover { text-decoration: underline; }

    .av-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .av-card { background: #fff; border-radius: 10px; overflow: hidden; text-decoration: none; color: #141414; display: flex; flex-direction: column; transition: box-shadow .18s; }
    .av-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,.1); }
    .av-card-img { aspect-ratio: 4/3; background: #f5f5f5; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
    .av-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .25s; }
    .av-card:hover .av-card-img img { transform: scale(1.03); }
    .av-card-img-ph { font-size: 36px; color: #ccc; }
    .av-card-badge { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,.6); backdrop-filter: blur(4px); color: #fff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
    .av-card-body { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .av-card-price { font-size: 18px; font-weight: 800; color: #141414; }
    .av-card-unit { font-size: 12px; color: #999; font-weight: 400; margin-left: 2px; }
    .av-card-name { font-size: 14px; color: #333; line-height: 1.35; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .av-card-meta { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 8px; }
    .av-card-ava { width: 20px; height: 20px; border-radius: 50%; background: #3d9be9; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; font-weight: 700; overflow: hidden; flex-shrink: 0; }
    .av-card-ava img { width: 100%; height: 100%; object-fit: cover; }
    .av-card-worker { font-size: 12px; color: #999; font-weight: 500; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .av-card-geo { font-size: 12px; color: #bbb; white-space: nowrap; }

    .av-more { width: 100%; margin-top: 12px; padding: 13px; background: #fff; border: 1px solid #d9d9d9; border-radius: 8px; font-size: 15px; font-weight: 700; color: #3d9be9; cursor: pointer; font-family: inherit; transition: all .15s; }
    .av-more:hover { background: #f0f7ff; border-color: #3d9be9; }

    .av-empty { background: #fff; border-radius: 10px; padding: 48px 24px; text-align: center; }
    .av-empty-ico { font-size: 40px; margin-bottom: 12px; }
    .av-empty h3 { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 4px; }
    .av-empty p { font-size: 14px; color: #999; }

    /* ── SIDEBAR ── */
    .av-side { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 62px; }
    .av-widget { background: #fff; border-radius: 12px; padding: 16px; }
    .av-widget-label { font-size: 13px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 12px; }

    .av-nav { display: flex; flex-direction: column; gap: 2px; }
    .av-nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; color: #141414; transition: background .12s; }
    .av-nav-link:hover { background: #f5f5f5; }
    .av-nav-link-primary { background: #3d9be9; color: #fff; }
    .av-nav-link-primary:hover { background: #2b8ad6; }

    .av-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .av-stat { background: #f7f7f7; border-radius: 8px; padding: 12px; text-align: center; }
    .av-stat-val { font-size: 20px; font-weight: 900; color: #141414; display: block; line-height: 1; }
    .av-stat-lbl { font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; margin-top: 4px; display: block; }

    .av-banner { background: #3d9be9; border-radius: 12px; padding: 20px; color: #fff; }
    .av-banner h3 { font-size: 16px; font-weight: 800; margin-bottom: 6px; }
    .av-banner p { font-size: 13px; color: rgba(255,255,255,.8); margin-bottom: 14px; line-height: 1.5; }
    .av-banner-btn { width: 100%; background: #fff; border: none; border-radius: 8px; color: #3d9be9; font-size: 14px; font-weight: 700; padding: 11px; cursor: pointer; font-family: inherit; transition: background .15s; }
    .av-banner-btn:hover { background: #e8f4fd; }

    /* ── RESPONSIVE ── */
    @media(max-width: 1024px) {
      .av-content { grid-template-columns: 1fr; }
      .av-side { position: static; flex-direction: row; flex-wrap: wrap; }
      .av-side > * { flex: 1; min-width: 200px; }
    }
    @media(max-width: 768px) {
      .av-cats-grid { grid-template-columns: repeat(3, 1fr); }
      .av-cards { grid-template-columns: repeat(2, 1fr); }
      .av-topbar-inner { flex-wrap: wrap; }
      .av-location-btn { order: -1; width: 100%; justify-content: center; }
    }
    @media(max-width: 480px) {
      .av-cards { grid-template-columns: 1fr; }
    }
  `;

  const filtered = q.trim()
    ? listings.filter(l => l.title?.toLowerCase().includes(q.toLowerCase()) || l.category?.toLowerCase().includes(q.toLowerCase()))
    : listings;

  return (
    <div className="av">
      <style>{styles}</style>

      {/* ── SEARCH BAR ── */}
      <div className="av-topbar">
        <div className="av-topbar-inner">
          <button className="av-location-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="#141414"/></svg>
            Йошкар-Ола
          </button>
          <div className="av-search-wrap">
            <input
              className="av-search-input"
              placeholder="Поиск услуг и мастеров"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button className="av-search-btn">Найти</button>
          </div>
        </div>
      </div>

      <div className="av-main">
        {/* ── CATEGORIES ── */}
        <div className="av-cats">
          <div className="av-cats-header">
            <h2 className="av-cats-title">Категории услуг</h2>
            <Link to="/find-master" className="av-cats-all">Все категории</Link>
          </div>
          <div className="av-cats-grid">
            {ALL_CATS.map(cat => (
              <Link key={cat.slug} to={`/find-master/${cat.slug}`} className="av-cat-link">
                <div className="av-cat-photo">
                  {CAT_PHOTOS[cat.slug]
                    ? <img src={CAT_PHOTOS[cat.slug]} alt={cat.name} loading="lazy"/>
                    : <div className="av-cat-ph">{cat.emoji || '🛠️'}</div>
                  }
                </div>
                <span className="av-cat-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="av-content">
          <div>
            <div className="av-section-header">
              <h2 className="av-section-title">Рекомендации для вас</h2>
              <Link to="/find-master" className="av-section-link">Смотреть все</Link>
            </div>

            {filtered.length === 0 ? (
              <div className="av-empty">
                <div className="av-empty-ico">🔍</div>
                <h3>Пока нет объявлений</h3>
                <p>Мастера скоро появятся</p>
              </div>
            ) : (
              <>
                <div className="av-cards">
                  {filtered.slice(0, shown).map(l => (
                    <Link key={l.id} to={`/listings/${l.id}`} className="av-card">
                      <div className="av-card-img">
                        {l.photos?.length
                          ? <img src={l.photos[0]} alt="" loading="lazy"/>
                          : <span className="av-card-img-ph">🔧</span>
                        }
                        {l.category && <span className="av-card-badge">{l.category}</span>}
                      </div>
                      <div className="av-card-body">
                        <div className="av-card-price">
                          {l.price ? Number(l.price).toLocaleString('ru-RU') : '—'} ₽
                          {l.priceUnit && <span className="av-card-unit">{l.priceUnit}</span>}
                        </div>
                        <div className="av-card-name">{l.title}</div>
                        <div className="av-card-meta">
                          <div className="av-card-ava">
                            {l.workerAvatar?.length > 10
                              ? <img src={l.workerAvatar} alt=""/>
                              : (l.workerName || 'М')[0]
                            }
                          </div>
                          <span className="av-card-worker">
                            {[l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер'}
                          </span>
                          <span className="av-card-geo">Йошкар-Ола</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {shown < filtered.length && (
                  <button className="av-more" onClick={() => setShown(s => s + 8)}>
                    Показать ещё ({filtered.length - shown})
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="av-side">
            <div className="av-widget">
              <div className="av-widget-label">Навигация</div>
              <div className="av-nav">
                <Link to="/categories" className="av-nav-link av-nav-link-primary">📋 Разместить задачу</Link>
                <Link to="/find-master" className="av-nav-link">🔍 Найти мастера</Link>
                <Link to="/deals" className="av-nav-link">🤝 Мои сделки</Link>
                <Link to="/chat" className="av-nav-link">💬 Сообщения</Link>
              </div>
            </div>

            <div className="av-widget">
              <div className="av-widget-label">Платформа</div>
              <div className="av-stats-row">
                {[['24/7','Заявки'],['9','Категорий'],['5.0★','Рейтинг'],['≤10','Мин. отклик']].map(([n,l]) => (
                  <div key={l} className="av-stat">
                    <span className="av-stat-val">{n}</span>
                    <span className="av-stat-lbl">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="av-banner">
              <h3>Нужен мастер?</h3>
              <p>Опишите задачу — первые отклики уже через 10 минут</p>
              <button className="av-banner-btn" onClick={() => navigate('/categories')}>Разместить задачу</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WORKER HOME
   ═══════════════════════════════════════════════════════════ */
function WorkerHome({ userId, userName }) {
  const [deals, setDeals] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`${API}/deals`, { headers: { 'X-User-Id': userId } }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/workers/${userId}/listings`).then(r => r.ok ? r.json() : []),
    ]).then(([d, l]) => { setDeals(Array.isArray(d) ? d : []); setListings(Array.isArray(l) ? l : []); })
      .finally(() => setLoading(false));
  }, [userId]);

  const active = deals.filter(d => d.status === 'IN_PROGRESS');
  const done = deals.filter(d => d.status === 'COMPLETED');
  const liveListing = listings.filter(l => l.active);

  const ST = {
    IN_PROGRESS: { bg: '#fff8f0', color: '#d97706', label: 'В работе' },
    COMPLETED: { bg: '#f0fdf4', color: '#16a34a', label: 'Завершена' },
    NEW: { bg: '#eff6ff', color: '#2563eb', label: 'Новая' },
  };

  const wStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    .wk * { box-sizing: border-box; margin: 0; padding: 0; }
    .wk { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f2f2f2; min-height: 100vh; color: #141414; -webkit-font-smoothing: antialiased; }

    .wk-header { background: #fff; border-bottom: 1px solid #e0e0e0; padding: 20px 0; }
    .wk-header-inner { max-width: 1260px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .wk-hello { font-size: 22px; font-weight: 800; }
    .wk-hello span { color: #3d9be9; }
    .wk-sub { font-size: 14px; color: #999; margin-top: 2px; }
    .wk-header-btns { display: flex; gap: 8px; }
    .wk-btn-primary { background: #3d9be9; border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 700; padding: 10px 20px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; transition: background .15s; }
    .wk-btn-primary:hover { background: #2b8ad6; }
    .wk-btn-outline { background: #fff; border: 1px solid #d9d9d9; border-radius: 8px; color: #141414; font-size: 14px; font-weight: 600; padding: 10px 20px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; transition: all .15s; }
    .wk-btn-outline:hover { border-color: #3d9be9; color: #3d9be9; }

    .wk-body { max-width: 1260px; margin: 0 auto; padding: 16px 20px 60px; display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }

    .wk-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .wk-kpi { background: #fff; border-radius: 10px; padding: 16px; display: flex; align-items: center; gap: 12px; }
    .wk-kpi-ico { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .wk-kpi-num { font-size: 24px; font-weight: 900; color: #141414; line-height: 1; }
    .wk-kpi-lbl { font-size: 12px; color: #999; font-weight: 600; margin-top: 2px; }

    .wk-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .wk-action { background: #fff; border-radius: 10px; padding: 16px; text-align: center; text-decoration: none; color: #141414; transition: box-shadow .15s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .wk-action:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    .wk-action-ico { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .wk-action-title { font-size: 13px; font-weight: 700; }
    .wk-action-sub { font-size: 12px; color: #999; }

    .wk-section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .wk-section-title { font-size: 18px; font-weight: 800; }
    .wk-section-link { font-size: 14px; color: #3d9be9; text-decoration: none; font-weight: 600; }
    .wk-section-link:hover { text-decoration: underline; }

    .wk-deals { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .wk-deal { background: #fff; border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #141414; transition: box-shadow .12s; }
    .wk-deal:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
    .wk-deal-ico { width: 38px; height: 38px; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .wk-deal-info { flex: 1; min-width: 0; }
    .wk-deal-title { font-size: 14px; font-weight: 700; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .wk-deal-meta { font-size: 12px; color: #999; margin-top: 1px; }
    .wk-deal-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; }

    .wk-listings { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
    .wk-listing { background: #fff; border-radius: 10px; overflow: hidden; text-decoration: none; color: #141414; transition: box-shadow .15s; }
    .wk-listing:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    .wk-listing-img { aspect-ratio: 4/3; background: #f5f5f5; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #ccc; position: relative; }
    .wk-listing-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .wk-listing-body { padding: 10px 12px; }
    .wk-listing-price { font-size: 16px; font-weight: 800; }
    .wk-listing-name { font-size: 13px; color: #555; margin-top: 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

    .wk-empty { background: #fff; border-radius: 10px; padding: 40px 20px; text-align: center; margin-bottom: 20px; }
    .wk-empty-ico { font-size: 36px; margin-bottom: 10px; }
    .wk-empty h3 { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 4px; }
    .wk-empty p { font-size: 13px; color: #999; margin-bottom: 14px; }
    .wk-empty-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; background: #3d9be9; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; transition: background .15s; }
    .wk-empty-btn:hover { background: #2b8ad6; }

    .wk-side { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 16px; }
    .wk-widget { background: #fff; border-radius: 12px; padding: 16px; }
    .wk-widget-label { font-size: 13px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 12px; }
    .wk-nav { display: flex; flex-direction: column; gap: 2px; }
    .wk-nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; color: #141414; transition: background .12s; }
    .wk-nav-link:hover { background: #f5f5f5; }
    .wk-nav-primary { background: #3d9be9; color: #fff; }
    .wk-nav-primary:hover { background: #2b8ad6; }
    .wk-promo { background: #3d9be9; border-radius: 12px; padding: 18px; color: #fff; }
    .wk-promo h3 { font-size: 15px; font-weight: 800; margin-bottom: 6px; }
    .wk-promo p { font-size: 13px; color: rgba(255,255,255,.8); margin-bottom: 14px; line-height: 1.5; }
    .wk-promo-btn { width: 100%; background: #fff; border: none; border-radius: 8px; color: #3d9be9; font-size: 14px; font-weight: 700; padding: 10px; cursor: pointer; font-family: inherit; transition: background .15s; }
    .wk-promo-btn:hover { background: #e8f4fd; }

    @media(max-width: 1024px) { .wk-body { grid-template-columns: 1fr; } .wk-side { position: static; } }
    @media(max-width: 640px) { .wk-kpis { grid-template-columns: 1fr 1fr; } .wk-actions { grid-template-columns: 1fr 1fr; } .wk-listings { grid-template-columns: 1fr; } .wk-header-inner { flex-direction: column; align-items: flex-start; } }
  `;

  return (
    <div className="wk">
      <style>{wStyles}</style>

      <div className="wk-header">
        <div className="wk-header-inner">
          <div>
            <h1 className="wk-hello">Привет, <span>{userName || 'Мастер'}</span></h1>
            <p className="wk-sub">Панель управления · Йошкар-Ола</p>
          </div>
          <div className="wk-header-btns">
            <Link to="/find-work" className="wk-btn-primary">📋 Найти работу</Link>
            <Link to="/my-listings" className="wk-btn-outline">+ Объявление</Link>
          </div>
        </div>
      </div>

      <div className="wk-body">
        <div>
          {/* KPIs */}
          <div className="wk-kpis">
            {[
              { ico: '⚙️', bg: '#fff8f0', num: active.length, lbl: 'В работе' },
              { ico: '✅', bg: '#f0fdf4', num: done.length, lbl: 'Выполнено' },
              { ico: '📢', bg: '#eff6ff', num: liveListing.length, lbl: 'Объявлений' },
            ].map(k => (
              <div key={k.lbl} className="wk-kpi">
                <div className="wk-kpi-ico" style={{ background: k.bg }}>{k.ico}</div>
                <div><div className="wk-kpi-num">{k.num}</div><div className="wk-kpi-lbl">{k.lbl}</div></div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="wk-actions">
            {[
              { to: '/find-work', ico: '🔍', bg: '#eff6ff', title: 'Найти работу', sub: 'Новые заявки' },
              { to: '/deals', ico: '📋', bg: '#f0fdf4', title: 'Мои сделки', sub: `Активных: ${active.length}` },
              { to: '/my-listings', ico: '📢', bg: '#fff8f0', title: 'Объявления', sub: `Активных: ${liveListing.length}` },
              { to: '/chat', ico: '💬', bg: '#fdf4ff', title: 'Сообщения', sub: 'Переписка' },
              { to: '/worker-profile', ico: '👤', bg: '#f5f5f5', title: 'Профиль', sub: 'Настройки' },
              { to: '/deals', ico: '⭐', bg: '#fff8f0', title: 'Отзывы', sub: 'Репутация' },
            ].map(a => (
              <Link key={a.to + a.title} to={a.to} className="wk-action">
                <div className="wk-action-ico" style={{ background: a.bg }}>{a.ico}</div>
                <div className="wk-action-title">{a.title}</div>
                <div className="wk-action-sub">{a.sub}</div>
              </Link>
            ))}
          </div>

          {/* Active deals */}
          <div className="wk-section-hdr">
            <h2 className="wk-section-title">Активные сделки</h2>
            <Link to="/deals" className="wk-section-link">Все</Link>
          </div>
          {loading ? (
            <div className="wk-deals">{[1, 2].map(i => <div key={i} style={{ background: '#fff', borderRadius: 10, height: 62 }}/>)}</div>
          ) : active.length === 0 ? (
            <div className="wk-empty">
              <div className="wk-empty-ico">📋</div>
              <h3>Нет активных сделок</h3>
              <p>Откликайтесь на заявки чтобы получить заказы</p>
              <Link to="/find-work" className="wk-empty-btn">Найти работу</Link>
            </div>
          ) : (
            <div className="wk-deals">
              {active.slice(0, 5).map(d => {
                const st = ST[d.status] || ST.NEW;
                return (
                  <Link key={d.id} to="/deals" className="wk-deal">
                    <div className="wk-deal-ico">⚙️</div>
                    <div className="wk-deal-info">
                      <div className="wk-deal-title">{d.title || 'Сделка'}</div>
                      <div className="wk-deal-meta">
                        {d.customerName || 'Заказчик'}{d.agreedPrice ? ` · ${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽` : ''}
                      </div>
                    </div>
                    <span className="wk-deal-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* My listings */}
          <div className="wk-section-hdr">
            <h2 className="wk-section-title">Мои объявления</h2>
            <Link to="/my-listings" className="wk-section-link">Все</Link>
          </div>
          {liveListing.length === 0 ? (
            <div className="wk-empty">
              <div className="wk-empty-ico">📢</div>
              <h3>Нет объявлений</h3>
              <p>Опубликуйте услуги чтобы заказчики нашли вас</p>
              <Link to="/my-listings" className="wk-empty-btn">+ Разместить</Link>
            </div>
          ) : (
            <div className="wk-listings">
              {liveListing.slice(0, 4).map(l => (
                <Link key={l.id} to="/my-listings" className="wk-listing">
                  <div className="wk-listing-img">
                    {l.photos?.length ? <img src={l.photos[0]} alt=""/> : '🔧'}
                    {l.category && <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>{l.category}</span>}
                  </div>
                  <div className="wk-listing-body">
                    <div className="wk-listing-price">{Number(l.price).toLocaleString('ru-RU')} ₽ <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>{l.priceUnit}</span></div>
                    <div className="wk-listing-name">{l.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="wk-side">
          <div className="wk-widget">
            <div className="wk-widget-label">Навигация</div>
            <div className="wk-nav">
              <Link to="/find-work" className="wk-nav-link wk-nav-primary">🔍 Найти работу</Link>
              <Link to="/my-listings" className="wk-nav-link">📢 Объявления</Link>
              <Link to="/deals" className="wk-nav-link">📋 Сделки</Link>
              <Link to="/chat" className="wk-nav-link">💬 Сообщения</Link>
              <Link to="/worker-profile" className="wk-nav-link">👤 Профиль</Link>
            </div>
          </div>
          <div className="wk-promo">
            <h3>Новые заявки ждут!</h3>
            <p>Откликайтесь первым — получайте больше заказов</p>
            <button className="wk-promo-btn" onClick={() => window.location.href = '/find-work'}>Смотреть заявки</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GUEST HOME — Авито-стиль лендинг
   ═══════════════════════════════════════════════════════════ */
function GuestHome() {
  const navigate = useNavigate();

  const gStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    .gh * { box-sizing: border-box; margin: 0; padding: 0; }
    .gh { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f2f2f2; min-height: 100vh; color: #141414; -webkit-font-smoothing: antialiased; }

    /* HERO */
    .gh-hero { background: #fff; padding: 48px 0 40px; border-bottom: 1px solid #e0e0e0; }
    .gh-hero-inner { max-width: 1260px; margin: 0 auto; padding: 0 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
    .gh-badge { display: inline-flex; align-items: center; gap: 6px; background: #e8f4fd; border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 700; color: #3d9be9; margin-bottom: 16px; }
    .gh-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #3d9be9; }
    .gh-h1 { font-size: 44px; font-weight: 900; line-height: 1.1; margin-bottom: 14px; letter-spacing: -1px; color: #141414; }
    .gh-h1 span { color: #3d9be9; }
    .gh-sub { font-size: 16px; color: #777; line-height: 1.6; margin-bottom: 28px; max-width: 420px; }
    .gh-btns { display: flex; gap: 10px; margin-bottom: 32px; }
    .gh-btn-primary { background: #3d9be9; color: #fff; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; padding: 14px 28px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; transition: background .15s; }
    .gh-btn-primary:hover { background: #2b8ad6; }
    .gh-btn-secondary { background: #fff; color: #141414; border: 1px solid #d9d9d9; border-radius: 10px; font-size: 16px; font-weight: 600; padding: 14px 24px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; transition: all .15s; }
    .gh-btn-secondary:hover { border-color: #3d9be9; color: #3d9be9; }
    .gh-stats { display: flex; gap: 24px; padding-top: 24px; border-top: 1px solid #e8e8e8; }
    .gh-stat-num { font-size: 22px; font-weight: 900; color: #141414; display: block; line-height: 1; }
    .gh-stat-lbl { font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-top: 4px; display: block; }

    .gh-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .gh-photo { border-radius: 12px; overflow: hidden; aspect-ratio: 1; position: relative; }
    .gh-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
    .gh-photo:hover img { transform: scale(1.04); }
    .gh-photo-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,.55) 0%, transparent 50%); }
    .gh-photo-label { position: absolute; bottom: 8px; left: 10px; color: #fff; font-size: 12px; font-weight: 700; }
    .gh-photo-ph { width: 100%; height: 100%; background: #e8f0fe; display: flex; align-items: center; justify-content: center; font-size: 28px; }

    /* SECTIONS */
    .gh-section { padding: 48px 0; }
    .gh-section-white { background: #fff; }
    .gh-section-gray { background: #f2f2f2; }
    .gh-wrap { max-width: 1260px; margin: 0 auto; padding: 0 20px; }
    .gh-section-top { text-align: center; margin-bottom: 36px; }
    .gh-section-tag { font-size: 12px; font-weight: 700; color: #3d9be9; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
    .gh-section-title { font-size: 28px; font-weight: 900; color: #141414; letter-spacing: -.5px; }
    .gh-section-desc { font-size: 15px; color: #999; margin-top: 8px; }

    /* HOW IT WORKS */
    .gh-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .gh-step { background: #fff; border-radius: 12px; padding: 24px 20px; border: 1px solid #e8e8e8; transition: box-shadow .18s, transform .18s; }
    .gh-step:hover { box-shadow: 0 6px 24px rgba(0,0,0,.08); transform: translateY(-2px); }
    .gh-step-num { width: 40px; height: 40px; border-radius: 10px; background: #3d9be9; color: #fff; font-size: 18px; font-weight: 900; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
    .gh-step-title { font-size: 16px; font-weight: 800; margin-bottom: 6px; }
    .gh-step-desc { font-size: 14px; color: #777; line-height: 1.55; }

    /* CATEGORIES */
    .gh-cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .gh-cat { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; overflow: hidden; text-decoration: none; color: #141414; transition: box-shadow .15s, transform .15s; }
    .gh-cat:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-2px); }
    .gh-cat-img { aspect-ratio: 4/3; overflow: hidden; background: #f5f5f5; }
    .gh-cat-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .25s; }
    .gh-cat:hover .gh-cat-img img { transform: scale(1.05); }
    .gh-cat-name { padding: 10px 12px; font-size: 13px; font-weight: 700; text-align: center; }

    /* BENEFITS */
    .gh-benefits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .gh-benefit { display: flex; gap: 14px; align-items: flex-start; }
    .gh-benefit-ico { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .gh-benefit-title { font-size: 15px; font-weight: 800; margin-bottom: 4px; }
    .gh-benefit-desc { font-size: 13px; color: #888; line-height: 1.5; }

    /* REVIEWS */
    .gh-reviews { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .gh-review { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 20px; }
    .gh-review-stars { color: #f59e0b; font-size: 14px; margin-bottom: 10px; }
    .gh-review-text { font-size: 14px; color: #555; line-height: 1.55; margin-bottom: 14px; }
    .gh-review-footer { display: flex; align-items: center; gap: 10px; }
    .gh-review-ava { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; }
    .gh-review-name { font-size: 14px; font-weight: 700; }
    .gh-review-svc { font-size: 12px; color: #999; }

    /* CTA */
    .gh-cta { background: #3d9be9; border-radius: 16px; padding: 40px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .gh-cta-title { font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 6px; }
    .gh-cta-sub { font-size: 15px; color: rgba(255,255,255,.8); }
    .gh-cta-btn { background: #fff; border: none; border-radius: 10px; color: #3d9be9; font-size: 16px; font-weight: 800; padding: 14px 32px; cursor: pointer; white-space: nowrap; font-family: inherit; transition: background .15s; flex-shrink: 0; }
    .gh-cta-btn:hover { background: #e8f4fd; }

    @media(max-width: 960px) { .gh-hero-inner { grid-template-columns: 1fr; } .gh-photos { display: none; } }
    @media(max-width: 768px) { .gh-steps, .gh-benefits, .gh-reviews { grid-template-columns: 1fr; } .gh-cta { flex-direction: column; text-align: center; } .gh-h1 { font-size: 32px; } .gh-btns { flex-direction: column; } }
  `;

  return (
    <div className="gh">
      <style>{gStyles}</style>

      {/* HERO */}
      <div className="gh-hero">
        <div className="gh-hero-inner">
          <div>
            <div className="gh-badge"><span className="gh-badge-dot"/>Йошкар-Ола</div>
            <h1 className="gh-h1">Свои мастера<br/>для <span>любых задач</span></h1>
            <p className="gh-sub">Опишите задачу — мастера откликнутся сами. Выбирайте по рейтингу, договаривайтесь внутри сервиса.</p>
            <div className="gh-btns">
              <Link to="/register" className="gh-btn-primary">Найти мастера</Link>
              <Link to="/register?role=WORKER" className="gh-btn-secondary">Стать мастером</Link>
            </div>
            <div className="gh-stats">
              {[['24/7', 'Приём заявок'], ['9', 'Категорий'], ['≤10', 'Мин. отклик'], ['5.0★', 'Рейтинг']].map(([n, l]) => (
                <div key={l}>
                  <span className="gh-stat-num">{n}</span>
                  <span className="gh-stat-lbl">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="gh-photos">
            {ALL_CATS.slice(0, 9).map(cat => (
              <Link key={cat.slug} to="/register" className="gh-photo" style={{ textDecoration: 'none' }}>
                {CAT_PHOTOS[cat.slug]
                  ? <img src={CAT_PHOTOS[cat.slug]} alt={cat.name} loading="lazy"/>
                  : <div className="gh-photo-ph">{cat.emoji || '🛠️'}</div>
                }
                <div className="gh-photo-overlay"/>
                <span className="gh-photo-label">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="gh-section gh-section-gray">
        <div className="gh-wrap">
          <div className="gh-section-top">
            <div className="gh-section-tag">Просто и понятно</div>
            <h2 className="gh-section-title">Как это работает</h2>
            <p className="gh-section-desc">Три шага от задачи до результата</p>
          </div>
          <div className="gh-steps">
            {[
              { n: '1', title: 'Создайте задачу', desc: 'Опишите что нужно сделать, укажите адрес и удобное время. Это займёт 2 минуты.' },
              { n: '2', title: 'Получите отклики', desc: 'Мастера предложат цену — смотрите рейтинг, отзывы и выбирайте лучшего.' },
              { n: '3', title: 'Заключите сделку', desc: 'Оформите безопасную сделку внутри сервиса. Оплата только после выполнения.' },
            ].map(s => (
              <div key={s.n} className="gh-step">
                <div className="gh-step-num">{s.n}</div>
                <h3 className="gh-step-title">{s.title}</h3>
                <p className="gh-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="gh-section gh-section-white">
        <div className="gh-wrap">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 className="gh-section-title">Категории услуг</h2>
            <Link to="/register" style={{ fontSize: 14, color: '#3d9be9', fontWeight: 600, textDecoration: 'none' }}>Все категории</Link>
          </div>
          <div className="gh-cats">
            {ALL_CATS.map(cat => (
              <Link key={cat.slug} to="/register" className="gh-cat">
                <div className="gh-cat-img">
                  {CAT_PHOTOS[cat.slug]
                    ? <img src={CAT_PHOTOS[cat.slug]} alt={cat.name} loading="lazy"/>
                    : <div style={{ width: '100%', height: '100%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{cat.emoji || '🛠️'}</div>
                  }
                </div>
                <div className="gh-cat-name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="gh-section gh-section-gray">
        <div className="gh-wrap">
          <div className="gh-section-top">
            <div className="gh-section-tag">Почему мы</div>
            <h2 className="gh-section-title">Преимущества сервиса</h2>
          </div>
          <div className="gh-benefits">
            {[
              { ico: '⚡', bg: '#fff8f0', title: 'Быстрый отклик', desc: 'Первые предложения от мастеров в течение 10 минут после публикации задачи' },
              { ico: '🔒', bg: '#f0fdf4', title: 'Безопасная сделка', desc: 'Деньги переходят мастеру только после подтверждения выполненной работы' },
              { ico: '⭐', bg: '#eff6ff', title: 'Проверенные мастера', desc: 'Рейтинг, отзывы и история работ — выбирайте лучшего с полной информацией' },
              { ico: '💬', bg: '#fdf4ff', title: 'Чат внутри сервиса', desc: 'Обсуждайте детали, отправляйте фото прямо в приложении' },
              { ico: '📍', bg: '#f0f7ff', title: 'Мастера рядом', desc: 'Только мастера из Йошкар-Олы — никаких долгих ожиданий' },
              { ico: '🎯', bg: '#fff8f0', title: 'Точная цена', desc: 'Мастер называет цену до начала работы. Никаких скрытых платежей' },
            ].map(b => (
              <div key={b.title} className="gh-benefit">
                <div className="gh-benefit-ico" style={{ background: b.bg }}>{b.ico}</div>
                <div>
                  <p className="gh-benefit-title">{b.title}</p>
                  <p className="gh-benefit-desc">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="gh-section gh-section-white">
        <div className="gh-wrap">
          <div className="gh-section-top">
            <div className="gh-section-tag">Отзывы</div>
            <h2 className="gh-section-title">Что говорят клиенты</h2>
          </div>
          <div className="gh-reviews">
            {[
              { ava: 'АК', color: '#6366f1', name: 'Анна К.', svc: 'Сантехника', text: 'Нашла сантехника за 15 минут. Приехал вовремя, всё сделал аккуратно. Сервис огонь!' },
              { ava: 'МР', color: '#3d9be9', name: 'Михаил Р.', svc: 'Электрика', text: 'Заказывал электрика для новой квартиры. Мастер профессиональный, цена честная.' },
              { ava: 'СТ', color: '#22c55e', name: 'Светлана Т.', svc: 'Репетиторство', text: 'Репетитор по математике для дочки — нашла через сервис. Уже видим результат!' },
            ].map(r => (
              <div key={r.name} className="gh-review">
                <div className="gh-review-stars">★★★★★</div>
                <p className="gh-review-text">{r.text}</p>
                <div className="gh-review-footer">
                  <div className="gh-review-ava" style={{ background: r.color }}>{r.ava}</div>
                  <div>
                    <p className="gh-review-name">{r.name}</p>
                    <p className="gh-review-svc">{r.svc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gh-section gh-section-gray">
        <div className="gh-wrap">
          <div className="gh-cta">
            <div>
              <h2 className="gh-cta-title">Готовы разместить задачу?</h2>
              <p className="gh-cta-sub">Зарегистрируйтесь бесплатно — первые отклики уже через 10 минут</p>
            </div>
            <button className="gh-cta-btn" onClick={() => navigate('/register')}>Начать бесплатно</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { userId, userRole, userName } = useAuth();
  if (userRole === 'WORKER') return <WorkerHome userId={userId} userName={userName}/>;
  if (userId)               return <CustomerHome userId={userId} userName={userName}/>;
  return <GuestHome/>;
}