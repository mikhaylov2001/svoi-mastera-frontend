const FEED_AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#e8410a,#ff7043)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0ea5e9,#22d3ee)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
];

const FEED_NAMES = [
  'Мария',
  'Ольга',
  'Сергей',
  'Андрей',
  'Елена',
  'Дмитрий',
  'Анна',
  'Игорь',
  'Наталья',
  'Павел',
  'Екатерина',
  'Виктор',
  'Татьяна',
  'Алексей',
  'Юлия',
  'Максим',
];

const FEED_SERVICES = [
  'Установка двери',
  'Генеральная уборка',
  'Электромонтаж',
  'Замена смесителя',
  'Ремонт ноутбука',
  'Переезд',
  'Поклейка обоев',
  'Маникюр',
  'Установка кондиционера',
  'Сборка мебели',
  'Ремонт стиральной машины',
  'Покраска стен',
  'Укладка плитки',
  'Настройка Wi‑Fi',
  'Стрижка и укладка',
  'Мелкий ремонт',
  'Чистка канализации',
  'Установка розеток',
];

const FEED_ACTIONS = [
  (svc) => `ищет мастера «${svc}»`,
  (svc) => `опубликовала «${svc}»`,
  (svc) => `добавила объявление «${svc}»`,
  () => 'приняла отклик на заявку',
  () => 'откликнулась на заявку',
  () => 'завершила сделку',
  (svc) => `обновила заявку «${svc}»`,
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Случайное «давнее» время для ленты — проект ещё небольшой, без минутной активности. */
export function randomFeedTimeMinutes() {
  const roll = Math.random();
  if (roll < 0.4) return randomInt(25, 95);
  if (roll < 0.75) return randomInt(96, 360);
  if (roll < 0.92) return randomInt(361, 720);
  return randomInt(721, 1440);
}

/** Короткая подпись времени в hero (как на макете: «45 мин», «3 ч»). */
export function formatFeedTimeMinutes(totalMinutes) {
  const m = Math.max(1, Math.round(totalMinutes));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  const days = Math.floor(h / 24);
  return `${days} дн`;
}

/** Для реальных событий — не показываем «1 мин», смещаем вправо. */
export function feedTimeFromCreatedAt(createdAt) {
  const actual = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000) : 0;
  const inflated = Math.max(randomFeedTimeMinutes(), actual + randomInt(30, 120));
  return formatFeedTimeMinutes(inflated);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Случайная демо-лента из пула имён и услуг. */
export function buildRandomPlatformFeed(count = 14) {
  const target = Math.max(8, count);
  const items = [];
  const used = new Set();

  while (items.length < target) {
    const who = FEED_NAMES[randomInt(0, FEED_NAMES.length - 1)];
    const service = FEED_SERVICES[randomInt(0, FEED_SERVICES.length - 1)];
    const action = FEED_ACTIONS[randomInt(0, FEED_ACTIONS.length - 1)];
    const what = action(service);
    const sig = `${who}|${what}`;
    if (used.has(sig)) continue;
    used.add(sig);

    items.push({
      key: `rnd-${items.length}-${sig.slice(0, 12)}`,
      who,
      what,
      time: formatFeedTimeMinutes(randomFeedTimeMinutes()),
      color: FEED_AVATAR_GRADIENTS[items.length % FEED_AVATAR_GRADIENTS.length],
    });
  }

  return items;
}

function buildPlatformFeedFromOpenRequests(openRequests) {
  const sorted = [...(Array.isArray(openRequests) ? openRequests : [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
  return sorted.slice(0, 24).map((req, idx) => {
    const full = [req.customerName, req.customerLastName].filter(Boolean).join(' ').trim();
    const who = full.split(/\s+/)[0] || 'Заказчик';
    const title = (req.title || 'Заявка').trim();
    const short = title.length > 44 ? `${title.slice(0, 42)}…` : title;
    return {
      key: String(req.id ?? `req-${idx}`),
      who,
      what: `ищет мастера «${short}»`,
      time: feedTimeFromCreatedAt(req.createdAt),
      color: FEED_AVATAR_GRADIENTS[idx % FEED_AVATAR_GRADIENTS.length],
    };
  });
}

/** Цикл ленты: реальные заявки + случайные события для ротации. */
export function resolvePlatformFeedCycle(openRequests) {
  const randomPool = buildRandomPlatformFeed(14);
  const fromApi = buildPlatformFeedFromOpenRequests(openRequests);

  if (fromApi.length === 0) return randomPool;

  const merged = shuffle([...fromApi, ...randomPool]);
  return merged.length >= 8 ? merged : [...merged, ...buildRandomPlatformFeed(8 - merged.length)];
}

export function visiblePlatformFeedRows(feedCycle, feedIdx) {
  const cycle = Array.isArray(feedCycle) && feedCycle.length > 0 ? feedCycle : buildRandomPlatformFeed(8);
  const n = cycle.length;
  return [0, 1, 2].map((k) => {
    const row = cycle[(feedIdx + k) % n] || cycle[k % n];
    const key = row.key ?? `feed-${k}`;
    return { ...row, _k: `${key}-${k}` };
  });
}
