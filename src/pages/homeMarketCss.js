export const HOME_MARKET_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
    .av-page { font-family: Manrope, Arial, sans-serif; background: #f4f4f4; min-height: 100vh; }

    /* ── ПОИСК ── */
    .av-search-bar { background: #fff; border-bottom: 1px solid #e8e8e8; padding: 12px 0; }
    .av-search-wrap { max-width: 1200px; margin: 0 auto; padding: 0 16px; display: flex; gap: 10px; align-items: center; }
    .av-search-box { flex: 1; display: flex; align-items: center; gap: 10px; background: #f4f4f4; border: 2px solid transparent; border-radius: 8px; padding: 0 14px; transition: all .15s; }
    .av-search-box:focus-within { background: #fff; border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08); }
    .av-search-box input { flex: 1; border: none; background: none; font-size: 15px; padding: 12px 0; outline: none; font-family: Manrope, Arial, sans-serif; color: #1a1a1a; }
    .av-search-box input::placeholder { color: #aaa; }
    .av-search-btn { background: #e8410a; border: none; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 800; padding: 12px 28px; cursor: pointer; font-family: Manrope, Arial, sans-serif; flex-shrink: 0; transition: background .15s; }
    .av-search-btn:hover { background: #d03a09; }
    .av-location { display: flex; align-items: center; gap: 5px; font-size: 14px; color: #333; font-weight: 600; white-space: nowrap; cursor: pointer; }

    /* ── BODY ── */
    .av-body { max-width: 1200px; margin: 0 auto; padding: 20px 16px 60px; display: grid; grid-template-columns: 1fr 296px; gap: 20px; align-items: flex-start; }
    .av-body.av-body-worker-feed {
      display: block;
      max-width: 960px;
      padding: 20px 16px 60px;
    }

    /* ── КАТЕГОРИИ ── */
    .av-cats-block { background: #fff; border-radius: 16px; overflow: hidden; margin-bottom: 16px; border: 1px solid #ebebeb; box-shadow: 0 4px 20px rgba(0,0,0,.04); }
    .av-cats-hdr { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 0; }
    .av-cats-hdr-title { font-size: 18px; font-weight: 800; color: #1a1a1a; }
    .av-cats-hdr-link { font-size: 13px; color: #e8410a; text-decoration: none; font-weight: 600; }
    .av-cats-hdr-link:hover { text-decoration: underline; }
    .av-cats-scroll { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; padding: 8px 6px 6px; }
    .av-cat-item { display: flex; flex-direction: column; align-items: center; gap: 0; text-decoration: none; color: #1a1a1a; padding: 6px 4px; border-radius: 10px; transition: background .15s; cursor: pointer; }
    .av-cat-item:hover { background: #fff3f0; }
    .av-cat-photo { width: 100%; aspect-ratio: 3/2; border-radius: 8px; overflow: hidden; position: relative; margin-bottom: 6px; }
    .av-cat-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
    .av-cat-item:hover .av-cat-photo img { transform: scale(1.06); }
    .av-cat-photo-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #2a1a00, #e8410a); display: flex; align-items: center; justify-content: center; font-size: 28px; }
    .av-cat-name { font-size: 11px; font-weight: 700; text-align: center; line-height: 1.2; color: #1a1a1a; }

    /* ── ОБЪЯВЛЕНИЯ ── */
    .av-recs-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .av-recs-hdr--solo { justify-content: flex-start; }
    .av-recs-title { font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0; }
    .av-recs-link { font-size: 13px; color: #e8410a; text-decoration: none; font-weight: 600; }
    .av-recs-link:hover { text-decoration: underline; }
    .av-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .av-card { background: #fff; border-radius: 10px; overflow: hidden; text-decoration: none; color: #1a1a1a; display: flex; flex-direction: column; transition: box-shadow .18s, transform .18s; border: 1px solid #e8e8e8; }
    .av-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
    .av-card-img { aspect-ratio: 4/3; background: #f0f0f0; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #ccc; }
    .av-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
    .av-card:hover .av-card-img img { transform: scale(1.04); }
    .av-card-cat { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,.52); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .av-card-body { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .av-card-price { font-size: 17px; font-weight: 900; color: #1a1a1a; letter-spacing: -.2px; }
    .av-card-price-unit { font-size: 11px; color: #aaa; font-weight: 500; margin-left: 3px; }
    .av-card-title { font-size: 13px; color: #555; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .av-card-footer { display: flex; align-items: center; gap: 6px; margin-top: 6px; padding-top: 8px; border-top: 1px solid #f0f0f0; }
    .av-card-ava { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg,#e8410a,#ff7043); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; font-weight: 800; overflow: hidden; flex-shrink: 0; }
    .av-card-ava img { width: 100%; height: 100%; object-fit: cover; }
    .av-card-wname { font-size: 12px; color: #888; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex: 1; }
    .av-card-city { font-size: 11px; color: #bbb; white-space: nowrap; }
    .av-more-btn { width: 100%; margin-top: 14px; padding: 13px; background: #fff; border: 2px solid #e8e8e8; border-radius: 8px; font-size: 14px; font-weight: 700; color: #333; cursor: pointer; font-family: Manrope, Arial, sans-serif; transition: all .15s; }
    .av-more-btn:hover { border-color: #e8410a; color: #e8410a; }
    .av-feed-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .av-feed-row {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 14px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 10px;
      padding: 12px 14px;
      text-decoration: none;
      color: #1a1a1a;
      transition: box-shadow .18s, border-color .15s;
    }
    .av-feed-row:hover { box-shadow: 0 4px 20px rgba(0,0,0,.08); border-color: #e0e0e0; }
    .av-feed-thumb {
      width: 132px;
      min-width: 132px;
      height: 99px;
      border-radius: 8px;
      overflow: hidden;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #ccc;
    }
    .av-feed-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .av-feed-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
    .av-feed-title { font-size: 16px; font-weight: 800; color: #1a1a1a; line-height: 1.35; }
    .av-feed-meta { font-size: 13px; color: #777; display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; }
    .av-feed-side { text-align: right; min-width: 112px; display: flex; flex-direction: column; justify-content: center; gap: 4px; flex-shrink: 0; }
    .av-feed-price { font-size: 19px; font-weight: 900; color: #1a1a1a; white-space: nowrap; letter-spacing: -0.3px; }
    .av-feed-cat { font-size: 10px; font-weight: 800; color: #e8410a; text-transform: uppercase; letter-spacing: .06em; }
    .av-promo-below { margin-top: 22px; }
    .av-empty { background: #fff; border-radius: 10px; border: 2px dashed #e8e8e8; padding: 48px 24px; text-align: center; color: #aaa; }
    .av-empty-ico { font-size: 40px; margin-bottom: 10px; }
    .av-empty h3 { font-size: 15px; font-weight: 700; color: #555; margin: 0 0 6px; }
    .av-empty p { font-size: 13px; margin: 0; }

    /* ── ПРАВАЯ КОЛОНКА ── */
    .av-side { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 68px; }
    .av-widget { background: #fff; border-radius: 12px; padding: 16px; border: 1px solid #e8e8e8; }
    .av-widget-title { font-size: 12px; font-weight: 800; color: #aaa; text-transform: uppercase; letter-spacing: .07em; margin: 0 0 12px; }
    .av-nav-list { display: flex; flex-direction: column; gap: 4px; }
    .av-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; color: #1a1a1a; transition: background .15s; }
    .av-nav-item:hover { background: #f4f4f4; }
    .av-nav-item-orange { background: #e8410a; color: #fff; }
    .av-nav-item-orange:hover { background: #d03a09; }
    .av-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .av-stat-box { background: #f8f8f8; border-radius: 8px; padding: 12px 10px; text-align: center; }
    .av-stat-num { font-size: 20px; font-weight: 900; color: #e8410a; display: block; line-height: 1; }
    .av-stat-lbl { font-size: 10px; color: #aaa; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-top: 3px; display: block; }
    .av-promo {
      background: #fff;
      border-radius: 16px;
      padding: 20px 20px 18px;
      color: #1a1a1a;
      border: 1px solid #ebebeb;
      box-shadow: 0 4px 20px rgba(0,0,0,.04);
    }
    .av-promo h3 { font-size: 16px; font-weight: 800; margin: 0 0 8px; line-height: 1.35; color: #111; letter-spacing: -0.02em; }
    .av-promo p { font-size: 13px; color: #666; margin: 0 0 16px; line-height: 1.5; }
    .av-promo-btn {
      width: 100%;
      background: linear-gradient(135deg, #e03a08 0%, #e8410a 45%, #ff6b35 100%);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      padding: 12px 14px;
      cursor: pointer;
      font-family: Manrope, Arial, sans-serif;
      box-shadow: 0 4px 14px rgba(232,65,10,.35);
      transition: transform .15s, box-shadow .15s, filter .15s;
    }
    .av-promo-btn:hover { filter: brightness(1.06); box-shadow: 0 6px 20px rgba(232,65,10,.42); transform: translateY(-1px); }
    .av-promo-btn:active { transform: translateY(0); }

    /* ═══ HERO ═══ */
    .av-hero-wrap {
      background:
        radial-gradient(ellipse 70% 60% at 50% 0%, rgba(232,65,10,.22) 0%, transparent 65%),
        linear-gradient(180deg, #0f0e0d 0%, #0c0b0a 100%);
      position: relative;
      overflow: hidden;
    }
    .av-hero-grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image: radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%);
    }
    .av-hero-glow-top { position: absolute; top: -180px; left: 50%; transform: translateX(-50%); width: 1000px; height: 560px; background: radial-gradient(ellipse, rgba(232,65,10,.16) 0%, transparent 65%); pointer-events: none; }

    /* центрированный контент */
    .av-hero-inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 52px 24px 0; text-align: center; }
    .av-hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.11); border-radius: 999px; padding: 5px 14px; margin-bottom: 20px; }
    .av-hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #e8410a; animation: av-pulse-dot 2s infinite; flex-shrink: 0; }
    .av-hero-badge-text { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.55); letter-spacing: .05em; }
    .av-hero-h1 {
      font-family: Manrope, Arial, sans-serif;
      font-size: clamp(28px, 4.2vw, 50px);
      font-weight: 900;
      color: #fff;
      line-height: 1.06;
      margin: 0 0 14px;
      letter-spacing: -1.5px;
    }
    .av-hero-h1 .h1-line2 { color: #e8410a; }
    .av-hero-sub {
      font-size: 15px;
      color: rgba(255,255,255,.4);
      font-weight: 400;
      margin: 0 auto 28px;
      line-height: 1.6;
      max-width: 420px;
    }
    .av-hero-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 52px; }
    .av-hero-btn-primary {
      display: inline-flex; align-items: center; gap: 10px;
      background: #e8410a; color: #fff; border: none;
      border-radius: 12px; font-size: 15px; font-weight: 700;
      padding: 15px 32px; cursor: pointer; font-family: Manrope, Arial, sans-serif;
      box-shadow: 0 0 0 0 rgba(232,65,10,0), 0 6px 24px rgba(232,65,10,.36);
      transition: transform .18s, box-shadow .18s, filter .18s;
      letter-spacing: -.01em;
    }
    .av-hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 0 4px rgba(232,65,10,.18), 0 10px 28px rgba(232,65,10,.38); filter: brightness(1.06); }
    .av-hero-btn-primary:active { transform: translateY(0); }
    .av-hero-btn-ghost {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); border: 1px solid rgba(255,255,255,.14);
      border-radius: 12px; font-size: 15px; font-weight: 600;
      padding: 15px 28px; cursor: pointer; font-family: Manrope, Arial, sans-serif;
      transition: background .18s, border-color .18s, color .18s;
      text-decoration: none; letter-spacing: -.01em;
    }
    .av-hero-btn-ghost:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.24); color: #fff; }

    /* trust bar */
    .av-hero-trust {
      position: relative; z-index: 1;
      border-top: 1px solid rgba(255,255,255,.08);
      display: flex; justify-content: center;
    }
    .av-hero-trust-inner {
      max-width: 1200px; width: 100%; margin: 0 auto;
      padding: 0 24px;
      display: grid; grid-template-columns: repeat(4, 1fr);
    }
    .av-trust-item {
      padding: 22px 16px;
      text-align: center;
      border-right: 1px solid rgba(255,255,255,.07);
    }
    .av-trust-item:last-child { border-right: none; }
    .av-trust-val { font-size: 22px; font-weight: 800; color: #fff; line-height: 1; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; display: block; }
    .av-trust-lbl { font-size: 11px; color: rgba(255,255,255,.38); font-weight: 600; margin-top: 6px; display: block; text-transform: uppercase; letter-spacing: .07em; }

    @keyframes av-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }

    @media(max-width:960px) { .av-body { grid-template-columns: 1fr; } .av-side { position: static; } .av-hero-trust-inner { grid-template-columns: repeat(2,1fr); } .av-trust-item:nth-child(2) { border-right: none; } .av-trust-item:nth-child(1),.av-trust-item:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,.07); } }
    @media(max-width:640px) {
      .av-cats-scroll { grid-template-columns: repeat(3,1fr); }
      .av-cards-grid { grid-template-columns: repeat(2,1fr); }
      .av-hero-h1 { font-size: 38px; letter-spacing: -1.5px; }
      .av-hero-inner { padding: 56px 20px 0; }
      .av-hero-actions { margin-bottom: 48px; }
      .av-feed-row { flex-wrap: wrap; }
      .av-feed-thumb { width: 100%; min-width: 0; height: 140px; }
      .av-feed-side { width: 100%; text-align: left; flex-direction: row; justify-content: space-between; align-items: center; min-width: 0; }
    }
`;
