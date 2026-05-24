import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getUserProfile, getMyDeals, uploadAvatar, getReviewsByCustomer, getCustomerStats,
  getCustomerProfile, getMyJobRequests,
} from '../../api';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { PAGE_HERO_DEFAULT_PHOTO } from '../../constants/pageHeroAssets';
import ProfileHero from '../../components/myprofile/ProfileHero';
import ProfileSidebar from '../../components/myprofile/ProfileSidebar';
import ProfileWorkspace from '../../components/myprofile/ProfileWorkspace';
import ProfileSettingsDetail from '../../components/myprofile/ProfileSettingsDetail';
import '../../styles/myProfile.css';

const COVER_DEFAULT = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=85';
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

function calcProgress(profile, avatarUrl, city) {
  let n = 0;
  if (profile?.displayName || profile?.firstName) n += 25;
  if (avatarUrl) n += 25;
  if (city) n += 20;
  if (profile?.bio || profile?.description) n += 20;
  if (profile?.phone || profile?.phoneNumber) n += 10;
  return Math.min(100, n);
}

export default function CustomerProfilePage() {
  const { userId, userName, userLastName, userRole, userAvatar, updateAvatar, updateLastName } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]              = useState(null);
  const [customerStats, setCustomerStats]  = useState(null);
  const [customerRecord, setCustomerRecord] = useState(null);
  const [deals, setDeals]                  = useState([]);
  const [requests, setRequests]            = useState([]);
  const [reviews, setReviews]              = useState([]);
  const [loading, setLoading]              = useState(true);
  const [cover, setCover]                  = useState(null);
  const [settingsKey, setSettingsKey]      = useState(null);

  const avatarUrl = resolveUrl(userAvatar);

  useEffect(() => {
    if (userRole === 'WORKER') navigate('/worker-profile', { replace: true });
  }, [userRole, navigate]);

  useEffect(() => {
    try { const c = localStorage.getItem('customer:cover'); if (c) setCover(c); } catch {}
  }, []);

  useEffect(() => {
    if (!userId || userRole === 'WORKER') return;
    setLoading(true);
    Promise.allSettled([
      getUserProfile(userId),
      getMyDeals(userId),
      getReviewsByCustomer(userId),
      getCustomerStats(userId),
      getCustomerProfile(userId),
      getMyJobRequests(userId),
    ]).then(([p, d, r, s, cp, req]) => {
      if (p.status === 'fulfilled') {
        const pr = p.value;
        setProfile(pr);
        if (pr?.lastName != null) updateLastName(String(pr.lastName));
      }
      if (d.status === 'fulfilled') setDeals(d.value || []);
      if (r.status === 'fulfilled') setReviews(Array.isArray(r.value) ? r.value : []);
      if (s.status === 'fulfilled') setCustomerStats(s.value || null);
      if (cp.status === 'fulfilled') setCustomerRecord(cp.value || null);
      if (req.status === 'fulfilled') setRequests(Array.isArray(req.value) ? req.value : []);
    }).finally(() => setLoading(false));
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
  const firstNameLive = (profile?.displayName || userName || '').trim();
  const lastNameLive  = profile?.lastName != null ? String(profile.lastName).trim() : (userLastName || '').trim();
  const fullName = [firstNameLive, lastNameLive].filter(Boolean).join(' ') || 'Заказчик';
  const initials = useMemo(() => {
    const f = firstNameLive.split(/\s+/)[0]?.[0] || 'З';
    const l = lastNameLive[0] || '';
    return (f + l).toUpperCase().slice(0, 2);
  }, [firstNameLive, lastNameLive]);

  const cityLabel = useMemo(() => pick(
    profile?.city, profile?.cityName, profile?.homeCity, profile?.locationCity,
    profile?.addressCity, profile?.location?.city,
    customerRecord?.city, customerRecord?.cityName,
    customerStats?.city, customerStats?.locationCity,
  ), [profile, customerRecord, customerStats]);

  /* Job requests statuses: OPEN = active, others = in-progress */
  const ACTIVE_REQ = ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED', 'IN_PROGRESS'];
  const activeRequests = useMemo(() =>
    requests.filter(r => ACTIVE_REQ.includes(r.status)),
    [requests]);
  const active    = activeRequests.length;
  const completed = useMemo(() =>
    requests.filter(r => r.status === 'COMPLETED').length + deals.filter(d => d.status === 'COMPLETED').length,
    [requests, deals]);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  const tags = useMemo(() =>
    [...new Set([
      ...requests.map(r => r.categoryName || r.category),
      ...deals.map(d => d.categoryName || d.category),
    ].filter(Boolean))].slice(0, 6),
    [requests, deals]);

  const progress = useMemo(() =>
    calcProgress(profile, avatarUrl, cityLabel),
    [profile, avatarUrl, cityLabel]);

  /* Portfolio: active job requests */
  const portfolio = useMemo(() =>
    activeRequests
      .slice(0, 2)
      .map(r => ({
        title: r.title || 'Задача',
        text: [
          r.budget ? `${Number(r.budget).toLocaleString('ru-RU')} ₽` : null,
          r.city || cityLabel,
        ].filter(Boolean).join(' · '),
        image: r.photos?.[0] || getCategoryPlaceholderPhotoUrlOrDefault({ categoryName: r.categoryName, categoryId: r.categoryId }),
        onClick: () => navigate(`/orders/${r.id}`),
      })),
    [activeRequests, cityLabel, navigate]);

  /* Hero profile data */
  const heroProfile = useMemo(() => ({
    role: 'Личный профиль заказчика',
    name: fullName,
    subtitle: tags.length > 0
      ? `Публикует задачи по: ${tags.slice(0, 3).join(', ')}. Быстро отвечает мастерам.`
      : 'Публикует понятные задачи, быстро отвечает мастерам и собирает лучшие предложения.',
    cover: cover || COVER_DEFAULT,
    meta: [
      `${requests.length} заявок`,
      `${active} активные`,
      'Ответ в течение дня',
    ],
  }), [fullName, tags, cover, requests, active]);

  /* Quick actions */
  const quickActions = [
    { label: 'Создать заявку',     action: () => navigate('/orders/new') },
    { label: 'Посмотреть отклики', action: () => navigate('/orders') },
    { label: 'Открыть историю',    action: () => navigate('/deals') },
    { label: 'Настроить профиль',  action: () => setSettingsKey('personal') },
  ];

  /* Feature cards */
  const featureCards = [
    {
      badge: `${active} активных`,
      title: 'Текущие задачи',
      text: activeRequests[0]?.title
        ? `«${activeRequests[0].title}» — ваша активная заявка`
        : requests[0]?.title
          ? `«${requests[0].title}» — последняя заявка`
          : 'Создайте первую задачу, чтобы начать работу с мастерами.',
    },
    {
      badge: 'быстрый ответ',
      title: 'Коммуникация',
      text: 'Мастера видят сроки, бюджет и детали до начала диалога.',
    },
    {
      badge: `${completed} закрыто`,
      title: 'История работ',
      text: 'Завершённые задачи сохраняются вместе с отзывами и исполнителями.',
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
        mode="customer"
        onModeChange={() => navigate('/worker-profile')}
        onViewPublic={() => navigate(`/customers/${userId}`)}
        onEdit={() => setSettingsKey('personal')}
      />

      <section className="mp-shell-v2">
        <ProfileSidebar
          name={fullName}
          about={profile?.bio || profile?.description || profile?.about || ''}
          city={cityLabel}
          status={profile?.verified ? 'Проверенный заказчик' : 'Заказчик'}
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
              { value: String(requests.length), label: 'всего заявок' },
              { value: String(active),          label: 'активные сейчас' },
              { value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: 'оценка мастеров' },
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
            <ProfileWorkspace
              deals={requests.length > 0 ? requests : deals}
              reviews={reviews}
              about={profile?.bio || profile?.description || ''}
              tags={tags}
              dealsTitle="Ваши заявки"
              quickActions={quickActions}
              featureCards={featureCards}
              showcaseTitle="Активные задачи"
              portfolio={portfolio}
              onSettingsSelect={setSettingsKey}
              onDealClick={d => {
                const isRequest = ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED'].includes(d.status);
                navigate(isRequest ? `/my-requests` : `/deals/${d.id}`);
              }}
              isWorker={false}
            />
          )}
        </div>
      </section>
    </main>
  );
}
