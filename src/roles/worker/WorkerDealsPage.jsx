import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  getMyDeals, getListingsByWorker, completeDeal, createCustomerReview,
  workerStartDeal, cancelPendingDeal, cancelActiveDeal,
} from '../../api';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_BG = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80';
const BACKEND    = 'https://svoi-mastera-backend-mf3h.onrender.com';

const ST = {
  NEW:         { label: 'Новый заказ',  color: '#d97706', bg: 'rgba(245,158,11,.12)',  dot: '#f59e0b' },
  IN_PROGRESS: { label: 'В работе',     color: '#2563eb', bg: 'rgba(37,99,235,.11)',   dot: '#3b82f6' },
  COMPLETED:   { label: 'Завершена',    color: '#16a34a', bg: 'rgba(34,197,94,.11)',   dot: '#22c55e' },
  CANCELLED:   { label: 'Отменена',     color: '#dc2626', bg: 'rgba(239,68,68,.1)',    dot: '#ef4444' },
};

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} дн. назад`;
  return new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'long' });
}

function thumb(p) {
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  return BACKEND + p;
}

/* ══ CSS ══ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .wd-page { background: #f2f2f2; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #1a1a1a; }

  /* ── HERO ── */
  .wd-hero {
    position: relative; height: 260px; overflow: hidden;
  }
  @media(max-width:768px){ .wd-hero { height: 210px; } }
  .wd-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: center 40%;
    filter: brightness(.58) saturate(1.15);
  }
  .wd-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(170deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.58) 100%);
  }
  .wd-hero-body {
    position: relative; z-index: 1; height: 100%;
    max-width: 1000px; margin: 0 auto; padding: 0 20px 28px;
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .wd-h1 { font-size: clamp(22px,4vw,32px); font-weight: 900; margin: 0; color: #fff; letter-spacing: -.4px; line-height: 1.15; }
  .wd-hsub { font-size: 14px; color: rgba(255,255,255,.75); margin: 5px 0 0; font-weight: 500; }
  .wd-find-btn {
    background: #e8410a; border: none; border-radius: 10px; color: #fff;
    font-size: 13px; font-weight: 700; padding: 11px 20px; cursor: pointer;
    font-family: inherit; white-space: nowrap;
    box-shadow: 0 4px 14px rgba(232,65,10,.32); transition: background .15s;
    text-decoration: none; display: inline-block;
  }
  .wd-find-btn:hover { background: #c73208; }

  /* ── WRAP ── */
  .wd-wrap { max-width: 1000px; margin: 0 auto; padding: 0 20px 60px; }

  /* ── PAGE TABS (Заказы / Объявления) ── */
  .wd-page-tabs {
    display: flex; gap: 6px; padding: 4px;
    background: rgba(255,255,255,.9); border: 1px solid #e8e8e8;
    border-radius: 12px; margin-bottom: 18px; width: fit-content;
  }
  .wd-page-tab {
    background: none; border: none; border-radius: 9px;
    padding: 9px 18px; font-size: 14px; font-weight: 600;
    color: #6b7280; cursor: pointer; font-family: inherit; transition: all .15s;
    display: flex; align-items: center; gap: 6px;
  }
  .wd-page-tab.on { color: #fff; background: #e8410a; box-shadow: 0 2px 8px rgba(232,65,10,.25); }
  .wd-page-tab-n {
    font-size: 11px; background: rgba(0,0,0,.07); border-radius: 8px;
    padding: 1px 6px; color: #6b7280; font-weight: 700;
  }
  .wd-page-tab.on .wd-page-tab-n { background: rgba(255,255,255,.22); color: #fff; }
  .wd-new-badge {
    font-size: 10px; font-weight: 800; color: #fff; background: #ef4444;
    border-radius: 999px; padding: 1px 6px; margin-left: 2px;
  }

  /* ── FILTER TABS ── */
  .wd-filters {
    display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
    margin-bottom: 14px;
  }
  .wd-filter {
    background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
    padding: 8px 14px; font-size: 13px; font-weight: 600; color: #6b7280;
    cursor: pointer; font-family: inherit; transition: all .15s;
    display: flex; align-items: center; gap: 5px;
  }
  .wd-filter.on { border-color: #e8410a; color: #e8410a; background: #fff4ef; }
  .wd-filter-n { font-size: 11px; background: #f3f4f6; border-radius: 6px; padding: 1px 5px; font-weight: 700; color: #9ca3af; }
  .wd-filter.on .wd-filter-n { background: rgba(232,65,10,.12); color: #e8410a; }

  /* ── LIST ── */
  .wd-list { display: flex; flex-direction: column; gap: 12px; }

  /* ── CARD ── */
  .wd-card {
    display: flex; align-items: stretch;
    background: #fff; border: 1.5px solid #e8e8e8; border-radius: 16px;
    overflow: hidden; cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,.04);
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }
  .wd-card:hover { box-shadow: 0 10px 32px rgba(0,0,0,.09); transform: translateY(-2px); border-color: #e8410a; }
  .wd-card.new  { border-left: 3px solid #f59e0b; background: #fffdf7; }
  .wd-card.prog { border-left: 3px solid #3b82f6; }
  .wd-card.done { border-left: 3px solid #22c55e; }

  /* thumb */
  .wd-card-img { width: 126px; min-height: 108px; flex-shrink: 0; background: #f5f5f5; overflow: hidden; position: relative; }
  .wd-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 108px; }
  .wd-card-img-ph {
    width: 100%; height: 100%; min-height: 108px;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; color: #d1d5db;
  }

  /* body */
  .wd-card-body { flex: 1; padding: 13px 16px 9px; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .wd-card-title { font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 5px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .wd-card-price { font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 5px; }
  .wd-card-cat { display: inline-block; font-size: 11px; color: #fff; background: #e8410a; border-radius: 6px; padding: 2px 9px; margin-bottom: 5px; font-weight: 700; }
  .wd-card-meta { font-size: 12px; color: #9ca3af; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 8px; }
  .wd-card-stats {
    display: flex; flex-direction: row; gap: 14px; flex-wrap: wrap;
    padding: 7px 10px; margin: 0 -16px -9px; border-top: 1px solid #f3f4f6;
    background: #f9f9f9; border-radius: 0 0 0 12px; align-items: center;
  }
  .wd-card-stat { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
  .wd-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; border-radius: 8px;
    padding: 3px 9px;
  }
  .wd-prog-row {
    display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
  }
  .wd-prog-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }

  /* actions panel */
  .wd-card-actions {
    width: 170px; flex-shrink: 0; padding: 13px 12px;
    display: flex; flex-direction: column; gap: 6px; justify-content: center;
    border-left: 1px solid #f0f0f0; background: #fafafa;
  }
  .wd-btn-primary {
    width: 100%; background: #e8410a; border: none; border-radius: 10px;
    padding: 10px 0; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-btn-primary:hover:not(:disabled) { background: #c73208; }
  .wd-btn-primary:disabled { background: #fca98e; cursor: not-allowed; }
  .wd-btn-outline {
    width: 100%; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
    padding: 9px 0; font-size: 12px; font-weight: 600; color: #475569;
    cursor: pointer; font-family: inherit; transition: all .15s; text-align: center; text-decoration: none; display: block;
  }
  .wd-btn-outline:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
  .wd-btn-danger {
    width: 100%; background: none; border: none; font-size: 12px;
    color: #9ca3af; cursor: pointer; font-family: inherit;
    padding: 4px 0; text-align: center; transition: color .15s;
  }
  .wd-btn-danger:hover { color: #dc2626; }
  .wd-btn-green {
    width: 100%; background: #16a34a; border: none; border-radius: 10px;
    padding: 10px 0; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-btn-green:hover:not(:disabled) { background: #15803d; }
  .wd-btn-green:disabled { background: #86efac; cursor: not-allowed; }
  .wd-actions-divider { height: 1px; background: #ebebeb; margin: 2px 0; }
  .wd-done-label {
    font-size: 12px; color: #16a34a; font-weight: 700;
    text-align: center; padding: 4px 0;
  }

  /* ── EMPTY ── */
  .wd-empty {
    text-align: center; padding: 72px 24px;
    background: rgba(255,255,255,.95); border: 1.5px solid #e8e8e8;
    border-radius: 16px; color: #8f8f8f;
    box-shadow: 0 4px 20px rgba(0,0,0,.05);
  }

  /* ── SKELETON ── */
  @keyframes wdsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .wd-sk {
    background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size: 200% 100%; animation: wdsk 1.4s infinite; border-radius: 6px;
  }

  /* ── LISTINGS TAB ── */
  .wd-lst-card {
    display: flex; align-items: center; gap: 12px;
    background: #fff; border: 1.5px solid #e8e8e8; border-radius: 14px;
    padding: 14px 16px; cursor: pointer;
    text-decoration: none; color: inherit;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }
  .wd-lst-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.09); transform: translateY(-2px); border-color: #e8410a; }
  .wd-lst-img {
    width: 64px; height: 64px; border-radius: 10px; overflow: hidden;
    background: #f5f5f5; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: #d1d5db;
  }
  .wd-lst-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wd-lst-title { font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 3px; }
  .wd-lst-price { font-size: 15px; font-weight: 800; color: #1a1a1a; margin-bottom: 3px; }
  .wd-lst-meta { font-size: 12px; color: #9ca3af; display: flex; gap: 8px; flex-wrap: wrap; }
  .wd-lst-chevron { margin-left: auto; font-size: 20px; color: #d1d5db; flex-shrink: 0; }
  .wd-section-label {
    font-size: 11px; font-weight: 800; color: #9ca3af; letter-spacing: .06em;
    text-transform: uppercase; margin: 18px 0 10px;
  }
  .wd-section-label:first-child { margin-top: 0; }

  /* ── DETAIL ── */
  .wd-detail { background: #f2f2f2; min-height: 100vh; }
  .wd-detail-nav { background: #fff; border-bottom: 1.5px solid #e5e7eb; padding: 12px 0; }
  .wd-detail-wrap {
    max-width: 1000px; margin: 0 auto; padding: 20px 20px 60px;
    display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start;
  }
  .wd-detail-gallery { background: #fff; border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
  .wd-detail-main { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
  .wd-detail-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wd-detail-thumbs { display: flex; gap: 6px; padding: 10px 12px; background: #fafafa; overflow-x: auto; }
  .wd-detail-thumb { width: 72px; height: 54px; flex-shrink: 0; border-radius: 6px; overflow: hidden; cursor: pointer; border: 2px solid transparent; }
  .wd-detail-thumb.on { border-color: #e8410a; }
  .wd-detail-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .wd-info-card { background: #fff; border-radius: 14px; padding: 20px 22px; margin-bottom: 14px; }
  .wd-info-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 12px; }
  .wd-info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .wd-info-row:last-child { border-bottom: none; padding-bottom: 0; }
  .wd-info-row dt { color: #9ca3af; font-weight: 500; }
  .wd-info-row dd { margin: 0; color: #111827; font-weight: 600; text-align: right; }

  .wd-right { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 72px; }
  .wd-price-card { background: #fff; border-radius: 14px; padding: 20px; }
  .wd-price-big { font-size: 28px; font-weight: 900; color: #1a1a1a; }
  .wd-price-sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }

  .wd-action-card { background: #fff; border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 9px; }
  .wd-action-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .wd-btn-full-primary {
    width: 100%; padding: 13px; background: #e8410a; border: none; border-radius: 10px;
    color: #fff; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
    box-shadow: 0 4px 14px rgba(232,65,10,.28); transition: background .15s;
  }
  .wd-btn-full-primary:hover:not(:disabled) { background: #c73208; }
  .wd-btn-full-primary:disabled { background: #fca98e; cursor: not-allowed; }
  .wd-btn-full-outline {
    width: 100%; padding: 11px; background: #fff; border: 1.5px solid #e5e7eb;
    border-radius: 10px; color: #334155; font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all .15s;
  }
  .wd-btn-full-outline:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
  .wd-btn-full-red {
    width: 100%; padding: 11px; background: #fff; border: 1.5px solid #fca5a5;
    border-radius: 10px; color: #dc2626; font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer; transition: all .15s;
  }
  .wd-btn-full-red:hover { background: #fef2f2; }
  .wd-btn-full-green {
    width: 100%; padding: 13px; background: #16a34a; border: none; border-radius: 10px;
    color: #fff; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
    transition: background .15s;
  }
  .wd-btn-full-green:hover:not(:disabled) { background: #15803d; }
  .wd-btn-full-green:disabled { background: #86efac; cursor: not-allowed; }

  .wd-confirm-row {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 9px; font-size: 13px;
  }
  .wd-confirm-row.ok { background: rgba(34,197,94,.07); border: 1px solid rgba(34,197,94,.2); }
  .wd-confirm-row.wait { background: #f9fafb; border: 1px solid #e5e7eb; }

  .wd-customer-card { background: #fff; border-radius: 14px; padding: 16px 18px; }
  .wd-customer-row { display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .wd-customer-avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    object-fit: cover; border: 2px solid #f3f4f6;
  }
  .wd-customer-fallback {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg,#e8410a,#ff7043);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 16px;
  }

  /* ── MODALS ── */
  .wd-modal-bg {
    position: fixed; inset: 0; z-index: 2100;
    background: rgba(0,0,0,.48); display: flex;
    align-items: center; justify-content: center; padding: 20px;
  }
  .wd-modal {
    background: #fff; border-radius: 18px; width: 100%; max-width: 440px;
    padding: 26px; box-shadow: 0 24px 60px rgba(0,0,0,.18);
  }
  .wd-modal-title { font-size: 18px; font-weight: 800; color: #111827; margin: 0 0 10px; }
  .wd-modal-sub { font-size: 14px; color: #6b7280; line-height: 1.55; margin: 0 0 16px; }
  .wd-modal-warn { background: rgba(239,68,68,.05); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; border: 1px solid rgba(239,68,68,.12); font-size: 13px; color: #6b7280; line-height: 1.5; }
  .wd-modal-textarea {
    width: 100%; padding: 11px 13px; border-radius: 9px; border: 1.5px solid #e5e7eb;
    font-size: 14px; line-height: 1.6; resize: vertical; outline: none;
    box-sizing: border-box; margin-bottom: 12px; font-family: inherit;
  }
  .wd-modal-textarea:focus { border-color: #e8410a; box-shadow: 0 0 0 3px rgba(232,65,10,.08); }
  .wd-modal-error { color: #dc2626; font-size: 13px; margin-bottom: 12px; }
  .wd-modal-btns { display: flex; gap: 10px; }
  .wd-modal-cancel {
    flex: 1; padding: 11px; border-radius: 10px; border: 1.5px solid #e5e7eb;
    background: #fff; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit;
  }
  .wd-modal-confirm {
    flex: 1; padding: 11px; border-radius: 10px; border: none;
    background: #dc2626; color: #fff; font-weight: 700; font-size: 14px;
    cursor: pointer; font-family: inherit; transition: background .15s;
  }
  .wd-modal-confirm:hover:not(:disabled) { background: #b91c1c; }
  .wd-modal-confirm:disabled { opacity: .6; cursor: not-allowed; }

  /* ── RESPONSIVE ── */
  @media(max-width:900px) {
    .wd-detail-wrap { grid-template-columns: 1fr; }
    .wd-right { position: static; }
  }
  @media(max-width:720px) {
    .wd-card-actions { display: none; }
  }
  @media(max-width:540px) {
    .wd-page-tabs { flex-wrap: wrap; }
  }
`;

export default function WorkerDealsPage() {
  const { userId, userName, userLastName, userAvatar } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [deals,    setDeals]    = useState([]);
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [pageTab,  setPageTab]  = useState('orders');
  const [filter,   setFilter]   = useState('ALL');
  const [detail,   setDetail]   = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [actionId, setActionId] = useState(null);
  const [declId,   setDeclId]   = useState(null);

  // Modals
  const [cancelNewOpen,  setCancelNewOpen]  = useState(false);
  const [cancelNewNote,  setCancelNewNote]  = useState('');
  const [cancelNewBusy,  setCancelNewBusy]  = useState(false);
  const [cancelNewErr,   setCancelNewErr]   = useState('');

  const [cancelActOpen,  setCancelActOpen]  = useState(false);
  const [cancelActNote,  setCancelActNote]  = useState('');
  const [cancelActBusy,  setCancelActBusy]  = useState(false);
  const [cancelActErr,   setCancelActErr]   = useState('');

  const [reviewDeal,    setReviewDeal]    = useState(null);
  const [reviewForm,    setReviewForm]    = useState({ rating: 5, text: '' });
  const [reviewStatus,  setReviewStatus]  = useState('idle');

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, lst] = await Promise.all([
        getMyDeals(userId),
        getListingsByWorker(userId).catch(() => []),
      ]);
      const uid = String(userId || '');
      setDeals((data || []).filter(d => String(d.workerId || '') === uid));
      setListings(Array.isArray(lst) ? lst : []);
    } catch {
      setDeals([]); setListings([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // open deal from URL ?dealId=...
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('dealId');
    if (id && deals.length > 0) {
      const found = deals.find(d => d.id === id);
      if (found) { setDetail(found); setPhotoIdx(0); }
    }
  }, [location.search, deals]);

  // sync detail with fresh data
  useEffect(() => {
    if (detail?.id) {
      const fresh = deals.find(d => d.id === detail.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(detail)) setDetail(fresh);
    }
  }, [deals, detail]);

  /* ── actions ── */
  const handleStart = async (dealId, e) => {
    e?.stopPropagation?.();
    setActionId(dealId);
    try { await workerStartDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  const handleComplete = async (dealId, e) => {
    e?.stopPropagation?.();
    setActionId(dealId);
    try { await completeDeal(userId, dealId); await load(); } catch {}
    setActionId(null);
  };

  const handleCancelNew = async () => {
    if (!detail?.id) return;
    setCancelNewBusy(true); setCancelNewErr('');
    try {
      await cancelPendingDeal(userId, detail.id, cancelNewNote);
      setCancelNewOpen(false); setCancelNewNote('');
      await load(); setDetail(null);
    } catch (e) { setCancelNewErr(e?.message || 'Не удалось отменить'); }
    setCancelNewBusy(false);
  };

  const handleCancelActive = async () => {
    if (!detail?.id) return;
    setCancelActBusy(true); setCancelActErr('');
    try {
      await cancelActiveDeal(userId, detail.id, cancelActNote);
      setCancelActOpen(false); setCancelActNote('');
      await load(); setDetail(null);
    } catch (e) { setCancelActErr(e?.message || 'Не удалось отменить'); }
    setCancelActBusy(false);
  };

  const handleReviewSubmit = async () => {
    if (!reviewDeal) return;
    setReviewStatus('sending');
    try {
      await createCustomerReview(userId, reviewDeal.id, reviewForm);
      setReviewStatus('done'); await load();
    } catch { setReviewStatus('error'); }
  };

  /* ── derived ── */
  const counts = {
    ALL:         deals.length,
    NEW:         deals.filter(d => d.status === 'NEW').length,
    IN_PROGRESS: deals.filter(d => d.status === 'IN_PROGRESS').length,
    COMPLETED:   deals.filter(d => d.status === 'COMPLETED').length,
  };
  const filtered       = filter === 'ALL' ? deals : deals.filter(d => d.status === filter);
  const activeListings = listings.filter(l => l.active);
  const archListings   = listings.filter(l => !l.active);

  const fullName = [userName, userLastName].filter(Boolean).join(' ') || 'Мастер';
  const ava = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : BACKEND + userAvatar)
    : null;

  /* ══ DETAIL ══ */
  if (detail) {
    const st      = ST[detail.status] || ST.NEW;
    const hasPhoto = detail.photos?.length > 0;
    const myOk    = detail.workerConfirmed;
    const custOk  = detail.customerConfirmed;

    return (
      <div className="wd-detail">
        <style>{css}</style>
        <div className="wd-detail-nav">
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
            <button
              style={{ background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:14, fontFamily:'Inter,sans-serif', padding:0 }}
              onClick={() => { setDetail(null); setPhotoIdx(0); }}
            >← Мои сделки</button>
          </div>
        </div>

        <div className="wd-detail-wrap">
          {/* LEFT */}
          <div>
            {/* Gallery */}
            <div className="wd-detail-gallery">
              <div className="wd-detail-main">
                {hasPhoto
                  ? <img src={detail.photos[photoIdx]} alt="" />
                  : <div style={{ fontSize: 64, color: '#d1d5db' }}>🔨</div>
                }
                {hasPhoto && detail.photos.length > 1 && (<>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + detail.photos.length) % detail.photos.length); }}
                    style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,.45)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>‹</button>
                  <button onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % detail.photos.length); }}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(0,0,0,.45)', border:'none', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>›</button>
                  <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,.52)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:999, zIndex:2 }}>
                    {photoIdx + 1} / {detail.photos.length}
                  </div>
                </>)}
              </div>
              {hasPhoto && detail.photos.length > 1 && (
                <div className="wd-detail-thumbs">
                  {detail.photos.map((p, i) => (
                    <div key={i} className={`wd-detail-thumb${i === photoIdx ? ' on' : ''}`} onClick={() => setPhotoIdx(i)}>
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {detail.description && detail.description !== 'Без описания' && (
              <div className="wd-info-card">
                <div className="wd-info-label">Описание задачи</div>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.75, margin:0 }}>{detail.description}</p>
              </div>
            )}

            {/* Details table */}
            <div className="wd-info-card">
              <div className="wd-info-label">Подробности</div>
              <dl style={{ margin:0 }}>
                {[
                  detail.category    && ['Категория',  detail.category],
                  detail.agreedPrice && ['Стоимость',  `${Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽`],
                  detail.createdAt   && ['Создана',    timeAgo(detail.createdAt)],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} className="wd-info-row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Cancellation reason */}
            {detail.status === 'CANCELLED' && detail.cancellationReason && (
              <div style={{ background:'rgba(239,68,68,.05)', borderRadius:12, padding:'14px 18px', border:'1px solid rgba(239,68,68,.15)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#ef4444', marginBottom:4 }}>Причина отмены</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.55 }}>{detail.cancellationReason}</div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="wd-right">
            {/* Price */}
            {detail.agreedPrice && (
              <div className="wd-price-card">
                <div className="wd-price-big">{Number(detail.agreedPrice).toLocaleString('ru-RU')} ₽</div>
                <div className="wd-price-sub">Договорная стоимость</div>
                <div style={{ marginTop:10 }}>
                  <span className="wd-status-badge" style={{ color: st.color, background: st.bg }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background: st.dot, display:'inline-block', flexShrink:0 }} />
                    {st.label}
                  </span>
                </div>
              </div>
            )}

            {/* NEW order — accept/decline */}
            {detail.status === 'NEW' && (
              <div className="wd-action-card" style={{ border:'1.5px solid #fde68a' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 }}>Новый заказ</div>
                <p style={{ fontSize:13, color:'#78350f', margin:'0 0 14px', lineHeight:1.55, background:'#fffbeb', borderRadius:8, padding:'10px 12px' }}>
                  Заказчик выбрал вас и ждёт подтверждения. Примите заказ — он перейдёт в работу.
                </p>
                <button className="wd-btn-full-primary" disabled={actionId === detail.id} onClick={e => handleStart(detail.id, e)}>
                  {actionId === detail.id ? '⏳ Принимаем…' : '✅ Принять заказ'}
                </button>
                <button className="wd-btn-full-outline" onClick={() => navigate(`/chat/${detail.customerId}`)}>
                  💬 Уточнить детали
                </button>
                <button className="wd-btn-full-red" onClick={() => { setCancelNewErr(''); setCancelNewNote(''); setCancelNewOpen(true); }}>
                  Отказаться от заказа
                </button>
                <p style={{ margin:0, fontSize:11, color:'#78716c', lineHeight:1.45, textAlign:'center' }}>
                  Можно отказаться до принятия — заказчик выберет другого мастера
                </p>
              </div>
            )}

            {/* IN_PROGRESS — confirm */}
            {detail.status === 'IN_PROGRESS' && (
              <div className="wd-action-card">
                <div className="wd-action-label">Подтверждение выполнения</div>
                <div className={`wd-confirm-row${detail.customerConfirmed ? ' ok' : ' wait'}`}>
                  <span style={{ fontSize:16 }}>{custOk ? '✅' : '⏳'}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Заказчик</div>
                    <div style={{ fontSize:11, color: custOk ? '#22c55e' : '#9ca3af' }}>{custOk ? 'Подтвердил выполнение' : 'Ожидание подтверждения'}</div>
                  </div>
                </div>
                <div className={`wd-confirm-row${myOk ? ' ok' : ' wait'}`} style={{ marginTop:6 }}>
                  <span style={{ fontSize:16 }}>{myOk ? '✅' : '⏳'}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Вы (мастер)</div>
                    <div style={{ fontSize:11, color: myOk ? '#22c55e' : '#9ca3af' }}>{myOk ? 'Подтвердили выполнение' : 'Ожидание вашего подтверждения'}</div>
                  </div>
                </div>
                {!myOk ? (
                  <button className="wd-btn-full-green" style={{ marginTop:10 }} disabled={actionId === detail.id} onClick={e => handleComplete(detail.id, e)}>
                    {actionId === detail.id ? 'Подтверждаем…' : '✅ Подтвердить выполнение'}
                  </button>
                ) : (
                  <div style={{ marginTop:10, textAlign:'center', fontSize:13, color:'#16a34a', fontWeight:700, padding:'10px', background:'rgba(34,197,94,.07)', borderRadius:8 }}>
                    ✓ Вы подтвердили{!custOk && ' — ожидаем заказчика…'}
                  </div>
                )}
                <div style={{ marginTop:10, borderTop:'1px solid #f3f4f6', paddingTop:10 }}>
                  <button className="wd-btn-full-red" onClick={() => { setCancelActErr(''); setCancelActOpen(true); }}>
                    Отказаться от сделки
                  </button>
                  <p style={{ margin:'5px 0 0', fontSize:11, color:'#a8a29e', textAlign:'center', lineHeight:1.4 }}>После завершения сделки отмена невозможна</p>
                </div>
              </div>
            )}

            {/* COMPLETED */}
            {detail.status === 'COMPLETED' && (
              <div className="wd-action-card" style={{ background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:4 }}>🏆</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:4 }}>Работа завершена!</div>
                <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Обе стороны подтвердили выполнение</div>
                {!detail.hasWorkerReview && detail.customerId ? (
                  <button
                    onClick={() => { setReviewForm({ rating: 5, text: '' }); setReviewStatus('idle'); setReviewDeal(detail); }}
                    style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(99,102,241,.28)' }}
                  >⭐ Оставить отзыв о заказчике</button>
                ) : detail.hasWorkerReview ? (
                  <div style={{ fontSize:13, color:'#16a34a', fontWeight:600, background:'rgba(34,197,94,.08)', borderRadius:8, padding:'8px 12px' }}>✓ Вы оставили отзыв</div>
                ) : null}
              </div>
            )}

            {/* CANCELLED */}
            {detail.status === 'CANCELLED' && (
              <div className="wd-action-card" style={{ background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.15)', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:4 }}>❌</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#ef4444', marginBottom:4 }}>Сделка отменена</div>
                {detail.cancellationReason && <div style={{ fontSize:12, color:'#9ca3af' }}>{detail.cancellationReason}</div>}
              </div>
            )}

            {/* Customer card */}
            <div className="wd-customer-card">
              <div className="wd-info-label">Заказчик</div>
              <div className="wd-customer-row" onClick={() => detail.customerId && navigate(`/customers/${detail.customerId}`)}>
                {detail.customerAvatar && detail.customerAvatar.length > 10 && detail.customerAvatar !== 'null'
                  ? <img src={detail.customerAvatar} alt="" className="wd-customer-avatar" />
                  : <div className="wd-customer-fallback">{(detail.customerName||'З')[0].toUpperCase()}</div>
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>
                    {[detail.customerName, detail.customerLastName].filter(Boolean).join(' ') || 'Заказчик'}
                  </div>
                  <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Активный заказчик</div>
                </div>
                <div style={{ color:'#d1d5db', fontSize:20 }}>›</div>
              </div>
              <button
                onClick={() => navigate(`/chat/${detail.customerId}`)}
                className="wd-btn-full-outline"
                style={{ marginTop:12 }}
              >💬 Написать заказчику</button>
            </div>

            {/* My profile */}
            <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px' }}>
              <div className="wd-info-label">Ваш профиль</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => navigate('/worker-profile')}>
                {ava
                  ? <img src={ava} alt="" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #f3f4f6' }} />
                  : <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15, flexShrink:0 }}>
                      {(userName||'М')[0].toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{fullName}</div>
                  <div style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>● Мастер</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: cancel NEW */}
        {cancelNewOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelNewBusy && setCancelNewOpen(false)}>
            <div className="wd-modal" onClick={e => e.stopPropagation()}>
              <h3 className="wd-modal-title">Отказаться от заказа?</h3>
              <p className="wd-modal-sub">Заказчик увидит, что вы отказались. Можно указать причину — это необязательно.</p>
              <textarea className="wd-modal-textarea" rows={3} value={cancelNewNote} onChange={e => setCancelNewNote(e.target.value)} placeholder="Например: занят, не мой профиль работ…" />
              {cancelNewErr && <div className="wd-modal-error">{cancelNewErr}</div>}
              <div className="wd-modal-btns">
                <button className="wd-modal-cancel" disabled={cancelNewBusy} onClick={() => setCancelNewOpen(false)}>Назад</button>
                <button className="wd-modal-confirm" disabled={cancelNewBusy} onClick={handleCancelNew}>{cancelNewBusy ? 'Отправляем…' : 'Да, отказаться'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: cancel IN_PROGRESS */}
        {cancelActOpen && (
          <div className="wd-modal-bg" onClick={() => !cancelActBusy && setCancelActOpen(false)}>
            <div className="wd-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚫</div>
                <h3 className="wd-modal-title" style={{ margin:0 }}>Отказаться от сделки?</h3>
              </div>
              <div className="wd-modal-warn">⚠️ Сделка уже <b>в работе</b>. Заказчик получит уведомление. Это действие необратимо.</div>
              <textarea className="wd-modal-textarea" rows={3} value={cancelActNote} onChange={e => setCancelActNote(e.target.value)} placeholder="Причина отказа (необязательно)…" />
              {cancelActErr && <div className="wd-modal-error">{cancelActErr}</div>}
              <div className="wd-modal-btns">
                <button className="wd-modal-cancel" disabled={cancelActBusy} onClick={() => setCancelActOpen(false)}>Не отменять</button>
                <button className="wd-modal-confirm" disabled={cancelActBusy} onClick={handleCancelActive}>{cancelActBusy ? 'Отменяем…' : 'Да, отказаться'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: review */}
        {reviewDeal && (
          <div className="wd-modal-bg" onClick={() => setReviewDeal(null)}>
            <div className="wd-modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
              {reviewStatus === 'done' ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
                  <h3 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 8px' }}>Отзыв отправлен!</h3>
                  <p style={{ color:'#6b7280', margin:'0 0 20px' }}>Спасибо за вашу оценку</p>
                  <button onClick={() => setReviewDeal(null)} style={{ padding:'10px 28px', background:'#e8410a', border:'none', borderRadius:9, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>Закрыть</button>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                    <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Отзыв о заказчике</h2>
                    <button onClick={() => setReviewDeal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#f9fafb', borderRadius:10, marginBottom:18 }}>
                    {reviewDeal.customerAvatar && reviewDeal.customerAvatar.length > 10
                      ? <img src={reviewDeal.customerAvatar} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover' }} />
                      : <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#e8410a,#ff7043)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>{(reviewDeal.customerName||'З')[0].toUpperCase()}</div>
                    }
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{[reviewDeal.customerName, reviewDeal.customerLastName].filter(Boolean).join(' ')}</div>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>Заказчик</div>
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Оценка</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setReviewForm(p => ({...p, rating:s}))}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:32, padding:0, opacity: s <= reviewForm.rating ? 1 : 0.22, color:'#f59e0b' }}>★</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Комментарий</div>
                    <textarea
                      value={reviewForm.text}
                      onChange={e => setReviewForm(p => ({...p, text: e.target.value}))}
                      placeholder="Как прошла работа с заказчиком? Был ли пунктуален, корректен в общении, вовремя ли оплатил..."
                      className="wd-modal-textarea"
                      rows={4}
                    />
                  </div>
                  {reviewStatus === 'error' && <div className="wd-modal-error">Не удалось отправить отзыв. Попробуйте ещё раз.</div>}
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewStatus === 'sending' || !reviewForm.text?.trim()}
                    style={{ width:'100%', padding:'13px', background: reviewForm.text?.trim() ? '#e8410a' : '#e5e7eb', border:'none', borderRadius:9, color: reviewForm.text?.trim() ? '#fff' : '#9ca3af', fontSize:15, fontWeight:700, cursor: reviewForm.text?.trim() ? 'pointer' : 'not-allowed', transition:'background .15s' }}
                  >{reviewStatus === 'sending' ? 'Отправляем...' : '⭐ Отправить отзыв'}</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══ LIST ══ */
  return (
    <div className="wd-page">
      <style>{css}</style>

      {/* Hero */}
      <div className="wd-hero">
        <img src={DEFAULT_BG} alt="" className="wd-hero-img" />
        <div className="wd-hero-overlay" />
        <div className="wd-hero-body">
          <div>
            <h1 className="wd-h1">Мои сделки</h1>
            <p className="wd-hsub">Заказы от клиентов и ваши объявления в каталоге</p>
          </div>
          <Link to="/find-work" className="wd-find-btn">Найти работу</Link>
        </div>
      </div>

      <div className="wd-wrap" style={{ paddingTop: 20 }}>

        {/* Page tabs */}
        <div className="wd-page-tabs">
          <button type="button" className={`wd-page-tab${pageTab === 'orders' ? ' on' : ''}`} onClick={() => setPageTab('orders')}>
            Заказы
            <span className="wd-page-tab-n">{counts.ALL}</span>
            {counts.NEW > 0 && <span className="wd-new-badge">{counts.NEW} новых</span>}
          </button>
          <button type="button" className={`wd-page-tab${pageTab === 'listings' ? ' on' : ''}`} onClick={() => setPageTab('listings')}>
            Мои объявления
            <span className="wd-page-tab-n">{listings.length}</span>
            {activeListings.length > 0 && <span style={{ fontSize:11, color:'#16a34a', fontWeight:800 }}>({activeListings.length} акт.)</span>}
          </button>
        </div>

        {/* ══ DEALS TAB ══ */}
        {pageTab === 'orders' && (<>
          <div className="wd-filters">
            {[
              ['ALL',         'Все',       counts.ALL],
              ['NEW',         'Новые',     counts.NEW],
              ['IN_PROGRESS', 'В работе',  counts.IN_PROGRESS],
              ['COMPLETED',   'Завершены', counts.COMPLETED],
            ].map(([key, label, cnt]) => (
              <button
                key={key}
                type="button"
                className={`wd-filter${filter === key ? ' on' : ''}`}
                style={key === 'NEW' && cnt > 0 && filter !== 'NEW' ? { borderColor:'#f59e0b', color:'#92400e' } : {}}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="wd-filter-n">{cnt}</span>
              </button>
            ))}
          </div>

          <div className="wd-list">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="wd-card" style={{ cursor:'default', pointerEvents:'none' }}>
                  <div className="wd-card-img"><div className="wd-sk" style={{ width:'100%', height:'100%', borderRadius:0 }} /></div>
                  <div className="wd-card-body" style={{ display:'flex', flexDirection:'column', gap:8, justifyContent:'center' }}>
                    <div className="wd-sk" style={{ height:14, width:'55%' }} />
                    <div className="wd-sk" style={{ height:20, width:'30%' }} />
                    <div className="wd-sk" style={{ height:12, width:'42%' }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="wd-empty">
                <div style={{ fontSize:52, marginBottom:16 }}>🤝</div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#1a1a1a', margin:'0 0 8px' }}>Заказов пока нет</h3>
                <p style={{ fontSize:14, margin:'0 0 20px' }}>Откликайтесь на заявки — заказы появятся здесь</p>
                {activeListings.length > 0 && (
                  <p style={{ fontSize:13, color:'#64748b', margin:'0 0 16px', maxWidth:380 }}>
                    У вас <b>{activeListings.length}</b> активн. объявления в каталоге — заказчики могут вас найти
                  </p>
                )}
                <Link to="/find-work" className="wd-find-btn" style={{ display:'inline-block' }}>Найти работу</Link>
              </div>
            ) : (
              filtered.map(d => {
                const st     = ST[d.status] || ST.NEW;
                const img    = d.photos?.[0];
                const isNew  = d.status === 'NEW';
                const isProg = d.status === 'IN_PROGRESS';
                const isDone = d.status === 'COMPLETED';
                const cardCls = isNew ? ' new' : isProg ? ' prog' : isDone ? ' done' : '';
                return (
                  <div
                    key={d.id}
                    className={`wd-card${cardCls}`}
                    onClick={() => { setDetail(d); setPhotoIdx(0); }}
                  >
                    {/* Photo */}
                    <div className="wd-card-img">
                      {img
                        ? <img src={img} alt="" />
                        : <div className="wd-card-img-ph">{isNew ? '🔔' : isProg ? '⚙️' : isDone ? '✅' : '🔨'}</div>
                      }
                    </div>

                    {/* Body */}
                    <div className="wd-card-body">
                      <div className="wd-card-title">{d.title || 'Задача'}</div>
                      {d.agreedPrice && (
                        <div className="wd-card-price">{Number(d.agreedPrice).toLocaleString('ru-RU')} ₽</div>
                      )}
                      {d.category && <span className="wd-card-cat">{d.category}</span>}
                      <div className="wd-card-meta">
                        <span>{d.customerName || 'Заказчик'}</span>
                        <span>{timeAgo(d.createdAt)}</span>
                      </div>
                      <div className="wd-card-stats">
                        <span className="wd-status-badge" style={{ color: st.color, background: st.bg }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background: st.dot, display:'inline-block', flexShrink:0 }} />
                          {st.label}
                        </span>
                        {isProg && (
                          <div className="wd-prog-row" style={{ marginLeft:'auto' }}>
                            <span className="wd-prog-dot" style={{ background: d.customerConfirmed ? '#22c55e' : '#d1d5db' }} />
                            <span style={{ color: d.customerConfirmed ? '#16a34a' : '#9ca3af' }}>Заказчик</span>
                            <span style={{ color:'#d1d5db', margin:'0 2px' }}>·</span>
                            <span className="wd-prog-dot" style={{ background: d.workerConfirmed ? '#22c55e' : '#d1d5db' }} />
                            <span style={{ color: d.workerConfirmed ? '#16a34a' : '#9ca3af' }}>Вы</span>
                          </div>
                        )}
                        {isNew && (
                          <span style={{ fontSize:11, fontWeight:700, color:'#92400e', background:'#fef3c7', borderRadius:6, padding:'2px 8px', marginLeft:'auto' }}>
                            ⏳ Ждёт подтверждения
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="wd-card-actions" onClick={e => e.stopPropagation()}>
                      {isNew && (<>
                        <button
                          type="button"
                          className="wd-btn-primary"
                          disabled={actionId === d.id}
                          onClick={e => handleStart(d.id, e)}
                        >
                          {actionId === d.id ? '⏳…' : '✅ Принять'}
                        </button>
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => navigate(`/chat/${d.customerId}`)}
                        >💬 Написать</button>
                        <div className="wd-actions-divider" />
                        <button
                          type="button"
                          className="wd-btn-danger"
                          disabled={declId === d.id}
                          onClick={async e => {
                            e.stopPropagation();
                            if (!window.confirm('Отказаться от заказа? Заказчик сможет выбрать другого мастера.')) return;
                            setDeclId(d.id);
                            try { await cancelPendingDeal(userId, d.id, ''); await load(); } catch (err) { window.alert(err?.message || 'Не удалось'); } finally { setDeclId(null); }
                          }}
                        >{declId === d.id ? '…' : 'Отказать'}</button>
                      </>)}
                      {isProg && (<>
                        {!d.workerConfirmed ? (
                          <button
                            type="button"
                            className="wd-btn-green"
                            disabled={actionId === d.id}
                            onClick={e => handleComplete(d.id, e)}
                          >{actionId === d.id ? '⏳…' : '✅ Подтвердить'}</button>
                        ) : (
                          <div className="wd-done-label">✓ Вы подтвердили</div>
                        )}
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => navigate(`/chat/${d.customerId}`)}
                        >💬 Написать</button>
                      </>)}
                      {isDone && (<>
                        {!d.hasWorkerReview && d.customerId && (
                          <button
                            type="button"
                            className="wd-btn-primary"
                            onClick={e => { e.stopPropagation(); setReviewForm({ rating:5, text:'' }); setReviewStatus('idle'); setReviewDeal(d); }}
                          >⭐ Отзыв</button>
                        )}
                        {d.hasWorkerReview && <div className="wd-done-label">✓ Отзыв оставлен</div>}
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => navigate(`/chat/${d.customerId}`)}
                        >💬 Написать</button>
                      </>)}
                      {d.status === 'CANCELLED' && (
                        <button
                          type="button"
                          className="wd-btn-outline"
                          onClick={() => { setDetail(d); setPhotoIdx(0); }}
                        >Подробнее</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>)}

        {/* ══ LISTINGS TAB ══ */}
        {pageTab === 'listings' && (
          <div className="wd-list">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="wd-lst-card" style={{ pointerEvents:'none' }}>
                  <div className="wd-lst-img"><div className="wd-sk" style={{ width:'100%', height:'100%', borderRadius:10 }} /></div>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <div className="wd-sk" style={{ height:14, width:'55%' }} />
                    <div className="wd-sk" style={{ height:18, width:'30%' }} />
                    <div className="wd-sk" style={{ height:11, width:'42%' }} />
                  </div>
                </div>
              ))
            ) : listings.length === 0 ? (
              <div className="wd-empty">
                <div style={{ fontSize:52, marginBottom:16 }}>📢</div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#1a1a1a', margin:'0 0 8px' }}>Объявлений пока нет</h3>
                <p style={{ fontSize:14, margin:'0 0 20px' }}>Разместите услугу — она появится в каталоге для заказчиков</p>
                <Link to="/my-listings" className="wd-find-btn" style={{ display:'inline-block' }}>Мои объявления</Link>
              </div>
            ) : (<>
              {activeListings.length > 0 && (
                <div className="wd-section-label">Активные в каталоге — {activeListings.length}</div>
              )}
              {activeListings.map(l => {
                const t = thumb(l.photos?.[0]);
                return (
                  <Link key={l.id} to={`/listings/${l.id}`} className="wd-lst-card" style={{ borderLeft:'3px solid #7c3aed' }}>
                    <div className="wd-lst-img">{t ? <img src={t} alt="" /> : '📢'}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="wd-lst-title">{l.title}</div>
                      {l.price != null && (
                        <div className="wd-lst-price">{Number(l.price).toLocaleString('ru-RU')} ₽{l.priceUnit && <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600 }}> {l.priceUnit}</span>}</div>
                      )}
                      <div className="wd-lst-meta">
                        {l.category && <span>{l.category}</span>}
                        <span style={{ color:'#16a34a', fontWeight:700 }}>● В каталоге</span>
                        <span>{timeAgo(l.createdAt)}</span>
                      </div>
                    </div>
                    <div className="wd-lst-chevron">›</div>
                  </Link>
                );
              })}
              {archListings.length > 0 && (
                <div className="wd-section-label" style={{ marginTop: activeListings.length > 0 ? 18 : 0 }}>Архив (сняты с публикации) — {archListings.length}</div>
              )}
              {archListings.map(l => {
                const t = thumb(l.photos?.[0]);
                return (
                  <Link key={l.id} to="/my-listings" className="wd-lst-card" style={{ opacity:.82 }}>
                    <div className="wd-lst-img">{t ? <img src={t} alt="" /> : '📁'}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="wd-lst-title">{l.title}</div>
                      <div className="wd-lst-meta">
                        {l.category && <span>{l.category}</span>}
                        <span style={{ color:'#94a3b8' }}>В архиве</span>
                      </div>
                    </div>
                    <div className="wd-lst-chevron">›</div>
                  </Link>
                );
              })}
              <div style={{ marginTop:16, textAlign:'center' }}>
                <Link to="/my-listings" style={{ fontSize:14, fontWeight:700, color:'#e8410a', textDecoration:'none' }}>Управление объявлениями →</Link>
              </div>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}
