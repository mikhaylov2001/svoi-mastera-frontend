/**
 * Подпись бюджета для карточек заявки (без слова «Договорная»).
 */
export function formatJobRequestBudgetLabel(req) {
  if (!req) return 'Цена не указана';
  const to = req.budgetTo != null && req.budgetTo !== '' ? Number(req.budgetTo) : null;
  const from = req.budgetFrom != null && req.budgetFrom !== '' ? Number(req.budgetFrom) : null;
  const okTo = to != null && !Number.isNaN(to);
  const okFrom = from != null && !Number.isNaN(from);
  if (okTo && okFrom && to === from) {
    return `${to.toLocaleString('ru-RU')} ₽`;
  }
  if (okTo) return `до ${to.toLocaleString('ru-RU')} ₽`;
  if (okFrom) return `от ${from.toLocaleString('ru-RU')} ₽`;
  return 'Цена не указана';
}
