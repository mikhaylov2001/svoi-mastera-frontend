/** Склонение существительного после числа (RU). Возвращает только слово, без числа. */
export function pluralRuForm(n, one, few, many) {
  const num = Number(n) || 0;
  const abs = Math.abs(num) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (n1 === 1) return one;
  if (n1 >= 2 && n1 <= 4) return few;
  return many;
}

/** «1 заявка», «2 заявки» — число и слово через неразрывный пробел. */
export function formatCountRu(n, one, few, many) {
  const num = Number(n) || 0;
  return `${num}\u00a0${pluralRuForm(num, one, few, many)}`;
}

export function formatRequestsCount(n) {
  return formatCountRu(n, 'заявка', 'заявки', 'заявок');
}

export function formatListingsCount(n) {
  return formatCountRu(n, 'объявление', 'объявления', 'объявлений');
}

export function formatOffersCount(n) {
  return formatCountRu(n, 'отклик', 'отклика', 'откликов');
}

export function formatReviewsCount(n) {
  return formatCountRu(n, 'отзыв', 'отзыва', 'отзывов');
}

export function formatCategoriesCount(n) {
  return formatCountRu(n, 'категория', 'категории', 'категорий');
}

export function formatMastersCount(n) {
  return formatCountRu(n, 'мастер', 'мастера', 'мастеров');
}

export function formatActiveRequestsCount(n) {
  return formatCountRu(n, 'активная заявка', 'активные заявки', 'активных заявок');
}
