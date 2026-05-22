import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FavoriteHeartButton from '../../components/FavoriteHeartButton';
import { parseListingDescription } from '../../components/ListingInfoPanels';
import { SECTIONS } from '../../pages/SectionsPage';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import { API_BASE, getMyDeals, getWorkerStats } from '../../api';
import ReviewForm from '../../components/ReviewForm';
import { dealEligibleForReviews } from '../../utils/dealReviewEligibility';
import { humanizeServerErrorMessage } from '../../utils/humanizeServerError';
import { PAGE_HERO_DEFAULT_PHOTO, PAGE_HERO_OVERLAY_GRADIENT, PAGE_HERO_IMG_FILTER, PAGE_HERO_OBJECT_POSITION, PAGE_HERO_OBJECT_FIT } from '../../constants/pageHeroAssets';
import { useSameRouteRefetch } from '../../hooks/useSameRouteRefetch';
import { LISTING_ARCHIVED_AFTER_DEAL } from '../../utils/listingArchiveEvents';
import { edListingDetailMergedCss, dealCategoryEmoji } from '../shared/dealsWdStyles';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../../utils/listingPublishedPrice';
import { getListingViewsCount } from '../../utils/jobRequestViews';
import { moOrdersListShellCss } from '../../styles/moOrdersListShellCss.js';
import './listings-new.css';

const API = API_BASE;

const CATEGORIES = [
  'Ремонт квартир','Сантехника','Электрика','Компьютерная помощь',
  'Уборка','Парикмахер','Маникюр и педикюр','Красота и здоровье',
  'Репетиторство','Грузоперевозки','Сварочные работы','Другое',
];
const EMPTY_FORM  = { title:'', description:'', price:'', priceUnit:'за работу', category:'', photos:[] };
const MAX_DESC    = 2000;
const MAX_TITLE   = 80;

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

function moCatClassFromLabel(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('электр')) return 'elec';
  if (n.includes('сантех')) return 'plumb';
  if (n.includes('красот')) return 'beauty';
  if (n.includes('парикмах') || n.includes('стриж') || n.includes('маникюр')) return 'hair';
  if (n.includes('ремонт') || n.includes('уборк') || n.includes('репетит') || n.includes('компьютер')) return 'repair';
  return 'repair';
}

function formatListingRelativeRu(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return 'сегодня';
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
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

function cabinetListingAddressLine(listing) {
  const raw = listing?.address || listing?.city || '';
  const s = String(raw).trim();
  if (s) return s;
  return 'Йошкар-Ола · выезд по договорённости';
}

function priceKindFromListing(l) {
  const u = String(l?.priceUnit || '').trim().toLowerCase();
  if (u.includes('договор')) return 'negotiable';
  if (u === 'от' || u.startsWith('от ')) return 'from';
  return 'fixed';
}

const DEFAULT_MY_LISTINGS_BG = PAGE_HERO_DEFAULT_PHOTO;

/** Hero списка «Мои объявления» — тот же кадр, что у «Мои заявки». */
const MY_LISTINGS_MO_HERO_PHOTO =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=max&w=2400&q=86';

const CAT_TIPS = {
  'Ремонт квартир':    ['Укажите виды работ: штукатурка, обои, полы…', 'Добавьте фото — заказчик поймёт масштаб', 'Напишите опыт и регион работы'],
  'Сантехника':        ['Опишите, что умеете: замена труб, унитазов, смесителей', 'Упомяните наличие инструмента', 'Укажите возможность срочного выезда'],
  'Электрика':         ['Опишите специализацию: щиток, розетки, освещение', 'Укажите допуски, если есть', 'Добавьте фото примеров работ'],
  'Компьютерная помощь':['Опишите что чините: ПК, ноутбуки, телефоны', 'Укажите выезд или удалённо', 'Добавьте фото рабочего места или результатов'],
  'Уборка':            ['Укажите тип уборки: генеральная, после ремонта', 'Напишите какие средства используете', 'Укажите наличие своего оборудования'],
  'Парикмахер':        ['Опишите специализацию: стрижки, окраска, укладки', 'Добавьте фото портфолио — это главный аргумент', 'Укажите выезд на дом или свой адрес'],
};

/** Фон по названию категории (как на страницах разделов) */
const CATEGORY_PHOTO_BY_NAME = {};
Object.values(CATEGORIES_BY_SECTION).forEach(cats => {
  cats.forEach(c => { CATEGORY_PHOTO_BY_NAME[c.name] = c.photo; });
});
function photoForCategoryName(name) {
  if (!name || !String(name).trim()) return DEFAULT_MY_LISTINGS_BG;
  const n = String(name).trim();
  if (CATEGORY_PHOTO_BY_NAME[n]) return CATEGORY_PHOTO_BY_NAME[n];
  return DEFAULT_MY_LISTINGS_BG;
}

function mlDetailFmtDateLong(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function mlDetailTimeAgo(d) {
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

function mlDetailPhotoUrl(u, backend) {
  const b = backend || 'https://svoi-mastera-backend.onrender.com';
  if (!u) return null;
  if (String(u).startsWith('http') || String(u).startsWith('data:')) return u;
  return b + u;
}

/** Плашка статуса объявления в детальном экране владельца. */
function listingOwnerDetailStatusPill(detail, lockedAfterDeal) {
  if (lockedAfterDeal) return { label: 'Завершено по сделке', dot: '#94a3b8', shadow: '0 0 0 3px rgba(148,163,184,.22)' };
  if (detail.active) return { label: 'В каталоге', dot: '#22c55e', shadow: '0 0 0 3px rgba(34,197,94,.2)' };
  return { label: 'Снято с публикации', dot: '#a1a1aa', shadow: '0 0 0 3px rgba(161,161,170,.22)' };
}

function WorkerReviewDealModal({ dealId, onClose, onReload }) {
  if (!dealId) return null;
  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        background: 'rgba(15,23,42,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '20px 22px 24px',
          maxWidth: 440,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 24px 48px rgba(0,0,0,.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            width: 36,
            height: 36,
            border: 'none',
            background: '#f1f5f9',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            color: '#64748b',
          }}
        >
          ×
        </button>
        <ReviewForm forWorker dealId={dealId} onSuccess={() => { onReload(); onClose(); }} />
      </div>
    </div>
  );
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

/* ══ CSS ══ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  /* ── GENERAL (форма и деталь) ── */
  .ml-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  ${moOrdersListShellCss}

  .ml-page.ml-list-shell.mo-orders-root {
    font-family: 'Manrope', Inter, system-ui, sans-serif;
    color: #0f172a;
  }

  /* .ml-list, .ml-row — unifiedListingCards.css */

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
  .ml-link-preview {
    font-size: 13px; font-weight: 600; color: #e8410a; text-align: center;
    text-decoration: none; padding: 7px 0;
    display: block; border-radius: 8px; transition: background .15s;
  }
  .ml-link-preview:hover { background: #fff4ef; }
  .ml-actions-divider { height: 1px; background: #ebebeb; margin: 2px 0; }
  .ml-btn-review-customer {
    width: 100%; box-sizing: border-box; min-height: 40px; padding: 10px 12px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; line-height: 1.25; text-align: center;
    background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none; border-radius: 8px;
    color: #fff; cursor: pointer; font-family: inherit;
    box-shadow: 0 4px 14px rgba(99,102,241,.28);
    transition: filter .15s, transform .15s;
  }
  .ml-btn-review-customer:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .ml-btn-review-customer:active { transform: translateY(0); }
  /* .ml-empty — unifiedListingCards.css */

  /* ══ ФОРМА СТРАНИЦА ══ */
  .mlf-hero { position: relative; height: var(--page-hero-h-desktop); overflow: hidden; }
  @media (max-width: 768px) { .mlf-hero { height: var(--page-hero-h-mobile); } }
  .mlf-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: ${PAGE_HERO_OBJECT_FIT}; object-position: ${PAGE_HERO_OBJECT_POSITION}; filter: ${PAGE_HERO_IMG_FILTER}; }
  .mlf-hero-overlay { position: absolute; inset: 0; background: ${PAGE_HERO_OVERLAY_GRADIENT}; }
  .mlf-hero-body { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; padding: 0 24px 32px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; }
  .mlf-hero-back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: rgba(255,255,255,.8); background: none; border: none; font-family: inherit; cursor: pointer; padding: 0; margin-bottom: 10px; transition: color .15s; }
  .mlf-hero-back:hover { color: #fff; }
  .mlf-hero-title { font-size: clamp(22px, 4vw, 34px); font-weight: 900; color: #fff; margin: 0 0 6px; letter-spacing: -.4px; line-height: 1.15; }
  .mlf-hero-sub { font-size: 14px; color: rgba(255,255,255,.75); margin: 0; }

  /* Фон страницы формы + степпер на фото-герое (как раньше: img + overlay из констант) */
  .ml-page.mlf-form-shell { background: #f6f6f4; font-family: Manrope, Inter, system-ui, sans-serif; }
  .mlf-stepper--hero {
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .mlf-hero .mlf-stepper--hero .mlf-step-pill {
    background: rgba(255,255,255,.12);
    border-color: rgba(255,255,255,.22);
    color: rgba(255,255,255,.85);
  }
  .mlf-hero .mlf-stepper--hero .mlf-step-pill.on {
    background: #e8410a;
    border-color: #e8410a;
    color: #fff;
    box-shadow: 0 6px 22px rgba(232,65,10,.45);
  }
  .mlf-hero .mlf-stepper--hero .mlf-step-dot { background: rgba(255,255,255,.35); }
  .mlf-hero-progress {
    width: 100%;
    max-width: 420px;
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.22);
    overflow: visible;
    margin-top: 8px;
    margin-bottom: 22px;
  }
  .mlf-hero-progress-bar {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #ff8a4a, #e8410a);
    transition: width .35s ease;
  }
  .mlf-hero-progress-label {
    position: absolute;
    right: 0;
    top: 100%;
    margin-top: 6px;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,.88);
  }

  .mlf-wrap { max-width: 1080px; margin: 0 auto; padding: 20px 24px 60px; display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }
  .mlf-wrap--lovable { max-width: 1120px; grid-template-columns: 1fr 340px; gap: 24px; padding-top: 24px; }

  .mlf-stepper {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .mlf-step-pill {
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 700;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    color: #6b7280;
  }
  .mlf-step-pill.on {
    border-color: #e8410a;
    color: #e8410a;
    background: #fff4ef;
  }
  .mlf-step-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #d1d5db;
  }

  /* ── ВЫБОР РАЗДЕЛА (шаг 1) ── */
  .mlf-sec-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 200px;
    gap: 12px;
    margin-bottom: 12px;
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
    object-fit: cover;
    filter: brightness(.58) saturate(1.1);
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .mlf-sec-card:hover .mlf-sec-photo { transform: scale(1.06); }
  .mlf-sec-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(175deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.72) 100%);
  }
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
    font-size: 17px; color: #fff;
    transition: background .2s, transform .2s;
  }
  .mlf-sec-card:hover .mlf-sec-arrow { background: rgba(255,255,255,.35); transform: translate(2px,-2px); }
  .mlf-sec-body {
    position: absolute; inset: 0; padding: 16px 18px;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .mlf-sec-name { font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 4px; line-height: 1.1; }
  .mlf-sec-featured .mlf-sec-name { font-size: 32px; }
  .mlf-sec-desc { font-size: 12px; color: rgba(255,255,255,.82); line-height: 1.5; margin-bottom: 10px; }
  .mlf-sec-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .mlf-sec-tag {
    background: rgba(255,255,255,.18); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,.22); border-radius: 20px;
    padding: 3px 10px; font-size: 11px; font-weight: 600; color: #fff;
  }

  /* ── Шаг 2: заголовок без второго фото-баннера (фото только в карточках) ── */
  .mlf-cat-head-simple {
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 14px;
    padding: 16px 18px 18px;
    margin-bottom: 12px;
  }
  .mlf-cat-head-back {
    background: none; border: none; color: #e8410a; font-size: 13px; font-weight: 700;
    cursor: pointer; padding: 0; margin-bottom: 10px; font-family: inherit;
  }
  .mlf-cat-head-back:hover { opacity: .8; }
  .mlf-cat-head-name { font-size: 22px; font-weight: 900; color: #111827; margin: 0 0 4px; line-height: 1.2; }
  .mlf-cat-head-sub { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.45; }

  .mlf-cat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .mlf-cat-card {
    background: #fff;
    border-radius: 14px;
    border: 1.5px solid #e8e8e8;
    overflow: hidden;
    cursor: pointer;
    border: none; padding: 0;
    display: flex; flex-direction: column;
    font-family: Inter, Arial, sans-serif;
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
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid #fed7c2;
    background: #fff7f3;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .mlf-selected-cat b {
    color: #9a3412;
    font-size: 13px;
  }
  .mlf-change-cat {
    border: none;
    background: none;
    color: #e8410a;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }
  .mlf-change-cat:hover { opacity: .8; }

  /* cards */
  .mlf-card { background: #fff; margin-bottom: 12px; overflow: hidden; border-radius: 20px; border: 1px solid rgba(0,0,0,.06); box-shadow: 0 4px 28px rgba(15,23,42,.06); }
  .mlf-form-shell .mlf-card { border-radius: 22px; }
  .mlf-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 20px 22px 0; margin-bottom: 14px; }
  .mlf-card-head-text { min-width: 0; }
  .mlf-card-kicker { font-size: 13px; color: #6b7280; font-weight: 500; margin: 6px 0 0; line-height: 1.45; }
  .mlf-card-title { font-size: 17px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -.02em; }
  .mlf-card-counter { font-size: 13px; font-weight: 700; color: #9ca3af; flex-shrink: 0; padding-top: 2px; }
  .mlf-card-counter strong { color: #e8410a; font-weight: 800; }

  /* photo grid */
  .mlf-photos { padding: 0 22px 22px; }
  .mlf-photo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .mlf-photo-cell { aspect-ratio: 1; border-radius: 14px; overflow: hidden; position: relative; border: 1.5px dashed rgba(232,65,10,.35); background: #fffaf7; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; }
  .mlf-photo-cell:hover { border-color: #e8410a; background: #fff5f2; }
  .mlf-photo-cell.filled { border: none; cursor: zoom-in; }
  .mlf-photo-cell.main-photo { grid-column: span 2; grid-row: span 2; }
  .mlf-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .mlf-photo-cell.filled:hover .mlf-photo-img { transform: scale(1.05); }
  .mlf-photo-add-icon { font-size: 28px; opacity: .55; }
  .mlf-photo-main-label { font-size: 11px; font-weight: 700; color: #9a3412; margin-top: 6px; text-align: center; line-height: 1.25; max-width: 90%; }
  .mlf-photo-num { font-size: 11px; font-weight: 600; color: #aaa; margin-top: 4px; text-align: center; }
  .mlf-photo-hint { font-size: 12px; color: #aaa; margin-top: 10px; }
  .mlf-photo-del { position: absolute; top: 5px; right: 5px; width: 26px; height: 26px; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 16px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; opacity: 0; transition: opacity .15s; z-index: 2; }
  .mlf-photo-cell.filled:hover .mlf-photo-del { opacity: 1; }
  .mlf-photo-del:hover { background: #dc2626 !important; }
  .mlf-photo-main-badge { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,.5); color: #fff; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
  .mlf-photo-zoom { position: absolute; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; pointer-events: none; }
  .mlf-photo-zoom-text { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: .04em; text-transform: uppercase; }
  .mlf-photo-cell.filled:hover .mlf-photo-zoom { opacity: 1; }

  /* form fields */
  .mlf-fields { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
  .mlf-field label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
  .mlf-field input, .mlf-field textarea, .mlf-field select {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 14px;
    font-size: 15px; font-family: inherit; color: #111; outline: none;
    background: #f3f4f6; transition: border-color .15s, box-shadow .15s, background .15s; box-sizing: border-box;
    appearance: none;
  }
  .mlf-field input:focus, .mlf-field textarea:focus, .mlf-field select:focus { background: #fff; }
  .mlf-field input:focus, .mlf-field textarea:focus, .mlf-field select:focus { border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08); }
  .mlf-field textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
  .mlf-field-hint { font-size: 12px; color: #aaa; margin-top: 5px; line-height: 1.4; }
  .mlf-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* char count */
  .mlf-field-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .mlf-field-top label { margin: 0; }
  .mlf-char { font-size: 12px; color: #bbb; }
  .mlf-char.warn { color: #f59e0b; }
  .mlf-char.over { color: #ef4444; }

  /* price block */
  .mlf-price-block { padding: 0 22px 22px; }
  .mlf-price-row { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; align-items: end; }
  .mlf-price-seg {
    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;
  }
  .mlf-price-seg button {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1.5px solid #e5e7eb;
    background: #f3f4f6;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: #4b5563;
    cursor: pointer;
    transition: border-color .15s, background .15s, color .15s, box-shadow .15s;
  }
  .mlf-price-seg button.on {
    border-color: #e8410a;
    background: #fff4ef;
    color: #c2410c;
    box-shadow: 0 0 0 1px rgba(232,65,10,.12);
  }
  .mlf-price-input-wrap { position: relative; }
  .mlf-price-input-wrap input { padding-right: 36px; }
  .mlf-price-rub {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 15px;
    font-weight: 700;
    color: #9ca3af;
    pointer-events: none;
  }
  .mlf-price-foot { font-size: 12px; color: #9ca3af; margin-top: 8px; line-height: 1.45; }

  .mlf-tips-panel {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(232,65,10,.22);
    background: linear-gradient(180deg, #fff7f0 0%, #fffdfb 100%);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mlf-tips-panel .mlf-tip { padding-left: 14px; color: #57534e; }
  .mlf-tips-panel .mlf-tip::before { content: '•'; color: #e8410a; font-size: 14px; top: 0; left: 0; }

  .mlf-cat-chip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
    margin-top: 4px;
  }
  .mlf-cat-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 76px;
    padding: 10px 8px;
    border-radius: 16px;
    border: 1.5px solid #e5e7eb;
    background: #f9fafb;
    cursor: pointer;
    font-family: inherit;
    transition: border-color .15s, background .15s, box-shadow .15s, transform .12s;
  }
  .mlf-cat-chip:hover { border-color: #fdba74; background: #fff7ed; }
  .mlf-cat-chip.on {
    border-color: #e8410a;
    background: linear-gradient(180deg, #fff4ef, #fff);
    box-shadow: 0 8px 26px rgba(232,65,10,.18);
    transform: translateY(-1px);
  }
  .mlf-cat-chip-ico { font-size: 22px; line-height: 1; }
  .mlf-cat-chip-name { font-size: 12px; font-weight: 800; color: #1f2937; text-align: center; line-height: 1.25; }
  .mlf-cat-chip.on .mlf-cat-chip-name { color: #9a3412; }

  /* предпросмотр */
  .mlf-preview-card { padding: 0 0 18px; overflow: hidden; }
  .mlf-preview-ph {
    position: relative;
    aspect-ratio: 16/10;
    background: linear-gradient(145deg, #f3f4f6, #e7e5e4);
    overflow: hidden;
  }
  .mlf-preview-ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .mlf-preview-tag {
    position: absolute;
    left: 10px;
    bottom: 10px;
    background: rgba(17,24,39,.82);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 5px 10px;
    border-radius: 999px;
    max-width: calc(100% - 20px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mlf-preview-body { padding: 14px 18px 0; }
  .mlf-preview-price { font-size: 20px; font-weight: 900; color: #111827; letter-spacing: -.02em; }
  .mlf-preview-title { font-size: 14px; font-weight: 700; color: #374151; margin-top: 8px; line-height: 1.35; }
  .mlf-preview-meta { font-size: 12px; color: #9ca3af; margin-top: 8px; font-weight: 600; }

  .mlf-btn-submit {
    width: 100%;
    padding: 16px 18px;
    background: #e8410a;
    border: none;
    border-radius: 16px;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background .15s;
  }
  .mlf-btn-submit-inner { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .mlf-btn-submit-sub { font-size: 12px; font-weight: 600; opacity: .92; }
  .mlf-btn-submit:hover { background: #c73208; }
  .mlf-btn-submit:disabled { background: #fca98e; cursor: not-allowed; }
  .mlf-btn-copy-outline {
    width: 100%; margin-top: 10px; padding: 11px; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
    color: #334155; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s;
  }
  .mlf-btn-copy-outline:hover { border-color: #e8410a; color: #c2410c; background: #fff7ed; }

  /* error */
  .mlf-error { background: #fff5f5; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #dc2626; margin-bottom: 12px; }

  /* sidebar */
  .mlf-sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 76px; }
  .mlf-form-shell .mlf-sb-card { border-radius: 22px; border: 1px solid rgba(0,0,0,.06); box-shadow: 0 4px 28px rgba(15,23,42,.06); }
  .mlf-sb-card { background: #fff; padding: 18px; border-radius: 20px; }
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

  /* lightbox */
  .mlf-lb { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.94); display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .mlf-lb-close { position: fixed; top: 18px; right: 18px; width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .mlf-lb-counter { position: fixed; top: 22px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,.15); color: #fff; font-size: 14px; font-weight: 700; padding: 6px 18px; border-radius: 20px; }
  .mlf-lb-btn { position: fixed; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2); color: #fff; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .mlf-lb-prev { left: 18px; }
  .mlf-lb-next { right: 18px; }

  /* skeletons */
  @keyframes mlsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .ml-sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: mlsk 1.4s infinite; border-radius: 6px; }

  /* adaptive */
  @media(max-width: 900px) {
    .mlf-wrap { grid-template-columns: 1fr; }
    .mlf-sidebar { position: static; }
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

export default function MyListingsPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [workerDeals, setWorkerDeals] = useState([]);
  const [workerStats, setWorkerStats] = useState(null);
  const [workerReviewDealId, setWorkerReviewDealId] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('active');
  const [detail,   setDetail]   = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [view,     setView]     = useState(null); // null | 'create' | {edit: listing}
  const [pickedSection, setPickedSection] = useState(null); // slug of chosen section
  const [hoverSectionSlug, setHoverSectionSlug] = useState(null); // превью фона шага «разделы»
  const [hoverCategoryName, setHoverCategoryName] = useState(null); // превью фона шага «категории»
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [priceKind, setPriceKind] = useState('fixed'); // 'fixed' | 'from' | 'negotiable'
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [lightbox, setLightbox] = useState(null); // { photos, index }
  const [isDragging, setIsDragging] = useState(false);
  const [copyFlashId, setCopyFlashId] = useState(null);
  const [listSearch, setListSearch] = useState('');
  const photoRef = useRef();
  const titleRef = useRef();

  const copyListingPublicLink = useCallback((listingId, e) => {
    e?.stopPropagation?.();
    const url = `${window.location.origin}/listings/${listingId}`;
    const done = () => {
      setCopyFlashId(listingId);
      window.setTimeout(() => setCopyFlashId((cur) => (cur === listingId ? null : cur)), 2200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => {
        try {
          const ta = document.createElement('textarea');
          ta.value = url;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        } catch { /* ignore */ }
      });
    } else {
      done();
    }
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [lr, dealsRaw, statsRaw] = await Promise.all([
        fetch(`${API}/workers/${userId}/listings`).then((r) => (r.ok ? r.json() : [])),
        getMyDeals(userId).catch(() => []),
        getWorkerStats(userId).catch(() => null),
      ]);
      const list = Array.isArray(lr) ? lr : [];
      setListings(list);
      const wd = (Array.isArray(dealsRaw) ? dealsRaw : []).filter(
        (d) => String(d.workerId) === String(userId),
      );
      setWorkerDeals(wd);
      setWorkerStats(statsRaw && typeof statsRaw === 'object' ? statsRaw : null);
      setDetail((prev) => {
        if (!prev) return null;
        return list.find((l) => l.id === prev.id) || prev;
      });
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useSameRouteRefetch('/my-listings', load);

  useEffect(() => {
    const onArchived = (ev) => {
      const lid = ev.detail?.listingId;
      if (lid == null) return;
      setListings((prev) => prev.map((l) => (String(l.id) === String(lid) ? { ...l, active: false, lockedAfterCompletedDeal: true } : l)));
      setDetail((prev) => (prev && String(prev.id) === String(lid) ? { ...prev, active: false, lockedAfterCompletedDeal: true } : prev));
    };
    window.addEventListener(LISTING_ARCHIVED_AFTER_DEAL, onArchived);
    return () => window.removeEventListener(LISTING_ARCHIVED_AFTER_DEAL, onArchived);
  }, []);

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

  const completedDealForListing = (listingId) =>
    workerDeals.find(
      (d) =>
        String(d.listingId || '') === String(listingId) &&
        d.status === 'COMPLETED',
    );

  const showWorkerReviewForListing = (listingId) => {
    const d = completedDealForListing(listingId);
    return !!(d && dealEligibleForReviews(d) && !d.hasWorkerReview);
  };

  const listingLockedAfterDeal = (l) => {
    if (!l) return false;
    if (l.lockedAfterCompletedDeal) return true;
    return !!completedDealForListing(l.id);
  };

  const active  = listings.filter(l => l.active && !listingLockedAfterDeal(l));
  const archive = listings.filter(l => !l.active || listingLockedAfterDeal(l));
  const shown   = tab === 'active' ? active : archive;

  const listSearchNorm = listSearch.trim().toLowerCase();
  const shownFiltered = useMemo(() => {
    if (!listSearchNorm) return shown;
    return shown.filter((l) => {
      const t = String(l.title || '').toLowerCase();
      const d = String(l.description || '').toLowerCase();
      const c = String(l.category || '').toLowerCase();
      return t.includes(listSearchNorm) || d.includes(listSearchNorm) || c.includes(listSearchNorm);
    });
  }, [shown, listSearchNorm]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setPriceKind('fixed');
    setFormErr('');
    setPickedSection(null);
    setHoverSectionSlug(null);
    setHoverCategoryName(null);
    setView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openEdit = (l, e) => {
    e?.stopPropagation();
    if (listingLockedAfterDeal(l)) return;
    setForm({ title: l.title, description: l.description || '', price: l.price, priceUnit: l.priceUnit || 'за работу', category: l.category || '', photos: (l.photos || []).map((p, i) => ({ id: i, data: p })) });
    setPriceKind(priceKindFromListing(l));
    setFormErr('');
    setView({ edit: l });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoUpload = useCallback(async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    const cur = form.photos?.length || 0;
    if (cur + arr.length > 5) { setFormErr(`Максимум 5 фото (уже ${cur})`); return; }
    const compressed = await Promise.all(arr.map(compressImage));
    setForm(p => ({ ...p, photos: [...(p.photos || []), ...compressed] }));
  }, [form.photos]);

  const removePhoto = (id, e) => {
    e?.stopPropagation();
    setForm(p => ({ ...p, photos: p.photos.filter(ph => ph.id !== id) }));
  };

  const handlePickCategory = (categoryName) => {
    setFormErr('');
    setHoverCategoryName(null);
    setForm(p => ({ ...p, category: categoryName }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { titleRef.current?.focus(); }, 150);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormErr('Укажите название объявления'); return; }
    if (!form.category)     { setFormErr('Выберите категорию'); return; }
    const negotiable = priceKind === 'negotiable';
    const numPrice = Number(form.price);
    if (!negotiable && (!form.price || !Number.isFinite(numPrice) || numPrice <= 0)) {
      setFormErr('Укажите цену (больше нуля)');
      return;
    }
    if (!userId) { setFormErr('Войдите в аккаунт и попробуйте снова.'); return; }
    const isEdit = view !== 'create';
    if (isEdit && listingLockedAfterDeal(view.edit)) {
      setFormErr('Объявление закрыто после завершённой сделки — редактирование недоступно.');
      return;
    }
    setSaving(true);
    setFormErr('');
    try {
      const payload = {
        title:       form.title.trim(),
        description: (form.description || '').trim(),
        price:       negotiable ? 0 : numPrice,
        priceUnit:   negotiable ? 'договорная' : priceKind === 'from' ? 'от' : (form.priceUnit || 'за работу'),
        category:    form.category,
        photos:      (form.photos || []).map(p => p.data).filter(Boolean),
      };
      const r = await fetch(isEdit ? `${API}/listings/${view.edit.id}` : `${API}/listings`, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body:    JSON.stringify(payload),
      });
      const raw = await r.text();
      if (r.ok) {
        setView(null);
        await load();
      } else {
        let msg = 'Не удалось сохранить. Попробуйте ещё раз.';
        try {
          const j = JSON.parse(raw);
          const candidate = j.message || j.error || j.detail || '';
          if (candidate && !/^internal server error$/i.test(String(candidate).trim())) {
            msg = humanizeServerErrorMessage(String(candidate));
          }
        } catch {
          if (raw && raw.length < 800 && !raw.trim().startsWith('<')) {
            msg = humanizeServerErrorMessage(raw.trim());
          }
        }
        if (r.status === 413) msg = 'Данные слишком большие. Уменьшите фото или уберите часть снимков.';
        setFormErr(msg);
      }
    } catch (e) {
      const m = e?.message || '';
      if (m === 'Failed to fetch') setFormErr('Нет соединения с сервером.');
      else setFormErr(humanizeServerErrorMessage(m));
    }
    setSaving(false);
  };

  const handleToggle = async (l, e) => {
    e?.stopPropagation();
    if (listingLockedAfterDeal(l)) return;
    if (l.active) {
      if (!window.confirm('Удалить объявление из каталога? Его не будет видно заказчикам. Вы сможете восстановить его из архива.')) return;
    }
    const newActive = !l.active;
    setListings(prev => prev.map(x => x.id === l.id ? {...x, active: newActive} : x));
    if (detail?.id === l.id) setDetail(prev => ({...prev, active: newActive}));
    try {
      if (l.active) {
        await fetch(`${API}/listings/${l.id}`, { method: 'DELETE', headers: {'X-User-Id': userId} });
      } else {
        await fetch(`${API}/listings/${l.id}/restore`, { method: 'POST', headers: {'X-User-Id': userId} });
      }
      await load();
    } catch {
      setListings(prev => prev.map(x => x.id === l.id ? {...x, active: l.active} : x));
      if (detail?.id === l.id) setDetail(prev => ({...prev, active: l.active}));
    }
  };

  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Мастер';
  const BACKEND  = 'https://svoi-mastera-backend.onrender.com';
  const ava      = userAvatar ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar) : null;

  const tips = CAT_TIPS[form.category] || [
    'Выберите понятное название — заказчики ищут по ключевым словам',
    'Добавьте фото работ — это главный фактор доверия',
    'Чем подробнее описание, тем больше откликов',
  ];

  // ══ ФОРМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ══
  if (view !== null) {
    const isEdit         = view !== 'create';
    const isSectionStep  = !isEdit && !form.category && !pickedSection;
    const isCatStep      = !isEdit && !form.category && !!pickedSection;
    const isFormStep     = isEdit || !!form.category;
    const photos   = form.photos || [];
    const descLen  = form.description.length;

    const chipSource = pickedSection ? (CATEGORIES_BY_SECTION[pickedSection] || []).map((c) => c.name).filter(Boolean) : [];
    const categoriesForChips = chipSource.length ? chipSource : CATEGORIES;
    const previewPhotoData = photos[0]?.data;
    const canSubmitForm = !!(form.title.trim() && form.category && (priceKind === 'negotiable' || (form.price && Number(form.price) > 0)));

    let heroSrc = DEFAULT_MY_LISTINGS_BG;
    if (isEdit && form.category) heroSrc = photoForCategoryName(form.category);
    else if (!isEdit) {
      if (isSectionStep) {
        const hs = hoverSectionSlug && SECTIONS.find(s => s.slug === hoverSectionSlug);
        heroSrc = hs?.photo || DEFAULT_MY_LISTINGS_BG;
      } else if (isCatStep) {
        const secPhoto = SECTIONS.find(s => s.slug === pickedSection)?.photo;
        heroSrc = hoverCategoryName
          ? photoForCategoryName(hoverCategoryName)
          : (secPhoto || DEFAULT_MY_LISTINGS_BG);
      } else if (form.category) {
        heroSrc = photoForCategoryName(form.category);
      }
    }

    const filledPhotos = photos.length;
    const draftProgress = isFormStep && !isEdit
      ? Math.min(100, Math.round(
        (form.title.trim() ? 25 : 0)
        + (form.description.length >= 30 ? 25 : Math.round((form.description.length / 30) * 25))
        + (priceKind === 'negotiable' || (form.price && Number(form.price) > 0) ? 25 : 0)
        + (filledPhotos > 0 ? 25 : 0),
      ))
      : 0;

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
                else if (isFormStep && !isEdit) { setHoverCategoryName(null); setForm(p => ({...p, category: ''})); setPickedSection(null); }
                else { setView(null); }
              }}
            >
              {isCatStep ? `← Все разделы` : isFormStep && !isEdit ? '← Выбор категории' : '← Мои объявления'}
            </button>
            {!isEdit && (
              <div className="nl-stepper">
                <span className={`nl-step ${isSectionStep ? 'active' : isCatStep || isFormStep ? 'done' : ''}`}>1 · Раздел</span>
                <span className={`nl-step ${isCatStep ? 'active' : isFormStep && !isCatStep && !isSectionStep ? 'done' : ''}`}>2 · Категория</span>
                <span className={`nl-step ${isFormStep && !isCatStep && !isSectionStep ? 'active' : ''}`}>3 · Объявление</span>
              </div>
            )}
            <h1 className="nl-h1">
              {isEdit ? 'Редактировать объявление' : isSectionStep ? 'Выберите раздел' : isCatStep ? pickedSection && SECTIONS.find(s=>s.slug===pickedSection)?.name : 'Новое объявление'}
            </h1>
            <p className="nl-sub">
              {isEdit
                ? 'Обновите данные и сохраните'
                : isSectionStep
                  ? 'Шаг 1 — выберите раздел услуги'
                  : isCatStep
                    ? 'Шаг 2 — выберите категорию, откроется форма'
                    : 'Шаг 3 — заполните детали и опубликуйте за минуту'}
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
              /* ── ШАГ 1: РАЗДЕЛЫ С ФОТО ── */
              (() => {
                const layout = ['mlf-sec-featured','mlf-sec-5','mlf-sec-5','mlf-sec-6','mlf-sec-6'];
                return (
                  <div
                    className="mlf-sec-grid"
                    onMouseLeave={() => setHoverSectionSlug(null)}
                  >
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
              /* ── ШАГ 2: КАТЕГОРИИ С ФОТО ── */
              (() => {
                const sec = SECTIONS.find(s => s.slug === pickedSection);
                const cats = CATEGORIES_BY_SECTION[pickedSection] || [];
                return (
                  <>
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
                  </>
                );
              })()
            ) : (
              <>
                <section className="nl-card">
                  <div className="nl-card-head">
                    <div>
                      <h2 className="nl-card-title">Фотографии</h2>
                      <p className="nl-card-sub">Объявления с фото получают в 5× больше откликов</p>
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
                      <h2 className="nl-card-title">Описание услуги</h2>
                    </div>
                  </div>
                  <label className="nl-label nl-label--tight">
                    <span>Название объявления <em>*</em></span>
                    <input
                      ref={titleRef}
                      className="nl-input"
                      value={form.title}
                      onChange={e => { setFormErr(''); setForm(p => ({...p, title: e.target.value})); }}
                      maxLength={MAX_TITLE}
                      placeholder="Например: ремонт ванной под ключ"
                    />
                    <small className="nl-help">
                      Коротко и конкретно
                      <span className={`nl-rt nl-char${form.title.length > MAX_TITLE * 0.9 ? form.title.length >= MAX_TITLE ? ' over' : ' warn' : ''}`}>{form.title.length}/{MAX_TITLE}</span>
                    </small>
                  </label>

                  <div className="nl-label">
                    <span>Категория <em>*</em></span>
                    {!isEdit ? (
                      <>
                        <div className="nl-cats">
                          {categoriesForChips.map((name) => (
                            <button
                              key={name}
                              type="button"
                              className={`nl-cat${form.category === name ? ' is-active' : ''}`}
                              onClick={() => { setFormErr(''); setForm((p) => ({ ...p, category: name })); }}
                            >
                              <span className="nl-cat-emoji" aria-hidden>{categoryEmoji(name)}</span>
                              {name}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="nl-change-cat"
                          onClick={() => { setForm((p) => ({ ...p, category: '' })); setPickedSection(null); }}
                        >
                          ← Выбрать другую категорию из каталога
                        </button>
                      </>
                    ) : (
                      <select
                        className="nl-input"
                        value={form.category}
                        style={{ marginTop: 8 }}
                        onChange={e => { setFormErr(''); setForm(p => ({...p, category: e.target.value})); }}
                      >
                        <option value="">Выберите категорию</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>

                  <label className="nl-label">
                    <span>Подробное описание</span>
                    <textarea
                      className="nl-textarea"
                      value={form.description}
                      onChange={e => setForm(p => ({...p, description: e.target.value}))}
                      maxLength={MAX_DESC}
                      rows={6}
                      placeholder="Опишите опыт, сроки, что входит в стоимость…"
                    />
                    <small className="nl-help">
                      <span />
                      <span className={`nl-rt nl-char${descLen > MAX_DESC * 0.9 ? descLen >= MAX_DESC ? ' over' : ' warn' : ''}`}>{descLen}/{MAX_DESC}</span>
                    </small>
                  </label>
                  {tips.length > 0 && (
                    <div className="nl-tips">
                      {tips.map((t, i) => (
                        <div key={i} className="nl-tip">{t}</div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="nl-card">
                  <div className="nl-card-head">
                    <div>
                      <h2 className="nl-card-title">Цена на услугу</h2>
                    </div>
                  </div>
                  <div className="nl-segmented" role="group" aria-label="Тип цены">
                    <button
                      type="button"
                      className={`nl-seg${priceKind === 'fixed' ? ' is-active' : ''}`}
                      onClick={() => {
                        setPriceKind('fixed');
                        setFormErr('');
                        setForm((p) => ({ ...p, priceUnit: 'за работу' }));
                      }}
                    >
                      Фиксированная
                    </button>
                    <button
                      type="button"
                      className={`nl-seg${priceKind === 'from' ? ' is-active' : ''}`}
                      onClick={() => {
                        setPriceKind('from');
                        setFormErr('');
                        setForm((p) => ({ ...p, priceUnit: 'от' }));
                      }}
                    >
                      От …
                    </button>
                    <button
                      type="button"
                      className={`nl-seg${priceKind === 'negotiable' ? ' is-active' : ''}`}
                      onClick={() => {
                        setPriceKind('negotiable');
                        setFormErr('');
                        setForm((p) => ({ ...p, price: '', priceUnit: 'договорная' }));
                      }}
                    >
                      Договорная
                    </button>
                  </div>
                  {priceKind !== 'negotiable' ? (
                    <label className="nl-label nl-label--tight">
                      <span>Стоимость, ₽ <em>*</em></span>
                      <div className="nl-price-input">
                        <input
                          className="nl-input"
                          type="number"
                          min="1"
                          value={form.price}
                          onChange={e => { setFormErr(''); setForm(p => ({...p, price: e.target.value})); }}
                        />
                        <span className="nl-price-suffix">₽</span>
                      </div>
                      <small className="nl-help">
                        Заказчик увидит эту цену в карточке
                        <span />
                      </small>
                    </label>
                  ) : (
                    <div className="nl-negot">
                      Цена обсуждается с заказчиком в чате после отклика.
                    </div>
                  )}
                  {priceKind !== 'negotiable' && form.price && Number(form.price) > 0 ? (
                    <div className="nl-price-hint nl-price-hint--ok">
                      <strong>В объявлении:</strong>{' '}
                      {Number(form.price).toLocaleString('ru-RU')} ₽
                      {priceKind === 'from' ? ' · пометка «от»' : ''}
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>Заказчики видят эту цену при поиске.</div>
                    </div>
                  ) : null}
                  {priceKind !== 'negotiable' && (!form.price || Number(form.price) <= 0) ? (
                    <div className="nl-price-hint nl-price-hint--muted">Укажите стоимость — она попадёт в объявление</div>
                  ) : null}

                  <button
                    type="button"
                    className="nl-publish"
                    disabled={saving || !canSubmitForm}
                    onClick={handleSave}
                  >
                    <span>
                      {saving
                        ? 'Сохраняем…'
                        : isEdit
                          ? 'Сохранить изменения'
                          : 'Опубликовать объявление'}
                    </span>
                    {!saving && (
                      <small>
                        {isEdit ? 'Изменения сразу увидят заказчики' : 'Размещение бесплатно · Заказчики увидят сразу'}
                      </small>
                    )}
                  </button>
                  {isEdit && view?.edit?.id && (
                    <button
                      type="button"
                      className="nl-btn-outline"
                      onClick={(e) => copyListingPublicLink(view.edit.id, e)}
                    >
                      {copyFlashId === view.edit.id ? '✓ Ссылка скопирована' : 'Копировать ссылку на объявление'}
                    </button>
                  )}
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
                    {form.category ? <span className="nl-preview-cat">{form.category}</span> : null}
                  </div>
                  <div className="nl-preview-body">
                    <div className="nl-preview-price">
                      {priceKind === 'negotiable' ? (
                        <span className="muted">Договорная</span>
                      ) : form.price && Number(form.price) > 0 ? (
                        <>
                          {priceKind === 'from' && <span className="from">от</span>}
                          {Number(form.price).toLocaleString('ru-RU')} ₽
                        </>
                      ) : (
                        <span className="muted">Цена</span>
                      )}
                    </div>
                    <div className="nl-preview-title">
                      {form.title.trim() || 'Название вашего объявления'}
                    </div>
                    <div className="nl-preview-meta">
                      <span>★ {isEdit ? 'Редактирование' : 'Новое'}</span>
                      <span>· Ваш регион</span>
                    </div>
                  </div>
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
                  ['Разместите объявление', 'Опишите услугу и укажите цену — заказчики сразу его увидят'],
                  ['Получайте заявки', 'Заказчики откликаются или пишут вам напрямую в чат'],
                  ['Согласуйте детали', 'Обсудите объём работ и окончательную цену'],
                  ['Получите оплату', 'Заказчик оплачивает напрямую — наличными или переводом после работы'],
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
                  ['Чат с заказчиком', 'Детали и оплата — в личных сообщениях, без посредников'],
                  ['Отзывы и рейтинг', 'Честные отзывы — только от реальных заказчиков'],
                  ['Прямой чат', 'Общайтесь с заказчиком без посредников'],
                ].map(([title, desc]) => (
                  <li key={title}>
                    <b>{title}</b>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {form.category && tips.length > 0 && (
              <div className="nl-side-card">
                <div className="nl-side-card-head">
                  <span className="nl-side-icon" aria-hidden>💡</span>
                  <h3>Советы для «{form.category}»</h3>
                </div>
                <div className="nl-tips">
                  {tips.map((t, i) => (
                    <div key={i} className="nl-tip">{t}</div>
                  ))}
                </div>
              </div>
            )}
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

  // ══ ДЕТАЛЬНАЯ СТРАНИЦА (как карточка объявления / ed--listing-detail) ══
  if (detail) {
    const lockedDeal = listingLockedAfterDeal(detail);
    const statusPill = listingOwnerDetailStatusPill(detail, lockedDeal);
    const catLabel = detail.category || '';
    const detailPlaceholder = getCategoryPlaceholderPhotoUrlOrDefault({ category: detail.category });
    const jdPhotosRaw = (detail.photos || []).map((p) => mlDetailPhotoUrl(p, BACKEND)).filter(Boolean);
    const jdPhotos = jdPhotosRaw.length ? jdPhotosRaw : [detailPlaceholder];
    const mainSrc = jdPhotos[photoIdx] || jdPhotos[0];
    const pubPrice = getListingPublishedPriceNumber(detail);
    const priceNegotiable = String(detail.priceUnit || '').toLowerCase().includes('договор') || pubPrice == null;
    const addressLine = detail.address || 'Йошкар-Ола · выезд по договорённости';
    const cityGuess = addressLine.includes('·')
      ? addressLine.split('·')[0].trim()
      : (addressLine.includes(',') ? addressLine.split(',')[0].trim() : addressLine);
    const viewsCount = getListingViewsCount(detail);
    const { bodyText, urgencyLabel } = parseListingDescription(detail.description || '');
    const showDescCard = !!(bodyText && String(bodyText).trim());
    const photoCount = jdPhotos.length;
    const hasMultiplePhotos = photoCount > 1;
    const ratingVal = Number(workerStats?.averageRating) || 0;
    const reviewsCount = Number(workerStats?.reviewsCount) || 0;
    const completedCount = Number(workerStats?.completedWorksCount)
      || workerDeals.filter((d) => d.status === 'COMPLETED').length;
    const listingDealsCount = workerDeals.filter(
      (d) => String(d.listingId || '') === String(detail.id),
    ).length;
    const ordersStat = listingDealsCount > 0 ? listingDealsCount : completedCount;
    const ratingDisplay = ratingVal > 0 ? ratingVal.toFixed(1) : '—';
    const priceUnitRaw = String(detail.priceUnit || 'за работу').trim();
    const priceUnitShort = priceUnitRaw.toLowerCase().startsWith('от')
      ? 'от'
      : priceUnitRaw;

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
            Мои объявления
          </button>

          <div className="ed-head">
            <div className="ed-head-left" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1>{detail.title || 'Объявление'}</h1>
              </div>
              <div className="ed-listing-meta">
                {catLabel ? (
                  <span>
                    {dealCategoryEmoji(catLabel)} {catLabel}
                  </span>
                ) : null}
                {addressLine ? <span>📍 {addressLine}</span> : null}
                {detail.createdAt ? <span>📅 {mlDetailFmtDateLong(detail.createdAt)}</span> : null}
              </div>
            </div>
            <div className="ed-head-right">
              <FavoriteHeartButton kind="listing" id={detail.id} className="ulc-fav-heart ed-fav" />
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
                      {dealCategoryEmoji(catLabel)}
                    </div>
                  )}
                  <div className="ed-floats">
                    <div className="ed-chip">
                      <span className="pulse" style={{ background: statusPill.dot, boxShadow: statusPill.shadow }} />
                      <span className="ed-chip-text">{statusPill.label}</span>
                    </div>
                    {catLabel ? (
                      <div className="ed-chip">
                        <span className="ed-chip-text">
                          {dealCategoryEmoji(catLabel)} {catLabel}
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
                  <p className="ed-desc">{bodyText}</p>
                  {urgencyLabel ? (
                    <p className="ed-desc" style={{ marginTop: 14, color: '#c2410c', fontWeight: 600 }}>
                      <b>Срочность:</b> {urgencyLabel}
                    </p>
                  ) : null}
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
                    catLabel && ['Категория', catLabel],
                    ['Город', cityGuess || '—'],
                    addressLine && ['Адрес', addressLine],
                    [
                      'Стоимость',
                      priceNegotiable
                        ? 'Договорная'
                        : `${Number(pubPrice).toLocaleString('ru-RU')} ₽${detail.priceUnit ? ` ${detail.priceUnit}` : ''}`,
                    ],
                    detail.createdAt && ['Опубликована', mlDetailTimeAgo(detail.createdAt) || mlDetailFmtDateLong(detail.createdAt)],
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

            <aside className="ed-side ed-side--listing-cabinet">
              <div className="ml-side-panel">
                <div className="ml-side-stats">
                  <div className="ml-side-stat">
                    <span className="ml-side-stat-value">{ordersStat}</span>
                    <span className="ml-side-stat-label">заказов</span>
                  </div>
                  <div className="ml-side-stat">
                    <span className="ml-side-stat-value">{reviewsCount}</span>
                    <span className="ml-side-stat-label">отзывов</span>
                  </div>
                  <div className="ml-side-stat">
                    <span className="ml-side-stat-value ml-side-stat-value--rating">{ratingDisplay}</span>
                    <span className="ml-side-stat-label">рейтинг</span>
                  </div>
                </div>

                <div className="ml-side-price ed-card">
                  <div className="ml-side-price-eyebrow">Стоимость</div>
                  {!priceNegotiable && pubPrice != null ? (
                    <>
                      <div className="ml-side-price-num">
                        {Number(pubPrice).toLocaleString('ru-RU')}
                        <span className="ml-side-price-currency"> ₽</span>
                      </div>
                      <span className="ml-side-price-unit">{priceUnitShort}</span>
                    </>
                  ) : (
                    <div className="ml-side-price-num ml-side-price-num--nego">Договорная</div>
                  )}
                </div>

                {!lockedDeal && (
                  <div className="ml-side-actions">
                    <button type="button" className="ml-side-btn-edit" onClick={() => openEdit(detail)}>
                      Редактировать
                    </button>
                    <div className="ml-side-actions-row">
                      <button
                        type="button"
                        className={`ml-side-btn-link${copyFlashId === detail.id ? ' copied' : ''}`}
                        onClick={(e) => copyListingPublicLink(detail.id, e)}
                      >
                        {copyFlashId === detail.id ? 'Скопировано' : 'Ссылка'}
                      </button>
                      <button
                        type="button"
                        className="ml-side-btn-archive"
                        onClick={(e) => handleToggle(detail, e)}
                      >
                        {detail.active ? 'В архив' : 'Восстановить'}
                      </button>
                    </div>
                  </div>
                )}

                {showWorkerReviewForListing(detail.id) && (
                  <button
                    type="button"
                    className="ml-btn-review-customer"
                    style={{ width: '100%' }}
                    onClick={() => {
                      const d = completedDealForListing(detail.id);
                      if (d) setWorkerReviewDealId(d.id);
                    }}
                  >
                    Отзыв о заказчике
                  </button>
                )}
              </div>

              <div className="ed-card">
                <div className="ed-eyebrow ed-eyebrow--block">Ваш профиль</div>
                <div
                  className="ed-cust-row ed-cust-row-static"
                  onClick={() => navigate(userId ? `/workers/${userId}` : '/worker-profile')}
                  role="presentation"
                >
                  <div className="ed-ava">
                    {ava ? <img src={ava} alt={fullName} /> : (
                      <div className="ed-ava-fallback neutral">{(userName || 'М')[0].toUpperCase()}</div>
                    )}
                  </div>
                  <div className="ed-cust-info">
                    <div className="ed-cust-name">{fullName}</div>
                    <div className="ed-cust-meta">Мастер</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <WorkerReviewDealModal
          dealId={workerReviewDealId}
          onClose={() => setWorkerReviewDealId(null)}
          onReload={load}
        />
      </div>
    );
  }

  // ══ СПИСОК ══
  return (
    <div className="ml-page ml-list-shell mo-orders-root mo-page mo-listings-cabinet">
      <style>{css}</style>

      <header className="mo-hero">
        <img src={MY_LISTINGS_MO_HERO_PHOTO} alt="" />
        <div className="mo-hero-inner">
          <div>
            <h1>Мои объявления</h1>
            <p>Управляйте своими услугами и откликами</p>
          </div>
          <button type="button" className="mo-cta" onClick={openCreate}>+ Разместить объявление</button>
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
              placeholder="Поиск по объявлениям…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {loading ? (
          <div className="mo-grid listing-grid">
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
            <div className="mo-empty-title">{tab === 'active' ? 'Нет активных объявлений' : 'Архив пуст'}</div>
            <div className="mo-empty-sub">
              {tab === 'active' ? 'Разместите объявление, чтобы заказчики могли вас найти' : 'Завершённые по сделке объявления и снятые вручную с публикации. После завершённой сделки восстановить объявление нельзя — создайте новое.'}
            </div>
            {tab === 'active' && (
              <div className="mo-empty-actions">
                <button type="button" className="mo-cta" onClick={openCreate}>+ Разместить объявление</button>
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
          <div className="mo-grid listing-grid">
            {shownFiltered.map((l) => {
              const catName = l.category || '';
              const categoryPhoto = getCategoryPlaceholderPhotoUrlOrDefault({ category: l.category });
              const thumbSrc = l.photos?.length ? l.photos[0] : categoryPhoto;
              const desc = (l.description && String(l.description).trim()) ? l.description : '';
              const locked = listingLockedAfterDeal(l);
              const statusOpen = !!(l.active && !locked);
              const pillClass = statusOpen ? 'open' : 'neutral';
              const stPillLabel = locked
                ? 'Завершено'
                : (l.active ? 'В каталоге' : 'В архиве');
              const priceNum = getListingPublishedPriceNumber(l);
              const negotiable =
                priceKindFromListing(l) === 'negotiable' || priceNum == null;
              const openDetail = () => {
                setDetail(l);
                setPhotoIdx(0);
              };
              const priceOnImg = negotiable
                ? 'Договорная'
                : `${Number(priceNum).toLocaleString('ru-RU')} ₽ ${l.priceUnit || 'за работу'}`;
              const canEdit = !locked && l.active;
              const onEdit = (e) => {
                e.stopPropagation();
                if (canEdit) openEdit(l, e);
                else openDetail();
              };
              const showArchiveBtn = !locked;
              const ratingVal = Number(workerStats?.averageRating) || 0;
              const reviewsCount = Number(workerStats?.reviewsCount) || 0;
              const completedCount = Number(workerStats?.completedWorksCount)
                || workerDeals.filter((d) => d.status === 'COMPLETED').length;
              const ratingDisplay = ratingVal > 0 ? ratingVal.toFixed(1) : '—';

              return (
                <article
                  key={l.id}
                  className="mo-card"
                  role="button"
                  tabIndex={0}
                  onClick={openDetail}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetail();
                    }
                  }}
                >
                  <div className="mo-card-media">
                    <img src={thumbSrc} alt="" />
                    <span className={`mo-card-status-on-img ${pillClass}`}>{stPillLabel}</span>
                    <div className="mo-card-price-on-img">{priceOnImg}</div>
                  </div>

                  <div className="mo-card-content">
                    <div className="mo-card-headline">
                      <h3 className="mo-card-title">{l.title}</h3>
                      <time className="mo-card-time">{formatListingRelativeRu(l.createdAt)}</time>
                    </div>
                    {!!catName && (
                      <div className="mo-card-tags">
                        <span className="mo-tag mo-tag-cat">{catName}</span>
                      </div>
                    )}
                    {!!desc && <p className="mo-card-desc">{desc}</p>}
                    <p className="mo-card-stats">
                      <span className="mo-card-stats-rating-wrap">
                        <span className="mo-card-stats-star" aria-hidden>★</span>
                        <span className="mo-card-stats-rating">{ratingDisplay}</span>
                      </span>
                      <span className="mo-card-stats-muted">отзывов: {reviewsCount}</span>
                      <span className="mo-card-stats-muted">{completedCount} выполнено</span>
                    </p>
                    {statusOpen && (
                      <p className="mo-card-hint">
                        <span className="mo-card-hint-sub">Объявление в каталоге — ждём заказчиков</span>
                      </p>
                    )}
                  </div>

                  <div className="mo-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="mo-btn mo-btn-primary" onClick={onEdit}>
                      {canEdit ? 'Редактировать' : 'Открыть'}
                    </button>
                    {showArchiveBtn ? (
                      <button
                        type="button"
                        className="mo-btn mo-btn-secondary mo-btn-archive"
                        onClick={(e) => handleToggle(l, e)}
                      >
                        {l.active ? 'В архив' : 'Восстановить'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mo-btn mo-btn-secondary"
                        onClick={(e) => { e.stopPropagation(); openDetail(); }}
                      >
                        Подробнее
                      </button>
                    )}
                  </div>

                  <div className="mo-card-tools" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="mo-card-tool"
                      onClick={(e) => copyListingPublicLink(l.id, e)}
                    >
                      {copyFlashId === l.id ? 'Ссылка скопирована' : 'Копировать ссылку'}
                    </button>
                    {showArchiveBtn && (
                      <button type="button" className="mo-card-tool" onClick={(e) => handleToggle(l, e)}>
                        {l.active ? 'Снять с публикации' : 'Восстановить'}
                      </button>
                    )}
                    {showWorkerReviewForListing(l.id) && (
                      <button
                        type="button"
                        className="mo-card-tool"
                        onClick={(e) => {
                          e.stopPropagation();
                          const d = completedDealForListing(l.id);
                          if (d) setWorkerReviewDealId(d.id);
                        }}
                      >
                        Отзыв о заказчике
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <WorkerReviewDealModal
        dealId={workerReviewDealId}
        onClose={() => setWorkerReviewDealId(null)}
        onReload={load}
      />
    </div>
  );
}
