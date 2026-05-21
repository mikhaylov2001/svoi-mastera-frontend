import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getCategories,
  getListings,
  acceptListingDeal,
  getMyDeals,
  cancelPendingDeal,
  getWorkerStats,
} from '../../api';
import { fetchStatsMap } from '../../utils/fetchStatsMap';
import { formatCatalogCountShort } from '../../utils/formatCatalogCountShort';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import {
  PAGE_HERO_DEFAULT_PHOTO,
  PAGE_HERO_IMG_FILTER,
  PAGE_HERO_OVERLAY_GRADIENT,
  PAGE_HERO_OBJECT_POSITION,
  PAGE_HERO_OBJECT_FIT,
  heroPhotoHiRes,
} from '../../constants/pageHeroAssets';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { smartTextMatchScore, listingHaystack, rankItemsBySmartMatch } from '../../utils/smartSearch';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
} from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import {
  listingMatchesCatalogCategory,
  mergeApiCategoriesWithCatalog,
} from '../../utils/mergeApiCategoriesWithCatalog';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';
import '../worker/jobListings.css';

/* Плоский словарь slug → данные категории (фото, описание, цена, …) */
const CAT_ALL = {};
Object.values(CATEGORIES_BY_SECTION).forEach((cats) =>
  cats.forEach((cat) => {
    CAT_ALL[cat.slug] = { ...cat, photo: heroPhotoHiRes(cat.photo) };
  }),
);

/** Заголовок объявления в карточке: первая буква по правилам ru-RU. */
function displayListingTitle(t) {
  const raw = typeof t === 'string' ? t.trim() : '';
  if (!raw) return 'Объявление';
  return raw.charAt(0).toLocaleUpperCase('ru-RU') + raw.slice(1);
}

function listingFeedStatusLabel(s) {
  if (s?.active === false) return 'НЕАКТИВНО';
  const t = s?.createdAt ? new Date(s.createdAt).getTime() : 0;
  if (t && Date.now() - t < 72 * 3600 * 1000) return 'НОВОЕ';
  return 'АКТИВНО';
}

function listingFeedLooksUrgent(s) {
  const hay = `${s?.title || ''} ${s?.description || ''}`.toLowerCase();
  return hay.includes('срочн') || hay.includes('сегодня') || hay.includes('завтра');
}

const HERO_PHOTO = PAGE_HERO_DEFAULT_PHOTO;

const css = `
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
    padding: 8px 24px 8px;
  }
  .fmp-global-search-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .fmp-global-search-title {
    font-size: 17px;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0;
    flex: 1;
    min-width: 200px;
    letter-spacing: -.02em;
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
    transition: border-color .15s, color .15s;
  }
  .fmp-global-search-clear:hover {
    border-color: #e8410a;
    color: #e8410a;
  }
  .fmp-global-empty {
    text-align: center;
    padding: 36px 22px;
    color: #777;
    font-size: 14px;
    line-height: 1.5;
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #e8e8e8;
    margin-bottom: 8px;
  }
  .fmp-global-list { margin-bottom: 8px; }
  .fmp-gcard {
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    transition: border-color .2s, box-shadow .2s;
  }
  .fmp-gcard:hover {
    border-color: rgba(232, 65, 10, 0.35);
    box-shadow: 0 10px 32px rgba(0,0,0,.08);
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
  }
  .fmp-gcard-ph {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: #bbb;
  }
  .fmp-gcard-body {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }
  .fmp-gcard-cat {
    font-size: 11px;
    font-weight: 700;
    color: #e8410a;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .fmp-gcard-title {
    font-size: 15px;
    font-weight: 800;
    line-height: 1.25;
    color: #111;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fmp-gcard-worker {
    font-size: 13px;
    color: #666;
    font-weight: 600;
  }
  .fmp-gcard-price {
    font-size: 16px;
    font-weight: 900;
    color: #1a1a1a;
    margin-top: auto;
    padding-top: 4px;
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
    .jl-page.fw-jl-cat-feed .fmp-topbar-inner {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      align-items: stretch !important;
      gap: 10px !important;
    }
    .jl-page.fw-jl-cat-feed .fmp-search-dd-wrap {
      flex: 1 !important;
      min-width: 0 !important;
    }
    .jl-page.fw-jl-cat-feed .fmp-topbar-btn {
      width: auto !important;
      min-width: 84px !important;
      flex-shrink: 0 !important;
      min-height: 48px !important;
      border-radius: 12px !important;
      font-size: 15px !important;
      font-weight: 800 !important;
    }
    .fmp-hero-body {
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
      padding-bottom: 28px;
    }
    .fmp-cats-wrap {
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
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

function pluralActiveListings(n) {
  const x = Number(n) || 0;
  if (x % 10 === 1 && x % 100 !== 11) return `${x} объявление`;
  if ([2, 3, 4].includes(x % 10) && ![12, 13, 14].includes(x % 100)) return `${x} объявления`;
  return `${x} объявлений`;
}

function CheckItem({ checked, onChange, children }) {
  return (
    <div className="fmp-check-item" onClick={onChange}>
      <div className={`fmp-check-box${checked ? ' on' : ''}`}>
        {checked && <span className="fmp-check-tick">✓</span>}
      </div>
      <span>{children}</span>
    </div>
  );
}

export default function FindMasterPage() {
  const navigate  = useNavigate();
  const { categorySlug } = useParams();
  const { userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories,  setCategories]  = useState([]);
  const [services,    setServices]    = useState([]);
  const [workerStats, setWorkerStats] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  const [searchTerm,    setSearchTerm]    = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [showActive,    setShowActive]    = useState(true);
  const [onlyVerified,  setOnlyVerified]  = useState(false);
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [sortBy,        setSortBy]        = useState('recency');
  const [priceMin,      setPriceMin]      = useState('');
  const [priceMax,      setPriceMax]      = useState('');
  const [ratingMin,     setRatingMin]     = useState(0);
  const [acceptingId,   setAcceptingId]   = useState(null);
  const [acceptErr,     setAcceptErr]     = useState({});
  // listingId → dealId  (состояние с бэка: NEW-сделка ожидает мастера)
  const [pendingDeals,  setPendingDeals]  = useState({});
  const [cancellingListingId, setCancellingListingId] = useState(null);
  /** Подсветка фона hero при наведении на карточку категории (как на «Найти работу») */
  const [heroCatSlug, setHeroCatSlug] = useState(null);

  const listingPublicUrl = useCallback(
    (listingId) => {
      const q = new URLSearchParams({ from: 'find-master' });
      if (categorySlug) q.set('cat', categorySlug);
      return `/listings/${listingId}?${q.toString()}`;
    },
    [categorySlug],
  );

  const [fmpSearchFocused, setFmpSearchFocused] = useState(false);
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');
  const fmpSearchDdRef = useRef(null);

  // Строим pendingDeals из реальных сделок бэкенда (listingId → dealId)
  const buildPendingFromDeals = useCallback((deals) => {
    const map = {};
    (deals || []).forEach(d => {
      const lid = d.listingId;
      // NEW-сделки из объявлений где мы — заказчик (ждём подтверждения мастера)
      if (lid && d.status === 'NEW' && String(d.customerId) === String(userId)) {
        map[String(lid)] = d.id;
      }
    });
    setPendingDeals(map);
  }, [userId]);

  const handleAcceptListing = useCallback(async (listingId, workerId) => {
    if (!userId) { navigate('/login'); return; }
    if (String(userId) === String(workerId)) {
      setAcceptErr(prev => ({ ...prev, [listingId]: 'Нельзя принять своё объявление' }));
      return;
    }
    setAcceptingId(listingId);
    setAcceptErr(prev => ({ ...prev, [listingId]: '' }));
    try {
      const result = await acceptListingDeal(userId, listingId);
      const dealId = result?.id || result?.dealId || listingId;
      // Мгновенное обновление — listingId как строка
      setPendingDeals(prev => ({ ...prev, [String(listingId)]: dealId }));
      // Фоновое обновление сделок с бэка
      getMyDeals(userId).then(buildPendingFromDeals).catch(() => {});
    } catch (e) {
      setAcceptErr(prev => ({ ...prev, [listingId]: e?.message || 'Не удалось оформить' }));
    } finally {
      setAcceptingId(null);
    }
  }, [userId, navigate, buildPendingFromDeals]);

  const handleCancelPendingListing = useCallback(async (listingId) => {
    const dealId = pendingDeals[String(listingId)];
    if (!dealId || !userId) return;
    if (!window.confirm('Отменить заявку мастеру? Вы сможете оформить заказ снова позже.')) return;
    setCancellingListingId(listingId);
    setAcceptErr(prev => ({ ...prev, [listingId]: '' }));
    try {
      await cancelPendingDeal(userId, dealId, '');
      const fresh = await getMyDeals(userId).catch(() => []);
      buildPendingFromDeals(fresh);
    } catch (e) {
      setAcceptErr(prev => ({ ...prev, [listingId]: e?.message || 'Не удалось отменить' }));
    } finally {
      setCancellingListingId(null);
    }
  }, [userId, pendingDeals, buildPendingFromDeals]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchInput(searchInput.trim()), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  const applyCategorySearch = useCallback(
    (value) => {
      const q = (value !== undefined ? String(value) : searchInput).trim();
      setSearchInput(q);
      setSearchTerm(q);
      setFmpSearchFocused(false);
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
    if (!categorySlug) return;
    setSearchTerm(debouncedSearchInput);
  }, [debouncedSearchInput, categorySlug]);

  useEffect(() => {
    if (!fmpSearchFocused) return;
    const onDoc = (e) => {
      if (fmpSearchDdRef.current && !fmpSearchDdRef.current.contains(e.target)) {
        setFmpSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [fmpSearchFocused]);

  useEffect(() => {
    if (!fmpSearchFocused) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setFmpSearchFocused(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fmpSearchFocused]);

  const reloadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    setWorkerStats({});
    try {
      const dealsPromise = userId ? getMyDeals(userId).catch(() => []) : Promise.resolve([]);
      const [cats, listings, deals] = await Promise.all([
        getCategories(),
        getListings(),
        dealsPromise,
      ]);
      setCategories(mergeApiCategoriesWithCatalog(Array.isArray(cats) ? cats : []));
      buildPendingFromDeals(deals);
      const raw = Array.isArray(listings) ? listings : [];
      const processed = raw.map((item) => ({
        ...item,
        workerId: item.workerId,
        workerName: [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
        priceFrom: getListingPublishedPriceNumber(item) || 0,
        verified: item.workerVerified === true,
      }));
      setServices(processed);
      const ids = [...new Set(processed.map((s) => s.workerId).filter(Boolean))];
      setWorkerStats(await fetchStatsMap(ids, getWorkerStats));
    } catch (e) {
      setCategories(mergeApiCategoriesWithCatalog([]));
      setServices([]);
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId, buildPendingFromDeals]);

  useEffect(() => { reloadCatalog(); }, [reloadCatalog]);

  useSameRouteRefetch('/find-master', reloadCatalog);

  const urlQ = (searchParams.get('q') || '').trim();

  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    setSearchInput(q);
    setSearchTerm(q);
  }, [searchParams]);

  const selectedCategory = categories.find(c => c.slug === categorySlug);

  const fmpDdMatches = useMemo(() => {
    if (!selectedCategory || !debouncedSearchInput || debouncedSearchInput.length < 2) return [];
    const pool = services.filter((s) => {
      const catOk = listingMatchesCatalogCategory(s, selectedCategory);
      return catOk && s.active !== false;
    });
    return rankItemsBySmartMatch(pool, debouncedSearchInput, listingHaystack, { limit: 8 });
  }, [services, selectedCategory, debouncedSearchInput]);

  const showFmpSearchDd = fmpSearchFocused && debouncedSearchInput.length >= 2;

  const globalMatches = useMemo(() => {
    if (!urlQ) return [];
    const active = services.filter((s) => s.active !== false);
    return rankItemsBySmartMatch(active, urlQ, listingHaystack);
  }, [services, urlQ]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSearchInput('');
    setShowActive(true);
    setOnlyVerified(false);
    setOnlyWithPhoto(false);
    setSortBy('recency');
    setPriceMin('');
    setPriceMax('');
    setRatingMin(0);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    });
  }, [setSearchParams]);

  /* ══════════════════════════════
     ГЛАВНАЯ — список категорий
  ══════════════════════════════ */
  if (!categorySlug) {
    const totalMasters   = [...new Set(services.map(s => s.workerId))].length;
    const activeListings = services.filter(s => s.active !== false).length;

    return (
      <div className="fmp-page">
        <style>{css}</style>

        {/* Hero с фото-фоном */}
        <div className="fmp-hero">
          <img
            src={heroCatSlug ? (CAT_ALL[heroCatSlug]?.photo || HERO_PHOTO) : HERO_PHOTO}
            alt=""
            className="fmp-hero-bg"
          />
          <div className="fmp-hero-overlay"/>
          <div className="fmp-hero-body">
            <h1>Мастера<br/>в Йошкар-Оле</h1>
            <p className="fmp-hero-sub">Ремонт, красота, обучение и всё остальное — мастера рядом</p>
            {!loading && (
              <div className="fmp-hero-stats">
                {[
                  { val: categories.length, label: 'категорий' },
                  { val: totalMasters,      label: 'мастеров' },
                  { val: activeListings,    label: 'объявлений' },
                ].map(({ val, label }) => (
                  <div key={label} className="fmp-hero-stat">
                    <span className="fmp-hero-stat-val">{val}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

        {urlQ && (
          <div className="fmp-global-search">
            <div className="fmp-global-search-bar">
              <h2 className="fmp-global-search-title">
                Результаты поиска: «{urlQ}»
                {!loading && (
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#888', marginLeft: 10 }}>
                    · {globalMatches.length}{' '}
                    {globalMatches.length === 1 ? 'объявление' : globalMatches.length < 5 ? 'объявления' : 'объявлений'}
                  </span>
                )}
              </h2>
              <button type="button" className="fmp-global-search-clear" onClick={() => setSearchParams({})}>
                Очистить поиск
              </button>
            </div>
            {loading ? (
              <div className="fmp-list fmp-global-list">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="fmp-gcard" style={{ pointerEvents: 'none' }}>
                    <div className="fmp-gcard-photo">
                      <div className="sk" style={{ height: '100%', minHeight: 160 }} />
                    </div>
                    <div className="fmp-gcard-body">
                      <div className="sk" style={{ height: 12, width: '35%' }} />
                      <div className="sk" style={{ height: 18, width: '88%', marginTop: 8 }} />
                      <div className="sk" style={{ height: 14, width: '55%', marginTop: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : globalMatches.length === 0 ? (
              <div className="fmp-global-empty">
                По запросу «{urlQ}» активных объявлений не найдено. Попробуйте другие слова или выберите категорию ниже.
              </div>
            ) : (
              <div className="fmp-list fmp-global-list">
                {globalMatches.map(s => {
                  const photos = s.photos || [];
                  const mainPhoto =
                    photos[0] ||
                    getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category }, categories);
                  return (
                    <Link key={s.id} to={listingPublicUrl(s.id)} className="fmp-gcard">
                      <div className="fmp-gcard-photo">
                        <img src={mainPhoto} alt="" />
                      </div>
                      <div className="fmp-gcard-body">
                        {s.category && <span className="fmp-gcard-cat">{s.category}</span>}
                        <div className="fmp-gcard-title">{s.title || 'Объявление'}</div>
                        <div className="fmp-gcard-worker">{s.workerName}</div>
                        <div className="fmp-gcard-price">
                          {s.priceFrom ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                          {s.priceUnit ? ` ${s.priceUnit}` : ''}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Сетка категорий */}
        <div className="fmp-cats-wrap">
          <div className="fmp-cats-label">Выберите категорию</div>
          {loading ? (
            <div className="fmp-cats-grid">
              {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1.5px solid #e8e8e8' }}>
                  <div className="sk" style={{ height: 150, borderRadius: 0 }}/>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="sk" style={{ height: 15, width: '70%' }}/>
                    <div className="sk" style={{ height: 12, width: '85%' }}/>
                    <div className="sk" style={{ height: 12, width: '55%' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {error && services.length === 0 && (
                <div className="fmp-catalog-warn" role="status">
                  <span>{error}</span>
                  <button type="button" onClick={reloadCatalog}>Повторить</button>
                </div>
              )}
            <div className="fmp-cats-grid" onMouseLeave={() => setHeroCatSlug(null)}>
              {categories.map(cat => {
                const meta  = CAT_ALL[cat.slug] || {};
                const count = services.filter(
                  (s) => listingMatchesCatalogCategory(s, cat) && s.active !== false
                ).length;

                return (
                  <Link
                    key={cat.slug}
                    to={urlQ ? `/find-master/${cat.slug}?q=${encodeURIComponent(urlQ)}` : `/find-master/${cat.slug}`}
                    className={`fmp-cat-card${count > 0 ? ' fmp-cat-card--has-items' : ''}`}
                    onMouseEnter={() => setHeroCatSlug(cat.slug)}
                  >
                    <div className="fmp-cat-img-wrap">
                      {meta.photo
                        ? <img src={meta.photo} alt={cat.name} loading="lazy"/>
                        : <div className="fmp-cat-img-ph">{meta.emoji || '🛠️'}</div>
                      }
                      {count > 0 && (
                        <span className="fmp-cat-badge fmp-cat-badge--num" aria-label={pluralActiveListings(count)}>
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="fmp-cat-body">
                      <div className="fmp-cat-name">{cat.name}</div>
                      <div className="fmp-cat-desc">{meta.desc || cat.description || 'Профессиональные мастера'}</div>
                      <div className="fmp-cat-footer">
                        {count > 0 ? (
                          <span className="fmp-cat-count">{formatCatalogCountShort(count)}</span>
                        ) : (
                          <span className="fmp-cat-count-none">Нет объявлений</span>
                        )}
                        <div className="fmp-cat-go">›</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            </>
          )}
          </div>
      </div>
    );
  }

  /* ══════════════════════════════
     СТРАНИЦА КАТЕГОРИИ
  ══════════════════════════════ */
  if (!loading && !selectedCategory) {
    return (
      <div className="fmp-page">
        <style>{css}</style>
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <p style={{ color: '#888', marginBottom: 16 }}>Категория не найдена</p>
          <Link to="/find-master" className="fmp-empty-btn">← К категориям</Link>
        </div>
      </div>
    );
  }

  const catMeta = CAT_ALL[categorySlug] || {};

  const qSearch = searchTerm.trim();

  const visibleFiltered = services.filter((s) => {
      const catOk = listingMatchesCatalogCategory(s, selectedCategory);
      if (!catOk) return false;
      if (showActive && !s.active) return false;
      if (onlyVerified && !s.verified) return false;
      if (onlyWithPhoto && !(s.photos?.length > 0)) return false;
      if (priceMin && Number(s.priceFrom) < Number(priceMin)) return false;
      if (priceMax && Number(s.priceFrom) > Number(priceMax)) return false;
      if (ratingMin > 0) {
        const st = workerStats[s.workerId];
        if (!st || (st.averageRating || 0) < ratingMin) return false;
      }
      if (qSearch) {
        const sc = smartTextMatchScore(listingHaystack(s), qSearch);
        if (sc === null || sc === 0) return false;
      }
      return true;
    });

  const visible = qSearch
    ? rankItemsBySmartMatch(visibleFiltered, qSearch, listingHaystack)
    : [...visibleFiltered].sort((a, b) => {
      if (sortBy === 'priceAsc')  return (a.priceFrom || 0) - (b.priceFrom || 0);
      if (sortBy === 'priceDesc') return (b.priceFrom || 0) - (a.priceFrom || 0);
      if (sortBy === 'rating') {
        const ra = workerStats[a.workerId]?.averageRating || 0;
        const rb = workerStats[b.workerId]?.averageRating || 0;
        return rb - ra;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const hasFilters = !showActive || onlyVerified || onlyWithPhoto || priceMin || priceMax || ratingMin > 0 || searchTerm;

  return (
    <div className="jl-page fw-jl-cat-feed">
      <style>{css}</style>

      {/* Топ-бар поиска */}
      <div className="fmp-topbar">
        <div className="fmp-topbar-inner">
          <div className="fmp-search-dd-wrap" ref={fmpSearchDdRef}>
            <div className="fmp-search-wrap">
              <svg width="15" height="15" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onFocus={() => setFmpSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyCategorySearch(searchInput);
                  }
                }}
                placeholder={`Поиск в «${selectedCategory?.name || '...'}»`}
                autoComplete="off"
                aria-expanded={showFmpSearchDd}
                aria-controls="fmp-search-dropdown-list"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => applyCategorySearch('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: 18, lineHeight: 1, padding: 0 }}
                  aria-label="Очистить поиск"
                >
                  ×
                </button>
              )}
            </div>
            {showFmpSearchDd && (
              <div id="fmp-search-dropdown-list" className="fmp-search-dropdown" role="listbox" aria-label="Подсказки поиска">
                {fmpDdMatches.length === 0 ? (
                  <div className="fmp-search-hint">В этой категории похожих объявлений не нашлось. Нажмите «Поиск», чтобы применить запрос к списку.</div>
                ) : (
                  <>
                    {fmpDdMatches.map((s) => {
                      const mainPhoto =
                        (s.photos || [])[0] ||
                        getCategoryPlaceholderPhotoUrlOrDefault(
                          { category: s.category, categorySlug },
                          categories,
                        );
                      return (
                        <Link
                          key={s.id}
                          to={listingPublicUrl(s.id)}
                          className="fmp-search-hit"
                          onClick={() => setFmpSearchFocused(false)}
                        >
                          <div className="fmp-search-hit-ph">
                            <img src={mainPhoto} alt="" />
                          </div>
                          <div className="fmp-search-hit-body">
                            <div className="fmp-search-hit-title">{displayListingTitle(s.title)}</div>
                            <div className="fmp-search-hit-meta">{s.workerName || ''}</div>
                            <div className="fmp-search-hit-price">
                              {s.priceFrom ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                              {s.priceUnit ? ` ${s.priceUnit}` : ''}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      className="fmp-search-footer"
                      onClick={() => applyCategorySearch(debouncedSearchInput)}
                    >
                      Показать все совпадения в списке →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <button type="button" className="fmp-topbar-btn" onClick={() => applyCategorySearch(searchInput)}>
            Найти
          </button>
        </div>
      </div>

      <div className="jl-wrap">
        <div className="jl-crumbs">
          <Link to="/find-master" className="jl-crumbs-link">Все категории</Link>
          <span className="sep">›</span>
          <span className="cur">{selectedCategory?.name}</span>
          {!loading && (
            <>
              <span className="sep">·</span>
              <span>{visible.length} {visible.length === 1 ? 'объявление' : visible.length < 5 ? 'объявления' : 'объявлений'}</span>
            </>
          )}
        </div>

        <div className="jl-layout">
          <aside className="jl-side">
            <div className="jl-cat-cover">
              {catMeta.photo ? (
                <img src={catMeta.photo} alt={selectedCategory?.name || ''} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,.9)' }}>
                  {catMeta.emoji || '🛠️'}
                </div>
              )}
              <div className="jl-cat-cover-body">
                <div className="jl-cat-cover-title">{selectedCategory?.name}</div>
                <button type="button" className="jl-cat-cover-back" onClick={() => navigate('/find-master')}>
                  ← Все категории
                </button>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Цена, ₽</div>
              <div className="jl-side-row">
                <div className="jl-side-field">
                  <label htmlFor="fmp-price-min">От</label>
                  <input id="fmp-price-min" type="number" min="0" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                </div>
                <div className="jl-side-field">
                  <label htmlFor="fmp-price-max">До</label>
                  <input id="fmp-price-max" type="number" min="0" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="jl-side-card">
              <div className="jl-side-title">Рейтинг</div>
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
              <CheckItem checked={showActive} onChange={() => setShowActive(v => !v)}>Только активные</CheckItem>
              <CheckItem checked={onlyVerified} onChange={() => setOnlyVerified(v => !v)}>Проверенные мастера</CheckItem>
              <CheckItem checked={onlyWithPhoto} onChange={() => setOnlyWithPhoto(v => !v)}>С фотографиями</CheckItem>
            </div>

            {hasFilters && (
              <button type="button" className="jl-cat-feed-reset" onClick={resetFilters}>✕ Сбросить фильтры</button>
            )}
          </aside>

          <main>
            {qSearch ? (
              <div className="jl-search-active" role="status">
                <span>
                  Поиск: <strong>«{qSearch}»</strong>
                </span>
                <span>
                  {visible.length}{' '}
                  {visible.length === 1 ? 'объявление' : visible.length < 5 ? 'объявления' : 'объявлений'}
                </span>
                <button type="button" className="jl-search-active-clear" onClick={() => applyCategorySearch('')}>
                  Сбросить
                </button>
              </div>
            ) : null}

            <div className="jl-toolbar">
              <span className="jl-toolbar-label">Сортировать:</span>
              {[
                { val: 'recency', label: 'Новые' },
                { val: 'rating', label: 'Рейтинг' },
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
              <span className="jl-toolbar-count">
                {loading ? '…' : `${visible.length} ${visible.length === 1 ? 'объявление' : visible.length < 5 ? 'объявления' : 'объявлений'}`}
              </span>
            </div>

            {loading ? (
              <div className="jl-list">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #ececec', overflow: 'hidden' }}>
                    <div className="sk" style={{ paddingTop: '38%', borderRadius: 0 }} />
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="sk" style={{ height: 12, width: '45%' }} />
                      <div className="sk" style={{ height: 18, width: '80%' }} />
                      <div className="sk" style={{ height: 11, width: '90%' }} />
                      <div className="sk" style={{ height: 22, width: '35%', marginTop: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="jl-feed-empty">
                <div className="jl-feed-empty-ico">🔍</div>
                <h3>Объявлений не найдено</h3>
                <p>{hasFilters ? 'Измените параметры или сбросьте фильтры.' : 'В этой категории пока нет объявлений.'}</p>
                {hasFilters ? (
                  <button type="button" className="jl-bigcard-btn ghost" style={{ marginTop: 16, maxWidth: 280 }} onClick={resetFilters}>
                    Сбросить фильтры
                  </button>
                ) : (
                  <Link to="/find-master" className="jl-bigcard-btn ghost" style={{ marginTop: 16, maxWidth: 280 }}>
                    ← Все категории
                  </Link>
                )}
              </div>
            ) : (
              <div className="jl-list jl-feed-list">
              {visible.map(s => {
                const stats = workerStats[s.workerId];
                const wid = s.workerId;
                const photos = s.photos || [];
                const hasPhoto = photos.length > 0;
                const listingPlaceholder = getCategoryPlaceholderPhotoUrlOrDefault(
                  { category: s.category, categorySlug },
                  categories,
                );
                const ava = stats?.workerAvatar || s.workerAvatar || null;
                const addrShort = (() => {
                  const addr = s.address && String(s.address).trim();
                  if (addr) {
                    const part = addr.split(',')[0].trim();
                    if (part) return part.length > 42 ? `${part.slice(0, 42)}…` : part;
                  }
                  const c = s.city && String(s.city).trim();
                  if (c) return c.length > 42 ? `${c.slice(0, 42)}…` : c;
                  return 'Йошкар-Ола';
                })();
                const urgent = listingFeedLooksUrgent(s);
                const statusUpper = listingFeedStatusLabel(s);
                const cFill = stats
                  ? Math.min(5, Math.max(0, Math.round(Number(stats.averageRating) || 0)))
                  : 0;
                const cAvg = stats?.averageRating ?? 0;
                const cCnt = stats?.reviewsCount ?? 0;

                const jlTags = [
                  {
                    kind: 'green',
                    icon: '✓',
                    label: s.active !== false ? 'Активно' : 'Неактивно',
                  },
                ];
                if (!(urgent && s.active !== false)) {
                  if (s.verified) {
                    jlTags.push({ kind: 'green', icon: '✓', label: 'Проверен' });
                  } else if (s.ownerGuaranteeTermsAccepted) {
                    jlTags.push({ kind: 'amber', icon: '🛡', label: 'Гарантия' });
                  } else {
                    jlTags.push({ kind: 'gray', icon: '⚡', label: 'Объявление' });
                  }
                }

                return (
                  <article key={s.id} className="jl-bigcard">
                    <div
                      className="jl-bigcard-cover"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(listingPublicUrl(s.id))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(listingPublicUrl(s.id));
                        }
                      }}
                    >
                      <img
                        src={hasPhoto ? photos[0] : listingPlaceholder}
                        alt={displayListingTitle(s.title)}
                        draggable={false}
                      />
                      <span className="jl-bigcard-status">{statusUpper}</span>
                      {urgent && s.active !== false && (
                        <span className="jl-bigcard-urgent">⚡ Срочно</span>
                      )}
                      {s.active !== false && (
                        <div className="jl-bigcard-fav-slot" onClick={e => e.stopPropagation()}>
                          <FavoriteHeartButton kind="listing" id={s.id} />
                        </div>
                      )}
                      {photos.length > 1 && (
                        <span className="jl-bigcard-photo-cnt">📷 {photos.length}</span>
                      )}
                    </div>

                    {photos.length > 1 && (
                      <div
                        className="jl-bigcard-thumbs"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(listingPublicUrl(s.id))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(listingPublicUrl(s.id));
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
                      <Link to={`/workers/${wid}`} className="jl-bigcard-author">
                        {ava && ava.length > 10 ? (
                          <img src={ava} alt="" className="jl-author-ava" />
                        ) : (
                          <div className="jl-author-ava">{(s.workerName || 'М')[0].toUpperCase()}</div>
                        )}
                        <div className="jl-bigcard-author-info">
                          <span className="jl-bigcard-author-name">{s.workerName}</span>
                          <span className="jl-bigcard-author-meta">
                            <span className="ok">{s.active !== false ? 'Активный мастер' : 'Мастер'}</span>
                            <span className="dot">·</span>
                            <span>{addrShort}</span>
                          </span>
                        </div>
                        <span className="jl-bigcard-chevron">›</span>
                      </Link>

                      <div
                        className="jl-bigcard-detail-zone"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(listingPublicUrl(s.id))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(listingPublicUrl(s.id));
                          }
                        }}
                      >
                        <h2 className="jl-bigcard-title">{displayListingTitle(s.title)}</h2>
                        {s.description && <div className="jl-bigcard-sub">{s.description}</div>}
                      </div>

                      <div className="jl-tags">
                        {jlTags.map((b, i) => (
                          <span key={i} className={`jl-tag ${b.kind}`}>
                            <span>{b.icon}</span> {b.label}
                          </span>
                        ))}
                      </div>

                      {stats ? (
                        <Link
                          to={`/workers/${wid}#reviews`}
                          className="jl-rating-line jl-rating-line--link"
                          title="Открыть отзывы о мастере"
                          onClick={e => e.stopPropagation()}
                        >
                          {(stats.reviewsCount || 0) === 0 ? (
                            <>
                              <span className="stars jl-stars-muted">☆☆☆☆☆</span>
                              <span className="fmp-rating-empty">Пока нет отзывов</span>
                            </>
                          ) : (
                            <>
                              <span className="stars">
                                {'★'.repeat(cFill)}
                                {'☆'.repeat(5 - cFill)}
                              </span>
                              <b>{cAvg.toFixed(1)}</b>
                              <span>
                                ({cCnt}{' '}
                                {cCnt === 1 ? 'отзыв' : cCnt < 5 ? 'отзыва' : 'отзывов'})
                              </span>
                              {stats.completedWorksCount > 0 && (
                                <span>· 📦 {stats.completedWorksCount} заказов</span>
                              )}
                            </>
                          )}
                        </Link>
                      ) : null}

                      {pendingDeals[String(s.id)] ? (
                        <div className="fmp-card-footer-pending">
                          <div className="fmp-card-price-block">
                            <div className="fmp-card-price">
                              {s.priceFrom ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                            </div>
                            {s.priceUnit && <span className="fmp-card-price-unit">{s.priceUnit}</span>}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="fmp-pending-link"
                              onClick={e => {
                                e.stopPropagation();
                                navigate('/deals');
                              }}
                            >
                              К сделкам →
                            </button>
                          </div>
                          <div className="fmp-pending-banner">
                            <span>⏳ Ждём подтверждения мастера</span>
                            <span style={{ fontWeight: 400, color: '#78350f' }}>Мастер должен принять заказ</span>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginTop: 4,
                                alignItems: 'center',
                              }}
                            >
                              <button
                                type="button"
                                className="fmp-pending-link"
                                disabled={cancellingListingId === s.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCancelPendingListing(s.id);
                                }}
                                style={{ color: '#b91c1c', fontWeight: 700 }}
                              >
                                {cancellingListingId === s.id ? 'Отменяем…' : 'Отменить заявку'}
                              </button>
                            </div>
                            {acceptErr[s.id] && (
                              <div
                                className="fmp-card-action-err"
                                style={{ alignSelf: 'stretch', textAlign: 'left', maxWidth: 'none' }}
                              >
                                {acceptErr[s.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="jl-bigcard-price-row">
                            {s.priceFrom ? (
                              <>
                                <div className="jl-bigcard-price">
                                  {Number(s.priceFrom).toLocaleString('ru-RU')} ₽
                                </div>
                                <div className="jl-bigcard-price-hint">{s.priceUnit || 'за работу'}</div>
                              </>
                            ) : (
                              <>
                                <div className="jl-bigcard-price-muted">Договорная</div>
                                <div className="jl-bigcard-price-hint">уточните у мастера</div>
                              </>
                            )}
                          </div>
                          <div className="jl-bigcard-actions">
                            <button
                              type="button"
                              className="jl-bigcard-btn primary"
                              disabled={acceptingId === s.id || String(userId) === String(wid)}
                              title={String(userId) === String(wid) ? 'Нельзя принять своё объявление' : ''}
                              onClick={e => {
                                e.stopPropagation();
                                handleAcceptListing(s.id, wid);
                              }}
                            >
                              {acceptingId === s.id ? '⏳ Оформляем…' : 'Принять'}
                            </button>
                            <button
                              type="button"
                              className="jl-bigcard-btn ghost"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/chat/${wid}`);
                              }}
                            >
                              Написать
                            </button>
                            {acceptErr[s.id] && (
                              <div className="fmp-card-action-err">{acceptErr[s.id]}</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
