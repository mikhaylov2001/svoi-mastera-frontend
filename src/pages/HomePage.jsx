import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SECTIONS } from './SectionsPage';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import './HomePage.css';

const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

const REVIEWS = [
  {
    name: 'Анна К.',
    initials: 'АК',
    color: '#6366f1',
    text: 'Нашла сантехника за 15 минут. Приехал вовремя, всё сделал аккуратно. Сервис огонь!',
    rating: 5,
    service: 'Сантехника',
  },
  {
    name: 'Михаил Р.',
    initials: 'МР',
    color: '#0ea5e9',
    text: 'Заказывал электрика для новой квартиры. Мастер профессиональный, цена честная.',
    rating: 5,
    service: 'Электрика',
  },
  {
    name: 'Светлана Т.',
    initials: 'СТ',
    color: '#22c55e',
    text: 'Репетитор по математике для дочки — нашла через сервис. Уже видим результат!',
    rating: 5,
    service: 'Образование',
  },
];

const BENEFITS = [
  { icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  title: 'Быстрый отклик',       desc: 'Первые предложения от мастеров поступают в течение 10 минут после публикации задачи' },
  { icon: '🔒', color: '#22c55e', bg: 'rgba(34,197,94,.1)',   title: 'Безопасная сделка',     desc: 'Оплата защищена — деньги переходят мастеру только после подтверждения выполненной работы' },
  { icon: '⭐', color: '#6366f1', bg: 'rgba(99,102,241,.1)',  title: 'Проверенные мастера',   desc: 'Рейтинг, отзывы и история выполненных работ — выбирайте лучшего с полной информацией' },
  { icon: '💬', color: '#0ea5e9', bg: 'rgba(14,165,233,.1)',  title: 'Чат внутри сервиса',    desc: 'Обсуждайте детали, отправляйте фото и уточняйте условия прямо в приложении' },
  { icon: '📍', color: '#e8410a', bg: 'rgba(232,65,10,.1)',   title: 'Мастера рядом',         desc: 'Только мастера из Йошкар-Олы — никаких долгих ожиданий и лишних расходов на дорогу' },
  { icon: '🎯', color: '#d13a99', bg: 'rgba(209,58,153,.1)',  title: 'Точная цена',           desc: 'Мастер называет цену до начала работы. Никаких скрытых платежей и сюрпризов' },
];

const WORKER_BENEFITS = [
  { icon: '📋', title: 'Прямые заявки',      desc: 'Получайте заказы напрямую от клиентов без посредников' },
  { icon: '💰', title: 'Комиссия 5%',        desc: 'Минимальная комиссия платформы — больше прибыли вам' },
  { icon: '⭐', title: 'Рейтинг и отзывы',   desc: 'Зарабатывайте репутацию и получайте больше заказов' },
  { icon: '💬', title: 'Чат с клиентами',    desc: 'Обсуждайте детали заказа прямо в сервисе' },
  { icon: '🔔', title: 'Уведомления',        desc: 'Не пропускайте новые заявки и сообщения' },
  { icon: '📱', title: 'Удобно везде',       desc: 'Работайте с телефона, планшета или компьютера' },
];

export default function HomePage() {
  const { userId, userRole } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Для мастеров показываем специальную версию
  if (userRole === 'WORKER') {
    return <WorkerHomePage userId={userId} />;
  }

  // Для заказчиков и гостей — обычная версия
  return (
    <div>
      {/* ══ HERO (тёмный) ══ */}
      <section className="home-hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-tag fade-up">
                <span className="hero-tag-dot" />
                Йошкар-Ола · Маркетплейс мастеров
              </div>
              <h1 className="hero-title fade-up-1">
                Свои мастера<br />
                для <span>любых задач</span><br />
                в Йошкар-Оле
              </h1>
              <p className="hero-subtitle fade-up-2">
                Опишите задачу — мастера откликнутся сами.<br />
                Выбирайте по рейтингу, договаривайтесь внутри сервиса.
              </p>
              <div className="hero-actions fade-up-3">
                <Link to={userId ? '/categories' : '/register'} className="btn btn-lg hero-btn-primary">
                  🔍 Найти мастера
                </Link>
                <Link to={userId ? '/worker-profile' : '/register?role=WORKER'} className="btn btn-lg hero-btn-ghost">
                  Стать мастером →
                </Link>
              </div>
              <div className="hero-trust fade-up-4">
                {[['24/7','приём заявок'],['9','категорий'],['5.0★','рейтинг']].map(([n,l]) => (
                  <div className="hero-trust-item" key={l}>
                    <strong>{n}</strong> {l}
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-card fade-up-2">
              <div className="hero-card-label">Платформа живёт</div>
              <div className="hero-stats-row">
                {[['24/7','Заявки'],['9','Категорий'],['5.0★','Рейтинг']].map(([n,l]) => (
                  <div className="hero-stat" key={l}>
                    <span className="hero-stat-num">{n}</span>
                    <span className="hero-stat-lbl">{l}</span>
                  </div>
                ))}
              </div>
              <div className="hero-card-divider" />
              <div className="hero-live">
                <span className="hero-live-dot" />
                <div>
                  <div className="hero-live-title">Сервис работает</div>
                  <div className="hero-live-sub">Первый отклик — в среднем 10 минут</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STRIP (тёмный) ══ */}
      <div className="home-strip-wrap">
        <div className="container" style={{ position: 'relative' }}>
          <div className="home-strip-inner">
            <div className="home-strip" style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
              {ALL_CATS.map(cat => (
                <Link key={cat.slug} to={`/categories/${cat.slug}`} className="strip-chip">
                  <span>{cat.emoji}</span>{cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ КАК РАБОТАЕТ (белый) ══ */}
      <section className="home-how">
        <div className="container">
          <div className="home-how-header">
            <p className="section-eyebrow">Просто и понятно</p>
            <h2 className="section-title">Как это работает</h2>
            <p className="section-sub">Три шага от задачи до результата</p>
          </div>
          <div className="how-grid">

            <div className="how-card fade-up" style={{ animationDelay: '0s' }}>
              <div className="how-card-illustration how-card-illus-1">
                <div className="how-illus-circle" />
                <div className="how-illus-lines"><span /><span /><span /></div>
                <div className="how-illus-icon">📝</div>
              </div>
              <div className="how-num-row">
                <div className="how-num">1</div>
                <div className="how-num-label">Шаг первый</div>
              </div>
              <h3>Создайте задачу</h3>
              <p>Опишите что нужно сделать, укажите адрес и удобное время</p>
            </div>

            <div className="how-card fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="how-card-illustration how-card-illus-2">
                <div className="how-illus-circle" />
                <div className="how-illus-avatars">
                  <span>А</span><span>М</span><span>К</span>
                </div>
                <div className="how-illus-icon">💬</div>
              </div>
              <div className="how-num-row">
                <div className="how-num">2</div>
                <div className="how-num-label">Шаг второй</div>
              </div>
              <h3>Получите отклики</h3>
              <p>Мастера предложат цену — смотрите рейтинг и отзывы</p>
            </div>

            <div className="how-card fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="how-card-illustration how-card-illus-3">
                <div className="how-illus-circle" />
                <div className="how-illus-check">
                  <svg viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3"/>
                    <path d="M12 20.5l5.5 5.5 10-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="how-illus-icon">🤝</div>
              </div>
              <div className="how-num-row">
                <div className="how-num">3</div>
                <div className="how-num-label">Шаг третий</div>
              </div>
              <h3>Заключите сделку</h3>
              <p>Выберите мастера и оформите безопасную сделку внутри сервиса</p>
            </div>

          </div>
        </div>
      </section>

      {/* ══ РАЗДЕЛЫ УСЛУГ (белый) ══ */}
      <section className="home-popular">
        <div className="container">
          <div className="home-popular-header">
            <div>
              <p className="section-eyebrow">Услуги</p>
              <h2 className="section-title">Разделы услуг</h2>
              <p className="section-sub">Выберите нужный раздел и создайте задачу</p>
            </div>
            <Link to="/sections" className="btn btn-outline btn-sm">Все разделы →</Link>
          </div>
          <div className="popular-grid">
            {SECTIONS.map((sec, i) => (
              <Link
                key={sec.slug}
                to={`/sections/${sec.slug}`}
                className="popular-card fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="popular-card-icon" style={{ background: sec.color }}>
                  {sec.emoji}
                </div>
                <h3>{sec.name}</h3>
                <p className="popular-card-desc">{sec.desc}</p>
                <div className="popular-card-footer">
                  <span className="popular-card-link">Перейти <span>→</span></span>
                  <span className="popular-card-badge">услуги</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ПРЕИМУЩЕСТВА (белый) ══ */}
      <section className="home-benefits">
        <div className="container">
          <div className="benefits-header">
            <p className="section-eyebrow">Почему мы</p>
            <h2 className="section-title">Преимущества сервиса</h2>
            <p className="section-sub">Всё что нужно для комфортного поиска мастера</p>
          </div>
          <div className="benefits-grid">
            {BENEFITS.map((b, i) => (
              <div className="benefit-card fade-up" key={b.title} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="benefit-icon" style={{ color: b.color, background: b.bg }}>
                  {b.icon}
                </div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ОТЗЫВЫ (тёмный) ══ */}
      <section className="home-reviews">
        <div className="container">
          <div className="reviews-header">
            <p className="section-eyebrow">Отзывы</p>
            <h2 className="section-title">Что говорят клиенты</h2>
            <p className="section-sub">Реальные отзывы о мастерах из Йошкар-Олы</p>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r, i) => (
              <div className="review-card fade-up" key={r.name} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="review-stars">{'★'.repeat(r.rating)}</div>
                <p className="review-text">«{r.text}»</p>
                <div className="review-footer">
                  <div className="review-avatar" style={{ background: r.color }}>{r.initials}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-service">{r.service}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA (тёмный) ══ */}
      {!userId && (
        <section className="home-cta-section">
          <div className="container">
            <div className="home-cta">
              <div className="cta-text">
                <h2>Готовы разместить задачу?</h2>
                <p>Зарегистрируйтесь бесплатно — первые отклики уже через 10 минут</p>
              </div>
              <button className="btn btn-lg cta-btn" onClick={() => setShowGuestModal(true)}>
                Начать бесплатно →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══ МОДАЛКА ══ */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Войдите или зарегистрируйтесь</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: '8px 0 16px' }}>
              Предложения мастеров, чат и безопасные сделки — всё внутри аккаунта.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login"    className="btn btn-primary btn-sm" onClick={() => setShowGuestModal(false)}>Войти</Link>
              <Link to="/register" className="btn btn-outline btn-sm" onClick={() => setShowGuestModal(false)}>Зарегистрироваться</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Главная страница для мастеров
// ═══════════════════════════════════════════════════════════
function WorkerHomePage({ userId }) {
  return (
    <div className="worker-home">
      {/* ══ HERO для мастеров ══ */}
      <section className="home-hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-tag fade-up">
                <span className="hero-tag-dot" />
                Йошкар-Ола · Платформа для мастеров
              </div>
              <h1 className="hero-title fade-up-1">
                Найдите<br />
                <span>новых клиентов</span><br />
                в Йошкар-Оле
              </h1>
              <p className="hero-subtitle fade-up-2">
                Получайте заявки от заказчиков напрямую.<br />
                Работайте без посредников, растите свой рейтинг.
              </p>
              <div className="hero-actions fade-up-3">
                <Link to="/find-work" className="btn btn-lg hero-btn-primary">
                  📋 Найти работу
                </Link>
                <Link to="/worker-profile" className="btn btn-lg hero-btn-ghost">
                  Мой профиль →
                </Link>
              </div>
              <div className="hero-trust fade-up-4">
                {[['24/7','новые заявки'],['9','категорий'],['5%','комиссия']].map(([n,l]) => (
                  <div className="hero-trust-item" key={l}>
                    <strong>{n}</strong> {l}
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-card fade-up-2">
              <div className="hero-card-label">Платформа работает</div>
              <div className="hero-stats-row">
                {[['24/7','Заявки'],['9','Категорий'],['5%','Комиссия']].map(([n,l]) => (
                  <div className="hero-stat" key={l}>
                    <span className="hero-stat-num">{n}</span>
                    <span className="hero-stat-lbl">{l}</span>
                  </div>
                ))}
              </div>
              <div className="hero-card-divider" />
              <div className="hero-live">
                <span className="hero-live-dot" />
                <div>
                  <div className="hero-live-title">Платформа работает</div>
                  <div className="hero-live-sub">Откликайтесь первым — получайте больше заказов</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ПРЕИМУЩЕСТВА для мастеров ══ */}
      <section className="home-benefits">
        <div className="container">
          <div className="benefits-header">
            <p className="section-eyebrow">Работайте с комфортом</p>
            <h2 className="section-title">Преимущества платформы</h2>
            <p className="section-sub">Всё что нужно для успешной работы</p>
          </div>
          <div className="benefits-grid">
            {WORKER_BENEFITS.map((b, i) => (
              <div className="benefit-card fade-up" key={b.title} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="benefit-icon" style={{ fontSize: '48px' }}>
                  {b.icon}
                </div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/find-work" className="btn btn-primary btn-lg">
              Начать работать
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}