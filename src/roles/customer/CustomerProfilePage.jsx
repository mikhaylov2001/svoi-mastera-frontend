import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, uploadAvatar, getUserProfile } from '../../api';
import ReviewForm from '../../components/ReviewForm';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.cxp * { box-sizing: border-box; }
.cxp {
  min-height: 100vh;
  background: #f1f5f9;
  font-family: Inter, -apple-system, sans-serif;
  color: #0f172a;
}

/* ───── COVER ───── */
.cxp-cover {
  height: 200px;
  background: linear-gradient(130deg, #0f172a 0%, #1e293b 40%, #ff4500 100%);
  position: relative;
  overflow: hidden;
}
.cxp-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 55% 80% at 85% 50%, rgba(255,90,20,.45), transparent),
    radial-gradient(ellipse 40% 60% at 10% 80%, rgba(255,255,255,.04), transparent);
}
.cxp-cover-pattern {
  position: absolute;
  inset: 0;
  opacity: .06;
  background-image: repeating-linear-gradient(
    45deg,
    #fff 0, #fff 1px,
    transparent 0, transparent 50%
  );
  background-size: 22px 22px;
}

/* ───── CONTAINER ───── */
.cxp-wrap { max-width: 1180px; margin: 0 auto; padding: 0 18px 64px; }

/* ───── PROFILE CARD ───── */
.cxp-profile-card {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  margin-top: -70px;
  padding: 20px 24px 20px;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 20px;
  box-shadow: 0 4px 28px rgba(15,23,42,.08);
}

.cxp-ava-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 6px 24px rgba(15,23,42,.18);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  background: linear-gradient(135deg, #ff5a1f, #ff8c5a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 900;
  color: #fff;
  transition: box-shadow .2s;
}
.cxp-ava-ring:hover { box-shadow: 0 8px 30px rgba(15,23,42,.26); }
.cxp-ava-ring img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.cxp-ava-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items:center; justify-content: center;
  font-size: 22px; opacity: 0; transition: opacity .18s;
}
.cxp-ava-ring:hover .cxp-ava-overlay { opacity: 1; }

.cxp-profile-info { flex: 1; min-width: 0; padding-bottom: 2px; }
.cxp-profile-name {
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 900;
  letter-spacing: -.03em;
  color: #0f172a;
  line-height: 1.1;
}
.cxp-profile-meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.cxp-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 11px;
  white-space: nowrap;
}
.cxp-chip-role { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.cxp-chip-ok   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.cxp-chip-city { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
.cxp-chip-time { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

.cxp-profile-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: flex-end;
  padding-bottom: 2px;
}
.cxp-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 16px;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: all .18s ease;
}
.cxp-btn-primary {
  background: linear-gradient(135deg,#ff5a1f,#e8410a);
  color: #fff;
  box-shadow: 0 6px 18px rgba(232,65,10,.32);
}
.cxp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 9px 22px rgba(232,65,10,.38); }
.cxp-btn-ghost {
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
}
.cxp-btn-ghost:hover { background: #f1f5f9; border-color: #cbd5e1; }
.cxp-btn-logout {
  background: #fff;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}
.cxp-btn-logout:hover { color: #ef4444; border-color: #fecaca; }

/* ───── STATS BAR ───── */
.cxp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 16px 0;
}
.cxp-stat {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(15,23,42,.04);
  transition: all .2s;
}
.cxp-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,23,42,.07); }
.cxp-stat-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.cxp-stat-icon.total   { background: #fff7ed; }
.cxp-stat-icon.active  { background: #eff6ff; }
.cxp-stat-icon.done    { background: #f0fdf4; }
.cxp-stat-icon.cancel  { background: #fff1f2; }
.cxp-stat-body {}
.cxp-stat-num { font-size: 26px; font-weight: 900; color: #0f172a; line-height: 1; }
.cxp-stat-lbl { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 3px; }

/* ───── MAIN GRID ───── */
.cxp-main { display: grid; grid-template-columns: 1fr 340px; gap: 14px; align-items: start; }

/* ───── QUICK ACTIONS ───── */
.cxp-quick { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.cxp-qa {
  background: #fff;
  border: 1.5px solid #e8eef7;
  border-radius: 16px;
  padding: 18px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all .2s;
  cursor: pointer;
}
.cxp-qa:hover { border-color: #c7d8f0; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(15,23,42,.07); }
.cxp-qa.accent {
  background: linear-gradient(145deg, #ff5a1f, #e8410a);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 14px 30px rgba(232,65,10,.28);
}
.cxp-qa.accent:hover { box-shadow: 0 18px 36px rgba(232,65,10,.36); }
.cxp-qa-ico { font-size: 26px; }
.cxp-qa-title { font-size: 14px; font-weight: 800; letter-spacing: -.01em; }
.cxp-qa-sub { font-size: 12px; opacity: .75; line-height: 1.3; }

/* ───── SECTION ───── */
.cxp-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(15,23,42,.04);
}
.cxp-section + .cxp-section { margin-top: 14px; }
.cxp-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.cxp-section-title { font-size: 18px; font-weight: 900; letter-spacing: -.02em; color: #0f172a; }
.cxp-section-link { font-size: 13px; font-weight: 700; color: #e8410a; text-decoration: none; }
.cxp-section-link:hover { text-decoration: underline; }

/* ───── DEALS ───── */
.cxp-deals { display: grid; gap: 8px; }
.cxp-deal-card {
  border: 1px solid #edf2f8;
  border-radius: 14px;
  overflow: hidden;
  transition: all .18s;
}
.cxp-deal-card:hover { border-color: #d0dcee; box-shadow: 0 8px 20px rgba(15,23,42,.06); }
.cxp-deal-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  text-decoration: none;
  color: inherit;
}
.cxp-deal-thumb {
  width: 46px; height: 46px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.cxp-deal-thumb.s-NEW       { background: #fff7ed; }
.cxp-deal-thumb.s-IN_PROGRESS { background: #eff6ff; }
.cxp-deal-thumb.s-COMPLETED  { background: #f0fdf4; }
.cxp-deal-thumb.s-CANCELLED  { background: #fff1f2; }
.cxp-deal-body { flex: 1; min-width: 0; }
.cxp-deal-title {
  font-size: 14px; font-weight: 800; color: #0f172a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 4px;
}
.cxp-deal-meta { font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; }
.cxp-badge {
  flex-shrink: 0;
  font-size: 11px; font-weight: 800;
  border-radius: 999px; padding: 4px 10px;
}
.cxp-badge.s-NEW              { background: #fff7ed; color: #c2410c; }
.cxp-badge.s-IN_PROGRESS      { background: #eff6ff; color: #1d4ed8; }
.cxp-badge.s-COMPLETED        { background: #f0fdf4; color: #15803d; }
.cxp-badge.s-CANCELLED        { background: #fff1f2; color: #b91c1c; }
.cxp-deal-review {
  padding: 0 14px 12px;
}
.cxp-review-btn {
  width: 100%; padding: 10px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 10px; font-size: 13px; font-weight: 700;
  color: #334155; cursor: pointer; font-family: inherit;
  transition: all .18s;
}
.cxp-review-btn:hover { border-color: #ff5a1f; color: #e8410a; background: #fff7ed; }
.cxp-review-ok {
  padding: 10px 14px; background: #f0fdf4;
  border-radius: 10px; font-size: 13px; font-weight: 700;
  color: #16a34a; text-align: center;
}

/* ───── EMPTY ───── */
.cxp-empty { padding: 36px 16px; text-align: center; color: #64748b; font-size: 14px; }
.cxp-empty-ico { font-size: 44px; margin-bottom: 8px; }

/* ───── RIGHT COLUMN ───── */
.cxp-right { display: grid; gap: 14px; }

/* ───── NAV CARD ───── */
.cxp-nav { padding: 8px; }
.cxp-nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 10px; border-radius: 10px;
  font-size: 14px; font-weight: 700; color: #334155;
  text-decoration: none; background: none;
  border: none; width: 100%; cursor: pointer;
  transition: all .15s; font-family: inherit;
}
.cxp-nav-item:hover { background: #f1f5f9; color: #0f172a; }
.cxp-nav-item.act { background: #fff7ed; color: #c2410c; }
.cxp-nav-ico {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
  background: #f1f5f9;
}
.cxp-nav-item.act .cxp-nav-ico { background: #fed7aa; }

/* ───── SETTINGS ───── */
.cxp-set-list { display: grid; gap: 6px; }
.cxp-set-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 12px; border: 1px solid #f1f5f9;
  text-decoration: none; color: inherit;
  transition: all .18s; position: relative;
  background: #fafcff;
}
.cxp-set-item:hover:not(.cxp-set-dis) { border-color: #e2e8f0; background: #fff; box-shadow: 0 4px 12px rgba(15,23,42,.05); }
.cxp-set-dis { opacity: .5; cursor: default; }
.cxp-set-ico {
  width: 40px; height: 40px; border-radius: 10px;
  background: #f1f5f9; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cxp-set-info { flex: 1; min-width: 0; }
.cxp-set-title { font-size: 14px; font-weight: 800; color: #0f172a; }
.cxp-set-desc  { font-size: 12px; color: #64748b; margin-top: 2px; }
.cxp-set-arr   { color: #cbd5e1; font-size: 20px; }
.cxp-soon {
  position: absolute; top: 8px; right: 8px;
  font-size: 10px; font-weight: 800;
  background: #eff6ff; color: #2563eb;
  border-radius: 999px; padding: 3px 8px;
}

/* ───── RESPONSIVE ───── */
@media (max-width: 980px) {
  .cxp-main { grid-template-columns: 1fr; }
  .cxp-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 680px) {
  .cxp-quick { grid-template-columns: 1fr; }
  .cxp-profile-card { flex-wrap: wrap; }
  .cxp-profile-actions { width: 100%; }
  .cxp-cover { height: 150px; }
  .cxp-stats { grid-template-columns: repeat(2, 1fr); }
}
`;

const STATUS_ICO = {
  NEW: '⏳', IN_PROGRESS: '🛠', COMPLETED: '✅', CANCELLED: '✕',
};
const STATUS_LABEL = {
  NEW: 'Ожидает мастера', IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена', CANCELLED: 'Отменена',
};

export default function CustomerProfilePage() {
  const { userId, userName, userRole, userAvatar, updateAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('deals');
  const [reviewFor, setReviewFor] = useState(null);

  const avatarUrl = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar)
    : '';

  useEffect(() => {
    if (userRole === 'WORKER') navigate('/worker-profile', { replace: true });
  }, [userRole, navigate]);

  useEffect(() => {
    if (!userId || userRole === 'WORKER') return;
    setLoading(true);
    Promise.all([getMyDeals(userId), getUserProfile(userId)])
      .then(([d, p]) => { setDeals(d || []); setProfile(p || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, userRole]);

  const compress = (file) => new Promise((res) => {
    const r = new FileReader();
    r.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const M = 420;
        let w = img.width, h = img.height;
        if (w > M) { h = h * M / w; w = M; }
        else if (h > M) { w = w * M / h; h = M; }
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', 0.84));
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const b64 = await compress(file);
      try { const r = await uploadAvatar(userId, b64); updateAvatar(r?.avatarUrl || b64); }
      catch { updateAvatar(b64); }
    } finally { setAvatarLoading(false); }
    e.target.value = '';
  };

  const reloadDeals = async () => {
    try { setDeals(await getMyDeals(userId) || []); } catch {}
  };

  const initials = (userName || 'З').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const fullName = [userName, profile?.lastName].filter(Boolean).join(' ') || 'Заказчик';
  const since = fmt(profile?.registeredAt || profile?.createdAt);

  const stats = useMemo(() => ({
    total: deals.length,
    active: deals.filter(d => ['IN_PROGRESS', 'NEW'].includes(d.status)).length,
    done: deals.filter(d => d.status === 'COMPLETED').length,
    cancelled: deals.filter(d => d.status === 'CANCELLED').length,
  }), [deals]);

  if (userRole === 'WORKER') return null;

  return (
    <div className="cxp">
      <style>{css}</style>

      {/* ── COVER ── */}
      <div className="cxp-cover">
        <div className="cxp-cover-pattern" />
      </div>

      <div className="cxp-wrap">

        {/* ── PROFILE CARD ── */}
        <div className="cxp-profile-card">
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatar} />
          <div className="cxp-ava-ring" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
            <div className="cxp-ava-overlay">{avatarLoading ? '⏳' : '📷'}</div>
          </div>

          <div className="cxp-profile-info">
            <div className="cxp-profile-name">{fullName}</div>
            <div className="cxp-profile-meta">
              <span className="cxp-chip cxp-chip-role">👤 Заказчик</span>
              <span className="cxp-chip cxp-chip-ok">✅ Документы проверены</span>
              <span className="cxp-chip cxp-chip-city">📍 Йошкар-Ола</span>
              {since && <span className="cxp-chip cxp-chip-time">🕐 С {since}</span>}
            </div>
          </div>

          <div className="cxp-profile-actions">
            <button className="cxp-btn cxp-btn-ghost" onClick={() => fileRef.current?.click()}>
              📷 {avatarLoading ? 'Загрузка...' : avatarUrl ? 'Сменить фото' : 'Добавить фото'}
            </button>
            <button className="cxp-btn cxp-btn-logout" onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </button>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="cxp-stats">
          {[
            { icon: '📊', cls: 'total',  num: stats.total,     lbl: 'Всего сделок' },
            { icon: '🔥', cls: 'active', num: stats.active,    lbl: 'Активных' },
            { icon: '✅', cls: 'done',   num: stats.done,      lbl: 'Завершено' },
            { icon: '✕', cls: 'cancel', num: stats.cancelled, lbl: 'Отменено' },
          ].map(s => (
            <div className="cxp-stat" key={s.cls}>
              <div className={`cxp-stat-icon ${s.cls}`}>{s.icon}</div>
              <div className="cxp-stat-body">
                <div className="cxp-stat-num">{s.num}</div>
                <div className="cxp-stat-lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="cxp-main">

          {/* ── LEFT ── */}
          <div>
            {/* Быстрые действия */}
            <div className="cxp-quick">
              <Link to="/categories" className="cxp-qa accent">
                <div className="cxp-qa-ico">🚀</div>
                <div className="cxp-qa-title">Найти мастера</div>
                <div className="cxp-qa-sub">Каталог услуг по категориям</div>
              </Link>
              <Link to="/deals" className="cxp-qa">
                <div className="cxp-qa-ico">🤝</div>
                <div className="cxp-qa-title">Все мои сделки</div>
                <div className="cxp-qa-sub">Активных: {stats.active}</div>
              </Link>
              <Link to="/chat" className="cxp-qa">
                <div className="cxp-qa-ico">💬</div>
                <div className="cxp-qa-title">Сообщения</div>
                <div className="cxp-qa-sub">Чат с мастерами</div>
              </Link>
            </div>

            {/* Сделки / Настройки */}
            {section === 'deals' && (
              <div className="cxp-section">
                <div className="cxp-section-head">
                  <div className="cxp-section-title">Последние сделки</div>
                  <Link to="/deals" className="cxp-section-link">Все сделки →</Link>
                </div>
                {loading ? (
                  <div className="cxp-empty"><div className="cxp-empty-ico">⏳</div>Загружаем...</div>
                ) : deals.length === 0 ? (
                  <div className="cxp-empty">
                    <div className="cxp-empty-ico">🔍</div>
                    <div>Сделок пока нет — начните с поиска мастера</div>
                    <Link to="/categories" style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:14, background:'linear-gradient(135deg,#ff5a1f,#e8410a)', color:'#fff', textDecoration:'none', borderRadius:10, padding:'10px 16px', fontWeight:800, fontSize:13 }}>
                      🚀 Найти мастера
                    </Link>
                  </div>
                ) : (
                  <div className="cxp-deals">
                    {deals.slice(0, 10).map(deal => {
                      const s = deal.status || 'IN_PROGRESS';
                      return (
                        <div key={deal.id} className="cxp-deal-card">
                          <Link to={`/deals?dealId=${deal.id}`} className="cxp-deal-link">
                            <div className={`cxp-deal-thumb s-${s}`}>{STATUS_ICO[s] || '📋'}</div>
                            <div className="cxp-deal-body">
                              <div className="cxp-deal-title">{deal.title || 'Сделка'}</div>
                              <div className="cxp-deal-meta">
                                {deal.workerName && <span>👤 {deal.workerName}</span>}
                                {deal.agreedPrice && <span>💰 {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</span>}
                                {deal.createdAt && <span>🗓 {new Date(deal.createdAt).toLocaleDateString('ru-RU')}</span>}
                              </div>
                            </div>
                            <span className={`cxp-badge s-${s}`}>{STATUS_LABEL[s] || s}</span>
                          </Link>

                          {s === 'COMPLETED' && !deal.hasReview && (
                            <div className="cxp-deal-review">
                              {reviewFor === deal.id ? (
                                <ReviewForm dealId={deal.id} onSuccess={() => { setReviewFor(null); reloadDeals(); }} />
                              ) : (
                                <button className="cxp-review-btn" onClick={() => setReviewFor(deal.id)}>
                                  ⭐ Оставить отзыв о мастере
                                </button>
                              )}
                            </div>
                          )}
                          {s === 'COMPLETED' && deal.hasReview && (
                            <div className="cxp-deal-review">
                              <div className="cxp-review-ok">✅ Отзыв уже отправлен</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === 'settings' && (
              <div className="cxp-section">
                <div className="cxp-section-head">
                  <div className="cxp-section-title">Настройки профиля</div>
                </div>
                <div className="cxp-set-list">
                  {[
                    { to: '/settings/personal', ico: '👤', title: 'Личные данные', desc: 'Имя, контакты, информация' },
                    { to: '/settings/notifications', ico: '🔔', title: 'Уведомления', desc: 'Push и email по сделкам' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} className="cxp-set-item">
                      <div className="cxp-set-ico">{item.ico}</div>
                      <div className="cxp-set-info">
                        <div className="cxp-set-title">{item.title}</div>
                        <div className="cxp-set-desc">{item.desc}</div>
                      </div>
                      <div className="cxp-set-arr">›</div>
                    </Link>
                  ))}
                  <div className="cxp-set-item cxp-set-dis">
                    <div className="cxp-soon">СКОРО</div>
                    <div className="cxp-set-ico">🧩</div>
                    <div className="cxp-set-info">
                      <div className="cxp-set-title">Дополнительные опции</div>
                      <div className="cxp-set-desc">Новые возможности — скоро</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="cxp-right">
            {/* Навигация */}
            <div className="cxp-section">
              <nav className="cxp-nav">
                {[
                  { key: 'deals',    ico: '📋', label: 'Мои сделки' },
                  { key: 'settings', ico: '⚙️', label: 'Настройки' },
                ].map(n => (
                  <button
                    key={n.key}
                    type="button"
                    className={`cxp-nav-item${section === n.key ? ' act' : ''}`}
                    onClick={() => setSection(n.key)}
                  >
                    <div className="cxp-nav-ico">{n.ico}</div>
                    {n.label}
                  </button>
                ))}
                <Link to="/categories" className="cxp-nav-item">
                  <div className="cxp-nav-ico">🔍</div>Найти мастера
                </Link>
                <Link to="/chat" className="cxp-nav-item">
                  <div className="cxp-nav-ico">💬</div>Сообщения
                </Link>
                <Link to="/deals" className="cxp-nav-item">
                  <div className="cxp-nav-ico">🤝</div>Все сделки
                </Link>
              </nav>
            </div>

            {/* Мини-подсказка */}
            <div className="cxp-section" style={{ background:'linear-gradient(145deg,#fff7ed,#fff)', borderColor:'#fed7aa' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#c2410c', marginBottom:8 }}>💡 Совет</div>
              <div style={{ fontSize:13, color:'#78350f', lineHeight:1.55 }}>
                Оставляйте отзывы — так мастерам легче развиваться, а вам проще выбирать проверенных специалистов в будущем.
              </div>
              <Link to="/categories" style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:12, background:'linear-gradient(135deg,#ff5a1f,#e8410a)', color:'#fff', textDecoration:'none', borderRadius:9, padding:'9px 14px', fontWeight:800, fontSize:13 }}>
                Найти мастера →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
