import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';
import {
  CUSTOMER_TAB_ITEMS,
  WORKER_TAB_ITEMS,
  isNavTabActive,
} from '../constants/appNavConfig';
import './MobileAppNav.css';

export default function MobileAppNav() {
  const { userId, userRole } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    async function load() {
      try {
        const count = await getUnreadCount(userId);
        if (!cancelled) setUnread(count || 0);
      } catch {
        if (!cancelled) setUnread(0);
      }
    }

    load();
    const iv = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [userId]);

  if (!userId) return null;

  const items = userRole === 'WORKER' ? WORKER_TAB_ITEMS : CUSTOMER_TAB_ITEMS;

  return (
    <nav className="mobile-tab-bar" aria-label="Основная навигация">
      <div className="mobile-tab-bar-inner">
        {items.map((item) => {
          const active = isNavTabActive(pathname, item, items);
          const badge = item.badgeKey === 'chat' && unread > 0 ? unread : 0;
          const Icon = item.Icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`mobile-tab-item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="mobile-tab-icon-wrap">
                <Icon
                  className="mobile-tab-icon"
                  strokeWidth={2}
                  aria-hidden
                />
                {badge > 0 && (
                  <span className="mobile-tab-badge">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>

              <span className="mobile-tab-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
