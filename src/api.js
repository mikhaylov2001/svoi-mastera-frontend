const API_URL = process.env.REACT_APP_API_URL;

// список категорий
export async function getCategories() {
  const res = await fetch(`${API_URL}/api/v1/categories`);
  if (!res.ok) {
    throw new Error(`Ошибка загрузки категорий: ${res.status}`);
  }
  return res.json();
}

// список сделок клиента
export async function getMyDeals(userId) {
  const res = await fetch(`${API_URL}/api/v1/deals`, {
    headers: {
      'X-User-Id': userId,
    },
  });
  if (!res.ok) {
    throw new Error(`Ошибка загрузки сделок: ${res.status}`);
  }
  return res.json();
}

// принять оффер и создать сделку
export async function acceptOffer(userId, jobRequestId, offerId) {
  const url = new URL(`${API_URL}/api/v1/deals/accept`);
  url.searchParams.set('jobRequestId', jobRequestId);
  url.searchParams.set('offerId', offerId);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'X-User-Id': userId,
    },
  });

  if (!res.ok) {
    throw new Error(`Ошибка при создании сделки: ${res.status}`);
  }
  return res.json();
}

// завершить сделку
export async function completeDeal(userId, dealId) {
  const res = await fetch(`${API_URL}/api/v1/deals/${dealId}/complete`, {
    method: 'POST',
    headers: {
      'X-User-Id': userId,
    },
  });

  if (!res.ok) {
    throw new Error(`Ошибка при завершении сделки: ${res.status}`);
  }
  return res.json();
}

export async function getMyProfile(userId) {
  const res = await fetch(`${API_URL}/api/v1/customer-profiles/me`, {
    headers: {
      'X-User-Id': userId,
    },
  });
  if (!res.ok) {
    throw new Error(`Ошибка загрузки профиля: ${res.status}`);
  }
  return res.json();
}
