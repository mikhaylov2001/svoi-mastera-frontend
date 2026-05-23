import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Check, CheckCheck, Pencil, Trash2, X, MapPin, FileText,
  Copy, Reply, Forward, Play, Pause,
} from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '😍'];

const BACKEND = 'https://svoi-mastera-backend.onrender.com';
function fullUrl(u) {
  if (!u) return '';
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

// ─── Small message avatar ─────────────────────────────────────
const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#e8410a','#0891b2','#db2777'];
function avatarBg(name) {
  const c = (name || '?').trim()[0]?.toUpperCase() || '?';
  return COLORS[(c.charCodeAt(0) || 0) % COLORS.length];
}
function MsgAvatar({ name, url }) {
  const [err, setErr] = React.useState(false);
  const src = fullUrl(url);
  const ini = (name || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  if (src && !err) {
    return (
      <img
        src={src} alt={ini}
        className="mb-ava"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="mb-ava" style={{ background: avatarBg(name) }}>
      {ini}
    </div>
  );
}

// ─── Parse reply prefix from text ────────────────────────────
// Format: "> Name: quoted text\n actual message"
function parseReplyPrefix(text) {
  if (!text) return { replyName: null, replyText: null, mainText: text };
  const match = text.match(/^> ([^\n:]+): ([^\n]*)\n([\s\S]*)$/);
  if (match) {
    return {
      replyName: match[1].trim(),
      replyText: match[2].trim(),
      mainText: match[3].trim(),
    };
  }
  return { replyName: null, replyText: null, mainText: text };
}

// ─── Waveform bar heights (pseudo-random but stable) ─────────
const WAVE_HEIGHTS = [4,7,12,18,22,28,24,20,16,26,30,22,14,8,18,24,28,20,12,6,
                      16,22,30,26,18,10,8,20,24,28,14,6,18,26,22,16,10,20,28,12];

// ─── Audio player ─────────────────────────────────────────────
function AudioPlayer({ url }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="mb-audio">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a && a.duration && isFinite(a.duration)) {
            setProgress(a.currentTime / a.duration);
            setCurrent(a.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); }}
      />
      <button onClick={toggle} className="mb-audio-btn">
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="mb-audio-body">
        {/* Waveform bars */}
        <div className="mb-audio-wave">
          {WAVE_HEIGHTS.map((h, i) => {
            const played = i / WAVE_HEIGHTS.length < progress;
            return (
              <div
                key={i}
                className={`mb-audio-bar ${played ? 'mb-audio-bar--played' : 'mb-audio-bar--unplayed'}`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
        <div className="mb-audio-foot">
          <span className="mb-audio-time">{fmtTime(playing || progress > 0 ? current : duration)}</span>
          <span className="mb-audio-label">голосовое</span>
        </div>
      </div>
    </div>
  );
}

// ─── Message content ────────────────────────────────────────
function MessageContent({ content, attachmentUrl, attachmentType, isMe }) {
  if (attachmentType === 'voice' && attachmentUrl) {
    return <AudioPlayer url={fullUrl(attachmentUrl)} isMe={isMe} />;
  }
  if (content && content.startsWith('🎤 ')) {
    const urlPart = content.slice(3).trim();
    const resolved = fullUrl(urlPart);
    return resolved
      ? <AudioPlayer url={resolved} isMe={isMe} />
      : <div className="mb-voice-stub"><Play size={14} /><span>Голосовое</span></div>;
  }

  // Location
  const locCoords = (attachmentType === 'location' && attachmentUrl)
    ? attachmentUrl
    : (content?.startsWith('📍 ') ? content.slice(3).trim() : null);
  if (locCoords) {
    const [latStr, lonStr] = locCoords.split(',');
    const lat = parseFloat(latStr), lon = parseFloat(lonStr);
    if (isFinite(lat) && isFinite(lon)) {
      const mapSrc = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=14&size=380,160&l=map&pt=${lon},${lat},pm2rdl`;
      return (
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`}
          target="_blank" rel="noreferrer" className="mb-loc">
          <div className="mb-loc-map">
            <img src={mapSrc} alt="map" className="mb-loc-img"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className="mb-loc-pin"><MapPin size={22} /></div>
          </div>
          <div className={`mb-loc-footer${isMe ? ' mb-loc-footer--me' : ''}`}>
            <MapPin size={12} /><span>{lat.toFixed(4)}, {lon.toFixed(4)}</span>
            <span className="mb-loc-open">Открыть</span>
          </div>
        </a>
      );
    }
  }

  // Image
  if (attachmentType === 'image' && attachmentUrl) {
    return <ImageMsg url={fullUrl(attachmentUrl)} caption={content?.replace(/^📷\s*[^\n]*\n?/, '')} />;
  }
  if (attachmentType === 'video' && attachmentUrl) {
    return <ImageMsg url={fullUrl(attachmentUrl)} caption={content?.replace(/^🎥\s*[^\n]*\n?/, '')} isVideo />;
  }

  // File
  if (attachmentType === 'file' && attachmentUrl) {
    const fname = content?.replace(/^📎\s*/, '').split('\n')[0] || 'Файл';
    return (
      <a href={fullUrl(attachmentUrl)} target="_blank" rel="noreferrer"
        className={`mb-file${isMe ? ' mb-file--me' : ''}`}>
        <FileText size={20} className="mb-file-ic" />
        <div className="mb-file-body">
          <p className="mb-file-name">{fname}</p>
          <p className="mb-file-sub">Открыть файл</p>
        </div>
      </a>
    );
  }

  return <p className="mb-text">{content}</p>;
}

function ImageMsg({ url, caption, isVideo }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mb-img-wrap" onClick={() => setOpen(true)}>
        {isVideo ? <video src={url} className="mb-img" muted /> : <img src={url} alt="photo" className="mb-img" />}
        {caption && <div className="mb-img-cap">{caption}</div>}
      </div>
      {open && (
        <div className="mb-img-modal" onClick={() => setOpen(false)}>
          {isVideo
            ? <video src={url} className="mb-img-full" controls autoPlay />
            : <img src={url} alt="full" className="mb-img-full" />}
        </div>
      )}
    </>
  );
}

// ─── Context menu ────────────────────────────────────────────
function ContextMenu({ isMe, onReact, onReply, onEdit, onCopy, onForward, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const items = [
    { icon: Reply,   label: 'Ответить',     action: onReply },
    { icon: Copy,    label: 'Копировать',    action: onCopy },
    { icon: Forward, label: 'Переслать',     action: onForward },
    ...(isMe ? [{ icon: Pencil, label: 'Редактировать', action: onEdit }] : []),
    { icon: Trash2,  label: 'Удалить',       action: onDelete, danger: true },
  ];

  return (
    <div ref={ref} className={`mb-ctx${isMe ? ' mb-ctx--me' : ''}`}>
      {/* Quick reactions row */}
      <div className="mb-ctx-reactions">
        {QUICK_REACTIONS.map(em => (
          <button key={em} className="mb-ctx-react-btn"
            onClick={() => { onReact(em); onClose(); }}>
            {em}
          </button>
        ))}
      </div>
      {/* Action items */}
      <div className="mb-ctx-actions">
        {items.map(({ icon: Icon, label, action, danger }) => (
          <button key={label} onClick={() => { action?.(); onClose(); }}
            className={`mb-ctx-item${danger ? ' mb-ctx-item--danger' : ''}`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Reply quote block inside bubble ─────────────────────────
function ReplyQuote({ name, text, isMe }) {
  return (
    <div className={`mb-quote${isMe ? ' mb-quote--me' : ''}`}>
      <span className={`mb-quote-name${isMe ? ' mb-quote-name--me' : ''}`}>{name}</span>
      <span className={`mb-quote-text${isMe ? ' mb-quote-text--me' : ''}`}>{text}</span>
    </div>
  );
}

// ─── Main bubble ─────────────────────────────────────────────
export default function MessageBubble({
  message: m,
  isMe,
  partnerAvatarUrl,
  partnerName,
  myAvatarUrl,
  myName,
  onDelete,
  onEdit,
  onReact,
  onReply,
  onForward,
  reactions = [],
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);

  // Parse reply prefix from text
  const { replyName, replyText, mainText } = parseReplyPrefix(m.text || '');
  const [editText, setEditText] = useState(mainText || '');
  const editRef = useRef(null);

  useEffect(() => {
    if (editing && editRef.current) {
      const el = editRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [editing]);

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    // Preserve reply prefix when editing
    const saved = replyName ? `> ${replyName}: ${replyText}\n${trimmed}` : trimmed;
    if (saved !== m.text) onEdit?.(m.id, saved);
    setEditing(false);
  };

  const handleCopy = () => {
    const copyText = mainText || m.text || '';
    navigator.clipboard.writeText(copyText).catch(() => {});
  };

  const ts = m.createdAt;
  const timeStr = ts ? (() => { try { return format(new Date(ts), 'HH:mm'); } catch { return ''; } })() : '';

  // For reply data to pass back to parent
  const replyPayload = { name: isMe ? 'Вы' : (m.senderName || 'Собеседник'), text: mainText || m.text || '' };

  // Rich = no extra padding (location, image, video)
  const effectiveText = mainText || m.text || '';
  const isRich = !replyName && (
    m.attachmentType === 'location'
    || m.attachmentType === 'image'
    || m.attachmentType === 'video'
    || effectiveText.startsWith('📍 ')
    || effectiveText.startsWith('🎤 ')
  );
  const isAudio = m.attachmentType === 'voice' || effectiveText.startsWith('🎤 ');

  return (
    <div className={`mb-row${isMe ? ' mb-row--me' : ''}`}>
      {/* Partner avatar (left side, received messages) */}
      {!isMe && (
        <MsgAvatar name={partnerName} url={partnerAvatarUrl} />
      )}

      <div className={`mb-col${isMe ? ' mb-col--me' : ''}`}>

        {/* Bubble */}
        <div
          className={[
            'mb-bub',
            isMe ? 'mb-bub--me' : 'mb-bub--them',
            (isRich && !isAudio && !replyName) ? 'mb-bub--rich' : '',
          ].filter(Boolean).join(' ')}
          onContextMenu={e => { e.preventDefault(); setShowMenu(true); }}
          onDoubleClick={() => onReply?.(replyPayload)}
          style={{ position: 'relative' }}
        >
          {/* Reply quote inside bubble */}
          {replyName && <ReplyQuote name={replyName} text={replyText} isMe={isMe} />}

          {editing ? (
            <div className="mb-edit">
              <textarea
                ref={editRef}
                value={editText}
                onChange={e => {
                  setEditText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                  if (e.key === 'Escape') { setEditText(mainText || ''); setEditing(false); }
                }}
                className="mb-edit-ta"
                style={{ minHeight: 20 }}
              />
              <div className="mb-edit-row">
                <span className="mb-edit-hint">Enter — сохранить</span>
                <button onClick={() => { setEditText(mainText || ''); setEditing(false); }} className="mb-edit-btn">
                  <X size={14} />
                </button>
                <button onClick={handleSaveEdit} className="mb-edit-btn"><Check size={14} /></button>
              </div>
            </div>
          ) : (
            <MessageContent
              content={mainText}
              attachmentUrl={m.attachmentUrl}
              attachmentType={m.attachmentType}
              isMe={isMe}
            />
          )}

          {!editing && (
            <div className={`mb-meta${isMe ? ' mb-meta--me' : ''}`}>
              {m.edited && <span className="mb-edited">ред.</span>}
              <span className="mb-time">{timeStr}</span>
              {isMe && (m.isRead
                ? <CheckCheck size={13} className="mb-ticks mb-ticks--read" />
                : <Check size={13} className="mb-ticks" />
              )}
            </div>
          )}

          {showMenu && (
            <ContextMenu
              isMe={isMe}
              onReact={emoji => onReact?.(m.id, emoji)}
              onReply={() => onReply?.(replyPayload)}
              onEdit={() => { setEditText(mainText || ''); setEditing(true); }}
              onCopy={handleCopy}
              onForward={() => onForward?.(m)}
              onDelete={() => onDelete?.(m.id)}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="mb-rx">
            {reactions.map((em, i) => (
              <button key={`${em}-${i}`} className="mb-rx-btn"
                onClick={() => onReact?.(m.id, em)}>
                {em}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My avatar (right side, sent messages) */}
      {isMe && (
        <MsgAvatar name={myName} url={myAvatarUrl} />
      )}
    </div>
  );
}
