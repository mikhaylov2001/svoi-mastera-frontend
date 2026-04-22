import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, uploadAvatar, getUserProfile } from '../../api';
import ReviewForm from '../../components/ReviewForm';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function memberSince(d) {
  if (!d) return null;
  return 'На сервисе с ' + new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .cp2-page { background: #fff; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }
  .cp2-wrap { max-width: 1176px; margin: 0 auto; padding: 0 20px; }
  .cp2-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; padding: 28px 0 60px; align-items: flex-start; }

  /* ── SIDEBAR ── */
  .cp2-ava-wrap { position: relative; display: inline-block; margin-bottom: 14px; cursor: pointer; }
  .cp2-ava { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; display: block; border: 2px solid #f0f0f0; }
  .cp2-ava-fb { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, #257af4, #1a5cbf); display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 800; color: #fff; }
  .cp2-ava-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,.42); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .18s; }
  .cp2-ava-wrap:hover .cp2-ava-overlay { opacity: 1; }
  .cp2-ava-lbl { display: block; font-size: 12px; color: #e8410a; font-weight: 600; margin-top: 4px; cursor: pointer; background: none; border: none; font-family: inherit; padding: 0; text-align: left; }

  .cp2-name { font-size: 22px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; color: #111; }
  .cp2-role { display: inline-block; font-size: 12px; font-weight: 600; color: #257af4; background: #e8f4ff; border-radius: 20px; padding: 3px 10px; margin-bottom: 8px; }
  .cp2-since { font-size: 13px; color: #999; margin-bottom: 14px; }

  .cp2-badges { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .cp2-badge { display: flex; align-items: center; gap: 8px; background: #e8f4ff; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #1464b0; font-weight: 500; }

  .cp2-stats-strip { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
  .cp2-strip-cell { padding: 12px 6px; text-align: center; border-right: 1px solid #f0f0f0; }
  .cp2-strip-cell:last-child { border-right: none; }
  .cp2-strip-num { font-size: 20px; font-weight: 800; color: #111; line-height: 1; }
  .cp2-strip-lbl { font-size: 10px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-top: 4px; display: block; }

  .cp2-nav { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
  .cp2-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; color: #333; text-decoration: none; transition: background .15s; cursor: pointer; background: none; border: none; font-family: inherit; text-align: left; width: 100%; }
  .cp2-nav-item:hover { background: #f5f5f5; }
  .cp2-nav-item.active { background: #e8f4ff; color: #257af4; font-weight: 700; }
  .cp2-nav-ico { font-size: 18px; flex-shrink: 0; width: 22px; }

  .cp2-btn-logout { display: block; width: 100%; padding: 11px 0; background: none; border: 1.5px solid #e0e0e0; border-radius: 8px; color: #777; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: border-color .15s, color .15s; }
  .cp2-btn-logout:hover { border-color: #999; color: #333; }

  /* ── MAIN ── */
  .cp2-section-title { font-size: 20px; font-weight: 700; margin-bottom: 18px; color: #111; }

  .cp2-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .cp2-action { display: flex; flex-direction: column; align-items: flex-start; padding: 18px; border: 1px solid #f0f0f0; border-radius: 12px; text-decoration: none; color: inherit; transition: box-shadow .18s, transform .18s; }
  .cp2-action:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-2px); }
  .cp2-action-primary { background: #e8410a; border-color: #e8410a; color: #fff; }
  .cp2-action-primary:hover { background: #d03a09; box-shadow: 0 4px 18px rgba(232,65,10,.25); }
  .cp2-action-ico { font-size: 26px; margin-bottom: 10px; }
  .cp2-action-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .cp2-action-desc { font-size: 12px; opacity: .7; }

  .cp2-deals-list { display: flex; flex-direction: column; gap: 1px; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; }
  .cp2-deal-row { display: flex; align-items: center; gap: 16px; padding: 16px 18px; background: #fff; text-decoration: none; color: inherit; transition: background .15s; }
  .cp2-deal-row:hover { background: #fafafa; }
  .cp2-deal-row + .cp2-deal-row { border-top: 1px solid #f0f0f0; }
  .cp2-deal-ico { font-size: 24px; flex-shrink: 0; width: 44px; height: 44px; border-radius: 10px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
  .cp2-deal-info { flex: 1; min-width: 0; }
  .cp2-deal-title { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cp2-deal-meta { font-size: 12px; color: #aaa; }
  .cp2-deal-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .cp2-deal-badge-done { background: #dcfce7; color: #16a34a; }
  .cp2-deal-badge-active { background: #fef3c7; color: #d97706; }
  .cp2-deal-badge-pending { background: #e8f4ff; color: #1464b0; }

  .cp2-review-btn { width: 100%; padding: 10px; background: none; border: 1px solid #e0e0e0; border-radius: 8px; color: #555; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; margin-top: 8px; transition: border-color .15s; }
  .cp2-review-btn:hover { border-color: #e8410a; color: #e8410a; }
  .cp2-review-sent { font-size: 13px; color: #16a34a; font-weight: 600; margin-top: 8px; padding: 8px 12px; background: #f0fdf4; border-radius: 8px; }

  .cp2-settings { display: flex; flex-direction: column; gap: 1px; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; }
  .cp2-setting-row { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: #fff; text-decoration: none; color: inherit; transition: background .15s; border: none; font-family: inherit; cursor: pointer; text-align: left; width: 100%; }
  .cp2-setting-row:hover { background: #fafafa; }
  .cp2-setting-row + .cp2-setting-row { border-top: 1px solid #f0f0f0; }
  .cp2-setting-ico { font-size: 22px; flex-shrink: 0; }
  .cp2-setting-info { flex: 1; }
  .cp2-setting-title { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 2px; }
  .cp2-setting-desc { font-size: 12px; color: #aaa; }
  .cp2-setting-arrow { color: #ccc; font-size: 18px; }
  .cp2-setting-soon { font-size: 11px; font-weight: 700; color: #257af4; background: #e8f4ff; padding: 3px 8px; border-radius: 4px; }

  .cp2-empty { padding: 48px 0; text-align: center; color: #aaa; font-size: 14px; }
  .cp2-empty-ico { font-size: 40px; margin-bottom: 10px; }

  @media(max-width:900px) { .cp2-layout { grid-template-columns: 1fr; } .cp2-actions { grid-template-columns: 1fr; } }
`;

export default function CustomerProfilePage() {
  const { userId, userName, userRole, userAvatar, updateAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('deals');
  const [showReviewForm, setShowReviewForm] = useState(null);

  const fullAvatarUrl = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar)
    : '';

  useEffect(() => {
    if (userRole === 'WORKER') { navigate('/worker-profile', { replace: true }); }
  }, [userRole, navigate]);

  useEffect(() => {
    if (!userId || userRole === 'WORKER') return;
    setLoading(true);
    Promise.all([
      getMyDeals(userId),
      getUserProfile(userId),
    ]).then(([d, p]) => {
      setDeals(d || []);
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

  const loadDeals = async () => {
    try {
      const d = await getMyDeals(userId);
      setDeals(d || []);
    } catch {}
  };

  if (userRole === 'WORKER') return null;

  const initials = (userName || 'З').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);
  const fullName = [userName, profile?.lastName].filter(Boolean).join(' ');
  const since = memberSince(profile?.registeredAt || profile?.createdAt);

  const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
  const activeDeals    = deals.filter(d => d.status === 'IN_PROGRESS').length;
  const pendingDeals   = deals.filter(d => d.status === 'PENDING').length;

  const dealStatusLabel = (s) => {
    if (s === 'COMPLETED') return { label: 'Завершена', cls: 'cp2-deal-badge-done' };
    if (s === 'IN_PROGRESS') return { label: 'В работе', cls: 'cp2-deal-badge-active' };
    if (s === 'PENDING') return { label: 'Ожидает', cls: 'cp2-deal-badge-pending' };
    return { label: s, cls: 'cp2-deal-badge-active' };
  };

  return (
    <div className="cp2-page">
      <style>{css}</style>

      <div className="cp2-wrap">
        <div className="cp2-layout">

          {/* ══ САЙДБАР ══ */}
          <div>
            <div className="cp2-ava-wrap" onClick={() => avatarInputRef.current?.click()}>
              {fullAvatarUrl
                ? <img src={fullAvatarUrl} alt="" className="cp2-ava" />
                : <div className="cp2-ava-fb">{initials}</div>
              }
              <div className="cp2-ava-overlay">
                <span style={{color:'#fff',fontSize:20}}>{avatarLoading ? '⏳' : '📷'}</span>
              </div>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarChange} />
            <button className="cp2-ava-lbl" onClick={() => avatarInputRef.current?.click()}>
              {avatarLoading ? 'Загрузка...' : fullAvatarUrl ? 'Изменить фото' : '+ Добавить фото'}
            </button>

            <h1 className="cp2-name" style={{marginTop:10}}>{fullName || 'Заказчик'}</h1>
            <span className="cp2-role">Заказчик</span>
            {since && <div className="cp2-since">{since}</div>}

            <div className="cp2-badges">
              <div className="cp2-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7.5" stroke="#257af4" strokeWidth="1"/>
                  <path d="M5 8l2 2 4-4" stroke="#257af4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Документы проверены
              </div>
              <div className="cp2-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7.5" stroke="#257af4" strokeWidth="1"/>
                  <path d="M5 8l2 2 4-4" stroke="#257af4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Йошкар-Ола
              </div>
            </div>

            <div className="cp2-stats-strip">
              <div className="cp2-strip-cell">
                <div className="cp2-strip-num">{deals.length}</div>
                <span className="cp2-strip-lbl">Сделок</span>
              </div>
              <div className="cp2-strip-cell">
                <div className="cp2-strip-num">{completedDeals}</div>
                <span className="cp2-strip-lbl">Завершено</span>
              </div>
              <div className="cp2-strip-cell">
                <div className="cp2-strip-num">{activeDeals + pendingDeals}</div>
                <span className="cp2-strip-lbl">Активных</span>
              </div>
            </div>

            <nav className="cp2-nav">
              <button className={`cp2-nav-item${section==='deals'?' active':''}`} onClick={() => setSection('deals')}>
                <span className="cp2-nav-ico">📋</span> Мои сделки
              </button>
              <Link to="/categories" className="cp2-nav-item">
                <span className="cp2-nav-ico">🔍</span> Найти мастера
              </Link>
              <Link to="/chat" className="cp2-nav-item">
                <span className="cp2-nav-ico">💬</span> Сообщения
              </Link>
              <button className={`cp2-nav-item${section==='settings'?' active':''}`} onClick={() => setSection('settings')}>
                <span className="cp2-nav-ico">⚙️</span> Настройки
              </button>
            </nav>

            <button className="cp2-btn-logout" onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </button>
          </div>

          {/* ══ ОСНОВНОЙ КОНТЕНТ ══ */}
          <div>

            {/* Быстрые действия */}
            <div className="cp2-actions">
              <Link to="/categories" className="cp2-action cp2-action-primary">
                <span className="cp2-action-ico">🔍</span>
                <div className="cp2-action-name">Найти мастера</div>
                <div className="cp2-action-desc">Все категории услуг</div>
              </Link>
              <Link to="/deals" className="cp2-action">
                <span className="cp2-action-ico">📋</span>
                <div className="cp2-action-name">Мои сделки</div>
                <div className="cp2-action-desc">Активных: {activeDeals + pendingDeals}</div>
              </Link>
              <Link to="/chat" className="cp2-action">
                <span className="cp2-action-ico">💬</span>
                <div className="cp2-action-name">Сообщения</div>
                <div className="cp2-action-desc">Чат с мастерами</div>
              </Link>
            </div>

            {/* Сделки */}
            {section === 'deals' && (
              <>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                  <h2 className="cp2-section-title" style={{marginBottom:0}}>Мои сделки</h2>
                  <Link to="/deals" style={{fontSize:13,color:'#257af4',textDecoration:'none'}}>Все сделки →</Link>
                </div>
                {loading ? (
                  <div className="cp2-empty"><div className="cp2-empty-ico">⏳</div><p>Загрузка...</p></div>
                ) : deals.length === 0 ? (
                  <div className="cp2-empty">
                    <div className="cp2-empty-ico">📋</div>
                    <p>Сделок пока нет</p>
                    <Link to="/categories" style={{display:'inline-block',marginTop:12,padding:'10px 20px',background:'#e8410a',color:'#fff',borderRadius:8,fontWeight:700,textDecoration:'none',fontSize:14}}>Найти мастера</Link>
                  </div>
                ) : (
                  <div className="cp2-deals-list">
                    {deals.slice(0, 10).map(deal => {
                      const { label, cls } = dealStatusLabel(deal.status);
                      return (
                        <div key={deal.id}>
                          <Link to={`/deals?dealId=${deal.id}`} className="cp2-deal-row">
                            <div className="cp2-deal-ico">
                              {deal.status === 'COMPLETED' ? '✅' : deal.status === 'PENDING' ? '⏳' : '🔨'}
                            </div>
                            <div className="cp2-deal-info">
                              <div className="cp2-deal-title">{deal.title || 'Сделка'}</div>
                              <div className="cp2-deal-meta">
                                {deal.workerName && `${deal.workerName} · `}
                                {deal.agreedPrice && `${Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽ · `}
                                {new Date(deal.createdAt).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                            <div className={`cp2-deal-badge ${cls}`}>{label}</div>
                          </Link>

                          {deal.status === 'COMPLETED' && !deal.hasReview && (
                            showReviewForm === deal.id
                              ? <div style={{padding:'0 18px 14px'}}><ReviewForm dealId={deal.id} onSuccess={() => { setShowReviewForm(null); loadDeals(); }} /></div>
                              : <div style={{padding:'0 18px 12px'}}><button className="cp2-review-btn" onClick={() => setShowReviewForm(deal.id)}>⭐ Оставить отзыв</button></div>
                          )}
                          {deal.status === 'COMPLETED' && deal.hasReview && (
                            <div style={{padding:'0 18px 12px'}}><div className="cp2-review-sent">✅ Отзыв отправлен</div></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Настройки */}
            {section === 'settings' && (
              <>
                <h2 className="cp2-section-title">Настройки</h2>
                <div className="cp2-settings">
                  <Link to="/settings/personal" className="cp2-setting-row">
                    <span className="cp2-setting-ico">👤</span>
                    <div className="cp2-setting-info">
                      <div className="cp2-setting-title">Личные данные</div>
                      <div className="cp2-setting-desc">Имя, контактная информация</div>
                    </div>
                    <span className="cp2-setting-arrow">›</span>
                  </Link>
                  <Link to="/settings/notifications" className="cp2-setting-row">
                    <span className="cp2-setting-ico">🔔</span>
                    <div className="cp2-setting-info">
                      <div className="cp2-setting-title">Уведомления</div>
                      <div className="cp2-setting-desc">Push и email уведомления</div>
                    </div>
                    <span className="cp2-setting-arrow">›</span>
                  </Link>
                  <div className="cp2-setting-row" style={{cursor:'default'}}>
                    <span className="cp2-setting-ico">💳</span>
                    <div className="cp2-setting-info">
                      <div className="cp2-setting-title">Платёжные данные</div>
                      <div className="cp2-setting-desc">Способы оплаты</div>
                    </div>
                    <span className="cp2-setting-soon">СКОРО</span>
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
