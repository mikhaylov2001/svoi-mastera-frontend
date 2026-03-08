import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import ProfilePage from './pages/ProfilePage';
import WorkerProfilePage from './pages/WorkerProfilePage';
import DealsPage from './pages/DealsPage';
import './App.css';

// Protected route wrapper
function ProtectedRoute({ children, workerOnly = false }) {
  const { userId, userRole } = useAuth();

  if (!userId) return <Navigate to="/login" replace />;
  if (workerOnly && userRole !== 'WORKER') return <Navigate to="/profile" replace />;

  return children;
}

// Header component
function Header() {
const { userId, userRole } = useAuth();

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--gray-200)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
      }}>
        <Link to="/" style={{
          fontSize: 20,
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          color: 'var(--primary)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          🔨 СвоиМастера
        </Link>

        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/" style={navLinkStyle}>Главная</Link>
          <Link to="/categories" style={navLinkStyle}>Категории</Link>

          {userId ? (
            <>
              {userRole === 'WORKER' ? (
                <Link to="/worker" style={navLinkStyle}>Кабинет мастера</Link>
              ) : (
                <>
                  <Link to="/deals" style={navLinkStyle}>Мои сделки</Link>
                  <Link to="/profile" style={navLinkStyle}>Профиль</Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/login" style={navLinkStyle}>Войти</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const navLinkStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--gray-600)',
  textDecoration: 'none',
  transition: 'color 0.15s',
};

// Footer component
function Footer() {
  return (
    <footer style={{
      background: 'var(--gray-900)',
      color: 'rgba(255,255,255,0.6)',
      padding: '48px 0 32px',
      marginTop: 60,
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32,
          marginBottom: 32,
        }}>
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 900,
              color: '#fff',
              marginBottom: 12,
              fontFamily: 'var(--font-display)',
            }}>
              СвоиМастера
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              Маркетплейс для поиска мастеров<br />
              по домашним задачам
            </p>
          </div>

          <div>
            <h4 style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Для заказчиков
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/categories" style={footerLinkStyle}>Найти мастера</Link>
              <Link to="/deals" style={footerLinkStyle}>Мои сделки</Link>
            </div>
          </div>

          <div>
            <h4 style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Для мастеров
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/register" style={footerLinkStyle}>Стать мастером</Link>
              <Link to="/worker" style={footerLinkStyle}>Кабинет мастера</Link>
            </div>
          </div>
        </div>

        <div style={{
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          fontSize: 13,
        }}>
          © 2026 СвоиМастера. Все права защищены.
        </div>
      </div>
    </footer>
  );
}

const footerLinkStyle = {
  fontSize: 14,
  color: 'rgba(255,255,255,0.6)',
  textDecoration: 'none',
  transition: 'color 0.15s',
};

// Main App component
function AppContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/deals" element={
            <ProtectedRoute>
              <DealsPage />
            </ProtectedRoute>
          } />

          <Route path="/worker" element={
            <ProtectedRoute workerOnly>
              <WorkerProfilePage />
            </ProtectedRoute>
          } />
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