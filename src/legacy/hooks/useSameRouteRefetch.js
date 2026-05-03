import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SAME_ROUTE_REFETCH, isSameNavDest } from '../utils/sameRouteRefetch';

/**
 * При повторном клике по пункту шапки с тем же маршрутом вызывает fetcher (без смены истории).
 * @param {string} navPath — значение `to` у NavLink (например '/deals', '/find-master')
 * @param {() => void} fetcher
 * @param {{ end?: boolean }} [options] — для главной: { end: true } совпадает с NavLink end
 */
export function useSameRouteRefetch(navPath, fetcher, options = {}) {
  const { pathname } = useLocation();
  const end = options.end ?? navPath === '/';

  useEffect(() => {
    const handler = (ev) => {
      const clicked = ev.detail?.path;
      if (clicked !== navPath) return;
      if (!isSameNavDest(pathname, clicked, { end })) return;
      fetcher();
    };
    window.addEventListener(SAME_ROUTE_REFETCH, handler);
    return () => window.removeEventListener(SAME_ROUTE_REFETCH, handler);
  }, [navPath, pathname, fetcher, end]);
}
