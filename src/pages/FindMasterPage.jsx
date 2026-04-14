import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCategories, getListings } from '../api';
import './FindMasterPage.css';

// Маппинг иконок и цветов для категорий
const CATEGORY_STYLES = {
  'remont-kvartir': { emoji: '🏠', color: '#fff3e0' },
  'santehnika': { emoji: '🔧', color: '#e3f2fd' },
  'elektrika': { emoji: '⚡', color: '#fffde7' },
  'uborka': { emoji: '🧹', color: '#fce4ec' },
  'parikhmaher': { emoji: '💇', color: '#fce4ec' },
  'manikur': { emoji: '💅', color: '#fce4ec' },
  'krasota-i-zdorovie': { emoji: '✨', color: '#f3e5f5' },
  'repetitorstvo': { emoji: '📚', color: '#e3f2fd' },
  'kompyuternaya-pomosh': { emoji: '💻', color: '#e8f5e9' },
};

// ✅ ДОБАВЛЕНО: Вычисление стажа работы
function getExperience(registeredAt) {
  if (!registeredAt) return 'Новичок';

  const now = new Date();
  const registered = new Date(registeredAt);
  const diffMs = now - registered;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears >= 1) {
    return `${diffYears} ${diffYears === 1 ? 'год' : diffYears < 5 ? 'года' : 'лет'}`;
  }
  if (diffMonths >= 1) {
    return `${diffMonths} ${diffMonths === 1 ? 'месяц' : diffMonths < 5 ? 'месяца' : 'месяцев'}`;
  }
  if (diffDays >= 7) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'неделю' : weeks < 5 ? 'недели' : 'недель'}`;
  }
  return 'Новичок';
}

export default function FindMasterPage() {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [workerStats, setWorkerStats] = useState({}); // ✅ ДОБАВЛЕНО: статистика мастеров
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('recency');

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getListings()])
      .then(([cats, listings]) => {
        setCategories(cats);
        const processedServices = (listings || []).map((item) => ({
          ...item,
          workerUserId: item.workerId,
          workerName: [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
          priceFrom: item.price || 0,
          priceTo: item.price || 0,
        }));
        setServices(processedServices);

        // Загружаем статистику для каждого мастера
        const uniqueWorkerIds = [...new Set(processedServices.map(s => s.workerId))];
        uniqueWorkerIds.forEach(async (workerId) => {
          try {
            const response = await fetch(`https://svoi-mastera-backend.onrender.com/api/v1/workers/${workerId}/stats`);
            if (response.ok) {
              const stats = await response.json();
              setWorkerStats(prev => ({ ...prev, [workerId]: stats }));
            }
          } catch {}
        });
      })
      .catch((e) => setError(e?.message || 'Ошибка загрузки данных'))
      .finally(() => setLoading(false));
  }, []);

  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  // Если категория не выбрана - показываем список категорий
  if (!categorySlug) {
    return (
      <div>
        <div className="page-header-bar">
          <div className="container">
            <h1>Найти мастера</h1>
            <p>Выберите категорию — найдите нужного мастера</p>
          </div>
        </div>

        <div className="container">
          {loading ? (
            <div className="cats-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="cat-skeleton">
                  <div style={{ width: 52, height: 52, background: '#e5e7eb', borderRadius: 'var(--r-md)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 16, background: '#e5e7eb', borderRadius: 4, marginBottom: 8, width: '60%' }}></div>
                    <div style={{ height: 14, background: '#e5e7eb', borderRadius: 4, width: '90%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="cats-error">
              <span>😕</span>
              <p>{error}</p>
            </div>
          ) : (
            <div className="cats-grid">
              {categories.map((cat, i) => {
                // Фильтрация мастеров по категории
                const allMasters = services.filter((s) => {
                  if (s.category === cat.name) return true;
                  if (s.categoryId === cat.id) return true;
                  if (String(s.categoryId) === String(cat.id)) return true;
                  return false;
                });

                const activeMasters = allMasters.filter((s) => s.active === true);

                // Средняя цена
                const pricesFrom = activeMasters
                  .map((s) => s.priceFrom)
                  .filter((p) => p && p > 0);
                const avgPrice = pricesFrom.length > 0
                  ? Math.round(pricesFrom.reduce((a, b) => a + b, 0) / pricesFrom.length)
                  : null;

                // Получаем стиль для категории
                const style = CATEGORY_STYLES[cat.slug] || { emoji: '🛠️', color: '#fff3e0' };

                return (
                  <Link
                    key={cat.id}
                    to={`/find-master/${cat.slug}`}
                    className="cat-card fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="cat-card-icon" style={{ background: style.color }}>
                      {style.emoji}
                    </div>
                    <div className="cat-card-body">
                      <h2>{cat.name}</h2>
                      <p>
                        {activeMasters.length > 0
                          ? `${activeMasters.length} ${activeMasters.length === 1 ? 'мастер' : activeMasters.length < 5 ? 'мастера' : 'мастеров'}`
                          : 'Нет активных мастеров'}
                        {avgPrice && ` • от ${avgPrice} ₽`}
                      </p>
                    </div>
                    <div className="cat-card-arrow">›</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Если категория выбрана - показываем мастеров
  const visibleServices = services
    .filter((item) => {
      // Фильтр по категории — listings хранят название категории строкой
      const catMatch =
        item.category === selectedCategory?.name ||
        item.categoryId === selectedCategory?.id ||
        String(item.categoryId) === String(selectedCategory?.id);
      if (!catMatch) return false;

      // Фильтр активных мастеров
      if (showActiveOnly && !item.active) return false;

      // Поиск
      if (!searchTerm.trim()) return true;
      const q = searchTerm.trim().toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.workerName || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return (a.priceFrom || 0) - (b.priceFrom || 0);
      if (sortBy === 'priceDesc') return (b.priceFrom || 0) - (a.priceFrom || 0);
      if (sortBy === 'name') return (a.workerName || '').localeCompare(b.workerName || '');
      return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
    });

  if (!selectedCategory) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p>Категория не найдена</p>
        <Link to="/find-master" className="btn btn-primary" style={{ marginTop: 16 }}>
          К категориям
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок с выбранной категорией */}
      <div className="page-header-bar">
        <div className="container">
          <Link to="/find-master" className="cats-back-link">
            ← Все категории
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <div className="cat-page-icon" style={{ background: CATEGORY_STYLES[selectedCategory.slug]?.color || '#fff3e0' }}>
              {CATEGORY_STYLES[selectedCategory.slug]?.emoji || '🛠️'}
            </div>
            <div>
              <h1>{selectedCategory.name}</h1>
              <p>{selectedCategory.description || selectedCategory.desc || 'Найдите проверенного мастера'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Панель фильтров */}
        <div className="find-master-controls">
          <div className="controls-left">
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="recency">По новизне</option>
              <option value="priceAsc">Цена: по возрастанию</option>
              <option value="priceDesc">Цена: по убыванию</option>
              <option value="name">По имени мастера</option>
            </select>
          </div>

          <div className="controls-right">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
              <span>Только активные</span>
            </label>
          </div>
        </div>

        {/* Список мастеров */}
        {loading ? (
          <div className="loading-state">Загрузка мастеров...</div>
        ) : error ? (
          <div className="cats-error">
            <span>😕</span>
            <p>{error}</p>
          </div>
        ) : (
          <div className="masters-grid">
            {visibleServices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>Мастера не найдены</h3>
                <p>
                  {showActiveOnly
                    ? 'В этой категории пока нет активных мастеров. Попробуйте снять фильтр.'
                    : 'В этой категории пока нет мастеров.'}
                </p>
                <Link to="/find-master" className="btn btn-outline" style={{ marginTop: 16 }}>
                  Выбрать другую категорию
                </Link>
              </div>
            ) : (
              visibleServices.map((service) => (
                <div
                  key={service.id}
                  className={`master-card ${!service.active ? 'master-card-inactive' : ''}`}
                  onClick={() => navigate(`/workers/${service.workerId || service.workerUserId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {!service.active && <div className="inactive-badge">Неактивен</div>}

                  {/* Хедер с аватаром и именем мастера */}
                  <div className="master-card-header">
                    <div className="master-card-avatar">
                      {(service.workerName || 'Мастер')
                        .split(' ')
                        .map((x) => x[0] || '')
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="master-card-header-info">
                      <h3 className="master-card-worker-name">{service.workerName || 'Мастер'}</h3>
                      <p className="master-card-meta">{selectedCategory.name} • Йошкар-Ола</p>
                    </div>
                  </div>

                  {/* Название услуги */}
                  <h4 className="master-card-service-title">{service.title || 'Услуга мастера'}</h4>

                  {/* Описание */}
                  <div className="master-text">{service.description || 'Описание услуги не указано'}</div>

                  {/* Бейджи с преимуществами */}
                  <div className="master-badges">
                    <span className="master-badge">
                      <span className="badge-icon">✓</span>
                      Проверен
                    </span>
                    <span className="master-badge">
                      <span className="badge-icon">⚡</span>
                      Быстрый отклик
                    </span>
                    <span className="master-badge">
                      <span className="badge-icon">🛡️</span>
                      Гарантия
                    </span>
                  </div>

                  {/* ✅ ОБНОВЛЕНО: Рейтинг, отзывы и стаж из API */}
                  <div className="master-stats">
                    {workerStats[service.workerId || service.workerUserId] ? (
                      <>
                        <div className="master-rating">
                          <span className="rating-stars">
                            {'★'.repeat(Math.floor(workerStats[service.workerId || service.workerUserId].averageRating || 0))}
                            {'☆'.repeat(5 - Math.floor(workerStats[service.workerId || service.workerUserId].averageRating || 0))}
                          </span>
                          <span className="rating-text">
                            {(workerStats[service.workerId || service.workerUserId].averageRating || 0).toFixed(1)}
                          </span>
                          <span className="rating-count">
                            ({workerStats[service.workerId || service.workerUserId].reviewsCount || 0}{' '}
                            {workerStats[service.workerId || service.workerUserId].reviewsCount === 1
                              ? 'отзыв'
                              : workerStats[service.workerId || service.workerUserId].reviewsCount < 5
                              ? 'отзыва'
                              : 'отзывов'})
                          </span>
                        </div>
                        <div className="master-meta-row">
                          <span>📦 {workerStats[service.workerId || service.workerUserId].completedWorksCount || 0} заказов</span>
                          <span>📅 {getExperience(workerStats[service.workerId || service.workerUserId].registeredAt)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="master-rating">
                        <span className="rating-text">Загрузка...</span>
                      </div>
                    )}
                  </div>

                  {/* Цена */}
                  <div className="master-price">
                    {service.priceFrom || service.priceTo
                      ? `от ${service.priceFrom || '-'} до ${service.priceTo || '-'} ₽`
                      : 'Цена по договоренности'}
                  </div>

                  {/* Кнопки действий */}
                  <div className="master-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/chat/${service.workerId || service.workerUserId}`)}
                    >
                      💬 Написать
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const titleParam = encodeURIComponent(service.title || 'Заказать работу');
                        const descriptionParam = encodeURIComponent(service.description || '');
                        navigate(
                          `/categories/${categorySlug}?title=${titleParam}&description=${descriptionParam}`
                        );
                      }}
                    >
                      Заказать работу
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}