import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';
import './Header.css';

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L6 8L8 10L14 4L12 2Z" fill="#e8410a"/>
      <path d="M20 6L18 8L24 14L26 12L20 6Z" fill="#e8410a"/>
      <path d="M10 10L2 18L6 22L14 14L10 10Z" fill="#e8410a"/>
      <circle cx="24" cy="24" r="6" stroke="#e8410a" strokeWidth="2" fill="none"/>
      <path d="M20 24L28 24" stroke="#e8410a" strokeWidth="2"/>
    </svg>
  );
}

function Header() {
  const { userId, role, userName, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let iv;
    async function loadUnread() {
      if (!userId) { setUnread(0); return; }
      try {
        const count = await getUnreadCount(userId);
        setUnread(count || 0);
      } catch (err) {
        setUnread(0);
      }
    }
    loadUnread();
    iv = setInterval(loadUnread, 10000);
    return () => clearInterval(iv);
  }, [userId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;
    navigate(`/services?q=${encodeURIComponent(query)}`);
    setSearchTerm('');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = userName
    ? userName.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : 'TK';

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">

          {/* LOGO */}
          <Link to="/" className="header-logo">
            <span className="header-logo-icon"><LogoIcon /></span>
            <span className="header-logo-text">СвоиМастера</span>
          </Link>

          <button
            className={`header-burger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Открыть/закрыть мобильное меню"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>

          {/* SEARCH */}
          <form onSubmit={handleSearchSubmit} className="header-search">
            <span className="header-search-icon"><SearchIcon /></span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Найти мастера или услугу…"
              aria-label="Поиск"
            />
          </form>

          {/* NAV */}
          <nav className="header-nav">
            <NavLink to="/"          end className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Главная</NavLink>
            <NavLink to="/categories"    className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Категории</NavLink>

            {userId ? (
              <>
                <NavLink to="/find-master" className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Найти мастера</NavLink>
                <NavLink to="/chat" className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>
                  Сообщения{unread > 0 ? ` • ${unread}` : ''}
                </NavLink>
                {role === 'WORKER' ? (
                  <>
                    <NavLink to="/find-work" className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Найти работу</NavLink>
                    <NavLink to="/active-clients" className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Активные клиенты</NavLink>
                    <NavLink to="/manage-services" className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Мои услуги</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/deals"  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Мои сделки</NavLink>
                  </>
                )}

                {/* Avatar dropdown */}
                <div className="header-user" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="header-avatar">{initials}</div>
                  {menuOpen && (
                    <div className="header-dropdown">
                      <div className="header-dropdown-name">{userName || 'Профиль'}</div>
                      <div className="header-dropdown-role">{role === 'WORKER' ? 'Мастер' : 'Заказчик'}</div>
                      <div className="header-dropdown-divider" />
                      <Link to="/profile" className="header-dropdown-item" onClick={() => setMenuOpen(false)}>Мой профиль</Link>
                      <button className="header-dropdown-item header-dropdown-logout" onClick={handleLogout}>Выйти</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="header-nav-link">Войти</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
              </>
            )}
          </nav>

          {mobileMenuOpen && (
            <>
              <div className="header-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
              <div className="header-mobile-menu">
                <NavLink onClick={() => setMobileMenuOpen(false)} to="/" className="header-mobile-link">Главная</NavLink>
                <NavLink onClick={() => setMobileMenuOpen(false)} to="/categories" className="header-mobile-link">Категории</NavLink>
                {userId && role === 'WORKER' && (
                  <>
                    <NavLink onClick={() => setMobileMenuOpen(false)} to="/find-work" className="header-mobile-link">Найти работу</NavLink>
                    <NavLink onClick={() => setMobileMenuOpen(false)} to="/active-clients" className="header-mobile-link">Активные клиенты</NavLink>
                    <NavLink onClick={() => setMobileMenuOpen(false)} to="/manage-services" className="header-mobile-link">Мои услуги</NavLink>
                  </>
                )}
                {userId && role !== 'WORKER' && (
                  <NavLink onClick={() => setMobileMenuOpen(false)} to="/deals" className="header-mobile-link">Мои сделки</NavLink>
                )}
                {userId ? (
                  <>
                    <button type="button" className="header-mobile-link header-mobile-logout" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>Выйти</button>
                  </>
                ) : (
                  <>
                    <Link className="header-mobile-link" to="/login" onClick={() => setMobileMenuOpen(false)}>Войти</Link>
                    <Link className="header-mobile-link btn btn-primary btn-sm" to="/register" onClick={() => setMobileMenuOpen(false)}>Регистрация</Link>
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