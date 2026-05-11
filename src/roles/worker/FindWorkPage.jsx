import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaRegClock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer, getCategories, getCustomerStats } from '../../api';
import {
  formatJobRequestBudgetLabel,
  getJobRequestPublishedBudgetNumber,
  hasJobRequestPublishedPrice,
  JOB_REQUEST_PRICE_MISSING_LABEL,
} from '../../utils/jobRequestBudget';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import './FindWorkPage.css';
import './jobListings.css';
import { PAGE_HERO_DEFAULT_PHOTO, heroPhotoHiRes, PAGE_HERO_IMG_FILTER, PAGE_HERO_OVERLAY_GRADIENT, PAGE_HERO_OBJECT_POSITION, PAGE_HERO_OBJECT_FIT } from '../../constants/pageHeroAssets';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { smartTextMatchScore, jobRequestHaystack, rankItemsBySmartMatch } from '../../utils/smartSearch';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import { categoryChipToneClass } from '../../utils/categoryChipTone';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
} from '../../utils/categoryPlaceholderPhoto';

const FW_DEFAULT_BG = PAGE_HERO_DEFAULT_PHOTO;

const JD_BACKEND = 'https://svoi-mastera-backend.onrender.com';
const jdPhotoUrl = (u) =>
  !u ? null : u.startsWith('http') || u.startsWith('data:') ? u : JD_BACKEND + u;

const jdFmtDateLong = (d) =>
  !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const CAT_ALL = {};
Object.values(CATEGORIES_BY_SECTION).forEach(cats =>
  cats.forEach(cat => { CAT_ALL[cat.slug] = { ...cat, photo: heroPhotoHiRes(cat.photo) }; })
);

function reviewsCountLabel(n) {
  const x = Number(n) || 0;
  const abs = x % 100;
  const d = x % 10;
  if (abs > 10 && abs < 20) return `${x} отзывов`;
  if (d === 1) return `${x} отзыв`;
  if (d >= 2 && d <= 4) return `${x} отзыва`;
  return `${x} отзывов`;
}

const fw2css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .fw2-page {
    background: #f2f2f2;
    min-height: 100vh;
    font-family: Inter, Arial, sans-serif;
    color: #1a1a1a;
  }

  /* ═══ HERO ═══ */
  .fw2-hero {
    position: relative;
    height: var(--page-hero-h-desktop);
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }
  .fw2-hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: ${PAGE_HERO_OBJECT_FIT};
    object-position: ${PAGE_HERO_OBJECT_POSITION};
    filter: ${PAGE_HERO_IMG_FILTER};
    transition: opacity .4s ease;
  }
  .fw2-hero-overlay {
    position: absolute;
    inset: 0;
    background: ${PAGE_HERO_OVERLAY_GRADIENT};
  }
  .fw2-hero-body {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px 36px;
    width: 100%;
  }
  .fw2-hero h1 {
    font-size: clamp(24px, 4vw, 38px);
    font-weight: 900;
    color: #fff;
    margin: 0 0 6px;
    letter-spacing: -.4px;
    line-height: 1.15;
  }
  .fw2-hero-sub {
    font-size: 14px;
    color: rgba(255,255,255,.7);
    margin: 0 0 18px;
  }
  .fw2-hero-stats {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  .fw2-hero-stat {
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
  .fw2-hero-stat-val {
    font-weight: 900;
    font-size: 15px;
    color: #fff;
  }

  /* ═══ КАТЕГОРИИ СЕТКА ═══ */
  .fw2-cats-wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 24px 60px;
  }
  .fw2-cats-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #888;
    margin-bottom: 16px;
  }
  .fw2-cats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }
  .fw2-cat-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    color: inherit;
    display: flex;
    flex-direction: column;
    border: 1.5px solid #e8e8e8;
    transition: box-shadow .22s, transform .22s, border-color .22s;
    cursor: pointer;
    text-align: left;
    padding: 0;
    font-family: Inter, Arial, sans-serif;
  }
  .fw2-cat-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,.13);
    transform: translateY(-4px);
    border-color: #e8410a;
  }
  .fw2-cat-img-wrap {
    position: relative;
    height: 150px;
    overflow: hidden;
    background: #f0f0f0;
    flex-shrink: 0;
  }
  .fw2-cat-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .fw2-cat-card:hover .fw2-cat-img-wrap img { transform: scale(1.08); }
  .fw2-cat-img-ph {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52px;
  }
  .fw2-cat-badge {
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
  .fw2-cat-body {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .fw2-cat-name {
    font-size: 16px;
    font-weight: 800;
    color: #111;
    margin-bottom: 5px;
    line-height: 1.25;
  }
  .fw2-cat-desc {
    font-size: 13px;
    color: #777;
    line-height: 1.55;
    flex: 1;
    margin-bottom: 14px;
  }
  .fw2-cat-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }
  .fw2-cat-count { font-size: 12px; color: #e8410a; font-weight: 700; }
  .fw2-cat-count-none { font-size: 12px; color: #aaa; }
  .fw2-cat-go {
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
  .fw2-cat-card:hover .fw2-cat-go { background: #e8410a; color: #fff; }

  /* ═══ TOPBAR ПОИСКА ═══ */
  .fw2-topbar {
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    padding: 14px 0;
  }
  .fw2-topbar-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .fw2-search-wrap {
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
  .fw2-search-wrap:focus-within { border-color: #e8410a; }
  .fw2-search-wrap input {
    flex: 1;
    border: none;
    background: none;
    font-size: 14px;
    padding: 11px 0;
    outline: none;
    font-family: Inter, sans-serif;
    color: #1a1a1a;
  }
  .fw2-search-wrap input::placeholder { color: #bbb; }
  .fw2-topbar-btn {
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
  .fw2-topbar-btn:hover { background: #c73208; }

  .fw2-search-dd-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .fw2-search-dropdown {
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
  .fw2-search-hint {
    padding: 14px;
    font-size: 13px;
    color: #777;
    line-height: 1.45;
  }
  .fw2-search-hit {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    text-align: left;
    width: 100%;
    border: none;
    background: #fff;
    cursor: pointer;
    font-family: Inter, sans-serif;
    color: inherit;
    border-top: 1px solid #f0f0f0;
    transition: background 0.12s;
  }
  .fw2-search-hit:first-of-type { border-top: none; }
  .fw2-search-hit:hover { background: #fafafa; }
  .fw2-search-hit-ph {
    width: 46px;
    height: 46px;
    border-radius: 8px;
    overflow: hidden;
    background: #f0f0f0;
    flex-shrink: 0;
  }
  .fw2-search-hit-ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .fw2-search-hit-ph span {
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
  .fw2-search-hit-body { flex: 1; min-width: 0; text-align: left; }
  .fw2-search-hit-title {
    font-size: 13px;
    font-weight: 700;
    color: #111;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fw2-search-hit-meta {
    font-size: 11px;
    color: #888;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fw2-search-footer {
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
  .fw2-search-footer:hover { background: #fff5f0; }

  /* Хлебные крошки */
  .fw2-breadcrumb {
    max-width: 1180px;
    margin: 0 auto;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #999;
  }
  .fw2-breadcrumb button {
    color: #999;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
    transition: color .15s;
  }
  .fw2-breadcrumb button:hover { color: #e8410a; }
  .fw2-breadcrumb-sep { color: #ccc; }
  .fw2-breadcrumb-cur { color: #1a1a1a; font-weight: 600; }

  /* ═══ LAYOUT КАТЕГОРИИ ═══ */
  .fw2-cat-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 20px 24px 60px;
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 20px;
    align-items: start;
  }
  .fw2-sidebar {
    position: sticky;
    top: 76px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .fw2-sb-cat {
    background: #fff;
    overflow: hidden;
  }
  .fw2-sb-cat-photo {
    position: relative;
    height: 110px;
    overflow: hidden;
    background: #1a1a2e;
  }
  .fw2-sb-cat-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(.6) saturate(1.1);
  }
  .fw2-sb-cat-photo-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(170deg, transparent 40%, rgba(0,0,0,.7) 100%);
    display: flex;
    align-items: flex-end;
    padding: 10px 12px;
  }
  .fw2-sb-cat-name {
    font-size: 16px;
    font-weight: 900;
    color: #fff;
    line-height: 1.2;
  }
  .fw2-sb-cat-body { padding: 12px 14px; }
  .fw2-sb-back {
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
  .fw2-sb-back:hover { opacity: .75; }
  .fw2-filter-card {
    background: #fff;
    overflow: hidden;
  }
  .fw2-filter-title {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
    padding: 13px 14px 11px;
    border-bottom: 1px solid #f0f0f0;
  }
  .fw2-filter-body { padding: 12px 14px; }
  .fw2-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .fw2-price-label { font-size: 11px; color: #999; margin-bottom: 3px; }
  .fw2-price-inp {
    width: 100%;
    border: 1.5px solid #e8e8e8;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
    font-family: Inter, sans-serif;
    outline: none;
    transition: border-color .15s;
    color: #1a1a1a;
    background: #fff;
  }
  .fw2-price-inp:focus { border-color: #e8410a; }
  .fw2-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    cursor: pointer;
    user-select: none;
    font-size: 13px;
    color: #333;
    transition: color .15s;
  }
  .fw2-check-item:hover { color: #e8410a; }
  .fw2-check-box {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 2px solid #d1d5db;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .15s;
  }
  .fw2-check-box.on { background: #e8410a; border-color: #e8410a; }
  .fw2-check-tick { font-size: 11px; color: #fff; font-weight: 700; }
  .fw2-reset-btn {
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
  .fw2-reset-btn:hover { background: #fee8e0; border-color: #e8410a; color: #e8410a; }

  /* ═══ ОСНОВНАЯ ЗОНА ═══ */
  .fw2-main { min-width: 0; }
  .fw2-sort-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .fw2-sort-label { font-size: 13px; color: #888; font-weight: 600; white-space: nowrap; }
  .fw2-sort-opts { display: flex; gap: 6px; flex-wrap: wrap; }
  .fw2-sort-opt {
    padding: 7px 14px;
    border-radius: 20px;
    border: 1.5px solid #e8e8e8;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    font-family: inherit;
    transition: all .15s;
  }
  .fw2-sort-opt:hover { border-color: #e8410a; color: #e8410a; }
  .fw2-sort-opt.active { background: #e8410a; border-color: #e8410a; color: #fff; }
  .fw2-result-count { margin-left: auto; font-size: 13px; color: #aaa; font-weight: 500; }

  /* ═══ КАРТОЧКИ ЗАЯВОК (оболочка — unifiedListingCards.css) ═══ */
  .fw2-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .fw2-card {
    cursor: default;
  }
  .fw2-card-photo {
    position: relative;
    padding-top: 62%;
    overflow: hidden;
    background: #f0f0f0;
    flex-shrink: 0;
    cursor: pointer;
  }
  .fw2-card-photo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .fw2-card-photo:hover img { transform: scale(1.05); }
  .fw2-card-photo-ph {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #f5f5f5;
  }
  .fw2-card-photo-ph-ico { font-size: 44px; }
  .fw2-card-photo-ph-txt { font-size: 11px; color: #bbb; font-weight: 600; }
  .fw2-card-photo-cnt {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0,0,0,.55);
    backdrop-filter: blur(4px);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
  }
  .fw2-card-photo-active {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #e8410a;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: .04em;
    z-index: 2;
  }
  .fw2-card-photo-hover {
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
    z-index: 1;
    pointer-events: none;
  }
  .fw2-card-photo:hover .fw2-card-photo-hover { opacity: 1; }
  .fw2-thumbs {
    display: flex;
    gap: 4px;
    padding: 6px 12px 0;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    overflow: hidden;
    cursor: pointer;
  }
  .fw2-thumb {
    width: 40px;
    height: 28px;
    object-fit: cover;
    border-radius: 4px;
    border: 1.5px solid #f0f0f0;
    cursor: pointer;
    pointer-events: none;
    flex-shrink: 0;
  }
  .fw2-thumb-more {
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
  .fw2-card-body {
    padding: 12px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .fw2-card-customer {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 0;
  }
  a.fw2-card-customer {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    border-radius: 8px;
    margin: -2px -2px 0;
    padding: 2px;
    transition: opacity .15s;
    width: 100%;
    max-width: 100%;
  }
  a.fw2-card-customer:hover { opacity: .85; }
  a.fw2-card-customer:focus-visible {
    outline: 2px solid #e8410a;
    outline-offset: 2px;
  }
  .fw2-card-detail-zone {
    cursor: pointer;
    flex: 1;
    min-height: 0;
  }
  .fw2-card-detail-zone:focus-visible {
    outline: 2px solid #e8410a;
    outline-offset: 2px;
    border-radius: 6px;
  }
  .fw2-card-ava {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid #f0f0f0;
  }
  .fw2-card-ava-ph {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 11px;
    color: #fff;
    flex-shrink: 0;
  }
  .fw2-card-customer-name { font-size: 12px; font-weight: 700; color: #333; line-height: 1.2; }
  .fw2-card-customer-sub  { font-size: 11px; color: #22c55e; margin-top: 1px; font-weight: 600; line-height: 1.35; }
  .fw2-card-title {
    font-size: 15px;
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fw2-card-desc {
    font-size: 12px;
    color: #777;
    line-height: 1.55;
    flex: 1;
    min-height: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fw2-card-badges { display: flex; gap: 5px; flex-wrap: wrap; }
  .fw2-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    white-space: nowrap;
  }
  .fw2-badge-v { background: #e6f4ea; color: #1a7340; }
  .fw2-badge-f { background: #fff3e0; color: #b45309; }
  .fw2-badge-g { background: #ede9fe; color: #5b21b6; }
  .fw2-card-stats {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #888;
    flex-wrap: wrap;
  }
  a.fw2-card-stats--link {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    border-radius: 8px;
    margin: 0 -4px;
    padding: 4px 6px;
    transition: background .15s;
  }
  a.fw2-card-stats--link:hover {
    background: rgba(232, 65, 10, 0.08);
    color: #444;
  }
  .fw2-stars { color: #f59e0b; font-size: 11px; letter-spacing: .5px; }
  .fw2-rating-val { font-weight: 800; color: #1a1a1a; font-size: 12px; }
  .fw2-rating-opt {
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
    transition: border-color .15s, background .15s, color .15s;
  }
  .fw2-rating-opt:last-child { margin-bottom: 0; }
  .fw2-rating-opt:hover { border-color: #e8410a; background: #fff8f5; }
  .fw2-rating-opt.active { border-color: #e8410a; background: #fff5f2; color: #e8410a; font-weight: 700; }
  .fw2-stars-filter { color: #f59e0b; font-size: 13px; letter-spacing: .5px; }
  .fw2-card-footer {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-top: auto;
    padding: 12px 14px 14px;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
  }
  .fw2-card-price-block { width: 100%; flex-shrink: 0; }
  .fw2-card-price {
    font-size: 16px;
    font-weight: 900;
    color: #1a1a1a;
    letter-spacing: -.3px;
    line-height: 1;
    white-space: nowrap;
  }
  .fw2-card-price-unit {
    font-size: 11px;
    color: #999;
    font-weight: 400;
    display: block;
    margin-top: 2px;
    white-space: nowrap;
  }
  .fw2-card-price-none {
    font-size: 14px;
    font-weight: 700;
    color: #999;
  }
  .fw2-card-info {
    font-size: 11px;
    color: #888;
    margin-top: 0;
  }
  .fw2-card-actions {
    display: flex;
    flex-direction: row;
    width: 100%;
    min-width: 0;
    gap: 6px;
    align-items: stretch;
  }
  .fw2-btn-respond {
    flex: 1;
    min-width: 0;
    width: auto;
    padding: 9px 8px;
    background: #e8410a;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    white-space: nowrap;
  }
  .fw2-btn-respond:hover { background: #c73208; }
  .fw2-btn-msg {
    flex: 1;
    min-width: 0;
    width: auto;
    padding: 8px 8px;
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 8px;
    color: #333;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: border-color .15s, color .15s;
  }
  .fw2-btn-msg:hover:not(:disabled) { border-color: #e8410a; color: #e8410a; }
  .fw2-btn-msg:disabled { opacity: .45; cursor: not-allowed; }

  /* ═══ ПУСТОЕ СОСТОЯНИЕ ═══ */
  .fw2-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 72px 24px;
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #e8e8e8;
  }
  .fw2-empty-ico { font-size: 52px; margin-bottom: 14px; }
  .fw2-empty h3 { font-size: 17px; font-weight: 800; color: #1a1a1a; margin: 0 0 8px; }
  .fw2-empty p  { font-size: 14px; color: #888; line-height: 1.6; max-width: 340px; margin: 0 auto; }

  /* ═══ СКЕЛЕТОН ═══ */
  @keyframes fw2skel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .fw2-sk {
    background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size: 200% 100%;
    animation: fw2skel 1.4s infinite;
    border-radius: 6px;
  }

  /* ═══ АДАПТИВ ═══ */
  @media(max-width: 900px) {
    .fw2-cat-page { grid-template-columns: 1fr; }
    .fw2-sidebar { position: static; }
    .fw2-list { grid-template-columns: 1fr 1fr; }
  }
  @media(max-width: 768px) {
    .fw2-hero-body {
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
      padding-bottom: 28px;
    }
    .fw2-cats-wrap {
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
    }
    .fw2-list { grid-template-columns: 1fr; }
    .fw2-card-actions {
      flex-direction: column;
      gap: 8px;
    }
    .fw2-btn-respond,
    .fw2-btn-msg {
      width: 100%;
      min-height: 46px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  @media(max-width: 620px) {
    .fw2-list { grid-template-columns: 1fr; }
    .fw2-cats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .fw2-hero { height: var(--page-hero-h-mobile); }
  }
`;

const CATEGORY_STYLES = {
  'remont-kvartir':       { emoji: '🏠', color: '#fff3e0' },
  'santehnika':           { emoji: '🔧', color: '#e3f2fd' },
  'elektrika':            { emoji: '⚡', color: '#fffde7' },
  'uborka':               { emoji: '🧹', color: '#fce4ec' },
  'parikhmaher':          { emoji: '💇', color: '#fce4ec' },
  'manikur':              { emoji: '💅', color: '#fce4ec' },
  'krasota-i-zdorovie':   { emoji: '✨', color: '#f3e5f5' },
  'repetitorstvo':        { emoji: '📚', color: '#e3f2fd' },
  'kompyuternaya-pomosh': { emoji: '💻', color: '#e8f5e9' },
};

function pluralRequests(n) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} заявка`;
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return `${n} заявки`;
  return `${n} заявок`;
}

function jobRequestListPrice(req) {
  return getJobRequestPublishedBudgetNumber(req);
}

function OfferModal({ request, offerForm, setOfferForm, onClose, onSubmit, submitting }) {
  if (!request) return null;
  return (
    <div className="fw-modal-overlay" onClick={onClose}>
      <div className="fw-modal" onClick={e => e.stopPropagation()}>
        <div className="fw-modal-header">
          <h3 className="fw-modal-title">📩 Отклик на заявку</h3>
          <p className="fw-modal-subtitle">{request.title}</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="fw-modal-body">
            <div className="fw-modal-field">
              <label className="fw-modal-label">Ваша цена за работу, ₽ *</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 5000"
                value={offerForm.price}
                onChange={e => setOfferForm(prev => ({ ...prev, price: e.target.value }))}
                required
                min="1"
                autoFocus
              />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                Оплата — наличными или переводом напрямую заказчику после работы. Условия уточняйте в личных сообщениях.
              </p>
            </div>
            <div className="fw-modal-field">
              <label className="fw-modal-label">Срок выполнения (дней)</label>
              <input
                type="number"
                className="fw-modal-input"
                placeholder="Например, 3"
                value={offerForm.estimatedDays}
                onChange={e => setOfferForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                min="1"
              />
            </div>
            <div className="fw-modal-field">
              <label className="fw-modal-label">Комментарий</label>
              <textarea
                className="fw-modal-input fw-modal-textarea"
                placeholder="Опишите как вы выполните работу, ваш опыт..."
                value={offerForm.comment}
                onChange={e => setOfferForm(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>
          </div>
          <div className="fw-modal-footer">
            <button type="button" className="fw-modal-cancel" onClick={onClose}>Отмена</button>
            <button type="submit" className="fw-modal-submit" disabled={submitting || !offerForm.price}>
              {submitting ? 'Отправка...' : '📩 Отправить отклик'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FindWorkPage() {
  const { userId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests,         setRequests]         = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRequest,  setSelectedRequest]  = useState(null);
  const [activePhotoIdx,   setActivePhotoIdx]   = useState(0);
  const [showOfferModal,   setShowOfferModal]   = useState(null);
  const [offerForm,        setOfferForm]        = useState({ price: '', comment: '', estimatedDays: '' });
  const [submitting,       setSubmitting]       = useState(false);
  const [lightbox,         setLightbox]         = useState(null);
  const [heroCatSlug,      setHeroCatSlug]      = useState(null); // hover на карточке категории
  // Фильтры/поиск для экрана 2
  const [searchInput,   setSearchInput]   = useState('');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [priceMin,      setPriceMin]      = useState('');
  const [priceMax,      setPriceMax]      = useState('');
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [sortBy,        setSortBy]        = useState('recency');
  const [ratingMin,     setRatingMin]     = useState(0);
  const [customerStats, setCustomerStats] = useState({});

  const [debouncedFwSearch, setDebouncedFwSearch] = useState('');
  const [fwSearchFocused, setFwSearchFocused] = useState(false);
  const fwSearchDdRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFwSearch(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!fwSearchFocused) return;
    const onDoc = (e) => {
      if (fwSearchDdRef.current && !fwSearchDdRef.current.contains(e.target)) {
        setFwSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [fwSearchFocused]);

  useEffect(() => {
    if (!fwSearchFocused) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setFwSearchFocused(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fwSearchFocused]);

  const fwDdMatches = useMemo(() => {
    if (!selectedCategory || !debouncedFwSearch || debouncedFwSearch.length < 2) return [];
    const pool = requests.filter((r) => r.categoryId === selectedCategory.id);
    return rankItemsBySmartMatch(pool, debouncedFwSearch, jobRequestHaystack, { limit: 8 });
  }, [requests, selectedCategory, debouncedFwSearch]);

  const showFwSearchDd = fwSearchFocused && debouncedFwSearch.length >= 2;

  React.useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') setLightbox(l => l ? {...l, index: l.index < l.photos.length - 1 ? l.index + 1 : 0} : l);
      if (e.key === 'ArrowLeft')  setLightbox(l => l ? {...l, index: l.index > 0 ? l.index - 1 : l.photos.length - 1} : l);
      if (e.key === 'Escape')     setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  const requestIdFromUrl = searchParams.get('request');

  useEffect(() => {
    if (!requestIdFromUrl || loading) return;
    const req = requests.find(r => String(r.id) === String(requestIdFromUrl));
    if (!req) {
      if (requests.length > 0) {
        showToast('Заявка закрыта или недоступна', 'info');
        setSearchParams(p => { const next = new URLSearchParams(p); next.delete('request'); return next; }, { replace: true });
      }
      return;
    }
    const cat = categories.find(c => c.id === req.categoryId);
    if (cat) setSelectedCategory(cat);
    setSelectedRequest(req);
    setActivePhotoIdx(0);
    setSearchParams(p => { const next = new URLSearchParams(p); next.delete('request'); return next; }, { replace: true });
  }, [requestIdFromUrl, loading, requests, categories, setSearchParams, showToast]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, reqs] = await Promise.all([
        getCategories(),
        getOpenJobRequestsForWorker(userId),
      ]);
      setCategories(cats || []);
      setRequests(reqs || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  useSameRouteRefetch('/find-work', loadData);

  useEffect(() => {
    if (!requests?.length) return undefined;
    const ids = [...new Set(requests.map(r => r.customerId).filter(Boolean))];
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        ids.map(async (cid) => {
          try {
            const st = await getCustomerStats(cid);
            return [String(cid), st];
          } catch {
            return [String(cid), { averageRating: 0, reviewsCount: 0 }];
          }
        }),
      );
      if (!cancelled) {
        setCustomerStats(prev => {
          const next = { ...prev };
          pairs.forEach(([id, st]) => {
            next[id] = st;
          });
          return next;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [requests]);

  const getRequestsForCategory = (cat) =>
    requests.filter(r => r.categoryId === cat.id);

  const openRequestDetail = useCallback((req) => {
    setSelectedRequest(req);
    setActivePhotoIdx(0);
  }, []);

  const handleOpenOfferModal = (request) => {
    setShowOfferModal(request);
    const p = jobRequestListPrice(request);
    setOfferForm({
      price: p != null && !Number.isNaN(p) ? String(p) : '',
      comment: '',
      estimatedDays: '',
    });
  };

  const handleCloseOfferModal = () => {
    setShowOfferModal(null);
    setOfferForm({ price: '', comment: '', estimatedDays: '' });
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.price) { showToast('Укажите цену', 'error'); return; }
    setSubmitting(true);
    try {
      await createJobOffer(userId, showOfferModal.id, {
        price:         Number(offerForm.price),
        message:       offerForm.comment || 'Готов выполнить работу',
        estimatedDays: offerForm.estimatedDays ? Number(offerForm.estimatedDays) : null,
      });
      showToast('Отклик отправлен!', 'success');
      handleCloseOfferModal();
      loadData();
    } catch (err) {
      console.error('Failed to create offer:', err);
      showToast('Не удалось отправить отклик', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCategoryFilters = useCallback(() => {
    setSearchInput(''); setSearchTerm('');
    setPriceMin(''); setPriceMax('');
    setOnlyWithPhoto(false); setSortBy('recency'); setRatingMin(0);
  }, []);

  // ═══ ЭКРАН 3: детальная заявка (вёрстка jd-* из jobListings.css) ═══
  if (selectedRequest) {
    const req = selectedRequest;
    const catStyle = CATEGORY_STYLES[selectedCategory?.slug] || { emoji: '📋', color: '#f3f4f6' };
    const jdPhotosRaw = (req.photos || []).map(jdPhotoUrl).filter(Boolean);
    const jdPlaceholder = getCategoryPlaceholderPhotoUrlOrDefault(
      { categoryName: req.categoryName, categoryId: req.categoryId },
      categories,
    );
    const jdPhotos = jdPhotosRaw.length ? jdPhotosRaw : [jdPlaceholder];
    const mainSrc = jdPhotos[activePhotoIdx] || null;
    const budget = formatJobRequestBudgetLabel(req);
    const priceIsNegotiable = !hasJobRequestPublishedPrice(req);
    const addressLine = (req.addressText || req.address || req.cityName || '').trim();
    const custRatingStats = req.customerId ? customerStats[String(req.customerId)] : null;
    const custAvg = custRatingStats?.averageRating ?? 0;
    const custCnt = custRatingStats?.reviewsCount ?? 0;
    const custStars = Math.min(5, Math.max(0, Math.round(Number(custAvg) || 0)));
    const custNameFull = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
    const categoryLabel = selectedCategory?.name || req.categoryName;
    const breadCrumbTitle =
      (req.title || '').length > 40 ? `${(req.title || '').slice(0, 37)}…` : (req.title || '');

    return (
      <>
      <div className="jd-detail-shell">
        <div className="jd-breadcrumb-bar">
          <div className="jd-breadcrumb-inner">
            <button
              type="button"
              className="jd-breadcrumb-back"
              onClick={() => {
                setSelectedRequest(null);
                setActivePhotoIdx(0);
              }}
            >
              <span className="jd-breadcrumb-back-ico" aria-hidden>
                ←
              </span>
              Назад
            </button>
            <span className="jd-breadcrumb-sep jd-breadcrumb-sep-bar">|</span>
            <Link to="/">Главная</Link>
            <span className="jd-breadcrumb-sep">›</span>
            <Link to="/find-work">Найти работу</Link>
            {categoryLabel && (
              <>
                <span className="jd-breadcrumb-sep">›</span>
                <span className="jd-breadcrumb-muted">{categoryLabel}</span>
              </>
            )}
            <span className="jd-breadcrumb-sep">›</span>
            <span className="jd-breadcrumb-current">{breadCrumbTitle}</span>
          </div>
        </div>

        <div className="jd-detail-page">
          <div className="jd-detail-main">
            <header className="jd-fw-head">
              <h1 className="jd-fw-title">{req.title}</h1>
              <div className="jd-fw-meta">
                {categoryLabel && (
                  <span className={`ml-row-cat jd-meta-cat ${categoryChipToneClass(categoryLabel)}`}>
                    {categoryLabel}
                  </span>
                )}
                {addressLine && <span className="jd-fw-meta-item">📍 {addressLine}</span>}
                {req.createdAt && (
                  <span className="jd-fw-meta-item">📅 {jdFmtDateLong(req.createdAt)}</span>
                )}
              </div>
            </header>

            <div className="jd-fw-gallery-card">
              <div className="jd-gallery-wrap">
                <div
                  className="jd-gallery-main"
                  role="presentation"
                  onClick={() => jdPhotos.length > 0 && setLightbox({ photos: jdPhotos, index: activePhotoIdx })}
                  style={{ cursor: jdPhotos.length ? 'pointer' : 'default' }}
                >
                  {mainSrc ? (
                    <img src={mainSrc} alt={req.title || ''} />
                  ) : (
                    <div className="jd-gallery-ph">{catStyle.emoji}</div>
                  )}
                  {jdPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="jd-gallery-nav-btn prev"
                        aria-label="Предыдущее фото"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((i) => (i > 0 ? i - 1 : jdPhotos.length - 1));
                        }}
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        type="button"
                        className="jd-gallery-nav-btn next"
                        aria-label="Следующее фото"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((i) => (i < jdPhotos.length - 1 ? i + 1 : 0));
                        }}
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                </div>
                {jdPhotos.length > 1 && (
                  <div className="jd-thumbs-strip">
                    {jdPhotos.map((p, i) => (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        className={`jd-thumb-tile${i === activePhotoIdx ? ' active' : ''}`}
                        onClick={() => setActivePhotoIdx(i)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActivePhotoIdx(i);
                          }
                        }}
                      >
                        <img src={p} alt="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {req.description && req.description !== 'Без описания' && (
              <div className="jd-card jd-detail-card">
                <h3 className="jd-desc-head">Описание</h3>
                <div className="jd-desc-body">
                  {formatListingOriginDescription('WORKER', req.description)}
                </div>
                {req.urgency && (
                  <div className="jd-urgency">
                    <FaRegClock aria-hidden />
                    <span>
                      <b>Срочность:</b> {req.urgency}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="jd-card jd-detail-card">
              <h3 className="jd-details-head">Подробности</h3>
              {categoryLabel && (
                <div className="jd-row">
                  <span className="k">Категория</span>
                  <span className="v">{categoryLabel}</span>
                </div>
              )}
              {addressLine && (
                <div className="jd-row">
                  <span className="k">Адрес</span>
                  <span className="v">{addressLine}</span>
                </div>
              )}
              <div className="jd-row">
                <span className="k">Окончательная цена</span>
                <span className="v">{priceIsNegotiable ? JOB_REQUEST_PRICE_MISSING_LABEL : budget}</span>
              </div>
              {req.createdAt && (
                <div className="jd-row">
                  <span className="k">Опубликована</span>
                  <span className="v">{jdFmtDateLong(req.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          <aside className="jd-detail-aside">
            <div className="jd-price-panel">
              <div className="jd-price-head">
                <div className="jd-price-label">Стоимость</div>
                <div className="jd-price-big">{priceIsNegotiable ? JOB_REQUEST_PRICE_MISSING_LABEL : budget}</div>
                <div className="jd-price-sub">
                  {priceIsNegotiable
                    ? 'заказчик не указал сумму — уточните в личных сообщениях'
                    : 'окончательная цена в заявке; детали — в чате'}
                </div>
              </div>
              <div className="jd-price-btns">
                <button type="button" className="jd-btn-msg" onClick={() => handleOpenOfferModal(req)}>
                  Откликнуться
                </button>
                {req.customerId && (
                  <Link
                    to={`/chat/${req.customerId}?jobRequestId=${req.id}`}
                    className="jd-btn-contact"
                  >
                    Написать сообщение
                  </Link>
                )}
              </div>
            </div>

            {(req.customerName || req.customerId) && (
              <div className="jd-person-card">
                <div className="jd-person-label">Заказчик</div>
                {req.customerId ? (
                  <Link
                    to={`/customers/${req.customerId}?name=${encodeURIComponent(custNameFull)}`}
                    className="jd-person-link"
                  >
                    {req.customerAvatar ? (
                      <img className="jd-person-ava" src={jdPhotoUrl(req.customerAvatar)} alt="" />
                    ) : (
                      <div className="jd-person-ava jd-person-ava--ph" aria-hidden>
                        {(custNameFull[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <div className="jd-person-text">
                      <div className="jd-person-name">{custNameFull}</div>
                      <div className="jd-person-line-status">Активный заказчик</div>
                      <div className="jd-author-rating">
                        <span className="stars">
                          {'★'.repeat(custStars)}
                          {'☆'.repeat(5 - custStars)}
                        </span>
                        <span className="jd-rating-val">{custAvg.toFixed(1)}</span>
                        <span>({reviewsCountLabel(custCnt)})</span>
                      </div>
                    </div>
                    <span className="jd-person-chevron" aria-hidden>
                      ›
                    </span>
                  </Link>
                ) : (
                  <div className="jd-person-link" style={{ cursor: 'default', pointerEvents: 'none' }}>
                    <div className="jd-person-ava jd-person-ava--ph" aria-hidden>
                      {(custNameFull[0] || '?').toUpperCase()}
                    </div>
                    <div className="jd-person-text">
                      <div className="jd-person-name">{custNameFull}</div>
                      <div className="jd-person-line-status">Активный заказчик</div>
                      <div className="jd-author-rating">
                        <span className="stars">
                          {'★'.repeat(custStars)}
                          {'☆'.repeat(5 - custStars)}
                        </span>
                        <span className="jd-rating-val">{custAvg.toFixed(1)}</span>
                        <span>({reviewsCountLabel(custCnt)})</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {lightbox && (
        <div
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.93)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLightbox(null)}
        >
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.photos[lightbox.index]} alt="" style={{ maxWidth:'90vw', maxHeight:'80vh', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'block', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:13, fontWeight:700, padding:'4px 10px', borderRadius:999 }}>
              {lightbox.index + 1} / {lightbox.photos.length}
            </div>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:12, right:12, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            {lightbox.photos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index > 0 ? l.index - 1 : l.photos.length - 1})); }} style={{ position:'absolute', left:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); setLightbox(l => ({...l, index: l.index < l.photos.length - 1 ? l.index + 1 : 0})); }} style={{ position:'absolute', right:-52, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>›</button>
              </>
            )}
          </div>
          {lightbox.photos.length > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:14 }} onClick={e => e.stopPropagation()}>
              {lightbox.photos.map((p, i) => (
                <div key={i} onClick={() => setLightbox(l => ({...l, index: i}))}
                  style={{ width:52, height:40, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i === lightbox.index ? '2.5px solid #e8410a' : '2px solid rgba(255,255,255,0.2)', opacity: i === lightbox.index ? 1 : 0.6 }}
                >
                  <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <OfferModal
        request={showOfferModal}
        offerForm={offerForm}
        setOfferForm={setOfferForm}
        onClose={handleCloseOfferModal}
        onSubmit={handleSubmitOffer}
        submitting={submitting}
      />
      </>
    );
  }

  // ═══ ЭКРАН 2: заявки внутри категории ═══
  if (selectedCategory) {
    const catMeta = CAT_ALL[selectedCategory.slug] || {};
    const allCatRequests = getRequestsForCategory(selectedCategory);

    const qFw = searchTerm.trim();

    const filteredRaw = allCatRequests
      .filter(req => {
        if (onlyWithPhoto && !(req.photos?.length > 0)) return false;
        if (priceMin) {
          const p = jobRequestListPrice(req);
          if (p == null || p < Number(priceMin)) return false;
        }
        if (priceMax) {
          const p = jobRequestListPrice(req);
          if (p == null || p > Number(priceMax)) return false;
        }
        if (qFw) {
          const sc = smartTextMatchScore(jobRequestHaystack(req), qFw);
          if (sc === null || sc === 0) return false;
        }
        if (ratingMin > 0) {
          const cid = req.customerId;
          const st = cid ? customerStats[String(cid)] : null;
          const avg = st?.averageRating ?? 0;
          if (avg < ratingMin) return false;
        }
        return true;
      });

    const filtered = qFw
      ? rankItemsBySmartMatch(filteredRaw, qFw, jobRequestHaystack)
      : filteredRaw.sort((a, b) => {
        if (sortBy === 'priceAsc') {
          const pa = jobRequestListPrice(a) ?? Infinity;
          const pb = jobRequestListPrice(b) ?? Infinity;
          return pa - pb;
        }
        if (sortBy === 'priceDesc') {
          const pa = jobRequestListPrice(a) ?? -Infinity;
          const pb = jobRequestListPrice(b) ?? -Infinity;
          return pb - pa;
        }
        if (sortBy === 'ratingDesc') {
          const ra = a.customerId ? (customerStats[String(a.customerId)]?.averageRating ?? 0) : 0;
          const rb = b.customerId ? (customerStats[String(b.customerId)]?.averageRating ?? 0) : 0;
          if (rb !== ra) return rb - ra;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

    const hasFilters = onlyWithPhoto || priceMin || priceMax || searchTerm || ratingMin > 0;

    return (
      <div className="fw2-page">
        <style>{fw2css}</style>

        {/* Топ-бар поиска */}
        <div className="fw2-topbar">
          <div className="fw2-topbar-inner">
            <div className="fw2-search-dd-wrap" ref={fwSearchDdRef}>
              <div className="fw2-search-wrap">
                <svg width="15" height="15" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onFocus={() => setFwSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setFwSearchFocused(false);
                      setSearchTerm(searchInput);
                    }
                  }}
                  placeholder={`Поиск в «${selectedCategory.name}»`}
                  autoComplete="off"
                  aria-expanded={showFwSearchDd}
                  aria-controls="fw2-search-dropdown-list"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                    style={{ border:'none', background:'none', cursor:'pointer', color:'#bbb', fontSize:18, lineHeight:1, padding:0 }}>
                    ×
                  </button>
                )}
              </div>
              {showFwSearchDd && (
                <div id="fw2-search-dropdown-list" className="fw2-search-dropdown" role="listbox" aria-label="Подсказки поиска">
                  {fwDdMatches.length === 0 ? (
                    <div className="fw2-search-hint">Подходящих заявок не нашлось. Нажмите «Найти», чтобы применить запрос к списку.</div>
                  ) : (
                    <>
                      {fwDdMatches.map((req) => {
                        const ph = (req.photos || [])[0];
                        const phSrc =
                          ph ||
                          getCategoryPlaceholderPhotoUrlOrDefault(
                            { categoryName: req.categoryName, categoryId: req.categoryId },
                            categories,
                          );
                        const custLabel = [req.customerName, req.customerLastName].filter(Boolean).join(' ');
                        return (
                          <button
                            key={req.id}
                            type="button"
                            className="fw2-search-hit"
                            onClick={() => {
                              setFwSearchFocused(false);
                              openRequestDetail(req);
                            }}
                          >
                            <div className="fw2-search-hit-ph">
                              <img src={phSrc} alt="" />
                            </div>
                            <div className="fw2-search-hit-body">
                              <div className="fw2-search-hit-title">{req.title || 'Заявка'}</div>
                              <div className="fw2-search-hit-meta">{custLabel || 'Заказчик'}</div>
                            </div>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="fw2-search-footer"
                        onClick={() => {
                          setSearchTerm(debouncedFwSearch);
                          setFwSearchFocused(false);
                        }}
                      >
                        Показать все совпадения в списке →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <button type="button" className="fw2-topbar-btn" onClick={() => { setFwSearchFocused(false); setSearchTerm(searchInput); }}>Найти</button>
          </div>
        </div>

        {/* Хлебные крошки */}
        <div className="fw2-breadcrumb">
          <button onClick={() => { setSelectedCategory(null); resetCategoryFilters(); }}>Все категории</button>
          <span className="fw2-breadcrumb-sep">›</span>
          <span className="fw2-breadcrumb-cur">{selectedCategory.name}</span>
          {!loading && (
            <>
              <span className="fw2-breadcrumb-sep">·</span>
              <span>{pluralRequests(filtered.length)}</span>
            </>
          )}
        </div>

        {/* Layout */}
        <div className="fw2-cat-page">

          {/* Сайдбар */}
          <aside className="fw2-sidebar">

            {/* Карточка категории */}
            <div className="fw2-sb-cat">
              <div className="fw2-sb-cat-photo">
                {catMeta.photo
                  ? <img src={catMeta.photo} alt={selectedCategory.name} />
                  : <div style={{ width:'100%', height:'100%', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>{catMeta.emoji || '🛠️'}</div>
                }
                <div className="fw2-sb-cat-photo-overlay">
                  <span className="fw2-sb-cat-name">{selectedCategory.name}</span>
                </div>
              </div>
              <div className="fw2-sb-cat-body">
                <button className="fw2-sb-back" onClick={() => { setSelectedCategory(null); resetCategoryFilters(); }}>
              ← Все категории
            </button>
          </div>
        </div>

            {/* Цена */}
            <div className="fw2-filter-card">
              <div className="fw2-filter-title">Цена, ₽</div>
              <div className="fw2-filter-body">
                <div className="fw2-price-row">
              <div>
                    <div className="fw2-price-label">От</div>
                    <input className="fw2-price-inp" type="number" min="0" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                  </div>
                  <div>
                    <div className="fw2-price-label">До</div>
                    <input className="fw2-price-inp" type="number" min="0" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
              </div>
            </div>
            </div>
        </div>

            {/* Рейтинг заказчика (по отзывам мастеров) */}
            <div className="fw2-filter-card">
              <div className="fw2-filter-title">Рейтинг заказчика</div>
              <div className="fw2-filter-body" style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {[
                  { r: 0,   label: 'Любой', stars: '' },
                  { r: 4,   label: '4.0+', stars: '★★★★' },
                  { r: 4.5, label: '4.5+', stars: '★★★★☆' },
                ].map(({ r, label, stars }) => (
                  <button
                    key={String(r)}
                    type="button"
                    className={`fw2-rating-opt${ratingMin === r ? ' active' : ''}`}
                    onClick={() => setRatingMin(r)}
                  >
                    {stars ? <span className="fw2-stars-filter">{stars}</span> : null}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Параметры */}
            <div className="fw2-filter-card">
              <div className="fw2-filter-title">Параметры</div>
              <div className="fw2-filter-body">
                <div className="fw2-check-item" onClick={() => setOnlyWithPhoto(v => !v)}>
                  <div className={`fw2-check-box${onlyWithPhoto ? ' on' : ''}`}>
                    {onlyWithPhoto && <span className="fw2-check-tick">✓</span>}
                  </div>
                  <span>С фотографиями</span>
                </div>
              </div>
            </div>

            {hasFilters && (
              <button className="fw2-reset-btn" onClick={resetCategoryFilters}>✕ Сбросить фильтры</button>
            )}
          </aside>

          {/* Основная зона */}
          <div className="fw2-main">

            {/* Сортировка */}
            <div className="fw2-sort-bar">
              <span className="fw2-sort-label">Сортировать:</span>
              <div className="fw2-sort-opts">
                {[
                  { val: 'recency',    label: 'Новые' },
                  { val: 'ratingDesc', label: 'Рейтинг' },
                  { val: 'priceAsc',   label: 'Цена ↑' },
                  { val: 'priceDesc',  label: 'Цена ↓' },
                ].map(o => (
                  <button
                    key={o.val}
                    type="button"
                    className={`fw2-sort-opt${sortBy === o.val ? ' active' : ''}`}
                    onClick={() => setSortBy(o.val)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <span className="fw2-result-count">
                {loading ? '...' : pluralRequests(filtered.length)}
              </span>
            </div>

            {/* Карточки */}
            {loading ? (
              <div className="fw2-list">
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e8e8e8', overflow:'hidden' }}>
                    <div className="fw2-sk" style={{ paddingTop:'62%', borderRadius:0 }}/>
                    <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                      <div className="fw2-sk" style={{ height:12, width:'45%' }}/>
                      <div className="fw2-sk" style={{ height:16, width:'80%' }}/>
                      <div className="fw2-sk" style={{ height:11, width:'90%' }}/>
                      <div className="fw2-sk" style={{ height:20, width:'35%', marginTop:4 }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="fw2-list">
                <div className="fw2-empty">
                  <div className="fw2-empty-ico">🔍</div>
                  <h3>Заявок не найдено</h3>
                  <p>{hasFilters ? 'Измените параметры или сбросьте фильтры.' : 'В этой категории пока нет активных заявок.'}</p>
                </div>
            </div>
          ) : (
              <div className="fw2-list">
                {filtered.map(req => {
                  const photos = req.photos || [];
                  const hasPhoto = photos.length > 0;
                  const placeholderBg = getCategoryPlaceholderPhotoUrlOrDefault(
                    { categoryName: req.categoryName, categoryId: req.categoryId },
                    categories,
                  );
                  const budgetLabel = formatJobRequestBudgetLabel(req);
                  const custName = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';

                  const customerHref = req.customerId
                    ? `/customers/${req.customerId}?name=${encodeURIComponent(custName)}`
                    : null;
                  const cityLine = (() => {
                    const c = req.city && String(req.city).trim();
                    if (c) return c;
                    const addr = req.addressText && String(req.addressText).trim();
                    if (addr) {
                      const part = addr.split(',')[0].trim();
                      if (part) return part.length > 36 ? `${part.slice(0, 36)}…` : part;
                    }
                    return 'Йошкар-Ола';
                  })();
                  const activeCustomerSub = req.addressText && String(req.addressText).trim()
                    ? `● Активный заказчик · ${String(req.addressText).trim()}`
                    : `● Активный заказчик · ${cityLine}`;
                  const cst = req.customerId ? customerStats[String(req.customerId)] : null;
                  const cAvg = cst?.averageRating ?? 0;
                  const cCnt = cst?.reviewsCount ?? 0;
                  const cFill = Math.min(5, Math.max(0, Math.round(Number(cAvg) || 0)));

                  const customerReviewsPath = req.customerId
                    ? `/customers/${req.customerId}${custName ? `?name=${encodeURIComponent(custName)}` : ''}#reviews`
                    : null;

                  return (
                    <div key={req.id} className="fw2-card">

                      {/* Фото — как у заказчика: АКТИВНО + «Смотреть» */}
                      <div
                        className="fw2-card-photo"
                        role="button"
                        tabIndex={0}
                        onClick={() => openRequestDetail(req)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openRequestDetail(req);
                          }
                        }}
                      >
                        {hasPhoto ? (
                          <>
                            <img src={photos[0]} alt="" draggable={false} />
                            <span className="fw2-card-photo-active">АКТИВНО</span>
                            {photos.length > 1 && (
                              <span className="fw2-card-photo-cnt">📷 {photos.length}</span>
                            )}
                            <div className="fw2-card-photo-hover">Смотреть</div>
                          </>
                        ) : (
                          <>
                            <img src={placeholderBg} alt="" draggable={false} />
                            <span className="fw2-card-photo-active">АКТИВНО</span>
                            <div className="fw2-card-photo-hover">Смотреть</div>
                          </>
                        )}
                      </div>

                      {photos.length > 1 && (
                        <div
                          className="fw2-thumbs"
                          role="button"
                          tabIndex={0}
                          onClick={() => openRequestDetail(req)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openRequestDetail(req);
                            }
                          }}
                        >
                          {photos.slice(1, 4).map((p, i) => (
                            <img key={i} src={p} alt="" className="fw2-thumb" draggable={false} />
                          ))}
                          {photos.length > 4 && (
                            <div className="fw2-thumb-more">+{photos.length - 4}</div>
                          )}
                        </div>
                      )}

                      <div className="fw2-card-body">
                        {customerHref ? (
                          <Link to={customerHref} className="fw2-card-customer">
                            {req.customerAvatar ? (
                              <img src={req.customerAvatar} alt="" className="fw2-card-ava" />
                            ) : (
                              <div className="fw2-card-ava-ph" style={{ background:'linear-gradient(135deg,#e8410a,#ff7043)' }}>
                                {(custName || 'З')[0].toUpperCase()}
                              </div>
                            )}
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className="fw2-card-customer-name">{custName}</div>
                              <div className="fw2-card-customer-sub">{activeCustomerSub}</div>
                            </div>
                            <span style={{ color:'#d1d5db', fontSize:18, flexShrink:0, lineHeight:1 }}>›</span>
                          </Link>
                        ) : (
                          <div
                            className="fw2-card-customer"
                            role="button"
                            tabIndex={0}
                            style={{ cursor:'pointer' }}
                            onClick={() => openRequestDetail(req)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openRequestDetail(req);
                              }
                            }}
                          >
                            {req.customerAvatar ? (
                              <img src={req.customerAvatar} alt="" className="fw2-card-ava" />
                            ) : (
                              <div className="fw2-card-ava-ph" style={{ background:'linear-gradient(135deg,#e8410a,#ff7043)' }}>
                                {(custName || 'З')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="fw2-card-customer-name">{custName}</div>
                              <div className="fw2-card-customer-sub">{activeCustomerSub}</div>
                            </div>
                          </div>
                        )}

                        <div
                          className="fw2-card-detail-zone"
                          role="button"
                          tabIndex={0}
                          onClick={() => openRequestDetail(req)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openRequestDetail(req);
                            }
                          }}
                        >
                          <div className="fw2-card-title">{req.title}</div>
                          {req.description && req.description !== 'Без описания' && (
                            <div className="fw2-card-desc">{formatListingOriginDescription('WORKER', req.description)}</div>
                          )}
                          {req.createdAt && (
                            <div className="fw2-card-info">
                              📅 {new Date(req.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' })}
                            </div>
                          )}
                        </div>

                        <div className="fw2-card-badges">
                          <span className="fw2-badge fw2-badge-v">✓ Открыта</span>
                          <span className="fw2-badge fw2-badge-f">⚡ Заявка</span>
                        </div>

                        {customerReviewsPath ? (
                          <Link
                            to={customerReviewsPath}
                            className="fw2-card-stats fw2-card-stats--link"
                            title="Открыть отзывы о заказчике"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="fw2-stars">
                              {'★'.repeat(cFill)}
                              {'☆'.repeat(5 - cFill)}
                            </span>
                            <span className="fw2-rating-val">{cAvg.toFixed(1)}</span>
                            <span>({reviewsCountLabel(cCnt)})</span>
                          </Link>
                        ) : (
                          <div className="fw2-card-stats">
                            <span className="fw2-stars">
                              {'★'.repeat(cFill)}
                              {'☆'.repeat(5 - cFill)}
                            </span>
                            <span className="fw2-rating-val">{cAvg.toFixed(1)}</span>
                            <span>({reviewsCountLabel(cCnt)})</span>
                          </div>
                        )}

                        <div className="fw2-card-footer">
                          <div className="fw2-card-price-block">
                            {hasJobRequestPublishedPrice(req) ? (
                              <>
                                <div className="fw2-card-price">{budgetLabel}</div>
                                <span className="fw2-card-price-unit">окончательная цена в заявке</span>
                              </>
                            ) : (
                              <>
                                <div className="fw2-card-price-none">{JOB_REQUEST_PRICE_MISSING_LABEL}</div>
                                <span className="fw2-card-price-unit">уточните сумму в личных сообщениях</span>
                              </>
                            )}
                          </div>
                          <div className="fw2-card-actions">
                            <button
                              type="button"
                              className="fw2-btn-respond"
                              onClick={e => { e.stopPropagation(); handleOpenOfferModal(req); }}
                            >
                              Откликнуться
                            </button>
                            <button
                              type="button"
                              className="fw2-btn-msg"
                              disabled={!req.customerId}
                              title={!req.customerId ? 'Чат будет доступен после появления профиля заказчика' : undefined}
                              onClick={e => {
                                e.stopPropagation();
                                if (req.customerId) navigate(`/chat/${req.customerId}?jobRequestId=${req.id}`);
                              }}
                            >
                              Написать
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
          </div>
        </div>

        <OfferModal
          request={showOfferModal}
          offerForm={offerForm}
          setOfferForm={setOfferForm}
          onClose={handleCloseOfferModal}
          onSubmit={handleSubmitOffer}
          submitting={submitting}
        />
      </div>
    );
  }

  // ═══ ЭКРАН 1: сетка категорий с hero ═══
  const totalRequests = requests.length;

  return (
    <div className="fw2-page">
      <style>{fw2css}</style>

      {/* Hero */}
      <div className="fw2-hero">
        <img src={heroCatSlug ? (CAT_ALL[heroCatSlug]?.photo || FW_DEFAULT_BG) : FW_DEFAULT_BG} alt="" className="fw2-hero-bg" />
        <div className="fw2-hero-overlay" />
        <div className="fw2-hero-body">
          <h1>Найти работу<br/>в Йошкар-Оле</h1>
          <p className="fw2-hero-sub">Откликайтесь на заявки заказчиков — первый отклик получает заказ чаще</p>
          {!loading && (
            <div className="fw2-hero-stats">
              {[
                { val: categories.length, label: 'категорий' },
                { val: totalRequests,     label: 'активных заявок' },
              ].map(({ val, label }) => (
                <div key={label} className="fw2-hero-stat">
                  <span className="fw2-hero-stat-val">{val}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Сетка категорий */}
      <div className="fw2-cats-wrap">
        <div className="fw2-cats-label">Выберите категорию</div>
        {loading ? (
          <div className="fw2-cats-grid">
            {[1,2,3,4,5,6,7,8,9].map(i => (
              <div key={i} style={{ borderRadius:16, overflow:'hidden', background:'#fff', border:'1.5px solid #e8e8e8' }}>
                <div className="fw2-sk" style={{ height:150, borderRadius:0 }}/>
                <div style={{ padding:16, display:'flex', flexDirection:'column', gap:8 }}>
                  <div className="fw2-sk" style={{ height:15, width:'70%' }}/>
                  <div className="fw2-sk" style={{ height:12, width:'85%' }}/>
                  <div className="fw2-sk" style={{ height:12, width:'55%' }}/>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fw2-cats-grid" onMouseLeave={() => setHeroCatSlug(null)}>
            {categories.map(cat => {
              const meta  = CAT_ALL[cat.slug] || {};
              const count = getRequestsForCategory(cat).length;
              return (
                <button
                  key={cat.id}
                  className="fw2-cat-card"
                  onMouseEnter={() => setHeroCatSlug(cat.slug)}
                  onClick={() => { setSelectedCategory(cat); resetCategoryFilters(); }}
                >
                  <div className="fw2-cat-img-wrap">
                    {meta.photo
                      ? <img src={meta.photo} alt={cat.name} loading="lazy" />
                      : <div className="fw2-cat-img-ph">{meta.emoji || '🛠️'}</div>
                    }
                    <span className="fw2-cat-badge">
                      {count > 0 ? pluralRequests(count) : 'Нет заявок'}
                    </span>
                  </div>
                  <div className="fw2-cat-body">
                    <div className="fw2-cat-name">{cat.name}</div>
                    <div className="fw2-cat-desc">{meta.desc || 'Профессиональные заказы'}</div>
                    <div className="fw2-cat-footer">
                      {count > 0
                        ? <span className="fw2-cat-count">{pluralRequests(count)}</span>
                        : <span className="fw2-cat-count-none">Нет активных заявок</span>
                      }
                      <div className="fw2-cat-go">›</div>
                  </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
