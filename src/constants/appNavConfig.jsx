import React from 'react';

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function IconHome() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4.5 10.75 12 4.75l7.5 6V19a1.25 1.25 0 0 1-1.25 1.25H5.75A1.25 1.25 0 0 1 4.5 19v-8.25Z" />
      <path d="M9.75 20.25V13.5h4.5v6.75" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4.35-4.35" />
    </svg>
  );
}

export function IconDeals() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M8 6.5h8a1 1 0 0 1 .96.73l1.04 4.02H6l1-4.02A1 1 0 0 1 8 6.5Z" />
      <path d="M6 11.25h12l-1.1 8.25H7.1L6 11.25Z" />
      <path d="M10 15h4" />
    </svg>
  );
}

export function IconChat() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5.25 5.25h13.5A1.25 1.25 0 0 1 20 6.5v7.25a1.25 1.25 0 0 1-1.25 1.25H9.5L6 18.75v-3.75H5.25A1.25 1.25 0 0 1 4 13.75V6.5a1.25 1.25 0 0 1 1.25-1.25Z" />
      <path d="M8.25 10.5h7.5M8.25 13.25h4.5" />
    </svg>
  );
}

export function IconProfile() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.75 19.25c.85-3 3.15-4.75 6.25-4.75s5.4 1.75 6.25 4.75" />
    </svg>
  );
}

export function IconBriefcase() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3.75" y="8.75" width="16.5" height="10.5" rx="2" />
      <path d="M8.75 8.75V7a3.25 3.25 0 0 1 3.25-3.25h0A3.25 3.25 0 0 1 15.25 7v1.75" />
      <path d="M3.75 13.25h16.5" />
    </svg>
  );
}

export function IconListings() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="4.25" y="4.75" width="15.5" height="14.5" rx="2" />
      <path d="M8.25 9.25h7.5M8.25 12.25h7.5M8.25 15.25h5" />
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
