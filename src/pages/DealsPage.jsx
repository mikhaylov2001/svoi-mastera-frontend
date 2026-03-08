import { useEffect, useState } from 'react';
import { getMyDeals } from '../api';
import './ListPage.css';

// Пока заглушка — замени на реальный UUID из базы
const TEST_USER_ID = 'YOUR-REAL-UUID-HERE';

function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyDeals(TEST_USER_ID)
      .then(setDeals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Загрузка...</p>;
  if (error) return <p className="status error">Ошибка: {error}</p>;

  return (
    <div>
      <h2>Мои сделки</h2>
      <ul className="card-list">
        {deals.map((d) => (
          <li key={d.id} className="card">
            <span>Сделка: {d.id}</span>
            <span className="status-badge">{d.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DealsPage;
