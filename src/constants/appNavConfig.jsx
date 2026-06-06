import {
  Home,
  Hammer,
  Handshake,
  MessageCircle,
  ClipboardList,
  LayoutList,
} from 'lucide-react';

/** Счёт совпадения path с пунктом навигации (выше = точнее). */
function navPathMatchScore(pathname, item, path) {
  if (item.end || path === '/') {
    return pathname === path ? 10000 + path.length : -1;
  }
  if (pathname === path) {
    return 5000 + path.length + (path === item.to ? 1 : 0);
  }
  if (pathname.startsWith(`${path}/`)) {
    return path.length + (path === item.to ? 0.5 : 0);
  }
  return -1;
}

/** Единственный активный пункт навигации (самое точное совпадение). */
export function resolveActiveNavItem(pathname, items) {
  let bestItem = null;
  let bestScore = -1;

  for (const item of items) {
    const paths = [item.to, ...(item.alsoMatch || [])];
    for (const p of paths) {
      const score = navPathMatchScore(pathname, item, p);
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }
  }

  return bestItem;
}

/** Активна ли вкладка по текущему pathname */
export function isNavTabActive(pathname, item, allItems) {
  if (allItems?.length) {
    return resolveActiveNavItem(pathname, allItems) === item;
  }
  const paths = [item.to, ...(item.alsoMatch || [])];
  return paths.some((p) => {
    if (item.end || p === '/') return pathname === p;
    return pathname === p || pathname.startsWith(`${p}/`);
  });
}

/** Нижний таб-бар — заказчик (Lovable v13, как на десктопе) */
export const CUSTOMER_TAB_ITEMS = [
  { to: '/', label: 'Главная', Icon: Home, end: true },
  { to: '/find-master', label: 'Найти мастера', Icon: Hammer },
  { to: '/my-requests', label: 'Заявки', Icon: ClipboardList },
  { to: '/chat', label: 'Чат', Icon: MessageCircle, badgeKey: 'chat' },
  { to: '/deals', label: 'Сделки', Icon: Handshake },
];

/** Нижний tab-bar — мастер (Lovable v13, как на десктопе) */
export const WORKER_TAB_ITEMS = [
  { to: '/worker-home', label: 'Главная', Icon: Home, alsoMatch: ['/jobs'] },
  { to: '/find-work', label: 'Найти работу', Icon: ClipboardList },
  { to: '/my-listings', label: 'Объявления', Icon: LayoutList, alsoMatch: ['/listings'] },
  { to: '/chat', label: 'Чат', Icon: MessageCircle, badgeKey: 'chat' },
  { to: '/deals', label: 'Сделки', Icon: Handshake },
];

/** Десктоп — заказчик */
export const CUSTOMER_DESKTOP_LINKS = [
  { to: '/', label: 'Главная', end: true },
  { to: '/find-master', label: 'Найти мастера' },
  { to: '/my-requests', label: 'Мои заявки и объявления' },
  { to: '/chat', label: 'Сообщения', badgeKey: 'chat' },
  { to: '/deals', label: 'Мои сделки' },
];

/** Десктоп — мастер */
export const WORKER_DESKTOP_LINKS = [
  { to: '/worker-home', label: 'Главная' },
  { to: '/find-work', label: 'Найти работу' },
  { to: '/my-listings', label: 'Объявления', alsoMatch: ['/listings'] },
  { to: '/chat', label: 'Сообщения', badgeKey: 'chat' },
  { to: '/deals', label: 'Мои сделки' },
];
