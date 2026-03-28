import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Footer.css';

function Footer() {
  const { userId } = useAuth();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          <div className="footer-brand">
            <div className="footer-logo">
              <span style={{ fontSize: 26 }}>🔨</span>
              <span className="footer-logo-text">СвоиМастера</span>
            </div>
            <p className="footer-desc">
              Маркетплейс мастеров для дома и ремонта в Йошкар-Оле. Быстро, надёжно, безопасно.
            </p>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Сервис</div>
            {/* Найти мастера — только для незарегистрированных */}
            {!userId && (
              <Link to="/register" className="footer-link">Найти мастера</Link>
            )}
            {/* Стать мастером — только для незарегистрированных */}
            {!userId && (
              <Link to="/register?role=WORKER" className="footer-link">Стать мастером</Link>
            )}
            {userId && (
              <Link to="/deals" className="footer-link">Мои сделки</Link>
            )}
            {userId && (
              <Link to="/chat" className="footer-link">Сообщения</Link>
            )}
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Помощь</div>
            <Link to="/support" className="footer-link">Поддержка</Link>
            <Link to="/terms"   className="footer-link">Правила сервиса</Link>
            <Link to="/privacy" className="footer-link">Политика конфиденциальности</Link>
            <Link to="/faq"     className="footer-link">Частые вопросы</Link>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Контакты</div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📍</span>
              Йошкар-Ола, Россия
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">✉️</span>
              dm7723934@gmail.com
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">💬</span>
              <a href="https://t.me/dm7723934" target="_blank" rel="noreferrer" style={{color:'inherit'}}>
                Telegram: @dm7723934
              </a>
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">⏰</span>
              24/7 — всегда на связи
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">© 2026 СвоиМастера. Все права защищены.</div>
          <div className="footer-bottom-right">
            <Link to="/terms"   className="footer-bottom-link">Правила</Link>
            <Link to="/privacy" className="footer-bottom-link">Конфиденциальность</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;