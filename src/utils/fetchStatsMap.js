/** Параллельная загрузка stats по id (мастер/заказчик), с лимитом и проглатыванием ошибок. */
export async function fetchStatsMap(ids, fetcher, { limit = 24 } = {}) {
  const unique = [...new Set(ids.filter((id) => id != null && String(id).trim() !== ''))];
  const pairs = await Promise.all(
    unique.slice(0, limit).map(async (id) => {
      try {
        const st = await fetcher(id);
        return [String(id), st];
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(pairs.filter(Boolean));
}
