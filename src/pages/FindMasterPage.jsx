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

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getWorkerServices()])
      .then(([cats, services]) => {
        setCategories(cats);
        setServices(services);
      })
      .catch((e) => {
        console.error(e);
        setError(e?.message || 'Ошибка загрузки данных');
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedCategoryObj = categories.find((c) => c.slug === selectedCategory);

  const visibleServices = services.filter((item) => {
    if (selectedCategory === 'all') return true;

    if (item.categoryId) {
      const itemCat = categories.find((c) => c.id === item.categoryId);
      if (itemCat && itemCat.slug === selectedCategory) return true;
    }

    if (!selectedCategoryObj) return true;
    const keyword = selectedCategoryObj.name.toLowerCase();
    return (item.title?.toLowerCase().includes(keyword) || item.description?.toLowerCase().includes(keyword));
  });

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Найти мастера</h1>
          <p>Найдите исполнителя и свяжитесь с ним напрямую через чат</p>
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
                    <button className="btn btn-outline" onClick={() => navigate(`/categories/${categorySlug}`)}>Заказать работу</button>
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

