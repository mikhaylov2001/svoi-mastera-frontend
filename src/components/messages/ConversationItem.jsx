import React from 'react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';

const BACKEND = 'https://svoi-mastera-backend-ntp0.onrender.com';
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

function Avatar({ name, url, size = 52, online }) {
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

/**
 * Returns { icon, text, isReply }
 * icon  — emoji/symbol to show before the text (optional)
 * text  — main preview text
 * isReply — whether it's a reply message
 */
function parsePreview(txt) {
  if (!txt) return { icon: null, text: 'Нет сообщений', isReply: false };

  // Strip reply prefix: "> Name: quoted\n actual text"
  const replyMatch = txt.match(/^> ([^\n:]+): ([^\n]*)\n([\s\S]*)$/);
  if (replyMatch) {
    const replyTo = replyMatch[2].trim();   // quoted text
    const actual  = replyMatch[3].trim();   // what was replied with
    return {
      icon: '↩',
      text: actual || replyTo || 'Ответ',
      subtext: `на: «${replyTo.slice(0, 40)}${replyTo.length > 40 ? '…' : ''}»`,
      isReply: true,
    };
  }

  // Voice
  if (txt.startsWith('🎤') || txt.includes('голосово')) {
    return { icon: '🎤', text: 'Голосовое сообщение', isReply: false };
  }
  // Photo
  if (txt.startsWith('📷') || txt.startsWith('🎥')) {
    const cap = txt.split('\n')[0].replace(/^[📷🎥]\s*/, '').trim();
    return { icon: txt.startsWith('🎥') ? '🎥' : '📷', text: cap || 'Фотография', isReply: false };
  }
  // File
  if (txt.startsWith('📎')) {
    const name = txt.replace(/^📎\s*/, '').split('\n')[0].trim();
    return { icon: '📎', text: name || 'Файл', isReply: false };
  }
  // Location
  if (txt.startsWith('📍')) {
    return { icon: '📍', text: 'Местоположение', isReply: false };
  }

  return { icon: null, text: txt, isReply: false };
}

// Partner is online if they sent a message within the last 5 minutes
function isPartnerOnline(c) {
  const ts = c.partnerLastMessageAt;
  if (!ts) return false;
  try {
    return differenceInMinutes(new Date(), new Date(ts)) < 5;
  } catch { return false; }
}

// Did the current user (not the partner) send the last message?
// If partnerLastMessageAt < lastMessageAt (or partnerLastMessageAt is null), the last message is mine
function isMineLastMessage(c) {
  if (!c.lastMessageAt) return false;
  if (!c.partnerLastMessageAt) return true; // partner never sent → it's mine
  try {
    const mine = new Date(c.lastMessageAt).getTime();
    const theirs = new Date(c.partnerLastMessageAt).getTime();
    // If the timestamps differ by more than 1 second, the last msg is mine
    return mine > theirs + 1000;
  } catch { return false; }
}

export default function ConversationItem({ conversation: c, isActive, onClick }) {
  const { icon, text: previewText, subtext, isReply } = parsePreview(c.lastMessage);
  const online = isPartnerOnline(c);
  const isMe = isMineLastMessage(c);
  const unread = Number(c.unreadCount) || 0;

  return (
    <div
      className={`ci-item${isActive ? ' ci-active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <Avatar name={c.partnerName} url={c.partnerAvatarUrl} size={52} online={online} />

      <div className="ci-body">
        {/* Row 1: name + time */}
        <div className="ci-row">
          <span className={`ci-name${isActive ? ' ci-name-active' : ''}`}>
            {c.partnerName || 'Чат'}
          </span>
          <span className="ci-time">{fmtTime(c.lastMessageAt)}</span>
        </div>

        {/* Row 2: preview + unread badge */}
        <div className="ci-row ci-row2">
          <span className="ci-preview">
            {/* Sender prefix */}
            {isMe
              ? <span className="ci-sender ci-sender--me">Вы: </span>
              : null
            }
            {/* Message type icon */}
            {icon && <span className="ci-prev-icon">{icon} </span>}
            {/* Main text */}
            <span className={isReply ? 'ci-prev-reply' : ''}>{previewText}</span>
            {/* Reply subtext on new line */}
            {subtext && <span className="ci-prev-sub"> {subtext}</span>}
          </span>
          {unread > 0 && <span className="ci-badge">{unread > 99 ? '99+' : unread}</span>}
        </div>
      </div>
    </div>
  );
}
