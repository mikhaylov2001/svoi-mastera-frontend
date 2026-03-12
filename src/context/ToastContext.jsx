import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast = { id, message, variant: options.variant || 'info', duration: options.duration || 3000 };

    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, toast.duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-holder">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
