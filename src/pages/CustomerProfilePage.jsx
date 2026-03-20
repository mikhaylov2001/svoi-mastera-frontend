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

  // Redirect if worker - BEFORE loading data!
  useEffect(() => {
    if (userRole === 'WORKER') {
      navigate('/worker-profile', { replace: true });
    }
  }, [userRole, navigate]);

  const initials = (userName || 'Профиль').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);

  useEffect(() => {
    // Don't load data if user is a worker
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

  // Don't render anything if redirecting
  if (userRole === 'WORKER') {
    return null;
  }

  const activeDeals = deals.filter(d => d.status === 'IN_PROGRESS').length;
  const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
  const openRequests = requests.filter(r => r.status === 'OPEN').length;

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мой профиль</h1>
          <p>Управление заявками и сделками</p>
        </div>
      </div>

      <div className="container">
        <div className="cp-layout">
          {/* Sidebar */}
          <div className="cp-card">
            <div className="cp-avatar">{initials}</div>
            <div className="cp-name">{userName || 'Профиль'}</div>
            <div className="cp-role-badge">Заказчик</div>

            <div className="cp-stats">
              <div className="cp-stat">
                <div className="cp-stat-num">{activeDeals}</div>
                <div className="cp-stat-lbl">Активных</div>
              </div>
              <div className="cp-stat">
                <div className="cp-stat-num">{completedDeals}</div>
                <div className="cp-stat-lbl">Завершено</div>
              </div>
              <div className="cp-stat">
                <div className="cp-stat-num">{openRequests}</div>
                <div className="cp-stat-lbl">Заявок</div>
              </div>
            </div>

            <Link to="/settings/personal" className="btn btn-outline btn-block">
              ⚙️ Настройки
            </Link>
            <button onClick={handleLogout} className="btn btn-outline btn-block cp-logout-btn">
              Выйти
            </button>
          </div>

          {/* Main content */}
          <div className="cp-main">
            <h2 className="cp-section-title">Быстрые действия</h2>

            <div className="cp-actions">
              <Link to="/categories" className="cp-action-card">
                <span className="cp-action-icon">🔍</span>
                <div>
                  <div className="cp-action-title">Найти мастера</div>
                  <div className="cp-action-desc">Выберите категорию услуг</div>
                </div>
              </Link>

              <Link to="/deals" className="cp-action-card">
                <span className="cp-action-icon">📋</span>
                <div>
                  <div className="cp-action-title">Мои сделки</div>
                  <div className="cp-action-desc">Активные заказы: {activeDeals}</div>
                </div>
              </Link>

              <Link to="/chat" className="cp-action-card">
                <span className="cp-action-icon">💬</span>
                <div>
                  <div className="cp-action-title">Сообщения</div>
                  <div className="cp-action-desc">Чат с мастерами</div>
                </div>
              </Link>
            </div>

            {/* Recent deals */}
            {!loading && deals.length > 0 && (
              <>
                <h2 className="cp-section-title">Недавние сделки</h2>
                <div className="cp-deals-list">
                  {deals.slice(0, 3).map(deal => (
                    <Link
                      key={deal.id}
                      to={`/deals?dealId=${deal.id}`}
                      className="cp-deal-card"
                    >
                      <div className="cp-deal-title">{deal.title || 'Сделка'}</div>
                      <div className="cp-deal-meta">
                        {deal.workerName && <span>Мастер: {deal.workerName}</span>}
                        {deal.agreedPrice && (
                          <span className="cp-deal-price">
                            {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽
                          </span>
                        )}
                      </div>
                      <div
                        className="cp-deal-status"
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
              </>
            )}

            {loading && (
              <div className="cp-loading">
                <div className="skeleton" style={{ height: 80, borderRadius: 16, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 80, borderRadius: 16, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 80, borderRadius: 16 }} />
              </div>
            )}

            {!loading && deals.length === 0 && (
              <div className="cp-empty">
                <span style={{ fontSize: 48 }}>📋</span>
                <h3>Нет сделок</h3>
                <p>Найдите мастера и создайте первую заявку</p>
                <Link to="/categories" className="btn btn-primary">
                  Найти мастера
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}