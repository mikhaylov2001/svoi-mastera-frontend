import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, changePassword } from '../api';
import './SettingsPage.css';

export default function PersonalSettingsPage() {
  const { userId } = useAuth();
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    city: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile(userId);
      setForm(prev => ({
        ...prev,
        displayName: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
      }));
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);

    // Валидация пароля
    if (form.newPassword) {
      if (!form.currentPassword) {
        setError('Введите текущий пароль');
        setSaving(false);
        return;
      }
      if (form.newPassword.length < 6) {
        setError('Новый пароль должен быть не менее 6 символов');
        setSaving(false);
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setError('Пароли не совпадают');
        setSaving(false);
        return;
      }
    }

    try {
      // Сохраняем профиль
      await updateUserProfile(userId, {
        name: form.displayName,
        phone: form.phone,
        city: form.city,
      });

      // Если меняли пароль
      if (form.newPassword) {
        await changePassword(userId, {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      }

      setSaved(true);
      // Очистка полей пароля
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <Link to="/profile" className="cats-back-link">← Назад к профилю</Link>
          <h1>Личные данные</h1>
        </div>
      </div>

      <div className="container">
        <div className="settings-page">
          <form onSubmit={handleSave}>
            {/* Основные данные */}
            <div className="settings-section">
              <h2 className="settings-section-title">Основная информация</h2>

              <div className="form-field">
                <label className="form-label">Имя</label>
                <input
                  type="text"
                  name="displayName"
                  className="form-input"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Иван Иванов"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={form.email}
                  disabled
                  placeholder="email@example.com"
                  style={{ background: '#f9fafb', cursor: 'not-allowed' }}
                />
                <small style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, display: 'block' }}>
                  Email нельзя изменить
                </small>
              </div>

              <div className="form-field">
                <label className="form-label">Телефон (необязательно)</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+7 (900) 123-45-67"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Город</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Йошкар-Ола"
                />
              </div>
            </div>

            {/* Смена пароля */}
            <div className="settings-section">
              <h2 className="settings-section-title">Изменить пароль</h2>
              <p className="settings-section-desc">Оставьте поля пустыми, если не хотите менять пароль</p>

              <div className="form-field">
                <label className="form-label">Текущий пароль</label>
                <input
                  type="password"
                  name="currentPassword"
                  className="form-input"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Новый пароль</label>
                <input
                  type="password"
                  name="newPassword"
                  className="form-input"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Подтвердите новый пароль</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="settings-error">{error}</div>
            )}

            <div className="settings-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
              {saved && <span className="settings-saved">✓ Сохранено</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}