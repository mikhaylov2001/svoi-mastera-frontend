import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaEnvelope, FaHandshake } from 'react-icons/fa';
import { SECTIONS } from './SectionsPage';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import './HomePage.css';

const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

const TRUST_ITEMS = [
  { icon: '⚡', num: '10 мин',  label: 'среднее время\nпервого отклика' },
  { icon: '🔒', num: '100%',    label: 'безопасных\nсделок' },
  { icon: '📋', num: '9',       label: 'категорий\nуслуг' },
  { icon: '⭐', num: '5.0',     label: 'средний рейтинг\nмастеров' },
];

export default function HomePage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [showGuestModal, setShowGuestModal] = useState(false);

  return (
    <div>

      {/* ══ HERO ══ */}
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
                <Link to="/sections" className="btn btn-lg hero-btn-primary">
                  🔍 Найти мастера
                </Link>
                <Link
                  to={userId ? '/profile' : '/register'}
                  className="btn btn-lg hero-btn-ghost"
                >
                  Стать мастером
                </Link>
              </div>

              <div className="hero-trust fade-up-4">
                {[
                  ['24/7', 'приём заявок'],
                  ['9',    'категорий'],
                  ['5.0★', 'рейтинг'],
                ].map(([n, l]) => (
                  <div className="hero-trust-item" key={l}>
                    <strong>{n}</strong> {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero card */}
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

      {/* ══ CATEGORY STRIP ══ */}
      <div className="home-strip-wrap">
        <div className="container">
          <div className="home-strip">
            {ALL_CATS.map(cat => (
              <Link key={cat.slug} to={`/categories/${cat.slug}`} className="strip-chip">
                <span>{cat.emoji}</span>{cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ КАК ЭТО РАБОТАЕТ ══ */}
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
                <div className="how-illus-lines">
                  <span /><span /><span />
                </div>
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

      {/* ══ РАЗДЕЛЫ УСЛУГ ══ */}
      <section className="home-popular">
        <div className="container">
          <div className="home-popular-header">
            <div>
              <p className="section-eyebrow">Услуги</p>
              <h2 className="section-title">Разделы услуг</h2>
              <p className="section-sub">Выберите нужный раздел и создайте задачу</p>
            </div>
            <Link to="/sections" className="btn btn-outline btn-sm">
              Все разделы →
            </Link>
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

      {/* ══ БЛОК ДОВЕРИЯ ══ */}
      <section className="home-trust">
        <div className="container">
          <div className="trust-grid">
            {TRUST_ITEMS.map(({ icon, num, label }) => (
              <div className="trust-item" key={num}>
                <div className="trust-item-icon">{icon}</div>
                <div className="trust-item-num">{num}</div>
                <div className="trust-item-label" style={{ whiteSpace: 'pre-line' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA (только гостям) ══ */}
      {!userId && (
        <section className="home-cta-section">
          <div className="container" style={{ paddingTop: 64 }}>
            <div className="home-cta">
              <div className="cta-text">
                <h2>Готовы разместить задачу?</h2>
                <p>Зарегистрируйтесь бесплатно и получите первые отклики уже через 10 минут</p>
              </div>
              <button className="btn btn-lg cta-btn" onClick={() => setShowGuestModal(true)}>
                Начать бесплатно →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══ FOOTER ══ */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-grid">

            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">SM</div>
                <span className="footer-logo-text">СвоиМастера</span>
              </div>
              <p className="footer-desc">
                Маркетплейс мастеров для дома и ремонта в Йошкар-Оле. Быстро, надёжно, безопасно.
              </p>
              <div className="footer-socials">
                <a href="#" className="footer-social-btn">ВК</a>
                <a href="#" className="footer-social-btn">TG</a>
                <a href="#" className="footer-social-btn">WA</a>
              </div>
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

      {/* ══ МОДАЛКА ГОСТЬ ══ */}
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
