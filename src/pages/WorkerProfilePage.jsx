import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyDeals, getOpenJobRequestsForWorker } from '../api';
import './WorkerProfilePage.css';

export default function WorkerProfilePage() {
  const { userId, userName, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'deals', 'reviews'

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
      const [dealsData, requestsData] = await Promise.all([
        getMyDeals(userId),
        getOpenJobRequestsForWorker(userId),
      ]);
      setDeals(dealsData || []);
      setRequests(requestsData || []);
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

  const activeDeals = deals.filter(d => d.status === 'IN_PROGRESS').length;
  const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
  const openRequests = requests.filter(r => r.status === 'OPEN').length;

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Кабинет мастера</h1>
          <p>Заявки от заказчиков и ваш рейтинг</p>
        </div>
      </div>

      <div className="container">
        <div className="wp-layout">
          {/* Sidebar */}
          <div className="wp-card">
            <div className="wp-avatar">{initials}</div>
            <div className="wp-name">{userName || 'Мастер'}</div>
            <div className="wp-role-badge">Мастер</div>

            <div className="wp-stats">
              <div className="wp-stat">
                <div className="wp-stat-num">{activeDeals}</div>
                <div className="wp-stat-lbl">В работе</div>
              </div>
              <div className="wp-stat">
                <div className="wp-stat-num">{completedDeals}</div>
                <div className="wp-stat-lbl">Завершено</div>
              </div>
              <div className="wp-stat">
                <div className="wp-stat-num">{openRequests}</div>
                <div className="wp-stat-lbl">Открытых</div>
              </div>
            </div>

            <Link to="/settings/personal" className="btn btn-outline btn-block">
              ⚙️ Настройки
            </Link>
            <button onClick={handleLogout} className="btn btn-outline btn-block wp-logout-btn">
              Выйти
            </button>
          </div>

          {/* Main content */}
          <div className="wp-main">
            {/* Tabs */}
            <div className="wp-tabs">
              <button
                className={`wp-tab ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                📋 Открытые заявки
                {openRequests > 0 && <span className="wp-tab-badge">{openRequests}</span>}
              </button>
              <button
                className={`wp-tab ${activeTab === 'deals' ? 'active' : ''}`}
                onClick={() => setActiveTab('deals')}
              >
                🤝 Мои сделки
                {activeDeals > 0 && <span className="wp-tab-badge">{activeDeals}</span>}
              </button>
              <button
                className={`wp-tab ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                ⭐ Мои отзывы
              </button>
            </div>

            {/* Tab Content */}
            <div className="wp-tab-content">
              {/* Открытые заявки */}
              {activeTab === 'requests' && (
                <>
                  {loading && (
                    <div className="wp-loading">
                      <div className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
                    </div>
                  )}

                  {!loading && requests.length === 0 && (
                    <div className="wp-empty">
                      <span style={{ fontSize: 48 }}>📋</span>
                      <h3>Нет открытых заявок</h3>
                      <p>Новые заявки появятся здесь автоматически</p>
                      <Link to="/find-work" className="btn btn-primary">
                        Найти работу
                      </Link>
                    </div>
                  )}

                  {!loading && requests.length > 0 && (
                    <div className="wp-requests-list">
                      {requests.slice(0, 10).map(req => (
                        <div key={req.id} className="wp-request-card">
                          <div className="wp-request-header">
                            <div className="wp-request-title">{req.title || 'Заявка'}</div>
                            {req.budgetTo && (
                              <div className="wp-request-price">
                                до {Number(req.budgetTo).toLocaleString('ru-RU')} ₽
                              </div>
                            )}
                          </div>
                          {req.description && (
                            <div className="wp-request-desc">{req.description}</div>
                          )}
                          <div className="wp-request-meta">
                            {req.categoryName && <span>📂 {req.categoryName}</span>}
                            {req.addressText && <span>📍 {req.addressText}</span>}
                            {req.createdAt && (
                              <span>
                                🕒 {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                              </span>
                            )}
                          </div>
                          <div className="wp-request-actions">
                            <Link
                              to={`/find-work?requestId=${req.id}`}
                              className="btn btn-primary btn-sm"
                            >
                              Откликнуться
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Мои сделки */}
              {activeTab === 'deals' && (
                <>
                  {loading && (
                    <div className="wp-loading">
                      <div className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
                    </div>
                  )}

                  {!loading && deals.length === 0 && (
                    <div className="wp-empty">
                      <span style={{ fontSize: 48 }}>🤝</span>
                      <h3>Нет сделок</h3>
                      <p>Откликайтесь на заявки чтобы получить заказы</p>
                      <Link to="/find-work" className="btn btn-primary">
                        Найти работу
                      </Link>
                    </div>
                  )}

                  {!loading && deals.length > 0 && (
                    <div className="wp-deals-list">
                      {deals.slice(0, 10).map(deal => (
                        <Link
                          key={deal.id}
                          to={`/deals?dealId=${deal.id}`}
                          className="wp-deal-card"
                        >
                          <div className="wp-deal-title">{deal.title || 'Сделка'}</div>
                          <div className="wp-deal-meta">
                            {deal.customerName && <span>Заказчик: {deal.customerName}</span>}
                            {deal.agreedPrice && (
                              <span className="wp-deal-price">
                                {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽
                              </span>
                            )}
                          </div>
                          <div
                            className="wp-deal-status"
                            style={{
                              background: deal.status === 'COMPLETED' ? '#dcfce7' :
                                         deal.status === 'IN_PROGRESS' ? '#fef3c7' : '#e0e7ff',
                              color: deal.status === 'COMPLETED' ? '#16a34a' :
                                     deal.status === 'IN_PROGRESS' ? '#d97706' : '#4f46e5'
                            }}
                          >
                            {deal.status === 'COMPLETED' ? '✅ Завершена' :
                             deal.status === 'IN_PROGRESS' ? '⚙️ В работе' : '📋 Новая'}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Мои отзывы */}
              {activeTab === 'reviews' && (
                <div className="wp-empty">
                  <span style={{ fontSize: 48 }}>⭐</span>
                  <h3>Отзывы появятся после завершения сделок</h3>
                  <p>Качественно выполняйте работу чтобы получать положительные отзывы</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}