import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyDeals } from '../api';
import './ActiveClientsPage.css';

const STATUS_MAP = {
  IN_PROGRESS: { label: 'В работе', emoji: '⚙️', color: '#f59e0b' },
  COMPLETED:   { label: 'Завершена', emoji: '✅', color: '#22c55e' },
  NEW:         { label: 'Новая',     emoji: '📋', color: '#6366f1' },
};

export default function ActiveClientsPage() {
  const { userId } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadDeals();
  }, [userId]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await getMyDeals(userId);
      // Фильтруем только сделки где мы - мастер
      const myWorkerDeals = data.filter(d => d.workerId === userId);
      setDeals(myWorkerDeals);
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(d => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_PROGRESS') return d.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return d.status === 'COMPLETED';
    return true;
  });

  const counts = {
    ALL: deals.length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED: deals.filter(d => d.status === 'COMPLETED').length,
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Активные клиенты</h1>
          <p>Ваши текущие заказы и завершённые работы</p>
        </div>
      </div>

      <div className="container">
        <div className="ac-page">
          {/* Фильтры */}
          <div className="ac-filters">
            <button
              className={`ac-filter ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              Все <span className="ac-filter-count">{counts.ALL}</span>
            </button>
            <button
              className={`ac-filter ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setFilter('IN_PROGRESS')}
            >
              В работе <span className="ac-filter-count">{counts.IN_PROGRESS}</span>
            </button>
            <button
              className={`ac-filter ${filter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setFilter('COMPLETED')}
            >
              Завершены <span className="ac-filter-count">{counts.COMPLETED}</span>
            </button>
          </div>

          {/* Список */}
          {loading && (
            <div className="ac-loading">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
              ))}
            </div>
          )}

          {!loading && filteredDeals.length === 0 && (
            <div className="ac-empty">
              <span style={{ fontSize: 48 }}>👥</span>
              <h3>Нет клиентов</h3>
              <p>Откликайтесь на заявки чтобы получить заказы</p>
              <Link to="/find-work" className="btn btn-primary">
                Найти работу
              </Link>
            </div>
          )}

          <div className="ac-list">
            {filteredDeals.map(deal => {
              const st = STATUS_MAP[deal.status] || { label: deal.status, emoji: '📋', color: '#9ca3af' };
              const isInProgress = deal.status === 'IN_PROGRESS';
              const customerConfirmed = deal.customerConfirmed;
              const workerConfirmed = deal.workerConfirmed;

              return (
                <div key={deal.id} className="ac-card">
                  <div className="ac-card-header">
                    <div className="ac-client-info">
                      <div className="ac-client-avatar">
                        {deal.customerName?.[0]?.toUpperCase() || 'К'}
                      </div>
                      <div>
                        <div className="ac-client-name">{deal.customerName || 'Клиент'}</div>
                        <div className="ac-deal-title">{deal.title || 'Заказ'}</div>
                      </div>
                    </div>
                    <div
                      className="ac-status-badge"
                      style={{ background: `${st.color}22`, color: st.color }}
                    >
                      {st.emoji} {st.label}
                    </div>
                  </div>

                  {deal.description && (
                    <div className="ac-deal-desc">{deal.description}</div>
                  )}

                  <div className="ac-deal-meta">
                    {deal.category && <span>📂 {deal.category}</span>}
                    {deal.agreedPrice && (
                      <span className="ac-price">💰 {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽</span>
                    )}
                    {deal.createdAt && (
                      <span>📅 {new Date(deal.createdAt).toLocaleDateString('ru-RU')}</span>
                    )}
                  </div>

                  {/* Прогресс подтверждения */}
                  {isInProgress && (
                    <div className="ac-progress">
                      <div className={`ac-progress-item ${customerConfirmed ? 'done' : ''}`}>
                        {customerConfirmed ? '✅' : '⏳'} Заказчик
                      </div>
                      <div className="ac-progress-arrow">→</div>
                      <div className={`ac-progress-item ${workerConfirmed ? 'done' : ''}`}>
                        {workerConfirmed ? '✅' : '⏳'} Вы
                      </div>
                    </div>
                  )}

                  {/* Действия */}
                  <div className="ac-actions">
                    <Link
                      to={`/deals`}
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        // Открываем детали сделки
                        window.location.href = `/deals?dealId=${deal.id}`;
                      }}
                    >
                      Подробнее
                    </Link>
                    <Link
                      to={`/chat/${deal.customerId}`}
                      className="btn btn-primary btn-sm"
                    >
                      💬 Написать
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}