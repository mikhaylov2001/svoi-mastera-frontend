import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount, getListings } from '../api';
import { rankItemsBySmartMatch, listingHaystack } from '../utils/smartSearch';
import { CUSTOMER_HOME_PATH, WORKER_HOME_PATH } from '../constants/homePaths';
import {
  CUSTOMER_DESKTOP_LINKS,
  WORKER_DESKTOP_LINKS,
  isNavTabActive,
} from '../constants/appNavConfig';
import { dispatchSameRouteRefetch, isSameNavDest } from '../utils/sameRouteRefetch';
import { getCategoryPlaceholderPhotoUrlOrDefault } from '../utils/categoryPlaceholderPhoto';
import { getListingPublishedPriceNumber } from '../utils/listingPublishedPrice';
import './Header.css';
import FavoriteHeartButton from './FavoriteHeartButton';
import BrandLogo from './BrandLogo';

const NOTIF_API = 'https://svoi-mastera-backend.onrender.com/api/v1/notifications';

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

/** Сердце в шапке — размер как у колокольчика (20px), цвет от ссылки */
function FavoritesNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

const NOTIF_ICONS = {
  NEW_OFFER: '📩',
  OFFER_ACCEPTED: '🎉',
  DEAL_CONFIRMED: '✅',
  DEAL_COMPLETED: '🏆',
  NEW_MESSAGE: '💬',
  DEAL_NEW: '🔔',
  DEAL_STARTED: '🚀',
  DEAL_CANCELLED: '❌',
};

const NOTIF_TONES = {
  NEW_OFFER: 'blue',
  OFFER_ACCEPTED: 'green',
  DEAL_CONFIRMED: 'green',
  DEAL_COMPLETED: 'amber',
  NEW_MESSAGE: 'violet',
  DEAL_NEW: 'orange',
  DEAL_STARTED: 'orange',
  DEAL_CANCELLED: 'rose',
};

function notifTone(type) {
  return NOTIF_TONES[type] || 'neutral';
}

function timeAgoShort(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.floor(h / 24)} дн`;
}

function notifCountLabel(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n1 === 1 && n !== 11) return `${count} новое`;
  if (n1 >= 2 && n1 <= 4 && (n < 12 || n > 14)) return `${count} новых`;
  return `${count} новых`;
}

function HeaderNotificationsBell({
  notifCount,
  notifOpen,
  onToggle,
  onClose,
  notifs,
  onMarkAllRead,
  onMarkOneRead,
  className = '',
  buttonClassName = '',
}) {
  useEffect(() => {
    if (!notifOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notifOpen, onClose]);

  return (
    <div
      className={`header-notif-wrap${className ? ` ${className}` : ''}`}
      tabIndex={-1}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onClose();
      }}
    >
      <button
        type="button"
        className={`header-notif-btn${notifOpen ? ' is-open' : ''}${buttonClassName ? ` ${buttonClassName}` : ''}`}
        onClick={onToggle}
        aria-label="Уведомления"
        aria-expanded={notifOpen}
      >
        <BellIcon />
        {notifCount > 0 && (
          <span className="header-notif-badge">
            {notifCount > 99 ? '99+' : notifCount}
          </span>
        )}
      </button>

      {notifOpen && (
        <>
          <button
            type="button"
            className="header-notif-backdrop"
            aria-label="Закрыть уведомления"
            onClick={onClose}
          />

          <div
            className="header-notif-dropdown"
            role="dialog"
            aria-label="Уведомления"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="header-notif-dropdown-head">
              <div className="header-notif-dropdown-head-main">
                <h2 className="header-notif-dropdown-title">Уведомления</h2>
                {notifCount > 0 && (
                  <span className="header-notif-new-pill">
                    {notifCountLabel(notifCount)}
                  </span>
                )}
              </div>
              {notifCount > 0 && (
                <button type="button" className="header-notif-mark-all" onClick={onMarkAllRead}>
                  Прочитать все
                </button>
              )}
            </div>

            <div className="header-notif-dropdown-list">
              {notifs.length === 0 ? (
                <div className="header-notif-empty">
                  <div className="header-notif-empty-visual" aria-hidden>
                    <span className="header-notif-empty-bell">🔔</span>
                  </div>
                  <p className="header-notif-empty-title">Пока тихо</p>
                  <p className="header-notif-empty-text">Здесь появятся отклики, сообщения и статусы сделок</p>
                </div>
              ) : (
                notifs.slice(0, 8).map((n) => {
                  const unread = !(n.isRead ?? n.read);
                  const tone = notifTone(n.type);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={`header-notif-item${unread ? ' is-unread' : ''}`}
                      onClick={() => onMarkOneRead(n)}
                    >
                      <span className={`header-notif-item-icon header-notif-item-icon--${tone}`} aria-hidden>
                        {NOTIF_ICONS[n.type] || '🔔'}
                      </span>
                      <span className="header-notif-item-body">
                        <span className="header-notif-item-top">
                          <span className="header-notif-item-title">{n.title}</span>
                          <span className="header-notif-item-time">{timeAgoShort(n.createdAt)}</span>
                        </span>
                        {n.body ? (
                          <span className="header-notif-item-text">{n.body}</span>
                        ) : null}
                      </span>
                      {unread && <span className="header-notif-item-dot" aria-hidden />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Header() {
  const { userId, userRole, userName, userLastName, userAvatar, logout } = useAuth();
  const BACKEND = 'https://svoi-mastera-backend.onrender.com';
  const fullAvatarUrl = userAvatar
    ? (userAvatar.startsWith('data:') || userAvatar.startsWith('http')
        ? userAvatar
        : BACKEND + userAvatar)
    : '';
  const navigate = useNavigate();
  const location = useLocation();
  const homePath = userRole === 'WORKER' ? WORKER_HOME_PATH : CUSTOMER_HOME_PATH;

  const onRepeatNavClick = (navTo, opts = {}) => (e) => {
    if (isSameNavDest(location.pathname, navTo, opts)) {
      e.preventDefault();
      dispatchSameRouteRefetch(navTo);
    }
  };

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [debouncedQ,     setDebouncedQ]     = useState('');
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [searchListings, setSearchListings] = useState([]);
  const [searchCatalogLoaded, setSearchCatalogLoaded] = useState(false);
  const [searchCatalogLoading, setSearchCatalogLoading] = useState(false);
  const searchWrapRef = useRef(null);
  const [unread,         setUnread]         = useState(0);
  const [notifCount,     setNotifCount]     = useState(0);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [notifs,         setNotifs]         = useState([]);
  const [inAppToasts,    setInAppToasts]    = useState([]); // ВК-стиль тосты
  const prevNotifCount = useRef(0);
  const isFirstLoad    = useRef(true);

  const showInAppToast = useCallback((notif) => {
    const id = `${Date.now()}-${Math.random()}`;
    setInAppToasts(prev => [...prev, { ...notif, toastId: id }]);
    setTimeout(() => setInAppToasts(prev => prev.filter(t => t.toastId !== id)), 5000);
  }, []);

  useEffect(() => {
    let iv;
    async function loadUnread() {
      if (!userId) { setUnread(0); setNotifCount(0); return; }
      try {
        const count = await getUnreadCount(userId);
        setUnread(count || 0);
      } catch { setUnread(0); }
      try {
        const r = await fetch(`${NOTIF_API}/unread-count`, { headers: { 'X-User-Id': userId } });
        if (r.ok) {
          const d = await r.json();
          const newCount = d.count || 0;
          setNotifCount(newCount);

          // Показываем тост если появились новые уведомления
          if (!isFirstLoad.current && newCount > prevNotifCount.current) {
            // Загружаем новые уведомления для показа тоста
            try {
              const nr = await fetch(NOTIF_API, { headers: { 'X-User-Id': userId } });
              if (nr.ok) {
                const all = await nr.json();
                const fresh = all.filter(n => !(n.isRead ?? n.read)).slice(0, newCount - prevNotifCount.current);
                fresh.forEach(n => showInAppToast(n));
              }
            } catch {}
          }
          prevNotifCount.current = newCount;
          isFirstLoad.current = false;
        }
      } catch { setNotifCount(0); }
    }
    loadUnread();
    iv = setInterval(loadUnread, 3000);
    return () => clearInterval(iv);
  }, [userId, showInAppToast]);

  const openNotifs = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    // Загружаем только если список пустой
    if (opening && userId && notifs.length === 0) {
      try {
        const r = await fetch(NOTIF_API, { headers: { 'X-User-Id': userId } });
        if (r.ok) setNotifs(await r.json());
      } catch {}
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    try {
      await fetch(`${NOTIF_API}/read-all`, { method: 'POST', headers: { 'X-User-Id': userId } });
      setNotifCount(0);
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const markOneRead = async (notif) => {
    // 1. Отправляем на сервер
    await fetch(`${NOTIF_API}/${notif.id}/read`, { method: 'POST' }).catch(() => {});
    // 2. Перезагружаем список с сервера
    try {
      const r = await fetch(NOTIF_API, { headers: { 'X-User-Id': userId } });
      if (r.ok) {
        const fresh = await r.json();
        setNotifs(fresh);
        setNotifCount(fresh.filter(n => !(n.isRead ?? n.read)).length);
      }
    } catch {}
    // 3. Навигация
    if (notif.link) {
      setNotifOpen(false);
      navigate(notif.link);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchTerm.trim()), 220);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadSearchCatalog = useCallback(async () => {
    if (searchCatalogLoaded || searchCatalogLoading) return;
    setSearchCatalogLoading(true);
    try {
      const listings = await getListings();
      const processed = (listings || []).map(item => ({
        ...item,
        workerName: [item.workerName, item.workerLastName].filter(Boolean).join(' ') || 'Мастер',
        priceFrom: getListingPublishedPriceNumber(item) || 0,
      }));
      setSearchListings(processed);
      setSearchCatalogLoaded(true);
    } catch {
      setSearchListings([]);
      setSearchCatalogLoaded(true);
    } finally {
      setSearchCatalogLoading(false);
    }
  }, [searchCatalogLoaded, searchCatalogLoading]);

  const headerSearchMatches = useMemo(() => {
    if (!debouncedQ || debouncedQ.length < 2) return [];
    const pool = searchListings.filter((s) => s.active !== false);
    return rankItemsBySmartMatch(pool, debouncedQ, listingHaystack, { limit: 8 });
  }, [searchListings, debouncedQ]);

  const showSearchDropdown = searchFocused && debouncedQ.length >= 2;

  const listingThumb = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${BACKEND}${path}`;
  };

  useEffect(() => {
    if (!searchFocused) return;
    const onDoc = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [searchFocused]);

  useEffect(() => {
    if (!searchFocused) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSearchFocused(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchFocused]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    setSearchFocused(false);
    navigate(`/find-master?q=${encodeURIComponent(q)}`);
    setSearchTerm('');
    setMobileMenuOpen(false);
  };

  const closeSearchUi = () => {
    setSearchFocused(false);
    setSearchTerm('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = userName
    ? userName.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : 'SM';
  return (
    <>
    <header className={`header${userId ? ' header--tab-nav' : ''}`}>
      <div className="container">
        <div className="header-inner">

          {/* ── LOGO ── */}
          <BrandLogo
            to={homePath}
            className="header-logo"
            onClick={(e) => {
              if (location.pathname === homePath) {
                e.preventDefault();
                dispatchSameRouteRefetch(homePath);
              }
            }}
          />

          {/* ── MOBILE: избранное + уведомления ── */}
          {userId && (
            <div className="header-mobile-actions">
              <Link
                to="/favorites"
                className={`header-mobile-action-btn header-mobile-favorites-btn${location.pathname.startsWith('/favorites') ? ' is-active' : ''}`}
                aria-label="Избранное"
                aria-current={location.pathname.startsWith('/favorites') ? 'page' : undefined}
                onClick={onRepeatNavClick('/favorites')}
              >
                <FavoritesNavIcon />
              </Link>

              <HeaderNotificationsBell
                notifCount={notifCount}
                notifOpen={notifOpen}
                onToggle={openNotifs}
                onClose={() => setNotifOpen(false)}
                notifs={notifs}
                onMarkAllRead={markAllRead}
                onMarkOneRead={markOneRead}
                buttonClassName="header-mobile-action-btn"
              />
            </div>
          )}

          {/* ── BURGER (гости) ── */}
          {!userId && (
            <button
              className={`header-burger ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Меню"
              type="button"
            >
              <span /><span /><span />
            </button>
          )}

          {/* ── SEARCH (подсказки без ухода со страницы) ── */}
          <div className="header-search-wrap" ref={searchWrapRef}>
            <form onSubmit={handleSearchSubmit} className="header-search">
              <span className="header-search-icon"><SearchIcon /></span>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => {
                  setSearchFocused(true);
                  loadSearchCatalog();
                }}
                placeholder="Найти мастера или услугу…"
                aria-label="Поиск"
                aria-expanded={showSearchDropdown}
                aria-autocomplete="list"
                aria-controls="header-search-results"
                autoComplete="off"
              />
            </form>
            {showSearchDropdown && (
              <div
                id="header-search-results"
                className="header-search-dropdown"
                role="listbox"
                aria-label="Результаты поиска"
              >
                {!searchCatalogLoaded && searchCatalogLoading ? (
                  <div className="header-search-hint">Загрузка объявлений…</div>
                ) : headerSearchMatches.length === 0 ? (
                  <div className="header-search-hint">
                    Ничего не найдено.
                    <button
                      type="button"
                      className="header-search-linkish"
                      onClick={() => {
                        navigate(`/find-master?q=${encodeURIComponent(debouncedQ)}`);
                        closeSearchUi();
                      }}
                    >
                      Открыть полный каталог
                    </button>
                  </div>
                ) : (
                  <>
                    {headerSearchMatches.map(s => {
                      const ph = (s.photos || [])[0];
                      const src =
                        listingThumb(ph) ||
                        getCategoryPlaceholderPhotoUrlOrDefault({ category: s.category });
                      return (
                        <Link
                          key={s.id}
                          role="option"
                          to={`/listings/${s.id}`}
                          className="header-search-hit"
                          onClick={() => closeSearchUi()}
                        >
                          <div className="header-search-hit-ph">
                            <FavoriteHeartButton kind="listing" id={s.id} variant="compact" />
                            <img src={src} alt="" />
                          </div>
                          <div className="header-search-hit-body">
                            <div className="header-search-hit-title">{s.title || 'Объявление'}</div>
                            <div className="header-search-hit-meta">
                              {[s.workerName, s.category].filter(Boolean).join(' · ')}
                            </div>
                            <div className="header-search-hit-price">
                              {s.priceFrom
                                ? `${Number(s.priceFrom).toLocaleString('ru-RU')} ₽`
                                : 'Договорная'}
                              {s.priceUnit ? ` ${s.priceUnit}` : ''}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      className="header-search-footer"
                      onClick={() => {
                        navigate(`/find-master?q=${encodeURIComponent(debouncedQ)}`);
                        closeSearchUi();
                      }}
                    >
                      Все результаты в каталоге →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── NAV (desktop) ── */}
          <nav className="header-nav">
            {userId && (() => {
              const navLinks = userRole === 'WORKER' ? WORKER_DESKTOP_LINKS : CUSTOMER_DESKTOP_LINKS;
              return navLinks.map((link) => {
                const active = isNavTabActive(location.pathname, link, navLinks);
                const badge = link.badgeKey === 'chat' ? unread : 0;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`header-nav-link header-nav-link--tab${active ? ' active' : ''}`}
                    onClick={onRepeatNavClick(link.to, link.end ? { end: true } : {})}
                  >
                    {link.label}
                    {badge > 0 && (
                      <span className="header-nav-tab-badge">{badge > 99 ? '99+' : badge}</span>
                    )}
                  </Link>
                );
              });
            })()}

            {userId && (
              <Link
                to="/favorites"
                aria-label="Избранное"
                className={`header-nav-link header-nav-favorites${location.pathname.startsWith('/favorites') ? ' active' : ''}`}
                onClick={onRepeatNavClick('/favorites')}
                title="Избранное"
              >
                <span className="header-nav-fav-hit">
                  <span className="header-nav-fav-icwrap">
                    <FavoritesNavIcon />
                  </span>
                </span>
              </Link>
            )}

            {userId && (
              <HeaderNotificationsBell
                notifCount={notifCount}
                notifOpen={notifOpen}
                onToggle={openNotifs}
                onClose={() => setNotifOpen(false)}
                notifs={notifs}
                onMarkAllRead={markAllRead}
                onMarkOneRead={markOneRead}
              />
            )}

            {userId ? (
                <div
                  className={`header-user${menuOpen ? ' header-user--menu-open' : ''}`}
                  onMouseEnter={() => setMenuOpen(true)}
                  onMouseLeave={() => setMenuOpen(false)}
                  tabIndex={0}
                >
                  <div className="header-avatar">
                    {fullAvatarUrl ? (
                      <img src={fullAvatarUrl} alt="" className="header-avatar-img" />
                    ) : (
                      initials
                    )}
                  </div>

                  {menuOpen && (
                    <div className="header-dropdown">
                      <div className="header-dropdown-profile">
                        <div className="header-dropdown-name">
                          {[userName, userLastName].filter(Boolean).join(' ') || 'Профиль'}
                        </div>
                        <span
                          className={
                            userRole === 'WORKER'
                              ? 'header-dropdown-role header-dropdown-role--worker'
                              : 'header-dropdown-role header-dropdown-role--customer'
                          }
                        >
                          {userRole === 'WORKER' ? 'Мастер' : 'Заказчик'}
                        </span>
                      </div>
                      <div className="header-dropdown-actions">
                        <Link
                          to={userRole === 'WORKER' ? '/worker-profile' : '/profile'}
                          className="header-dropdown-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="header-dropdown-item-icon" aria-hidden>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </span>
                          Мой профиль
                        </Link>
                        <button
                          type="button"
                          className="header-dropdown-item header-dropdown-logout"
                          onClick={handleLogout}
                        >
                          <span className="header-dropdown-item-icon" aria-hidden>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                              <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
            ) : (
              <>
                <Link to="/login"    className="header-nav-link">Войти</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
              </>
            )}
          </nav>

          {/* ── MOBILE MENU (только гости) ── */}
          {!userId && mobileMenuOpen && (
            <>
              <div
                className="header-mobile-backdrop"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="header-mobile-menu">
                <Link to="/login" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>Войти</Link>
                <Link to="/register" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>Регистрация</Link>
              </div>
            </>
          )}

        </div>
      </div>
    </header>

    {/* ВК-стиль тосты — правый нижний угол */}
    {inAppToasts.length > 0 && (
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column-reverse', gap:10, maxWidth:360 }}>
        {inAppToasts.map(toast => (
          <div key={toast.toastId}
            onClick={() => {
              markOneRead(toast);
              setInAppToasts(prev => prev.filter(t => t.toastId !== toast.toastId));
            }}
            style={{
              display:'flex', alignItems:'flex-start', gap:12,
              background:'#fff', borderRadius:14, padding:'14px 16px',
              boxShadow:'0 8px 32px rgba(0,0,0,0.18)', cursor:'pointer',
              borderLeft:'4px solid #e8410a',
              animation:'slideInRight .3s cubic-bezier(.16,1,.3,1)',
              minWidth:300,
            }}
          >
            <span style={{ fontSize:22, flexShrink:0, lineHeight:1.2 }}>
              {({'NEW_OFFER':'📩','OFFER_ACCEPTED':'🎉','DEAL_CONFIRMED':'✅','DEAL_COMPLETED':'🏆','NEW_MESSAGE':'💬'})[toast.type] || '🔔'}
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#111827', marginBottom:3 }}>{toast.title}</div>
              <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.5,
                overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                {toast.body}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setInAppToasts(prev => prev.filter(t => t.toastId !== toast.toastId)); }}
              style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:18, padding:0, flexShrink:0, lineHeight:1 }}>
              ×
            </button>
          </div>
        ))}
      </div>
    )}

    <style>{`
      @keyframes slideInRight {
        from { opacity:0; transform:translateX(40px); }
        to   { opacity:1; transform:translateX(0); }
      }
    `}</style>
    </>
  );
}

export default Header;