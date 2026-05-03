import React from 'react';
import './LegalPages.css';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <div className="legal-hero-inner">
            <div className="legal-hero-icon">📋</div>
            <div>
              <div className="legal-hero-badge">Правовые документы</div>
              <h1>Правила сервиса</h1>
              <p className="legal-hero-sub">
                Пользовательское соглашение платформы СвоиМастера
                <span className="legal-updated">Редакция от 1 марта 2026 г.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="legal-content">
        <div className="legal-card">

          <div className="legal-section">
            <h2><span className="legal-num">1</span>Общие положения</h2>
            <p>Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между ИП / командой СвоиМастера (далее — «Платформа») и физическими лицами, использующими сервис svoimastera.ru (далее — «Пользователи»).</p>
            <p>Регистрируясь на Платформе, Пользователь подтверждает, что ознакомился с настоящим Соглашением, понимает его условия и принимает их в полном объёме.</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">2</span>Статус Платформы</h2>
            <p>СвоиМастера является информационным посредником и <strong>не является стороной договора</strong> между Заказчиком и Мастером. Платформа предоставляет инструменты для поиска, общения и оформления сделок, но не несёт ответственности за качество выполненных работ, соблюдение сроков и иные обязательства сторон.</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">3</span>Регистрация и аккаунт</h2>
            <ul>
              <li>Регистрация доступна лицам старше 18 лет.</li>
              <li>При регистрации необходимо указать достоверные данные.</li>
              <li>Один пользователь вправе иметь один аккаунт.</li>
              <li>Пользователь несёт ответственность за сохранность своего пароля.</li>
              <li>Платформа вправе заблокировать аккаунт при нарушении настоящего Соглашения.</li>
            </ul>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">4</span>Правила для Заказчиков</h2>
            <ul>
              <li>Описывайте задачу честно и подробно.</li>
              <li>Оплачивайте работу только после её фактического выполнения.</li>
              <li>Не размещайте заявки с незаконным содержанием.</li>
              <li>Оставляйте объективные отзывы о мастерах.</li>
            </ul>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">5</span>Правила для Мастеров</h2>
            <ul>
              <li>Выполняйте работы качественно и в согласованные сроки.</li>
              <li>Указывайте реальные цены и опыт работы.</li>
              <li>Не вводите Заказчиков в заблуждение относительно своей квалификации.</li>
              <li>Общайтесь вежливо и профессионально.</li>
              <li>Подтверждайте завершение работ только после их реального выполнения.</li>
            </ul>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">6</span>Запрещённый контент</h2>
            <p>На Платформе запрещается:</p>
            <ul>
              <li>Публикация незаконного, оскорбительного или мошеннического контента.</li>
              <li>Распространение спама и нежелательных сообщений.</li>
              <li>Создание фиктивных аккаунтов и отзывов.</li>
              <li>Обход системы платежей Платформы.</li>
              <li>Раскрытие персональных данных третьих лиц без их согласия.</li>
            </ul>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">7</span>Ответственность</h2>
            <p>Платформа не гарантирует непрерывную и безошибочную работу сервиса. В максимально допустимых законом пределах ответственность Платформы ограничена суммой комиссии, уплаченной Пользователем за последние 12 месяцев.</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">8</span>Изменение условий</h2>
            <p>Платформа вправе изменять настоящее Соглашение в одностороннем порядке. Новая редакция вступает в силу через 7 дней после публикации. Продолжение использования сервиса означает согласие с новыми условиями.</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">9</span>Контакты</h2>
            <p>По всем вопросам, связанным с настоящим Соглашением, обращайтесь:</p>
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
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}