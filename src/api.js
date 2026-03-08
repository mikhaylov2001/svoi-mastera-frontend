// API Base URL
const API_BASE = 'https://svoi-mastera-backend.onrender.com/api/v1';

// Понятные сообщения для пользователя
function getFriendlyMessage(status, endpoint, serverMessage) {
  const msg = (serverMessage || '').toLowerCase();

  if (endpoint.includes('/auth/register')) {
    if (status === 400) return 'Проверьте правильность заполнения всех полей.';
    if (status === 409 || msg.includes('exist') || msg.includes('duplicate') || msg.includes('already'))
      return 'Аккаунт с таким email уже существует. Попробуйте войти.';
    if (status === 500 && (msg.includes('exist') || msg.includes('duplicate')))
      return 'Аккаунт с таким email уже существует. Попробуйте войти.';
    if (status === 500) return 'Не удалось создать аккаунт. Возможно, этот email уже зарегистрирован.';
  }

  if (endpoint.includes('/auth/login')) {
    if (status === 400) return 'Введите email и пароль.';
    if (status === 401 || status === 403) return 'Неверный email или пароль.';
    if (status === 404) return 'Аккаунт не найден. Проверьте email или зарегистрируйтесь.';
    if (status === 500 && msg.includes('invalid')) return 'Неверный email или пароль.';
    if (status === 500) return 'Ошибка при входе. Попробуйте ещё раз через минуту.';
  }

  if (endpoint.includes('/job-requests')) {
    if (status === 400) return 'Проверьте правильность заполнения заявки.';
    if (status === 404) return 'Заявка не найдена.';
    if (status === 500 && msg.includes('not found')) return 'Категория или профиль не найдены. Попробуйте перезайти.';
    if (status === 500) return 'Не удалось создать заявку. Попробуйте ещё раз.';
  }

  if (endpoint.includes('/offers')) {
    if (status === 500 && msg.includes('worker profile')) return 'Профиль мастера не найден. Попробуйте перезайти в аккаунт.';
    if (status === 500) return 'Не удалось отправить отклик. Попробуйте ещё раз.';
  }

  if (endpoint.includes('/deals')) {
    if (status === 404) return 'Сделка не найдена.';
    if (status === 400) return 'Не удалось выполнить операцию со сделкой.';
  }

  if (endpoint.includes('/reviews')) {
    if (status === 400) return 'Проверьте правильность заполнения отзыва.';
    if (status === 500 && msg.includes('worker profile')) return 'Профиль мастера не найден.';
  }

  if (status === 400) return 'Некорректный запрос. Проверьте введённые данные.';
  if (status === 401) return 'Необходима авторизация. Войдите в аккаунт.';
  if (status === 403) return 'Доступ запрещён.';
  if (status === 404) return 'Данные не найдены.';
  if (status === 429) return 'Слишком много запросов. Подождите немного.';
  if (status >= 500) return 'Ошибка сервера. Попробуйте ещё раз через минуту.';

  return 'Что-то пошло не так. Попробуйте ещё раз.';
}

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const responseText = await response.text();

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
// Бэкенд ожидает: { email, password, displayName, asWorker, asCustomer }
export async function registerUser({ name, email, password, role }) {
  const isWorker = role === 'WORKER';
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      displayName: name,
      email,
      password,
      asWorker: isWorker,
      asCustomer: !isWorker,
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
// Бэкенд CreateJobRequestDto: { categoryId (UUID), title, description, city, addressText, scheduledAt, budgetFrom, budgetTo }
export async function createJobRequest(userId, data) {
  const body = {
    categoryId: data.categoryId,
    title: data.title,
    description: data.description || 'Без описания',
  };
  if (data.address) body.addressText = data.address;
  if (data.budget) body.budgetTo = data.budget;

  return apiCall('/job-requests', {
    method: 'POST',
    headers: {
      'X-User-Id': userId,
    },
    body: JSON.stringify(body),
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
// Бэкенд CreateJobOfferDto: { message, price, estimatedDays }
export async function createJobOffer(workerId, requestId, data) {
  return apiCall(`/worker/job-requests/${requestId}/offers`, {
    method: 'POST',
    headers: {
      'X-User-Id': workerId,
    },
    body: JSON.stringify({
      message: data.comment || 'Готов выполнить',
      price: data.price,
      estimatedDays: data.estimatedDays || null,
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
      'X-User-Id': userId,
    },
    body: JSON.stringify({}),
  });
}

export async function initiatePayment(userId, dealId) {
  return apiCall(`/initiate?dealId=${dealId}`, {
    method: 'POST',
    headers: {
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
// Бэкенд ReviewCreateDto: { rating, text }
export async function createReview(userId, dealId, data) {
  return apiCall(`/deals/${dealId}/reviews`, {
    method: 'POST',
    headers: {
      'X-User-Id': userId,
    },
    body: JSON.stringify({
      rating: data.rating,
      text: data.comment || '',
    }),
  });
}

export async function getReviewsByWorker(workerId) {
  return apiCall(`/workers/${workerId}/reviews`);
}