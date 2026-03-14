import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo">
                <span style={{ fontSize: 26 }}>🔨</span>
                <span className="footer-logo-text">СвоиМастера</span>
              </div>
            </div>
            <p className="footer-desc">
              Маркетплейс мастеров для дома и ремонта в Йошкар-Оле. Быстро, надёжно, безопасно.
            </p>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Сервис</div>
            <Link to="/categories"  className="footer-link">Категории</Link>
            <Link to="/find-master" className="footer-link">Найти мастера</Link>
            <Link to="/register"    className="footer-link">Стать мастером</Link>
            <Link to="/deals"       className="footer-link">Мои сделки</Link>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Помощь</div>
            <a href="#" className="footer-link">Поддержка</a>
            <a href="#" className="footer-link">Правила сервиса</a>
            <a href="#" className="footer-link">Политика конфиденциальности</a>
            <a href="#" className="footer-link">Частые вопросы</a>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Контакты</div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📍</span>
              Йошкар-Ола, Россия
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">✉️</span>
              support@svoimastera.ru
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
            <a href="#" className="footer-bottom-link">Правила</a>
            <a href="#" className="footer-bottom-link">Конфиденциальность</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
