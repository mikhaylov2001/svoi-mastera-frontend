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
      />
      <div className="mp-hero-shade" />

      <div className="mp-hero-content">
        <div className="mp-profile-chip">{profile.role}</div>
        <h1>{profile.name}</h1>
        <p className="mp-hero-sub">{profile.subtitle}</p>
        <div className="mp-hero-meta">
          {profile.meta.map((item, i) => <span key={i}>{item}</span>)}
        </div>
      </div>

      <div className="mp-hero-panel">
        {onModeChange && (
          <div className="mp-mode-switch">
            <button
              type="button"
              className={mode === 'customer' ? 'active mp-mode-active' : ''}
              onClick={() => onModeChange?.('customer')}
            >
              Заказчик
            </button>
            <button
              type="button"
              className={mode === 'master' ? 'active mp-mode-active' : ''}
              onClick={() => onModeChange?.('master')}
            >
              Мастер
            </button>
          </div>
        )}
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
