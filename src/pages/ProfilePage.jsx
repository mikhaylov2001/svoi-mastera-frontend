import { useEffect, useState } from 'react';
import { getMyProfile } from '../api';
import './ProfilePage.css';

const TEST_USER_ID = '6fe3e907-c518-489d-95c6-9bf6f2988648';

function initialsFromName(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyProfile(TEST_USER_ID)
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="profile-status">Загрузка профиля...</p>;
  if (error) return <p className="profile-status error">Ошибка: {error}</p>;

  // На всякий случай если бэк вернул null
  if (!profile) {
    return <p className="profile-status">Профиль ещё не заполнен.</p>;
  }

  const initials = initialsFromName(profile.displayName || 'Клиент');
  const city = profile.city || 'Город не указан';

  return (
    <div className="profile">
      <section className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div>
          <h2 className="profile-name">
            {profile.displayName || 'Без имени'}
          </h2>
          <p className="profile-role">Клиент сервиса «СвоиМастера»</p>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-row">
          <span className="label">Город</span>
          <span className="value">{city}</span>
        </div>
        <div className="profile-row">
          <span className="label">Статус</span>
          <span className="value badge">Активен</span>
        </div>
      </section>

      <section className="profile-secondary">
        <h3>Активность</h3>
        <p>Сделки, отзывы и другие данные активности можно отобразить здесь позже.</p>
      </section>
    </div>
  );
}

export default ProfilePage;
