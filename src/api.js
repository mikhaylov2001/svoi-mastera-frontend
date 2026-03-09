const API_BASE = 'https://svoi-mastera-backend.onrender.com/api/v1';

function getFriendlyMessage(status, endpoint, serverMessage) {
  const msg = (serverMessage || '').toLowerCase();
  if (endpoint.includes('/auth/register')) {
    if (status === 409 || msg.includes('exist') || msg.includes('duplicate') || msg.includes('already'))
      return 'Аккаунт с таким email уже существует. Попробуйте войти.';
    if (status === 500 && (msg.includes('exist') || msg.includes('duplicate')))
      return 'Аккаунт с таким email уже существует. Попробуйте войти.';
    if (status === 500) return 'Не удалось создать аккаунт. Возможно, этот email уже зарегистрирован.';
  }
  if (endpoint.includes('/auth/login')) {
    if (status === 500 && msg.includes('invalid')) return 'Неверный email или пароль.';
    if (status === 401 || status === 403) return 'Неверный email или пароль.';
    if (status === 500) return 'Ошибка при входе. Попробуйте ещё раз.';
  }
  if (endpoint.includes('/offers')) {
    if (status === 500 && msg.includes('worker profile')) return 'Профиль мастера не найден. Перезайдите в аккаунт.';
  }
  if (status === 400) return 'Проверьте правильность заполнения.';
  if (status === 401) return 'Войдите в аккаунт.';
  if (status === 404) return 'Данные не найдены.';
  if (status >= 500) return 'Ошибка сервера. Попробуйте позже.';
  return 'Что-то пошло не так.';
}

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok) {
      throw new Error(getFriendlyMessage(response.status, endpoint, data.message || data.error || ''));
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Нет соединения с сервером.');
    }
    throw error;
  }
}

// ── AUTH ──
export async function registerUser({ name, email, password, role }) {
  const isWorker = role === 'WORKER';
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ displayName: name, email, password, asWorker: isWorker, asCustomer: !isWorker }),
  });
}
export async function loginUser({ email, password }) {
  return apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// ── CATEGORIES ──
export async function getCategories() { return apiCall('/categories'); }

// ── JOB REQUESTS ──
export async function createJobRequest(userId, data) {
  const body = { categoryId: data.categoryId, title: data.title, description: data.description || 'Без описания' };
  if (data.address) body.addressText = data.address;
  if (data.budget) body.budgetTo = data.budget;
  return apiCall('/job-requests', { method: 'POST', headers: { 'X-User-Id': userId }, body: JSON.stringify(body) });
}
export async function getMyJobRequests(userId) {
  return apiCall('/job-requests/my', { headers: { 'X-User-Id': userId } });
}
export async function getOpenJobRequestsForWorker(workerId) {
  return apiCall('/worker/job-requests', { headers: { 'X-User-Id': workerId } });
}

// ── OFFERS ──
export async function getOffersForRequest(requestId) {
  return apiCall(`/job-requests/${requestId}/offers`);
}
export async function createJobOffer(workerId, requestId, data) {
  return apiCall(`/worker/job-requests/${requestId}/offers`, {
    method: 'POST',
    headers: { 'X-User-Id': workerId },
    body: JSON.stringify({ message: data.comment || 'Готов выполнить', price: data.price, estimatedDays: data.estimatedDays || null }),
  });
}
export async function acceptOffer(userId, jobRequestId, offerId) {
  return apiCall(`/deals/accept?jobRequestId=${jobRequestId}&offerId=${offerId}`, {
    method: 'POST', headers: { 'X-User-Id': userId },
  });
}

// ── DEALS ──
export async function getMyDeals(userId) {
  return apiCall('/deals', { headers: { 'X-User-Id': userId } });
}
export async function completeDeal(userId, dealId) {
  return apiCall(`/deals/${dealId}/complete`, { method: 'POST', headers: { 'X-User-Id': userId }, body: JSON.stringify({}) });
}
export async function initiatePayment(userId, dealId) {
  return apiCall(`/initiate?dealId=${dealId}`, { method: 'POST', headers: { 'X-User-Id': userId }, body: JSON.stringify({}) });
}

// ── PROFILE ──
export async function getCustomerProfile(userId) {
  return apiCall('/customer-profiles/me', { headers: { 'X-User-Id': userId } });
}

// ── REVIEWS ──
export async function createReview(userId, dealId, data) {
  return apiCall(`/deals/${dealId}/reviews`, {
    method: 'POST', headers: { 'X-User-Id': userId },
    body: JSON.stringify({ rating: data.rating, text: data.comment || '' }),
  });
}
export async function getReviewsByWorker(workerId) {
  return apiCall(`/workers/${workerId}/reviews`);
}

// ── MESSAGES ──
export async function sendMessage(userId, receiverId, text, jobRequestId) {
  return apiCall('/messages', {
    method: 'POST', headers: { 'X-User-Id': userId },
    body: JSON.stringify({ receiverId, text, jobRequestId: jobRequestId || null }),
  });
}
export async function getConversation(userId, partnerId) {
  return apiCall(`/messages/with/${partnerId}`, { headers: { 'X-User-Id': userId } });
}
export async function getConversations(userId) {
  return apiCall('/messages/conversations', { headers: { 'X-User-Id': userId } });
}
export async function getUnreadCount(userId) {
  return apiCall('/messages/unread-count', { headers: { 'X-User-Id': userId } });
}

// ── AVATAR ──
export async function uploadAvatar(userId, base64Image) {
  return apiCall('/avatar/upload', {
    method: 'POST', headers: { 'X-User-Id': userId },
    body: JSON.stringify({ image: base64Image }),
  });
}