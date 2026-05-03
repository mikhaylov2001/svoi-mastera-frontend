const N = 8;

/** Стабильный индекс 0..N-1 по названию категории (одинаковый цвет на всех страницах). */
export function categoryToneIndex(name) {
  if (name == null || String(name).trim() === '') return 0;
  const s = String(name).trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % N;
}

/** Класс вида cat-tone-3 для подстановки в className. */
export function categoryChipToneClass(name) {
  return `cat-tone-${categoryToneIndex(name)}`;
}
