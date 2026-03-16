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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      // Эти API методы нужно будет создать или использовать существующие
      fetch(`https://svoi-mastera-backend.onrender.com/api/v1/workers/${workerId}/services`).then(r => r.json()),
      // getReviewsByWorker(workerId), // если есть
    ])
      .then(([servicesData]) => {
        setServices(servicesData || []);
        // Берём имя мастера из первого сервиса
        if (servicesData && servicesData.length > 0) {
          setWorker({
            id: workerId,
            name: servicesData[0].workerName || 'Мастер',
            rating: 4.0,
            reviewsCount: 25,
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
              <span className="rating-stars">★★★★☆</span>
              <span className="rating-value">{worker.rating}</span>
              <span className="rating-count">({worker.reviewsCount} отзывов)</span>
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
                        <span className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        <span className="review-date">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
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