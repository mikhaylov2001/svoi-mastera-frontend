import { useEffect, useState } from 'react';
import { getCategories, getMyDeals } from './api';

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000'; // реальный UUID

function App() {
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getMyDeals(TEST_USER_ID).then(setDeals).catch(console.error);
  }, []);

  return (
    <div>
      <h1>Категории</h1>
      <ul>
        {categories.map(c => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>

      <h1>Мои сделки</h1>
      <ul>
        {deals.map(d => (
          <li key={d.id}>{d.id} — {d.status}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
