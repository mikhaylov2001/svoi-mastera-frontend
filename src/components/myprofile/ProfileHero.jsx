import React from 'react';

export default function ProfileHero({
  profile,         // { role, name, subtitle, cover, meta[] }
  onViewPublic,    // () => void
  onEdit,          // () => void
}) {
  return (
    <section className="mp-hero-v2">
      <div
        className="mp-hero-bg"
        style={{ backgroundImage: `url(${profile.cover})` }}
      />
      <div className="mp-hero-shade" />

      <div className="mp-hero-content">
        <div className="mp-profile-chip">{profile.role}</div>
        <h1>{profile.name}</h1>
        <p>{profile.subtitle}</p>
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
    </section>
  );
}
