/** Строка для JSX — никогда не возвращает объект. */
export function safeText(value, fallback = '') {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (typeof value.name === 'string' && value.name.trim()) return value.name.trim();
    if (typeof value.label === 'string' && value.label.trim()) return value.label.trim();
  }
  return fallback;
}

/** Первая буква для аватара-заглушки. */
export function initialChar(value, fallback = '?') {
  const text = safeText(value, fallback);
  const ch = text.charAt(0);
  return ch ? ch.toUpperCase() : fallback;
}
