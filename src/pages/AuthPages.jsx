import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTools, FaUser, FaBolt, FaChartBar, FaShieldAlt, FaRocket, FaBullseye, FaCreditCard } from 'react-icons/fa';
import { loginUser, registerUser } from '../api';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

/* ───────────────────────────────
   Валидация email
─────────────────────────────── */
function isValidEmail(email) {
  // Проверяем базовый формат: что-то@что-то.что-то (минимум 2 символа в домене)
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return false;

  // Проверяем что нет двойных точек
  if (email.includes('..')) return false;

  // Проверяем длину частей
  const [local, domain] = email.split('@');
  if (local.length > 64 || domain.length > 255) return false;

  return true;
}

/* ───────────────────────────────
   Shared icons
─────────────────────────────── */
const EyeOpen = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ───────────────────────────────
   Left panel (shared)
─────────────────────────────── */
function AuthLeft({ title, subtitle, points, stats }) {
  return (
    <div className="auth-left">
      <div className="auth-left-content">
        <Link to="/" className="auth-brand">
          <span style={{fontSize:24}}>🔨</span>
          <span className="auth-brand-text">СвоиМастера в Йошкар-Оле</span>
        </Link>
        <h2 className="auth-left-title">{title}</h2>
        <p  className="auth-left-desc">{subtitle}</p>
        <ul className="auth-left-points">
          {points.map(([icon, text]) => (
            <li key={text} className="auth-left-point">
              <span className="auth-left-point-icon">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      {stats && (
        <div className="auth-stats-row">
          {stats.map(([n, l]) => (
            <div className="auth-stat-box" key={l}>
              <div className="auth-stat-num">{n}</div>
              <div className="auth-stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────
   LOGIN PAGE
─────────────────────────────── */
export function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email:'', password:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Валидация email
    const email = form.email.trim();
    if (!email) {
      setError('Введите email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email, например: name@mail.ru');
      return;
    }
    if (!form.password) {
      setError('Введите пароль.');
      return;
    }

    setLoading(true);
    try {
      const resp = await loginUser({ ...form, email });

      const user = resp.user || {};
      const userId = user.id || resp.userId;
      const userName = user.displayName || '';
      const userRole = user.hasWorkerProfile ? 'WORKER' : 'CUSTOMER';
      const avatarUrl = user.avatarUrl || '';
      const lastName = user.lastName || '';

      if (!userId) {
        throw new Error('Не удалось войти. Попробуйте ещё раз.');
      }

      login(userId, userRole, userName, avatarUrl, lastName);
      navigate(userRole === 'WORKER' ? '/worker-profile' : '/profile');
    } catch (err) {
      setError(err.message || 'Неверный email или пароль.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <AuthLeft
        title={<>Всё для мастеров —<br /><span>в одном месте</span></>}
        subtitle="Маркетплейс для поиска мастеров в Йошкар-Оле. Быстро, удобно, безопасно."
        points={[
          [<FaBolt />,'Мгновенные уведомления о новых заказах'],
          [<FaChartBar />,'Аналитика и статистика в реальном времени'],
          [<FaShieldAlt />,'Безопасные сделки с гарантией оплаты'],
        ]}
        stats={[['24/7','Приём заявок'],['9+','Категорий'],['5.0★','Рейтинг']]}
      />

      <div className="auth-right">
        <div className="auth-mobile-header">
          <Link to="/" className="auth-mobile-brand">
            <span style={{fontSize:16}}>🔨</span>
            <span className="auth-mobile-brand-text">СвоиМастера</span>
          </Link>
          <p className="auth-mobile-sub">Вход в личный кабинет сервиса</p>
        </div>

        <div className="auth-form-card">
          <h1 className="auth-form-title">Вход в аккаунт</h1>
          <p  className="auth-form-sub">Рады видеть вас снова</p>

          {error && <div className="auth-error-box">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email" placeholder="mail@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>

            <div className="form-field">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                <span className="form-label" style={{marginBottom:0}}>Пароль</span>
                <button type="button" className="auth-forgot">Забыли пароль?</button>
              </div>
              <div className="auth-input-wrap">
                <input className="form-input" type={showPw ? 'text' : 'password'} name="password"
                  placeholder="••••••••" style={{paddingRight:42}}
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button type="submit" className={`auth-submit btn btn-primary btn-full${loading ? ' auth-submit-loading' : ''}`} disabled={loading}>
              {loading ? 'Входим…' : 'Войти в аккаунт'}
            </button>
          </form>

          <p className="auth-alt">
            Нет аккаунта?{' '}
            <Link to="/register" className="auth-alt-link">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────
   REGISTER PAGE
─────────────────────────────── */
export function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ name:'', email:'', password:'', role:'CUSTOMER' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    if (p.length < 6) return 1;
    if (p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 3;
    return 2;
  })();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Валидация имени
    const name = form.name.trim();
    if (!name) {
      setError('Введите ваше имя.');
      return;
    }
    if (name.length < 2) {
      setError('Имя должно содержать минимум 2 символа.');
      return;
    }

    // Валидация email
    const email = form.email.trim();
    if (!email) {
      setError('Введите email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email, например: name@mail.ru');
      return;
    }

    // Валидация пароля
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
        lastName: form.lastName?.trim() || '',
        email,
        password: form.password,
        role: form.role
      });

      const user = resp.user || {};
      const userId = user.id || resp.userId;
      const userName = user.displayName || name;
      const userRole = form.role;
      const avatarUrl = user.avatarUrl || '';
      const lastName = user.lastName || form.lastName?.trim() || '';

      if (!userId) {
        throw new Error('Не удалось создать аккаунт. Попробуйте ещё раз.');
      }

      login(userId, userRole, userName, avatarUrl, lastName);
      navigate(userRole === 'WORKER' ? '/worker-profile' : '/profile');
    } catch (err) {
      setError(err.message || 'Не удалось создать аккаунт. Попробуйте снова.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <AuthLeft
        title={<>Начните зарабатывать<br /><span>уже сегодня</span></>}
        subtitle="Регистрация займёт меньше минуты. Создайте аккаунт заказчика или мастера."
        points={[
          [<FaRocket />,'Быстрый старт — анкета за 2 минуты'],
          [<FaBullseye />,'Умное распределение заказов по категориям'],
          [<FaCreditCard />,'Безопасные выплаты с гарантией'],
        ]}
        stats={[['24/7','Приём заявок'],['9+','Категорий'],['5.0★','Рейтинг']]}
      />

      <div className="auth-right">
        <div className="auth-mobile-header">
          <Link to="/" className="auth-mobile-brand">
            <span style={{fontSize:16}}>🔨</span>
            <span className="auth-mobile-brand-text">СвоиМастера</span>
          </Link>
          <p className="auth-mobile-sub">Регистрация в сервисе</p>
        </div>

        <div className="auth-form-card">
          <h1 className="auth-form-title">Создать аккаунт</h1>
          <p  className="auth-form-sub">Присоединяйтесь к сервису</p>

          {error && <div className="auth-error-box">⚠️ {error}</div>}

          {/* Role picker */}
          <div className="auth-role-picker">
            <button type="button"
              className={`auth-role-btn ${form.role === 'CUSTOMER' ? 'active' : ''}`}
              onClick={() => setForm({...form, role:'CUSTOMER'})}>
              {form.role === 'CUSTOMER' && <span className="auth-role-check">✓</span>}
              <div className="auth-role-icon-wrap">🏠</div>
              <div className="auth-role-body">
                <div className="auth-role-title">Заказчик</div>
                <div className="auth-role-sub">Ищу мастера для своих задач</div>
              </div>
            </button>
            <button type="button"
              className={`auth-role-btn ${form.role === 'WORKER' ? 'active' : ''}`}
              onClick={() => setForm({...form, role:'WORKER'})}>
              {form.role === 'WORKER' && <span className="auth-role-check">✓</span>}
              <div className="auth-role-icon-wrap">🔧</div>
              <div className="auth-role-body">
                <div className="auth-role-title">Мастер</div>
                <div className="auth-role-sub">Выполняю заказы и зарабатываю</div>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Имя</label>
              <input className="form-input" type="text" name="name" placeholder="Иван"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>

            <div className="form-field">
              <label className="form-label">Фамилия</label>
              <input className="form-input" type="text" name="lastName" placeholder="Иванов"
                value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} />
            </div>

            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email" placeholder="mail@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>

            <div className="form-field">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                <span className="form-label" style={{marginBottom:0}}>Пароль</span>
                {strength > 0 && (
                  <span style={{fontSize:12, fontWeight:700, color: strength===3?'#4caf50':strength===2?'#ff9800':'#f44336'}}>
                    {['','Слабый','Средний','Надёжный'][strength]}
                  </span>
                )}
              </div>
              <div className="auth-input-wrap">
                <input className="form-input" type={showPw ? 'text' : 'password'} name="password"
                  placeholder="Минимум 6 символов" style={{paddingRight:42}}
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              <div className="auth-strength">
                {[1,2,3].map(i => (
                  <div key={i} className={`auth-strength-bar ${strength>=i ? ['','weak','fair','good'][i] : ''}`} />
                ))}
              </div>
            </div>

            <button type="submit" className={`auth-submit btn btn-primary btn-full${loading ? ' auth-submit-loading' : ''}`} disabled={loading}>
              {loading ? 'Создаём аккаунт…' : 'Создать аккаунт'}
            </button>
          </form>

          <p className="auth-alt">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="auth-alt-link">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
