import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function Header() {
  const { userId, role, userName, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
            <span className="header-logo-icon">🔨</span>
            <span className="header-logo-text">СвоиМастера</span>
          </Link>

          {/* SEARCH */}
          <div className="header-search">
            <span className="header-search-icon"><SearchIcon /></span>
            <input placeholder="Найти мастера или услугу…" />
          </div>

          {/* NAV */}
          <nav className="header-nav">
            <NavLink to="/"          end className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Главная</NavLink>
            <NavLink to="/categories"    className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Категории</NavLink>

            {userId ? (
              <>
                {role === 'WORKER' ? (
                  <NavLink to="/worker" className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Мои заявки</NavLink>
                ) : (
                  <NavLink to="/deals"  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}>Мои сделки</NavLink>
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

        </div>
      </div>
    </header>
  );
}

export default Header;