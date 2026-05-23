import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';

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

function Avatar({ name, url, size = 48, online }) {
  const [err, setErr] = React.useState(false);
  const src = fullUrl(url);
  const ini = (name || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const bg = avatarBg(name);

  return (
    <div className="ci-ava-wrap" style={{ width: size, height: size, flexShrink: 0 }}>
      {src && !err ? (
        <img src={src} alt="" className="ci-ava-img" style={{ width: size, height: size }}
          onError={() => setErr(true)} />
      ) : (
        <div className="ci-ava-ini" style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
          {ini}
        </div>
      )}
      {online && <span className="ci-ava-dot" />}
    </div>
  );
}

function fmtTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Вчера';
    return format(d, 'dd.MM');
  } catch { return ''; }
}

function fmtPreview(txt) {
  if (!txt) return '';
  // Strip reply prefix: "> Name: quoted text\n actual message"
  const replyMatch = txt.match(/^> [^\n]+\n([\s\S]*)$/);
  const clean = replyMatch ? replyMatch[1].trim() : txt;
  if (clean.startsWith('📷') || clean.startsWith('🎥') || clean.startsWith('📎 ')) {
    return clean.split('\n')[0];
  }
  if (clean.startsWith('🎤')) return '🎤 Голосовое';
  if (clean.startsWith('📍')) return '📍 Местоположение';
  return clean;
}

export default function ConversationItem({ conversation: c, isActive, onClick }) {
  const preview = fmtPreview(c.lastMessage);
  return (
    <div
      className={`ci-item${isActive ? ' ci-active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <Avatar name={c.partnerName} url={c.partnerAvatarUrl} size={52} online />
      <div className="ci-body">
        <div className="ci-row">
          <span className={`ci-name${isActive ? ' ci-name-active' : ''}`}>{c.partnerName || 'Чат'}</span>
          <span className="ci-time">{fmtTime(c.lastMessageAt)}</span>
        </div>
        <div className="ci-row ci-row2">
          <span className="ci-preview">{preview || 'Нет сообщений'}</span>
          {(Number(c.unreadCount) || 0) > 0 && (
            <span className="ci-badge">{c.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}
