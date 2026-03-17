import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTools, FaUser } from 'react-icons/fa';
import { loginUser, registerUser } from '../api';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

/* ═══════════════════════════════════════
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
═══════════════════════════════════════ */

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return false;
  if (email.includes('..')) return false;
  const [local, domain] = email.split('@');
  if (local.length > 64 || domain.length > 255) return false;
  return true;
}

const EyeOpen = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosed = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ═══════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════ */

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = form.email.trim();
    if (!email) {
      setError('Введите email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email.');
      return;
    }

    if (!form.password) {
      setError('Введите пароль.');
      return;
    }

    setLoading(true);
    try {
      const resp = await loginUser({ email, password: form.password });
      const user = resp.user || {};
      const userId = user.id || resp.userId;
      const userName = user.displayName || email;
      const userRole = user.workerProfile ? 'WORKER' : 'CUSTOMER';

      if (!userId) {
        throw new Error('Ошибка входа. Попробуйте снова.');
      }

      login(userId, userRole, userName);
      navigate(userRole === 'WORKER' ? '/worker' : '/profile');
    } catch (err) {
      setError(err.message || 'Ошибка входа. Проверьте данные.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Левая панель */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <FaTools />
            </div>
            <span className="auth-brand-text">СвоиМастера в Йошкар-Оле</span>
          </div>

          <div className="auth-left-content">
            <h1 className="auth-left-title">
              Всё для мастеров —<br />
              <span>в одном месте</span>
            </h1>
            <p className="auth-left-desc">
              Маркетплейс для поиска мастеров в Йошкар-Оле. Быстро, удобно, безопасно.
            </p>

            <div className="auth-left-points">
              <div className="auth-point">
                <span className="auth-point-icon">⚡</span>
                Мгновенные уведомления о новых заказах
              </div>
              <div className="auth-point">
                <span className="auth-point-icon">📊</span>
                Аналитика и статистика в реальном времени
              </div>
              <div className="auth-point">
                <span className="auth-point-icon">🔒</span>
                Безопасные сделки с гарантией оплаты
              </div>
            </div>
          </div>

          <div className="auth-stats">
            <div className="auth-stat">
              <div className="auth-stat-num">24/7</div>
              <div className="auth-stat-label">Приём заявок</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-num">15+</div>
              <div className="auth-stat-label">Категорий</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-num">5.0★</div>
              <div className="auth-stat-label">Рейтинг</div>
            </div>
          </div>
        </div>

        {/* Правая панель - форма */}
        <div className="auth-right">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Вход в аккаунт</h2>
              <p className="auth-form-subtitle">Рады видеть вас снова</p>
            </div>

            {error && (
              <div className="auth-error">
                <span className="auth-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Пароль</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="auth-input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeClosed /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </form>

            <p className="auth-alt">
              Нет аккаунта?{' '}
              <Link to="/register" className="auth-alt-link">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   REGISTER PAGE
═══════════════════════════════════════ */

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    if (p.length < 6) return 1;
    if (p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 3;
    return 2;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    if (!name) {
      setError('Введите ваше имя.');
      return;
    }
    if (name.length < 2) {
      setError('Имя должно содержать минимум 2 символа.');
      return;
    }

    const email = form.email.trim();
    if (!email) {
      setError('Введите email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email.');
      return;
    }

    if (!form.password) {
      setError('Введите пароль.');
      return;
    }
    if (form.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.');
      return;
    }

    setLoading(true);
    try {
      const resp = await registerUser({
        name,
        email,
        password: form.password,
        role: form.role,
      });

      const user = resp.user || {};
      const userId = user.id || resp.userId;
      const userName = user.displayName || name;
      const userRole = form.role;

      if (!userId) {
        throw new Error('Не удалось создать аккаунт.');
      }

      login(userId, userRole, userName);
      navigate(userRole === 'WORKER' ? '/worker' : '/profile');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации. Попробуйте снова.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Левая панель */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <FaTools />
            </div>
            <span className="auth-brand-text">СвоиМастера в Йошкар-Оле</span>
          </div>

          <div className="auth-left-content">
            <h1 className="auth-left-title">
              Начните зарабатывать<br />
              <span>уже сегодня</span>
            </h1>
            <p className="auth-left-desc">
              Регистрация займёт меньше минуты. Создайте аккаунт заказчика или мастера.
            </p>

            <div className="auth-left-points">
              <div className="auth-point">
                <span className="auth-point-icon">🚀</span>
                Быстрый старт — анкета за 2 минуты
              </div>
              <div className="auth-point">
                <span className="auth-point-icon">🎯</span>
                Умное распределение заказов по категориям
              </div>
              <div className="auth-point">
                <span className="auth-point-icon">💳</span>
                Безопасные выплаты с гарантией
              </div>
            </div>
          </div>

          <div className="auth-stats">
            <div className="auth-stat">
              <div className="auth-stat-num">24/7</div>
              <div className="auth-stat-label">Приём заявок</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-num">15+</div>
              <div className="auth-stat-label">Категорий</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-num">5.0★</div>
              <div className="auth-stat-label">Рейтинг</div>
            </div>
          </div>
        </div>

        {/* Правая панель - форма */}
        <div className="auth-right">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Создать аккаунт</h2>
              <p className="auth-form-subtitle">Присоединяйтесь к сервису</p>
            </div>

            {error && (
              <div className="auth-error">
                <span className="auth-error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Выбор роли */}
            <div className="auth-role-tabs">
              <button
                type="button"
                className={`auth-role-tab ${form.role === 'CUSTOMER' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'CUSTOMER' })}
              >
                <span className="auth-role-icon">👤</span>
                <div>
                  <div className="auth-role-title">Заказчик</div>
                  <div className="auth-role-sub">Ищу мастера</div>
                </div>
              </button>
              <button
                type="button"
                className={`auth-role-tab ${form.role === 'WORKER' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'WORKER' })}
              >
                <span className="auth-role-icon">🔧</span>
                <div>
                  <div className="auth-role-title">Мастер</div>
                  <div className="auth-role-sub">Выполняю работы</div>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Имя</label>
                <input
                  type="text"
                  className="auth-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Иван Иванов"
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Пароль</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="auth-input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeClosed /> : <EyeOpen />}
                  </button>
                </div>

                {/* Индикатор силы пароля */}
                {form.password && (
                  <>
                    <div className="auth-pw-strength">
                      <div className={`auth-pw-bar ${strength >= 1 ? 'filled' : ''}`} />
                      <div className={`auth-pw-bar ${strength >= 2 ? 'filled' : ''}`} />
                      <div className={`auth-pw-bar ${strength >= 3 ? 'filled' : ''}`} />
                    </div>
                    <div className={`auth-pw-label ${strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong'}`}>
                      {strength === 1 ? 'Слабый' : strength === 2 ? 'Средний' : 'Надёжный'}
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
              </button>
            </form>

            <p className="auth-alt">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="auth-alt-link">
                Войти
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}