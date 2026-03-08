const API_URL = process.env.REACT_APP_API_URL;

export async function getCategories() {
  const res = await fetch(`${API_URL}/api/v1/categories`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getMyDeals(userId) {
  const res = await fetch(`${API_URL}/api/v1/deals`, {
    headers: {
      'X-User-Id': userId, // строка UUID
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
