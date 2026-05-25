import React from 'react';

export function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function IconDeals() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconBriefcase() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

export function IconListings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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
  { to: '/profile', label: 'Профиль', icon: <IconProfile />, alsoMatch: ['/settings', '/favorites'] },
];

/** Нижний таб-бар — мастер */
export const WORKER_TAB_ITEMS = [
  { to: '/worker-home', label: 'Главная', icon: <IconHome />, alsoMatch: ['/jobs'] },
  { to: '/find-work', label: 'Заявки', icon: <IconBriefcase /> },
  { to: '/my-listings', label: 'Объявления', icon: <IconListings />, alsoMatch: ['/listings'] },
  { to: '/chat', label: 'Чат', icon: <IconChat />, badgeKey: 'chat' },
  { to: '/worker-profile', label: 'Профиль', icon: <IconProfile />, alsoMatch: ['/settings', '/deals', '/favorites'] },
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
