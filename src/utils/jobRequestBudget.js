/**
 * Сумма в заявке для карточек (одна окончательная цифра в заявке; диапазон — редкий случай).
 */
export function formatJobRequestBudgetLabel(req) {
  if (!req) return 'Не указана';
  const to = req.budgetTo != null && req.budgetTo !== '' ? Number(req.budgetTo) : null;
  const from = req.budgetFrom != null && req.budgetFrom !== '' ? Number(req.budgetFrom) : null;
  const okTo = to != null && !Number.isNaN(to);
  const okFrom = from != null && !Number.isNaN(from);
  if (okTo && okFrom && to === from) {
    return `${to.toLocaleString('ru-RU')} ₽`;
  }
  if (okTo && okFrom && to !== from) {
    return `${from.toLocaleString('ru-RU')} — ${to.toLocaleString('ru-RU')} ₽`;
  }
  if (okTo) return `${to.toLocaleString('ru-RU')} ₽`;
  if (okFrom) return `${from.toLocaleString('ru-RU')} ₽`;
  return 'Не указана';
}
