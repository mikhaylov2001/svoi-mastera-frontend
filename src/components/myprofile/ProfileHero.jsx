import React from 'react';

export default function ProfileHero({
  profile,
  mode,
  onModeChange,
  onViewPublic,
  onEdit,
}) {
  return (
    <section className="mp-hero-v2">
      <div
        className="mp-hero-bg"
        style={{ backgroundImage: `url(${profile.cover})` }}
        aria-hidden
      />
      <div className="mp-hero-shade" aria-hidden />
      <div className="mp-hero-curve" aria-hidden />

      <div className="mp-hero-inner">
        <div className="mp-hero-content">
          <div className="mp-profile-chip">{profile.role}</div>
          <h1>{profile.name}</h1>
          <p className="mp-hero-sub">{profile.subtitle}</p>
          <div className="mp-hero-meta">
            {profile.meta.map((item, i) => <span key={i}>{item}</span>)}
          </div>
        </div>

        <div className="mp-hero-panel">
          <button
            type="button"
            className="mp-primary-action"
            onClick={onViewPublic}
          >
            Открыть публичный профиль
          </button>
          <button
            type="button"
            className="mp-secondary-action"
            onClick={onEdit}
          >
            Редактировать
          </button>
        </div>
      </div>
    </section>
  );
}
