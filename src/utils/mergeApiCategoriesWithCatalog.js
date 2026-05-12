import { CATEGORIES_BY_SECTION } from '../pages/CategoriesPage';

function normName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

/**
 * Полный список категорий для хабов «Найти мастера» / «Найти работу» и мастеров заявок:
 * порядок и набор slug как на главной, плюс id и поля с бэка при совпадении slug или названия.
 * Категории из API, которых нет в каталоге, добавляются в конец.
 */
export function mergeApiCategoriesWithCatalog(apiCategories) {
  const api = Array.isArray(apiCategories) ? apiCategories : [];
  const bySlug = new Map();
  const byName = new Map();
  for (const c of api) {
    if (!c) continue;
    const slugRaw = c.slug != null ? String(c.slug).trim() : '';
    if (slugRaw !== '') {
      bySlug.set(slugRaw.toLowerCase(), c);
    }
    const nk = normName(c.name);
    if (nk) byName.set(nk, c);
  }

  const catalogSlugs = new Set();
  const consumedApiIds = new Set();

  const merged = Object.values(CATEGORIES_BY_SECTION).flat().map((sc) => {
    catalogSlugs.add(String(sc.slug).toLowerCase());
    let row = bySlug.get(String(sc.slug).toLowerCase());
    if (!row) row = byName.get(normName(sc.name));
    if (!row) {
      return { ...sc, description: sc.desc };
    }
    if (row.id != null && row.id !== '') consumedApiIds.add(String(row.id));
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
    if (!c) continue;
    const idStr = c.id != null && c.id !== '' ? String(c.id) : null;
    if (idStr && consumedApiIds.has(idStr)) continue;
    const slugKey = c.slug != null && String(c.slug).trim() !== '' ? String(c.slug).toLowerCase() : '';
    if (slugKey && catalogSlugs.has(slugKey)) continue;
    merged.push({ ...c });
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
