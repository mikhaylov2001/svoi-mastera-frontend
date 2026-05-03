import React from 'react';
import './LegalPages.css';

export default function SupportPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <div className="legal-hero-inner">
            <div className="legal-hero-icon">🛟</div>
            <div>
              <div className="legal-hero-badge">Служба поддержки</div>
              <h1>Центр поддержки</h1>
              <p className="legal-hero-sub">Мы готовы помочь — отвечаем быстро и по делу</p>
            </div>
          </div>
        </div>
      </div>

      <div className="legal-content">

        {/* Способы связи */}
        <div className="legal-card">
          <div className="legal-section">
            <h2>Свяжитесь с нами</h2>
            <p>Выберите удобный способ — мы ответим в течение нескольких часов.</p>
            <div className="legal-contact-grid">
              <a href="https://t.me/dm7723934" target="_blank" rel="noreferrer" className="legal-contact-card">
                <div className="legal-contact-icon">💬</div>
                <div className="legal-contact-title">Telegram</div>
                <div className="legal-contact-val">@dm7723934</div>
              </a>
              <a href="mailto:dm7723934@gmail.com" className="legal-contact-card">
                <div className="legal-contact-icon">✉️</div>
                <div className="legal-contact-title">Email</div>
                <div className="legal-contact-val">dm7723934@gmail.com</div>
              </a>
              <div className="legal-contact-card">
                <div className="legal-contact-icon">⏰</div>
                <div className="legal-contact-title">Время работы</div>
                <div className="legal-contact-val">24/7 — всегда на связи</div>
              </div>
            </div>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">1</span>Проблемы с аккаунтом</h2>
            <p>Если вы не можете войти, забыли пароль или хотите удалить аккаунт — напишите нам в Telegram или на email. Мы решим проблему в течение 24 часов.</p>
          </div>

          <div className="legal-section">
            <h2><span className="legal-num">2</span>Споры между пользователями</h2>
            <p>Если возник конфликт с мастером или заказчиком — напишите нам, подробно описав ситуацию. Мы изучим переписку и историю сделки и поможем найти решение.</p>
            <div className="legal-highlight">
              <p>📎 Приложите скриншоты переписки и номер сделки — это ускорит рассмотрение.</p>
            </div>
          </div>

          <div className="legal-section">
            <h2><span className="legal-num">3</span>Технические проблемы</h2>
            <p>Если что-то не работает — опишите проблему, укажите какое устройство и браузер используете. Мы разберёмся и исправим как можно скорее.</p>
          </div>

          <div className="legal-section">
            <h2><span className="legal-num">4</span>Вопросы по оплате</h2>
            <p>По вопросам оплаты и возврата средств обращайтесь на email или в Telegram. Возвраты обрабатываются в течение 3–5 рабочих дней.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
