/**
 * Единый верхний баннер: одни габариты (CSS vars) и достаточное разрешение фото,
 * чтобы при object-fit: cover картинка оставалась чёткой на широких экранах.
 *
 * Фото: интерьер квартиры — окна, светлый пол, ощущение жилого пространства в городской квартире.
 */
export const PAGE_HERO_DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=max&w=2400&q=88';

/** Градиент поверх фото: лёгкий тёплый акцент под фирменный оранжевый (#e8410a), читаемый текст */
export const PAGE_HERO_OVERLAY_GRADIENT =
  'linear-gradient(172deg, rgba(13,13,13,.05) 0%, rgba(232,65,10,.12) 44%, rgba(13,13,13,.68) 100%)';

/** Единый фильтр для полноширинных hero-картинок */
export const PAGE_HERO_IMG_FILTER = 'brightness(.72) saturate(1.02)';

/** Кадрирование по центру — комната квартиры читается целиком */
export const PAGE_HERO_OBJECT_POSITION = 'center center';

/** Поднимает качество готовых ссылок Unsplash в данных категорий / секций */
export function heroPhotoHiRes(url) {
  if (!url || typeof url !== 'string') return PAGE_HERO_DEFAULT_PHOTO;
  if (!url.includes('images.unsplash.com')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'max');
    u.searchParams.set('w', '2400');
    u.searchParams.set('q', '88');
    return u.toString();
  } catch {
    return url;
  }
}
