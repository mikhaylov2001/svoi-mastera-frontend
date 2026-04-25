import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, changePassword } from '../api';
import { useToast } from '../context/ToastContext';
import './PersonalSettingsPage.css';

function initials(displayName, lastName) {
  const a = (displayName || '').trim().split(/\s+/)[0]?.[0] || '';
  const b = (lastName || '').trim()[0] || '';
  return (a + b).toUpperCase() || '?';
}

function profileCompletePct(f) {
  let n = 0;
  if (f.displayName?.trim()) n += 30;
  if (f.lastName?.trim()) n += 20;
  if (f.phone?.trim()) n += 25;
  if (f.city?.trim()) n += 25;
  return Math.min(100, n);
}

export default function PersonalSettingsPage() {
  const { userId, userRole, login, userAvatar } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const completePct = useMemo(() => profileCompletePct(form), [form]);

  const roleLabel = userRole === 'WORKER' ? 'Мастер' : 'Заказчик';

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile(userId);
      setForm({
        displayName: data.displayName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
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
    setSavingProfile(true);
    try {
      await updateUserProfile(userId, {
        displayName: form.displayName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
      });
      login(userId, userRole, form.displayName.trim(), userAvatar, form.lastName.trim());
      showToast('Профиль обновлён', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Не удалось сохранить изменения', 'error');
    } finally {
      setSavingProfile(false);
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
      showToast('Пароль не менее 6 символов', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Пароль изменён', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to change password:', err);
      showToast('Неверный текущий пароль', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const fullName = [form.displayName, form.lastName].filter(Boolean).join(' ') || '—';

  if (loading) {
    return (
      <div className="psp-root">
        <div className="psp-top">
          <div className="container">
            <button type="button" onClick={() => navigate(-1)} className="psp-back">
              ← Назад
            </button>
            <h1 className="psp-title">Личные данные</h1>
          </div>
        </div>
        <div className="container">
          <div className="psp-panel" style={{ padding: 20 }}>
            <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, width: '40%', marginBottom: 16 }} />
            <div style={{ height: 40, background: '#f1f5f9', borderRadius: 8, marginBottom: 10 }} />
            <div style={{ height: 40, background: '#f1f5f9', borderRadius: 8, marginBottom: 10 }} />
            <div style={{ height: 40, background: '#f1f5f9', borderRadius: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="psp-root">
      <div className="psp-top">
        <div className="container">
          <button type="button" onClick={() => navigate(-1)} className="psp-back">
            ← Назад к профилю
          </button>
          <h1 className="psp-title">Личные данные</h1>
        </div>
      </div>

      <div className="container">
        {/* Сводка: кто вы, контакты, заполненность */}
        <div className="psp-summary">
          <div className="psp-ava">{initials(form.displayName, form.lastName)}</div>
          <div className="psp-sum-main">
            <div className="psp-sum-name">{fullName}</div>
            <div className="psp-sum-meta">
              <span><strong>{roleLabel}</strong></span>
              {form.email && (
                <span>
                  Email: <strong>{form.email}</strong>
                </span>
              )}
              {form.city?.trim() && (
                <span>
                  Город: <strong>{form.city.trim()}</strong>
                </span>
              )}
              {form.phone?.trim() && (
                <span>
                  Тел.: <strong>{form.phone.trim()}</strong>
                </span>
              )}
            </div>
          </div>
          <div className="psp-meter">
            <div className="psp-meter-val">{completePct}%</div>
            <div className="psp-meter-lbl">профиль</div>
          </div>
        </div>

        <div className="psp-panel">
          <div className="psp-sec">
            <div className="psp-sec-head">
              <h2 className="psp-sec-title">Основное</h2>
              <p className="psp-sec-hint">Имя, контакты и город в анкете</p>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="psp-grid">
                <div>
                  <label className="psp-label" htmlFor="psp-name">
                    Имя <span style={{ color: '#e8410a' }}>*</span>
                  </label>
                  <input
                    id="psp-name"
                    type="text"
                    className="psp-input"
                    placeholder="Иван"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="psp-label" htmlFor="psp-last">
                    Фамилия
                  </label>
                  <input
                    id="psp-last"
                    type="text"
                    className="psp-input"
                    placeholder="Иванов"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>

                <div className="psp-field-full">
                  <label className="psp-label" htmlFor="psp-email">
                    Email
                  </label>
                  <input
                    id="psp-email"
                    type="email"
                    className="psp-input"
                    value={form.email}
                    disabled
                  />
                  <div className="psp-hint">Логин и вход по email — изменить нельзя</div>
                </div>

                <div>
                  <label className="psp-label" htmlFor="psp-phone">
                    Телефон
                  </label>
                  <input
                    id="psp-phone"
                    type="tel"
                    className="psp-input"
                    placeholder="+7 999 123-45-67"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="psp-label" htmlFor="psp-city">
                    Город
                  </label>
                  <input
                    id="psp-city"
                    type="text"
                    className="psp-input"
                    placeholder="Йошкар-Ола"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="psp-actions">
                <button type="submit" className="psp-btn psp-btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>

          <div className="psp-sec">
            <div className="psp-sec-head">
              <h2 className="psp-sec-title">Пароль</h2>
              <p className="psp-sec-hint">Минимум 6 символов</p>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="psp-grid">
                <div className="psp-field-full">
                  <label className="psp-label" htmlFor="psp-cur-pw">
                    Текущий пароль
                  </label>
                  <input
                    id="psp-cur-pw"
                    type="password"
                    className="psp-input"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="psp-label" htmlFor="psp-new-pw">
                    Новый пароль
                  </label>
                  <input
                    id="psp-new-pw"
                    type="password"
                    className="psp-input"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="psp-label" htmlFor="psp-confirm-pw">
                    Повторите
                  </label>
                  <input
                    id="psp-confirm-pw"
                    type="password"
                    className="psp-input"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="psp-actions">
                <button type="submit" className="psp-btn psp-btn-primary" disabled={savingPassword}>
                  {savingPassword ? 'Меняем…' : 'Сменить пароль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
