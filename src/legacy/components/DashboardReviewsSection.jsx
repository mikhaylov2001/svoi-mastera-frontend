import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * @param {{ id: string }} r
 * @param {'worker' | 'customer'} aboutTarget — чей это кабинет: отзывы о мастере или о заказчике
 */
function ReviewRow({ r, aboutTarget }) {
  const navigate = useNavigate();
  const rStars = r.rating || 0;

  if (aboutTarget === 'worker') {
    const fullN = [r.authorName, r.authorLastName].filter(Boolean).join(' ') || 'Клиент';
    return (
      <div className="pp-dash-review-item">
        <div className="pp-dash-review-head">
          {r.authorAvatarUrl && String(r.authorAvatarUrl).length > 10 ? (
            <img src={r.authorAvatarUrl} alt="" className="pp-dash-review-ava" />
          ) : (
            <div className="pp-dash-review-ava-fb">{(r.authorName || 'К')[0].toUpperCase()}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pp-dash-review-author">{fullN}</div>
            <div className="pp-dash-review-date">
              {r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="pp-dash-review-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < rStars ? '#f59e0b' : '#e5e7eb' }}>★</span>
            ))}
          </div>
        </div>
        {(r.text || r.comment) && <p className="pp-dash-review-text">{r.text || r.comment}</p>}
      </div>
    );
  }

  const ava = r.authorAvatarUrl || r.workerAvatar || null;
  const firstName = r.authorName || r.workerName || 'Мастер';
  const rLast = r.authorLastName || r.workerLastName || '';
  const fullN = [firstName, rLast].filter(Boolean).join(' ');
  const wId = r.authorUserId || r.authorId || r.workerId || null;

  return (
    <div className="pp-dash-review-item">
      <div className="pp-dash-review-head">
        {ava && String(ava).length > 10 ? (
          <img
            src={ava}
            alt=""
            className="pp-dash-review-ava"
            onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}
            style={{ cursor: wId ? 'pointer' : 'default' }}
            role={wId ? 'button' : undefined}
          />
        ) : (
          <div
            className="pp-dash-review-ava-fb"
            style={{ cursor: wId ? 'pointer' : 'default' }}
            onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}
            role={wId ? 'button' : undefined}
          >
            {firstName[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="pp-dash-review-author"
            style={{ cursor: wId ? 'pointer' : 'default' }}
            onClick={wId ? () => navigate(`/workers/${wId}`) : undefined}
            role={wId ? 'button' : undefined}
          >
            {fullN}
          </div>
          <div className="pp-dash-review-date">
            {r.createdAt && new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="pp-dash-review-stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: i < rStars ? '#f59e0b' : '#e5e7eb' }}>★</span>
          ))}
        </div>
      </div>
      {(r.text || r.comment) && <p className="pp-dash-review-text">{r.text || r.comment}</p>}
    </div>
  );
}

/**
 * Отзывы о владельце кабинета (мастер или заказчик): полный список в профиле.
 */
export default function DashboardReviewsSection({ reviews, aboutTarget, anchorId = 'dash-reviews-anchor' }) {
  const avg = useMemo(() => {
    if (!reviews?.length) return 0;
    return reviews.reduce((s, x) => s + (x.rating || 0), 0) / reviews.length;
  }, [reviews]);
  const avgStr = avg > 0 ? avg.toFixed(1) : '0,0';
  const starsFilled = Math.round(avg);
  const starCounts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length);
  const maxStarCount = Math.max(...starCounts, 1);
  const title = aboutTarget === 'worker' ? 'Отзывы о вас' : 'Отзывы о вас от мастеров';

  return (
    <section className="pp-dash-reviews" id={anchorId} aria-labelledby={`${anchorId}-heading`}>
      <h2 className="pp-dash-reviews-title" id={`${anchorId}-heading`}>{title}</h2>

      <div className="pp-dash-reviews-summary">
        <div className="pp-dash-reviews-left">
          <div className="pp-dash-reviews-big">{avgStr.replace('.', ',')}</div>
          <div className="pp-dash-reviews-stars-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < starsFilled ? '#f59e0b' : '#e5e7eb' }}>★</span>
            ))}
          </div>
          <div className="pp-dash-reviews-hint">
            {reviews.length === 0 ? 'Отзывов пока нет' : `${reviews.length} ${reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}`}
          </div>
        </div>
        <div className="pp-dash-reviews-bars">
          {[5, 4, 3, 2, 1].map((s, idx) => (
            <div className="pp-dash-bar-row" key={s}>
              <span className="pp-dash-bar-stars">{'★'.repeat(s)}</span>
              <div className="pp-dash-bar-track">
                <div className="pp-dash-bar-fill" style={{ width: `${(starCounts[idx] / maxStarCount) * 100}%` }} />
              </div>
              <span className="pp-dash-bar-cnt">{starCounts[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="pp-dash-reviews-empty">
          {aboutTarget === 'worker'
            ? 'Как только заказчики оставят отзывы после сделок, они появятся здесь.'
            : 'Как только мастера оставят отзывы после завершённых сделок, они появятся здесь.'}
        </p>
      ) : (
        <div className="pp-dash-reviews-list">
          {reviews.map((r) => (
            <ReviewRow key={r.id} r={r} aboutTarget={aboutTarget} />
          ))}
        </div>
      )}
    </section>
  );
}
