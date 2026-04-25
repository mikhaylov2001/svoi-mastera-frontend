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
function fmtShort(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
}

const STATUS_ICO   = { NEW: '⏳', IN_PROGRESS: '⚡', COMPLETED: '✓', CANCELLED: '✕' };
const STATUS_LABEL = { NEW: 'Ожидает', IN_PROGRESS: 'В работе', COMPLETED: 'Готово', CANCELLED: 'Отменена' };

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.qp{font-family:Inter,-apple-system,sans-serif;color:#0a0f1e;background:#f0f2f7;min-height:100vh}
.qp *{box-sizing:border-box}

/* ─── HERO ─── */
.qp-hero{
  position:relative;overflow:hidden;
  background:#0a0f1e;
  padding:48px 0 80px;
}
.qp-hero-mesh{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse 70% 120% at 90% -20%, #ff5a1f66, transparent),
    radial-gradient(ellipse 50% 80% at -10% 110%, #7c3aed44, transparent),
    radial-gradient(ellipse 40% 60% at 50% 50%, #1e40af22, transparent);
}
.qp-hero-noise{
  position:absolute;inset:0;opacity:.04;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:200px;
}
.qp-hero-inner{
  position:relative;z-index:1;
  max-width:1140px;margin:0 auto;padding:0 20px;
  display:flex;align-items:center;gap:24px;flex-wrap:wrap;
}
.qp-ava{
  width:88px;height:88px;border-radius:24px;
  border:2px solid rgba(255,255,255,.15);
  overflow:hidden;background:linear-gradient(135deg,#ff5a1f,#ff8c00);
  display:flex;align-items:center;justify-content:center;
  font-size:34px;font-weight:900;color:#fff;
  cursor:pointer;position:relative;flex-shrink:0;
  transition:transform .2s;
}
.qp-ava:hover{transform:scale(1.04);}
.qp-ava img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.qp-ava-over{
  position:absolute;inset:0;background:rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;
  font-size:24px;opacity:0;transition:opacity .18s;border-radius:24px;
}
.qp-ava:hover .qp-ava-over{opacity:1;}

.qp-hero-info{flex:1;min-width:0;}
.qp-hero-name{
  font-size:clamp(24px,3vw,36px);font-weight:900;
  letter-spacing:-.04em;color:#fff;line-height:1.05;
}
.qp-hero-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
.qp-pill{
  display:inline-flex;align-items:center;gap:5px;
  border-radius:999px;font-size:12px;font-weight:700;
  padding:5px 12px;backdrop-filter:blur(12px);
  white-space:nowrap;
}
.qp-pill-o{background:rgba(255,90,31,.22);color:#ffa07a;border:1px solid rgba(255,90,31,.3);}
.qp-pill-g{background:rgba(34,197,94,.18);color:#4ade80;border:1px solid rgba(34,197,94,.25);}
.qp-pill-w{background:rgba(255,255,255,.1);color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.12);}

.qp-hero-acts{display:flex;gap:8px;align-self:flex-start;padding-top:8px;}
.qp-hbtn{
  display:inline-flex;align-items:center;gap:6px;
  border-radius:10px;font-size:13px;font-weight:700;font-family:inherit;
  padding:10px 16px;cursor:pointer;border:none;transition:all .18s;
  text-decoration:none;
}
.qp-hbtn-pri{
  background:linear-gradient(135deg,#ff5a1f,#e8410a);color:#fff;
  box-shadow:0 6px 20px rgba(232,65,10,.4);
}
.qp-hbtn-pri:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(232,65,10,.5);}
.qp-hbtn-sec{background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.15);}
.qp-hbtn-sec:hover{background:rgba(255,255,255,.16);}

/* ─── WRAP ─── */
.qp-wrap{max-width:1140px;margin:-44px auto 64px;padding:0 20px;position:relative;z-index:2;}

/* ─── BENTO GRID ─── */
.qp-bento{
  display:grid;
  grid-template-columns:repeat(12,1fr);
  gap:12px;
}

/* ─── BASE CARD ─── */
.qp-card{
  background:#fff;border:1px solid #e4e9f4;
  border-radius:20px;padding:22px;
  box-shadow:0 2px 12px rgba(10,15,30,.05);
  transition:box-shadow .2s,transform .2s;
}
.qp-card:hover{box-shadow:0 8px 28px rgba(10,15,30,.09);transform:translateY(-2px);}
.qp-card-label{font-size:11px;font-weight:800;letter-spacing:.08em;color:#94a3b8;text-transform:uppercase;margin-bottom:10px;}
.qp-card-num{font-size:48px;font-weight:900;letter-spacing:-.04em;line-height:1;}
.qp-card-sub{font-size:13px;color:#64748b;margin-top:4px;font-weight:500;}

/* ─── STAT CARDS ─── */
.qp-s1{grid-column:span 3;}
.qp-s2{grid-column:span 3;}
.qp-s3{grid-column:span 3;}
.qp-s4{grid-column:span 3;}

.qp-num-orange{color:#e8410a;}
.qp-num-blue  {color:#2563eb;}
.qp-num-green {color:#16a34a;}
.qp-num-gray  {color:#94a3b8;}

/* ─── ACTION CARDS ─── */
.qp-act-find{grid-column:span 5;}
.qp-act-deals{grid-column:span 4;}
.qp-act-msg{grid-column:span 3;}

.qp-action-card{
  display:flex;flex-direction:column;justify-content:space-between;
  text-decoration:none;color:inherit;
  min-height:160px;
}
.qp-action-card.a-accent{
  background:linear-gradient(150deg,#ff5a1f 0%,#c73000 100%);
  border:none;color:#fff;
}
.qp-action-card.a-accent:hover{box-shadow:0 14px 36px rgba(200,48,0,.4);transform:translateY(-3px);}
.qp-action-card.a-dark{background:#0a0f1e;border:none;color:#fff;}
.qp-action-card.a-dark:hover{box-shadow:0 14px 36px rgba(10,15,30,.3);transform:translateY(-3px);}

.qp-ac-top{display:flex;justify-content:space-between;align-items:flex-start;}
.qp-ac-ico{
  width:48px;height:48px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:24px;flex-shrink:0;
}
.qp-ac-ico-w{background:rgba(255,255,255,.18);}
.qp-ac-ico-o{background:rgba(255,90,31,.1);}
.qp-ac-arr{font-size:22px;opacity:.5;}

.qp-ac-title{font-size:20px;font-weight:900;letter-spacing:-.02em;margin-bottom:4px;}
.qp-ac-sub{font-size:13px;opacity:.7;line-height:1.4;}

/* ─── DEALS SECTION ─── */
.qp-deals-col{grid-column:span 8;}
.qp-right-col{grid-column:span 4;display:grid;gap:12px;align-content:start;}

.qp-deals-list{display:grid;gap:6px;margin-top:2px;}
.qp-dl{
  display:flex;align-items:center;gap:12px;
  padding:12px 14px;border-radius:14px;
  border:1px solid #edf2fa;background:#fafcff;
  text-decoration:none;color:inherit;
  transition:all .17s;
}
.qp-dl:hover{border-color:#dde7f8;background:#fff;box-shadow:0 4px 16px rgba(10,15,30,.06);}
.qp-dl-ico{
  width:42px;height:42px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;flex-shrink:0;font-weight:900;
}
.qp-dl-ico.sNEW        {background:#fff7ed;color:#c2410c;}
.qp-dl-ico.sIN_PROGRESS{background:#eff6ff;color:#1d4ed8;}
.qp-dl-ico.sCOMPLETED  {background:#f0fdf4;color:#16a34a;}
.qp-dl-ico.sCANCELLED  {background:#fef2f2;color:#dc2626;}
.qp-dl-body{flex:1;min-width:0;}
.qp-dl-title{font-size:14px;font-weight:800;color:#0a0f1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.qp-dl-meta{font-size:12px;color:#64748b;margin-top:3px;display:flex;gap:8px;flex-wrap:wrap;}
.qp-dl-badge{
  flex-shrink:0;font-size:11px;font-weight:800;
  border-radius:999px;padding:4px 10px;white-space:nowrap;
}
.qp-dl-badge.sNEW        {background:#fff7ed;color:#c2410c;}
.qp-dl-badge.sIN_PROGRESS{background:#eff6ff;color:#1d4ed8;}
.qp-dl-badge.sCOMPLETED  {background:#f0fdf4;color:#16a34a;}
.qp-dl-badge.sCANCELLED  {background:#fef2f2;color:#dc2626;}

.qp-review-wrap{padding:0 14px 12px;}
.qp-review-btn{
  width:100%;padding:10px;border:1px solid #e2e8f0;
  border-radius:10px;background:#f8fafc;font-size:13px;
  font-weight:700;color:#334155;cursor:pointer;font-family:inherit;
  transition:all .18s;
}
.qp-review-btn:hover{border-color:#ff5a1f;color:#e8410a;background:#fff7ed;}
.qp-review-ok{padding:10px 14px;background:#f0fdf4;border-radius:10px;font-size:13px;font-weight:700;color:#16a34a;text-align:center;}

.qp-empty{padding:48px 20px;text-align:center;color:#64748b;}
.qp-empty-ico{font-size:48px;margin-bottom:10px;}

/* ─── NAV CARD ─── */
.qp-nav-list{display:grid;gap:2px;}
.qp-nav-it{
  display:flex;align-items:center;gap:10px;
  padding:11px 12px;border-radius:12px;
  font-size:14px;font-weight:700;color:#334155;
  text-decoration:none;background:none;border:none;
  cursor:pointer;font-family:inherit;width:100%;
  transition:all .15s;
}
.qp-nav-it:hover{background:#f1f5f9;color:#0a0f1e;}
.qp-nav-it.qp-nav-act{background:#fff7ed;color:#c2410c;}
.qp-nav-ico{
  width:32px;height:32px;border-radius:9px;
  background:#f1f5f9;display:flex;align-items:center;
  justify-content:center;font-size:15px;flex-shrink:0;
}
.qp-nav-it.qp-nav-act .qp-nav-ico{background:#fed7aa;}

/* ─── TIP CARD ─── */
.qp-tip{
  border-radius:18px;overflow:hidden;
  background:linear-gradient(145deg,#0a0f1e,#1e293b);
  border:none;color:#fff;padding:22px;
}
.qp-tip:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(10,15,30,.25);}
.qp-tip-tag{font-size:11px;font-weight:800;letter-spacing:.1em;color:#ff8c5a;text-transform:uppercase;margin-bottom:8px;}
.qp-tip-text{font-size:14px;color:rgba(255,255,255,.75);line-height:1.6;margin-bottom:14px;}
.qp-tip-btn{
  display:inline-flex;align-items:center;gap:6px;
  background:linear-gradient(135deg,#ff5a1f,#e8410a);
  color:#fff;border-radius:10px;padding:10px 16px;
  font-size:13px;font-weight:800;text-decoration:none;
  box-shadow:0 6px 18px rgba(232,65,10,.35);
  transition:all .18s;
}
.qp-tip-btn:hover{transform:translateY(-1px);box-shadow:0 9px 22px rgba(232,65,10,.45);}

/* ─── SETTINGS ─── */
.qp-set-list{display:grid;gap:6px;}
.qp-set-it{
  display:flex;align-items:center;gap:12px;
  padding:12px;border-radius:12px;
  border:1px solid #f1f5f9;background:#fafcff;
  text-decoration:none;color:inherit;transition:all .18s;position:relative;
}
.qp-set-it:hover:not(.qp-set-dis){border-color:#e2e8f0;background:#fff;box-shadow:0 4px 12px rgba(10,15,30,.05);}
.qp-set-dis{opacity:.45;cursor:default;}
.qp-set-ico{width:38px;height:38px;border-radius:10px;background:#f1f5f9;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.qp-set-info{flex:1;min-width:0;}
.qp-set-t{font-size:14px;font-weight:800;color:#0a0f1e;}
.qp-set-d{font-size:12px;color:#64748b;margin-top:2px;}
.qp-set-arr{color:#cbd5e1;font-size:18px;}
.qp-soon{position:absolute;top:8px;right:8px;font-size:10px;font-weight:800;background:#eff6ff;color:#2563eb;border-radius:999px;padding:3px 8px;}

/* ─── RESPONSIVE ─── */
@media(max-width:1000px){
  .qp-s1,.qp-s2,.qp-s3,.qp-s4{grid-column:span 6;}
  .qp-act-find{grid-column:span 12;}
  .qp-act-deals,.qp-act-msg{grid-column:span 6;}
  .qp-deals-col,.qp-right-col{grid-column:span 12;}
}
@media(max-width:640px){
  .qp-s1,.qp-s2,.qp-s3,.qp-s4{grid-column:span 6;}
  .qp-act-find,.qp-act-deals,.qp-act-msg{grid-column:span 12;}
  .qp-hero{padding:32px 0 72px;}
  .qp-hero-acts{flex-wrap:wrap;}
}
`;

export default function CustomerProfilePage() {
  const { userId, userName, userRole, userAvatar, updateAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals]     = useState([]);
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
    <div className="qp">
      <style>{css}</style>

      {/* ── HERO ── */}
      <div className="qp-hero">
        <div className="qp-hero-mesh" />
        <div className="qp-hero-noise" />
        <div className="qp-hero-inner">
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatar} />
          <div className="qp-ava" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
            <div className="qp-ava-over">{avatarLoading ? '⏳' : '📷'}</div>
          </div>

          <div className="qp-hero-info">
            <div className="qp-hero-name">{fullName}</div>
            <div className="qp-hero-row">
              <span className="qp-pill qp-pill-o">👤 Заказчик</span>
              <span className="qp-pill qp-pill-g">✓ Документы проверены</span>
              <span className="qp-pill qp-pill-w">📍 Йошкар-Ола</span>
              {since && <span className="qp-pill qp-pill-w">На сервисе с {since}</span>}
            </div>
          </div>

          <div className="qp-hero-acts">
            <button className="qp-hbtn qp-hbtn-sec" onClick={() => fileRef.current?.click()}>
              {avatarLoading ? '⏳' : avatarUrl ? '📷 Сменить фото' : '📷 Добавить фото'}
            </button>
            <button className="qp-hbtn qp-hbtn-sec" onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* ── BENTO ── */}
      <div className="qp-wrap">
        <div className="qp-bento">

          {/* ─── STATS ─── */}
          {[
            { cls: 'qp-s1', numCls: 'qp-num-orange', num: stats.total,     lbl: 'Всего сделок',   desc: 'За всё время' },
            { cls: 'qp-s2', numCls: 'qp-num-blue',   num: stats.active,    lbl: 'Активных',       desc: 'Сейчас в работе' },
            { cls: 'qp-s3', numCls: 'qp-num-green',  num: stats.done,      lbl: 'Завершено',      desc: 'Успешно закрыто' },
            { cls: 'qp-s4', numCls: 'qp-num-gray',   num: stats.cancelled, lbl: 'Отменено',       desc: 'По разным причинам' },
          ].map(s => (
            <div key={s.cls} className={`qp-card ${s.cls}`}>
              <div className="qp-card-label">{s.lbl}</div>
              <div className={`qp-card-num ${s.numCls}`}>{s.num}</div>
              <div className="qp-card-sub">{s.desc}</div>
            </div>
          ))}

          {/* ─── QUICK ACTIONS ─── */}
          <Link to="/categories" className={`qp-card qp-action-card a-accent qp-act-find`}>
            <div className="qp-ac-top">
              <div className="qp-ac-ico qp-ac-ico-w">🚀</div>
              <span className="qp-ac-arr">↗</span>
            </div>
            <div>
              <div className="qp-ac-title">Найти мастера</div>
              <div className="qp-ac-sub">Каталог специалистов по категориям и районам</div>
            </div>
          </Link>

          <Link to="/deals" className={`qp-card qp-action-card qp-act-deals`}>
            <div className="qp-ac-top">
              <div className="qp-ac-ico qp-ac-ico-o">🤝</div>
              <span className="qp-ac-arr" style={{color:'#cbd5e1'}}>↗</span>
            </div>
            <div>
              <div className="qp-ac-title">Мои сделки</div>
              <div className="qp-ac-sub" style={{color:'#64748b'}}>Активных: <b style={{color:'#e8410a'}}>{stats.active}</b></div>
            </div>
          </Link>

          <Link to="/chat" className={`qp-card qp-action-card qp-act-msg`}>
            <div className="qp-ac-top">
              <div className="qp-ac-ico qp-ac-ico-o">💬</div>
              <span className="qp-ac-arr" style={{color:'#cbd5e1'}}>↗</span>
            </div>
            <div>
              <div className="qp-ac-title">Сообщения</div>
              <div className="qp-ac-sub" style={{color:'#64748b'}}>Чат с мастерами</div>
            </div>
          </Link>

          {/* ─── DEALS / SETTINGS ─── */}
          <div className={`qp-card qp-deals-col`} style={{padding:'22px 22px 16px'}}>
            {/* Tab switcher */}
            <div style={{display:'flex',gap:8,marginBottom:18}}>
              {[['deals','📋 Сделки'],['settings','⚙️ Настройки']].map(([k,l])=>(
                <button key={k} onClick={()=>setSection(k)} style={{
                  border:'none',borderRadius:10,padding:'8px 16px',
                  fontFamily:'inherit',fontSize:13,fontWeight:800,cursor:'pointer',
                  background: section===k ? '#0a0f1e' : '#f1f5f9',
                  color: section===k ? '#fff' : '#64748b',
                  transition:'all .18s',
                }}>{l}</button>
              ))}
              {section === 'deals' && (
                <Link to="/deals" style={{marginLeft:'auto',fontSize:13,fontWeight:700,color:'#e8410a',textDecoration:'none',display:'flex',alignItems:'center'}}>
                  Все →
                </Link>
              )}
            </div>

            {/* ── DEALS ── */}
            {section === 'deals' && (
              loading ? (
                <div className="qp-empty"><div className="qp-empty-ico">⏳</div>Загружаем...</div>
              ) : deals.length === 0 ? (
                <div className="qp-empty">
                  <div className="qp-empty-ico">🔍</div>
                  <div style={{marginBottom:16}}>Сделок пока нет — найдите первого мастера</div>
                  <Link to="/categories" style={{display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#ff5a1f,#e8410a)',color:'#fff',textDecoration:'none',borderRadius:10,padding:'10px 18px',fontWeight:800,fontSize:13,boxShadow:'0 6px 18px rgba(232,65,10,.35)'}}>
                    🚀 Найти мастера
                  </Link>
                </div>
              ) : (
                <div className="qp-deals-list">
                  {deals.slice(0, 12).map(deal => {
                    const s = deal.status || 'IN_PROGRESS';
                    return (
                      <div key={deal.id} style={{borderRadius:14,overflow:'hidden',border:'1px solid #edf2fa'}}>
                        <Link to={`/deals?dealId=${deal.id}`} className="qp-dl">
                          <div className={`qp-dl-ico s${s}`}>{STATUS_ICO[s]}</div>
                          <div className="qp-dl-body">
                            <div className="qp-dl-title">{deal.title || 'Сделка'}</div>
                            <div className="qp-dl-meta">
                              {deal.workerName && <span>👤 {deal.workerName}</span>}
                              {deal.agreedPrice && <span>💰 {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</span>}
                              {deal.createdAt && <span>{fmtShort(deal.createdAt)}</span>}
                            </div>
                          </div>
                          <span className={`qp-dl-badge s${s}`}>{STATUS_LABEL[s]}</span>
                        </Link>

                        {s === 'COMPLETED' && !deal.hasReview && (
                          <div className="qp-review-wrap">
                            {reviewFor === deal.id
                              ? <ReviewForm dealId={deal.id} onSuccess={() => { setReviewFor(null); reloadDeals(); }} />
                              : <button className="qp-review-btn" onClick={() => setReviewFor(deal.id)}>⭐ Оставить отзыв</button>
                            }
                          </div>
                        )}
                        {s === 'COMPLETED' && deal.hasReview && (
                          <div className="qp-review-wrap"><div className="qp-review-ok">✓ Отзыв отправлен</div></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── SETTINGS ── */}
            {section === 'settings' && (
              <div className="qp-set-list">
                {[
                  { to:'/settings/personal',      ico:'👤', t:'Личные данные',    d:'Имя, контакты, информация' },
                  { to:'/settings/notifications',  ico:'🔔', t:'Уведомления',      d:'Push и email по сделкам' },
                ].map(item => (
                  <Link key={item.to} to={item.to} className="qp-set-it">
                    <div className="qp-set-ico">{item.ico}</div>
                    <div className="qp-set-info"><div className="qp-set-t">{item.t}</div><div className="qp-set-d">{item.d}</div></div>
                    <div className="qp-set-arr">›</div>
                  </Link>
                ))}
                <div className="qp-set-it qp-set-dis">
                  <div className="qp-soon">СКОРО</div>
                  <div className="qp-set-ico">🧩</div>
                  <div className="qp-set-info"><div className="qp-set-t">Дополнительные опции</div><div className="qp-set-d">Новые возможности — скоро</div></div>
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="qp-right-col">
            {/* Navigation */}
            <div className="qp-card" style={{padding:'14px'}}>
              <nav className="qp-nav-list">
                {[
                  { key:'deals',    ico:'📋', lbl:'Мои сделки',    action: ()=>setSection('deals') },
                  { key:'settings', ico:'⚙️', lbl:'Настройки',     action: ()=>setSection('settings') },
                ].map(n => (
                  <button key={n.key} type="button"
                    className={`qp-nav-it${section===n.key ? ' qp-nav-act':''}`}
                    onClick={n.action}>
                    <div className="qp-nav-ico">{n.ico}</div>{n.lbl}
                  </button>
                ))}
                {[
                  { to:'/categories', ico:'🔍', lbl:'Найти мастера' },
                  { to:'/chat',       ico:'💬', lbl:'Сообщения' },
                  { to:'/deals',      ico:'🤝', lbl:'Все сделки' },
                ].map(n => (
                  <Link key={n.to} to={n.to} className="qp-nav-it">
                    <div className="qp-nav-ico">{n.ico}</div>{n.lbl}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Tip card */}
            <div className="qp-card qp-tip" style={{border:'none'}}>
              <div className="qp-tip-tag">Совет дня</div>
              <div className="qp-tip-text">
                Оставляйте отзывы — мастера растут, а вам проще находить проверенных специалистов.
              </div>
              <Link to="/categories" className="qp-tip-btn">🚀 Найти мастера</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
