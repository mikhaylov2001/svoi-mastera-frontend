import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, uploadAvatar, getUserProfile } from '../../api';
import ReviewForm from '../../components/ReviewForm';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtCard(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const DEAL_TABS = [
  { key: 'ALL',         label: 'Все' },
  { key: 'NEW',         label: 'Ждут подтверждения' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'COMPLETED',   label: 'Завершены' },
  { key: 'CANCELLED',   label: 'Отменены' },
];

const S = {
  NEW:         { ico:'⏳', label:'Ожидает мастера',   bg:'#fff7ed', fg:'#c2410c', dot:'#fb923c' },
  IN_PROGRESS: { ico:'⚡', label:'В работе',           bg:'#eff6ff', fg:'#1d4ed8', dot:'#3b82f6' },
  COMPLETED:   { ico:'✓',  label:'Завершена',          bg:'#f0fdf4', fg:'#15803d', dot:'#22c55e' },
  CANCELLED:   { ico:'✕',  label:'Отменена',           bg:'#fff1f2', fg:'#be123c', dot:'#f43f5e' },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
.vp{font-family:Inter,-apple-system,sans-serif;color:#0a0f1e;background:#f1f4f9;min-height:100vh}
.vp *{box-sizing:border-box;margin:0;padding:0}

/* ════════ HERO ════════ */
.vp-hero{
  position:relative;overflow:hidden;
  background:#06080f;
  padding:52px 0 90px;
}
/* layered mesh blobs */
.vp-hero::before{
  content:'';position:absolute;inset:0;
  background:
    radial-gradient(ellipse 80% 140% at 100% -10%, rgba(255,80,10,.55) 0%, transparent 60%),
    radial-gradient(ellipse 60% 100% at -5% 110%,  rgba(109,40,217,.4) 0%, transparent 55%),
    radial-gradient(ellipse 50% 80%  at 50% 60%,   rgba(14,116,255,.18) 0%, transparent 70%),
    radial-gradient(ellipse 30% 50%  at 30% -20%,  rgba(255,200,50,.12) 0%, transparent 60%);
}
/* animated glow ring */
.vp-hero::after{
  content:'';position:absolute;
  width:520px;height:520px;
  right:-80px;top:-140px;
  border-radius:50%;
  background:conic-gradient(from 0deg, #ff5a1f44, #7c3aed33, #0ea5e944, #ff5a1f44);
  filter:blur(48px);
  animation:vp-spin 18s linear infinite;
}
@keyframes vp-spin{to{transform:rotate(360deg)}}

/* dot grid overlay */
.vp-hero-dots{
  position:absolute;inset:0;
  background-image:radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px);
  background-size:28px 28px;
}
.vp-hero-inner{
  position:relative;z-index:2;
  max-width:1140px;margin:0 auto;padding:0 22px;
  display:flex;align-items:center;gap:24px;flex-wrap:wrap;
}

/* avatar */
.vp-ava{
  width:92px;height:92px;border-radius:26px;
  border:2.5px solid rgba(255,255,255,.2);
  overflow:hidden;background:linear-gradient(145deg,#ff5a1f,#ff9500);
  display:flex;align-items:center;justify-content:center;
  font-size:36px;font-weight:900;color:#fff;
  cursor:pointer;position:relative;flex-shrink:0;
  transition:transform .2s,box-shadow .2s;
  box-shadow:0 8px 32px rgba(255,90,31,.35);
}
.vp-ava:hover{transform:scale(1.05);box-shadow:0 12px 40px rgba(255,90,31,.5);}
.vp-ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.vp-ava-ov{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:26px;opacity:0;transition:opacity .18s;border-radius:26px;}
.vp-ava:hover .vp-ava-ov{opacity:1;}

.vp-hero-txt{flex:1;min-width:0;}
.vp-hero-name{
  font-size:clamp(26px,3.2vw,40px);font-weight:900;
  letter-spacing:-.045em;color:#fff;line-height:1;
  text-shadow:0 2px 20px rgba(0,0,0,.4);
}
.vp-hero-pills{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;}
.vp-pill{
  display:inline-flex;align-items:center;gap:5px;
  border-radius:999px;font-size:12px;font-weight:700;
  padding:5px 13px;backdrop-filter:blur(16px);white-space:nowrap;
}
.vp-pill-o{background:rgba(255,90,31,.22);color:#ffb085;border:1px solid rgba(255,90,31,.35);}
.vp-pill-g{background:rgba(34,197,94,.18);color:#6ee7b7;border:1px solid rgba(34,197,94,.3);}
.vp-pill-w{background:rgba(255,255,255,.1);color:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.15);}

.vp-hero-btns{display:flex;gap:8px;align-self:flex-start;padding-top:6px;}
.vp-hbtn{
  display:inline-flex;align-items:center;gap:6px;
  border-radius:12px;font-size:13px;font-weight:700;
  padding:10px 18px;cursor:pointer;border:none;
  font-family:inherit;text-decoration:none;transition:all .18s;
}
.vp-hbtn-ghost{
  background:rgba(255,255,255,.1);color:rgba(255,255,255,.85);
  border:1px solid rgba(255,255,255,.18);
}
.vp-hbtn-ghost:hover{background:rgba(255,255,255,.18);}

/* ════════ WRAP ════════ */
.vp-wrap{max-width:1140px;margin:-50px auto 64px;padding:0 22px;position:relative;z-index:3;}

/* ════════ STATS ROW ════════ */
.vp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:14px;}
.vp-stat{
  background:#fff;border:1px solid #e4eaf7;border-radius:18px;
  padding:18px 20px;display:flex;align-items:center;gap:14px;
  box-shadow:0 2px 10px rgba(10,15,30,.05);transition:all .2s;
}
.vp-stat:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(10,15,30,.08);}
.vp-stat-dot{
  width:46px;height:46px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:22px;flex-shrink:0;
}
.vp-stat-dot.t{background:#fff7ed;} .vp-stat-dot.a{background:#eff6ff;}
.vp-stat-dot.d{background:#f0fdf4;} .vp-stat-dot.c{background:#fff1f2;}
.vp-stat-num{font-size:30px;font-weight:900;letter-spacing:-.04em;line-height:1;}
.vp-stat-lbl{font-size:12px;color:#64748b;font-weight:600;margin-top:3px;}
.vp-num-o{color:#e8410a;}.vp-num-b{color:#2563eb;}.vp-num-g{color:#16a34a;}.vp-num-s{color:#94a3b8;}

/* ════════ LAYOUT ════════ */
.vp-layout{display:grid;grid-template-columns:1fr 300px;gap:14px;align-items:start;}

/* ════════ QUICK ACTIONS ════════ */
.vp-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;}
.vp-act{
  display:flex;flex-direction:column;justify-content:space-between;
  min-height:130px;border-radius:18px;padding:18px;
  text-decoration:none;color:inherit;border:1px solid #e4eaf7;
  background:#fff;transition:all .2s;
}
.vp-act:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(10,15,30,.09);}
.vp-act.ac{
  background:linear-gradient(145deg,#ff5a1f,#d63800);
  border:none;color:#fff;box-shadow:0 10px 30px rgba(220,56,0,.35);
}
.vp-act.ac:hover{box-shadow:0 16px 40px rgba(220,56,0,.48);}
.vp-act-ic{font-size:28px;margin-bottom:auto;}
.vp-act-title{font-size:16px;font-weight:900;letter-spacing:-.02em;}
.vp-act-sub{font-size:12px;margin-top:3px;opacity:.7;}

/* ════════ DEALS CARD ════════ */
.vp-deals-card{
  background:#fff;border:1px solid #e4eaf7;border-radius:20px;
  box-shadow:0 2px 10px rgba(10,15,30,.04);overflow:hidden;
}

/* ── TABS ── */
.vp-tabs{
  display:flex;align-items:center;gap:2px;
  padding:14px 16px 0;border-bottom:1px solid #edf2fa;
  overflow-x:auto;scrollbar-width:none;
}
.vp-tabs::-webkit-scrollbar{display:none;}
.vp-tab{
  display:inline-flex;align-items:center;gap:6px;
  padding:10px 14px;font-size:13px;font-weight:700;
  color:#64748b;cursor:pointer;border:none;
  background:none;font-family:inherit;white-space:nowrap;
  position:relative;transition:color .18s;border-radius:10px 10px 0 0;
}
.vp-tab:hover{color:#0a0f1e;}
.vp-tab.vt-act{color:#e8410a;}
.vp-tab.vt-act::after{
  content:'';position:absolute;bottom:-1px;left:0;right:0;height:2px;
  background:linear-gradient(90deg,#ff5a1f,#e8410a);border-radius:2px 2px 0 0;
}
.vp-tab-cnt{
  min-width:20px;height:20px;border-radius:999px;
  font-size:11px;font-weight:800;display:inline-flex;
  align-items:center;justify-content:center;padding:0 5px;
}
.vp-tab.vt-act .vp-tab-cnt{background:#fff0eb;color:#e8410a;}
.vp-tab:not(.vt-act) .vp-tab-cnt{background:#f1f5f9;color:#64748b;}

/* ── DEAL LIST ── */
.vp-deal-list{padding:12px 16px 16px;}
.vp-empty{padding:52px 20px;text-align:center;color:#94a3b8;}
.vp-empty-ico{font-size:52px;margin-bottom:12px;}
.vp-empty-btn{
  display:inline-flex;align-items:center;gap:6px;margin-top:16px;
  background:linear-gradient(135deg,#ff5a1f,#e8410a);color:#fff;
  text-decoration:none;border-radius:12px;padding:11px 20px;
  font-weight:800;font-size:14px;box-shadow:0 8px 22px rgba(232,65,10,.35);
  transition:all .18s;
}
.vp-empty-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(232,65,10,.45);}

/* ── DEAL CARD ── */
.vp-dc{
  display:flex;align-items:stretch;gap:0;
  border:1px solid #edf3fb;border-radius:16px;
  overflow:hidden;background:#fafcff;
  margin-bottom:8px;transition:all .18s;
}
.vp-dc:last-child{margin-bottom:0;}
.vp-dc:hover{border-color:#d8e6f8;box-shadow:0 6px 20px rgba(10,15,30,.07);background:#fff;}

/* left thumb */
.vp-dc-thumb{
  width:88px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  font-size:32px;background:#f0f4ff;
  border-right:1px solid #edf3fb;
}

/* body */
.vp-dc-body{flex:1;min-width:0;padding:14px 16px;}
.vp-dc-title{font-size:15px;font-weight:800;color:#0a0f1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;}
.vp-dc-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;}
.vp-dc-meta{font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;}
.vp-dc-meta b{color:#334155;font-weight:700;}

/* right panel */
.vp-dc-right{
  flex-shrink:0;display:flex;flex-direction:column;
  align-items:flex-end;justify-content:space-between;
  padding:14px 16px;gap:10px;min-width:160px;
}
.vp-dc-badge{
  display:inline-flex;align-items:center;gap:5px;
  border-radius:999px;font-size:11px;font-weight:800;
  padding:5px 12px;white-space:nowrap;
}
.vp-dc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.vp-dc-action{
  display:inline-flex;align-items:center;gap:5px;
  border-radius:10px;font-size:12px;font-weight:800;
  padding:8px 14px;text-decoration:none;border:none;
  cursor:pointer;font-family:inherit;white-space:nowrap;
  background:#0a0f1e;color:#fff;transition:all .18s;
}
.vp-dc-action:hover{background:#1e293b;}
.vp-dc-action.a-or{background:linear-gradient(135deg,#ff5a1f,#e8410a);box-shadow:0 4px 12px rgba(232,65,10,.3);}
.vp-dc-action.a-or:hover{box-shadow:0 7px 18px rgba(232,65,10,.4);}

.vp-review-wrap{padding:0 16px 12px;}
.vp-review-btn{width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:13px;font-weight:700;color:#334155;cursor:pointer;font-family:inherit;transition:all .18s;}
.vp-review-btn:hover{border-color:#ff5a1f;color:#e8410a;background:#fff7ed;}
.vp-review-ok{padding:10px 16px 12px;font-size:13px;font-weight:700;color:#16a34a;}

/* ════════ RIGHT COLUMN ════════ */
.vp-right{display:grid;gap:12px;align-content:start;}

/* nav */
.vp-nav-card{background:#fff;border:1px solid #e4eaf7;border-radius:20px;box-shadow:0 2px 10px rgba(10,15,30,.04);padding:12px;}
.vp-ni{
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;border-radius:12px;
  font-size:14px;font-weight:700;color:#334155;
  text-decoration:none;background:none;border:none;
  cursor:pointer;font-family:inherit;width:100%;transition:all .15s;
}
.vp-ni:hover{background:#f1f5f9;color:#0a0f1e;}
.vp-ni.vna{background:#fff7ed;color:#c2410c;}
.vp-ni-ico{width:32px;height:32px;border-radius:9px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.vp-ni.vna .vp-ni-ico{background:#fed7aa;}

/* tip */
.vp-tip{
  background:linear-gradient(155deg,#0a0f1e 0%,#1a2540 60%,#0f1f3d 100%);
  border:none;border-radius:20px;padding:22px;color:#fff;
  box-shadow:0 4px 20px rgba(10,15,30,.15);
  position:relative;overflow:hidden;
}
.vp-tip::before{
  content:'';position:absolute;
  width:200px;height:200px;
  right:-40px;bottom:-60px;
  background:radial-gradient(circle, rgba(255,90,31,.3), transparent 70%);
  border-radius:50%;
}
.vp-tip-tag{font-size:10px;font-weight:800;letter-spacing:.1em;color:#ff8c5a;text-transform:uppercase;margin-bottom:8px;}
.vp-tip-text{font-size:13px;color:rgba(255,255,255,.72);line-height:1.6;margin-bottom:16px;position:relative;}
.vp-tip-btn{
  display:inline-flex;align-items:center;gap:6px;position:relative;
  background:linear-gradient(135deg,#ff5a1f,#e8410a);color:#fff;
  border-radius:10px;padding:10px 16px;font-size:13px;font-weight:800;
  text-decoration:none;box-shadow:0 6px 18px rgba(232,65,10,.4);transition:all .18s;
}
.vp-tip-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(232,65,10,.5);}

/* settings */
.vp-set-card{background:#fff;border:1px solid #e4eaf7;border-radius:20px;box-shadow:0 2px 10px rgba(10,15,30,.04);padding:14px;}
.vp-set-title{font-size:14px;font-weight:900;color:#0a0f1e;margin-bottom:10px;padding:0 4px;}
.vp-si{
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;border-radius:12px;
  border:1px solid #f1f5f9;background:#fafcff;
  text-decoration:none;color:inherit;transition:all .18s;
  margin-bottom:6px;position:relative;
}
.vp-si:hover:not(.vp-si-dis){border-color:#e2e8f0;background:#fff;box-shadow:0 4px 12px rgba(10,15,30,.05);}
.vp-si-dis{opacity:.45;cursor:default;}
.vp-si-ico{width:36px;height:36px;border-radius:10px;background:#f1f5f9;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.vp-si-t{font-size:13px;font-weight:800;color:#0a0f1e;}
.vp-si-d{font-size:11px;color:#64748b;margin-top:1px;}
.vp-soon{position:absolute;top:7px;right:8px;font-size:9px;font-weight:800;background:#eff6ff;color:#2563eb;border-radius:999px;padding:2px 7px;}

/* ════════ RESPONSIVE ════════ */
@media(max-width:980px){
  .vp-layout{grid-template-columns:1fr;}
  .vp-stats{grid-template-columns:repeat(2,1fr);}
  .vp-right{grid-template-columns:1fr 1fr;}
  .vp-nav-card,.vp-tip,.vp-set-card{min-width:0;}
}
@media(max-width:640px){
  .vp-actions{grid-template-columns:1fr;}
  .vp-stats{grid-template-columns:repeat(2,1fr);}
  .vp-dc-right{min-width:130px;}
  .vp-right{grid-template-columns:1fr;}
  .vp-hero{padding:36px 0 82px;}
}
`;

/* thumb emoji by title keyword */
function dealThumb(title) {
  if (!title) return '🔧';
  const t = title.toLowerCase();
  if (t.includes('розетк') || t.includes('электр')) return '⚡';
  if (t.includes('сантех') || t.includes('труб'))  return '🚿';
  if (t.includes('ремонт') || t.includes('отдел')) return '🏗';
  if (t.includes('мебел') || t.includes('сборк'))  return '🪑';
  if (t.includes('уборк') || t.includes('клин'))   return '🧹';
  if (t.includes('груз') || t.includes('перевоз')) return '🚚';
  if (t.includes('компьют') || t.includes('ноутб')) return '💻';
  if (t.includes('замок') || t.includes('дверь'))  return '🔐';
  if (t.includes('сад') || t.includes('дача'))     return '🌿';
  if (t.includes('маляр') || t.includes('краск'))  return '🎨';
  return '🔧';
}

function thumbBg(status) {
  const m = { NEW:'#fff7ed', IN_PROGRESS:'#eff6ff', COMPLETED:'#f0fdf4', CANCELLED:'#fff1f2' };
  return m[status] || '#f1f5f9';
}

export default function CustomerProfilePage() {
  const { userId, userName, userRole, userAvatar, updateAvatar, logout } = useAuth();
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals]     = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dealTab, setDealTab] = useState('ALL');
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

  const visibleDeals = dealTab === 'ALL' ? deals : deals.filter(d => d.status === dealTab);

  if (userRole === 'WORKER') return null;

  return (
    <div className="vp">
      <style>{css}</style>

      {/* ═══ HERO ═══ */}
      <div className="vp-hero">
        <div className="vp-hero-dots" />
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
            <button className="vp-hbtn vp-hbtn-ghost" onClick={() => fileRef.current?.click()}>
              {avatarLoading ? '⏳' : avatarUrl ? '📷 Сменить фото' : '📷 Добавить фото'}
            </button>
            <button className="vp-hbtn vp-hbtn-ghost" onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="vp-wrap">

        {/* Stats */}
        <div className="vp-stats">
          {[
            { dc:'t', nc:'vp-num-o', ico:'📊', num: stats.total,     lbl:'Всего сделок' },
            { dc:'a', nc:'vp-num-b', ico:'🔥', num: stats.active,    lbl:'Активных' },
            { dc:'d', nc:'vp-num-g', ico:'✅', num: stats.done,      lbl:'Завершено' },
            { dc:'c', nc:'vp-num-s', ico:'❌', num: stats.cancelled, lbl:'Отменено' },
          ].map(s => (
            <div key={s.dc} className="vp-stat">
              <div className={`vp-stat-dot ${s.dc}`}>{s.ico}</div>
              <div>
                <div className={`vp-stat-num ${s.nc}`}>{s.num}</div>
                <div className="vp-stat-lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Layout */}
        <div className="vp-layout">

          {/* ── LEFT ── */}
          <div>
            {/* Quick actions */}
            <div className="vp-actions">
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
                  <div className="vp-act-sub" style={{color:'#64748b'}}>Активных: <b style={{color:'#e8410a'}}>{stats.active}</b></div>
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

            {/* Deals with Avito-style tabs */}
            <div className="vp-deals-card">
              {/* Tabs */}
              <div className="vp-tabs">
                {DEAL_TABS.map(t => (
                  <button
                    key={t.key}
                    className={`vp-tab${dealTab === t.key ? ' vt-act' : ''}`}
                    onClick={() => setDealTab(t.key)}
                  >
                    {t.label}
                    {tabCounts[t.key] > 0 && (
                      <span className="vp-tab-cnt">{tabCounts[t.key]}</span>
                    )}
                  </button>
                ))}
                <Link to="/deals" style={{marginLeft:'auto',flexShrink:0,display:'flex',alignItems:'center',padding:'10px 14px',fontSize:12,fontWeight:700,color:'#e8410a',textDecoration:'none',whiteSpace:'nowrap'}}>
                  Все сделки →
                </Link>
              </div>

              {/* Deal list */}
              <div className="vp-deal-list">
                {loading ? (
                  <div className="vp-empty"><div className="vp-empty-ico">⏳</div>Загружаем...</div>
                ) : visibleDeals.length === 0 ? (
                  <div className="vp-empty">
                    <div className="vp-empty-ico">{deals.length === 0 ? '🔍' : '🗂'}</div>
                    <div>{deals.length === 0 ? 'Сделок пока нет — найдите первого мастера' : 'В этой категории пусто'}</div>
                    {deals.length === 0 && (
                      <Link to="/categories" className="vp-empty-btn">🚀 Найти мастера</Link>
                    )}
                  </div>
                ) : (
                  visibleDeals.map(deal => {
                    const st = deal.status || 'IN_PROGRESS';
                    const si = S[st] || S.IN_PROGRESS;
                    return (
                      <div key={deal.id} style={{borderRadius:16,overflow:'hidden',marginBottom:8,border:'1px solid #edf3fb'}}>
                        <div className="vp-dc">
                          {/* Thumb */}
                          <div className="vp-dc-thumb" style={{background: thumbBg(st)}}>
                            {dealThumb(deal.title)}
                          </div>

                          {/* Body */}
                          <div className="vp-dc-body">
                            <div className="vp-dc-title">{deal.title || 'Сделка'}</div>
                            <div className="vp-dc-row">
                              {deal.workerName && (
                                <span className="vp-dc-meta">👤 <b>{deal.workerName}</b></span>
                              )}
                              {deal.agreedPrice && (
                                <span className="vp-dc-meta">💰 <b>{Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</b></span>
                              )}
                              {deal.createdAt && (
                                <span className="vp-dc-meta">📅 {fmtCard(deal.createdAt)}</span>
                              )}
                            </div>
                          </div>

                          {/* Right */}
                          <div className="vp-dc-right">
                            <span className="vp-dc-badge" style={{background: si.bg, color: si.fg}}>
                              <span className="vp-dc-dot" style={{background: si.dot}} />
                              {si.label}
                            </span>
                            <Link
                              to={`/deals?dealId=${deal.id}`}
                              className={`vp-dc-action${st === 'NEW' ? ' a-or' : ''}`}
                            >
                              {st === 'NEW' ? 'Ждём мастера' : st === 'IN_PROGRESS' ? 'Открыть' : 'Детали'} →
                            </Link>
                          </div>
                        </div>

                        {/* Review */}
                        {st === 'COMPLETED' && !deal.hasReview && (
                          <div className="vp-review-wrap">
                            {reviewFor === deal.id
                              ? <ReviewForm dealId={deal.id} onSuccess={() => { setReviewFor(null); reloadDeals(); }} />
                              : <button className="vp-review-btn" onClick={() => setReviewFor(deal.id)}>⭐ Оставить отзыв о мастере</button>
                            }
                          </div>
                        )}
                        {st === 'COMPLETED' && deal.hasReview && (
                          <div className="vp-review-ok">✓ Отзыв отправлен</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="vp-right">
            {/* Navigation */}
            <div className="vp-nav-card">
              <nav>
                {[
                  { to:'/categories', ico:'🔍', lbl:'Найти мастера' },
                  { to:'/deals',      ico:'🤝', lbl:'Мои сделки' },
                  { to:'/chat',       ico:'💬', lbl:'Сообщения' },
                ].map(n => (
                  <Link key={n.to} to={n.to} className="vp-ni">
                    <div className="vp-ni-ico">{n.ico}</div>{n.lbl}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Tip */}
            <div className="vp-tip">
              <div className="vp-tip-tag">Совет</div>
              <div className="vp-tip-text">Оставляйте отзывы — мастера растут, а вам проще выбирать проверенных в следующий раз.</div>
              <Link to="/categories" className="vp-tip-btn">🚀 Найти мастера</Link>
            </div>

            {/* Settings */}
            <div className="vp-set-card">
              <div className="vp-set-title">Настройки</div>
              {[
                { to:'/settings/personal',     ico:'👤', t:'Личные данные',  d:'Имя и контакты' },
                { to:'/settings/notifications',ico:'🔔', t:'Уведомления',    d:'Push и email' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="vp-si">
                  <div className="vp-si-ico">{item.ico}</div>
                  <div style={{flex:1}}><div className="vp-si-t">{item.t}</div><div className="vp-si-d">{item.d}</div></div>
                  <div style={{color:'#cbd5e1',fontSize:18}}>›</div>
                </Link>
              ))}
              <div className="vp-si vp-si-dis">
                <div className="vp-soon">СКОРО</div>
                <div className="vp-si-ico">🧩</div>
                <div style={{flex:1}}><div className="vp-si-t">Доп. опции</div><div className="vp-si-d">Новые возможности</div></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
