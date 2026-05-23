import React, { useState } from 'react';
import { ArrowLeft, Search, MoreVertical, Trash2 } from 'lucide-react';

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

function Avatar({ name, url, size = 42 }) {
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
      <span className="ch2-online-dot" />
    </div>
  );
}

export default function ChatHeader({ conversation, onBack, onDelete, onToggleSearch }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="ch2">
      <button className="ch2-back" onClick={onBack} aria-label="Назад">
        <ArrowLeft size={22} />
      </button>

      <Avatar name={conversation?.partnerName} url={conversation?.partnerAvatarUrl} size={42} />

      <div className="ch2-info">
        <div className="ch2-name">{conversation?.partnerName || 'Чат'}</div>
        <div className="ch2-status">
          <span className="ch2-dot" />
          в сети
        </div>
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
