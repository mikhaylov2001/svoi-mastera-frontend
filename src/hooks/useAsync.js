import { useState, useCallback } from 'react';

export default function useAsync(asyncFn, immediate = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [value, setValue] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setValue(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  if (immediate && !loading && !value && !error) {
    // не запускаем автоматически, вызов вручную предпочтительнее
  }

  return { execute, loading, error, value };
}
