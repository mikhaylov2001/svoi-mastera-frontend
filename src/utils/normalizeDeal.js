import { categoryLabelFromFields } from './categoryLabel';
import { asPhotoArray } from './photoArray';
import { safeText } from './safeText';

/** Приводит сделку к безопасному для рендера виду. */
export function normalizeDealForView(deal) {
  if (!deal || typeof deal !== 'object') return deal;
  return {
    ...deal,
    title: safeText(deal.title, 'Сделка'),
    description: safeText(deal.description),
    category: categoryLabelFromFields(deal),
    photos: asPhotoArray(deal.photos),
    workerName: safeText(deal.workerName),
    workerLastName: safeText(deal.workerLastName),
    customerName: safeText(deal.customerName),
    customerLastName: safeText(deal.customerLastName),
    cancellationReason: safeText(deal.cancellationReason),
    workerAvatar: deal.workerAvatar || deal.workerAvatarUrl || null,
    customerAvatar: deal.customerAvatar || deal.customerAvatarUrl || null,
  };
}
