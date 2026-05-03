import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, workerOnly = false }) {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Загрузка данных пользователя...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (workerOnly && userRole !== 'WORKER') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

export default ProtectedRoute;
