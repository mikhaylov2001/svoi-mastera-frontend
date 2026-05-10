import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080/api/v1'
  : 'https://svoi-mastera-backend.onrender.com/api/v1';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function getStored(key, fallback = '') {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

// Читаем аватар из localStorage — принимаем любой формат
function getStoredAvatar() {
  try {
    return localStorage.getItem('userAvatar') || '';
  } catch { return ''; }
}

export function AuthProvider({ children }) {
  const [userId,       setUserId]       = useState(() => getStored('userId', null));
  const [userName,     setUserName]     = useState(() => getStored('userName', ''));
  const [userLastName, setUserLastName] = useState(() => getStored('userLastName', ''));
  const [userRole,     setUserRole]     = useState(() => getStored('userRole', 'CUSTOMER'));
  const [userAvatar,   setUserAvatar]   = useState(() => getStoredAvatar());
  const [loading,      setLoading]      = useState(true);

  // При старте — подгружаем актуальный профиль с сервера
  useEffect(() => {
    const id = getStored('userId', null);
    if (!id) { setLoading(false); return; }

    fetch(`${API_BASE}/users/${id}/profile`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        // Всегда синхронизируем с бэком (в т.ч. пустая строка), чтобы фамилия не «пропадала» до следующего запроса
        const ln = data.lastName != null ? String(data.lastName) : '';
        setUserLastName(ln);
        localStorage.setItem('userLastName', ln);
        const dn = data.displayName != null ? String(data.displayName) : '';
        if (dn) {
          setUserName(dn);
          localStorage.setItem('userName', dn);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Аватар грузим через /auth/me — обновляем только если сервер вернул непустой
    fetch(`${API_BASE}/auth/me`, { headers: { 'X-User-Id': id } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const av = data.avatarUrl || '';
        if (av && av.length > 10) {
          // Сервер вернул аватар — сохраняем
          setUserAvatar(av);
          localStorage.setItem('userAvatar', av);
        }
        // Если сервер вернул пустой — НЕ трогаем localStorage
        // Это важно: аватар мог быть загружен в этой сессии как base64
      })
      .catch(() => {});
  }, []);

  const login = (id, role = 'CUSTOMER', name = '', avatarUrl = '', lastName = '') => {
    const uid = String(id);
    setUserId(uid);
    setUserRole(role);
    setUserName(name);
    setUserLastName(lastName);
    setUserAvatar(avatarUrl);
    localStorage.setItem('userId', uid);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userLastName', lastName);
    localStorage.setItem('userAvatar', avatarUrl);
  };

  const logout = () => {
    setUserId(null); setUserRole('CUSTOMER');
    setUserName(''); setUserLastName(''); setUserAvatar('');
    ['userId','userRole','userName','userLastName','userAvatar']
      .forEach(k => localStorage.removeItem(k));
  };

  const updateAvatar = (url) => {
    setUserAvatar(url);
    localStorage.setItem('userAvatar', url);
  };

  const updateLastName = (ln) => {
    setUserLastName(ln);
    localStorage.setItem('userLastName', ln);
  };

  return (
    <AuthContext.Provider value={{
      userId, userName, userLastName, userRole, userAvatar,
      updateAvatar, updateLastName, login, logout,
      isAuthenticated: !!userId,
      isWorker: userRole === 'WORKER',
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}