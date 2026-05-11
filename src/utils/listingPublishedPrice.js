/**
 * Одна окончательная сумма цены объявления мастера для каталога и карточек.
 * Основное поле — price; priceTo / priceFrom — запасной вариант для старых или смешанных ответов API.
 */
export function getListingPublishedPriceNumber(listing) {
  if (!listing || typeof listing !== 'object') return null;
  const pick = (x) => {
    if (x == null || x === '') return null;
    const n = Number(x);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  return pick(listing.price) ?? pick(listing.priceTo) ?? pick(listing.priceFrom) ?? null;
}
