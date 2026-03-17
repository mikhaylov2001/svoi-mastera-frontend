import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWorkerProfile, getWorkerServices, getReviewsByWorker } from '../api';
import './PublicWorkerProfile.css';

export default function PublicWorkerProfilePage() {
  const { workerId } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [completedWorks, setCompletedWorks] = useState([]);  // ✅ ДОБАВЛЕНО
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      // Услуги мастера
      fetch(`https://svoi-mastera-backend.onrender.com/api/v1/workers/${workerId}/services`)
        .then(r => r.ok ? r.json() : []),
      // Статистика (рейтинг + количество отзывов)
      fetch(`https://svoi-mastera-backend.onrender.com/api/v1/workers/${workerId}/stats`)
        .then(r => r.ok ? r.json() : { averageRating: 0, reviewsCount: 0 }),
      // Отзывы
      fetch(`https://svoi-mastera-backend.onrender.com/api/v1/reviews/worker/${workerId}`)
        .then(r => r.ok ? r.json() : []),
      // Завершённые работы
      fetch(`https://svoi-mastera-backend.onrender.com/api/v1/workers/${workerId}/completed-works`)
        .then(r => r.ok ? r.json() : []),
    ])
      .then(([servicesData, statsData, reviewsData, completedWorksData]) => {
        setServices(Array.isArray(servicesData) ? servicesData : []);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setCompletedWorks(Array.isArray(completedWorksData) ? completedWorksData : []);

        // Берём имя мастера из первого сервиса
        if (servicesData && servicesData.length > 0) {
          setWorker({
            id: workerId,
            name: servicesData[0].workerName || 'Мастер',
            rating: statsData?.averageRating || 0,
            reviewsCount: statsData?.reviewsCount || 0,
            registeredAt: statsData?.registeredAt || null,  // ✅ ДОБАВЛЕНО
            city: 'Йошкар-Ола',
          });
        } else {
          // Если нет услуг, всё равно создаём профиль
          setWorker({
            id: workerId,
            name: 'Мастер',
            rating: statsData?.averageRating || 0,
            reviewsCount: statsData?.reviewsCount || 0,
            registeredAt: statsData?.registeredAt || null,  // ✅ ДОБАВЛЕНО
            city: 'Йошкар-Ола',
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить профиль мастера');
        setLoading(false);
      });
  }, [workerId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p>Загрузка профиля мастера...</p>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p>{error || 'Мастер не найден'}</p>
        <Link to="/find-master" className="btn btn-primary" style={{ marginTop: 16 }}>
          К поиску мастеров
        </Link>
      </div>
    );
  }

  const initials = (worker.name || 'М')
    .split(' ')
    .map((x) => x[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Генерация звёзд рейтинга
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      '★'.repeat(fullStars) +
      (hasHalfStar ? '½' : '') +
      '☆'.repeat(emptyStars)
    );
  };

  // ✅ ДОБАВЛЕНО: Вычисление стажа работы
  const getExperience = (registeredAt) => {
    if (!registeredAt) return 'Новичок';

    const now = new Date();
    const registered = new Date(registeredAt);
    const diffMs = now - registered;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears >= 1) {
      return `${diffYears} ${diffYears === 1 ? 'год' : diffYears < 5 ? 'года' : 'лет'}`;
    }
    if (diffMonths >= 1) {
      return `${diffMonths} ${diffMonths === 1 ? 'месяц' : diffMonths < 5 ? 'месяца' : 'месяцев'}`;
    }
    if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'неделю' : weeks < 5 ? 'недели' : 'недель'}`;
    }
    return 'Новичок';
  };

  // ✅ ДОБАВЛЕНО: Маппинг бейджей к смайликам
  const badgeIcons = {
    polite: '😊',
    fast: '⚡',
    quality: '💎',
    price: '💰'
  };

  const badgeLabels = {
    polite: 'Вежливый',
    fast: 'Быстро',
    quality: 'Качественно',
    price: 'Цена/качество'
  };

  return (
    <div>
      {/* Хедер */}
      <div className="page-header-bar">
        <div className="container">
          <Link to="/find-master" className="cats-back-link">
            ← Назад к поиску
          </Link>
        </div>
      </div>

      <div className="container">
        <div className="public-worker-layout">

          {/* Карточка мастера */}
          <div className="public-worker-card">
            <div className="public-worker-avatar">{initials}</div>
            <h1 className="public-worker-name">{worker.name}</h1>
            <p className="public-worker-city">📍 {worker.city}</p>

            {/* Рейтинг */}
            <div className="public-worker-rating">
              <span className="rating-stars">{renderStars(worker.rating)}</span>
              <span className="rating-value">{worker.rating.toFixed(1)}</span>
              <span className="rating-count">({worker.reviewsCount} {worker.reviewsCount === 1 ? 'отзыв' : worker.reviewsCount < 5 ? 'отзыва' : 'отзывов'})</span>
            </div>

            {/* ✅ НОВАЯ СЕКЦИЯ: Статистика мастера */}
            <div className="public-worker-stats">
              <div className="pub-stat-item">
                <div className="pub-stat-value">{completedWorks.length}</div>
                <div className="pub-stat-label">Заказов</div>
              </div>
              <div className="pub-stat-item">
                <div className="pub-stat-value">{getExperience(worker.registeredAt)}</div>
                <div className="pub-stat-label">Стаж</div>
              </div>
            </div>

            {/* Бейджи */}
            <div className="public-worker-badges">
              <span className="pub-badge">✓ Проверен</span>
              <span className="pub-badge">⚡ Быстрый отклик</span>
              <span className="pub-badge">🛡️ Гарантия</span>
            </div>

            {/* Кнопки */}
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate(`/chat/${workerId}`)}
            >
              💬 Написать мастеру
            </button>
          </div>

          {/* Основной контент */}
          <div className="public-worker-main">

            {/* Услуги */}
            <div className="public-section">
              <h2 className="public-section-title">Услуги мастера</h2>

              {services.length === 0 ? (
                <p className="empty-text">Мастер пока не добавил услуги</p>
              ) : (
                <div className="public-services-list">
                  {services.map((service) => (
                    <div key={service.id} className="public-service-card">
                      <h3 className="service-title">{service.title}</h3>
                      <p className="service-desc">{service.description}</p>
                      <div className="service-price">
                        {service.priceFrom || service.priceTo
                          ? `от ${service.priceFrom || '-'} до ${service.priceTo || '-'} ₽`
                          : 'Цена по договоренности'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ НОВАЯ СЕКЦИЯ: Выполненные работы */}
            <div className="public-section">
              <h2 className="public-section-title">Выполненные работы ({completedWorks.length})</h2>

              {completedWorks.length === 0 ? (
                <p className="empty-text">История работ пока пуста</p>
              ) : (
                <div className="public-completed-works-list">
                  {completedWorks.map((work) => (
                    <div key={work.id} className="public-work-card">
                      <div className="work-header">
                        <h3 className="work-title">{work.title}</h3>
                        {work.categoryName && (
                          <span className="work-category">{work.categoryName}</span>
                        )}
                      </div>
                      <p className="work-desc">{work.description}</p>
                      <div className="work-footer">
                        <div className="work-client">
                          <span className="work-label">Заказчик:</span> {work.customerName}
                        </div>
                        <div className="work-price">
                          {work.price ? `${work.price} ₽` : 'Договорная'}
                        </div>
                        <div className="work-date">
                          {new Date(work.completedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Отзывы */}
            <div className="public-section">
              <h2 className="public-section-title">Отзывы ({reviews.length})</h2>

              {reviews.length === 0 ? (
                <p className="empty-text">Отзывов пока нет</p>
              ) : (
                <div className="public-reviews-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="public-review-card">
                      <div className="review-header">
                        <span className="review-stars">{renderStars(review.rating)}</span>
                        <span className="review-date">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>

                      {/* ✅ ДОБАВЛЕНО: Бейджи/смайлики */}
                      {review.badges && review.badges.length > 0 && (
                        <div className="review-badges">
                          {review.badges.map((badge) => (
                            <span key={badge} className="review-badge" title={badgeLabels[badge]}>
                              {badgeIcons[badge]} {badgeLabels[badge]}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="review-text">{review.text}</p>
                      <p className="review-author">— {review.authorName || 'Клиент'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
