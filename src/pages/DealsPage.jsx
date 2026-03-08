import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyDeals, completeDeal, initiatePayment } from '../api';
import { useAuth } from '../context/AuthContext';
import './DealsPage.css';

const STATUS_MAP = {
  NEW:         { label: 'Новая',      cls: 'badge-new' },
  IN_PROGRESS: { label: 'В работе',   cls: 'badge-progress' },
  COMPLETED:   { label: 'Выполнена',  cls: 'badge-done' },
  FAILED:      { label: 'Отменена',   cls: 'badge-failed' },
};

function statusInfo(s) { return STATUS_MAP[s] || { label: s, cls: 'badge-new' }; }

export default function DealsPage() {
  const { userId } = useAuth();
  const [deals, setDeals] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null); // dealId

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getMyDeals(userId);
      setDeals(data);
      setStatus('success');
    } catch {
      setError('Не удалось загрузить сделки');
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const counts = {
    ALL:         deals.length,
    NEW:         deals.filter(d => d.status === 'NEW').length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };

  const filtered = filter === 'ALL' ? deals : deals.filter(d => d.status === filter);

  const handleComplete = async (dealId) => {
    setActionLoading(dealId);
    try {
      await completeDeal(userId, dealId);
      await load();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handlePay = async (dealId) => {
    setActionLoading(dealId);
    try {
      const data = await initiatePayment(userId, dealId);
      if (data.confirmationUrl) window.open(data.confirmationUrl, '_blank');
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мои сделки</h1>
          <p>Все задачи и работа с мастерами в одном месте</p>
        </div>
      </div>

      <div className="container">
        <div className="deals-layout">

          {/* SIDEBAR */}
          <aside className="deals-sidebar">
            <div className="deals-sidebar-title">Фильтр</div>
            {[
              ['ALL',         'Все сделки'],
              ['NEW',         'Новые'],
              ['IN_PROGRESS', 'В работе'],
              ['COMPLETED',   'Выполнены'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`deals-filter-btn ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="deals-filter-count">{counts[key] ?? 0}</span>
              </button>
            ))}
          </aside>

          {/* MAIN */}
          <div>
            <div className="deals-list-header">
              <span className="deals-list-count">{filtered.length} сделок</span>
              <Link to="/categories" className="btn btn-primary btn-sm">+ Новая задача</Link>
            </div>

            {status === 'loading' && (
              <div className="deals-list">
                {[1,2,3].map(i => (
                  <div key={i} className="deal-skeleton">
                    <div className="skeleton" style={{width:'55%', height:18, marginBottom:10}} />
                    <div className="skeleton" style={{width:'90%', height:14, marginBottom:6}} />
                    <div className="skeleton" style={{width:'70%', height:14}} />
                  </div>
                ))}
              </div>
            )}

            {status === 'error' && (
              <div className="deals-error-box">
                <p>{error}</p>
                <button className="btn btn-primary btn-sm" onClick={load}>Повторить</button>
              </div>
            )}

            {status === 'success' && filtered.length === 0 && (
              <div className="card empty-state">
                <span className="empty-state-icon">📋</span>
                <h3>Сделок пока нет</h3>
                <p>Создайте первую задачу и получите отклики мастеров</p>
                <Link to="/categories" className="btn btn-primary">Найти мастера</Link>
              </div>
            )}

            {status === 'success' && filtered.length > 0 && (
              <div className="deals-list">
                {filtered.map((deal, i) => {
                  const st = statusInfo(deal.status);
                  return (
                    <div className="deal-card fade-up" key={deal.id} style={{animationDelay:`${i*0.05}s`}}>
                      <div className="deal-card-top">
                        <h3 className="deal-card-title">{deal.title || 'Задача без названия'}</h3>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </div>

                      {deal.description && (
                        <p className="deal-card-desc">{deal.description}</p>
                      )}

                      <div className="deal-card-footer">
                        {deal.workerName && (
                          <span className="deal-card-meta">👤 {deal.workerName}</span>
                        )}
                        <span className="deal-card-meta">🕐 {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('ru-RU') : '—'}</span>
                        <span className="deal-card-price">
                          {deal.agreedPrice != null ? `${Number(deal.agreedPrice).toLocaleString('ru-RU')} ₽` : 'Цена не согласована'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="deal-card-actions">
                        {deal.status === 'IN_PROGRESS' && deal.agreedPrice && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handlePay(deal.id)}
                            disabled={actionLoading === deal.id}
                          >
                            💳 Оплатить
                          </button>
                        )}
                        {deal.status === 'IN_PROGRESS' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleComplete(deal.id)}
                            disabled={actionLoading === deal.id}
                          >
                            ✅ Подтвердить выполнение
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}