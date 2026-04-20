import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SectionsPage from './pages/SectionsPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import ServicesPage from './pages/ServicesPage';
import ManageServicesPage from './pages/ManageServicesPage';
import ActiveClientsPage from './pages/ActiveClientsPage';
import MyListingsPage from './pages/MyListingsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import CustomerProfilePage from './pages/CustomerProfilePage';
import WorkerProfilePage from './pages/WorkerProfilePage';
import PublicWorkerProfilePage from './pages/PublicWorkerProfilePage';
import PublicCustomerProfilePage from './pages/PublicCustomerProfilePage';
import DealsPage from './pages/DealsPage';
import WorkerDealsPage from './pages/WorkerDealsPage';
import FindWorkPage from './pages/FindWorkPage';
import FindMasterPage from './pages/FindMasterPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsSettingsPage from './pages/NotificationsSettingsPage';
import PersonalSettingsPage from './pages/PersonalSettingsPage';
import SupportPage from './pages/SupportPage';
import TermsPage   from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import FaqPage     from './pages/FaqPage';
import ListingDetailPage from './pages/ListingDetailPage';
import './App.css';

function ProtectedRoute({ children, workerOnly = false }) {
  const { userId, userRole } = useAuth();
  if (!userId) return <Navigate to="/login" replace />;
  if (workerOnly && userRole !== 'WORKER') return <Navigate to="/profile" replace />;
  return children;
}

// Роут /deals — показывает WorkerDealsPage мастеру, DealsPage клиенту
function DealsRoute() {
  const { userRole } = useAuth();
  return userRole === 'WORKER' ? <WorkerDealsPage /> : <DealsPage />;
}

function AppContent() {
  const location = useLocation();

  // На страницах чата скрываем футер — чат занимает весь экран
  const isChatPage = location.pathname.startsWith('/chat');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/sections"        element={<SectionsPage />} />
          <Route path="/services"        element={<ServicesPage />} />
          <Route path="/categories"      element={<CategoriesPage />} />
          <Route path="/sections/:sectionSlug" element={<CategoriesPage />} />
          <Route path="/categories/:slug"      element={<CategoryPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/profile"         element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="/worker-profile"  element={<ProtectedRoute workerOnly><WorkerProfilePage /></ProtectedRoute>} />
          <Route path="/deals"           element={<ProtectedRoute><DealsRoute /></ProtectedRoute>} />
          <Route path="/find-work"       element={<ProtectedRoute workerOnly><FindWorkPage /></ProtectedRoute>} />
          <Route path="/find-master"     element={<FindMasterPage />} />
          <Route path="/find-master/:categorySlug" element={<FindMasterPage />} />
          <Route path="/workers/:workerId" element={<PublicWorkerProfilePage />} />
          <Route path="/customers/:customerId" element={<PublicCustomerProfilePage />} />
          <Route path="/manage-services" element={<ProtectedRoute workerOnly><ManageServicesPage /></ProtectedRoute>} />
          <Route path="/active-clients"  element={<ProtectedRoute workerOnly><ActiveClientsPage /></ProtectedRoute>} />
          <Route path="/my-listings"     element={<ProtectedRoute workerOnly><MyListingsPage /></ProtectedRoute>} />
          <Route path="/chat"            element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/chat/:partnerId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/personal" element={<ProtectedRoute><PersonalSettingsPage /></ProtectedRoute>} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/terms"   element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faq"     element={<FaqPage />} />
          <Route path="/listings/:id"    element={<ListingDetailPage />} />
          <Route path="*"                element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* Футер скрыт на странице чата */}
      {!isChatPage && <Footer />}
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