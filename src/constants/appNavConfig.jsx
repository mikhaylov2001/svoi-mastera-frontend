import React from 'react';

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function IconHome() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4.5 10.5 12 4l7.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19v-8.5Z" />
      <path d="M9.5 20.5V13h5v7.5" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

export function IconDeals() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M8 7h8l1.5 3H6.5L8 7Z" />
      <path d="M6.5 10h11l-1 9h-9l-1-9Z" />
      <path d="M10 14h4" />
    </svg>
  );
}

export function IconChat() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5.5 5.5h13A1.5 1.5 0 0 1 20 7v7.5a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3.5H5.5A1.5 1.5 0 0 1 4 14.5V7a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.5 10.5h7M8.5 13h4.5" />
    </svg>
  );
}

export function IconProfile() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M6.5 19.5c.8-2.8 3-4.5 5.5-4.5s4.7 1.7 5.5 4.5" />
    </svg>
  );
}

export function IconBriefcase() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="8.5" width="17" height="11" rx="2" />
      <path d="M8.5 8.5V7a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1.5" />
      <path d="M3.5 13h17" />
    </svg>
  );
}

export function IconListings() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9.5h8M8 13h8M8 16.5h5" />
      <circle cx="17.5" cy="7.5" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Счёт совпадения path с пунктом навигации (выше = точнее). */
function navPathMatchScore(pathname, item, path) {
  if (item.end || path === '/') {
    return pathname === path ? 10000 + path.length : -1;
  }
  if (pathname === path) {
    // Точное совпадение; приоритет у основного `to`, не alsoMatch
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

/** Нижний таб-бар — заказчик */
export const CUSTOMER_TAB_ITEMS = [
  { to: '/', label: 'Главная', icon: <IconHome />, end: true },
  { to: '/find-master', label: 'Мастера', icon: <IconSearch /> },
  { to: '/deals', label: 'Сделки', icon: <IconDeals />, alsoMatch: ['/my-requests'] },
  { to: '/chat', label: 'Чат', icon: <IconChat />, badgeKey: 'chat' },
  { to: '/profile', label: 'Профиль', icon: <IconProfile />, alsoMatch: ['/settings'] },
];

/** Нижний таб-бар — мастер */
export const WORKER_TAB_ITEMS = [
  { to: '/worker-home', label: 'Главная', icon: <IconHome />, alsoMatch: ['/jobs'] },
  { to: '/find-work', label: 'Заявки', icon: <IconBriefcase /> },
  { to: '/my-listings', label: 'Объявления', icon: <IconListings />, alsoMatch: ['/listings'] },
  { to: '/chat', label: 'Чат', icon: <IconChat />, badgeKey: 'chat' },
  { to: '/worker-profile', label: 'Профиль', icon: <IconProfile />, alsoMatch: ['/settings', '/deals'] },
];

/** Десктоп — заказчик */
export const CUSTOMER_DESKTOP_LINKS = [
  { to: '/', label: 'Главная', end: true },
  { to: '/find-master', label: 'Найти мастера' },
  { to: '/my-requests', label: 'Заявки' },
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
