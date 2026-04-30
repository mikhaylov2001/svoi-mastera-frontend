/** После завершения сделки по объявлению бэкенд переводит listing в архив — оповещаем «Мои объявления» без полной перезагрузки */
export const LISTING_ARCHIVED_AFTER_DEAL = 'svoi:listing-archived-after-deal';

export function dispatchListingArchivedAfterDeal(deal) {
  if (!deal || deal.status !== 'COMPLETED') return;
  const lid = deal.listingId;
  if (lid == null) return;
  window.dispatchEvent(new CustomEvent(LISTING_ARCHIVED_AFTER_DEAL, { detail: { listingId: lid } }));
}
