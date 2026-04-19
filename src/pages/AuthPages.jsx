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
const CAT_PHOTOS = {
  'remont-kvartir':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
  'santehnika':           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'elektrika':            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
  'uborka':               'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80',
  'parikhmaher':          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
  'manikur':              'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
  'krasota-i-zdorovie':   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'repetitorstvo':        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
};

const ALL_AUTH_CATS = [
  {slug:'remont-kvartir',name:'Ремонт квартир'},
  {slug:'santehnika',name:'Сантехника'},
  {slug:'elektrika',name:'Электрика'},
  {slug:'uborka',name:'Уборка'},
  {slug:'parikhmaher',name:'Парикмахер'},
  {slug:'manikur',name:'Маникюр'},
  {slug:'krasota-i-zdorovie',name:'Красота'},
  {slug:'repetitorstvo',name:'Репетиторство'},
  {slug:'kompyuternaya-pomosh',name:'IT помощь'},
];

function AuthLeft({ title, subtitle, points, stats }) {
  return (
    <div className="auth-left">
      {/* SVG декор — геометрические круги */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} viewBox="0 0 480 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <circle cx="420" cy="120" r="200" fill="none" stroke="rgba(232,65,10,.18)" strokeWidth="1"/>
        <circle cx="420" cy="120" r="140" fill="none" stroke="rgba(232,65,10,.12)" strokeWidth="1"/>
        <circle cx="420" cy="120" r="80"  fill="none" stroke="rgba(232,65,10,.18)" strokeWidth="1"/>
        <circle cx="-20" cy="780" r="220" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
        <circle cx="-20" cy="780" r="150" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
        <line x1="0" y1="0" x2="480" y2="900" stroke="rgba(232,65,10,.05)" strokeWidth="1"/>
        <line x1="480" y1="0" x2="0" y2="900" stroke="rgba(232,65,10,.04)" strokeWidth="1"/>
      </svg>

      {/* Оранжевый glow */}
      <div style={{position:'absolute',top:-80,right:-80,width:380,height:380,background:'radial-gradient(circle,rgba(232,65,10,.28) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:0,left:-60,width:280,height:280,background:'radial-gradient(circle,rgba(232,65,10,.1) 0%,transparent 70%)',pointerEvents:'none'}}/>

      {/* Контент */}
      <div style={{position:'relative',zIndex:1,padding:'48px 48px 0',display:'flex',flexDirection:'column',flex:1}}>
        <Link to="/" style={{display:'inline-flex',alignItems:'center',gap:10,textDecoration:'none',marginBottom:52}}>
          <span style={{width:38,height:38,borderRadius:10,background:'rgba(232,65,10,.2)',border:'1px solid rgba(232,65,10,.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>⚒️</span>
          <span style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'-.2px'}}>СвоиМастера</span>
        </Link>

        <div style={{flex:1}}>
          <h2 style={{fontSize:36,fontWeight:900,color:'#fff',lineHeight:1.08,margin:'0 0 16px',letterSpacing:'-.8px'}}>
            {title}
          </h2>
          <p style={{fontSize:15,color:'rgba(255,255,255,.5)',lineHeight:1.7,margin:'0 0 36px',maxWidth:320}}>{subtitle}</p>

          <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:16}}>
            {points.map(([icon, text]) => (
              <li key={text} style={{display:'flex',alignItems:'center',gap:14,fontSize:14,color:'rgba(255,255,255,.8)',fontWeight:600}}>
                <span style={{width:36,height:36,borderRadius:10,background:'rgba(232,65,10,.18)',border:'1px solid rgba(232,65,10,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:'#ff7043',flexShrink:0}}>{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Статистика внизу */}
      {stats && (
        <div style={{position:'relative',zIndex:1,display:'flex',margin:'0 48px',paddingBottom:0}}>
          <div style={{flex:1,display:'flex',gap:0,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',borderRadius:16,overflow:'hidden',marginBottom:48}}>
            {stats.map(([n,l],i) => (
              <div key={l} style={{flex:1,padding:'18px 12px',textAlign:'center',borderRight:i<stats.length-1?'1px solid rgba(255,255,255,.08)':'none'}}>
                <div style={{fontSize:22,fontWeight:900,color:'#fff',lineHeight:1}}>{n}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.35)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
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
            <span style={{fontSize: '20px'}}>⚒️</span>
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
            <span style={{fontSize: '20px'}}>⚒️</span>
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
                <div className="auth-role-sub">Ищу мастера</div>
              </div>
            </button>
            <button type="button"
              className={`auth-role-btn ${form.role === 'WORKER' ? 'active' : ''}`}
              onClick={() => setForm({...form, role:'WORKER'})}>
              {form.role === 'WORKER' && <span className="auth-role-check">✓</span>}
              <div className="auth-role-icon-wrap">🔧</div>
              <div className="auth-role-body">
                <div className="auth-role-title">Мастер</div>
                <div className="auth-role-sub">Выполняю заказы</div>
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