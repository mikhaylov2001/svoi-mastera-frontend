import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCategories, getListings, acceptListingDeal, getMyDeals, cancelPendingDeal } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES_BY_SECTION } from '../../pages/CategoriesPage';

const API = 'https://svoi-mastera-backend.onrender.com/api/v1';

/* Плоский словарь slug → данные категории (фото, описание, цена, …) */
const CAT_ALL = {};
Object.values(CATEGORIES_BY_SECTION).forEach(cats =>
  cats.forEach(cat => { CAT_ALL[cat.slug] = cat; })
);

const HERO_PHOTO = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80';

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
    height: 300px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }
  .fmp-hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(.5) saturate(1.15);
  }
  .fmp-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(170deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.65) 100%);
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
    font-size: clamp(26px, 4vw, 40px);
    font-weight: 900;
    color: #fff;
    margin: 0 0 8px;
    letter-spacing: -.4px;
    line-height: 1.15;
  }
  .fmp-hero-sub {
    font-size: 15px;
    color: rgba(255,255,255,.7);
    margin: 0 0 22px;
  }
  .fmp-hero-searchrow {
    display: flex;
    gap: 10px;
    max-width: 600px;
  }
  .fmp-hero-searchbox {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border-radius: 10px;
    padding: 0 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,.3);
  }
  .fmp-hero-searchbox input {
    flex: 1;
    border: none;
    background: none;
    font-size: 15px;
    padding: 13px 0;
    outline: none;
    font-family: Inter, sans-serif;
    color: #1a1a1a;
  }
  .fmp-hero-searchbox input::placeholder { color: #bbb; }
  .fmp-hero-searchbtn {
    background: #e8410a;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    font-family: Inter, sans-serif;
    padding: 12px 24px;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(232,65,10,.5);
    flex-shrink: 0;
  }
  .fmp-hero-searchbtn:hover { background: #c73208; }
  .fmp-hero-stats {
    display: flex;
    gap: 20px;
    margin-top: 20px;
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
    padding: 7px 14px;
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

  /* Карточка категории — стиль CategoriesPage */
  .fmp-cat-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    border: 1.5px solid #e8e8e8;
    transition: box-shadow .22s, transform .22s, border-color .22s;
  }
  .fmp-cat-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,.13);
    transform: translateY(-4px);
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
  .fmp-cat-price { font-size: 13px; font-weight: 700; color: #e8410a; }
  .fmp-cat-count { font-size: 12px; color: #aaa; margin-top: 1px; }
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
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid #e8e8e8;
    background: #fff;
  }
  .fmp-sb-cat-photo {
    position: relative;
    height: 110px;
    overflow: hidden;
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
    border: 1.5px solid #e8e8e8;
    border-radius: 12px;
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
  .fmp-rating-opt.active { border-color: #e8410a; background: #fff5f2; color: #e8410a; font-weight: 700; }
  .fmp-stars-filter { color: #f59e0b; font-size: 13px; }

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
  .fmp-result-count { margin-left: auto; font-size: 13px; color: #aaa; font-weight: 500; white-space: nowrap; }

  /* ══ КАРТОЧКИ ОБЪЯВЛЕНИЙ ══ */
  .fmp-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .fmp-card {
    background: #fff;
    border: 1.5px solid #e8e8e8;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow .2s, border-color .2s, transform .2s;
  }
  .fmp-card:hover {
    box-shadow: 0 6px 28px rgba(0,0,0,.1);
    border-color: #d0d0d0;
    transform: translateY(-2px);
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
  .fmp-card-photo-ph-ico { font-size: 38px; }
  .fmp-card-photo-ph-txt { font-size: 12px; font-weight: 600; }
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
  .fmp-card-worker-sub--active {
    font-size: 11px;
    color: #22c55e;
    font-weight: 600;
    margin-top: 1px;
    line-height: 1.35;
  }
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
  .fmp-stars { color: #f59e0b; font-size: 11px; letter-spacing: .5px; }
  .fmp-rating-val { font-weight: 800; color: #1a1a1a; font-size: 12px; }

  .fmp-card-footer {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #f5f5f5;
  }
  .fmp-card-footer-pending {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #f5f5f5;
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
  @media(max-width: 620px) {
    .fmp-list { grid-template-columns: 1fr; }
    .fmp-cats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .fmp-hero { height: 260px; }
    .fmp-hero h1 { font-size: 24px; }
  }
`;

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
    setLoading(true);
    const dealsPromise = userId ? getMyDeals(userId).catch(() => []) : Promise.resolve([]);
    Promise.all([getCategories(), getListings(), dealsPromise])
      .then(([cats, listings, deals]) => {
        setCategories(cats);
        buildPendingFromDeals(deals);
        const processed = (listings || []).map(item => ({
          ...item,
          workerId:  item.workerId,
          workerName: [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
          priceFrom:  item.price || 0,
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
  }, [userId, buildPendingFromDeals]);

  const resetFilters = useCallback(() => {
    setSearchTerm(''); setSearchInput('');
    setShowActive(true); setOnlyVerified(false); setOnlyWithPhoto(false);
    setSortBy('recency'); setPriceMin(''); setPriceMax(''); setRatingMin(0);
  }, []);

  const selectedCategory = categories.find(c => c.slug === categorySlug);

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
          <img src={HERO_PHOTO} alt="" className="fmp-hero-bg"/>
          <div className="fmp-hero-overlay"/>
          <div className="fmp-hero-body">
            <h1>Найти мастера<br/>в Йошкар-Оле</h1>
            <p className="fmp-hero-sub">Ремонт, красота, обучение и всё остальное — мастера рядом</p>
            <div className="fmp-hero-searchrow">
              <div className="fmp-hero-searchbox">
                <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && searchInput.trim()) setSearchTerm(searchInput); }}
                  placeholder="Что нужно сделать?"
                />
              </div>
              <button className="fmp-hero-searchbtn" onClick={() => setSearchTerm(searchInput)}>
                Найти
              </button>
            </div>
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

        {/* Сетка категорий */}
        <div className="fmp-cats-wrap">
          <div className="fmp-cats-label">Все категории услуг</div>
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
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
              <p style={{ color: '#888' }}>{error}</p>
            </div>
          ) : (
            <div className="fmp-cats-grid">
              {categories.map(cat => {
                const meta  = CAT_ALL[cat.slug] || {};
                const count = services.filter(s =>
                  (s.category === cat.name || s.categoryId === cat.id) && s.active !== false
                ).length;

                return (
                  <Link key={cat.id} to={`/find-master/${cat.slug}`} className="fmp-cat-card">
                    <div className="fmp-cat-img-wrap">
                      {meta.photo
                        ? <img src={meta.photo} alt={cat.name} loading="lazy"/>
                        : <div className="fmp-cat-img-ph">{meta.emoji || '🛠️'}</div>
                      }
                      <span className="fmp-cat-badge">
                        {count > 0 ? `${count} ${count === 1 ? 'мастер' : count < 5 ? 'мастера' : 'мастеров'}` : 'Нет объявл.'}
                      </span>
                    </div>
                    <div className="fmp-cat-body">
                      <div className="fmp-cat-name">{cat.name}</div>
                      <div className="fmp-cat-desc">{meta.desc || cat.description || 'Профессиональные мастера'}</div>
                      <div className="fmp-cat-footer">
                        <div>
                          {meta.priceFrom && <div className="fmp-cat-price">{meta.priceFrom}</div>}
                          {count > 0 && <div className="fmp-cat-count">{count} {count === 1 ? 'мастер' : count < 5 ? 'мастера' : 'мастеров'}</div>}
                        </div>
                        <div className="fmp-cat-go">›</div>
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

  const hasFilters = !showActive || onlyVerified || onlyWithPhoto || priceMin || priceMax || ratingMin > 0 || searchTerm;

  return (
    <div className="fmp-page">
      <style>{css}</style>

      {/* Топ-бар поиска */}
      <div className="fmp-topbar">
        <div className="fmp-topbar-inner">
          <div className="fmp-search-wrap">
            <svg width="15" height="15" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearchTerm(searchInput); }}
              placeholder={`Поиск в «${selectedCategory?.name || '...'}»`}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: 18, lineHeight: 1, padding: 0 }}>
                ×
              </button>
            )}
          </div>
          <button className="fmp-topbar-btn" onClick={() => setSearchTerm(searchInput)}>Найти</button>
        </div>
      </div>

      {/* Хлебные крошки */}
      <div className="fmp-breadcrumb">
        <Link to="/find-master">Все категории</Link>
        <span className="fmp-breadcrumb-sep">›</span>
        <span className="fmp-breadcrumb-cur">{selectedCategory?.name}</span>
        {!loading && (
          <>
            <span className="fmp-breadcrumb-sep">·</span>
            <span>{visible.length} {visible.length === 1 ? 'объявление' : visible.length < 5 ? 'объявления' : 'объявлений'}</span>
          </>
        )}
      </div>

      {/* Layout */}
      <div className="fmp-cat-page">

        {/* Сайдбар */}
        <aside className="fmp-sidebar">

          {/* Карточка категории с реальным фото */}
          <div className="fmp-sb-cat">
            <div className="fmp-sb-cat-photo">
              {catMeta.photo
                ? <img src={catMeta.photo} alt={selectedCategory?.name}/>
                : <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{catMeta.emoji || '🛠️'}</div>
              }
              <div className="fmp-sb-cat-photo-overlay">
                <span className="fmp-sb-cat-name">{selectedCategory?.name}</span>
              </div>
            </div>
            <div className="fmp-sb-cat-body">
              <button className="fmp-sb-back" onClick={() => navigate('/find-master')}>
                ← Все категории
              </button>
            </div>
          </div>

          {/* Цена */}
          <div className="fmp-filter-card">
            <div className="fmp-filter-title">Цена, ₽</div>
            <div className="fmp-filter-body">
              <div className="fmp-price-row">
            <div>
                  <div className="fmp-price-label">От</div>
                  <input className="fmp-price-inp" type="number" min="0" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)}/>
                </div>
                <div>
                  <div className="fmp-price-label">До</div>
                  <input className="fmp-price-inp" type="number" min="0" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)}/>
            </div>
          </div>
        </div>
      </div>

          {/* Рейтинг */}
          <div className="fmp-filter-card">
            <div className="fmp-filter-title">Рейтинг</div>
            <div className="fmp-filter-body">
              {[
                { r: 0,   label: 'Любой' },
                { r: 4,   label: '4.0+', stars: '★★★★' },
                { r: 4.5, label: '4.5+', stars: '★★★★½' },
              ].map(({ r, label, stars }) => (
                <button key={r} className={`fmp-rating-opt${ratingMin === r ? ' active' : ''}`} onClick={() => setRatingMin(r)}>
                  {stars && <span className="fmp-stars-filter">{stars}</span>}
                  {label}
                </button>
              ))}
          </div>
          </div>

          {/* Параметры */}
          <div className="fmp-filter-card">
            <div className="fmp-filter-title">Параметры</div>
            <div className="fmp-filter-body">
              <CheckItem checked={showActive}    onChange={() => setShowActive(v => !v)}>Только активные</CheckItem>
              <CheckItem checked={onlyVerified}  onChange={() => setOnlyVerified(v => !v)}>Проверенные мастера</CheckItem>
              <CheckItem checked={onlyWithPhoto} onChange={() => setOnlyWithPhoto(v => !v)}>С фотографиями</CheckItem>
        </div>
      </div>

          {hasFilters && (
            <button className="fmp-reset-btn" onClick={resetFilters}>✕ Сбросить фильтры</button>
          )}
        </aside>

        {/* Основная зона */}
        <div className="fmp-main">

          {/* Сортировка */}
          <div className="fmp-sort-bar">
            <span className="fmp-sort-label">Сортировать:</span>
            <div className="fmp-sort-opts">
              {[
                { val: 'recency',   label: 'Новые' },
                { val: 'priceAsc',  label: 'Цена ↑' },
                { val: 'priceDesc', label: 'Цена ↓' },
              ].map(o => (
                <button
                  key={o.val}
                  type="button"
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
                <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8e8e8', overflow: 'hidden' }}>
                  <div className="sk" style={{ paddingTop: '62%', borderRadius: 0 }}/>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="sk" style={{ height: 12, width: '45%' }}/>
                    <div className="sk" style={{ height: 16, width: '80%' }}/>
                    <div className="sk" style={{ height: 11, width: '90%' }}/>
                    <div className="sk" style={{ height: 20, width: '35%', marginTop: 4 }}/>
                </div>
              </div>
            ))}
          </div>
          ) : visible.length === 0 ? (
            <div className="fmp-list">
          <div className="fmp-empty">
                <div className="fmp-empty-ico">🔍</div>
                <h3>Объявлений не найдено</h3>
                <p>{hasFilters ? 'Измените параметры или сбросьте фильтры.' : 'В этой категории пока нет объявлений.'}</p>
                {hasFilters
                  ? <button className="fmp-empty-btn" onClick={resetFilters}>Сбросить фильтры</button>
                  : <Link to="/find-master" className="fmp-empty-btn">← Все категории</Link>
                }
              </div>
          </div>
        ) : (
          <div className="fmp-list">
              {visible.map(s => {
                const stats  = workerStats[s.workerId];
                const wid    = s.workerId;
                const photos = s.photos || [];
                const hasPhoto = photos.length > 0;
                const ava    = stats?.workerAvatar || s.workerAvatar || null;
                const locLine = (() => {
                  const addr = s.address && String(s.address).trim();
                  if (addr) return addr.length > 120 ? `${addr.slice(0, 120)}…` : addr;
                  const c = s.city && String(s.city).trim();
                  if (c) return c;
                  return 'Йошкар-Ола';
                })();
                const masterActiveSub = s.active !== false
                  ? `● Активный мастер · ${locLine}`
                  : `Мастер · ${locLine}`;

              return (
                  <div key={s.id} className="fmp-card">

                    {/* Фото → объявление */}
                    <div className="fmp-card-photo" onClick={() => navigate(`/listings/${s.id}`)}>
                      {hasPhoto ? (
                        <>
                          <img src={photos[0]} alt={s.title}/>
                          {s.active !== false && <span className="fmp-card-photo-active">АКТИВНО</span>}
                          {photos.length > 1 && <span className="fmp-card-photo-cnt">📷 {photos.length}</span>}
                          <div className="fmp-card-photo-hover">Смотреть</div>
                        </>
                      ) : (
                        <>
                          <div className="fmp-card-photo-ph">
                            <span className="fmp-card-photo-ph-ico">{catMeta.emoji || '🛠️'}</span>
                            <span className="fmp-card-photo-ph-txt">Нет фото</span>
                          </div>
                          {s.active !== false && <span className="fmp-card-photo-active">АКТИВНО</span>}
                        </>
                      )}
                  </div>

                    {/* Миниатюры доп. фото */}
                    {photos.length > 1 && (
                      <div className="fmp-thumbs">
                        {photos.slice(1, 4).map((p, i) => (
                          <img key={i} src={p} alt="" className="fmp-thumb" onClick={() => navigate(`/listings/${s.id}`)}/>
                        ))}
                        {photos.length > 4 && (
                          <div className="fmp-thumb-more" onClick={() => navigate(`/listings/${s.id}`)}>
                            +{photos.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="fmp-card-body">

                      {/* Мастер → профиль */}
                      <Link to={`/workers/${wid}`} className="fmp-card-worker">
                        {ava && ava.length > 10
                          ? <img src={ava} alt="" className="fmp-card-ava"/>
                          : <div className="fmp-card-ava-ph" style={{ background: `linear-gradient(135deg, #e8410a, #ff7043)` }}>
                              {(s.workerName || 'М')[0].toUpperCase()}
                            </div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="fmp-card-worker-name">{s.workerName}</div>
                          <div className={s.active !== false ? 'fmp-card-worker-sub fmp-card-worker-sub--active' : 'fmp-card-worker-sub'}>
                            {masterActiveSub}
                          </div>
                        </div>
                        <span className="fmp-card-worker-chev">›</span>
                      </Link>

                      {/* Название → объявление */}
                      <div className="fmp-card-title" onClick={() => navigate(`/listings/${s.id}`)}>
                        {s.title}
                      </div>

                      {s.description && <div className="fmp-card-desc">{s.description}</div>}

                      <div className="fmp-card-badges">
                        <span className="fmp-badge fmp-badge-v">✓ Проверен</span>
                        <span className="fmp-badge fmp-badge-f">⚡ Отклик</span>
                        <span className="fmp-badge fmp-badge-g">🛡 Гарантия</span>
                    </div>

                    {stats && (
                        <div className="fmp-card-stats">
                          <span className="fmp-stars">
                            {'★'.repeat(Math.min(5, Math.round(stats.averageRating || 0)))}
                            {'☆'.repeat(Math.max(0, 5 - Math.round(stats.averageRating || 0)))}
                          </span>
                          <span className="fmp-rating-val">{(stats.averageRating || 0).toFixed(1)}</span>
                          <span>({stats.reviewsCount || 0} {(stats.reviewsCount || 0) === 1 ? 'отзыв' : (stats.reviewsCount || 0) < 5 ? 'отзыва' : 'отзывов'})</span>
                          {stats.completedWorksCount > 0 && <span>· 📦 {stats.completedWorksCount} заказов</span>}
                      </div>
                    )}

                      {pendingDeals[String(s.id)] ? (
                        /* ── Pending: цена сверху, ссылка и баннер ниже ── */
                        <div className="fmp-card-footer-pending">
                          <div className="fmp-card-price-block">
                            <div className="fmp-card-price">
                              {s.priceFrom ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                            </div>
                            {s.priceUnit && <span className="fmp-card-price-unit">{s.priceUnit}</span>}
                          </div>
                          <div style={{ display:'flex', justifyContent:'flex-end' }}>
                            <button
                              type="button"
                              className="fmp-pending-link"
                              onClick={(e) => { e.stopPropagation(); navigate('/deals'); }}
                            >
                              К сделкам →
                            </button>
                          </div>
                          <div className="fmp-pending-banner">
                            <span>⏳ Ждём подтверждения мастера</span>
                            <span style={{ fontWeight: 400, color: '#78350f' }}>
                              Мастер должен принять заказ
                            </span>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4, alignItems:'center' }}>
                              <button
                                type="button"
                                className="fmp-pending-link"
                                disabled={cancellingListingId === s.id}
                                onClick={(e) => { e.stopPropagation(); handleCancelPendingListing(s.id); }}
                                style={{ color: '#b91c1c', fontWeight: 700 }}
                              >
                                {cancellingListingId === s.id ? 'Отменяем…' : 'Отменить заявку'}
                              </button>
                            </div>
                            {acceptErr[s.id] && (
                              <div className="fmp-card-action-err" style={{ alignSelf: 'stretch', textAlign: 'left', maxWidth: 'none' }}>{acceptErr[s.id]}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="fmp-card-footer">
                          <div className="fmp-card-price-block">
                            <div className="fmp-card-price">
                              {s.priceFrom ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽` : 'Договорная'}
                            </div>
                            {s.priceUnit && <span className="fmp-card-price-unit">{s.priceUnit}</span>}
                          </div>
                          <div className="fmp-card-actions">
                            <button
                              type="button"
                              className="fmp-btn-accept"
                              disabled={acceptingId === s.id || String(userId) === String(wid)}
                              title={String(userId) === String(wid) ? 'Нельзя принять своё объявление' : ''}
                              onClick={(e) => { e.stopPropagation(); handleAcceptListing(s.id, wid); }}
                            >
                              {acceptingId === s.id ? '⏳ Оформляем…' : '✓ Принять сразу'}
                            </button>
                            <button
                              type="button"
                              className="fmp-btn-msg"
                              onClick={(e) => { e.stopPropagation(); navigate(`/chat/${wid}`); }}
                            >
                              💬 Написать
                            </button>
                            {acceptErr[s.id] && (
                              <div className="fmp-card-action-err">{acceptErr[s.id]}</div>
                            )}
                          </div>
                        </div>
                      )}
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
