import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>Свои мастера в один клик</h1>
          <p>
            Размещайте заявку, получайте отклики и выбирайте проверенных мастеров
            по рейтингу и отзывам — без лишних звонков и поиска по объявлениям.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/categories">
              Найти мастера
            </Link>
            <Link className="btn ghost" to="/deals">
              Мои сделки
            </Link>
          </div>
          <p className="hero-meta">
            Всё уже работает на боевом сервере — попробуйте на реальных данных.
          </p>
        </div>

        <div className="hero-card">
          <div className="hero-stats">
            <div>
              <span className="stat-number">24/7</span>
              <span className="stat-label">заявки онлайн</span>
            </div>
            <div>
              <span className="stat-number">10+</span>
              <span className="stat-label">категорий услуг</span>
            </div>
            <div>
              <span className="stat-number">5.0</span>
              <span className="stat-label">оценка мастеров</span>
            </div>
          </div>
          <div className="hero-mini-card">
            <span className="dot online"></span>
            <div>
              <p className="mini-title">Мастер уже в пути</p>
              <p className="mini-sub">Среднее время первого отклика — 10 минут</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Как это работает</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-tag">1 шаг</span>
            <h3>Создайте запрос</h3>
            <p>Опишите задачу, загрузите фото и укажите удобное время.</p>
          </div>
          <div className="feature-card">
            <span className="feature-tag">2 шаг</span>
            <h3>Получите отклики</h3>
            <p>Мастера предложат цену и сроки, вы увидите рейтинг и отзывы.</p>
          </div>
          <div className="feature-card">
            <span className="feature-tag">3 шаг</span>
            <h3>Заключите сделку</h3>
            <p>Выберите мастера и оформите сделку в пару кликов внутри сервиса.</p>
          </div>
        </div>
      </section>

      <section className="cta-block">
        <div className="cta-inner">
          <div>
            <h2>Готовы протестировать сервис?</h2>
            <p>Перейдите к списку категорий и создайте свои первые задачи.</p>
          </div>
          <Link className="btn primary" to="/categories">
            Перейти к категориям
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
