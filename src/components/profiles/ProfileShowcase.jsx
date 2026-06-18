import React from 'react';
import '../../styles/publicProfilePage.css';
import CardFavoriteSlot from '../CardFavoriteSlot';

const BACKEND = 'https://svoi-mastera-backend-ntp0.onrender.com';
function resolveUrl(u) {
  if (!u) return '';
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

export default function ProfileShowcase({
  profile,
  onBack,
  onPrimaryAction,
  onSecondaryAction,
  onListingClick,
}) {
  if (!profile) return null;

  const activeListings    = (profile.listings || []).filter(l => l.status === 'active');
  const completedListings = (profile.listings || []).filter(l => l.status === 'completed');

  const initials = (profile.name || '?')
    .split(' ').map(p => p[0] || '').join('').toUpperCase().slice(0, 2) || '?';

  const heroStyle = {
    backgroundImage: profile.cover
      ? `linear-gradient(120deg, rgba(12,13,18,.82), rgba(12,13,18,.42)), url(${profile.cover})`
      : 'linear-gradient(135deg, #1a1a2e, #0d0d1a)',
  };

  return (
    <main className="pro-page">

      {/* ── Hero ── */}
      <section className="pro-hero" style={heroStyle}>
        {onBack && (
          <button type="button" className="pro-back-btn" onClick={onBack}>
            ← Назад
          </button>
        )}

        <div className="pro-hero-inner">
          {/* Avatar */}
          <div className="pro-avatar-wrap">
            {profile.avatar ? (
              <img
                className="pro-avatar-img"
                src={resolveUrl(profile.avatar)}
                alt={profile.name}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="pro-avatar-fb">{initials}</div>
            )}
            {profile.verified && <span className="pro-verified">✓</span>}
          </div>

          {/* Copy */}
          <div className="pro-hero-copy">
            {profile.role && <span className="pro-eyebrow">{profile.role}</span>}
            <h1>{profile.name}</h1>
            {profile.headline && <p>{profile.headline}</p>}
            {profile.meta && profile.meta.length > 0 && (
              <div className="pro-hero-meta">
                {profile.meta.map((item, i) => <span key={i}>{item}</span>)}
              </div>
            )}
          </div>

          {/* Action card */}
          {(profile.primaryAction || profile.actionTitle) && (
            <div className="pro-action-card">
              {profile.actionTitle && <b>{profile.actionTitle}</b>}
              {profile.actionText  && <span>{profile.actionText}</span>}
              {profile.primaryAction && (
                <button type="button" onClick={onPrimaryAction}>
                  {profile.primaryAction}
                </button>
              )}
              {profile.secondaryAction && (
                <button type="button" className="ghost" onClick={onSecondaryAction}>
                  {profile.secondaryAction}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Body ── */}
      <section className="pro-shell">

        {/* Sidebar */}
        <aside className="pro-sidebar">
          {profile.rating && (
            <div className="pro-card pro-score-card">
              <span>Рейтинг</span>
              <b>{profile.rating}</b>
              <small>{profile.ratingText}</small>
            </div>
          )}

          {profile.facts && profile.facts.length > 0 && (
            <div className="pro-card">
              <h3>Быстрые факты</h3>
              <div className="pro-facts">
                {profile.facts.map((item, i) => (
                  <div key={i}>
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="pro-main">

          {/* Stats strip */}
          {profile.stats && profile.stats.length > 0 && (
            <div className="pro-stats">
              {profile.stats.map((item, i) => (
                <div key={i}>
                  <b>{item.value}</b>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* About */}
          {profile.about && (
            <article className="pro-card pro-about">
              <div className="pro-section-head">
                {profile.aboutKicker && <span>{profile.aboutKicker}</span>}
                {profile.aboutTitle  && <h2>{profile.aboutTitle}</h2>}
              </div>
              <p>{profile.about}</p>
            </article>
          )}

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <article className="pro-card">
              <div className="pro-section-head">
                <span>Направления</span>
                {profile.tagsTitle && <h2>{profile.tagsTitle}</h2>}
              </div>
              <div className="pro-tags">
                {profile.tags.map((tag, i) => <span key={i}>{tag}</span>)}
              </div>
            </article>
          )}

          {/* Timeline + featured review */}
          {(profile.timeline?.length > 0 || profile.review) && (
            <div className="pro-two-col">
              {profile.timeline && profile.timeline.length > 0 && (
                <article className="pro-card">
                  <div className="pro-section-head">
                    {profile.timelineKicker && <span>{profile.timelineKicker}</span>}
                    {profile.timelineTitle  && <h2>{profile.timelineTitle}</h2>}
                  </div>
                  <div className="pro-timeline">
                    {profile.timeline.map((item, i) => (
                      <div key={i}>
                        <b>{item.title}</b>
                        {item.text && <span>{item.text}</span>}
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {profile.review && (
                <article className="pro-card pro-review">
                  <div className="pro-section-head">
                    <span>Отзыв</span>
                    {profile.reviewTitle && <h2>{profile.reviewTitle}</h2>}
                  </div>
                  <p>«{profile.review}»</p>
                  {profile.reviewAuthor && <strong>{profile.reviewAuthor}</strong>}
                </article>
              )}
            </div>
          )}

          {/* Reviews grid */}
          {profile.reviews && profile.reviews.length > 0 && (
            <section className="pro-card">
              <div className="pro-section-head">
                <span>Отзывы</span>
                <h2>Что говорят клиенты</h2>
              </div>
              <div className="pro-reviews-grid">
                {profile.reviews.map((item, i) => (
                  <article className="pro-review-item" key={i}>
                    <div>
                      <b>{item.rating}</b>
                      <span>★</span>
                    </div>
                    <p>«{item.text}»</p>
                    <strong>{item.author}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Listings */}
          {(activeListings.length > 0 || completedListings.length > 0) && (
            <div className="pro-listings-wrap">
              {activeListings.length > 0 && (
                <section className="pro-card">
                  <div className="pro-listings-head">
                    <span>Заявки</span>
                    <h2>Активные</h2>
                  </div>
                  <div className="pro-listings-grid">
                    {activeListings.map((item, i) => (
                      <article
                        key={item.id || i}
                        className="pro-listing-card"
                        onClick={() => onListingClick?.(item)}
                      >
                        <div className="pro-listing-card-media">
                          <img
                            src={item.image || ''}
                            alt={item.title}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                          {item.favoriteKind && item.id != null && (
                            <CardFavoriteSlot
                              kind={item.favoriteKind}
                              id={item.id}
                              className="pro-listing-fav-slot card-fav-slot"
                            />
                          )}
                        </div>
                        <div>
                          <span className="pro-listing-badge">Открыта</span>
                          <h3>{item.title}</h3>
                          <b>{item.price}</b>
                          <p>📍 {item.city}{item.time ? ` · ${item.time}` : ''}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {completedListings.length > 0 && (
                <section className="pro-card">
                  <div className="pro-listings-head">
                    <span>История</span>
                    <h2>Завершённые</h2>
                  </div>
                  <div className="pro-listings-grid">
                    {completedListings.map((item, i) => (
                      <article
                        key={item.id || i}
                        className="pro-listing-card is-completed"
                        onClick={() => onListingClick?.(item)}
                      >
                        <div className="pro-listing-card-media">
                          <img
                            src={item.image || ''}
                            alt={item.title}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                          {item.favoriteKind && item.id != null && (
                            <CardFavoriteSlot
                              kind={item.favoriteKind}
                              id={item.id}
                              className="pro-listing-fav-slot card-fav-slot"
                            />
                          )}
                        </div>
                        <div>
                          <span className="pro-listing-badge done">Завершена</span>
                          <h3>{item.title}</h3>
                          <b>{item.price}</b>
                          <p>📍 {item.city}{item.time ? ` · ${item.time}` : ''}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
