/**
 * Безопасная строка категории из полей сделки, заявки или объявления.
 * API иногда отдаёт category как объект { id, name } — React не может рендерить объект.
 */
export function categoryLabelFromFields(fields) {
  if (fields == null) return '';
  if (typeof fields === 'string') return fields.trim();
  if (typeof fields !== 'object') return String(fields).trim();

  const direct = [
    fields.categoryName,
    fields.categoryTitle,
    fields.name,
  ].find((v) => typeof v === 'string' && v.trim());
  if (direct) return direct.trim();

  const cat = fields.category;
  if (typeof cat === 'string' && cat.trim()) return cat.trim();
  if (cat && typeof cat === 'object' && typeof cat.name === 'string' && cat.name.trim()) {
    return cat.name.trim();
  }

  return '';
}

/** @param {object|null|undefined} deal */
export function dealCategoryLabel(deal) {
  return categoryLabelFromFields(deal);
}
