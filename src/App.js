import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getUnreadCount } from './api';
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
import ChatPage from './pages/ChatPage';
import './App.css';

function ProtectedRoute({ children, workerOnly = false }) {
  const { userId, userRole } = useAuth();
  if (!userId) return <Navigate to="/login" replace />;
  if (workerOnly && userRole !== 'WORKER') return <Navigate to="/profile" replace />;
  return children;
}

function Header() {
  const { userId, userRole, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const loc = useLocation();

  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, [open]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Poll unread messages
  useEffect(() => {
    if (!userId) return;
    const poll = () => getUnreadCount(userId).then(r => setUnread(r.count || 0)).catch(() => {});
    poll();
    const iv = setInterval(poll, 10000);
    return () => clearInterval(iv);
  }, [userId]);

  const handleLogout = () => { logout(); setOpen(false); };

  const chatLink = (
    <Link to="/chat" className="hd-link hd-chat-link">
      💬{unread > 0 && <span className="hd-chat-badge">{unread}</span>}
    </Link>
  );

  const navLinks = () => {
    if (!userId) return (
      <>
        <Link to="/login" className="hd-link">Войти</Link>
        <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
      </>
    );
    if (userRole === 'WORKER') return (
      <>
        <Link to="/find-work" className="hd-link">Найти работу</Link>
        {chatLink}
        <Link to="/worker" className="hd-link">Кабинет</Link>
      </>
    );
    return (
      <>
        <Link to="/my-orders" className="hd-link">Мои заказы</Link>
        <Link to="/deals" className="hd-link">Сделки</Link>
        {chatLink}
        <Link to="/profile" className="hd-link">Профиль</Link>
      </>
    );
  };

  const mobileLinks = () => {
    const links = [
      ['/','Главная'],
      ['/sections','Услуги'],
    ];
    if (userId && userRole === 'WORKER') {
      links.push(['/find-work','Найти работу'], ['/chat','Сообщения'], ['/worker','Кабинет мастера']);
    } else if (userId) {
      links.push(['/my-orders','Мои заказы'], ['/deals','Сделки'], ['/chat','Сообщения'], ['/profile','Профиль']);
    }
    return (
      <>
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="hd-mob-link">{label}</Link>
        ))}
        {userId ? (
          <>
            <div className="hd-mob-sep" />
            <button className="hd-mob-link hd-mob-logout" onClick={handleLogout}>Выйти</button>
          </>
        ) : (
          <>
            <div className="hd-mob-sep" />
            <Link to="/login" className="hd-mob-link">Войти</Link>
            <Link to="/register" className="hd-mob-link hd-mob-accent">Регистрация</Link>
          </>
        )}
      </>
    );
  };

  return (
    <header className="hd">
      <div className="container hd-inner">
        <Link to="/" className="hd-logo">🔨 <span>СвоиМастера</span></Link>
        <nav className="hd-nav">
          <Link to="/" className="hd-link">Главная</Link>
          <Link to="/sections" className="hd-link">Услуги</Link>
          {navLinks()}
        </nav>
        <button className={`hd-burger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Меню">
          <span /><span /><span />
        </button>
      </div>
      {open && (
        <div className="hd-mob-overlay" onClick={() => setOpen(false)}>
          <nav className="hd-mob-menu" ref={ref} onClick={e => e.stopPropagation()}>
            {mobileLinks()}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="ft">
      <div className="container">
        <div className="ft-grid">
          <div>
            <div className="ft-brand">🔨 СвоиМастера в Йошкар-Оле</div>
            <p className="ft-tag">Маркетплейс для поиска мастеров</p>
          </div>
          <div className="ft-col">
            <div className="ft-col-title">Заказчикам</div>
            <Link to="/sections" className="ft-link">Найти мастера</Link>
            <Link to="/my-orders" className="ft-link">Мои заказы</Link>
          </div>
          <div className="ft-col">
            <div className="ft-col-title">Мастерам</div>
            <Link to="/register" className="ft-link">Стать мастером</Link>
            <Link to="/find-work" className="ft-link">Найти работу</Link>
          </div>
        </div>
        <div className="ft-bottom">© 2026 СвоиМастера в Йошкар-Оле</div>
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
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/chat/:partnerId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
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