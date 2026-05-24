import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals, getListingsByWorker, getReviewsByWorker, uploadAvatar, getUserProfile, getWorkerStats } from '../../api';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import ProfileHero from '../../components/myprofile/ProfileHero';
import ProfileSidebar from '../../components/myprofile/ProfileSidebar';
import ProfileWorkspace from '../../components/myprofile/ProfileWorkspace';
import ProfileShowcaseGrid from '../../components/myprofile/ProfileShowcaseGrid';
import ProfileSettingsDetail from '../../components/myprofile/ProfileSettingsDetail';
import '../../styles/myProfile.css';

const COVER_DEFAULT = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1600&q=85';
const BACKEND = 'https://svoi-mastera-backend.onrender.com';

const resolveUrl = (u) => !u ? null : (u.startsWith('data:') || u.startsWith('http') ? u : BACKEND + u);

const pick = (...values) => {
  for (const v of values) {
    if (v == null || v === '') continue;
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (typeof v === 'object' && typeof v.name === 'string') return v.name.trim();
  }
  return '';
};

function calcProgress(profile, avatarUrl, city, listings) {
  let n = 0;
  if (profile?.displayName || profile?.firstName) n += 20;
  if (avatarUrl) n += 20;
  if (city) n += 15;
  if (profile?.bio || profile?.description) n += 20;
  if (listings?.length > 0) n += 15;
  if (profile?.phone || profile?.phoneNumber) n += 10;
  return Math.min(100, n);
}

function fmtPrice(item) {
  const n = getListingPublishedPriceNumber(item);
  if (!n) return 'Договорная';
  return `от ${Number(n).toLocaleString('ru-RU')} ₽`;
}

export default function WorkerProfilePage() {
  const { userId, userName, userLastName, userRole, userAvatar, updateAvatar, updateLastName } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]     = useState(null);
  const [workerStats, setWorkerStats] = useState(null);
  const [deals, setDeals]         = useState([]);
  const [listings, setListings]   = useState([]);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [cover, setCover]         = useState(null);
  const [settingsKey, setSettingsKey] = useState(null);

  const avatarUrl = resolveUrl(userAvatar);

  useEffect(() => {
    if (userRole === 'CUSTOMER') navigate('/profile', { replace: true });
  }, [userRole, navigate]);

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
      getWorkerStats(userId).catch(() => null),
    ]).then(([d, lst, r, p, stats]) => {
      const uid = String(userId || '');
      setDeals((d || []).filter(x => String(x.workerId || '') === uid));
      setListings(Array.isArray(lst) ? lst : []);
      setReviews((r || []).filter(x => x.status === 'APPROVED'));
      const prof = p || {};
      setProfile(prof);
      setWorkerStats(stats || null);
      if (prof.lastName != null) updateLastName(String(prof.lastName));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId, userRole, updateLastName]);

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

  const onAvatar = async (file) => {
    if (!file) return;
    try {
      const b64 = await compress(file);
      try { const r = await uploadAvatar(userId, b64); updateAvatar(r?.avatarUrl || b64); }
      catch { updateAvatar(b64); }
    } catch {}
  };

  /* ─ Derived ─ */
  const lastNameLive  = profile?.lastName != null ? String(profile.lastName) : (userLastName || '');
  const fullName      = [userName, lastNameLive.trim()].filter(Boolean).join(' ') || 'Мастер';
  const initials      = useMemo(() => {
    const f = (userName || 'М').trim()[0] || 'М';
    const l = lastNameLive.trim()[0] || '';
    return (f + l).toUpperCase().slice(0, 2);
  }, [userName, lastNameLive]);

  const cityLabel = useMemo(() => pick(
    profile?.city, profile?.cityName, profile?.homeCity, profile?.locationCity,
    profile?.addressCity, profile?.location?.city,
    workerStats?.city, workerStats?.locationCity,
  ), [profile, workerStats]);

  const avgRating = useMemo(() =>
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
      : Number(workerStats?.averageRating) || 0,
    [reviews, workerStats]);

  const completedCount = workerStats?.completedWorksCount || deals.filter(d => d.status === 'COMPLETED').length;
  const activeDeals    = deals.filter(d => ['IN_PROGRESS', 'NEW'].includes(d.status)).length;

  const tags = useMemo(() =>
    [...new Set(listings.map(s => s.categoryName || s.category).filter(Boolean))].slice(0, 6),
    [listings]);

  const progress = useMemo(() =>
    calcProgress(profile, avatarUrl, cityLabel, listings),
    [profile, avatarUrl, cityLabel, listings]);

  /* Portfolio: active listings */
  const portfolio = useMemo(() =>
    listings.slice(0, 2).map(s => ({
      title: s.title || 'Услуга',
      text: [fmtPrice(s), cityLabel].filter(Boolean).join(' · '),
      image: s.photos?.[0] || getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category, categoryName: s.categoryName }),
      onClick: () => navigate(`/listings/${s.id}`),
    })),
    [listings, cityLabel, navigate]);

  const reviewsCountDisplay = workerStats?.reviewsCount || reviews.length;

  /* Hero profile data */
  const heroProfile = useMemo(() => ({
    role: 'Личный профиль мастера',
    name: fullName,
    subtitle: tags.length > 0
      ? `${tags.slice(0, 3).join(', ')} — с аккуратной сметой, гарантией и понятными сроками.`
      : 'Показывает услуги, портфолио, рейтинг и помогает получать больше качественных заказов.',
    cover: cover || COVER_DEFAULT,
    meta: [
      `${listings.length} услуг`,
      avgRating > 0 ? `${avgRating.toFixed(1)} рейтинг` : 'Нет отзывов',
      cityLabel || 'Не указан',
    ],
  }), [fullName, tags, cover, listings, avgRating, cityLabel]);

  /* Quick actions */
  const quickActions = [
    { label: 'Добавить услугу',    action: () => navigate('/listings/new') },
    { label: 'Мои объявления',     action: () => navigate('/my-listings') },
    { label: 'Ответить клиентам',  action: () => navigate('/messages') },
    { label: 'Настроить профиль',  action: () => setSettingsKey('personal') },
  ];

  /* Feature cards */
  const featureCards = [
    {
      badge: listings[0] ? `от ${fmtPrice(listings[0])}` : 'добавьте',
      title: 'Главная услуга',
      text: listings[0]?.title
        ? `«${listings[0].title}» — ваша активная услуга на платформе.`
        : 'Добавьте первую услугу, чтобы начать получать заказы.',
    },
    {
      badge: `${completedCount} работ`,
      title: 'Портфолио',
      text: 'Завершённые проекты с фото, стоимостью и сроками выполнения.',
    },
    {
      badge: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '—',
      title: 'Репутация',
      text: 'Отзывы, рейтинг и скорость ответа помогают выделиться среди мастеров.',
    },
  ];

  if (loading) {
    return (
      <div className="mp-loading">
        <div className="mp-loading-icon">⏳</div>
        <p>Загружаем профиль…</p>
      </div>
    );
  }

  return (
    <main className="mp-page-v2">
      <ProfileHero
        profile={heroProfile}
        mode="master"
        onModeChange={(role) => {
          if (role === 'customer') navigate('/profile');
        }}
        onViewPublic={() => navigate(`/workers/${userId}`)}
        onEdit={() => setSettingsKey('personal')}
      />

      <section className="mp-shell-v2">
        <ProfileSidebar
          name={fullName}
          about={profile?.bio || profile?.description || profile?.about || ''}
          city={cityLabel}
          status={profile?.verified ? 'Премиум мастер' : 'Мастер'}
          progress={progress}
          avatarUrl={avatarUrl}
          initials={initials}
          verified={profile?.verified}
          onAvatarChange={onAvatar}
        />

        <div className="mp-main-v2">
          {/* Stats strip */}
          <div className="mp-stats-v2">
            {[
              { value: String(completedCount || 0),  label: 'выполненных работ' },
              { value: String(reviewsCountDisplay),  label: 'отзывов' },
              { value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: 'средняя оценка' },
            ].map((s, i) => (
              <article key={i}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </article>
            ))}
          </div>

          {settingsKey ? (
            <ProfileSettingsDetail
              activeKey={settingsKey}
              onBack={() => setSettingsKey(null)}
              userId={userId}
              profile={profile}
              verified={profile?.verified}
              onSaved={(upd) => setProfile(p => ({ ...p, ...upd }))}
            />
          ) : (
            <>
              <ProfileWorkspace
                deals={deals}
                reviews={reviews}
                about={profile?.bio || profile?.description || ''}
                tags={tags}
                dealsTitle="Заказы и отклики"
                dealsListPath="/deals"
                onSettingsSelect={setSettingsKey}
                onDealClick={(d) => navigate(`/deals/${d.id}`)}
              />
              <ProfileShowcaseGrid
                quickActions={quickActions}
                featureCards={featureCards}
                showcaseTitle="Лучшие работы"
                portfolio={portfolio}
                isWorker
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
