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
  const [userId,      setUserId]      = useState(() => getStoredValue('userId', null));
  const [userName,    setUserName]    = useState(() => getStoredValue('userName', ''));
  const [userLastName,setUserLastName]= useState(() => getStoredValue('userLastName', ''));
  const [userRole,    setUserRole]    = useState(() => getStoredValue('userRole', 'CUSTOMER'));
  const [userAvatar,  setUserAvatar]  = useState(() => getStoredValue('userAvatar', ''));
  const [loading,    setLoading]    = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const login = (id, role = 'CUSTOMER', name = '', avatarUrl = '', lastName = '') => {
    const userIdStr = String(id);
    setUserId(userIdStr);
    setUserRole(role);
    setUserName(name);
    setUserLastName(lastName);
    setUserAvatar(avatarUrl);
    localStorage.setItem('userId', userIdStr);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userLastName', lastName);
    localStorage.setItem('userAvatar', avatarUrl);
  };

  const logout = () => {
    setUserId(null);
    setUserRole('CUSTOMER');
    setUserName('');
    setUserLastName('');
    setUserAvatar('');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userAvatar');
  };

  const updateAvatar = (url) => {
    setUserAvatar(url);
    localStorage.setItem('userAvatar', url);
  };

  const updateLastName = (ln) => {
    setUserLastName(ln);
    localStorage.setItem('userLastName', ln);
  };

  const value = {
    userId,
    userName,
    userLastName,
    userRole,
    userAvatar,
    updateAvatar,
    updateLastName,
    login,
    logout,
    isAuthenticated: !!userId,
    isWorker: userRole === 'WORKER',
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}