import React from 'react';
import '../../styles/profilePages.css';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';
function resolveUrl(u) {
  if (!u) return '';
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

/**
 * Shared public profile component — Base44 design.
 *
 * Props:
 *   profile         — profile data object (see shape below)
 *   onBack          — () => void
 *   onPrimaryAction — () => void  (e.g. navigate to chat)
 *   onSecondaryAction — () => void
 *   onListingClick  — (listing) => void
 *
 * Profile shape:
 *   role, name, headline, cover, avatar, verified
 *   meta: string[]
 *   actionTitle, actionText, primaryAction, secondaryAction
 *   rating, ratingText
 *   facts: { label, value }[]
 *   stats: { value, label }[]
 *   aboutKicker, aboutTitle, about
 *   tagsTitle, tags: string[]
 *   timelineKicker, timelineTitle, timeline: { title, text }[]
 *   reviewTitle, review, reviewAuthor
 *   reviews: { author, rating, text }[]
 *   listings: { id, status('active'|'completed'), title, price, city, time, image, photos? }[]
 */
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
      : 'linear-gradient(120deg, rgba(12,13,18,.92), rgba(12,13,18,.72))',
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
              {profile.actionText && <span>{profile.actionText}</span>}
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
          {/* Rating card */}
          {profile.rating && (
            <div className="pro-card pro-score-card">
              <span>Рейтинг</span>
              <b>{profile.rating}</b>
              <small>{profile.ratingText}</small>
            </div>
          )}

          {/* Quick facts */}
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

          {/* Tags / directions */}
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
                        <span>{item.text}</span>
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
            <section className="pro-card pro-reviews-section">
              <div className="pro-section-head">
                <span>Отзывы</span>
                <h2>Что говорят клиенты</h2>
              </div>
              <div className="pro-reviews-grid">
                {profile.reviews.map((item, i) => (
                  <article className="pro-review-item" key={i}>
                    <div className="pro-review-item-rating">
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
                <section className="pro-card pro-listings-section">
                  <div className="pro-section-head pro-listings-head">
                    <div>
                      <span>Заявки</span>
                      <h2>Активные</h2>
                    </div>
                  </div>
                  <div className="pro-listings-grid">
                    {activeListings.map((item, i) => (
                      <article
                        key={item.id || i}
                        className="pro-listing-card"
                        onClick={() => onListingClick?.(item)}
                      >
                        <img
                          src={item.image || ''}
                          alt={item.title}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="pro-listing-card-body">
                          <span className="pro-listing-badge">Открыта</span>
                          <h3>{item.title}</h3>
                          <span className="pro-listing-card-price">{item.price}</span>
                          <p>📍 {item.city}{item.time ? ` · ${item.time}` : ''}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {completedListings.length > 0 && (
                <section className="pro-card pro-listings-section">
                  <div className="pro-section-head pro-listings-head">
                    <div>
                      <span>История</span>
                      <h2>Завершённые</h2>
                    </div>
                  </div>
                  <div className="pro-listings-grid">
                    {completedListings.map((item, i) => (
                      <article
                        key={item.id || i}
                        className="pro-listing-card is-completed"
                        onClick={() => onListingClick?.(item)}
                      >
                        <img
                          src={item.image || ''}
                          alt={item.title}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="pro-listing-card-body">
                          <span className="pro-listing-badge done">Завершена</span>
                          <h3>{item.title}</h3>
                          <span className="pro-listing-card-price">{item.price}</span>
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
