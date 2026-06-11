/** Мобилка детали объявления/заявки — после inline <style>, перебивает dealsDetailEdCss */
export const listingDetailMobileCss = `
@media (max-width: 768px) {
  :root {
    /* Боковой отступ как на макете (~12–16px), без двойного padding у .ed */
    --catalog-mobile-gutter: 16px;
    --catalog-mobile-card-radius: 24px;
  }
  .ed.ed--listing-detail {
    font-family: Manrope, system-ui, sans-serif;
    background: #f5f5f5 !important;
    padding: 0 !important;
    min-height: 100vh;
  }

  .ed.ed--listing-detail .ed-card {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: var(--catalog-mobile-card-radius) !important;
    border: 1px solid #e5e7eb !important;
    padding: 20px 24px !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07) !important;
  }

  .ed.ed--listing-detail .ed-col {
    width: 100%;
    max-width: 100%;
    gap: 12px;
  }

  .ed.ed--listing-detail .ed-section-title {
    font-size: 16px !important;
    font-weight: 700 !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    color: #111 !important;
    margin-bottom: 12px !important;
  }

  .ed.ed--listing-detail .ed-eyebrow,
  .ed.ed--listing-detail .ed-eyebrow--block {
    font-size: 12px !important;
    font-weight: 600 !important;
    letter-spacing: 0.05em !important;
    text-transform: uppercase !important;
    color: #9ca3af !important;
  }

  .ed.ed--listing-detail .ed-price-num {
    font-size: 32px !important;
    font-weight: 900 !important;
    color: #111827 !important;
    margin-top: 4px !important;
  }

  .ed.ed--listing-detail .ed-price-unit {
    font-size: 16px !important;
    font-weight: 600 !important;
    color: #9ca3af !important;
    margin-left: 6px !important;
  }

  .ed.ed--listing-detail .ed-price-sub {
    font-size: 14px !important;
    margin: 10px 0 16px !important;
    color: #6b7280 !important;
  }

  .ed.ed--listing-detail .ed-btn-confirm {
    background: #e8410a !important;
    color: #fff !important;
    min-height: 52px !important;
    border-radius: 14px !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    border: none !important;
    box-shadow: 0 4px 14px rgba(232, 65, 10, 0.32) !important;
  }

  .ed.ed--listing-detail .ed-msg-btn,
  .ed.ed--listing-detail .ed-actions .ed-msg-btn,
  .ed.ed--listing-detail .ed-btn-ghost {
    background: #fff !important;
    color: #111827 !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: none !important;
    min-height: 52px !important;
    border-radius: 14px !important;
    font-size: 16px !important;
    font-weight: 800 !important;
  }

  .ed.ed--listing-detail .ed-msg-btn:hover,
  .ed.ed--listing-detail .ed-msg-btn:visited,
  .ed.ed--listing-detail .ed-msg-btn:active {
    background: #fff !important;
    color: #111827 !important;
  }

  .ed.ed--listing-detail .ed-ava {
    border-radius: 50% !important;
    width: 48px !important;
    height: 48px !important;
  }

  .jl-page.fw-jl-cat-feed .jl-side-card .jl-side-title {
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
    color: #9ca3af !important;
    margin-bottom: 12px !important;
  }

  .ed.ed--listing-detail .ed-wrap {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 12px 16px calc(24px + env(safe-area-inset-bottom, 0px)) 16px;
    box-sizing: border-box;
  }

  /* Галерея и карточки на всю ширину колонки */
  .ed.ed--listing-detail .ed-gallery {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--catalog-mobile-card-radius);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07);
    margin-bottom: 12px;
    padding: 0 !important;
  }

  .ed.ed--listing-detail .ed-gallery .ed-main {
    border-radius: 0;
  }

  .ed.ed--listing-detail .ed-floats {
    display: none !important;
  }

  .ed.ed--listing-detail .ed-thumbs {
    display: flex !important;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
    padding: 10px 12px 12px;
    scrollbar-width: none;
  }

  .ed.ed--listing-detail .ed-thumbs::-webkit-scrollbar {
    display: none;
  }

  .ed.ed--listing-detail .ed-thumb {
    flex: 0 0 72px;
    width: 72px;
    max-width: 72px;
    aspect-ratio: 1;
    border-radius: 10px;
    opacity: 0.65;
  }

  .ed.ed--listing-detail .ed-thumb.on {
    opacity: 1;
  }

  .ed.ed--listing-detail .ed-arrow {
    width: 40px;
    height: 40px;
  }

  .ed.ed--listing-detail .ed-head {
    margin-bottom: 16px;
  }

  .ed.ed--listing-detail .ed-head-right .ed-status-pill {
    display: none;
  }

  .ed.ed--listing-detail .ed-listing-meta {
    font-size: 14px;
    color: #6b7280;
    margin-top: 12px;
  }

  .ed.ed--listing-detail .ed-cust-arrow {
    display: none;
  }

  .ed.ed--listing-detail .ed-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 20px;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .ed.ed--listing-detail .ed-head h1,
  .ed.ed--listing-detail .ed-head .ed-title {
    font-size: 22px;
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .ed.ed--listing-detail .ed-listing-meta {
    font-size: 13px;
    gap: 8px 14px;
  }

  .ed.ed--listing-detail .ed-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .ed.ed--listing-detail .ed-side > .ed-card {
    border-radius: var(--catalog-mobile-card-radius) !important;
    width: 100%;
  }

  .ed.ed--listing-detail .ed-col {
    order: 1;
  }

  .ed.ed--listing-detail .ed-side {
    order: 2;
    gap: 12px;
  }

  .ed.ed--listing-detail .ed-gallery .ed-main {
    border-radius: 0 !important;
    overflow: hidden;
    width: 100% !important;
  }

  .ed.ed--listing-detail .ed-cust-row,
  .ed.ed--listing-detail .ed-side .ed-cust-row {
    cursor: pointer;
  }

  .ed.ed--listing-detail .ed-similar-head {
    margin-top: 4px;
  }

  .ed.ed--listing-detail .ed-head-right .ed-status-pill {
    display: none;
  }

  .ed.ed--listing-detail .ed-head {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .ed.ed--listing-detail .ed-head-right {
    justify-content: flex-start;
  }

  /* Макет как в Base44: заголовок → фото → карточки */
  .ed.ed--listing-detail .ed-wrap {
    display: flex !important;
    flex-direction: column !important;
    padding: 16px 16px calc(36px + env(safe-area-inset-bottom, 0px)) !important;
    gap: 0 !important;
  }

  .ed.ed--listing-detail .ed-head {
    position: relative !important;
    display: block !important;
    margin: 0 0 16px !important;
    padding: 0 !important;
  }

  .ed.ed--listing-detail .ed-head-left {
    display: block !important;
    width: 100% !important;
    padding-right: 44px !important;
  }

  .ed.ed--listing-detail .ed-head-left > div:first-child {
    display: block !important;
  }

  .ed.ed--listing-detail .ed-head h1,
  .ed.ed--listing-detail .ed-head .ed-title {
    font-size: 24px !important;
    font-weight: 800 !important;
    line-height: 1.25 !important;
    letter-spacing: -0.03em !important;
    color: #1a1a2e !important;
    margin: 0 !important;
  }

  .ed.ed--listing-detail .ed-head-right {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .ed.ed--listing-detail .ed-listing-meta {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    gap: 8px 14px !important;
    margin-top: 10px !important;
    font-size: 14px !important;
    color: #6b7280 !important;
  }

  .ed.ed--listing-detail .ed-listing-meta span {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
  }

  .ed.ed--listing-detail .ed-back {
    margin-bottom: 20px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #6b7280 !important;
  }

  .ed.ed--listing-detail .ed-gallery {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 0 16px !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .ed.ed--listing-detail .ed-gallery .ed-main,
  .ed.ed--listing-detail .ed-main {
    border-radius: 20px !important;
    aspect-ratio: 4 / 3 !important;
    overflow: hidden !important;
    background: #e5e7eb !important;
  }

  .ed.ed--listing-detail .ed-gallery .ed-main img,
  .ed.ed--listing-detail .ed-main img {
    border-radius: 20px !important;
  }

  .ed.ed--listing-detail .ed-thumbs {
    margin-top: 10px !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
  }

  .ed.ed--listing-detail .ed-col {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
  }

  .ed.ed--listing-detail .ed-col > .ed-card,
  .ed.ed--listing-detail .ed-col > section.ed-card {
    margin: 0 !important;
    padding: 20px !important;
    border-radius: 20px !important;
  }

  .ed.ed--listing-detail .ed-desc {
    font-size: 15px !important;
    line-height: 1.55 !important;
    color: #6b7280 !important;
    margin: 0 !important;
  }

  .ed.ed--listing-detail .ed-card .ed-rows {
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
    margin: 12px 0 0 !important;
  }

  .ed.ed--listing-detail .ed-card .ed-row {
    display: grid !important;
    grid-template-columns: minmax(88px, 38%) 1fr !important;
    align-items: start !important;
    gap: 8px 12px !important;
    padding: 14px 0 !important;
    border-top: 1px solid #f0f0f2 !important;
    font-size: 14px !important;
  }

  .ed.ed--listing-detail .ed-card .ed-row:first-child {
    border-top: none !important;
    padding-top: 0 !important;
  }

  .ed.ed--listing-detail .ed-card .ed-row dt {
    margin: 0 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #9ca3af !important;
    line-height: 1.35 !important;
  }

  .ed.ed--listing-detail .ed-card .ed-row dd {
    margin: 0 !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    color: #111827 !important;
    text-align: right !important;
    line-height: 1.4 !important;
    max-width: none !important;
    word-break: break-word !important;
  }

  .ed.ed--listing-detail .ed-col > .ed-card:has(.ed-rows) {
    padding-bottom: 22px !important;
  }

  .ed.ed--listing-detail .ed-grid {
    gap: 12px !important;
  }

  .ed.ed--listing-detail .ed-side {
    gap: 12px !important;
  }

  .ed.ed--listing-detail .ed-prog-head,
  .ed.ed--listing-detail .ed-card.ed-prog {
    border-radius: 20px !important;
  }

  .ed.ed--listing-detail .ed-grid--listing {
    display: flex !important;
    flex-direction: column !important;
  }
  .ed.ed--listing-detail .ed-grid--listing > .ed-col,
  .ed.ed--listing-detail .ed-grid--listing > .ed-side {
    display: contents !important;
  }
  .ed.ed--listing-detail .ed-block--gallery { order: 1 !important; }
  .ed.ed--listing-detail .ed-block--pricing { order: 2 !important; }
  .ed.ed--listing-detail .ed-block--progress { order: 3 !important; }
  .ed.ed--listing-detail .ed-block--desc { order: 4 !important; }
  .ed.ed--listing-detail .ed-block--conditions { order: 5 !important; }
  .ed.ed--listing-detail .ed-block--master { order: 6 !important; }
  .ed.ed--listing-detail .ed-block--similar { order: 7 !important; }

  .ed.ed--listing-detail .ed-card--pricing .ed-actions {
    margin-top: 14px !important;
    padding-top: 14px !important;
  }

  .ed.ed--listing-detail .ed-deal-status {
    margin-bottom: 12px !important;
    padding: 12px 14px !important;
  }
}
`;
