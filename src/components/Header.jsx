import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';
import './Header.css';

const NOTIF_API = 'https://svoi-mastera-backend.onrender.com/api/v1/notifications';

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function LogoIcon() {
  return <span style={{ fontSize: 28 }}>🔨</span>;
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
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm,     setSearchTerm]     = useState('');
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
    iv = setInterval(loadUnread, 15000);
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

  const NOTIF_ICONS = {
    NEW_OFFER:      '📩',
    OFFER_ACCEPTED: '🎉',
    DEAL_CONFIRMED: '✅',
    DEAL_COMPLETED: '🏆',
    NEW_MESSAGE:    '💬',
  };

  function timeAgoShort(d) {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return `${m} мин`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч`;
    return `${Math.floor(h / 24)} дн`;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/services?q=${encodeURIComponent(q)}`);
    setSearchTerm('');
    setMobileMenuOpen(false);
  };

  // Закрывать дропдаун при клике вне — через ref

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = userName
    ? userName.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : 'SM';

  return (
    <>
    <header className="header">
      <div className="container">
        <div className="header-inner">

          {/* ── LOGO ── */}
          <Link to="/" className="header-logo">
            <LogoIcon />
            <span className="header-logo-text">СвоиМастера</span>
          </Link>

          {/* ── BURGER ── */}
          <button
            className={`header-burger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Меню"
            type="button"
          >
            <span /><span /><span />
          </button>

          {/* ── SEARCH ── */}
          <form onSubmit={handleSearchSubmit} className="header-search">
            <span className="header-search-icon"><SearchIcon /></span>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Найти мастера или услугу…"
              aria-label="Поиск"
            />
          </form>

          {/* ── NAV ── */}
          <nav className="header-nav">
            <NavLink
              to="/" end
              className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
            >
              Главная
            </NavLink>

            {userId && userRole === 'WORKER' ? (
              <>
                {/* ══ НАВИГАЦИЯ ДЛЯ МАСТЕРА ══ */}
                <NavLink
                  to="/find-work"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Найти работу
                </NavLink>
                <NavLink
                  to="/active-clients"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Активные клиенты
                </NavLink>
                <NavLink
                  to="/chat"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Сообщения
                  {unread > 0 && (
                    <span className="header-unread-badge">{unread}</span>
                  )}
                </NavLink>
                <NavLink
                  to="/deals"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Мои сделки
                </NavLink>
              </>
            ) : userId ? (
              <>
                {/* ══ НАВИГАЦИЯ ДЛЯ ЗАКАЗЧИКА ══ */}
                <NavLink
                  to="/categories"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Найти мастера
                </NavLink>
                <NavLink
                  to="/find-master"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Активные мастера
                </NavLink>
                <NavLink
                  to="/chat"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Сообщения
                  {unread > 0 && (
                    <span className="header-unread-badge">{unread}</span>
                  )}
                </NavLink>
                <NavLink
                  to="/deals"
                  className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                >
                  Мои сделки
                </NavLink>
              </>
            ) : (
              <>
                {/* ══ ДЛЯ НЕАВТОРИЗОВАННЫХ — только Войти/Регистрация ══ */}
              </>
            )}

            {/* 🔔 Колокольчик уведомлений */}
            {userId && (
              <div style={{ position:'relative' }} tabIndex={-1}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setNotifOpen(false); }}
              >
                <button
                  onClick={openNotifs}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'6px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', color:'var(--gray-600)', transition:'color .15s' }}
                  title="Уведомления"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {notifCount > 0 && (
                    <span style={{ position:'absolute', top:2, right:2, minWidth:16, height:16, borderRadius:999, background:'#e8410a', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', lineHeight:1 }}>
                      {notifCount > 99 ? '99+' : notifCount}
                    </span>
                  )}
                </button>

                {/* Дропдаун уведомлений */}
                {notifOpen && (
                  <div
                    style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:360, maxHeight:480, background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', border:'1px solid #e5e7eb', zIndex:1000, overflow:'hidden', display:'flex', flexDirection:'column' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Шапка */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 10px', borderBottom:'1px solid #f3f4f6' }}>
                      <span style={{ fontSize:15, fontWeight:800, color:'#111827' }}>Уведомления</span>
                      {notifCount > 0 && (
                        <button onClick={markAllRead}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#e8410a', fontWeight:600 }}>
                          Прочитать все
                        </button>
                      )}
                    </div>

                    {/* Список */}
                    <div style={{ overflowY:'auto', flex:1 }}>
                      {notifs.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'32px 16px', color:'#9ca3af' }}>
                          <div style={{ fontSize:32, marginBottom:8 }}>🔔</div>
                          <p style={{ fontSize:13, margin:0 }}>Уведомлений пока нет</p>
                        </div>
                      ) : notifs.slice(0, 6).map(n => (
                        <div key={n.id}
                          onClick={() => markOneRead(n)}
                          style={{
                            display:'flex', gap:12, padding:'12px 16px', cursor:'pointer',
                            background: (n.isRead ?? n.read) ? '#fff' : 'rgba(232,65,10,0.04)',
                            borderBottom:'1px solid #f9fafb', transition:'background .15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background='#fff'}
                        >
                          <div style={{ fontSize:20, flexShrink:0, lineHeight:1.3 }}>
                            {NOTIF_ICONS[n.type] || '🔔'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                              <span style={{ fontSize:13, fontWeight: (n.isRead ?? n.read) ? 600 : 800, color:'#111827', lineHeight:1.3 }}>
                                {n.title}
                              </span>
                              {!(n.isRead ?? n.read) && (
                                <div style={{ width:8, height:8, borderRadius:'50%', background:'#e8410a', flexShrink:0, marginTop:4 }} />
                              )}
                            </div>
                            <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                              {n.body}
                            </p>
                            <span style={{ fontSize:11, color:'#9ca3af', marginTop:3, display:'block' }}>
                              {timeAgoShort(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {userId ? (
                <div
                  className="header-user"
                  onClick={() => setMenuOpen(v => !v)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  tabIndex={0}
                >
                  <div className="header-avatar">
                    {fullAvatarUrl
                      ? <img src={fullAvatarUrl} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
                      : initials
                    }
                  </div>

                  {menuOpen && (
                    <div className="header-dropdown">
                      <div className="header-dropdown-name">
                        {[userName, userLastName].filter(Boolean).join(' ') || 'Профиль'}
                      </div>
                      <div className="header-dropdown-role">
                        {userRole === 'WORKER' ? 'Мастер' : 'Заказчик'}
                      </div>
                      <div className="header-dropdown-divider" />
                      <Link
                        to="/profile"
                        className="header-dropdown-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Мой профиль
                      </Link>
                      <button
                        className="header-dropdown-item header-dropdown-logout"
                        onClick={handleLogout}
                      >
                        Выйти
                      </button>
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

          {/* ── MOBILE MENU ── */}
          {mobileMenuOpen && (
            <>
              <div
                className="header-mobile-backdrop"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="header-mobile-menu">
                <NavLink to="/" end className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  Главная
                </NavLink>

                {userId && userRole === 'WORKER' ? (
                  <>
                    {/* ══ МОБИЛЬНОЕ МЕНЮ МАСТЕРА ══ */}
                    <NavLink to="/find-work" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Найти работу
                    </NavLink>
                    <NavLink to="/active-clients" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Активные клиенты
                    </NavLink>
                    <NavLink to="/chat" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Сообщения {unread > 0 && `• ${unread}`}
                    </NavLink>
                    <NavLink to="/deals" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Мои сделки
                    </NavLink>
                  </>
                ) : userId ? (
                  <>
                    {/* ══ МОБИЛЬНОЕ МЕНЮ ЗАКАЗЧИКА ══ */}
                    <NavLink to="/categories" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Найти мастера
                    </NavLink>
                    <NavLink to="/find-master" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Активные мастера
                    </NavLink>
                    <NavLink to="/chat" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Сообщения {unread > 0 && `• ${unread}`}
                    </NavLink>
                    <NavLink to="/deals" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Мои сделки
                    </NavLink>
                  </>
                ) : (
                  // Неавторизованные — пустой блок
                  null
                )}

                {userId && (
                  <>
                    <NavLink to="/profile" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                      Профиль
                    </NavLink>
                    <button
                      type="button"
                      className="header-mobile-link header-mobile-logout"
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    >
                      Выйти
                    </button>
                  </>
                )}

                {!userId && (
                  <>
                    <Link to="/login"    className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>Войти</Link>
                    <Link to="/register" className="header-mobile-link" onClick={() => setMobileMenuOpen(false)}>Регистрация</Link>
                  </>
                )}
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
