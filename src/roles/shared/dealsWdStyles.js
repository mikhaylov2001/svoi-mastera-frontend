/* Shared wd-* styles: worker + customer deals pages */
export const dealsWdCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .wd-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  /* ── HERO ── */
  .wd-hero {
    position: relative; height: 260px; overflow: hidden;
  }
  @media(max-width:768px){ .wd-hero { height: 210px; } }
  .wd-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 40%;
    filter: brightness(.58) saturate(1.15);
  }
  .wd-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(170deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.58) 100%);
  }
  .wd-hero-body {
    position: relative; z-index: 1; height: 100%;
    max-width: 1000px; margin: 0 auto; padding: 0 20px 28px;
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .wd-h1 { font-size: clamp(22px,4vw,32px); font-weight: 900; margin: 0; color: #fff; letter-spacing: -.4px; line-height: 1.15; }
  .wd-hsub { font-size: 14px; color: rgba(255,255,255,.75); margin: 5px 0 0; font-weight: 500; }
  .wd-find-btn {
    background: #e8410a; border: none; border-radius: 10px; color: #fff;
    font-size: 13px; font-weight: 700; padding: 11px 20px; cursor: pointer;
    font-family: inherit; white-space: nowrap;
    box-shadow: 0 4px 14px rgba(232,65,10,.32); transition: background .15s;
    text-decoration: none; display: inline-block;
  }
  .wd-find-btn:hover { background: #c73208; }

  /* ── WRAP ── */
  .wd-wrap { max-width: 1000px; margin: 0 auto; padding: 0 20px 60px; }

  /* ── PAGE TABS (Заказы / Объявления) ── */
  .wd-page-tabs {
    display: flex; gap: 6px; padding: 4px;
    background: rgba(255,255,255,.9); border: 1px solid #e8e8e8;
    border-radius: 12px; margin-bottom: 18px; width: fit-content;
  }
  .wd-page-tab {
    background: none; border: none; border-radius: 9px;
    padding: 9px 18px; font-size: 14px; font-weight: 600;
    color: #6b7280; cursor: pointer; font-family: inherit; transition: all .15s;
    display: flex; align-items: center; gap: 6px;
  }
  .wd-page-tab.on { color: #fff; background: #e8410a; box-shadow: 0 2px 8px rgba(232,65,10,.25); }
  .wd-page-tab-n {
    font-size: 11px; background: rgba(0,0,0,.07); border-radius: 8px;
    padding: 1px 6px; color: #6b7280; font-weight: 700;
  }
  .wd-page-tab.on .wd-page-tab-n { background: rgba(255,255,255,.22); color: #fff; }
  .wd-new-badge {
    font-size: 10px; font-weight: 800; color: #fff; background: #ef4444;
    border-radius: 999px; padding: 1px 6px; margin-left: 2px;
  }

  /* ── FILTER TABS ── */
  .wd-filters {
    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
    margin-bottom: 14px;
  }
  .wd-filter {
    background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
    padding: 8px 14px; font-size: 13px; font-weight: 600; color: #6b7280;
    cursor: pointer; font-family: inherit; transition: all .15s;
    display: flex; align-items: center; gap: 5px;
  }
  .wd-filter.on { border-color: #e8410a; color: #e8410a; background: #fff4ef; }
  .wd-filter-n { font-size: 11px; background: #f3f4f6; border-radius: 6px; padding: 1px 5px; font-weight: 700; color: #9ca3af; }
  .wd-filter.on .wd-filter-n { background: rgba(232,65,10,.12); color: #e8410a; }

  /* ── LIST ── */
  .wd-list { display: flex; flex-direction: column; gap: 12px; }

  /* ── CARD ── */
  .wd-card {
    display: flex; align-items: stretch;
    background: #fff; border: 1.5px solid #e8e8e8; border-radius: 16px;
    overflow: hidden; cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,.04);
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }
  .wd-card:hover { box-shadow: 0 10px 32px rgba(0,0,0,.09); transform: translateY(-2px); border-color: #e8410a; }
  .wd-card.new  { border-left: 3px solid #f59e0b; background: #fffdf7; }
  .wd-card.prog { border-left: 3px solid #3b82f6; }
  .wd-card.done { border-left: 3px solid #22c55e; }

  /* thumb */
  .wd-card-img { width: 126px; min-height: 108px; flex-shrink: 0; background: #f5f5f5; overflow: hidden; position: relative; }
  .wd-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 108px; }
  .wd-card-img-ph {
    width: 100%; height: 100%; min-height: 108px;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; color: #d1d5db;
  }

  /* body */
  .wd-card-body { flex: 1; padding: 13px 16px 9px; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .wd-card-title { font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 5px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .wd-card-price { font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 5px; }
  .wd-card-cat { display: inline-block; font-size: 11px; color: #fff; background: #e8410a; border-radius: 6px; padding: 2px 9px; margin-bottom: 5px; font-weight: 700; }
  .wd-card-meta { font-size: 12px; color: #9ca3af; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
  .wd-card-stats {
    display: flex; flex-direction: row; gap: 14px; flex-wrap: wrap;
    padding: 7px 10px; margin: 0 -16px -9px; border-top: 1px solid #f3f4f6;
    background: #f9f9f9; border-radius: 0 0 0 12px; align-items: center;
  }
  .wd-card-stat { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
  .wd-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; border-radius: 8px;
    padding: 3px 9px;
  }
  .wd-prog-row {
    display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
  }
  .wd-prog-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }

  /* actions panel */
  .wd-card-actions {
    width: 170px; flex-shrink: 0; padding: 13px 12px;
    display: flex; flex-direction: column; gap: 6px; justify-content: center;
    border-left: 1px solid #f0f0f0; background: #fafafa;
  }
  .wd-btn-primary {
    width: 100%; background: #e8410a; border: none; border-radius: 10px;
    padding: 10px 0; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-btn-primary:hover:not(:disabled) { background: #c73208; }
  .wd-btn-primary:disabled { background: #fca98e; cursor: not-allowed; }
  .wd-btn-outline {
    width: 100%; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
    padding: 9px 0; font-size: 12px; font-weight: 600; color: #475569;
    cursor: pointer; font-family: inherit; transition: all .15s; text-align: center; text-decoration: none; display: block;
  }
  .wd-btn-outline:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
  .wd-btn-danger {
    width: 100%; background: none; border: none; font-size: 12px;
    color: #9ca3af; cursor: pointer; font-family: inherit;
    padding: 4px 0; text-align: center; transition: color .15s;
  }
  .wd-btn-danger:hover { color: #dc2626; }
  .wd-btn-green {
    width: 100%; background: #16a34a; border: none; border-radius: 10px;
    padding: 10px 0; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-btn-green:hover:not(:disabled) { background: #15803d; }
  .wd-btn-green:disabled { background: #86efac; cursor: not-allowed; }
  .wd-actions-divider { height: 1px; background: #ebebeb; margin: 2px 0; }
  .wd-done-label {
    font-size: 12px; color: #16a34a; font-weight: 700;
    text-align: center; padding: 4px 0;
  }

  /* ── EMPTY ── */
  .wd-empty {
    text-align: center; padding: 72px 24px;
    background: rgba(255,255,255,.95); border: 1.5px solid #e8e8e8;
    border-radius: 16px; color: #8f8f8f;
    box-shadow: 0 4px 20px rgba(0,0,0,.05);
  }

  /* ── SKELETON ── */
  @keyframes wdsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .wd-sk {
    background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size: 200% 100%; animation: wdsk 1.4s infinite; border-radius: 6px;
  }

  /* ── LISTINGS TAB ── */
  .wd-lst-card {
    display: flex; align-items: center; gap: 12px;
    background: #fff; border: 1.5px solid #e8e8e8; border-radius: 14px;
    padding: 14px 16px; cursor: pointer;
    text-decoration: none; color: inherit;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }
  .wd-lst-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.09); transform: translateY(-2px); border-color: #e8410a; }
  .wd-lst-img {
    width: 64px; height: 64px; border-radius: 10px; overflow: hidden;
    background: #f5f5f5; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: #d1d5db;
  }
  .wd-lst-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wd-lst-title { font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 3px; }
  .wd-lst-price { font-size: 15px; font-weight: 800; color: #1a1a1a; margin-bottom: 3px; }
  .wd-lst-meta { font-size: 12px; color: #9ca3af; display: flex; gap: 8px; flex-wrap: wrap; }
  .wd-lst-chevron { margin-left: auto; font-size: 20px; color: #d1d5db; flex-shrink: 0; }
  .wd-section-label {
    font-size: 11px; font-weight: 800; color: #9ca3af; letter-spacing: .06em;
    text-transform: uppercase; margin: 18px 0 10px;
  }
  .wd-section-label:first-child { margin-top: 0; }

  /* ── DETAIL ── */
  .wd-detail { background: #f2f2f2; min-height: 100vh; }
  .wd-detail-nav { background: #fff; border-bottom: 1.5px solid #e5e7eb; padding: 12px 0; }
  .wd-detail-wrap {
    max-width: 1000px; margin: 0 auto; padding: 20px 20px 60px;
    display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start;
  }
  .wd-detail-gallery { background: #fff; border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
  .wd-detail-main { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
  .wd-detail-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wd-detail-thumbs { display: flex; gap: 6px; padding: 10px 12px; background: #fafafa; overflow-x: auto; }
  .wd-detail-thumb { width: 72px; height: 54px; flex-shrink: 0; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; }
  .wd-detail-thumb.on { border-color: #e8410a; }
  .wd-detail-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .wd-info-card { background: #fff; border-radius: 14px; padding: 20px 22px; margin-bottom: 14px; }
  .wd-info-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
  .wd-info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .wd-info-row:last-child { border-bottom: none; padding-bottom: 0; }
  .wd-info-row dt { color: #9ca3af; font-weight: 500; }
  .wd-info-row dd { margin: 0; color: #111827; font-weight: 600; text-align: right; }

  .wd-right { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 72px; }
  .wd-price-card { background: #fff; border-radius: 14px; padding: 20px; }
  .wd-price-big { font-size: 28px; font-weight: 900; color: #1a1a1a; }
  .wd-price-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }

  .wd-action-card { background: #fff; border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 9px; }
  .wd-action-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .wd-btn-full-primary {
    width: 100%; padding: 13px; background: #e8410a; border: none; border-radius: 10px;
    color: #fff; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
    box-shadow: 0 4px 14px rgba(232,65,10,.28); transition: background .15s;
  }
  .wd-btn-full-primary:hover:not(:disabled) { background: #c73208; }
  .wd-btn-full-primary:disabled { background: #fca98e; cursor: not-allowed; }
  .wd-btn-full-outline {
    width: 100%; padding: 11px; background: #fff; border: 1.5px solid #e5e7eb;
    border-radius: 10px; color: #334155; font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all .15s;
  }
  .wd-btn-full-outline:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
  .wd-btn-full-red {
    width: 100%; padding: 11px; background: #fff; border: 1.5px solid #fca5a5;
    border-radius: 10px; color: #dc2626; font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer; transition: all .15s;
  }
  .wd-btn-full-red:hover { background: #fef2f2; }
  .wd-btn-full-green {
    width: 100%; padding: 13px; background: #16a34a; border: none; border-radius: 10px;
    color: #fff; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
    transition: background .15s;
  }
  .wd-btn-full-green:hover:not(:disabled) { background: #15803d; }
  .wd-btn-full-green:disabled { background: #86efac; cursor: not-allowed; }

  .wd-confirm-row {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 9px; font-size: 13px;
  }
  .wd-confirm-row.ok { background: rgba(34,197,94,.07); border: 1px solid rgba(34,197,94,.2); }
  .wd-confirm-row.wait { background: #f9fafb; border: 1px solid #e5e7eb; }

  .wd-customer-card { background: #fff; border-radius: 14px; padding: 16px 18px; }
  .wd-customer-row { display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .wd-customer-avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    object-fit: cover; border: 2px solid #f3f4f6;
  }
  .wd-customer-fallback {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg,#e8410a,#ff7043);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 16px;
  }

  /* ── MODALS ── */
  .wd-modal-bg {
    position: fixed; inset: 0; z-index: 2100;
    background: rgba(0,0,0,.48); display: flex;
    align-items: center; justify-content: center; padding: 20px;
  }
  .wd-modal {
    background: #fff; border-radius: 18px; width: 100%; max-width: 440px;
    padding: 26px; box-shadow: 0 24px 60px rgba(0,0,0,.18);
  }
  .wd-modal-title { font-size: 18px; font-weight: 800; color: #111827; margin: 0 0 10px; }
  .wd-modal-sub { font-size: 14px; color: #6b7280; line-height: 1.55; margin: 0 0 16px; }
  .wd-modal-warn { background: rgba(239,68,68,.05); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; border: 1px solid rgba(239,68,68,.12); font-size: 13px; color: #6b7280; line-height: 1.5; }
  .wd-modal-textarea {
    width: 100%; padding: 11px 13px; border-radius: 9px; border: 1.5px solid #e5e7eb;
    font-size: 14px; line-height: 1.6; resize: vertical; outline: none;
    box-sizing: border-box; margin-bottom: 12px; font-family: inherit;
  }
  .wd-modal-textarea:focus { border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08); }
  .wd-modal-error { color: #dc2626; font-size: 13px; margin-bottom: 12px; }
  .wd-modal-btns { display: flex; gap: 10px; }
  .wd-modal-cancel {
    flex: 1; padding: 11px; border-radius: 10px; border: 1.5px solid #e5e7eb;
    background: #fff; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit;
  }
  .wd-modal-confirm {
    flex: 1; padding: 11px; border-radius: 10px; border: none;
    background: #dc2626; color: #fff; font-weight: 700; font-size: 14px;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-modal-confirm:hover:not(:disabled) { background: #b91c1c; }
  .wd-modal-confirm:disabled { opacity: .6; cursor: not-allowed; }

  /* ── RESPONSIVE ── */
  @media(max-width:900px) {
    .wd-detail-wrap { grid-template-columns: 1fr; }
    .wd-right { position: static; }
  }
  @media(max-width:720px) {
    .wd-card-actions { display: none; }
  }
  @media(max-width:540px) {
    .wd-page-tabs { flex-wrap: wrap; }
  }
`;
