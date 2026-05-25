/**
 * Общая оболочка списка «Lovable / mo-*» для «Мои заявки» и «Мои объявления».
 * Подключается в <style> страниц после базовых reset-правил.
 */
export const moCabinetPageBackground = `
  radial-gradient(circle at 12% -6%, rgba(232,65,10,.1), transparent 32%),
  linear-gradient(180deg, #f7f3ef 0%, #f3f4f6 52%, #f8f8f7 100%)
`;

export const moOrdersListShellCss = `
  .mo-orders-root {
    padding-bottom: 80px;
    background: ${moCabinetPageBackground};
    min-height: 100vh;
  }

  /* === Hero: как «Мои сделки» (moCabinetStyle) === */
  .mo-orders-root .mo-hero {
    position: relative;
    width: 100%;
    height: 280px;
    overflow: hidden;
    border-radius: 0 0 30px 30px;
    box-shadow: 0 18px 44px rgba(17, 24, 39, .12);
  }
  .mo-orders-root .mo-hero img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 46%;
    filter: brightness(.68) saturate(1.03);
  }
  .mo-orders-root .mo-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(172deg, rgba(13,13,13,.05) 0%, rgba(232,65,10,.12) 44%, rgba(13,13,13,.68) 100%);
  }
  .mo-orders-root .mo-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(circle at 78% 18%, rgba(255,255,255,.18), transparent 28%);
    pointer-events: none;
  }
  .mo-orders-root .mo-hero-inner {
    position: relative;
    z-index: 2;
    height: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 20px 40px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    color: #fff;
    box-sizing: border-box;
  }
  /* Мобильный hero — src/styles/moCabinetMobile.css */
  .mo-orders-root .mo-hero h1 {
    margin: 0 0 6px;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 900;
    letter-spacing: -.03em;
    line-height: .96;
    color: #fff;
    text-shadow: 0 8px 30px rgba(0,0,0,.22);
  }
  .mo-orders-root .mo-hero p {
    margin: 0;
    color: rgba(255,255,255,.78);
    font-size: 15px;
    font-weight: 650;
  }
  .mo-orders-root .mo-cta {
    background: #ff5722; color: #fff; border: none; padding: 13px 26px; border-radius: 999px;
    font: inherit; font-weight: 800; font-size: 14px; cursor: pointer;
    box-shadow: 0 8px 24px rgba(255, 87, 34, 0.42); transition: transform .2s, box-shadow .2s; white-space: nowrap;
  }
  .mo-orders-root .mo-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(255, 87, 34, 0.5); }

  .mo-orders-root .mo-main {
    max-width: 1000px;
    margin: -26px auto 0;
    padding: 18px 20px 100px;
    position: relative;
    z-index: 3;
    box-sizing: border-box;
  }

  .mo-orders-root .mo-toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 22px; }
  .mo-orders-root .mo-tabs { display: flex; gap: 4px; padding: 6px; background: #fff; border-radius: 14px; box-shadow: 0 4px 14px rgba(15,15,30,.05); }
  .mo-orders-root .mo-tab {
    background: none; border: none; padding: 10px 18px; border-radius: 10px; font: inherit; font-weight: 700; font-size: 14px;
    color: #64748b; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all .15s;
  }
  .mo-orders-root .mo-tab.active { background: linear-gradient(135deg, #ff5722, #ff7043); color: #fff; box-shadow: 0 4px 14px rgba(255, 87, 34, 0.35); }
  .mo-orders-root .mo-tab-count { background: rgba(0,0,0,.08); padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; }
  .mo-orders-root .mo-tab.active .mo-tab-count { background: rgba(255,255,255,.28); }

  .mo-orders-root .mo-search { flex: 1; min-width: 220px; max-width: 420px; position: relative; }
  .mo-orders-root .mo-search input {
    width: 100%; padding: 13px 16px 13px 44px; border: 1.5px solid #ececec; background: #fff; border-radius: 14px;
    font: inherit; font-size: 14px; outline: none; transition: all .2s; font-weight: 500;
  }
  .mo-orders-root .mo-search input:focus { border-color: #ff5722; box-shadow: 0 0 0 4px rgba(255, 87, 34, 0.12); }
  .mo-orders-root .mo-search svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }

  /* alias Base44: mo-page */
  .mo-orders-root.mo-page,
  .mo-page.mo-orders-root,
  .ml-page.ml-list-shell.mo-orders-root.mo-page {
    padding-bottom: 80px;
    background: ${moCabinetPageBackground};
    min-height: 100vh;
    font-family: 'Manrope', Inter, system-ui, sans-serif;
    color: #111827;
  }

  .mo-orders-root .mo-grid,
  .mo-orders-root .listing-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
  @media (max-width: 960px) {
    .mo-orders-root .mo-grid,
    .mo-orders-root .listing-grid { grid-template-columns: 1fr; gap: 16px; }
  }

  /* —— Карточки списка: габариты как «Мои сделки» (OrderCard / moCabinetStyle) —— */
  .mo-orders-root .mo-card {
    background: #fff;
    border: 1px solid #ebe7e2;
    border-radius: 28px;
    overflow: hidden;
    position: relative;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    display: flex;
    flex-direction: column;
    animation: mo-orders-fade .45s both;
    cursor: pointer;
    box-shadow: 0 18px 44px rgba(20, 24, 31, .12);
    font-family: 'Manrope', sans-serif;
  }
  @keyframes mo-orders-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .mo-orders-root .mo-card:hover {
    transform: translateY(-4px);
    border-color: rgba(232, 65, 10, .18);
    box-shadow: 0 28px 64px rgba(20, 24, 31, .16);
  }

  .mo-orders-root .mo-card-media {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    min-height: 0;
    background: #f3f4f6;
    overflow: hidden;
  }
  .mo-orders-root .mo-card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    display: block;
    filter: contrast(1.06) saturate(1.08);
    transition: transform .35s ease;
  }
  .mo-orders-root .mo-card:hover .mo-card-media img { transform: scale(1.035); }

  .mo-orders-root .mo-card-status-on-img {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.2;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
  }
  .mo-orders-root .mo-card-status-on-img::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    flex-shrink: 0;
  }
  .mo-orders-root .mo-card-status-on-img.open { background: #22c55e; color: #fff; }
  .mo-orders-root .mo-card-status-on-img.wait { background: #f59e0b; color: #fff; }
  .mo-orders-root .mo-card-status-on-img.work { background: #3b82f6; color: #fff; }
  .mo-orders-root .mo-card-status-on-img.neutral { background: #94a3b8; color: #fff; }

  .mo-orders-root .mo-card-urgent {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    background: #ef4444;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 5px 10px;
    border-radius: 999px;
  }

  .mo-orders-root .mo-card-price-on-img {
    position: absolute;
    right: 10px;
    bottom: 10px;
    z-index: 2;
    max-width: calc(100% - 20px);
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.82);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.01em;
  }

  .mo-orders-root .mo-card-content {
    padding: 18px 20px 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }

  .mo-orders-root .mo-card-headline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .mo-orders-root .mo-card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 950;
    color: #111827;
    letter-spacing: -.3px;
    line-height: 1.3;
    flex: 1;
    min-width: 0;
  }
  .mo-orders-root .mo-card-time {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 500;
    color: #9ca3af;
    white-space: nowrap;
  }

  .mo-orders-root .mo-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mo-orders-root .mo-tag {
    display: inline-block;
    padding: 5px 11px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: none;
  }
  .mo-orders-root .mo-tag-cat {
    background: #f3f4f6;
    color: #4b5563;
  }
  .mo-orders-root .mo-tag-addr {
    background: #fff4ed;
    color: #ea580c;
  }

  .mo-orders-root .mo-card-desc {
    margin: 0;
    font-size: 13px;
    font-weight: 400;
    color: #374151;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .mo-orders-root .mo-card-hint {
    margin: 0 0 4px;
    font-size: 12px;
    line-height: 1.45;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
  }
  .mo-orders-root .mo-card-hint-main {
    font-weight: 700;
    color: #111827;
    font-size: 13px;
  }
  .mo-orders-root .mo-card-hint-sub {
    font-weight: 500;
    color: #9ca3af;
    font-size: 12px;
  }

  .mo-orders-root .mo-card-stats {
    margin: 0 0 4px;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    line-height: 1.35;
    color: #9ca3af;
    overflow: hidden;
  }
  .mo-orders-root .mo-card-stats-rating-wrap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .mo-orders-root .mo-card-stats-star {
    font-size: 13px;
    line-height: 1;
    color: #9ca3af;
  }
  .mo-orders-root .mo-card-stats-rating {
    font-weight: 800;
    color: #111827;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
  .mo-orders-root .mo-card-stats-muted {
    font-weight: 500;
    color: #9ca3af;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .mo-orders-root .mo-actions {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    margin-top: auto;
    border-top: 1px solid #f0ebe6;
    background: linear-gradient(180deg, rgba(250,250,250,.68), rgba(246,244,241,.92));
  }
  .mo-orders-root .mo-btn {
    flex: 1;
    border: none;
    border-radius: 14px;
    padding: 12px 14px;
    font: inherit;
    font-weight: 950;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s, transform 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
  }
  .mo-orders-root .mo-btn-primary {
    background: linear-gradient(180deg, #ef6339 0%, #e85a32 55%, #d1522d 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(209, 82, 45, 0.28);
  }
  .mo-orders-root .mo-btn-primary:hover {
    background: linear-gradient(180deg, #f46b42 0%, #ec6036 55%, #d85a30 100%);
    box-shadow: 0 6px 18px rgba(209, 82, 45, 0.34);
  }
  .mo-orders-root .mo-btn-secondary {
    background: #f5f5f7;
    color: #4b5563;
    border: 1px solid transparent;
  }
  .mo-orders-root .mo-btn-secondary:hover {
    background: #ececef;
    color: #111827;
  }
  .mo-orders-root .mo-btn-secondary.mo-btn-offers {
    background: #f5f5f7;
    color: #e11d48;
    font-weight: 700;
  }
  .mo-orders-root .mo-btn-secondary.mo-btn-offers:hover {
    background: #fee2e2;
    color: #be123c;
    border-color: #fecaca;
  }

  .mo-orders-root .mo-card-tools {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 0 16px 14px;
    flex-wrap: wrap;
  }
  .mo-orders-root .mo-card-tool {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: #cbd5e1;
  }
  .mo-orders-root .mo-card-tool:hover { color: #ff5722; text-decoration-color: #fdba74; }
  .mo-orders-root .mo-card-tool.copied { color: #16a34a; text-decoration-color: #86efac; }
  .mo-orders-root .mo-card-tool:disabled { opacity: 0.5; cursor: wait; }

  /* На карточках — только две кнопки, как в макете */
  .mo-orders-root .mo-card .mo-card-tools { display: none; }

  /* legacy blocks — скрыты */
  .mo-orders-root .mo-card-top,
  .mo-orders-root .mo-meta { display: none !important; }

  .mo-orders-root .mo-empty { text-align: center; padding: 70px 20px; background: #fff; border-radius: 22px; border: 1.5px solid #ececec; }
  .mo-orders-root .mo-empty-emoji { font-size: 56px; margin-bottom: 14px; }
  .mo-orders-root .mo-empty-title { font-weight: 800; font-size: 19px; color: #0f172a; }
  .mo-orders-root .mo-empty-sub { color: #64748b; margin-top: 6px; font-size: 14px; }
  .mo-orders-root .mo-empty-actions { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

  .mo-orders-root .mo-card--sk { cursor: default; pointer-events: none; }
  .mo-orders-root .mo-card--sk .mo-card-media { background: #f1f5f9; }

  /* —— Карточка «Управление» + отклики —— */
  .ed--listing-detail .ed-card.ed-card--manage {
    border-radius: 24px;
    padding: 20px 18px 18px;
    border: 1px solid #efefef;
    box-shadow: 0 4px 22px rgba(15, 23, 42, 0.06);
  }
  .ed--listing-detail .ed-card.ed-card--manage .ed-eyebrow--block {
    margin: 0 0 14px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #9ca3af;
  }
  .ed--listing-detail .ed-card.ed-card--offers {
    border-radius: 20px;
    padding: 18px 16px;
    border: 1px solid #eef0f3;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
  }
  .ed--listing-detail .ed-card.ed-card--offers .mo-card-stats {
    margin: 0;
  }

  .mo-offers-actions,
  .ed--listing-detail .mo-offers-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  a.mo-btn-offers-main,
  .mo-btn-offers-main,
  .ed--listing-detail a.mo-btn-offers-main,
  .ed--listing-detail .mo-btn-offers-main {
    width: 100%;
    text-decoration: none;
    color: #fff;
    box-sizing: border-box;
    min-height: 52px;
    padding: 14px 20px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(180deg, #e85a32 0%, #d1522d 55%, #c94b28 100%);
    color: #fff;
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.01em;
    cursor: pointer;
    box-shadow:
      0 12px 28px rgba(209, 82, 45, 0.36),
      0 3px 8px rgba(209, 82, 45, 0.18);
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  a.mo-btn-offers-main:hover,
  .mo-btn-offers-main:hover,
  .ed--listing-detail a.mo-btn-offers-main:hover,
  .ed--listing-detail .mo-btn-offers-main:hover {
    background: linear-gradient(180deg, #ef6339 0%, #d85a30 55%, #c45227 100%);
    box-shadow:
      0 14px 32px rgba(209, 82, 45, 0.42),
      0 4px 10px rgba(209, 82, 45, 0.22);
    transform: translateY(-1px);
  }
  .mo-btn-offers-main:active,
  .ed--listing-detail .mo-btn-offers-main:active {
    transform: translateY(0);
    box-shadow: 0 6px 18px rgba(209, 82, 45, 0.32);
  }
  .mo-btn-offers-main.is-active,
  .ed--listing-detail .mo-btn-offers-main.is-active {
    background: linear-gradient(180deg, #cf4f28 0%, #b84522 100%);
    box-shadow: 0 8px 20px rgba(209, 82, 45, 0.3);
  }
  .mo-btn-offers-main:focus-visible,
  .mo-btn-edit-outline:focus-visible,
  .mo-btn-delete-outline:focus-visible,
  .ed--listing-detail .mo-btn-offers-main:focus-visible,
  .ed--listing-detail .mo-btn-edit-outline:focus-visible,
  .ed--listing-detail .mo-btn-delete-outline:focus-visible {
    outline: 2px solid rgba(209, 82, 45, 0.45);
    outline-offset: 2px;
  }
  .mo-offers-actions-row,
  .ed--listing-detail .mo-offers-actions-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }
  .mo-offers-actions-row:has(> :only-child) {
    grid-template-columns: 1fr;
  }
  .mo-btn-edit-outline,
  .mo-btn-delete-outline,
  .ed--listing-detail .mo-btn-edit-outline,
  .ed--listing-detail .mo-btn-delete-outline {
    width: 100%;
    min-height: 46px;
    padding: 12px 14px;
    border-radius: 14px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    background: #fff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
    transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
  }
  .mo-btn-edit-outline,
  .ed--listing-detail .mo-btn-edit-outline {
    border: 1px solid #e8eaed;
    color: #4b5563;
  }
  .mo-btn-edit-outline:hover,
  .ed--listing-detail .mo-btn-edit-outline:hover {
    background: #fafafa;
    border-color: #d1d5db;
    color: #111827;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  }
  .mo-btn-delete-outline,
  .ed--listing-detail .mo-btn-delete-outline {
    border: 1px solid #fad4d4;
    color: #e11d48;
  }
  .mo-btn-delete-outline:hover:not(:disabled),
  .ed--listing-detail .mo-btn-delete-outline:hover:not(:disabled) {
    background: #fff5f5;
    border-color: #f9a8a8;
    color: #be123c;
    box-shadow: 0 2px 6px rgba(225, 29, 72, 0.08);
  }
  .mo-btn-delete-outline:disabled,
  .ed--listing-detail .mo-btn-delete-outline:disabled {
    opacity: 0.55;
    cursor: wait;
  }
  .mo-btn-archive-outline,
  .ed--listing-detail .mo-btn-archive-outline {
    width: 100%;
    min-height: 46px;
    padding: 12px 14px;
    border-radius: 14px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    background: #f5f5f7;
    border: 1px solid #e8eaed;
    color: #374151;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .mo-btn-archive-outline:hover,
  .ed--listing-detail .mo-btn-archive-outline:hover {
    background: #ececef;
    border-color: #d1d5db;
    color: #111827;
  }
  .mo-orders-root .mo-btn-secondary.mo-btn-archive {
    background: #f5f5f7;
    color: #374151;
    font-weight: 700;
  }
  .mo-orders-root .mo-btn-secondary.mo-btn-archive:hover {
    background: #ececef;
    color: #111827;
  }
  .mo-card-tool--block,
  .ed--listing-detail .mo-card-tool--block {
    display: block;
    width: 100%;
    text-align: center;
    margin-top: 4px;
  }

  /* —— Модалка «Отклики» (sheet) —— */
  .mo-offers-sheet-overlay {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 16px;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    animation: mo-offers-overlay-in 0.2s ease;
  }
  @keyframes mo-offers-overlay-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .mo-offers-sheet {
    width: 100%;
    max-width: 560px;
    max-height: min(88vh, 720px);
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
    overflow: hidden;
    animation: mo-offers-sheet-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes mo-offers-sheet-in {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  .mo-offers-sheet-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 22px 22px 16px;
    border-bottom: 1px solid #f1f3f5;
    flex-shrink: 0;
  }
  .mo-offers-sheet-head-text {
    min-width: 0;
    flex: 1;
  }
  .mo-offers-sheet-title {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }
  .mo-offers-sheet-subtitle {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    line-height: 1.35;
  }
  .mo-offers-sheet-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    background: #fff7ed;
    border: 1px solid #fdba74;
    color: #ea580c;
    font-size: 12px;
    font-weight: 700;
  }
  .mo-offers-sheet-close {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 12px;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .mo-offers-sheet-close:hover {
    background: #e5e7eb;
    color: #111827;
  }
  .mo-offers-sheet-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .mo-offers-sheet-empty {
    margin: 0;
    font-size: 14px;
    color: #9ca3af;
    line-height: 1.45;
    text-align: center;
    padding: 24px 12px;
  }
  .mo-offers-sheet-loading {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .mo-offer-sheet-card--sk {
    pointer-events: none;
  }

  .mo-offer-sheet-card {
    border: 1px solid #e8eaed;
    border-radius: 16px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
  }
  .mo-offer-sheet-card.is-accepted {
    border-color: #bbf7d0;
    background: #f0fdf4;
  }
  .mo-offer-sheet-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .mo-offer-sheet-worker {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }
  .mo-offer-sheet-ava {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .mo-offer-sheet-ava--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e85a32, #d1522d);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
  }
  .mo-offer-sheet-worker-info {
    min-width: 0;
  }
  .mo-offer-sheet-name {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 800;
    color: #111827;
    line-height: 1.25;
  }
  .mo-offer-sheet-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #9ca3af;
    line-height: 1.35;
  }
  .mo-offer-sheet-rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #6b7280;
    font-weight: 600;
  }
  .mo-offer-sheet-star {
    color: #f59e0b;
    font-size: 13px;
    line-height: 1;
  }
  .mo-offer-sheet-reviews {
    color: #9ca3af;
    font-weight: 500;
  }
  .mo-offer-sheet-time {
    color: #9ca3af;
    font-weight: 500;
  }
  .mo-offer-sheet-price {
    flex-shrink: 0;
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .mo-offer-sheet-msg {
    padding: 12px 14px;
    border-radius: 12px;
    background: #fafafa;
    border: 1px solid #e8eaed;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    line-height: 1.5;
    margin-bottom: 12px;
    min-height: 44px;
  }
  .mo-offer-sheet-note {
    margin: 0 0 10px;
    font-size: 12px;
    font-weight: 600;
    color: #16a34a;
  }
  .mo-offer-sheet-accepted {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #16a34a;
    text-align: center;
    padding: 8px 0 2px;
  }
  .mo-offer-sheet-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .mo-offer-sheet-btn {
    min-height: 46px;
    padding: 12px 14px;
    border-radius: 14px;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .mo-offer-sheet-btn--accept {
    border: none;
    background: linear-gradient(180deg, #e85a32 0%, #d1522d 100%);
    color: #fff;
    box-shadow: 0 6px 18px rgba(209, 82, 45, 0.32);
  }
  .mo-offer-sheet-btn--accept:hover:not(:disabled) {
    background: linear-gradient(180deg, #ef6339 0%, #d85a30 100%);
    box-shadow: 0 8px 22px rgba(209, 82, 45, 0.38);
  }
  .mo-offer-sheet-btn--accept:disabled {
    opacity: 0.65;
    cursor: wait;
  }
  .mo-offer-sheet-btn--write {
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #111827;
    font-weight: 600;
  }
  .mo-offer-sheet-btn--write:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #111827;
  }
  .mo-offer-sheet-btn--write:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* —— Боковая панель деталки объявления (мастер) —— */
  .ed--listing-detail .ed-side--listing-cabinet {
    gap: 14px;
  }
  .ed--listing-detail .ml-side-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  .ed--listing-detail .ml-side-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 14px 12px;
    background: #fff;
    border: 1px solid #efefef;
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  }
  .ed--listing-detail .ml-side-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 12px 6px;
    background: #f5f5f7;
    border-radius: 14px;
    min-height: 72px;
    text-align: center;
  }
  .ed--listing-detail .ml-side-stat-value {
    font-size: 22px;
    font-weight: 800;
    color: #111827;
    line-height: 1.1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
  }
  .ed--listing-detail .ml-side-stat-value--rating {
    font-size: 20px;
  }
  .ed--listing-detail .ml-side-stat-label {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    line-height: 1.2;
  }
  .ed--listing-detail .ml-side-price {
    padding: 18px 16px 16px;
    border-radius: 20px;
    border: 1px solid #efefef;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
    margin: 0;
  }
  .ed--listing-detail .ml-side-price-eyebrow {
    display: block;
    margin: 0 0 10px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #9ca3af;
  }
  .ed--listing-detail .ml-side-price-num {
    font-size: 32px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.03em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .ed--listing-detail .ml-side-price-num--nego {
    font-size: 22px;
    font-weight: 700;
  }
  .ed--listing-detail .ml-side-price-currency {
    font-size: 18px;
    font-weight: 700;
  }
  .ed--listing-detail .ml-side-price-unit {
    display: block;
    margin-top: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
  }
  .ed--listing-detail .ml-side-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ed--listing-detail .ml-side-btn-edit {
    width: 100%;
    min-height: 50px;
    padding: 14px 18px;
    border: none;
    border-radius: 16px;
    background: linear-gradient(180deg, #ef6339 0%, #e85a32 55%, #d1522d 100%);
    color: #fff;
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(209, 82, 45, 0.32);
    transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
  }
  .ed--listing-detail .ml-side-btn-edit:hover {
    background: linear-gradient(180deg, #f46b42 0%, #ec6036 55%, #d85a30 100%);
    box-shadow: 0 10px 26px rgba(209, 82, 45, 0.38);
    transform: translateY(-1px);
  }
  .ed--listing-detail .ml-side-actions-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ed--listing-detail .ml-side-btn-link,
  .ed--listing-detail .ml-side-btn-archive {
    min-height: 46px;
    padding: 11px 12px;
    border-radius: 14px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    background: #fff;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .ed--listing-detail .ml-side-btn-link {
    border: 1px solid #e5e7eb;
    color: #374151;
  }
  .ed--listing-detail .ml-side-btn-link:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  .ed--listing-detail .ml-side-btn-link.copied {
    color: #16a34a;
    border-color: #bbf7d0;
    background: #f0fdf4;
  }
  .ed--listing-detail .ml-side-btn-archive {
    border: 1px solid #fecaca;
    color: #b45309;
  }
  .ed--listing-detail .ml-side-btn-archive:hover {
    background: #fffbeb;
    border-color: #fcd34d;
    color: #92400e;
  }
  @media (max-width: 560px) {
    .mo-offers-sheet-overlay {
      padding: 0;
      align-items: flex-end;
    }
    .mo-offers-sheet {
      max-width: none;
      max-height: 92vh;
      border-radius: 20px 20px 0 0;
      animation-name: mo-offers-sheet-in-mobile;
    }
    @keyframes mo-offers-sheet-in-mobile {
      from { opacity: 0; transform: translateY(100%); }
      to { opacity: 1; transform: none; }
    }
  }
`;
