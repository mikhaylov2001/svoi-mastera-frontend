/** Совпадает с каталогом на главной / CategoriesPage (название ↔ slug). */
const CATEGORY_SLUG_AND_NAMES = [
  { slug: 'remont-kvartir', name: 'Ремонт квартир' },
  { slug: 'santehnika', name: 'Сантехника' },
  { slug: 'elektrika', name: 'Электрика' },
  { slug: 'uborka', name: 'Уборка' },
  { slug: 'parikhmaher', name: 'Парикмахер' },
  { slug: 'manikur', name: 'Маникюр и педикюр' },
  { slug: 'krasota-i-zdorovie', name: 'Красота и здоровье' },
  { slug: 'repetitorstvo', name: 'Репетиторство' },
  { slug: 'kompyuternaya-pomosh', name: 'Компьютерная помощь' },
];

const FLAT_CATEGORIES = CATEGORY_SLUG_AND_NAMES;

/** Те же превью, что у блока «Популярные категории» на главной (w=600). */
export const CATEGORY_PLACEHOLDER_PHOTO_BY_SLUG = {
  'remont-kvartir': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
  santehnika: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  elektrika: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
  uborka: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80',
  parikhmaher: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
  manikur: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
  'krasota-i-zdorovie': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  repetitorstvo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
};

function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const NAME_TO_SLUG = new Map(FLAT_CATEGORIES.map((c) => [norm(c.name), c.slug]));

function slugFromApi(categoryId, categoriesApi) {
  if (categoryId == null || !Array.isArray(categoriesApi)) return null;
  const row = categoriesApi.find((x) => String(x.id) === String(categoryId));
  return row?.slug ? String(row.slug) : null;
}

/**
 * URL картинки-заглушки по категории объявления или заявки (если своих фото нет).
 *
 * @param {object} fields — category / categoryName, categorySlug, categoryId
 * @param {Array<{ id: unknown, slug?: string, name?: string }>|null} [categoriesApi] — ответ getCategories()
 * @returns {string|null}
 */
export function getCategoryPlaceholderPhotoUrl(fields = {}, categoriesApi = null) {
  const slugDirect =
    fields.categorySlug != null && String(fields.categorySlug).trim()
      ? String(fields.categorySlug).trim()
      : null;

  let slug = slugDirect || slugFromApi(fields.categoryId, categoriesApi);

  const label = norm(fields.categoryName ?? fields.category);
  if (!slug && label && NAME_TO_SLUG.has(label)) {
    slug = NAME_TO_SLUG.get(label);
  }

  if (!slug && label) {
    for (const c of FLAT_CATEGORIES) {
      const n = norm(c.name);
      if (n === label || label.includes(n) || n.includes(label)) {
        slug = c.slug;
        break;
      }
    }
  }

  if (!slug || !CATEGORY_PLACEHOLDER_PHOTO_BY_SLUG[slug]) return null;
  return CATEGORY_PLACEHOLDER_PHOTO_BY_SLUG[slug];
}

/** Slug категории по названию (для ссылок /find-master/:slug). */
export function getCategorySlugFromLabel(categoryLabel) {
  const label = norm(categoryLabel);
  if (!label) return '';
  if (NAME_TO_SLUG.has(label)) return NAME_TO_SLUG.get(label);
  for (const c of FLAT_CATEGORIES) {
    const n = norm(c.name);
    if (n === label || label.includes(n) || n.includes(label)) return c.slug;
  }
  return '';
}
