import {
  PAGE_HERO_IMG_FILTER,
  PAGE_HERO_OVERLAY_GRADIENT,
  PAGE_HERO_OBJECT_POSITION,
  PAGE_HERO_OBJECT_FIT,
} from '../../constants/pageHeroAssets';

/** Общие стили хаба категорий и поиска (Найти мастера / Найти работу). */
export const findCatalogPageCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .fmp-page {
    background: #f2f2f2;
    min-height: 100vh;
    font-family: Inter, Arial, sans-serif;
    color: #1a1a1a;
  }

  /* ══ HERO — главная ══ */
  .fmp-hero {
    position: relative;
    height: var(--page-hero-h-desktop);
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }
  .fmp-hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: ${PAGE_HERO_OBJECT_FIT};
    object-position: ${PAGE_HERO_OBJECT_POSITION};
    filter: ${PAGE_HERO_IMG_FILTER};
    transition: opacity .4s ease;
  }
  .fmp-hero-overlay {
    position: absolute;
    inset: 0;
    background: ${PAGE_HERO_OVERLAY_GRADIENT};
  }
  .fmp-hero-body {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px 36px;
    width: 100%;
  }
  .fmp-hero h1 {
    font-size: clamp(24px, 4vw, 38px);
    font-weight: 900;
    color: #fff;
    margin: 0 0 6px;
    letter-spacing: -.4px;
    line-height: 1.15;
  }
  .fmp-hero-sub {
    font-size: 14px;
    color: rgba(255,255,255,.7);
    margin: 0 0 18px;
  }
  .fmp-hero-stats {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  .fmp-hero-stat {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.2);
    backdrop-filter: blur(6px);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    color: rgba(255,255,255,.9);
  }
  .fmp-hero-stat-val {
    font-weight: 900;
    font-size: 15px;
    color: #fff;
  }

  /* ══ СЕКЦИЯ КАТЕГОРИЙ ══ */
  .fmp-cats-wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 24px 60px;
  }
  /* ══ Глобальный поиск (?q=) на главной каталога ══ */
  .fmp-global-search {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px 12px;
  }
  .fmp-global-search-panel {
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 20px;
    padding: 22px 22px 20px;
    box-shadow: 0 10px 36px rgba(15, 23, 42, 0.06);
  }
  .fmp-global-search-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }
  .fmp-global-search-head {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .fmp-global-search-kicker {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #e8410a;
  }
  .fmp-global-search-title {
    font-size: clamp(18px, 2.2vw, 22px);
    font-weight: 900;
    color: #1a1a1a;
    margin: 0;
    letter-spacing: -.02em;
    line-height: 1.25;
  }
  .fmp-global-search-query {
    color: #e8410a;
  }
  .fmp-global-search-count {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 4px 10px;
    border-radius: 999px;
    background: #fff5f0;
    color: #c2410c;
    font-size: 12px;
    font-weight: 700;
  }
  .fmp-global-search-clear {
    border: 1px solid #e8e8e8;
    background: #fff;
    border-radius: 10px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: #555;
    font-family: inherit;
    transition: border-color .15s, color .15s, background .15s;
    flex-shrink: 0;
  }
  .fmp-global-search-clear:hover {
    border-color: #e8410a;
    color: #e8410a;
    background: #fff8f5;
  }
  .fmp-global-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }
  .fmp-global-grid--few {
    grid-template-columns: repeat(auto-fit, minmax(280px, 360px));
    justify-content: center;
  }
  .fmp-global-empty {
    text-align: center;
    padding: 36px 24px 32px;
    color: #666;
    background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
    border-radius: 16px;
    border: 1.5px dashed #e5e7eb;
  }
  .fmp-global-empty-ico {
    font-size: 42px;
    margin-bottom: 12px;
    line-height: 1;
  }
  .fmp-global-empty-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 800;
    color: #1a1a1a;
  }
  .fmp-global-empty-sub {
    margin: 0 auto;
    max-width: 420px;
    font-size: 14px;
    line-height: 1.55;
    color: #777;
  }
  .fmp-global-empty-cats {
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid #f0f0f0;
  }
  .fmp-global-empty-cats-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: #888;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .fmp-global-empty-cat-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .fmp-global-empty-cat {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid #e8e8e8;
    color: #333;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: border-color .15s, color .15s, background .15s;
  }
  .fmp-global-empty-cat span {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: #fff5f0;
    color: #e8410a;
    font-size: 11px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .fmp-global-empty-cat:hover {
    border-color: #e8410a;
    color: #e8410a;
    background: #fff8f5;
  }
  .fmp-gcard {
    background: #fff;
    border: 1.5px solid #ececec;
    border-radius: 18px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    transition: border-color .2s, box-shadow .2s, transform .2s;
  }
  .fmp-gcard:hover {
    border-color: rgba(232, 65, 10, 0.35);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.1);
    transform: translateY(-2px);
  }
  .fmp-gcard-photo {
    aspect-ratio: 4/3;
    background: #f0f0f0;
    position: relative;
    overflow: hidden;
  }
  .fmp-gcard-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .35s ease;
  }
  .fmp-gcard:hover .fmp-gcard-photo img {
    transform: scale(1.04);
  }
  .fmp-gcard-tag {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(4px);
    color: #e8410a;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .04em;
    padding: 4px 8px;
    border-radius: 6px;
  }
  .fmp-gcard-open {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 2;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(255,255,255,.94);
    color: #e8410a;
    font-size: 12px;
    font-weight: 800;
    text-align: center;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity .2s, transform .2s;
  }
  .fmp-gcard:hover .fmp-gcard-open {
    opacity: 1;
    transform: translateY(0);
  }
  .fmp-gcard-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .fmp-gcard-price-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .fmp-gcard-price {
    font-size: 18px;
    font-weight: 900;
    color: #1a1a1a;
    line-height: 1;
  }
  .fmp-gcard-price-unit {
    font-size: 12px;
    color: #888;
    font-weight: 600;
  }
  .fmp-gcard-title {
    font-size: 16px;
    font-weight: 800;
    line-height: 1.3;
    color: #111;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fmp-gcard-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    font-size: 12px;
    color: #777;
    margin-top: auto;
    padding-top: 4px;
  }
  .fmp-gcard-worker {
    font-weight: 700;
    color: #444;
  }
  .fmp-gcard-rating {
    color: #b45309;
    font-weight: 700;
  }
  .fmp-gcard-city {
    color: #888;
  }

  .fmp-catalog-warn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fff8f0;
    border: 1px solid #fde68a;
    color: #92400e;
    font-size: 13px;
    font-weight: 600;
  }
  .fmp-catalog-warn button {
    flex-shrink: 0;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid #e8410a;
    background: #fff;
    color: #e8410a;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }
  .fmp-catalog-warn button:hover { background: #fff5f0; }

  .fmp-cats-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #888;
    margin-bottom: 16px;
  }
  .fmp-cats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }

  /* Карточка категории — как .fw2-cat-card на «Найти работу» */
  .fmp-cat-card {
    background: #fff;
    border-radius: 16px !important;
    overflow: hidden;
    color: inherit;
    display: flex;
    flex-direction: column;
    border: 1.5px solid #e8e8e8 !important;
    transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
    cursor: pointer;
    text-align: left;
    padding: 0;
    text-decoration: none;
    font-family: Inter, Arial, sans-serif;
  }
  .fmp-cat-card:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.13);
    transform: translateY(-4px) !important;
    border-color: #e8410a;
  }

  .fmp-cat-img-wrap {
    position: relative;
    height: 150px;
    overflow: hidden;
    background: #f0f0f0;
    flex-shrink: 0;
  }
  .fmp-cat-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .fmp-cat-card:hover .fmp-cat-img-wrap img { transform: scale(1.08); }
  .fmp-cat-img-ph {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52px;
  }
  .fmp-cat-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,.52);
    backdrop-filter: blur(6px);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 20px;
  }
  .fmp-cat-body {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .fmp-cat-name {
    font-size: 16px;
    font-weight: 800;
    color: #111;
    margin-bottom: 5px;
    line-height: 1.25;
  }
  .fmp-cat-desc {
    font-size: 13px;
    color: #777;
    line-height: 1.55;
    flex: 1;
    margin-bottom: 14px;
  }
  .fmp-cat-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }
  .fmp-cat-count { font-size: 12px; color: #e8410a; font-weight: 700; }
  .fmp-cat-count-none { font-size: 12px; color: #aaa; }
  .fmp-cat-go {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #999;
    flex-shrink: 0;
    transition: background .2s, color .2s;
  }
  .fmp-cat-card:hover .fmp-cat-go { background: #e8410a; color: #fff; }

  /* ══ ПОИСК-БАР (страница категории) ══ */
  .fmp-topbar {
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    padding: 14px 0;
  }
  .fmp-topbar-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .fmp-search-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    padding: 0 14px;
    transition: border-color .15s;
    background: #fff;
  }
  .fmp-search-wrap:focus-within { border-color: #e8410a; }
  .fmp-search-wrap input {
    flex: 1;
    border: none;
    background: none;
    font-size: 14px;
    padding: 11px 0;
    outline: none;
    font-family: Inter, sans-serif;
    color: #1a1a1a;
  }
  .fmp-search-wrap input::placeholder { color: #bbb; }
  .fmp-topbar-btn {
    background: #e8410a;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    padding: 11px 22px;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .fmp-topbar-btn:hover { background: #c73208; }

  .fmp-search-dd-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .fmp-search-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12);
    max-height: min(400px, 65vh);
    overflow-y: auto;
    z-index: 100;
  }
  .fmp-search-hint {
    padding: 14px;
    font-size: 13px;
    color: #777;
    line-height: 1.45;
  }
  .fmp-search-hit {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    text-decoration: none;
    color: inherit;
    border-top: 1px solid #f0f0f0;
    transition: background 0.12s;
  }
  .fmp-search-hit:first-of-type { border-top: none; }
  .fmp-search-hit:hover { background: #fafafa; }
  .fmp-search-hit-ph {
    width: 46px;
    height: 46px;
    border-radius: 8px;
    overflow: hidden;
    background: #f0f0f0;
    flex-shrink: 0;
  }
  .fmp-search-hit-ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .fmp-search-hit-ph span {
    font-size: 9px;
    font-weight: 600;
    color: #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2px;
  }
  .fmp-search-hit-body { flex: 1; min-width: 0; }
  .fmp-search-hit-title {
    font-size: 13px;
    font-weight: 700;
    color: #111;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fmp-search-hit-meta {
    font-size: 11px;
    color: #888;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fmp-search-hit-price { font-size: 12px; font-weight: 800; color: #1a1a1a; margin-top: 3px; }
  .fmp-search-footer {
    display: block;
    width: 100%;
    padding: 11px 12px;
    border: none;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
    font-family: Inter, sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #e8410a;
    cursor: pointer;
    text-align: center;
  }
  .fmp-search-footer:hover { background: #fff5f0; }

  /* Хлебные крошки */
  .fmp-breadcrumb {
    max-width: 1180px;
    margin: 0 auto;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #999;
  }
  .fmp-breadcrumb a { color: #999; text-decoration: none; transition: color .15s; }
  .fmp-breadcrumb a:hover { color: #e8410a; }
  .fmp-breadcrumb-sep { color: #ccc; }
  .fmp-breadcrumb-cur { color: #1a1a1a; font-weight: 600; }

  /* ══ LAYOUT КАТЕГОРИИ (сайдбар + карточки) ══ */
  .fmp-cat-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 20px 24px 60px;
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 20px;
    align-items: flex-start;
  }

  /* ══ САЙДБАР ══ */
  .fmp-sidebar {
    position: sticky;
    top: 76px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Карточка категории в сайдбаре с фото */
  .fmp-sb-cat {
    overflow: hidden;
    background: #fff;
  }
  .fmp-sb-cat-photo {
    position: relative;
    height: 110px;
    overflow: hidden;
    background: #1a1a2e;
  }
  .fmp-sb-cat-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(.6) saturate(1.1);
  }
  .fmp-sb-cat-photo-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(170deg, transparent 40%, rgba(0,0,0,.7) 100%);
    display: flex;
    align-items: flex-end;
    padding: 10px 12px;
  }
  .fmp-sb-cat-name {
    font-size: 16px;
    font-weight: 900;
    color: #fff;
    line-height: 1.2;
  }
  .fmp-sb-cat-body {
    padding: 12px 14px;
  }
  .fmp-sb-back {
    background: none;
    border: none;
    font-size: 12px;
    color: #e8410a;
    cursor: pointer;
    padding: 0;
    font-family: Inter, sans-serif;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .fmp-sb-back:hover { opacity: .75; }

  .fmp-filter-card {
    background: #fff;
    overflow: hidden;
  }
  .fmp-filter-title {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
    padding: 13px 14px 11px;
    border-bottom: 1px solid #f0f0f0;
  }
  .fmp-filter-body { padding: 12px 14px; }

  .fmp-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .fmp-price-label { font-size: 11px; color: #999; margin-bottom: 3px; }
  .fmp-price-inp {
    border: 1.5px solid #e8e8e8;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
    font-family: Inter, sans-serif;
    outline: none;
    width: 100%;
    transition: border-color .15s;
  }
  .fmp-price-inp:focus { border-color: #e8410a; }

  .fmp-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    cursor: pointer;
    font-size: 13px;
    color: #333;
    user-select: none;
    transition: color .15s;
  }
  .fmp-check-item:hover { color: #e8410a; }
  .fmp-check-box {
    width: 18px; height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all .15s;
  }
  .fmp-check-box.on { background: #e8410a; border-color: #e8410a; }
  .fmp-check-tick { color: #fff; font-size: 11px; font-weight: 700; line-height: 1; }

  .fmp-rating-opt {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    margin-bottom: 8px;
    border-radius: 10px;
    border: 1.5px solid #e8e8e8;
    background: #fafafa;
    font-size: 13px;
    font-weight: 600;
    color: #444;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }
  .fmp-rating-opt:last-child { margin-bottom: 0; }
  .fmp-rating-opt:hover { border-color: #e8410a; background: #fff8f5; }
  .fmp-rating-opt.active { border-color: #e8410a; background: #fff5f2; color: #e8410a; font-weight: 700; }
  .fmp-stars-filter { color: #f59e0b; font-size: 13px; letter-spacing: 0.5px; }

  .fmp-reset-btn {
    width: 100%;
    padding: 10px;
    background: #f5f5f5;
    border: 1.5px solid #e8e8e8;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    font-family: Inter, sans-serif;
    transition: all .15s;
  }
  .fmp-reset-btn:hover { background: #fee8e0; border-color: #e8410a; color: #e8410a; }

  /* ══ ПРАВАЯ ЧАСТЬ ══ */
  .fmp-main { min-width: 0; }

  .fmp-sort-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .fmp-sort-label { font-size: 13px; color: #888; font-weight: 600; white-space: nowrap; }
  .fmp-sort-opts { display: flex; gap: 6px; flex-wrap: wrap; }
  .fmp-sort-opt {
    padding: 7px 14px;
    border-radius: 20px;
    border: 1.5px solid #e8e8e8;
    font-size: 13px;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    background: #fff;
    font-family: Inter, sans-serif;
    transition: all .15s;
    white-space: nowrap;
  }
  .fmp-sort-opt:hover { border-color: #e8410a; color: #e8410a; }
  .fmp-sort-opt.active { border-color: #e8410a; background: #e8410a; color: #fff; }
  .fmp-result-count {
    margin-left: auto;
    font-size: 13px;
    color: #888;
    font-weight: 600;
    white-space: nowrap;
    line-height: 34px;
    align-self: center;
  }
  .fmp-rating-empty { font-size: 13px; color: #9ca3af; font-weight: 600; }
  .fmp-stars--muted { opacity: 0.38; letter-spacing: 1px; color: #d1d5db; }

  .fmp-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  /* Карточка объявления: оболочка — unifiedListingCards.css (.fmp-card) */
  .fmp-card {
    cursor: default;
  }

  /* Фото → объявление */
  .fmp-card-photo {
    position: relative;
    padding-top: 62%;
    background: #f0f0f0;
    cursor: pointer;
    overflow: hidden;
    flex-shrink: 0;
  }
  .fmp-card-photo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .4s;
  }
  .fmp-card-photo:hover img { transform: scale(1.05); }
  .fmp-card-photo-ph {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #ccc;
  }
  .fmp-card-photo-ph-ico { font-size: 44px; }
  .fmp-card-photo-ph-txt { font-size: 11px; color: #bbb; font-weight: 600; }
  .fmp-card-photo-cnt {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0,0,0,.55);
    backdrop-filter: blur(2px);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
  }
  .fmp-card-photo-hover {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.2);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity .2s;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .02em;
  }
  .fmp-card-photo:hover .fmp-card-photo-hover { opacity: 1; }
  .fmp-card-photo-active {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 2;
    background: #e8410a;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  /* Мини-стрип миниатюр */
  .fmp-thumbs {
    display: flex;
    gap: 4px;
    padding: 6px 12px 0;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    overflow: hidden;
    cursor: pointer;
  }
  .fmp-thumb {
    width: 40px;
    height: 28px;
    border-radius: 4px;
    object-fit: cover;
    border: 1.5px solid #f0f0f0;
    cursor: pointer;
    transition: border-color .15s;
    flex-shrink: 0;
  }
  .fmp-thumb:hover { border-color: #e8410a; }
  .fmp-thumb-more {
    width: 40px;
    height: 28px;
    border-radius: 4px;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #888;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* Тело карточки */
  .fmp-card-body {
    padding: 12px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Мастер → профиль (как блок заказчика у мастера) */
  .fmp-card-worker {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    max-width: 100%;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    border-radius: 8px;
    padding: 2px;
    margin: -2px -2px 0;
    transition: opacity .15s;
  }
  .fmp-card-worker:hover { opacity: .85; }
  .fmp-card-worker-chev {
    color: #d1d5db;
    font-size: 18px;
    flex-shrink: 0;
    line-height: 1;
  }
  .fmp-card-ava {
    width: 26px; height: 26px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid #f0f0f0;
  }
  .fmp-card-ava-ph {
    width: 26px; height: 26px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 11px; flex-shrink: 0;
  }
  .fmp-card-worker-name { font-size: 12px; font-weight: 700; color: #333; line-height: 1.2; }
  .fmp-card-worker-sub  { font-size: 11px; color: #999; margin-top: 1px; line-height: 1.35; }
  .fmp-card-worker-sub.fmp-card-worker-sub--active {
    color: #16a34a;
    font-weight: 600;
  }

  /* Название → объявление */
  .fmp-card-title {
    font-size: 15px;
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    cursor: pointer;
    transition: color .15s;
  }
  .fmp-card-title:hover { color: #e8410a; }

  .fmp-card-desc {
    font-size: 12px;
    color: #777;
    line-height: 1.55;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .fmp-card-badges { display: flex; gap: 5px; flex-wrap: wrap; }
  .fmp-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 10px; font-weight: 700;
    padding: 2px 7px; border-radius: 4px;
    white-space: nowrap;
  }
  .fmp-badge-v { background: #e6f4ea; color: #1a7340; }
  .fmp-badge-f { background: #fff3e0; color: #b45309; }
  .fmp-badge-g { background: #ede9fe; color: #5b21b6; }

  .fmp-card-stats {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: #888; flex-wrap: wrap;
  }
  a.fmp-card-stats {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    border-radius: 8px;
    margin: 0 -4px;
    padding: 4px 6px;
    transition: background .15s;
  }
  a.fmp-card-stats:hover {
    background: rgba(232, 65, 10, 0.08);
    color: #1a1a1a;
  }
  .fmp-stars { color: #f59e0b; font-size: 11px; letter-spacing: .5px; }
  .fmp-rating-val { font-weight: 800; color: #1a1a1a; font-size: 12px; }

  .fmp-card-footer {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-top: auto;
    padding: 12px 14px 14px;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
  }
  .fmp-card-footer-pending {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
    padding: 12px 14px 14px;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
  }
  .fmp-card-price-block { width: 100%; flex-shrink: 0; }
  .fmp-card-price { font-size: 16px; font-weight: 900; color: #1a1a1a; letter-spacing: -.3px; line-height: 1; white-space: nowrap; }
  .fmp-card-price-unit { font-size: 11px; color: #999; font-weight: 400; display: block; margin-top: 2px; white-space: nowrap; }
  .fmp-card-actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    gap: 6px;
    align-items: stretch;
    min-width: 0;
  }
  /* Главная: сразу оформить сделку по объявлению */
  .fmp-btn-accept {
    flex: 1;
    min-width: 0;
    background: #e8410a;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    font-family: Inter, sans-serif;
    padding: 9px 10px;
    cursor: pointer;
    transition: background .15s, box-shadow .15s, transform .12s;
    white-space: nowrap;
    box-shadow: 0 2px 12px rgba(232,65,10,.35);
    letter-spacing: .01em;
  }
  .fmp-btn-accept:hover:not(:disabled) {
    background: #c73208;
    box-shadow: 0 4px 16px rgba(232,65,10,.4);
    transform: translateY(-1px);
  }
  .fmp-btn-accept:disabled {
    opacity: .45;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  /* Вторичная: чат */
  .fmp-btn-msg {
    flex: 1;
    min-width: 0;
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 8px;
    color: #333;
    font-size: 12px;
    font-weight: 600;
    font-family: Inter, sans-serif;
    padding: 8px 10px;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
  }
  .fmp-btn-msg:hover {
    border-color: #e8410a;
    color: #e8410a;
    background: #fff9f7;
  }
  .fmp-card-action-err {
    flex: 1 1 100%;
    font-size: 10px;
    font-weight: 600;
    color: #dc2626;
    line-height: 1.35;
    text-align: left;
    max-width: none;
    align-self: stretch;
  }
  /* Баннер «ожидает мастера» */
  .fmp-pending-banner {
    background: #fffbeb;
    border: 1.5px solid #fde68a;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 11px;
    font-weight: 600;
    color: #92400e;
    display: flex;
    flex-direction: column;
    gap: 4px;
    line-height: 1.45;
    width: 100%;
  }
  .fmp-pending-link {
    font-size: 11px;
    font-weight: 700;
    color: #e8410a;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: Inter, sans-serif;
  }
  .fmp-pending-link:hover { opacity: .75; }

  /* ══ ПУСТОЕ СОСТОЯНИЕ ══ */
  .fmp-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 72px 24px;
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #e8e8e8;
  }
  .fmp-empty-ico { font-size: 52px; margin-bottom: 14px; }
  .fmp-empty h3 { font-size: 17px; font-weight: 800; color: #1a1a1a; margin: 0 0 8px; }
  .fmp-empty p  { font-size: 14px; color: #888; line-height: 1.6; max-width: 340px; margin: 0 auto 20px; }
  .fmp-empty-btn {
    display: inline-block;
    padding: 11px 28px;
    background: #e8410a;
    color: #fff;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
    border: none;
    cursor: pointer;
    font-family: Inter, sans-serif;
  }

  /* ══ СКЕЛЕТОН ══ */
  @keyframes skel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .sk {
    background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size: 200% 100%;
    animation: skel 1.4s infinite;
    border-radius: 6px;
  }

  /* ══ АДАПТИВ ══ */
  @media(max-width: 900px) {
    .fmp-cat-page { grid-template-columns: 1fr; }
    .fmp-sidebar { position: static; }
    .fmp-list { grid-template-columns: 1fr 1fr; }
  }
  @media(max-width: 768px) {
    .fmp-hero-body {
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
      padding-bottom: 28px;
    }
    .fmp-cats-wrap {
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
    }
    .fmp-global-search {
      padding: 0 max(16px, env(safe-area-inset-right)) 8px max(16px, env(safe-area-inset-left));
    }
    .fmp-global-search-panel {
      padding: 16px;
      border-radius: 20px;
    }
    .fmp-global-search-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      margin-bottom: 14px;
    }
    .fmp-global-search-head {
      min-width: 0;
    }
    .fmp-global-search-title {
      font-size: 20px;
    }
    .fmp-global-search-clear {
      width: 100%;
      min-height: 44px;
      text-align: center;
      border-radius: 12px;
    }
    .fmp-global-grid,
    .fmp-global-grid--few {
      grid-template-columns: 1fr !important;
      gap: 12px;
    }
    .fmp-gcard {
      border-radius: 20px;
    }
    .fmp-gcard:hover {
      transform: none;
      box-shadow: none;
    }
    .fmp-gcard-photo {
      aspect-ratio: 16 / 10;
    }
    .fmp-gcard-open {
      display: none;
    }
    .fmp-gcard-fav-slot {
      display: none !important;
    }
    .fmp-gcard-body {
      padding: 14px 16px 16px;
    }
    .fmp-gcard-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .fmp-gcard-city {
      font-size: 12px;
      line-height: 1.4;
      word-break: break-word;
    }
    .jl-page.fw-jl-cat-feed .fmp-search-dropdown,
    .jl-page.fw-jl-cat-feed .fw2-search-dropdown {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      top: auto !important;
      bottom: 0 !important;
      max-height: min(70vh, calc(100dvh - 96px)) !important;
      border-radius: 20px 20px 0 0 !important;
      border-left: none !important;
      border-right: none !important;
      border-bottom: none !important;
      z-index: 1700 !important;
      box-shadow: 0 -12px 40px rgba(15, 23, 42, 0.18) !important;
      padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
      -webkit-overflow-scrolling: touch;
    }
    .jl-page.fw-jl-cat-feed .fmp-search-dropdown::before,
    .jl-page.fw-jl-cat-feed .fw2-search-dropdown::before {
      content: '';
      display: block;
      width: 36px;
      height: 4px;
      margin: 10px auto 6px;
      border-radius: 999px;
      background: #e5e7eb;
    }
    .jl-page.fw-jl-cat-feed.cat-feed-search-active .jl-crumbs,
    .jl-page.fw-jl-cat-feed.cat-feed-search-active .jl-wrap {
      display: none !important;
    }
    .jl-page.fw-jl-cat-feed.cat-feed-search-active .fmp-topbar,
    .jl-page.fw-jl-cat-feed.cat-feed-search-active .fw2-topbar {
      position: sticky;
      top: 0;
      z-index: 1800;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
    }
    .jl-page.fw-jl-cat-feed .fmp-search-hit {
      padding: 12px 16px;
      gap: 12px;
    }
    .jl-page.fw-jl-cat-feed .fmp-search-hit-ph {
      width: 52px;
      height: 52px;
      border-radius: 10px;
    }
    .jl-page.fw-jl-cat-feed .fmp-search-footer {
      padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 0px));
      font-size: 14px;
      font-weight: 700;
      border-top: 1px solid #f0f0f0;
    }
    .jl-page.fw-jl-cat-feed .jl-bigcard-fav-slot {
      display: none !important;
    }
    .fmp-list { grid-template-columns: 1fr; }
    /* Только сетка fmp-list, не карточки jl-bigcard в ленте категории */
    .fmp-list .fmp-card-actions {
      flex-direction: column;
      flex-wrap: nowrap;
      gap: 8px;
    }
    .fmp-list .fmp-btn-accept,
    .fmp-list .fmp-btn-msg {
      flex: none;
      width: 100%;
      min-height: 46px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  @media(max-width: 620px) {
    .fmp-list { grid-template-columns: 1fr; }
    .fmp-cats-grid { grid-template-columns: 1fr; gap: 12px; }
    .fmp-hero { height: var(--page-hero-h-mobile); }
  }

`;
