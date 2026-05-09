import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCamera, FaSignOutAlt, FaImage, FaMapMarkerAlt, FaShieldAlt, FaClock,
  FaExclamationCircle, FaStar, FaCheckCircle, FaInbox, FaUser, FaBell,
  FaIdCard, FaCreditCard, FaChevronRight, FaCalendarAlt, FaBriefcase, FaCommentDots, FaFileAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, getMyDeals, createReview, uploadAvatar, getReviewsByCustomer, getCustomerStats } from '../../api';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { PAGE_HERO_DEFAULT_PHOTO } from '../../constants/pageHeroAssets';
import '../../styles/modernProfile.css';

const BACKEND = 'https://svoi-mastera-backend-mf3h.onrender.com';

const resolveUrl = (u) => !u ? null : (u.startsWith('data:') || u.startsWith('http') ? u : BACKEND + u);
const fmtCard = (d) => !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const fmtSince = (d) => !d ? '' : new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
const pick = (...values) => values.find((v) => typeof v === 'string' && v.trim()) || '';

const STATUS = {
  NEW:         { label: 'Ждёт мастера', cls: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  IN_PROGRESS: { label: 'В работе', cls: 'bg-blue-100 text-blue-700', dot: '#3b82f6' },
  COMPLETED:   { label: 'Завершена', cls: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  CANCELLED:   { label: 'Отменена', cls: 'bg-rose-100 text-rose-700', dot: '#f43f5e' },
};

export default function CustomerProfilePage() {
  const { userId, userName, userRole, userAvatar, updateAvatar, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const coverRef = useRef(null);
  const reviewsAnchor = useRef(null);

  const [profile, setProfile] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [deals, setDeals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [cover, setCover] = useState(null);
  const [tab, setTab] = useState('deals');
  const [dealTab, setDealTab] = useState('ALL');

  const [reviewDeal, setReviewDeal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewStatus, setReviewStatus] = useState('idle');

  const avatarUrl = resolveUrl(userAvatar);

  useEffect(() => { if (userRole === 'WORKER') navigate('/worker-profile', { replace: true }); }, [userRole, navigate]);

  useEffect(() => {
    try { const c = localStorage.getItem('customer:cover'); if (c) setCover(c); } catch {}
  }, []);

  useEffect(() => {
    if (!userId || userRole === 'WORKER') return;
    setLoading(true);
    Promise.allSettled([getUserProfile(userId), getMyDeals(userId), getReviewsByCustomer(userId), getCustomerStats(userId)])
      .then(([p, d, r, s]) => {
        if (p.status === 'fulfilled') setProfile(p.value);
        if (d.status === 'fulfilled') setDeals(d.value || []);
        if (r.status === 'fulfilled') setReviews(Array.isArray(r.value) ? r.value : []);
        if (s.status === 'fulfilled') setCustomerStats(s.value || null);
      })
      .finally(() => setLoading(false));
  }, [userId, userRole, navigate]);

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

  const initials = useMemo(() => {
    const n = (profile?.displayName || userName || 'Гость').trim();
    return n.split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  }, [profile, userName]);
  const fullName = profile?.displayName || userName || 'Заказчик';
  const since = fmtSince(profile?.registeredAt || profile?.createdAt);
  const cityLabel = pick(
    customerStats?.city,
    customerStats?.locationCity,
    customerStats?.addressCity,
    customerStats?.location?.city,
    profile?.city,
    profile?.cityName,
    profile?.locationCity,
    profile?.addressCity,
    profile?.location?.city,
    profile?.profile?.city,
  );

  const active = useMemo(() => deals.filter((d) => ['IN_PROGRESS', 'NEW'].includes(d.status)).length, [deals]);
  const completed = useMemo(() => deals.filter((d) => d.status === 'COMPLETED').length, [deals]);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) : 0;
  const roundedAvg = Math.round(avgRating);
  const starCounts = useMemo(() => [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => (r.rating || 0) === s).length), [reviews]);
  const maxStarCount = Math.max(...starCounts, 1);

  const tabCounts = useMemo(() => {
    const c = { ALL: deals.length, NEW: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    deals.forEach(d => { if (c[d.status] !== undefined) c[d.status]++; });
    return c;
  }, [deals]);
  const visibleDeals = dealTab === 'ALL' ? deals : deals.filter(d => d.status === dealTab);

  const submitReview = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done');
    } catch {
      setReviewStatus('error');
    }
  };

  const onCover = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const url = ev.target.result;
      setCover(url);
      try { localStorage.setItem('customer:cover', url); } catch {}
    };
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const DEAL_TABS = [
    { key: 'ALL', label: 'Все' },
    { key: 'NEW', label: 'Ждут' },
    { key: 'IN_PROGRESS', label: 'В работе' },
    { key: 'COMPLETED', label: 'Завершены' },
    { key: 'CANCELLED', label: 'Отменены' },
  ];

  if (userRole === 'WORKER') return null;

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
            <div className="mp-role">Заказчик{cityLabel ? ` · ${cityLabel}` : ''}</div>
            <div className="mp-badges">
              {profile?.verified && (<span className="mp-badge mp-badge-ok"><FaShieldAlt /> Проверен</span>)}
              {profile && !profile.verified && profile.verificationStatus === 'PENDING' && (<span className="mp-badge mp-badge-pending"><FaClock /> На проверке</span>)}
              {profile && !profile.verified && profile.verificationStatus === 'REJECTED' && (<span className="mp-badge mp-badge-bad"><FaExclamationCircle /> Отклонена</span>)}
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
              <Link to="/deals" className="mp-stat mp-stat-blue"><div className="mp-stat-ico blue"><FaBriefcase /></div><div className="mp-stat-num">{active}</div><div className="mp-stat-lbl">В работе</div></Link>
              <Link to="/deals" className="mp-stat mp-stat-green"><div className="mp-stat-ico green"><FaCheckCircle /></div><div className="mp-stat-num">{completed}</div><div className="mp-stat-lbl">Завершено</div></Link>
              <a href="#reviews" className="mp-stat mp-stat-violet" onClick={(e) => { e.preventDefault(); setTab('reviews'); reviewsAnchor.current?.scrollIntoView({ behavior:'smooth' }); }}><div className="mp-stat-ico violet"><FaCommentDots /></div><div className="mp-stat-num">{reviews.length}</div><div className="mp-stat-lbl">Отзывы</div></a>
              <a href="#reviews" className="mp-stat mp-stat-amber" onClick={(e) => { e.preventDefault(); setTab('reviews'); reviewsAnchor.current?.scrollIntoView({ behavior:'smooth' }); }}><div className="mp-stat-ico amber"><FaStar /></div><div className="mp-stat-num">{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</div><div className="mp-stat-lbl">Рейтинг</div></a>
            </div>

            <div className="mp-tabs-wrap">
              <div className="mp-tabs-list">
                <button className={`mp-tab ${tab==='deals'?'on':''}`} onClick={() => setTab('deals')}>Сделки</button>
                <button className={`mp-tab ${tab==='reviews'?'on':''}`} onClick={() => setTab('reviews')}>Отзывы</button>
                <button className={`mp-tab ${tab==='about'?'on':''}`} onClick={() => setTab('about')}>О профиле</button>
              </div>

              <div style={{ marginTop: 18 }}>
                {tab === 'deals' && (
                  <div className="mp-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16 }}>
                      <h2 className="mp-card-title" style={{ marginBottom: 0 }}>Лента сделок</h2>
                      <Link to="/deals" style={{ fontSize: 14, color: '#e8410a', textDecoration: 'none' }}>Все →</Link>
                    </div>
                    <div className="mp-chips">
                      {DEAL_TABS.map((t) => (
                        <button key={t.key} className={`mp-chip ${dealTab===t.key?'on':''}`} onClick={() => setDealTab(t.key)}>
                          {t.label}
                          {tabCounts[t.key] > 0 && <span className="mp-chip-n">{tabCounts[t.key]}</span>}
                        </button>
                      ))}
                    </div>
                    {loading ? (
                      <div style={{ padding: 48, textAlign:'center', color:'#64748b' }}>Загружаем сделки…</div>
                    ) : visibleDeals.length === 0 ? (
                      <div className="mp-empty">
                        <div className="mp-empty-ico"><FaInbox /></div>
                        <div className="mp-empty-title">{deals.length === 0 ? 'Здесь появятся ваши сделки' : 'В этой категории пусто'}</div>
                        <div className="mp-empty-sub">{deals.length === 0 ? 'Найдите подходящего мастера — и первая сделка появится прямо здесь.' : 'Попробуйте другой фильтр выше.'}</div>
                        {deals.length === 0 && (<Link to="/categories" className="mp-btn mp-btn-primary" style={{ marginTop: 20, height: 44, padding: '0 24px' }}>Найти мастера</Link>)}
                      </div>
                    ) : visibleDeals.map((deal) => {
                      const s = STATUS[deal.status] || STATUS.IN_PROGRESS;
                      const canReview = dealEligibleForReviews(deal) && deal.workerName && !deal.hasReview;
                      return (
                        <div key={deal.id}>
                          <Link to={`/deals?dealId=${deal.id}`} className="mp-deal">
                            <div className="mp-deal-img">{deal.photos?.[0] ? <img src={resolveUrl(deal.photos[0])} alt="" /> : <div className="mp-deal-img-ph" />}</div>
                            <div className="mp-deal-body">
                              <div style={{ display:'flex', justifyContent:'space-between', gap: 8 }}>
                                <div className="mp-deal-title">{deal.title || 'Сделка'}</div>
                                <span className={`mp-deal-status ${s.cls}`}><span className="mp-deal-dot" style={{ background: s.dot }} /> {s.label}</span>
                              </div>
                              <div className="mp-deal-meta">
                                {deal.workerName && <span><FaUser /> {[deal.workerName, deal.workerLastName].filter(Boolean).join(' ')}</span>}
                                {deal.createdAt && <span><FaCalendarAlt /> {fmtCard(deal.createdAt)}</span>}
                                {deal.category && <span style={{ padding:'2px 10px', background:'#f1f5f9', borderRadius: 9999 }}>{deal.category}</span>}
                              </div>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 8 }}>
                                {deal.agreedPrice ? <div className="mp-deal-price">{Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</div> : <span />}
                                <FaChevronRight style={{ color:'#94a3b8' }} />
                              </div>
                            </div>
                          </Link>
                          {canReview && (
                            <button className="mp-btn mp-btn-primary" style={{ marginBottom: 8 }} onClick={() => { setReviewDeal(deal); setReviewForm({ rating:5, comment:'' }); setReviewStatus('idle'); }}>
                              Оставить отзыв
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {tab === 'reviews' && (
                  <div className="mp-card" ref={reviewsAnchor} id="reviews">
                    <h3 className="mp-card-title">Отзывы о вас от мастеров</h3>
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
                      <div className="mp-empty"><div className="mp-empty-ico"><FaCommentDots /></div><div className="mp-empty-title">Отзывов пока нет</div><div className="mp-empty-sub">После завершённых сделок мастера смогут оставить о вас отзыв.</div></div>
                    ) : reviews.map((r) => (
                      (() => {
                        const firstName = pick(r.authorName, r.workerName, r.reviewerName, r.displayName);
                        const lastName = pick(r.authorLastName, r.workerLastName, r.reviewerLastName);
                        const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Пользователь';
                        const avatar = pick(r.authorAvatarUrl, r.workerAvatar, r.reviewerAvatarUrl, r.avatarUrl);
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
                      <div className="mp-about-row"><FaShieldAlt className="mp-about-ico" /><div><dt className="mp-about-label">Статус</dt><dd className="mp-about-value">{profile?.verified ? 'Проверенный профиль' : 'Не верифицирован'}</dd></div></div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="mp-side">
            <div className="mp-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="mp-sets-title">Настройки</div>
              <Link to="/settings/personal" className="mp-sets-row"><div className="mp-sets-ico user"><FaUser /></div><div style={{ flex:1, minWidth: 0 }}><div className="mp-sets-name">Личные данные</div><div className="mp-sets-desc">Имя и контакты</div></div><FaChevronRight style={{ color:'#94a3b8' }} /></Link>
              <Link to="/settings/notifications" className="mp-sets-row"><div className="mp-sets-ico bell"><FaBell /></div><div style={{ flex:1, minWidth: 0 }}><div className="mp-sets-name">Уведомления</div><div className="mp-sets-desc">Push и email</div></div><FaChevronRight style={{ color:'#94a3b8' }} /></Link>
              {profile?.verified ? (
                <div className="mp-sets-row"><div className="mp-sets-ico shield"><FaShieldAlt /></div><div style={{ flex:1, minWidth: 0 }}><div className="mp-sets-name">Верификация</div><div className="mp-sets-desc">Профиль проверен</div></div><span className="mp-sets-pill ok">✓ Готово</span></div>
              ) : (
                <Link to="/verification" className="mp-sets-row"><div className="mp-sets-ico shield"><FaIdCard /></div><div style={{ flex:1, minWidth: 0 }}><div className="mp-sets-name">Верификация</div><div className="mp-sets-desc">Тест и правила платформы</div></div><FaChevronRight style={{ color:'#94a3b8' }} /></Link>
              )}
              {profile?.verified ? (
                profile?.guaranteeTermsAccepted ? (
                  <div className="mp-sets-row">
                    <div className="mp-sets-ico file"><FaFileAlt /></div>
                    <div style={{ flex:1, minWidth: 0 }}>
                      <div className="mp-sets-name">Гарантия и ответственность</div>
                      <div className="mp-sets-desc">Заявление подтверждено</div>
                    </div>
                    <span className="mp-sets-pill ok">✓ Готово</span>
                  </div>
                ) : (
                  <Link to="/guarantee" className="mp-sets-row">
                    <div className="mp-sets-ico file"><FaFileAlt /></div>
                    <div style={{ flex:1, minWidth: 0 }}>
                      <div className="mp-sets-name">Гарантия и ответственность</div>
                      <div className="mp-sets-desc">Прочитайте и подтвердите</div>
                    </div>
                    <FaChevronRight style={{ color:'#94a3b8' }} />
                  </Link>
                )
              ) : (
                <div className="mp-sets-row disabled">
                  <div className="mp-sets-ico file"><FaFileAlt /></div>
                  <div style={{ flex:1, minWidth: 0 }}>
                    <div className="mp-sets-name">Гарантия и ответственность</div>
                    <div className="mp-sets-desc">Доступно после верификации</div>
                  </div>
                  <span className="mp-sets-pill soon">Позже</span>
                </div>
              )}
              <div className="mp-sets-row disabled"><div className="mp-sets-ico card"><FaCreditCard /></div><div style={{ flex:1, minWidth: 0 }}><div className="mp-sets-name">Платёжные данные</div><div className="mp-sets-desc">Скоро появится</div></div><span className="mp-sets-pill soon">Скоро</span></div>
            </div>
          </aside>
        </div>
      </div>

      {reviewDeal && (
        <div className="mp-modal-ov" onClick={() => setReviewDeal(null)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            {reviewStatus === 'done' ? (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize: 48 }}>🎉</div>
                <h3>Отзыв отправлен!</h3>
                <button className="mp-btn mp-btn-primary" onClick={() => setReviewDeal(null)}>Закрыть</button>
              </div>
            ) : (
              <>
                <h3>Оставить отзыв</h3>
                <p>Мастер: {reviewDeal.workerName}</p>
                <div className="mp-rate">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={`mp-rate-star ${reviewForm.rating >= s ? 'on' : ''}`} onClick={() => setReviewForm({ ...reviewForm, rating: s })}>★</span>
                  ))}
                </div>
                <textarea className="mp-textarea" placeholder="Расскажите о работе мастера…" value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                {reviewStatus === 'error' && <div style={{ color:'#dc2626', fontSize: 13, marginTop: 8 }}>Не удалось отправить отзыв</div>}
                <div style={{ display:'flex', gap: 8, marginTop: 16 }}>
                  <button className="mp-btn mp-btn-primary" onClick={submitReview} disabled={reviewStatus === 'sending'}>{reviewStatus === 'sending' ? 'Отправляем…' : 'Отправить'}</button>
                  <button className="mp-btn mp-btn-ghost" onClick={() => setReviewDeal(null)}>Отмена</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
