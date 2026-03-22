import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyDeals, getReviewsByWorker } from '../api';
import './WorkerProfilePage.css';

export default function WorkerProfilePage() {
  const { userId, userName, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if customer
  useEffect(() => {
    if (userRole === 'CUSTOMER') {
      navigate('/profile', { replace: true });
    }
  }, [userRole, navigate]);

  const initials = (userName || 'Профиль').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (userRole === 'CUSTOMER') return;
    loadData();
  }, [userId, userRole]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsData, reviewsData] = await Promise.all([
        getMyDeals(userId),
        getReviewsByWorker(userId),
      ]);
      setDeals(dealsData || []);
      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Failed to load worker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render if redirecting
  if (userRole === 'CUSTOMER') {
    return null;
  }

  const totalDeals = deals.length;
  const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
  const inProgressDeals = deals.filter(d => d.status === 'IN_PROGRESS').length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="wp-page">
      {/* Header */}
      <div className="wp-header">
        <div className="container">
          <h1 className="wp-header-title">Мой профиль</h1>
        </div>
      </div>

      <div className="container">
        {/* Profile Card */}
        <div className="wp-profile-card">
          <div className="wp-profile-left">
            <div className="wp-profile-avatar">{initials}</div>
            <div className="wp-profile-info">
              <div className="wp-profile-name">{userName || 'Мастер'}</div>
              <div className="wp-profile-role">Мастер</div>
              <div className="wp-profile-meta">
                <span>📍 Йошкар-Ола</span>
                <span>📅 На сервисе с март 2026 г.</span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline">
            Выйти
          </button>
        </div>

        {/* Stats */}
        <div className="wp-stats-grid">
          <div className="wp-stat-card">
            <div className="wp-stat-icon">📋</div>
            <div className="wp-stat-content">
              <div className="wp-stat-num">{totalDeals}</div>
              <div className="wp-stat-label">Всего сделок</div>
            </div>
          </div>
          <div className="wp-stat-card">
            <div className="wp-stat-icon">✅</div>
            <div className="wp-stat-content">
              <div className="wp-stat-num">{completedDeals}</div>
              <div className="wp-stat-label">Выполнено</div>
            </div>
          </div>
          <div className="wp-stat-card">
            <div className="wp-stat-icon">⭐</div>
            <div className="wp-stat-content">
              <div className="wp-stat-num">{avgRating}</div>
              <div className="wp-stat-label">Рейтинг</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="wp-actions-grid">
          <Link to="/find-work" className="wp-action-card wp-action-primary">
            <div className="wp-action-icon">🔍</div>
            <div className="wp-action-content">
              <div className="wp-action-title">Найти работу</div>
              <div className="wp-action-desc">Откликайтесь на заявки и получайте заказы</div>
            </div>
          </Link>

          <Link to="/deals" className="wp-action-card">
            <div className="wp-action-icon">📋</div>
            <div className="wp-action-content">
              <div className="wp-action-title">Мои сделки</div>
              <div className="wp-action-desc">Активных: {inProgressDeals}</div>
            </div>
          </Link>

          <Link to="/chat" className="wp-action-card">
            <div className="wp-action-icon">💬</div>
            <div className="wp-action-content">
              <div className="wp-action-title">Сообщения</div>
              <div className="wp-action-desc">Переписка с заказчиками</div>
            </div>
          </Link>
        </div>

        {/* Recent Deals */}
        {!loading && deals.length > 0 && (
          <div className="wp-section">
            <div className="wp-section-header">
              <h2 className="wp-section-title">Недавние сделки</h2>
              <Link to="/deals" className="wp-section-link">
                Все сделки →
              </Link>
            </div>

            <div className="wp-deals-list">
              {deals.slice(0, 3).map(deal => (
                <Link
                  key={deal.id}
                  to={`/deals?dealId=${deal.id}`}
                  className="wp-deal-item"
                >
                  <div className="wp-deal-header">
                    <div className="wp-deal-title">{deal.title || 'Сделка'}</div>
                    <div
                      className="wp-deal-status"
                      style={{
                        background: deal.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                        color: deal.status === 'COMPLETED' ? '#16a34a' : '#d97706'
                      }}
                    >
                      {deal.status === 'COMPLETED' ? 'Выполнена' : 'В работе'}
                    </div>
                  </div>
                  <div className="wp-deal-meta">
                    <span>👤 {deal.customerName || 'Заказчик'}</span>
                    {deal.agreedPrice && (
                      <span>💰 {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</span>
                    )}
                  </div>
                  <div className="wp-deal-meta">
                    <span>📅 {new Date(deal.createdAt).toLocaleDateString('ru-RU')}</span>
                    {deal.status === 'COMPLETED' && (
                      <span className="wp-deal-review-badge">✓ Завершена</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {!loading && reviews.length > 0 && (
          <div className="wp-section">
            <div className="wp-section-header">
              <h2 className="wp-section-title">Мои отзывы ({reviews.length})</h2>
            </div>

            <div className="wp-reviews-list">
              {reviews.slice(0, 5).map(review => (
                <div key={review.id} className="wp-review-item">
                  <div className="wp-review-header">
                    <div className="wp-review-rating">
                      {'⭐'.repeat(review.rating)}
                    </div>
                    <div className="wp-review-date">
                      {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  {review.text && (
                    <div className="wp-review-text">{review.text}</div>
                  )}
                  <div className="wp-review-author">
                    — {review.customerName || 'Заказчик'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="wp-section">
            <div className="wp-loading">
              <div className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="wp-section">
          <h2 className="wp-section-title">Настройки</h2>

          <div className="wp-settings-grid">
            <Link to="/settings/notifications" className="wp-settings-card">
              <div className="wp-settings-icon">🔔</div>
              <div className="wp-settings-content">
                <div className="wp-settings-title">Уведомления</div>
                <div className="wp-settings-desc">Настройте получение уведомлений о сделках</div>
              </div>
            </Link>

            <Link to="/settings/personal" className="wp-settings-card">
              <div className="wp-settings-icon">👤</div>
              <div className="wp-settings-content">
                <div className="wp-settings-title">Личные данные</div>
                <div className="wp-settings-desc">Измените имя, контактную информацию</div>
              </div>
            </Link>

            <div className="wp-settings-card wp-settings-disabled">
              <div className="wp-settings-icon">💳</div>
              <div className="wp-settings-content">
                <div className="wp-settings-title">Платежные данные</div>
                <div className="wp-settings-desc">Скоро появится</div>
              </div>
              <div className="wp-settings-badge">СКОРО</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}