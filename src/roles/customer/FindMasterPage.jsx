import React, { useEffect, useState, useCallback } from 'react';
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

  *, *::before, *::after { box-sizing: border-box; }

  .fmp-page {
    background: #f5f5f5;
    min-height: 100vh;
    font-family: Inter, Arial, sans-serif;
    color: #1a1a1a;
  }

  /* ══ ШАПКА ПОИСКА (авито-стиль) ══ */
  .fmp-topbar {
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    padding: 16px 0;
  }
  .fmp-topbar-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .fmp-search-wrap {
    flex: 1;
    min-width: 260px;
    position: relative;
    display: flex;
    align-items: center;
    background: #fff;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    padding: 0 14px;
    transition: border-color .15s;
  }
  .fmp-search-wrap:focus-within { border-color: #e8410a; }
  .fmp-search-wrap input {
    flex: 1;
    border: none;
    background: none;
    font-size: 15px;
    padding: 12px 8px;
    outline: none;
    font-family: Inter, sans-serif;
    color: #1a1a1a;
  }
  .fmp-search-wrap input::placeholder { color: #b0b0b0; }
  .fmp-search-btn {
    background: #e8410a;
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    padding: 12px 24px;
    cursor: pointer;
    white-space: nowrap;
    transition: background .15s;
    flex-shrink: 0;
  }
  .fmp-search-btn:hover { background: #c73208; }

  /* ══ ХЛЕБНЫЕ КРОШКИ ══ */
  .fmp-breadcrumb {
    max-width: 1180px;
    margin: 0 auto;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #999;
  }
  .fmp-breadcrumb a {
    color: #999;
    text-decoration: none;
    transition: color .15s;
  }
  .fmp-breadcrumb a:hover { color: #e8410a; }
  .fmp-breadcrumb-sep { color: #ccc; }
  .fmp-breadcrumb-cur { color: #1a1a1a; font-weight: 500; }

  /* ══ ГЛАВНАЯ — HERO ══ */
  .fmp-home-hero {
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    padding: 32px 20px 28px;
  }
  .fmp-home-hero-inner {
    max-width: 1180px;
    margin: 0 auto;
  }
  .fmp-home-hero h1 {
    font-size: 28px;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0 0 6px;
    letter-spacing: -.3px;
  }
  .fmp-home-hero-sub {
    font-size: 14px;
    color: #888;
    margin: 0 0 20px;
  }
  .fmp-home-search {
    display: flex;
    gap: 10px;
    max-width: 640px;
    margin-bottom: 24px;
  }
  .fmp-home-search-inp {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    padding: 0 14px;
    background: #fff;
    transition: border-color .15s;
  }
  .fmp-home-search-inp:focus-within { border-color: #e8410a; }
  .fmp-home-search-inp input {
    flex: 1;
    border: none;
    background: none;
    font-size: 15px;
    padding: 12px 0;
    outline: none;
    font-family: Inter, sans-serif;
  }
  .fmp-home-search-inp input::placeholder { color: #b0b0b0; }
  .fmp-home-stats {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }
  .fmp-home-stat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #666;
  }
  .fmp-home-stat-val {
    font-size: 16px;
    font-weight: 800;
    color: #1a1a1a;
  }

  /* ══ СЕТКА КАТЕГОРИЙ ══ */
  .fmp-cats-wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: 24px 20px 60px;
  }
  .fmp-cats-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #999;
    margin-bottom: 14px;
  }
  .fmp-cats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px;
  }
  .fmp-cat-card {
    text-decoration: none;
    color: inherit;
    background: #fff;
    border-radius: 10px;
    border: 1px solid #e8e8e8;
    overflow: hidden;
    transition: transform .18s, box-shadow .18s, border-color .18s;
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }
  .fmp-cat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,.1);
    border-color: rgba(232,65,10,.3);
  }
  .fmp-cat-card-top {
    height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .fmp-cat-emoji {
    font-size: 48px;
    line-height: 1;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,.25));
    position: relative;
    z-index: 1;
  }
  .fmp-cat-card-body {
    padding: 12px 14px 14px;
    background: #fff;
    border-top: 1px solid rgba(0,0,0,.06);
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .fmp-cat-card-name {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.3;
    margin: 0;
  }
  .fmp-cat-card-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }
  .fmp-cat-count {
    font-size: 12px;
    font-weight: 600;
    color: #e8410a;
  }
  .fmp-cat-count-zero {
    font-size: 12px;
    color: #bbb;
  }
  .fmp-cat-arrow {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1.5px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #999;
    transition: all .15s;
  }
  .fmp-cat-card:hover .fmp-cat-arrow {
    border-color: #e8410a;
    background: #e8410a;
    color: #fff;
  }

  /* ══ СТРАНИЦА КАТЕГОРИИ — LAYOUT ══ */
  .fmp-cat-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 20px 20px 60px;
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 20px;
    align-items: flex-start;
  }

  /* ══ SIDEBAR ФИЛЬТРЫ ══ */
  .fmp-sidebar {
    position: sticky;
    top: 80px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .fmp-filter-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .fmp-filter-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    padding: 14px 16px 12px;
    border-bottom: 1px solid #f0f0f0;
  }
  .fmp-filter-body { padding: 14px 16px; }

  /* Цена */
  .fmp-price-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }
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
  .fmp-price-label {
    font-size: 11px;
    color: #999;
    margin-bottom: 4px;
  }

  /* Чекбокс фильтры */
  .fmp-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    cursor: pointer;
    font-size: 13px;
    color: #333;
    user-select: none;
    border-radius: 6px;
    transition: color .15s;
  }
  .fmp-check-item:hover { color: #e8410a; }
  .fmp-check-box {
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .15s;
  }
  .fmp-check-box.checked {
    background: #e8410a;
    border-color: #e8410a;
  }
  .fmp-check-tick {
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }

  /* Рейтинг фильтр */
  .fmp-rating-opt {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    border: 1.5px solid #e8e8e8;
    background: #fff;
    color: #555;
    transition: all .15s;
    margin-bottom: 6px;
    width: 100%;
    font-family: Inter, sans-serif;
  }
  .fmp-rating-opt.active {
    border-color: #e8410a;
    background: #fff5f2;
    color: #e8410a;
    font-weight: 700;
  }
  .fmp-stars-filter { color: #f59e0b; font-size: 13px; letter-spacing: 1px; }

  /* Сброс */
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
    margin-top: 4px;
  }
  .fmp-reset-btn:hover { background: #fee8e0; border-color: #e8410a; color: #e8410a; }

  /* ══ ПРАВАЯ ЧАСТЬ ══ */
  .fmp-main { min-width: 0; }

  /* Топбар сортировки */
  .fmp-sort-bar {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .fmp-sort-label { font-size: 13px; color: #888; white-space: nowrap; }
  .fmp-sort-opts { display: flex; gap: 6px; flex-wrap: wrap; }
  .fmp-sort-opt {
    padding: 6px 14px;
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
  .fmp-sort-opt.active {
    border-color: #e8410a;
    background: #e8410a;
    color: #fff;
  }
  .fmp-sort-opt:hover:not(.active) { border-color: #aaa; }
  .fmp-result-count {
    margin-left: auto;
    font-size: 13px;
    color: #888;
    white-space: nowrap;
  }

  /* ══ КАРТОЧКИ ОБЪЯВЛЕНИЙ (авито-стиль) ══ */
  .fmp-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .fmp-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow .18s, border-color .18s;
    cursor: default;
  }
  .fmp-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,.1);
    border-color: #d0d0d0;
  }

  /* Фото — кликабельно → объявление */
  .fmp-card-photo {
    width: 100%;
    padding-top: 66%;
    position: relative;
    background: #f5f5f5;
    cursor: pointer;
    overflow: hidden;
  }
  .fmp-card-photo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .35s;
  }
  .fmp-card-photo:hover img { transform: scale(1.04); }
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
  .fmp-card-photo-ph-ico { font-size: 40px; }
  .fmp-card-photo-ph-txt { font-size: 12px; font-weight: 600; }
  .fmp-card-photo-cnt {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0,0,0,.55);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(2px);
  }
  .fmp-card-photo-hover {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.25);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity .2s;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .03em;
  }
  .fmp-card-photo:hover .fmp-card-photo-hover { opacity: 1; }
  .fmp-card-photo-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #e8410a;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  /* Тело карточки */
  .fmp-card-body {
    padding: 12px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Мастер-чип — кликабелен → профиль */
  .fmp-card-worker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    width: fit-content;
    max-width: 100%;
    transition: opacity .15s;
  }
  .fmp-card-worker:hover { opacity: .75; }
  .fmp-card-ava {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid #f0f0f0;
  }
  .fmp-card-ava-ph {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 11px;
    flex-shrink: 0;
  }
  .fmp-card-worker-info { min-width: 0; }
  .fmp-card-worker-name {
    font-size: 12px;
    font-weight: 700;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fmp-card-worker-sub {
    font-size: 11px;
    color: #999;
    line-height: 1;
    margin-top: 1px;
  }

  /* Название → объявление */
  .fmp-card-title {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.35;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    cursor: pointer;
    transition: color .15s;
    text-decoration: none;
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

  /* Бейджи */
  .fmp-card-badges {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  .fmp-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    background: #f5f5f5;
    color: #555;
    white-space: nowrap;
  }
  .fmp-badge-verified { background: #e6f4ea; color: #1a7340; }
  .fmp-badge-fast     { background: #fff3e0; color: #b45309; }
  .fmp-badge-guard    { background: #ede9fe; color: #5b21b6; }

  /* Статистика */
  .fmp-card-stats {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #888;
    flex-wrap: wrap;
  }
  .fmp-stars { color: #f59e0b; font-size: 11px; letter-spacing: .5px; }
  .fmp-card-rating-val { font-weight: 800; color: #1a1a1a; font-size: 12px; }

  /* Нижний ряд карточки */
  .fmp-card-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
    padding-top: 6px;
    border-top: 1px solid #f5f5f5;
  }
  .fmp-card-price {
    font-size: 18px;
    font-weight: 900;
    color: #1a1a1a;
    letter-spacing: -.3px;
    line-height: 1;
  }
  .fmp-card-price-unit {
    font-size: 11px;
    color: #999;
    font-weight: 400;
    display: block;
    margin-top: 2px;
  }
  .fmp-card-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }
  .fmp-btn-msg {
    background: #e8410a;
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    padding: 8px 14px;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
  }
  .fmp-btn-msg:hover { background: #c73208; }
  .fmp-btn-order {
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 7px;
    color: #333;
    font-size: 12px;
    font-weight: 600;
    font-family: Inter, sans-serif;
    padding: 7px 14px;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
  }
  .fmp-btn-order:hover { border-color: #e8410a; color: #e8410a; }

  /* Миниатюры фото */
  .fmp-card-thumbs {
    display: flex;
    gap: 4px;
    margin-top: 2px;
  }
  .fmp-card-thumb {
    width: 38px;
    height: 28px;
    border-radius: 4px;
    object-fit: cover;
    border: 1.5px solid #f0f0f0;
    cursor: pointer;
    transition: border-color .15s;
    flex-shrink: 0;
  }
  .fmp-card-thumb:hover { border-color: #e8410a; }
  .fmp-card-thumb-more {
    width: 38px;
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

  /* ══ ПУСТОЕ СОСТОЯНИЕ ══ */
  .fmp-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 72px 24px;
    background: #fff;
    border-radius: 10px;
    border: 1px solid #e8e8e8;
  }
  .fmp-empty-icon { font-size: 52px; margin-bottom: 14px; }
  .fmp-empty h3 { font-size: 17px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }
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
  }

  /* ══ СКЕЛЕТОН ══ */
  @keyframes skel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .fmp-skel-bg {
    background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
    background-size: 200% 100%;
    animation: skel 1.4s infinite;
    border-radius: 6px;
  }
  .fmp-skel-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
  }

  /* ══ АДАПТИВ ══ */
  @media(max-width: 900px) {
    .fmp-cat-page { grid-template-columns: 1fr; }
    .fmp-sidebar { position: static; display: grid; grid-template-columns: 1fr 1fr; }
    .fmp-list { grid-template-columns: 1fr 1fr; }
  }
  @media(max-width: 600px) {
    .fmp-list { grid-template-columns: 1fr; }
    .fmp-cats-grid { grid-template-columns: repeat(2, 1fr); }
    .fmp-sidebar { grid-template-columns: 1fr; }
    .fmp-home-hero h1 { font-size: 22px; }
  }
`;

/* Вспомогательные компоненты */
function CheckItem({ checked, onChange, children }) {
  return (
    <div className="fmp-check-item" onClick={onChange}>
      <div className={`fmp-check-box${checked ? ' checked' : ''}`}>
        {checked && <span className="fmp-check-tick">✓</span>}
      </div>
      <span>{children}</span>
    </div>
  );
}

export default function FindMasterPage() {
  const navigate  = useNavigate();
  const { categorySlug } = useParams();

  const [categories,   setCategories]   = useState([]);
  const [services,     setServices]     = useState([]);
  const [workerStats,  setWorkerStats]  = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  /* Фильтры */
  const [searchTerm,    setSearchTerm]    = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [showActive,    setShowActive]    = useState(true);
  const [onlyVerified,  setOnlyVerified]  = useState(false);
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [sortBy,        setSortBy]        = useState('recency');
  const [priceMin,      setPriceMin]      = useState('');
  const [priceMax,      setPriceMax]      = useState('');
  const [ratingMin,     setRatingMin]     = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCategories(), getListings()])
      .then(([cats, listings]) => {
        setCategories(cats);
        const processed = (listings || []).map(item => ({
          ...item,
          workerId:    item.workerId,
          workerName:  [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
          priceFrom:   item.price || 0,
        }));
        setServices(processed);
        const ids = [...new Set(processed.map(s => s.workerId))];
        ids.forEach(async (wid) => {
          try {
            const r = await fetch(`${API}/workers/${wid}/stats`);
            if (r.ok) {
              const st = await r.json();
              setWorkerStats(prev => ({ ...prev, [wid]: st }));
            }
          } catch {}
        });
      })
      .catch(e => setError(e?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm(''); setSearchInput('');
    setShowActive(true); setOnlyVerified(false); setOnlyWithPhoto(false);
    setSortBy('recency'); setPriceMin(''); setPriceMax(''); setRatingMin(0);
  }, []);

  const selectedCategory = categories.find(c => c.slug === categorySlug);

  /* ════════════════════════════════
     ГЛАВНАЯ — список категорий
  ════════════════════════════════ */
  if (!categorySlug) {
    const totalMasters   = [...new Set(services.map(s => s.workerId))].length;
    const activeListings = services.filter(s => s.active !== false).length;

    return (
      <div className="fmp-page">
        <style>{css}</style>

        {/* Hero */}
        <div className="fmp-home-hero">
          <div className="fmp-home-hero-inner">
            <h1>Найти мастера в Йошкар-Оле</h1>
            <p className="fmp-home-hero-sub">
              Профессионалы для любых задач — ремонт, красота, обучение и многое другое
            </p>
            <div className="fmp-home-search">
              <div className="fmp-home-search-inp">
                <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && searchInput.trim()) { setSearchTerm(searchInput); } }}
                  placeholder="Что нужно сделать? Например: ремонт ванной"
                />
              </div>
              <button className="fmp-search-btn" onClick={() => setSearchTerm(searchInput)}>
                Найти
              </button>
            </div>

            {!loading && (
              <div className="fmp-home-stats">
                {[
                  { val: categories.length, label: 'категорий услуг' },
                  { val: totalMasters,      label: 'мастеров' },
                  { val: activeListings,    label: 'активных объявлений' },
                ].map(({ val, label }) => (
                  <div key={label} className="fmp-home-stat">
                    <span className="fmp-home-stat-val">{val}</span>
                    <span style={{ marginLeft: 6 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Категории */}
        <div className="fmp-cats-wrap">
          <div className="fmp-cats-label">Все категории услуг</div>

          {loading ? (
            <div className="fmp-cats-grid">
              {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} style={{ borderRadius: 10, overflow: 'hidden', background: '#fff', border: '1px solid #e8e8e8' }}>
                  <div className="fmp-skel-bg" style={{ height: 110 }}/>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="fmp-skel-bg" style={{ height: 14, width: '70%' }}/>
                    <div className="fmp-skel-bg" style={{ height: 11, width: '45%' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="fmp-empty"><div className="fmp-empty-icon">😕</div><h3>{error}</h3></div>
          ) : (
            <div className="fmp-cats-grid">
              {categories.map(cat => {
                const meta  = CAT_META[cat.slug] || { emoji: '🛠️', g1: '#6b7280', g2: '#9ca3af', tag: 'Услуги' };
                const count = services.filter(s =>
                  (s.category === cat.name || s.categoryId === cat.id) && s.active !== false
                ).length;

                return (
                  <Link key={cat.id} to={`/find-master/${cat.slug}`} className="fmp-cat-card">
                    <div
                      className="fmp-cat-card-top"
                      style={{ background: `linear-gradient(145deg, ${meta.g1}, ${meta.g2})` }}
                    >
                      <span className="fmp-cat-emoji">{meta.emoji}</span>
                    </div>
                    <div className="fmp-cat-card-body">
                      <p className="fmp-cat-card-name">{cat.name}</p>
                      <div className="fmp-cat-card-info">
                        {count > 0
                          ? <span className="fmp-cat-count">👤 {count} {count === 1 ? 'мастер' : count < 5 ? 'мастера' : 'мастеров'}</span>
                          : <span className="fmp-cat-count-zero">Нет объявлений</span>
                        }
                        <span className="fmp-cat-arrow">›</span>
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

  /* ════════════════════════════════
     СТРАНИЦА КАТЕГОРИИ
  ════════════════════════════════ */
  if (!loading && !selectedCategory) {
    return (
      <div className="fmp-page">
        <style>{css}</style>
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
          <p style={{ color: '#888', marginBottom: 16 }}>Категория не найдена</p>
          <Link to="/find-master" className="fmp-empty-btn">← К категориям</Link>
        </div>
      </div>
    );
  }

  /* Фильтрация */
  const visible = services
    .filter(s => {
      const catOk = s.category === selectedCategory?.name || s.categoryId === selectedCategory?.id || String(s.categoryId) === String(selectedCategory?.id);
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
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        if (
          !(s.title || '').toLowerCase().includes(q) &&
          !(s.description || '').toLowerCase().includes(q) &&
          !(s.workerName || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc')  return (a.priceFrom || 0) - (b.priceFrom || 0);
      if (sortBy === 'priceDesc') return (b.priceFrom || 0) - (a.priceFrom || 0);
      if (sortBy === 'rating') {
        const ra = workerStats[a.workerId]?.averageRating || 0;
        const rb = workerStats[b.workerId]?.averageRating || 0;
        return rb - ra;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const catMeta = CAT_META[selectedCategory?.slug] || { emoji: '🛠️', g1: '#6b7280', g2: '#9ca3af' };
  const hasFilters = !showActive || onlyVerified || onlyWithPhoto || priceMin || priceMax || ratingMin > 0 || searchTerm;

  return (
    <div className="fmp-page">
      <style>{css}</style>

      {/* Поиск-топбар */}
      <div className="fmp-topbar">
        <div className="fmp-topbar-inner">
          <div className="fmp-search-wrap" style={{ flex: 1 }}>
            <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearchTerm(searchInput); }}
              placeholder={`Поиск в «${selectedCategory?.name || '...'}»`}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: 18, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>
          <button className="fmp-search-btn" onClick={() => setSearchTerm(searchInput)}>
            Найти
          </button>
        </div>
      </div>

      {/* Хлебные крошки */}
      <div className="fmp-breadcrumb">
        <Link to="/find-master">Все категории</Link>
        <span className="fmp-breadcrumb-sep">›</span>
        <span className="fmp-breadcrumb-cur">{selectedCategory?.name}</span>
        {visible.length > 0 && (
          <>
            <span className="fmp-breadcrumb-sep">·</span>
            <span style={{ color: '#999' }}>{visible.length} {visible.length === 1 ? 'объявление' : visible.length < 5 ? 'объявления' : 'объявлений'}</span>
          </>
        )}
      </div>

      {/* Основной layout */}
      <div className="fmp-cat-page">

        {/* Сайдбар фильтров */}
        <aside className="fmp-sidebar">

          {/* Категория */}
          <div className="fmp-filter-card">
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${catMeta.g1}, ${catMeta.g2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {catMeta.emoji}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>{selectedCategory?.name}</div>
                <button
                  onClick={() => navigate('/find-master')}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: '#e8410a', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', fontWeight: 600, marginTop: 2 }}
                >
                  ← Все категории
                </button>
              </div>
            </div>
          </div>

          {/* Цена */}
          <div className="fmp-filter-card">
            <div className="fmp-filter-title">Цена, ₽</div>
            <div className="fmp-filter-body">
              <div className="fmp-price-row">
                <div>
                  <div className="fmp-price-label">От</div>
                  <input
                    className="fmp-price-inp"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                  />
                </div>
                <div>
                  <div className="fmp-price-label">До</div>
                  <input
                    className="fmp-price-inp"
                    type="number"
                    min="0"
                    placeholder="∞"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Рейтинг */}
          <div className="fmp-filter-card">
            <div className="fmp-filter-title">Рейтинг мастера</div>
            <div className="fmp-filter-body">
              {[0, 4, 4.5].map(r => (
                <button
                  key={r}
                  className={`fmp-rating-opt${ratingMin === r ? ' active' : ''}`}
                  onClick={() => setRatingMin(r)}
                >
                  {r === 0
                    ? 'Любой рейтинг'
                    : <>
                        <span className="fmp-stars-filter">{'★'.repeat(Math.floor(r))}{r % 1 ? '½' : ''}</span>
                        {` ${r}+`}
                      </>
                  }
                </button>
              ))}
            </div>
          </div>

          {/* Параметры */}
          <div className="fmp-filter-card">
            <div className="fmp-filter-title">Параметры</div>
            <div className="fmp-filter-body">
              <CheckItem checked={showActive} onChange={() => setShowActive(v => !v)}>
                Только активные
              </CheckItem>
              <CheckItem checked={onlyVerified} onChange={() => setOnlyVerified(v => !v)}>
                Проверенные мастера
              </CheckItem>
              <CheckItem checked={onlyWithPhoto} onChange={() => setOnlyWithPhoto(v => !v)}>
                С фотографиями
              </CheckItem>
            </div>
          </div>

          {hasFilters && (
            <button className="fmp-reset-btn" onClick={resetFilters}>
              ✕ Сбросить фильтры
            </button>
          )}
        </aside>

        {/* Основная область */}
        <div className="fmp-main">

          {/* Сортировка */}
          <div className="fmp-sort-bar">
            <span className="fmp-sort-label">Сортировать:</span>
            <div className="fmp-sort-opts">
              {[
                { val: 'recency',   label: 'Новые' },
                { val: 'rating',    label: '⭐ Рейтинг' },
                { val: 'priceAsc',  label: 'Цена ↑' },
                { val: 'priceDesc', label: 'Цена ↓' },
              ].map(o => (
                <button
                  key={o.val}
                  className={`fmp-sort-opt${sortBy === o.val ? ' active' : ''}`}
                  onClick={() => setSortBy(o.val)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <span className="fmp-result-count">
              {loading ? '...' : `${visible.length} ${visible.length === 1 ? 'объявление' : visible.length < 5 ? 'объявления' : 'объявлений'}`}
            </span>
          </div>

          {/* Карточки */}
          {loading ? (
            <div className="fmp-list">
              {[1,2,3,4].map(i => (
                <div key={i} className="fmp-skel-card">
                  <div className="fmp-skel-bg" style={{ paddingTop: '66%', borderRadius: 0 }}/>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="fmp-skel-bg" style={{ height: 12, width: '40%' }}/>
                    <div className="fmp-skel-bg" style={{ height: 16, width: '75%' }}/>
                    <div className="fmp-skel-bg" style={{ height: 11, width: '90%' }}/>
                    <div className="fmp-skel-bg" style={{ height: 20, width: '30%', marginTop: 4 }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="fmp-list">
              <div className="fmp-empty">
                <div className="fmp-empty-icon">🔍</div>
                <h3>Объявлений не найдено</h3>
                <p>
                  {hasFilters
                    ? 'Попробуйте изменить параметры фильтрации или сбросить их.'
                    : 'В этой категории пока нет объявлений.'}
                </p>
                {hasFilters
                  ? <button className="fmp-empty-btn" onClick={resetFilters}>Сбросить фильтры</button>
                  : <Link to="/find-master" className="fmp-empty-btn">← Все категории</Link>
                }
              </div>
            </div>
          ) : (
            <div className="fmp-list">
              {visible.map(s => {
                const stats    = workerStats[s.workerId];
                const wid      = s.workerId;
                const photos   = s.photos || [];
                const hasPhoto = photos.length > 0;
                const ava      = stats?.workerAvatar || s.workerAvatar || null;

                return (
                  <div key={s.id} className="fmp-card">

                    {/* Фото → детальная страница объявления */}
                    <div
                      className="fmp-card-photo"
                      onClick={() => navigate(`/listings/${s.id}`)}
                    >
                      {hasPhoto ? (
                        <>
                          <img src={photos[0]} alt={s.title}/>
                          {s.active && <span className="fmp-card-photo-badge">Активно</span>}
                          {photos.length > 1 && (
                            <span className="fmp-card-photo-cnt">
                              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              {photos.length}
                            </span>
                          )}
                          <div className="fmp-card-photo-hover">Смотреть объявление</div>
                        </>
                      ) : (
                        <div className="fmp-card-photo-ph">
                          <span className="fmp-card-photo-ph-ico">{catMeta.emoji}</span>
                          <span className="fmp-card-photo-ph-txt">Нет фото</span>
                        </div>
                      )}
                    </div>

                    {/* Миниатюры дополнительных фото */}
                    {photos.length > 1 && (
                      <div className="fmp-card-thumbs" style={{ padding: '6px 12px 0' }}>
                        {photos.slice(1, 4).map((p, i) => (
                          <img
                            key={i}
                            src={p}
                            alt=""
                            className="fmp-card-thumb"
                            onClick={() => navigate(`/listings/${s.id}`)}
                          />
                        ))}
                        {photos.length > 4 && (
                          <div
                            className="fmp-card-thumb-more"
                            onClick={() => navigate(`/listings/${s.id}`)}
                          >
                            +{photos.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="fmp-card-body">

                      {/* Мастер-чип → профиль */}
                      <div
                        className="fmp-card-worker"
                        onClick={() => navigate(`/workers/${wid}`)}
                      >
                        {ava && ava.length > 10 ? (
                          <img src={ava} alt="" className="fmp-card-ava"/>
                        ) : (
                          <div
                            className="fmp-card-ava-ph"
                            style={{ background: `linear-gradient(135deg, ${catMeta.g1}, ${catMeta.g2})` }}
                          >
                            {(s.workerName || 'М')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="fmp-card-worker-info">
                          <div className="fmp-card-worker-name">{s.workerName}</div>
                          <div className="fmp-card-worker-sub">Йошкар-Ола · Профиль →</div>
                        </div>
                      </div>

                      {/* Название → объявление */}
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
                      <div className="fmp-card-badges">
                        <span className="fmp-badge fmp-badge-verified">✓ Проверен</span>
                        <span className="fmp-badge fmp-badge-fast">⚡ Быстрый отклик</span>
                        <span className="fmp-badge fmp-badge-guard">🛡 Гарантия</span>
                      </div>

                      {/* Рейтинг */}
                      {stats && (
                        <div className="fmp-card-stats">
                          <span className="fmp-stars">
                            {'★'.repeat(Math.min(5, Math.round(stats.averageRating || 0)))}
                            {'☆'.repeat(Math.max(0, 5 - Math.round(stats.averageRating || 0)))}
                          </span>
                          <span className="fmp-card-rating-val">{(stats.averageRating || 0).toFixed(1)}</span>
                          <span>({stats.reviewsCount || 0} {(stats.reviewsCount || 0) === 1 ? 'отзыв' : (stats.reviewsCount || 0) < 5 ? 'отзыва' : 'отзывов'})</span>
                          {stats.completedWorksCount > 0 && (
                            <span>· 📦 {stats.completedWorksCount} заказов</span>
                          )}
                        </div>
                      )}

                      {/* Футер: цена + кнопки */}
                      <div className="fmp-card-footer">
                        <div>
                          <div className="fmp-card-price">
                            {s.priceFrom
                              ? `от ${Number(s.priceFrom).toLocaleString('ru-RU')} ₽`
                              : 'Договорная'}
                          </div>
                          {s.priceUnit && (
                            <span className="fmp-card-price-unit">{s.priceUnit}</span>
                          )}
                        </div>
                        <div className="fmp-card-actions">
                          <button
                            className="fmp-btn-msg"
                            onClick={() => navigate(`/chat/${wid}`)}
                          >
                            💬 Написать
                          </button>
                          <button
                            className="fmp-btn-order"
                            onClick={() => navigate(`/categories/${categorySlug}`)}
                          >
                            Заказать
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
    </div>
  );
}
