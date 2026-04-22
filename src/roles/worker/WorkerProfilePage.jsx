import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, getReviewsByWorker, uploadAvatar, getUserProfile } from '../../api';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function memberSince(d) {
  if (!d) return null;
  return 'На сервисе с ' + new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .mp-page { background: #fff; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  .mp-wrap { max-width: 1176px; margin: 0 auto; padding: 0 20px; }
  .mp-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; padding: 28px 0 60px; align-items: flex-start; }

  /* ── SIDEBAR ── */
  .mp-ava-wrap { position: relative; display: inline-block; margin-bottom: 14px; cursor: pointer; }
  .mp-ava {
    width: 88px; height: 88px; border-radius: 50%; object-fit: cover; display: block;
    border: 2px solid #f0f0f0;
  }
  .mp-ava-fb {
    width: 88px; height: 88px; border-radius: 50%;
    background: linear-gradient(135deg, #e8410a, #ff7043);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 800; color: #fff;
  }
  .mp-ava-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(0,0,0,.42);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .18s;
  }
  .mp-ava-wrap:hover .mp-ava-overlay { opacity: 1; }
  .mp-ava-ico { color: #fff; font-size: 20px; }
  .mp-ava-lbl {
    display: block; font-size: 12px; color: #e8410a; font-weight: 600;
    margin-top: 4px; cursor: pointer; background: none; border: none;
    font-family: inherit; padding: 0; text-align: left;
  }

  .mp-name { font-size: 22px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; color: #111; }
  .mp-role { display: inline-block; font-size: 12px; font-weight: 600; color: #e8410a; background: #fff4f1; border-radius: 20px; padding: 3px 10px; margin-bottom: 8px; }
  .mp-since { font-size: 13px; color: #999; margin-bottom: 14px; }

  .mp-badges { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .mp-badge { display: flex; align-items: center; gap: 8px; background: #e8f4ff; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #1464b0; font-weight: 500; }
  .mp-badge svg { flex-shrink: 0; }

  .mp-stats-strip { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
  .mp-strip-cell { padding: 12px 6px; text-align: center; border-right: 1px solid #f0f0f0; }
  .mp-strip-cell:last-child { border-right: none; }
  .mp-strip-num { font-size: 20px; font-weight: 800; color: #111; line-height: 1; }
  .mp-strip-lbl { font-size: 10px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-top: 4px; display: block; }

  .mp-nav { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
  .mp-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500;
    color: #333; text-decoration: none; transition: background .15s;
    cursor: pointer; background: none; border: none; font-family: inherit; text-align: left; width: 100%;
  }
  .mp-nav-item:hover { background: #f5f5f5; }
  .mp-nav-item.active { background: #fff4f1; color: #e8410a; font-weight: 700; }
  .mp-nav-ico { font-size: 18px; flex-shrink: 0; width: 22px; }

  .mp-btn-logout {
    display: block; width: 100%; padding: 11px 0;
    background: none; border: 1.5px solid #e0e0e0; border-radius: 8px;
    color: #777; font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: inherit; transition: border-color .15s, color .15s;
  }
  .mp-btn-logout:hover { border-color: #999; color: #333; }

  /* ── MAIN ── */
  .mp-section-title { font-size: 20px; font-weight: 700; margin-bottom: 18px; color: #111; }

  /* сделки */
  .mp-deals-list { display: flex; flex-direction: column; gap: 1px; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; }
  .mp-deal-row {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 18px; background: #fff; text-decoration: none; color: inherit;
    transition: background .15s;
  }
  .mp-deal-row:hover { background: #fafafa; }
  .mp-deal-row + .mp-deal-row { border-top: 1px solid #f0f0f0; }
  .mp-deal-ico { font-size: 28px; flex-shrink: 0; width: 44px; height: 44px; border-radius: 10px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
  .mp-deal-info { flex: 1; min-width: 0; }
  .mp-deal-title { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mp-deal-meta { font-size: 12px; color: #aaa; }
  .mp-deal-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .mp-deal-badge-done { background: #dcfce7; color: #16a34a; }
  .mp-deal-badge-active { background: #fef3c7; color: #d97706; }
  .mp-deal-badge-pending { background: #e8f4ff; color: #1464b0; }

  /* быстрые действия */
  .mp-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .mp-action {
    display: flex; flex-direction: column; align-items: flex-start;
    padding: 18px; border: 1px solid #f0f0f0; border-radius: 12px;
    text-decoration: none; color: inherit; transition: box-shadow .18s, transform .18s;
  }
  .mp-action:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-2px); }
  .mp-action-primary { background: #e8410a; border-color: #e8410a; color: #fff; }
  .mp-action-primary:hover { background: #d03a09; box-shadow: 0 4px 18px rgba(232,65,10,.25); }
  .mp-action-ico { font-size: 26px; margin-bottom: 10px; }
  .mp-action-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .mp-action-desc { font-size: 12px; opacity: .7; }

  /* отзывы */
  .mp-reviews-list { display: flex; flex-direction: column; }
  .mp-review { padding: 16px 0; border-bottom: 1px solid #f5f5f5; }
  .mp-review:last-child { border-bottom: none; }
  .mp-review-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .mp-review-ava-fb { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#e8410a,#ff7043); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .mp-review-author { font-size: 14px; font-weight: 700; }
  .mp-review-date { font-size: 12px; color: #aaa; }
  .mp-review-stars { color: #f59e0b; font-size: 14px; margin-left: auto; }
  .mp-review-text { font-size: 13px; color: #555; line-height: 1.6; padding-left: 50px; }

  /* настройки */
  .mp-settings { display: flex; flex-direction: column; gap: 1px; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; }
  .mp-setting-row {
    display: flex; align-items: center; gap: 14px; padding: 16px 18px;
    background: #fff; text-decoration: none; color: inherit; transition: background .15s;
    border: none; font-family: inherit; cursor: pointer; text-align: left; width: 100%;
  }
  .mp-setting-row:hover { background: #fafafa; }
  .mp-setting-row + .mp-setting-row { border-top: 1px solid #f0f0f0; }
  .mp-setting-ico { font-size: 22px; flex-shrink: 0; }
  .mp-setting-info { flex: 1; }
  .mp-setting-title { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 2px; }
  .mp-setting-desc { font-size: 12px; color: #aaa; }
  .mp-setting-arrow { color: #ccc; font-size: 18px; }
  .mp-setting-soon { font-size: 11px; font-weight: 700; color: #257af4; background: #e8f4ff; padding: 3px 8px; border-radius: 4px; }

  .mp-empty { padding: 48px 0; text-align: center; color: #aaa; font-size: 14px; }
  .mp-empty-ico { font-size: 40px; margin-bottom: 10px; }

  @media(max-width:900px) { .mp-layout { grid-template-columns: 1fr; } .mp-actions { grid-template-columns: 1fr; } }
`;

export default function WorkerProfilePage() {
  const { userId, userName, userRole, userAvatar, updateAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('deals');

  const fullAvatarUrl = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar)
    : '';

  useEffect(() => {
    if (userRole === 'CUSTOMER') { navigate('/profile', { replace: true }); }
  }, [userRole, navigate]);

  useEffect(() => {
    if (!userId || userRole === 'CUSTOMER') return;
    setLoading(true);
    Promise.all([
      getMyDeals(userId),
      getReviewsByWorker(userId),
      getUserProfile(userId),
    ]).then(([d, r, p]) => {
      setDeals(d || []);
      setReviews((r || []).filter(x => x.status === 'APPROVED'));
      setProfile(p || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId, userRole]);

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const base64 = await compressImage(file);
      try {
        const res = await uploadAvatar(userId, base64);
        updateAvatar(res?.avatarUrl || base64);
      } catch { updateAvatar(base64); }
    } finally { setAvatarLoading(false); }
    e.target.value = '';
  };

  if (userRole === 'CUSTOMER') return null;

  const initials = (userName || 'М').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);
  const fullName = [userName, profile?.lastName].filter(Boolean).join(' ');
  const since = memberSince(profile?.registeredAt || profile?.createdAt);

  const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
  const activeDeals    = deals.filter(d => d.status === 'IN_PROGRESS').length;
  const pendingDeals   = deals.filter(d => d.status === 'PENDING').length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const dealStatusLabel = (s) => {
    if (s === 'COMPLETED') return { label: 'Завершена', cls: 'mp-deal-badge-done' };
    if (s === 'IN_PROGRESS') return { label: 'В работе', cls: 'mp-deal-badge-active' };
    if (s === 'PENDING') return { label: 'Ожидает', cls: 'mp-deal-badge-pending' };
    return { label: s, cls: 'mp-deal-badge-active' };
  };

  return (
    <div className="mp-page">
      <style>{css}</style>

      <div className="mp-wrap">
        <div className="mp-layout">

          {/* ══ САЙДБАР ══ */}
          <div>
            {/* Аватар */}
            <div className="mp-ava-wrap" onClick={() => avatarInputRef.current?.click()}>
              {fullAvatarUrl
                ? <img src={fullAvatarUrl} alt="" className="mp-ava" />
                : <div className="mp-ava-fb">{initials}</div>
              }
              <div className="mp-ava-overlay">
                <span className="mp-ava-ico">{avatarLoading ? '⏳' : '📷'}</span>
              </div>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarChange} />
            <button className="mp-ava-lbl" onClick={() => avatarInputRef.current?.click()}>
              {avatarLoading ? 'Загрузка...' : fullAvatarUrl ? 'Изменить фото' : '+ Добавить фото'}
            </button>

            <h1 className="mp-name" style={{marginTop:10}}>{fullName || 'Мастер'}</h1>
            <span className="mp-role">Мастер</span>
            {since && <div className="mp-since">{since}</div>}

            <div className="mp-badges">
              <div className="mp-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7.5" stroke="#257af4" strokeWidth="1"/>
                  <path d="M5 8l2 2 4-4" stroke="#257af4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Документы проверены
              </div>
              <div className="mp-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7.5" stroke="#257af4" strokeWidth="1"/>
                  <path d="M5 8l2 2 4-4" stroke="#257af4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Йошкар-Ола
              </div>
            </div>

            <div className="mp-stats-strip">
              <div className="mp-strip-cell">
                <div className="mp-strip-num">{completedDeals}</div>
                <span className="mp-strip-lbl">Сделок</span>
              </div>
              <div className="mp-strip-cell">
                <div className="mp-strip-num">{avgRating}</div>
                <span className="mp-strip-lbl">Рейтинг</span>
              </div>
              <div className="mp-strip-cell">
                <div className="mp-strip-num">{reviews.length}</div>
                <span className="mp-strip-lbl">Отзывов</span>
              </div>
            </div>

            <nav className="mp-nav">
              <button className={`mp-nav-item${section==='deals'?' active':''}`} onClick={() => setSection('deals')}>
                <span className="mp-nav-ico">📋</span> Мои сделки
              </button>
              <button className={`mp-nav-item${section==='reviews'?' active':''}`} onClick={() => setSection('reviews')}>
                <span className="mp-nav-ico">⭐</span> Мои отзывы
              </button>
              <Link to="/find-work" className="mp-nav-item">
                <span className="mp-nav-ico">🔍</span> Найти работу
              </Link>
              <Link to="/chat" className="mp-nav-item">
                <span className="mp-nav-ico">💬</span> Сообщения
              </Link>
              <button className={`mp-nav-item${section==='settings'?' active':''}`} onClick={() => setSection('settings')}>
                <span className="mp-nav-ico">⚙️</span> Настройки
              </button>
            </nav>

            <button className="mp-btn-logout" onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </button>
          </div>

          {/* ══ ОСНОВНОЙ КОНТЕНТ ══ */}
          <div>

            {/* Быстрые действия */}
            <div className="mp-actions">
              <Link to="/find-work" className="mp-action mp-action-primary">
                <span className="mp-action-ico">🔍</span>
                <div className="mp-action-name">Найти работу</div>
                <div className="mp-action-desc">Новые заявки</div>
              </Link>
              <Link to="/deals" className="mp-action">
                <span className="mp-action-ico">📋</span>
                <div className="mp-action-name">Мои сделки</div>
                <div className="mp-action-desc">Активных: {activeDeals + pendingDeals}</div>
              </Link>
              <Link to="/chat" className="mp-action">
                <span className="mp-action-ico">💬</span>
                <div className="mp-action-name">Сообщения</div>
                <div className="mp-action-desc">Чат с заказчиками</div>
              </Link>
            </div>

            {/* Сделки */}
            {section === 'deals' && (
              <>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                  <h2 className="mp-section-title" style={{marginBottom:0}}>Мои сделки</h2>
                  <Link to="/deals" style={{fontSize:13,color:'#257af4',textDecoration:'none'}}>Все сделки →</Link>
                </div>
                {loading ? (
                  <div className="mp-empty"><div className="mp-empty-ico">⏳</div><p>Загрузка...</p></div>
                ) : deals.length === 0 ? (
                  <div className="mp-empty">
                    <div className="mp-empty-ico">📋</div>
                    <p>Сделок пока нет</p>
                    <Link to="/find-work" style={{display:'inline-block',marginTop:12,padding:'10px 20px',background:'#e8410a',color:'#fff',borderRadius:8,fontWeight:700,textDecoration:'none',fontSize:14}}>Найти работу</Link>
                  </div>
                ) : (
                  <div className="mp-deals-list">
                    {deals.slice(0, 10).map(deal => {
                      const { label, cls } = dealStatusLabel(deal.status);
                      return (
                        <Link key={deal.id} to={`/deals?dealId=${deal.id}`} className="mp-deal-row">
                          <div className="mp-deal-ico">
                            {deal.status === 'COMPLETED' ? '✅' : deal.status === 'PENDING' ? '⏳' : '🔨'}
                          </div>
                          <div className="mp-deal-info">
                            <div className="mp-deal-title">{deal.title || 'Сделка'}</div>
                            <div className="mp-deal-meta">
                              {deal.customerName && `${deal.customerName} · `}
                              {deal.agreedPrice && `${Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽ · `}
                              {new Date(deal.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                          <div className={`mp-deal-badge ${cls}`}>{label}</div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Отзывы */}
            {section === 'reviews' && (
              <>
                <h2 className="mp-section-title">Мои отзывы ({reviews.length})</h2>
                {reviews.length === 0 ? (
                  <div className="mp-empty"><div className="mp-empty-ico">⭐</div><p>Отзывов пока нет</p></div>
                ) : (
                  <div className="mp-reviews-list">
                    {reviews.map(r => (
                      <div key={r.id} className="mp-review">
                        <div className="mp-review-top">
                          <div className="mp-review-ava-fb">{(r.customerName||'К')[0].toUpperCase()}</div>
                          <div>
                            <div className="mp-review-author">{r.customerName || 'Заказчик'}</div>
                            <div className="mp-review-date">{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'})}</div>
                          </div>
                          <div className="mp-review-stars">{'★'.repeat(r.rating||0)}<span style={{color:'#e0e0e0'}}>{'★'.repeat(5-(r.rating||0))}</span></div>
                        </div>
                        {r.text && <div className="mp-review-text">{r.text}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Настройки */}
            {section === 'settings' && (
              <>
                <h2 className="mp-section-title">Настройки</h2>
                <div className="mp-settings">
                  <Link to="/settings/personal" className="mp-setting-row">
                    <span className="mp-setting-ico">👤</span>
                    <div className="mp-setting-info">
                      <div className="mp-setting-title">Личные данные</div>
                      <div className="mp-setting-desc">Имя, контактная информация</div>
                    </div>
                    <span className="mp-setting-arrow">›</span>
                  </Link>
                  <Link to="/settings/notifications" className="mp-setting-row">
                    <span className="mp-setting-ico">🔔</span>
                    <div className="mp-setting-info">
                      <div className="mp-setting-title">Уведомления</div>
                      <div className="mp-setting-desc">Push и email уведомления</div>
                    </div>
                    <span className="mp-setting-arrow">›</span>
                  </Link>
                  <div className="mp-setting-row" style={{cursor:'default'}}>
                    <span className="mp-setting-ico">💳</span>
                    <div className="mp-setting-info">
                      <div className="mp-setting-title">Платёжные данные</div>
                      <div className="mp-setting-desc">Способы получения оплаты</div>
                    </div>
                    <span className="mp-setting-soon">СКОРО</span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
