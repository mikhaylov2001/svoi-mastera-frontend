import React, { useRef } from 'react';
import { BACKEND_ORIGIN } from '../../constants/backend';

function resolveUrl(u) {
  if (!u) return null;
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND_ORIGIN + u;
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
  onAvatarChange,
}) {
  const fileRef = useRef(null);
  const resolved = resolveUrl(avatarUrl);

  return (
    <aside className="mp-sidebar-v2">
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
        {verified && <span>✓</span>}
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

      <div className="mp-completion">
        <div>
          <span>Заполнение профиля</span>
          <b>{progress}%</b>
        </div>
        <div className="mp-progress-track">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mp-contact-card">
        {city && (
          <>
            <span>Город</span>
            <b>{city}</b>
          </>
        )}
        <span>Статус</span>
        <b>{status}</b>
      </div>
    </aside>
  );
}
