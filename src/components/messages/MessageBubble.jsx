import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Check, CheckCheck, Pencil, Trash2, X, MapPin, FileText,
  Copy, Reply, Pin, Forward, Play, Pause,
} from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '😍'];

// ─── Avatar ──────────────────────────────────────────────────
const BACKEND = 'https://svoi-mastera-backend.onrender.com';
function fullUrl(u) {
  if (!u) return '';
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return BACKEND + u;
}

// ─── Audio player ───────────────────────────────────────────
function AudioPlayer({ url, isMe }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  return (
    <div className="mb-audio">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a && a.duration && isFinite(a.duration)) setProgress(a.currentTime / a.duration);
        }}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button
        onClick={toggle}
        className={`mb-audio-btn${isMe ? ' mb-audio-btn--me' : ''}`}
      >
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <div className="mb-audio-body">
        <div className="mb-audio-track">
          <div
            className={`mb-audio-fill${isMe ? ' mb-audio-fill--me' : ''}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className={`mb-audio-time${isMe ? ' mb-audio-time--me' : ''}`}>
          {duration ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '0:00'}
        </span>
      </div>
    </div>
  );
}

// ─── Message content ────────────────────────────────────────
function MessageContent({ content, attachmentUrl, attachmentType, isMe }) {
  // Voice
  if (attachmentType === 'voice' && attachmentUrl) {
    return <AudioPlayer url={fullUrl(attachmentUrl)} isMe={isMe} />;
  }
  if (content && content.startsWith('🎤 ')) {
    const urlPart = content.slice(3).trim();
    const resolved = fullUrl(urlPart);
    return resolved ? <AudioPlayer url={resolved} isMe={isMe} /> : (
      <div className="mb-voice-stub">
        <Play size={14} />
        <span>Голосовое</span>
      </div>
    );
  }

  // Location
  if (attachmentType === 'location') {
    const coords = attachmentUrl || content?.replace(/^📍\s*/, '');
    const parts = (coords || '').split(',');
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
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
            <MapPin size={12} />
            <span>{lat.toFixed(4)}, {lon.toFixed(4)}</span>
            <span className="mb-loc-open">Открыть</span>
          </div>
        </a>
      );
    }
  }
  if (content && content.startsWith('📍 ')) {
    const coords = content.slice(3).trim();
    const parts = coords.split(',');
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
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
            <MapPin size={12} />
            <span>{lat.toFixed(4)}, {lon.toFixed(4)}</span>
            <span className="mb-loc-open">Открыть</span>
          </div>
        </a>
      );
    }
  }

  // Image
  if (attachmentType === 'image' && attachmentUrl) {
    const url = fullUrl(attachmentUrl);
    return <ImageMsg url={url} caption={content?.replace(/^📷\s*[^\n]*\n?/, '')} />;
  }

  // Video
  if (attachmentType === 'video' && attachmentUrl) {
    const url = fullUrl(attachmentUrl);
    return <ImageMsg url={url} caption={content?.replace(/^🎥\s*[^\n]*\n?/, '')} isVideo />;
  }

  // File
  if (attachmentType === 'file' && attachmentUrl) {
    const fname = content?.replace(/^📎\s*/, '').split('\n')[0] || 'Файл';
    return (
      <a href={fullUrl(attachmentUrl)} target="_blank" rel="noreferrer" className={`mb-file${isMe ? ' mb-file--me' : ''}`}>
        <FileText size={20} className="mb-file-ic" />
        <div className="mb-file-body">
          <p className="mb-file-name">{fname}</p>
          <p className="mb-file-sub">Открыть файл</p>
        </div>
      </a>
    );
  }

  // Plain text
  return <p className="mb-text">{content}</p>;
}

function ImageMsg({ url, caption, isVideo }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mb-img-wrap" onClick={() => setOpen(true)}>
        {isVideo
          ? <video src={url} className="mb-img" muted />
          : <img src={url} alt="photo" className="mb-img" />}
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
    { icon: Reply, label: 'Ответить', action: onReply },
    { icon: Copy, label: 'Копировать', action: onCopy },
    { icon: Forward, label: 'Переслать', action: onForward },
    ...(isMe ? [{ icon: Pencil, label: 'Редактировать', action: onEdit }] : []),
    { icon: Trash2, label: 'Удалить', action: onDelete, danger: true },
  ];

  return (
    <div
      ref={ref}
      className={`mb-ctx${isMe ? ' mb-ctx--me' : ''}`}
    >
      {/* Quick reactions */}
      <div className="mb-ctx-reactions">
        {QUICK_REACTIONS.map(em => (
          <button key={em} className="mb-ctx-react-btn"
            onClick={() => { onReact(em); onClose(); }}>
            {em}
          </button>
        ))}
      </div>
      {/* Actions */}
      <div className="mb-ctx-actions">
        {items.map(({ icon: Icon, label, action, danger }) => (
          <button
            key={label}
            onClick={() => { action?.(); onClose(); }}
            className={`mb-ctx-item${danger ? ' mb-ctx-item--danger' : ''}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main bubble ────────────────────────────────────────────
export default function MessageBubble({
  message: m,
  isMe,
  onDelete,
  onEdit,
  onReact,
  onReply,
  onForward,
  reactions = [],
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(m.text || '');
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
    if (editText.trim() && editText.trim() !== m.text) onEdit?.(m.id, editText.trim());
    setEditing(false);
  };

  const handleCopy = () => {
    if (m.text) navigator.clipboard.writeText(m.text).catch(() => {});
  };

  const ts = m.createdAt;
  const timeStr = ts ? (() => { try { return format(new Date(ts), 'HH:mm'); } catch { return ''; } })() : '';

  // Determine if content is "rich" (no padding on loc/img)
  const isRich = m.attachmentType === 'location'
    || m.attachmentType === 'image'
    || m.attachmentType === 'video'
    || (m.text && (m.text.startsWith('📍 ') || m.text.startsWith('🎤 ')));
  const isAudio = m.attachmentType === 'voice'
    || (m.text && m.text.startsWith('🎤 '));

  return (
    <div className={`mb-row${isMe ? ' mb-row--me' : ''}`}>
      <div className={`mb-col${isMe ? ' mb-col--me' : ''}`}>

        {/* Reply quote */}
        {m.replyTo && (
          <div className={`mb-reply${isMe ? ' mb-reply--me' : ''}`}>
            <span className="mb-reply-name">{m.replyTo.name}</span>
            <span className="mb-reply-text">{m.replyTo.text}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={[
            'mb-bub',
            isMe ? 'mb-bub--me' : 'mb-bub--them',
            isRich && !isAudio ? 'mb-bub--rich' : '',
          ].filter(Boolean).join(' ')}
          onContextMenu={e => { e.preventDefault(); setShowMenu(true); }}
          onDoubleClick={() => onReply?.({ name: isMe ? 'Вы' : m.senderName, text: m.text })}
          style={{ position: 'relative' }}
        >
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
                  if (e.key === 'Escape') { setEditText(m.text || ''); setEditing(false); }
                }}
                className="mb-edit-ta"
                style={{ minHeight: 20 }}
              />
              <div className="mb-edit-row">
                <span className="mb-edit-hint">Enter — сохранить</span>
                <button onClick={() => { setEditText(m.text || ''); setEditing(false); }} className="mb-edit-btn">
                  <X size={14} />
                </button>
                <button onClick={handleSaveEdit} className="mb-edit-btn"><Check size={14} /></button>
              </div>
            </div>
          ) : (
            <MessageContent
              content={m.text}
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
              onReply={() => onReply?.({ name: isMe ? 'Вы' : m.senderName, text: m.text })}
              onEdit={() => setEditing(true)}
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
    </div>
  );
}
