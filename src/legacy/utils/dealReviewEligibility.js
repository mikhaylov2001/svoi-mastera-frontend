/**
 * Отзыв разрешён только после завершения сделки и подтверждения выполнения с обеих сторон
 * (совпадает с проверкой на бэкенде в ReviewService).
 */
export function dealEligibleForReviews(deal) {
  if (!deal || deal.status !== 'COMPLETED') return false;
  return Boolean(deal.customerConfirmed && deal.workerConfirmed);
}
