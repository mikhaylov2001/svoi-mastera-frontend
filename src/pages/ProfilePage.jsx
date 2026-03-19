import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaBell, FaUser, FaCreditCard, FaClipboardList, FaCheckCircle, FaClock } from 'react-icons/fa';
import { getCustomerProfile, getMyDeals, createReview } from '../api';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const STATUS_MAP = {
  NEW:         { label: 'Новая',     cls: 'badge-new' },
  IN_PROGRESS: { label: 'В работе',  cls: 'badge-progress' },
  COMPLETED:   { label: 'Выполнена', cls: 'badge-done' },
  FAILED:      { label: 'Отменена',  cls: 'badge-failed' },
};

export default function ProfilePage() {
  const { userId, userName, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [deals,   setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // review modal
  const [reviewDeal, setReviewDeal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewStatus, setReviewStatus] = useState('idle');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.allSettled([
      getCustomerProfile(userId),
      getMyDeals(userId),
    ]).then(([profRes, dealsRes]) => {
      if (profRes.status === 'fulfilled') setProfile(profRes.value);
      if (profRes.status === 'rejected') setError('Не удалось загрузить профиль.');

      if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value);
      if (dealsRes.status === 'rejected') setError(prev => prev ? `${prev} Сделки не загружены.` : 'Не удалось загрузить сделки.');

      setLoading(false);
    });
  }, [userId]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = (profile?.displayName || userName || 'Гость')
    .trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const stats = {
    total:     deals.length,
    completed: deals.filter(d => d.status === 'COMPLETED').length,
    active:    deals.filter(d => d.status === 'IN_PROGRESS').length,
  };

  const handleReviewSubmit = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done');
    } catch {
      setReviewStatus('error');
    }
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Мой профиль</h1>
        </div>
      </div>

      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-large">{initials}</div>
          <div className="profile-info">
            <div className="profile-name-large">{profile?.displayName || userName || 'Загрузка…'}</div>
            <div className="profile-role">Заказчик</div>
            <div className="profile-meta">
              {profile?.city && <span className="profile-meta-item"><FaMapMarkerAlt /> {profile.city}</span>}
              {profile?.createdAt && (
                <span className="profile-meta-item">
                  <FaCalendarAlt /> На сервисе с {new Date(profile.createdAt).toLocaleDateString('ru-RU', {year:'numeric', month:'long'})}
                </span>
              )}
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn btn-outline" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="profile-stats-bar">
          {[
            [stats.total, 'Всего сделок', <FaClipboardList />],
            [stats.completed, 'Выполнено', <FaCheckCircle />],
            [stats.active, 'В работе', <FaClock />],
          ].map(([n, l, icon]) => (
            <div className="profile-stat-bar-item" key={l}>
              <span className="profile-stat-bar-icon">{icon}</span>
              <div>
                <div className="profile-stat-bar-num">{n}</div>
                <div className="profile-stat-bar-label">{l}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Быстрые действия */}
        <div className="profile-quick-actions">
          <Link to="/categories" className="quick-action-card quick-action-primary">
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-content">
              <div className="quick-action-title">Найти мастера</div>
              <div className="quick-action-desc">Создайте заявку и получите предложения</div>
            </div>
          </Link>
          <Link to="/deals" className="quick-action-card">
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-content">
              <div className="quick-action-title">Мои сделки</div>
              <div className="quick-action-desc">Все активные и завершённые</div>
            </div>
          </Link>
          <Link to="/chat" className="quick-action-card">
            <div className="quick-action-icon">💬</div>
            <div className="quick-action-content">
              <div className="quick-action-title">Сообщения</div>
              <div className="quick-action-desc">Переписка с мастерами</div>
            </div>
          </Link>
        </div>

        {error && <div className="profile-error">{error}</div>}

        {/* Recent deals */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Последние сделки</h2>
            <Link to="/deals" className="btn btn-ghost btn-sm">Все сделки →</Link>
          </div>

          {loading && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:60,borderRadius:12}} />)}
            </div>
          )}

          {!loading && deals.length === 0 && (
            <div className="profile-empty">
              <FaClipboardList style={{ fontSize: '32px', color: 'var(--gray-300)' }} />
              <p>Сделок пока нет</p>
              <Link to="/categories" className="btn btn-primary btn-sm">Найти мастера</Link>
            </div>
          )}

          {!loading && deals.slice(0, 5).map(deal => {
            const st = STATUS_MAP[deal.status] || { label: deal.status, cls: 'badge-new' };
            // Показываем кнопку отзыва только если:
            // 1. Сделка завершена
            // 2. Есть мастер
            // 3. Ещё НЕ оставлен отзыв
            const canReview = deal.status === 'COMPLETED' && deal.workerName && !deal.hasReview;

            return (
              <div className="profile-deal-row" key={deal.id}>
                <div className="profile-deal-info">
                  <div className="profile-deal-title">{deal.title || 'Задача'}</div>
                  {deal.workerName && <div className="profile-deal-worker"><FaUser /> {deal.workerName}</div>}
                  {deal.description && <div className="profile-deal-desc">{deal.description}</div>}
                  {deal.createdAt && (
                    <div className="profile-deal-date">
                      <FaCalendarAlt /> {new Date(deal.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
                <div className="profile-deal-actions">
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                  {canReview && (
                    <button className="btn btn-outline btn-sm" onClick={() => { setReviewDeal(deal); setReviewForm({rating:5,comment:''}); setReviewStatus('idle'); }}>
                      Оставить отзыв
                    </button>
                  )}
                  {deal.hasReview && (
                    <span className="review-left-badge">✓ Отзыв оставлен</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Settings */}
        <div className="profile-section">
          <h2 className="profile-section-title">Настройки</h2>
          <div className="profile-settings-grid">
            <Link to="/settings/notifications" className="profile-settings-item profile-settings-clickable">
              <FaBell className="profile-settings-icon" />
              <div>
                <div className="profile-settings-title">Уведомления</div>
                <div className="profile-settings-desc">Настройте получение уведомлений о сделках</div>
              </div>
            </Link>
            <Link to="/settings/personal" className="profile-settings-item profile-settings-clickable">
              <FaUser className="profile-settings-icon" />
              <div>
                <div className="profile-settings-title">Личные данные</div>
                <div className="profile-settings-desc">Измените имя, контактную информацию</div>
              </div>
            </Link>
            <div className="profile-settings-item profile-settings-disabled">
              <FaCreditCard className="profile-settings-icon" />
              <div>
                <div className="profile-settings-title">Платежные данные</div>
                <div className="profile-settings-desc">Скоро появится</div>
              </div>
              <span className="settings-badge">Скоро</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewDeal && (
        <div className="modal-overlay" onClick={() => setReviewDeal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            {reviewStatus === 'done' ? (
              <div className="modal-success">
                <span>🎉</span>
                <h3>Отзыв отправлен!</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setReviewDeal(null)}>Закрыть</button>
              </div>
            ) : (
              <>
                <h3 className="modal-title">Оставить отзыв</h3>
                <p className="modal-sub">Мастер: {reviewDeal.workerName}</p>

                <div className="form-field">
                  <label className="form-label">Оценка</label>
                  <div className="rating-row">
                    {[1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        className={`rating-star ${reviewForm.rating >= s ? 'active' : ''}`}
                        onClick={() => setReviewForm({...reviewForm, rating: s})}
                      >★</button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Комментарий</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Расскажите о работе мастера…"
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                  />
                </div>

                {reviewStatus === 'error' && (
                  <div className="cat-form-error">Не удалось отправить отзыв</div>
                )}

                <div style={{display:'flex',gap:10}}>
                  <button className="btn btn-primary" onClick={handleReviewSubmit} disabled={reviewStatus === 'sending'}>
                    {reviewStatus === 'sending' ? 'Отправляем…' : 'Отправить'}
                  </button>
                  <button className="btn btn-outline" onClick={() => setReviewDeal(null)}>Отмена</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
