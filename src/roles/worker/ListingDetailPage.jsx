import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { acceptListingDeal, recordListingView, getMyDeals, workerStartDeal } from '../../api';
import ListingInfoPanels from '../../components/ListingInfoPanels';
import { dealsWdCss } from '../shared/dealsWdStyles';
import { categoryChipToneClass } from '../../utils/categoryChipTone';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
  getCategorySlugFromLabel,
} from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

/** Одна отправка просмотра на id за сессию (React StrictMode и повторные fetch) */
const listingViewPostedIds = new Set();

function reviewsCountLabel(n) {
  const x = Number(n) || 0;
  const abs = x % 100;
  const d = x % 10;
  if (abs > 10 && abs < 20) return `${x} отзывов`;
  if (d === 1) return `${x} отзыв`;
  if (d >= 2 && d <= 4) return `${x} отзыва`;
  return `${x} отзывов`;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  .ld * { box-sizing: border-box; }
  .ld { font-family: Inter, Arial, sans-serif; background: #f5f5f5; min-height: 100vh; color: #111; }

  /* BREADCRUMB */
  .ld-bread { background: #fff; border-bottom: 1px solid #eaeaea; }
  .ld-bread-inner { max-width: 1000px; margin: 0 auto; padding: 11px 20px; display: flex; align-items: center; gap: 7px; font-size: 13px; color: #aaa; flex-wrap: wrap; }
  .ld-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 0;
    border: none;
    background: none;
    color: #888;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    flex-shrink: 0;
    transition: color .15s;
  }
  .ld-back-btn:hover { color: #e8410a; }
  .ld-back-btn .ld-back-ico {
    font-size: 15px; line-height: 1; color: inherit; font-weight: 600;
    letter-spacing: -0.06em;
  }
  .ld-bread a { color: #888; text-decoration: none; transition: color .15s; }
  .ld-bread a:hover { color: #e8410a; }
  .ld-bread-sep { color: #ddd; }

  /* PAGE LAYOUT — как превью «Мои объявления» */
  .ld-page { max-width: 1000px; margin: 0 auto; padding: 20px 20px 64px; display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: flex-start; }
  .ld-left { min-width: 0; display: flex; flex-direction: column; gap: 0; }

  /* Шапка блока как «ЭКРАН 3» FindWork */
  .ld-fw-head { margin-bottom: 16px; }
  .ld-fw-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 6px; }
  .ld-fw-title { margin: 0; font-size: 24px; font-weight: 800; line-height: 1.2; color: #111827; letter-spacing: -0.02em; flex: 1; min-width: 0; }
  .ld-fw-meta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; font-size: 13px; color: #9ca3af; }

  /* Карточка только с галереей */
  .ld-fw-gallery-card {
    background: #fff;
    overflow: hidden;
    margin-bottom: 16px;
  }

  /* CARDS BASE — обводка: unifiedListingCards.css */
  .ld-card { background: #fff; overflow: hidden; }

  .ld-actions-row { display: flex; gap: 8px; flex-shrink: 0; }
  .ld-action-btn { display: inline-flex; align-items: center; gap: 6px; background: #f5f5f7; border: none; border-radius: 10px; font-size: 13px; font-weight: 500; color: #555; padding: 8px 14px; cursor: pointer; font-family: inherit; transition: background .15s, color .15s; }
  .ld-action-btn:hover { background: #ececec; color: #222; }

  /* GALLERY */
  .ld-gallery-wrap { position: relative; background: #fff; overflow: hidden; user-select: none; }
  .ld-fw-gallery-card .ld-gallery-main { aspect-ratio: 4/3; background: #f3f4f6; cursor: pointer; }
  .ld-gallery-main { position: relative; aspect-ratio: 16/9; background: #f5f5f5; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
  .ld-gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity .22s ease; image-rendering: -webkit-optimize-contrast; }
  .ld-gallery-ph { font-size: 64px; color: #d1d5db; }
  .ld-fw-gallery-card .ld-gallery-ph { display: flex; background: #f9fafb; width: 100%; height: 100%; align-items: center; justify-content: center; }
  .ld-gallery-nav-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: rgba(0,0,0,.45); color: #fff; font-size: 22px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; z-index: 5;
    transition: background .15s; line-height: 1;
  }
  .ld-gallery-nav-btn:hover { background: rgba(0,0,0,.6); }
  .ld-gallery-nav-btn.prev { left: 10px; }
  .ld-gallery-nav-btn.next { right: 10px; }
  .ld-fw-gallery-card .ld-gallery-nav-btn {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.85); color: #111827;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .ld-fw-gallery-card .ld-gallery-nav-btn:hover { background: rgba(255,255,255,0.95); }
  .ld-fw-gallery-card .ld-gallery-nav-btn.prev { left: 12px; }
  .ld-fw-gallery-card .ld-gallery-nav-btn.next { right: 12px; }
  .ld-fw-gallery-card .ld-gallery-dots { display: none !important; }
  .ld-fw-gallery-card .ld-gallery-zoom { display: none !important; }
  .ld-fw-gallery-card .ld-thumb { width: 80px; height: 60px; border-radius: 6px; }

  .ld-gallery-zoom {
    position: absolute; bottom: 12px; right: 12px; z-index: 4;
    width: 34px; height: 34px; background: rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.35);
    border-radius: 8px; color: #fff; font-size: 15px;
    display: flex; align-items: center; justify-content: center; cursor: zoom-in;
    transition: background .15s;
  }
  .ld-gallery-zoom:hover { background: rgba(0,0,0,.55); }
  .ld-gallery-count {
    position: absolute; bottom: 12px; left: 12px;
    background: rgba(0,0,0,.5); color: #fff; font-size: 12px; font-weight: 700;
    padding: 4px 10px; border-radius: 999; z-index: 4; pointer-events: none;
  }

  .ld-gallery-dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 4; pointer-events: none; }
  .ld-gallery-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.5); transition: all .2s; }
  .ld-gallery-dot.active { background: #fff; width: 18px; border-radius: 3px; }

  .ld-thumbs { display: flex; gap: 6px; padding: 10px 12px; background: #fafafa; border-top: 1px solid #f0f0f0; overflow-x: auto; scrollbar-width: none; }
  .ld-thumbs::-webkit-scrollbar { display: none; }
  .ld-thumb { width: 72px; height: 54px; border-radius: 6px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 2px solid transparent; transition: all .18s; opacity: .65; }
  .ld-thumb.active { border-color: #e8410a; opacity: 1; }
  .ld-thumb:hover { opacity: .9; }
  .ld-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; image-rendering: -webkit-optimize-contrast; }

  /* INFO GRID */
  .ld-info-block { background: #fff; border: 1px solid #e6e6e6; border-radius: 14px; padding: 16px; }
  .ld-info-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ececec; border-radius: 12px; overflow: hidden; background: #fff; }
  .ld-info-row { background: #fff; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid #ececec; border-bottom: 1px solid #ececec; }
  .ld-info-row:nth-child(2n) { border-right: none; }
  .ld-info-row:nth-last-child(-n+2) { border-bottom: none; }
  .ld-info-key { font-size: 11px; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }
  .ld-info-val { font-size: 14px; color: #111; font-weight: 600; }

  /* BADGES (внутри hero) */
  .ld-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600; padding: 6px 12px; border-radius: 8px; }
  .ld-badge-green { background: #f0fdf4; color: #16a34a; }
  .ld-badge-orange { background: #fff7ed; color: #ea580c; }
  .ld-badge-blue { background: #eff6ff; color: #2563eb; }

  /* DESCRIPTION */
  .ld-desc-block { background: #fff; border: 1px solid #e6e6e6; border-radius: 14px; padding: 20px 24px; }
  .ld-desc-head { font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #111; }
  .ld-desc-text { font-size: 14px; color: #555; line-height: 1.8; margin: 0; white-space: pre-wrap; word-break: break-word; }
  .ld-desc-toggle { background: none; border: none; color: #e8410a; font-size: 13px; font-weight: 600; cursor: pointer; padding: 10px 0 0; font-family: inherit; transition: opacity .15s; }
  .ld-desc-toggle:hover { opacity: .75; }
  .ld-empty-desc { font-size: 14px; color: #ccc; font-style: italic; }
  .ld-meta-line { font-size: 12px; color: #c0c0c0; margin-top: 14px; display: flex; gap: 14px; flex-wrap: wrap; }

  /* RIGHT COLUMN */
  .ld-right { position: sticky; top: 72px; display: flex; flex-direction: column; gap: 12px; }

  /* PRICE PANEL — как блок «Стоимость» на заявке FindWork */
  .ld-price-panel { background: #fff; border-radius: 12px; border: none; padding: 20px; box-shadow: none; }
  .ld-price-label { font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .ld-price-head { margin-bottom: 14px; }
  .ld-price-big { font-size: 28px; font-weight: 900; color: #111827; letter-spacing: -0.5px; line-height: 1.15; }
  .ld-price-sub { font-size: 13px; color: #9ca3af; margin-top: 4px; font-weight: 500; }
  .ld-price-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 0; }

  /* КНОПКА: НАПИСАТЬ */
  button.ld-btn-msg { border: none; font-family: inherit; }
  .ld-btn-msg {
    background: #e8410a;
    border: none; border-radius: 8px;
    color: #fff; font-size: 15px; font-weight: 700;
    padding: 14px 18px; cursor: pointer;
    font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    text-decoration: none;
    letter-spacing: .01em;
    box-shadow: 0 3px 14px rgba(232,65,10,.30);
    transition: background .15s, transform .15s, box-shadow .15s;
  }
  .ld-btn-msg:hover { background: #d03a09; transform: translateY(-1px); box-shadow: 0 5px 18px rgba(232,65,10,.36); }
  .ld-btn-msg:active { transform: translateY(0); }

  /* вторичная: «Написать …» — серая обводка, как «Написать сообщение» на заявке */
  .ld-btn-contact {
    display: flex; align-items: center; justify-content: center;
    width: 100%;
    padding: 13px 18px;
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    color: #374151;
    font-size: 15px;
    font-weight: 600;
    font-family: inherit;
    text-decoration: none;
    box-sizing: border-box;
    cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .ld-btn-contact:hover { border-color: #374151; background: #fafafa; }

  /* КНОПКА: ПРИНЯТЬ (контур — для мастера на своём объявлении и т.п.) */
  .ld-btn-accept {
    background: #fff;
    border: 1.5px solid #e8410a; border-radius: 10px;
    color: #e8410a; font-size: 15px; font-weight: 700;
    padding: 13px 18px; cursor: pointer;
    font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    letter-spacing: .01em;
    transition: background .15s, transform .15s;
  }
  .ld-btn-accept:hover { background: #fff4f1; transform: translateY(-1px); }
  .ld-btn-accept:active { transform: translateY(0); }
  .ld-btn-accept:disabled { opacity: .5; cursor: not-allowed; }

  /* BANNERS */
  .ld-success-banner { background: linear-gradient(135deg,#f0fdf4,#dcfce7); border: 1px solid #86efac; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #15803d; font-weight: 600; display: flex; gap: 8px; align-items: center; }
  .ld-pending-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 14px; font-size: 12.5px; color: #92400e; line-height: 1.55; }
  .ld-error-msg { font-size: 12px; color: #ef4444; font-weight: 600; padding: 2px 0; }
  .ld-deals-link { display: block; text-align: center; font-size: 13px; color: #e8410a; font-weight: 600; background: none; border: none; cursor: pointer; font-family: inherit; padding: 2px 0; transition: opacity .15s; }
  .ld-deals-link:hover { opacity: .75; }

  /* Карточка мастера — как «Заказчик» на заявке */
  .ld-fw-person-card { background: #fff; border-radius: 12px; padding: 16px 20px; border: none; box-shadow: none; }
  .ld-fw-person-label { font-size: 13px; color: #9ca3af; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .5px; }
  .ld-fw-person-link { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
  .ld-fw-person-link:hover .ld-fw-person-name { color: #e8410a; }
  .ld-fw-person-chevron { color: #9ca3af; font-size: 18px; flex-shrink: 0; }
  .ld-fw-person-ava {
    width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
    object-fit: cover; border: 2px solid #f3f4f6;
  }
  .ld-fw-person-ava-fallback {
    width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg,#e8410a,#ff7043);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 18px;
  }

  /* SELLER / профиль — мастер в «Мои объявления»: компактная карточка */
  .ld-seller { background: #fff; overflow: hidden; }
  .ld-profile-card {
    background: #fff; border-radius: 12px; border: 1px solid #e8e8e8;
    padding: 16px 20px; box-shadow: 0 2px 12px rgba(0,0,0,.04);
  }
  .ld-profile-card .ld-own-profile-label { padding: 0 0 10px; }
  .ld-profile-card .ld-own-profile-top { padding: 0; gap: 12px; align-items: center; }
  .ld-profile-card .ld-own-profile-footer {
    border-top: 1px solid #f4f4f4; padding: 12px 0 0; margin-top: 12px;
  }
  .ld-profile-card .ld-seller-ava {
    width: 44px; height: 44px; font-size: 16px;
    box-shadow: none;
  }
  .ld-seller-top { padding: 18px 18px 14px; display: flex; align-items: flex-start; gap: 14px; }
  .ld-seller-ava { width: 54px; height: 54px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg,#e8410a,#ff8c55); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 800; box-shadow: 0 4px 12px rgba(232,65,10,.25); }
  .ld-seller-ava img { width: 100%; height: 100%; object-fit: cover; }
  .ld-seller-name { font-size: 15px; font-weight: 700; margin: 0 0 3px; color: #111; }
  .ld-seller-name a { color: inherit; text-decoration: none; }
  .ld-seller-name a:hover { color: #e8410a; }
  .ld-seller-footer { border-top: 1px solid #f4f4f4; padding: 12px 18px; }
  .ld-seller-link { font-size: 13px; color: #e8410a; font-weight: 600; text-decoration: none; display: block; text-align: center; transition: opacity .15s; }
  .ld-seller-link:hover { opacity: .75; }

  .ld-own-profile-label {
    font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px;
    padding: 18px 18px 0; display: block;
  }
  .ld-own-profile-top { padding: 14px 18px 14px; display: flex; align-items: flex-start; gap: 14px; }
  .ld-own-profile-footer { border-top: 1px solid #f4f4f4; padding: 12px 18px; }

  /* SIMILAR */
  .ld-similar { background: #fff; padding: 16px 18px; }
  .ld-similar-head { font-size: 14px; font-weight: 700; margin: 0 0 12px; color: #111; display: flex; align-items: center; justify-content: space-between; }
  .ld-similar-head a { font-size: 12px; color: #e8410a; text-decoration: none; font-weight: 600; }
  .ld-similar-list { display: flex; flex-direction: column; gap: 2px; }
  .ld-sim-item { display: flex; gap: 12px; text-decoration: none; color: #111; align-items: center; padding: 8px 8px; border-radius: 10px; transition: background .15s; }
  .ld-sim-item:hover { background: #f7f7f7; }
  .ld-sim-img { width: 58px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .ld-sim-img img { width: 100%; height: 100%; object-fit: cover; }
  .ld-sim-title { font-size: 13px; font-weight: 500; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; color: #333; }
  .ld-sim-price { font-size: 13px; font-weight: 700; color: #111; margin-top: 2px; }

  /* SKELETON */
  .ld-skel { background: linear-gradient(90deg,#f4f4f4 25%,#eaeaea 50%,#f4f4f4 75%); background-size: 200% 100%; animation: ld-shimmer 1.2s infinite; border-radius: 12px; }
  @keyframes ld-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* LIGHTBOX */
  .ld-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.95); z-index: 9999; display: flex; align-items: center; justify-content: center; }
  .ld-lightbox-img-wrap { position: relative; max-width: 92vw; max-height: 92vh; display: flex; align-items: center; justify-content: center; }
  .ld-lightbox img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 6px; display: block; image-rendering: -webkit-optimize-contrast; box-shadow: 0 24px 80px rgba(0,0,0,.6); }

  /* зоны клика в лайтбоксе */
  .ld-lb-zone { position: absolute; top: 0; bottom: 0; width: 50%; cursor: pointer; z-index: 2; }
  .ld-lb-zone-prev { left: -60px; width: calc(50% + 60px); }
  .ld-lb-zone-next { right: -60px; width: calc(50% + 60px); }

  /* кнопки лайтбокса */
  .ld-lb-close { position: fixed; top: 20px; right: 20px; background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.2); border-radius: 10px; width: 42px; height: 42px; color: #fff; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; z-index: 10; font-weight: 300; }
  .ld-lb-close:hover { background: rgba(255,255,255,.2); }
  .ld-lb-nav { position: fixed; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.1); border: 1.5px solid rgba(255,255,255,.18); border-radius: 50%; width: 52px; height: 52px; color: #fff; font-size: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, transform .15s; z-index: 10; line-height: 1; }
  .ld-lb-nav:hover { background: rgba(255,255,255,.2); transform: translateY(-50%) scale(1.06); }
  .ld-lb-prev { left: 20px; }
  .ld-lb-next { right: 20px; }
  .ld-lb-counter { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.7); font-size: 14px; font-weight: 600; background: rgba(255,255,255,.1); padding: 5px 16px; border-radius: 20px; z-index: 10; }
  .ld-lb-hint { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,.35); font-size: 12px; white-space: nowrap; pointer-events: none; }

  @media(max-width:900px) { .ld-page { grid-template-columns: 1fr; } .ld-right { position: static; } .ld-info-grid { grid-template-columns: 1fr; } .ld-info-row { border-right: none; } .ld-info-row:nth-last-child(-n+2) { border-bottom: 1px solid #ececec; } .ld-info-row:last-child { border-bottom: none; } }
  @media(max-width:580px) { .ld-page { padding: 12px 12px 48px; } .ld-fw-title { font-size: 18px; } .ld-price-big { font-size: 26px; } }
  @media(max-width:768px) {
    .ld-bread-inner {
      padding: 10px max(12px, env(safe-area-inset-left)) 10px max(12px, env(safe-area-inset-right));
    }
    .ld-page {
      padding: 14px max(12px, env(safe-area-inset-left)) 44px max(12px, env(safe-area-inset-right));
      gap: 14px;
    }
    .ld-gallery-main { aspect-ratio: 4/3; }
    .ld-price-btns .ld-btn-msg,
    .ld-price-btns .ld-btn-contact,
    .ld-price-btns .ld-deals-link {
      width: 100%;
      justify-content: center;
      min-height: 46px;
      box-sizing: border-box;
      text-align: center;
    }
  }
`;

const TERMINAL_DEAL_STATUSES = ['CANCELLED', 'REFUNDED'];

export default function ListingDetailPage() {
  const { id } = useParams();
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [listingDeal, setListingDeal] = useState(null);
  const [stats, setStats] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [accepting, setAccepting] = useState(false);
  /** Сделка заказчика по этому объявлению (с бэка — сохраняется после обновления страницы) */
  const [customerListingDeal, setCustomerListingDeal] = useState(null);
  const [actionError, setActionError] = useState('');
  const [workerAccepting, setWorkerAccepting] = useState(false);
  const [workerDealError, setWorkerDealError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/listings/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setListing(data);
        setActivePhoto(0);
        if (
          data.id &&
          String(data.workerId || '') !== String(userId || '') &&
          !listingViewPostedIds.has(data.id)
        ) {
          listingViewPostedIds.add(data.id);
          recordListingView(data.id).catch(() => {});
        }
        if (data.workerId) {
          fetch(`${API}/workers/${data.workerId}/stats`)
            .then(r => r.ok ? r.json() : null)
            .then(s => setStats(s)).catch(() => {});
        }
        fetch(`${API}/listings`)
          .then(r => r.ok ? r.json() : [])
          .then(all => {
            setSimilar((Array.isArray(all) ? all : [])
              .filter(l => l.active && l.id !== data.id && l.category === data.category)
              .slice(0, 4));
          }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, userId]);

  /** Восстановить сделку заказчика по этому listing после F5 */
  useEffect(() => {
    if (!listing?.id || !userId || String(userId) === String(listing.workerId)) {
      setCustomerListingDeal(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const deals = await getMyDeals(userId);
        if (cancelled) return;
        const lid = String(listing.id);
        const uid = String(userId);
        const match = (deals || []).find(
          d => String(d.listingId || '') === lid && String(d.customerId || '') === uid,
        );
        if (!match || TERMINAL_DEAL_STATUSES.includes(String(match.status || ''))) {
          setCustomerListingDeal(null);
        } else {
          setCustomerListingDeal(match);
        }
      } catch {
        if (!cancelled) setCustomerListingDeal(null);
      }
    })();
    return () => { cancelled = true; };
  }, [listing?.id, listing?.workerId, userId]);

  /* Сделка по этому объявлению — показываем заказчика в сайдбаре (как на странице «Мои сделки») */
  useEffect(() => {
    if (!listing || !userId || String(userId) !== String(listing.workerId)) {
      setListingDeal(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyDeals(userId);
        if (cancelled) return;
        const lid = String(listing.id);
        const wid = String(userId);
        const matches = (data || []).filter(
          d => String(d.workerId || '') === wid
            && String(d.listingId || '') === lid
            && !TERMINAL_DEAL_STATUSES.includes(d.status || ''),
        );
        matches.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setListingDeal(matches[0] || null);
      } catch {
        if (!cancelled) setListingDeal(null);
      }
    })();
    return () => { cancelled = true; };
  }, [listing, userId]);

  const photos = listing?.photos?.length ? listing.photos : [];
  const fallbackPhoto = getCategoryPlaceholderPhotoUrlOrDefault({ category: listing?.category });
  const allPhotos = photos.length ? photos : [fallbackPhoto];
  const catSlug = getCategorySlugFromLabel(listing?.category);

  const nextPhoto = useCallback(() => setActivePhoto(i => (allPhotos.length > 1 ? (i + 1) % allPhotos.length : i)), [allPhotos.length]);
  const prevPhoto = useCallback(() => setActivePhoto(i => (allPhotos.length > 1 ? (i - 1 + allPhotos.length) % allPhotos.length : i)), [allPhotos.length]);

  useEffect(() => {
    if (allPhotos.length <= 1) return;
    const onKey = e => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, allPhotos.length, nextPhoto, prevPhoto]);

  const handleAcceptWork = async () => {
    if (!userId) { navigate('/login'); return; }
    setActionError('');
    setAccepting(true);
    try {
      await acceptListingDeal(userId, listing.id);
      const deals = await getMyDeals(userId);
      const lid = String(listing.id);
      const uid = String(userId);
      const match = (deals || []).find(
        d => String(d.listingId || '') === lid && String(d.customerId || '') === uid,
      );
      if (match && !TERMINAL_DEAL_STATUSES.includes(String(match.status || ''))) {
        setCustomerListingDeal(match);
      } else {
        setCustomerListingDeal(null);
      }
    } catch (e) {
      setActionError(e?.message || 'Не удалось принять работу. Попробуйте ещё раз.');
    } finally {
      setAccepting(false);
    }
  };

  const reloadListingDealForWorker = async () => {
    if (!listing?.id || !userId) return;
    const data = await getMyDeals(userId);
    const lid = String(listing.id);
    const wid = String(userId);
    const matches = (data || []).filter(
      d => String(d.workerId || '') === wid
        && String(d.listingId || '') === lid
        && !TERMINAL_DEAL_STATUSES.includes(String(d.status || '')),
    );
    matches.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setListingDeal(matches[0] || null);
  };

  const handleWorkerAcceptOnListing = async () => {
    if (!userId || !listingDeal?.id) { navigate('/login'); return; }
    setWorkerDealError('');
    setWorkerAccepting(true);
    try {
      await workerStartDeal(userId, listingDeal.id);
      await reloadListingDealForWorker();
    } catch (e) {
      setWorkerDealError(e?.message || 'Не удалось принять заказ. Попробуйте ещё раз.');
    } finally {
      setWorkerAccepting(false);
    }
  };

  if (loading) return (
    <div className="ld"><style>{css}</style>
      <div className="ld-page">
        <div>
          <div className="ld-skel" style={{height:40,marginBottom:8}}/>
          <div className="ld-skel" style={{height:360,marginBottom:8,borderRadius:8}}/>
          <div className="ld-skel" style={{height:160,borderRadius:8}}/>
        </div>
        <div><div className="ld-skel" style={{height:320,borderRadius:8}}/></div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="ld"><style>{css}</style>
      <div style={{textAlign:'center',padding:'80px 24px'}}>
        <div style={{fontSize:48,marginBottom:16}}>😕</div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Объявление не найдено</h2>
        <Link to="/find-master" style={{color:'#e8410a',fontWeight:600}}>← Вернуться к поиску</Link>
      </div>
    </div>
  );

  const workerName = [listing.workerName, listing.workerLastName].filter(Boolean).join(' ') || 'Мастер';
  const initials = (listing.workerName || 'М')[0].toUpperCase();
  const workerRating = Number(stats?.averageRating ?? listing.workerRating ?? 0);
  const workerReviews = Number(stats?.reviewsCount ?? stats?.reviewCount ?? 0);
  const workerStars = Math.min(5, Math.max(0, Math.round(workerRating)));
  const isOwnListing = String(userId) === String(listing.workerId);
  const ownerFullName = [userName, userLastName].filter(Boolean).join(' ') || 'Мастер';
  const ownerAva = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : `${API.replace(/\/api\/v1$/, '')}${userAvatar.startsWith('/') ? '' : '/'}${userAvatar}`)
    : null;

  const priceNum = getListingPublishedPriceNumber(listing);
  const priceHasAmount = priceNum != null;
  const priceMainLine = priceHasAmount
    ? `${priceNum.toLocaleString('ru-RU')} ₽`
    : (listing.priceUnit || 'Договорная');
  const priceSubLine = priceHasAmount
    ? (listing.priceUnit && String(listing.priceUnit).trim() ? listing.priceUnit : 'за работу')
    : null;

  return (
    <div className="ld">
      <style>{css}</style>
      {listingDeal ? <style>{dealsWdCss}</style> : null}

      {/* Lightbox */}
      {lightbox && allPhotos.length > 0 && (
        <div className="ld-lightbox">
          <button className="ld-lb-close" onClick={() => setLightbox(false)}>✕</button>

          {allPhotos.length > 1 && <>
            <button className="ld-lb-nav ld-lb-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}>‹</button>
            <button className="ld-lb-nav ld-lb-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}>›</button>
          </>}

          <div className="ld-lightbox-img-wrap">
            {/* Зоны клика по половинам */}
            {allPhotos.length > 1 && <>
              <div className="ld-lb-zone ld-lb-zone-prev" onClick={prevPhoto}/>
              <div className="ld-lb-zone ld-lb-zone-next" onClick={nextPhoto}/>
            </>}
            <img
              src={allPhotos[activePhoto]}
              alt={listing?.title || ''}
              onClick={() => allPhotos.length <= 1 && setLightbox(false)}
            />
          </div>

          {allPhotos.length > 1 && <div className="ld-lb-counter">{activePhoto + 1} / {allPhotos.length}</div>}
          <div className="ld-lb-hint">← → клавиши или клик по краям · Esc — закрыть</div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="ld-bread">
        <div className="ld-bread-inner">
          <button
            type="button"
            className="ld-back-btn"
            onClick={() => navigate(catSlug ? `/find-master/${catSlug}` : '/find-master')}
            aria-label="Назад"
          >
            <span className="ld-back-ico" aria-hidden>←</span>
            Назад
          </button>
          <span className="ld-bread-sep" style={{ color: '#e5e5e5' }}>|</span>
          <Link to="/">Главная</Link>
          <span className="ld-bread-sep">›</span>
          <Link to="/find-master">Мастера</Link>
          {listing.category && <>
            <span className="ld-bread-sep">›</span>
            <Link to={`/find-master/${catSlug}`}>{listing.category}</Link>
          </>}
          <span className="ld-bread-sep">›</span>
          <span style={{color:'#555',fontWeight:500}}>{listing.title?.slice(0,35)}{listing.title?.length > 35 ? '…' : ''}</span>
        </div>
      </div>

      <div className="ld-page">
        {/* ── LEFT ── */}
        <div className="ld-left">

          <div className="ld-fw-head">
            <div className="ld-fw-title-row">
              <h1 className="ld-fw-title">{listing.title}</h1>
              <div className="ld-actions-row">
                <button type="button" className="ld-action-btn">♡ В избранное</button>
              </div>
            </div>
            <div className="ld-fw-meta">
              {listing.category && (
                <span className={`ml-row-cat ${categoryChipToneClass(listing.category)}`}>{listing.category}</span>
              )}
              <span>📍 {listing.address || 'Йошкар-Ола · выезд по договорённости'}</span>
              {listing.createdAt && (
                <span>
                  📅 {new Date(listing.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <div className="ld-fw-gallery-card">
            <div className="ld-gallery-wrap">
              <div className="ld-gallery-main" onClick={() => allPhotos.length && setLightbox(true)}>
                <img src={allPhotos[activePhoto]} alt={listing.title} key={activePhoto}/>

                {allPhotos.length > 1 && <>
                  <button type="button" className="ld-gallery-nav-btn prev" onClick={e => { e.stopPropagation(); prevPhoto(); }} aria-label="Предыдущее фото">‹</button>
                  <button type="button" className="ld-gallery-nav-btn next" onClick={e => { e.stopPropagation(); nextPhoto(); }} aria-label="Следующее фото">›</button>
                </>}

                {allPhotos.length > 0 && (
                  <div className="ld-gallery-zoom" onClick={e => { e.stopPropagation(); setLightbox(true); }} title="Открыть полноэкранно" role="button">⤢</div>
                )}

                {allPhotos.length > 1 && allPhotos.length <= 8 && (
                  <div className="ld-gallery-dots">
                    {allPhotos.map((_, i) => (
                      <div key={i} className={`ld-gallery-dot${i === activePhoto ? ' active' : ''}`}/>
                    ))}
                  </div>
                )}

                {allPhotos.length > 8 && (
                  <div className="ld-gallery-count">{activePhoto + 1} / {allPhotos.length}</div>
                )}
              </div>

              {allPhotos.length > 1 && (
                <div className="ld-thumbs">
                  {allPhotos.map((p, i) => (
                    <div key={i} className={`ld-thumb${i === activePhoto ? ' active' : ''}`} onClick={() => setActivePhoto(i)}>
                      <img src={p} alt=""/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ListingInfoPanels
            variant="jobDetail"
            mergedSections={false}
            budgetDtLabel="Стоимость"
            description={listing.description}
            category={listing.category}
            address={listing.address || 'Йошкар-Ола · выезд по договорённости'}
            budgetLabel={
              priceHasAmount
                ? `${priceNum.toLocaleString('ru-RU')} ₽${listing.priceUnit ? ` ${listing.priceUnit}` : ''}`
                : (listing.priceUnit || 'Договорная')
            }
            publishedAt={listing.createdAt}
          />
        </div>

        {/* ── RIGHT ── */}
        <div className="ld-right">

          {/* Price + CTA */}
          <div className="ld-price-panel">
            <div className="ld-price-head">
              <div className="ld-price-label">Стоимость</div>
              <div className="ld-price-big">{priceMainLine}</div>
              {(priceSubLine || (!priceHasAmount && listing.priceUnit)) && (
                <div className="ld-price-sub">{priceSubLine || listing.priceUnit}</div>
              )}
            </div>

            {!isOwnListing && (
              <div className="ld-price-btns">
                {customerListingDeal && !TERMINAL_DEAL_STATUSES.includes(String(customerListingDeal.status || '')) ? (
                  <>
                    {customerListingDeal.status === 'NEW' && (
                      <>
                        <div className="ld-success-banner">
                          🕐 Заявка отправлена мастеру
                        </div>
                        <div className="ld-pending-banner">
                          ℹ️ Сделка создана и ждёт подтверждения мастера. Как только мастер примет — она станет активной. Вы можете следить за статусом в разделе «Мои сделки».
                        </div>
                      </>
                    )}
                    {customerListingDeal.status === 'IN_PROGRESS' && (
                      <>
                        <div className="ld-success-banner">
                          ✓ Мастер принял заказ — сделка в работе
                        </div>
                        <div className="ld-pending-banner">
                          ℹ️ Обсуждайте детали в чате и отслеживайте этапы в «Мои сделки».
                        </div>
                      </>
                    )}
                    {customerListingDeal.status === 'COMPLETED' && (
                      <div className="ld-success-banner">
                        ✓ Сделка по этому объявлению завершена
                      </div>
                    )}
                    <Link
                      to={userId ? `/chat/${listing.workerId}` : '/login'}
                      className="ld-btn-contact"
                    >
                      Написать сообщение
                    </Link>
                    <button className="ld-deals-link" type="button" onClick={() => navigate('/deals')}>
                      Перейти к сделкам →
                    </button>
                  </>
                ) : (
                  <>
                    <button className="ld-btn-msg" type="button" onClick={handleAcceptWork} disabled={accepting}>
                      {accepting ? 'Отправляем…' : 'Принять'}
                    </button>
                    <Link
                      to={userId ? `/chat/${listing.workerId}` : '/login'}
                      className="ld-btn-contact"
                    >
                      Написать сообщение
                    </Link>
                  </>
                )}

                {actionError && <div className="ld-error-msg">{actionError}</div>}
              </div>
            )}
          </div>

          {/* Заказчик по активной/завершённой сделке — как в WorkerDealsPage */}
          {isOwnListing && listingDeal?.customerId && (
            <div className="wd-customer-card">
              <div className="wd-info-label">Заказчик</div>
              <div
                className="wd-customer-row"
                onClick={() => listingDeal.customerId && navigate(`/customers/${listingDeal.customerId}`)}
                role="presentation"
              >
                {listingDeal.customerAvatar && listingDeal.customerAvatar.length > 10 && listingDeal.customerAvatar !== 'null'
                  ? <img src={listingDeal.customerAvatar} alt="" className="wd-customer-avatar" />
                  : <div className="wd-customer-fallback">{(listingDeal.customerName || 'З')[0].toUpperCase()}</div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {[listingDeal.customerName, listingDeal.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                  </div>
                  {listingDeal.status === 'NEW' && (
                    <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>● Ожидает вашего подтверждения</div>
                  )}
                  {listingDeal.status === 'IN_PROGRESS' && (
                    <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>● Сделка в работе</div>
                  )}
                  {listingDeal.status === 'COMPLETED' && (
                    <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>● Сделка завершена</div>
                  )}
                </div>
                <div style={{ color: '#d1d5db', fontSize: 20 }}>›</div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/chat/${listingDeal.customerId}`)}
                className="wd-btn-full-outline"
                style={{ marginTop: 12 }}
              >
                Написать заказчику
              </button>
              {listingDeal.status === 'NEW' && (
                <button
                  type="button"
                  className="ld-btn-accept"
                  style={{ marginTop: 10, width: '100%' }}
                  onClick={handleWorkerAcceptOnListing}
                  disabled={workerAccepting}
                >
                  {workerAccepting ? 'Отправляем…' : 'Принять'}
                </button>
              )}
              {listingDeal.status === 'IN_PROGRESS' && (
                <div className="ld-success-banner" style={{ marginTop: 12 }}>
                  ✓ Вы приняли заказ — сделка активна
                </div>
              )}
              {workerDealError && <div className="ld-error-msg" style={{ marginTop: 8 }}>{workerDealError}</div>}
              <button
                type="button"
                className="ld-deals-link"
                style={{ marginTop: 10 }}
                onClick={() => navigate(`/deals?dealId=${listingDeal.id}`)}
              >
                Открыть сделку →
              </button>
            </div>
          )}

          {/* Мастер / ваш профиль */}
          {isOwnListing ? (
            <div className="ld-seller">
              <div className="ld-own-profile-label">Ваш профиль</div>
              <div className="ld-own-profile-top">
                <div className="ld-seller-ava">
                  {ownerAva
                    ? <img src={ownerAva} alt={ownerFullName} />
                    : (userName || 'М')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ld-seller-name"><span>{ownerFullName}</span></div>
                  <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>● Мастер</div>
                </div>
              </div>
              <div className="ld-own-profile-footer">
                <Link to="/worker-profile" className="ld-seller-link">
                  Редактировать профиль →
                </Link>
              </div>
            </div>
          ) : (
            <div className="ld-fw-person-card">
              <div className="ld-fw-person-label">Мастер</div>
              <Link to={`/workers/${listing.workerId}`} className="ld-fw-person-link">
                {listing.workerAvatar?.length > 10 ? (
                  <img src={listing.workerAvatar} alt="" className="ld-fw-person-ava" />
                ) : (
                  <div className="ld-fw-person-ava-fallback">{initials}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ld-fw-person-name" style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {workerName}
                  </div>
                  <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>● Активный мастер</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: '#f59e0b', letterSpacing: 1 }}>{'★'.repeat(workerStars)}{'☆'.repeat(5 - workerStars)}</span>
                    <span style={{ fontWeight: 800, color: '#111827' }}>{workerRating.toFixed(1)}</span>
                    <span>({reviewsCountLabel(workerReviews)})</span>
                  </div>
                </div>
                <div className="ld-fw-person-chevron">›</div>
              </Link>
            </div>
          )}

          {/* Similar */}
          {similar.length > 0 && (
            <div className="ld-similar">
              <div className="ld-similar-head">
                Похожие объявления
                <Link to={`/find-master/${catSlug}`}>Все →</Link>
              </div>
              <div className="ld-similar-list">
                {similar.map(s => {
                  const sPhoto =
                    s.photos?.[0] || getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category });
                  return (
                    <Link key={s.id} to={`/listings/${s.id}`} className="ld-sim-item">
                      <div className="ld-sim-img">
                        <img src={sPhoto} alt=""/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="ld-sim-title">{s.title}</div>
                        <div className="ld-sim-price">
                          {(() => {
                            const sp = getListingPublishedPriceNumber(s);
                            return sp ? `${sp.toLocaleString('ru-RU')} ₽` : '—';
                          })()}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
