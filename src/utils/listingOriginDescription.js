/**
 * Текст заявки, который подставляется при оформлении заказа по объявлению мастера
 * (см. DealService.acceptListing). Один и тот же сырой текст показываем по-разному
 * заказчику и мастеру.
 */
export const LISTING_ORDER_DESC_NEUTRAL =
  'Заказ по объявлению мастера из каталога услуг.';

export const LISTING_ORDER_DESC_LEGACY_MASTER_POV =
  'Клиент принял вашу услугу из объявления.';

function isListingOriginAutoDescription(desc) {
  if (!desc || desc === 'Без описания') return false;
  return (
    desc === LISTING_ORDER_DESC_NEUTRAL
    || desc === LISTING_ORDER_DESC_LEGACY_MASTER_POV
  );
}

/** @param {'CUSTOMER' | 'WORKER'} viewerRole */
export function formatListingOriginDescription(viewerRole, desc) {
  if (!desc || desc === 'Без описания') return '';
  if (!isListingOriginAutoDescription(desc)) return desc;
  if (viewerRole === 'WORKER') {
    return 'Заказчик оформил заказ по вашему объявлению из каталога услуг.';
  }
  return 'Вы оформили заказ по объявлению мастера из каталога услуг.';
}
