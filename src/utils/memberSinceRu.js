const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** Для подписи «С апреля 2026 г.» — месяц в родительном падеже. */
export function formatMemberSinceRu(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const m = MONTHS_GENITIVE[date.getMonth()];
  const y = date.getFullYear();
  return `${m} ${y} г.`;
}
