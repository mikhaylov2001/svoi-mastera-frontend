import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SECTIONS } from './SectionsPage';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import './HomePage.css';

// Flat list of all categories for the strip
const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

export default function HomePage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showQuickCta, setShowQuickCta] = useState(false);
  const [quickCategory, setQuickCategory] = useState('');
  const [miniTask, setMiniTask] = useState({ title: '', description: '', city: '', address: '', budget: '' });

  const handleMiniTaskSubmit = (e) => {
    e.preventDefault();
    if (!miniTask.title.trim() || !miniTask.city.trim()) return;
    // Переход к разделам, можно передать параметры в query
    const params = new URLSearchParams({ q: miniTask.title.trim(), city: miniTask.city.trim() }).toString();
    navigate(`/sections?${params}`);
  };

  const [currentArea, setCurrentArea] = useState('');
  const [geoError, setGeoError] = useState('');

  const pickupArea = (area) => {
    setMiniTask((prev) => ({ ...prev, city: area }));
  };

  const detectArea = () => {
    if (!navigator.geolocation) {
      setGeoError('Геолокация не поддерживается');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const apiKey = 'YOUR_YANDEX_API_KEY'; // <-- поставь свой ключ
          const url = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${apiKey}&geocode=${longitude},${latitude}`;
          const response = await fetch(url);
          const data = await response.json();
          const geoObject = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
          const areaName = geoObject?.metaDataProperty?.GeocoderMetaData?.AddressDetails?.Country?.AdministrativeArea?.SubAdministrativeArea?.Locality?.DependentLocality?.DependentLocalityName
            || geoObject?.name
            || `Округ ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

          setCurrentArea(areaName);
          setMiniTask((prev) => ({ ...prev, city: areaName }));
          setGeoError('');
        } catch (e) {
          setGeoError('Не удалось определить район через Яндекс');
          const area = `Округ ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setCurrentArea(area);
          setMiniTask((prev) => ({ ...prev, city: area }));
        }
      },
      () => {
        setGeoError('Не удалось получить ваш район');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      {/* HERO */}
      <section className="home-hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-tag fade-up">
                <span className="hero-tag-dot" />
                Йошкар-Ола · Маркетплейс мастеров
              </div>
              <h1 className="hero-title fade-up-1">
                Свои мастера<br />для <span>любых задач</span><br />в Йошкар-Оле
              </h1>
              <p className="hero-subtitle fade-up-2">
                Опишите задачу — мастера откликнутся сами.<br />
                Выбирайте по рейтингу и отзывам, сделка внутри сервиса.
              </p>
              <div className="hero-actions fade-up-3">
                <Link to="/sections" className="btn btn-primary btn-lg">
                  🔍 Найти мастера
                </Link>
                <Link to={userId ? '/profile' : '/register'} className="btn btn-lg hero-btn-register">
                  Стать мастером
                </Link>
              </div>
              <div className="hero-trust fade-up-4">
                {[['24/7', 'приём заявок'], ['9', 'категорий'], ['5.0★', 'рейтинг']].map(([n, l]) => (
                  <div className="hero-trust-item" key={l}>
                    <strong>{n}</strong> {l}
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-card fade-up-2">
              <div className="hero-card-label">Платформа живёт</div>
              <div className="hero-stats-row">
                {[['24/7', 'Заявки'], ['9', 'Категорий'], ['5.0★', 'Рейтинг']].map(([n, l]) => (
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
      <div className="home-strip-wrap">
        <div className="container">
          <div className="home-strip">
            {ALL_CATS.map(cat => (
              <Link key={cat.slug} to={`/categories/${cat.slug}`} className="strip-chip">
                <span>{cat.emoji}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* GEO CTA */}
      <section className="home-geo">
        <div className="container">
          <div className="home-geo-box">
            <strong>Район рядом</strong>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{currentArea || 'Не определён'}</span>
              <button className="btn btn-outline btn-sm" onClick={detectArea}>Определить район</button>
              {geoError && <span style={{ color: '#b91c1c' }}>{geoError}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-how">
        <div className="container">
          <p className="section-eyebrow">Просто и понятно</p>
          <h2 className="section-title">Как это работает</h2>
          <div className="how-grid">
            {[
              ['1', '✍️', 'Создайте задачу', 'Опишите что нужно, укажите адрес и удобное время'],
              ['2', '📩', 'Получите отклики', 'Мастера предложат цену — смотрите рейтинг и отзывы'],
              ['3', '🤝', 'Заключите сделку', 'Выберите мастера и оформите безопасную сделку'],
            ].map(([n, e, h, p], i) => (
              <div className="how-card fade-up" key={n} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="how-num-row">
                  <div className="how-num">{n}</div>
                  <span style={{ fontSize: 24 }}>{e}</span>
                </div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <section className="home-popular">
        <div className="container">
          <div className="home-popular-header">
            <div>
              <h2 className="section-title">Разделы услуг</h2>
              <p className="section-sub" style={{ marginBottom: 0 }}>Выберите нужный раздел</p>
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
                <div className="popular-card-icon" style={{ background: sec.color }}>{sec.emoji}</div>
                <h3>{sec.name}</h3>
                <p className="popular-card-desc">{sec.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta">
            <div className="cta-text">
              <h2>Готовы разместить задачу?</h2>
              <p>Зарегистрируйтесь бесплатно и получите первые отклики уже через 10 минут</p>
            </div>
            {userId ? (
              <form onSubmit={handleMiniTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 540, width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    required
                    value={miniTask.title}
                    onChange={(e) => setMiniTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Название задачи"
                    className="form-input"
                  />
                  <input
                    required
                    value={miniTask.city}
                    onChange={(e) => setMiniTask(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Район/город"
                    className="form-input"
                    list="citySuggestions"
                  />
                  <datalist id="citySuggestions">
                    {['Центр', 'Лесозавод', 'Московский', 'Семёновский'].map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    value={miniTask.address}
                    onChange={(e) => setMiniTask(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Адрес (опционально)"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    value={miniTask.budget}
                    onChange={(e) => setMiniTask(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="Бюджет"
                    className="form-input"
                    style={{ width: 120 }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: 'fit-content' }}>
                  Создать задачу
                </button>
                <p style={{ color: '#777', fontSize: 13 }}>Нажимая, вы переходите на страницу разделов (категорий), где можно уточнить задачу.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQuickCta(true)}>
                  Добавить задачу в 1 клик
                </button>
              </form>
            ) : (
              <button className="btn btn-lg" style={{ background: '#fff', color: '#e8410a', fontWeight: 800, flexShrink: 0 }} onClick={() => setShowGuestModal(true)}>
                Начать бесплатно →
              </button>
            )}
          </div>
        </div>
      </section>

      {showGuestModal && (
        <div className="modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>Чтобы создать задачу, войдите или зарегистрируйтесь</h3>
            <p>Вам будет доступно быстрее и удобнее: предложения мастеров, чат, безопасные сделки.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setShowGuestModal(false)}>Войти</Link>
              <Link to="/register" className="btn btn-outline btn-sm" onClick={() => setShowGuestModal(false)}>Зарегистрироваться</Link>
            </div>
          </div>
        </div>
      )}

      {showQuickCta && (
        <div className="modal-overlay" onClick={() => setShowQuickCta(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h3>Быстрое размещение задачи</h3>
            <p>Выберите категорию и перейдите к заполнению.</p>
            <select value={quickCategory} onChange={(e) => setQuickCategory(e.target.value)} className="form-input">
              <option value="">Выберите категорию</option>
              {ALL_CATS.slice(0, 10).map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
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
            <button className="btn btn-outline btn-sm" onClick={() => setShowQuickCta(false)}>Отмена</button>
          </div>
        </div>
      )}

    </div>
  );
}