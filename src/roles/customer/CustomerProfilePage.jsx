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
function fmtSince(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}
function fmtCard(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const TABS = [
  { key: 'ALL',         label: 'Все' },
  { key: 'NEW',         label: 'Ждут подтверждения' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'COMPLETED',   label: 'Завершены' },
  { key: 'CANCELLED',   label: 'Отменены' },
];

const ST = {
  NEW:         { label: 'Ожидает мастера',  bg:'#fff7ed', fg:'#c2410c', accent:'#fb923c', btn:'Ждём подтверждения', btnStyle:'or' },
  IN_PROGRESS: { label: 'В работе',          bg:'#eff6ff', fg:'#1d4ed8', accent:'#3b82f6', btn:'Открыть',            btnStyle:'bl' },
  COMPLETED:   { label: 'Завершена',         bg:'#f0fdf4', fg:'#15803d', accent:'#22c55e', btn:'Детали',             btnStyle:'gr' },
  CANCELLED:   { label: 'Отменена',          bg:'#fff1f2', fg:'#be123c', accent:'#f43f5e', btn:'Детали',             btnStyle:'dk' },
};

function dealEmoji(t = '') {
  const s = t.toLowerCase();
  if (s.includes('розетк') || s.includes('электр')) return '⚡';
  if (s.includes('сантех') || s.includes('труб'))   return '🚿';
  if (s.includes('ремонт') || s.includes('отдел'))  return '🏗';
  if (s.includes('мебел')  || s.includes('сборк'))  return '🪑';
  if (s.includes('уборк')  || s.includes('клин'))   return '🧹';
  if (s.includes('груз')   || s.includes('перевоз'))return '🚚';
  if (s.includes('компьют')|| s.includes('ноутб'))  return '💻';
  if (s.includes('замок')  || s.includes('дверь'))  return '🔐';
  if (s.includes('сад')    || s.includes('дача'))   return '🌿';
  if (s.includes('маляр')  || s.includes('краск'))  return '🎨';
  return '🔧';
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&display=swap');

.pp { font-family: Inter, -apple-system, sans-serif; color: #0a0f1e; background: #eceef5; min-height: 100vh; }
.pp * { box-sizing: border-box; }

/* ═══════════ HERO ═══════════ */
.pp-hero {
  position: relative; overflow: hidden;
  background: #080b14;
  padding-bottom: 0;
}

/* multi-layer atmosphere */
.pp-hero-atm {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 90% 180% at 105%  -5%, rgba(255,72,0,.52) 0%, transparent 55%),
    radial-gradient(ellipse 60% 100% at -8%  120%, rgba(124,58,237,.42) 0%, transparent 52%),
    radial-gradient(ellipse 45% 80%  at  48%  50%, rgba(14,116,255,.15) 0%, transparent 65%),
    radial-gradient(ellipse 30% 60%  at  20% -25%, rgba(255,180,30,.1)  0%, transparent 60%);
}
/* spinning conic glow */
.pp-hero-ring {
  position: absolute;
  width: 800px; height: 800px;
  right: -160px; top: -260px;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
    rgba(255,90,31,.4) 0deg,
    rgba(147,51,234,.28) 90deg,
    rgba(14,116,255,.32) 180deg,
    rgba(255,90,31,.4) 360deg);
  filter: blur(64px);
  animation: pp-spin 24s linear infinite;
}
@keyframes pp-spin { to { transform: rotate(360deg); } }
/* grid */
.pp-hero-grid {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px);
  background-size: 28px 28px;
}
/* profile row */
.pp-hero-inner {
  position: relative; z-index: 2;
  max-width: 1160px; margin: 0 auto; padding: 52px 24px 40px;
  display: flex; align-items: flex-start; gap: 28px; flex-wrap: wrap;
}

/* avatar */
.pp-ava {
  width: 100px; height: 100px; border-radius: 28px; flex-shrink: 0;
  border: 2.5px solid rgba(255,255,255,.22);
  background: linear-gradient(145deg, #ff5a1f, #ff9c00);
  display: flex; align-items: center; justify-content: center;
  font-size: 40px; font-weight: 900; color: #fff;
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform .22s, box-shadow .22s;
  box-shadow: 0 12px 42px rgba(255,90,31,.42);
}
.pp-ava:hover { transform: scale(1.06); box-shadow: 0 16px 52px rgba(255,90,31,.58); }
.pp-ava img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pp-ava-ov {
  position: absolute; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; opacity: 0; transition: opacity .18s; border-radius: 28px;
}
.pp-ava:hover .pp-ava-ov { opacity: 1; }

/* name + meta */
.pp-hero-txt { flex: 1; min-width: 0; padding-top: 4px; }
.pp-hero-name {
  font-size: clamp(28px, 3.8vw, 46px);
  font-weight: 900; letter-spacing: -.048em; color: #fff;
  line-height: 1; text-shadow: 0 2px 30px rgba(0,0,0,.4);
}
.pp-hero-role {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 10px; margin-bottom: 10px;
  font-size: 13px; font-weight: 700; color: rgba(255,255,255,.55);
}
.pp-hero-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pp-pill {
  display: inline-flex; align-items: center; gap: 5px;
  border-radius: 999px; font-size: 12px; font-weight: 700;
  padding: 5px 13px; backdrop-filter: blur(14px); white-space: nowrap;
}
.pp-pill-o { background: rgba(255,90,31,.22); color: #ffb085; border: 1px solid rgba(255,90,31,.35); }
.pp-pill-g { background: rgba(34,197,94,.18); color: #6ee7b7;  border: 1px solid rgba(34,197,94,.3); }
.pp-pill-w { background: rgba(255,255,255,.1); color: rgba(255,255,255,.78); border: 1px solid rgba(255,255,255,.14); }

/* header buttons */
.pp-hero-btns { display: flex; gap: 8px; padding-top: 4px; }
.pp-hbtn {
  display: inline-flex; align-items: center; gap: 6px;
  border-radius: 12px; font-size: 13px; font-weight: 700;
  padding: 10px 18px; cursor: pointer;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.1); color: rgba(255,255,255,.88);
  font-family: inherit; text-decoration: none; transition: all .18s;
}
.pp-hbtn:hover { background: rgba(255,255,255,.18); }
.pp-hbtn-logout { border-color: rgba(255,90,90,.3); }
.pp-hbtn-logout:hover { background: rgba(239,68,68,.15); color: #fca5a5; }

/* bottom curve */
.pp-hero-curve {
  position: relative; z-index: 3;
  height: 32px; background: #eceef5;
  border-radius: 24px 24px 0 0;
  margin-top: -1px;
  box-shadow: 0 -12px 40px rgba(10,15,30,.08);
}

/* ═══════════ WRAP ═══════════ */
.pp-wrap { max-width: 1160px; margin: 0 auto 80px; padding: 20px 24px 0; }

/* ═══════════ LAYOUT ═══════════ */
.pp-layout { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }

/* ═══════════ ACTIONS ═══════════ */
.pp-acts { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.pp-act {
  display: flex; flex-direction: column; justify-content: space-between;
  min-height: 138px; border-radius: 20px; padding: 20px;
  text-decoration: none; color: inherit;
  border: 1.5px solid #dde5f6; background: #fff;
  transition: all .22s; position: relative; overflow: hidden;
}
.pp-act::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity .22s; background:radial-gradient(circle at 80% 20%, rgba(255,90,31,.06), transparent 70%); }
.pp-act:hover { transform: translateY(-4px); box-shadow: 0 18px 44px rgba(10,15,30,.1); border-color: #c8d6f0; }
.pp-act:hover::before { opacity:1; }
.pp-act.accent {
  background: linear-gradient(145deg, #ff5a1f 0%, #d23500 100%);
  border: none; color: #fff;
  box-shadow: 0 14px 36px rgba(210,53,0,.38);
}
.pp-act.accent::before { background: radial-gradient(circle at 80% 10%, rgba(255,255,255,.18), transparent 65%); opacity:1; }
.pp-act.accent:hover { box-shadow: 0 20px 48px rgba(210,53,0,.52); }
.pp-act-top { display:flex; justify-content:space-between; align-items:flex-start; }
.pp-act-ico { font-size: 30px; }
.pp-act-arr { font-size: 20px; opacity: .4; }
.pp-act-title { font-size: 17px; font-weight: 900; letter-spacing: -.02em; margin-bottom: 3px; }
.pp-act-sub { font-size: 12px; opacity: .65; line-height: 1.35; }

/* ═══════════ DEALS CARD ═══════════ */
.pp-deals {
  background: #fff; border: 1.5px solid #dde5f6; border-radius: 22px;
  box-shadow: 0 2px 14px rgba(10,15,30,.05); overflow: hidden;
}

/* tabs */
.pp-tabs {
  display: flex; align-items: center;
  padding: 0 16px; border-bottom: 1.5px solid #edf2fb;
  overflow-x: auto; scrollbar-width: none; gap: 2px;
}
.pp-tabs::-webkit-scrollbar { display: none; }
.pp-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 15px 13px; font-size: 13px; font-weight: 700;
  color: #94a3b8; cursor: pointer; border: none; background: none;
  font-family: inherit; white-space: nowrap; position: relative; transition: color .15s;
}
.pp-tab:hover { color: #334155; }
.pp-tab.on { color: #e8410a; }
.pp-tab.on::after {
  content: ''; position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 2.5px; background: linear-gradient(90deg, #ff5a1f, #e8410a);
  border-radius: 2px 2px 0 0;
}
.pp-tab-n {
  min-width: 20px; height: 20px; border-radius: 999px;
  font-size: 11px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center; padding: 0 5px;
}
.pp-tab.on .pp-tab-n { background: #fff0eb; color: #e8410a; }
.pp-tab:not(.on) .pp-tab-n { background: #f1f5f9; color: #64748b; }
.pp-tab-link {
  margin-left: auto; flex-shrink: 0;
  padding: 0 4px; font-size: 12px; font-weight: 700;
  color: #e8410a; text-decoration: none; white-space: nowrap;
}

/* deal list */
.pp-dl-body { padding: 14px 16px 16px; }
.pp-empty { padding: 60px 20px; text-align: center; color: #94a3b8; }
.pp-empty-ico { font-size: 56px; margin-bottom: 12px; }
.pp-empty-text { font-size: 15px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
.pp-empty-sub { font-size: 13px; color: #94a3b8; }

/* ── DEAL CARD ── */
.pp-dc {
  display: flex; align-items: stretch;
  border: 1.5px solid #e8eef8; border-radius: 18px;
  overflow: hidden; background: #fafcff; margin-bottom: 10px;
  text-decoration: none; color: inherit;
  transition: all .2s; position: relative;
}
.pp-dc:last-child { margin-bottom: 0; }
.pp-dc:hover {
  border-color: #c8d9f5; background: #fff;
  box-shadow: 0 10px 32px rgba(10,15,30,.1);
  transform: translateY(-2px);
}

/* left accent line */
.pp-dc-line { width: 4px; flex-shrink: 0; }

/* photo */
.pp-dc-photo {
  width: 120px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5fb; position: relative; overflow: hidden;
  border-right: 1.5px solid #e8eef8;
}
.pp-dc-photo img { width: 100%; height: 100%; object-fit: cover; }
.pp-dc-photo-ph { font-size: 40px; opacity: .8; }
.pp-dc-photo-ava img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(10,15,30,.12); }

/* body */
.pp-dc-body { flex: 1; min-width: 0; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; }
.pp-dc-title { font-size: 15px; font-weight: 900; color: #0a0f1e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pp-dc-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; }
.pp-dc-m { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px; }
.pp-dc-m strong { color: #334155; font-weight: 700; }
.pp-dc-price { font-size: 16px; font-weight: 900; color: #0a0f1e; letter-spacing: -.02em; }

/* right */
.pp-dc-right {
  flex-shrink: 0; display: flex; flex-direction: column;
  align-items: flex-end; justify-content: space-between;
  padding: 16px 18px; gap: 10px; min-width: 178px;
}
.pp-badge {
  display: inline-flex; align-items: center; gap: 5px;
  border-radius: 999px; font-size: 11px; font-weight: 800;
  padding: 5px 12px; white-space: nowrap;
}
.pp-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.pp-dc-btn {
  display: inline-flex; align-items: center; gap: 5px;
  border-radius: 11px; font-size: 12px; font-weight: 800;
  padding: 9px 16px; white-space: nowrap; transition: all .18s;
  text-decoration: none;
}
.pp-dc-btn.or { background: linear-gradient(135deg,#ff5a1f,#e8410a); color:#fff; box-shadow:0 4px 14px rgba(232,65,10,.3); }
.pp-dc-btn.or:hover { box-shadow:0 7px 22px rgba(232,65,10,.46); }
.pp-dc-btn.bl { background: #eff6ff; color: #1d4ed8; }
.pp-dc-btn.bl:hover { background: #dbeafe; }
.pp-dc-btn.gr { background: #f0fdf4; color: #15803d; }
.pp-dc-btn.gr:hover { background: #dcfce7; }
.pp-dc-btn.dk { background: #f1f5f9; color: #475569; }
.pp-dc-btn.dk:hover { background: #e2e8f0; }

/* review */
.pp-rv { border-top: 1.5px solid #edf2fa; padding: 10px 16px; }
.pp-rv-btn { width:100%; padding:10px; border:1.5px solid #e2e8f0; border-radius:10px; background:#f8fafc; font-size:13px; font-weight:700; color:#334155; cursor:pointer; font-family:inherit; transition:all .18s; }
.pp-rv-btn:hover { border-color:#ff5a1f; color:#e8410a; background:#fff7ed; }
.pp-rv-ok { padding:10px; font-size:13px; font-weight:700; color:#16a34a; }

/* ═══════════ RIGHT COLUMN ═══════════ */
.pp-right { display: grid; gap: 14px; align-content: start; }

/* nav */
.pp-nav { background: #fff; border: 1px solid #e8edf6; border-radius: 16px; padding: 6px; }
.pp-ni {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-radius: 10px;
  font-size: 14px; font-weight: 600; color: #334155;
  text-decoration: none; background: none; border: none;
  cursor: pointer; font-family: inherit; width: 100%; transition: all .15s;
  letter-spacing: -.01em;
}
.pp-ni:hover { background: #f8faff; color: #0a0f1e; }
.pp-ni-arr { font-size: 16px; color: #cbd5e1; transition: transform .15s; }
.pp-ni:hover .pp-ni-arr { transform: translateX(3px); color: #94a3b8; }

/* profile card in right col */
.pp-pcard {
  background: linear-gradient(145deg,#06080f,#141d34);
  border-radius: 20px; padding: 22px; color: #fff;
  box-shadow: 0 4px 24px rgba(10,15,30,.18);
  overflow: hidden; position: relative;
}
.pp-pcard::before {
  content:''; position:absolute;
  width:240px; height:240px; right:-50px; top:-80px; border-radius:50%;
  background: conic-gradient(from 0deg,rgba(255,90,31,.25),rgba(147,51,234,.18),rgba(255,90,31,.25));
  filter: blur(40px); animation:pp-spin 20s linear infinite;
}
.pp-pcard-tag { font-size:10px; font-weight:800; letter-spacing:.1em; color:#ff8c5a; text-transform:uppercase; margin-bottom:8px; position:relative; }
.pp-pcard-q { font-size:15px; color:rgba(255,255,255,.78); line-height:1.6; margin-bottom:18px; position:relative; }
.pp-pcard-btn {
  display: inline-flex; align-items: center; gap: 6px; position: relative;
  background: linear-gradient(135deg,#ff5a1f,#e8410a);
  color: #fff; border-radius: 11px; padding: 11px 18px;
  font-size: 13px; font-weight: 800; text-decoration: none;
  box-shadow: 0 6px 20px rgba(232,65,10,.42); transition: all .18s;
}
.pp-pcard-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(232,65,10,.54); }

/* settings */
.pp-set { background: #fff; border: 1px solid #e8edf6; border-radius: 16px; padding: 16px 6px 6px; }
.pp-set-hd { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px; padding: 0 14px 10px; border-bottom: 1px solid #f1f5f9; }
.pp-si {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-radius: 10px;
  text-decoration: none; color: inherit; transition: background .15s; margin-bottom: 0;
  position: relative;
}
.pp-si:hover:not(.pp-dis) { background: #f8faff; }
.pp-dis { opacity: .38; cursor: default; }
.pp-si-left { display: flex; flex-direction: column; gap: 2px; }
.pp-si-t { font-size: 14px; font-weight: 600; color: #1e293b; letter-spacing: -.01em; }
.pp-si-d { font-size: 12px; color: #94a3b8; font-weight: 400; }
.pp-si-right { display: flex; align-items: center; gap: 8px; }
.pp-soon { font-size: 10px; font-weight: 700; background: #f0f4ff; color: #6366f1; border-radius: 6px; padding: 2px 8px; }
.pp-si-arr { font-size: 16px; color: #cbd5e1; transition: transform .15s; }
.pp-si:hover:not(.pp-dis) .pp-si-arr { transform: translateX(2px); color: #94a3b8; }

/* ═══════════ RESPONSIVE ═══════════ */
@media(max-width:980px){
  .pp-layout { grid-template-columns: 1fr; }
  .pp-right { grid-template-columns: 1fr 1fr; }
  .pp-acts { grid-template-columns: 1fr 1fr; }
  .pp-act.accent { grid-column: span 2; }
}
@media(max-width:640px){
  .pp-acts { grid-template-columns: 1fr; }
  .pp-act.accent { grid-column: span 1; }
  .pp-right { grid-template-columns: 1fr; }
  .pp-dc-photo { width: 86px; }
  .pp-dc-right { min-width: 136px; padding: 12px 14px; }
  .pp-hero-name { font-size: 28px; }
  .pp-ava { width: 80px; height: 80px; font-size: 32px; }
}
`;

export default function CustomerProfilePage() {
  const { userId, userName, userLastName, userRole, userAvatar, updateAvatar, updateLastName, logout } = useAuth();
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
      .then(([d, p]) => {
        setDeals(d || []);
        const prof = p || {};
        setProfile(prof);
        // Сразу обновляем контекст — имя/фамилия в шапке без ожидания «второго» источника
        if (prof.lastName != null) updateLastName(String(prof.lastName));
      })
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
        if (w > M) { h = h * M / w; w = M; } else if (h > M) { w = w * M / h; h = M; }
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

  const lastNameLive = profile?.lastName != null ? String(profile.lastName) : (userLastName || '');
  const initials = useMemo(() => {
    const first = (userName || 'З').trim().split(/\s+/)[0]?.[0] || 'З';
    const last = lastNameLive.trim()[0] || '';
    return (first + last).toUpperCase().slice(0, 2);
  }, [userName, lastNameLive]);
  const fullName = [userName, lastNameLive.trim()].filter(Boolean).join(' ') || 'Заказчик';
  const since     = fmtSince(profile?.registeredAt || profile?.createdAt);

  const activeDealsCount = useMemo(
    () => deals.filter(d => ['IN_PROGRESS', 'NEW'].includes(d.status)).length,
    [deals],
  );

  const tabCounts = useMemo(() => {
    const c = { ALL: deals.length, NEW: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    deals.forEach(d => { if (c[d.status] !== undefined) c[d.status]++; });
    return c;
  }, [deals]);

  const visible = tab === 'ALL' ? deals : deals.filter(d => d.status === tab);

  if (userRole === 'WORKER') return null;

  return (
    <div className="pp">
      <style>{css}</style>

      {/* ══════ HERO ══════ */}
      <div className="pp-hero">
        <div className="pp-hero-ring" />
        <div className="pp-hero-atm" />
        <div className="pp-hero-grid" />

        {/* Profile row */}
        <div className="pp-hero-inner">
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onAvatar} />

          <div className="pp-ava" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
            <div className="pp-ava-ov">{avatarLoading ? '⏳' : '📷'}</div>
          </div>

          <div className="pp-hero-txt">
            <div className="pp-hero-name">{fullName}</div>
            <div className="pp-hero-role">Личный кабинет заказчика</div>
            <div className="pp-hero-pills">
              <span className="pp-pill pp-pill-o">👤 Заказчик</span>
              <span className="pp-pill pp-pill-g">✓ Документы проверены</span>
              <span className="pp-pill pp-pill-w">📍 Йошкар-Ола</span>
              {since && <span className="pp-pill pp-pill-w">С {since}</span>}
            </div>
          </div>

          <div className="pp-hero-btns">
            <button className="pp-hbtn" onClick={() => fileRef.current?.click()}>
              {avatarLoading ? '⏳' : avatarUrl ? '📷 Сменить' : '📷 Добавить фото'}
            </button>
            <button className="pp-hbtn pp-hbtn-logout" onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* curved separator */}
      <div className="pp-hero-curve" />

      {/* ══════ CONTENT ══════ */}
      <div className="pp-wrap">
        <div className="pp-layout">

          {/* ── LEFT ── */}
          <div>
            {/* Quick actions */}
            <div className="pp-acts">
              <Link to="/categories" className="pp-act accent">
                <div className="pp-act-top">
                  <div className="pp-act-ico">🚀</div>
                  <span className="pp-act-arr">↗</span>
                </div>
                <div>
                  <div className="pp-act-title">Найти мастера</div>
                  <div className="pp-act-sub">Каталог специалистов по всем категориям</div>
                </div>
              </Link>
              <Link to="/deals" className="pp-act">
                <div className="pp-act-top">
                  <div className="pp-act-ico">🤝</div>
                  <span className="pp-act-arr" style={{color:'#cbd5e1'}}>↗</span>
                </div>
                <div>
                  <div className="pp-act-title">Мои сделки</div>
                  <div className="pp-act-sub" style={{color:'#64748b'}}>
                    Активных: <b style={{color:'#e8410a',fontWeight:900}}>{activeDealsCount}</b>
                  </div>
                </div>
              </Link>
              <Link to="/chat" className="pp-act">
                <div className="pp-act-top">
                  <div className="pp-act-ico">💬</div>
                  <span className="pp-act-arr" style={{color:'#cbd5e1'}}>↗</span>
                </div>
                <div>
                  <div className="pp-act-title">Сообщения</div>
                  <div className="pp-act-sub" style={{color:'#64748b'}}>Чат с мастерами</div>
                </div>
              </Link>
            </div>

            {/* Deals */}
            <div className="pp-deals">
              <div className="pp-tabs">
                {TABS.map(t => (
                  <button key={t.key} className={`pp-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                    {t.label}
                    {tabCounts[t.key] > 0 && <span className="pp-tab-n">{tabCounts[t.key]}</span>}
                  </button>
                ))}
                <Link to="/deals" className="pp-tab-link">Все →</Link>
              </div>

              <div className="pp-dl-body">
                {loading ? (
                  <div className="pp-empty">
                    <div className="pp-empty-ico">⏳</div>
                    <div className="pp-empty-text">Загружаем сделки...</div>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="pp-empty">
                    <div className="pp-empty-ico">{deals.length === 0 ? '🔍' : '🗂'}</div>
                    <div className="pp-empty-text">{deals.length === 0 ? 'Сделок пока нет' : 'В этой категории пусто'}</div>
                    <div className="pp-empty-sub">{deals.length === 0 ? 'Найдите первого мастера и начните работу' : 'Попробуйте другой фильтр'}</div>
                    {deals.length === 0 && (
                      <Link to="/categories" style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:18,background:'linear-gradient(135deg,#ff5a1f,#e8410a)',color:'#fff',textDecoration:'none',borderRadius:12,padding:'12px 22px',fontWeight:800,fontSize:14,boxShadow:'0 8px 24px rgba(232,65,10,.36)'}}>
                        🚀 Найти мастера
                      </Link>
                    )}
                  </div>
                ) : (
                  visible.map(deal => {
                    const s  = deal.status || 'IN_PROGRESS';
                    const si = ST[s] || ST.IN_PROGRESS;
                    const photoRaw = deal.photos?.[0] || null;
                    const avatarRaw = deal.workerAvatar || null;
                    const photoSrc = resolveUrl(photoRaw);
                    const avatarSrc = resolveUrl(avatarRaw);

                    return (
                      <div key={deal.id} style={{marginBottom:10,borderRadius:18,overflow:'hidden',border:'1.5px solid #e8eef8'}}>
                        <Link to={`/deals?dealId=${deal.id}`} className="pp-dc">
                          {/* left accent line */}
                          <div className="pp-dc-line" style={{background: si.accent}} />

                          {/* photo */}
                          <div className="pp-dc-photo">
                            {photoSrc ? (
                              <img src={photoSrc} alt="" />
                            ) : avatarSrc ? (
                              <div className="pp-dc-photo-ava"><img src={avatarSrc} alt="" /></div>
                            ) : (
                              <div className="pp-dc-photo-ph">{dealEmoji(deal.title)}</div>
                            )}
                          </div>

                          {/* body */}
                          <div className="pp-dc-body">
                            <div className="pp-dc-title">{deal.title || 'Сделка'}</div>
                            <div className="pp-dc-meta">
                              {deal.workerName && (
                                <span className="pp-dc-m">👤 <strong>{[deal.workerName, deal.workerLastName].filter(Boolean).join(' ')}</strong></span>
                              )}
                              {deal.createdAt && (
                                <span className="pp-dc-m">📅 {fmtCard(deal.createdAt)}</span>
                              )}
                              {deal.category && (
                                <span className="pp-dc-m">📂 {deal.category}</span>
                              )}
                            </div>
                            {deal.agreedPrice && (
                              <div className="pp-dc-price">{Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</div>
                            )}
                          </div>

                          {/* right */}
                          <div className="pp-dc-right">
                            <span className="pp-badge" style={{background: si.bg, color: si.fg}}>
                              <span className="pp-badge-dot" style={{background: si.accent}} />
                              {si.label}
                            </span>
                            <span className={`pp-dc-btn ${si.btnStyle}`}>{si.btn} →</span>
                          </div>
                        </Link>

                        {s === 'COMPLETED' && !deal.hasReview && (
                          <div className="pp-rv">
                            {reviewFor === deal.id
                              ? <ReviewForm dealId={deal.id} onSuccess={() => { setReviewFor(null); reloadDeals(); }} />
                              : <button className="pp-rv-btn" onClick={() => setReviewFor(deal.id)}>⭐ Оставить отзыв о мастере</button>
                            }
                          </div>
                        )}
                        {s === 'COMPLETED' && deal.hasReview && (
                          <div className="pp-rv"><div className="pp-rv-ok">✓ Отзыв уже отправлен</div></div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="pp-right">
            {/* Nav — clean text links, no icon boxes */}
            <div className="pp-nav">
              <nav>
                {[
                  { to:'/categories', lbl:'Найти мастера' },
                  { to:'/deals',      lbl:'Мои сделки' },
                  { to:'/chat',       lbl:'Сообщения' },
                ].map(n => (
                  <Link key={n.to} to={n.to} className="pp-ni">
                    {n.lbl}
                    <span className="pp-ni-arr">›</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Dark CTA card */}
            <div className="pp-pcard">
              <div className="pp-pcard-tag">Совет</div>
              <div className="pp-pcard-q">Оставляйте отзывы — мастерам это помогает расти, а вам легче выбирать проверенных специалистов.</div>
              <Link to="/categories" className="pp-pcard-btn">Найти мастера →</Link>
            </div>

            {/* Settings — no icon boxes, just clean rows */}
            <div className="pp-set">
              <div className="pp-set-hd">Настройки</div>
              {[
                { to:'/settings/personal',      t:'Личные данные', d:'Имя и контакты' },
                { to:'/settings/notifications', t:'Уведомления',   d:'Push и email' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="pp-si">
                  <div className="pp-si-left">
                    <div className="pp-si-t">{item.t}</div>
                    <div className="pp-si-d">{item.d}</div>
                  </div>
                  <div className="pp-si-right">
                    <span className="pp-si-arr">›</span>
                  </div>
                </Link>
              ))}
              <div className="pp-si pp-dis">
                <div className="pp-si-left">
                  <div className="pp-si-t">Дополнительные опции</div>
                  <div className="pp-si-d">Новые возможности</div>
                </div>
                <div className="pp-si-right">
                  <span className="pp-soon">Скоро</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
