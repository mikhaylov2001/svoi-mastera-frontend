import { useEffect, useState } from 'react';
import { getCategories } from '../api';
import './ListPage.css';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Загрузка категорий...</p>;
  if (error) return <p className="status error">Ошибка: {error}</p>;

  return (
    <div>
      <h2>Категории услуг</h2>
      {categories.length === 0 ? (
        <p className="status">Категории пока не созданы.</p>
      ) : (
        <ul className="card-list grid">
          {categories.map((c) => (
            <li key={c.id} className="card">
              <div className="card-icon">
                {c.name && c.name.length > 0 ? c.name[0].toUpperCase() : '?'}
              </div>
              <div>
                <div className="card-title">{c.name}</div>
                {c.description && (
                  <div className="card-sub">{c.description}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CategoriesPage;
