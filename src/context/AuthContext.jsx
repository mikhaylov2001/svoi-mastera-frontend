import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Читаем localStorage синхронно при инициализации —
// так userId доступен уже на первом рендере и PrivateRoute не редиректит.
function getStoredValue(key, fallback = '') {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }) {
  const [userId, setUserId]     = useState(() => getStoredValue('userId', null));
  const [userName, setUserName] = useState(() => getStoredValue('userName', ''));
  const [userRole, setUserRole] = useState(() => getStoredValue('userRole', 'CUSTOMER'));

  const login = (id, role = 'CUSTOMER', name = '') => {
    const userIdStr = String(id);

    setUserId(userIdStr);
    setUserRole(role);
    setUserName(name);

    localStorage.setItem('userId', userIdStr);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
  };

  const logout = () => {
    setUserId(null);
    setUserRole('CUSTOMER');
    setUserName('');

    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  };

  const value = {
    userId,
    userName,
    userRole,
    login,
    logout,
    isAuthenticated: !!userId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}