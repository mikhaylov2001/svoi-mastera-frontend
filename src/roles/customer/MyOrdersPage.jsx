import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';
import { SECTIONS } from '../../pages/SectionsPage';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import {
  getMyJobRequests, getOffersForRequest, acceptOffer,
  getCategories, createJobRequest, updateJobRequest,
  getMyDeals,
  cancelJobRequest,
} from '../../api';
import { humanizeServerErrorMessage } from '../../utils/humanizeServerError';
import { PAGE_HERO_DEFAULT_PHOTO } from '../../constants/pageHeroAssets';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { formatListingOriginDescription } from '../../utils/listingOriginDescription';
import { edListingDetailMergedCss, dealCategoryEmoji } from '../shared/dealsWdStyles';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import {
  getJobRequestPublishedBudgetNumber,
  JOB_REQUEST_PRICE_MISSING_LABEL,
} from '../../utils/jobRequestBudget';
import { getJobRequestViewsCount } from '../../utils/jobRequestViews';
import {
  mergeApiCategoriesWithCatalog,
  normalizeCategoriesApiResponse,
  pickCategoryId,
  resolveCatalogCategoryRow,
} from '../../utils/mergeApiCategoriesWithCatalog';
import '../worker/listings-new.css';
import { moOrdersListShellCss } from '../../styles/moOrdersListShellCss.js';

const CATEGORY_PHOTO_BY_NAME = {};
Object.values(CATEGORIES_BY_SECTION).forEach(cats => {
  cats.forEach(c => { CATEGORY_PHOTO_BY_NAME[c.name] = c.photo; });
});

const DEFAULT_BG = PAGE_HERO_DEFAULT_PHOTO;

/** Hero страницы «Мои заявки»: кухня / пара с инструментами (как в макете Lovable). */
const MY_ORDERS_HERO_PHOTO =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=max&w=2400&q=86';

const MAX_ORDER_TITLE = 80;

const CATEGORY_EMOJI = {
  'Ремонт квартир': '🔨',
  'Сантехника': '🔧',
  'Электрика': '⚡',
  'Компьютерная помощь': '💻',
  'Уборка': '🧹',
  'Парикмахер': '✂️',
  'Маникюр и педикюр': '💅',
  'Красота и здоровье': '✨',
  'Репетиторство': '📚',
  'Грузоперевозки': '🚚',
  'Сварочные работы': '🔥',
  'Другое': '📌',
};

function categoryEmoji(name) {
  if (!name) return '📌';
  return CATEGORY_EMOJI[name] || '📌';
}

function photoForCategoryName(name) {
  if (!name || !String(name).trim()) return DEFAULT_BG;
  const n = String(name).trim();
  return CATEGORY_PHOTO_BY_NAME[n] || DEFAULT_BG;
}

function workerOfferAvatarSrc(offer, backendOrigin) {
  const u = offer?.workerAvatarUrl;
  if (!u) return null;
  if (u.startsWith('data:') || u.startsWith('http')) return u;
  return backendOrigin + u;
}

/** Публичный профиль мастера: API /workers/{userId} */
function workerOfferPublicPath(offer) {
  const id = offer?.workerUserId || offer?.workerId;
  return id ? `/workers/${id}` : null;
}

function workerOfferFullName(offer) {
  if (!offer) return 'Мастер';
  const last = (offer.workerLastName || '').trim();
  const first = (offer.workerName || '').trim();
  if (last) return `${first} ${last}`.trim();
  return first || 'Мастер';
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

const EMPTY_FORM = {
  title: '',
  description: '',
  budget: '',
  address: '',
  city: '',
  categoryId: '',
  /** Различает карточки с одним categoryId на бэке (напр. сантехника → remont-kvartir). */
  categorySlug: '',
  photos: [],
};

function normCatName(s) {
  return String(s || '').trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
}

function categoryFormSelectValue(categoryId, categorySlug) {
  if (!categoryId) return '';
  const s = String(categorySlug || '').trim();
  return s ? `${categoryId}|${s}` : String(categoryId);
}

function parseCategoryFormSelectValue(raw) {
  const v = String(raw || '');
  const i = v.indexOf('|');
  if (i <= 0) return { categoryId: v, categorySlug: '' };
  return { categoryId: v.slice(0, i), categorySlug: v.slice(i + 1) };
}

/** Бэкенд не хранит/не отдаёт categorySlug — помним slug каталога в localStorage (по userId + id заявки). */
const LS_JOB_REQ_CAT_SLUG = 'sm_v1_job_req_cat_slug';

function localCatSlugKey(userId) {
  return `${LS_JOB_REQ_CAT_SLUG}_${String(userId || '')}`;
}

function readLocalJobRequestCatSlugs(userId) {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const raw = window.localStorage.getItem(localCatSlugKey(userId));
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

function writeLocalJobRequestCatSlugs(userId, map) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(localCatSlugKey(userId), JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function setLocalJobRequestCategorySlug(userId, requestId, slug) {
  const rid = String(requestId || '');
  if (!userId || !rid) return;
  const map = { ...readLocalJobRequestCatSlugs(userId) };
  const s = String(slug || '').trim();
  if (s) map[rid] = s;
  else delete map[rid];
  writeLocalJobRequestCatSlugs(userId, map);
}

function pruneLocalJobRequestCatSlugs(userId, requestIds) {
  if (!userId) return;
  const keep = new Set((requestIds || []).map((id) => String(id)));
  const map = readLocalJobRequestCatSlugs(userId);
  const next = {};
  for (const [k, v] of Object.entries(map)) {
    if (keep.has(k) && v) next[k] = v;
  }
  writeLocalJobRequestCatSlugs(userId, next);
}

function mergeLocalCatSlugsIntoRequests(userId, requests) {
  if (!userId || !Array.isArray(requests)) return requests || [];
  const map = readLocalJobRequestCatSlugs(userId);
  if (!Object.keys(map).length) return requests;
  return requests.map((r) => {
    const id = String(r?.id ?? '');
    const local = id && map[id];
    if (!local) return r;
    const hasApi = String(r.categorySlug || r.category_slug || '').trim();
    if (hasApi) return r;
    return { ...r, categorySlug: local };
  });
}

function extractCreatedJobRequestId(created) {
  if (created == null) return null;
  if (typeof created === 'string' || typeof created === 'number') return String(created);
  if (typeof created === 'object') {
    const v = created.id ?? created.jobRequestId ?? created.requestId ?? created.data?.id;
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return null;
}

const MAX_DESC = 2000;

/* ══ CSS: список/карточки — src/styles/unifiedListingCards.css ══ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .ml-page { background: #f5f5f7; min-height: 100vh; font-family: 'Manrope', Inter, system-ui, sans-serif; color: #0f172a; }

  ${moOrdersListShellCss}

  /* .ml-list, .ml-row … — см. src/styles/unifiedListingCards.css */

  .ml-btn-edit {
    width: 100%; box-sizing: border-box; min-height: 40px; padding: 10px 12px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; line-height: 1.25; text-align: center;
    background: #e8410a; border: none; border-radius: 8px; color: #fff;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 3px 14px rgba(232,65,10,.28);
    transition: background .15s, transform .15s, box-shadow .15s;
  }
  .ml-btn-edit:hover { background: #d03a09; transform: translateY(-1px); box-shadow: 0 5px 18px rgba(232,65,10,.34); }
  .ml-btn-edit:active { transform: translateY(0); }
  .ml-btn-copy {
    width: 100%; box-sizing: border-box; min-height: 44px; padding: 12px 14px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 600; line-height: 1.25; text-align: center;
    white-space: nowrap;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; color: #334155;
    cursor: pointer; font-family: inherit; transition: border-color .15s, background .15s;
  }
  .ml-btn-copy:hover { border-color: #cbd5e1; background: #f8fafc; }
  .ml-btn-copy.copied { color: #166534; border-color: #bbf7d0; background: #f0fdf4; }
  .ml-actions-divider { height: 1px; background: #ebebeb; margin: 2px 0; }

  /* .ml-empty, .ml-tag — unifiedListingCards.css */
  .ml-offers-panel {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 16px 16px;
    padding: 16px 18px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
  .ml-offer-card {
    background: #fff;
    padding: 14px 16px;
    margin-bottom: 10px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  }
  .ml-offer-card:last-child { margin-bottom: 0; }
  .ml-offers-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 14px; letter-spacing: -0.02em; }
  .ml-offer-price { font-size: 18px; font-weight: 800; color: #1a1a1a; }
  .ml-offer-days { font-size: 13px; color: #6b7280; margin-left: 6px; }
  .ml-offer-name { font-size: 13px; color: #555; margin-top: 4px; }
  .ml-offer-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .ml-offer-msg { font-size: 13px; color: #555; margin: 10px 0 0; line-height: 1.5; }
  .ml-accept-btn {
    box-sizing: border-box;
    min-height: 44px;
    padding: 12px 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.25;
    background: linear-gradient(135deg, #e8410a, #ff6b3d);
    border: none;
    border-radius: 14px;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(232, 65, 10, 0.28);
    transition: filter 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .ml-accept-btn:hover {
    filter: brightness(1.03);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(232, 65, 10, 0.34);
  }
  .ml-accept-btn:active { transform: translateY(0); }
  .ml-accept-btn:disabled { background: #fca98e; cursor: not-allowed; }

  /* .ml-tag — см. unifiedListingCards.css */
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

  .mlf-lb { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.94); display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .mlf-lb-close { position: fixed; top: 18px; right: 18px; width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .mlf-lb-counter { position: fixed; top: 22px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,.15); color: #fff; font-size: 14px; font-weight: 700; padding: 6px 18px; border-radius: 20px; }
  .mlf-lb-btn { position: fixed; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .mlf-lb-prev { left: 18px; }
  .mlf-lb-next { right: 18px; }

  @keyframes mlsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .ml-sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: mlsk 1.4s infinite; border-radius: 6px; }

  @media(max-width: 860px) {
    .mlf-sec-grid { grid-template-columns: 1fr 1fr; grid-auto-rows: 180px; }
    .mlf-sec-featured, .mlf-sec-5, .mlf-sec-6 { grid-column: span 2; }
    .mlf-sec-featured { grid-row: span 1; }
    .mlf-cat-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media(max-width: 720px) {
    .ml-row-actions { display: none; }
  }
  @media(max-width: 520px) {
    .mlf-sec-grid { grid-template-columns: 1fr; grid-auto-rows: 160px; gap: 8px; }
    .mlf-sec-featured, .mlf-sec-5, .mlf-sec-6 { grid-column: span 1; }
    .mlf-sec-name { font-size: 22px !important; }
    .mlf-cat-grid { grid-template-columns: 1fr; }
  }
`;

const STATUS_LABELS = {
  DRAFT: 'Черновик', OPEN: 'Открыта', IN_NEGOTIATION: 'Обсуждение',
  ASSIGNED: 'Назначена', IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнена', CANCELLED: 'Отменена', EXPIRED: 'Истекла',
};

function jobRequestDetailStatusPill(status) {
  const label = STATUS_LABELS[status] || status || '—';
  if (status === 'OPEN') return { label, dot: '#22c55e', shadow: '0 0 0 3px rgba(34,197,94,.2)' };
  if (status === 'IN_NEGOTIATION') return { label, dot: '#f59e0b', shadow: '0 0 0 3px rgba(245,158,11,.22)' };
  if (status === 'ASSIGNED' || status === 'IN_PROGRESS') return { label, dot: '#3b82f6', shadow: '0 0 0 3px rgba(59,130,246,.22)' };
  if (status === 'COMPLETED') return { label, dot: '#16a34a', shadow: '0 0 0 3px rgba(22,163,74,.18)' };
  if (status === 'CANCELLED' || status === 'EXPIRED') return { label, dot: '#94a3b8', shadow: '0 0 0 3px rgba(148,163,184,.22)' };
  if (status === 'DRAFT') return { label, dot: '#a1a1aa', shadow: '0 0 0 3px rgba(161,161,170,.22)' };
  return { label, dot: '#64748b', shadow: '0 0 0 3px rgba(100,116,139,.2)' };
}

function moDetailFmtDateLong(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function moDetailTimeAgo(d) {
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

function moDetailPhotoUrl(u, backend) {
  const b = backend || 'https://svoi-mastera-backend.onrender.com';
  if (!u) return null;
  if (String(u).startsWith('http') || String(u).startsWith('data:')) return u;
  return b + u;
}

/** Плашка статуса в карточках списка (как mo-status). */
function moCardStatusPillClass(status) {
  if (status === 'OPEN') return 'open';
  if (status === 'IN_NEGOTIATION' || status === 'ASSIGNED') return 'wait';
  if (status === 'IN_PROGRESS') return 'work';
  return 'neutral';
}

function moCardStatusPillLabel(status) {
  if (status === 'OPEN') return 'Открыта';
  if (status === 'IN_NEGOTIATION' || status === 'ASSIGNED') return 'Ждёт мастеров';
  if (status === 'IN_PROGRESS') return 'В работе';
  return STATUS_LABELS[status] || status;
}

function moCatClassFromLabel(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('электр')) return 'elec';
  if (n.includes('сантех')) return 'plumb';
  if (n.includes('красот')) return 'beauty';
  if (n.includes('парикмах') || n.includes('стриж') || n.includes('маникюр')) return 'hair';
  if (n.includes('ремонт') || n.includes('уборк') || n.includes('репетит') || n.includes('компьютер')) return 'repair';
  return 'repair';
}

/** Нормализация полей заявки с бэка (snake_case, вложенный category) для списка и карточек. */
function normalizeCustomerJobRequestFromApi(r) {
  if (!r || typeof r !== 'object') return r;
  const cat = r.category && typeof r.category === 'object' ? r.category : null;
  const viewsRaw =
    r.viewsCount
    ?? r.views_count
    ?? r.views
    ?? r.viewCount
    ?? r.view_count;
  const nestedId = cat ? (pickCategoryId(cat) ?? cat.id ?? cat.categoryId) : null;
  const next = {
    ...r,
    categoryId: r.categoryId ?? r.category_id ?? nestedId,
    categoryName: r.categoryName ?? r.category_name ?? (typeof r.category === 'string' ? r.category : cat?.name),
    categorySlug: r.categorySlug ?? r.category_slug ?? cat?.slug,
  };
  if (viewsRaw != null && viewsRaw !== '') {
    const n = Number(viewsRaw);
    if (Number.isFinite(n) && n >= 0) next.viewsCount = Math.floor(n);
  }
  return next;
}

function formatJobRequestRelativeRu(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startThat = new Date(d);
  startThat.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startToday - startThat) / 86400000);
  if (diffDays === 0) return 'сегодня';
  if (diffDays === 1) return 'вчера';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function cabinetAddressLine(city, address) {
  return [city, address].map((s) => String(s || '').trim()).filter(Boolean).join(', ');
}

function isActiveStatus(s) {
  return ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED', 'IN_PROGRESS'].includes(s);
}

/** Скрыть из «Активных», если по заявке сделка уже COMPLETED, а в заявке ещё старый статус. */
function mergeRequestStatusesFromCustomerDeals(requests, deals, customerUserId) {
  if (!requests?.length || !customerUserId) return requests || [];
  const custDeals = (deals || []).filter((d) => String(d.customerId) === String(customerUserId));
  return requests.map((r) => {
    const completedDeal = custDeals.some(
      (d) => d.status === 'COMPLETED' && String(d.jobRequestId || '') === String(r.id),
    );
    if (completedDeal && r.status !== 'COMPLETED') return { ...r, status: 'COMPLETED' };
    return r;
  });
}

function requestIsEditable(req) {
  return !!(req && req.status === 'OPEN');
}

function requestCanRemove(req) {
  return !!(req && ['OPEN', 'IN_NEGOTIATION', 'ASSIGNED', 'IN_PROGRESS'].includes(req.status));
}

export default function MyOrdersPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate = useNavigate();

  const [requests,       setRequests]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [categoriesRaw,  setCategoriesRaw]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState('active');
  const [listSearch,     setListSearch]     = useState('');
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
  const [removeLoadingId, setRemoveLoadingId] = useState(null);

  const [actionLoading, setActionLoading] = useState(null);
  const [detailOffers, setDetailOffers] = useState([]);
  const [detailOffersLoading, setDetailOffersLoading] = useState(false);
  /** Блок откликов на деталке (OPEN) только после кнопки «Смотреть отклики» */
  const [detailShowOffersPanel, setDetailShowOffersPanel] = useState(false);

  const photoRef = useRef();
  const titleRef = useRef();

  /* ── helpers ── */
  function getCategoryName(catId, categorySlug) {
    const idStr = String(catId ?? '').trim();
    if (!idStr) return '';
    const slugStr = String(categorySlug || '').trim().toLowerCase();
    if (slugStr) {
      const bySlug = categories.find(
        (x) => String(x.slug || '').trim().toLowerCase() === slugStr
          && String(pickCategoryId(x) || x.id) === idStr,
      );
      if (bySlug?.name) return bySlug.name;
      const loose = categories.find((x) => String(x.slug || '').trim().toLowerCase() === slugStr);
      if (loose?.name) return loose.name;
    }
    const c = categories.find((x) => {
      const pid = pickCategoryId(x);
      if (pid != null && String(pid) === idStr) return true;
      if (x.id != null && String(x.id) === idStr) return true;
      return false;
    });
    return c ? c.name : '';
  }

  function getCategoryNameForForm() {
    if (!form.categoryId) return '';
    return getCategoryName(form.categoryId, form.categorySlug);
  }

  /** Подпись в списке/деталке: slug → каталог; имя с бэка; id → merged или сырой /categories. */
  function jobRequestCategoryLabel(req) {
    if (!req) return '';
    const idNorm = req.categoryId != null && String(req.categoryId).trim() !== '' ? String(req.categoryId).trim() : '';

    const slug = String(req.categorySlug || req.category_slug || '').trim().toLowerCase();
    if (slug) {
      const row = categories.find((x) => String(x.slug || '').trim().toLowerCase() === slug);
      if (row?.name) return row.name;
    }
    const cn = String(req.categoryName || req.category || req.categoryTitle || '').trim();
    if (cn) return cn;
    const nested = req.category?.name;
    if (nested && String(nested).trim()) return String(nested).trim();

    if (idNorm) {
      const fromMerged = categories.find((x) => {
        const pid = pickCategoryId(x);
        return (pid != null && String(pid) === idNorm) || (x.id != null && String(x.id) === idNorm);
      });
      if (fromMerged?.name) return fromMerged.name;

      const rawList = Array.isArray(categoriesRaw) ? categoriesRaw : [];
      const fromRaw = rawList.find((x) => {
        const pid = pickCategoryId(x);
        return (pid != null && String(pid) === idNorm) || (x.id != null && String(x.id) === idNorm);
      });
      if (fromRaw?.name) return String(fromRaw.name).trim();
    }

    return getCategoryName(req.categoryId, req.categorySlug || req.category_slug);
  }

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, cats, deals] = await Promise.all([
        getMyJobRequests(userId),
        getCategories(),
        getMyDeals(userId).catch(() => []),
      ]);
      const merged = mergeRequestStatusesFromCustomerDeals(reqs || [], deals, userId);
      pruneLocalJobRequestCatSlugs(userId, merged.map((r) => r.id));
      const hydrated = mergeLocalCatSlugsIntoRequests(userId, merged).map(normalizeCustomerJobRequestFromApi);
      setRequests(hydrated);
      const raw = normalizeCategoriesApiResponse(cats);
      setCategoriesRaw(raw);
      setCategories(mergeApiCategoriesWithCatalog(raw));
      setDetail((prev) => {
        if (!prev) return null;
        const found = hydrated.find((r) => r.id === prev.id);
        if (found) return found;
        const [one] = mergeLocalCatSlugsIntoRequests(userId, [prev]).map(normalizeCustomerJobRequestFromApi);
        return one || prev;
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);

  useSameRouteRefetch('/my-requests', load);

  /** Обновить счётчики просмотров (и заявки) при возврате на вкладку — не чаще раз в 25 с. */
  const lastListRefreshRef = useRef(0);
  useEffect(() => {
    if (!userId) return undefined;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastListRefreshRef.current < 25000) return;
      lastListRefreshRef.current = now;
      load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [userId, load]);

  /** Мастер «Найти работу» подгружает категории отдельно; у заказчика список заявок мог прийти раньше /categories — добираем при открытии мастера. */
  useEffect(() => {
    if (view == null || !userId) return;
    if (categoriesRaw.length > 0) return;
    let cancelled = false;
    getCategories()
      .then((cats) => {
        if (cancelled) return;
        const raw = normalizeCategoriesApiResponse(cats);
        setCategoriesRaw(raw);
        setCategories(mergeApiCategoriesWithCatalog(raw));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [view, userId, categoriesRaw.length]);

  useEffect(() => {
    setDetailShowOffersPanel(false);
  }, [detail?.id]);

  useEffect(() => {
    if (!detail?.id) {
      setDetailOffers([]);
      setDetailOffersLoading(false);
      return undefined;
    }
    if (detail.status === 'OPEN' && !detailShowOffersPanel) {
      setDetailOffers([]);
      setDetailOffersLoading(false);
      return undefined;
    }
    let cancelled = false;
    setDetailOffersLoading(true);
    getOffersForRequest(detail.id)
      .then((data) => {
        if (!cancelled) setDetailOffers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setDetailOffers([]);
      })
      .finally(() => {
        if (!cancelled) setDetailOffersLoading(false);
      });
    return () => { cancelled = true; };
  }, [detail?.id, detail?.status, detailShowOffersPanel]);

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
  const listSearchNorm = listSearch.trim().toLowerCase();
  const shownFiltered = useMemo(() => {
    if (!listSearchNorm) return shown;
    return shown.filter((r) => {
      const t = String(r.title || '').toLowerCase();
      const d = String(r.description || '').toLowerCase();
      return t.includes(listSearchNorm) || d.includes(listSearchNorm);
    });
  }, [shown, listSearchNorm]);

  const copyRequestLink = useCallback((reqId, e) => {
    e?.stopPropagation?.();
    const url = `${window.location.origin}/my-requests?request=${reqId}`;
    const done = () => {
      setCopyFlashId(reqId);
      window.setTimeout(() => setCopyFlashId((cur) => (cur === reqId ? null : cur)), 2200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done);
    } else {
      done();
    }
  }, []);

  const handleRemoveRequest = useCallback(async (req, e) => {
    e?.stopPropagation?.();
    if (!userId || !req?.id) return;
    const withDeal = req.status === 'IN_PROGRESS';
    const ok = window.confirm(
      withDeal
        ? 'Снять заявку и отменить сделку с мастером?'
        : 'Убрать заявку с публикации? Она перейдёт в архив.',
    );
    if (!ok) return;
    setRemoveLoadingId(req.id);
    try {
      await cancelJobRequest(userId, req.id);
      await load();
      setDetailShowOffersPanel(false);
      setDetail((prev) => (prev && prev.id === req.id ? { ...prev, status: 'CANCELLED' } : prev));
    } catch (err) {
      window.alert(humanizeServerErrorMessage(err));
    } finally {
      setRemoveLoadingId(null);
    }
  }, [userId, load]);

  const handleAccept = async (requestId, offerId, e) => {
    e?.stopPropagation?.();
    if (!window.confirm('Принять этот отклик и начать работу с мастером?')) return;
    setActionLoading(offerId);
    try {
      await acceptOffer(userId, requestId, offerId);
      await load();
      try {
        const data = await getOffersForRequest(requestId);
        setDetailOffers(Array.isArray(data) ? data : []);
      } catch {
        setDetailOffers([]);
      }
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
    if (!requestIsEditable(req)) return;
    setForm({
      title:       req.title || '',
      description: (req.description && req.description !== 'Без описания') ? req.description : '',
      budget:      (() => {
        const n = getJobRequestPublishedBudgetNumber(req);
        return n != null ? String(n) : '';
      })(),
      address:     req.addressText || '',
      city:        req.city || '',
      categoryId:  req.categoryId || '',
      categorySlug: (() => {
        const fromApi = String(req.categorySlug || req.category_slug || '').trim();
        if (fromApi) return fromApi;
        const cid = String(req.categoryId || '');
        const cname = req.categoryName || req.category || '';
        if (!cid) return '';
        if (cname) {
          const row = categories.find(
            (x) => String(pickCategoryId(x) || x.id) === cid && normCatName(x.name) === normCatName(cname),
          );
          if (row?.slug) return String(row.slug);
        }
        const sameId = categories.filter((x) => String(pickCategoryId(x) || x.id) === cid);
        if (sameId.length === 1 && sameId[0].slug) return String(sameId[0].slug);
        return '';
      })(),
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

  /* ── pick category from wizard (каталог → id с бэка по имени или slug) ── */
  const handlePickCategory = (catalogCat) => {
    const c = resolveCatalogCategoryRow(catalogCat, categories, categoriesRaw);
    setFormErr('');
    setHoverCategoryName(null);
    const cid = pickCategoryId(c);
    const slug = (typeof catalogCat === 'object' && catalogCat?.slug)
      ? String(catalogCat.slug)
      : (c?.slug != null ? String(c.slug) : '');
    if (cid) {
      setForm((p) => ({ ...p, categoryId: String(cid), categorySlug: slug }));
    } else {
      setForm((p) => ({ ...p, categoryId: '', categorySlug: '' }));
      setFormErr('Категория не найдена на сервере. Обновите страницу или выберите другую.');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { titleRef.current?.focus(); }, 150);
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!form.title.trim())                           { setFormErr('Укажите название заявки'); return; }
    if (!form.categoryId)                             { setFormErr('Выберите категорию'); return; }
    if (!form.budget || Number(form.budget) <= 0)     { setFormErr('Укажите цену за работу (больше нуля)'); return; }
    if (!userId)                                      { setFormErr('Войдите в аккаунт и попробуйте снова.'); return; }
    setSaving(true); setFormErr('');
    try {
      const isEdit = view !== 'create';
      const slugSave = String(form.categorySlug || '').trim();
      const payload = {
        categoryId:  form.categoryId,
        title:       form.title.trim(),
        description: (form.description || '').trim() || 'Без описания',
        city:        (form.city || '').trim(),
        address:     (form.address || '').trim(),
        budget:      Number(form.budget),
        photos:      (form.photos || []).map(p => p.data).filter(Boolean),
      };
      if (slugSave) payload.categorySlug = slugSave;
      if (isEdit) {
        await updateJobRequest(userId, view.edit.id, {
          categoryId:  payload.categoryId,
          ...(slugSave ? { categorySlug: slugSave } : {}),
          title:       payload.title,
          description: payload.description,
          city:        payload.city,
          addressText: payload.address,
          budgetFrom:  payload.budget,
          budgetTo:    payload.budget,
          photos:      payload.photos,
        });
        setLocalJobRequestCategorySlug(userId, view.edit.id, slugSave);
      } else {
        const created = await createJobRequest(userId, payload);
        let newId = extractCreatedJobRequestId(created);
        if (!newId && slugSave && userId) {
          try {
            const fresh = await getMyJobRequests(userId);
            const list = Array.isArray(fresh) ? fresh : [];
            const t = String(payload.title || '');
            const bid = String(payload.categoryId || '');
            const b = Number(payload.budget);
            const match = list.find(
              (r) =>
                String(r.title || '') === t
                && String(r.categoryId || '') === bid
                && Math.abs(Number(getJobRequestPublishedBudgetNumber(r)) - b) < 0.01,
            );
            if (match?.id) newId = String(match.id);
            if (!newId && list.length) {
              const guess = [...list].sort(
                (a, c) => new Date(c.createdAt || 0) - new Date(a.createdAt || 0),
              )[0];
              if (guess && String(guess.title || '') === t) newId = String(guess.id);
            }
          } catch {
            /* ignore */
          }
        }
        if (slugSave && newId) setLocalJobRequestCategorySlug(userId, newId, slugSave);
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

    const catalogRowsForChips = pickedSection ? (CATEGORIES_BY_SECTION[pickedSection] || []) : [];
    const categoriesForChips = catalogRowsForChips.length
      ? catalogRowsForChips
        .map((row) => {
          const n = (s) => String(s || '').trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
          return categories.find(
            (x) => n(x.name) === n(row.name)
              || (row.slug && String(x.slug || '').toLowerCase() === String(row.slug).toLowerCase()),
          );
        })
        .filter((x) => x && pickCategoryId(x))
      : categories;
    const previewPhotoData = photos[0]?.data;
    const filledPhotos = photos.length;
    const draftProgress = isFormStep && !isEdit
      ? Math.min(100, Math.round(
        (form.title.trim() ? 25 : 0)
          + (form.description.length >= 30 ? 25 : Math.round((form.description.length / 30) * 25))
          + (form.budget && Number(form.budget) > 0 ? 25 : 0)
          + (filledPhotos > 0 ? 25 : 0),
      ))
      : 0;

    const orderTips = [
      'Короткое название — мастера быстрее поймут задачу',
      'Фото помогают оценить объём работ',
      'Чем яснее описание, тем точнее будут отклики',
    ];
    const previewLocLine = [form.city, form.address].filter((s) => String(s || '').trim()).join(' · ');

    return (
      <div className="nl-page">
        <style>{css}</style>

        <header className="nl-hero">
          <img src={heroSrc} alt="" className="nl-hero-photo" />
          <div className="nl-hero-overlay" aria-hidden />
          <div className="nl-hero-inner">
            <button
              type="button"
              className="nl-back"
              onClick={() => {
                if (isCatStep) { setHoverCategoryName(null); setPickedSection(null); }
                else if (isFormStep && !isEdit) { setHoverCategoryName(null); setForm(p => ({ ...p, categoryId: '', categorySlug: '' })); setPickedSection(null); }
                else { setView(null); }
              }}
            >
              {isCatStep ? '← Все разделы' : isFormStep && !isEdit ? '← Выбор категории' : '← Мои заявки'}
            </button>
            {!isEdit && (
              <div className="nl-stepper">
                <span className={`nl-step ${isSectionStep ? 'active' : isCatStep || isFormStep ? 'done' : ''}`}>1 · Раздел</span>
                <span className={`nl-step ${isCatStep ? 'active' : isFormStep && !isCatStep && !isSectionStep ? 'done' : ''}`}>2 · Категория</span>
                <span className={`nl-step ${isFormStep && !isCatStep && !isSectionStep ? 'active' : ''}`}>3 · Заявка</span>
              </div>
            )}
            <h1 className="nl-h1">
              {isEdit ? 'Редактировать заявку' : isSectionStep ? 'Выберите раздел' : isCatStep ? (SECTIONS.find(s => s.slug === pickedSection)?.name || '') : 'Новая заявка'}
            </h1>
            <p className="nl-sub">
              {isEdit
                ? 'Обновите данные и сохраните'
                : isSectionStep
                  ? 'Шаг 1 — выберите раздел услуги'
                  : isCatStep
                    ? 'Шаг 2 — выберите категорию, откроется форма'
                    : 'Шаг 3 — заполните заявку и опубликуйте за минуту'}
            </p>
            {isFormStep && !isEdit && (
              <div className="nl-progress">
                <span className="nl-progress-label">{draftProgress}% готово</span>
                <div className="nl-progress-bar" style={{ width: `${draftProgress}%` }} />
              </div>
            )}
          </div>
        </header>

        <div className="nl-wrap">
          <div className="nl-grid">
            <main className="nl-main">
            {formErr && <div className="nl-err">⚠️ {formErr}</div>}

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
                        onClick={() => handlePickCategory(cat)}
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
                <section className="nl-card">
                  <div className="nl-card-head">
                    <div>
                      <h2 className="nl-card-title">Фотографии</h2>
                      <p className="nl-card-sub">Заявки с фото получают больше откликов от мастеров</p>
                    </div>
                    <span className="nl-counter">{photos.length}/5</span>
                  </div>
                  <div
                    className="nl-photos"
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
                            className={`nl-photo filled${i === 0 ? ' main' : ''}`}
                            onClick={() => setLightbox({ photos: photos.map(p => p.data), index: i })}
                          >
                            <img src={ph.data} alt="" />
                            {i === 0 && <span className="nl-photo-badge">Главное</span>}
                            <button type="button" className="nl-photo-x" onClick={e => removePhoto(ph.id, e)} aria-label="Удалить фото">×</button>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={i}
                          className={`nl-photo${i === 0 ? ' main' : ''}`}
                          style={isDragging ? { borderColor: '#e8410a', background: '#fff5f2' } : undefined}
                        >
                          <button type="button" className="nl-photo-add" onClick={() => photoRef.current?.click()}>
                            {i === 0 ? (
                              <>
                                <span aria-hidden>📷</span>
                                <span>Главное фото</span>
                              </>
                            ) : (
                              <span className="plus">+</span>
                            )}
                          </button>
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
                  <p className="nl-hint">
                    {photos.length > 0
                      ? `${photos.length}/5 фото · Нажмите на фото для просмотра`
                      : 'Перетащите файлы сюда или кликните по ячейке · до 10 МБ'}
                  </p>
                </section>

                <section className="nl-card">
                  <div className="nl-card-head">
                    <div>
                      <h2 className="nl-card-title">Описание заявки</h2>
                      <p className="nl-card-sub">Название, категория и детали — мастер увидит это перед откликом</p>
                    </div>
                  </div>
                  <label className="nl-label nl-label--tight">
                    <span>Название заявки <em>*</em></span>
                    <input
                      ref={titleRef}
                      className="nl-input"
                      value={form.title}
                      onChange={e => { setFormErr(''); setForm(p => ({ ...p, title: e.target.value })); }}
                      maxLength={MAX_ORDER_TITLE}
                      placeholder="Например: замена смесителя на кухне"
                    />
                    <small className="nl-help">
                      Коротко и конкретно — что нужно сделать
                      <span className={`nl-rt nl-char${form.title.length > MAX_ORDER_TITLE * 0.9 ? form.title.length >= MAX_ORDER_TITLE ? ' over' : ' warn' : ''}`}>
                        {form.title.length}/{MAX_ORDER_TITLE}
                      </span>
                    </small>
                  </label>

                  <div className="nl-label">
                    <span>Категория <em>*</em></span>
                    {!isEdit ? (
                      <>
                        <div className="nl-cats">
                          {categoriesForChips.map((c) => {
                            const cid = pickCategoryId(c);
                            const slug = String(c.slug || '').trim().toLowerCase();
                            const formSlug = String(form.categorySlug || '').trim().toLowerCase();
                            const chipActive = formSlug
                              ? formSlug === slug
                              : form.categoryId === String(cid);
                            return (
                            <button
                              key={c.slug || String(cid)}
                              type="button"
                              className={`nl-cat${chipActive ? ' is-active' : ''}`}
                              onClick={() => {
                                setFormErr('');
                                setForm((p) => ({
                                  ...p,
                                  categoryId: String(cid),
                                  categorySlug: c.slug != null ? String(c.slug) : '',
                                }));
                              }}
                            >
                              <span className="nl-cat-emoji" aria-hidden>{categoryEmoji(c.name)}</span>
                              {c.name}
                            </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          className="nl-change-cat"
                          onClick={() => { setForm((p) => ({ ...p, categoryId: '', categorySlug: '' })); setPickedSection(null); }}
                        >
                          ← Выбрать другую категорию из каталога
                        </button>
                      </>
                    ) : (
                      <select
                        className="nl-input"
                        value={categoryFormSelectValue(form.categoryId, form.categorySlug)}
                        style={{ marginTop: 8 }}
                        onChange={(e) => {
                          setFormErr('');
                          const { categoryId: cid, categorySlug: csl } = parseCategoryFormSelectValue(e.target.value);
                          setForm((p) => ({ ...p, categoryId: cid, categorySlug: csl }));
                        }}
                      >
                        <option value="">Выберите категорию</option>
                        {categories.map((c) => {
                          const oid = pickCategoryId(c);
                          if (!oid) return null;
                          const optVal = categoryFormSelectValue(String(oid), c.slug);
                          return <option key={optVal} value={optVal}>{c.name}</option>;
                        })}
                      </select>
                    )}
                  </div>

                  <label className="nl-label">
                    <span>Подробное описание</span>
                    <textarea
                      className="nl-textarea"
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      maxLength={MAX_DESC}
                      rows={6}
                      placeholder="Объём работ, сроки, что важно учесть…"
                    />
                    <small className="nl-help">
                      <span />
                      <span className={`nl-rt nl-char${descLen > MAX_DESC * 0.9 ? descLen >= MAX_DESC ? ' over' : ' warn' : ''}`}>{descLen}/{MAX_DESC}</span>
                    </small>
                  </label>
                </section>

                <section className="nl-card">
                  <div className="nl-card-head">
                    <div>
                      <h2 className="nl-card-title">Где нужна работа</h2>
                      <p className="nl-card-sub">Город и адрес — мастеру проще оценить выезд и сроки</p>
                    </div>
                  </div>
                  <div className="nl-loc-row">
                    <label className="nl-label nl-label--tight">
                      <span>Город</span>
                      <input
                        className="nl-input"
                        value={form.city}
                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        placeholder="Йошкар-Ола"
                      />
                    </label>
                    <label className="nl-label nl-label--tight">
                      <span>Адрес</span>
                      <input
                        className="nl-input"
                        value={form.address}
                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="ул. Ленина, 1"
                      />
                    </label>
                  </div>
                </section>

                <section className="nl-card">
                  <div className="nl-card-head">
                    <div>
                      <h2 className="nl-card-title">Цена за работу</h2>
                      <p className="nl-card-sub">Сумма в заявке — ориентир для мастеров; детали можно уточнить в чате</p>
                    </div>
                  </div>
                  <label className="nl-label nl-label--tight">
                    <span>Сумма в заявке, ₽ <em>*</em></span>
                    <div className="nl-price-input">
                      <input
                        className="nl-input"
                        type="number"
                        min="1"
                        value={form.budget}
                        onChange={e => { setFormErr(''); setForm(p => ({ ...p, budget: e.target.value })); }}
                      />
                      <span className="nl-price-suffix">₽</span>
                    </div>
                    <small className="nl-help">
                      Мастера увидят эту сумму в карточке заявки
                      <span />
                    </small>
                  </label>
                  {form.budget && Number(form.budget) > 0 ? (
                    <div className="nl-price-hint nl-price-hint--ok">
                      <strong>В заявке:</strong>{' '}
                      {Number(form.budget).toLocaleString('ru-RU')} ₽
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.95 }}>
                        Детали и оплату согласуете в чате с мастером (наличные или перевод напрямую).
                      </div>
                    </div>
                  ) : (
                    <div className="nl-price-hint nl-price-hint--muted">
                      Укажите цену за работу — мастера увидят её в заявке и напишут вам в чат
                    </div>
                  )}

                  <button
                    type="button"
                    className="nl-publish"
                    disabled={saving || !form.title.trim() || !form.categoryId || !form.budget || Number(form.budget) <= 0}
                    onClick={handleSave}
                  >
                    <span>
                      {saving
                        ? 'Сохраняем…'
                        : isEdit
                          ? 'Сохранить изменения'
                          : 'Разместить заявку'}
                    </span>
                    {!saving && (
                      <small>
                        {isEdit ? 'Изменения сразу увидят мастера' : 'Размещение бесплатно · Мастера увидят сразу после публикации'}
                      </small>
                    )}
                  </button>
                </section>
              </>
            )}
            </main>

            <aside className="nl-side">
              {isFormStep && (
                <div className="nl-side-card nl-side-preview">
                  <div className="nl-side-card-head">
                    <span className="nl-side-icon" aria-hidden>👀</span>
                    <h3>Предпросмотр</h3>
                  </div>
                  <div className="nl-preview">
                    <div className="nl-preview-img">
                      {previewPhotoData ? (
                        <img src={previewPhotoData} alt="" />
                      ) : (
                        <span>Фото появится здесь</span>
                      )}
                      {catNameStr ? <span className="nl-preview-cat">{catNameStr}</span> : null}
                    </div>
                    <div className="nl-preview-body">
                      <div className="nl-preview-price">
                        {form.budget && Number(form.budget) > 0 ? (
                          <>{Number(form.budget).toLocaleString('ru-RU')} ₽</>
                        ) : (
                          <span className="muted">Цена в заявке</span>
                        )}
                      </div>
                      <div className="nl-preview-title">
                        {form.title.trim() || 'Название вашей заявки'}
                      </div>
                      <div className="nl-preview-meta">
                        <span>★ {isEdit ? 'Редактирование' : 'Новая заявка'}</span>
                        <span>· {previewLocLine || 'Укажите город в форме'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isFormStep && orderTips.length > 0 && (
                <div className="nl-side-card">
                  <div className="nl-side-card-head">
                    <span className="nl-side-icon" aria-hidden>💡</span>
                    <h3>Советы по заявке</h3>
                  </div>
                  <div className="nl-tips">
                    {orderTips.map((t, i) => (
                      <div key={i} className="nl-tip">{t}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="nl-side-card">
                <div className="nl-side-card-head">
                  <span className="nl-side-icon nl-grad" aria-hidden>⚡</span>
                  <h3>Как это работает</h3>
                </div>
                <ol className="nl-steps">
                  {[
                    ['Разместите заявку', 'Опишите задачу и укажите цену за работу — мастера увидят заявку'],
                    ['Пишите в чате', 'Мастера откликаются и обсуждают детали в личных сообщениях'],
                    ['Договоритесь напрямую', 'Сроки и нюансы — в переписке с выбранным мастером'],
                    ['Оплата мастеру', 'Наличными или переводом на карту напрямую после выполнения работы'],
                  ].map(([title, desc], i) => (
                    <li key={i}>
                      <b>{title}</b>
                      <span>{desc}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="nl-side-card">
                <div className="nl-side-card-head">
                  <span className="nl-side-icon" aria-hidden>🛡</span>
                  <h3>Ваши преимущества</h3>
                </div>
                <ul className="nl-perks">
                  {[
                    ['Отзывы и рейтинг', 'Честные отзывы — только от реальных мастеров'],
                    ['Прямой чат', 'Общайтесь с мастером без посредников'],
                  ].map(([title, desc]) => (
                    <li key={title}>
                      <b>{title}</b>
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
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

  // ══ ДЕТАЛЬНАЯ СТРАНИЦА (как «Найти работу» / ed--listing-detail) ══
  if (detail) {
    const statusPill = jobRequestDetailStatusPill(detail.status);
    const catNameD = jobRequestCategoryLabel(detail);
    const detailPlaceholder = getCategoryPlaceholderPhotoUrlOrDefault(
      {
        categoryName: catNameD,
        categoryId: detail.categoryId,
        categorySlug: detail.categorySlug || detail.category_slug,
      },
      categories,
    );
    const jdPhotosRaw = (detail.photos || []).map((p) => moDetailPhotoUrl(p, BACKEND)).filter(Boolean);
    const jdPhotos = jdPhotosRaw.length ? jdPhotosRaw : [detailPlaceholder];
    const mainSrc = jdPhotos[photoIdx] || jdPhotos[0];
    const budget = getJobRequestPublishedBudgetNumber(detail);
    const priceIsNegotiable = budget == null || Number(budget) <= 0;
    const addressLine = [detail.city, detail.addressText].filter(Boolean).join(', ').trim();
    const jobCity =
      (detail.city && String(detail.city).trim())
      || (addressLine.includes(',') ? addressLine.split(',')[0].trim() : addressLine || '—');
    const viewsCount = getJobRequestViewsCount(detail);
    const descFormatted = formatListingOriginDescription('CUSTOMER', detail.description);
    const showDescCard = !!(detail.description && String(detail.description).trim() && detail.description !== 'Без описания');
    const photoCount = jdPhotos.length;
    const hasMultiplePhotos = photoCount > 1;

    return (
      <div className="ed ed--listing-detail">
        <style>{css}</style>
        <style>{edListingDetailMergedCss}</style>

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
            <div className="jd-lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
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
                alt={detail.title || ''}
                onClick={() => lightbox.photos.length <= 1 && setLightbox(null)}
              />
            </div>
            {lightbox.photos.length > 1 && (
              <div className="jd-lb-counter">
                {lightbox.index + 1} / {lightbox.photos.length}
              </div>
            )}
            <div className="jd-lb-hint">← → по краям · Esc — закрыть</div>
          </div>
        )}

        <div className="ed-wrap">
          <button
            type="button"
            className="ed-back"
            onClick={() => {
              setLightbox(null);
              setDetail(null);
              setPhotoIdx(0);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Мои заявки
          </button>

          <div className="ed-head">
            <div className="ed-head-left" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1>{detail.title || 'Заявка'}</h1>
              </div>
              <div className="ed-listing-meta">
                {catNameD ? (
                  <span>
                    {dealCategoryEmoji(catNameD)} {catNameD}
                  </span>
                ) : null}
                {addressLine ? <span>📍 {addressLine}</span> : null}
                {detail.createdAt ? <span>📅 {moDetailFmtDateLong(detail.createdAt)}</span> : null}
              </div>
            </div>
            <div className="ed-head-right">
              <FavoriteHeartButton kind="jobRequest" id={detail.id} className="ulc-fav-heart ed-fav" />
              <span className="ed-status-pill">
                <span className="dot" style={{ background: statusPill.dot, boxShadow: statusPill.shadow }} />
                {statusPill.label}
              </span>
            </div>
          </div>

          <div className="ed-grid">
            <div className="ed-col">
              <div className="ed-gallery">
                <div
                  className="ed-main"
                  role="presentation"
                  onClick={() => jdPhotos.length > 0 && setLightbox({ photos: jdPhotos, index: photoIdx })}
                >
                  {mainSrc ? (
                    <img src={mainSrc} alt={detail.title || ''} key={`${photoCount}-${photoIdx}`} />
                  ) : (
                    <div className="ed-main-placeholder" aria-hidden>
                      {dealCategoryEmoji(catNameD)}
                    </div>
                  )}
                  <div className="ed-floats">
                    <div className="ed-chip">
                      <span className="pulse" style={{ background: statusPill.dot, boxShadow: statusPill.shadow }} />
                      <span className="ed-chip-text">{statusPill.label}</span>
                    </div>
                    {catNameD ? (
                      <div className="ed-chip">
                        <span className="ed-chip-text">
                          {dealCategoryEmoji(catNameD)} {catNameD}
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
                          setPhotoIdx((i) => (i > 0 ? i - 1 : jdPhotos.length - 1));
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
                          setPhotoIdx((i) => (i < jdPhotos.length - 1 ? i + 1 : 0));
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="ed-counter">
                        {String(photoIdx + 1).padStart(2, '0')} / {String(photoCount).padStart(2, '0')}
                      </div>
                    </>
                  ) : null}
                </div>
                {hasMultiplePhotos ? (
                  <div className="ed-thumbs">
                    {jdPhotos.map((p, i) => (
                      <div
                        key={i}
                        className={`ed-thumb${i === photoIdx ? ' on' : ''}`}
                        onClick={() => setPhotoIdx(i)}
                        role="presentation"
                      >
                        <img src={p} alt="" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {showDescCard ? (
                <section className="ed-card">
                  <div className="ed-eyebrow">Описание</div>
                  <p className="ed-desc">{descFormatted}</p>
                </section>
              ) : (
                <section className="ed-card">
                  <div className="ed-eyebrow">Описание</div>
                  <p className="ed-desc" style={{ color: '#a1a1aa', fontStyle: 'italic' }}>
                    Описание не добавлено
                  </p>
                </section>
              )}

              <section className="ed-card">
                <div className="ed-eyebrow">Условия</div>
                <dl className="ed-rows">
                  {[
                    catNameD && ['Категория', catNameD],
                    ['Город', jobCity],
                    addressLine && ['Адрес', addressLine],
                    ['Стоимость', priceIsNegotiable ? JOB_REQUEST_PRICE_MISSING_LABEL : `${Number(budget).toLocaleString('ru-RU')} ₽`],
                    detail.createdAt && ['Опубликована', moDetailTimeAgo(detail.createdAt) || moDetailFmtDateLong(detail.createdAt)],
                    viewsCount > 0 && ['Просмотры', String(viewsCount)],
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
                {!priceIsNegotiable ? (
                  <div className="ed-price-num">
                    {Number(budget).toLocaleString('ru-RU')}
                    <small> ₽</small>
                  </div>
                ) : (
                  <div className="ed-price-num" style={{ fontSize: 22, fontWeight: 700 }}>
                    {JOB_REQUEST_PRICE_MISSING_LABEL}
                  </div>
                )}
                <p className="ed-price-sub">
                  {priceIsNegotiable
                    ? 'укажите сумму при редактировании или договоритесь в чате с мастером'
                    : 'окончательная цена в заявке; детали — в чате'}
                </p>
              </div>

              {(requestIsEditable(detail) || requestCanRemove(detail) || detail.status === 'OPEN') && (
                <div className="ed-card">
                  <div className="ed-eyebrow ed-eyebrow--block">Управление</div>
                  <div className="ed-actions">
                    {requestIsEditable(detail) && (
                      <button type="button" className="ed-btn ed-btn-confirm" onClick={() => openEdit(detail)}>
                        Редактировать
                      </button>
                    )}
                    {detail.status === 'OPEN' && (
                      <button
                        type="button"
                        className="ed-btn ed-btn-ghost"
                        onClick={() => setDetailShowOffersPanel((v) => !v)}
                      >
                        {detailShowOffersPanel ? 'Скрыть отклики' : 'Смотреть отклики'}
                      </button>
                    )}
                    {requestCanRemove(detail) && (
                      <button
                        type="button"
                        className="ed-btn ed-btn-ghost"
                        disabled={removeLoadingId === detail.id}
                        onClick={(e) => handleRemoveRequest(detail, e)}
                      >
                        {removeLoadingId === detail.id ? 'Убираем…' : 'Убрать заявку'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {detail.status === 'OPEN' && detailShowOffersPanel && (
                <div className="ed-card">
                  <div className="ml-offers-title">Отклики мастеров</div>
                  {detailOffersLoading && <div className="ml-sk" style={{ height: 60, borderRadius: 12 }} />}
                  {!detailOffersLoading && detailOffers.length === 0 && (
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.45 }}>
                      Откликов пока нет. Мастера увидят вашу заявку и предложат цену.
                    </p>
                  )}
                  {!detailOffersLoading && detailOffers.map((offer) => {
                    const agreedPrice = budget && Number(offer.price) === Number(budget);
                    const cheaper = budget && Number(offer.price) < Number(budget);
                    return (
                      <div
                        key={offer.id}
                        className="ml-offer-card"
                        style={agreedPrice || offer.status === 'ACCEPTED' ? { borderColor: '#22c55e', background: '#f0fdf4' } : {}}
                      >
                        <div className="ml-offer-top">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span className="ml-offer-price">{Number(offer.price).toLocaleString('ru-RU')} ₽</span>
                              {offer.estimatedDays && <span className="ml-offer-days">· {offer.estimatedDays} дн.</span>}
                              {agreedPrice && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 12 }}>✅ Принял вашу цену</span>
                              )}
                              {cheaper && !agreedPrice && (
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 12 }}>
                                  −{(Number(budget) - Number(offer.price)).toLocaleString('ru-RU')} ₽ дешевле
                                </span>
                              )}
                              {budget && Number(offer.price) > Number(budget) && (
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: 12 }}>
                                  +{(Number(offer.price) - Number(budget)).toLocaleString('ru-RU')} ₽ к цене в заявке
                                </span>
                              )}
                            </div>
                            {offer.workerName && (
                              <div className="ml-offer-name">{workerOfferFullName(offer)}</div>
                            )}
                          </div>
                          {requestIsEditable(detail) && offer.status !== 'ACCEPTED' && (
                            <button
                              className="ml-accept-btn"
                              disabled={actionLoading === offer.id}
                              onClick={(e) => handleAccept(detail.id, offer.id, e)}
                            >
                              {actionLoading === offer.id ? '...' : 'Принять'}
                            </button>
                          )}
                          {offer.status === 'ACCEPTED' && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>✓ Принят</span>
                          )}
                        </div>
                        {offer.message && <p className="ml-offer-msg">{offer.message}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {detail.status !== 'OPEN' && (
                <div className="ed-card">
                  <div className="ed-eyebrow ed-eyebrow--block">Мастер по заявке</div>
                  {detailOffersLoading && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Загрузка…</div>}
                  {!detailOffersLoading && detailOffers.length === 0 && (
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.45 }}>
                      Отклики не найдены. Обновите страницу или откройте «Мои сделки» — мастер уже мог принять заказ по объявлению.
                    </p>
                  )}
                  {!detailOffersLoading && detailOffers.map((offer, oi) => {
                    const workerHref = workerOfferPublicPath(offer);
                    const workerAv = workerOfferAvatarSrc(offer, BACKEND);
                    const workerLabel = workerOfferFullName(offer);
                    const workerInitial = (workerLabel || 'М')[0].toUpperCase();
                    return (
                      <div key={offer.id} style={{ marginTop: oi === 0 ? 0 : 12, paddingTop: oi === 0 ? 0 : 12, borderTop: oi === 0 ? 'none' : '1px solid #f4f4f5' }}>
                        {workerHref ? (
                          <Link to={workerHref} className="ed-cust-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="ed-ava">
                              {workerAv ? <img src={workerAv} alt="" /> : (
                                <div className="ed-ava-fallback neutral">{workerInitial}</div>
                              )}
                            </div>
                            <div className="ed-cust-info">
                              <div className="ed-cust-name">{workerLabel}</div>
                              <div className="ed-cust-meta">Мастер</div>
                            </div>
                            <div className="ed-cust-arrow">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        ) : (
                          <div className="ed-cust-row" style={{ cursor: 'default', pointerEvents: 'none' }}>
                            <div className="ed-ava">
                              {workerAv ? <img src={workerAv} alt="" /> : (
                                <div className="ed-ava-fallback neutral">{workerInitial}</div>
                              )}
                            </div>
                            <div className="ed-cust-info">
                              <div className="ed-cust-name">{workerLabel}</div>
                              <div className="ed-cust-meta">Мастер</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="ed-card">
                <div className="ed-eyebrow ed-eyebrow--block">Ваш профиль</div>
                <div className="ed-cust-row ed-cust-row-static" onClick={() => navigate('/customer-profile')} role="presentation">
                  <div className="ed-ava">
                    {ava ? <img src={ava} alt={fullName} /> : (
                      <div className="ed-ava-fallback neutral">{(userName || 'З')[0].toUpperCase()}</div>
                    )}
                  </div>
                  <div className="ed-cust-info">
                    <div className="ed-cust-name">{fullName}</div>
                    <div className="ed-cust-meta">Заказчик</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ══ СПИСОК ══
  return (
    <div className="ml-page ml-list-shell mo-orders-root mo-page">
      <style>{css}</style>

      <header className="mo-hero">
        <img src={MY_ORDERS_HERO_PHOTO} alt="" />
        <div className="mo-hero-inner">
          <div>
            <h1>Мои заявки</h1>
            <p>Управляйте заявками и откликами мастеров</p>
          </div>
          <button type="button" className="mo-cta" onClick={openCreate}>+ Разместить заявку</button>
        </div>
      </header>

      <main className="mo-main">
        <div className="mo-toolbar">
          <div className="mo-tabs">
            <button type="button" className={`mo-tab${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>
              Активные<span className="mo-tab-count">{active.length}</span>
            </button>
            <button type="button" className={`mo-tab${tab === 'archive' ? ' active' : ''}`} onClick={() => setTab('archive')}>
              Архив<span className="mo-tab-count">{archive.length}</span>
            </button>
          </div>
          <div className="mo-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
            <input
              type="search"
              placeholder="Поиск по заявкам…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {loading ? (
          <div className="mo-grid listing-grid order-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mo-card mo-card--sk" aria-hidden>
                <div className="mo-card-media"><div className="ml-sk" style={{ width: '100%', height: '100%' }} /></div>
                <div className="mo-card-content">
                  <div className="ml-sk" style={{ height: 18, width: '75%' }} />
                  <div className="ml-sk" style={{ height: 12, width: '55%', marginTop: 10 }} />
                  <div className="ml-sk" style={{ height: 12, width: '90%', marginTop: 8 }} />
                </div>
                <div className="mo-actions">
                  <div className="ml-sk mo-btn" style={{ flex: 1, minHeight: 46, borderRadius: 14 }} />
                  <div className="ml-sk mo-btn" style={{ flex: 1, minHeight: 46, borderRadius: 14 }} />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="mo-empty">
            <div className="mo-empty-emoji">{tab === 'active' ? '📋' : '📦'}</div>
            <div className="mo-empty-title">{tab === 'active' ? 'Нет активных заявок' : 'Архив пуст'}</div>
            <div className="mo-empty-sub">
              {tab === 'active' ? 'Разместите заявку, чтобы мастера откликнулись' : 'Завершённые и закрытые заявки появятся здесь'}
            </div>
            {tab === 'active' && (
              <div className="mo-empty-actions">
                <button type="button" className="mo-cta" onClick={openCreate}>+ Разместить заявку</button>
              </div>
            )}
          </div>
        ) : shownFiltered.length === 0 ? (
          <div className="mo-empty">
            <div className="mo-empty-emoji">🔍</div>
            <div className="mo-empty-title">Ничего не найдено</div>
            <div className="mo-empty-sub">Попробуйте изменить запрос или сбросить поиск</div>
            <div className="mo-empty-actions">
              <button type="button" className="mo-cta" onClick={() => setListSearch('')}>Сбросить поиск</button>
            </div>
          </div>
        ) : (
          <div className="mo-grid listing-grid order-grid">
            {shownFiltered.map((req) => {
              const catName = jobRequestCategoryLabel(req);
              const categoryPhoto = getCategoryPlaceholderPhotoUrlOrDefault(
                {
                  categoryName: catName,
                  categoryId: req.categoryId,
                  categorySlug: req.categorySlug || req.category_slug,
                },
                categories,
              );
              const thumbSrc = req.photos?.length ? req.photos[0] : categoryPhoto;
              const pillClass = moCardStatusPillClass(req.status);
              const stPillLabel = moCardStatusPillLabel(req.status);
              const budget = getJobRequestPublishedBudgetNumber(req);
              const offers = Number(req.offersCount) || 0;
              const desc = (req.description && req.description !== 'Без описания') ? req.description : '';
              const urgent = !!(req.urgent || req.isUrgent);
              const openDetail = (showOffers) => {
                setDetailShowOffersPanel(!!showOffers);
                setDetail(req);
                setPhotoIdx(0);
              };
              const addrLine = cabinetAddressLine(req.city, req.addressText || req.address);
              const priceOnImg = budget && Number(budget) > 0
                ? `${Number(budget).toLocaleString('ru-RU')} ₽ в заявке`
                : JOB_REQUEST_PRICE_MISSING_LABEL;
              const canEdit = requestIsEditable(req);
              const onEdit = (e) => {
                e.stopPropagation();
                if (canEdit) openEdit(req, e);
                else openDetail(false);
              };
              const onDetailBtn = (e) => {
                e.stopPropagation();
                if (offers > 0) openDetail(true);
                else openDetail(false);
              };
              const hintText = offers > 0
                ? `${offers} ${pluralOffers(offers)} · Мастера могут откликнуться`
                : 'Ждём первый отклик';
              return (
                <article
                  key={req.id}
                  className="mo-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetail(false);
                    }
                  }}
                >
                  <div className="mo-card-media">
                    <img src={thumbSrc} alt="" />
                    <span className={`mo-card-status-on-img ${pillClass}`}>{stPillLabel}</span>
                    {urgent && <span className="mo-card-urgent">Срочно</span>}
                    <div className="mo-card-price-on-img">{priceOnImg}</div>
                  </div>

                  <div className="mo-card-content">
                    <div className="mo-card-headline">
                      <h3 className="mo-card-title">{req.title}</h3>
                      <time className="mo-card-time">{formatJobRequestRelativeRu(req.createdAt)}</time>
                    </div>
                    {(catName || addrLine) && (
                      <div className="mo-card-tags">
                        {!!catName && <span className="mo-tag">{catName}</span>}
                        {!!addrLine && <span className="mo-tag">{addrLine}</span>}
                      </div>
                    )}
                    {!!desc && <p className="mo-card-desc">{desc}</p>}
                    <p className="mo-card-hint">{hintText}</p>
                  </div>

                  <div className="mo-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="mo-btn mo-btn-primary" onClick={onEdit}>
                      {canEdit ? 'Редактировать' : 'Открыть'}
                    </button>
                    <button type="button" className="mo-btn mo-btn-secondary" onClick={onDetailBtn}>
                      Подробнее
                    </button>
                  </div>

                  <div className="mo-card-tools" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`mo-card-tool${copyFlashId === req.id ? ' copied' : ''}`}
                        aria-label="Копировать ссылку"
                        onClick={(e) => copyRequestLink(req.id, e)}
                      >
                        {copyFlashId === req.id ? 'Ссылка скопирована' : 'Копировать ссылку'}
                      </button>
                      {requestCanRemove(req) && (
                        <button
                          type="button"
                          className="mo-card-tool"
                          disabled={removeLoadingId === req.id}
                          onClick={(e) => handleRemoveRequest(req, e)}
                        >
                          {removeLoadingId === req.id ? 'Убираем…' : 'Убрать заявку'}
                        </button>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
