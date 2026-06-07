/** Нормализует photos в массив строк (API иногда отдаёт одну строку). */
export function asPhotoArray(photos) {
  if (!photos) return [];
  if (Array.isArray(photos)) return photos.filter(Boolean);
  if (typeof photos === 'string' && photos.trim()) return [photos.trim()];
  return [];
}
