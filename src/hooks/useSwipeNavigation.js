import { useRef, useCallback } from 'react';

const SWIPE_MIN_PX = 44;

/**
 * Горизонтальный свайп / перетаскивание (touch + мышь) для листания фото.
 * После свайпа блокирует клик, чтобы не открывался лайтбокс.
 */
export function useSwipeNavigation(onPrev, onNext, enabled = true) {
  const startRef = useRef(null);
  const didSwipeRef = useRef(false);

  const onPointerDown = useCallback(
    (e) => {
      if (!enabled) return;
      if (e.button !== undefined && e.button !== 0) return;
      didSwipeRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [enabled],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (!enabled || !startRef.current || startRef.current.id !== e.pointerId) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      startRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (Math.abs(dx) < SWIPE_MIN_PX) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) return;
      didSwipeRef.current = true;
      if (dx > 0) onPrev?.();
      else onNext?.();
    },
    [enabled, onPrev, onNext],
  );

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  const onClickCapture = useCallback((e) => {
    if (didSwipeRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didSwipeRef.current = false;
    }
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
    className: 'ed-swipeable',
    style: { touchAction: 'pan-y' },
  };
}

/** Для полноэкранного лайтбокса — без вертикального скролла страницы под жестом. */
export function useSwipeNavigationLightbox(onPrev, onNext, enabled = true) {
  const props = useSwipeNavigation(onPrev, onNext, enabled);
  return { ...props, style: { touchAction: 'none' } };
}
