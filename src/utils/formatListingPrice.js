/** Части цены объявления без дублирования «₽». */
export function formatListingPriceParts(priceNum, priceUnit) {
  const unit = String(priceUnit || '').trim();
  if (priceNum == null || priceNum === '') {
    return { main: unit || 'Договорная', suffix: '' };
  }
  const main = Number(priceNum).toLocaleString('ru-RU');
  if (!unit) return { main, suffix: '₽' };
  if (unit.startsWith('₽')) return { main, suffix: unit };
  return { main, suffix: `₽ ${unit}` };
}

/** Одна строка для таблицы «Условия»: «1 500 ₽/час». */
export function formatListingPriceLabel(priceNum, priceUnit) {
  const { main, suffix } = formatListingPriceParts(priceNum, priceUnit);
  if (!suffix) return main;
  return `${main} ${suffix}`;
}
