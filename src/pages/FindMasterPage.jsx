import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getWorkerServices } from '../api';
import './FindMasterPage.css';

export default function FindMasterPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const selectedCategoryObj = categories.find((c) => c.slug === selectedCategory);

  const visibleServices = services
    .filter((item) => {
      if (showActiveOnly && !item.active) return false;

      if (selectedCategory !== 'all') {
        const itemCategory = categories.find((c) => c.id === item.categoryId);
        if (itemCategory && itemCategory.slug !== selectedCategory) return false;
      }

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

  return (
    <div>
      <div className="page-header-bar page-header-bar-clean">
        <div className="container">
          <h1 className="page-header-title">Найти мастера</h1>
          <p className="page-header-subtitle">Все услуги, фильтры, чат и заказ — в одном месте.</p>
        </div>
      </div>

      <div className="container">
        <div className="find-master-controls">
          <label>Категория:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">Все</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>

          <label>Поиск:</label>
          <input
            type="text"
            placeholder="По названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <label>Сортировка:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recency">По новизне</option>
            <option value="priceAsc">Цена: по возрастанию</option>
            <option value="priceDesc">Цена: по убыванию</option>
            <option value="name">По имени мастера</option>
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
            />
            Только активные
          </label>

          <Link to="/sections" className="btn btn-outline">Выбрать раздел</Link>
        </div>

        {loading ? (
          <div className="loading-services">Загрузка мастеров...</div>
        ) : error ? (
          <div className="no-results" style={{ color: 'red' }}>{error}</div>
        ) : (
          <div className="masters-grid">
            {visibleServices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>Мастера не найдены</h3>
                <p>Попробуйте другую категорию или фильтр</p>
              </div>
            ) : visibleServices.map((service) => {
              const category = categories.find((c) => c.id === service.categoryId);
              const fallbackCategory = category || selectedCategoryObj;
              const categoryName = fallbackCategory?.name || 'Услуга';
              const categorySlug = fallbackCategory?.slug || 'remont-kvartir';

              return (
                <div key={service.id} className="master-card">
                  <div className="master-card-avatar">{(service.title || 'Мастер').split(' ').map((x) => x[0] || '').join('').toUpperCase()}</div>
                  <h3>{service.title || 'Услуга мастера'}</h3>
                  <p>{categoryName} • Йошкар-Ола</p>
                  <div className="master-text">{service.description || 'Описание услуги не указано'}</div>
                  <div className="master-stars">★★★★☆ <span>({service.createdAt ? 25 : 0} отзывов)</span></div>
                  <div className="master-meta">{service.priceFrom || service.priceTo ? `от ${service.priceFrom ?? '-'} до ${service.priceTo ?? '-'} ₽` : 'цена по договоренности'}</div>
                  <div className="master-actions">
                    <button className="btn btn-primary" onClick={() => navigate(`/chat/${service.workerUserId}`)}>Написать</button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const titleParam = encodeURIComponent(service.title || 'Заказать работу');
                        const descriptionParam = encodeURIComponent(service.description || '');
                        navigate(`/categories/${categorySlug}?title=${titleParam}&description=${descriptionParam}`);
                      }}
                    >
                      Заказать работу
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

