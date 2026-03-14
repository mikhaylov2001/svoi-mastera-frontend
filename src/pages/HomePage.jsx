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
  const [showQuickCta, setShowQuickCta]   = useState(false);
  const [quickCategory, setQuickCategory] = useState('');

  return (
    <div>

      {/* ── HERO ── */}
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

      {/* ── CATEGORY STRIP ── */}
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

      {/* ── КАК ЭТО РАБОТАЕТ ── */}
      <section className="home-how">
        <div className="container">
          <p className="section-eyebrow">Просто и понятно</p>
          <h2 className="section-title">Как это работает</h2>
          <p className="section-sub">Три шага от задачи до результата</p>
          <div className="how-grid">
            {[
              ['1', <FaEdit />,     'Создайте задачу',    'Опишите что нужно, укажите адрес и удобное время'],
              ['2', <FaEnvelope />, 'Получите отклики',   'Мастера предложат цену — смотрите рейтинг и отзывы'],
              ['3', <FaHandshake />,'Заключите сделку',   'Выберите мастера и оформите безопасную сделку'],
            ].map(([n, icon, h, p], i) => (
              <div
                className="how-card fade-up"
                key={n}
                style={{ animationDelay: `${i * 0.09}s` }}
              >
                <div className="how-num-row">
                  <div className="how-num">{n}</div>
                  <span className="how-icon">{icon}</span>
                </div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── РАЗДЕЛЫ УСЛУГ ── */}
      <section className="home-popular">
        <div className="container">
          <div className="home-popular-header">
            <div>
              <p className="section-eyebrow">Услуги</p>
              <h2 className="section-title">Разделы услуг</h2>
              <p className="section-sub" style={{ marginBottom: 0 }}>
                Выберите нужный раздел и создайте задачу
              </p>
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
                <div
                  className="popular-card-icon"
                  style={{ background: sec.color }}
                >
                  {sec.emoji}
                </div>
                <h3>{sec.name}</h3>
                <p className="popular-card-desc">{sec.desc}</p>
                <div className="popular-card-footer">
                  <span className="popular-card-link">
                    Перейти <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── БЛОК ДОВЕРИЯ ── */}
      <section className="home-trust">
        <div className="container">
          <div className="trust-grid">
            {TRUST_ITEMS.map(({ icon, num, label }) => (
              <div className="trust-item" key={num}>
                <div className="trust-item-icon">{icon}</div>
                <div className="trust-item-num">{num}</div>
                <div className="trust-item-label" style={{ whiteSpace: 'pre-line' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA (только для гостей) ── */}
      {!userId && (
        <section className="home-cta-section">
          <div className="container" style={{ paddingTop: 64 }}>
            <div className="home-cta">
              <div className="cta-text">
                <h2>Готовы разместить задачу?</h2>
                <p>
                  Зарегистрируйтесь бесплатно и получите первые отклики
                  уже через 10 минут
                </p>
              </div>
              <button
                className="btn btn-lg cta-btn"
                onClick={() => setShowGuestModal(true)}
              >
                Начать бесплатно →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── МОДАЛКА — гость ── */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <h3>Войдите или зарегистрируйтесь</h3>
            <p>Предложения мастеров, чат и безопасные сделки — всё внутри аккаунта.</p>
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <Link
                to="/login"
                className="btn btn-primary btn-sm"
                onClick={() => setShowGuestModal(false)}
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="btn btn-outline btn-sm"
                onClick={() => setShowGuestModal(false)}
              >
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── МОДАЛКА — быстрый CTA ── */}
      {showQuickCta && (
        <div className="modal-overlay" onClick={() => setShowQuickCta(false)}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <h3>Быстрое размещение задачи</h3>
            <p>Выберите категорию и перейдите к заполнению.</p>
            <select
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value)}
              className="form-input"
            >
              <option value="">Выберите категорию</option>
              {ALL_CATS.slice(0,10).map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (!quickCategory) return;
                  setShowQuickCta(false);
                  navigate(`/sections/${quickCategory}`);
                }}
                disabled={!quickCategory}
              >
                Перейти
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowQuickCta(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
