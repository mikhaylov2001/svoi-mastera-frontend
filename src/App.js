import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const SectionsPage = React.lazy(() => import('./pages/SectionsPage'));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'));
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
const ManageServicesPage = React.lazy(() => import('./pages/ManageServicesPage'));
const ActiveClientsPage = React.lazy(() => import('./pages/ActiveClientsPage'));
const LoginPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.RegisterPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const WorkerProfilePage = React.lazy(() => import('./pages/WorkerProfilePage'));
const DealsPage = React.lazy(() => import('./pages/DealsPage'));
const MyOrdersPage = React.lazy(() => import('./pages/MyOrdersPage'));
const FindWorkPage = React.lazy(() => import('./pages/FindWorkPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));


function AppContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Suspense fallback={<div className="page-loading">Загрузка...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sections" element={<SectionsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/sections/:sectionSlug" element={<CategoriesPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/deals" element={<ProtectedRoute><DealsPage /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
            <Route path="/find-work" element={<ProtectedRoute workerOnly><FindWorkPage /></ProtectedRoute>} />
            <Route path="/manage-services" element={<ProtectedRoute workerOnly><ManageServicesPage /></ProtectedRoute>} />
            <Route path="/active-clients" element={<ProtectedRoute workerOnly><ActiveClientsPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:partnerId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/worker" element={<ProtectedRoute workerOnly><WorkerProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Push permission granted');
        }
      });
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}