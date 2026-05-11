import { CATEGORIES_BY_SECTION } from '../pages/CategoriesPage';

/**
 * Полный список категорий для хабов «Найти мастера» / «Найти работу»:
 * порядок и набор slug как на главной, плюс id и поля с бэка при совпадении slug.
 * Категории из API, которых нет в каталоге, добавляются в конец.
 */
export function mergeApiCategoriesWithCatalog(apiCategories) {
  const api = Array.isArray(apiCategories) ? apiCategories : [];
  const bySlug = new Map();
  for (const c of api) {
    if (!c || c.slug == null || String(c.slug).trim() === '') continue;
    bySlug.set(String(c.slug).toLowerCase(), c);
  }
  const catalogSlugs = new Set();
  const merged = Object.values(CATEGORIES_BY_SECTION).flat().map((sc) => {
    catalogSlugs.add(String(sc.slug).toLowerCase());
    const row = bySlug.get(String(sc.slug).toLowerCase());
    if (!row) {
      return { ...sc, description: sc.desc };
    }
    return {
      ...row,
      ...sc,
      id: row.id,
      name: sc.name,
      slug: sc.slug,
      description:
        row.description != null && String(row.description).trim() !== ''
          ? row.description
          : sc.desc,
    };
  });
  for (const c of api) {
    if (!c || c.slug == null || String(c.slug).trim() === '') continue;
    const k = String(c.slug).toLowerCase();
    if (!catalogSlugs.has(k)) merged.push({ ...c });
  }
  return merged;
}

/** Объявление в категории хаба (имя и/или id с бэка). */
export function listingMatchesCatalogCategory(listing, categoryRow) {
  if (!listing || !categoryRow) return false;
  if (listing.category === categoryRow.name) return true;
  if (categoryRow.id == null || categoryRow.id === '') return false;
  return (
    listing.categoryId === categoryRow.id ||
    String(listing.categoryId) === String(categoryRow.id)
  );
}
