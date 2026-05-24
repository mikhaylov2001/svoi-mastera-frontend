import React, { useRef } from 'react';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';
function resolveUrl(u) {
  if (!u) return null;
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

export default function ProfileSidebar({
  name,
  about,
  city,
  status,
  progress,
  avatarUrl,
  initials,
  verified,
  onAvatarChange,  // (file) => void
}) {
  const fileRef = useRef(null);
  const resolved = resolveUrl(avatarUrl);

  return (
    <aside className="mp-sidebar-v2">
      {/* Avatar */}
      <div
        className="mp-avatar-frame"
        onClick={() => fileRef.current?.click()}
        title="Изменить фото"
      >
        {resolved ? (
          <img src={resolved} alt={name} />
        ) : (
          <div className="mp-avatar-fb">{initials}</div>
        )}
        {verified && <span className="mp-check">✓</span>}
        <div className="mp-avatar-overlay">📷</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { onAvatarChange?.(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>

      <h2>{name}</h2>
      {about && <p>{about}</p>}

      {/* Progress */}
      <div className="mp-completion">
        <div className="mp-completion-row">
          <span>Заполнение профиля</span>
          <b>{progress}%</b>
        </div>
        <div className="mp-progress-track">
          <i className="mp-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* City / status */}
      <div className="mp-contact-card">
        {city && (
          <>
            <span className="mp-cc-label">Город</span>
            <span className="mp-cc-value">{city}</span>
          </>
        )}
        <span className="mp-cc-label">Статус</span>
        <span className="mp-cc-value">{status}</span>
      </div>
    </aside>
  );
}
