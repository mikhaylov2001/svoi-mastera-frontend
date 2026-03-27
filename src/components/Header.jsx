import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';
import './Header.css';

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function LogoIcon() {
  return <span style={{ fontSize: 28 }}>🔨</span>;
}

function Header() {
  const { userId, userRole, userName, userAvatar, logout } = useAuth();
  const fullAvatarUrl = userAvatar
    ? (userAvatar.startsWith('http') || userAvatar.startsWith('data:')
        ? userAvatar
        : 'https://svoi-mastera-backend.onrender.com' + userAvatar)
    : '';
  const navigate = useNavigate();
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [unread,         setUnread]         = useState(0);

  useEffect(() => {
    let iv;
    async function loadUnread() {
      if (!userId) { setUnread(0); return; }
      try {
        const count = await getUnreadCount(userId);
        setUnread(count || 0);
      } catch {
        setUnread(0);
      }
    }
    loadUnread();
    iv = setInterval(loadUnread, 10000);
    return () => clearInterval(iv);
  }, [userId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/services?q=${encodeURIComponent(q)}`);
    setSearchTerm('');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = userName
    ? userName.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : 'SM';

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">

          {/* ── LOGO ── */}
          <Link to="/" className="header-logo">
            <LogoIcon />
            <span className="header-logo-text">СвоиМастера</span>
          </Link>

          {/* ── BURGER ── */}
          <button
            className={`header-burger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Меню"
            type="button"
          >
            <span /><span /><span />
          </button>

          {/* ── SEARCH ── */}
          <form onSubmit={handleSearchSubmit} className="header-search">
            <span className="header-search-icon"><SearchIcon /></span>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Найти мастера или услугу…"
              aria-label="Поиск"
            />
          </form>

          {/* ── NAV ── */}
          <nav className="header-nav">
            <NavLink
              to="/" end
              className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
            >
              Главная
            </NavLink>

            {userId && userRole === 'WORKER' ? (
              <>
                {/* ══ НАВИГАЦИЯ ДЛЯ МАСТЕРА ══ */}
                <NavLink
                  to="/find-work"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Найти работу
                </NavLink>
                <NavLink
                  to="/active-clients"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Активные клиенты
                </NavLink>
                <NavLink
                  to="/chat"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Сообщения
                  {unread > 0 && (
                    <span className="header-unread-badge">{unread}</span>
                  )}
                </NavLink>
                <NavLink
                  to="/deals"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Мои сделки
                </NavLink>
              </>
            ) : userId ? (
              <>
                {/* ══ НАВИГАЦИЯ ДЛЯ ЗАКАЗЧИКА ══ */}
                <NavLink
                  to="/categories"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Найти мастера
                </NavLink>
                <NavLink
                  to="/find-master"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Активные мастера
                </NavLink>
                <NavLink
                  to="/chat"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Сообщения
                  {unread > 0 && (
                    <span className="header-unread-badge">{unread}</span>
                  )}
                </NavLink>
                <NavLink
                  to="/deals"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Мои сделки
                </NavLink>
              </>
            ) : (
              <>
                {/* ══ ДЛЯ НЕАВТОРИЗОВАННЫХ ══ */}
                <NavLink
                  to="/categories"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Найти мастера
                </NavLink>
              </>
            )}

            {userId ? (
                <div
                  className="header-user"
                  onClick={() => setMenuOpen(v => !v)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  tabIndex={0}
                >
                  <div className="header-avatar">
                    {fullAvatarUrl
                      ? <img src={fullAvatarUrl} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
                      : initials
                    }
                  </div>

                  {menuOpen && (
                    <div className="header-dropdown">
                      <div className="header-dropdown-name">{userName || 'Профиль'}</div>
                      <div className="header-dropdown-role">
                        {userRole === 'WORKER' ? 'Мастер' : 'Заказчик'}
                      </div>
                      <div className="header-dropdown-divider" />
                      <Link
                        to="/profile"
                        className="header-dropdown-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Мой профиль
                      </Link>
                      <button
                        className="header-dropdown-item header-dropdown-logout"
                        onClick={handleLogout}
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
            ) : (
              <>
                <Link to="/login"    className="header-nav-link">Войти</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
              </>
            )}
          </nav>

          {/* ── MOBILE MENU ── */}
          {mobileMenuOpen && (
            <>
              <div
                className="header-mobile-backdrop"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="header-mobile-menu">
                <NavLink to="/" end className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  Главная
                </NavLink>

                {userId && userRole === 'WORKER' ? (
                  <>
                    {/* ══ МОБИЛЬНОЕ МЕНЮ МАСТЕРА ══ */}
                    <NavLink to="/find-work" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Найти работу
                    </NavLink>
                    <NavLink to="/active-clients" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Активные клиенты
                    </NavLink>
                    <NavLink to="/chat" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Сообщения {unread > 0 && `• ${unread}`}
                    </NavLink>
                    <NavLink to="/deals" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Мои сделки
                    </NavLink>
                  </>
                ) : userId ? (
                  <>
                    {/* ══ МОБИЛЬНОЕ МЕНЮ ЗАКАЗЧИКА ══ */}
                    <NavLink to="/categories" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Найти мастера
                    </NavLink>
                    <NavLink to="/find-master" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Активные мастера
                    </NavLink>
                    <NavLink to="/chat" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Сообщения {unread > 0 && `• ${unread}`}
                    </NavLink>
                    <NavLink to="/deals" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Мои сделки
                    </NavLink>
                  </>
                ) : (
                  <NavLink to="/categories" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    Найти мастера
                  </NavLink>
                )}

                {userId && (
                  <>
                    <NavLink to="/profile" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Профиль
                    </NavLink>
                    <button
                      type="button"
                      className="header-mobile-link header-mobile-logout"
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    >
                      Выйти
                    </button>
                  </>
                )}

                {!userId && (
                  <>
                    <Link to="/login"    className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>Войти</Link>
                    <Link to="/register" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>Регистрация</Link>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </header>
  );
}

export default Header;