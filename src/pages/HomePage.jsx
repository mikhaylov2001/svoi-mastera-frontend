import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api';
import './HomePage.css';

const CAT_META = {
  'remont':      { emoji: '🏠', color: '#fff3e0' },
  'santehnika':  { emoji: '🔧', color: '#e3f2fd' },
  'elektrika':   { emoji: '⚡', color: '#fffde7' },
  'mebel':       { emoji: '🛋️', color: '#f3e5f5' },
  'tehnika':     { emoji: '📺', color: '#e8f5e9' },
  'uborka':      { emoji: '🧹', color: '#fce4ec' },
  'dveri':       { emoji: '🚪', color: '#e0f7fa' },
  'pokraska':    { emoji: '🎨', color: '#f1f8e9' },
  'parikhmaher': { emoji: '💇', color: '#fce4ec' },
  'manikur':     { emoji: '💅', color: '#fce4ec' },
  'kosmetolog':  { emoji: '✨', color: '#f3e5f5' },
  'massazh':     { emoji: '💆', color: '#e8f5e9' },
  'sadovnik':    { emoji: '🌱', color: '#e8f5e9' },
  'perevozka':   { emoji: '🚚', color: '#e3f2fd' },
  'repetitor':   { emoji: '📚', color: '#fff3e0' },
};
function getMeta(slug) { return CAT_META[slug] || { emoji: '🔨', color: '#f1f3f4' }; }

export default function HomePage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="home-hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-tag fade-up">
                <span className="hero-tag-dot" />
                Маркетплейс мастеров · 2026
              </div>
              <h1 className="hero-title fade-up-1">
                Свои мастера<br />для <span>любых задач</span><br />по дому
              </h1>
              <p className="hero-subtitle fade-up-2">
                Опишите задачу — мастера откликнутся сами.<br />
                Выбирайте по рейтингу и отзывам, сделка внутри сервиса.
              </p>
              <div className="hero-actions fade-up-3">
                <Link to="/categories" className="btn btn-primary btn-lg">
                  🔍 Найти мастера
                </Link>
                <Link to="/register" className="btn btn-lg hero-btn-register">
                  Стать мастером
                </Link>
              </div>
              <div className="hero-trust fade-up-4">
                {[['24/7','приём заявок'],['15+','категорий'],['5.0★','рейтинг']].map(([n,l]) => (
                  <div className="hero-trust-item" key={l}>
                    <strong>{n}</strong> {l}
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-card fade-up-2">
              <div className="hero-card-label">Платформа живёт</div>
              <div className="hero-stats-row">
                {[['24/7','Заявки'],['15+','Категорий'],['5.0★','Рейтинг']].map(([n,l]) => (
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

      {/* CATEGORY STRIP */}
      {categories.length > 0 && (
        <div className="home-strip-wrap">
          <div className="container">
            <div className="home-strip">
              {categories.slice(0, 10).map(cat => {
                const m = getMeta(cat.slug);
                return (
                  <Link key={cat.id} to={`/categories/${cat.slug}`} className="strip-chip">
                    <span>{m.emoji}</span>
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <section className="home-how">
        <div className="container">
          <p className="section-eyebrow">Просто и понятно</p>
          <h2 className="section-title">Как это работает</h2>
          <div className="how-grid">
            {[
              ['1','✍️','Создайте задачу','Опишите что нужно, укажите адрес и удобное время'],
              ['2','📩','Получите отклики','Мастера предложат цену — смотрите рейтинг и отзывы'],
              ['3','🤝','Заключите сделку','Выберите мастера и оформите безопасную сделку'],
            ].map(([n, e, h, p], i) => (
              <div className="how-card fade-up" key={n} style={{animationDelay:`${i*0.08}s`}}>
                <div className="how-num-row">
                  <div className="how-num">{n}</div>
                  <span style={{fontSize:24}}>{e}</span>
                </div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      {categories.length > 0 && (
        <section className="home-popular">
          <div className="container">
            <div className="home-popular-header">
              <div>
                <h2 className="section-title">Популярные категории</h2>
                <p className="section-sub" style={{marginBottom:0}}>Самые востребованные услуги</p>
              </div>
              <Link to="/categories" className="btn btn-outline btn-sm">Все категории →</Link>
            </div>
            <div className="popular-grid">
              {categories.slice(0,12).map((cat, i) => {
                const m = getMeta(cat.slug);
                return (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className="popular-card fade-up"
                    style={{animationDelay:`${i*0.05}s`}}
                  >
                    <div className="popular-card-icon" style={{background: m.color}}>{m.emoji}</div>
                    <h3>{cat.name}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta">
            <div className="cta-text">
              <h2>Готовы разместить задачу?</h2>
              <p>Зарегистрируйтесь бесплатно и получите первые отклики уже через 10 минут</p>
            </div>
            <Link
              to="/register"
              className="btn btn-lg"
              style={{background:'#fff', color:'#e8410a', fontWeight:800, flexShrink:0}}
            >
              Начать бесплатно →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}