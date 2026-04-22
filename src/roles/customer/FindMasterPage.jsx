import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCategories, getListings } from '../../api';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const CATEGORY_STYLES = {
  'remont-kvartir':      { emoji: '🏠', color: '#fff3e0' },
  'santehnika':          { emoji: '🔧', color: '#e3f2fd' },
  'elektrika':           { emoji: '⚡', color: '#fffde7' },
  'uborka':              { emoji: '🧹', color: '#fce4ec' },
  'parikhmaher':         { emoji: '💇', color: '#fce4ec' },
  'manikur':             { emoji: '💅', color: '#fce4ec' },
  'krasota-i-zdorovie':  { emoji: '✨', color: '#f3e5f5' },
  'repetitorstvo':       { emoji: '📚', color: '#e3f2fd' },
  'kompyuternaya-pomosh':{ emoji: '💻', color: '#e8f5e9' },
};

const css = `
  .fmp-page { background: #f7f8fa; min-height: 100vh; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }
  .fmp-wrap { max-width: 1000px; margin: 0 auto; padding: 0 16px 60px; }

  /* Хедер категории */
  .fmp-cat-hdr { background: linear-gradient(135deg, #1a0a00 0%, #3d1200 50%, #e8410a 100%); padding: 20px 0 24px; }
  .fmp-cat-hdr-inner { max-width: 1000px; margin: 0 auto; padding: 0 16px; }
  .fmp-back { background: none; border: none; font-size: 13px; color: rgba(255,255,255,.75); cursor: pointer; padding: 0; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-bottom: 14px; }
  .fmp-back:hover { color: #fff; }
  .fmp-cat-title-row { display: flex; align-items: center; gap: 14px; }
  .fmp-cat-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; background: rgba(255,255,255,.15); }
  .fmp-cat-name { font-size: 24px; font-weight: 900; margin: 0 0 3px; color: #fff; letter-spacing: -.3px; }
  .fmp-cat-sub { font-size: 13px; color: rgba(255,255,255,.65); margin: 0; }

  /* Фильтры */
  .fmp-filters { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 0; }
  .fmp-filters-inner { max-width: 1000px; margin: 0 auto; padding: 0 16px; display: flex; gap: 0; align-items: stretch; }
  .fmp-search { flex: 1; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-right: 1px solid #e8e8e8; }
  .fmp-search input { flex: 1; border: none; background: none; font-size: 14px; color: #1a1a1a; padding: 14px 0; outline: none; font-family: Arial, sans-serif; }
  .fmp-search input::placeholder { color: #9ca3af; }
  .fmp-select { padding: 0 16px; border: none; border-right: 1px solid #e8e8e8; font-size: 13px; outline: none; background: #fff; color: #1a1a1a; cursor: pointer; height: 100%; font-family: Arial, sans-serif; }
  .fmp-select:focus { background: #fff9f7; }
  .fmp-toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; cursor: pointer; white-space: nowrap; padding: 0 16px; font-weight: 600; }
  .fmp-toggle input { accent-color: #e8410a; width: 16px; height: 16px; cursor: pointer; }
  .fmp-filter-count { padding: 0 16px; display: flex; align-items: center; font-size: 13px; color: #9ca3af; border-left: 1px solid #e8e8e8; white-space: nowrap; }

  /* Список */
  .fmp-list { display: flex; flex-direction: column; gap: 0; background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; overflow: hidden; }
  .fmp-item { display: flex; border-bottom: 1px solid #f0f0f0; transition: background .15s; cursor: pointer; }
  .fmp-item:last-child { border-bottom: none; }
  .fmp-item:hover { background: #fafafa; }

  /* Фото */
  .fmp-item-img { width: 130px; height: 130px; flex-shrink: 0; background: #f5f5f5; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
  .fmp-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .fmp-item-img-ph { font-size: 40px; color: #d1d5db; }
  .fmp-item-img-cnt { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,.5); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 3px; }

  /* Контент */
  .fmp-item-body { flex: 1; padding: 14px 16px; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .fmp-item-worker { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
  .fmp-item-ava { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; object-fit: cover; }
  .fmp-item-ava-ph { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; }
  .fmp-item-name { font-size: 14px; font-weight: 700; color: #1a1a1a; }
  .fmp-item-city { font-size: 12px; color: #9ca3af; }
  .fmp-item-title { font-size: 16px; font-weight: 700; color: #1a1a1a; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .fmp-item-desc { font-size: 13px; color: #6b6b6b; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.5; }
  .fmp-item-badges { display: flex; gap: 6px; flex-wrap: wrap; }
  .fmp-badge { font-size: 11px; color: #374151; background: #f3f4f6; border-radius: 4px; padding: 2px 7px; font-weight: 600; }
  .fmp-item-stats { display: flex; gap: 14px; font-size: 12px; color: #8f8f8f; align-items: center; }
  .fmp-stars { color: #f59e0b; font-size: 13px; }
  .fmp-item-price { font-size: 18px; font-weight: 800; color: #1a1a1a; }
  .fmp-item-price-unit { font-size: 12px; color: #8f8f8f; font-weight: 500; margin-left: 4px; }

  /* Правая панель */
  .fmp-item-right { width: 160px; flex-shrink: 0; padding: 14px 12px; display: flex; flex-direction: column; gap: 8px; justify-content: center; border-left: 1px solid #f0f0f0; }
  .fmp-btn-write { background: #e8410a; border: none; border-radius: 7px; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 0; cursor: pointer; width: 100%; transition: background .15s; }
  .fmp-btn-write:hover { background: #d03a09; }
  .fmp-btn-order { background: #fff; border: 1.5px solid #e8410a; border-radius: 7px; color: #e8410a; font-size: 13px; font-weight: 700; padding: 8px 0; cursor: pointer; width: 100%; transition: background .15s; }
  .fmp-btn-order:hover { background: #fde8e0; }
  .fmp-item-cat-tag { font-size: 11px; color: #fff; background: #e8410a; border-radius: 4px; padding: 2px 8px; font-weight: 600; text-align: center; }

  /* Список категорий — оранжевый стиль */
  .fmp-cats-hero { background: linear-gradient(135deg, #1a0a00 0%, #3d1200 50%, #e8410a 100%); padding: 48px 0 40px; }
  .fmp-cats-hero-inner { max-width: 1000px; margin: 0 auto; padding: 0 16px; }
  .fmp-cats-hero h1 { font-size: 34px; font-weight: 900; color: #fff; margin: 0 0 8px; letter-spacing: -.5px; }
  .fmp-cats-hero p { font-size: 15px; color: rgba(255,255,255,.65); margin: 0; }
  .fmp-cats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; padding: 28px 16px 60px; max-width: 1000px; margin: 0 auto; }
  .fmp-cat-card { background: #fff; border-radius: 14px; padding: 22px 18px 18px; display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: #1a1a1a; transition: transform .18s, box-shadow .18s; box-shadow: 0 2px 8px rgba(0,0,0,.07); position: relative; overflow: hidden; border: 1.5px solid #f3f4f6; }
  .fmp-cat-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #e8410a, #ff7043); transform: scaleX(0); transition: transform .2s; transform-origin: left; }
  .fmp-cat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(232,65,10,.15); border-color: rgba(232,65,10,.2); }
  .fmp-cat-card:hover::after { transform: scaleX(1); }
  .fmp-cat-card-icon { width: 52px; height: 52px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; margin-bottom: 2px; }
  .fmp-cat-card-name { font-size: 14px; font-weight: 800; margin: 0; line-height: 1.3; color: #111827; }
  .fmp-cat-card-count { font-size: 11px; color: #9ca3af; font-weight: 500; }
  .fmp-cat-card-arr { position: absolute; top: 14px; right: 14px; width: 24px; height: 24px; border-radius: 50%; background: #fff3f0; display: flex; align-items: center; justify-content: center; color: #e8410a; font-size: 14px; transition: background .15s, transform .15s; }
  .fmp-cat-card:hover .fmp-cat-card-arr { background: #e8410a; color: #fff; transform: translateX(2px); }
  .fmp-cat-card-masters { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #e8410a; background: #fff3f0; border-radius: 20px; padding: 3px 9px; font-weight: 700; width: fit-content; border: 1px solid #fecab5; }

  /* Пустое/ошибка */
  .fmp-empty { text-align: center; padding: 80px 24px; background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; color: #8f8f8f; }
  .fmp-empty h3 { font-size: 17px; font-weight: 700; color: #1a1a1a; margin: 12px 0 8px; }

  /* Скелетон */
  .fmp-skel { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; overflow: hidden; }
  .fmp-skel-row { display: flex; border-bottom: 1px solid #f0f0f0; padding: 14px 16px; gap: 16px; }
  .fmp-skel-img { width: 130px; height: 130px; background: #f0f0f0; border-radius: 6px; flex-shrink: 0; }
  .fmp-skel-body { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .fmp-skel-line { background: #f0f0f0; border-radius: 4px; }

  .fmp-page-hdr { background: #fff; border-bottom: 1.5px solid #e5e7eb; padding: 20px 0; }
  .fmp-page-hdr-inner { max-width: 1000px; margin: 0 auto; padding: 0 16px; }
  .fmp-page-hdr h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
  .fmp-page-hdr p { font-size: 14px; color: #8f8f8f; margin: 0; }

  @media(max-width: 700px) {
    .fmp-item-right { display: none; }
    .fmp-item-img { width: 90px; height: 90px; }
  }
`;

export default function FindMasterPage() {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState([]);
  const [services,   setServices]   = useState([]);
  const [workerStats, setWorkerStats] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy,     setSortBy]     = useState('recency');

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getListings()])
      .then(([cats, listings]) => {
        setCategories(cats);
        const processed = (listings || []).map(item => ({
          ...item,
          workerId: item.workerId,
          workerUserId: item.workerId,
          workerName: [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
          priceFrom: item.price || 0,
        }));
        setServices(processed);
        const uniqueIds = [...new Set(processed.map(s => s.workerId))];
        uniqueIds.forEach(async (wid) => {
          try {
            const r = await fetch(`${API}/workers/${wid}/stats`);
            if (r.ok) {
              const stats = await r.json();
              setWorkerStats(prev => ({ ...prev, [wid]: stats }));
            }
          } catch {}
        });
      })
      .catch(e => setError(e?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const selectedCategory = categories.find(c => c.slug === categorySlug);

  // ══ СПИСОК КАТЕГОРИЙ ══
  if (!categorySlug) {
    return (
      <div className="fmp-page">
        <style>{css}</style>

        <>
          {/* Hero */}
          <div className="fmp-cats-hero">
            <div className="fmp-cats-hero-inner">
              <h1>Найти активного мастера</h1>
              <p>Профессионалы для любых задач в Йошкар-Оле</p>
            </div>
          </div>

          <div>
          {loading ? (
            <div className="fmp-cats-grid" style={{marginTop:0}}>
              {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} style={{padding:'20px',display:'flex',flexDirection:'column',gap:10,borderRight:'1px solid #e8e8e8',borderBottom:'1px solid #e8e8e8'}}>
                  <div style={{width:56,height:56,background:'#f0f0f0',borderRadius:14}}/>
                  <div style={{height:15,background:'#f0f0f0',borderRadius:4,width:'70%'}}/>
                  <div style={{height:12,background:'#f0f0f0',borderRadius:4,width:'50%'}}/>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="fmp-empty"><div style={{fontSize:40}}>😕</div><h3>{error}</h3></div>
          ) : (
            <div className="fmp-cats-grid">
              {categories.map(cat => {
                const style = CATEGORY_STYLES[cat.slug] || { emoji: '🛠️', color: '#fff3e0' };
                const count = services.filter(s => s.category === cat.name || s.categoryId === cat.id).filter(s => s.active !== false).length;
                return (
                  <Link key={cat.id} to={`/find-master/${cat.slug}`} className="fmp-cat-card">
                    <span className="fmp-cat-card-arr">›</span>
                    <div className="fmp-cat-card-icon" style={{background: style.color}}>{style.emoji}</div>
                    <div className="fmp-cat-card-name">{cat.name}</div>
                    {count > 0
                      ? <span className="fmp-cat-card-masters">👤 {count} {count===1?'мастер':count<5?'мастера':'мастеров'}</span>
                      : <span className="fmp-cat-card-count">Нет объявлений</span>
                    }
                  </Link>
                );
              })}
            </div>
          )}
          </div>
        </>
      </div>
    );
  }

  if (!loading && !selectedCategory) {
    return (
      <div className="fmp-page">
        <style>{css}</style>
        <div className="fmp-wrap" style={{paddingTop:40,textAlign:'center'}}>
          <p>Категория не найдена</p>
          <Link to="/find-master" className="fmp-btn-write" style={{display:'inline-block',marginTop:16,padding:'10px 24px',textDecoration:'none'}}>К категориям</Link>
        </div>
      </div>
    );
  }

  const visibleServices = services
    .filter(item => {
      const catMatch = item.category === selectedCategory?.name || item.categoryId === selectedCategory?.id || String(item.categoryId) === String(selectedCategory?.id);
      if (!catMatch) return false;
      if (showActiveOnly && !item.active) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.trim().toLowerCase();
      return (item.title||'').toLowerCase().includes(q) || (item.description||'').toLowerCase().includes(q) || (item.workerName||'').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc')  return (a.priceFrom||0) - (b.priceFrom||0);
      if (sortBy === 'priceDesc') return (b.priceFrom||0) - (a.priceFrom||0);
      if (sortBy === 'name')      return (a.workerName||'').localeCompare(b.workerName||'');
      return new Date(b.createdAt||0) - new Date(a.createdAt||0);
    });

  const catStyle = CATEGORY_STYLES[selectedCategory?.slug] || { emoji: '🛠️', color: '#fff3e0' };

  return (
    <div className="fmp-page">
      <style>{css}</style>

      {/* Хедер категории */}
      <div className="fmp-cat-hdr">
        <div className="fmp-cat-hdr-inner">
          <button className="fmp-back" onClick={() => navigate('/find-master')}>← Все категории</button>
          <div className="fmp-cat-title-row">
            <div className="fmp-cat-icon" style={{background: catStyle.color}}>{catStyle.emoji}</div>
            <div>
              <h1 className="fmp-cat-name">{selectedCategory?.name}</h1>
              <p className="fmp-cat-sub">{selectedCategory?.description || 'Найдите проверенного мастера'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="fmp-filters">
        <div className="fmp-filters-inner">
          <div className="fmp-search">
            <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Поиск мастера или услуги..." />
          </div>
          <select className="fmp-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="recency">По новизне</option>
            <option value="priceAsc">Цена ↑</option>
            <option value="priceDesc">Цена ↓</option>
            <option value="name">По имени</option>
          </select>
          <label className="fmp-toggle">
            <input type="checkbox" checked={showActiveOnly} onChange={e => setShowActiveOnly(e.target.checked)} />
            Только активные
          </label>
          <div className="fmp-filter-count">{visibleServices.length} мастеров</div>
        </div>
      </div>

      <div className="fmp-wrap" style={{paddingTop:0}}>
        {loading ? (
          <div className="fmp-skel">
            {[1,2,3].map(i => (
              <div key={i} className="fmp-skel-row">
                <div className="fmp-skel-img"/>
                <div className="fmp-skel-body">
                  <div className="fmp-skel-line" style={{height:14,width:'40%'}}/>
                  <div className="fmp-skel-line" style={{height:18,width:'60%'}}/>
                  <div className="fmp-skel-line" style={{height:12,width:'80%'}}/>
                  <div className="fmp-skel-line" style={{height:20,width:'25%'}}/>
                </div>
              </div>
            ))}
          </div>
        ) : visibleServices.length === 0 ? (
          <div className="fmp-empty">
            <div style={{fontSize:48}}>🔍</div>
            <h3>Мастера не найдены</h3>
            <p>{showActiveOnly ? 'Пока нет активных объявлений в этой категории. Попробуйте снять фильтр.' : 'В этой категории пока нет мастеров.'}</p>
            <Link to="/find-master" style={{display:'inline-block',marginTop:16,padding:'10px 24px',background:'#e8410a',color:'#fff',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:14}}>← Все категории</Link>
          </div>
        ) : (
          <div className="fmp-list">
            {visibleServices.map(s => {
              const stats  = workerStats[s.workerId || s.workerUserId];
              const hasPhoto = s.photos?.length > 0;
              const workerAva = stats?.workerAvatar || null;
              return (
                <div key={s.id} className="fmp-item" onClick={() => navigate(`/workers/${s.workerId || s.workerUserId}`)}>
                  {/* Фото объявления */}
                  <div className="fmp-item-img">
                    {hasPhoto
                      ? <><img src={s.photos[0]} alt=""/>{s.photos.length>1 && <span className="fmp-item-img-cnt">📷{s.photos.length}</span>}</>
                      : <div className="fmp-item-img-ph">🔧</div>
                    }
                  </div>

                  {/* Контент */}
                  <div className="fmp-item-body">
                    {/* Мастер */}
                    <div className="fmp-item-worker">
                      {(s.workerAvatar && s.workerAvatar.length > 10) || (workerAva && workerAva.length > 10)
                        ? <img src={s.workerAvatar || workerAva} alt="" className="fmp-item-ava" style={{border:'2px solid #f3f4f6'}}/>
                        : <div className="fmp-item-ava-ph" style={{background:'linear-gradient(135deg,#e8410a,#ff7043)'}}>{(s.workerName||'М')[0].toUpperCase()}</div>
                      }
                      <div>
                        <div className="fmp-item-name">{s.workerName}</div>
                        <div className="fmp-item-city">{selectedCategory?.name} • Йошкар-Ола</div>
                      </div>
                    </div>

                    {/* Название */}
                    <div className="fmp-item-title">{s.title}</div>

                    {/* Описание */}
                    {s.description && <div className="fmp-item-desc">{s.description}</div>}

                    {/* Бейджи */}
                    <div className="fmp-item-badges">
                      <span className="fmp-badge">✓ Проверен</span>
                      <span className="fmp-badge">⚡ Быстрый отклик</span>
                      <span className="fmp-badge">🛡️ Гарантия</span>
                    </div>

                    {/* Статистика */}
                    {stats && (
                      <div className="fmp-item-stats">
                        <span className="fmp-stars">{'★'.repeat(Math.round(stats.averageRating||0))}</span>
                        <span style={{fontWeight:700}}>{(stats.averageRating||0).toFixed(1)}</span>
                        <span>({stats.reviewsCount||0} {stats.reviewsCount===1?'отзыв':stats.reviewsCount<5?'отзыва':'отзывов'})</span>
                        <span>📦 {stats.completedWorksCount||0} заказов</span>
                      </div>
                    )}

                    {/* Цена */}
                    <div className="fmp-item-price">
                      {s.priceFrom ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Цена по договорённости'}
                      {s.priceUnit && <span className="fmp-item-price-unit">{s.priceUnit}</span>}
                    </div>
                  </div>

                  {/* Правая панель */}
                  <div className="fmp-item-right" onClick={e => e.stopPropagation()}>
                    {s.category && <span className="fmp-item-cat-tag">{s.category}</span>}
                    <button className="fmp-btn-write" onClick={() => navigate(`/chat/${s.workerId||s.workerUserId}`)}>💬 Написать</button>
                    <button className="fmp-btn-order" onClick={() => navigate(`/categories/${categorySlug}?title=${encodeURIComponent(s.title||'')}`)}>Заказать</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}