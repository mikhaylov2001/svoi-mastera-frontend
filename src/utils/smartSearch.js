/**
 * «Умный» поиск по тексту объявлений/заявок: слова, подстроки, лёгкая неточность (1–2 опечатки).
 * Один алгоритм для шапки, каталога заказчика и «Найти работу» у мастера.
 */

const STOP = new Set([
  'и', 'в', 'во', 'на', 'по', 'для', 'из', 'к', 'ко', 'с', 'со', 'а', 'но', 'как', 'или',
  'у', 'о', 'об', 'про', 'это', 'то', 'от', 'до', 'при', 'над', 'под', 'же', 'ли', 'бы',
]);

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Слова и цифры (латиница + кириллица) */
export function tokenize(searchText) {
  const n = normalize(searchText);
  return n
    .split(/[^a-zа-яё0-9]+/iu)
    .map((t) => t.replace(/ё/g, 'е'))
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (Math.abs(m - n) > 2) return 99;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) dp[j] = j;
  for (let i = 1; i <= m; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function tokenBestScore(qt, hayTokens, hayNorm) {
  if (!qt || !hayNorm) return 0;
  if (hayNorm.includes(qt)) return 1;

  let best = 0;
  for (const ht of hayTokens) {
    if (!ht) continue;
    if (ht === qt) {
      best = Math.max(best, 0.96);
      continue;
    }
    if (ht.includes(qt) || qt.includes(ht)) {
      best = Math.max(best, 0.88);
      continue;
    }
    const Lmin = Math.min(qt.length, ht.length);
    if (Lmin >= 3 && (ht.startsWith(qt) || qt.startsWith(ht))) {
      best = Math.max(best, 0.78);
      continue;
    }
    if (Lmin >= 4) {
      const d = levenshtein(qt, ht);
      if (d === 1) best = Math.max(best, 0.74);
      else if (d === 2 && Lmin >= 5) best = Math.max(best, 0.58);
    }
  }
  return best;
}

/**
 * @param {string[]} parts — фрагменты текста (заголовок, описание, имя…)
 * @param {string} query — запрос пользователя
 * @returns {null} если запрос слишком короткий; иначе число 0…1 (0 = не подходит)
 */
export function smartTextMatchScore(parts, query) {
  const qRaw = (query || '').trim();
  if (qRaw.length < 2) return null;

  const q = normalize(qRaw);
  const hayNorm = normalize(parts.filter(Boolean).join(' '));
  if (!hayNorm) return 0;

  if (hayNorm.includes(q)) return 1;

  const qTokens = tokenize(qRaw);
  const hayTokens = tokenize(hayNorm);

  if (qTokens.length === 0) {
    const compactQ = q.replace(/\s/g, '');
    const compactH = hayNorm.replace(/\s/g, '');
    return compactH.includes(compactQ) ? 0.82 : 0;
  }

  const perToken = qTokens.map((qt) => tokenBestScore(qt, hayTokens, hayNorm));
  const avg = perToken.reduce((a, b) => a + b, 0) / perToken.length;
  const max = Math.max(...perToken);

  if (max >= 0.72 || avg >= 0.36) {
    return Math.min(1, Math.max(avg, max * 0.92));
  }
  return 0;
}

export function listingHaystack(listing) {
  return [
    listing.title,
    listing.description,
    listing.workerName,
    listing.workerLastName,
    listing.category,
    listing.categoryName,
    listing.city,
    listing.address,
    listing.priceUnit,
  ].filter(Boolean);
}

export function jobRequestHaystack(req) {
  return [
    req.title,
    req.description,
    req.city,
    req.address,
    req.location,
    [req.customerName, req.customerLastName].filter(Boolean).join(' '),
  ].filter(Boolean);
}

/**
 * Отбор и сортировка по релевантности, затем по дате.
 */
export function rankItemsBySmartMatch(items, query, getParts, { limit } = {}) {
  const q = (query || '').trim();
  if (q.length < 2) return items;

  const scored = [];
  for (const item of items) {
    const score = smartTextMatchScore(getParts(item), q);
    if (score !== null && score > 0) {
      scored.push({ item, score });
    }
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.item.createdAt || 0) - new Date(a.item.createdAt || 0);
  });
  const out = scored.map((x) => x.item);
  return limit != null ? out.slice(0, limit) : out;
}

/**
 * Умный поиск + подстрочный fallback, если строгий отбор пуст.
 */
export function searchCatalogItems(items, query, getParts = listingHaystack, { limit } = {}) {
  const q = (query || '').trim();
  if (q.length < 2) return [];

  const pool = (items || []).filter((item) => item?.active !== false);
  const ranked = rankItemsBySmartMatch(pool, q, getParts, { limit });
  if (ranked.length > 0) return ranked;

  const nq = normalize(q);
  const fallback = pool.filter((item) => normalize(getParts(item).join(' ')).includes(nq));
  fallback.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return limit != null ? fallback.slice(0, limit) : fallback;
}
