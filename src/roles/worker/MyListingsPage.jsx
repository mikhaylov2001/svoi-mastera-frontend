import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ListingInfoPanels from '../../components/ListingInfoPanels';
import { SECTIONS } from '../../pages/SectionsPage';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const CATEGORIES = [
  'Ремонт квартир','Сантехника','Электрика','Компьютерная помощь',
  'Уборка','Парикмахер','Маникюр и педикюр','Красота и здоровье',
  'Репетиторство','Грузоперевозки','Сварочные работы','Другое',
];
const PRICE_UNITS = ['за работу','за час','за день','договорная'];
const EMPTY_FORM  = { title:'', description:'', price:'', priceUnit:'за работу', category:'', photos:[] };
const MAX_DESC    = 2000;

const DEFAULT_MY_LISTINGS_BG = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80';

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

function pluralViews(n) {
  const a = Math.abs(Number(n)) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'просмотров';
  if (b > 1 && b < 5) return 'просмотра';
  if (b === 1) return 'просмотр';
  return 'просмотров';
}

function pluralNewDeals(n) {
  const a = Math.abs(Number(n)) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'новых заявок';
  if (b > 1 && b < 5) return 'новые заявки';
  if (b === 1) return 'новая заявка';
  return 'новых заявок';
}

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 900;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else       { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ id: Date.now() + Math.random(), data: canvas.toDataURL('image/jpeg', 0.85) });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ══ CSS ══ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  /* ── GENERAL ── */
  .ml-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  /* ── СПИСОК: hero-баннер + чистый фон ── */
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

  /* ── TABS ── */
  .ml-tabs { display: flex; gap: 6px; padding: 4px; background: rgba(255,255,255,.85); border: 1px solid #e8e8e8; border-radius: 12px; margin-bottom: 14px; width: fit-content; }
  .ml-tab { background: none; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; font-family: inherit; transition: all .15s; }
  .ml-tab.on { color: #fff; background: #e8410a; box-shadow: 0 2px 8px rgba(232,65,10,.25); }
  .ml-tab-n { font-size: 11px; background: rgba(0,0,0,.06); border-radius: 8px; padding: 1px 6px; margin-left: 5px; color: #6b7280; }
  .ml-tab.on .ml-tab-n { background: rgba(255,255,255,.22); color: #fff; }

  /* ── LIST (карточки) ── */
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
  .ml-row-body { flex: 1; padding: 16px 18px; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .ml-row-title { font-size: 16px; font-weight: 800; color: #111827; margin: 0 0 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .ml-row-price { font-size: 19px; font-weight: 800; margin-bottom: 6px; color: #1a1a1a; }
  .ml-row-unit { font-size: 12px; color: #8f8f8f; font-weight: 500; margin-left: 4px; }
  .ml-row-cat { display: inline-block; font-size: 11px; color: #fff; background: #e8410a; border-radius: 6px; padding: 3px 10px; margin-bottom: 6px; font-weight: 700; }
  .ml-row-desc { font-size: 13px; color: #6b7280; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 6px; line-height: 1.45; }
  .ml-row-date { font-size: 12px; color: #9ca3af; }
  .ml-row-stats { width: 200px; flex-shrink: 0; padding: 16px 14px; display: flex; flex-direction: column; gap: 8px; justify-content: center; border-left: 1px solid #f0f0f0; background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%); }
  .ml-row-stat { font-size: 12px; color: #6b7280; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; line-height: 1.35; }
  .ml-row-stat-num { font-weight: 800; color: #111827; font-variant-numeric: tabular-nums; font-size: 15px; }
  .ml-row-stat-hint { font-size: 10px; color: #9ca3af; width: 100%; margin-top: -2px; padding-left: 22px; line-height: 1.3; }
  .ml-row-actions { width: 178px; flex-shrink: 0; padding: 14px 12px; display: flex; flex-direction: column; gap: 8px; justify-content: center; border-left: 1px solid #f0f0f0; }
  .ml-btn-copy {
    width: 100%; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 8px 6px;
    font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; font-family: inherit; transition: all .15s;
  }
  .ml-btn-copy:hover { border-color: #e8410a; color: #e8410a; background: #fff7ed; }
  .ml-link-preview {
    font-size: 12px; font-weight: 600; color: #e8410a; text-align: center;
    text-decoration: none; padding: 4px 0; font-family: inherit;
    border-bottom: 1px solid transparent; transition: opacity .15s;
  }
  .ml-link-preview:hover { opacity: .85; border-bottom-color: rgba(232,65,10,.35); }
  .ml-btn-edit { background: #fff; border: 1.5px solid #d6d6d6; border-radius: 10px; padding: 10px 0; font-size: 13px; font-weight: 600; color: #333; cursor: pointer; width: 100%; font-family: inherit; transition: all .15s; }
  .ml-btn-edit:hover { border-color: #e8410a; color: #e8410a; }
  .ml-btn-arch { background: none; border: none; font-size: 12px; color: #8f8f8f; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; text-align: center; font-family: inherit; }
  .ml-btn-arch:hover { color: #e8410a; }
  .ml-btn-restore { background: none; border: none; font-size: 12px; color: #e8410a; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; text-align: center; font-family: inherit; }
  .ml-empty {
    text-align: center; padding: 72px 24px;
    background: rgba(255,255,255,.95); border: 1.5px solid #e8e8e8; border-radius: 16px;
    color: #8f8f8f; box-shadow: 0 4px 20px rgba(0,0,0,.05);
  }

  /* ── DETAIL ── */
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
  .ml-detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .ml-detail-row:last-child { border-bottom: none; }
  .ml-tag { display: inline-block; background: #fde8e0; color: #e8410a; border-radius: 20px; font-size: 12px; font-weight: 700; padding: 4px 12px; }

  /* ══ ФОРМА СТРАНИЦА ══ */
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
  .mlf-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; margin-bottom: 12px; overflow: hidden; }
  .mlf-card-title { font-size: 16px; font-weight: 700; color: #111; padding: 18px 20px 0; margin-bottom: 16px; }

  /* photo grid */
  .mlf-photos { padding: 18px 20px 20px; }
  .mlf-photo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .mlf-photo-cell { aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative; border: 1.5px dashed #d0d0d0; background: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; }
  .mlf-photo-cell:hover { border-color: #e8410a; background: #fff5f2; }
  .mlf-photo-cell.filled { border: none; cursor: zoom-in; }
  .mlf-photo-cell.main-photo { grid-column: span 2; grid-row: span 2; }
  .mlf-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .mlf-photo-cell.filled:hover .mlf-photo-img { transform: scale(1.05); }
  .mlf-photo-add-icon { font-size: 28px; opacity: .5; }
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
    width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px;
    font-size: 15px; font-family: Inter, Arial, sans-serif; color: #111; outline: none;
    background: #fff; transition: border-color .15s, box-shadow .15s; box-sizing: border-box;
    appearance: none;
  }
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
  .mlf-price-block { padding: 18px 20px 20px; }
  .mlf-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; align-items: end; }

  /* submit */
  .mlf-submit-card { padding: 20px; }
  .mlf-btn-submit { width: 100%; padding: 15px; background: #e8410a; border: none; border-radius: 10px; color: #fff; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background .15s; }
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
    .ml-row-stats, .ml-row-actions { display: none; }
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
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('active');
  const [detail,   setDetail]   = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [view,     setView]     = useState(null); // null | 'create' | {edit: listing}
  const [pickedSection, setPickedSection] = useState(null); // slug of chosen section
  const [hoverSectionSlug, setHoverSectionSlug] = useState(null); // превью фона шага «разделы»
  const [hoverCategoryName, setHoverCategoryName] = useState(null); // превью фона шага «категории»
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [lightbox, setLightbox] = useState(null); // { photos, index }
  const [isDragging, setIsDragging] = useState(false);
  const [copyFlashId, setCopyFlashId] = useState(null);
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

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/workers/${userId}/listings`);
      if (r.ok) {
        const data = await r.json();
        setListings(data);
        setDetail(prev => {
          if (!prev) return null;
          return data.find(l => l.id === prev.id) || prev;
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

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

  const active  = listings.filter(l => l.active);
  const archive = listings.filter(l => !l.active);
  const shown   = tab === 'active' ? active : archive;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErr('');
    setPickedSection(null);
    setHoverSectionSlug(null);
    setHoverCategoryName(null);
    setView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openEdit = (l, e) => {
    e?.stopPropagation();
    setForm({ title: l.title, description: l.description || '', price: l.price, priceUnit: l.priceUnit || 'за работу', category: l.category || '', photos: (l.photos || []).map((p, i) => ({ id: i, data: p })) });
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
    if (!form.price || Number(form.price) <= 0) { setFormErr('Укажите цену (больше нуля)'); return; }
    setSaving(true);
    setFormErr('');
    try {
      const isEdit = view !== 'create';
      const payload = {
        title: form.title.trim(),
        description: (form.description || '').trim(),
        price: Number(form.price),
        priceUnit: form.priceUnit,
        category: form.category,
        photos: (form.photos && form.photos.length > 0) ? form.photos.map(p => p.data) : [],
      };
      const r = await fetch(isEdit ? `${API}/listings/${view.edit.id}` : `${API}/listings`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload),
      });
      const raw = await r.text();
      if (r.ok) {
        setView(null);
        await load();
      } else {
        let msg = 'Не удалось сохранить. Попробуйте ещё раз.';
        try {
          const j = JSON.parse(raw);
          if (j.message) msg = String(j.message);
          else if (j.error) msg = String(j.error);
        } catch {
          if (raw && raw.length < 400 && !raw.trim().startsWith('<')) msg = raw.trim();
        }
        if (r.status === 413) msg = 'Данные слишком большие (часто из‑за фото). Добавьте меньше или более сжатые снимки.';
        if (r.status === 400 && payload.photos.length === 0) msg = msg || 'Проверьте обязательные поля.';
        setFormErr(msg);
      }
    } catch {
      setFormErr('Ошибка сети. Проверьте соединение.');
    }
    setSaving(false);
  };

  const handleToggle = async (l, e) => {
    e?.stopPropagation();
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

    let createHeroSrc = DEFAULT_MY_LISTINGS_BG;
    if (isEdit && form.category) createHeroSrc = photoForCategoryName(form.category);
    else if (!isEdit) {
      if (isSectionStep) {
        const hs = hoverSectionSlug && SECTIONS.find(s => s.slug === hoverSectionSlug);
        createHeroSrc = hs?.photo || DEFAULT_MY_LISTINGS_BG;
      } else if (isCatStep) {
        const secPhoto = SECTIONS.find(s => s.slug === pickedSection)?.photo;
        createHeroSrc = hoverCategoryName
          ? photoForCategoryName(hoverCategoryName)
          : (secPhoto || DEFAULT_MY_LISTINGS_BG);
      } else if (form.category) {
        createHeroSrc = photoForCategoryName(form.category);
      }
    }

    return (
      <div className="ml-page">
        <style>{css}</style>

        {/* Hero */}
        <div className="mlf-hero">
          <img src={createHeroSrc} alt="" className="mlf-hero-img" />
          <div className="mlf-hero-overlay" />
          <div className="mlf-hero-body">
            <button className="mlf-hero-back" onClick={() => {
              if (isCatStep) { setHoverCategoryName(null); setPickedSection(null); }
              else if (isFormStep && !isEdit) { setHoverCategoryName(null); setForm(p => ({...p, category: ''})); setPickedSection(null); }
              else { setView(null); }
            }}>
              {isCatStep ? `← Все разделы` : isFormStep && !isEdit ? '← Выбор категории' : '← Мои объявления'}
            </button>
            <h1 className="mlf-hero-title">
              {isEdit ? 'Редактировать объявление' : isSectionStep ? 'Выберите раздел' : isCatStep ? pickedSection && SECTIONS.find(s=>s.slug===pickedSection)?.name : 'Новое объявление'}
            </h1>
            <p className="mlf-hero-sub">
              {isEdit
                ? 'Обновите данные и сохраните'
                : isSectionStep
                  ? 'Шаг 1 — выберите раздел услуги'
                  : isCatStep
                    ? 'Шаг 2 — выберите категорию, откроется форма'
                    : 'Шаг 3 — заполните объявление и опубликуйте'}
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
                <span className={`mlf-step-pill${isFormStep ? ' on' : ''}`}>3. Объявление</span>
              </div>
            )}

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

                {/* ── 2. ОПИСАНИЕ УСЛУГИ ── */}
                <div className="mlf-card">
                  <div className="mlf-card-title">Описание услуги</div>
                  <div className="mlf-fields">
                    <div className="mlf-field">
                      <label>Название объявления *</label>
                      <input
                        ref={titleRef}
                        value={form.title}
                        onChange={e => { setFormErr(''); setForm(p => ({...p, title: e.target.value})); }}
                        maxLength={120}
                      />
                      <span className="mlf-field-hint">Коротко и конкретно — что вы делаете</span>
                    </div>

                    <div className="mlf-field">
                      <label>Категория *</label>
                      <div className="mlf-selected-cat">
                        <b>{form.category}</b>
                        {!isEdit && (
                          <button type="button" className="mlf-change-cat" onClick={() => setForm(p => ({...p, category: ''}))}>
                            Сменить
                          </button>
                        )}
                      </div>
                      {isEdit && (
                        <select
                          value={form.category}
                          style={{ marginTop: 8 }}
                          onChange={e => { setFormErr(''); setForm(p => ({...p, category: e.target.value})); }}
                        >
                          <option value="">Выберите категорию</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                      {tips.length > 0 && (
                        <div className="mlf-tips" style={{marginTop: 8}}>
                          {tips.map((t, i) => <span key={i} className="mlf-tip">{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 3. ЦЕНА ── */}
                <div className="mlf-card">
                  <div className="mlf-card-title">Цена на услугу</div>
                  <div className="mlf-price-block">
                    <div className="mlf-price-row">
                      <div className="mlf-field" style={{margin: 0}}>
                        <label>Стоимость, ₽ *</label>
                        <input
                          type="number"
                          min="1"
                          value={form.price}
                          onChange={e => { setFormErr(''); setForm(p => ({...p, price: e.target.value})); }}
                        />
                      </div>
                      <div className="mlf-field" style={{margin: 0}}>
                        <label>Единица</label>
                        <select
                          value={form.priceUnit}
                          onChange={e => setForm(p => ({...p, priceUnit: e.target.value}))}
                        >
                          {PRICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    {form.price && Number(form.price) > 0 ? (
                      <div style={{padding:'12px 14px', background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:8}}>
                        <div style={{fontSize:13, color:'#166534', fontWeight:600}}>
                          ✅ В объявлении будет: <strong>{Number(form.price).toLocaleString('ru-RU')} ₽ {form.priceUnit}</strong>
                        </div>
                        <div style={{fontSize:12, color:'#16a34a', marginTop:3}}>
                          Заказчики видят эту цену при поиске. Вы всегда можете её изменить.
                        </div>
                      </div>
                    ) : (
                      <div style={{padding:'12px 14px', background:'#fafafa', border:'1.5px solid #e8e8e8', borderRadius:8, fontSize:13, color:'#aaa'}}>
                        Укажите стоимость — она попадёт в объявление как ваша цена
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
                      disabled={saving || !form.title.trim() || !form.category || !form.price || Number(form.price) <= 0}
                      onClick={handleSave}
                    >
                      {saving
                        ? '⏳ Сохраняем…'
                        : isEdit
                          ? '💾 Сохранить изменения'
                          : '📢 Опубликовать объявление'}
                    </button>
                    <p style={{fontSize:12, color:'#bbb', textAlign:'center', marginTop:10, marginBottom:0}}>
                      {isEdit ? 'Изменения сразу увидят заказчики' : 'Размещение бесплатно · Заказчики увидят сразу после публикации'}
                    </p>
                    {isEdit && view?.edit?.id && (
                      <button
                        type="button"
                        className="mlf-btn-copy-outline"
                        onClick={(e) => copyListingPublicLink(view.edit.id, e)}
                      >
                        {copyFlashId === view.edit.id ? '✓ Ссылка скопирована' : '🔗 Копировать ссылку на объявление'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ══ САЙДБАР ══ */}
          <div className="mlf-sidebar">
            {/* Как это работает */}
            <div className="mlf-sb-card">
              <div className="mlf-sb-title">⚡ Как это работает</div>
              <div className="mlf-steps">
                {[
                  ['Разместите объявление', 'Опишите услугу и укажите цену — заказчики сразу его увидят'],
                  ['Получайте заявки', 'Заказчики откликаются или пишут вам напрямую в чат'],
                  ['Согласуйте детали', 'Обсудите объём работ и окончательную цену'],
                  ['Получите оплату', 'Оплата проходит после того, как заказчик подтвердит работу'],
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

            {/* Ваши преимущества */}
            <div className="mlf-sb-card">
              <div className="mlf-sb-title">🛡 Ваши преимущества</div>
              {[
                ['🔒', 'Безопасная сделка', 'Оплата поступает только после подтверждения заказчика'],
                ['⭐', 'Отзывы и рейтинг', 'Честные отзывы — только от реальных заказчиков'],
                ['💬', 'Прямой чат', 'Общайтесь с заказчиком без посредников'],
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

            {/* Советы */}
            {form.category && tips.length > 0 && (
              <div className="mlf-sb-card">
                <div className="mlf-sb-title">💡 Советы для «{form.category}»</div>
                <div className="mlf-tips">
                  {tips.map((t, i) => <span key={i} className="mlf-tip">{t}</span>)}
                </div>
              </div>
            )}
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
    return (
      <div className="ml-detail">
        <style>{css}</style>
        <div className="ml-detail-nav">
          <div style={{maxWidth:1000, margin:'0 auto', padding:'0 20px'}}>
            <button
              style={{background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:14, fontFamily:'Inter,sans-serif', padding:0}}
              onClick={() => { setDetail(null); setPhotoIdx(0); }}
            >← Мои объявления</button>
          </div>
        </div>

        <div className="ml-detail-wrap">
          <div>
            <div className="ml-detail-gallery">
              <div className="ml-detail-main-img" onClick={() => hasPhoto && setLightbox({photos: detail.photos, index: photoIdx})}>
                {hasPhoto
                  ? <img src={detail.photos[photoIdx]} alt="" />
                  : <div style={{fontSize:64, color:'#d1d5db'}}>🔧</div>
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
              description={detail.description}
              category={detail.category}
              address={detail.address || 'Йошкар-Ола · выезд по договорённости'}
              budgetLabel={
                detail.price != null && Number(detail.price) > 0
                  ? `${Number(detail.price).toLocaleString('ru-RU')} ₽${detail.priceUnit ? ` ${detail.priceUnit}` : ''}`
                  : (detail.priceUnit || 'Договорная')
              }
              publishedAt={detail.createdAt}
            />
          </div>

          <div className="ml-detail-right">
            <div className="ml-detail-price-card">
              <div className="ml-detail-price">{Number(detail.price).toLocaleString('ru-RU')} ₽</div>
              <div className="ml-detail-price-unit">{detail.priceUnit}</div>
              {detail.category && <div style={{marginTop:8}}><span className="ml-tag">{detail.category}</span></div>}
            </div>
            <div className="ml-detail-actions-card">
              <div className="ml-section-label" style={{marginBottom:4}}>Управление</div>
              <button className="ml-btn-primary" onClick={() => openEdit(detail)}>✏️ Редактировать</button>
              <button className="ml-btn-outline" onClick={e => handleToggle(detail, e)}>
                {detail.active ? '📦 Снять с публикации' : '🔄 Восстановить'}
              </button>
            </div>
            <div style={{background:'#fff', borderRadius:12, padding:'16px 20px'}}>
              <div className="ml-section-label">Ваш профиль</div>
              <div style={{display:'flex', alignItems:'center', gap:12, cursor:'pointer'}} onClick={() => navigate('/worker-profile')}>
                {ava
                  ? <img src={ava} alt="" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
                  : <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#e8410a,#ff7043)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0}}>
                      {(userName||'М')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#111827'}}>{fullName}</div>
                  <div style={{fontSize:12,color:'#22c55e',fontWeight:600}}>● Мастер</div>
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
              <div style={{position:'absolute',top:12,left:12,background:'rgba(0,0,0,.55)',color:'#fff',fontSize:13,fontWeight:700,padding:'4px 10px',borderRadius:999}}>
                {lightbox.index+1} / {lightbox.photos.length}
              </div>
              <button onClick={() => setLightbox(null)} style={{position:'absolute',top:12,right:12,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.18)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
            {lightbox.photos.length > 1 && (
              <div style={{position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',display:'flex',gap:8}} onClick={e=>e.stopPropagation()}>
                {lightbox.photos.map((p,i)=>(
                  <div key={i} onClick={()=>setLightbox(l=>({...l,index:i}))}
                    style={{width:52,height:40,borderRadius:5,overflow:'hidden',cursor:'pointer',border:i===lightbox.index?'2.5px solid #e8410a':'2px solid rgba(255,255,255,.25)',opacity:i===lightbox.index?1:0.6}}>
                    <img src={p} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
                  </div>
                ))}
              </div>
            )}
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
        <img src={DEFAULT_MY_LISTINGS_BG} alt="" className="ml-list-hero-img" />
        <div className="ml-list-hero-overlay" />
        <div className="ml-list-hero-body">
          <div>
            <h1 className="ml-h1">Мои объявления</h1>
            <p className="ml-h-sub">Управляйте своими услугами и откликами</p>
          </div>
          <button className="ml-new-btn" type="button" onClick={openCreate}>+ Разместить объявление</button>
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
                {tab === 'active' ? 'Нет активных объявлений' : 'Архив пуст'}
              </h3>
              <p style={{ fontSize: 14, margin: '0 0 20px' }}>
                {tab === 'active' ? 'Разместите объявление, чтобы заказчики могли вас найти' : 'Снятые объявления появятся здесь'}
              </p>
              {tab === 'active' && <button type="button" className="ml-new-btn" onClick={openCreate}>+ Разместить объявление</button>}
            </div>
          ) : (
            <div className="ml-list">
              {shown.map(l => (
              <div
                key={l.id}
                className="ml-row"
                onClick={() => { setDetail(l); setPhotoIdx(0); }}
              >
                <div className="ml-row-img">
                  {l.photos?.length
                    ? <><img src={l.photos[0]} alt=""/>{l.photos.length > 1 && <span className="ml-row-img-cnt">📷{l.photos.length}</span>}</>
                    : <div className="ml-row-img-ph">🔧</div>
                  }
                </div>
                <div className="ml-row-body">
                  <div className="ml-row-title">{l.title}</div>
                  <div className="ml-row-price">
                    {l.priceUnit === 'договорная' || !l.price || Number(l.price) <= 0 ? (
                      <span style={{fontSize:14, fontWeight:600, color:'#64748b'}}>Договорная</span>
                    ) : (
                      <>{Number(l.price).toLocaleString('ru-RU')} ₽<span className="ml-row-unit">{l.priceUnit}</span></>
                    )}
                  </div>
                  {l.category && <span className="ml-row-cat">{l.category}</span>}
                  {l.description && <div className="ml-row-desc">{l.description}</div>}
                  <div className="ml-row-date">📅 {l.createdAt ? new Date(l.createdAt).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}) : '—'}</div>
                </div>
                <div className="ml-row-stats">
                  <div className="ml-row-stat">
                    <span aria-hidden>👁</span>
                    <span className="ml-row-stat-num">{l.viewCount ?? 0}</span>
                    <span>{pluralViews(l.viewCount ?? 0)}</span>
                  </div>
                  <span className="ml-row-stat-hint">Когда заказчик открывает страницу объявления</span>
                  <div className="ml-row-stat">
                    <span aria-hidden>📋</span>
                    <span className="ml-row-stat-num">{l.pendingDealsCount ?? 0}</span>
                    <span>{pluralNewDeals(l.pendingDealsCount ?? 0)}</span>
                  </div>
                  <span className="ml-row-stat-hint">Со статусом «новая» по этому объявлению</span>
                  <div className="ml-row-stat" style={{ color: l.active ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    ● {l.active ? 'Активно' : 'В архиве'}
                  </div>
                </div>
                <div className="ml-row-actions" onClick={e => e.stopPropagation()}>
                  <button type="button" className="ml-btn-edit" onClick={e => openEdit(l, e)}>Редактировать</button>
                  <button type="button" className={l.active ? 'ml-btn-arch' : 'ml-btn-restore'} onClick={e => handleToggle(l, e)}>
                    {l.active ? 'Снять с публикации' : 'Восстановить'}
                  </button>
                  <a
                    className="ml-link-preview"
                    href={`/listings/${l.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    Как видят заказчики ↗
                  </a>
                  <button type="button" className="ml-btn-copy" onClick={e => copyListingPublicLink(l.id, e)}>
                    {copyFlashId === l.id ? '✓ Ссылка скопирована' : 'Копировать ссылку'}
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
    </div>
  );
}
