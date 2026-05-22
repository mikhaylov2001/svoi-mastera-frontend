/**
 * Общая оболочка списка «Lovable / mo-*» для «Мои заявки» и «Мои объявления».
 * Подключается в <style> страниц после базовых reset-правил.
 */
export const moOrdersListShellCss = `
  .mo-orders-root { padding-bottom: 80px; background: #f5f5f7; }

  /* === Hero: на всю ширину экрана, контент по центру в 1200px === */
  .mo-orders-root .mo-hero {
    position: relative; width: 100%; height: 240px; overflow: hidden;
    border-radius: 0; box-shadow: none;
  }
  @media (max-width: 768px) {
    .mo-orders-root .mo-hero { height: 200px; }
  }
  .mo-orders-root .mo-hero img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 40%;
    filter: saturate(1.06) contrast(1.02);
  }
  .mo-orders-root .mo-hero::after {
    content: ''; position: absolute; inset: 0; z-index: 0;
    background: linear-gradient(90deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,.34) 50%, rgba(0,0,0,.12) 100%);
  }
  .mo-orders-root .mo-hero-inner {
    position: relative; z-index: 1; height: 100%; max-width: 1200px; margin: 0 auto;
    padding: 0 clamp(24px, 5vw, 52px);
    display: flex; align-items: center; justify-content: space-between; gap: 24px; color: #fff;
  }
  @media (max-width: 600px) {
    .mo-orders-root .mo-hero-inner { flex-direction: column; align-items: flex-start; justify-content: center; gap: 14px; padding: 0 20px; }
    .mo-orders-root .mo-cta { align-self: stretch; text-align: center; justify-content: center; }
  }
  .mo-orders-root .mo-hero h1 { margin: 0 0 6px; font-size: 32px; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
  .mo-orders-root .mo-hero p { margin: 0; color: rgba(255,255,255,.92); font-size: 14px; font-weight: 500; }
  .mo-orders-root .mo-cta {
    background: #ff5722; color: #fff; border: none; padding: 13px 26px; border-radius: 999px;
    font: inherit; font-weight: 800; font-size: 14px; cursor: pointer;
    box-shadow: 0 8px 24px rgba(255, 87, 34, 0.42); transition: transform .2s, box-shadow .2s; white-space: nowrap;
  }
  .mo-orders-root .mo-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(255, 87, 34, 0.5); }

  .mo-orders-root .mo-main { max-width: 1200px; margin: 0 auto; padding: 24px 28px 28px; }

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
  .mo-page.mo-orders-root { padding-bottom: 80px; background: #f5f5f7; }

  .mo-orders-root .mo-grid,
  .mo-orders-root .listing-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }
  @media (max-width: 880px) {
    .mo-orders-root .mo-grid,
    .mo-orders-root .listing-grid { grid-template-columns: 1fr; gap: 18px; }
  }

  /* —— Cabinet cards (Base44 / moCabinetStyle), без иконок —— */
  .mo-orders-root .mo-card {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    transition: transform .2s ease, box-shadow .2s ease;
    display: flex;
    flex-direction: column;
    animation: mo-orders-fade .45s both;
    cursor: pointer;
    box-shadow: 0 2px 14px rgba(15, 23, 42, 0.06);
  }
  @keyframes mo-orders-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .mo-orders-root .mo-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1);
  }

  .mo-orders-root .mo-card-media {
    position: relative;
    width: 100%;
    aspect-ratio: 5 / 4;
    min-height: 176px;
    background: #eef1f5;
    overflow: hidden;
  }
  @media (min-width: 769px) {
    .mo-orders-root .mo-card-media { min-height: 198px; }
  }
  .mo-orders-root .mo-card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    display: block;
  }

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
    padding: 14px 16px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
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
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.02em;
    line-height: 1.25;
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
    margin: 0 0 2px;
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
  }
  .mo-orders-root .mo-card-hint-sub {
    font-weight: 500;
    color: #9ca3af;
  }

  .mo-orders-root .mo-card-stats {
    margin: 0 0 2px;
    font-size: 12px;
    line-height: 1.45;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    color: #9ca3af;
  }
  .mo-orders-root .mo-card-stats-rating {
    font-weight: 800;
    color: #111827;
    font-size: 13px;
  }
  .mo-orders-root .mo-card-stats-muted {
    font-weight: 500;
    color: #9ca3af;
  }

  .mo-orders-root .mo-actions {
    display: flex;
    gap: 10px;
    padding: 12px 16px 10px;
    margin-top: auto;
  }
  .mo-orders-root .mo-btn {
    flex: 1;
    border: none;
    border-radius: 12px;
    padding: 12px 14px;
    font: inherit;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background .15s, border-color .15s, color .15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
  }
  .mo-orders-root .mo-btn-primary {
    background: #ff5722;
    color: #fff;
    box-shadow: 0 6px 18px rgba(255, 87, 34, 0.28);
  }
  .mo-orders-root .mo-btn-primary:hover { background: #f4511e; }
  .mo-orders-root .mo-btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: none;
  }
  .mo-orders-root .mo-btn-secondary:hover {
    background: #e5e7eb;
    color: #111827;
  }
  .mo-orders-root .mo-btn-secondary.mo-btn-offers {
    color: #dc2626;
  }
  .mo-orders-root .mo-btn-secondary.mo-btn-offers:hover {
    background: #fee2e2;
    color: #b91c1c;
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
`;
