/** Общие хелперы публичных профилей (мастер / заказчик), стиль Base44 */

export function publicTimeAgo(d) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'вчера';
  if (days < 30) return `${days} дн. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес. назад`;
  return `${Math.floor(months / 12)} г. назад`;
}

export function publicMemberSince(d) {
  if (!d) return null;
  return `На сервисе с ${new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`;
}

export function publicReviewsLabel(n) {
  if (n === 1) return '1 отзыв';
  if (n > 1 && n < 5) return `${n} отзыва`;
  return `${n} отзывов`;
}

/** Строка ★/☆ как в Base44 starsRow */
export function publicStarsRow(rating, max = 5) {
  const filled = Math.round(Number(rating) || 0);
  return Array.from({ length: max }, (_, i) => (i < filled ? '★' : '☆')).join('');
}

export function publicFirstName(fullName) {
  if (!fullName) return 'мастере';
  return String(fullName).trim().split(/\s+/)[0] || 'мастере';
}

export function publicDeclension(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
