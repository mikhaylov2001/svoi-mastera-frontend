import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCategories, getListings } from '../../api';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

const CAT_META = {
  'remont-kvartir':       { emoji: '🏠', g1: '#6366f1', g2: '#8b5cf6', tag: 'Интерьер' },
  'santehnika':           { emoji: '🚿', g1: '#0ea5e9', g2: '#06b6d4', tag: 'Сантехника' },
  'elektrika':            { emoji: '⚡', g1: '#f59e0b', g2: '#fbbf24', tag: 'Электрика' },
  'uborka':               { emoji: '✨', g1: '#ec4899', g2: '#f43f5e', tag: 'Клининг' },
  'parikhmaher':          { emoji: '✂️', g1: '#8b5cf6', g2: '#a78bfa', tag: 'Красота' },
  'manikur':              { emoji: '💅', g1: '#f43f5e', g2: '#fb7185', tag: 'Маникюр' },
  'krasota-i-zdorovie':   { emoji: '🌸', g1: '#d946ef', g2: '#e879f9', tag: 'Здоровье' },
  'repetitorstvo':        { emoji: '📚', g1: '#3b82f6', g2: '#60a5fa', tag: 'Учёба' },
  'kompyuternaya-pomosh': { emoji: '💻', g1: '#10b981', g2: '#34d399', tag: 'IT' },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .fmp-page {
    background: #f4f5f8;
    min-height: 100vh;
    font-family: Inter, Arial, sans-serif;
    color: #111827;
  }

  /* ═══ HERO ═══ */
  .fmp-hero {
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    padding: 52px 0 56px;
    position: relative;
    overflow: hidden;
  }
  .fmp-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(232,65,10,.25) 0%, transparent 60%);
  }
  .fmp-hero-inner {
    max-width: 1060px;
    margin: 0 auto;
    padding: 0 24px;
    position: relative;
    z-index: 1;
  }
  .fmp-hero h1 {
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 900;
    color: #fff;
    margin: 0 0 10px;
    letter-spacing: -.5px;
    line-height: 1.2;
  }
  .fmp-hero-sub {
    font-size: 15px;
    color: rgba(255,255,255,.6);
    margin: 0 0 28px;
  }
  .fmp-hero-search {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 14px;
    padding: 0 20px;
    max-width: 560px;
    box-shadow: 0 8px 32px rgba(0,0,0,.35);
    gap: 10px;
  }
  .fmp-hero-search input {
    flex: 1;
    border: none;
    background: none;
    font-size: 15px;
    padding: 16px 0;
    outline: none;
    font-family: Inter, sans-serif;
    color: #111;
  }
  .fmp-hero-search input::placeholder { color: #9ca3af; }
  .fmp-hero-stats {
    display: flex;
    gap: 28px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  .fmp-hero-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .fmp-hero-stat-val {
    font-size: 22px;
    font-weight: 900;
    color: #fff;
  }
  .fmp-hero-stat-label {
    font-size: 12px;
    color: rgba(255,255,255,.5);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  /* ═══ GRID КАТЕГОРИЙ ═══ */
  .fmp-cats-section {
    max-width: 1060px;
    margin: 0 auto;
    padding: 36px 24px 72px;
  }
  .fmp-cats-heading {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .fmp-cats-heading::after {
    content: '';
    flex: 1;
    height: 1.5px;
    background: linear-gradient(to right, #e5e7eb, transparent);
  }
  .fmp-cats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .fmp-cat-card {
    text-decoration: none;
    color: inherit;
    border-radius: 20px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,.07);
    border: 1.5px solid rgba(0,0,0,.05);
    transition: transform .2s, box-shadow .2s;
    display: flex;
    flex-direction: column;
  }
  .fmp-cat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(0,0,0,.13);
  }
  .fmp-cat-card-top {
    height: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .fmp-cat-card-top::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to bottom, transparent, rgba(0,0,0,.15));
  }
  .fmp-cat-emoji {
    font-size: 54px;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,.3));
    position: relative;
    z-index: 1;
    line-height: 1;
  }
  .fmp-cat-card-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }
  .fmp-cat-card-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #9ca3af;
  }
  .fmp-cat-card-name {
    font-size: 15px;
    font-weight: 800;
    color: #111827;
    line-height: 1.3;
    margin: 0;
  }
  .fmp-cat-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }
  .fmp-cat-count-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .fmp-cat-count-zero {
    font-size: 11px;
    font-weight: 500;
    color: #d1d5db;
  }
  .fmp-cat-arr {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: #6b7280;
    transition: background .15s, color .15s;
    flex-shrink: 0;
  }
  .fmp-cat-card:hover .fmp-cat-arr {
    background: #e8410a;
    color: #fff;
  }

  /* ═══ HEADER КАТЕГОРИИ ═══ */
  .fmp-cat-hdr {
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
    padding: 24px 0 28px;
    position: relative;
    overflow: hidden;
  }
  .fmp-cat-hdr::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 80% 50%, rgba(232,65,10,.3) 0%, transparent 60%);
  }
  .fmp-cat-hdr-inner {
    max-width: 1060px;
    margin: 0 auto;
    padding: 0 24px;
    position: relative;
    z-index: 1;
  }
  .fmp-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,.1);
    border: none;
    font-size: 13px;
    color: rgba(255,255,255,.8);
    cursor: pointer;
    padding: 6px 14px;
    border-radius: 20px;
    font-family: Inter, sans-serif;
    font-weight: 600;
    margin-bottom: 18px;
    transition: background .15s;
    backdrop-filter: blur(4px);
  }
  .fmp-back:hover { background: rgba(255,255,255,.2); color: #fff; }
  .fmp-cat-title-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .fmp-cat-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    flex-shrink: 0;
    background: rgba(255,255,255,.12);
    backdrop-filter: blur(4px);
    border: 1.5px solid rgba(255,255,255,.2);
  }
  .fmp-cat-name {
    font-size: 26px;
    font-weight: 900;
    margin: 0 0 4px;
    color: #fff;
    letter-spacing: -.4px;
  }
  .fmp-cat-sub {
    font-size: 13px;
    color: rgba(255,255,255,.55);
    margin: 0;
  }

  /* ═══ ФИЛЬТР БАР ═══ */
  .fmp-filters {
    background: #fff;
    border-bottom: 1.5px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,.06);
  }
  .fmp-filters-inner {
    max-width: 1060px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .fmp-search-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f4f5f8;
    border-radius: 12px;
    padding: 0 16px;
    flex: 1;
    min-width: 200px;
    border: 1.5px solid transparent;
    transition: border-color .15s, background .15s;
  }
  .fmp-search-pill:focus-within {
    background: #fff;
    border-color: #e8410a;
    box-shadow: 0 0 0 3px rgba(232,65,10,.08);
  }
  .fmp-search-pill input {
    flex: 1;
    border: none;
    background: none;
    font-size: 14px;
    padding: 11px 0;
    outline: none;
    font-family: Inter, sans-serif;
    color: #111;
  }
  .fmp-search-pill input::placeholder { color: #9ca3af; }
  .fmp-sort-select {
    padding: 10px 14px;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    font-size: 13px;
    font-family: Inter, sans-serif;
    color: #374151;
    outline: none;
    background: #fff;
    cursor: pointer;
    font-weight: 600;
    transition: border-color .15s;
  }
  .fmp-sort-select:focus { border-color: #e8410a; }
  .fmp-toggle-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    transition: all .15s;
    white-space: nowrap;
    user-select: none;
  }
  .fmp-toggle-pill.active {
    border-color: #e8410a;
    background: #fff5f2;
    color: #e8410a;
  }
  .fmp-toggle-pill input { display: none; }
  .fmp-toggle-dot {
    width: 30px;
    height: 18px;
    border-radius: 9px;
    background: #d1d5db;
    position: relative;
    transition: background .2s;
    flex-shrink: 0;
  }
  .fmp-toggle-dot::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    transition: transform .2s;
    box-shadow: 0 1px 3px rgba(0,0,0,.2);
  }
  .fmp-toggle-pill.active .fmp-toggle-dot {
    background: #e8410a;
  }
  .fmp-toggle-pill.active .fmp-toggle-dot::after {
    transform: translateX(12px);
  }
  .fmp-count-badge {
    background: #f4f5f8;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    color: #6b7280;
    white-space: nowrap;
  }

  /* ═══ СПИСОК ОБЪЯВЛЕНИЙ ═══ */
  .fmp-wrap {
    max-width: 1060px;
    margin: 0 auto;
    padding: 24px 24px 72px;
  }
  .fmp-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* КАРТОЧКА */
  .fmp-card {
    background: #fff;
    border-radius: 18px;
    border: 1.5px solid #f0f0f0;
    overflow: hidden;
    display: flex;
    transition: box-shadow .2s, border-color .2s;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
  }
  .fmp-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,.1);
    border-color: #e5e7eb;
  }

  /* Фото объявления — кликабельно */
  .fmp-card-img {
    width: 150px;
    min-height: 150px;
    flex-shrink: 0;
    background: #f4f5f8;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fmp-card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .3s;
  }
  .fmp-card-img:hover img { transform: scale(1.06); }
  .fmp-card-img-ph {
    font-size: 48px;
    opacity: .25;
  }
  .fmp-card-img-cnt {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: rgba(0,0,0,.55);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 5px;
    backdrop-filter: blur(4px);
  }
  .fmp-card-img-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.28);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity .2s;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .fmp-card-img:hover .fmp-card-img-overlay { opacity: 1; }

  /* Основная часть */
  .fmp-card-body {
    flex: 1;
    padding: 16px 18px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Строка мастера — кликабельна */
  .fmp-card-worker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    width: fit-content;
    padding: 4px 8px 4px 4px;
    border-radius: 20px;
    border: 1px solid #f0f0f0;
    background: #fafafa;
    transition: background .15s, border-color .15s;
    text-decoration: none;
    color: inherit;
  }
  .fmp-card-worker:hover {
    background: #fff5f2;
    border-color: rgba(232,65,10,.25);
  }
  .fmp-card-ava {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .fmp-card-ava-ph {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 12px;
    flex-shrink: 0;
  }
  .fmp-card-worker-name {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .fmp-card-worker-city {
    font-size: 11px;
    color: #9ca3af;
  }
  .fmp-card-worker-arrow {
    font-size: 11px;
    color: #e8410a;
    margin-left: 2px;
  }

  /* Название объявления — кликабельно */
  .fmp-card-title {
    font-size: 17px;
    font-weight: 800;
    color: #111827;
    cursor: pointer;
    text-decoration: none;
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color .15s;
  }
  .fmp-card-title:hover { color: #e8410a; }

  .fmp-card-desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.6;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .fmp-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .fmp-card-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    border-radius: 6px;
    padding: 3px 8px;
  }
  .fmp-card-stats {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
  }
  .fmp-stars { color: #f59e0b; font-size: 12px; }
  .fmp-card-rating-val { font-weight: 700; color: #111; }

  /* Цена */
  .fmp-card-price {
    font-size: 20px;
    font-weight: 900;
    color: #111827;
    letter-spacing: -.3px;
  }
  .fmp-card-price-unit {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
    margin-left: 4px;
  }

  /* Правая панель */
  .fmp-card-right {
    width: 170px;
    flex-shrink: 0;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
    border-left: 1.5px solid #f4f5f8;
  }
  .fmp-btn-primary {
    background: #e8410a;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    padding: 10px 0;
    cursor: pointer;
    width: 100%;
    transition: background .15s;
  }
  .fmp-btn-primary:hover { background: #c73208; }
  .fmp-btn-outline {
    background: #fff;
    border: 1.5px solid #e8410a;
    border-radius: 10px;
    color: #e8410a;
    font-size: 13px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    padding: 9px 0;
    cursor: pointer;
    width: 100%;
    transition: background .15s;
  }
  .fmp-btn-outline:hover { background: #fff5f2; }
  .fmp-btn-detail {
    background: #f4f5f8;
    border: none;
    border-radius: 10px;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    font-family: Inter, sans-serif;
    padding: 9px 0;
    cursor: pointer;
    width: 100%;
    transition: background .15s;
  }
  .fmp-btn-detail:hover { background: #e5e7eb; }

  /* ═══ ПУСТОЕ СОСТОЯНИЕ ═══ */
  .fmp-empty {
    text-align: center;
    padding: 80px 24px;
    background: #fff;
    border-radius: 18px;
    border: 1.5px solid #f0f0f0;
    color: #9ca3af;
  }
  .fmp-empty-icon { font-size: 56px; margin-bottom: 16px; }
  .fmp-empty h3 { font-size: 18px; font-weight: 800; color: #374151; margin: 0 0 8px; }
  .fmp-empty p { font-size: 14px; line-height: 1.6; max-width: 360px; margin: 0 auto 24px; }
  .fmp-empty-btn {
    display: inline-block;
    padding: 12px 28px;
    background: #e8410a;
    color: #fff;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
    transition: background .15s;
  }
  .fmp-empty-btn:hover { background: #c73208; }

  /* ═══ СКЕЛЕТОН ═══ */
  .fmp-skel-card {
    background: #fff;
    border-radius: 18px;
    border: 1.5px solid #f0f0f0;
    display: flex;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .fmp-skel-img { width: 150px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: skel 1.4s infinite; }
  .fmp-skel-body { flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
  .fmp-skel-line { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: skel 1.4s infinite; border-radius: 6px; }
  @keyframes skel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  @media(max-width: 768px) {
    .fmp-card-right { display: none; }
    .fmp-card-img { width: 100px; min-height: 100px; }
    .fmp-cats-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media(max-width: 500px) {
    .fmp-hero { padding: 36px 0 40px; }
    .fmp-cats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .fmp-card-img { display: none; }
  }
`;

export default function FindMasterPage() {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState([]);
  const [services,   setServices]   = useState([]);
  const [workerStats, setWorkerStats] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('recency');

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getListings()])
      .then(([cats, listings]) => {
        setCategories(cats);
        const processed = (listings || []).map(item => ({
          ...item,
          workerId: item.workerId,
          workerUserId: item.workerId,
          workerName: [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
          priceFrom: item.price || 0,
        }));
        setServices(processed);
        const uniqueIds = [...new Set(processed.map(s => s.workerId))];
        uniqueIds.forEach(async (wid) => {
          try {
            const r = await fetch(`${API}/workers/${wid}/stats`);
            if (r.ok) {
              const stats = await r.json();
              setWorkerStats(prev => ({ ...prev, [wid]: stats }));
            }
          } catch {}
        });
      })
      .catch(e => setError(e?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const selectedCategory = categories.find(c => c.slug === categorySlug);

  /* ══════════════════════════════════
     СТРАНИЦА КАТЕГОРИЙ (без slug)
  ══════════════════════════════════ */
  if (!categorySlug) {
    const totalMasters = [...new Set(services.map(s => s.workerId))].length;
    const activeListings = services.filter(s => s.active !== false).length;

    return (
      <div className="fmp-page">
        <style>{css}</style>

        {/* Hero */}
        <div className="fmp-hero">
          <div className="fmp-hero-inner">
            <h1>Найдите мастера<br/>в Йошкар-Оле</h1>
            <p className="fmp-hero-sub">Профессионалы для любых задач — ремонт, красота, обучение и всё остальное</p>
            <div className="fmp-hero-search">
              <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Что нужно сделать?"
                onChange={e => {
                  if (e.target.value.trim()) navigate('/find-master');
                }}
              />
            </div>
            {!loading && (
              <div className="fmp-hero-stats">
                <div className="fmp-hero-stat">
                  <span className="fmp-hero-stat-val">{categories.length}</span>
                  <span className="fmp-hero-stat-label">категорий</span>
                </div>
                <div className="fmp-hero-stat">
                  <span className="fmp-hero-stat-val">{totalMasters}</span>
                  <span className="fmp-hero-stat-label">мастеров</span>
                </div>
                <div className="fmp-hero-stat">
                  <span className="fmp-hero-stat-val">{activeListings}</span>
                  <span className="fmp-hero-stat-label">активных объявлений</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Сетка категорий */}
        <div className="fmp-cats-section">
          <div className="fmp-cats-heading">Все категории услуг</div>
          {loading ? (
            <div className="fmp-cats-grid">
              {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} style={{ borderRadius: 20, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
                  <div className="fmp-skel-line" style={{ height: 130 }}/>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="fmp-skel-line" style={{ height: 10, width: '40%' }}/>
                    <div className="fmp-skel-line" style={{ height: 16, width: '70%' }}/>
                    <div className="fmp-skel-line" style={{ height: 12, width: '50%' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="fmp-empty"><div className="fmp-empty-icon">😕</div><h3>{error}</h3></div>
          ) : (
            <div className="fmp-cats-grid">
              {categories.map(cat => {
                const meta = CAT_META[cat.slug] || { emoji: '🛠️', g1: '#6b7280', g2: '#9ca3af', tag: 'Услуги' };
                const count = services
                  .filter(s => (s.category === cat.name || s.categoryId === cat.id) && s.active !== false)
                  .length;
                return (
                  <Link key={cat.id} to={`/find-master/${cat.slug}`} className="fmp-cat-card">
                    {/* Иллюстрированный верх */}
                    <div
                      className="fmp-cat-card-top"
                      style={{ background: `linear-gradient(135deg, ${meta.g1} 0%, ${meta.g2} 100%)` }}
                    >
                      <span className="fmp-cat-emoji">{meta.emoji}</span>
                    </div>
                    {/* Нижняя часть */}
                    <div className="fmp-cat-card-body">
                      <span className="fmp-cat-card-tag">{meta.tag}</span>
                      <p className="fmp-cat-card-name">{cat.name}</p>
                      <div className="fmp-cat-card-bottom">
                        {count > 0 ? (
                          <span
                            className="fmp-cat-count-badge"
                            style={{ background: `linear-gradient(90deg, ${meta.g1}, ${meta.g2})` }}
                          >
                            👤 {count} {count === 1 ? 'мастер' : count < 5 ? 'мастера' : 'мастеров'}
                          </span>
                        ) : (
                          <span className="fmp-cat-count-zero">Нет объявлений</span>
                        )}
                        <span className="fmp-cat-arr">›</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════
     СТРАНИЦА КОНКРЕТНОЙ КАТЕГОРИИ
  ══════════════════════════════════ */
  if (!loading && !selectedCategory) {
    return (
      <div className="fmp-page">
        <style>{css}</style>
        <div className="fmp-wrap" style={{ paddingTop: 48, textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', marginBottom: 16 }}>Категория не найдена</p>
          <Link to="/find-master" className="fmp-empty-btn">← К категориям</Link>
        </div>
      </div>
    );
  }

  const visibleServices = services
    .filter(item => {
      const catMatch =
        item.category === selectedCategory?.name ||
        item.categoryId === selectedCategory?.id ||
        String(item.categoryId) === String(selectedCategory?.id);
      if (!catMatch) return false;
      if (showActiveOnly && !item.active) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.trim().toLowerCase();
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.workerName || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc')  return (a.priceFrom || 0) - (b.priceFrom || 0);
      if (sortBy === 'priceDesc') return (b.priceFrom || 0) - (a.priceFrom || 0);
      if (sortBy === 'name')      return (a.workerName || '').localeCompare(b.workerName || '');
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const catMeta = CAT_META[selectedCategory?.slug] || { emoji: '🛠️', g1: '#6b7280', g2: '#9ca3af' };

  return (
    <div className="fmp-page">
      <style>{css}</style>

      {/* Хедер категории */}
      <div className="fmp-cat-hdr">
        <div className="fmp-cat-hdr-inner">
          <button className="fmp-back" onClick={() => navigate('/find-master')}>
            ← Все категории
          </button>
          <div className="fmp-cat-title-row">
            <div className="fmp-cat-icon">
              <span style={{ fontSize: 30 }}>{catMeta.emoji}</span>
            </div>
            <div>
              <h1 className="fmp-cat-name">{selectedCategory?.name}</h1>
              <p className="fmp-cat-sub">
                {visibleServices.length > 0
                  ? `${visibleServices.length} ${visibleServices.length === 1 ? 'мастер' : visibleServices.length < 5 ? 'мастера' : 'мастеров'} в этой категории`
                  : 'Найдите проверенного мастера'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="fmp-filters">
        <div className="fmp-filters-inner">
          <div className="fmp-search-pill">
            <svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Поиск мастера или услуги..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}
              >×</button>
            )}
          </div>

          <select
            className="fmp-sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="recency">По новизне</option>
            <option value="priceAsc">Цена ↑</option>
            <option value="priceDesc">Цена ↓</option>
            <option value="name">По имени</option>
          </select>

          <label className={`fmp-toggle-pill${showActiveOnly ? ' active' : ''}`}>
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={e => setShowActiveOnly(e.target.checked)}
            />
            <span className="fmp-toggle-dot"/>
            Только активные
          </label>

          <div className="fmp-count-badge">
            {visibleServices.length} мастеров
          </div>
        </div>
      </div>

      {/* Список */}
      <div className="fmp-wrap">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="fmp-skel-card">
                <div className="fmp-skel-img" style={{ width: 150, minHeight: 150 }}/>
                <div className="fmp-skel-body">
                  <div className="fmp-skel-line" style={{ height: 22, width: '35%' }}/>
                  <div className="fmp-skel-line" style={{ height: 18, width: '65%' }}/>
                  <div className="fmp-skel-line" style={{ height: 13, width: '80%' }}/>
                  <div className="fmp-skel-line" style={{ height: 13, width: '55%' }}/>
                  <div className="fmp-skel-line" style={{ height: 22, width: '28%' }}/>
                </div>
              </div>
            ))}
          </>
        ) : visibleServices.length === 0 ? (
          <div className="fmp-empty">
            <div className="fmp-empty-icon">🔍</div>
            <h3>Мастера не найдены</h3>
            <p>
              {showActiveOnly
                ? 'Пока нет активных объявлений в этой категории. Попробуйте снять фильтр.'
                : 'В этой категории пока нет мастеров.'}
            </p>
            <Link to="/find-master" className="fmp-empty-btn">← Все категории</Link>
          </div>
        ) : (
          <div className="fmp-list">
            {visibleServices.map(s => {
              const stats    = workerStats[s.workerId || s.workerUserId];
              const hasPhoto = s.photos?.length > 0;
              const workerAva = stats?.workerAvatar || s.workerAvatar || null;
              const wid      = s.workerId || s.workerUserId;

              return (
                <div key={s.id} className="fmp-card">

                  {/* Фото объявления → детальная страница объявления */}
                  <div
                    className="fmp-card-img"
                    onClick={() => navigate(`/listings/${s.id}`)}
                  >
                    {hasPhoto ? (
                      <>
                        <img src={s.photos[0]} alt=""/>
                        {s.photos.length > 1 && (
                          <span className="fmp-card-img-cnt">📷 {s.photos.length}</span>
                        )}
                        <div className="fmp-card-img-overlay">Подробнее</div>
                      </>
                    ) : (
                      <>
                        <div className="fmp-card-img-ph">{catMeta.emoji}</div>
                        <div className="fmp-card-img-overlay">Подробнее</div>
                      </>
                    )}
                  </div>

                  {/* Основной контент */}
                  <div className="fmp-card-body">

                    {/* Чип мастера → профиль мастера */}
                    <div
                      className="fmp-card-worker"
                      onClick={() => navigate(`/workers/${wid}`)}
                    >
                      {workerAva && workerAva.length > 10 ? (
                        <img src={workerAva} alt="" className="fmp-card-ava"/>
                      ) : (
                        <div
                          className="fmp-card-ava-ph"
                          style={{ background: `linear-gradient(135deg, ${catMeta.g1}, ${catMeta.g2})` }}
                        >
                          {(s.workerName || 'М')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fmp-card-worker-name">{s.workerName}</div>
                        <div className="fmp-card-worker-city">Йошкар-Ола</div>
                      </div>
                      <span className="fmp-card-worker-arrow">→ профиль</span>
                    </div>

                    {/* Название → детальная страница объявления */}
                    <div
                      className="fmp-card-title"
                      onClick={() => navigate(`/listings/${s.id}`)}
                    >
                      {s.title}
                    </div>

                    {/* Описание */}
                    {s.description && (
                      <div className="fmp-card-desc">{s.description}</div>
                    )}

                    {/* Бейджи */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="fmp-card-badge">✓ Проверен</span>
                      <span className="fmp-card-badge">⚡ Быстрый отклик</span>
                      <span className="fmp-card-badge">🛡️ Гарантия</span>
                    </div>

                    {/* Статистика */}
                    {stats && (
                      <div className="fmp-card-stats">
                        <span className="fmp-stars">{'★'.repeat(Math.min(5, Math.round(stats.averageRating || 0)))}</span>
                        <span className="fmp-card-rating-val">{(stats.averageRating || 0).toFixed(1)}</span>
                        <span style={{ color: '#9ca3af' }}>
                          ({stats.reviewsCount || 0} {stats.reviewsCount === 1 ? 'отзыв' : stats.reviewsCount < 5 ? 'отзыва' : 'отзывов'})
                        </span>
                        <span style={{ color: '#9ca3af' }}>· 📦 {stats.completedWorksCount || 0} заказов</span>
                      </div>
                    )}

                    {/* Цена */}
                    <div className="fmp-card-price">
                      {s.priceFrom
                        ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽`
                        : 'Цена по договорённости'}
                      {s.priceUnit && <span className="fmp-card-price-unit">{s.priceUnit}</span>}
                    </div>
                  </div>

                  {/* Правая панель действий */}
                  <div className="fmp-card-right">
                    <button
                      className="fmp-btn-primary"
                      onClick={() => navigate(`/chat/${wid}`)}
                    >
                      💬 Написать
                    </button>
                    <button
                      className="fmp-btn-outline"
                      onClick={() => navigate(`/categories/${categorySlug}`)}
                    >
                      Заказать
                    </button>
                    <button
                      className="fmp-btn-detail"
                      onClick={() => navigate(`/listings/${s.id}`)}
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
