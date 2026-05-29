/** Продакшен API (Render). Менять здесь при смене хоста бэкенда. */
export const BACKEND_ORIGIN = 'https://svoi-mastera-backend-n9om.onrender.com';

export const DEFAULT_API_V1_BASE = `${BACKEND_ORIGIN}/api/v1`;

/** Старый Render-сервис (suspended) — для автозамены устаревших env. */
export const LEGACY_BACKEND_ORIGIN = 'https://svoi-mastera-backend.onrender.com';

export function normalizeBackendOrigin(raw) {
  const value = String(raw || '').trim().replace(/\/$/, '');
  if (!value) return '';
  if (value === LEGACY_BACKEND_ORIGIN || value.startsWith(`${LEGACY_BACKEND_ORIGIN}/`)) {
    return BACKEND_ORIGIN;
  }
  return value.replace(/\/api\/v1\/?$/, '');
}

export function toApiV1Base(raw) {
  const origin = normalizeBackendOrigin(raw) || BACKEND_ORIGIN;
  return origin.endsWith('/api/v1') ? origin : `${origin}/api/v1`;
}
