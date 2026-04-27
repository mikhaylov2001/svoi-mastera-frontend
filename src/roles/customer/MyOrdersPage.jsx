import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ListingInfoPanels from '../../components/ListingInfoPanels';
import { SECTIONS } from '../../pages/SectionsPage';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import {
  getMyJobRequests, getOffersForRequest, acceptOffer,
  getCategories, createJobRequest, updateJobRequest,
} from '../../api';
import { humanizeServerErrorMessage } from '../../utils/humanizeServerError';

const CATEGORY_PHOTO_BY_NAME = {};
Object.values(CATEGORIES_BY_SECTION).forEach(cats => {
  cats.forEach(c => { CATEGORY_PHOTO_BY_NAME[c.name] = c.photo; });
});

const DEFAULT_BG = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80';

function photoForCategoryName(name) {
  if (!name || !String(name).trim()) return DEFAULT_BG;
  const n = String(name).trim();
  return CATEGORY_PHOTO_BY_NAME[n] || DEFAULT_BG;
}

function pluralOffers(n) {
  const a = Math.abs(Number(n)) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'откликов';
  if (b > 1 && b < 5)   return 'отклика';
  if (b === 1)           return 'отклик';
  return 'откликов';
}

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 720;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else       { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ id: Date.now() + Math.random(), data: canvas.toDataURL('image/jpeg', 0.78) });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = { title: '', description: '', budget: '', address: '', city: '', categoryId: '', photos: [] };
const MAX_DESC = 2000;

/* ══ CSS (identical to MyListingsPage) ══ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .ml-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  .ml-list-shell { background: #f2f2f2; min-height: 100vh; }
  .ml-list-hero {
    position: relative; height: 290px; overflow: hidden;
  }
  @media (max-width: 768px) { .ml-list-hero { height: 240px; } }
  .ml-list-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 40%;
    filter: brightness(.62) saturate(1.15);
  }
  .ml-list-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(170deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.55) 100%);
  }
  .ml-list-hero-body {
    position: relative; z-index: 1; height: 100%;
    max-width: 1000px; margin: 0 auto; padding: 0 20px;
    display: flex; align-items: flex-end; justify-content: space-between;
    padding-bottom: 32px; gap: 16px; flex-wrap: wrap;
  }
  .ml-h1 { font-size: clamp(24px, 4vw, 34px); font-weight: 900; margin: 0; color: #fff; letter-spacing: -.4px; line-height: 1.15; }
  .ml-h-sub { font-size: 14px; color: rgba(255,255,255,.75); margin: 6px 0 0; font-weight: 500; }
  .ml-new-btn { background: #e8410a; border: none; border-radius: 10px; color: #fff; font-size: 14px; font-weight: 700; padding: 12px 24px; cursor: pointer; font-family: inherit; transition: background .15s, box-shadow .15s; box-shadow: 0 4px 14px rgba(232,65,10,.3); white-space: nowrap; }
  .ml-new-btn:hover { background: #c73208; box-shadow: 0 6px 20px rgba(232,65,10,.38); }
  .ml-wrap { max-width: 1000px; margin: 0 auto; padding: 0 20px 60px; }

  .ml-tabs { display: flex; gap: 6px; padding: 4px; background: rgba(255,255,255,.85); border: 1px solid #e8e8e8; border-radius: 12px; margin-bottom: 14px; width: fit-content; }
  .ml-tab { background: none; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; font-family: inherit; transition: all .15s; }
  .ml-tab.on { color: #fff; background: #e8410a; box-shadow: 0 2px 8px rgba(232,65,10,.25); }
  .ml-tab-n { font-size: 11px; background: rgba(0,0,0,.06); border-radius: 8px; padding: 1px 6px; margin-left: 5px; color: #6b7280; }
  .ml-tab.on .ml-tab-n { background: rgba(255,255,255,.22); color: #fff; }

  .ml-list { display: flex; flex-direction: column; gap: 12px; background: transparent; border: none; }
  .ml-row {
    display: flex; align-items: stretch;
    background: #fff; border: 1.5px solid #e8e8e8; border-radius: 16px;
    overflow: hidden; cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,.04);
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }
  .ml-row:hover {
    box-shadow: 0 10px 32px rgba(0,0,0,.1);
    transform: translateY(-2px);
    border-color: #e8410a;
  }
  .ml-row-img { width: 132px; min-height: 108px; flex-shrink: 0; background: #f5f5f5; overflow: hidden; position: relative; }
  .ml-row-img img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 108px; }
  .ml-row-img-ph { width: 100%; height: 100%; min-height: 108px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #d1d5db; }
  .ml-row-img-cnt { position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 6px; }
  .ml-row-body { flex: 1; padding: 14px 18px 10px; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .ml-row-title { font-size: 16px; font-weight: 800; color: #111827; margin: 0 0 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .ml-row-price { font-size: 19px; font-weight: 800; margin-bottom: 6px; color: #1a1a1a; }
  .ml-row-unit { font-size: 12px; color: #8f8f8f; font-weight: 500; margin-left: 4px; }
  .ml-row-cat { display: inline-block; font-size: 11px; color: #fff; background: #e8410a; border-radius: 6px; padding: 3px 10px; margin-bottom: 6px; font-weight: 700; }
  .ml-row-desc { font-size: 13px; color: #6b7280; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; margin-bottom: 6px; line-height: 1.45; }
  .ml-row-date { font-size: 12px; color: #9ca3af; margin-bottom: 10px; }
  .ml-row-stats {
    display: flex; flex-direction: row; gap: 18px; flex-wrap: wrap;
    padding: 8px 12px; margin: 0 -18px -10px; border-top: 1px solid #f3f4f6;
    background: #f9f9f9; border-radius: 0 0 0 12px;
  }
  .ml-row-stat { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 5px; }
  .ml-row-stat-num { font-weight: 800; color: #111827; font-variant-numeric: tabular-nums; font-size: 14px; }
  .ml-row-stat-status-active { font-size: 12px; font-weight: 700; color: #16a34a; }
  .ml-row-stat-status-arch   { font-size: 12px; font-weight: 700; color: #ef4444; }
  .ml-row-actions {
    width: 176px; flex-shrink: 0; padding: 14px 13px;
    display: flex; flex-direction: column; gap: 7px; justify-content: center;
    border-left: 1px solid #f0f0f0; background: #fafafa;
  }
  .ml-btn-edit {
    width: 100%; background: #e8410a; border: none; border-radius: 10px;
    padding: 10px 0; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .ml-btn-edit:hover { background: #c73208; }
  .ml-btn-copy {
    width: 100%; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
    padding: 9px 0; font-size: 12px; font-weight: 600; color: #475569;
    cursor: pointer; font-family: inherit; transition: all .15s;
  }
  .ml-btn-copy:hover { border-color: #e8410a; color: #e8410a; background: #fff7ed; }
  .ml-btn-copy.copied { color: #166534; border-color: #bbf7d0; background: #f0fdf4; }
  .ml-actions-divider { height: 1px; background: #ebebeb; margin: 2px 0; }
  .ml-btn-arch {
    background: none; border: none; font-size: 12px; color: #9ca3af;
    cursor: pointer; font-family: inherit; padding: 4px 0; text-align: center;
    transition: color .15s; width: 100%;
  }
  .ml-btn-arch:hover { color: #e8410a; }
  .ml-btn-restore {
    background: none; border: none; font-size: 12px; color: #16a34a;
    cursor: pointer; font-family: inherit; padding: 4px 0; text-align: center;
    font-weight: 700; transition: color .15s; width: 100%;
  }
  .ml-btn-restore:hover { color: #166534; }
  .ml-empty {
    text-align: center; padding: 72px 24px;
    background: rgba(255,255,255,.95); border: 1.5px solid #e8e8e8; border-radius: 16px;
    color: #8f8f8f; box-shadow: 0 4px 20px rgba(0,0,0,.05);
  }

  /* offers panel */
  .ml-offers-panel {
    background: #f9fafb; border: 1.5px solid #e8e8e8; border-top: none;
    border-radius: 0 0 16px 16px; padding: 16px 18px;
  }
  .ml-offers-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 12px; }
  .ml-offer-card {
    background: #fff; border: 1.5px solid #e5e7eb; border-radius: 12px;
    padding: 14px 16px; margin-bottom: 10px;
  }
  .ml-offer-card:last-child { margin-bottom: 0; }
  .ml-offer-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .ml-offer-price { font-size: 18px; font-weight: 800; color: #1a1a1a; }
  .ml-offer-days { font-size: 13px; color: #6b7280; margin-left: 6px; }
  .ml-offer-name { font-size: 13px; color: #555; margin-top: 4px; }
  .ml-offer-msg { font-size: 13px; color: #555; margin: 10px 0 0; line-height: 1.5; }
  .ml-accept-btn {
    background: #e8410a; border: none; border-radius: 8px; color: #fff;
    font-size: 13px; font-weight: 700; padding: 9px 18px; cursor: pointer;
    font-family: inherit; white-space: nowrap; transition: background .15s;
  }
  .ml-accept-btn:hover { background: #c73208; }
  .ml-accept-btn:disabled { background: #fca98e; cursor: not-allowed; }

  /* DETAIL */
  .ml-detail { background: #f2f2f2; min-height: 100vh; }
  .ml-detail-nav { background: #fff; border-bottom: 1.5px solid #e5e7eb; padding: 12px 0; }
  .ml-detail-wrap { max-width: 1000px; margin: 0 auto; padding: 20px 20px 60px; display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }
  .ml-detail-gallery { background: #fff; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
  .ml-detail-main-img { position: relative; aspect-ratio: 16/9; overflow: hidden; cursor: pointer; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
  .ml-detail-main-img img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
  .ml-detail-thumbs { display: flex; gap: 6px; padding: 10px 12px; background: #fafafa; overflow-x: auto; }
  .ml-detail-thumb { width: 72px; height: 54px; flex-shrink: 0; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; }
  .ml-detail-thumb.on { border-color: #e8410a; }
  .ml-detail-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ml-detail-right { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 72px; }
  .ml-detail-price-card { background: #fff; border-radius: 12px; padding: 20px; }
  .ml-detail-price { font-size: 28px; font-weight: 900; color: #1a1a1a; }
  .ml-detail-price-unit { font-size: 13px; color: #8f8f8f; margin-top: 2px; }
  .ml-detail-actions-card { background: #fff; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .ml-btn-primary { background: #e8410a; border: none; border-radius: 8px; color: #fff; font-size: 14px; font-weight: 700; padding: 13px; cursor: pointer; width: 100%; font-family: inherit; }
  .ml-btn-primary:hover { background: #c73208; }
  .ml-btn-outline { background: #fff; border: 1.5px solid #e8410a; border-radius: 8px; color: #e8410a; font-size: 14px; font-weight: 700; padding: 12px; cursor: pointer; width: 100%; font-family: inherit; }
  .ml-btn-outline:hover { background: #fde8e0; }
  .ml-section-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
  .ml-tag { display: inline-block; background: #fde8e0; color: #e8410a; border-radius: 20px; font-size: 12px; font-weight: 700; padding: 4px 12px; }

  /* ФОРМА */
  .mlf-hero { position: relative; height: 290px; overflow: hidden; }
  @media (max-width: 768px) { .mlf-hero { height: 240px; } }
  .mlf-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.62) saturate(1.15); }
  .mlf-hero-overlay { position: absolute; inset: 0; background: linear-gradient(170deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.55) 100%); }
  .mlf-hero-body { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; padding: 0 24px 32px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; }
  .mlf-hero-back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: rgba(255,255,255,.8); background: none; border: none; font-family: inherit; cursor: pointer; padding: 0; margin-bottom: 10px; transition: color .15s; }
  .mlf-hero-back:hover { color: #fff; }
  .mlf-hero-title { font-size: clamp(22px, 4vw, 34px); font-weight: 900; color: #fff; margin: 0 0 6px; letter-spacing: -.4px; line-height: 1.15; }
  .mlf-hero-sub { font-size: 14px; color: rgba(255,255,255,.75); margin: 0; }

  .mlf-wrap { max-width: 1080px; margin: 0 auto; padding: 20px 24px 60px; display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }

  .mlf-stepper { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .mlf-step-pill { border-radius: 999px; padding: 7px 12px; font-size: 12px; font-weight: 700; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; }
  .mlf-step-pill.on { border-color: #e8410a; color: #e8410a; background: #fff4ef; }
  .mlf-step-dot { width: 6px; height: 6px; border-radius: 50%; background: #d1d5db; }

  .mlf-sec-grid {
    display: grid; grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 200px; gap: 12px; margin-bottom: 12px;
  }
  .mlf-sec-featured { grid-column: span 7; grid-row: span 2; }
  .mlf-sec-5 { grid-column: span 5; }
  .mlf-sec-6 { grid-column: span 6; }

  .mlf-sec-card {
    position: relative; overflow: hidden; border-radius: 16px;
    cursor: pointer; border: none; padding: 0; background: none;
    text-align: left; display: block; width: 100%; height: 100%;
    font-family: Inter, Arial, sans-serif;
    transition: transform .2s, box-shadow .2s;
  }
  .mlf-sec-card:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(0,0,0,.2); }
  .mlf-sec-photo {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; filter: brightness(.58) saturate(1.1);
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .mlf-sec-card:hover .mlf-sec-photo { transform: scale(1.06); }
  .mlf-sec-overlay { position: absolute; inset: 0; background: linear-gradient(175deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.72) 100%); }
  .mlf-sec-count {
    position: absolute; top: 14px; left: 14px;
    background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.25); border-radius: 20px;
    padding: 3px 10px; font-size: 11px; font-weight: 700; color: #fff;
  }
  .mlf-sec-arrow {
    position: absolute; top: 14px; right: 14px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; color: #fff; transition: background .2s, transform .2s;
  }
  .mlf-sec-card:hover .mlf-sec-arrow { background: rgba(255,255,255,.35); transform: translate(2px,-2px); }
  .mlf-sec-body { position: absolute; inset: 0; padding: 16px 18px; display: flex; flex-direction: column; justify-content: flex-end; }
  .mlf-sec-name { font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 4px; line-height: 1.1; }
  .mlf-sec-featured .mlf-sec-name { font-size: 32px; }
  .mlf-sec-desc { font-size: 12px; color: rgba(255,255,255,.82); line-height: 1.5; margin-bottom: 10px; }
  .mlf-sec-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .mlf-sec-tag {
    background: rgba(255,255,255,.18); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,.22); border-radius: 20px;
    padding: 3px 10px; font-size: 11px; font-weight: 600; color: #fff;
  }

  .mlf-cat-head-simple {
    background: #fff; border: 1.5px solid #e8e8e8;
    border-radius: 14px; padding: 16px 18px 18px; margin-bottom: 12px;
  }
  .mlf-cat-head-back { background: none; border: none; color: #e8410a; font-size: 13px; font-weight: 700; cursor: pointer; padding: 0; margin-bottom: 10px; font-family: inherit; }
  .mlf-cat-head-back:hover { opacity: .8; }
  .mlf-cat-head-name { font-size: 22px; font-weight: 900; color: #111827; margin: 0 0 4px; line-height: 1.2; }
  .mlf-cat-head-sub { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.45; }

  .mlf-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .mlf-cat-card {
    background: #fff; border-radius: 14px; border: 1.5px solid #e8e8e8;
    overflow: hidden; cursor: pointer; border: none; padding: 0;
    display: flex; flex-direction: column; font-family: Inter, Arial, sans-serif;
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }
  .mlf-cat-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.12); transform: translateY(-3px); }
  .mlf-cat-img { position: relative; height: 130px; overflow: hidden; background: #f0f0f0; }
  .mlf-cat-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s cubic-bezier(.25,.46,.45,.94); }
  .mlf-cat-card:hover .mlf-cat-img img { transform: scale(1.08); }
  .mlf-cat-badge { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,.52); backdrop-filter: blur(6px); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .mlf-cat-body { padding: 13px 14px 14px; flex: 1; display: flex; flex-direction: column; }
  .mlf-cat-name { font-size: 14px; font-weight: 800; color: #111; margin-bottom: 4px; line-height: 1.2; }
  .mlf-cat-desc { font-size: 12px; color: #777; line-height: 1.5; flex: 1; margin-bottom: 10px; }
  .mlf-cat-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #f0f0f0; }
  .mlf-cat-price { font-size: 12px; font-weight: 700; color: #e8410a; }
  .mlf-cat-go { width: 28px; height: 28px; border-radius: 50%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #999; transition: background .2s, color .2s; }
  .mlf-cat-card:hover .mlf-cat-go { background: #e8410a; color: #fff; }

  .mlf-selected-cat {
    margin-top: 10px; padding: 10px 12px; border: 1px solid #fed7c2;
    background: #fff7f3; border-radius: 10px;
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .mlf-selected-cat b { color: #9a3412; font-size: 13px; }
  .mlf-change-cat { border: none; background: none; color: #e8410a; font-size: 12px; font-weight: 700; cursor: pointer; padding: 0; font-family: inherit; }
  .mlf-change-cat:hover { opacity: .8; }

  .mlf-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; margin-bottom: 12px; overflow: hidden; }
  .mlf-card-title { font-size: 16px; font-weight: 700; color: #111; padding: 18px 20px 0; margin-bottom: 16px; }

  .mlf-photos { padding: 18px 20px 20px; }
  .mlf-photo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .mlf-photo-cell { aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative; border: 1.5px dashed #d0d0d0; background: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; }
  .mlf-photo-cell:hover { border-color: #e8410a; background: #fff5f2; }
  .mlf-photo-cell.filled { border: none; cursor: zoom-in; }
  .mlf-photo-cell.main-photo { grid-column: span 2; grid-row: span 2; }
  .mlf-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .mlf-photo-cell.filled:hover .mlf-photo-img { transform: scale(1.05); }
  .mlf-photo-add-icon { font-size: 28px; opacity: .5; }
  .mlf-photo-hint { font-size: 12px; color: #aaa; margin-top: 10px; }
  .mlf-photo-del { position: absolute; top: 5px; right: 5px; width: 26px; height: 26px; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; opacity: 0; transition: opacity .15s; z-index: 2; }
  .mlf-photo-cell.filled:hover .mlf-photo-del { opacity: 1; }
  .mlf-photo-del:hover { background: #dc2626 !important; }
  .mlf-photo-main-badge { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
  .mlf-photo-zoom { position: absolute; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; pointer-events: none; }
  .mlf-photo-zoom-text { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: .04em; text-transform: uppercase; }
  .mlf-photo-cell.filled:hover .mlf-photo-zoom { opacity: 1; }

  .mlf-fields { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
  .mlf-field label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
  .mlf-field input, .mlf-field textarea, .mlf-field select {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px;
    font-size: 15px; font-family: Inter, Arial, sans-serif; color: #111; outline: none;
    background: #fff; transition: border-color .15s, box-shadow .15s; box-sizing: border-box;
    appearance: none;
  }
  .mlf-field input:focus, .mlf-field textarea:focus, .mlf-field select:focus { border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08); }
  .mlf-field textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
  .mlf-field-hint { font-size: 12px; color: #aaa; margin-top: 5px; line-height: 1.4; }
  .mlf-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .mlf-field-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .mlf-field-top label { margin: 0; }
  .mlf-char { font-size: 12px; color: #bbb; }
  .mlf-char.warn { color: #f59e0b; }
  .mlf-char.over { color: #ef4444; }

  .mlf-price-block { padding: 18px 20px 20px; }
  .mlf-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; align-items: end; }

  .mlf-submit-card { padding: 20px; }
  .mlf-btn-submit { width: 100%; padding: 15px; background: #e8410a; border: none; border-radius: 10px; color: #fff; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background .15s; }
  .mlf-btn-submit:hover { background: #c73208; }
  .mlf-btn-submit:disabled { background: #fca98e; cursor: not-allowed; }
  .mlf-btn-copy-outline {
    width: 100%; margin-top: 10px; padding: 11px; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
    color: #334155; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s;
  }
  .mlf-btn-copy-outline:hover { border-color: #e8410a; color: #c2410c; background: #fff7ed; }

  .mlf-error { background: #fff5f5; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #dc2626; margin-bottom: 12px; }

  .mlf-sidebar { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 76px; }
  .mlf-sb-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; padding: 18px; }
  .mlf-sb-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
  .mlf-steps { display: flex; flex-direction: column; gap: 10px; }
  .mlf-step { display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: #555; }
  .mlf-step-num { width: 24px; height: 24px; border-radius: 50%; background: #e8410a; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .mlf-sb-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #555; padding: 8px 0; border-bottom: 1px solid #f5f5f5; line-height: 1.5; }
  .mlf-sb-item:last-child { border-bottom: none; padding-bottom: 0; }
  .mlf-sb-ico { font-size: 18px; flex-shrink: 0; }
  .mlf-tips { display: flex; flex-direction: column; gap: 6px; }
  .mlf-tip { font-size: 12px; color: #666; padding-left: 16px; position: relative; line-height: 1.5; }
  .mlf-tip::before { content: '💡'; position: absolute; left: 0; font-size: 11px; }

  .mlf-lb { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.94); display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .mlf-lb-close { position: fixed; top: 18px; right: 18px; width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .mlf-lb-counter { position: fixed; top: 22px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,.15); color: #fff; font-size: 14px; font-weight: 700; padding: 6px 18px; border-radius: 20px; }
  .mlf-lb-btn { position: fixed; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .mlf-lb-prev { left: 18px; }
  .mlf-lb-next { right: 18px; }

  @keyframes mlsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .ml-sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: mlsk 1.4s infinite; border-radius: 6px; }

  @media(max-width: 900px) {
    .mlf-wrap { grid-template-columns: 1fr; }
    .mlf-sidebar { position: static; }
    .ml-detail-wrap { grid-template-columns: 1fr; }
    .ml-detail-right { position: static; }
  }
  @media(max-width: 860px) {
    .mlf-sec-grid { grid-template-columns: 1fr 1fr; grid-auto-rows: 180px; }
    .mlf-sec-featured, .mlf-sec-5, .mlf-sec-6 { grid-column: span 2; }
    .mlf-sec-featured { grid-row: span 1; }
    .mlf-cat-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media(max-width: 720px) {
    .ml-row-actions { display: none; }
    .mlf-photo-grid { grid-template-columns: repeat(3, 1fr); }
    .mlf-photo-cell.main-photo { grid-column: span 1; grid-row: span 1; }
  }
  @media(max-width: 520px) {
    .mlf-sec-grid { grid-template-columns: 1fr; grid-auto-rows: 160px; gap: 8px; }
    .mlf-sec-featured, .mlf-sec-5, .mlf-sec-6 { grid-column: span 1; }
    .mlf-sec-name { font-size: 22px !important; }
    .mlf-cat-grid { grid-template-columns: 1fr; }
  }
  @media(max-width: 500px) {
    .mlf-row2 { grid-template-columns: 1fr; }
    .mlf-price-row { grid-template-columns: 1fr; }
  }
`;

const STATUS_LABELS = {
  DRAFT: 'Черновик', OPEN: 'Открыта', IN_NEGOTIATION: 'Обсуждение',
  ASSIGNED: 'Назначена', IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнена', CANCELLED: 'Отменена', EXPIRED: 'Истекла',
};

function isActiveStatus(s) {
  return ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED', 'IN_PROGRESS'].includes(s);
}

export default function MyOrdersPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate = useNavigate();

  const [requests,       setRequests]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState('active');
  const [detail,         setDetail]         = useState(null);
  const [photoIdx,       setPhotoIdx]       = useState(0);
  const [view,           setView]           = useState(null); // null | 'create' | {edit: req}
  const [pickedSection,  setPickedSection]  = useState(null);
  const [hoverSectionSlug,  setHoverSectionSlug]  = useState(null);
  const [hoverCategoryName, setHoverCategoryName] = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);
  const [formErr,        setFormErr]        = useState('');
  const [lightbox,       setLightbox]       = useState(null);
  const [isDragging,     setIsDragging]     = useState(false);
  const [copyFlashId,    setCopyFlashId]    = useState(null);

  // Offers
  const [expandedId,    setExpandedId]    = useState(null);
  const [offers,        setOffers]        = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const photoRef = useRef();
  const titleRef = useRef();

  /* ── helpers ── */
  function getCategoryName(catId) {
    const c = categories.find(x => String(x.id) === String(catId));
    return c ? c.name : '';
  }

  function getCategoryNameForForm() {
    if (!form.categoryId) return '';
    return getCategoryName(form.categoryId);
  }

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, cats] = await Promise.all([getMyJobRequests(userId), getCategories()]);
      setRequests(reqs || []);
      setCategories(cats || []);
      setDetail(prev => {
        if (!prev) return null;
        return (reqs || []).find(r => r.id === prev.id) || prev;
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);

  // Lightbox keyboard
  useEffect(() => {
    if (!lightbox) return;
    const h = (e) => {
      if (e.key === 'ArrowRight') setLightbox(l => l ? {...l, index:(l.index+1)%l.photos.length} : l);
      if (e.key === 'ArrowLeft')  setLightbox(l => l ? {...l, index:(l.index-1+l.photos.length)%l.photos.length} : l);
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightbox]);

  const active  = requests.filter(r => isActiveStatus(r.status));
  const archive = requests.filter(r => !isActiveStatus(r.status));
  const shown   = tab === 'active' ? active : archive;

  /* ── copy link ── */
  const copyRequestLink = useCallback((reqId, e) => {
    e?.stopPropagation?.();
    const url = `${window.location.origin}/my-requests?request=${reqId}`;
    const done = () => {
      setCopyFlashId(reqId);
      window.setTimeout(() => setCopyFlashId(cur => cur === reqId ? null : cur), 2200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done);
    } else { done(); }
  }, []);

  /* ── offers ── */
  const toggleOffers = useCallback(async (reqId, e) => {
    e?.stopPropagation?.();
    if (expandedId === reqId) { setExpandedId(null); setOffers([]); return; }
    setExpandedId(reqId);
    setOffersLoading(true);
    try {
      const data = await getOffersForRequest(reqId);
      setOffers(data || []);
    } catch { setOffers([]); }
    setOffersLoading(false);
  }, [expandedId]);

  const handleAccept = async (requestId, offerId, e) => {
    e?.stopPropagation?.();
    if (!window.confirm('Принять этот отклик и начать работу с мастером?')) return;
    setActionLoading(offerId);
    try {
      await acceptOffer(userId, requestId, offerId);
      await load();
      setExpandedId(null); setOffers([]);
    } catch (err) {
      alert('Ошибка при принятии отклика: ' + (err.message || ''));
    }
    setActionLoading(null);
  };

  /* ── wizard open ── */
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErr('');
    setPickedSection(null);
    setHoverSectionSlug(null);
    setHoverCategoryName(null);
    setView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (req, e) => {
    e?.stopPropagation?.();
    setForm({
      title:       req.title || '',
      description: (req.description && req.description !== 'Без описания') ? req.description : '',
      budget:      req.budgetTo || req.budgetFrom || '',
      address:     req.addressText || '',
      city:        req.city || '',
      categoryId:  req.categoryId || '',
      photos:      (req.photos || []).map((p, i) => ({ id: i, data: p })),
    });
    setFormErr('');
    setView({ edit: req });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── photo upload ── */
  const handlePhotoUpload = useCallback(async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    const cur = form.photos?.length || 0;
    if (cur + arr.length > 5) { setFormErr(`Максимум 5 фото (уже ${cur})`); return; }
    const compressed = await Promise.all(arr.map(compressImage));
    setForm(p => ({ ...p, photos: [...(p.photos || []), ...compressed] }));
  }, [form.photos]);

  const removePhoto = (id, e) => {
    e?.stopPropagation?.();
    setForm(p => ({ ...p, photos: p.photos.filter(ph => ph.id !== id) }));
  };

  /* ── pick category from wizard ── */
  const handlePickCategory = (categoryName) => {
    const c = categories.find(x => String(x.name || '').trim().toLowerCase() === String(categoryName).trim().toLowerCase());
    setFormErr('');
    setHoverCategoryName(null);
    setForm(p => ({ ...p, categoryId: c ? String(c.id) : categoryName }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { titleRef.current?.focus(); }, 150);
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!form.title.trim())                           { setFormErr('Укажите название заявки'); return; }
    if (!form.categoryId)                             { setFormErr('Выберите категорию'); return; }
    if (!form.budget || Number(form.budget) <= 0)     { setFormErr('Укажите бюджет (больше нуля)'); return; }
    if (!userId)                                      { setFormErr('Войдите в аккаунт и попробуйте снова.'); return; }
    setSaving(true); setFormErr('');
    try {
      const isEdit = view !== 'create';
      const payload = {
        categoryId:  form.categoryId,
        title:       form.title.trim(),
        description: (form.description || '').trim() || 'Без описания',
        city:        (form.city || '').trim(),
        address:     (form.address || '').trim(),
        budget:      Number(form.budget),
        photos:      (form.photos || []).map(p => p.data).filter(Boolean),
      };
      if (isEdit) {
        await updateJobRequest(userId, view.edit.id, {
          categoryId:  payload.categoryId,
          title:       payload.title,
          description: payload.description,
          city:        payload.city,
          addressText: payload.address,
          budgetFrom:  payload.budget,
          budgetTo:    payload.budget,
          photos:      payload.photos,
        });
      } else {
        await createJobRequest(userId, payload);
      }
      setView(null);
      await load();
    } catch (e) {
      const m = e?.message || '';
      if (m === 'Failed to fetch') setFormErr('Нет соединения с сервером.');
      else setFormErr(humanizeServerErrorMessage(m) || 'Не удалось сохранить. Попробуйте ещё раз.');
    }
    setSaving(false);
  };

  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Заказчик';
  const BACKEND  = 'https://svoi-mastera-backend.onrender.com';
  const ava      = userAvatar ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar) : null;

  // ══ ФОРМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ══
  if (view !== null) {
    const isEdit        = view !== 'create';
    const isSectionStep = !isEdit && !form.categoryId && !pickedSection;
    const isCatStep     = !isEdit && !form.categoryId && !!pickedSection;
    const isFormStep    = isEdit || !!form.categoryId;
    const photos        = form.photos || [];
    const descLen       = form.description.length;
    const catNameStr    = getCategoryNameForForm();

    let heroSrc = DEFAULT_BG;
    if (isEdit && catNameStr)  heroSrc = photoForCategoryName(catNameStr);
    else if (!isEdit) {
      if (isSectionStep) {
        const hs = hoverSectionSlug && SECTIONS.find(s => s.slug === hoverSectionSlug);
        heroSrc = hs?.photo || DEFAULT_BG;
      } else if (isCatStep) {
        const secPhoto = SECTIONS.find(s => s.slug === pickedSection)?.photo;
        heroSrc = hoverCategoryName ? photoForCategoryName(hoverCategoryName) : (secPhoto || DEFAULT_BG);
      } else if (catNameStr) {
        heroSrc = photoForCategoryName(catNameStr);
      }
    }

    return (
      <div className="ml-page">
        <style>{css}</style>

        {/* Hero */}
        <div className="mlf-hero">
          <img src={heroSrc} alt="" className="mlf-hero-img" />
          <div className="mlf-hero-overlay" />
          <div className="mlf-hero-body">
            <button className="mlf-hero-back" onClick={() => {
              if (isCatStep) { setHoverCategoryName(null); setPickedSection(null); }
              else if (isFormStep && !isEdit) { setHoverCategoryName(null); setForm(p => ({...p, categoryId: ''})); setPickedSection(null); }
              else { setView(null); }
            }}>
              {isCatStep ? '← Все разделы' : isFormStep && !isEdit ? '← Выбор категории' : '← Мои заявки'}
            </button>
            <h1 className="mlf-hero-title">
              {isEdit ? 'Редактировать заявку' : isSectionStep ? 'Выберите раздел' : isCatStep ? (SECTIONS.find(s => s.slug === pickedSection)?.name || '') : 'Новая заявка'}
            </h1>
            <p className="mlf-hero-sub">
              {isEdit
                ? 'Обновите данные и сохраните'
                : isSectionStep
                  ? 'Шаг 1 — выберите раздел услуги'
                  : isCatStep
                    ? 'Шаг 2 — выберите категорию, откроется форма'
                    : 'Шаг 3 — заполните заявку и опубликуйте'}
            </p>
          </div>
        </div>

        <div className="mlf-wrap">
          <div>
            {formErr && <div className="mlf-error">⚠️ {formErr}</div>}
            {!isEdit && (
              <div className="mlf-stepper">
                <span className={`mlf-step-pill${isSectionStep ? ' on' : ''}`}>1. Раздел</span>
                <span className="mlf-step-dot" />
                <span className={`mlf-step-pill${isCatStep ? ' on' : ''}`}>2. Категория</span>
                <span className="mlf-step-dot" />
                <span className={`mlf-step-pill${isFormStep ? ' on' : ''}`}>3. Заявка</span>
              </div>
            )}

            {isSectionStep ? (
              (() => {
                const layout = ['mlf-sec-featured','mlf-sec-5','mlf-sec-5','mlf-sec-6','mlf-sec-6'];
                return (
                  <div className="mlf-sec-grid" onMouseLeave={() => setHoverSectionSlug(null)}>
                    {SECTIONS.map((sec, i) => (
                      <button
                        key={sec.slug}
                        type="button"
                        className={`mlf-sec-card ${layout[i] || 'mlf-sec-6'}`}
                        onMouseEnter={() => setHoverSectionSlug(sec.slug)}
                        onClick={() => { setPickedSection(sec.slug); setHoverSectionSlug(null); setHoverCategoryName(null); window.scrollTo({top:0,behavior:'smooth'}); }}
                      >
                        <img src={sec.photo} alt={sec.name} className="mlf-sec-photo" />
                        <div className="mlf-sec-overlay" />
                        <span className="mlf-sec-count">{sec.count} {sec.count === 1 ? 'категория' : 'категории'}</span>
                        <span className="mlf-sec-arrow">›</span>
                        <div className="mlf-sec-body">
                          <div className="mlf-sec-name">{sec.name}</div>
                          <div className="mlf-sec-desc">{sec.desc}</div>
                          <div className="mlf-sec-tags">
                            {sec.tags.map(t => <span key={t} className="mlf-sec-tag">{t}</span>)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()
            ) : isCatStep ? (
              (() => {
                const cats = CATEGORIES_BY_SECTION[pickedSection] || [];
                return (
                  <div className="mlf-cat-grid" onMouseLeave={() => setHoverCategoryName(null)}>
                    {cats.map(cat => (
                      <button
                        key={cat.slug}
                        type="button"
                        className="mlf-cat-card"
                        onMouseEnter={() => setHoverCategoryName(cat.name)}
                        onClick={() => handlePickCategory(cat.name)}
                      >
                        <div className="mlf-cat-img">
                          <img src={cat.photo} alt={cat.name} />
                          <span className="mlf-cat-badge">{cat.masters}</span>
                        </div>
                        <div className="mlf-cat-body">
                          <div className="mlf-cat-name">{cat.name}</div>
                          <div className="mlf-cat-desc">{cat.desc}</div>
                          <div className="mlf-cat-footer">
                            <span className="mlf-cat-price">{cat.priceFrom}</span>
                            <span className="mlf-cat-go">›</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()
            ) : (
              <>
                {/* ── 1. ФОТОГРАФИИ ── */}
                <div className="mlf-card">
                  <div className="mlf-card-title">
                    Фотографии <span style={{fontSize:13,color:'#aaa',fontWeight:400}}>(необязательно, до 5 шт.)</span>
                  </div>
                  <div className="mlf-photos">
                    <div
                      className="mlf-photo-grid"
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={e => { e.preventDefault(); setIsDragging(false); handlePhotoUpload(e.dataTransfer.files); }}
                    >
                      {Array.from({ length: 5 }).map((_, i) => {
                        const ph = photos[i];
                        if (ph) {
                          return (
                            <div
                              key={ph.id}
                              className={`mlf-photo-cell filled${i === 0 ? ' main-photo' : ''}`}
                              onClick={() => setLightbox({ photos: photos.map(p => p.data), index: i })}
                            >
                              <img src={ph.data} alt="" className="mlf-photo-img" />
                              {i === 0 && <span className="mlf-photo-main-badge">Главное</span>}
                              <div className="mlf-photo-zoom"><span className="mlf-photo-zoom-text">Просмотр</span></div>
                              <button type="button" className="mlf-photo-del" onClick={e => removePhoto(ph.id, e)}>×</button>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={i}
                            className="mlf-photo-cell"
                            style={isDragging ? { borderColor: '#e8410a', background: '#fff5f2' } : {}}
                            onClick={() => photoRef.current?.click()}
                          >
                            <span className="mlf-photo-add-icon">{i === 0 ? '📷' : '+'}</span>
                          </div>
                        );
                      })}
                    </div>
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => { handlePhotoUpload(e.target.files); e.target.value = ''; }}
                    />
                    <p className="mlf-photo-hint">
                      {photos.length > 0
                        ? `${photos.length}/5 фото · Нажмите на фото для просмотра`
                        : 'Перетащите файлы сюда или кликните по ячейке · до 10 МБ'}
                    </p>
                  </div>
                </div>

                {/* ── 2. ОПИСАНИЕ ЗАЯВКИ ── */}
                <div className="mlf-card">
                  <div className="mlf-card-title">Описание заявки</div>
                  <div className="mlf-fields">
                    <div className="mlf-field">
                      <label>Название заявки *</label>
                      <input
                        ref={titleRef}
                        value={form.title}
                        onChange={e => { setFormErr(''); setForm(p => ({...p, title: e.target.value})); }}
                        maxLength={120}
                      />
                      <span className="mlf-field-hint">Коротко и конкретно — что нужно сделать</span>
                    </div>

                    <div className="mlf-field">
                      <label>Категория *</label>
                      <div className="mlf-selected-cat">
                        <b>{catNameStr || form.categoryId}</b>
                        {!isEdit && (
                          <button type="button" className="mlf-change-cat" onClick={() => setForm(p => ({...p, categoryId: ''}))}>
                            Сменить
                          </button>
                        )}
                      </div>
                      {isEdit && (
                        <select
                          value={form.categoryId}
                          style={{ marginTop: 8 }}
                          onChange={e => { setFormErr(''); setForm(p => ({...p, categoryId: e.target.value})); }}
                        >
                          <option value="">Выберите категорию</option>
                          {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="mlf-field">
                      <div className="mlf-field-top">
                        <label>Подробное описание</label>
                        <span className={`mlf-char${descLen > MAX_DESC * 0.9 ? descLen >= MAX_DESC ? ' over' : ' warn' : ''}`}>
                          {descLen}/{MAX_DESC}
                        </span>
                      </div>
                      <textarea
                        value={form.description}
                        onChange={e => setForm(p => ({...p, description: e.target.value}))}
                        maxLength={MAX_DESC}
                        rows={5}
                      />
                    </div>

                    <div className="mlf-row2">
                      <div className="mlf-field">
                        <label>Город</label>
                        <input
                          value={form.city}
                          onChange={e => setForm(p => ({...p, city: e.target.value}))}
                          placeholder="Йошкар-Ола"
                        />
                      </div>
                      <div className="mlf-field">
                        <label>Адрес</label>
                        <input
                          value={form.address}
                          onChange={e => setForm(p => ({...p, address: e.target.value}))}
                          placeholder="ул. Ленина, 1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 3. БЮДЖЕТ ── */}
                <div className="mlf-card">
                  <div className="mlf-card-title">Бюджет на услугу</div>
                  <div className="mlf-price-block">
                    <div style={{ marginBottom: 12 }}>
                      <div className="mlf-field" style={{ margin: 0 }}>
                        <label>Бюджет, ₽ *</label>
                        <input
                          type="number"
                          min="1"
                          value={form.budget}
                          onChange={e => { setFormErr(''); setForm(p => ({...p, budget: e.target.value})); }}
                        />
                      </div>
                    </div>
                    {form.budget && Number(form.budget) > 0 ? (
                      <div style={{padding:'12px 14px', background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:8}}>
                        <div style={{fontSize:13, color:'#166534', fontWeight:600}}>
                          ✅ В заявке будет: <strong>до {Number(form.budget).toLocaleString('ru-RU')} ₽</strong>
                        </div>
                        <div style={{fontSize:12, color:'#16a34a', marginTop:3}}>
                          Мастера видят этот бюджет при поиске. Вы всегда можете его изменить.
                        </div>
                      </div>
                    ) : (
                      <div style={{padding:'12px 14px', background:'#fafafa', border:'1.5px solid #e8e8e8', borderRadius:8, fontSize:13, color:'#aaa'}}>
                        Укажите бюджет — мастера предложат свою цену
                      </div>
                    )}
                  </div>
                </div>

                {/* ── КНОПКА ── */}
                <div className="mlf-card">
                  <div className="mlf-submit-card">
                    <button
                      type="button"
                      className="mlf-btn-submit"
                      disabled={saving || !form.title.trim() || !form.categoryId || !form.budget || Number(form.budget) <= 0}
                      onClick={handleSave}
                    >
                      {saving
                        ? '⏳ Сохраняем…'
                        : isEdit
                          ? '💾 Сохранить изменения'
                          : '📢 Разместить заявку'}
                    </button>
                    <p style={{fontSize:12, color:'#bbb', textAlign:'center', marginTop:10, marginBottom:0}}>
                      {isEdit ? 'Изменения сразу увидят мастера' : 'Размещение бесплатно · Мастера увидят сразу после публикации'}
                    </p>
                    {isEdit && view?.edit?.id && (
                      <button
                        type="button"
                        className="mlf-btn-copy-outline"
                        onClick={(e) => copyRequestLink(view.edit.id, e)}
                      >
                        {copyFlashId === view.edit.id ? '✓ Ссылка скопирована' : '🔗 Копировать ссылку на заявку'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ══ САЙДБАР ══ */}
          <div className="mlf-sidebar">
            <div className="mlf-sb-card">
              <div className="mlf-sb-title">⚡ Как это работает</div>
              <div className="mlf-steps">
                {[
                  ['Разместите заявку',        'Опишите задачу и укажите бюджет — мастера сразу её увидят'],
                  ['Получайте отклики',         'Мастера откликаются и предлагают свою цену'],
                  ['Согласуйте детали',         'Обсудите объём работ и окончательную цену'],
                  ['Оплатите после выполнения', 'Оплата проходит после того, как вы подтвердите работу'],
                ].map(([title, desc], i) => (
                  <div key={i} className="mlf-step">
                    <span className="mlf-step-num">{i + 1}</span>
                    <div>
                      <div style={{fontSize:13, fontWeight:700, color:'#333', marginBottom:2}}>{title}</div>
                      <div style={{fontSize:12, color:'#888', lineHeight:1.5}}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mlf-sb-card">
              <div className="mlf-sb-title">🛡 Ваши преимущества</div>
              {[
                ['🔒', 'Безопасная сделка',  'Оплата поступает только после подтверждения работы'],
                ['⭐', 'Отзывы и рейтинг',  'Честные отзывы — только от реальных мастеров'],
                ['💬', 'Прямой чат',         'Общайтесь с мастером без посредников'],
              ].map(([ico, title, desc]) => (
                <div key={title} className="mlf-sb-item">
                  <span className="mlf-sb-ico">{ico}</span>
                  <div>
                    <div style={{fontWeight:600, fontSize:13, color:'#333', marginBottom:2}}>{title}</div>
                    <div style={{fontSize:12, color:'#888', lineHeight:1.45}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="mlf-lb" onClick={() => setLightbox(null)}>
            {lightbox.photos.length > 1 && (<>
              <button className="mlf-lb-btn mlf-lb-prev" onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index-1+l.photos.length)%l.photos.length})); }}>‹</button>
              <button className="mlf-lb-btn mlf-lb-next" onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index:(l.index+1)%l.photos.length})); }}>›</button>
              <div className="mlf-lb-counter">{lightbox.index+1} / {lightbox.photos.length}</div>
            </>)}
            <button className="mlf-lb-close" onClick={() => setLightbox(null)}>×</button>
            <div onClick={e => e.stopPropagation()} style={{maxWidth:'85vw', maxHeight:'80vh'}}>
              <img src={lightbox.photos[lightbox.index]} alt="" style={{maxWidth:'85vw', maxHeight:'80vh', borderRadius:10, display:'block', objectFit:'contain'}} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══ ДЕТАЛЬНАЯ СТРАНИЦА ══
  if (detail) {
    const hasPhoto = detail.photos?.length > 0;
    const catNameD = getCategoryName(detail.categoryId);
    const budget   = detail.budgetTo || detail.budgetFrom;
    return (
      <div className="ml-detail">
        <style>{css}</style>
        <div className="ml-detail-nav">
          <div style={{maxWidth:1000, margin:'0 auto', padding:'0 20px'}}>
            <button
              style={{background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:14, fontFamily:'Inter,sans-serif', padding:0}}
              onClick={() => { setDetail(null); setPhotoIdx(0); }}
            >← Мои заявки</button>
          </div>
        </div>

        <div className="ml-detail-wrap">
          <div>
            <div className="ml-detail-gallery">
              <div className="ml-detail-main-img" onClick={() => hasPhoto && setLightbox({photos: detail.photos, index: photoIdx})}>
                {hasPhoto
                  ? <img src={detail.photos[photoIdx]} alt="" />
                  : <div style={{fontSize:64, color:'#d1d5db'}}>📋</div>
                }
                {hasPhoto && detail.photos.length > 1 && (<>
                  <button onClick={e => {e.stopPropagation(); setPhotoIdx(i => (i-1+detail.photos.length)%detail.photos.length);}}
                    style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>‹</button>
                  <button onClick={e => {e.stopPropagation(); setPhotoIdx(i => (i+1)%detail.photos.length);}}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.45)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>›</button>
                  <div style={{position:'absolute',bottom:10,right:10,background:'rgba(0,0,0,.5)',color:'#fff',fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:999,zIndex:2}}>
                    {photoIdx+1} / {detail.photos.length}
                  </div>
                </>)}
              </div>
              {hasPhoto && detail.photos.length > 1 && (
                <div className="ml-detail-thumbs">
                  {detail.photos.map((p,i) => (
                    <div key={i} className={`ml-detail-thumb${i===photoIdx?' on':''}`} onClick={() => setPhotoIdx(i)}>
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ListingInfoPanels
              description={detail.description && detail.description !== 'Без описания' ? detail.description : ''}
              category={catNameD}
              address={[detail.city, detail.addressText].filter(Boolean).join(', ') || 'Не указан'}
              budgetLabel={budget && Number(budget) > 0 ? `до ${Number(budget).toLocaleString('ru-RU')} ₽` : 'Договорной'}
              publishedAt={detail.createdAt}
            />
          </div>

          <div className="ml-detail-right">
            <div className="ml-detail-price-card">
              <div className="ml-detail-price">
                {budget && Number(budget) > 0 ? `до ${Number(budget).toLocaleString('ru-RU')} ₽` : 'Договорной'}
              </div>
              <div className="ml-detail-price-unit">{STATUS_LABELS[detail.status] || detail.status}</div>
              {catNameD && <div style={{marginTop:8}}><span className="ml-tag">{catNameD}</span></div>}
            </div>
            <div className="ml-detail-actions-card">
              <div className="ml-section-label" style={{marginBottom:4}}>Управление</div>
              <button className="ml-btn-primary" onClick={() => openEdit(detail)}>Редактировать</button>
              <button className="ml-btn-outline" onClick={e => { setDetail(null); setTimeout(() => toggleOffers(detail.id, e), 100); }}>
                Смотреть отклики
              </button>
            </div>
            <div style={{background:'#fff', borderRadius:12, padding:'16px 20px'}}>
              <div className="ml-section-label">Ваш профиль</div>
              <div style={{display:'flex', alignItems:'center', gap:12, cursor:'pointer'}} onClick={() => navigate('/customer-profile')}>
                {ava
                  ? <img src={ava} alt="" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
                  : <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#e8410a,#ff7043)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0}}>
                      {(userName||'З')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{fullName}</div>
                  <div style={{fontSize:12,color:'#3b82f6',fontWeight:600}}>● Заказчик</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {lightbox && (
          <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,.93)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => setLightbox(null)}>
            {lightbox.photos.length > 1 && (<>
              <button onClick={e=>{e.stopPropagation();setLightbox(l=>({...l,index:(l.index-1+l.photos.length)%l.photos.length}));}}
                style={{position:'absolute',left:20,top:'50%',transform:'translateY(-50%)',zIndex:10001,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.18)',border:'none',color:'#fff',fontSize:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
              <button onClick={e=>{e.stopPropagation();setLightbox(l=>({...l,index:(l.index+1)%l.photos.length}));}}
                style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',zIndex:10001,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.18)',border:'none',color:'#fff',fontSize:30,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
            </>)}
            <div style={{position:'relative',maxWidth:'85vw',maxHeight:'80vh'}} onClick={e=>e.stopPropagation()}>
              <img src={lightbox.photos[lightbox.index]} alt="" style={{maxWidth:'85vw',maxHeight:'80vh',borderRadius:10,display:'block',userSelect:'none'}} />
              <button onClick={() => setLightbox(null)} style={{position:'absolute',top:12,right:12,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.18)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══ СПИСОК ══
  return (
    <div className="ml-page ml-list-shell">
      <style>{css}</style>

      {/* Hero-баннер */}
      <div className="ml-list-hero">
        <img src={DEFAULT_BG} alt="" className="ml-list-hero-img" />
        <div className="ml-list-hero-overlay" />
        <div className="ml-list-hero-body">
          <div>
            <h1 className="ml-h1">Мои заявки</h1>
            <p className="ml-h-sub">Управляйте заявками и откликами мастеров</p>
          </div>
          <button className="ml-new-btn" type="button" onClick={openCreate}>+ Разместить заявку</button>
        </div>
      </div>

      <div className="ml-wrap" style={{ paddingTop: 20 }}>
        <div className="ml-tabs">
          <button type="button" className={`ml-tab${tab==='active'?' on':''}`} onClick={() => setTab('active')}>
            Активные <span className="ml-tab-n">{active.length}</span>
          </button>
          <button type="button" className={`ml-tab${tab==='archive'?' on':''}`} onClick={() => setTab('archive')}>
            Архив <span className="ml-tab-n">{archive.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="ml-list">
            {[1,2,3].map(i => (
              <div key={i} className="ml-row" style={{ cursor: 'default', pointerEvents: 'none' }}>
                <div className="ml-row-img"><div className="ml-sk" style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
                <div className="ml-row-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                  <div className="ml-sk" style={{ height: 15, width: '55%' }} />
                  <div className="ml-sk" style={{ height: 22, width: '30%' }} />
                  <div className="ml-sk" style={{ height: 12, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="ml-empty">
            <div style={{ fontSize: 52, marginBottom: 16 }}>{tab === 'active' ? '📋' : '📦'}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>
              {tab === 'active' ? 'Нет активных заявок' : 'Архив пуст'}
            </h3>
            <p style={{ fontSize: 14, margin: '0 0 20px' }}>
              {tab === 'active' ? 'Разместите заявку, чтобы мастера откликнулись' : 'Завершённые и закрытые заявки появятся здесь'}
            </p>
            {tab === 'active' && <button type="button" className="ml-new-btn" onClick={openCreate}>+ Разместить заявку</button>}
          </div>
        ) : (
          <div className="ml-list">
            {shown.map(req => {
              const catName  = getCategoryName(req.categoryId);
              const budget   = req.budgetTo || req.budgetFrom;
              const stLabel  = STATUS_LABELS[req.status] || req.status;
              const isActive = isActiveStatus(req.status);
              const isExp    = expandedId === req.id;
              return (
                <div key={req.id}>
                  <div
                    className="ml-row"
                    style={isExp ? { borderRadius: '16px 16px 0 0', borderBottomColor: 'transparent' } : {}}
                    onClick={() => { setDetail(req); setPhotoIdx(0); }}
                  >
                    <div className="ml-row-img">
                      {req.photos?.length
                        ? <><img src={req.photos[0]} alt="" />{req.photos.length > 1 && <span className="ml-row-img-cnt">📷{req.photos.length}</span>}</>
                        : <div className="ml-row-img-ph">📋</div>
                      }
                    </div>
                    <div className="ml-row-body">
                      <div className="ml-row-title">{req.title}</div>
                      <div className="ml-row-price">
                        {budget && Number(budget) > 0
                          ? <>до {Number(budget).toLocaleString('ru-RU')} ₽<span className="ml-row-unit">бюджет</span></>
                          : <span style={{fontSize:14, fontWeight:600, color:'#64748b'}}>Договорной</span>
                        }
                      </div>
                      {catName && <span className="ml-row-cat">{catName}</span>}
                      {req.description && req.description !== 'Без описания' && (
                        <div className="ml-row-desc">{req.description}</div>
                      )}
                      <div className="ml-row-date">{req.createdAt ? new Date(req.createdAt).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}) : '—'}</div>
                      <div className="ml-row-stats">
                        <div className="ml-row-stat">
                          <span className="ml-row-stat-num">{req.offersCount ?? 0}</span>
                          <span>{pluralOffers(req.offersCount ?? 0)}</span>
                        </div>
                        <div className={isActive ? 'ml-row-stat-status-active' : 'ml-row-stat-status-arch'}>
                          {stLabel}
                        </div>
                      </div>
                    </div>
                    <div className="ml-row-actions" onClick={e => e.stopPropagation()}>
                      <button type="button" className="ml-btn-edit" onClick={e => openEdit(req, e)}>Редактировать</button>
                      <button
                        type="button"
                        className={`ml-btn-copy${copyFlashId === req.id ? ' copied' : ''}`}
                        onClick={e => copyRequestLink(req.id, e)}
                      >
                        {copyFlashId === req.id ? 'Ссылка скопирована' : 'Копировать ссылку'}
                      </button>
                      <div className="ml-actions-divider" />
                      <button
                        type="button"
                        className={isExp ? 'ml-btn-restore' : 'ml-btn-arch'}
                        onClick={e => toggleOffers(req.id, e)}
                      >
                        {isExp ? 'Скрыть отклики' : 'Смотреть отклики'}
                      </button>
                    </div>
                  </div>

                  {/* Offers panel */}
                  {isExp && (
                    <div className="ml-offers-panel">
                      <div className="ml-offers-title">Отклики мастеров</div>
                      {offersLoading && <div className="ml-sk" style={{height:60, borderRadius:12}} />}
                      {!offersLoading && offers.length === 0 && (
                        <p style={{fontSize:13, color:'#9ca3af', margin:0}}>Откликов пока нет. Мастера увидят вашу заявку и предложат цену.</p>
                      )}
                      {!offersLoading && offers.map(offer => {
                        const agreedPrice = budget && Number(offer.price) === Number(budget);
                        const cheaper     = budget && Number(offer.price) < Number(budget);
                        return (
                          <div
                            key={offer.id}
                            className="ml-offer-card"
                            style={agreedPrice ? { borderColor: '#22c55e', background: '#f0fdf4' } : {}}
                          >
                            <div className="ml-offer-top">
                              <div>
                                <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                                  <span className="ml-offer-price">{Number(offer.price).toLocaleString('ru-RU')} ₽</span>
                                  {offer.estimatedDays && <span className="ml-offer-days">· {offer.estimatedDays} дн.</span>}
                                  {agreedPrice && (
                                    <span style={{fontSize:12, fontWeight:700, color:'#16a34a', background:'#dcfce7', padding:'2px 8px', borderRadius:12}}>✅ Принял вашу цену</span>
                                  )}
                                  {cheaper && !agreedPrice && (
                                    <span style={{fontSize:12, fontWeight:700, color:'#2563eb', background:'#dbeafe', padding:'2px 8px', borderRadius:12}}>
                                      −{(Number(budget) - Number(offer.price)).toLocaleString('ru-RU')} ₽ дешевле
                                    </span>
                                  )}
                                  {budget && Number(offer.price) > Number(budget) && (
                                    <span style={{fontSize:12, fontWeight:600, color:'#d97706', background:'#fef3c7', padding:'2px 8px', borderRadius:12}}>
                                      +{(Number(offer.price) - Number(budget)).toLocaleString('ru-RU')} ₽ к бюджету
                                    </span>
                                  )}
                                </div>
                                {offer.workerName && <div className="ml-offer-name">{offer.workerName}</div>}
                              </div>
                              <button
                                className="ml-accept-btn"
                                disabled={actionLoading === offer.id}
                                onClick={e => handleAccept(req.id, offer.id, e)}
                              >
                                {actionLoading === offer.id ? '...' : 'Принять'}
                              </button>
                            </div>
                            {offer.message && <p className="ml-offer-msg">{offer.message}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
