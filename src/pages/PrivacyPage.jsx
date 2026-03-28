import React from 'react';
import './LegalPages.css';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container">
          <div className="legal-hero-inner">
            <div className="legal-hero-icon">🔒</div>
            <div>
              <div className="legal-hero-badge">Правовые документы</div>
              <h1>Политика конфиденциальности</h1>
              <p className="legal-hero-sub">
                Как мы собираем, используем и защищаем ваши данные
                <span className="legal-updated">Редакция от 1 марта 2026 г.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="legal-content">
        <div className="legal-card">

          <div className="legal-section">
            <h2><span className="legal-num">1</span>Кто мы</h2>
            <p>Настоящая Политика конфиденциальности описывает, каким образом платформа СвоиМастера (далее — «Платформа», «мы») обрабатывает персональные данные пользователей сервиса svoimastera.ru в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">2</span>Какие данные мы собираем</h2>
            <ul>
              <li><strong>Данные аккаунта:</strong> имя, фамилия, адрес электронной почты, номер телефона.</li>
              <li><strong>Данные профиля:</strong> фотография, город, описание услуг (для мастеров).</li>
              <li><strong>Данные сделок:</strong> история заявок, откликов, сделок и отзывов.</li>
              <li><strong>Сообщения:</strong> переписка в чате с другими пользователями.</li>
              <li><strong>Технические данные:</strong> IP-адрес, тип браузера, дата и время визитов.</li>
            </ul>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">3</span>Как мы используем данные</h2>
            <ul>
              <li>Для обеспечения работы сервиса и выполнения договора с вами.</li>
              <li>Для отображения вашего профиля другим пользователям Платформы.</li>
              <li>Для улучшения качества сервиса и пользовательского опыта.</li>
              <li>Для обеспечения безопасности и предотвращения мошенничества.</li>
              <li>Для направления сервисных уведомлений (при наличии вашего согласия).</li>
            </ul>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">4</span>Передача данных третьим лицам</h2>
            <p>Мы не продаём и не передаём ваши персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законодательством РФ или необходимых для работы сервиса (например, платёжные системы).</p>
            <div className="legal-highlight">
              <p>🛡️ Информация о профиле мастера (имя, фото, рейтинг) видна всем пользователям Платформы — это необходимо для работы сервиса.</p>
            </div>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">5</span>Хранение данных</h2>
            <p>Данные хранятся на защищённых серверах. Мы применяем технические и организационные меры для защиты ваших данных от несанкционированного доступа, изменения или уничтожения.</p>
            <p>Данные хранятся в течение всего срока действия вашего аккаунта, а после его удаления — ещё 3 года в соответствии с требованиями законодательства.</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">6</span>Ваши права</h2>
            <ul>
              <li>Получить доступ к своим персональным данным.</li>
              <li>Исправить неточные или устаревшие данные.</li>
              <li>Запросить удаление своего аккаунта и данных.</li>
              <li>Отозвать согласие на обработку данных.</li>
              <li>Подать жалобу в Роскомнадзор.</li>
            </ul>
            <p>Для реализации своих прав обратитесь в нашу службу поддержки.</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">7</span>Cookies</h2>
            <p>Платформа использует файлы cookie для обеспечения работы сервиса, анализа трафика и улучшения пользовательского опыта. Используя сервис, вы соглашаетесь с использованием cookie. Вы можете отключить cookie в настройках браузера, однако это может повлиять на работу некоторых функций.</p>
          </div>

          <div className="legal-divider"/>

          <div className="legal-section">
            <h2><span className="legal-num">8</span>Контакты</h2>
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