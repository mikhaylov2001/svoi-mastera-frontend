import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

export default function NotificationsSettingsPage() {
  const { userId } = useAuth();

  console.log('🔔 NotificationsSettingsPage загружена! userId:', userId);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newDeals: true,
    dealUpdates: true,
    messages: true,
    reviews: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // TODO: Загрузить настройки из API
    // fetch(`/api/v1/users/${userId}/notification-settings`)
    //   .then(r => r.json())
    //   .then(data => setSettings(data));
  }, [userId]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    // TODO: Сохранить в API
    // await fetch(`/api/v1/users/${userId}/notification-settings`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(settings)
    // });

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <Link to="/profile" className="cats-back-link">← Назад к профилю</Link>
          <h1>Уведомления</h1>
        </div>
      </div>

      <div className="container">
        <div className="settings-page">
          <div className="settings-section">
            <h2 className="settings-section-title">Способы уведомлений</h2>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">Email уведомления</div>
                <div className="settings-item-desc">Получать уведомления на почту</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">Push-уведомления</div>
                <div className="settings-item-desc">Уведомления в браузере (скоро)</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => handleToggle('pushNotifications')}
                  disabled
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">О чём уведомлять</h2>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">Новые сделки</div>
                <div className="settings-item-desc">Когда мастер откликается на заявку</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.newDeals}
                  onChange={() => handleToggle('newDeals')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">Обновления сделок</div>
                <div className="settings-item-desc">Изменение статуса работ</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.dealUpdates}
                  onChange={() => handleToggle('dealUpdates')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">Новые сообщения</div>
                <div className="settings-item-desc">Сообщения от мастеров</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.messages}
                  onChange={() => handleToggle('messages')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">Отзывы</div>
                <div className="settings-item-desc">Напоминание оставить отзыв</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.reviews}
                  onChange={() => handleToggle('reviews')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
            {saved && <span className="settings-saved">✓ Сохранено</span>}
          </div>
        </div>
      </div>
    </div>
  );
}