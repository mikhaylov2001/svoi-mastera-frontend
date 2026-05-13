/** Поле счётчика просмотров с бэкенда (после миграции и доработки API). */
export function getJobRequestViewsCount(req) {
  if (!req || typeof req !== 'object') return 0;
  const v = req.viewsCount ?? req.views ?? req.viewCount;
  if (v == null || v === '') return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), Number.MAX_SAFE_INTEGER);
}
