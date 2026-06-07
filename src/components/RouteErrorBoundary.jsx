import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Ловит ошибки рендера внутри страницы: шапка и навигация остаются, можно вернуться назад.
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Route render error:', error, info);
  }

  componentDidUpdate(prevProps) {
    const prevKey = prevProps.resetKey;
    const nextKey = this.props.resetKey;
    if (this.state.error && prevKey !== nextKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return <RouteErrorFallback error={error} onRetry={() => this.setState({ error: null })} />;
  }
}

function RouteErrorFallback({ error, onRetry }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="route-error" style={{ padding: '32px 20px', maxWidth: 480, margin: '0 auto' }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '24px 20px',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden>⚠️</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#111' }}>
          Не удалось показать страницу
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.5, color: '#6b7280' }}>
          Попробуйте вернуться назад или обновить экран.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: '100%',
              minHeight: 48,
              border: '1.5px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              color: '#374151',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Назад
          </button>
          <button
            type="button"
            onClick={onRetry}
            style={{
              width: '100%',
              minHeight: 48,
              border: 'none',
              borderRadius: 12,
              background: '#e8410a',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Попробовать снова
          </button>
          {location.pathname !== '/' ? (
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                minHeight: 44,
                border: 'none',
                borderRadius: 12,
                background: 'transparent',
                color: '#6b7280',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              На главную
            </button>
          ) : null}
        </div>
        {import.meta.env?.DEV && error?.message ? (
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              textAlign: 'left',
              fontSize: 11,
              overflow: 'auto',
              background: '#f3f4f6',
              borderRadius: 8,
              color: '#374151',
            }}
          >
            {error.message}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

/** Обёртка с автосбросом при смене URL. */
export function RouteErrorBoundaryWithReset({ children }) {
  const location = useLocation();
  return (
    <RouteErrorBoundary resetKey={location.pathname + location.search}>
      {children}
    </RouteErrorBoundary>
  );
}
