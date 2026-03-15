import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCategories, getWorkerServices } from '../api';
import './FindMasterPage.css';

export default function FindMasterPage() {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('recency');

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getWorkerServices()])
      .then(([cats, workersServices]) => {
        setCategories(cats);
        setServices((workersServices || []).map((item) => ({
          ...item,
          title: item.title || 'Услуга мастера',
          description: item.description || 'Описание услуги не указано',
          workerName: item.workerName || `Мастер ${item.workerUserId?.slice(0, 6)}`,
          active: item.active == null ? true : item.active,
          priceFrom: item.priceFrom || 0,
          priceTo: item.priceTo || 0,
        })));
      })
      .catch((e) => {
        console.error(e);
        setError(e?.message || 'Ошибка загрузки данных');
      })
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
                // Подсчет активных и всех мастеров в категории
                const allMasters = services.filter((s) => s.categoryId === cat.id);
                const activeMasters = allMasters.filter((s) => s.active === true);

                // Средняя цена
                const pricesFrom = activeMasters
                  .map((s) => s.priceFrom)
                  .filter((p) => p && p > 0);
                const avgPrice = pricesFrom.length > 0
                  ? Math.round(pricesFrom.reduce((a, b) => a + b, 0) / pricesFrom.length)
                  : null;

                return (
                  <Link
                    key={cat.id}
                    to={`/find-master/${cat.slug}`}
                    className="cat-card fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="cat-card-icon" style={{ background: cat.color || '#fff3e0' }}>
                      {cat.emoji || cat.icon || '🛠️'}
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
      // Фильтр по категории
      if (item.categoryId !== selectedCategory?.id) return false;

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
            <div className="cat-page-icon" style={{ background: selectedCategory.color || '#fff3e0' }}>
              {selectedCategory.emoji || selectedCategory.icon || '🛠️'}
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
                <div key={service.id} className={`master-card ${!service.active ? 'master-card-inactive' : ''}`}>
                  {!service.active && <div className="inactive-badge">Неактивен</div>}

                  <div className="master-card-avatar">
                    {(service.title || 'Мастер')
                      .split(' ')
                      .map((x) => x[0] || '')
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>

                  <h3 className="master-card-title">{service.title || 'Услуга мастера'}</h3>
                  <p className="master-card-meta">{selectedCategory.name} • Йошкар-Ола</p>

                  <div className="master-text">{service.description || 'Описание услуги не указано'}</div>

                  <div className="master-stars">
                    ★★★★☆ <span>(25 отзывов)</span>
                  </div>

                  <div className="master-price">
                    {service.priceFrom || service.priceTo
                      ? `от ${service.priceFrom || '-'} до ${service.priceTo || '-'} ₽`
                      : 'Цена по договоренности'}
                  </div>

                  <div className="master-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/chat/${service.workerUserId}`)}
                    >
                      Написать
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