/** Назад по истории или на fallback без лишних записей в stack. */
export function goBackOr(navigate, fallbackPath) {
  if (typeof window !== 'undefined' && window.history.state?.idx > 0) {
    navigate(-1);
    return;
  }
  navigate(fallbackPath, { replace: true });
}

/** Удалить query-параметры без новой записи в history. */
export function stripSearchParams(setSearchParams, keys) {
  setSearchParams(
    (prev) => {
      const next = new URLSearchParams(prev);
      keys.forEach((key) => next.delete(key));
      return next;
    },
    { replace: true },
  );
}
