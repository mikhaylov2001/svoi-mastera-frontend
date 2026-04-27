import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getOpenJobRequestsForWorker, createJobOffer, getCategories } from '../../api';
import { formatJobRequestBudgetLabel } from '../../utils/jobRequestBudget';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';
import './FindWorkPage.css';

const CAT_ALL = {};
Object.values(CATEGORIES_BY_SECTION).forEach(cats =>
  cats.forEach(cat => { CAT_ALL[cat.slug] = cat; })
);

const HERO_PHOTO = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80';

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
    height: 290px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }
  .fw2-hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(.45) saturate(1.15);
  }
  .fw2-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(170deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.65) 100%);
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
    padding: 0 24px 60px;
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 20px;
    align-items: start;
  }
  .fw2-sidebar {
    position: sticky;
    top: 72px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .fw2-sb-cat {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    border: 1.5px solid #e8e8e8;
  }
  .fw2-sb-cat-photo {
    position: relative;
    height: 120px;
    overflow: hidden;
    background: #1a1a2e;
  }
  .fw2-sb-cat-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(.6);
  }
  .fw2-sb-cat-photo-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 12px;
    background: linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 60%);
  }
  .fw2-sb-cat-name {
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    line-height: 1.25;
  }
  .fw2-sb-cat-body { padding: 12px 14px; }
  .fw2-sb-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: #666;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    transition: color .15s;
  }
  .fw2-sb-back:hover { color: #e8410a; }
  .fw2-filter-card {
    background: #fff;
    border-radius: 14px;
    border: 1.5px solid #e8e8e8;
    overflow: hidden;
  }
  .fw2-filter-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #888;
    padding: 13px 16px 10px;
    border-bottom: 1px solid #f0f0f0;
  }
  .fw2-filter-body { padding: 12px 16px 14px; }
  .fw2-price-row { display: flex; gap: 10px; align-items: flex-end; }
  .fw2-price-row > div { flex: 1; }
  .fw2-price-label { font-size: 11px; color: #aaa; margin-bottom: 4px; font-weight: 600; }
  .fw2-price-inp {
    width: 100%;
    border: 1.5px solid #e8e8e8;
    border-radius: 7px;
    padding: 8px 10px;
    font-size: 14px;
    font-family: Inter, sans-serif;
    outline: none;
    transition: border-color .15s;
    color: #1a1a1a;
    background: #fafafa;
  }
  .fw2-price-inp:focus { border-color: #e8410a; background: #fff; }
  .fw2-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    cursor: pointer;
    user-select: none;
    font-size: 14px;
    color: #333;
    transition: color .15s;
  }
  .fw2-check-item:hover { color: #111; }
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
    padding: 11px;
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    color: #e8410a;
    cursor: pointer;
    font-family: inherit;
    transition: all .15s;
  }
  .fw2-reset-btn:hover { background: #fff5f3; border-color: #e8410a; }

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

  /* ═══ КАРТОЧКИ ЗАЯВОК ═══ */
  .fw2-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .fw2-card {
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #e8e8e8;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow .2s, transform .2s, border-color .2s;
    cursor: default;
  }
  .fw2-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,.1);
    transform: translateY(-3px);
    border-color: #e8410a;
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
  .fw2-card:hover .fw2-card-photo img { transform: scale(1.05); }
  .fw2-card-photo-ph {
    position: absolute;
    inset: 0;
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
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 20px;
  }
  .fw2-thumbs {
    display: flex;
    gap: 4px;
    padding: 6px 10px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    overflow: hidden;
    cursor: pointer;
  }
  .fw2-thumb {
    width: 48px;
    height: 36px;
    object-fit: cover;
    border-radius: 5px;
    cursor: pointer;
    pointer-events: none;
    opacity: .75;
    transition: opacity .15s;
    flex-shrink: 0;
  }
  .fw2-thumb:hover { opacity: 1; }
  .fw2-thumb-more {
    width: 48px;
    height: 36px;
    border-radius: 5px;
    background: rgba(0,0,0,.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #555;
    cursor: pointer;
    flex-shrink: 0;
  }
  .fw2-card-body {
    padding: 12px 14px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .fw2-card-customer {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
  }
  a.fw2-card-customer {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    border-radius: 10px;
    margin: -4px -4px 6px;
    padding: 4px;
    transition: background .15s;
  }
  a.fw2-card-customer:hover { background: rgba(232,65,10,.06); }
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
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid #f0f0f0;
  }
  .fw2-card-ava-ph {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14px;
    color: #fff;
    flex-shrink: 0;
  }
  .fw2-card-customer-name { font-size: 13px; font-weight: 700; color: #111; line-height: 1.2; }
  .fw2-card-customer-sub  { font-size: 11px; color: #22c55e; font-weight: 600; }
  .fw2-card-title {
    font-size: 15px;
    font-weight: 700;
    color: #111;
    margin-bottom: 6px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fw2-card-desc {
    font-size: 12px;
    color: #888;
    line-height: 1.5;
    flex: 1;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .fw2-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }
  .fw2-card-price {
    font-size: 18px;
    font-weight: 900;
    color: #111;
    line-height: 1.2;
  }
  .fw2-card-price-none {
    font-size: 14px;
    font-weight: 600;
    color: #aaa;
  }
  .fw2-card-info {
    font-size: 11px;
    color: #aaa;
    margin-top: 2px;
  }
  .fw2-btn-respond {
    flex-shrink: 0;
    padding: 10px 16px;
    background: #e8410a;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
    white-space: nowrap;
  }
  .fw2-btn-respond:hover { background: #c73208; }

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
  @media(max-width: 620px) {
    .fw2-list { grid-template-columns: 1fr; }
    .fw2-cats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .fw2-hero { height: 240px; }
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
  if (!req) return null;
  const to = req.budgetTo != null && req.budgetTo !== '' ? Number(req.budgetTo) : null;
  const from = req.budgetFrom != null && req.budgetFrom !== '' ? Number(req.budgetFrom) : null;
  const okTo = to != null && !Number.isNaN(to);
  const okFrom = from != null && !Number.isNaN(from);
  if (okTo && okFrom && to === from) return to;
  if (okTo) return to;
  if (okFrom) return from;
  return null;
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
              <label className="fw-modal-label">Ваша цена, ₽ *</label>
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
              {(request.budgetTo != null || request.budgetFrom != null) && (
                <span className="fw-modal-hint">
                  Заказчик указал: {formatJobRequestBudgetLabel(request)}
                </span>
              )}
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

  // Фильтры/поиск для экрана 2
  const [searchInput,   setSearchInput]   = useState('');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [priceMin,      setPriceMin]      = useState('');
  const [priceMax,      setPriceMax]      = useState('');
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [sortBy,        setSortBy]        = useState('recency');

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

  useEffect(() => { loadData(); }, [userId]);

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

  const loadData = async () => {
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
  };

  const getRequestsForCategory = (cat) =>
    requests.filter(r => r.categoryId === cat.id);

  const openRequestDetail = useCallback((req) => {
    setSelectedRequest(req);
    setActivePhotoIdx(0);
  }, []);

  const handleOpenOfferModal = (request) => {
    setShowOfferModal(request);
    setOfferForm({ price: '', comment: '', estimatedDays: '' });
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
    setOnlyWithPhoto(false); setSortBy('recency');
  }, []);

  // ═══ ЭКРАН 3: детальная заявка ═══
  if (selectedRequest) {
    const req = selectedRequest;
    const hasPhoto = req.photos && req.photos.length > 0;
    const catStyle = CATEGORY_STYLES[selectedCategory?.slug] || { emoji: '📋', color: '#f3f4f6' };
    const budget = formatJobRequestBudgetLabel(req);
    const listPrice = jobRequestListPrice(req);

    return (
      <>
      <div style={{ background:'#f5f5f5', minHeight:'100vh' }}>
        <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'10px 0' }}>
          <div className="container">
            <button className="cats-back-link" onClick={() => { setSelectedRequest(null); setActivePhotoIdx(0); }}>
              ← Назад к заявкам
            </button>
          </div>
        </div>

        <div className="container" style={{ paddingTop:20, paddingBottom:60 }}>
          <div style={{ marginBottom:16 }}>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#111827', margin:'0 0 6px' }}>{req.title}</h1>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', fontSize:13, color:'#9ca3af' }}>
              {selectedCategory && <span>🏷 {selectedCategory.name}</span>}
              {req.addressText && <span>📍 {req.addressText}</span>}
              {req.createdAt && <span>📅 {new Date(req.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</span>}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'flex-start' }}>
            <div>
              <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                {hasPhoto ? (
                  <>
                    <div style={{ position:'relative', width:'100%', aspectRatio:'4/3', overflow:'hidden', cursor:'pointer', background:'#f3f4f6' }}
                      onClick={() => setLightbox({ photos: req.photos, index: activePhotoIdx })}
                    >
                      <img src={req.photos[activePhotoIdx]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none', display:'block' }} />
                      {req.photos.length > 1 && (
                        <>
                          <button onClick={e => { e.stopPropagation(); setActivePhotoIdx(i => i > 0 ? i-1 : req.photos.length-1); }}
                            style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.85)', border:'none', color:'#111827', fontSize:22, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>‹</button>
                          <button onClick={e => { e.stopPropagation(); setActivePhotoIdx(i => i < req.photos.length-1 ? i+1 : 0); }}
                            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.85)', border:'none', color:'#111827', fontSize:22, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>›</button>
                        </>
                      )}
                    </div>
                    {req.photos.length > 1 && (
                      <div style={{ display:'flex', gap:6, padding:'10px 12px', overflowX:'auto', background:'#fafafa', borderTop:'1px solid #f0f0f0' }}>
                        {req.photos.map((p, i) => (
                          <div key={i} onClick={() => setActivePhotoIdx(i)}
                            style={{ width:80, height:60, flexShrink:0, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i === activePhotoIdx ? '2px solid #e8410a' : '2px solid transparent', opacity: i === activePhotoIdx ? 1 : 0.65, transition:'all .15s' }}>
                            <img src={p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ aspectRatio:'4/3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64, color:'#d1d5db', background:'#f9fafb' }}>
                    {catStyle.emoji}
                  </div>
                )}
              </div>

              {req.description && req.description !== 'Без описания' && (
                <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', marginBottom:16 }}>
                  <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 12px' }}>Описание</h2>
                  <p style={{ fontSize:15, color:'#374151', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{req.description}</p>
                </div>
              )}

              <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', marginBottom:16 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 16px' }}>Подробности</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {[
                    selectedCategory && ['Категория', selectedCategory.name],
                    req.addressText  && ['Адрес',     req.addressText],
                    ['Цена в заявке', budget],
                    req.createdAt    && ['Опубликована', new Date(req.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #f3f4f6', fontSize:14 }}>
                      <span style={{ color:'#9ca3af', fontWeight:500 }}>{label}</span>
                      <span style={{ color:'#111827', fontWeight:600, textAlign:'right', maxWidth:'60%' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ position:'sticky', top:72, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'#fff', borderRadius:12, padding:'20px' }}>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Цена в заявке</div>
                  <div style={{ fontSize:28, fontWeight:900, color:'#111827' }}>{budget}</div>
                  <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>
                    Заявленная цена заказчика. При отклике вы указываете свою цену и комментарий.
                  </div>
                </div>
                <button
                  onClick={() => handleOpenOfferModal(req)}
                  style={{ width:'100%', padding:'14px', background:'#e8410a', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:10, transition:'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#c73208'}
                  onMouseLeave={e => e.currentTarget.style.background='#e8410a'}
                >
                  ✓ Откликнуться
                </button>
                {req.customerId && (
                  <a href={`/chat/${req.customerId}?jobRequestId=${req.id}`}
                    style={{ display:'block', width:'100%', padding:'13px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, color:'#374151', fontSize:15, fontWeight:600, textAlign:'center', textDecoration:'none', transition:'all .15s', boxSizing:'border-box' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#374151'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; }}
                  >
                    💬 Написать сообщение
                  </a>
                )}
              </div>

              {(req.customerName || req.customerId) && (
                <div style={{ background:'#fff', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:13, color:'#9ca3af', fontWeight:600, marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>Заказчик</div>
                  <a href={req.customerId ? `/customers/${req.customerId}?name=${encodeURIComponent(req.customerName||'')}` : undefined}
                    style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
                    {req.customerAvatar ? (
                      <img src={req.customerAvatar} alt="" style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }} />
                    ) : (
                      <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18, flexShrink:0 }}>
                        {(req.customerName||'А')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>
                        {[req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                      </div>
                      <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Активный заказчик</div>
                    </div>
                    <div style={{ color:'#9ca3af', fontSize:18 }}>›</div>
                  </a>
                </div>
              )}

              <div style={{ background:'#fff', borderRadius:12, padding:'14px 20px' }}>
                <div style={{ fontSize:12, color:'#9ca3af', lineHeight:1.6 }}>
                  ✅ Безопасная сделка — оплата только после выполнения работы
                </div>
              </div>
            </div>
          </div>
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

    const filtered = allCatRequests
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
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          if (
            !(req.title || '').toLowerCase().includes(q) &&
            !(req.description || '').toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => {
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
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

    const hasFilters = onlyWithPhoto || priceMin || priceMax || searchTerm;

    return (
      <div className="fw2-page">
        <style>{fw2css}</style>

        {/* Топ-бар поиска */}
        <div className="fw2-topbar">
          <div className="fw2-topbar-inner">
            <div className="fw2-search-wrap">
              <svg width="15" height="15" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setSearchTerm(searchInput); }}
                placeholder={`Поиск в «${selectedCategory.name}»`}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                  style={{ border:'none', background:'none', cursor:'pointer', color:'#bbb', fontSize:18, lineHeight:1, padding:0 }}>
                  ×
                </button>
              )}
            </div>
            <button className="fw2-topbar-btn" onClick={() => setSearchTerm(searchInput)}>Найти</button>
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
              <div className="fw2-filter-title">Цена в заявке, ₽</div>
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
                  { val: 'recency',   label: 'Новые' },
                  { val: 'priceAsc',  label: 'Цена ↑' },
                  { val: 'priceDesc', label: 'Цена ↓' },
                ].map(o => (
                  <button key={o.val} className={`fw2-sort-opt${sortBy === o.val ? ' active' : ''}`} onClick={() => setSortBy(o.val)}>
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
                  const budget = formatJobRequestBudgetLabel(req);
                  const listPrice = jobRequestListPrice(req);
                  const custName = [req.customerName, req.customerLastName].filter(Boolean).join(' ') || 'Заказчик';

                  const customerHref = req.customerId
                    ? `/customers/${req.customerId}?name=${encodeURIComponent(custName)}`
                    : null;

                  return (
                    <div key={req.id} className="fw2-card">

                      {/* Фото — открыть заявку */}
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
                            {photos.length > 1 && (
                              <span className="fw2-card-photo-cnt">📷 {photos.length}</span>
                            )}
                          </>
                        ) : (
                          <div className="fw2-card-photo-ph">
                            <span className="fw2-card-photo-ph-ico">{catMeta.emoji || '📋'}</span>
                            <span className="fw2-card-photo-ph-txt">Нет фото</span>
                          </div>
                        )}
                      </div>

                      {/* Миниатюры — открыть заявку */}
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
                        {/* Заказчик — профиль (клик отдельно от заявки) */}
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
                              <div className="fw2-card-customer-sub">
                                ● Активный заказчик
                                {req.addressText ? ` · ${req.addressText}` : ''}
                              </div>
                            </div>
                            <span style={{ color:'#ccc', fontSize:18, flexShrink:0 }}>›</span>
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
                              <div className="fw2-card-customer-sub">
                                ● Активный заказчик
                                {req.addressText ? ` · ${req.addressText}` : ''}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Заголовок, описание, дата — открыть заявку */}
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
                            <div className="fw2-card-desc">{req.description}</div>
                          )}
                          {req.createdAt && (
                            <div className="fw2-card-info">
                              📅 {new Date(req.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'short', year:'numeric' })}
                            </div>
                          )}
                        </div>

                        {/* Цена + кнопка (горизонтально как у FindMasterPage) */}
                        <div className="fw2-card-footer">
                          <div>
                            {listPrice != null
                              ? <div className="fw2-card-price">{budget}</div>
                              : <div className="fw2-card-price-none">Цена не указана</div>
                            }
                          </div>
                          <button
                            type="button"
                            className="fw2-btn-respond"
                            onClick={e => { e.stopPropagation(); handleOpenOfferModal(req); }}
                          >
                            ✓ Откликнуться
                          </button>
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
        <img src={HERO_PHOTO} alt="" className="fw2-hero-bg" />
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
          <div className="fw2-cats-grid">
            {categories.map(cat => {
              const meta  = CAT_ALL[cat.slug] || {};
              const count = getRequestsForCategory(cat).length;
              return (
                <button
                  key={cat.id}
                  className="fw2-cat-card"
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
