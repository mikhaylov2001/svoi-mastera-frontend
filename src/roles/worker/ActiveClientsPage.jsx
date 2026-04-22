import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyDeals } from '../../api';
import './ActiveClientsPage.css';

const STATUS_MAP = {
  IN_PROGRESS: { label: 'В работе',  emoji: '⚙️',  color: '#f59e0b', bg: '#fef3c7' },
  COMPLETED:   { label: 'Завершена', emoji: '✅',  color: '#22c55e', bg: '#dcfce7' },
  NEW:         { label: 'Новая',     emoji: '📋',  color: '#6366f1', bg: '#eef2ff' },
};

const CATEGORY_STYLES = {
  'Компьютерная помощь': { emoji: '💻', color: '#e8f5e9' },
  'Ремонт квартир':      { emoji: '🏠', color: '#fff3e0' },
  'Сантехника':          { emoji: '🔧', color: '#e3f2fd' },
  'Электрика':           { emoji: '⚡', color: '#fffde7' },
  'Уборка':              { emoji: '🧹', color: '#fce4ec' },
  'Парикмахер':          { emoji: '💇', color: '#fce4ec' },
  'Маникюр и педикюр':   { emoji: '💅', color: '#fce4ec' },
  'Красота и здоровье':  { emoji: '✨', color: '#f3e5f5' },
  'Репетиторство':       { emoji: '📚', color: '#e3f2fd' },
};

function DealCard({ deal, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_MAP[deal.status] || { label: deal.status, emoji: '📋', color: '#9ca3af', bg: '#f3f4f6' };
  const isInProgress = deal.status === 'IN_PROGRESS';
  const isCompleted  = deal.status === 'COMPLETED';

  return (
    <div className={`ac-card ${expanded ? 'ac-card-expanded' : ''}`}>
      {/* Левая цветная полоска статуса */}
      <div className="ac-card-stripe" style={{ background: st.color }} />

      <div className="ac-card-inner">
        {/* ── Шапка ── */}
        <div className="ac-card-header">
          <div className="ac-client-info">
            <div className="ac-client-avatar">
              {deal.customerName?.[0]?.toUpperCase() || 'К'}
            </div>
            <div className="ac-client-details">
              <div className="ac-client-name">{deal.customerName || 'Клиент'}</div>
              <div className="ac-deal-title">{deal.title || 'Заказ'}</div>
            </div>
          </div>

          <div className="ac-card-header-right">
            <div className="ac-status-badge" style={{ background: st.bg, color: st.color }}>
              {st.emoji} {st.label}
            </div>
            {deal.agreedPrice && (
              <div className="ac-price-badge">
                {Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽
              </div>
            )}
          </div>
        </div>

        {/* ── Мета ── */}
        <div className="ac-deal-meta">
          {deal.category && (
            <span className="ac-meta-chip">
              {CATEGORY_STYLES[deal.category]?.emoji || '📂'} {deal.category}
            </span>
          )}
          {deal.createdAt && (
            <span className="ac-meta-chip">
              📅 {new Date(deal.createdAt).toLocaleDateString('ru-RU')}
            </span>
          )}
          {isCompleted && deal.completedAt && (
            <span className="ac-meta-chip ac-meta-green">
              ✅ Завершена {new Date(deal.completedAt).toLocaleDateString('ru-RU')}
            </span>
          )}
        </div>

        {/* ── Описание (раскрывается) ── */}
        {deal.description && (
          <div className={`ac-deal-desc ${expanded ? 'ac-deal-desc-full' : ''}`}>
            {deal.description}
          </div>
        )}

        {/* ── Прогресс подтверждения ── */}
        {isInProgress && (
          <div className="ac-progress">
            <div className={`ac-progress-item ${deal.customerConfirmed ? 'done' : ''}`}>
              <span className="ac-progress-icon">{deal.customerConfirmed ? '✅' : '⏳'}</span>
              <span>Заказчик</span>
              <span className="ac-progress-sub">
                {deal.customerConfirmed ? 'подтвердил' : 'ожидает'}
              </span>
            </div>
            <div className="ac-progress-line">
              <div className={`ac-progress-line-fill ${deal.customerConfirmed && deal.workerConfirmed ? 'full' : deal.customerConfirmed ? 'half' : ''}`} />
            </div>
            <div className={`ac-progress-item ${deal.workerConfirmed ? 'done' : ''}`}>
              <span className="ac-progress-icon">{deal.workerConfirmed ? '✅' : '⏳'}</span>
              <span>Вы</span>
              <span className="ac-progress-sub">
                {deal.workerConfirmed ? 'подтвердили' : 'ожидает'}
              </span>
            </div>
          </div>
        )}

        {/* ── Раскрытые детали ── */}
        {expanded && (
          <div className="ac-expanded-details">
            <div className="ac-detail-row">
              <div className="ac-detail-block">
                <div className="ac-detail-label">👤 Заказчик</div>
                <div className="ac-detail-value">{deal.customerName || '—'}</div>
              </div>
              <div className="ac-detail-block">
                <div className="ac-detail-label">🔨 Мастер</div>
                <div className="ac-detail-value">{deal.workerName || 'Вы'}</div>
              </div>
              <div className="ac-detail-block">
                <div className="ac-detail-label">💰 Сумма</div>
                <div className="ac-detail-value ac-detail-price">
                  {deal.agreedPrice
                    ? `${Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽`
                    : '—'}
                </div>
              </div>
              <div className="ac-detail-block">
                <div className="ac-detail-label">📋 Статус</div>
                <div className="ac-detail-value" style={{ color: st.color }}>{st.label}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Действия ── */}
        <div className="ac-actions">
          <button
            className="ac-expand-btn"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? '▲ Скрыть' : '▼ Подробнее'}
          </button>

          <div className="ac-actions-right">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { window.location.href = `/deals?dealId=${deal.id}`; }}
            >
              📄 Сделка
            </button>
            <Link
              to={`/chat/${deal.customerId}`}
              className="btn btn-primary btn-sm"
            >
              💬 Написать
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActiveClientsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'category'

  useEffect(() => { loadDeals(); }, [userId]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await getMyDeals(userId);
      setDeals(data.filter(d => d.workerId === userId));
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter(d => {
    if (filter === 'IN_PROGRESS') return d.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED')   return d.status === 'COMPLETED';
    return true;
  });

  const counts = {
    ALL:         deals.length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

  // Группировка по категориям
  const grouped = filteredDeals.reduce((acc, deal) => {
    const key = deal.category || 'Без категории';
    if (!acc[key]) acc[key] = [];
    acc[key].push(deal);
    return acc;
  }, {});

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

          {/* ── Тулбар ── */}
          <div className="ac-toolbar">
            {/* Фильтры */}
            <div className="ac-filters">
              {[
                ['ALL',         'Все'],
                ['IN_PROGRESS', 'В работе'],
                ['COMPLETED',   'Завершены'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`ac-filter ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                  <span className="ac-filter-count">{counts[key]}</span>
                </button>
              ))}
            </div>

            {/* Переключатель группировки */}
            <div className="ac-group-toggle">
              <button
                className={`ac-group-btn ${groupBy === 'none' ? 'active' : ''}`}
                onClick={() => setGroupBy('none')}
                title="Список"
              >
                ☰ Список
              </button>
              <button
                className={`ac-group-btn ${groupBy === 'category' ? 'active' : ''}`}
                onClick={() => setGroupBy('category')}
                title="По категориям"
              >
                🗂️ По категориям
              </button>
            </div>
          </div>

          {/* ── Загрузка ── */}
          {loading && (
            <div className="ac-loading">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />
              ))}
            </div>
          )}

          {/* ── Пусто ── */}
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

          {/* ── Список (без группировки) ── */}
          {!loading && filteredDeals.length > 0 && groupBy === 'none' && (
            <div className="ac-list">
              {filteredDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} navigate={navigate} />
              ))}
            </div>
          )}

          {/* ── По категориям ── */}
          {!loading && filteredDeals.length > 0 && groupBy === 'category' && (
            <div className="ac-categories">
              {Object.entries(grouped).map(([category, catDeals]) => {
                const catStyle = CATEGORY_STYLES[category] || { emoji: '📋', color: '#f3f4f6' };
                return (
                  <div key={category} className="ac-category-group">
                    <div className="ac-category-header">
                      <div className="ac-category-icon" style={{ background: catStyle.color }}>
                        {catStyle.emoji}
                      </div>
                      <h3 className="ac-category-name">{category}</h3>
                      <span className="ac-category-count">{catDeals.length}</span>
                    </div>
                    <div className="ac-list">
                      {catDeals.map(deal => (
                        <DealCard key={deal.id} deal={deal} navigate={navigate} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}