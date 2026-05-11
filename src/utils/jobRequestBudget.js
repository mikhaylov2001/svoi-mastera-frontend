/**
 * Одна окончательная сумма цены в заявке заказчика (поля API: budgetTo / budgetFrom).
 * Приоритет: budgetTo, затем budgetFrom.
 */
export function getJobRequestPublishedBudgetNumber(req) {
  if (!req) return null;
  const to = req.budgetTo != null && req.budgetTo !== '' ? Number(req.budgetTo) : null;
  const from = req.budgetFrom != null && req.budgetFrom !== '' ? Number(req.budgetFrom) : null;
  const okTo = to != null && !Number.isNaN(to) && to > 0;
  const okFrom = from != null && !Number.isNaN(from) && from > 0;
  if (okTo) return to;
  if (okFrom) return from;
  return null;
}

/** Текст, если заказчик не указал сумму в заявке (для подписей в UI). */
export const JOB_REQUEST_PRICE_MISSING_LABEL = 'Цена не указана';

export function hasJobRequestPublishedPrice(req) {
  return getJobRequestPublishedBudgetNumber(req) != null;
}

/** Подпись для карточек и списков: «N ₽» или JOB_REQUEST_PRICE_MISSING_LABEL. */
export function formatJobRequestBudgetLabel(req) {
  const n = getJobRequestPublishedBudgetNumber(req);
  if (n == null) return JOB_REQUEST_PRICE_MISSING_LABEL;
  return `${n.toLocaleString('ru-RU')} ₽`;
}
