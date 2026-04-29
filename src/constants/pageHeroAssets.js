/**
 * Единый верхний баннер: одни габариты (CSS vars) и достаточное разрешение фото,
 * чтобы при object-fit: cover картинка оставалась чёткой на широких экранах.
 */
export const PAGE_HERO_DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=max&w=2400&q=88';

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
