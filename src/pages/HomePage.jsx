import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES_BY_SECTION } from './CategoriesPage';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';
const ALL_CATS = Object.values(CATEGORIES_BY_SECTION).flat();

const CAT_PHOTOS = {
  'remont-kvartir':       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
  'santehnika':           'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
  'elektrika':            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
  'uborka':               'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80',
  'parikhmaher':          'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80',
  'manikur':              'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
  'krasota-i-zdorovie':   'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
  'repetitorstvo':        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
  'kompyuternaya-pomosh': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&display=swap');

  :root {
    --orange: #e8410a;
    --orange-light: #ff5722;
    --orange-pale: #fff3f0;
    --dark: #0d0d0d;
    --dark2: #1a1a1a;
    --gray: #f4f4f4;
    --border: #ebebeb;
    --text: #1a1a1a;
    --muted: #888;
  }

  .hp * { box-sizing: border-box; }
  .hp { font-family: 'Manrope', Arial, sans-serif; background: #f8f8f6; color: var(--text); }

  /* ══ HERO ══ */
  .hp-hero { background: var(--dark); padding: 0; overflow: hidden; position: relative; }
  .hp-hero-noise { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); opacity: .4; pointer-events: none; }
  .hp-hero-glow { position: absolute; top: -200px; right: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(232,65,10,.35) 0%, transparent 70%); pointer-events: none; }
  .hp-hero-inner { max-width: 1200px; margin: 0 auto; padding: 60px 24px 56px; display: grid; grid-template-columns: 1fr 420px; gap: 40px; align-items: center; position: relative; z-index: 1; }
  .hp-hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(232,65,10,.15); border: 1px solid rgba(232,65,10,.3); border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 800; color: #ff8055; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 20px; }
  .hp-hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff5722; animation: pulse-dot 2s infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
  .hp-hero-h1 { font-size: 52px; font-weight: 900; color: #fff; line-height: 1.08; margin: 0 0 18px; letter-spacing: -1.5px; }
  .hp-hero-h1 em { font-style: normal; color: var(--orange); }
  .hp-hero-sub { font-size: 16px; color: rgba(255,255,255,.55); line-height: 1.65; margin: 0 0 32px; max-width: 480px; }
  .hp-hero-actions { display: flex; gap: 12px; align-items: center; margin-bottom: 40px; }
  .hp-hero-btn { background: var(--orange); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 800; padding: 14px 28px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; transition: background .15s, transform .15s, box-shadow .15s; box-shadow: 0 8px 24px rgba(232,65,10,.35); }
  .hp-hero-btn:hover { background: #d03a09; transform: translateY(-1px); box-shadow: 0 12px 32px rgba(232,65,10,.45); }
  .hp-hero-btn-ghost { background: transparent; color: rgba(255,255,255,.8); border: 1.5px solid rgba(255,255,255,.2); border-radius: 12px; font-size: 15px; font-weight: 700; padding: 13px 24px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; transition: all .15s; }
  .hp-hero-btn-ghost:hover { border-color: rgba(255,255,255,.5); color: #fff; background: rgba(255,255,255,.05); }
  .hp-hero-stats { display: flex; gap: 28px; }
  .hp-hero-stat { }
  .hp-hero-stat-num { font-size: 28px; font-weight: 900; color: #fff; display: block; line-height: 1; }
  .hp-hero-stat-lbl { font-size: 11px; color: rgba(255,255,255,.45); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
  .hp-hero-stat-div { width: 1px; background: rgba(255,255,255,.1); align-self: stretch; }

  /* ── HERO КАРТОЧКА ── */
  .hp-hero-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 24px; backdrop-filter: blur(20px); }
  .hp-hero-card-title { font-size: 11px; font-weight: 800; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 16px; }
  .hp-hero-cat-list { display: flex; flex-direction: column; gap: 8px; }
  .hp-hero-cat-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07); border-radius: 10px; text-decoration: none; color: rgba(255,255,255,.85); font-size: 14px; font-weight: 600; transition: background .15s, border-color .15s; }
  .hp-hero-cat-row:hover { background: rgba(232,65,10,.15); border-color: rgba(232,65,10,.3); color: #fff; }
  .hp-hero-cat-icon { width: 32px; height: 32px; border-radius: 8px; overflow: hidden; flex-shrink: 0; position: relative; }
  .hp-hero-cat-icon img { width: 100%; height: 100%; object-fit: cover; }
  .hp-hero-cat-icon-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 16px; background: rgba(255,255,255,.08); }
  .hp-hero-cat-arr { margin-left: auto; color: rgba(255,255,255,.3); font-size: 16px; transition: color .15s, transform .15s; }
  .hp-hero-cat-row:hover .hp-hero-cat-arr { color: var(--orange); transform: translateX(3px); }
  .hp-hero-all-link { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 12px; padding: 10px; border-radius: 10px; border: 1px dashed rgba(255,255,255,.15); color: rgba(255,255,255,.45); font-size: 13px; font-weight: 600; text-decoration: none; transition: all .15s; }
  .hp-hero-all-link:hover { border-color: rgba(232,65,10,.4); color: var(--orange); }

  /* ══ ПОИСК ══ */
  .hp-search-bar { background: #fff; border-bottom: 1px solid var(--border); padding: 14px 0; position: sticky; top: 0; z-index: 100; }
  .hp-search-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; gap: 10px; }
  .hp-search-box { flex: 1; display: flex; align-items: center; gap: 10px; background: #f4f4f4; border: 2px solid transparent; border-radius: 10px; padding: 0 16px; transition: all .15s; }
  .hp-search-box:focus-within { background: #fff; border-color: var(--orange); box-shadow: 0 0 0 4px rgba(232,65,10,.08); }
  .hp-search-box input { flex: 1; border: none; background: none; font-size: 14px; padding: 11px 0; outline: none; font-family: inherit; color: var(--text); }
  .hp-search-box input::placeholder { color: #aaa; }
  .hp-search-find { background: var(--orange); border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 800; padding: 11px 22px; cursor: pointer; font-family: inherit; transition: background .15s; flex-shrink: 0; }
  .hp-search-find:hover { background: #d03a09; }
  .hp-loc { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #555; font-weight: 600; white-space: nowrap; }

  /* ══ ОСНОВНАЯ СЕТКА ══ */
  .hp-body { max-width: 1200px; margin: 0 auto; padding: 28px 24px 80px; display: grid; grid-template-columns: 1fr 300px; gap: 24px; }

  /* ══ КАТЕГОРИИ ══ */
  .hp-section-hdr { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
  .hp-section-title { font-size: 20px; font-weight: 900; letter-spacing: -.3px; margin: 0; }
  .hp-section-link { font-size: 13px; color: var(--orange); font-weight: 700; text-decoration: none; }
  .hp-section-link:hover { text-decoration: underline; }
  .hp-cats-masonry { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: 180px 180px; gap: 10px; margin-bottom: 28px; }
  .hp-cats-masonry .hp-cat-big { grid-column: span 1; grid-row: span 2; }
  .hp-cat-tile { border-radius: 14px; overflow: hidden; text-decoration: none; color: #fff; position: relative; display: flex; flex-direction: column; justify-content: flex-end; transition: transform .2s, box-shadow .2s; cursor: pointer; }
  .hp-cat-tile:hover { transform: scale(1.02); box-shadow: 0 12px 32px rgba(0,0,0,.25); }
  .hp-cat-tile-bg { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform .4s; }
  .hp-cat-tile:hover .hp-cat-tile-bg { transform: scale(1.06); }
  .hp-cat-tile-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 55%, transparent 100%); }
  .hp-cat-tile-body { position: relative; padding: 12px 14px; }
  .hp-cat-tile-name { font-size: 14px; font-weight: 800; line-height: 1.2; }
  .hp-cat-tile-count { font-size: 11px; color: rgba(255,255,255,.65); margin-top: 2px; }
  .hp-cat-tile-ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 42px; background: linear-gradient(135deg, #2a2a2a, #1a1a1a); }
  .hp-cats-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
  .hp-cat-chip { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1.5px solid var(--border); border-radius: 20px; padding: 7px 14px; text-decoration: none; font-size: 13px; font-weight: 700; color: var(--text); transition: all .15s; }
  .hp-cat-chip:hover { border-color: var(--orange); color: var(--orange); background: var(--orange-pale); }
  .hp-cat-chip span:first-child { font-size: 16px; }

  /* ══ ОБЪЯВЛЕНИЯ ══ */
  .hp-listings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .hp-card { background: #fff; border-radius: 14px; overflow: hidden; text-decoration: none; color: var(--text); transition: transform .18s, box-shadow .18s; display: flex; flex-direction: column; border: 1px solid var(--border); }
  .hp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.1); }
  .hp-card-img { aspect-ratio: 4/3; background: #f0f0f0; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; font-size: 38px; color: #ccc; }
  .hp-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; display: block; }
  .hp-card:hover .hp-card-img img { transform: scale(1.04); }
  .hp-card-tag { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 5px; letter-spacing: .03em; }
  .hp-card-body { padding: 12px 14px; flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .hp-card-price { font-size: 18px; font-weight: 900; color: var(--dark); letter-spacing: -.3px; }
  .hp-card-unit { font-size: 11px; color: var(--muted); font-weight: 500; margin-left: 3px; }
  .hp-card-title { font-size: 13px; color: #444; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .hp-card-worker { display: flex; align-items: center; gap: 6px; margin-top: 6px; padding-top: 8px; border-top: 1px solid #f4f4f4; }
  .hp-card-ava { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg,#e8410a,#ff7043); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; font-weight: 800; overflow: hidden; flex-shrink: 0; }
  .hp-card-ava img { width: 100%; height: 100%; object-fit: cover; }
  .hp-card-wname { font-size: 12px; color: var(--muted); font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .hp-card-city { font-size: 11px; color: #bbb; margin-left: auto; white-space: nowrap; }
  .hp-more-btn { width: 100%; margin-top: 14px; padding: 13px; background: #fff; border: 2px solid var(--border); border-radius: 10px; font-size: 14px; font-weight: 700; color: var(--text); cursor: pointer; font-family: inherit; transition: all .15s; }
  .hp-more-btn:hover { border-color: var(--orange); color: var(--orange); }

  /* ══ ПРАВАЯ ПАНЕЛЬ ══ */
  .hp-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 68px; }
  .hp-widget { background: #fff; border-radius: 16px; border: 1px solid var(--border); padding: 20px; }
  .hp-widget-title { font-size: 13px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; margin: 0 0 14px; }
  .hp-quick-list { display: flex; flex-direction: column; gap: 6px; }
  .hp-quick-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; transition: all .15s; font-family: inherit; border: none; cursor: pointer; }
  .hp-qi-orange { background: var(--orange); color: #fff; }
  .hp-qi-orange:hover { background: #d03a09; }
  .hp-qi-outline { background: #fff; color: var(--orange); border: 2px solid var(--orange); }
  .hp-qi-outline:hover { background: var(--orange-pale); }
  .hp-qi-gray { background: #f4f4f4; color: var(--text); }
  .hp-qi-gray:hover { background: #ebebeb; }
  .hp-stats-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hp-stat-cell { background: #f8f8f8; border-radius: 10px; padding: 14px 12px; text-align: center; }
  .hp-stat-cell-num { font-size: 24px; font-weight: 900; color: var(--orange); display: block; line-height: 1.1; }
  .hp-stat-cell-lbl { font-size: 10px; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-top: 3px; display: block; }
  .hp-promo-widget { background: linear-gradient(135deg, #0d0d0d 0%, #2a0a00 60%, #e8410a 140%); border-radius: 16px; padding: 22px; color: #fff; border: none; }
  .hp-promo-widget h3 { font-size: 16px; font-weight: 900; margin: 0 0 7px; line-height: 1.3; }
  .hp-promo-widget p { font-size: 12px; color: rgba(255,255,255,.6); margin: 0 0 16px; line-height: 1.6; }
  .hp-promo-btn { width: 100%; padding: 11px; background: #fff; border: none; border-radius: 8px; color: var(--orange); font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; transition: background .15s; }
  .hp-promo-btn:hover { background: #ffe8e0; }
  .hp-trust-list { display: flex; flex-direction: column; gap: 10px; }
  .hp-trust-item { display: flex; align-items: center; gap: 10px; }
  .hp-trust-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .hp-trust-text { font-size: 12px; font-weight: 600; color: #444; line-height: 1.4; }
  .hp-trust-sub { font-size: 11px; color: var(--muted); font-weight: 500; }

  /* ══ МАСТЕР ══ */
  .hp-worker-hero { background: var(--dark); padding: 32px 0; position: relative; overflow: hidden; }
  .hp-worker-hero::before { content: ''; position: absolute; top: -150px; right: -80px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(232,65,10,.3) 0%, transparent 70%); pointer-events: none; }
  .hp-worker-hero-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; position: relative; z-index: 1; }
  .hp-worker-hi { font-size: 28px; font-weight: 900; color: #fff; margin: 0 0 6px; letter-spacing: -.5px; }
  .hp-worker-hi em { font-style: normal; color: #ff8055; }
  .hp-worker-sub { font-size: 14px; color: rgba(255,255,255,.5); margin: 0; }
  .hp-worker-hero-btns { display: flex; gap: 10px; }
  .hp-worker-btn-fill { background: var(--orange); border: none; border-radius: 10px; color: #fff; font-size: 14px; font-weight: 800; padding: 12px 22px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 7px; font-family: inherit; transition: all .15s; box-shadow: 0 4px 16px rgba(232,65,10,.35); }
  .hp-worker-btn-fill:hover { background: #d03a09; }
  .hp-worker-btn-line { background: transparent; border: 1.5px solid rgba(255,255,255,.2); border-radius: 10px; color: rgba(255,255,255,.75); font-size: 14px; font-weight: 700; padding: 11px 20px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 7px; font-family: inherit; transition: all .15s; }
  .hp-worker-btn-line:hover { border-color: rgba(255,255,255,.5); color: #fff; }
  .hp-worker-body { max-width: 1200px; margin: 0 auto; padding: 24px 24px 80px; display: grid; grid-template-columns: 1fr 280px; gap: 24px; }
  .hp-kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .hp-kpi { background: #fff; border-radius: 14px; border: 1px solid var(--border); padding: 18px; display: flex; align-items: center; gap: 14px; transition: box-shadow .15s; }
  .hp-kpi:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }
  .hp-kpi-ico { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .hp-kpi-num { font-size: 26px; font-weight: 900; color: var(--dark); line-height: 1; }
  .hp-kpi-lbl { font-size: 12px; color: var(--muted); font-weight: 600; margin-top: 2px; }
  .hp-actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .hp-action { background: #fff; border-radius: 14px; border: 1px solid var(--border); padding: 18px 14px; text-align: center; text-decoration: none; color: var(--text); transition: all .18s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .hp-action:hover { border-color: var(--orange); box-shadow: 0 6px 20px rgba(232,65,10,.12); transform: translateY(-2px); }
  .hp-action-ico { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .hp-action-title { font-size: 13px; font-weight: 800; }
  .hp-action-sub { font-size: 11px; color: var(--muted); }
  .hp-deal-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .hp-deal { background: #fff; border-radius: 12px; border: 1px solid var(--border); padding: 14px 16px; display: flex; align-items: center; gap: 14px; text-decoration: none; color: var(--text); transition: box-shadow .15s; }
  .hp-deal:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
  .hp-deal-ico { width: 42px; height: 42px; border-radius: 10px; background: var(--orange-pale); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .hp-deal-title { font-size: 14px; font-weight: 700; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; margin-bottom: 2px; }
  .hp-deal-meta { font-size: 12px; color: var(--muted); }
  .hp-deal-badge { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 20px; flex-shrink: 0; }
  .hp-empty { background: #fff; border-radius: 14px; border: 2px dashed var(--border); padding: 48px 24px; text-align: center; color: var(--muted); margin-bottom: 24px; }
  .hp-empty-ico { font-size: 40px; margin-bottom: 12px; }
  .hp-empty h3 { font-size: 15px; font-weight: 800; color: #333; margin: 0 0 6px; }
  .hp-empty p { font-size: 13px; margin: 0 0 18px; }
  .hp-empty-link { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; background: var(--orange); color: #fff; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 800; transition: background .15s; }
  .hp-empty-link:hover { background: #d03a09; }

  /* ══ АДАПТИВ ══ */
  @media(max-width:960px) { .hp-body,.hp-worker-body { grid-template-columns: 1fr; } .hp-side,.hp-worker-side { position:static; } .hp-hero-inner { grid-template-columns: 1fr; } .hp-hero-card { display:none; } }
  @media(max-width:640px) { .hp-cats-masonry { grid-template-columns: repeat(2,1fr); grid-template-rows: 140px 140px 140px; } .hp-listings-grid { grid-template-columns: 1fr; } .hp-kpi-row { grid-template-columns: repeat(2,1fr); } .hp-actions-grid { grid-template-columns: repeat(2,1fr); } .hp-hero-h1 { font-size: 34px; } .hp-worker-hero-inner { flex-direction: column; align-items: flex-start; } }
`;

function CustomerHome({ userId, userName }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [listings, setListings] = useState([]);
  const [shown, setShown] = useState(8);

  useEffect(() => {
    fetch(`${API}/listings`).then(r => r.ok ? r.json() : [])
      .then(d => setListings(Array.isArray(d) ? d.filter(l => l.active) : [])).catch(() => {});
  }, []);

  const mainCats = ALL_CATS.slice(0, 5);
  const restCats = ALL_CATS.slice(5);

  // Masonry layout: first cat is big (spans 2 rows)
  const masonryCats = ALL_CATS.slice(0, 5);

  return (
    <div className="hp">
      <style>{css}</style>

      {/* Hero */}
      <div className="hp-hero">
        <div className="hp-hero-noise"/>
        <div className="hp-hero-glow"/>
        <div className="hp-hero-inner">
          <div>
            <div className="hp-hero-eyebrow">
              <span className="hp-hero-dot"/>
              Йошкар-Ола · Маркетплейс мастеров
            </div>
            <h1 className="hp-hero-h1">
              Свои мастера<br/>
              для <em>любых задач</em><br/>
              в Йошкар-Оле
            </h1>
            <p className="hp-hero-sub">Опишите задачу — мастера откликнутся сами. Выбирайте по рейтингу, договаривайтесь внутри сервиса.</p>
            <div className="hp-hero-actions">
              <Link to="/find-master" className="hp-hero-btn">🔍 Найти мастера</Link>
              <Link to="/categories" className="hp-hero-btn-ghost">Разместить заявку →</Link>
            </div>
            <div className="hp-hero-stats">
              {[['24/7','Приём заявок'],['9','Категорий'],['≤10 мин','Первый отклик'],['5.0★','Рейтинг']].map(([n,l],i) => (
                <React.Fragment key={l}>
                  {i > 0 && <div className="hp-hero-stat-div"/>}
                  <div className="hp-hero-stat">
                    <span className="hp-hero-stat-num">{n}</span>
                    <span className="hp-hero-stat-lbl">{l}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Hero карточка — популярные категории */}
          <div className="hp-hero-card">
            <div className="hp-hero-card-title">Популярные услуги</div>
            <div className="hp-hero-cat-list">
              {ALL_CATS.slice(0,6).map(cat => (
                <Link key={cat.slug} to={`/find-master/${cat.slug}`} className="hp-hero-cat-row">
                  <div className="hp-hero-cat-icon">
                    {CAT_PHOTOS[cat.slug]
                      ? <img src={CAT_PHOTOS[cat.slug]} alt=""/>
                      : <div className="hp-hero-cat-icon-ph">{cat.emoji||'🛠️'}</div>
                    }
                  </div>
                  {cat.name}
                  <span className="hp-hero-cat-arr">›</span>
                </Link>
              ))}
            </div>
            <Link to="/find-master" className="hp-hero-all-link">Все категории →</Link>
          </div>
        </div>
      </div>

      {/* Поиск */}
      <div className="hp-search-bar">
        <div className="hp-search-inner">
          <div className="hp-search-box">
            <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&q.trim()&&navigate(`/find-master?q=${encodeURIComponent(q)}`)} placeholder="Найдите мастера или услугу..."/>
          </div>
          <button className="hp-search-find" onClick={()=>q.trim()&&navigate(`/find-master?q=${encodeURIComponent(q)}`)}>Найти</button>
          <div className="hp-loc">📍 Йошкар-Ола</div>
        </div>
      </div>

      <div className="hp-body">
        <div>
          {/* Категории — мозаика */}
          <div className="hp-section-hdr">
            <h2 className="hp-section-title">Категории услуг</h2>
            <Link to="/find-master" className="hp-section-link">Все категории →</Link>
          </div>
          <div className="hp-cats-masonry">
            {masonryCats.map((cat, i) => (
              <Link key={cat.slug} to={`/find-master/${cat.slug}`} className={`hp-cat-tile${i===0?' hp-cat-big':''}`}>
                {CAT_PHOTOS[cat.slug]
                  ? <div className="hp-cat-tile-bg" style={{backgroundImage:`url(${CAT_PHOTOS[cat.slug]})`}}/>
                  : <div className="hp-cat-tile-ph">{cat.emoji||'🛠️'}</div>
                }
                <div className="hp-cat-tile-overlay"/>
                <div className="hp-cat-tile-body">
                  <div className="hp-cat-tile-name">{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Остальные категории — чипы */}
          <div className="hp-cats-chips">
            {restCats.map(cat => (
              <Link key={cat.slug} to={`/find-master/${cat.slug}`} className="hp-cat-chip">
                <span>{cat.emoji||'🛠️'}</span>
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Объявления */}
          <div className="hp-section-hdr">
            <h2 className="hp-section-title">Объявления мастеров</h2>
            <Link to="/find-master" className="hp-section-link">Смотреть все →</Link>
          </div>
          {listings.length === 0 ? (
            <div className="hp-empty">
              <div className="hp-empty-ico">🔍</div>
              <h3>Пока нет объявлений</h3>
              <p>Мастера скоро появятся!</p>
            </div>
          ) : (
            <>
              <div className="hp-listings-grid">
                {listings.slice(0,shown).map(l => (
                  <Link key={l.id} to={`/workers/${l.workerId}`} className="hp-card">
                    <div className="hp-card-img">
                      {l.photos?.length ? <img src={l.photos[0]} alt=""/> : '🔧'}
                      {l.category && <span className="hp-card-tag">{l.category}</span>}
                    </div>
                    <div className="hp-card-body">
                      <div className="hp-card-price">{Number(l.price).toLocaleString('ru-RU')} ₽<span className="hp-card-unit">{l.priceUnit}</span></div>
                      <div className="hp-card-title">{l.title}</div>
                      <div className="hp-card-worker">
                        <div className="hp-card-ava">
                          {l.workerAvatar?.length>10 ? <img src={l.workerAvatar} alt=""/> : (l.workerName||'М')[0]}
                        </div>
                        <span className="hp-card-wname">{[l.workerName,l.workerLastName].filter(Boolean).join(' ')||'Мастер'}</span>
                        <span className="hp-card-city">📍 ЙО</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {shown < listings.length && (
                <button className="hp-more-btn" onClick={()=>setShown(s=>s+8)}>
                  Показать ещё · осталось {listings.length-shown}
                </button>
              )}
            </>
          )}
        </div>

        {/* Правая колонка */}
        <div className="hp-side">
          <div className="hp-widget">
            <div className="hp-widget-title">Действия</div>
            <div className="hp-quick-list">
              <Link to="/find-master" className="hp-quick-item hp-qi-orange">🔍 Найти мастера</Link>
              <Link to="/categories"  className="hp-quick-item hp-qi-outline">📋 Разместить заявку</Link>
              <Link to="/deals"       className="hp-quick-item hp-qi-gray">🤝 Мои сделки</Link>
              <Link to="/chat"        className="hp-quick-item hp-qi-gray">💬 Сообщения</Link>
            </div>
          </div>

          <div className="hp-widget">
            <div className="hp-widget-title">Платформа</div>
            <div className="hp-stats-2x2">
              {[['24/7','Заявки'],['9','Категорий'],['5.0★','Рейтинг'],['≤10','Мин. отклик']].map(([n,l])=>(
                <div key={l} className="hp-stat-cell">
                  <span className="hp-stat-cell-num">{n}</span>
                  <span className="hp-stat-cell-lbl">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hp-widget">
            <div className="hp-widget-title">Почему мы</div>
            <div className="hp-trust-list">
              {[
                {ico:'⚡',bg:'#fffbeb',title:'Быстрый отклик',sub:'Первые предложения за 10 мин'},
                {ico:'🔒',bg:'#f0fdf4',title:'Безопасная сделка',sub:'Оплата только после выполнения'},
                {ico:'⭐',bg:'#eff6ff',title:'Проверенные мастера',sub:'Рейтинг и реальные отзывы'},
              ].map(t=>(
                <div key={t.title} className="hp-trust-item">
                  <div className="hp-trust-icon" style={{background:t.bg}}>{t.ico}</div>
                  <div>
                    <div className="hp-trust-text">{t.title}</div>
                    <div className="hp-trust-sub">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hp-promo-widget">
            <h3>Нужен мастер прямо сейчас?</h3>
            <p>Опишите задачу — первые отклики уже через 10 минут</p>
            <button className="hp-promo-btn" onClick={()=>navigate('/categories')}>Разместить заявку →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkerHome({ userId, userName }) {
  const [deals, setDeals] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`${API}/deals`,{headers:{'X-User-Id':userId}}).then(r=>r.ok?r.json():[]),
      fetch(`${API}/workers/${userId}/listings`).then(r=>r.ok?r.json():[]),
    ]).then(([d,l])=>{ setDeals(Array.isArray(d)?d:[]); setListings(Array.isArray(l)?l:[]); }).finally(()=>setLoading(false));
  },[userId]);

  const active = deals.filter(d=>d.status==='IN_PROGRESS');
  const done   = deals.filter(d=>d.status==='COMPLETED');
  const liveListing = listings.filter(l=>l.active);

  const ST = { IN_PROGRESS:{bg:'#fff3f0',color:'#e8410a',label:'В работе'}, COMPLETED:{bg:'#f0fdf4',color:'#22c55e',label:'Завершена'}, NEW:{bg:'#eff6ff',color:'#3b82f6',label:'Новая'} };

  return (
    <div className="hp">
      <style>{css}</style>
      <div className="hp-worker-hero">
        <div className="hp-worker-hero-inner">
          <div>
            <h1 className="hp-worker-hi">👋 Привет, <em>{userName||'Мастер'}</em>!</h1>
            <p className="hp-worker-sub">Панель управления · Йошкар-Ола</p>
          </div>
          <div className="hp-worker-hero-btns">
            <Link to="/find-work"    className="hp-worker-btn-fill">📋 Найти работу</Link>
            <Link to="/my-listings"  className="hp-worker-btn-line">+ Объявление</Link>
          </div>
        </div>
      </div>

      <div className="hp-worker-body">
        <div>
          {/* KPI */}
          <div className="hp-kpi-row">
            {[
              {ico:'⚙️',bg:'#fff3f0',num:active.length,   lbl:'В работе'},
              {ico:'✅',bg:'#f0fdf4',num:done.length,     lbl:'Выполнено'},
              {ico:'📢',bg:'#eff6ff',num:liveListing.length,lbl:'Объявлений'},
            ].map(k=>(
              <div key={k.lbl} className="hp-kpi">
                <div className="hp-kpi-ico" style={{background:k.bg}}>{k.ico}</div>
                <div><div className="hp-kpi-num">{k.num}</div><div className="hp-kpi-lbl">{k.lbl}</div></div>
              </div>
            ))}
          </div>

          {/* Действия */}
          <div className="hp-section-hdr" style={{marginBottom:12}}><h2 className="hp-section-title">Быстрые действия</h2></div>
          <div className="hp-actions-grid">
            {[
              {to:'/find-work',    ico:'🔍',bg:'#fff3f0',title:'Найти работу',   sub:'Новые заявки'},
              {to:'/deals',        ico:'📋',bg:'#f0fdf4',title:'Мои сделки',     sub:`Активных: ${active.length}`},
              {to:'/my-listings',  ico:'📢',bg:'#eff6ff',title:'Объявления',     sub:`Активных: ${liveListing.length}`},
              {to:'/chat',         ico:'💬',bg:'#fdf4ff',title:'Сообщения',      sub:'Переписка'},
              {to:'/worker-profile',ico:'👤',bg:'#fff9f0',title:'Профиль',       sub:'Настройки'},
              {to:'/deals',        ico:'⭐',bg:'#fff3f0',title:'Отзывы',         sub:'Репутация'},
            ].map(a=>(
              <Link key={a.to+a.title} to={a.to} className="hp-action">
                <div className="hp-action-ico" style={{background:a.bg}}>{a.ico}</div>
                <div className="hp-action-title">{a.title}</div>
                <div className="hp-action-sub">{a.sub}</div>
              </Link>
            ))}
          </div>

          {/* Сделки */}
          <div className="hp-section-hdr"><h2 className="hp-section-title">Активные сделки</h2><Link to="/deals" className="hp-section-link">Все →</Link></div>
          {loading ? <div className="hp-deal-list">{[1,2].map(i=><div key={i} style={{background:'#fff',borderRadius:12,border:'1px solid #ebebeb',height:68}}/>)}</div>
          : active.length===0 ? (
            <div className="hp-empty">
              <div className="hp-empty-ico">📋</div>
              <h3>Нет активных сделок</h3>
              <p>Откликайтесь на заявки чтобы получить заказы</p>
              <Link to="/find-work" className="hp-empty-link">Найти работу</Link>
            </div>
          ) : (
            <div className="hp-deal-list">
              {active.slice(0,5).map(d=>{
                const st=ST[d.status]||ST.NEW;
                return (
                  <Link key={d.id} to="/deals" className="hp-deal">
                    <div className="hp-deal-ico">⚙️</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="hp-deal-title">{d.title||'Сделка'}</div>
                      <div className="hp-deal-meta">👤 {d.customerName||'Заказчик'}{d.agreedPrice?` · ${Number(d.agreedPrice).toLocaleString('ru-RU')} ₽`:''}</div>
                    </div>
                    <span className="hp-deal-badge" style={{background:st.bg,color:st.color}}>{st.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Объявления */}
          <div className="hp-section-hdr"><h2 className="hp-section-title">Мои объявления</h2><Link to="/my-listings" className="hp-section-link">Все →</Link></div>
          {liveListing.length===0 ? (
            <div className="hp-empty">
              <div className="hp-empty-ico">📢</div>
              <h3>Нет объявлений</h3>
              <p>Опубликуйте услуги чтобы заказчики нашли вас</p>
              <Link to="/my-listings" className="hp-empty-link">+ Разместить</Link>
            </div>
          ) : (
            <div className="hp-listings-grid">
              {liveListing.slice(0,4).map(l=>(
                <Link key={l.id} to="/my-listings" className="hp-card">
                  <div className="hp-card-img">{l.photos?.length?<img src={l.photos[0]} alt=""/>:'🔧'}{l.category&&<span className="hp-card-tag">{l.category}</span>}</div>
                  <div className="hp-card-body">
                    <div className="hp-card-price">{Number(l.price).toLocaleString('ru-RU')} ₽<span className="hp-card-unit">{l.priceUnit}</span></div>
                    <div className="hp-card-title">{l.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка */}
        <div className="hp-worker-side" style={{position:'sticky',top:68,display:'flex',flexDirection:'column',gap:16}}>
          <div className="hp-widget">
            <div className="hp-widget-title">Навигация</div>
            <div className="hp-quick-list">
              <Link to="/find-work"    className="hp-quick-item hp-qi-orange">🔍 Найти работу</Link>
              <Link to="/my-listings"  className="hp-quick-item hp-qi-outline">📢 Объявления</Link>
              <Link to="/deals"        className="hp-quick-item hp-qi-gray">📋 Сделки</Link>
              <Link to="/chat"         className="hp-quick-item hp-qi-gray">💬 Сообщения</Link>
              <Link to="/worker-profile" className="hp-quick-item hp-qi-gray">👤 Профиль</Link>
            </div>
          </div>
          <div className="hp-promo-widget">
            <h3>Новые заявки ждут!</h3>
            <p>Откликайтесь первым — получайте больше заказов от клиентов</p>
            <button className="hp-promo-btn" onClick={()=>window.location.href='/find-work'}>Смотреть заявки →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuestHome() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  return (
    <div className="hp">
      <style>{css}</style>
      <div className="hp-hero">
        <div className="hp-hero-noise"/><div className="hp-hero-glow"/>
        <div className="hp-hero-inner">
          <div>
            <div className="hp-hero-eyebrow"><span className="hp-hero-dot"/>Йошкар-Ола · Маркетплейс мастеров</div>
            <h1 className="hp-hero-h1">Свои мастера<br/>для <em>любых задач</em><br/>в Йошкар-Оле</h1>
            <p className="hp-hero-sub">Опишите задачу — мастера откликнутся сами. Выбирайте по рейтингу, договаривайтесь внутри сервиса.</p>
            <div className="hp-hero-actions">
              <Link to="/register"               className="hp-hero-btn">🔍 Найти мастера</Link>
              <Link to="/register?role=WORKER"   className="hp-hero-btn-ghost">Стать мастером →</Link>
            </div>
          </div>
          <div className="hp-hero-card">
            <div className="hp-hero-card-title">Популярные услуги</div>
            <div className="hp-hero-cat-list">
              {ALL_CATS.slice(0,6).map(cat=>(
                <Link key={cat.slug} to="/register" className="hp-hero-cat-row">
                  <div className="hp-hero-cat-icon"><div className="hp-hero-cat-icon-ph">{cat.emoji||'🛠️'}</div></div>
                  {cat.name}<span className="hp-hero-cat-arr">›</span>
                </Link>
              ))}
            </div>
            <Link to="/register" className="hp-hero-all-link">Все категории →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { userId, userRole, userName } = useAuth();
  if (userRole === 'WORKER') return <WorkerHome userId={userId} userName={userName}/>;
  if (userId)               return <CustomerHome userId={userId} userName={userName}/>;
  return <GuestHome/>;
}