/** Краткий счётчик для мобильных карточек категорий: «3 шт.» */
export function formatCatalogCountShort(count) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  return `${n} шт.`;
}
