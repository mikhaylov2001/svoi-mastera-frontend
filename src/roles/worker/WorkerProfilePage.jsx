import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, getListingsByWorker, getReviewsByWorker, uploadAvatar, getUserProfile } from '../../api';
import ReviewForm from '../../components/ReviewForm';
import '../../styles/profileDashboard.css';

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

/** Подписи с точки зрения мастера */
const ST = {
  NEW:         { label: 'Ждут вашего подтверждения', bg:'#fff7ed', fg:'#c2410c', accent:'#fb923c', btn:'Открыть', btnStyle:'or' },
  IN_PROGRESS: { label: 'В работе',                  bg:'#eff6ff', fg:'#1d4ed8', accent:'#3b82f6', btn:'Открыть', btnStyle:'bl' },
  COMPLETED:   { label: 'Завершена',                 bg:'#f0fdf4', fg:'#15803d', accent:'#22c55e', btn:'Детали', btnStyle:'gr' },
  CANCELLED:   { label: 'Отменена',                  bg:'#fff1f2', fg:'#be123c', accent:'#f43f5e', btn:'Детали', btnStyle:'dk' },
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

export default function WorkerProfilePage() {
  const { userId, userName, userLastName, userRole, userAvatar, updateAvatar, updateLastName, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [reviewFor, setReviewFor] = useState(null);

  const avatarUrl = resolveUrl(userAvatar);

  useEffect(() => {
    if (userRole === 'CUSTOMER') navigate('/profile', { replace: true });
  }, [userRole, navigate]);

  useEffect(() => {
    if (!userId || userRole === 'CUSTOMER') return;
    setLoading(true);
    Promise.all([
      getMyDeals(userId),
      getListingsByWorker(userId).catch(() => []),
      getReviewsByWorker(userId),
      getUserProfile(userId),
    ])
      .then(([d, lst, r, p]) => {
        const uid = String(userId || '');
        setDeals((d || []).filter(x => String(x.workerId || '') === uid));
        setListings(Array.isArray(lst) ? lst : []);
      setReviews((r || []).filter(x => x.status === 'APPROVED'));
        const prof = p || {};
        setProfile(prof);
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
    try {
      const uid = String(userId || '');
      const [d, lst] = await Promise.all([
        getMyDeals(userId),
        getListingsByWorker(userId).catch(() => []),
      ]);
      setDeals((d || []).filter(x => String(x.workerId || '') === uid));
      setListings(Array.isArray(lst) ? lst : []);
    } catch {}
  };

  const lastNameLive = profile?.lastName != null ? String(profile.lastName) : (userLastName || '');
  const initials = useMemo(() => {
    const first = (userName || 'М').trim().split(/\s+/)[0]?.[0] || 'М';
    const last = lastNameLive.trim()[0] || '';
    return (first + last).toUpperCase().slice(0, 2);
  }, [userName, lastNameLive]);
  const fullName = [userName, lastNameLive.trim()].filter(Boolean).join(' ') || 'Мастер';
  const since = fmtSince(profile?.registeredAt || profile?.createdAt);
  const cityLabel = (profile?.city || '').trim();

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, x) => s + (x.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const activeDealsCount = useMemo(
    () => deals.filter(d => ['IN_PROGRESS', 'NEW'].includes(d.status)).length,
    [deals],
  );
  const activeListings = useMemo(() => listings.filter(l => l.active), [listings]);

  /** Одна лента «Все»: активные объявления + все сделки (включая NEW) */
  const mergedAllTab = useMemo(() => {
    const rows = [];
    activeListings.forEach(l => {
      rows.push({ kind: 'listing', sort: new Date(l.createdAt || 0).getTime(), listing: l });
    });
    deals.forEach(d => {
      rows.push({ kind: 'deal', sort: new Date(d.createdAt || 0).getTime(), deal: d });
    });
    rows.sort((a, b) => b.sort - a.sort);
    return rows;
  }, [activeListings, deals]);

  const tabCounts = useMemo(() => {
    const c = {
      ALL: mergedAllTab.length,
      NEW: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    deals.forEach(d => {
      const s = d.status;
      if (s === 'NEW') c.NEW++;
      else if (s === 'IN_PROGRESS') c.IN_PROGRESS++;
      else if (s === 'COMPLETED') c.COMPLETED++;
      else if (s === 'CANCELLED') c.CANCELLED++;
    });
    return c;
  }, [deals, mergedAllTab.length]);

  const visibleDeals = useMemo(() => {
    if (tab === 'ALL') return [];
    return deals.filter(d => d.status === tab);
  }, [deals, tab]);

  const DEAL_TABS = [
    { key: 'ALL', label: 'Все' },
    { key: 'NEW', label: 'Ждут подтверждения' },
    { key: 'IN_PROGRESS', label: 'В работе' },
    { key: 'COMPLETED', label: 'Завершены' },
    { key: 'CANCELLED', label: 'Отменены' },
  ];

  if (userRole === 'CUSTOMER') return null;

  return (
    <div className="pp">
      <div className="pp-hero">
        <div className="pp-hero-ring" />
        <div className="pp-hero-atm" />
        <div className="pp-hero-grid" />

        <div className="pp-hero-inner">
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatar} />

          <div className="pp-ava" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
            <div className="pp-ava-ov">{avatarLoading ? '⏳' : '📷'}</div>
              </div>

          <div className="pp-hero-txt">
            <div className="pp-hero-name">{fullName}</div>
            <div className="pp-hero-role">Личный кабинет мастера</div>
            <div className="pp-hero-pills">
              <span className="pp-pill pp-pill-o">🔧 Мастер</span>
              <span className="pp-pill pp-pill-g">✓ Документы проверены</span>
              {cityLabel && <span className="pp-pill pp-pill-w">📍 {cityLabel}</span>}
              {since && <span className="pp-pill pp-pill-w">С {since}</span>}
              {avgRating != null && (
                <span className="pp-pill pp-pill-w">⭐ {avgRating} · {reviews.length} отзыв.</span>
              )}
            </div>
          </div>

          <div className="pp-hero-btns">
            <button type="button" className="pp-hbtn" onClick={() => fileRef.current?.click()}>
              {avatarLoading ? '⏳' : avatarUrl ? '📷 Сменить' : '📷 Добавить фото'}
            </button>
            <button type="button" className="pp-hbtn pp-hbtn-logout" onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="pp-hero-curve" />

      <div className="pp-wrap">
        <div className="pp-layout">

          <div>
            <div className="pp-acts">
              <Link to="/find-work" className="pp-act accent">
                <div className="pp-act-top">
                  <div className="pp-act-ico">🔍</div>
                  <span className="pp-act-arr">↗</span>
                </div>
                <div>
                  <div className="pp-act-title">Найти работу</div>
                  <div className="pp-act-sub">Заявки и объявления заказчиков</div>
                </div>
              </Link>
              <Link to="/deals" className="pp-act">
                <div className="pp-act-top">
                  <div className="pp-act-ico">🤝</div>
                  <span className="pp-act-arr" style={{ color: '#cbd5e1' }}>↗</span>
                </div>
                <div>
                  <div className="pp-act-title">Мои сделки</div>
                  <div className="pp-act-sub" style={{ color: '#64748b' }}>
                    Заказов (активн.): <b style={{ color: '#e8410a', fontWeight: 900 }}>{activeDealsCount}</b>
                    {activeListings.length > 0 && (
                      <>
                        {' · '}
                        Объявл.: <b style={{ color: '#7c3aed', fontWeight: 900 }}>{activeListings.length}</b>
                      </>
                    )}
                  </div>
                </div>
              </Link>
              <Link to="/chat" className="pp-act">
                <div className="pp-act-top">
                  <div className="pp-act-ico">💬</div>
                  <span className="pp-act-arr" style={{ color: '#cbd5e1' }}>↗</span>
                </div>
                <div>
                  <div className="pp-act-title">Сообщения</div>
                  <div className="pp-act-sub" style={{ color: '#64748b' }}>Чат с заказчиками</div>
                </div>
              </Link>
            </div>

            <div className="pp-deals">
              <div className="pp-tabs">
                {DEAL_TABS.map(t => (
                  <button key={t.key} type="button" className={`pp-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
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
                ) : tab === 'ALL' ? (
                  mergedAllTab.length === 0 ? (
                    <div className="pp-empty">
                      <div className="pp-empty-ico">🔍</div>
                      <div className="pp-empty-text">Пока пусто</div>
                      <div className="pp-empty-sub">Разместите объявление или откликнитесь на заявку</div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
                        <Link
                          to="/my-listings"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#fff', color: '#7c3aed', textDecoration: 'none',
                            borderRadius: 12, padding: '12px 20px', fontWeight: 800, fontSize: 14,
                            border: '2px solid rgba(124,58,237,.35)',
                          }}
                        >
                          📢 Объявление
                        </Link>
                        <Link
                          to="/find-work"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'linear-gradient(135deg,#ff5a1f,#e8410a)', color: '#fff', textDecoration: 'none',
                            borderRadius: 12, padding: '12px 22px', fontWeight: 800, fontSize: 14,
                            boxShadow: '0 8px 24px rgba(232,65,10,.36)',
                          }}
                        >
                          🔍 Найти работу
                        </Link>
                      </div>
                  </div>
                ) : (
                    mergedAllTab.map(row => {
                      if (row.kind === 'listing') {
                        const l = row.listing;
                        const photoSrc = resolveUrl(l.photos?.[0] || null);
                        return (
                          <Link
                            key={`feed-listing-${l.id}`}
                            to={`/listings/${l.id}`}
                            className="pp-dc"
                            style={{ marginBottom: 10, border: '1.5px solid #e8eef8' }}
                          >
                            <div className="pp-dc-line" style={{ background: '#7c3aed' }} />
                            <div className="pp-dc-photo" style={{ width: 112 }}>
                              {photoSrc ? <img src={photoSrc} alt="" /> : <div className="pp-dc-photo-ph">📢</div>}
                            </div>
                            <div className="pp-dc-body">
                              <div className="pp-dc-title" style={{ fontSize: 16 }}>{l.title}</div>
                              <div className="pp-dc-meta">
                                <span className="pp-dc-m" style={{ color: '#5b21b6', fontWeight: 700 }}>📢 Объявление в каталоге</span>
                                {l.category && <span className="pp-dc-m">📂 <strong>{l.category}</strong></span>}
                                {l.createdAt && <span className="pp-dc-m">📅 {fmtCard(l.createdAt)}</span>}
                              </div>
                              {l.price != null && (
                                <div className="pp-dc-price" style={{ fontSize: 18 }}>
                                  {Number(l.price).toLocaleString('ru-RU')} ₽
                                  {l.priceUnit ? ` ${l.priceUnit}` : ''}
                                </div>
                              )}
                            </div>
                            <div className="pp-dc-right" style={{ justifyContent: 'center' }}>
                              <span className="pp-badge" style={{ background: '#f5f3ff', color: '#5b21b6', fontSize: 12 }}>
                                <span className="pp-badge-dot" style={{ background: '#7c3aed' }} />
                                Активно
                              </span>
                            </div>
                          </Link>
                        );
                      }

                      const deal = row.deal;
                      const s = deal.status || 'IN_PROGRESS';
                      const si = ST[s] || ST.IN_PROGRESS;
                      const photoRaw = deal.photos?.[0] || null;
                      const avatarRaw = deal.customerAvatar || null;
                      const photoSrc = resolveUrl(photoRaw);
                      const avatarSrc = resolveUrl(avatarRaw);
                      const custName = [deal.customerName, deal.customerLastName].filter(Boolean).join(' ');

                      return (
                        <div key={deal.id} style={{ marginBottom: 10, borderRadius: 18, overflow: 'hidden', border: '1.5px solid #e8eef8' }}>
                          <Link to={`/deals?dealId=${deal.id}`} className="pp-dc">
                            <div className="pp-dc-line" style={{ background: si.accent }} />
                            <div className="pp-dc-photo">
                              {photoSrc ? (
                                <img src={photoSrc} alt="" />
                              ) : avatarSrc ? (
                                <div className="pp-dc-photo-ava"><img src={avatarSrc} alt="" /></div>
                              ) : (
                                <div className="pp-dc-photo-ph">{dealEmoji(deal.title)}</div>
                              )}
                            </div>
                            <div className="pp-dc-body">
                              <div className="pp-dc-title">{deal.title || 'Сделка'}</div>
                              <div className="pp-dc-meta">
                                {custName && <span className="pp-dc-m">👤 <strong>{custName}</strong></span>}
                                {deal.createdAt && <span className="pp-dc-m">📅 {fmtCard(deal.createdAt)}</span>}
                                {deal.category && <span className="pp-dc-m">📂 {deal.category}</span>}
                              </div>
                              {deal.agreedPrice && (
                                <div className="pp-dc-price">{Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</div>
                              )}
                            </div>
                            <div className="pp-dc-right">
                              <span className="pp-badge" style={{ background: si.bg, color: si.fg }}>
                                <span className="pp-badge-dot" style={{ background: si.accent }} />
                                {si.label}
                              </span>
                              <span className={`pp-dc-btn ${si.btnStyle}`}>{si.btn} →</span>
                            </div>
                          </Link>
                          {s === 'COMPLETED' && !deal.hasWorkerReview && (
                            <div className="pp-rv">
                              {reviewFor === deal.id ? (
                                <ReviewForm
                                  forWorker
                                  dealId={deal.id}
                                  onSuccess={() => { setReviewFor(null); reloadDeals(); }}
                                />
                              ) : (
                                <button type="button" className="pp-rv-btn" onClick={() => setReviewFor(deal.id)}>
                                  ⭐ Оставить отзыв о заказчике
                                </button>
                              )}
                            </div>
                          )}
                          {s === 'COMPLETED' && deal.hasWorkerReview && (
                            <div className="pp-rv"><div className="pp-rv-ok">✓ Отзыв о заказчике отправлен</div></div>
                          )}
                        </div>
                      );
                    })
                  )
                ) : visibleDeals.length === 0 ? (
                  <div className="pp-empty">
                    <div className="pp-empty-ico">🗂</div>
                    <div className="pp-empty-text">В этой категории пусто</div>
                    <div className="pp-empty-sub">Попробуйте вкладку «Все»</div>
                  </div>
                ) : (
                  visibleDeals.map(deal => {
                    const s = deal.status || 'IN_PROGRESS';
                    const si = ST[s] || ST.IN_PROGRESS;
                    const photoRaw = deal.photos?.[0] || null;
                    const avatarRaw = deal.customerAvatar || null;
                    const photoSrc = resolveUrl(photoRaw);
                    const avatarSrc = resolveUrl(avatarRaw);
                    const custName = [deal.customerName, deal.customerLastName].filter(Boolean).join(' ');

                    return (
                      <div key={deal.id} style={{ marginBottom: 10, borderRadius: 18, overflow: 'hidden', border: '1.5px solid #e8eef8' }}>
                        <Link to={`/deals?dealId=${deal.id}`} className="pp-dc">
                          <div className="pp-dc-line" style={{ background: si.accent }} />

                          <div className="pp-dc-photo">
                            {photoSrc ? (
                              <img src={photoSrc} alt="" />
                            ) : avatarSrc ? (
                              <div className="pp-dc-photo-ava"><img src={avatarSrc} alt="" /></div>
                            ) : (
                              <div className="pp-dc-photo-ph">{dealEmoji(deal.title)}</div>
                            )}
                          </div>

                          <div className="pp-dc-body">
                            <div className="pp-dc-title">{deal.title || 'Сделка'}</div>
                            <div className="pp-dc-meta">
                              {custName && (
                                <span className="pp-dc-m">👤 <strong>{custName}</strong></span>
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

                          <div className="pp-dc-right">
                            <span className="pp-badge" style={{ background: si.bg, color: si.fg }}>
                              <span className="pp-badge-dot" style={{ background: si.accent }} />
                              {si.label}
                            </span>
                            <span className={`pp-dc-btn ${si.btnStyle}`}>{si.btn} →</span>
                          </div>
                        </Link>

                        {s === 'COMPLETED' && !deal.hasWorkerReview && (
                          <div className="pp-rv">
                            {reviewFor === deal.id ? (
                              <ReviewForm
                                forWorker
                                dealId={deal.id}
                                onSuccess={() => { setReviewFor(null); reloadDeals(); }}
                              />
                            ) : (
                              <button type="button" className="pp-rv-btn" onClick={() => setReviewFor(deal.id)}>
                                ⭐ Оставить отзыв о заказчике
                              </button>
                            )}
                          </div>
                        )}
                        {s === 'COMPLETED' && deal.hasWorkerReview && (
                          <div className="pp-rv"><div className="pp-rv-ok">✓ Отзыв о заказчике отправлен</div></div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
                    </div>

          <div className="pp-right">
            <div className="pp-nav">
              <nav>
                {[
                  { to: '/find-work', lbl: 'Найти работу' },
                  { to: '/my-listings', lbl: 'Мои объявления' },
                  { to: '/deals', lbl: 'Мои сделки' },
                  { to: '/chat', lbl: 'Сообщения' },
                ].map(n => (
                  <Link key={n.to} to={n.to} className="pp-ni">
                    {n.lbl}
                    <span className="pp-ni-arr">›</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pp-pcard">
              <div className="pp-pcard-tag">Совет</div>
              <div className="pp-pcard-q">
                Быстро отвечайте на заявки и держите клиента в курсе в «Сообщениях» — так выше шанс взять заказ и получить хороший отзыв.
              </div>
              <Link to="/find-work" className="pp-pcard-btn">Найти работу →</Link>
                    </div>

            <div className="pp-set">
              <div className="pp-set-hd">Настройки</div>
              {[
                { to: '/settings/personal', t: 'Личные данные', d: 'Имя и контакты' },
                { to: '/settings/notifications', t: 'Уведомления', d: 'Push и email' },
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
                  <div className="pp-si-t">Подписка для объявлений</div>
                  <div className="pp-si-d">Появится позже</div>
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
