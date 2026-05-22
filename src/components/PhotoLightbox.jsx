import React, { useCallback, useEffect } from 'react';
import { useSwipeNavigationLightbox } from '../hooks/useSwipeNavigation';

/**
 * Полноэкранный просмотр фото: свайп на мобильном, стрелки и клавиатура на десктопе.
 * @param {{ photos: string[], index: number } | null} lightbox
 * @param {(value: null | { photos: string[], index: number }) => void} setLightbox
 * @param {string} [alt]
 */
export default function PhotoLightbox({ lightbox, setLightbox, alt = '' }) {
  const photos = lightbox?.photos;
  const index = lightbox?.index ?? 0;
  const count = photos?.length ?? 0;
  const multi = count > 1;

  const goPrev = useCallback(() => {
    setLightbox((l) => {
      if (!l?.photos?.length) return l;
      const n = l.photos.length;
      return { ...l, index: l.index > 0 ? l.index - 1 : n - 1 };
    });
  }, [setLightbox]);

  const goNext = useCallback(() => {
    setLightbox((l) => {
      if (!l?.photos?.length) return l;
      const n = l.photos.length;
      return { ...l, index: l.index < n - 1 ? l.index + 1 : 0 };
    });
  }, [setLightbox]);

  const goTo = useCallback(
    (i) => {
      setLightbox((l) => (l ? { ...l, index: i } : l));
    },
    [setLightbox],
  );

  const close = useCallback(() => setLightbox(null), [setLightbox]);

  const swipe = useSwipeNavigationLightbox(goPrev, goNext, !!lightbox && multi);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && multi) goNext();
      if (e.key === 'ArrowLeft' && multi) goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, multi, close, goNext, goPrev]);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  if (!photos?.length) return null;

  return (
    <div
      className="jd-lightbox"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фотографий"
    >
      <button
        type="button"
        className="jd-lb-close"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Закрыть"
      >
        ✕
      </button>

      {multi && (
        <>
          <button
            type="button"
            className="jd-lb-nav jd-lb-prev"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Предыдущее фото"
          >
            ‹
          </button>
          <button
            type="button"
            className="jd-lb-nav jd-lb-next"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Следующее фото"
          >
            ›
          </button>
        </>
      )}

      <div
        className={`jd-lightbox-img-wrap ${swipe.className}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={swipe.onPointerDown}
        onPointerUp={swipe.onPointerUp}
        onPointerCancel={swipe.onPointerCancel}
        style={swipe.style}
      >
        {multi && (
          <>
            <div className="jd-lb-zone jd-lb-zone-prev" onClick={goPrev} role="presentation" />
            <div className="jd-lb-zone jd-lb-zone-next" onClick={goNext} role="presentation" />
          </>
        )}
        <img
          src={photos[index]}
          alt={alt}
          draggable={false}
          onClick={() => !multi && close()}
        />
      </div>

      {multi && (
        <div className="jd-lb-footer" onClick={(e) => e.stopPropagation()}>
          <div className="jd-lb-dots" role="tablist" aria-label="Фотографии">
            {photos.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Фото ${i + 1}`}
                className={`jd-lb-dot${i === index ? ' on' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <div className="jd-lb-toolbar">
            <button type="button" className="jd-lb-toolbar-btn" onClick={goPrev} aria-label="Назад">
              ‹
            </button>
            <span className="jd-lb-counter">
              {index + 1} / {count}
            </span>
            <button type="button" className="jd-lb-toolbar-btn" onClick={goNext} aria-label="Вперёд">
              ›
            </button>
          </div>
          <p className="jd-lb-hint jd-lb-hint--touch">Свайпните влево или вправо</p>
          <p className="jd-lb-hint jd-lb-hint--desktop">← → или клик по краям · Esc — закрыть</p>
        </div>
      )}

      {!multi && (
        <p className="jd-lb-hint jd-lb-hint--solo">Нажмите снаружи или Esc — закрыть</p>
      )}
    </div>
  );
}
