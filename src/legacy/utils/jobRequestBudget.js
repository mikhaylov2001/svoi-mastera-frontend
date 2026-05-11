/**
 * Одна окончательная сумма бюджета заявки (без диапазона «от — до» и без «до» в тексте).
 * Приоритет: budgetTo, затем budgetFrom — как сумма, указанная при публикации.
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

/** Подпись бюджета для карточек и списков: одно число в ₽ или «Не указана». */
export function formatJobRequestBudgetLabel(req) {
  const n = getJobRequestPublishedBudgetNumber(req);
  if (n == null) return 'Не указана';
  return `${n.toLocaleString('ru-RU')} ₽`;
}
