import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

const ICONS = {
  success: '✅',
  error:   '❌',
  info:    '💬',
  offer:   '📩',
  deal:    '🎉',
  confirm: '✅',
  complete:'🏆',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, typeOrOptions = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const isString = typeof typeOrOptions === 'string';
    const variant  = isString ? typeOrOptions : (typeOrOptions.variant || 'info');
    const duration = isString ? 4000 : (typeOrOptions.duration || 4000);
    const title    = isString ? null  : typeOrOptions.title;

    setToasts(prev => [...prev, { id, message, variant, duration, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:10000, display:'flex', flexDirection:'column', gap:10, maxWidth:360 }}>
        {toasts.map(toast => (
          <div key={toast.id}
            onClick={() => dismiss(toast.id)}
            style={{
              display:'flex', alignItems:'flex-start', gap:12,
              background:'#fff', borderRadius:14, padding:'14px 16px',
              boxShadow:'0 8px 32px rgba(0,0,0,0.16)', cursor:'pointer',
              borderLeft:`4px solid ${toast.variant === 'error' ? '#ef4444' : toast.variant === 'success' ? '#22c55e' : '#e8410a'}`,
              animation:'slideInRight .3s cubic-bezier(.16,1,.3,1)',
              minWidth:280,
            }}
          >
            <span style={{ fontSize:20, flexShrink:0, lineHeight:1.2 }}>
              {ICONS[toast.variant] || ICONS.info}
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              {toast.title && (
                <div style={{ fontSize:13, fontWeight:800, color:'#111827', marginBottom:3 }}>{toast.title}</div>
              )}
              <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{toast.message}</div>
            </div>
            <button onClick={() => dismiss(toast.id)}
              style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:16, padding:0, flexShrink:0, lineHeight:1 }}>
              ×
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(40px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}