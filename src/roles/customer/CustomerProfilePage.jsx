import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, uploadAvatar, getUserProfile } from '../../api';
import ReviewForm from '../../components/ReviewForm';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  return BACKEND + url;
}

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtCard(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TABS = [
  { key: 'ALL',         label: 'Все' },
  { key: 'NEW',         label: 'Ждут подтверждения' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'COMPLETED',   label: 'Завершены' },
  { key: 'CANCELLED',   label: 'Отменены' },
];

const ST = {
  NEW:         { label: 'Ожидает мастера',  bg: '#fff7ed', fg: '#c2410c', dot: '#fb923c', btn: 'Ждём подтверждения' },
  IN_PROGRESS: { label: 'В работе',          bg: '#eff6ff', fg: '#1d4ed8', dot: '#3b82f6', btn: 'Открыть сделку'     },
  COMPLETED:   { label: 'Завершена',         bg: '#f0fdf4', fg: '#15803d', dot: '#22c55e', btn: 'Детали'             },
  CANCELLED:   { label: 'Отменена',          bg: '#fff1f2', fg: '#be123c', dot: '#f43f5e', btn: 'Детали'             },
};

/* emoji fallback by title */
function dealEmoji(title = '') {
  const t = title.toLowerCase();
  if (t.includes('розетк') || t.includes('электр')) return '⚡';
  if (t.includes('сантех') || t.includes('труб'))   return '🚿';
  if (t.includes('ремонт') || t.includes('отдел'))  return '🏗';
  if (t.includes('мебел') || t.includes('сборк'))   return '🪑';
  if (t.includes('уборк') || t.includes('клин'))    return '🧹';
  if (t.includes('груз')  || t.includes('перевоз')) return '🚚';
  if (t.includes('компьют') || t.includes('ноутб')) return '💻';
  if (t.includes('замок') || t.includes('дверь'))   return '🔐';
  if (t.includes('сад')   || t.includes('дача'))    return '🌿';
  if (t.includes('маляр') || t.includes('краск'))   return '🎨';
  return '🔧';
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
.vp{font-family:Inter,-apple-system,sans-serif;color:#0a0f1e;background:#eef1f8;min-height:100vh}
.vp *{box-sizing:border-box;margin:0;padding:0}

/* ══ HERO ══ */
.vp-hero{
  position:relative;overflow:hidden;background:#06080f;
  padding:56px 0 94px;
}
/* animated conic glow */
.vp-hero-glow{
  position:absolute;width:700px;height:700px;
  right:-120px;top:-200px;border-radius:50%;
  background:conic-gradient(from 0deg,#ff5a1f55,#9333ea33,#0ea5e955,#ff5a1f55);
  filter:blur(56px);animation:vp-spin 22s linear infinite;
}
@keyframes vp-spin{to{transform:rotate(360deg)}}
/* mesh radials */
.vp-hero-mesh{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse 85% 160% at 100% -15%, rgba(255,80,10,.5), transparent 60%),
    radial-gradient(ellipse 55% 90%  at -5%  115%, rgba(109,40,217,.38), transparent 55%),
    radial-gradient(ellipse 40% 70%  at 45%  55%,  rgba(14,116,255,.14), transparent 65%);
}
/* subtle dot grid */
.vp-hero-grid{
  position:absolute;inset:0;
  background-image:radial-gradient(rgba(255,255,255,.065) 1px,transparent 1px);
  background-size:26px 26px;
}
.vp-hero-inner{
  position:relative;z-index:2;
  max-width:1160px;margin:0 auto;padding:0 24px;
  display:flex;align-items:center;gap:26px;flex-wrap:wrap;
}
/* avatar */
.vp-ava{
  width:96px;height:96px;border-radius:28px;flex-shrink:0;
  border:2.5px solid rgba(255,255,255,.2);overflow:hidden;
  background:linear-gradient(145deg,#ff5a1f,#ff9500);
  display:flex;align-items:center;justify-content:center;
  font-size:38px;font-weight:900;color:#fff;cursor:pointer;position:relative;
  transition:transform .2s,box-shadow .2s;
  box-shadow:0 10px 36px rgba(255,90,31,.38);
}
.vp-ava:hover{transform:scale(1.05);box-shadow:0 14px 44px rgba(255,90,31,.52);}
.vp-ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.vp-ava-ov{position:absolute;inset:0;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;font-size:28px;opacity:0;transition:opacity .18s;border-radius:28px;}
.vp-ava:hover .vp-ava-ov{opacity:1;}
/* hero text */
.vp-hero-txt{flex:1;min-width:0;}
.vp-hero-name{font-size:clamp(26px,3.5vw,42px);font-weight:900;letter-spacing:-.045em;color:#fff;line-height:1;text-shadow:0 2px 24px rgba(0,0,0,.35);}
.vp-hero-pills{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px;}
.vp-pill{display:inline-flex;align-items:center;gap:5px;border-radius:999px;font-size:12px;font-weight:700;padding:5px 13px;backdrop-filter:blur(14px);white-space:nowrap;}
.vp-pill-o{background:rgba(255,90,31,.22);color:#ffb085;border:1px solid rgba(255,90,31,.35);}
.vp-pill-g{background:rgba(34,197,94,.18);color:#6ee7b7;border:1px solid rgba(34,197,94,.3);}
.vp-pill-w{background:rgba(255,255,255,.1);color:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.14);}
/* hero buttons */
.vp-hero-btns{display:flex;gap:8px;align-self:flex-start;padding-top:4px;}
.vp-hbtn{display:inline-flex;align-items:center;gap:6px;border-radius:12px;font-size:13px;font-weight:700;padding:10px 18px;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:rgba(255,255,255,.85);font-family:inherit;text-decoration:none;transition:all .18s;}
.vp-hbtn:hover{background:rgba(255,255,255,.18);}

/* ══ WRAP ══ */
.vp-wrap{max-width:1160px;margin:-54px auto 72px;padding:0 24px;position:relative;z-index:3;}

/* ══ STATS ══ */
.vp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
.vp-stat{
  background:#fff;border:1px solid #e3eaf7;border-radius:18px;
  padding:18px 20px;display:flex;align-items:center;gap:14px;
  box-shadow:0 2px 10px rgba(10,15,30,.05);transition:all .2s;
}
.vp-stat:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(10,15,30,.09);}
.vp-si{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.vp-si.t{background:#fff7ed;}.vp-si.a{background:#eff6ff;}.vp-si.d{background:#f0fdf4;}.vp-si.c{background:#fff1f2;}
.vp-stat-num{font-size:30px;font-weight:900;letter-spacing:-.04em;line-height:1;}
.vp-stat-lbl{font-size:12px;color:#64748b;font-weight:600;margin-top:3px;}
.vp-no{color:#e8410a;}.vp-nb{color:#2563eb;}.vp-ng{color:#16a34a;}.vp-ns{color:#94a3b8;}

/* ══ LAYOUT ══ */
.vp-layout{display:grid;grid-template-columns:1fr 296px;gap:16px;align-items:start;}

/* ══ ACTIONS ══ */
.vp-acts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;}
.vp-act{
  display:flex;flex-direction:column;justify-content:space-between;min-height:130px;
  border-radius:18px;padding:18px;text-decoration:none;color:inherit;
  border:1px solid #e3eaf7;background:#fff;transition:all .2s;
}
.vp-act:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(10,15,30,.09);}
.vp-act.ac{background:linear-gradient(145deg,#ff5a1f,#d63800);border:none;color:#fff;box-shadow:0 12px 32px rgba(214,56,0,.38);}
.vp-act.ac:hover{box-shadow:0 18px 44px rgba(214,56,0,.5);}
.vp-act-ic{font-size:28px;margin-bottom:auto;}
.vp-act-title{font-size:15px;font-weight:900;letter-spacing:-.02em;}
.vp-act-sub{font-size:12px;margin-top:3px;opacity:.68;}

/* ══ DEALS CARD ══ */
.vp-deals-card{background:#fff;border:1px solid #e3eaf7;border-radius:20px;box-shadow:0 2px 10px rgba(10,15,30,.04);overflow:hidden;}

/* tabs */
.vp-tabs{display:flex;align-items:center;padding:0 14px;border-bottom:1.5px solid #edf2fb;overflow-x:auto;scrollbar-width:none;}
.vp-tabs::-webkit-scrollbar{display:none;}
.vp-tab{
  display:inline-flex;align-items:center;gap:6px;
  padding:14px 12px;font-size:13px;font-weight:700;
  color:#64748b;cursor:pointer;border:none;background:none;
  font-family:inherit;white-space:nowrap;position:relative;transition:color .15s;
}
.vp-tab:hover{color:#0a0f1e;}
.vp-tab.act{color:#e8410a;}
.vp-tab.act::after{content:'';position:absolute;bottom:-1.5px;left:0;right:0;height:2.5px;background:linear-gradient(90deg,#ff5a1f,#e8410a);border-radius:2px 2px 0 0;}
.vp-tab-n{min-width:19px;height:19px;border-radius:999px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;padding:0 5px;}
.vp-tab.act .vp-tab-n{background:#fff0eb;color:#e8410a;}
.vp-tab:not(.act) .vp-tab-n{background:#f1f5f9;color:#64748b;}
.vp-tab-all-link{margin-left:auto;flex-shrink:0;display:flex;align-items:center;padding:0 6px;font-size:12px;font-weight:700;color:#e8410a;text-decoration:none;white-space:nowrap;}

/* deal list */
.vp-dl-wrap{padding:12px 14px 14px;}
.vp-empty{padding:54px 20px;text-align:center;color:#94a3b8;}
.vp-empty-ico{font-size:54px;margin-bottom:12px;}

/* ── DEAL CARD (Avito style) ── */
.vp-dc{
  display:flex;align-items:stretch;
  border:1.5px solid #e8eef8;border-radius:16px;overflow:hidden;
  background:#fafcff;margin-bottom:10px;cursor:pointer;
  transition:all .18s;text-decoration:none;color:inherit;
}
.vp-dc:last-child{margin-bottom:0;}
.vp-dc:hover{border-color:#c8d9f5;box-shadow:0 8px 26px rgba(10,15,30,.09);background:#fff;transform:translateY(-1px);}

/* photo / thumb */
.vp-dc-img{
  width:110px;flex-shrink:0;position:relative;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  background:#f0f4ff;border-right:1.5px solid #e8eef8;
}
.vp-dc-img img{width:100%;height:100%;object-fit:cover;}
.vp-dc-img-ph{font-size:36px;opacity:.85;}

/* status stripe */
.vp-dc-stripe{
  position:absolute;bottom:0;left:0;right:0;height:3px;
}

/* body */
.vp-dc-body{flex:1;min-width:0;padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between;}
.vp-dc-title{font-size:15px;font-weight:800;color:#0a0f1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;}
.vp-dc-meta{display:flex;flex-wrap:wrap;gap:8px 14px;}
.vp-dc-m{font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;}
.vp-dc-m b{color:#334155;font-weight:700;}

/* right */
.vp-dc-right{
  flex-shrink:0;display:flex;flex-direction:column;
  align-items:flex-end;justify-content:space-between;
  padding:14px 16px;gap:10px;min-width:172px;
}
.vp-badge{
  display:inline-flex;align-items:center;gap:5px;
  border-radius:999px;font-size:11px;font-weight:800;
  padding:5px 12px;white-space:nowrap;
}
.vp-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.vp-dc-btn{
  display:inline-flex;align-items:center;gap:5px;
  border-radius:10px;font-size:12px;font-weight:800;
  padding:9px 15px;white-space:nowrap;
  transition:all .18s;
}
.vp-dc-btn.dark{background:#0a0f1e;color:#fff;}
.vp-dc-btn.dark:hover{background:#1e293b;}
.vp-dc-btn.orange{background:linear-gradient(135deg,#ff5a1f,#e8410a);color:#fff;box-shadow:0 4px 14px rgba(232,65,10,.32);}
.vp-dc-btn.orange:hover{box-shadow:0 7px 20px rgba(232,65,10,.44);}

/* review */
.vp-rv-wrap{border-top:1px solid #f0f4fa;padding:10px 14px;}
.vp-rv-btn{width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:13px;font-weight:700;color:#334155;cursor:pointer;font-family:inherit;transition:all .18s;}
.vp-rv-btn:hover{border-color:#ff5a1f;color:#e8410a;background:#fff7ed;}
.vp-rv-ok{padding:10px;font-size:13px;font-weight:700;color:#16a34a;text-align:center;}

/* ══ RIGHT COLUMN ══ */
.vp-right{display:grid;gap:14px;align-content:start;}

/* nav */
.vp-nav{background:#fff;border:1px solid #e3eaf7;border-radius:20px;box-shadow:0 2px 10px rgba(10,15,30,.04);padding:10px;}
.vp-ni{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:700;color:#334155;text-decoration:none;background:none;border:none;cursor:pointer;font-family:inherit;width:100%;transition:all .15s;}
.vp-ni:hover{background:#f1f5f9;color:#0a0f1e;}
.vp-ni-ic{width:32px;height:32px;border-radius:9px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}

/* tip */
.vp-tip{
  background:#06080f;border-radius:20px;padding:22px;color:#fff;
  box-shadow:0 4px 24px rgba(10,15,30,.18);overflow:hidden;position:relative;
}
.vp-tip::before{content:'';position:absolute;width:220px;height:220px;right:-50px;bottom:-70px;border-radius:50%;background:radial-gradient(circle,rgba(255,90,31,.35),transparent 70%);}
.vp-tip-tag{font-size:10px;font-weight:800;letter-spacing:.1em;color:#ff8c5a;text-transform:uppercase;margin-bottom:8px;}
.vp-tip-text{font-size:13px;color:rgba(255,255,255,.7);line-height:1.6;margin-bottom:16px;position:relative;}
.vp-tip-btn{display:inline-flex;align-items:center;gap:6px;position:relative;background:linear-gradient(135deg,#ff5a1f,#e8410a);color:#fff;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:800;text-decoration:none;box-shadow:0 6px 18px rgba(232,65,10,.4);transition:all .18s;}
.vp-tip-btn:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(232,65,10,.52);}

/* settings */
.vp-set{background:#fff;border:1px solid #e3eaf7;border-radius:20px;box-shadow:0 2px 10px rgba(10,15,30,.04);padding:14px;}
.vp-set-title{font-size:13px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;padding:0 4px;}
.vp-seti{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid #f1f5f9;background:#fafcff;text-decoration:none;color:inherit;transition:all .18s;margin-bottom:6px;position:relative;}
.vp-seti:last-child{margin-bottom:0;}
.vp-seti:hover:not(.vp-dis){border-color:#dde5f4;background:#fff;box-shadow:0 4px 14px rgba(10,15,30,.05);}
.vp-dis{opacity:.45;cursor:default;}
.vp-sei-ic{width:36px;height:36px;border-radius:10px;background:#f1f5f9;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.vp-sei-t{font-size:13px;font-weight:800;color:#0a0f1e;}
.vp-sei-d{font-size:11px;color:#64748b;margin-top:2px;}
.vp-soon{position:absolute;top:7px;right:8px;font-size:9px;font-weight:800;background:#eff6ff;color:#2563eb;border-radius:999px;padding:2px 7px;}

/* ══ RESPONSIVE ══ */
@media(max-width:980px){
  .vp-layout{grid-template-columns:1fr;}
  .vp-stats{grid-template-columns:repeat(2,1fr);}
  .vp-right{grid-template-columns:1fr 1fr;}
}
@media(max-width:640px){
  .vp-acts{grid-template-columns:1fr;}
  .vp-stats{grid-template-columns:repeat(2,1fr);}
  .vp-dc-img{width:80px;}
  .vp-dc-right{min-width:130px;}
  .vp-right{grid-template-columns:1fr;}
  .vp-hero{padding:36px 0 88px;}
}
`;

export default function CustomerProfilePage() {
  const { userId, userName, userRole, userAvatar, updateAvatar, logout } = useAuth();
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals]     = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('ALL');
  const [reviewFor, setReviewFor] = useState(null);

  const avatarUrl = resolveUrl(userAvatar);

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
        const M = 420; let w = img.width, h = img.height;
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
    active: deals.filter(d => ['IN_PROGRESS','NEW'].includes(d.status)).length,
    done: deals.filter(d => d.status === 'COMPLETED').length,
    cancelled: deals.filter(d => d.status === 'CANCELLED').length,
  }), [deals]);

  const tabCounts = useMemo(() => {
    const c = { ALL: deals.length, NEW: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    deals.forEach(d => { if (c[d.status] !== undefined) c[d.status]++; });
    return c;
  }, [deals]);

  const visible = tab === 'ALL' ? deals : deals.filter(d => d.status === tab);

  if (userRole === 'WORKER') return null;

  return (
    <div className="vp">
      <style>{css}</style>

      {/* ═══ HERO ═══ */}
      <div className="vp-hero">
        <div className="vp-hero-glow" />
        <div className="vp-hero-mesh" />
        <div className="vp-hero-grid" />
        <div className="vp-hero-inner">
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onAvatar} />
          <div className="vp-ava" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
            <div className="vp-ava-ov">{avatarLoading ? '⏳' : '📷'}</div>
          </div>
          <div className="vp-hero-txt">
            <div className="vp-hero-name">{fullName}</div>
            <div className="vp-hero-pills">
              <span className="vp-pill vp-pill-o">👤 Заказчик</span>
              <span className="vp-pill vp-pill-g">✓ Документы проверены</span>
              <span className="vp-pill vp-pill-w">📍 Йошкар-Ола</span>
              {since && <span className="vp-pill vp-pill-w">На сервисе с {since}</span>}
            </div>
          </div>
          <div className="vp-hero-btns">
            <button className="vp-hbtn" onClick={() => fileRef.current?.click()}>
              {avatarLoading ? '⏳' : avatarUrl ? '📷 Сменить фото' : '📷 Добавить фото'}
            </button>
            <button className="vp-hbtn" onClick={() => { logout(); navigate('/login'); }}>Выйти</button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="vp-wrap">

        {/* Stats */}
        <div className="vp-stats">
          {[
            { dc:'t', nc:'vp-no', ico:'📊', num: stats.total,     lbl:'Всего сделок' },
            { dc:'a', nc:'vp-nb', ico:'🔥', num: stats.active,    lbl:'Активных' },
            { dc:'d', nc:'vp-ng', ico:'✅', num: stats.done,      lbl:'Завершено' },
            { dc:'c', nc:'vp-ns', ico:'❌', num: stats.cancelled, lbl:'Отменено' },
          ].map(s => (
            <div key={s.dc} className="vp-stat">
              <div className={`vp-si ${s.dc}`}>{s.ico}</div>
              <div>
                <div className={`vp-stat-num ${s.nc}`}>{s.num}</div>
                <div className="vp-stat-lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="vp-layout">

          {/* ── LEFT ── */}
          <div>
            {/* Quick actions */}
            <div className="vp-acts">
              <Link to="/categories" className="vp-act ac">
                <div className="vp-act-ic">🚀</div>
                <div>
                  <div className="vp-act-title">Найти мастера</div>
                  <div className="vp-act-sub">Каталог по категориям</div>
                </div>
              </Link>
              <Link to="/deals" className="vp-act">
                <div className="vp-act-ic">🤝</div>
                <div>
                  <div className="vp-act-title">Мои сделки</div>
                  <div className="vp-act-sub" style={{color:'#64748b'}}>
                    Активных: <b style={{color:'#e8410a'}}>{stats.active}</b>
                  </div>
                </div>
              </Link>
              <Link to="/chat" className="vp-act">
                <div className="vp-act-ic">💬</div>
                <div>
                  <div className="vp-act-title">Сообщения</div>
                  <div className="vp-act-sub" style={{color:'#64748b'}}>Чат с мастерами</div>
                </div>
              </Link>
            </div>

            {/* Deals */}
            <div className="vp-deals-card">
              {/* Avito-style tabs */}
              <div className="vp-tabs">
                {TABS.map(t => (
                  <button key={t.key} className={`vp-tab${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>
                    {t.label}
                    {tabCounts[t.key] > 0 && <span className="vp-tab-n">{tabCounts[t.key]}</span>}
                  </button>
                ))}
                <Link to="/deals" className="vp-tab-all-link">Все сделки →</Link>
              </div>

              <div className="vp-dl-wrap">
                {loading ? (
                  <div className="vp-empty"><div className="vp-empty-ico">⏳</div>Загружаем...</div>
                ) : visible.length === 0 ? (
                  <div className="vp-empty">
                    <div className="vp-empty-ico">{deals.length === 0 ? '🔍' : '🗂'}</div>
                    <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>
                      {deals.length === 0 ? 'Сделок пока нет' : 'В этой категории пусто'}
                    </div>
                    {deals.length === 0 && (
                      <Link to="/categories" style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,background:'linear-gradient(135deg,#ff5a1f,#e8410a)',color:'#fff',textDecoration:'none',borderRadius:12,padding:'11px 20px',fontWeight:800,fontSize:14,boxShadow:'0 8px 22px rgba(232,65,10,.35)'}}>
                        🚀 Найти мастера
                      </Link>
                    )}
                  </div>
                ) : visible.map(deal => {
                  const s = deal.status || 'IN_PROGRESS';
                  const si = ST[s] || ST.IN_PROGRESS;

                  // Photo: first listing/job photo, fallback worker avatar, fallback emoji
                  const photoRaw = (deal.photos && deal.photos[0]) || deal.workerAvatar || null;
                  const photoSrc = resolveUrl(photoRaw);
                  const isAvatar = !deal.photos?.[0] && !!deal.workerAvatar;

                  return (
                    <div key={deal.id} style={{borderRadius:16,overflow:'hidden',marginBottom:10,border:'1.5px solid #e8eef8'}}>
                      {/* Main clickable row */}
                      <Link to={`/deals?dealId=${deal.id}`} className="vp-dc">
                        {/* Photo thumb */}
                        <div className="vp-dc-img">
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt=""
                              style={isAvatar ? {width:'60px',height:'60px',borderRadius:'50%',objectFit:'cover'} : {}}
                            />
                          ) : (
                            <div className="vp-dc-img-ph">{dealEmoji(deal.title)}</div>
                          )}
                          {/* status stripe at bottom of thumb */}
                          <div className="vp-dc-stripe" style={{background: si.dot}} />
                        </div>

                        {/* Body */}
                        <div className="vp-dc-body">
                          <div className="vp-dc-title">{deal.title || 'Сделка'}</div>
                          <div className="vp-dc-meta">
                            {deal.workerName && (
                              <span className="vp-dc-m">👤 <b>{[deal.workerName, deal.workerLastName].filter(Boolean).join(' ')}</b></span>
                            )}
                            {deal.agreedPrice && (
                              <span className="vp-dc-m">💰 <b>{Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</b></span>
                            )}
                            {deal.createdAt && (
                              <span className="vp-dc-m">📅 {fmtCard(deal.createdAt)}</span>
                            )}
                            {deal.category && (
                              <span className="vp-dc-m">📂 {deal.category}</span>
                            )}
                          </div>
                        </div>

                        {/* Right */}
                        <div className="vp-dc-right">
                          <span className="vp-badge" style={{background: si.bg, color: si.fg}}>
                            <span className="vp-dot" style={{background: si.dot}} />
                            {si.label}
                          </span>
                          <span className={`vp-dc-btn ${s === 'NEW' ? 'orange' : 'dark'}`}>
                            {si.btn} →
                          </span>
                        </div>
                      </Link>

                      {/* Review (outside the Link) */}
                      {s === 'COMPLETED' && !deal.hasReview && (
                        <div className="vp-rv-wrap">
                          {reviewFor === deal.id
                            ? <ReviewForm dealId={deal.id} onSuccess={() => { setReviewFor(null); reloadDeals(); }} />
                            : <button className="vp-rv-btn" onClick={() => setReviewFor(deal.id)}>⭐ Оставить отзыв о мастере</button>
                          }
                        </div>
                      )}
                      {s === 'COMPLETED' && deal.hasReview && (
                        <div className="vp-rv-wrap"><div className="vp-rv-ok">✓ Отзыв уже отправлен</div></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="vp-right">
            <div className="vp-nav">
              <nav>
                {[
                  { to:'/categories', ico:'🔍', lbl:'Найти мастера' },
                  { to:'/deals',      ico:'🤝', lbl:'Мои сделки' },
                  { to:'/chat',       ico:'💬', lbl:'Сообщения' },
                ].map(n => (
                  <Link key={n.to} to={n.to} className="vp-ni">
                    <div className="vp-ni-ic">{n.ico}</div>{n.lbl}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="vp-tip">
              <div className="vp-tip-tag">Совет</div>
              <div className="vp-tip-text">Оставляйте отзывы — мастерам это помогает расти, а вам легче выбирать в следующий раз.</div>
              <Link to="/categories" className="vp-tip-btn">🚀 Найти мастера</Link>
            </div>

            <div className="vp-set">
              <div className="vp-set-title">Настройки</div>
              {[
                { to:'/settings/personal',      ico:'👤', t:'Личные данные', d:'Имя и контакты' },
                { to:'/settings/notifications', ico:'🔔', t:'Уведомления',   d:'Push и email' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="vp-seti">
                  <div className="vp-sei-ic">{item.ico}</div>
                  <div style={{flex:1}}><div className="vp-sei-t">{item.t}</div><div className="vp-sei-d">{item.d}</div></div>
                  <div style={{color:'#cbd5e1',fontSize:18}}>›</div>
                </Link>
              ))}
              <div className="vp-seti vp-dis">
                <div className="vp-soon">СКОРО</div>
                <div className="vp-sei-ic">🧩</div>
                <div style={{flex:1}}><div className="vp-sei-t">Доп. опции</div><div className="vp-sei-d">Новые возможности</div></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
