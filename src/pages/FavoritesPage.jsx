import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getListings, getOpenJobRequests, getCategories } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import FavoriteHeartButton from '../components/FavoriteHeartButton';
import { HOME_MARKET_CSS } from './homeMarketCss';
import {
  getCategoryPlaceholderPhotoUrlOrDefault,
} from '../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../utils/listingPublishedPrice';
import {
  formatJobRequestBudgetLabel,
  hasJobRequestPublishedPrice,
} from '../utils/jobRequestBudget';

const BACKEND_ORIGIN = 'https://svoi-mastera-backend.onrender.com';

function mediaUrl(u) {
  if (!u) return null;
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND_ORIGIN + u;
}

export default function FavoritesPage() {
  const { listingIds, jobRequestIds } = useFavorites();
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [L, R, C] = await Promise.all([
          getListings(),
          getOpenJobRequests(),
          getCategories(),
        ]);
        if (cancelled) return;
        setListings(Array.isArray(L) ? L : []);
        setRequests(Array.isArray(R) ? R : []);
        setCategories(Array.isArray(C) ? C : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const catName = useCallback(
    (categoryId) => categories.find((c) => String(c.id) === String(categoryId))?.name || 'Заявка',
    [categories],
  );

  const listingById = useMemo(() => {
    const m = new Map();
    listings.forEach((l) => m.set(String(l.id), l));
    return m;
  }, [listings]);

  const requestById = useMemo(() => {
    const m = new Map();
    requests.forEach((r) => m.set(String(r.id), r));
    return m;
  }, [requests]);

  const favListingSet = useMemo(() => new Set(listingIds.map(String)), [listingIds]);
  const favReqSet = useMemo(() => new Set(jobRequestIds.map(String)), [jobRequestIds]);

  const favListingsOrdered = useMemo(
    () => listingIds.map((id) => ({ id: String(id), listing: listingById.get(String(id)) })),
    [listingIds, listingById],
  );

  const favRequestsOrdered = useMemo(
    () => jobRequestIds.map((id) => ({ id: String(id), req: requestById.get(String(id)) })),
    [jobRequestIds, requestById],
  );

  const pageCss = `
    ${HOME_MARKET_CSS}
    .fav-head { padding: 20px 16px 12px; max-width: 1200px; margin: 0 auto; }
    .fav-head h1 { font-size: 26px; font-weight: 900; margin: 0 0 8px; color: #1a1a1a; letter-spacing: -0.5px; }
    .fav-head p { margin: 0; color: #888; font-size: 14px; }
    .fav-sec { max-width: 1200px; margin: 0 auto; padding: 0 16px 28px; }
    .fav-sec-title { font-size: 15px; font-weight: 800; color: #1a1a1a; margin: 24px 0 12px; }
    .fav-miss {
      grid-column: 1 / -1;
      border: 1px dashed #ddd;
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #fafafa;
    }
    .fav-miss span { font-size: 14px; color: #666; }
  `;

  const empty = favListingSet.size === 0 && favReqSet.size === 0;
  const city = 'Йошкар-Ола';

  return (
    <div className="hp av-page">
      <style>{pageCss}</style>
      <div className="fav-head">
        <h1>Избранное</h1>
        <p>Объявления и заявки, которые вы отметили в каталоге.</p>
      </div>

      {loading ? (
        <div className="fav-sec" style={{ color: '#999', paddingTop: 24 }}>Загрузка…</div>
      ) : err ? (
        <div className="fav-sec" style={{ color: '#c73208' }}>{err}</div>
      ) : empty ? (
        <div className="fav-sec">
          <div className="av-empty" style={{ marginTop: 24 }}>
            <div className="av-empty-ico">♡</div>
            <h3>Пока пусто</h3>
            <p>Добавляйте объявления и заявки в избранное — они появятся здесь.</p>
            <p style={{ marginTop: 12 }}>
              <Link to="/find-master" style={{ color: '#e8410a', fontWeight: 700 }}>Найти мастера</Link>
              {' · '}
              <Link to="/find-work" style={{ color: '#e8410a', fontWeight: 700 }}>Найти работу</Link>
            </p>
          </div>
        </div>
      ) : (
        <>
          {favListingSet.size > 0 && (
            <div className="fav-sec">
              <div className="fav-sec-title">Объявления · {favListingSet.size}</div>
              <div className="av-cards-grid">
                {favListingsOrdered.map(({ id, listing: l }) => {
                  if (!l) {
                    return (
                      <div key={`miss-l-${id}`} className="fav-miss">
                        <span>Объявление недоступно</span>
                        <FavoriteHeartButton kind="listing" id={id} />
                      </div>
                    );
                  }
                  const img0 = l.photos?.[0];
                  const src =
                    mediaUrl(img0) ||
                    getCategoryPlaceholderPhotoUrlOrDefault({ category: l.category }, categories);
                  const avUrl = mediaUrl(l.workerAvatar);
                  const wname =
                    [l.workerName, l.workerLastName].filter(Boolean).join(' ') || 'Мастер';
                  return (
                    <Link key={l.id} to={`/listings/${l.id}`} className="av-card">
                      <div className="av-card-img">
                        <FavoriteHeartButton kind="listing" id={l.id} />
                        <img src={src} alt="" />
                        {l.category ? <span className="av-card-cat">{l.category}</span> : null}
                      </div>
                      <div className="av-card-body">
                        <div className="av-card-price">
                          {(() => {
                            const p = getListingPublishedPriceNumber(l);
                            return p ? `${p.toLocaleString('ru-RU')} ₽` : '— ₽';
                          })()}
                          {l.priceUnit ? (
                            <span className="av-card-price-unit">{l.priceUnit}</span>
                          ) : null}
                        </div>
                        <div className="av-card-title">{l.title || 'Объявление'}</div>
                        <div className="av-card-footer">
                          <div className="av-card-ava">
                            {avUrl ? <img src={avUrl} alt="" /> : (wname || 'М')[0]}
                          </div>
                          <span className="av-card-wname">{wname}</span>
                          <span className="av-card-city">📍 {city}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {favReqSet.size > 0 && (
            <div className="fav-sec">
              <div className="fav-sec-title">Заявки · {favReqSet.size}</div>
              <div className="av-cards-grid">
                {favRequestsOrdered.map(({ id, req: item }) => {
                  if (!item) {
                    return (
                      <div key={`miss-r-${id}`} className="fav-miss">
                        <span>Заявка недоступна или закрыта</span>
                        <FavoriteHeartButton kind="jobRequest" id={id} />
                      </div>
                    );
                  }
                  const catLabel = item.categoryName || catName(item.categoryId);
                  const photoSrc =
                    mediaUrl(item.photos?.[0] || item.photo) ||
                    getCategoryPlaceholderPhotoUrlOrDefault(
                      { categoryName: catLabel, categoryId: item.categoryId },
                      categories,
                    );
                  const budgetLabel = formatJobRequestBudgetLabel(item);
                  const hasPrice = hasJobRequestPublishedPrice(item);
                  const locLine = (item.cityName || item.address || item.addressText || '').trim();
                  const cityShort =
                    item.cityName ||
                    (locLine ? locLine.split(',')[0].trim() : '') ||
                    city;
                  const custName =
                    [item.customerName, item.customerLastName].filter(Boolean).join(' ') || 'Заказчик';
                  return (
                    <Link
                      key={item.id}
                      to={`/find-work?request=${encodeURIComponent(item.id)}`}
                      className="av-card"
                    >
                      <div className="av-card-img">
                        <FavoriteHeartButton kind="jobRequest" id={item.id} />
                        <img src={photoSrc} alt={item.title || ''} loading="lazy" />
                        {catLabel ? <span className="av-card-cat">{catLabel}</span> : null}
                      </div>
                      <div className="av-card-body">
                        <div className="av-card-price">
                          {hasPrice ? budgetLabel : '— ₽'}
                          {hasPrice ? <span className="av-card-price-unit">в заявке</span> : null}
                        </div>
                        <div className="av-card-title">{item.title}</div>
                        <div className="av-card-footer">
                          <div className="av-card-ava">
                            {item.customerAvatar ? (
                              <img src={mediaUrl(item.customerAvatar)} alt="" />
                            ) : (
                              (custName[0] || '?').toUpperCase()
                            )}
                          </div>
                          <span className="av-card-wname">{custName}</span>
                          <span className="av-card-city">📍 {cityShort}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
