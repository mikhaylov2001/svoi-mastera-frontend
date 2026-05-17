import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Hammer,
  MailCheck,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { loginUser, registerUser } from '../api';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import './AuthPages.css';

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return false;
  if (email.includes('..')) return false;
  const [local, domain] = email.split('@');
  if (local.length > 64 || domain.length > 255) return false;
  return true;
}

function splitFullName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { name: '', lastName: '' };
  if (parts.length === 1) return { name: parts[0], lastName: '' };
  return { name: parts[0], lastName: parts.slice(1).join(' ') };
}

function passwordStrength(pass) {
  let s = 0;
  if (pass.length >= 6) s += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) s += 1;
  if (/\d/.test(pass) && pass.length >= 8) s += 1;
  return s;
}

function AuthShowcase() {
  return (
    <aside className="apv2-show">
      <div className="apv2-top">
        <BrandLogo to="/login" showCity />
        <Link to="/" className="apv2-back">
          <ArrowLeft size={14} /> На главную
        </Link>
      </div>

      <div className="apv2-hero">
        <span className="apv2-eyebrow">
          <span className="dot" /> 247 мастеров онлайн прямо сейчас
        </span>
        <h1 className="apv2-h">
          Заказы, мастера, отзывы — <em>в одном месте.</em>
        </h1>
        <p className="apv2-lead">
          Локальный маркетплейс услуг для жителей Йошкар-Олы. Прямой контакт с мастером, прозрачные цены,
          реальные отзывы.
        </p>

        <div className="apv2-stack">
          <div className="apv2-fcard c1">
            <div className="apv2-av a">АП</div>
            <div>
              <div className="apv2-fname">Алексей П.</div>
              <div className="apv2-fmeta">
                Электрик · <Star size={11} fill="currentColor" /> 4.9
              </div>
            </div>
            <span className="apv2-pill green">Свободен</span>
          </div>
          <div className="apv2-fcard c2">
            <div className="apv2-av b">МК</div>
            <div>
              <div className="apv2-fname">Марина К.</div>
              <div className="apv2-fmeta">Клининг · 132 заказа</div>
            </div>
            <span className="apv2-pill dark">PRO</span>
          </div>
          <div className="apv2-fcard c3">
            <div className="apv2-av c">ИС</div>
            <div>
              <div className="apv2-fname">Игорь С.</div>
              <div className="apv2-fmeta">Сантехник · отвечает за 3 мин</div>
            </div>
            <span className="apv2-pill">от 800₽</span>
          </div>
        </div>
      </div>

      <div className="apv2-foot">
        <div>
          <div className="apv2-stat-n">9+</div>
          <div className="apv2-stat-l">Категорий</div>
        </div>
        <div className="sep" />
        <div>
          <div className="apv2-stat-n">7 мин</div>
          <div className="apv2-stat-l">Средний отклик</div>
        </div>
        <div className="sep" />
        <div>
          <div className="apv2-stat-n">4.92★</div>
          <div className="apv2-stat-l">Ср. рейтинг</div>
        </div>
      </div>

      <div className="apv2-deco">365</div>
    </aside>
  );
}

function AuthMobileTop() {
  return (
    <div className="apv2-mobtop">
      <BrandLogo to="/login" />
      <Link to="/" className="apv2-back">
        <ArrowLeft size={14} /> Назад
      </Link>
    </div>
  );
}

function AuthTabs({ active }) {
  return (
    <div className="apv2-tabs">
      <Link to="/login" className={`apv2-tab${active === 'login' ? ' is-active' : ''}`}>
        Вход
      </Link>
      <Link to="/register" className={`apv2-tab${active === 'register' ? ' is-active' : ''}`}>
        Регистрация
      </Link>
    </div>
  );
}

export function SocialRow() {
  const onSoon = () => {
    // OAuth — в разработке
  };

  return (
    <div className="apv2-socs">
      <button type="button" className="apv2-soc google" onClick={onSoon}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        <span>Google</span>
      </button>
      <button type="button" className="apv2-soc vk" onClick={onSoon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.79 16.74h1.21s.37-.04.55-.24c.17-.18.17-.52.17-.52s-.02-1.64.74-1.88c.74-.24 1.71 1.6 2.73 2.31.77.53 1.36.42 1.36.42l2.74-.04s1.43-.09.75-1.22c-.06-.09-.4-.83-2.04-2.35-1.71-1.59-1.48-1.33.58-4.07 1.25-1.67 1.75-2.69 1.6-3.13-.15-.42-1.08-.31-1.08-.31l-3.08.02s-.23-.03-.4.07c-.17.1-.27.33-.27.33s-.49 1.3-1.14 2.42c-1.37 2.34-1.92 2.47-2.14 2.32-.52-.34-.39-1.35-.39-2.07 0-2.25.34-3.19-.66-3.43-.33-.08-.58-.13-1.43-.14-1.09-.01-2.01.01-2.53.26-.35.17-.62.55-.46.57.2.03.65.12.89.45.31.42.3 1.36.3 1.36s.18 2.62-.42 2.95c-.41.22-.97-.23-2.2-2.36-.62-1.09-1.1-2.29-1.1-2.29s-.09-.22-.25-.34c-.2-.14-.49-.18-.49-.18l-2.93.02s-.44.01-.6.2c-.14.17-.01.52-.01.52s2.29 5.36 4.89 8.07c2.39 2.48 5.1 2.32 5.1 2.32z" />
        </svg>
        <span>VK</span>
      </button>
      <button type="button" className="apv2-soc yandex" onClick={onSoon}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13.92 23H17.4V1h-4.42c-4.45 0-7.31 2.86-7.31 7.06 0 3.35 1.6 5.32 4.44 7.34l-4.95 7.5h3.78l5.53-8.27-1.77-1.19c-2.31-1.56-3.43-2.78-3.43-5.41 0-2.32 1.62-3.88 3.99-3.88h.65V23z" />
        </svg>
        <span>Яндекс</span>
      </button>
    </div>
  );
}

function AuthShell({ children }) {
  return (
    <div className="apv2">
      <AuthShowcase />
      <main className="apv2-right">
        <div className="apv2-card">
          <AuthMobileTop />
          {children}
        </div>
      </main>
    </div>
  );
}

function finishAuth(login, navigate, resp, fallbackName, explicitRole) {
  const user = resp.user || {};
  const userId = user.id || resp.userId;
  const userName = user.displayName || fallbackName || '';
  const userRole = explicitRole || (user.hasWorkerProfile ? 'WORKER' : 'CUSTOMER');
  const avatarUrl = user.avatarUrl || '';
  const lastName = user.lastName || '';

  if (!userId) {
    throw new Error('Не удалось завершить авторизацию. Попробуйте ещё раз.');
  }

  login(userId, userRole, userName, avatarUrl, lastName);
  navigate(userRole === 'WORKER' ? '/worker-profile' : '/profile');
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});
  const [banner, setBanner] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const n = {};
    const em = email.trim();
    if (!isValidEmail(em)) n.email = 'Введите корректный email';
    if (pass.length < 6) n.pass = 'Минимум 6 символов';
    setErr(n);
    setBanner('');
    if (Object.keys(n).length > 0) return;

    setLoading(true);
    try {
      const resp = await loginUser({ email: em, password: pass });
      if (remember) {
        try {
          localStorage.setItem('sm_remember_email', em);
        } catch {
          /* ignore */
        }
      }
      finishAuth(login, navigate, resp);
    } catch (error) {
      setBanner(error.message || 'Неверный email или пароль.');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthTabs active="login" />

      <h2 className="apv2-title">
        С <em>возвращением</em>.
      </h2>
      <p className="apv2-sub">Войдите в аккаунт, чтобы продолжить.</p>

      {banner ? <div className="apv2-banner">{banner}</div> : null}

      <form onSubmit={submit} noValidate>
        <div className="apv2-field">
          <label className="apv2-flabel" htmlFor="login-email">
            Email
          </label>
          <div className="apv2-inwrap">
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              className={`apv2-input${err.email ? ' err' : ''}`}
              placeholder="you@mail.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {err.email ? <div className="apv2-err">{err.email}</div> : null}
        </div>

        <div className="apv2-field">
          <label className="apv2-flabel" htmlFor="login-pass">
            Пароль{' '}
            <Link to="/forgot-password" className="apv2-flink">
              Забыли?
            </Link>
          </label>
          <div className="apv2-inwrap">
            <input
              id="login-pass"
              type={show ? 'text' : 'password'}
              required
              minLength={6}
              maxLength={72}
              autoComplete="current-password"
              className={`apv2-input${err.pass ? ' err' : ''}`}
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <button
              type="button"
              className="apv2-eye"
              onClick={() => setShow((v) => !v)}
              aria-label="Показать пароль"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {err.pass ? <div className="apv2-err">{err.pass}</div> : null}
        </div>

        <div className="apv2-row">
          <label className="apv2-check">
            <input
              type="checkbox"
              className="apv2-check-input"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="apv2-check-box" aria-hidden />
            <span>Запомнить меня на 30 дней</span>
          </label>
        </div>

        <button type="submit" className="apv2-cta" disabled={loading}>
          <span>{loading ? 'Входим…' : 'Войти в аккаунт'}</span>
          <span className="apv2-arr">
            <ArrowRight size={18} />
          </span>
        </button>
      </form>

      <div className="apv2-or">или войти через</div>
      <SocialRow />

      <div className="apv2-footer">
        Ещё не с нами?
        <Link to="/register">Создать аккаунт</Link>
      </div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});
  const [banner, setBanner] = useState('');

  const strength = useMemo(() => passwordStrength(pass), [pass]);

  const submit = async (e) => {
    e.preventDefault();
    const n = {};
    if (!name.trim()) n.name = 'Введите имя';
    const em = email.trim();
    if (!isValidEmail(em)) n.email = 'Неверный email';
    if (pass.length < 6) n.pass = 'Минимум 6 символов';
    setErr(n);
    setBanner('');
    if (Object.keys(n).length > 0) return;

    const { name: firstName, lastName } = splitFullName(name);

    setLoading(true);
    try {
      const resp = await registerUser({
        name: firstName,
        lastName,
        email: em,
        password: pass,
        role,
      });
      finishAuth(login, navigate, resp, firstName, role);
    } catch (error) {
      setBanner(error.message || 'Не удалось создать аккаунт.');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthTabs active="register" />

      <h2 className="apv2-title">
        Создайте <em>аккаунт</em>.
      </h2>
      <p className="apv2-sub">Регистрация займёт меньше минуты.</p>

      {banner ? <div className="apv2-banner">{banner}</div> : null}

      <div className="apv2-roles" data-r={role}>
        <label className={`apv2-role${role === 'CUSTOMER' ? ' on' : ''}`}>
          <input
            type="radio"
            name="auth-role"
            checked={role === 'CUSTOMER'}
            onChange={() => setRole('CUSTOMER')}
          />
          <ShoppingBag size={15} />
          <span>Заказчик</span>
        </label>
        <label className={`apv2-role${role === 'WORKER' ? ' on' : ''}`}>
          <input type="radio" name="auth-role" checked={role === 'WORKER'} onChange={() => setRole('WORKER')} />
          <Hammer size={15} />
          <span>Мастер</span>
        </label>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="apv2-field">
          <label className="apv2-flabel" htmlFor="reg-name">
            Имя и фамилия
          </label>
          <input
            id="reg-name"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            className={`apv2-input${err.name ? ' err' : ''}`}
            placeholder="Иван Иванов"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {err.name ? <div className="apv2-err">{err.name}</div> : null}
        </div>

        <div className="apv2-field">
          <label className="apv2-flabel" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            className={`apv2-input${err.email ? ' err' : ''}`}
            placeholder="you@mail.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {err.email ? <div className="apv2-err">{err.email}</div> : null}
        </div>

        <div className="apv2-field">
          <label className="apv2-flabel" htmlFor="reg-pass">
            Пароль
          </label>
          <div className="apv2-inwrap">
            <input
              id="reg-pass"
              type={show ? 'text' : 'password'}
              required
              minLength={6}
              maxLength={72}
              autoComplete="new-password"
              className={`apv2-input${err.pass ? ' err' : ''}`}
              placeholder="Минимум 6 символов"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <button
              type="button"
              className="apv2-eye"
              onClick={() => setShow((v) => !v)}
              aria-label="Показать пароль"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pass.length > 0 ? (
            <div className="apv2-meter" data-s={strength}>
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {err.pass ? <div className="apv2-err">{err.pass}</div> : null}
        </div>

        <button type="submit" className="apv2-cta" style={{ marginTop: 24 }} disabled={loading}>
          <span>{loading ? 'Создаём…' : 'Создать аккаунт'}</span>
          <span className="apv2-arr">
            <ArrowRight size={18} />
          </span>
        </button>
      </form>

      <div className="apv2-or">или зарегистрироваться через</div>
      <SocialRow />

      <div className="apv2-footer">
        Уже есть аккаунт?
        <Link to="/login">Войти</Link>
      </div>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!isValidEmail(email.trim())) {
      setErr('Введите корректный email');
      return;
    }
    setErr('');
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell>
        <AuthTabs active="login" />

        <div className="apv2-success">
          <div className="apv2-success-ic">
            <MailCheck size={28} />
          </div>
          <h2 className="apv2-title" style={{ marginBottom: 10 }}>
            Проверьте <em>почту</em>.
          </h2>
          <p className="apv2-sub">
            Мы отправили ссылку для восстановления пароля на <b style={{ color: 'var(--ink)' }}>{email}</b>. Письмо
            может прийти в течение пары минут.
          </p>

          <Link to="/login" className="apv2-cta" style={{ textDecoration: 'none', marginTop: 8 }}>
            <span>Вернуться к входу</span>
            <span className="apv2-arr">
              <ArrowRight size={18} />
            </span>
          </Link>

          <div className="apv2-footer">
            Не пришло письмо?
            <button type="button" className="apv2-link" onClick={() => setSent(false)}>
              Отправить снова
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="apv2-form-nav">
        <AuthTabs active="login" />
        <Link to="/login" className="apv2-back-link">
          <ArrowLeft size={14} /> Назад ко входу
        </Link>
      </div>

      <h2 className="apv2-title">
        Восстановление <em>пароля</em>.
      </h2>
      <p className="apv2-sub">Укажите email от аккаунта — мы пришлём ссылку для сброса пароля.</p>

      <form onSubmit={submit} noValidate>
        <div className="apv2-field">
          <label className="apv2-flabel" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            className={`apv2-input${err ? ' err' : ''}`}
            placeholder="you@mail.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {err ? <div className="apv2-err">{err}</div> : null}
        </div>

        <button type="submit" className="apv2-cta" style={{ marginTop: 16 }}>
          <span>Отправить ссылку</span>
          <span className="apv2-arr">
            <ArrowRight size={18} />
          </span>
        </button>
      </form>

      <div className="apv2-footer">
        Вспомнили пароль?
        <Link to="/login">Войти</Link>
      </div>
    </AuthShell>
  );
}

export default LoginPage;
