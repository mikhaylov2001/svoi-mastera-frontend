import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import { publicTimeAgo, publicMemberSince } from '../../utils/publicProfileUtils';
import PhotoLightbox from '../../components/PhotoLightbox';
import ProfileShowcase from '../../components/profiles/ProfileShowcase';
import { goBackOr } from '../../utils/navigationHelpers';

const API = 'https://svoi-mastera-backend-n9om.onrender.com/api/v1';
const BACKEND = 'https://svoi-mastera-backend-n9om.onrender.com';
const COVER_WORKER = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1600&q=85';

function resolveImg(item, category) {
  const raw = item.photos?.[0] || null;
  if (raw) {
    if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
    return BACKEND + raw;
  }
  return getCategoryPlaceholderPhotoUrlOrDefault({
    category: category || item.category,
    categoryName: item.categoryName,
    categoryId: item.categoryId,
  });
}

function fmtPrice(item) {
  const n = getListingPublishedPriceNumber(item);
  if (!n) return 'Договорная';
  const formatted = Number(n).toLocaleString('ru-RU');
  const unit = item.priceType === 'PER_HOUR' ? '/час'
             : item.priceType === 'PER_UNIT' ? `/${item.priceUnit || 'ед.'}`
             : '';
  return `от ${formatted} ₽${unit}`;
}

function ruPlural(n, one, few, many) {
  const m = Math.abs(n) % 100;
  const m1 = m % 10;
  if (m > 10 && m < 20) return many;
  if (m1 === 1) return one;
  if (m1 >= 2 && m1 <= 4) return few;
  return many;
}

export default function PublicWorkerProfilePage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [worker,         setWorker]         = useState(null);
  const [services,       setServices]       = useState([]);
  const [reviews,        setReviews]        = useState([]);
  const [completedWorks, setCompletedWorks] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [lightbox,       setLightbox]       = useState(null);

  useEffect(() => {
    if (!workerId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/workers/${workerId}/listings`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/workers/${workerId}/stats`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch(`${API}/workers/${workerId}/reviews`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/workers/${workerId}/completed-works`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([svc, stats, rev, works]) => {
      setServices(Array.isArray(svc) ? svc : []);
      setReviews(Array.isArray(rev) ? rev.filter(r => r.status === 'APPROVED') : []);
      setCompletedWorks(Array.isArray(works) ? works : []);
      setWorker({
        name: stats?.displayName || 'Мастер',
        lastName: stats?.lastName || '',
        avatarUrl: stats?.avatarUrl || null,
        city: stats?.city || '',
        rating: stats?.averageRating || 0,
        reviewsCount: Number(stats?.reviewsCount) || 0,
        completedCount: Number(stats?.completedWorksCount) || 0,
        registeredAt: stats?.registeredAt || null,
        verified: stats?.verified === true,
        bio: stats?.bio || stats?.description || stats?.about || null,
        responseTime: stats?.responseTime || null,
      });
    }).finally(() => setLoading(false));
  }, [workerId]);

  const fullName = [worker?.name, worker?.lastName].filter(Boolean).join(' ') || 'Мастер';
  const since = publicMemberSince(worker?.registeredAt);

  const avgRating = useMemo(() => {
    if (reviews.length > 0) return reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
    return worker?.rating > 0 ? Number(worker.rating) : 0;
  }, [reviews, worker]);

  const tags = useMemo(() => {
    const cats = services.map(s => s.categoryName || s.category).filter(Boolean);
    return [...new Set(cats)].slice(0, 8);
  }, [services]);

  // Years on platform from registeredAt
  const yearsOnPlatform = useMemo(() => {
    if (!worker?.registeredAt) return 0;
    return Math.max(0, Math.floor(
      (Date.now() - new Date(worker.registeredAt)) / (365.25 * 24 * 60 * 60 * 1000)
    ));
  }, [worker]);

  const profile = useMemo(() => {
    if (!worker) return null;

    const closedCount = worker.completedCount || completedWorks.length;
    const reviewsCountDisplay = worker.reviewsCount || reviews.length;

    // timeline: recent completed works, else recent services
    const timelineSource = completedWorks.length > 0
      ? [...completedWorks].sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)).slice(0, 3)
      : [...services].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

    const timeline = timelineSource.map(item => ({
      title: item.title || item.serviceName || 'Работа',
      text: [
        item.categoryName || item.category,
        publicTimeAgo(item.completedAt || item.createdAt),
      ].filter(Boolean).join(' · '),
    }));

    // listings
    const activeItems = services.map(s => ({
      id: s.id,
      status: 'active',
      title: s.title || s.serviceName || 'Услуга',
      price: fmtPrice(s),
      city: worker.city || '',
      time: s.availabilityText || publicTimeAgo(s.createdAt) || '',
      image: resolveImg(s),
      photos: s.photos,
      isActiveListing: true,
      favoriteKind: 'listing',
    }));

    const completedItems = completedWorks.map(w => ({
      id: w.id,
      status: 'completed',
      title: w.title || w.serviceName || 'Выполненная работа',
      price: w.agreedPrice ? `${Number(w.agreedPrice).toLocaleString('ru-RU')} ₽` : 'Договорная',
      city: worker.city || '',
      time: publicTimeAgo(w.completedAt || w.createdAt),
      image: resolveImg(w),
      photos: w.photos,
      isActiveListing: false,
    }));

    // first review
    const firstRev = reviews[0];
    const revAuthor = firstRev
      ? [firstRev.authorName || firstRev.customerName, firstRev.authorLastName || firstRev.customerLastName]
          .filter(Boolean).join(' ') || 'Заказчик'
      : null;

    const metaParts = [
      worker.city,
      worker.responseTime ? `Ответ за ${worker.responseTime}` : 'Быстро отвечает',
      since ? `На сервисе с ${since}` : null,
    ].filter(Boolean);

    const aboutText = worker.bio ||
      (tags.length > 0
        ? `Специализируется на: ${tags.join(', ')}. Работает аккуратно, соблюдает сроки и удерживает заказчика в курсе на каждом этапе.`
        : `Профессиональный мастер с опытом работы. Выполнено задач: ${closedCount}. Работает на платформе.`);

    return {
      role: worker.verified ? 'Проверенный мастер' : 'Мастер',
      name: fullName,
      headline: tags.length > 0
        ? `${tags.slice(0, 3).join(', ')} — с аккуратной сметой, гарантией и понятными сроками.`
        : 'Профессиональный подход, аккуратная работа и чёткие договорённости по каждому заказу.',
      cover: COVER_WORKER,
      avatar: worker.avatarUrl || null,
      verified: worker.verified,
      meta: metaParts,

      actionTitle: 'Готов взять заказ',
      actionText: 'Свяжитесь с мастером и обсудите детали задачи сегодня.',
      primaryAction: 'Написать мастеру',
      secondaryAction: 'Запросить смету',

      rating: avgRating > 0 ? avgRating.toFixed(1) : null,
      ratingText: reviewsCountDisplay > 0
        ? `${reviewsCountDisplay} ${ruPlural(reviewsCountDisplay, 'отзыв', 'отзыва', 'отзывов')} клиентов`
        : 'Отзывов пока нет',

      facts: [
        yearsOnPlatform > 0
          ? { label: 'Опыт на платформе', value: `${yearsOnPlatform} ${ruPlural(yearsOnPlatform, 'год', 'года', 'лет')}` }
          : { label: 'Выполнено работ', value: String(closedCount) },
        { label: 'Статус', value: worker.verified ? 'Проверен' : 'Активен' },
        { label: 'Город', value: worker.city || 'Не указан' },
      ],
      stats: [
        { value: String(closedCount || 0), label: 'выполненных работ' },
        { value: String(services.length), label: 'активных услуг' },
        { value: reviewsCountDisplay > 0 ? avgRating.toFixed(1) : '—', label: 'средняя оценка' },
      ],

      aboutKicker: 'О специалисте',
      aboutTitle: closedCount > 10 ? 'Опытный исполнитель под ключ' : 'Мастер на платформе',
      about: aboutText,

      tagsTitle: 'Что можно заказать',
      tags,

      timelineKicker: 'Портфолио',
      timelineTitle: completedWorks.length > 0 ? 'Последние проекты' : 'Активные услуги',
      timeline: timeline.length > 0 ? timeline : null,

      reviewTitle: firstRev ? (avgRating >= 4.5 ? 'Клиенты отмечают качество' : 'Отзыв о мастере') : null,
      review: firstRev?.text || firstRev?.comment || null,
      reviewAuthor: revAuthor ? `${revAuthor}, заказчик` : null,

      reviews: reviews.slice(0, 3).map(r => ({
        author: [r.authorName || r.customerName, r.authorLastName || r.customerLastName]
          .filter(Boolean).join(' ') || 'Заказчик',
        rating: (r.rating || 0).toFixed(1),
        text: r.text || r.comment || '',
      })).filter(r => r.text),

      listings: [...activeItems, ...completedItems],
    };
  }, [worker, services, reviews, completedWorks, avgRating, tags, fullName, since]);

  if (loading || !profile) {
    return (
      <main className="pro-page pro-page--loading">
        <div className="pro-loading">
          <div className="pro-loading-icon">⏳</div>
          <p>Загружаем профиль…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <ProfileShowcase
        profile={profile}
        onBack={() => goBackOr(navigate, '/find-master')}
        onPrimaryAction={() => userId ? navigate(`/chat/${workerId}`) : navigate('/login')}
        onSecondaryAction={() => userId ? navigate(`/chat/${workerId}?msg=Здравствуйте%2C+хотел+бы+запросить+смету`) : navigate('/login')}
        onListingClick={item => {
          if (item.isActiveListing && item.id) {
            navigate(`/listings/${item.id}`);
            return;
          }
          if (item.photos?.length > 0) setLightbox({ photos: item.photos, index: 0 });
        }}
      />
      <PhotoLightbox lightbox={lightbox} setLightbox={setLightbox} />
    </>
  );
}
