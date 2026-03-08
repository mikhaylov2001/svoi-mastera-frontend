// API Base URL - используем прямой URL бэкенда
const API_BASE = 'https://svoi-mastera-backend.onrender.com/api/v1';

// Понятные сообщения для пользователя по статус-кодам
function getFriendlyMessage(status, endpoint, serverMessage) {
  const msg = (serverMessage || '').toLowerCase();

  // Специфичные ошибки по endpoint
  if (endpoint.includes('/auth/register')) {
    if (status === 400) return 'Проверьте правильность заполнения всех полей.';
    if (status === 409 || msg.includes('exist') || msg.includes('duplicate') || msg.includes('already'))
      return 'Аккаунт с таким email уже существует. Попробуйте войти.';
    if (status === 500) return 'Не удалось создать аккаунт. Возможно, этот email уже зарегистрирован. Попробуйте войти.';
  }

  if (endpoint.includes('/auth/login')) {
    if (status === 400) return 'Введите email и пароль.';
    if (status === 401 || status === 403) return 'Неверный email или пароль.';
    if (status === 404) return 'Аккаунт с таким email не найден. Проверьте email или зарегистрируйтесь.';
    if (status === 500) return 'Ошибка при входе. Попробуйте ещё раз через минуту.';
  }

  if (endpoint.includes('/job-requests')) {
    if (status === 400) return 'Проверьте правильность заполнения заявки.';
    if (status === 404) return 'Заявка не найдена.';
  }

  if (endpoint.includes('/deals')) {
    if (status === 404) return 'Сделка не найдена.';
    if (status === 400) return 'Не удалось выполнить операцию со сделкой.';
  }

  if (endpoint.includes('/reviews')) {
    if (status === 400) return 'Проверьте правильность заполнения отзыва.';
  }

  // Общие ошибки по статус-коду
  if (status === 400) return 'Некорректный запрос. Проверьте введённые данные.';
  if (status === 401) return 'Необходима авторизация. Войдите в аккаунт.';
  if (status === 403) return 'Доступ запрещён.';
  if (status === 404) return 'Данные не найдены.';
  if (status === 429) return 'Слишком много запросов. Подождите немного и попробуйте снова.';
  if (status >= 500) return 'Ошибка сервера. Попробуйте ещё раз через минуту.';

  return 'Что-то пошло не так. Попробуйте ещё раз.';
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Получаем текст ответа
    const responseText = await response.text();

    // Пытаемся распарсить JSON
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      const serverMsg = data.message || data.error || '';
      const friendlyMsg = getFriendlyMessage(response.status, endpoint, serverMsg);
      throw new Error(friendlyMsg);
    }

    return data;
  } catch (error) {
    // Сетевые ошибки (нет интернета, сервер недоступен)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Нет соединения с сервером. Проверьте интернет и попробуйте снова.');
    }
    throw error;
  }
}

// ── CATEGORIES ──
export async function getCategories() {
  return apiCall('/categories');
}

// ── AUTH ──
export async function registerUser({ name, email, password, role }) {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      displayName: name,
      email,
      password,
      role
    }),
  });
}

export async function loginUser({ email, password }) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── JOB REQUESTS ──
export async function createJobRequest(userId, data) {
  return apiCall('/job-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      address: data.address,
      budget: data.budget,
    }),
  });
}

export async function getOpenJobRequestsForWorker(workerId) {
  return apiCall('/worker/job-requests', {
    headers: {
      'X-User-Id': workerId,
    },
  });
}

// ── JOB OFFERS ──
export async function createJobOffer(workerId, requestId, data) {
  return apiCall(`/worker/job-requests/${requestId}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': workerId,
    },
    body: JSON.stringify({
      price: data.price,
      comment: data.comment,
    }),
  });
}

// ── DEALS ──
export async function getMyDeals(userId) {
  return apiCall('/deals', {
    headers: {
      'X-User-Id': userId,
    },
  });
}

export async function completeDeal(userId, dealId) {
  return apiCall(`/deals/${dealId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({}),
  });
}

export async function initiatePayment(userId, dealId) {
  return apiCall(`/initiate?dealId=${dealId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({}),
  });
}

// ── PROFILE ──
export async function getCustomerProfile(userId) {
  return apiCall('/customer-profiles/me', {
    headers: {
      'X-User-Id': userId,
    },
  });
}

// ── REVIEWS ──
export async function createReview(userId, dealId, data) {
  return apiCall(`/deals/${dealId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({
      rating: data.rating,
      comment: data.comment,
    }),
  });
}

export async function getReviewsByWorker(workerId) {
  return apiCall(`/workers/${workerId}/reviews`);
}