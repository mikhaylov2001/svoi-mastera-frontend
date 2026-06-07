import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App render error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Manrope, system-ui, sans-serif',
          background: '#f6f6f4',
        }}
      >
        <div
          style={{
            maxWidth: 360,
            width: '100%',
            background: '#fff',
            borderRadius: 16,
            padding: '24px 20px',
            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden>⚠️</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#111' }}>
            Не удалось открыть страницу
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.5, color: '#6b7280' }}>
            Обновите страницу. Если не помогло — откройте сайт в Safari или Chrome.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
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
            Обновить
          </button>
        </div>
      </div>
    );
  }
}
