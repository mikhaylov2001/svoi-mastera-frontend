import { CATEGORIES_BY_SECTION } from '../pages/CategoriesPage';
import { getCategorySlugFromLabel } from './categoryPlaceholderPhoto';

function normName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

/** Ответ GET /categories может быть массивом или обёрткой { data, categories, … }. */
export function normalizeCategoriesApiResponse(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object') {
    if (Array.isArray(payload.categories)) return payload.categories;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.content)) return payload.content;
  }
  return [];
}

/** У бэка id может называться categoryId — приводим к полю id для UI. */
export function pickCategoryId(row) {
  if (!row || typeof row !== 'object') return null;
  const v = row.id ?? row.categoryId ?? row.category_id;
  if (v == null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function ensureCategoryIdField(c) {
  if (!c || typeof c !== 'object') return c;
  const id = pickCategoryId(c);
  if (id == null) return { ...c };
  return { ...c, id };
}

/** Совпадение API-строки с slug каталога, если у бэка другое имя или нет slug. */
function findApiRowForCatalogSlug(apiList, catalogSlug, consumedIds) {
  const want = String(catalogSlug || '').toLowerCase().trim();
  if (!want || !Array.isArray(apiList)) return null;

  const usable = (row) => {
    if (!row) return null;
    const idStr = pickCategoryId(row);
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
    santehnika: [
      'сантехник', 'сантехнич', 'водопровод', 'канализац', 'смесител',
      'plumb', 'plumbing', 'pipe',
    ],
    elektrika: [
      'электрик', 'электромонтаж', 'проводк', 'розетк', 'щитк', 'освещен',
      'electric', 'wiring', 'socket', 'lighting',
    ],
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
  const api = normalizeCategoriesApiResponse(apiCategories).map(ensureCategoryIdField);

  let c = merged.find((x) => normName(x.name) === normName(name));
  if (!c && slug) {
    c = merged.find((x) => String(x.slug || '').toLowerCase() === String(slug).toLowerCase());
  }
  const cid = pickCategoryId(c);
  if (c && cid) return { ...c, id: cid };

  const consumed = new Set();
  for (const x of merged) {
    const xid = pickCategoryId(x);
    if (xid) consumed.add(String(xid));
  }
  const slugKey = slug || getCategorySlugFromLabel(name || '');
  if (!slugKey) return c || null;
  const fromApi = findApiRowForCatalogSlug(api, slugKey, consumed);
  const aid = pickCategoryId(fromApi);
  if (fromApi && aid) {
    return {
      ...fromApi,
      id: aid,
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
  const api = normalizeCategoriesApiResponse(apiCategories).map(ensureCategoryIdField);
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
    const rid = pickCategoryId(row);
    if (!rid) {
      return { ...sc, description: sc.desc };
    }
    consumedApiIds.add(String(rid));
    return {
      ...row,
      ...sc,
      id: rid,
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
    const idStr = pickCategoryId(c);
    if (idStr && consumedApiIds.has(idStr)) continue;
    const slugKey = c.slug != null && String(c.slug).trim() !== '' ? String(c.slug).toLowerCase() : '';
    if (slugKey && catalogSlugs.has(slugKey)) continue;
    merged.push(ensureCategoryIdField({ ...c }));
  }
  return merged;
}

/** Объявление в категории хаба (имя и/или id с бэка). */
export function listingMatchesCatalogCategory(listing, categoryRow) {
  if (!listing || !categoryRow) return false;
  if (listing.category === categoryRow.name) return true;
  const rowId = pickCategoryId(categoryRow);
  if (rowId == null) return false;
  return (
    listing.categoryId === categoryRow.id ||
    String(listing.categoryId) === String(rowId)
  );
}
