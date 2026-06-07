import { categoryLabelFromFields } from './categoryLabel';
import { asPhotoArray } from './photoArray';

/** Приводит сделку к безопасному для рендера виду. */
export function normalizeDealForView(deal) {
  if (!deal || typeof deal !== 'object') return deal;
  return {
    ...deal,
    category: categoryLabelFromFields(deal),
    photos: asPhotoArray(deal.photos),
    workerAvatar: deal.workerAvatar || deal.workerAvatarUrl || null,
    customerAvatar: deal.customerAvatar || deal.customerAvatarUrl || null,
  };
}
