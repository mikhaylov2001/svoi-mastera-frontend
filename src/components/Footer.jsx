import React from 'react';
import { Link } from 'react-router-dom';
import { FaTools, FaQuestionCircle, FaBook } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo"><FaTools /> СвоиМастера</span>
            <p className="footer-tagline">Маркетплейс мастеров для дома и ремонта</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <div className="footer-col-title">Сервис</div>
              <Link to="/categories" className="footer-link">Категории</Link>
              <Link to="/register"   className="footer-link">Стать мастером</Link>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Помощь</div>
              <button className="footer-link"><FaQuestionCircle /> Поддержка</button>
              <button className="footer-link"><FaBook /> Правила</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© 2026 СвоиМастера. Все права защищены.</div>
      </div>
    </footer>
  );
}

export default Footer;