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
    padding: 8px max(var(--catalog-mobile-gutter), env(safe-area-inset-right))
      32px max(var(--catalog-mobile-gutter), env(safe-area-inset-left));
    background: #f5f5f7;
  }

  .mo-orders-root .mo-toolbar {
    margin-bottom: 18px;
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: 12px;
  }

  .mo-orders-root .mo-tabs {
    grid-column: 1;
    width: 100%;
    justify-content: stretch;
    padding: 5px;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  }

  .mo-orders-root .mo-tab {
    flex: 1;
    justify-content: center;
    padding: 11px 10px;
    font-size: 13px;
    border-radius: 12px;
  }

  .mo-orders-root .mo-search {
    grid-column: 1;
    max-width: none;
    min-width: 0;
    flex: none;
    width: 100%;
  }

  .mo-orders-root .mo-search input {
    padding: 14px 16px 14px 44px;
    border-radius: 16px;
    font-size: 15px;
  }

  .mo-orders-root .mo-grid,
  .mo-orders-root .listing-grid {
    gap: 16px;
    margin-top: 4px;
  }

  .mo-orders-root .mo-card {
    border-radius: 28px;
    border: 1px solid #ebe7e2;
    box-shadow: 0 18px 44px rgba(20, 24, 31, .12);
  }

  .mo-orders-root .mo-card:active {
    transform: scale(0.995);
  }

  .mo-orders-root .mo-card-media {
    aspect-ratio: 16 / 9;
    min-height: 0;
  }

  .mo-orders-root .mo-card-status-on-img {
    top: 12px;
    left: 12px;
    font-size: 11px;
    padding: 6px 11px;
    border-radius: 999px;
  }

  .mo-orders-root .mo-card-price-on-img {
    right: 12px;
    bottom: 12px;
    font-size: 12px;
    padding: 7px 12px;
    border-radius: 12px;
  }

  .mo-orders-root .mo-card-content {
    padding: 18px 20px 4px;
    gap: 14px;
  }

  .mo-orders-root .mo-card-headline {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .mo-orders-root .mo-card-title {
    font-size: 17px;
    font-weight: 800;
    line-height: 1.3;
    width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .mo-orders-root .mo-card-time {
    display: none !important;
  }

  .mo-orders-root .mo-card-tags {
    gap: 8px;
  }

  .mo-orders-root .mo-tag {
    font-size: 12px;
    padding: 6px 12px;
    max-width: 100%;
  }

  .mo-orders-root .mo-card-desc {
    font-size: 14px;
    line-height: 1.5;
    -webkit-line-clamp: 3;
  }

  .mo-orders-root .mo-card-hint {
    margin-bottom: 2px;
  }

  .mo-orders-root .mo-card-stats {
    gap: 10px;
    font-size: 12px;
  }

  .mo-orders-root .mo-actions {
    padding: 12px 14px 14px;
    gap: 10px;
  }

  .mo-orders-root .mo-btn {
    min-height: 48px;
    border-radius: 14px;
    font-size: 14px;
  }

  .mo-orders-root .mo-empty {
    border-radius: var(--catalog-mobile-card-radius);
    padding: 40px 20px;
  }

  /* Деталка заявки/объявления в кабинете */
  .ed.ed--listing-detail .ed-listing-meta {
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    gap: 8px 16px !important;
  }

  .ed.ed--listing-detail .ed-col > .ed-card {
    margin-top: 4px;
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
