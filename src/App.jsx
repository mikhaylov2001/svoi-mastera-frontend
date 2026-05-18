import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { WORKER_HOME_PATH } from './constants/homePaths';
import HomePage, { WorkerHomeGate } from './pages/HomePage';
import SectionsPage from './pages/SectionsPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import ServicesPage from './pages/ServicesPage';
import ManageServicesPage from './roles/worker/ManageServicesPage';
import ActiveClientsPage from './roles/worker/ActiveClientsPage';
import MyListingsPage from './roles/worker/MyListingsPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import CustomerProfilePage from './roles/customer/CustomerProfilePage';
import WorkerProfilePage from './roles/worker/WorkerProfilePage';
import PublicWorkerProfilePage from './roles/worker/PublicWorkerProfilePage';
import PublicCustomerProfilePage from './roles/customer/PublicCustomerProfilePage';
import DealsPage from './roles/customer/DealsPage';
import WorkerDealsPage from './roles/worker/WorkerDealsPage';
import FindWorkPage from './roles/worker/FindWorkPage';
import FindMasterPage from './roles/customer/FindMasterPage';
import MyOrdersPage from './roles/customer/MyOrdersPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsSettingsPage from './pages/NotificationsSettingsPage';
import PersonalSettingsPage from './pages/PersonalSettingsPage';
import SupportPage from './pages/SupportPage';
import TermsPage   from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import FaqPage     from './pages/FaqPage';
import VerificationPage from './pages/VerificationPage';
import GuaranteeTermsPage from './pages/GuaranteeTermsPage';
import ListingDetailPage from './roles/worker/ListingDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import './App.css';
import './styles/unifiedListingCards.css';

/** Старый роут /jobs/:id — открываем ту же заявку в FindWorkPage */
function RedirectJobsDetailToFindWork() {
  const { id } = useParams();
  return <Navigate to={`/find-work?request=${encodeURIComponent(id)}`} replace />;
}

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

/** `/` — витрина заказчика/гостя; мастер уходит на отдельную главную без дублирования логики в HomePage. */
function CustomerHomeRoute() {
  const { userId, userRole } = useAuth();
  if (userId && userRole === 'WORKER') return <Navigate to={WORKER_HOME_PATH} replace />;
  return <HomePage />;
}

function AppContent() {
  const location = useLocation();

  const isChatPage = location.pathname.startsWith('/chat');
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const isHomeCatalog = location.pathname === '/' || location.pathname === WORKER_HOME_PATH;
  const isContentPage = !isAuthPage && !isHomeCatalog;

  return (
    <div className="app-shell">
      {!isAuthPage && <Header />}
      <main
        className={`app-main${isAuthPage ? ' app-main--auth' : ''}${isHomeCatalog ? ' app-main--home' : ''}${isContentPage ? ' app-main--content' : ''}`}
      >
        <Routes>
          <Route path="/"                element={<CustomerHomeRoute />} />
          <Route path="/worker-home"     element={<WorkerHomeGate />} />
          <Route path="/sections"        element={<SectionsPage />} />
          <Route path="/services"        element={<ServicesPage />} />
          <Route path="/categories"      element={<CategoriesPage />} />
          <Route path="/sections/:sectionSlug" element={<CategoriesPage />} />
          <Route path="/categories/:slug"      element={<CategoryPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile"         element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="/worker-profile"  element={<ProtectedRoute workerOnly><WorkerProfilePage /></ProtectedRoute>} />
          <Route path="/deals"           element={<ProtectedRoute><DealsRoute /></ProtectedRoute>} />
          <Route path="/find-work"       element={<ProtectedRoute workerOnly><FindWorkPage /></ProtectedRoute>} />
          <Route path="/jobs"            element={<ProtectedRoute workerOnly><FindWorkPage /></ProtectedRoute>} />
          <Route path="/jobs/:id"        element={<ProtectedRoute workerOnly><RedirectJobsDetailToFindWork /></ProtectedRoute>} />
          <Route path="/find-master"     element={<FindMasterPage />} />
          <Route path="/find-master/:categorySlug" element={<FindMasterPage />} />
          <Route path="/my-requests"     element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
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
          <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
          <Route path="/guarantee" element={<ProtectedRoute><GuaranteeTermsPage /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/listings/:id"    element={<ListingDetailPage />} />
          <Route path="*"                element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* Футер скрыт на странице чата */}
      {!isChatPage && !isAuthPage && <Footer />}
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
        <FavoritesProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </FavoritesProvider>
      </AuthProvider>
    </Router>
  );
}
