import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyDeals, getMyJobRequests } from '../api';
import './CustomerProfilePage.css';

export default function CustomerProfilePage() {
  const { userId, userName, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if worker
  useEffect(() => {
    if (userRole === 'WORKER') {
      navigate('/worker-profile', { replace: true });
    }
  }, [userRole, navigate]);

  const initials = (userName || 'Профиль').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (userRole === 'WORKER') return;
    loadData();
  }, [userId, userRole]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsData, requestsData] = await Promise.all([
        getMyDeals(userId),
        getMyJobRequests(userId),
      ]);
      setDeals(dealsData || []);
      setRequests(requestsData || []);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render if redirecting
  if (userRole === 'WORKER') {
    return null;
  }

  const totalDeals = deals.length;
  const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
  const activeDeals = deals.filter(d => d.status === 'IN_PROGRESS').length;
  const openRequests = requests.filter(r => r.status === 'OPEN').length;

  return (
    <div className="cp-page">
      {/* Header */}
      <div className="cp-header">
        <div className="container">
          <h1 className="cp-header-title">Мой профиль</h1>
          <p className="cp-header-subtitle">Управление заявками и сделками</p>
        </div>
      </div>

      <div className="container">
        {/* Profile Card */}
        <div className="cp-profile-card">
          <div className="cp-profile-left">
            <div className="cp-profile-avatar">{initials}</div>
            <div className="cp-profile-info">
              <div className="cp-profile-name">{userName || 'Заказчик'}</div>
              <div className="cp-profile-role">Заказчик</div>
              <div className="cp-profile-meta">
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
        <div className="cp-stats-grid">
          <div className="cp-stat-card">
            <div className="cp-stat-icon">📋</div>
            <div className="cp-stat-content">
              <div className="cp-stat-num">{totalDeals}</div>
              <div className="cp-stat-label">Всего сделок</div>
            </div>
          </div>
          <div className="cp-stat-card">
            <div className="cp-stat-icon">✅</div>
            <div className="cp-stat-content">
              <div className="cp-stat-num">{completedDeals}</div>
              <div className="cp-stat-label">Завершено</div>
            </div>
          </div>
          <div className="cp-stat-card">
            <div className="cp-stat-icon">🔍</div>
            <div className="cp-stat-content">
              <div className="cp-stat-num">{openRequests}</div>
              <div className="cp-stat-label">Заявок</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="cp-actions-grid">
          <Link to="/categories" className="cp-action-card cp-action-primary">
            <div className="cp-action-icon">🔍</div>
            <div className="cp-action-content">
              <div className="cp-action-title">Найти мастера</div>
              <div className="cp-action-desc">Выберите категорию услуг</div>
            </div>
          </Link>

          <Link to="/deals" className="cp-action-card">
            <div className="cp-action-icon">📋</div>
            <div className="cp-action-content">
              <div className="cp-action-title">Мои сделки</div>
              <div className="cp-action-desc">Активные заказы: {activeDeals}</div>
            </div>
          </Link>

          <Link to="/chat" className="cp-action-card">
            <div className="cp-action-icon">💬</div>
            <div className="cp-action-content">
              <div className="cp-action-title">Сообщения</div>
              <div className="cp-action-desc">Чат с мастерами</div>
            </div>
          </Link>
        </div>

        {/* Recent Deals */}
        {!loading && deals.length > 0 && (
          <div className="cp-section">
            <div className="cp-section-header">
              <h2 className="cp-section-title">Недавние сделки</h2>
              <Link to="/deals" className="cp-section-link">
                Все сделки →
              </Link>
            </div>

            <div className="cp-deals-list">
              {deals.slice(0, 3).map(deal => (
                <Link
                  key={deal.id}
                  to={`/deals?dealId=${deal.id}`}
                  className="cp-deal-item"
                >
                  <div className="cp-deal-header">
                    <div className="cp-deal-title">{deal.title || 'Сделка'}</div>
                    <div
                      className="cp-deal-status"
                      style={{
                        background: deal.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                        color: deal.status === 'COMPLETED' ? '#16a34a' : '#d97706'
                      }}
                    >
                      {deal.status === 'COMPLETED' ? 'Завершена' : 'В работе'}
                    </div>
                  </div>
                  <div className="cp-deal-meta">
                    <span>👤 Мастер: {deal.workerName || 'fff'}</span>
                    {deal.agreedPrice && (
                      <span>💰 {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</span>
                    )}
                  </div>
                  <div className="cp-deal-meta">
                    <span>📅 {new Date(deal.createdAt).toLocaleDateString('ru-RU')}</span>
                    {deal.status === 'COMPLETED' && (
                      <span className="cp-deal-review-badge">✓ Завершена</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="cp-section">
            <div className="cp-loading">
              <div className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
            </div>
          </div>
        )}

        {!loading && deals.length === 0 && (
          <div className="cp-section">
            <div className="cp-empty">
              <span style={{ fontSize: 48 }}>📋</span>
              <h3>Нет сделок</h3>
              <p>Найдите мастера и создайте первую заявку</p>
              <Link to="/categories" className="btn btn-primary">
                Найти мастера
              </Link>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="cp-section">
          <h2 className="cp-section-title">Настройки</h2>

          <div className="cp-settings-grid">
            <Link to="/settings/notifications" className="cp-settings-card">
              <div className="cp-settings-icon">🔔</div>
              <div className="cp-settings-content">
                <div className="cp-settings-title">Уведомления</div>
                <div className="cp-settings-desc">Настройте получение уведомлений о сделках</div>
              </div>
            </Link>

            <Link to="/settings/personal" className="cp-settings-card">
              <div className="cp-settings-icon">👤</div>
              <div className="cp-settings-content">
                <div className="cp-settings-title">Личные данные</div>
                <div className="cp-settings-desc">Измените имя, контактную информацию</div>
              </div>
            </Link>

            <div className="cp-settings-card cp-settings-disabled">
              <div className="cp-settings-icon">💳</div>
              <div className="cp-settings-content">
                <div className="cp-settings-title">Платежные данные</div>
                <div className="cp-settings-desc">Скоро появится</div>
              </div>
              <div className="cp-settings-badge">СКОРО</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}