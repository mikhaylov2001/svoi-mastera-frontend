/** Продакшен API (Render). Менять здесь при смене хоста бэкенда. */
export const BACKEND_ORIGIN = 'https://svoi-mastera-backend-ntp0.onrender.com';

export const DEFAULT_API_V1_BASE = `${BACKEND_ORIGIN}/api/v1`;

/** Старые Render-сервисы — для автозамены устаревших env. */
export const LEGACY_BACKEND_ORIGINS = [
  'https://svoi-mastera-backend.onrender.com',
  'https://svoi-mastera-backend-n9om.onrender.com',
];

/** @deprecated используйте LEGACY_BACKEND_ORIGINS */
export const LEGACY_BACKEND_ORIGIN = LEGACY_BACKEND_ORIGINS[0];

export function normalizeBackendOrigin(raw) {
  const value = String(raw || '').trim().replace(/\/$/, '');
  if (!value) return '';
  const isLegacy = LEGACY_BACKEND_ORIGINS.some(
    (legacy) => value === legacy || value.startsWith(`${legacy}/`),
  );
  if (isLegacy) return BACKEND_ORIGIN;
  return value.replace(/\/api\/v1\/?$/, '');
}

export function toApiV1Base(raw) {
  const origin = normalizeBackendOrigin(raw) || BACKEND_ORIGIN;
  return origin.endsWith('/api/v1') ? origin : `${origin}/api/v1`;
}
