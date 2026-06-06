import { createPortal } from 'react-dom';

/** Bottom sheet поиска в категории — рендер в body, чтобы fixed работал на iOS. */
export default function CatalogSearchSheet({ open, onClose, children, ariaLabel = 'Результаты поиска' }) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        className="cat-search-sheet-backdrop"
        aria-label="Закрыть поиск"
        onClick={onClose}
      />
      <div
        className="cat-search-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
