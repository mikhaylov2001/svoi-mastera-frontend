import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import {
  publicTimeAgo,
  publicMemberSince,
  publicReviewsLabel,
  publicStarsRow,
  publicFirstName,
} from '../../utils/publicProfileUtils';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';
import PhotoLightbox from '../../components/PhotoLightbox';
import '../../styles/publicProfilePage.css';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const MSG_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M8 1.75a3.25 3.25 0 00-3.25 3.25c0 2.44 3.25 6 3.25 6s3.25-3.56 3.25-6A3.25 3.25 0 008 1.75z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <circle cx="8" cy="5" r="1" fill="currentColor" />
  </svg>
);

const LISTING_PIN = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M8 1.75a3.25 3.25 0 00-3.25 3.25c0 2.44 3.25 6 3.25 6s3.25-3.56 3.25-6A3.25 3.25 0 008 1.75z"
      stroke="#9ca3af"
      strokeWidth="1.2"
    />
    <circle cx="8" cy="5" r="1" fill="#9ca3af" />
  </svg>
);

const PAGE_SIZE = 8;

function TabButton({ active, label, count, onClick }) {
  return (
    <button type="button" className={`pw-tab${active ? ' active' : ''}`} onClick={onClick}>
      {label}
      {count > 0 ? <span className="pw-tab-count">{count}</span> : null}
    </button>
  );
}

export default function PublicWorkerProfilePage() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();

  const [worker, setWorker] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [completedWorks, setCompletedWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [page, setPage] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!workerId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/workers/${workerId}/listings`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/workers/${workerId}/stats`).then((r) => (r.ok ? r.json() : {})),
      fetch(`${API}/workers/${workerId}/reviews`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/workers/${workerId}/completed-works`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([svc, stats, rev, works]) => {
        setServices(Array.isArray(svc) ? svc : []);
        setReviews(Array.isArray(rev) ? rev.filter((r) => r.status === 'APPROVED') : []);
        setCompletedWorks(Array.isArray(works) ? works : []);
        setWorker({
          name: stats?.displayName || 'Мастер',
          lastName: stats?.lastName || '',
          avatarUrl: stats?.avatarUrl || null,
          city: stats?.city || 'Йошкар-Ола',
          rating: stats?.averageRating || 0,
          reviewsCount: Number(stats?.reviewsCount) || 0,
          completedCount: Number(stats?.completedWorksCount) || 0,
          registeredAt: stats?.registeredAt || null,
          verified: stats?.verified === true,
        });
      })
      .catch(() => {
        setWorker({ name: 'Мастер', lastName: '', city: 'Йошкар-Ола', rating: 0, reviewsCount: 0, verified: false });
      })
      .finally(() => setLoading(false));
  }, [workerId]);

  useEffect(() => {
    if (loading) return;
    if (location.hash !== '#reviews') return;
    const timer = window.setTimeout(() => {
      document.getElementById('pw-reviews-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [loading, location.hash, workerId]);

  if (loading) {
    return (
      <div className="pw-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
          <p>Загружаем профиль...</p>
        </div>
      </div>
    );
  }

  const fullName = [worker?.name, worker?.lastName].filter(Boolean).join(' ');
  const initials = fullName.split(' ').map((x) => x[0] || '').join('').toUpperCase().slice(0, 2) || '?';
  const since = publicMemberSince(worker?.registeredAt);
  const reviewsCountDisplay = worker?.reviewsCount ?? reviews.length;
  const closedCount = worker?.completedCount ?? completedWorks.length;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
      : worker?.rating > 0
        ? Number(worker.rating)
        : 0;
  const avgRatingDisplay = avgRating > 0 ? avgRating.toFixed(1) : '0.0';

  const starCounts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length);
  const reviewsTotal = reviews.length || 1;

  const tabItems = tab === 'active' ? services : completedWorks;
  const totalPages = Math.ceil(tabItems.length / PAGE_SIZE);
  const pageItems = tabItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const switchTab = (t) => {
    setTab(t);
    setPage(0);
  };

  const renderListing = (item) => {
    const hasPhoto = item.photos && item.photos.length > 0;
    const price = getListingPublishedPriceNumber(item);
    const photoSrc = hasPhoto
      ? item.photos[0]
      : getCategoryPlaceholderPhotoUrlOrDefault({ category: item.category });
    const when = publicTimeAgo(item.createdAt || item.completedAt);
    const isActive = tab === 'active';

    return (
      <article
        key={item.id || item.title}
        className="pw-listing-card"
        onClick={() => {
          if (isActive && item.id) {
            navigate(`/listings/${item.id}`);
            return;
          }
          if (hasPhoto) setLightbox({ photos: item.photos, index: 0 });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && isActive && item.id) navigate(`/listings/${item.id}`);
        }}
        role="button"
        tabIndex={0}
      >
        <div className="pw-listing-img">
          {hasPhoto ? (
            <img src={photoSrc} alt="" />
          ) : (
            <div className="pw-listing-placeholder">🛠️</div>
          )}
          <span className={isActive ? 'pw-listing-badge-open' : 'pw-listing-badge-done'}>
            {isActive ? 'Открыта' : 'Завершено'}
          </span>
          {isActive && item.id ? (
            <div className="pw-listing-fav" onClick={(e) => e.stopPropagation()}>
              <FavoriteHeartButton kind="listing" id={item.id} />
            </div>
          ) : null}
        </div>
        <div className="pw-listing-body">
          <h3 className="pw-listing-title">{item.title || 'Без названия'}</h3>
          <div className="pw-listing-price">
            {price ? (
              <>
                {Number(price).toLocaleString('ru-RU')} ₽
                {item.priceUnit ? ` ${item.priceUnit}` : ''}
              </>
            ) : (
              <span className="pw-listing-price-muted">Договорная</span>
            )}
          </div>
          <div className="pw-listing-meta">
            <div className="pw-listing-loc">
              {LISTING_PIN}
              {worker?.city || 'Йошкар-Ола'}
            </div>
            {when ? <div className="pw-listing-when">{when}</div> : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="pw-page">
      <div className="pw-wrap">
        <button type="button" className="pw-back" onClick={() => navigate(-1)}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Назад
        </button>

        <div className="pw-layout">
          <div className="pw-sidebar-wrap">
            <aside className="pw-sidebar-card">
              <div className="pw-sidebar-inner">
                <div className="pw-avatar-wrap">
                  {worker?.avatarUrl ? (
                    <img src={worker.avatarUrl} alt={fullName} className="pw-avatar" />
                  ) : (
                    <div className="pw-avatar-fb">{initials}</div>
                  )}
                </div>

                <h1 className="pw-name">{fullName}</h1>

                {reviewsCountDisplay > 0 ? (
                  <div className="pw-rating-inline">
                    <span className="pw-stars" aria-hidden>
                      {publicStarsRow(avgRating)}
                    </span>
                    <span className="pw-rating-num-bold">{avgRatingDisplay.replace('.', ',')}</span>
                    <span className="pw-rating-count-muted">({publicReviewsLabel(reviewsCountDisplay)})</span>
                  </div>
                ) : (
                  <div className="pw-no-reviews">Отзывов пока нет</div>
                )}

                {since ? <p className="pw-meta-since">{since}</p> : null}

                <div className="pw-city-pill">
                  {PIN_ICON}
                  {worker?.city || 'Йошкар-Ола'}
                </div>

                {worker?.verified === true ? (
                  <div className="pw-badge-verified">✓ Документы проверены</div>
                ) : null}

                <p className="pw-responds">Отвечает в течение дня</p>

                <div className="pw-stats-strip">
                  <div className="pw-strip-cell">
                    <div className="pw-strip-num">{services.length}</div>
                    <span className="pw-strip-lbl">заявок</span>
                  </div>
                  <div className="pw-strip-cell">
                    <div className="pw-strip-num">{closedCount}</div>
                    <span className="pw-strip-lbl">закрыто</span>
                  </div>
                  <div className="pw-strip-cell">
                    <div className="pw-strip-num">{reviewsCountDisplay}</div>
                    <span className="pw-strip-lbl">отзывов</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="pw-btn-msg"
                  onClick={() => (userId ? navigate(`/chat/${workerId}`) : navigate('/login'))}
                >
                  {MSG_ICON}
                  Написать
                </button>
              </div>
            </aside>
          </div>

          <div className="pw-main">
            <div className="pw-tabs">
              <TabButton active={tab === 'active'} label="Активные" count={services.length} onClick={() => switchTab('active')} />
              <TabButton
                active={tab === 'completed'}
                label="Завершённые"
                count={completedWorks.length}
                onClick={() => switchTab('completed')}
              />
            </div>

            {pageItems.length === 0 ? (
              <div className="pw-empty">
                <div className="pw-empty-ico">{tab === 'active' ? '📋' : '✅'}</div>
                <p>Объявлений пока нет</p>
              </div>
            ) : (
              <>
                <div className="pw-listings-grid">{pageItems.map(renderListing)}</div>
                {totalPages > 1 && (
                  <div className="pw-pagination">
                    <button type="button" className="pw-pag-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      ‹
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`pw-pag-num${i === page ? ' active' : ''}`}
                        onClick={() => setPage(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="pw-pag-btn"
                      disabled={page === totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="pw-reviews-card" id="pw-reviews-anchor">
              <h2 className="pw-reviews-heading">Отзывы о {publicFirstName(fullName)}</h2>

              <div className="pw-rating-block">
                <div className="pw-rating-left">
                  <div className="pw-rating-big">{avgRatingDisplay.replace('.', ',')}</div>
                  <div className="pw-rating-stars-big" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < Math.round(avgRating) ? '#f59e0b' : '#e5e7eb' }}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="pw-rating-hint">{reviews.length > 0 ? 'рейтинг' : 'рейтинг пока нет'}</div>
                </div>
                <div className="pw-rating-bars">
                  {[5, 4, 3, 2, 1].map((s, idx) => (
                    <div className="pw-bar-row" key={s}>
                      <span className="pw-bar-stars">{'★'.repeat(s)}</span>
                      <div className="pw-bar-track">
                        <div
                          className="pw-bar-fill"
                          style={{ width: reviews.length > 0 ? `${(starCounts[idx] / reviewsTotal) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="pw-bar-cnt">{starCounts[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="pw-reviews-empty">Отзывов пока нет</p>
              ) : (
                <div className="pw-review-list">
                  {reviews.map((r) => {
                    const authorName = [r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент';
                    const initial = (r.authorName || 'К')[0].toUpperCase();
                    const rStars = r.rating || 0;
                    return (
                      <div key={r.id} className="pw-review-item">
                        <div className="pw-review-head">
                          {r.authorAvatarUrl ? (
                            <img src={r.authorAvatarUrl} alt="" className="pw-review-ava" />
                          ) : (
                            <div className="pw-review-ava-fb">{initial}</div>
                          )}
                          <div className="pw-review-meta">
                            <div className="pw-review-author">{authorName}</div>
                            <div className="pw-review-sub">
                              <span className="pw-review-stars-inline">
                                {'★'.repeat(rStars)}
                                {'☆'.repeat(5 - rStars)}
                              </span>
                              {r.createdAt ? (
                                <>
                                  <span className="pw-review-date">· {publicTimeAgo(r.createdAt)}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {(r.text || r.comment) && <p className="pw-review-text">{r.text || r.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PhotoLightbox lightbox={lightbox} setLightbox={setLightbox} />
    </div>
  );
}
