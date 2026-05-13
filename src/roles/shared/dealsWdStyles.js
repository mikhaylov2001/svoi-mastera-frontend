import { PAGE_HERO_IMG_FILTER, PAGE_HERO_OVERLAY_GRADIENT, PAGE_HERO_OBJECT_POSITION, PAGE_HERO_OBJECT_FIT } from '../../constants/pageHeroAssets';

/** Эмодзи категории для строки категории в карточке сделок (md-cat). */
export const DEAL_CATEGORY_EMOJI = {
  'Ремонт квартир': '🔨',
  Сантехника: '🔧',
  Электрика: '⚡',
  'Компьютерная помощь': '💻',
  Уборка: '🧹',
  Парикмахер: '✂️',
  'Маникюр и педикюр': '💅',
  'Красота и здоровье': '✨',
  Репетиторство: '📚',
  'Грузоперевозки': '🚚',
  'Сварочные работы': '🔥',
  Другое: '📌',
};

export function dealCategoryEmoji(name) {
  if (!name || typeof name !== 'string') return '📌';
  return DEAL_CATEGORY_EMOJI[name.trim()] || '📌';
}

export function dealInitialsFromFullName(full) {
  const parts = String(full || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** NEW | IN_PROGRESS | COMPLETED | CANCELLED → new | work | done | cancel */
export function dealToUiStatus(status) {
  if (status === 'NEW') return 'new';
  if (status === 'IN_PROGRESS') return 'work';
  if (status === 'COMPLETED') return 'done';
  if (status === 'CANCELLED') return 'cancel';
  return 'new';
}

/* Shared wd-* styles: worker + customer deals pages */
export const dealsWdCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .wd-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  /* ── HERO ── */
  .wd-hero {
    position: relative; height: var(--page-hero-h-desktop); overflow: hidden;
  }
  @media(max-width:768px){ .wd-hero { height: var(--page-hero-h-mobile); } }
  .wd-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: ${PAGE_HERO_OBJECT_FIT}; object-position: ${PAGE_HERO_OBJECT_POSITION};
    filter: ${PAGE_HERO_IMG_FILTER};
  }
  .wd-hero-overlay {
    position: absolute; inset: 0;
    background: ${PAGE_HERO_OVERLAY_GRADIENT};
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

  /* ── LIST ── — см. unifiedListingCards.css: .wd-list, .wd-card, … */
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

  /* actions panel — базовые размеры в unifiedListingCards.css */
  .wd-btn-primary {
    width: 100%; background: #e8410a; border: none; border-radius: 8px;
    padding: 10px 0; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-btn-primary:hover:not(:disabled) { background: #c73208; }
  .wd-btn-primary:disabled { background: #fca98e; cursor: not-allowed; }
  .wd-card-actions .wd-btn-primary {
    min-height: 34px;
    padding: 7px 8px;
    font-size: 12px;
    border-radius: 5px;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
  .wd-btn-outline {
    width: 100%; background: #fff; border: 1px solid #d4d4d8; border-radius: 8px;
    padding: 9px 0; font-size: 12px; font-weight: 600; color: #475569;
    cursor: pointer; font-family: inherit; transition: all .15s; text-align: center; text-decoration: none; display: block;
  }
  .wd-btn-outline:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
  .wd-card-actions .wd-btn-outline {
    min-height: 34px;
    padding: 6px 8px;
    font-size: 11px;
    border-radius: 5px;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
  .wd-btn-danger {
    width: 100%; background: none; border: none; font-size: 12px;
    color: #9ca3af; cursor: pointer; font-family: inherit;
    padding: 4px 0; text-align: center; transition: color .15s;
  }
  .wd-btn-danger:hover { color: #dc2626; }
  .wd-btn-green {
    width: 100%; background: #16a34a; border: none; border-radius: 8px;
    padding: 10px 0; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-btn-green:hover:not(:disabled) { background: #15803d; }
  .wd-btn-green:disabled { background: #86efac; cursor: not-allowed; }
  .wd-card-actions .wd-btn-green {
    min-height: 34px;
    padding: 7px 8px;
    font-size: 12px;
    border-radius: 5px;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
  .wd-actions-divider { height: 1px; background: #ebebeb; margin: 2px 0; }
  .wd-done-label {
    font-size: 12px; color: #16a34a; font-weight: 700;
    text-align: center; padding: 4px 0;
  }

  /* ── EMPTY ── — unifiedListingCards.css */

  /* ── SKELETON ── */
  @keyframes wdsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .wd-sk {
    background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size: 200% 100%; animation: wdsk 1.4s infinite; border-radius: 6px;
  }

  /* ── LISTINGS TAB (карточка строки — unifiedListingCards.css) ── */
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
  .wd-detail-gallery { background: #fff; overflow: hidden; margin-bottom: 14px; }
  .wd-detail-main { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
  .wd-detail-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wd-detail-thumbs { display: flex; gap: 6px; padding: 10px 12px; background: #fafafa; overflow-x: auto; }
  .wd-detail-thumb { width: 72px; height: 54px; flex-shrink: 0; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; }
  .wd-detail-thumb.on { border-color: #e8410a; }
  .wd-detail-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .wd-info-card { background: #fff; padding: 20px 22px; margin-bottom: 14px; }
  .wd-info-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
  .wd-info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .wd-info-row:last-child { border-bottom: none; padding-bottom: 0; }
  .wd-info-row dt { color: #9ca3af; font-weight: 500; }
  .wd-info-row dd { margin: 0; color: #111827; font-weight: 600; text-align: right; }

  .wd-right { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 72px; }
  .wd-price-card { background: #fff; padding: 20px; }
  .wd-price-big { font-size: 28px; font-weight: 900; color: #1a1a1a; }
  .wd-price-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }

  .wd-action-card { background: #fff; padding: 16px 18px; display: flex; flex-direction: column; gap: 9px; }
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

  .wd-customer-card { background: #fff; padding: 16px 18px; }
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
  @media(max-width:768px) {
    .wd-hero-body {
      flex-direction: column;
      align-items: flex-start;
      padding: 0 max(14px, env(safe-area-inset-left)) 22px max(14px, env(safe-area-inset-right));
    }
    .wd-find-btn {
      white-space: normal;
      width: 100%;
      text-align: center;
      box-sizing: border-box;
      min-height: 46px;
      padding: 12px 16px;
    }
    .wd-wrap {
      padding: 0 max(12px, env(safe-area-inset-left)) 48px max(12px, env(safe-area-inset-right));
    }
    .wd-page-tabs {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      flex-wrap: wrap;
    }
    .wd-page-tab {
      flex: 1;
      justify-content: center;
      min-width: 0;
      padding: 10px 12px;
      font-size: 13px;
    }
    .wd-filters {
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding-bottom: 6px;
      gap: 8px;
    }
    .wd-filters::-webkit-scrollbar { display: none; }
    .wd-filter { flex-shrink: 0; }
    .wd-modal-bg {
      align-items: flex-end;
      padding: 0;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .wd-modal {
      max-width: 100%;
      border-radius: 20px 20px 0 0;
      max-height: min(92vh, 900px);
      overflow-y: auto;
      padding: 22px 18px max(22px, env(safe-area-inset-bottom));
      box-sizing: border-box;
    }
    .wd-modal-textarea { font-size: 16px; }
    .wd-modal-btns { flex-direction: column; gap: 10px; }
    .wd-modal-cancel, .wd-modal-confirm {
      flex: none !important;
      width: 100%;
      min-height: 48px;
    }
    .wd-detail-wrap {
      padding: 14px max(12px, env(safe-area-inset-left)) 48px max(12px, env(safe-area-inset-right));
      gap: 14px;
    }
    .wd-detail-main { aspect-ratio: 4/3; }
    .wd-detail-thumb { width: 64px; height: 48px; }
    .wd-info-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .wd-info-row dd { text-align: left; width: 100%; }
    .wd-btn-full-primary, .wd-btn-full-outline, .wd-btn-full-red, .wd-btn-full-green { min-height: 48px; }
    .wd-detail-nav .wd-detail-wrap { padding-top: 10px; padding-bottom: 10px; }
  }
  @media(max-width:720px) {
    .wd-card-actions { display: none; }
  }
  @media(max-width:540px) {
    .wd-page-tabs { flex-wrap: wrap; }
    .wd-h1 { font-size: 20px; }
  }
`;

/** Список «Мои сделки» — Lovable / md-* (hero, toolbar, сетка карточек). */
export const dealsMdListCss = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');

  .md-page { background: #f5f5f7; min-height: 100vh; font-family: 'Manrope', system-ui, sans-serif; color: #0f172a; padding-bottom: 80px; }

  .md-hero { position: relative; height: 240px; overflow: hidden; }
  @media (max-width: 768px) { .md-hero { height: 200px; } }
  .md-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .md-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,.6) 0%, rgba(0,0,0,.3) 50%, rgba(0,0,0,.15) 100%); }
  .md-hero-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 28px); height: 100%; display: flex; align-items: center; justify-content: space-between; gap: 24px; color: #fff; }
  @media (max-width: 600px) {
    .md-hero-inner { flex-direction: column; align-items: flex-start; justify-content: center; gap: 14px; }
    .md-cta { align-self: stretch; text-align: center; }
  }
  .md-hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.14); backdrop-filter: blur(12px); padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,.18); }
  .md-hero-eyebrow .pulse { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 4px rgba(74,222,128,.25); animation: md-pulse 1.5s infinite; }
  @keyframes md-pulse { 0%,100% { box-shadow: 0 0 0 4px rgba(74,222,128,.25); } 50% { box-shadow: 0 0 0 8px rgba(74,222,128,.05); } }
  .md-hero h1 { margin: 0 0 6px; font-size: 34px; font-weight: 900; letter-spacing: -0.025em; }
  .md-hero p { margin: 0; color: rgba(255,255,255,.85); font-size: 14px; }
  .md-cta { background: #e8410a; color: #fff; border: none; padding: 14px 24px; border-radius: 12px; font: inherit; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 10px 28px rgba(232,65,10,.4); transition: transform .2s; text-decoration: none; display: inline-block; text-align: center; }
  .md-cta:hover { transform: translateY(-2px); }

  .md-main { max-width: 1200px; margin: 0 auto; padding: 24px 28px; }
  .md-toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 22px; }
  .md-tabs { display: flex; gap: 4px; padding: 6px; background: #fff; border-radius: 14px; box-shadow: 0 4px 14px rgba(15,15,30,.05); flex-wrap: wrap; }
  .md-tab { background: none; border: none; padding: 10px 16px; border-radius: 10px; font: inherit; font-weight: 700; font-size: 13.5px; color: #64748b; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all .15s; }
  .md-tab.active { background: linear-gradient(135deg, #e8410a, #ff6b3d); color: #fff; box-shadow: 0 4px 12px rgba(232,65,10,.32); }
  .md-tab-count { background: rgba(0,0,0,.08); padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; }
  .md-tab.active .md-tab-count { background: rgba(255,255,255,.28); }

  .md-search { flex: 1; min-width: 220px; max-width: 380px; position: relative; }
  .md-search input { width: 100%; padding: 13px 16px 13px 44px; border: 1.5px solid #ececec; background: #fff; border-radius: 14px; font: inherit; font-size: 14px; outline: none; transition: all .2s; font-weight: 500; }
  .md-search input:focus { border-color: #e8410a; box-shadow: 0 0 0 4px rgba(232,65,10,.1); }
  .md-search svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }

  .md-sort { padding: 13px 16px; border: 1.5px solid #ececec; background: #fff; border-radius: 14px; font: inherit; font-weight: 700; font-size: 13.5px; cursor: pointer; outline: none; color: #0f172a; transition: all .2s; }
  .md-sort:hover { border-color: #e8410a; }

  .md-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  @media (max-width: 880px) { .md-grid { grid-template-columns: 1fr; } }

  .md-card { background: #fff; border: 1.5px solid #ececec; border-radius: 22px; overflow: hidden; position: relative; transition: all .3s cubic-bezier(.2,.8,.2,1); display: flex; flex-direction: column; animation: md-fade .45s both; cursor: pointer; }
  @keyframes md-fade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .md-card:hover { transform: translateY(-4px); border-color: #ffd4bf; box-shadow: 0 24px 48px -18px rgba(232,65,10,.25); }
  .md-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; opacity: 0; transition: opacity .25s; border-radius: 2px; background: linear-gradient(180deg, #e8410a, #ff8a5b); }
  .md-card:hover::before { opacity: 1; }
  .md-card.s-new::before { background: linear-gradient(180deg, #f59e0b, #fbbf24); }
  .md-card.s-work::before { background: linear-gradient(180deg, #2563eb, #60a5fa); }
  .md-card.s-done::before { background: linear-gradient(180deg, #16a34a, #4ade80); }
  .md-card.s-cancel::before { background: linear-gradient(180deg, #ef4444, #f87171); }

  .md-top { display: flex; gap: 16px; padding: 18px; }
  .md-photo { width: 120px; height: 120px; border-radius: 18px; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg, #fff5ef 0%, #ffe4d4 100%); display: flex; align-items: center; justify-content: center; position: relative; box-shadow: inset 0 0 0 1px rgba(232,65,10,.06); }
  .md-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
  .md-card:hover .md-photo img { transform: scale(1.08); }
  .md-photo .emoji { font-size: 50px; filter: drop-shadow(0 6px 12px rgba(232,65,10,.25)); line-height: 1; }

  .md-body { flex: 1; min-width: 0; }
  .md-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .md-title { margin: 0; font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.015em; line-height: 1.3; }

  .md-status { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
  .md-status .dot { width: 6px; height: 6px; border-radius: 50%; }
  .md-status.new { background: #fef3c7; color: #b45309; } .md-status.new .dot { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.18); }
  .md-status.work { background: #dbeafe; color: #1d4ed8; } .md-status.work .dot { background: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.18); }
  .md-status.done { background: #dcfce7; color: #16a34a; } .md-status.done .dot { background: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.18); }
  .md-status.cancel { background: #fee2e2; color: #b91c1c; } .md-status.cancel .dot { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.18); }

  .md-cat { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; padding: 5px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 700; background: #f1f5f9; color: #475569; }

  .md-master { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 8px 10px; background: #fafafb; border-radius: 12px; border: 1px solid #f0f0f3; }
  .md-ava { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #e8410a, #ff8a5b); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 800; flex-shrink: 0; box-shadow: 0 2px 8px rgba(232,65,10,.25); overflow: hidden; }
  .md-ava img { width: 100%; height: 100%; object-fit: cover; }
  .md-master-info { flex: 1; min-width: 0; }
  .md-master-name { font-size: 13px; font-weight: 800; color: #0f172a; }
  .md-master-role { font-size: 11px; color: #94a3b8; font-weight: 600; }
  .md-msg-mini { background: #fff; border: 1px solid #ececec; border-radius: 10px; padding: 6px 10px; font: inherit; font-size: 12px; font-weight: 700; color: #e8410a; cursor: pointer; transition: all .2s; }
  .md-msg-mini:hover { background: #fff5ef; border-color: #e8410a; }

  .md-price-row { margin-top: 14px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .md-price-num { font-size: 26px; font-weight: 900; background: linear-gradient(135deg, #e8410a, #ff6b3d); -webkit-background-clip: text; background-clip: text; color: transparent; letter-spacing: -0.025em; line-height: 1; }
  .md-price-lbl { font-size: 12px; color: #94a3b8; font-weight: 600; }

  .md-progress { padding: 18px 22px 16px; border-top: 1px dashed #ececec; background: linear-gradient(180deg, #fafafb, #fff); }
  .md-progress-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .md-progress-title { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
  .md-progress-pct { font-size: 12px; font-weight: 800; color: #0f172a; display: inline-flex; align-items: center; gap: 6px; }
  .md-progress-pct .md-pct-bar { width: 60px; height: 5px; border-radius: 999px; background: #e2e8f0; overflow: hidden; position: relative; }
  .md-progress-pct .md-pct-fill { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, #e8410a, #ff8a5b); border-radius: 999px; transition: width .6s cubic-bezier(.2,.8,.2,1); }

  .md-steps { display: flex; align-items: flex-start; gap: 0; position: relative; padding: 0 4px; }
  .md-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; }
  .md-step-dot { width: 30px; height: 30px; border-radius: 50%; background: #fff; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; transition: all .35s cubic-bezier(.2,.8,.2,1); z-index: 2; border: 2px solid #e2e8f0; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
  .md-step-dot svg { width: 14px; height: 14px; stroke-width: 3; }
  .md-step.done .md-step-dot { background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(22,163,74,.4), 0 0 0 4px rgba(22,163,74,.1); }
  .md-step.current .md-step-dot { background: linear-gradient(135deg, #e8410a, #ff6b3d); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(232,65,10,.45), 0 0 0 4px rgba(232,65,10,.12); animation: md-dot-pulse 2s infinite; }
  @keyframes md-dot-pulse { 0%,100% { box-shadow: 0 4px 14px rgba(232,65,10,.45), 0 0 0 4px rgba(232,65,10,.12); } 50% { box-shadow: 0 4px 14px rgba(232,65,10,.5), 0 0 0 9px rgba(232,65,10,0); } }
  .md-step.cancel .md-step-dot { background: linear-gradient(135deg, #ef4444, #f87171); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(239,68,68,.35); }

  .md-step-lbl { font-size: 11px; font-weight: 700; color: #94a3b8; text-align: center; line-height: 1.25; transition: color .3s; }
  .md-step.done .md-step-lbl { color: #16a34a; }
  .md-step.current .md-step-lbl { color: #0f172a; font-weight: 800; }
  .md-step.cancel .md-step-lbl { color: #b91c1c; }

  .md-step-bar { position: absolute; top: 14px; left: calc(50% + 18px); right: calc(-50% + 18px); height: 3px; background: #e8edf3; border-radius: 999px; z-index: 1; overflow: hidden; }
  .md-step-bar::after { content: ''; position: absolute; inset: 0; width: 0; background: linear-gradient(90deg, #16a34a, #22c55e); border-radius: 999px; transition: width .7s cubic-bezier(.2,.8,.2,1); }
  .md-step.done .md-step-bar::after { width: 100%; }
  .md-step.current .md-step-bar::after { width: 50%; background: linear-gradient(90deg, #e8410a, #ff8a5b); }
  .md-step.cancel .md-step-bar { background: repeating-linear-gradient(90deg, #fecaca 0 6px, transparent 6px 10px); }
  .md-step:last-child .md-step-bar { display: none; }

  .md-foot { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 12px 18px; border-top: 1px solid #f3f4f6; color: #64748b; font-size: 12.5px; font-weight: 600; }
  .md-foot-item { display: inline-flex; align-items: center; gap: 6px; }
  .md-foot-item svg { width: 14px; height: 14px; opacity: .7; }
  .md-confirm { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-weight: 800; text-align: right; }
  .md-confirm.ok { color: #16a34a; }
  .md-confirm.wait { color: #b45309; }

  .md-actions { display: flex; gap: 8px; padding: 14px 18px 18px; flex-wrap: wrap; }
  .md-btn { flex: 1; border: none; border-radius: 13px; padding: 12px 14px; font: inherit; font-weight: 800; font-size: 13.5px; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 0; }
  .md-btn-primary { background: linear-gradient(135deg, #e8410a, #ff6b3d); color: #fff; box-shadow: 0 8px 20px rgba(232,65,10,.32); }
  .md-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(232,65,10,.45); }
  .md-btn-ghost { background: #f3f4f6; color: #374151; }
  .md-btn-ghost:hover { background: #e5e7eb; color: #0f172a; }
  .md-btn-icon { flex: 0 0 auto; width: 42px; padding: 0; font-size: 15px; }
  .md-btn-review { flex: 0 0 auto; background: #fef9c3; color: #a16207; white-space: nowrap; padding-left: 14px; padding-right: 14px; }
  .md-btn-review:hover { background: #fde68a; }

  .md-empty { text-align: center; padding: 70px 20px; background: #fff; border-radius: 22px; border: 1.5px solid #ececec; }
  .md-empty-emoji { font-size: 56px; margin-bottom: 14px; }
  .md-empty-title { font-weight: 800; font-size: 19px; color: #0f172a; }
  .md-empty-sub { color: #64748b; margin-top: 6px; font-size: 14px; max-width: 360px; margin-inline: auto; }
  .md-empty .md-cta { margin-top: 18px; }

  @media (max-width: 720px) {
    .md-actions { flex-wrap: wrap; }
    .md-btn-primary { flex: 1 1 100%; }
  }
`;

/** Единый стиль карточки сделки (галерея, прогресс, сайдбар) — как в Lovable-референсе (Inter, тени, отступы). */
export const dealsDetailEdCss = `

.ed {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #fafafa;
  color: #0a0a0a;
  min-height: 100vh;
  padding: 24px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.ed :where(button, input, textarea, select) {
  font-family: inherit;
}
.ed-wrap { max-width: 1200px; margin: 0 auto; }

.ed-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #71717a;
  font-weight: 500;
  font-size: 13px;
  line-height: 1.35;
  background: #fff;
  border: 1px solid #ececef;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  margin-bottom: 20px;
  transition: color .15s, border-color .15s, background .15s;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.ed-back:hover { color: #0a0a0a; border-color: #e4e4e7; background: #fafafa; }
.ed-back svg { width: 14px; height: 14px; stroke-width: 2.5; flex-shrink: 0; }

.ed-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.ed-head-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ed-head h1 { font-size: 22px; font-weight: 600; letter-spacing: -.02em; line-height: 1.25; margin: 0; color: #0a0a0a; }
.ed-head-id { font-size: 12px; color: #a1a1aa; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1.3; }
.ed-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 6px; background: #f4f4f5; font-size: 11.5px; font-weight: 600; color: #18181b; line-height: 1.3; }
.ed-status-pill .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.ed-grid { display: grid; grid-template-columns: 1.65fr 1fr; gap: 20px; align-items: start; }
@media (max-width: 1020px) { .ed-grid { grid-template-columns: 1fr; } }
.ed-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.ed-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ececef;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04);
}
.ed-eyebrow { font-size: 11px; font-weight: 600; color: #a1a1aa; line-height: 1.4; }

.ed-gallery {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ececef;
  /* Без левого внутреннего отступа: край фото совпадает с заголовком, «назад» и карточками колонки */
  padding: 10px 10px 10px 0;
  box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04);
}
.ed-main { position: relative; aspect-ratio: 16 / 10; min-height: clamp(280px, 44vw, 520px); border-radius: 10px; overflow: hidden; background: #f4f4f5; }
.ed-main img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2,.8,.2,1); }
.ed-main-placeholder { display: flex; align-items: center; justify-content: center; font-size: 64px; color: #d4d4d8; }
.ed-floats { position: absolute; top: 14px; left: 14px; display: flex; flex-wrap: wrap; gap: 6px; z-index: 3; }
.ed-chip { backdrop-filter: blur(20px); background: rgba(255,255,255,.85); border: 1px solid rgba(0,0,0,.04); padding: 6px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #18181b; line-height: 1.25; }
.ed-chip-text { font-size: 11px; }
.ed-chip .pulse { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.2); flex-shrink: 0; }
.ed-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.95); border: 1px solid rgba(0,0,0,.04); color: #0a0a0a; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .15s; z-index: 3; box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.ed-arrow:hover { transform: translateY(-50%) scale(1.05); }
.ed-arrow.l { left: 14px; } .ed-arrow.r { right: 14px; }
.ed-arrow svg { width: 14px; height: 14px; stroke-width: 2.5; }
.ed-counter {
  position: absolute;
  bottom: 14px;
  right: 14px;
  background: rgba(0,0,0,.52);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
  z-index: 3;
  line-height: 1.25;
  letter-spacing: .02em;
}
.ed-thumbs { display: flex; gap: 6px; margin-top: 6px; }
.ed-thumb { flex: 1; aspect-ratio: 1.5; border-radius: 8px; overflow: hidden; cursor: pointer; transition: opacity .2s; opacity: .55; position: relative; }
.ed-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ed-thumb:hover { opacity: .85; }
.ed-thumb.on { opacity: 1; }
.ed-thumb.on::after { content:''; position:absolute; inset:0; border-radius: 8px; box-shadow: inset 0 0 0 2px #0a0a0a; }

.ed-prog-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
.ed-prog-title { margin: 0; font-size: 15px; font-weight: 600; color: #0a0a0a; letter-spacing: -.01em; line-height: 1.3; }
.ed-prog-pct { font-size: 13px; color: #71717a; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1.35; }
.ed-prog-pct b { color: #0a0a0a; font-weight: 600; }
.ed-prog-cancelled { color: #dc2626; font-weight: 600; }

.ed-steps { display: flex; justify-content: space-between; position: relative; padding-top: 0; }
.ed-line-bg {
  position: absolute;
  top: 9px;
  left: 9px;
  right: 9px;
  height: 0;
  border: none;
  border-top: 1px dashed #d4d4d8;
  background: none;
  z-index: 0;
}
.ed-line-fg {
  position: absolute;
  top: 9px;
  left: 9px;
  height: 2px;
  margin-top: -.5px;
  background: #f45b31;
  transition: width .8s cubic-bezier(.2,.8,.2,1);
  border-radius: 2px;
  z-index: 1;
}
.ed-step { display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2; flex: 1; min-width: 0; }
.ed-step-dot { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #d4d4d8; transition: all .2s; flex-shrink: 0; box-sizing: border-box; }
.ed-step.done .ed-step-dot { background: #f45b31; border-color: #f45b31; }
.ed-step.done .ed-step-dot svg { width: 10px; height: 10px; color: #fff; stroke-width: 3; }
.ed-step.current .ed-step-dot { background: #fff; border: 1.5px solid #f45b31; box-shadow: 0 0 0 5px rgba(244,91,49,.12); }
.ed-step.current .ed-step-dot::after { content:''; width: 6px; height: 6px; border-radius: 50%; background: #f45b31; }
.ed-step.cancel .ed-step-dot { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
.ed-step.cancel .ed-step-dot::after { display: none !important; }
.ed-step-x { font-size: 10px; font-weight: 800; line-height: 1; }
.ed-step-lbl { font-size: 12px; font-weight: 500; color: #0a0a0a; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; line-height: 1.3; }
.ed-step.todo .ed-step-lbl { color: #a1a1aa; }
.ed-step.cancel .ed-step-lbl { color: #dc2626; }
.ed-step-time { font-size: 11px; color: #a1a1aa; text-align: center; font-weight: 400; line-height: 1.35; }

.ed-desc { margin: 0; color: #52525b; font-size: 14px; line-height: 1.65; font-weight: 400; }
.ed-rows { display: flex; flex-direction: column; margin: 10px 0 0; }
.ed-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #f4f4f5; font-size: 13.5px; line-height: 1.45; }
.ed-row:first-child { border-top: none; padding-top: 4px; }
.ed-row dt { color: #71717a; font-weight: 400; margin: 0; flex-shrink: 0; }
.ed-row dd { color: #0a0a0a; font-weight: 500; margin: 0; font-variant-numeric: tabular-nums; text-align: right; }

.ed-side { position: sticky; top: 24px; align-self: start; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 1020px) { .ed-side { position: static; } }

.ed-price-num { font-size: 40px; font-weight: 700; color: #0a0a0a; letter-spacing: -.035em; line-height: 1; margin-top: 12px; font-variant-numeric: tabular-nums; }
.ed-price-num small { font-size: 22px; margin-left: 4px; font-weight: 500; color: #71717a; }
.ed-price-sub { margin: 14px 0 0; font-size: 13px; color: #71717a; line-height: 1.55; font-weight: 400; }

.ed-callout { font-size: 13px; line-height: 1.55; padding: 12px 14px; border-radius: 10px; margin-bottom: 14px; }
.ed-callout-warn { background: #fffbeb; color: #78350f; border: 1px solid #fde68a; }
.ed-callout-muted { margin: 0; font-size: 11px; color: #78716c; line-height: 1.45; text-align: center; }

.ed-conf-rows { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.ed-conf-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; border: 1px solid #ececef; background: #fff; }
.ed-conf-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ed-conf-row.ok { background: #fff7f3; border-color: #ffd9c8; }
.ed-conf-row.ok .ed-conf-icon { background: #f45b31; color: #fff; }
.ed-conf-row.ok .ed-conf-status { color: #c2451f; }
.ed-conf-row.wait .ed-conf-icon { background: #f4f4f5; color: #a1a1aa; }
.ed-conf-icon svg { width: 16px; height: 16px; stroke-width: 2; }
.ed-conf-name { font-size: 13.5px; font-weight: 600; color: #0a0a0a; line-height: 1.35; }
.ed-conf-status { font-size: 11.5px; font-weight: 500; margin-top: 2px; color: #71717a; line-height: 1.35; }
.ed-conf-row.ok .ed-conf-status { color: #18181b; }

.ed-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.ed-btn {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 12px 18px;
  font-family: inherit;
  font-weight: 600;
  font-size: 13.5px;
  line-height: 1.35;
  cursor: pointer;
  transition: all .15s;
}
.ed-btn-confirm { background: #f45b31; color: #fff; box-shadow: 0 8px 20px -6px rgba(244,91,49,.4); }
.ed-btn-confirm:hover { background: #e04a23; }
.ed-btn-confirm:disabled { opacity: .65; cursor: not-allowed; transform: none; }
.ed-btn-cancel { background: #fff; color: #71717a; border: 1px solid #ececef; }
.ed-btn-cancel:hover { color: #ef4444; border-color: #fecaca; background: #fef2f2; }
.ed-btn-ghost { background: #fff; color: #0a0a0a; border: 1px solid #ececef; }
.ed-btn-ghost:hover { background: #fafafa; }

.ed-done-banner { text-align: center; padding: 18px; background: rgba(34,197,94,.06); border-radius: 12px; border: 1px solid rgba(34,197,94,.18); margin-bottom: 12px; }
.ed-done-emoji { font-size: 32px; margin-bottom: 4px; }
.ed-done-title { font-size: 14px; font-weight: 700; color: #0a0a0a; margin-bottom: 4px; line-height: 1.35; }
.ed-done-sub { font-size: 12px; color: #71717a; margin-bottom: 12px; line-height: 1.45; }
.ed-btn-review { width: 100%; padding: 12px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none; border-radius: 10px; color: #fff; font-size: 13px; font-weight: 700; font-family: inherit; line-height: 1.35; cursor: pointer; box-shadow: 0 4px 16px rgba(99,102,241,.28); }
.ed-btn-review:hover { filter: brightness(1.05); }
.ed-review-done { font-size: 13px; color: #16a34a; font-weight: 600; background: rgba(34,197,94,.08); border-radius: 8px; padding: 8px 12px; text-align: center; line-height: 1.4; }

.ed-cancel-banner { text-align: center; padding: 18px; background: rgba(239,68,68,.06); border-radius: 12px; border: 1px solid rgba(239,68,68,.18); margin-bottom: 8px; }
.ed-cancel-emoji { font-size: 32px; margin-bottom: 4px; }
.ed-cancel-title { font-size: 14px; font-weight: 700; color: #dc2626; margin-bottom: 4px; line-height: 1.35; }

.ed-cust-row { display: flex; align-items: center; gap: 12px; padding: 4px 0 16px; cursor: pointer; }
.ed-cust-row-static { cursor: default; }
.ed-ava { position: relative; width: 44px; height: 44px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
.ed-ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ed-ava-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #f45b31, #f97316); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; letter-spacing: -.01em; line-height: 1; }
.ed-ava-dot { position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background: #22c55e; border: 2.5px solid #fff; border-radius: 50%; }
.ed-cust-info { flex: 1; min-width: 0; }
.ed-cust-name { font-size: 14px; font-weight: 600; color: #0a0a0a; letter-spacing: -.01em; line-height: 1.35; }
.ed-cust-meta { font-size: 12px; font-weight: 400; color: #71717a; margin-top: 2px; line-height: 1.4; }
.ed-cust-arrow { color: #d4d4d8; transition: color .15s; flex-shrink: 0; }
.ed-cust-row:hover .ed-cust-arrow { color: #a1a1aa; }
.ed-cust-arrow svg { width: 16px; height: 16px; stroke-width: 2; }

.ed-msg-btn {
  width: 100%;
  background: #f45b31;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 11px;
  font-family: inherit;
  font-weight: 600;
  font-size: 13.5px;
  line-height: 1.35;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background .15s;
  box-shadow: 0 8px 20px -6px rgba(244,91,49,.4);
}
.ed-msg-btn:hover { background: #e04a23; }
.ed-msg-btn svg { width: 15px; height: 15px; stroke-width: 2; }

.ed-inline-ok { text-align: center; padding: 12px; background: #fafafa; border-radius: 10px; color: #0a0a0a; font-weight: 600; font-size: 13px; line-height: 1.4; }
.ed-inline-wait { margin-top: 10px; text-align: center; font-size: 13px; color: #16a34a; font-weight: 600; padding: 10px; background: rgba(34,197,94,.07); border-radius: 10px; line-height: 1.4; }
.ed-actions-split { margin-top: 10px; border-top: 1px solid #f4f4f5; padding-top: 10px; }

.ed-reason-box { background: rgba(239,68,68,.05); border-radius: 12px; padding: 14px 18px; border: 1px solid rgba(239,68,68,.15); }
.ed-reason-label { font-size: 12px; font-weight: 700; color: #ef4444; margin-bottom: 4px; line-height: 1.3; }
.ed-reason-text { font-size: 13px; color: #52525b; line-height: 1.55; margin: 0; }
`;

/** Страница объявления `/listings/:id` — Lovable (jd-*). */
export const listingsDetailJdCss = `
.jd * { box-sizing: border-box; }
.jd {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --jd-accent: #f04e23;
  --jd-accent-hover: #d63f18;
  --jd-accent-glow: rgba(240, 78, 35, 0.4);
  --jd-thumb-active: #ef4444;
  background: #fafafa;
  color: #0a0a0a;
  min-height: calc(100vh - 56px);
  padding: clamp(14px, 2.2vw, 28px) clamp(14px, 3vw, 36px) 40px;
  -webkit-font-smoothing: antialiased;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
}
.jd-wrap { max-width: 1180px; margin: 0 auto; }

.jd-back { display: inline-block; border: none; background: none; cursor: pointer; padding: 0; margin: 0 0 14px; font-family: inherit; font-size: 14px; font-weight: 500; color: #6b7280; text-align: left; transition: color .15s; }
.jd-back:hover { color: #111827; }
.jd-back svg { display: none; }

.jd-crumbs { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #b4b4b8; margin-bottom: 16px; flex-wrap: wrap; line-height: 1.45; }
.jd-crumbs a { color: #71717a; text-decoration: none; transition: color .15s; }
.jd-crumbs a:hover { color: #0a0a0a; }
.jd-crumbs .sep { color: #d4d4d8; user-select: none; padding: 0 2px; }
.jd-crumbs .cur { color: #0a0a0a; font-weight: 500; }

.jd-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 10px; flex-wrap: wrap; }
.jd-title { font-size: clamp(26px, 2.6vw, 34px); font-weight: 700; letter-spacing: -.035em; margin: 0; color: #111827; line-height: 1.12; }
.jd-fav { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #ececef; background: #fff; color: #71717a; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; flex-shrink: 0; }
.jd-fav:hover, .jd-fav.on { color: var(--jd-accent); border-color: #ffd4c2; background: #fff5f0; }
.jd-fav svg { width: 16px; height: 16px; stroke-width: 2; }
.jd-fav.on svg { fill: var(--jd-accent); }

.jd-fav-btn.ulc-fav-heart {
  width: 38px; height: 38px; border-radius: 10px; border: 1px solid #ececef; background: #fff; color: #71717a;
  box-shadow: none; padding: 0; display: flex; align-items: center; justify-content: center;
}
.jd-fav-btn.ulc-fav-heart:hover,
.jd-fav-btn.ulc-fav-heart--on { color: var(--jd-accent); border-color: #ffd4c2; background: #fff5f0; }
.jd-fav-btn.ulc-fav-heart svg { width: 16px; height: 16px; }

.jd-meta-lw { display: flex; flex-wrap: wrap; align-items: center; column-gap: 24px; row-gap: 8px; margin-bottom: 22px; font-size: 14px; font-weight: 400; color: #6b7280; line-height: 1.5; }
.jd-meta-item { display: inline-flex; align-items: center; gap: 10px; max-width: 100%; }
.jd-meta-ico { width: 15px; height: 15px; color: #9ca3af; flex-shrink: 0; }
.jd-meta-item span:last-child { min-width: 0; word-break: break-word; color: #6b7280; }

.jd-grid { display: grid; grid-template-columns: minmax(0, 1.86fr) minmax(0, 1fr); gap: 24px; align-items: start; }
@media (max-width: 1020px) { .jd-grid { grid-template-columns: 1fr; } }
.jd-col { display: flex; flex-direction: column; gap: 18px; min-width: 0; }

.jd-card { background: #fff; border-radius: 16px; border: 1px solid #e8e8ec; padding: 20px 22px; box-shadow: 0 2px 8px rgba(0,0,0,.04), 0 12px 40px rgba(0,0,0,.05); }
.jd-card--soft { box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 6px 24px rgba(0,0,0,.045); }
.jd-eyebrow { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .1em; }
.jd-h2-card { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 2px; letter-spacing: -.02em; line-height: 1.25; }

.jd-gallery { background: #fff; border-radius: 16px; border: 1px solid #e8e8ec; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.04), 0 12px 40px rgba(0,0,0,.05); }
.jd-main { position: relative; aspect-ratio: 16 / 10; min-height: clamp(280px, 44vw, 480px); border-radius: 14px; overflow: hidden; background: #f4f4f5; cursor: pointer; }
.jd-main img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2,.8,.2,1); }
.jd-main-ph { display: flex; align-items: center; justify-content: center; font-size: 64px; color: #d4d4d8; width: 100%; height: 100%; }
.jd-img-tools { position: absolute; bottom: 14px; left: 14px; z-index: 4; display: flex; align-items: center; gap: 8px; }
.jd-img-tool { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #e5e7eb; background: rgba(255,255,255,.96); color: #4b5563; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 2px 10px rgba(0,0,0,.12); transition: background .15s, transform .15s; flex-shrink: 0; }
.jd-img-tool:hover { background: #fff; transform: scale(1.04); }
.jd-img-tool svg { width: 15px; height: 15px; }
.jd-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: #fff; border: 1px solid rgba(0,0,0,.06); color: #111827; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .15s; z-index: 3; box-shadow: 0 4px 14px rgba(0,0,0,.1); }
.jd-arrow:hover { transform: translateY(-50%) scale(1.05); }
.jd-arrow.l { left: 14px; } .jd-arrow.r { right: 14px; }
.jd-arrow svg { width: 15px; height: 15px; stroke-width: 2.25; }
.jd-counter { position: absolute; bottom: 14px; right: 14px; backdrop-filter: blur(20px); background: rgba(255,255,255,.85); color: #18181b; font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 999px; font-variant-numeric: tabular-nums; z-index: 3; }
.jd-thumbs { display: flex; gap: 10px; margin-top: 10px; padding: 4px 0; overflow-x: auto; flex-wrap: nowrap; scrollbar-width: thin; }
.jd-thumbs::-webkit-scrollbar { height: 4px; }
.jd-thumbs::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 4px; }
.jd-thumb { width: 64px; height: 64px; flex: 0 0 auto; border-radius: 8px; overflow: hidden; cursor: pointer; transition: opacity .2s; opacity: .5; position: relative; background: #f4f4f5; }
.jd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.jd-thumb:hover { opacity: .82; }
.jd-thumb.on { opacity: 1; }
.jd-thumb.on::after { content:''; position:absolute; inset:0; border-radius: 8px; box-shadow: inset 0 0 0 3px var(--jd-thumb-active); }

.jd-desc { margin: 14px 0 0; color: #3f3f46; font-size: 15px; line-height: 1.75; font-weight: 400; white-space: pre-wrap; word-break: break-word; }
.jd-desc-toggle { margin-top: 10px; background: none; border: none; color: var(--jd-accent); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; }
.jd-desc-toggle:hover { opacity: .85; }
.jd-empty-desc { font-size: 15px; color: #a1a1aa; font-style: italic; margin: 14px 0 0; }

.jd-rows { display: flex; flex-direction: column; margin: 10px 0 0; }
.jd-row2 { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-top: 1px solid #f4f4f5; font-size: 13.5px; gap: 16px; }
.jd-row2:first-child { border-top: none; padding-top: 4px; }
.jd-row2 .k { color: #71717a; font-weight: 400; }
.jd-row2 .v { color: #0a0a0a; font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }

.jd-urgency-line { margin-top: 14px; font-size: 13.5px; color: #52525b; line-height: 1.6; }
.jd-urgency-line strong { color: #374151; font-weight: 600; }
.jd-urgency-ico { margin-right: 6px; }

.jd-side { position: sticky; top: 72px; align-self: start; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 1020px) { .jd-side { position: static; } }

.jd-price-num { font-size: 36px; font-weight: 700; color: #0a0a0a; letter-spacing: -.035em; line-height: 1.05; margin-top: 12px; font-variant-numeric: tabular-nums; }
.jd-price-num .jd-price-rub { font-size: 0.92em; font-weight: 700; color: #111827; margin-left: 2px; }
.jd-price-plain { font-size: 26px; font-weight: 700; color: #0a0a0a; letter-spacing: -.02em; line-height: 1.2; margin-top: 12px; }
.jd-price-sub { margin: 10px 0 0; font-size: 13px; color: #71717a; line-height: 1.55; font-weight: 400; }

.jd-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
.jd-btn { width: 100%; border: none; border-radius: 14px; padding: 15px 20px; font-family: inherit; font-weight: 600; font-size: 15px; cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; box-sizing: border-box; }
.jd-btn-primary { background: var(--jd-accent); color: #fff; box-shadow: 0 10px 28px -8px var(--jd-accent-glow); }
.jd-btn-primary:hover { background: var(--jd-accent-hover); transform: translateY(-1px); }
.jd-btn-primary:disabled { opacity: .65; cursor: not-allowed; transform: none; }
.jd-btn-ghost { background: #fff; color: #0a0a0a; border: 1px solid #ececef; }
.jd-btn-ghost:hover { background: #fafafa; border-color: #d4d4d8; }
.jd-btn svg { width: 15px; height: 15px; stroke-width: 2; }

.jd-banner-ok { background: linear-gradient(135deg,#f0fdf4,#dcfce7); border: 1px solid #86efac; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #15803d; font-weight: 600; margin-bottom: 8px; line-height: 1.4; }
.jd-banner-info { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 14px; font-size: 12.5px; color: #92400e; line-height: 1.55; margin-bottom: 8px; }
.jd-error { font-size: 12px; color: #ef4444; font-weight: 600; padding: 4px 0; }
.jd-link-deals { display: block; text-align: center; font-size: 13px; color: var(--jd-accent); font-weight: 600; background: none; border: none; cursor: pointer; font-family: inherit; padding: 8px 0 0; }
.jd-link-deals:hover { text-decoration: underline; }

.jd-cust-row { display: flex; align-items: center; gap: 12px; padding: 4px 0 14px; text-decoration: none; color: inherit; cursor: pointer; }
.jd-cust-row-static { cursor: default; }
.jd-ava { position: relative; width: 48px; height: 48px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
.jd-ava--round { border-radius: 50%; }
.jd-ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
.jd-ava-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #f45b31, #f97316); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; letter-spacing: -.01em; }
.jd-ava-fallback--neutral { background: #e4e4e8; color: #52525b; font-weight: 700; }
.jd-ava-dot { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #22c55e; border: 2.5px solid #fff; border-radius: 50%; }
.jd-cust-info { flex: 1; min-width: 0; }
.jd-cust-name { font-size: 15px; font-weight: 600; color: #0a0a0a; letter-spacing: -.01em; }
.jd-cust-meta { font-size: 12px; font-weight: 400; color: #71717a; margin-top: 2px; }
.jd-cust-meta .green { color: #22c55e; font-weight: 500; }
.jd-cust-chevron { color: #d4d4d8; font-size: 18px; flex-shrink: 0; margin-left: auto; }

.jd-rating-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; padding: 12px 0 0; margin-top: 4px; border-top: 1px solid #f4f4f5; font-size: 13px; }
.jd-stars { letter-spacing: 1px; font-size: 15px; line-height: 1; }
.jd-stars-fill { color: var(--jd-accent); }
.jd-stars-empty { color: #d1d5db; }
.jd-rating-num { color: #0a0a0a; font-weight: 700; font-variant-numeric: tabular-nums; }
.jd-rating-sub { color: #71717a; font-size: 12.5px; font-weight: 500; }

.jd-own-banner { margin-top: 14px; padding: 12px 14px; background: #f4f4f5; border-radius: 12px; font-size: 13px; color: #52525b; line-height: 1.5; border: 1px solid #ececef; }
.jd-own-banner strong { color: #0a0a0a; font-weight: 600; }

.jd-similar { background: #fff; border-radius: 14px; border: 1px solid #e8e8ec; padding: 20px 22px; box-shadow: 0 2px 8px rgba(0,0,0,.04), 0 12px 40px rgba(0,0,0,.05); }
.jd-similar-head { font-size: 15px; font-weight: 700; margin: 0 0 14px; color: #0a0a0a; letter-spacing: -.02em; display: flex; align-items: center; justify-content: space-between; }
.jd-similar-head a { font-size: 12px; color: var(--jd-accent); text-decoration: none; font-weight: 600; }
.jd-similar-head a:hover { text-decoration: underline; }
.jd-similar-list { display: flex; flex-direction: column; gap: 4px; }
.jd-sim-item { display: flex; gap: 12px; text-decoration: none; color: #0a0a0a; align-items: center; padding: 10px 8px; border-radius: 10px; transition: background .15s; }
.jd-sim-item:hover { background: #fafafa; }
.jd-sim-img { width: 58px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f4f4f5; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.jd-sim-img img { width: 100%; height: 100%; object-fit: cover; }
.jd-sim-title { font-size: 13px; font-weight: 500; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; color: #52525b; }
.jd-sim-price { font-size: 13px; font-weight: 700; color: #0a0a0a; margin-top: 2px; }

.jd-own-foot { border-top: 1px solid #f4f4f5; padding: 14px 0 0; margin-top: 4px; text-align: center; }
.jd-own-link { font-size: 13px; color: var(--jd-accent); font-weight: 600; text-decoration: none; }
.jd-own-link:hover { text-decoration: underline; }

.jd-worker-stack { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #f4f4f5; }
.jd-inline-ok { text-align: center; padding: 12px; background: #fafafa; border-radius: 10px; color: #0a0a0a; font-weight: 600; font-size: 13px; line-height: 1.4; }
.jd-inline-wait { text-align: center; font-size: 13px; color: #16a34a; font-weight: 600; padding: 10px; background: rgba(34,197,94,.07); border-radius: 10px; line-height: 1.4; }

@keyframes jd-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.jd-skel { background: linear-gradient(90deg,#f4f4f4 25%,#eaeaea 50%,#f4f4f4 75%); background-size: 200% 100%; animation: jd-shimmer 1.2s infinite; border-radius: 12px; }

@media (max-width: 768px) {
  .jd { padding: 16px max(12px, env(safe-area-inset-left)) 40px max(12px, env(safe-area-inset-right)); width: 100%; max-width: 100%; margin-left: 0; margin-right: 0; }
  .jd-title { font-size: 22px; }
  .jd-btn, .jd-btn-ghost { min-height: 48px; }
}
`;

export const listingDetailLightboxCss = `
.jd-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.95); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.jd-lightbox-img-wrap { position: relative; max-width: 92vw; max-height: 92vh; display: flex; align-items: center; justify-content: center; }
.jd-lightbox img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 6px; display: block; image-rendering: -webkit-optimize-contrast; box-shadow: 0 24px 80px rgba(0,0,0,.6); }
.jd-lb-zone { position: absolute; top: 0; bottom: 0; width: 50%; cursor: pointer; z-index: 2; }
.jd-lb-zone-prev { left: -60px; width: calc(50% + 60px); }
.jd-lb-zone-next { right: -60px; width: calc(50% + 60px); }
.jd-lb-close { position: fixed; top: 20px; right: 20px; background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.2); border-radius: 10px; width: 42px; height: 42px; color: #fff; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; z-index: 10; font-weight: 300; border: none; font-family: inherit; }
.jd-lb-close:hover { background: rgba(255,255,255,.2); }
.jd-lb-nav { position: fixed; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.18); border-radius: 50%; width: 52px; height: 52px; color: #fff; font-size: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, transform .15s; z-index: 10; line-height: 1; border: none; font-family: inherit; }
.jd-lb-nav:hover { background: rgba(255,255,255,.2); transform: translateY(-50%) scale(1.06); }
.jd-lb-prev { left: 20px; }
.jd-lb-next { right: 20px; }
.jd-lb-counter { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.7); font-size: 14px; font-weight: 600; background: rgba(255,255,255,.1); padding: 5px 16px; border-radius: 20px; z-index: 10; }
.jd-lb-hint { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.35); font-size: 12px; white-space: nowrap; pointer-events: none; }
`;

