export const catalogCatFeedMobileCss = `
@media (max-width: 768px) {
  :root {
    /* Боковой отступ как на макете (~12–16px), без двойного padding у .ed */
    --catalog-mobile-gutter: 16px;
    --catalog-mobile-card-radius: 24px;
  }
  /* ── Лента категории: общая страница ── */
  .jl-page.fw-jl-cat-feed {
    padding-top: 0;
    padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
    background: #f2f2f2;
    overflow-x: hidden;
    font-family: Manrope, system-ui, sans-serif;
  }

  .jl-page.fw-jl-cat-feed .jl-wrap {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 16px max(var(--catalog-mobile-gutter), env(safe-area-inset-right)) 20px
      max(var(--catalog-mobile-gutter), env(safe-area-inset-left)) !important;
    box-sizing: border-box;
  }

  /* Крошки — полоса на всю ширину экрана (как поиск) */
  .jl-page.fw-jl-cat-feed .jl-crumbs.jl-crumbs--full {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 6px;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 14px max(var(--catalog-mobile-gutter), env(safe-area-inset-right)) 14px
      max(var(--catalog-mobile-gutter), env(safe-area-inset-left));
    box-sizing: border-box;
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    font-size: 13px;
    line-height: 1.35;
    color: #9ca3af;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .jl-page.fw-jl-cat-feed .jl-crumbs.jl-crumbs--full::-webkit-scrollbar {
    display: none;
  }

  .jl-page.fw-jl-cat-feed .jl-layout,
  .jl-page.fw-jl-cat-feed .jl-layout > main,
  .jl-page.fw-jl-cat-feed .jl-list.jl-feed-list {
    width: 100%;
    max-width: 100%;
  }

  /* Поиск: на всю ширину экрана, кнопка под полем */
  .jl-page.fw-jl-cat-feed .fmp-topbar,
  .jl-page.fw-jl-cat-feed .fw2-topbar {
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    padding: 0;
    position: relative;
    z-index: 1600;
  }

  .jl-page.fw-jl-cat-feed .fmp-topbar-inner,
  .jl-page.fw-jl-cat-feed .fw2-topbar-inner {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 10px !important;
    padding: 14px max(var(--catalog-mobile-gutter), env(safe-area-inset-right)) 14px
      max(var(--catalog-mobile-gutter), env(safe-area-inset-left)) !important;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  .jl-page.fw-jl-cat-feed .fmp-search-dd-wrap,
  .jl-page.fw-jl-cat-feed .fw2-search-dd-wrap {
    width: 100% !important;
    flex: none !important;
    min-width: 0;
  }

  .jl-page.fw-jl-cat-feed .fmp-search-wrap,
  .jl-page.fw-jl-cat-feed .fw2-search-wrap {
    width: 100%;
    box-sizing: border-box;
    border-radius: 14px;
    padding: 0 14px;
    min-height: 52px;
    border-width: 1.5px;
  }

  .jl-page.fw-jl-cat-feed .fmp-search-wrap input,
  .jl-page.fw-jl-cat-feed .fw2-search-wrap input {
    padding: 14px 0;
    font-size: 16px;
    width: 100%;
  }

  .jl-page.fw-jl-cat-feed .fmp-topbar-btn,
  .jl-page.fw-jl-cat-feed .fw2-topbar-btn {
    width: 100% !important;
    min-width: 0 !important;
    flex-shrink: 0;
    min-height: 52px;
    padding: 0 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 800;
    background: #e8410a;
    color: #fff;
    border: none;
    box-shadow: 0 4px 14px rgba(232, 65, 10, 0.28);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .jl-page.fw-jl-cat-feed .cat-feed-search-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 1500;
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
  }

  .jl-page.fw-jl-cat-feed .fmp-search-dropdown,
  .jl-page.fw-jl-cat-feed .fw2-search-dropdown {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    bottom: 0 !important;
    max-height: min(72vh, calc(100dvh - 120px)) !important;
    border-radius: 20px 20px 0 0 !important;
    border-left: none !important;
    border-right: none !important;
    z-index: 1700 !important;
    box-shadow: 0 -12px 40px rgba(15, 23, 42, 0.18) !important;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* Сначала фильтры, потом лента (как в макете) */
  .jl-page.fw-jl-cat-feed .jl-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .jl-page.fw-jl-cat-feed .jl-layout > aside,
  .jl-page.fw-jl-cat-feed .jl-side {
    order: 1;
    position: static;
    top: auto;
    width: 100%;
    min-width: 0;
    gap: 16px;
  }

  .jl-page.fw-jl-cat-feed .jl-layout > main {
    order: 2;
    width: 100%;
    min-width: 0;
  }

  .jl-page.fw-jl-cat-feed .jl-side-card {
    width: 100%;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--catalog-mobile-card-radius);
    padding: 20px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07);
  }

  .jl-page.fw-jl-cat-feed .jl-side-title {
    font-size: 16px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 14px;
  }

  .jl-page.fw-jl-cat-feed .jl-side-row {
    gap: 10px;
  }

  .jl-page.fw-jl-cat-feed .jl-side-field label {
    font-size: 11px;
    color: #9ca3af;
    margin-bottom: 6px;
  }

  .jl-page.fw-jl-cat-feed .jl-side-field input {
    border-radius: 12px;
    min-height: 48px;
    font-size: 16px;
    padding: 12px 14px;
    background: #fff;
    border-width: 1.5px;
  }

  .jl-page.fw-jl-cat-feed .jl-rating-opts {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .jl-page.fw-jl-cat-feed .jl-side-card .jl-rating-opt {
    width: 100%;
    min-height: 52px;
    margin-top: 0;
    border-radius: 14px;
    justify-content: flex-start;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 700;
    border-width: 1.5px;
  }

  .jl-page.fw-jl-cat-feed .jl-side-card .jl-rating-opt .stars {
    font-size: 16px;
  }

  .jl-page.fw-jl-cat-feed .jl-side-card .jl-rating-opt.is-active {
    border-color: #e8410a;
    background: #fff;
    color: #e8410a;
    box-shadow: 0 0 0 1px #e8410a;
  }

  .jl-page.fw-jl-cat-feed .jl-chip.is-active {
    background: #e8410a;
    border-color: #e8410a;
    color: #fff;
  }

  .jl-page.fw-jl-cat-feed .jl-check,
  .jl-page.fw-jl-cat-feed .jl-side-check,
  .jl-page.fw-jl-cat-feed .jl-side-card .fmp-check-item {
    min-height: 44px;
    font-size: 14px;
  }

  .jl-page.fw-jl-cat-feed .jl-side-card .fmp-check-box.on {
    background: #e8410a;
    border-color: #e8410a;
  }

  .jl-page.fw-jl-cat-feed .jl-cat-cover {
    aspect-ratio: 16 / 10;
    min-height: 200px;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.1);
  }

  .jl-page.fw-jl-cat-feed .jl-cat-cover::after {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.78) 0%,
      rgba(0, 0, 0, 0.25) 45%,
      transparent 70%
    );
  }

  .jl-page.fw-jl-cat-feed .jl-cat-cover-body {
    left: 18px;
    right: 18px;
    bottom: 18px;
  }

  .jl-page.fw-jl-cat-feed .jl-cat-cover-title {
    font-size: 26px;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -0.03em;
  }

  .jl-page.fw-jl-cat-feed .jl-cat-cover-back {
    font-size: 14px;
    margin-top: 8px;
    font-weight: 600;
  }

  .jl-page.fw-jl-cat-feed .jl-crumbs a,
  .jl-page.fw-jl-cat-feed .jl-crumbs .jl-crumbs-link,
  .jl-page.fw-jl-cat-feed .jl-crumbs.jl-crumbs--full a,
  .jl-page.fw-jl-cat-feed .jl-crumbs.jl-crumbs--full .jl-crumbs-link {
    color: #9ca3af;
    font-weight: 500;
    flex-shrink: 0;
    text-decoration: none;
  }

  .jl-page.fw-jl-cat-feed .jl-crumbs .cur,
  .jl-page.fw-jl-cat-feed .jl-crumbs.jl-crumbs--full .cur {
    font-weight: 700;
    color: #111827;
    flex-shrink: 0;
  }

  .jl-page.fw-jl-cat-feed .jl-crumbs .sep,
  .jl-page.fw-jl-cat-feed .jl-crumbs.jl-crumbs--full .sep {
    color: #d1d5db;
    flex-shrink: 0;
    font-size: 11px;
  }

  .jl-page.fw-jl-cat-feed .jl-crumbs > span:not(.sep):not(.cur),
  .jl-page.fw-jl-cat-feed .jl-crumbs.jl-crumbs--full > span:not(.sep):not(.cur) {
    color: #9ca3af;
    font-weight: 500;
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* Сортировка — компактные чипы в одну линию */
  .jl-page.fw-jl-cat-feed .jl-toolbar {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: 6px;
    padding-bottom: 4px;
    margin-bottom: 12px;
    align-items: center;
  }

  .jl-page.fw-jl-cat-feed .jl-toolbar::-webkit-scrollbar {
    display: none;
  }

  .jl-page.fw-jl-cat-feed .jl-toolbar-label {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
  }

  .jl-page.fw-jl-cat-feed .jl-toolbar-count {
    display: none;
  }

  .jl-page.fw-jl-cat-feed .jl-chip {
    flex-shrink: 0;
    padding: 7px 12px;
    min-height: 0;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    border-radius: 999px;
    border-width: 1px;
    line-height: 1.2;
  }

  .jl-page.fw-jl-cat-feed .jl-chip.is-active {
    box-shadow: none;
  }

  .jl-page.fw-jl-cat-feed .jl-list.jl-feed-list {
    gap: 16px;
    width: 100%;
  }

  /* Карточка объявления / заявки (Base44) — почти на всю ширину */
  .jl-page.fw-jl-cat-feed .jl-bigcard {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border-radius: var(--catalog-mobile-card-radius);
    border-color: #e5e7eb;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07);
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard::before {
    display: none;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard:hover {
    transform: none;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07);
    border-color: #e5e7eb;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-cover {
    aspect-ratio: 16 / 9;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard:hover .jl-bigcard-cover img {
    transform: none;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-status {
    top: 12px;
    left: 12px;
    background: #e8410a;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 10px;
    letter-spacing: 0.5px;
    box-shadow: none;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-urgent {
    top: 12px;
    left: auto;
    right: 52px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-photo-cnt {
    bottom: 10px;
    left: 12px;
    border-radius: 999px;
    font-size: 11px;
    padding: 4px 9px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-thumbs {
    display: none;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-body {
    padding: 16px;
    min-width: 0;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-author {
    margin-bottom: 12px;
    min-width: 0;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-author .jl-author-ava,
  .jl-page.fw-jl-cat-feed .jl-bigcard-author .jl-author-ava img {
    width: 40px;
    height: 40px;
    font-size: 15px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-author-name {
    font-size: 15px;
    font-weight: 800;
    color: #111827;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-author-meta {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 6px;
    margin-top: 2px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-author-meta .dot {
    display: inline;
    color: #d1d5db;
    font-size: 12px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-author-meta .ok {
    font-size: 12px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-author-meta > span:not(.ok):not(.dot) {
    font-size: 12px;
    color: #9ca3af;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-chevron {
    font-size: 22px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-title {
    font-size: 17px;
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: -0.02em;
    margin: 0 0 6px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-sub {
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .jl-page.fw-jl-cat-feed .jl-tags {
    gap: 6px;
    margin-bottom: 10px;
  }

  .jl-page.fw-jl-cat-feed .jl-tag {
    font-size: 11px;
    padding: 4px 9px;
  }

  .jl-page.fw-jl-cat-feed .jl-tag.green {
    background: #ecfdf5;
    color: #059669;
    border-color: #a7f3d0;
  }

  .jl-page.fw-jl-cat-feed .jl-rating-line {
    font-size: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-price-row {
    flex-direction: row;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px 8px;
    padding-top: 14px;
    margin-top: 4px;
    border-top: 1px solid #f1f1f1;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-price {
    font-size: 22px;
    font-weight: 900;
    color: #e8410a !important;
    letter-spacing: -0.5px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-price-hint {
    font-size: 13px;
    color: #9ca3af;
    font-weight: 500;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-price-muted {
    font-size: 20px;
    color: #6b7280;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-actions {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap;
    gap: 8px;
    margin-top: 12px;
    width: 100%;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-btn {
    flex: 1 1 0;
    min-width: 0;
    min-height: 48px;
    padding: 12px 10px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 800;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-btn.primary {
    box-shadow: 0 4px 14px rgba(232, 65, 10, 0.32);
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-btn.primary:hover {
    transform: none;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard-btn.ghost {
    border-color: #e5e7eb;
    color: #111827;
    font-weight: 700;
  }

  /* Пендинг / fmp-footer внутри карточки */
  .jl-page.fw-jl-cat-feed .jl-bigcard .fmp-card-footer-pending,
  .jl-page.fw-jl-cat-feed .jl-bigcard .fmp-card-footer {
    padding: 14px 0 0;
    margin-top: 4px;
    border-top: 1px solid #f1f1f1;
    background: transparent;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard .fmp-card-price {
    font-size: 22px;
    color: #e8410a;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard .fmp-card-actions {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap;
    gap: 8px;
    width: 100%;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard .fmp-btn-accept,
  .jl-page.fw-jl-cat-feed .jl-bigcard .fmp-btn-msg {
    flex: 1 1 0;
    min-width: 0;
    width: auto !important;
    min-height: 48px;
    border-radius: 14px;
    font-size: 15px;
  }

  .jl-page.fw-jl-cat-feed .jl-bigcard .fmp-card-action-err {
    flex-basis: 100%;
    margin-top: 8px;
  }
}
`;
