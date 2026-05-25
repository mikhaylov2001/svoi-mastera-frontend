/** Единые стили карточек детальной страницы (объявление, заявка, сделки). */
export const listingDetailSurfaceExtraCss = `
.ed--listing-detail {
  --surface-card-bg: #fff;
  --surface-card-border: #ebebeb;
  --surface-card-radius: 20px;
  --surface-card-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  --surface-card-pad-y: 18px;
  --surface-card-pad-x: 16px;
  --surface-eyebrow: #9ca3af;
  --surface-accent: #e8410a;
  font-family: Manrope, system-ui, sans-serif;
}

.ed--listing-detail .ed-grid {
  grid-template-columns: minmax(0, 1fr) minmax(288px, 358px);
  gap: 20px;
}
@media (max-width: 1020px) {
  .ed--listing-detail .ed-grid { grid-template-columns: 1fr; }
}

.ed--listing-detail .ed-side {
  gap: 12px;
  min-width: 0;
}

/* ── Все белые карточки одинаково ── */
.ed--listing-detail .ed-card,
.ed--listing-detail .ed-side > .ed-card,
.ed--listing-detail .ed-col > .ed-card,
.ed--listing-detail .ed-col > section.ed-card {
  background: var(--surface-card-bg);
  border: 1px solid var(--surface-card-border);
  border-radius: var(--surface-card-radius);
  padding: var(--surface-card-pad-y) var(--surface-card-pad-x);
  box-shadow: var(--surface-card-shadow);
}

.ed--listing-detail .ed-section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: #111;
  line-height: 1.3;
  letter-spacing: normal;
  text-transform: none;
}

.ed--listing-detail .ed-eyebrow,
.ed--listing-detail .ed-eyebrow--block {
  display: block;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--surface-eyebrow);
  line-height: 1.3;
}

/* ── Стоимость ── */
.ed--listing-detail .ed-price-num {
  font-size: 32px;
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.ed--listing-detail .ed-price-num small {
  font-size: 15px;
  font-weight: 600;
  color: var(--surface-eyebrow);
  margin-left: 4px;
}
.ed--listing-detail .ed-price-unit {
  font-size: 16px;
  font-weight: 600;
  color: var(--surface-eyebrow);
  margin-left: 6px;
}
.ed--listing-detail .ed-price-sub {
  margin: 10px 0 16px;
  font-size: 14px;
  color: var(--surface-eyebrow);
  line-height: 1.45;
}

/* ── Кнопки в карточке стоимости ── */
.ed--listing-detail .ed-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 0;
}

.ed--listing-detail .ed-btn,
.ed--listing-detail .ed-msg-btn {
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border-radius: 14px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.2;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.ed--listing-detail .ed-btn-confirm {
  background: var(--surface-accent) !important;
  color: #fff !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(232, 65, 10, 0.32) !important;
}
.ed--listing-detail .ed-btn-confirm:hover:not(:disabled) {
  background: #d63a09 !important;
}
.ed--listing-detail .ed-btn-confirm:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ed--listing-detail .ed-btn-ghost,
.ed--listing-detail .ed-side .ed-card > .ed-msg-btn,
.ed--listing-detail .ed-actions .ed-msg-btn,
.ed--listing-detail .ed-actions .ed-btn-ghost {
  background: #fff !important;
  color: #111827 !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: none !important;
}
.ed--listing-detail .ed-btn-ghost:hover,
.ed--listing-detail .ed-side .ed-card > .ed-msg-btn:hover,
.ed--listing-detail .ed-actions .ed-msg-btn:hover {
  background: #f9fafb !important;
  color: #111827 !important;
}
.ed--listing-detail .ed-btn-ghost:visited,
.ed--listing-detail .ed-side .ed-card > .ed-msg-btn:visited,
.ed--listing-detail .ed-actions .ed-msg-btn:visited,
.ed--listing-detail .ed-actions .ed-msg-btn:active {
  color: #111827 !important;
}

.ed--listing-detail .ed-link-deals {
  padding: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--surface-accent);
}

/* ── Мастер / заказчик ── */
.ed--listing-detail .ed-cust-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0 12px;
  cursor: pointer;
}
.ed--listing-detail .ed-cust-row-static {
  cursor: default;
  padding-bottom: 0;
}

.ed--listing-detail .ed-ava {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.ed--listing-detail .ed-ava img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ed--listing-detail .ed-ava-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8410a, #ff7a3d);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  border-radius: 50%;
}
.ed--listing-detail .ed-cust-name {
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
  line-height: 1.3;
}
.ed--listing-detail .ed-cust-meta {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.35;
}
.ed--listing-detail .ed-cust-meta--active {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-weight: 600;
}
.ed--listing-detail .ed-cust-meta--active::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}

.ed--listing-detail .ed-side .ed-card > .ed-msg-btn {
  margin-top: 4px;
}

.ed--listing-detail .ed-cust-arrow {
  color: #d1d5db;
  flex-shrink: 0;
}
.ed--listing-detail .ed-cust-arrow svg {
  width: 16px;
  height: 16px;
}

/* ── Условия, описание ── */
.ed--listing-detail .ed-desc {
  font-size: 14px;
  line-height: 1.55;
  color: #374151;
}
.ed--listing-detail .ed-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #f1f1f1;
  font-size: 14px;
}
.ed--listing-detail .ed-row:first-child {
  border-top: none;
  padding-top: 4px;
}
.ed--listing-detail .ed-row dt {
  color: var(--surface-eyebrow);
  font-weight: 500;
  margin: 0;
}
.ed--listing-detail .ed-row dd {
  margin: 0;
  font-weight: 700;
  color: #111827;
  text-align: right;
  max-width: 58%;
}

.ed--listing-detail .ed-own-note {
  margin-top: 10px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.45;
  background: #f9fafb;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  color: #6b7280;
}

/* ── Шапка, прочее ── */
.ed-head { align-items: flex-start; }
.ed-head-right {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.ed-listing-meta {
  margin-top: 10px;
  font-size: 13px;
  color: #71717a;
  line-height: 1.5;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}
.ed-listing-meta span { display: inline-flex; align-items: center; gap: 6px; }

.ed-similar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.ed.ed--listing-detail .ed-similar-head strong {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9ca3af;
}
.ed-similar-head a {
  font-size: 12px;
  color: var(--surface-accent);
  font-weight: 700;
  text-decoration: none;
}
.ed-similar-head a:hover { text-decoration: underline; }
.ed-sim-item {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  padding: 8px 0;
  border-radius: 10px;
}
.ed-sim-item:hover { background: #fafafa; }
.ed-sim-img {
  width: 58px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f4f4f5;
}
.ed-sim-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ed-sim-title {
  font-size: 13px;
  font-weight: 600;
  color: #52525b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ed-sim-price { font-size: 13px; font-weight: 800; color: #111827; margin-top: 2px; }
.ed-error { font-size: 12px; color: #ef4444; font-weight: 600; padding: 4px 0; }

/* Десктоп: галерея и сайдбар как на «Найти мастера» (мобилку не трогаем) */
@media (min-width: 769px) {
  .ed.ed--listing-detail {
    padding: 28px 24px 56px;
    background: #f6f6f4;
  }

  .ed--listing-detail .ed-wrap {
    max-width: 1200px;
  }

  .ed--listing-detail .ed-head {
    margin-bottom: 20px;
  }

  .ed--listing-detail .ed-head h1 {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }

  .ed--listing-detail .ed-gallery {
    border-radius: 20px;
    border: 1px solid #ebebeb;
    box-shadow: 0 2px 14px rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  .ed.ed--listing-detail .ed-gallery .ed-main,
  .ed.ed--listing-detail .ed-main,
  .ed--listing-detail .ed-gallery .ed-main,
  .ed--listing-detail .ed-main,
  .jd-main,
  .jd-main-photo,
  .jd-gallery-main,
  .wd-detail-main,
  .mlf-preview-ph,
  .nl-preview-img {
    position: relative;
    aspect-ratio: 16 / 9;
    display: block !important;
    overflow: hidden;
    align-items: stretch;
    justify-content: stretch;
  }

  .ed.ed--listing-detail .ed-gallery .ed-main > img,
  .ed.ed--listing-detail .ed-main > img,
  .ed--listing-detail .ed-gallery .ed-main > img,
  .ed--listing-detail .ed-main > img,
  .jd-main > img,
  .jd-main-photo > img,
  .jd-gallery-main > img,
  .wd-detail-main > img,
  .mlf-preview-ph > img,
  .nl-preview-img > img {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    object-fit: cover !important;
    object-position: center center;
    display: block;
  }

  .ed--listing-detail .ed-thumbs {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    padding: 12px 14px 14px;
    background: #fff;
    border-top: 1px solid #f0f0f0;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .ed--listing-detail .ed-thumbs::-webkit-scrollbar {
    height: 4px;
  }

  .ed--listing-detail .ed-thumb {
    flex: 0 0 88px;
    width: 88px;
    max-width: 88px;
    height: 58px;
    aspect-ratio: auto;
    border-radius: 10px;
    border: 2px solid transparent;
    opacity: 0.7;
    box-sizing: border-box;
  }

  .ed--listing-detail .ed-thumb:hover {
    opacity: 0.9;
  }

  .ed--listing-detail .ed-thumb.on {
    opacity: 1;
    border-color: #e8410a;
  }

  .ed--listing-detail .ed-thumb.on::after {
    display: none;
  }

  .ed--listing-detail .ed-side {
    position: sticky;
    top: 24px;
  }

  .ed--listing-detail .ed-col {
    gap: 14px;
  }
}

/* Мобилка: деталь объявления — широкие карточки (после dealsDetailEdCss в <style>) */
@media (max-width: 768px) {
  .ed.ed--listing-detail {
    padding: 0 !important;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  .ed--listing-detail .ed-wrap {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 12px 16px calc(24px + env(safe-area-inset-bottom, 0px)) !important;
    box-sizing: border-box;
  }
  .ed--listing-detail .ed-grid,
  .ed--listing-detail .ed-col,
  .ed--listing-detail .ed-side {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0;
  }
  .ed--listing-detail .ed-gallery {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 0 12px !important;
    padding: 0 !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 24px !important;
    overflow: hidden !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07) !important;
    box-sizing: border-box;
  }
  .ed--listing-detail .ed-gallery .ed-main,
  .ed--listing-detail .ed-main {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }
  .ed--listing-detail .ed-col > .ed-card,
  .ed--listing-detail .ed-col > section.ed-card,
  .ed--listing-detail .ed-side > .ed-card {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 24px !important;
    border: 1px solid #e5e7eb !important;
    padding: 20px 24px !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.07) !important;
    box-sizing: border-box;
  }
  .ed--listing-detail .ed-back {
    margin-bottom: 16px !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  .ed--listing-detail .ed-floats {
    display: none !important;
  }
  .ed--listing-detail .ed-thumbs {
    display: flex !important;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
    padding: 10px 12px 12px;
    scrollbar-width: none;
  }
  .ed--listing-detail .ed-thumbs::-webkit-scrollbar {
    display: none;
  }
  .ed--listing-detail .ed-thumb {
    flex: 0 0 72px;
    width: 72px;
    max-width: 72px;
    aspect-ratio: 1;
    border-radius: 10px;
  }
}
`;
