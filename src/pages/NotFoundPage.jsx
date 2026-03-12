import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-header-bar">
      <div className="container" style={{ textAlign: 'center' }}>
        <h1>404 — Страница не найдена</h1>
        <p>К сожалению, такой страницы в приложении нет.</p>
        <Link to="/" className="btn btn-primary">На главную</Link>
      </div>
    </div>
  );
}
