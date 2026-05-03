import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotificationSettings, updateNotificationSettings } from '../api';
import { useToast } from '../context/ToastContext';
import './SettingsPages.css';

export default function NotificationSettingsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    newDeals: true,
    messages: true,
    reviews: true,
    system: true
  });

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getNotificationSettings(userId);
      setSettings({
        newDeals: data.newDeals ?? true,
        messages: data.messages ?? true,
        reviews: data.reviews ?? true,
        system: data.system ?? true
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      showToast('Не удалось загрузить настройки', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    setSaving(true);
    try {
      await updateNotificationSettings(userId, newSettings);
      showToast('Настройки сохранены', 'success');
    } catch (err) {
      console.error('Failed to update settings:', err);
      setSettings(settings); // Откатываем изменения
      showToast('Не удалось сохранить настройки', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <div className="container">
            <button onClick={() => navigate(-1)} className="settings-back">
              ← Назад к профилю
            </button>
          </div>
        </div>
        <div className="container">
          <h1 className="settings-title">Уведомления</h1>
          <div className="settings-card">
            <div className="skeleton" style={{ height: 60, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 60, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 60 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="container">
          <button onClick={() => navigate(-1)} className="settings-back">
            ← Назад к профилю
          </button>
        </div>
      </div>

      <div className="container">
        <h1 className="settings-title">Уведомления</h1>

        {/* Settings Card */}
        <div className="settings-card">
          <div className="settings-section">
            <h2 className="settings-section-title">Настройте получение уведомлений о сделках</h2>

            <div className="settings-list">
              {/* New Deals */}
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-icon">📋</div>
                  <div>
                    <div className="settings-item-title">Новые сделки</div>
                    <div className="settings-item-desc">Уведомления о новых заказах</div>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.newDeals}
                    onChange={() => handleToggle('newDeals')}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Messages */}
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-icon">💬</div>
                  <div>
                    <div className="settings-item-title">Сообщения</div>
                    <div className="settings-item-desc">Уведомления о новых сообщениях</div>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.messages}
                    onChange={() => handleToggle('messages')}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Reviews */}
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-icon">⭐</div>
                  <div>
                    <div className="settings-item-title">Отзывы</div>
                    <div className="settings-item-desc">Уведомления о новых отзывах</div>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.reviews}
                    onChange={() => handleToggle('reviews')}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* System */}
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-icon">🔔</div>
                  <div>
                    <div className="settings-item-title">Системные уведомления</div>
                    <div className="settings-item-desc">Важные обновления и изменения</div>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.system}
                    onChange={() => handleToggle('system')}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}