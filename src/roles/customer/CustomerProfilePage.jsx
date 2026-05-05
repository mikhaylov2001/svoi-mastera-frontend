import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, uploadAvatar, getUserProfile, getReviewsByCustomer } from '../../api';
import ReviewForm from '../../components/ReviewForm';
import DashboardReviewsSection from '../../components/DashboardReviewsSection';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import '../../styles/profileDashboard.css';
import { categoryChipToneClass } from '../../utils/categoryChipTone';
import { formatMemberSinceRu } from '../../utils/memberSinceRu';

const BACKEND = 'https://svoi-mastera-backend-mf3h.onrender.com';

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  return BACKEND + url;
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

export default function CustomerProfilePage() {
  const { userId, userName, userLastName, userRole, userAvatar, updateAvatar, updateLastName, logout } = useAuth();
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals]     = useState([]);
  const [reviews, setReviews] = useState([]);
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
    Promise.all([getMyDeals(userId), getUserProfile(userId), getReviewsByCustomer(userId)])
      .then(([d, p, rev]) => {
      setDeals(d || []);
        setReviews(Array.isArray(rev) ? rev : []);
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
  const since     = formatMemberSinceRu(profile?.registeredAt || profile?.createdAt);

  const avgRatingDisplay = reviews.length > 0
    ? (reviews.reduce((s, x) => s + (x.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const reviewsCountLabel = (() => {
    const n = reviews.length;
    if (n === 0) return '0 отзывов';
    if (n === 1) return '1 отзыв';
    if (n >= 2 && n <= 4) return `${n} отзыва`;
    return `${n} отзывов`;
  })();
  const scrollToDashboardReviews = () => {
    document.getElementById('dash-reviews-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
            <div className="pp-ava-ov">{avatarLoading ? 'Загрузка…' : 'Изменить фото'}</div>
          </div>

          <div className="pp-hero-txt">
            <div className="pp-hero-name">{fullName}</div>
            <div className="pp-hero-role">Личный кабинет заказчика</div>
            <div className="pp-hero-meta">
              <div className="pp-hero-meta-badges">
                <span className="pp-hero-badge pp-hero-badge--role">Заказчик</span>
                {profile?.verified && (
                  <span className="pp-hero-badge pp-hero-badge--ok">Проверенный профиль</span>
                )}
                {profile && !profile.verified && profile.verificationStatus === 'PENDING' && (
                  <span className="pp-hero-badge pp-hero-badge--pending">Документы на проверке</span>
                )}
                {profile && !profile.verified && profile.verificationStatus === 'REJECTED' && (
                  <span className="pp-hero-badge pp-hero-badge--bad">Верификация отклонена</span>
                )}
              </div>
              <div className="pp-hero-meta-row">
                <span className="pp-hero-meta-text">Йошкар-Ола</span>
                {since && (
                  <>
                    <span className="pp-hero-meta-sep" aria-hidden>·</span>
                    <span className="pp-hero-meta-text">С {since}</span>
                  </>
                )}
                <span className="pp-hero-meta-sep" aria-hidden>·</span>
                <button type="button" className="pp-hero-meta-rating" onClick={scrollToDashboardReviews}>
                  Рейтинг {avgRatingDisplay} · {reviewsCountLabel}
                </button>
              </div>
            </div>
          </div>

          <div className="pp-hero-btns">
            <button className="pp-hbtn" onClick={() => fileRef.current?.click()}>
              {avatarLoading ? 'Загрузка…' : avatarUrl ? 'Изменить фото' : 'Добавить фото'}
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
                <div className="pp-act-head">
                  <div className="pp-act-title">Найти мастера</div>
                  <span className="pp-act-chevron" aria-hidden>›</span>
                </div>
                <div className="pp-act-sub">Каталог исполнителей по услугам и отзывам</div>
              </Link>
              <Link to="/deals" className="pp-act">
                <div className="pp-act-head">
                  <div className="pp-act-title">Мои сделки</div>
                  <span className="pp-act-chevron" aria-hidden>›</span>
                </div>
                <div className="pp-act-sub" style={{ color: '#64748b' }}>
                  Активных сделок: <b style={{ color: '#e8410a', fontWeight: 900 }}>{activeDealsCount}</b>
                </div>
              </Link>
              <Link to="/chat" className="pp-act">
                <div className="pp-act-head">
                  <div className="pp-act-title">Сообщения</div>
                  <span className="pp-act-chevron" aria-hidden>›</span>
                </div>
                <div className="pp-act-sub" style={{ color: '#64748b' }}>Диалоги с мастерами по текущим заказам</div>
              </Link>
            </div>

            <DashboardReviewsSection reviews={reviews} aboutTarget="customer" />

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
                    <div className="pp-empty-visual" aria-hidden />
                    <div className="pp-empty-text">Загружаем сделки…</div>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="pp-empty">
                    <div className="pp-empty-visual" aria-hidden />
                    <div className="pp-empty-text">{deals.length === 0 ? 'Сделок пока нет' : 'В этой категории пусто'}</div>
                    <div className="pp-empty-sub">{deals.length === 0 ? 'Выберите мастера в каталоге и начните совместную сделку' : 'Попробуйте другой фильтр или вкладку «Все»'}</div>
                    {deals.length === 0 && (
                      <Link to="/categories" style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:18,background:'linear-gradient(135deg,#ff5a1f,#e8410a)',color:'#fff',textDecoration:'none',borderRadius:12,padding:'12px 22px',fontWeight:800,fontSize:14,boxShadow:'0 8px 24px rgba(232,65,10,.36)'}}>
                        Перейти в каталог
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
                                <span className={`ml-row-cat ${categoryChipToneClass(deal.category)}`}>{deal.category}</span>
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

                        {s === 'COMPLETED' && dealEligibleForReviews(deal) && !deal.hasReview && (
                          <div className="pp-rv">
                            {reviewFor === deal.id
                              ? <ReviewForm dealId={deal.id} onSuccess={() => { setReviewFor(null); reloadDeals(); }} />
                              : <button className="pp-rv-btn" onClick={() => setReviewFor(deal.id)}>Оставить отзыв о мастере</button>
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
              {profile?.verified ? (
                <div className="pp-si pp-si-verified" role="status" aria-label="Верификация пройдена">
                  <div className="pp-si-left">
                    <div className="pp-si-t">Верификация</div>
                    <div className="pp-si-d">Профиль проверен — раздел проходить снова не нужно</div>
                  </div>
                  <div className="pp-si-right">
                    <span className="pp-si-badge">
                      <span className="pp-si-badge-mark" aria-hidden>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.75 6.1 5.35 8.7 9.45 3.15"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      Готово
                    </span>
                  </div>
                </div>
              ) : (
                <Link to="/verification" className="pp-si">
                  <div className="pp-si-left">
                    <div className="pp-si-t">Верификация</div>
                    <div className="pp-si-d">Тест и правила платформы</div>
                  </div>
                  <div className="pp-si-right">
                    <span className="pp-si-arr">›</span>
                  </div>
                </Link>
              )}
              {profile?.verified ? (
                profile?.guaranteeTermsAccepted ? (
                  <div className="pp-si pp-si-verified" role="status" aria-label="Условия гарантии приняты">
                    <div className="pp-si-left">
                      <div className="pp-si-t">Гарантия и ответственность</div>
                      <div className="pp-si-d">Заявление о гарантии и ответственности принято</div>
                    </div>
                    <div className="pp-si-right">
                      <span className="pp-si-badge">
                        <span className="pp-si-badge-mark" aria-hidden>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2.75 6.1 5.35 8.7 9.45 3.15"
                              stroke="currentColor"
                              strokeWidth="1.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        Принято
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link to="/guarantee" className="pp-si">
                    <div className="pp-si-left">
                      <div className="pp-si-t">Гарантия и ответственность</div>
                      <div className="pp-si-d">Прочитайте заявление и отметьте согласие (галочки)</div>
                    </div>
                    <div className="pp-si-right">
                      <span className="pp-si-arr">›</span>
                    </div>
                  </Link>
                )
              ) : (
                <div className="pp-si pp-dis" aria-disabled="true">
                  <div className="pp-si-left">
                    <div className="pp-si-t">Гарантия и ответственность</div>
                    <div className="pp-si-d">Личная гарантия и ответственность — после верификации</div>
                  </div>
                </div>
              )}
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
