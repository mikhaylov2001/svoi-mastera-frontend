import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  formatJobRequestBudgetLabel,
  getJobRequestPublishedBudgetNumber,
  hasJobRequestPublishedPrice,
} from '../../utils/jobRequestBudget';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { publicTimeAgo, publicMemberSince } from '../../utils/publicProfileUtils';
import PhotoLightbox from '../../components/PhotoLightbox';
import ProfileShowcase from '../../components/profiles/ProfileShowcase';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';
const COVER_CUSTOMER = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=85';

const OPEN_STATUSES = ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED', 'IN_PROGRESS'];

function ruPlural(n, one, few, many) {
  const m = Math.abs(n) % 100;
  const m1 = m % 10;
  if (m > 10 && m < 20) return many;
  if (m1 === 1) return one;
  if (m1 >= 2 && m1 <= 4) return few;
  return many;
}

function fmtBudget(item) {
  if (item.agreedPrice && Number(item.agreedPrice) > 0) {
    return `${Number(item.agreedPrice).toLocaleString('ru-RU')} ₽`;
  }
  const n = getJobRequestPublishedBudgetNumber(item);
  if (n != null) return `${n.toLocaleString('ru-RU')} ₽`;
  if (hasJobRequestPublishedPrice(item)) return formatJobRequestBudgetLabel(item);
  return 'Договорная';
}

function resolveImg(item) {
  const raw = item.photos?.[0] || null;
  if (raw) {
    if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
    return 'https://svoi-mastera-backend.onrender.com' + raw;
  }
  return getCategoryPlaceholderPhotoUrlOrDefault({
    categoryName: item.categoryName,
    categoryId: item.categoryId,
    category: item.category,
  });
}

export default function PublicCustomerProfilePage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();

  const nameFromQuery = new URLSearchParams(location.search).get('name') || '';

  const [customer, setCustomer] = useState(null);
  const [requests, setRequests] = useState([]);
  const [deals,    setDeals]    = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/customers/${customerId}/profile`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/customers/${customerId}/requests`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/customers/${customerId}/reviews`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/deals`, { headers: { 'X-User-Id': customerId } }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([p, r, rev, d]) => {
      setCustomer(p || { displayName: nameFromQuery || 'Заказчик' });
      setRequests(Array.isArray(r) ? r : []);
      setReviews(Array.isArray(rev) ? rev : []);
      setDeals(Array.isArray(d) ? d.filter(deal => String(deal.customerId) === String(customerId)) : []);
    }).finally(() => setLoading(false));
  }, [customerId]);

  const name     = customer?.displayName || nameFromQuery || 'Заказчик';
  const lastName = customer?.lastName || '';
  const fullName = lastName ? `${name} ${lastName}` : name;
  const since    = publicMemberSince(customer?.registeredAt || customer?.createdAt);

  const openReqs       = useMemo(() => requests.filter(r => OPEN_STATUSES.includes(r.status)), [requests]);
  const completedReqs  = useMemo(() => requests.filter(r => r.status === 'COMPLETED'), [requests]);
  const completedDeals = useMemo(() => deals.filter(d => d.status === 'COMPLETED'), [deals]);
  const completedCount = completedReqs.length || completedDeals.length;
  const total          = customer?.totalRequests ?? requests.length;

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : 0;

  const tags = useMemo(() => {
    const cats = requests.map(r => r.categoryName || r.category).filter(Boolean);
    return [...new Set(cats)].slice(0, 8);
  }, [requests]);

  const profile = useMemo(() => {
    // recent requests as timeline
    const sorted = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const timeline = sorted.slice(0, 3).map(r => ({
      title: r.title || 'Задача',
      text: `${publicTimeAgo(r.createdAt) || ''}${r.categoryName ? ' · ' + r.categoryName : ''}`,
    }));

    // listings items
    const listingItems = [
      ...openReqs.map(r => ({
        id: r.id,
        status: 'active',
        title: r.title || 'Задача',
        price: fmtBudget(r),
        city: customer?.city || '',
        time: publicTimeAgo(r.createdAt),
        image: resolveImg(r),
        photos: r.photos,
      })),
      ...completedReqs.map(r => ({
        id: r.id,
        status: 'completed',
        title: r.title || 'Задача',
        price: fmtBudget(r),
        city: customer?.city || '',
        time: publicTimeAgo(r.createdAt),
        image: resolveImg(r),
        photos: r.photos,
      })),
      ...completedDeals.filter(d => !completedReqs.length).map(d => ({
        id: d.id,
        status: 'completed',
        title: d.title || 'Сделка',
        price: d.agreedPrice ? `${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽` : 'Договорная',
        city: customer?.city || '',
        time: publicTimeAgo(d.createdAt),
        image: resolveImg(d),
        photos: d.photos,
      })),
    ];

    // first review
    const firstRev = reviews[0];
    const revAuthor = firstRev
      ? [firstRev.authorName || firstRev.workerName, firstRev.authorLastName || firstRev.workerLastName].filter(Boolean).join(' ')
      : null;

    const aboutText = customer?.bio || customer?.description || customer?.about ||
      (tags.length > 0
        ? `Публикует задачи по направлениям: ${tags.slice(0, 4).join(', ')}. Указывает бюджет и сроки заранее, что помогает мастерам быстро оценить объём работы.`
        : 'Работает с мастерами через платформу. Все детали обсуждаются в чате перед стартом.');

    return {
      role: customer?.verified ? 'Проверенный заказчик' : 'Заказчик',
      name: fullName,
      headline: tags.length > 0
        ? `Публикует задачи по направлениям: ${tags.slice(0, 3).join(', ')}.`
        : 'Публикует понятные задачи с бюджетом, сроками и быстрым ответом для мастеров.',
      cover: COVER_CUSTOMER,
      avatar: customer?.avatarUrl || null,
      verified: customer?.verified === true,
      meta: [
        customer?.city,
        'Ответ в течение дня',
        since ? `На сервисе с ${since}` : null,
      ].filter(Boolean),

      actionTitle: 'Готов обсудить задачу',
      actionText: 'Напишите заказчику, чтобы уточнить детали заявки и предложить решение.',
      primaryAction: 'Написать',
      secondaryAction: null,

      rating: avgRating > 0 ? avgRating.toFixed(1) : null,
      ratingText: reviews.length > 0
        ? `${reviews.length} ${ruPlural(reviews.length, 'отзыв', 'отзыва', 'отзывов')} от исполнителей`
        : 'Отзывов пока нет',

      facts: [
        { label: 'Активных заявок', value: String(openReqs.length) },
        { label: 'Завершено', value: String(completedCount) },
        { label: 'Город', value: customer?.city || 'Не указан' },
      ],
      stats: [
        { value: String(total), label: 'всего заявок' },
        { value: String(openReqs.length), label: 'активные сейчас' },
        { value: String(completedCount), label: 'завершённые задачи' },
      ],

      aboutKicker: 'О заказчике',
      aboutTitle: tags.length > 0 ? 'Чётко описывает задачи и бюджет' : 'Заказчик на платформе',
      about: aboutText,

      tagsTitle: 'Какие задачи публикует',
      tags,

      timelineKicker: 'Активность',
      timelineTitle: 'Последние заявки',
      timeline: timeline.length > 0 ? timeline : null,

      reviewTitle: firstRev ? (avgRating >= 4.5 ? 'Приятно работать' : 'Отзыв') : null,
      review: firstRev?.text || firstRev?.comment || null,
      reviewAuthor: revAuthor,

      reviews: reviews.slice(0, 3).map(r => ({
        author: [r.authorName || r.workerName, r.authorLastName || r.workerLastName]
          .filter(Boolean).join(' ') || 'Мастер',
        rating: (r.rating || 0).toFixed(1),
        text: r.text || r.comment || '',
      })).filter(r => r.text),

      listings: listingItems,
    };
  }, [customer, requests, reviews, deals, openReqs, completedReqs, completedDeals,
      completedCount, total, avgRating, tags, fullName, since]);

  if (loading) {
    return (
      <div className="pro-loading">
        <div className="pro-loading-icon">⏳</div>
        <p>Загружаем профиль…</p>
      </div>
    );
  }

  return (
    <>
      <ProfileShowcase
        profile={profile}
        onBack={() => navigate(-1)}
        onPrimaryAction={() => userId ? navigate(`/chat/${customerId}`) : navigate('/login')}
        onSecondaryAction={null}
        onListingClick={item => {
          if (item.photos?.length > 0) setLightbox({ photos: item.photos, index: 0 });
        }}
      />
      <PhotoLightbox lightbox={lightbox} setLightbox={setLightbox} />
    </>
  );
}
