import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, uploadAvatar, getUserProfile } from '../../api';
import ReviewForm from '../../components/ReviewForm';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function memberSince(d) {
  if (!d) return null;
  return `На сервисе с ${new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  .cp3-page { min-height: 100vh; background: radial-gradient(1200px 440px at 80% -120px, rgba(255,110,64,.10), transparent), linear-gradient(180deg, #f7f9fc 0%, #fff 42%); font-family: Inter, Arial, sans-serif; color: #161b22; }
  .cp3-wrap { max-width: 1240px; margin: 0 auto; padding: 28px 18px 56px; }
  .cp3-grid { display: grid; grid-template-columns: 320px 1fr; gap: 22px; align-items: start; }

  .cp3-panel { background: #fff; border: 1px solid #edf0f5; border-radius: 18px; box-shadow: 0 12px 40px rgba(20,24,39,.05); overflow: hidden; }
  .cp3-sidebar-top { padding: 20px; background: linear-gradient(145deg, #0f172a, #1d2a4a 70%, #243d6d); color: #fff; position: relative; }
  .cp3-avatar-wrap { position: relative; width: 94px; height: 94px; border-radius: 50%; cursor: pointer; border: 2px solid rgba(255,255,255,.5); overflow: hidden; box-shadow: 0 12px 26px rgba(8,15,32,.35); }
  .cp3-avatar { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cp3-avatar-fallback { width: 100%; height: 100%; display:flex; align-items:center; justify-content:center; background: linear-gradient(135deg,#ff5f2e,#ff894f); font-size: 34px; font-weight: 800; }
  .cp3-avatar-overlay { position:absolute; inset:0; background: rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; opacity:0; transition: opacity .18s ease; }
  .cp3-avatar-wrap:hover .cp3-avatar-overlay { opacity:1; }
  .cp3-avatar-btn { margin-top: 10px; border: none; background: rgba(255,255,255,.12); color:#fff; border-radius: 9px; padding: 7px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
  .cp3-avatar-btn:hover { background: rgba(255,255,255,.2); }
  .cp3-name { margin-top: 14px; font-size: 24px; line-height: 1.12; font-weight: 800; letter-spacing: -.02em; }
  .cp3-role { margin-top: 8px; display:inline-flex; align-items:center; gap:6px; background: rgba(255,255,255,.14); color:#e7efff; border:1px solid rgba(255,255,255,.18); border-radius:999px; padding:4px 10px; font-size:12px; font-weight:700; }
  .cp3-since { margin-top: 10px; font-size: 12px; color: rgba(235,242,255,.84); }

  .cp3-sidebar-body { padding: 16px; }
  .cp3-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px; }
  .cp3-kpi { background: #f8fafc; border: 1px solid #edf2f8; border-radius: 12px; padding: 12px; }
  .cp3-kpi-num { font-size: 22px; font-weight: 900; line-height: 1; color: #121926; }
  .cp3-kpi-lbl { margin-top: 4px; font-size: 11px; color: #748197; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .cp3-hints { display: grid; gap: 8px; margin-bottom: 12px; }
  .cp3-hint { display:flex; align-items:center; gap:8px; background: linear-gradient(120deg,#fff4ed,#fff); border:1px solid #ffe3d6; color:#9b451b; border-radius:10px; padding:8px 10px; font-size:12px; font-weight:600; }
  .cp3-nav { display:grid; gap: 6px; margin-bottom: 12px; }
  .cp3-nav-item { display:flex; align-items:center; gap:10px; border:none; width:100%; background:#fff; border-radius:10px; padding:10px; text-decoration:none; font-size:14px; font-weight:700; color:#243247; cursor:pointer; transition:all .15s ease; text-align:left; }
  .cp3-nav-item:hover { background:#f5f8fc; }
  .cp3-nav-item.active { background: linear-gradient(120deg,#eef5ff,#f7fbff); color:#175cc8; border:1px solid #dfeafc; }
  .cp3-logout { width:100%; border:1px solid #e2e8f0; background:#fff; border-radius:10px; padding:10px; font-size:13px; font-weight:700; color:#5f6a7f; cursor:pointer; }
  .cp3-logout:hover { border-color:#bac5d7; color:#1f2937; }

  .cp3-main { display: grid; gap: 16px; }
  .cp3-hero { background: linear-gradient(145deg,#ffffff,#f8fbff); border:1px solid #e8eef8; border-radius: 18px; padding: 18px; }
  .cp3-hero-title { font-size: 26px; font-weight: 900; letter-spacing: -.02em; color:#131b2b; }
  .cp3-hero-sub { margin-top: 6px; font-size: 14px; color:#6b778b; }
  .cp3-actions { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
  .cp3-action { border:1px solid #ebeff7; border-radius: 14px; padding: 14px; text-decoration:none; color:inherit; background:#fff; transition: all .2s ease; }
  .cp3-action:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(20,24,39,.08); border-color:#dde6f4; }
  .cp3-action.hot { background: linear-gradient(140deg,#ff5a1f,#f2460e 70%); color:#fff; border-color:transparent; box-shadow: 0 16px 26px rgba(231,65,10,.26); }
  .cp3-action-ico { font-size: 24px; }
  .cp3-action-title { margin-top: 8px; font-size: 14px; font-weight: 800; }
  .cp3-action-desc { margin-top: 4px; font-size: 12px; opacity: .82; line-height:1.35; }

  .cp3-section { background: #fff; border:1px solid #ecf1f8; border-radius: 18px; padding: 16px; }
  .cp3-section-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom: 10px; }
  .cp3-section-title { font-size: 19px; font-weight: 900; color:#1a2233; letter-spacing: -.01em; }
  .cp3-section-link { font-size: 13px; font-weight: 700; color:#2563eb; text-decoration:none; }

  .cp3-deals { display:grid; gap:10px; }
  .cp3-deal { border:1px solid #edf2f8; border-radius:14px; padding: 14px; text-decoration:none; color:inherit; background:#fff; transition: all .18s ease; }
  .cp3-deal:hover { border-color:#dae4f3; box-shadow: 0 10px 24px rgba(20,24,39,.06); }
  .cp3-deal-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
  .cp3-deal-title { font-size: 15px; font-weight: 800; color:#1a2436; margin-bottom: 4px; }
  .cp3-deal-meta { font-size: 12px; color:#738198; display:flex; flex-wrap:wrap; gap:8px; }
  .cp3-badge { font-size: 11px; font-weight:800; border-radius:999px; padding:5px 10px; white-space:nowrap; }
  .cp3-badge.new { background:#fff5df; color:#a05a00; }
  .cp3-badge.work { background:#eaf4ff; color:#1060d3; }
  .cp3-badge.done { background:#eafdf1; color:#0d8f42; }
  .cp3-badge.cancel { background:#fff0f0; color:#c62828; }
  .cp3-deal-review-wrap { margin-top:10px; padding-top:10px; border-top:1px dashed #e9eef6; }
  .cp3-review-btn { width:100%; border:1px solid #dbe5f2; background:#f7fbff; color:#36557d; border-radius:10px; padding:10px; font-size:13px; font-weight:700; cursor:pointer; }
  .cp3-review-btn:hover { border-color:#c7d8ee; }
  .cp3-review-ok { padding:10px; border-radius:10px; background:#edfdf1; color:#138f47; font-weight:700; font-size:13px; }

  .cp3-settings { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .cp3-setting { border:1px solid #ebeff7; background:#fff; border-radius:14px; padding:14px; text-decoration:none; color:inherit; transition: all .18s ease; position:relative; }
  .cp3-setting:hover { border-color:#d7e3f4; box-shadow: 0 10px 24px rgba(20,24,39,.06); }
  .cp3-setting.disabled { opacity:.56; pointer-events:none; }
  .cp3-setting-title { margin-top: 6px; font-size:14px; font-weight: 800; color:#182335; }
  .cp3-setting-desc { margin-top: 4px; font-size:12px; color:#728197; line-height:1.35; }
  .cp3-soon { position:absolute; top:10px; right:10px; font-size:10px; font-weight:800; color:#1f6feb; background:#e9f2ff; border-radius:999px; padding:4px 8px; }

  .cp3-empty { padding: 36px 16px; text-align:center; color:#738198; font-size:14px; }
  .cp3-empty-ico { font-size: 40px; margin-bottom: 8px; }
  .cp3-empty-btn { margin-top:12px; display:inline-flex; align-items:center; gap:8px; background: linear-gradient(140deg,#ff5a1f,#f2460e); color:#fff; text-decoration:none; border-radius:10px; padding:10px 14px; font-weight:800; font-size:13px; }

  @media (max-width: 1100px) {
    .cp3-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 820px) {
    .cp3-actions { grid-template-columns: 1fr; }
    .cp3-settings { grid-template-columns: 1fr; }
  }
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
    if (userRole === 'WORKER') navigate('/worker-profile', { replace: true });
  }, [userRole, navigate]);

  useEffect(() => {
    if (!userId || userRole === 'WORKER') return;
    setLoading(true);
    Promise.all([getMyDeals(userId), getUserProfile(userId)])
      .then(([d, p]) => {
        setDeals(d || []);
        setProfile(p || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, userRole]);

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 420;
        let w = img.width;
        let h = img.height;
        if (w > h && w > max) {
          h = (h * max) / w;
          w = max;
        } else if (h >= w && h > max) {
          w = (w * max) / h;
          h = max;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
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
      } catch {
        updateAvatar(base64);
      }
    } finally {
      setAvatarLoading(false);
    }
    e.target.value = '';
  };

  const reloadDeals = async () => {
    try {
      const d = await getMyDeals(userId);
      setDeals(d || []);
    } catch {}
  };

  const initials = (userName || 'З')
    .trim()
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fullName = [userName, profile?.lastName].filter(Boolean).join(' ');
  const since = memberSince(profile?.registeredAt || profile?.createdAt);

  const stats = useMemo(() => {
    const total = deals.length;
    const completed = deals.filter((d) => d.status === 'COMPLETED').length;
    const active = deals.filter((d) => d.status === 'IN_PROGRESS' || d.status === 'NEW').length;
    const cancelled = deals.filter((d) => d.status === 'CANCELLED').length;
    return { total, completed, active, cancelled };
  }, [deals]);

  const statusInfo = (status) => {
    if (status === 'NEW') return { label: 'Ожидает подтверждения', cls: 'new', icon: '⏳' };
    if (status === 'IN_PROGRESS') return { label: 'В работе', cls: 'work', icon: '🛠️' };
    if (status === 'COMPLETED') return { label: 'Завершена', cls: 'done', icon: '✅' };
    if (status === 'CANCELLED') return { label: 'Отменена', cls: 'cancel', icon: '❌' };
    return { label: status || 'Сделка', cls: 'work', icon: '📋' };
  };

  if (userRole === 'WORKER') return null;

  return (
    <div className="cp3-page">
      <style>{css}</style>
      <div className="cp3-wrap">
        <div className="cp3-grid">
          <aside className="cp3-panel">
            <div className="cp3-sidebar-top">
              <div className="cp3-avatar-wrap" onClick={() => avatarInputRef.current?.click()}>
                {fullAvatarUrl ? (
                  <img src={fullAvatarUrl} alt="" className="cp3-avatar" />
                ) : (
                  <div className="cp3-avatar-fallback">{initials}</div>
                )}
                <div className="cp3-avatar-overlay">{avatarLoading ? '⏳' : '📷'}</div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <button className="cp3-avatar-btn" onClick={() => avatarInputRef.current?.click()}>
                {avatarLoading ? 'Загружаем...' : fullAvatarUrl ? 'Изменить фото' : 'Добавить фото'}
              </button>

              <div className="cp3-name">{fullName || 'Заказчик'}</div>
              <div className="cp3-role">👤 Заказчик</div>
              {since && <div className="cp3-since">{since}</div>}
            </div>

            <div className="cp3-sidebar-body">
              <div className="cp3-kpis">
                <div className="cp3-kpi">
                  <div className="cp3-kpi-num">{stats.total}</div>
                  <div className="cp3-kpi-lbl">Сделок</div>
                </div>
                <div className="cp3-kpi">
                  <div className="cp3-kpi-num">{stats.active}</div>
                  <div className="cp3-kpi-lbl">Активных</div>
                </div>
                <div className="cp3-kpi">
                  <div className="cp3-kpi-num">{stats.completed}</div>
                  <div className="cp3-kpi-lbl">Завершено</div>
                </div>
                <div className="cp3-kpi">
                  <div className="cp3-kpi-num">{stats.cancelled}</div>
                  <div className="cp3-kpi-lbl">Отменено</div>
                </div>
              </div>

              <div className="cp3-hints">
                <div className="cp3-hint">✅ Документы проверены</div>
                <div className="cp3-hint">📍 Йошкар-Ола</div>
              </div>

              <nav className="cp3-nav">
                <button
                  type="button"
                  className={`cp3-nav-item${section === 'deals' ? ' active' : ''}`}
                  onClick={() => setSection('deals')}
                >
                  📋 Мои сделки
                </button>
                <button
                  type="button"
                  className={`cp3-nav-item${section === 'settings' ? ' active' : ''}`}
                  onClick={() => setSection('settings')}
                >
                  ⚙️ Настройки
                </button>
                <Link to="/categories" className="cp3-nav-item">🔍 Найти мастера</Link>
                <Link to="/chat" className="cp3-nav-item">💬 Сообщения</Link>
              </nav>

              <button className="cp3-logout" onClick={() => { logout(); navigate('/login'); }}>
                Выйти из аккаунта
              </button>
            </div>
          </aside>

          <main className="cp3-main">
            <section className="cp3-hero">
              <div className="cp3-hero-title">Личный кабинет заказчика</div>
              <div className="cp3-hero-sub">
                Управляйте сделками, общением с мастерами и профилем в одном месте.
              </div>
              <div className="cp3-actions">
                <Link to="/categories" className="cp3-action hot">
                  <div className="cp3-action-ico">🚀</div>
                  <div className="cp3-action-title">Найти мастера</div>
                  <div className="cp3-action-desc">Каталог услуг и быстрый выбор специалиста</div>
                </Link>
                <Link to="/deals" className="cp3-action">
                  <div className="cp3-action-ico">🤝</div>
                  <div className="cp3-action-title">Все сделки</div>
                  <div className="cp3-action-desc">Активно сейчас: {stats.active}</div>
                </Link>
                <Link to="/chat" className="cp3-action">
                  <div className="cp3-action-ico">💬</div>
                  <div className="cp3-action-title">Сообщения</div>
                  <div className="cp3-action-desc">Обсудить детали прямо в чате</div>
                </Link>
              </div>
            </section>

            {section === 'deals' && (
              <section className="cp3-section">
                <div className="cp3-section-head">
                  <div className="cp3-section-title">Последние сделки</div>
                  <Link to="/deals" className="cp3-section-link">Открыть все →</Link>
                </div>

                {loading ? (
                  <div className="cp3-empty">
                    <div className="cp3-empty-ico">⏳</div>
                    Загрузка сделок...
                  </div>
                ) : deals.length === 0 ? (
                  <div className="cp3-empty">
                    <div className="cp3-empty-ico">📋</div>
                    <div>Пока нет сделок — выберите мастера и начните первую</div>
                    <Link to="/categories" className="cp3-empty-btn">🔍 Перейти в каталог</Link>
                  </div>
                ) : (
                  <div className="cp3-deals">
                    {deals.slice(0, 10).map((deal) => {
                      const info = statusInfo(deal.status);
                      return (
                        <div key={deal.id} className="cp3-deal">
                          <Link to={`/deals?dealId=${deal.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="cp3-deal-top">
                              <div>
                                <div className="cp3-deal-title">
                                  {info.icon} {deal.title || 'Сделка'}
                                </div>
                                <div className="cp3-deal-meta">
                                  {deal.workerName && <span>👤 {deal.workerName}</span>}
                                  {deal.agreedPrice && <span>💰 {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</span>}
                                  {deal.createdAt && <span>🗓 {new Date(deal.createdAt).toLocaleDateString('ru-RU')}</span>}
                                </div>
                              </div>
                              <span className={`cp3-badge ${info.cls}`}>{info.label}</span>
                            </div>
                          </Link>

                          {deal.status === 'COMPLETED' && !deal.hasReview && (
                            <div className="cp3-deal-review-wrap">
                              {showReviewForm === deal.id ? (
                                <ReviewForm
                                  dealId={deal.id}
                                  onSuccess={() => {
                                    setShowReviewForm(null);
                                    reloadDeals();
                                  }}
                                />
                              ) : (
                                <button className="cp3-review-btn" onClick={() => setShowReviewForm(deal.id)}>
                                  ⭐ Оставить отзыв о мастере
                                </button>
                              )}
                            </div>
                          )}

                          {deal.status === 'COMPLETED' && deal.hasReview && (
                            <div className="cp3-deal-review-wrap">
                              <div className="cp3-review-ok">✅ Отзыв уже оставлен</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {section === 'settings' && (
              <section className="cp3-section">
                <div className="cp3-section-head">
                  <div className="cp3-section-title">Настройки профиля</div>
                </div>
                <div className="cp3-settings">
                  <Link to="/settings/personal" className="cp3-setting">
                    <div style={{ fontSize: 28 }}>👤</div>
                    <div className="cp3-setting-title">Личные данные</div>
                    <div className="cp3-setting-desc">Контакты, имя и профильная информация</div>
                  </Link>
                  <Link to="/settings/notifications" className="cp3-setting">
                    <div style={{ fontSize: 28 }}>🔔</div>
                    <div className="cp3-setting-title">Уведомления</div>
                    <div className="cp3-setting-desc">Push и email уведомления по сделкам</div>
                  </Link>
                  <div className="cp3-setting disabled">
                    <div className="cp3-soon">СКОРО</div>
                    <div style={{ fontSize: 28 }}>🧩</div>
                    <div className="cp3-setting-title">Дополнительные опции</div>
                    <div className="cp3-setting-desc">Новые возможности профиля появятся здесь</div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
