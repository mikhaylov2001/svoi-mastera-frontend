import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getUnreadCount } from './api';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SectionsPage from './pages/SectionsPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import ServicesPage from './pages/ServicesPage';
import ManageServicesPage from './pages/ManageServicesPage';
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

function AppContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/categories" element={<SectionsPage />} />
          <Route path="/sections/:sectionSlug" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/deals" element={<ProtectedRoute><DealsPage /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/find-work" element={<ProtectedRoute workerOnly><FindWorkPage /></ProtectedRoute>} />
          <Route path="/manage-services" element={<ProtectedRoute workerOnly><ManageServicesPage /></ProtectedRoute>} />
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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}