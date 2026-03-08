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

  if (loading) return <p className="status">Загрузка...</p>;
  if (error) return <p className="status error">Ошибка: {error}</p>;

  return (
    <div>
      <h2>Категории</h2>
      <ul className="card-list">
        {categories.map((c) => (
          <li key={c.id} className="card">{c.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default CategoriesPage;
