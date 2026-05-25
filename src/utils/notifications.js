export const NOTIF_ICONS = {
  NEW_OFFER: '📩',
  OFFER_ACCEPTED: '🎉',
  DEAL_CONFIRMED: '✅',
  DEAL_COMPLETED: '🏆',
  NEW_MESSAGE: '💬',
  DEAL_NEW: '🔔',
  DEAL_STARTED: '🚀',
  DEAL_CANCELLED: '❌',
};

export const NOTIF_TONES = {
  NEW_OFFER: 'blue',
  OFFER_ACCEPTED: 'green',
  DEAL_CONFIRMED: 'green',
  DEAL_COMPLETED: 'amber',
  NEW_MESSAGE: 'violet',
  DEAL_NEW: 'orange',
  DEAL_STARTED: 'orange',
  DEAL_CANCELLED: 'rose',
};

export function isNotificationUnread(n) {
  if (!n) return false;
  return !(n.isRead === true || n.read === true);
}

export function notificationIcon(type) {
  return NOTIF_ICONS[type] || '🔔';
}

export function notificationTone(type) {
  return NOTIF_TONES[type] || 'neutral';
}

export function formatNotifTimeAgo(d) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  if (Number.isNaN(ms)) return '';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.floor(h / 24)} дн`;
}

export function notifCountLabel(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n1 === 1 && n !== 11) return `${count} новое`;
  if (n1 >= 2 && n1 <= 4 && (n < 12 || n > 14)) return `${count} новых`;
  return `${count} новых`;
}

export function normalizeNotificationBody(body) {
  if (!body) return '';
  return String(body)
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveNotificationLink(link) {
  if (!link || typeof link !== 'string') return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function countUnreadNotifications(list) {
  if (!Array.isArray(list)) return 0;
  return list.filter(isNotificationUnread).length;
}
