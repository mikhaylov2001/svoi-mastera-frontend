import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, changePassword } from '../api';
import { useToast } from '../context/ToastContext';
import './PersonalSettingsPage.css';

function getInitials(first, last) {
  const a = (first || '').trim()[0] || '';
  const b = (last  || '').trim()[0] || '';
  return (a + b).toUpperCase() || '?';
}

const ROLE_LABEL = { WORKER: 'Мастер', CUSTOMER: 'Заказчик' };

export default function PersonalSettingsPage() {
  const { userId, userRole, login, userAvatar } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading]           = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile]   = useState(false);
  const [savingPw, setSavingPw]           = useState(false);

  const [form, setForm] = useState({
    displayName: '', lastName: '', email: '', phone: '', city: '',
  });
  const [pw, setPw] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [avatarImgErr, setAvatarImgErr] = useState(false);
  /** `undefined` — профиль ещё не загружен; строка (в т.ч. пустая) — с сервера */
  const [avatarFromProfile, setAvatarFromProfile] = useState(undefined);

  const ini = useMemo(() => getInitials(form.displayName, form.lastName), [form.displayName, form.lastName]);
  const fullName = [form.displayName, form.lastName].filter(Boolean).join(' ') || '—';
  const avatarSrc = useMemo(() => {
    if (avatarFromProfile !== undefined) {
      const s = (avatarFromProfile || '').trim();
      if (s.length > 12) return s;
    }
    return (userAvatar || '').trim();
  }, [avatarFromProfile, userAvatar]);
  const showAvatarPhoto = Boolean(avatarSrc && avatarSrc.length > 12 && !avatarImgErr);

  useEffect(() => {
    setAvatarImgErr(false);
  }, [avatarSrc]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserProfile(userId)
      .then(d => {
        setForm({
          displayName: d.displayName || '',
          lastName:    d.lastName    || '',
          email:       d.email       || '',
          phone:       d.phone       || '',
          city:        d.city        || '',
        });
        setAvatarFromProfile(d.avatarUrl != null ? String(d.avatarUrl) : '');
      })
      .catch(() => showToast('Не удалось загрузить профиль', 'error'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!(form.displayName || '').trim()) { showToast('Введите имя', 'error'); return; }
    setSavingProfile(true); setSavedProfile(false);
    try {
      await updateUserProfile(userId, {
        displayName: form.displayName.trim(),
        lastName:    form.lastName.trim(),
        phone:       form.phone.trim(),
        city:        form.city.trim(),
      });
      login(userId, userRole, form.displayName.trim(), userAvatar, form.lastName.trim());
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
      showToast('Профиль обновлён', 'success');
    } catch {
      showToast('Не удалось сохранить', 'error');
    } finally { setSavingProfile(false); }
  };

  const handlePw = async (e) => {
    e.preventDefault();
    if (!pw.currentPassword || !pw.newPassword) { showToast('Заполните все поля', 'error'); return; }
    if (pw.newPassword !== pw.confirmPassword)   { showToast('Пароли не совпадают', 'error'); return; }
    if (pw.newPassword.length < 6) { showToast('Пароль — минимум 6 символов', 'error'); return; }
    setSavingPw(true);
    try {
      await changePassword(userId, { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      showToast('Пароль изменён', 'success');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      showToast('Неверный текущий пароль', 'error');
    } finally { setSavingPw(false); }
  };

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setP = (k) => (e) => setPw(p  => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div className="psp-root">
      <div className="psp-bar">
        <div className="psp-bar-inner">
          <button type="button" onClick={() => navigate(-1)} className="psp-back">← Назад</button>
          <span className="psp-bar-title">Личные данные</span>
        </div>
      </div>
      <div className="psp-content">
        <div className="psp-skeleton" style={{ height: 90, marginBottom: 16 }} />
        <div className="psp-panel">
          <div className="psp-section">
            {[80, 100, 56].map((h, i) => (
              <div key={i} className="psp-skeleton" style={{ height: h, marginBottom: 12 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="psp-root">

      {/* ── top bar ── */}
      <div className="psp-bar">
        <div className="psp-bar-inner">
          <button type="button" onClick={() => navigate(-1)} className="psp-back">
            ← Назад к профилю
          </button>
          <span className="psp-bar-title">Личные данные</span>
        </div>
      </div>

      <div className="psp-content">

        {/* ── identity card (dark) ── */}
        <div className="psp-identity">
          <div className="psp-ava" aria-hidden>
            {showAvatarPhoto ? (
              <img
                className="psp-ava-img"
                src={avatarSrc}
                alt=""
                onError={() => setAvatarImgErr(true)}
              />
            ) : (
              <span className="psp-ava-fallback">{ini}</span>
            )}
          </div>
          <div className="psp-id-main">
            <div className="psp-id-name">{fullName}</div>
            <div className="psp-id-meta">
              <span className="psp-id-chip">{ROLE_LABEL[userRole] || 'Пользователь'}</span>
              {form.email   && <span className="psp-id-chip"><strong>{form.email}</strong></span>}
              {form.city?.trim()  && <span className="psp-id-chip">📍 <strong>{form.city.trim()}</strong></span>}
              {form.phone?.trim() && <span className="psp-id-chip">📞 <strong>{form.phone.trim()}</strong></span>}
            </div>
          </div>
        </div>

        {/* ── main panel ── */}
        <div className="psp-panel">

          {/* основное */}
          <div className="psp-section">
            <div className="psp-sec-hd">
              <span className="psp-sec-label">Основное</span>
              <span className="psp-sec-hint">Имя, контакты и город</span>
            </div>
            <form onSubmit={handleSave}>
              <div className="psp-grid">
                <div className="psp-field">
                  <label className="psp-label" htmlFor="fn">Имя<span className="psp-req">*</span></label>
                  <input id="fn" type="text" className="psp-input" placeholder="Иван"
                    value={form.displayName} onChange={setF('displayName')} required />
                </div>
                <div className="psp-field">
                  <label className="psp-label" htmlFor="ln">Фамилия</label>
                  <input id="ln" type="text" className="psp-input" placeholder="Иванов"
                    value={form.lastName} onChange={setF('lastName')} />
                </div>

                <div className="psp-field psp-full">
                  <label className="psp-label" htmlFor="em">Email</label>
                  <input id="em" type="email" className="psp-input" value={form.email} disabled />
                  <div className="psp-hint">Логин и адрес входа — изменить нельзя</div>
                </div>

                <div className="psp-field">
                  <label className="psp-label" htmlFor="ph">Телефон</label>
                  <input id="ph" type="tel" className="psp-input" placeholder="+7 999 123-45-67"
                    value={form.phone} onChange={setF('phone')} />
                </div>
                <div className="psp-field">
                  <label className="psp-label" htmlFor="ct">Город</label>
                  <input id="ct" type="text" className="psp-input" placeholder="Йошкар-Ола"
                    value={form.city} onChange={setF('city')} />
                </div>
              </div>

              <div className="psp-save-row">
                {savedProfile && (
                  <span className="psp-saved">✓ Сохранено</span>
                )}
                <button type="submit" className="psp-btn psp-btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>

          {/* пароль */}
          <div className="psp-section">
            <div className="psp-sec-hd">
              <span className="psp-sec-label">Пароль</span>
              <span className="psp-sec-hint">Минимум 6 символов</span>
            </div>
            <form onSubmit={handlePw}>
              <div className="psp-grid">
                <div className="psp-field psp-full">
                  <label className="psp-label" htmlFor="cpw">Текущий пароль</label>
                  <input id="cpw" type="password" className="psp-input" autoComplete="current-password"
                    value={pw.currentPassword} onChange={setP('currentPassword')} />
                </div>
                <div className="psp-field">
                  <label className="psp-label" htmlFor="npw">Новый пароль</label>
                  <input id="npw" type="password" className="psp-input" autoComplete="new-password"
                    value={pw.newPassword} onChange={setP('newPassword')} />
                </div>
                <div className="psp-field">
                  <label className="psp-label" htmlFor="cpw2">Повторите</label>
                  <input id="cpw2" type="password" className="psp-input" autoComplete="new-password"
                    value={pw.confirmPassword} onChange={setP('confirmPassword')} />
                </div>
              </div>
              <div className="psp-save-row">
                <button type="submit" className="psp-btn psp-btn-primary" disabled={savingPw}>
                  {savingPw ? 'Меняем…' : 'Сменить пароль'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
