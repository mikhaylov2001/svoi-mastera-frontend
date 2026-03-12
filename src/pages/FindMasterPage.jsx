import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';
import './FindMasterPage.css';

const MOCK_MASTERS = [
  { id: '201', name: 'Алексей Соколов', rating: 4.8, reviews: 62, city: 'Йошкар-Ола', category: 'remont-kvartir' },
  { id: '202', name: 'Наталья Кузнецова', rating: 4.9, reviews: 39, city: 'Йошкар-Ола', category: 'uborka' },
  { id: '203', name: 'Илья Орлов', rating: 4.6, reviews: 48, city: 'Йошкар-Ола', category: 'elektrika' },
  { id: '204', name: 'Ольга Семёнова', rating: 4.8, reviews: 109, city: 'Йошкар-Ола', category: 'parikhmaher' },
  { id: '205', name: 'Сергей Романов', rating: 4.7, reviews: 28, city: 'Йошкар-Ола', category: 'kompyuternaya-pomosh' },
];

function flattenCategories() {
  return Object.values(CATEGORIES_BY_SECTION).flat();
}

export default function FindMasterPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => flattenCategories(), []);

  const masters = useMemo(() => {
    if (selectedCategory === 'all') return MOCK_MASTERS;
    return MOCK_MASTERS.filter((m) => m.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1>Найти мастера</h1>
          <p>Выберите категорию и свяжитесь с подходящим мастером</p>
        </div>
      </div>

      <div className="container">
        <div className="find-master-controls">
          <label>Категория:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">Все</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
          <Link to="/sections" className="btn btn-outline">Выбрать раздел</Link>
        </div>

        <div className="masters-grid">
          {masters.map((master) => {
            const category = categories.find((c) => c.slug === master.category);
            return (
              <div key={master.id} className="master-card">
                <div className="master-card-avatar">{master.name.split(' ').map((n) => n[0]).join('').toUpperCase()}</div>
                <h3>{master.name}</h3>
                <p>{category?.name || 'Услуга'} • {master.city}</p>
                <div className="master-stars">{'★'.repeat(Math.round(master.rating))}{'☆'.repeat(5 - Math.round(master.rating))} <span>({master.reviews} отзывов)</span></div>
                <div className="master-actions">
                  <button className="btn btn-primary" onClick={() => navigate(`/chat/${master.id}`)}>Написать</button>
                  <button className="btn btn-outline" onClick={() => navigate(`/categories/${master.category}`)}>Заказать работу</button>
                </div>
              </div>
            );
          })}
          {masters.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>Мастера не найдены</h3>
              <p>Попробуйте другую категорию или регион</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
