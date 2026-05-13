/** Поле счётчика просмотров с бэкенда (camelCase и snake_case). */
export function getJobRequestViewsCount(req) {
  if (!req || typeof req !== 'object') return 0;
  const v =
    req.viewsCount
    ?? req.views_count
    ?? req.views
    ?? req.viewCount
    ?? req.view_count;
  if (v == null || v === '') return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), Number.MAX_SAFE_INTEGER);
}
