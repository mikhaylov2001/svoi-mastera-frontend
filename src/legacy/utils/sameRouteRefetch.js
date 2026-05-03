/** Событие: пользователь снова выбрал текущий пункт меню — страница может перезагрузить данные */
export const SAME_ROUTE_REFETCH = 'svoi:same-route-refetch';

export function dispatchSameRouteRefetch(navPath) {
  window.dispatchEvent(new CustomEvent(SAME_ROUTE_REFETCH, { detail: { path: navPath } }));
}

/**
 * Совпадает ли уже открытый URL с пунктом меню `navTo` (для решения: не навигировать, а только refetch).
 */
export function isSameNavDest(pathname, navTo, { end } = {}) {
  if (navTo === '/') return pathname === '/';
  if (end) return pathname === navTo;
  if (navTo === '/chat') return pathname === '/chat' || pathname.startsWith('/chat/');
  if (navTo === '/find-master') {
    return pathname === '/find-master' || pathname.startsWith('/find-master/');
  }
  return pathname === navTo || pathname.startsWith(`${navTo}/`);
}
