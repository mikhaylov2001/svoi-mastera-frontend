import { CATEGORIES_BY_SECTION } from '../pages/CategoriesPage';
import { getCategorySlugFromLabel } from './categoryPlaceholderPhoto';

function normName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

/** Совпадение API-строки с slug каталога, если у бэка другое имя или нет slug. */
function findApiRowForCatalogSlug(apiList, catalogSlug, consumedIds) {
  const want = String(catalogSlug || '').toLowerCase().trim();
  if (!want || !Array.isArray(apiList)) return null;

  const usable = (row) => {
    if (!row) return null;
    const idStr = row.id != null && row.id !== '' ? String(row.id) : null;
    if (idStr && consumedIds.has(idStr)) return null;
    return row;
  };

  for (const c of apiList) {
    const u = usable(c);
    if (!u) continue;
    const s = u.slug != null ? String(u.slug).trim().toLowerCase() : '';
    if (s && s === want) return u;
  }

  for (const c of apiList) {
    const u = usable(c);
    if (!u) continue;
    const fromName = getCategorySlugFromLabel(u.name);
    if (fromName && String(fromName).toLowerCase() === want) return u;
  }

  const keywords = {
    santehnika: ['сантехник', 'сантехнич', 'водопровод', 'канализац', 'смесител'],
    elektrika: ['электрик', 'электромонтаж', 'проводк', 'розетк', 'щитк', 'освещен'],
  };
  const keys = keywords[want];
  if (!keys?.length) return null;

  for (const c of apiList) {
    const u = usable(c);
    if (!u) continue;
    const n = normName(u.name);
    if (!n) continue;
    if (keys.some((k) => n.includes(k))) return u;
  }
  return null;
}

/**
 * Строка категории с валидным id для выбора из каталога (merged + сырой ответ API).
 */
export function resolveCatalogCategoryRow(catalogCat, mergedCategories, apiCategories) {
  const name = typeof catalogCat === 'string' ? catalogCat : catalogCat?.name;
  const slug = typeof catalogCat === 'object' && catalogCat ? catalogCat.slug : null;
  const merged = Array.isArray(mergedCategories) ? mergedCategories : [];
  const api = Array.isArray(apiCategories) ? apiCategories : [];

  let c = merged.find((x) => normName(x.name) === normName(name));
  if (!c && slug) {
    c = merged.find((x) => String(x.slug || '').toLowerCase() === String(slug).toLowerCase());
  }
  if (c && c.id != null && c.id !== '') return c;

  const consumed = new Set();
  for (const x of merged) {
    if (x?.id != null && x.id !== '') consumed.add(String(x.id));
  }
  const slugKey = slug || getCategorySlugFromLabel(name || '');
  if (!slugKey) return c || null;
  const fromApi = findApiRowForCatalogSlug(api, slugKey, consumed);
  if (fromApi && fromApi.id != null && fromApi.id !== '') {
    return {
      ...fromApi,
      name: name || fromApi.name,
      slug: slug || fromApi.slug || slugKey,
    };
  }
  return c || fromApi || null;
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
    if (!row) row = findApiRowForCatalogSlug(api, sc.slug, consumedApiIds);
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
