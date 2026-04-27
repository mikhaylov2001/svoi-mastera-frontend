const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080/api/v1'
  : 'https://svoi-mastera-backend.onrender.com/api/v1';

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
    const { headers: extraHeaders, cache, ...restOptions } = options;
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...restOptions,
      cache: cache || 'no-store',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
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
export async function registerUser({ name, lastName, email, password, role }) {
  const isWorker = role === 'WORKER';
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ displayName: name, lastName: lastName || '', email, password, asWorker: isWorker, asCustomer: !isWorker }),
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
  if (data.budget != null && data.budget !== '') {
    const n = Number(data.budget);
    if (!Number.isNaN(n) && n > 0) {
      body.budgetFrom = n;
      body.budgetTo = n;
    }
  }
  if (data.photos && data.photos.length > 0) body.photos = data.photos;
  return apiCall('/job-requests', { method: 'POST', headers: { 'X-User-Id': userId }, body: JSON.stringify(body) });
}
export async function getMyJobRequests(userId) {
  return apiCall('/job-requests/my', { headers: { 'X-User-Id': userId } });
}
export async function getOpenJobRequests() {
  return apiCall('/job-requests/open');
}

export async function getOpenJobRequestsForWorker(workerId) {
  return apiCall('/worker/job-requests', { headers: { 'X-User-Id': workerId } });
}

export async function getJobRequestById(userId, requestId) {
  return apiCall(`/job-requests/${requestId}`, { headers: { 'X-User-Id': userId } });
}

/** Редактирование своей открытой заявки (только заказчик, статус OPEN на бэкенде) */
export async function updateJobRequest(userId, requestId, body) {
  return apiCall(`/job-requests/${requestId}`, {
    method: 'PUT',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify(body),
  });
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
export async function acceptListingDeal(userId, listingId) {
  return apiCall(`/deals/accept-listing?listingId=${listingId}`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
  });
}

// Мастер принимает сделку со статусом NEW → IN_PROGRESS
export async function workerStartDeal(userId, dealId) {
  return apiCall(`/deals/${dealId}/start`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify({}),
  });
}

/** Отмена сделки в статусе NEW (заказчик или мастер) */
export async function cancelPendingDeal(userId, dealId, reason = '') {
  const qs = reason?.trim() ? `?reason=${encodeURIComponent(reason.trim())}` : '';
  return apiCall(`/deals/${dealId}/cancel${qs}`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
  });
}

/** Отмена активной сделки IN_PROGRESS (обе стороны) */
export async function cancelActiveDeal(userId, dealId, reason = '') {
  const qs = reason?.trim() ? `?reason=${encodeURIComponent(reason.trim())}` : '';
  return apiCall(`/deals/${dealId}/cancel-active${qs}`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
  });
}

// ── DEALS ──
export async function getMyDeals(userId) {
  return apiCall('/deals', { headers: { 'X-User-Id': userId }, cache: 'no-store' });
}
export async function completeDeal(userId, dealId) {
  return apiCall(`/deals/${dealId}/complete`, { method: 'POST', headers: { 'X-User-Id': userId }, body: JSON.stringify({}) });
}


// ── PROFILE ──
export async function getCustomerProfile(userId) {
  return apiCall('/customer-profiles/me', { headers: { 'X-User-Id': userId } });
}

// ── REVIEWS ──
export async function createReview(userId, dealId, data) {
  return apiCall(`/deals/${dealId}/reviews`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify({ rating: data.rating, text: data.text || data.comment || '' }),
  });
}

// Мастер → отзыв заказчику
export async function createCustomerReview(userId, dealId, data) {
  return apiCall(`/deals/${dealId}/reviews/worker`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify({ rating: data.rating, text: data.text || data.comment || '' }),
  });
}

export async function getReviewsByWorker(workerId) {
  return apiCall(`/workers/${workerId}/reviews`);
}

export async function getReviewsByCustomer(customerUserId) {
  return apiCall(`/customers/${customerUserId}/reviews`);
}

// ── WORKER SERVICES ──
export async function getWorkerServicesByWorker(workerUserId) {
  return apiCall(`/workers/${workerUserId}/services`);
}
export async function getMyWorkerServices(userId) {
  return apiCall('/worker/services', { headers: { 'X-User-Id': userId } });
}
export async function getWorkerServices(query = '') {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return apiCall(`/worker-services${qs}`);
}
export async function createWorkerService(userId, data) {
  return apiCall('/worker/services', {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify({
      title: data.title,
      description: data.description || null,
      priceFrom: data.priceFrom ?? null,
      priceTo: data.priceTo ?? null,
      active: data.active ?? true,
    }),
  });
}
export async function updateWorkerService(userId, id, patch) {
  return apiCall(`/worker/services/${id}`, {
    method: 'PATCH',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify(patch),
  });
}
export async function deleteWorkerService(userId, id) {
  return apiCall(`/worker/services/${id}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
}

// ── MESSAGES ──
export async function sendMessage(userId, receiverId, text, jobRequestId, attachmentUrl, attachmentType) {
  return apiCall('/messages', {
    method: 'POST', headers: { 'X-User-Id': userId },
    body: JSON.stringify({
      receiverId,
      text,
      jobRequestId: jobRequestId || null,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
    }),
  });
}
export async function getConversation(userId, partnerId) {
  return apiCall(`/messages/with/${partnerId}`, { headers: { 'X-User-Id': userId } });
}
export async function getConversations(userId) {
  return apiCall('/messages/conversations', { headers: { 'X-User-Id': userId } });
}
export async function getUnreadCount(userId) {
  const data = await apiCall('/messages/unread-count', { headers: { 'X-User-Id': userId } });
  // Бэкенд может вернуть число или объект { count: N }
  if (typeof data === 'number') return data;
  if (typeof data === 'object' && data !== null) return data.count ?? data.unreadCount ?? 0;
  return 0;
}

export async function updateMessage(userId, messageId, text) {
  return apiCall(`/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify({ text }),
  });
}

export async function deleteMessage(userId, messageId) {
  return apiCall(`/messages/${messageId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
}

export async function deleteConversation(userId, partnerId) {
  return apiCall(`/messages/with/${partnerId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
}

// ── AVATAR ──
export async function uploadAvatar(userId, base64Image) {
  return apiCall('/avatar/upload', {
    method: 'POST', headers: { 'X-User-Id': userId },
    body: JSON.stringify({ image: base64Image }),
  });
}

// ── FILE UPLOAD ──
// Загружает файл на сервер, возвращает { url, filename, size, type }
export async function uploadFile(userId, file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
      body: formData,
      // Content-Type НЕ ставим — браузер сам ставит multipart/form-data с boundary
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok) throw new Error(data.message || 'Ошибка загрузки файла');
    return data; // { url, filename, size, contentType }
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Нет соединения с сервером.');
    }
    throw error;
  }
}

// ── LISTINGS ──
export async function getListings() {
  return apiCall('/listings');
}
export async function getListingsByWorker(workerUserId) {
  return apiCall(`/workers/${workerUserId}/listings`);
}
export async function createListing(userId, data) {
  return apiCall('/listings', {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify(data),
  });
}
export async function updateListing(userId, listingId, data) {
  return apiCall(`/listings/${listingId}`, {
    method: 'PUT',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify(data),
  });
}
export async function deleteListing(userId, listingId) {
  return apiCall(`/listings/${listingId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
}

/** Учёт просмотра публичной страницы объявления (вызывать не от владельца) */
export async function recordListingView(listingId) {
  return apiCall(`/listings/${listingId}/view`, { method: 'POST', body: '{}' });
}

// ── NOTIFICATIONS ──
export async function getNotifications(userId) {
  return apiCall('/notifications', { headers: { 'X-User-Id': userId } });
}
export async function getNotificationsUnreadCount(userId) {
  return apiCall('/notifications/unread-count', { headers: { 'X-User-Id': userId } });
}
export async function markNotificationRead(notificationId) {
  return apiCall(`/notifications/${notificationId}/read`, { method: 'POST' });
}
export async function markAllNotificationsRead(userId) {
  return apiCall('/notifications/read-all', { method: 'POST', headers: { 'X-User-Id': userId } });
}

// ── NOTIFICATION SETTINGS ──
export async function getNotificationSettings(userId) {
  return apiCall(`/users/${userId}/notification-settings`);
}

export async function updateNotificationSettings(userId, settings) {
  return apiCall(`/users/${userId}/notification-settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ── USER PROFILE ──
export async function getUserProfile(userId) {
  return apiCall(`/users/${userId}/profile`);
}

export async function updateUserProfile(userId, data) {
  return apiCall(`/users/${userId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(userId, data) {
  return apiCall(`/users/${userId}/change-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}