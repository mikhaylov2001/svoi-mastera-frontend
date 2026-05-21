import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer, getCategories, getCustomerStats, recordJobRequestView } from '../../api';
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
import { WORKER_HOME_PATH } from '../../constants/homePaths';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { useSwipeNavigation, useSwipeNavigationLightbox } from '../../hooks/useSwipeNavigation';
import { smartTextMatchScore, jobRequestHaystack, rankItemsBySmartMatch } from '../../utils/smartSearch';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import { formatCatalogCountShort } from '../../utils/formatCatalogCountShort';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
} from '../../utils/categoryPlaceholderPhoto';
import { mergeApiCategoriesWithCatalog } from '../../utils/mergeApiCategoriesWithCatalog';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';
import { dealsDetailEdCss, listingDetailLightboxCss, dealCategoryEmoji } from '../shared/dealsWdStyles';
import { listingDetailSurfaceExtraCss } from '../shared/listingDetailSurfaceExtraCss';

const JOB_REQUEST_DETAIL_STYLES = `${dealsDetailEdCss}\n${listingDetailLightboxCss}\n${listingDetailSurfaceExtraCss}`;

const FW_DEFAULT_BG = PAGE_HERO_DEFAULT_PHOTO;

const JD_BACKEND = 'https://svoi-mastera-backend.onrender.com';
const jdPhotoUrl = (u) =>
  !u ? null : u.startsWith('http') || u.startsWith('data:') ? u : JD_BACKEND + u;

const jdFmtDateLong = (d) =>
  !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн. назад`;
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

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

/** Бейдж на карточке заявки в ленте: свежие — «НОВОЕ», остальные — «АКТИВНО». */
function jobRequestFeedStatusLabel(req) {
  const t = req?.createdAt ? new Date(req.createdAt).getTime() : 0;
  if (t && Date.now() - t < 72 * 3600 * 1000) return 'НОВОЕ';
  return 'АКТИВНО';
}

function jobRequestFeedLooksUrgent(req) {
  const hay = `${req?.title || ''} ${req?.description || ''}`.toLowerCase();
  return hay.includes('срочн') || hay.includes('сегодня') || hay.includes('завтра');
}

const fw2css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

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
    .fw2-list .fw2-card-actions {
      flex-direction: column;
      gap: 8px;
    }
    .fw2-list .fw2-btn-respond,
    .fw2-list .fw2-btn-msg {
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
    .fw2-cats-grid { grid-template-columns: 1fr; gap: 12px; }
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
  /** Откуда открыли деталь заявки: главная / избранное / раздел «Найти работу» */
  const [jobDetailFrom, setJobDetailFrom] = useState('find-work');
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

  /** Один POST на заявку за сессию страницы, чтобы не дублировать счётчик при серии кликов. */
  const jobRequestViewSentRef = useRef(new Set());
  const bumpJobRequestView = useCallback((reqId) => {
    if (!userId || reqId == null) return;
    const id = String(reqId);
    if (jobRequestViewSentRef.current.has(id)) return;
    jobRequestViewSentRef.current.add(id);
    recordJobRequestView(userId, id).catch(() => {});
  }, [userId]);

  const [debouncedFwSearch, setDebouncedFwSearch] = useState('');
  const [fwSearchFocused, setFwSearchFocused] = useState(false);
  const fwSearchDdRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFwSearch(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  const applyFwCategorySearch = useCallback(
    (value) => {
      const q = (value !== undefined ? String(value) : searchInput).trim();
      setSearchInput(q);
      setSearchTerm(q);
      setFwSearchFocused(false);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (q) next.set('q', q);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    },
    [searchInput, setSearchParams],
  );

  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    setSearchInput(q);
    setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedCategory) return;
    setSearchTerm(debouncedFwSearch);
  }, [debouncedFwSearch, selectedCategory]);

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

  const jobDetailUploadedPhotos = useMemo(() => {
    if (!selectedRequest?.photos?.length) return [];
    return selectedRequest.photos.map(jdPhotoUrl).filter(Boolean);
  }, [selectedRequest]);

  const jobDetailPhotoCount = jobDetailUploadedPhotos.length;
  const jobDetailCanSwipe = jobDetailPhotoCount > 1;

  const jobDetailPrevPhoto = useCallback(() => {
    setActivePhotoIdx((i) =>
      jobDetailPhotoCount > 1 ? (i - 1 + jobDetailPhotoCount) % jobDetailPhotoCount : i,
    );
  }, [jobDetailPhotoCount]);

  const jobDetailNextPhoto = useCallback(() => {
    setActivePhotoIdx((i) => (jobDetailPhotoCount > 1 ? (i + 1) % jobDetailPhotoCount : i));
  }, [jobDetailPhotoCount]);

  const jobLbPrev = useCallback(() => {
    if (!lightbox || lightbox.photos.length <= 1) return;
    const next = (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length;
    setActivePhotoIdx(next);
    setLightbox({ ...lightbox, index: next });
  }, [lightbox]);

  const jobLbNext = useCallback(() => {
    if (!lightbox || lightbox.photos.length <= 1) return;
    const next = (lightbox.index + 1) % lightbox.photos.length;
    setActivePhotoIdx(next);
    setLightbox({ ...lightbox, index: next });
  }, [lightbox]);

  const jobGallerySwipe = useSwipeNavigation(
    jobDetailPrevPhoto,
    jobDetailNextPhoto,
    !!selectedRequest && jobDetailCanSwipe,
  );
  const jobLbSwipe = useSwipeNavigationLightbox(jobLbPrev, jobLbNext, !!lightbox && lightbox.photos.length > 1);
  const jobThumbStripRef = useRef(null);

  useEffect(() => {
    if (!jobDetailCanSwipe || !jobThumbStripRef.current) return;
    const active = jobThumbStripRef.current.querySelector('.ed-thumb.on');
    active?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activePhotoIdx, jobDetailCanSwipe]);

  React.useEffect(() => {
    if (!lightbox) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') jobLbNext();
      if (e.key === 'ArrowLeft') jobLbPrev();
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, jobLbNext, jobLbPrev]);

  const requestIdFromUrl = searchParams.get('request');

  useEffect(() => {
    if (!requestIdFromUrl || loading) return;
    const fromParam = searchParams.get('from');
    const nextFrom = fromParam === 'home' || fromParam === 'favorites' ? fromParam : 'find-work';
    setJobDetailFrom(nextFrom);
    const req = requests.find(r => String(r.id) === String(requestIdFromUrl));
    if (!req) {
      if (requests.length > 0) {
        showToast('Заявка закрыта или недоступна', 'info');
        setSearchParams(p => { const next = new URLSearchParams(p); next.delete('request'); next.delete('from'); return next; }, { replace: true });
      }
      return;
    }
    const cat = categories.find(c => c.id === req.categoryId);
    if (cat) setSelectedCategory(cat);
    setSelectedRequest(req);
    setActivePhotoIdx(0);
    bumpJobRequestView(req.id);
    setSearchParams(p => { const next = new URLSearchParams(p); next.delete('request'); next.delete('from'); return next; }, { replace: true });
  }, [requestIdFromUrl, loading, requests, categories, setSearchParams, showToast, bumpJobRequestView, searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, reqs] = await Promise.all([
        getCategories(),
        getOpenJobRequestsForWorker(userId),
      ]);
      setCategories(mergeApiCategoriesWithCatalog(Array.isArray(cats) ? cats : []));
      setRequests(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setCategories(mergeApiCategoriesWithCatalog([]));
      setRequests([]);
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
    bumpJobRequestView(req?.id);
    setJobDetailFrom('find-work');
    setSelectedRequest(req);
    setActivePhotoIdx(0);
  }, [bumpJobRequestView]);

  const handleOpenOfferModal = (request) => {
    bumpJobRequestView(request?.id);
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
    setSearchInput('');
    setSearchTerm('');
    setPriceMin('');
    setPriceMax('');
    setOnlyWithPhoto(false);
    setSortBy('recency');
    setRatingMin(0);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

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
    const jobCity =
      (req.cityName && String(req.cityName).trim()) ||
      (req.city && String(req.city).trim()) ||
      (addressLine.includes(',') ? addressLine.split(',')[0].trim() : '—');
    const custNameFull = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
    const categoryLabel = selectedCategory?.name || req.categoryName;
    const priceNum = getJobRequestPublishedBudgetNumber(req);
    const photoCount = jdPhotos.length;
    const hasMultiplePhotos = photoCount > 1;
    const openStatusPill = { label: 'Открыта', dot: '#22c55e', shadow: '0 0 0 3px rgba(34,197,94,.2)' };
    const jobBackLabel =
      jobDetailFrom === 'home' ? 'Главная' : jobDetailFrom === 'favorites' ? 'Избранное' : 'Заявки';

    return (
      <>
        <div className="ed ed--listing-detail">
          <style>{JOB_REQUEST_DETAIL_STYLES}</style>

          {lightbox && (
            <div className="jd-lightbox" onClick={() => setLightbox(null)} role="presentation">
              <button
                type="button"
                className="jd-lb-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(null);
                }}
              >
                ✕
              </button>
              {lightbox.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="jd-lb-nav jd-lb-prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox((l) => ({
                        ...l,
                        index: l.index > 0 ? l.index - 1 : l.photos.length - 1,
                      }));
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="jd-lb-nav jd-lb-next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox((l) => ({
                        ...l,
                        index: l.index < l.photos.length - 1 ? l.index + 1 : 0,
                      }));
                    }}
                  >
                    ›
                  </button>
                </>
              )}
              <div
                className={`jd-lightbox-img-wrap ${jobLbSwipe.className}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={jobLbSwipe.onPointerDown}
                onPointerUp={jobLbSwipe.onPointerUp}
                onPointerCancel={jobLbSwipe.onPointerCancel}
                style={jobLbSwipe.style}
              >
                {lightbox.photos.length > 1 && (
                  <>
                    <div
                      className="jd-lb-zone jd-lb-zone-prev"
                      onClick={() =>
                        setLightbox((l) => ({
                          ...l,
                          index: l.index > 0 ? l.index - 1 : l.photos.length - 1,
                        }))
                      }
                      role="presentation"
                    />
                    <div
                      className="jd-lb-zone jd-lb-zone-next"
                      onClick={() =>
                        setLightbox((l) => ({
                          ...l,
                          index: l.index < l.photos.length - 1 ? l.index + 1 : 0,
                        }))
                      }
                      role="presentation"
                    />
                  </>
                )}
                <img
                  src={lightbox.photos[lightbox.index]}
                  alt={req.title || ''}
                  onClick={() => lightbox.photos.length <= 1 && setLightbox(null)}
                />
              </div>
              {lightbox.photos.length > 1 && (
                <div className="jd-lb-counter">
                  {lightbox.index + 1} / {lightbox.photos.length}
                </div>
              )}
              <div className="jd-lb-hint">Свайп или ← → · Esc — закрыть</div>
            </div>
          )}

          <div className="ed-wrap">
            <button
              type="button"
              className="ed-back"
              onClick={() => {
                setLightbox(null);
                if (jobDetailFrom === 'home') {
                  setSelectedRequest(null);
                  setSelectedCategory(null);
                  setActivePhotoIdx(0);
                  setJobDetailFrom('find-work');
                  navigate(WORKER_HOME_PATH);
                  return;
                }
                if (jobDetailFrom === 'favorites') {
                  setSelectedRequest(null);
                  setSelectedCategory(null);
                  setActivePhotoIdx(0);
                  setJobDetailFrom('find-work');
                  navigate('/favorites');
                  return;
                }
                setSelectedRequest(null);
                setActivePhotoIdx(0);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {jobBackLabel}
            </button>

            <div className="ed-head">
              <div className="ed-head-left" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h1>{req.title || 'Заявка'}</h1>
                </div>
                <div className="ed-listing-meta">
                  {categoryLabel && (
                    <span>
                      {dealCategoryEmoji(categoryLabel)} {categoryLabel}
                    </span>
                  )}
                  {jobCity && jobCity !== '—' ? <span>📍 {jobCity}</span> : null}
                </div>
              </div>
              <div className="ed-head-right">
                <FavoriteHeartButton kind="jobRequest" id={req.id} className="ulc-fav-heart ed-fav" />
                <span className="ed-status-pill">
                  <span className="dot" style={{ background: openStatusPill.dot, boxShadow: openStatusPill.shadow }} />
                  {openStatusPill.label}
                </span>
              </div>
            </div>

            <div className="ed-grid">
              <div className="ed-col">
                <div className="ed-gallery">
                  <div
                    className={`ed-main ${jobGallerySwipe.className}`}
                    role="presentation"
                    onClick={() => jdPhotos.length > 0 && setLightbox({ photos: jdPhotos, index: activePhotoIdx })}
                    onClickCapture={jobGallerySwipe.onClickCapture}
                    onPointerDown={jobGallerySwipe.onPointerDown}
                    onPointerUp={jobGallerySwipe.onPointerUp}
                    onPointerCancel={jobGallerySwipe.onPointerCancel}
                    style={jobGallerySwipe.style}
                  >
                    {mainSrc ? (
                      <img src={mainSrc} alt={req.title || ''} key={`${photoCount}-${activePhotoIdx}`} />
                    ) : (
                      <div className="ed-main-placeholder" aria-hidden>
                        {catStyle.emoji}
                      </div>
                    )}
                    <div className="ed-floats">
                      <div className="ed-chip">
                        <span className="pulse" style={{ background: openStatusPill.dot, boxShadow: openStatusPill.shadow }} />
                        <span className="ed-chip-text">{openStatusPill.label}</span>
                      </div>
                      {categoryLabel ? (
                        <div className="ed-chip">
                          <span className="ed-chip-text">
                            {dealCategoryEmoji(categoryLabel)} {categoryLabel}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {hasMultiplePhotos ? (
                      <>
                        <button
                          type="button"
                          className="ed-arrow l"
                          aria-label="Предыдущее фото"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((i) => (i > 0 ? i - 1 : jdPhotos.length - 1));
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="ed-arrow r"
                          aria-label="Следующее фото"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((i) => (i < jdPhotos.length - 1 ? i + 1 : 0));
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="ed-counter">
                          {String(activePhotoIdx + 1).padStart(2, '0')} / {String(photoCount).padStart(2, '0')}
                        </div>
                      </>
                    ) : null}
                  </div>
                  {hasMultiplePhotos ? (
                    <div className="ed-thumbs" ref={jobThumbStripRef}>
                      {jdPhotos.map((p, i) => (
                        <div
                          key={i}
                          className={`ed-thumb${i === activePhotoIdx ? ' on' : ''}`}
                          onClick={() => setActivePhotoIdx(i)}
                          role="presentation"
                        >
                          <img src={p} alt="" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {req.description && req.description !== 'Без описания' ? (
                  <section className="ed-card">
                    <h3 className="ed-section-title">Описание</h3>
                    <p className="ed-desc">{formatListingOriginDescription('WORKER', req.description)}</p>
                    {req.urgency ? (
                      <p className="ed-desc" style={{ marginTop: 14, color: '#c2410c', fontWeight: 600 }}>
                        <b>Срочность:</b> {req.urgency}
                      </p>
                    ) : null}
                  </section>
                ) : (
                  <section className="ed-card">
                    <h3 className="ed-section-title">Описание</h3>
                    <p className="ed-desc" style={{ color: '#a1a1aa', fontStyle: 'italic' }}>
                      Описание не добавлено
                    </p>
                  </section>
                )}

                <section className="ed-card">
                  <h3 className="ed-section-title">Условия</h3>
                  <dl className="ed-rows">
                    {[
                      ['Город', jobCity],
                      addressLine && ['Адрес', addressLine],
                      req.createdAt && ['Опубликована', timeAgo(req.createdAt) || jdFmtDateLong(req.createdAt)],
                    ]
                      .filter(Boolean)
                      .map(([label, value]) => (
                        <div key={String(label)} className="ed-row">
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                  </dl>
                </section>
              </div>

              <aside className="ed-side">
                <div className="ed-card">
                  <div className="ed-eyebrow">Стоимость</div>
                  {priceNum != null ? (
                    <div className="ed-price-num">
                      {priceNum.toLocaleString('ru-RU')}
                      <small> ₽</small>
                    </div>
                  ) : (
                    <div className="ed-price-num" style={{ fontSize: 22, fontWeight: 700 }}>
                      {JOB_REQUEST_PRICE_MISSING_LABEL}
                    </div>
                  )}
                  <p className="ed-price-sub">
                    {priceIsNegotiable
                      ? 'Заказчик не указал сумму — уточните в чате'
                      : 'Окончательная цена согласовывается в чате с заказчиком'}
                  </p>
                  <div className="ed-actions">
                    <button type="button" className="ed-btn ed-btn-confirm" onClick={() => handleOpenOfferModal(req)}>
                      Откликнуться
                    </button>
                    {req.customerId ? (
                      <Link to={`/chat/${req.customerId}?jobRequestId=${req.id}`} className="ed-btn ed-btn-ghost">
                        Написать в чат
                      </Link>
                    ) : null}
                  </div>
                </div>

                {(req.customerName || req.customerId) && (
                  <div className="ed-card">
                    <div className="ed-eyebrow ed-eyebrow--block">Заказчик</div>
                    {req.customerId ? (
                      <div
                        className="ed-cust-row"
                        onClick={() =>
                          navigate(`/customers/${req.customerId}?name=${encodeURIComponent(custNameFull)}`)
                        }
                        role="presentation"
                      >
                        {req.customerAvatar ? (
                          <div className="ed-ava">
                            <img src={jdPhotoUrl(req.customerAvatar)} alt="" />
                          </div>
                        ) : (
                          <div className="ed-ava">
                            <div className="ed-ava-fallback">{(custNameFull[0] || '?').toUpperCase()}</div>
                          </div>
                        )}
                        <div className="ed-cust-info">
                          <div className="ed-cust-name">{custNameFull}</div>
                          <div className="ed-cust-meta ed-cust-meta--active">Активный заказчик</div>
                        </div>
                        <div className="ed-cust-arrow">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="ed-cust-row" style={{ cursor: 'default', pointerEvents: 'none' }}>
                        <div className="ed-ava">
                          <div className="ed-ava-fallback">{(custNameFull[0] || '?').toUpperCase()}</div>
                        </div>
                        <div className="ed-cust-info">
                          <div className="ed-cust-name">{custNameFull}</div>
                          <div className="ed-cust-meta ed-cust-meta--active">Активный заказчик</div>
                        </div>
                      </div>
                    )}
                    {req.customerId ? (
                      <Link to={`/chat/${req.customerId}?jobRequestId=${req.id}`} className="ed-msg-btn">
                        Написать в чат
                      </Link>
                    ) : null}
                  </div>
                )}
              </aside>
            </div>
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
      <div className="jl-page fw-jl-cat-feed">
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
                      e.preventDefault();
                      applyFwCategorySearch(searchInput);
                    }
                  }}
                  placeholder={`Поиск в «${selectedCategory.name}»`}
                  autoComplete="off"
                  aria-expanded={showFwSearchDd}
                  aria-controls="fw2-search-dropdown-list"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => applyFwCategorySearch('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: 18, lineHeight: 1, padding: 0 }}
                    aria-label="Очистить поиск"
                  >
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
                        onClick={() => applyFwCategorySearch(debouncedFwSearch)}
                      >
                        Показать все совпадения в списке →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <button type="button" className="fw2-topbar-btn" onClick={() => applyFwCategorySearch(searchInput)}>
              Найти
            </button>
          </div>
        </div>

        <div className="jl-wrap">
        <div className="jl-crumbs">
          <button type="button" className="jl-crumbs-link" onClick={() => { setSelectedCategory(null); resetCategoryFilters(); }}>Все категории</button>
          <span className="sep">›</span>
          <span className="cur">{selectedCategory.name}</span>
          {!loading && (
            <>
              <span className="sep">·</span>
              <span>{pluralRequests(filtered.length)}</span>
            </>
          )}
        </div>

        <div className="jl-layout">

          <aside className="jl-side">

            <div className="jl-cat-cover">
              {catMeta.photo ? (
                <img src={catMeta.photo} alt={selectedCategory.name} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,.9)' }}>
                  {catMeta.emoji || '🛠️'}
                </div>
              )}
              <div className="jl-cat-cover-body">
                <div className="jl-cat-cover-title">{selectedCategory.name}</div>
                <button type="button" className="jl-cat-cover-back" onClick={() => { setSelectedCategory(null); resetCategoryFilters(); }}>
                  ← Все категории
                </button>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Цена, ₽</div>
              <div className="jl-side-row">
                <div className="jl-side-field">
                  <label htmlFor="fw-price-min">От</label>
                  <input id="fw-price-min" type="number" min="0" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                </div>
                <div className="jl-side-field">
                  <label htmlFor="fw-price-max">До</label>
                  <input id="fw-price-max" type="number" min="0" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Рейтинг заказчика</div>
              <div className="jl-rating-opts">
                {[
                  { r: 0, label: 'Любой', stars: '' },
                  { r: 4, label: '4.0+', stars: '★★★★☆' },
                  { r: 4.5, label: '4.5+', stars: '★★★★★' },
                ].map(({ r, label, stars }) => (
                  <button
                    key={String(r)}
                    type="button"
                    className={`jl-rating-opt${ratingMin === r ? ' is-active' : ''}`}
                    onClick={() => setRatingMin(r)}
                  >
                    {stars ? <span className="stars">{stars}</span> : null}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Параметры</div>
              <label className="jl-side-check">
                <input type="checkbox" checked={onlyWithPhoto} onChange={e => setOnlyWithPhoto(e.target.checked)} />
                С фотографиями
              </label>
            </div>

            {hasFilters && (
              <button type="button" className="jl-cat-feed-reset" onClick={resetCategoryFilters}>✕ Сбросить фильтры</button>
            )}
          </aside>

          <main>
            {qFw ? (
              <div className="jl-search-active" role="status">
                <span>
                  Поиск: <strong>«{qFw}»</strong>
                </span>
                <span>{pluralRequests(filtered.length)}</span>
                <button type="button" className="jl-search-active-clear" onClick={() => applyFwCategorySearch('')}>
                  Сбросить
                </button>
              </div>
            ) : null}

            <div className="jl-toolbar">
              <span className="jl-toolbar-label">Сортировать:</span>
              {[
                { val: 'recency', label: 'Новые' },
                { val: 'ratingDesc', label: 'Рейтинг' },
                { val: 'priceAsc', label: 'Цена ↑' },
                { val: 'priceDesc', label: 'Цена ↓' },
              ].map(o => (
                <button
                  key={o.val}
                  type="button"
                  className={`jl-chip${sortBy === o.val ? ' is-active' : ''}`}
                  onClick={() => setSortBy(o.val)}
                >
                  {o.label}
                </button>
              ))}
              <span className="jl-toolbar-count">{loading ? '…' : pluralRequests(filtered.length)}</span>
            </div>

            {/* Карточки */}
            {loading ? (
              <div className="jl-list">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #ececec', overflow: 'hidden' }}>
                    <div className="fw2-sk" style={{ paddingTop: '38%', borderRadius: 0 }} />
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="fw2-sk" style={{ height: 12, width: '45%' }} />
                      <div className="fw2-sk" style={{ height: 18, width: '80%' }} />
                      <div className="fw2-sk" style={{ height: 11, width: '90%' }} />
                      <div className="fw2-sk" style={{ height: 22, width: '35%', marginTop: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="jl-feed-empty">
                <div className="jl-feed-empty-ico">🔍</div>
                <h3>Заявок не найдено</h3>
                <p>{hasFilters ? 'Измените параметры или сбросьте фильтры.' : 'В этой категории пока нет активных заявок.'}</p>
              </div>
            ) : (
              <div className="jl-list jl-feed-list">
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
                  const addrShort = (() => {
                    const addr = req.addressText && String(req.addressText).trim();
                    if (addr) {
                      const part = addr.split(',')[0].trim();
                      if (part) return part.length > 42 ? `${part.slice(0, 42)}…` : part;
                    }
                    const c = req.city && String(req.city).trim();
                    if (c) return c.length > 42 ? `${c.slice(0, 42)}…` : c;
                    return 'Йошкар-Ола';
                  })();
                  const urgent = jobRequestFeedLooksUrgent(req);
                  const statusUpper = jobRequestFeedStatusLabel(req);
                  const cst = req.customerId ? customerStats[String(req.customerId)] : null;
                  const cAvg = cst?.averageRating ?? 0;
                  const cCnt = cst?.reviewsCount ?? 0;
                  const cFill = Math.min(5, Math.max(0, Math.round(Number(cAvg) || 0)));

                  const customerReviewsPath = req.customerId
                    ? `/customers/${req.customerId}${custName ? `?name=${encodeURIComponent(custName)}` : ''}#reviews`
                    : null;

                  const secondBadges = urgent
                    ? []
                    : hasPhoto
                      ? [{ kind: 'gray', icon: '📷', label: 'Есть фото' }]
                      : [{ kind: 'gray', icon: '📋', label: 'Заявка' }];

                  return (
                    <article key={req.id} className="jl-bigcard">
                      <div
                        className="jl-bigcard-cover"
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
                        <img src={hasPhoto ? photos[0] : placeholderBg} alt="" draggable={false} />
                        <span className="jl-bigcard-status">{statusUpper}</span>
                        {urgent && <span className="jl-bigcard-urgent">⚡ Срочно</span>}
                        <div className="jl-bigcard-fav-slot" onClick={e => e.stopPropagation()}>
                          <FavoriteHeartButton kind="jobRequest" id={req.id} />
                        </div>
                        {photos.length > 1 && (
                          <span className="jl-bigcard-photo-cnt">📷 {photos.length}</span>
                        )}
                      </div>

                      {photos.length > 1 && (
                        <div
                          className="jl-bigcard-thumbs"
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
                            <img key={i} src={p} alt="" draggable={false} />
                          ))}
                          {photos.length > 4 && (
                            <div className="jl-bigcard-thumb-more">+{photos.length - 4}</div>
                          )}
                        </div>
                      )}

                      <div className="jl-bigcard-body">
                        {customerHref ? (
                          <Link to={customerHref} className="jl-bigcard-author">
                            {req.customerAvatar ? (
                              <img src={req.customerAvatar} alt="" className="jl-author-ava" />
                            ) : (
                              <div className="jl-author-ava">{(custName || 'З')[0].toUpperCase()}</div>
                            )}
                            <div className="jl-bigcard-author-info">
                              <span className="jl-bigcard-author-name">{custName}</span>
                              <span className="jl-bigcard-author-meta">
                                <span className="ok">Активный заказчик</span>
                                <span className="dot">·</span>
                                <span>{addrShort}</span>
                              </span>
                            </div>
                            <span className="jl-bigcard-chevron">›</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="jl-bigcard-author jl-bigcard-author--btn"
                            onClick={() => openRequestDetail(req)}
                          >
                            {req.customerAvatar ? (
                              <img src={req.customerAvatar} alt="" className="jl-author-ava" />
                            ) : (
                              <div className="jl-author-ava">{(custName || 'З')[0].toUpperCase()}</div>
                            )}
                            <div className="jl-bigcard-author-info">
                              <span className="jl-bigcard-author-name">{custName}</span>
                              <span className="jl-bigcard-author-meta">
                                <span className="ok">Активный заказчик</span>
                                <span className="dot">·</span>
                                <span>{addrShort}</span>
                              </span>
                            </div>
                            <span className="jl-bigcard-chevron">›</span>
                          </button>
                        )}

                        <div
                          className="jl-bigcard-detail-zone"
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
                          <h2 className="jl-bigcard-title">{req.title || 'Заявка'}</h2>
                          {req.description && req.description !== 'Без описания' && (
                            <div className="jl-bigcard-sub">{formatListingOriginDescription('WORKER', req.description)}</div>
                          )}
                          {req.createdAt && (
                            <div className="jl-bigcard-date">
                              🗓 {new Date(req.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>

                        <div className="jl-tags">
                          <span className="jl-tag green">
                            <span>✓</span> Открыта
                          </span>
                          {secondBadges.map((b, i) => (
                            <span key={i} className={`jl-tag ${b.kind}`}>
                              <span>{b.icon}</span> {b.label}
                            </span>
                          ))}
                        </div>

                        {customerReviewsPath ? (
                          <Link
                            to={customerReviewsPath}
                            className="jl-rating-line jl-rating-line--link"
                            title="Открыть отзывы о заказчике"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="stars">
                              {'★'.repeat(cFill)}
                              {'☆'.repeat(5 - cFill)}
                            </span>
                            <b>{cAvg.toFixed(1)}</b>
                            <span>({reviewsCountLabel(cCnt)})</span>
                          </Link>
                        ) : (
                          <div className="jl-rating-line">
                            <span className="stars">
                              {'★'.repeat(cFill)}
                              {'☆'.repeat(5 - cFill)}
                            </span>
                            <b>{cAvg.toFixed(1)}</b>
                            <span>({reviewsCountLabel(cCnt)})</span>
                          </div>
                        )}

                        <div className="jl-bigcard-price-row">
                          {hasJobRequestPublishedPrice(req) ? (
                            <>
                              <div className="jl-bigcard-price">{budgetLabel}</div>
                              <div className="jl-bigcard-price-hint">за работу</div>
                            </>
                          ) : (
                            <>
                              <div className="jl-bigcard-price-muted">{JOB_REQUEST_PRICE_MISSING_LABEL}</div>
                              <div className="jl-bigcard-price-hint">уточните сумму в личных сообщениях</div>
                            </>
                          )}
                        </div>

                        <div className="jl-bigcard-actions">
                          <button
                            type="button"
                            className="jl-bigcard-btn primary"
                            onClick={e => { e.stopPropagation(); handleOpenOfferModal(req); }}
                          >
                            Откликнуться
                          </button>
                          <button
                            type="button"
                            className="jl-bigcard-btn ghost"
                            disabled={!req.customerId}
                            title={!req.customerId ? 'Чат будет доступен после появления профиля заказчика' : undefined}
                            onClick={e => {
                              e.stopPropagation();
                              if (req.customerId) {
                                bumpJobRequestView(req.id);
                                navigate(`/chat/${req.customerId}?jobRequestId=${req.id}`);
                              }
                            }}
                          >
                            Написать
                          </button>
                        </div>
                      </div>
                    </article>
                  );
              })}
            </div>
          )}
          </main>
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
    <div className="jl-page fw-jl-work-hub">
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

      <div className="jl-wrap">
        <div className="fw2-cats-wrap">
          <div className="fw2-cats-label">Выберите категорию</div>
          {loading ? (
            <div className="fw2-cats-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid #ececec' }}>
                  <div className="fw2-sk" style={{ height: 150, borderRadius: 0 }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="fw2-sk" style={{ height: 15, width: '70%' }} />
                    <div className="fw2-sk" style={{ height: 12, width: '85%' }} />
                    <div className="fw2-sk" style={{ height: 12, width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fw2-cats-grid" onMouseLeave={() => setHeroCatSlug(null)}>
              {categories.map(cat => {
                const meta = CAT_ALL[cat.slug] || {};
                const count = getRequestsForCategory(cat).length;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    className={`fw2-cat-card${count > 0 ? ' fw2-cat-card--has-items' : ''}`}
                    onMouseEnter={() => setHeroCatSlug(cat.slug)}
                    onClick={() => {
                      setSelectedCategory(cat);
                      resetCategoryFilters();
                    }}
                  >
                    <div className="fw2-cat-img-wrap">
                      {meta.photo ? (
                        <img src={meta.photo} alt={cat.name} loading="lazy" />
                      ) : (
                        <div className="fw2-cat-img-ph">{meta.emoji || '🛠️'}</div>
                      )}
                      {count > 0 && (
                        <span className="fw2-cat-badge fw2-cat-badge--num" aria-label={pluralRequests(count)}>
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="fw2-cat-body">
                      <div className="fw2-cat-name">{cat.name}</div>
                      <div className="fw2-cat-desc">{meta.desc || 'Профессиональные заказы'}</div>
                      <div className="fw2-cat-footer">
                        {count > 0 ? (
                          <span className="fw2-cat-count">{formatCatalogCountShort(count)}</span>
                        ) : (
                          <span className="fw2-cat-count-none">Нет заявок</span>
                        )}
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
    </div>
  );
}
