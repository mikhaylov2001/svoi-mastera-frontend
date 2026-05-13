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

  .mo-orders-root .mo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  @media (max-width: 880px) { .mo-orders-root .mo-grid { grid-template-columns: 1fr; } }

  .mo-orders-root .mo-card {
    background: #fff;
    border: 1px solid rgba(255, 160, 130, 0.28);
    border-radius: 22px; overflow: hidden; position: relative;
    transition: all .28s cubic-bezier(.2,.8,.2,1); display: flex; flex-direction: column;
    animation: mo-orders-fade .45s both; cursor: pointer;
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  }
  @keyframes mo-orders-fade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .mo-orders-root .mo-card:hover {
    transform: translateY(-3px); border-color: #ffd4bf;
    box-shadow: 0 18px 40px -16px rgba(232,65,10,.22);
  }

  .mo-orders-root .mo-card-top { display: flex; gap: 16px; padding: 20px; align-items: flex-start; }

  .mo-orders-root .mo-card-photo {
    width: 120px; height: 120px; border-radius: 12px; overflow: hidden; flex-shrink: 0;
    background: #fff7ed; display: flex; align-items: center; justify-content: center;
    position: relative; box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
  }
  .mo-orders-root .mo-card-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
  .mo-orders-root .mo-card:hover .mo-card-photo img { transform: scale(1.08); }

  .mo-orders-root .mo-card-photo::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,.15)); opacity: 0; transition: opacity .3s; pointer-events: none;
  }
  .mo-orders-root .mo-card:hover .mo-card-photo::after { opacity: 1; }

  .mo-orders-root .mo-card-urgent {
    position: absolute; top: 8px; left: 8px; z-index: 2;
    background: linear-gradient(135deg, #ef4444, #f97316); color: #fff; font-size: 10px; font-weight: 800;
    padding: 5px 9px; border-radius: 999px; box-shadow: 0 4px 14px rgba(239,68,68,.5);
    animation: mo-orders-pulse 1.6s infinite; letter-spacing: 0.03em;
  }
  @keyframes mo-orders-pulse {
    0%, 100% { box-shadow: 0 4px 14px rgba(239,68,68,.4); transform: scale(1); }
    50% { box-shadow: 0 4px 22px rgba(239,68,68,.8); transform: scale(1.04); }
  }

  .mo-orders-root .mo-card-body { flex: 1; min-width: 0; }
  .mo-orders-root .mo-card-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .mo-orders-root .mo-card-title { margin: 0; font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; line-height: 1.3; }
  .mo-orders-root .mo-card-desc {
    margin-top: 6px; font-size: 13px; color: #64748b; line-height: 1.45;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .mo-orders-root .mo-status {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px;
    font-size: 11.5px; font-weight: 800; white-space: nowrap; flex-shrink: 0;
  }
  .mo-orders-root .mo-status .dot { width: 6px; height: 6px; border-radius: 50%; }
  .mo-orders-root .mo-status.open { background: #e8f7ed; color: #22c55e; }
  .mo-orders-root .mo-status.open .dot { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.2); }
  .mo-orders-root .mo-status.wait { background: rgba(254, 240, 138, 0.45); color: #92400e; }
  .mo-orders-root .mo-status.wait .dot { background: #d97706; box-shadow: 0 0 0 3px rgba(245,158,11,.22); }
  .mo-orders-root .mo-status.work { background: #dbeafe; color: #1d4ed8; }
  .mo-orders-root .mo-status.work .dot { background: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.18); }
  .mo-orders-root .mo-status.neutral { background: #f1f5f9; color: #64748b; }
  .mo-orders-root .mo-status.neutral .dot { background: #94a3b8; box-shadow: 0 0 0 3px rgba(148,163,184,.2); }

  .mo-orders-root .mo-cat { display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
  .mo-orders-root .mo-cat.elec { background: #e0f2fe; color: #0e7490; }
  .mo-orders-root .mo-cat.plumb { background: #fef3c7; color: #92400e; }
  .mo-orders-root .mo-cat.beauty { background: #f3e8ff; color: #7c3aed; }
  .mo-orders-root .mo-cat.hair { background: #fef9c3; color: #a16207; }
  .mo-orders-root .mo-cat.repair { background: #fff2e6; color: #d97706; }

  .mo-orders-root .mo-price-row { margin-top: 16px; display: flex; align-items: baseline; justify-content: flex-start; gap: 10px; flex-wrap: wrap; }
  .mo-orders-root .mo-price { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .mo-orders-root .mo-price-num {
    font-size: 26px; font-weight: 800; color: #f97316; letter-spacing: -0.03em; line-height: 1;
  }
  .mo-orders-root .mo-price-lbl { font-size: 12px; color: #64748b; font-weight: 600; }

  .mo-orders-root .mo-meta {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    padding: 12px 20px; border-top: 1px dashed #e2e8f0; color: #64748b; font-size: 12.5px; font-weight: 600;
    background: linear-gradient(180deg, #fafafb, #fff);
  }
  .mo-orders-root .mo-meta-start { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .mo-orders-root .mo-meta-views { font-weight: 700; color: #64748b; }
  .mo-orders-root .mo-meta-views svg { opacity: 0.85; }
  .mo-orders-root .mo-meta-trail { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; text-align: right; }
  .mo-orders-root .mo-meta-item { display: inline-flex; align-items: center; gap: 6px; }
  .mo-orders-root .mo-meta-item svg { width: 14px; height: 14px; opacity: .72; flex-shrink: 0; }
  .mo-orders-root .mo-offers { font-weight: 800; display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .mo-orders-root .mo-offers--has { color: #f97316; font-weight: 800; }
  .mo-orders-root .mo-offers--wait { color: #92400e; font-weight: 600; gap: 5px; }
  .mo-orders-root .mo-offers--wait svg { flex-shrink: 0; opacity: 0.85; }

  .mo-orders-root .mo-avatars { display: inline-flex; margin-right: 4px; }
  .mo-orders-root .mo-avatars span {
    width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff;
    background: linear-gradient(135deg, #ff5722, #ff8a65); margin-left: -7px;
    display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 800;
    box-shadow: 0 2px 6px rgba(232,65,10,.25);
  }
  .mo-orders-root .mo-avatars span:first-child { margin-left: 0; }

  .mo-orders-root .mo-actions { display: flex; gap: 8px; padding: 12px 20px 18px; }
  .mo-orders-root .mo-btn {
    flex: 1; border: none; border-radius: 13px; padding: 12px 14px; font: inherit; font-weight: 800; font-size: 13.5px;
    cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .mo-orders-root .mo-btn-primary {
    background: linear-gradient(135deg, #ff5c35, #ff7043); color: #fff; border: none;
    box-shadow: 0 8px 22px rgba(255, 92, 53, 0.32);
  }
  .mo-orders-root .mo-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(255, 92, 53, 0.42); }
  .mo-orders-root .mo-btn-ghost { background: #fff; color: #374151; border: 1px solid #e5e7eb; }
  .mo-orders-root .mo-btn-ghost:hover { background: #f9fafb; color: #0f172a; border-color: #d1d5db; }
  .mo-orders-root .mo-btn-icon { flex: 0 0 auto; width: 42px; padding: 0; font-size: 15px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }

  .mo-orders-root .mo-empty { text-align: center; padding: 70px 20px; background: #fff; border-radius: 22px; border: 1.5px solid #ececec; }
  .mo-orders-root .mo-empty-emoji { font-size: 56px; margin-bottom: 14px; }
  .mo-orders-root .mo-empty-title { font-weight: 800; font-size: 19px; color: #0f172a; }
  .mo-orders-root .mo-empty-sub { color: #64748b; margin-top: 6px; font-size: 14px; }
  .mo-orders-root .mo-empty-actions { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

  .mo-orders-root .mo-card--sk { cursor: default; pointer-events: none; }
  .mo-orders-root .mo-card--sk .mo-card-photo { background: #f1f5f9; }
  .mo-orders-root .mo-card--sk .mo-card-body { display: flex; flex-direction: column; gap: 10px; justify-content: center; }

  .mo-orders-root .mo-btn-ghost.mo-btn-icon.copied { color: #166534; border: 1px solid #bbf7d0; background: #f0fdf4; }
`;
