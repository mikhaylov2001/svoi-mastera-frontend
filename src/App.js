import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import SectionsPage from './pages/SectionsPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import ProfilePage from './pages/ProfilePage';
import WorkerProfilePage from './pages/WorkerProfilePage';
import DealsPage from './pages/DealsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import FindWorkPage from './pages/FindWorkPage';
import './App.css';

function ProtectedRoute({ children, workerOnly = false }) {
  const { userId, userRole } = useAuth();
  if (!userId) return <Navigate to="/login" replace />;
  if (workerOnly && userRole !== 'WORKER') return <Navigate to="/profile" replace />;
  return children;
}

function Header() {
  const { userId, userRole, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  const handleLogout = () => { logout(); setMenuOpen(false); };

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link to="/" className="app-logo">
          🔨 <span className="app-logo-name">СвоиМастера</span>{' '}
          <span className="app-logo-city">в Йошкар-Оле</span>
        </Link>

        <nav className="app-nav-desktop">
          <Link to="/" className="app-nav-link">Главная</Link>
          <Link to="/sections" className="app-nav-link">Услуги</Link>
          {userId ? (
            <>
              {userRole === 'WORKER' ? (
                <>
                  <Link to="/find-work" className="app-nav-link">Найти работу</Link>
                  <Link to="/worker" className="app-nav-link">Кабинет</Link>
                </>
              ) : (
                <>
                  <Link to="/my-orders" className="app-nav-link">Мои заказы</Link>
                  <Link to="/deals" className="app-nav-link">Сделки</Link>
                  <Link to="/profile" className="app-nav-link">Профиль</Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="app-nav-link">Войти</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
            </>
          )}
        </nav>

        <button
          className={`app-burger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="app-mobile-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="app-mobile-menu" ref={menuRef} onClick={e => e.stopPropagation()}>
            <Link to="/" className="app-mobile-link">Главная</Link>
            <Link to="/sections" className="app-mobile-link">Услуги</Link>
            {userId ? (
              <>
                {userRole === 'WORKER' ? (
                  <>
                    <Link to="/find-work" className="app-mobile-link">Найти работу</Link>
                    <Link to="/worker" className="app-mobile-link">Кабинет мастера</Link>
                  </>
                ) : (
                  <>
                    <Link to="/my-orders" className="app-mobile-link">Мои заказы</Link>
                    <Link to="/deals" className="app-mobile-link">Сделки</Link>
                    <Link to="/profile" className="app-mobile-link">Профиль</Link>
                  </>
                )}
                <div className="app-mobile-divider" />
                <button className="app-mobile-link app-mobile-logout" onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <>
                <div className="app-mobile-divider" />
                <Link to="/login" className="app-mobile-link">Войти</Link>
                <Link to="/register" className="app-mobile-link app-mobile-register">Регистрация</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="app-footer-grid">
          <div>
            <div className="app-footer-brand">🔨 СвоиМастера в Йошкар-Оле</div>
            <p className="app-footer-tagline">Маркетплейс для поиска мастеров</p>
          </div>
          <div className="app-footer-col">
            <div className="app-footer-col-title">Для заказчиков</div>
            <Link to="/sections" className="app-footer-link">Найти мастера</Link>
            <Link to="/deals" className="app-footer-link">Мои сделки</Link>
          </div>
          <div className="app-footer-col">
            <div className="app-footer-col-title">Для мастеров</div>
            <Link to="/register" className="app-footer-link">Стать мастером</Link>
            <Link to="/worker" className="app-footer-link">Кабинет мастера</Link>
          </div>
        </div>
        <div className="app-footer-bottom">© 2026 СвоиМастера в Йошкар-Оле. Все права защищены.</div>
      </div>
    </footer>
  );
}

function AppContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/categories" element={<SectionsPage />} />
          <Route path="/sections/:sectionSlug" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/deals" element={<ProtectedRoute><DealsPage /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/find-work" element={<ProtectedRoute workerOnly><FindWorkPage /></ProtectedRoute>} />
          <Route path="/worker" element={<ProtectedRoute workerOnly><WorkerProfilePage /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}