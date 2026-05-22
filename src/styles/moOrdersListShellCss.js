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

  .mo-orders-root .mo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  @media (max-width: 880px) { .mo-orders-root .mo-grid { grid-template-columns: 1fr; } }

  /* —— Premium cabinet cards (desktop + mobile), без иконок в тегах/кнопках —— */
  .mo-orders-root .mo-card {
    background: #fff;
    border: 1px solid #ececec;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    display: flex;
    flex-direction: column;
    animation: mo-orders-fade .45s both;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  }
  @keyframes mo-orders-fade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .mo-orders-root .mo-card:hover {
    transform: translateY(-4px);
    border-color: #ffd4bf;
    box-shadow: 0 20px 44px -14px rgba(232, 65, 10, 0.2);
  }

  .mo-orders-root .mo-card-media {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 10;
    min-height: 168px;
    background: #f1f5f9;
    overflow: hidden;
  }
  @media (min-width: 769px) {
    .mo-orders-root .mo-card-media { min-height: 200px; aspect-ratio: 16 / 9; }
  }
  .mo-orders-root .mo-card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .45s ease;
  }
  .mo-orders-root .mo-card:hover .mo-card-media img { transform: scale(1.04); }

  .mo-orders-root .mo-card-status-on-img {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.01em;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  }
  .mo-orders-root .mo-card-status-on-img.open { background: #dcfce7; color: #15803d; }
  .mo-orders-root .mo-card-status-on-img.wait { background: #fef9c3; color: #a16207; }
  .mo-orders-root .mo-card-status-on-img.work { background: #dbeafe; color: #1d4ed8; }
  .mo-orders-root .mo-card-status-on-img.neutral { background: #f1f5f9; color: #64748b; }

  .mo-orders-root .mo-card-urgent {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    background: linear-gradient(135deg, #ef4444, #f97316);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 6px 10px;
    border-radius: 999px;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
  }

  .mo-orders-root .mo-card-price-on-img {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 2;
    max-width: calc(100% - 24px);
    padding: 8px 14px;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.78);
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.25;
    backdrop-filter: blur(6px);
  }

  .mo-orders-root .mo-card-content {
    padding: 16px 18px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  .mo-orders-root .mo-card-headline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .mo-orders-root .mo-card-title {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    line-height: 1.3;
    flex: 1;
    min-width: 0;
  }
  .mo-orders-root .mo-card-time {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    white-space: nowrap;
    padding-top: 2px;
  }

  .mo-orders-root .mo-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .mo-orders-root .mo-tag {
    display: inline-flex;
    align-items: center;
    padding: 5px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mo-orders-root .mo-tag-cat.elec { background: #e0f2fe; color: #0e7490; }
  .mo-orders-root .mo-tag-cat.plumb { background: #f1f5f9; color: #475569; }
  .mo-orders-root .mo-tag-cat.beauty { background: #f3e8ff; color: #7c3aed; }
  .mo-orders-root .mo-tag-cat.hair { background: #fef9c3; color: #a16207; }
  .mo-orders-root .mo-tag-cat.repair { background: #fff2e6; color: #c2410c; }
  .mo-orders-root .mo-tag-addr {
    background: #fff1eb;
    color: #ea580c;
    border: 1px solid #ffedd5;
  }

  .mo-orders-root .mo-card-desc {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .mo-orders-root .mo-card-hint {
    margin: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: #94a3b8;
    line-height: 1.4;
  }
  .mo-orders-root .mo-card-hint strong { color: #f97316; font-weight: 800; }

  .mo-orders-root .mo-actions {
    display: flex;
    gap: 10px;
    padding: 14px 18px 18px;
    margin-top: auto;
  }
  .mo-orders-root .mo-btn {
    flex: 1;
    border: none;
    border-radius: 14px;
    padding: 13px 16px;
    font: inherit;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    transition: transform .2s, box-shadow .2s, background .2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
  }
  .mo-orders-root .mo-btn-primary {
    background: linear-gradient(135deg, #ff5722, #ff7043);
    color: #fff;
    box-shadow: 0 8px 22px rgba(255, 87, 34, 0.35);
  }
  .mo-orders-root .mo-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(255, 87, 34, 0.45);
  }
  .mo-orders-root .mo-btn-secondary {
    background: #f8fafc;
    color: #ea580c;
    border: 1px solid #e2e8f0;
  }
  .mo-orders-root .mo-btn-secondary:hover {
    background: #fff7ed;
    border-color: #fed7aa;
    color: #c2410c;
  }
  .mo-orders-root .mo-btn-ghost {
    background: #fff;
    color: #64748b;
    border: 1px solid #e2e8f0;
    flex: 0 0 auto;
    padding-left: 14px;
    padding-right: 14px;
    font-size: 13px;
    font-weight: 700;
    min-height: 46px;
  }
  .mo-orders-root .mo-btn-ghost:hover { background: #f8fafc; color: #0f172a; }
  .mo-orders-root .mo-btn-ghost.copied { color: #166534; border-color: #bbf7d0; background: #f0fdf4; }

  .mo-orders-root .mo-card-tools {
    display: flex;
    gap: 8px;
    padding: 0 18px 12px;
    flex-wrap: wrap;
  }
  .mo-orders-root .mo-card-tool {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .mo-orders-root .mo-card-tool:hover { color: #ea580c; }
  .mo-orders-root .mo-card-tool.copied { color: #166534; }
  .mo-orders-root .mo-card-tool:disabled { opacity: 0.5; cursor: wait; }

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
