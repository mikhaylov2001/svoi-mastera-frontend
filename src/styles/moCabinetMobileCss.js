/**
 * Мобильная вёрстка «Мои заявки» / «Мои объявления» (≤768px).
 * Паттерн как catalogMobile.css: gutter, hero, контент ниже фона без налезания.
 */
export const moCabinetMobileCss = `
@media (max-width: 768px) {
  :root {
    --catalog-mobile-gutter: 16px;
    --catalog-mobile-card-radius: 20px;
  }

  /* —— Мастер создания: шаги «Раздел» / «Категория» / форма (.nl-page) —— */
  .nl-page {
    overflow-x: hidden;
    background: #f6f6f4;
  }

  .nl-hero {
    padding: 20px 0 28px;
    min-height: var(--page-hero-h-mobile);
  }

  .nl-hero-inner {
    padding: 0 max(var(--catalog-mobile-gutter), env(safe-area-inset-right))
      0 max(var(--catalog-mobile-gutter), env(safe-area-inset-left));
  }

  .nl-stepper {
    margin-top: 12px;
    gap: 6px;
  }

  .nl-step {
    font-size: 11px;
    padding: 5px 10px;
  }

  .nl-h1 {
    font-size: clamp(26px, 7vw, 32px);
    font-weight: 900;
    line-height: 1.15;
    margin: 12px 0 6px;
  }

  .nl-sub {
    font-size: 14px;
    line-height: 1.45;
    margin: 0 0 12px;
  }

  .nl-wrap {
    margin-top: 12px;
    margin-bottom: 0;
    padding: 20px max(var(--catalog-mobile-gutter), env(safe-area-inset-right))
      40px max(var(--catalog-mobile-gutter), env(safe-area-inset-left));
    background: #fff;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.06);
  }

  .nl-grid {
    gap: 14px;
  }

  .nl-page .mlf-sec-grid {
    margin-bottom: 0;
    gap: 10px;
  }

  .nl-page .mlf-sec-card {
    border-radius: var(--catalog-mobile-card-radius);
  }

  .nl-page .mlf-cat-grid {
    gap: 10px;
  }

  .nl-side {
    position: static;
    gap: 12px;
  }

  .nl-side-card {
    border-radius: 18px;
  }

  /* —— Список кабинета: «Мои заявки» / «Мои объявления» (.mo-orders-root) —— */
  .mo-orders-root {
    overflow-x: hidden;
  }

  .mo-orders-root .mo-hero {
    height: var(--page-hero-h-mobile);
  }

  .mo-orders-root .mo-hero-inner {
    align-items: flex-end;
    padding: 0 max(var(--catalog-mobile-gutter), env(safe-area-inset-right))
      20px max(var(--catalog-mobile-gutter), env(safe-area-inset-left));
    gap: 14px;
  }

  .mo-orders-root .mo-hero h1 {
    font-size: clamp(24px, 7vw, 28px);
    line-height: 1.15;
  }

  .mo-orders-root .mo-hero p {
    font-size: 13px;
  }

  .mo-orders-root .mo-cta {
    padding: 12px 20px;
    font-size: 13px;
  }

  .mo-orders-root .mo-main {
    margin-top: 0;
    padding: 20px max(var(--catalog-mobile-gutter), env(safe-area-inset-right))
      28px max(var(--catalog-mobile-gutter), env(safe-area-inset-left));
  }

  .mo-orders-root .mo-toolbar {
    margin-bottom: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .mo-orders-root .mo-tabs {
    width: 100%;
    justify-content: stretch;
  }

  .mo-orders-root .mo-tab {
    flex: 1;
    justify-content: center;
    padding: 10px 10px;
    font-size: 13px;
  }

  .mo-orders-root .mo-search {
    max-width: none;
    min-width: 0;
    flex: none;
    width: 100%;
  }

  .mo-orders-root .mo-grid,
  .mo-orders-root .listing-grid {
    gap: 14px;
  }

  .mo-orders-root .mo-card {
    border-radius: var(--catalog-mobile-card-radius);
  }

  .mo-orders-root .mo-card-media {
    min-height: 160px;
  }
}

@media (max-width: 520px) {
  .nl-page .mlf-sec-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: 152px;
    gap: 8px;
  }

  .nl-page .mlf-sec-featured,
  .nl-page .mlf-sec-5,
  .nl-page .mlf-sec-6 {
    grid-column: span 1;
    grid-row: span 1;
  }
}
`;
