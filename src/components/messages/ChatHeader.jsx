import React, { useState } from 'react';
import { ArrowLeft, Search, MoreVertical, Trash2 } from 'lucide-react';
import {
  format, isToday, isYesterday,
  differenceInMinutes, differenceInHours,
} from 'date-fns';

const BACKEND = 'https://svoi-mastera-backend.onrender.com';
function fullUrl(u) {
  if (!u) return '';
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#e8410a','#0891b2','#db2777'];
function avatarBg(name) {
  const ini = (name || '?').trim()[0]?.toUpperCase() || '?';
  return COLORS[(ini.charCodeAt(0) || 0) % COLORS.length];
}

function Avatar({ name, url, size = 42, isOnline }) {
  const [err, setErr] = React.useState(false);
  const src = fullUrl(url);
  const ini = (name || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const bg = avatarBg(name);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {src && !err ? (
        <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          onError={() => setErr(true)} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%', background: bg,
          color: '#fff', fontWeight: 700, fontSize: size * 0.36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{ini}</div>
      )}
      {isOnline && <span className="ch2-online-dot" />}
    </div>
  );
}

/**
 * Formats "last seen" text from a timestamp.
 * - Within 5 min  → null (show "в сети")
 * - Within 1 hour → "был(а) в сети N минут назад"
 * - Today         → "был(а) в сети сегодня в HH:mm"
 * - Yesterday     → "был(а) в сети вчера в HH:mm"
 * - Older         → "был(а) в сети DD.MM в HH:mm"
 */
function formatLastSeen(ts) {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const mins = differenceInMinutes(now, d);
    if (mins < 1) return null; // effectively online
    if (mins < 60) return `был в сети ${mins} мин. назад`;
    const hrs = differenceInHours(now, d);
    if (hrs < 3) return `был в сети ${hrs} ч. назад`;
    const timeStr = format(d, 'HH:mm');
    if (isToday(d)) return `был в сети сегодня в ${timeStr}`;
    if (isYesterday(d)) return `был в сети вчера в ${timeStr}`;
    return `был в сети ${format(d, 'dd.MM')} в ${timeStr}`;
  } catch { return null; }
}

export default function ChatHeader({ conversation, onBack, onDelete, onToggleSearch, lastPartnerActivityAt }) {
  const [showMenu, setShowMenu] = useState(false);

  const lastSeenText = formatLastSeen(lastPartnerActivityAt);
  // Only show "online" if we have a real timestamp and it's within 5 minutes
  const isOnline = !!lastPartnerActivityAt
    && differenceInMinutes(new Date(), new Date(lastPartnerActivityAt)) < 5;

  return (
    <header className="ch2">
      <button className="ch2-back" onClick={onBack} aria-label="Назад">
        <ArrowLeft size={22} />
      </button>

      <Avatar
        name={conversation?.partnerName}
        url={conversation?.partnerAvatarUrl}
        size={42}
        isOnline={isOnline}
      />

      <div className="ch2-info">
        <div className="ch2-name">{conversation?.partnerName || 'Чат'}</div>
        {isOnline ? (
          <div className="ch2-status">
            <span className="ch2-dot" />
            в сети
          </div>
        ) : (
          <div className="ch2-status ch2-status--offline">
            {lastSeenText || 'был(а) недавно'}
          </div>
        )}
      </div>

      <div className="ch2-actions">
        <button className="ch2-btn" onClick={onToggleSearch} aria-label="Поиск">
          <Search size={18} />
        </button>
        <div style={{ position: 'relative' }}>
          <button className="ch2-btn" onClick={() => setShowMenu(v => !v)} aria-label="Меню">
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="ch2-menu" onClick={() => setShowMenu(false)}>
              <button
                className="ch2-menu-item ch2-menu-item--danger"
                onClick={() => { setShowMenu(false); onDelete?.(); }}
              >
                <Trash2 size={15} />
                Удалить чат
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
