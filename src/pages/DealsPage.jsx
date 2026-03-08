import { useEffect, useState } from 'react';
import { getMyDeals, completeDeal } from '../api';
import './ListPage.css';

// сюда подставь реальный UUID клиента из таблицы users
const TEST_USER_ID = '6fe3e907-c518-489d-95c6-9bf6f2988648';

function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const loadDeals = () => {
    setLoading(true);
    setError(null);
    getMyDeals(TEST_USER_ID)
      .then(setDeals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleComplete = async (dealId) => {
    try {
      setSubmittingId(dealId);
      await completeDeal(TEST_USER_ID, dealId);
      await loadDeals();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <p className="status">Загрузка сделок...</p>;
  if (error) return <p className="status error">Ошибка: {error}</p>;

  return (
    <div>
      <h2>Мои сделки</h2>
      {deals.length === 0 ? (
        <p className="status">Пока нет активных сделок.</p>
      ) : (
        <ul className="card-list">
          {deals.map((d) => (
            <li key={d.id} className="card">
              <div>
                <div className="card-title">Сделка {d.id}</div>
                <div className="card-sub">
                  Статус: <span className="status-badge">{d.status}</span>
                </div>
              </div>
              {d.status !== 'COMPLETED' && (
                <button
                  className="btn small primary"
                  disabled={submittingId === d.id}
                  onClick={() => handleComplete(d.id)}
                >
                  {submittingId === d.id ? 'Завершение...' : 'Завершить'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DealsPage;
