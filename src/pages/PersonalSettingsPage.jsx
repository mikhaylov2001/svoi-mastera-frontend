import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, changePassword } from '../api';
import { useToast } from '../context/ToastContext';
import './SettingsPages.css';

export default function PersonalSettingsPage() {
  const { userId, userRole, login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    city: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile(userId);
      setForm({
        displayName: data.displayName || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      showToast('Не удалось загрузить профиль', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!form.displayName.trim()) {
      showToast('Введите имя', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(userId, {
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim()
      });

      // Обновляем AuthContext чтобы имя изменилось везде
      login(userId, userRole, form.displayName.trim());

      showToast('Профиль обновлён', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Не удалось сохранить изменения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast('Заполните все поля', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Пароли не совпадают', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('Пароль должен быть не менее 6 символов', 'error');
      return;
    }

    setSaving(true);
    try {
      await changePassword(userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      showToast('Пароль изменён', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Failed to change password:', err);
      showToast('Неверный текущий пароль', 'error');
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
          <h1 className="settings-title">Личные данные</h1>
          <div className="settings-card">
            <div className="skeleton" style={{ height: 60, marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 60, marginBottom: 20 }} />
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
        <h1 className="settings-title">Личные данные</h1>

        {/* Profile Form */}
        <div className="settings-card">
          <div className="settings-section">
            <h2 className="settings-section-title">Основная информация</h2>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label htmlFor="name">Имя</label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  placeholder="Иван Иванов"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  disabled
                  style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }}
                />
                <small className="form-hint">Email нельзя изменить</small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  id="phone"
                  type="tel"
                  className="form-control"
                  placeholder="+7 (999) 123-45-67"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">Город</label>
                <input
                  id="city"
                  type="text"
                  className="form-control"
                  placeholder="Йошкар-Ола"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </form>
          </div>
        </div>

        {/* Password Form */}
        <div className="settings-card">
          <div className="settings-section">
            <h2 className="settings-section-title">Изменить пароль</h2>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="currentPassword">Текущий пароль</label>
                <input
                  id="currentPassword"
                  type="password"
                  className="form-control"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите новый пароль</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}