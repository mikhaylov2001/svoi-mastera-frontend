import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCamera, FaSignOutAlt, FaImage, FaMapMarkerAlt, FaShieldAlt, FaClock,
  FaExclamationCircle, FaStar, FaCheckCircle, FaInbox, FaUser, FaBell, FaCommentDots,
  FaIdCard, FaChevronRight, FaCalendarAlt, FaBriefcase, FaListAlt, FaFileAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, getListingsByWorker, getReviewsByWorker, uploadAvatar, getUserProfile } from '../../api';
import { formatMemberSinceRu } from '../../utils/memberSinceRu';
import { PAGE_HERO_DEFAULT_PHOTO } from '../../constants/pageHeroAssets';
import '../../styles/modernProfile.css';

const BACKEND = 'https://svoi-mastera-backend-mf3h.onrender.com';
const resolveUrl = (u) => !u ? null : (u.startsWith('data:') || u.startsWith('http') ? u : BACKEND + u);
const fmtCard = (d) => !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const pick = (...values) => values.find((v) => typeof v === 'string' && v.trim()) || '';

const STATUS = {
  NEW: { label: 'Ждут подтверждения', cls: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  IN_PROGRESS: { label: 'В работе', cls: 'bg-blue-100 text-blue-700', dot: '#3b82f6' },
  COMPLETED: { label: 'Завершена', cls: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  CANCELLED: { label: 'Отменена', cls: 'bg-rose-100 text-rose-700', dot: '#f43f5e' },
};

export default function WorkerProfilePage() {
  const { userId, userName, userLastName, userRole, userAvatar, updateAvatar, updateLastName, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const coverRef = useRef(null);
  const reviewsAnchor = useRef(null);

  const [profile, setProfile] = useState(null);
  const [deals, setDeals] = useState([]);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [cover, setCover] = useState(null);
  const [tab, setTab] = useState('deals');
  const [dealTab, setDealTab] = useState('ALL');

  const avatarUrl = resolveUrl(userAvatar);

  useEffect(() => { if (userRole === 'CUSTOMER') navigate('/profile', { replace: true }); }, [userRole, navigate]);
  useEffect(() => {
    try { const c = localStorage.getItem('worker:cover'); if (c) setCover(c); } catch {}
  }, []);

  useEffect(() => {
    if (!userId || userRole === 'CUSTOMER') return;
    setLoading(true);
    Promise.all([
      getMyDeals(userId),
      getListingsByWorker(userId).catch(() => []),
      getReviewsByWorker(userId),
      getUserProfile(userId),
    ]).then(([d, lst, r, p]) => {
      const uid = String(userId || '');
      setDeals((d || []).filter((x) => String(x.workerId || '') === uid));
      setListings(Array.isArray(lst) ? lst : []);
      setReviews((r || []).filter((x) => x.status === 'APPROVED'));
      const prof = p || {};
      setProfile(prof);
      if (prof.lastName != null) updateLastName(String(prof.lastName));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId, userRole, updateLastName]);

  const compress = (file) => new Promise((res) => {
    const r = new FileReader();
    r.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const M = 420; let w = img.width; let h = img.height;
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
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarLoading(true);
    try {
      const b64 = await compress(file);
      try { const r = await uploadAvatar(userId, b64); updateAvatar(r?.avatarUrl || b64); }
      catch { updateAvatar(b64); }
    } finally { setAvatarLoading(false); }
    e.target.value = '';
  };

  const onCover = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const url = ev.target.result;
      setCover(url);
      try { localStorage.setItem('worker:cover', url); } catch {}
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const lastNameLive = profile?.lastName != null ? String(profile.lastName) : (userLastName || '');
  const initials = useMemo(() => {
    const f = (userName || 'М').trim().split(/\s+/)[0]?.[0] || 'М';
    const l = lastNameLive.trim()[0] || '';
    return (f + l).toUpperCase().slice(0, 2);
  }, [userName, lastNameLive]);
  const fullName = [userName, lastNameLive.trim()].filter(Boolean).join(' ') || 'Мастер';
  const since = formatMemberSinceRu(profile?.registeredAt || profile?.createdAt);
  const cityLabel = pick(
    profile?.city,
    profile?.cityName,
    profile?.locationCity,
    profile?.addressCity,
    profile?.location?.city,
    profile?.profile?.city,
  );

  const avgRating = reviews.length ? (reviews.reduce((s, x) => s + (x.rating || 0), 0) / reviews.length) : 0;
  const roundedAvg = Math.round(avgRating);
  const starCounts = useMemo(() => [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => (r.rating || 0) === s).length), [reviews]);
  const maxStarCount = Math.max(...starCounts, 1);
  const activeDealsCount = useMemo(() => deals.filter((d) => ['IN_PROGRESS', 'NEW'].includes(d.status)).length, [deals]);
  const completedCount = useMemo(() => deals.filter((d) => d.status === 'COMPLETED').length, [deals]);
  const activeListings = useMemo(() => listings.filter((l) => l.active), [listings]);

  const tabCounts = useMemo(() => {
    const c = { ALL: deals.length, NEW: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    deals.forEach((d) => { if (c[d.status] !== undefined) c[d.status]++; });
    return c;
  }, [deals]);
  const visibleDeals = dealTab === 'ALL' ? deals : deals.filter((d) => d.status === dealTab);

  const DEAL_TABS = [
    { key: 'ALL', label: 'Все' },
    { key: 'NEW', label: 'Ждут' },
    { key: 'IN_PROGRESS', label: 'В работе' },
    { key: 'COMPLETED', label: 'Завершены' },
    { key: 'CANCELLED', label: 'Отменены' },
  ];

  if (userRole === 'CUSTOMER') return null;

  return (
    <div className="mp">
      <div className="mp-cover">
        <div className="mp-cover-img" style={{ backgroundImage: `url(${cover || PAGE_HERO_DEFAULT_PHOTO})` }} />
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCover} />
        <button type="button" className="mp-cover-btn" onClick={() => coverRef.current?.click()}>
          <FaImage /> {cover ? 'Сменить обложку' : 'Обложка'}
        </button>
      </div>

      <div className="mp-shell">
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatar} />

        <div className="mp-head">
          <div className="mp-avatar" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? <img src={avatarUrl} alt={fullName} /> : initials}
            <div className="mp-avatar-ov"><FaCamera /></div>
            {avatarLoading && <div className="mp-avatar-loading"><FaClock /></div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mp-name">{fullName}</div>
            <div className="mp-role">Мастер{cityLabel ? ` · ${cityLabel}` : ''}</div>
            <div className="mp-badges">
              {profile?.verified && <span className="mp-badge mp-badge-ok"><FaShieldAlt /> Проверенный мастер</span>}
              {profile && !profile.verified && profile.verificationStatus === 'PENDING' && <span className="mp-badge mp-badge-pending"><FaClock /> Документы на проверке</span>}
              {profile && !profile.verified && profile.verificationStatus === 'REJECTED' && <span className="mp-badge mp-badge-bad"><FaExclamationCircle /> Верификация отклонена</span>}
              <span className="mp-badge mp-badge-outline"><FaMapMarkerAlt /> {cityLabel || 'Йошкар-Ола'}</span>
            </div>
          </div>
          <div className="mp-head-btns">
            <button className="mp-btn mp-btn-primary" onClick={() => fileRef.current?.click()}>
              <FaCamera /> {avatarUrl ? 'Сменить' : 'Фото'}
            </button>
            <button className="mp-btn mp-btn-ghost" onClick={() => { logout(); navigate('/login'); }}>
              <FaSignOutAlt /> Выйти
            </button>
          </div>
        </div>

        <div className="mp-body">
          <div className="mp-main">
            <div className="mp-stats">
              <Link to="/deals" className="mp-stat"><div className="mp-stat-num">{activeDealsCount}</div><div className="mp-stat-lbl">В работе</div></Link>
              <Link to="/deals" className="mp-stat"><div className="mp-stat-num">{completedCount}</div><div className="mp-stat-lbl">Завершено</div></Link>
              <Link to="/my-listings" className="mp-stat"><div className="mp-stat-num">{activeListings.length}</div><div className="mp-stat-lbl">Объявления</div></Link>
              <a href="#reviews" className="mp-stat" onClick={(e) => { e.preventDefault(); setTab('reviews'); reviewsAnchor.current?.scrollIntoView({ behavior: 'smooth' }); }}><div className="mp-stat-num">{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</div><div className="mp-stat-lbl">Рейтинг · {reviews.length}</div></a>
            </div>

            <div className="mp-tabs-wrap">
              <div className="mp-tabs-list">
                <button className={`mp-tab ${tab === 'deals' ? 'on' : ''}`} onClick={() => setTab('deals')}>Сделки</button>
                <button className={`mp-tab ${tab === 'reviews' ? 'on' : ''}`} onClick={() => setTab('reviews')}>Отзывы</button>
                <button className={`mp-tab ${tab === 'about' ? 'on' : ''}`} onClick={() => setTab('about')}>О профиле</button>
              </div>

              <div style={{ marginTop: 18 }}>
                {tab === 'deals' && (
                  <div className="mp-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h2 className="mp-card-title" style={{ marginBottom: 0 }}>Лента сделок</h2>
                      <Link to="/find-work" style={{ fontSize: 14, color: '#e8410a', textDecoration: 'none' }}>Найти работу →</Link>
                    </div>
                    <div className="mp-chips">
                      {DEAL_TABS.map((t) => (
                        <button key={t.key} className={`mp-chip ${dealTab === t.key ? 'on' : ''}`} onClick={() => setDealTab(t.key)}>
                          {t.label}
                          {tabCounts[t.key] > 0 && <span className="mp-chip-n">{tabCounts[t.key]}</span>}
                        </button>
                      ))}
                    </div>
                    {loading ? (
                      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Загружаем сделки…</div>
                    ) : visibleDeals.length === 0 ? (
                      <div className="mp-empty">
                        <div className="mp-empty-ico"><FaInbox /></div>
                        <div className="mp-empty-title">{deals.length === 0 ? 'Здесь появятся ваши сделки' : 'В этой категории пусто'}</div>
                        <div className="mp-empty-sub">{deals.length === 0 ? 'Найдите подходящие заявки на бирже — и первая сделка появится прямо здесь.' : 'Попробуйте другой фильтр выше.'}</div>
                        {deals.length === 0 && <Link to="/find-work" className="mp-btn mp-btn-primary" style={{ marginTop: 20, height: 44, padding: '0 24px' }}>Найти работу</Link>}
                      </div>
                    ) : visibleDeals.map((deal) => {
                      const s = STATUS[deal.status] || STATUS.IN_PROGRESS;
                      return (
                        <Link key={deal.id} to={`/deals?dealId=${deal.id}`} className="mp-deal">
                          <div className="mp-deal-img">{deal.photos?.[0] ? <img src={resolveUrl(deal.photos[0])} alt="" /> : <div className="mp-deal-img-ph" />}</div>
                          <div className="mp-deal-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <div className="mp-deal-title">{deal.title || 'Сделка'}</div>
                              <span className={`mp-deal-status ${s.cls}`}><span className="mp-deal-dot" style={{ background: s.dot }} /> {s.label}</span>
                            </div>
                            <div className="mp-deal-meta">
                              {deal.customerName && <span><FaUser /> {[deal.customerName, deal.customerLastName].filter(Boolean).join(' ')}</span>}
                              {deal.createdAt && <span><FaCalendarAlt /> {fmtCard(deal.createdAt)}</span>}
                              {deal.category && <span style={{ padding: '2px 10px', background: '#f1f5f9', borderRadius: 9999 }}>{deal.category}</span>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                              {deal.agreedPrice ? <div className="mp-deal-price">{Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</div> : <span />}
                              <FaChevronRight style={{ color: '#94a3b8' }} />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {tab === 'reviews' && (
                  <div className="mp-card" ref={reviewsAnchor} id="reviews">
                    <h3 className="mp-card-title">Отзывы о вас от заказчиков</h3>
                    <div className="mp-rev-summary">
                      <div>
                        <div className="mp-rev-summary-num">{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</div>
                        <div className="mp-stars">{[1,2,3,4,5].map((i) => <FaStar key={i} className={i <= roundedAvg ? '' : 'off'} />)}</div>
                        <div className="mp-rev-summary-sub">{reviews.length === 0 ? 'Отзывов пока нет' : `на основе ${reviews.length} отзывов`}</div>
                      </div>
                      <div className="mp-rev-bars">
                        {[5,4,3,2,1].map((s, idx) => (
                          <div key={s} className="mp-rev-bar-row">
                            <div className="mp-rev-bar-label">{s}★</div>
                            <div className="mp-rev-bar-track">
                              <div className="mp-rev-bar-fill" style={{ width: `${(starCounts[idx] / maxStarCount) * 100}%` }} />
                            </div>
                            <div className="mp-rev-bar-count">{starCounts[idx]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {reviews.length === 0 ? (
                      <div className="mp-empty"><div className="mp-empty-ico"><FaCommentDots /></div><div className="mp-empty-title">Отзывов пока нет</div><div className="mp-empty-sub">После завершённых сделок заказчики смогут оставить о вас отзыв.</div></div>
                    ) : reviews.map((r) => (
                      (() => {
                        const firstName = pick(r.authorName, r.customerName, r.reviewerName, r.displayName);
                        const lastName = pick(r.authorLastName, r.customerLastName, r.reviewerLastName);
                        const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Пользователь';
                        const avatar = pick(r.authorAvatarUrl, r.customerAvatar, r.reviewerAvatarUrl, r.avatarUrl);
                        return (
                          <div key={r.id} className="mp-rev-row">
                            <div className="mp-rev-ava">
                              {avatar ? <img src={resolveUrl(avatar)} alt={fullName} /> : (firstName[0] || 'U').toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display:'flex', justifyContent:'space-between' }}><div className="mp-rev-name">{fullName}</div><div className="mp-rev-date">{r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</div></div>
                              <div style={{ marginTop: 4 }} className="mp-stars">{[1,2,3,4,5].map((i) => <FaStar key={i} className={i <= (r.rating || 0) ? '' : 'off'} />)}</div>
                              {(r.text || r.comment) && <div className="mp-rev-text">{r.text || r.comment}</div>}
                            </div>
                          </div>
                        );
                      })()
                    ))}
                  </div>
                )}

                {tab === 'about' && (
                  <div className="mp-card">
                    <h3 className="mp-card-title">О профиле</h3>
                    <dl className="mp-about-list">
                      <div className="mp-about-row"><FaMapMarkerAlt className="mp-about-ico" /><div><dt className="mp-about-label">Город</dt><dd className="mp-about-value">{cityLabel || 'Не указан'}</dd></div></div>
                      {since && <div className="mp-about-row"><FaCalendarAlt className="mp-about-ico" /><div><dt className="mp-about-label">На платформе</dt><dd className="mp-about-value">с {since}</dd></div></div>}
                      <div className="mp-about-row"><FaShieldAlt className="mp-about-ico" /><div><dt className="mp-about-label">Статус</dt><dd className="mp-about-value">{profile?.verified ? 'Проверенный мастер' : 'Не верифицирован'}</dd></div></div>
                      <div className="mp-about-row"><FaListAlt className="mp-about-ico" /><div><dt className="mp-about-label">Объявлений в каталоге</dt><dd className="mp-about-value">{activeListings.length}</dd></div></div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="mp-side">
            <div className="mp-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="mp-sets-title">Настройки</div>
              <Link to="/settings/personal" className="mp-sets-row"><div className="mp-sets-ico user"><FaUser /></div><div style={{ flex: 1, minWidth: 0 }}><div className="mp-sets-name">Личные данные</div><div className="mp-sets-desc">Имя и контакты</div></div><FaChevronRight style={{ color: '#94a3b8' }} /></Link>
              <Link to="/settings/notifications" className="mp-sets-row"><div className="mp-sets-ico bell"><FaBell /></div><div style={{ flex: 1, minWidth: 0 }}><div className="mp-sets-name">Уведомления</div><div className="mp-sets-desc">Push и email</div></div><FaChevronRight style={{ color: '#94a3b8' }} /></Link>
              {profile?.verified ? (
                <div className="mp-sets-row"><div className="mp-sets-ico shield"><FaShieldAlt /></div><div style={{ flex: 1, minWidth: 0 }}><div className="mp-sets-name">Верификация</div><div className="mp-sets-desc">Профиль проверен</div></div><span className="mp-sets-pill ok">✓ Готово</span></div>
              ) : (
                <Link to="/verification" className="mp-sets-row"><div className="mp-sets-ico shield"><FaIdCard /></div><div style={{ flex: 1, minWidth: 0 }}><div className="mp-sets-name">Верификация</div><div className="mp-sets-desc">Тест и правила платформы</div></div><FaChevronRight style={{ color: '#94a3b8' }} /></Link>
              )}
              {profile?.verified ? (
                profile?.guaranteeTermsAccepted ? (
                  <div className="mp-sets-row">
                    <div className="mp-sets-ico file"><FaFileAlt /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mp-sets-name">Гарантия и ответственность</div>
                      <div className="mp-sets-desc">Заявление подтверждено</div>
                    </div>
                    <span className="mp-sets-pill ok">✓ Готово</span>
                  </div>
                ) : (
                  <Link to="/guarantee" className="mp-sets-row">
                    <div className="mp-sets-ico file"><FaFileAlt /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mp-sets-name">Гарантия и ответственность</div>
                      <div className="mp-sets-desc">Прочитайте и подтвердите</div>
                    </div>
                    <FaChevronRight style={{ color: '#94a3b8' }} />
                  </Link>
                )
              ) : (
                <div className="mp-sets-row disabled">
                  <div className="mp-sets-ico file"><FaFileAlt /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mp-sets-name">Гарантия и ответственность</div>
                    <div className="mp-sets-desc">Доступно после верификации</div>
                  </div>
                  <span className="mp-sets-pill soon">Позже</span>
                </div>
              )}
              <Link to="/my-listings" className="mp-sets-row"><div className="mp-sets-ico file"><FaListAlt /></div><div style={{ flex: 1, minWidth: 0 }}><div className="mp-sets-name">Мои объявления</div><div className="mp-sets-desc">Активных: {activeListings.length}</div></div><FaChevronRight style={{ color: '#94a3b8' }} /></Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
