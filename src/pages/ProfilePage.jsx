import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
          <p>Личный кабинет заказчика</p>
        </div>
      </div>

      <div className="container">
        <div className="profile-layout">

          {/* ─── Sidebar ─── */}
          <aside>
            <div className="profile-card">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-name">{profile?.displayName || userName || 'Загрузка…'}</div>
              <div className="profile-role-badge">Заказчик</div>

              <div className="profile-info-list">
                {profile?.city && (
                  <div className="profile-info-row">
                    <span>📍</span> {profile.city}
                  </div>
                )}
                {profile?.createdAt && (
                  <div className="profile-info-row">
                    <span>📅</span> На сервисе с {new Date(profile.createdAt).toLocaleDateString('ru-RU', {year:'numeric', month:'long'})}
                  </div>
                )}
              </div>

              <button className="btn btn-outline btn-full profile-logout-btn" onClick={handleLogout}>
                Выйти из аккаунта
              </button>
            </div>
          </aside>

          {/* ─── Main ─── */}
          <div className="profile-main">
            {error && <div className="profile-error" style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, marginBottom: 16 }}>{error}</div>}

            {/* Stats */}
            <div className="profile-section fade-up">
              <h2 className="profile-section-title">Статистика</h2>
              <div className="profile-stats-grid">
                {[
                  [stats.total,     'Всего сделок'],
                  [stats.completed, 'Выполнено'],
                  [stats.active,    'В работе'],
                ].map(([n, l]) => (
                  <div className="profile-stat" key={l}>
                    <div className="profile-stat-num">{n}</div>
                    <div className="profile-stat-lbl">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent deals */}
            <div className="profile-section fade-up-1">
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
                  <span>📋</span>
                  <p>Сделок пока нет</p>
                  <Link to="/categories" className="btn btn-primary btn-sm">Найти мастера</Link>
                </div>
              )}

              {!loading && deals.slice(0, 5).map(deal => {
                const st = STATUS_MAP[deal.status] || { label: deal.status, cls: 'badge-new' };
                const canReview = deal.status === 'COMPLETED' && deal.workerName;
                return (
                  <div className="profile-deal-row" key={deal.id}>
                    <div className="profile-deal-info">
                      <div className="profile-deal-title">{deal.title || 'Задача'}</div>
                      {deal.workerName && <div className="profile-deal-worker">👤 {deal.workerName}</div>}
                    </div>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                    {canReview && (
                      <button className="btn btn-outline btn-sm" onClick={() => { setReviewDeal(deal); setReviewForm({rating:5,comment:''}); setReviewStatus('idle'); }}>
                        ✍️ Отзыв
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Settings placeholder */}
            <div className="profile-section fade-up-2">
              <h2 className="profile-section-title">Настройки</h2>
              <div className="profile-note">
                🔔 Уведомления, данные профиля и история платежей появятся здесь в следующем обновлении.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Review Modal ─── */}
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