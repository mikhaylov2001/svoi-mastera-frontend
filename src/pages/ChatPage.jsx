import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getConversations, getConversation, sendMessage,
  updateMessage, deleteMessage, deleteConversation,
  uploadFile,
} from '../api';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

// ─── Фоны ───────────────────────────────────────────────────
const BG_LIST = [
  { id: 'tg',      label: 'Телеграм', style: { backgroundColor:'#c9d8e8', backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2399b3c8' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" } },
  { id: 'white',   label: 'Белый',    style: { background:'#f7f8fa' } },
  { id: 'warm',    label: 'Тёплый',   style: { background:'linear-gradient(160deg,#fef9f5 0%,#fdebd0 100%)' } },
  { id: 'mint',    label: 'Мята',     style: { background:'linear-gradient(160deg,#e8f8f5 0%,#d5f5e3 100%)' } },
  { id: 'lavender',label: 'Лаванда',  style: { background:'linear-gradient(160deg,#f0e6ff 0%,#e8eaf6 100%)' } },
  { id: 'peach',   label: 'Персик',   style: { background:'linear-gradient(160deg,#fff3e0 0%,#fce4ec 100%)' } },
  { id: 'dark',    label: 'Тёмный',   style: { background:'#1e2435' }, dark:true },
  { id: 'ocean',   label: 'Океан',    style: { background:'linear-gradient(160deg,#0f3460 0%,#16213e 100%)' }, dark:true },
  { id: 'forest',  label: 'Лес',      style: { background:'linear-gradient(160deg,#1a3a1a 0%,#2e7d32 100%)' }, dark:true },
  { id: 'night',   label: 'Ночь',     style: { background:'linear-gradient(160deg,#0a0a0f 0%,#1a1a2e 100%)' }, dark:true },
  { id: 'sunrise', label: 'Рассвет',  style: { background:'linear-gradient(160deg,#ff8c42 0%,#ffd166 50%,#f7ede2 100%)' } },
  { id: 'dots',    label: 'Точки',    style: { backgroundColor:'#eef0f5', backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='2' fill='%23c5cae9'/%3E%3C/svg%3E\")", backgroundSize:'24px 24px' } },
];

const EMOJIS = [
  '😀','😂','🥰','😍','🤩','😎','🤔','😮','😢','😡',
  '👍','👎','❤️','🔥','✅','⭐','💯','🎉','🙏','💪',
  '😊','😄','🤗','😌','😴','🥳','😬','🤝','👋','🫡',
  '💬','📱','🔨','🏠','⚡','🔧','💻','🧹','✨','📚',
];

// ─── SVG Icons ───────────────────────────────────────────────
const IcSmile  = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>;
const IcMic    = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 19v3M8 22h8"/></svg>;
const IcSend   = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
const IcBack   = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>;
const IcTrash  = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
const IcPlay   = () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const IcPause  = () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const IcAttach = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;

// ─── Avatar ──────────────────────────────────────────────────
const BACKEND = 'https://svoi-mastera-backend.onrender.com';

function fullUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  return BACKEND + url;
}

function Ava({ name, url, size=40 }) {
  const [imgError, setImgError] = React.useState(false);
  const src = fullUrl(url);
  const ini = (name||'?').trim().split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2);
  const pallete = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#db2777'];
  const bg = pallete[(ini.charCodeAt(0)||0) % pallete.length];

  if (src && !imgError) {
    return (
      <img
        src={src} alt="" className="cav"
        style={{width:size, height:size}}
        onError={() => setImgError(true)}
      />
    );
  }
  return <div className="cav" style={{width:size,height:size,background:bg,fontSize:size*0.36}}>{ini}</div>;
}

// ─── Ticks ───────────────────────────────────────────────────
function Ticks({ isRead }) {
  const col = isRead ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.45)';
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" style={{flexShrink:0}}>
      <path d="M1 5L3.5 8L8 2"   stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 5L7.5 8L12 2"  stroke={isRead ? col : 'rgba(255,255,255,.2)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Voice Player ─────────────────────────────────────────────
function VoicePlayer({ url, dur, mine }) {
  const [playing, setPlaying] = useState(false);
  const [cur,     setCur]     = useState(0);
  const [len,     setLen]     = useState(dur > 0 ? dur : 0);
  const [ready,   setReady]   = useState(false);
  const aRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    const a = new Audio();
    a.preload = 'metadata';
    aRef.current = a;

    a.onloadedmetadata = () => {
      const d = a.duration;
      if (d && isFinite(d)) setLen(Math.round(d));
      setReady(true);
    };
    a.ontimeupdate = () => { if (isFinite(a.currentTime)) setCur(a.currentTime); };
    a.onended = () => { setPlaying(false); setCur(0); };
    a.onerror = () => { setReady(true); }; // показываем плеер даже при ошибке
    a.src = url;
    a.load();

    return () => { a.pause(); a.src = ''; aRef.current = null; };
  }, [url]);

  const toggle = () => {
    const a = aRef.current; if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const seek = (e) => {
    const a = aRef.current; if (!a || !len) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = pct * len;
    setCur(pct * len);
  };

  const fmt = s => {
    const n = isFinite(s) ? Math.round(s) : 0;
    return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  };

  const pct = len > 0 && isFinite(cur) ? Math.min((cur / len) * 100, 100) : 0;
  const BARS = 32;

  return (
    <div className={`cvp ${mine ? 'cvp-m' : 'cvp-t'}`}>
      <button className="cvp-btn" onClick={toggle} disabled={!ready}>
        {playing ? <IcPause/> : <IcPlay/>}
      </button>
      <div className="cvp-body">
        <div className="cvp-track" onClick={seek}>
          {Array.from({length: BARS}).map((_, i) => {
            const h = 3 + Math.round(Math.abs(Math.sin(i * 0.85 + 0.5) * 13));
            const filled = (i / BARS) * 100 < pct;
            return <div key={i} className={`cvp-bar${filled ? ' on' : ''}`} style={{height: h}}/>;
          })}
        </div>
        <div className="cvp-time">{fmt(playing ? cur : len)}</div>
      </div>
    </div>
  );
}

// ─── Image Bubble ─────────────────────────────────────────────
function ImageBubble({ url, caption }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="cimg-wrap" onClick={() => setOpen(true)}>
        <img src={url} alt="photo" className="cimg"/>
        {caption && <div className="cimg-caption">{caption}</div>}
        <div className="cimg-overlay"><span>🔍</span></div>
      </div>
      {open && (
        <div className="cimg-modal" onClick={() => setOpen(false)}>
          <img src={url} alt="full" className="cimg-full"/>
        </div>
      )}
    </>
  );
}

// ─── Location Bubble ─────────────────────────────────────────
function LocBubble({ coords }) {
  const parts = coords.split(',');
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (!isFinite(lat) || !isFinite(lon)) return <div className="cbub-text">📍 {coords}</div>;

  const mapSrc = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=14&size=390,160&l=map&pt=${lon},${lat},pm2rdl`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`;
  return (
    <a href={osmUrl} target="_blank" rel="noreferrer" className="cloc">
      <div className="cloc-map">
        <img src={mapSrc} alt="map" className="cloc-img"
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
        <div className="cloc-fallback">
          <div style={{fontSize:32}}>🗺️</div>
          <div>{lat.toFixed(4)}, {lon.toFixed(4)}</div>
        </div>
        <div className="cloc-pin">📍</div>
      </div>
      <div className="cloc-footer">
        <span>📍 Местоположение</span>
        <span className="cloc-open">Открыть →</span>
      </div>
    </a>
  );
}

// ─── File type config ─────────────────────────────────────────
const FILE_TYPES = {
  PDF:  { bg: 'linear-gradient(135deg,#f44336,#e53935)', label: 'PDF', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zm0 0V11m6 5h-1.5M15 13v3"/></svg>
  )},
  DOC:  { bg: 'linear-gradient(135deg,#1565c0,#1e88e5)', label: 'DOC', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>
  )},
  DOCX: { bg: 'linear-gradient(135deg,#1565c0,#1e88e5)', label: 'DOCX', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>
  )},
  XLS:  { bg: 'linear-gradient(135deg,#2e7d32,#43a047)', label: 'XLS', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 12l2.5 3-2.5 3m4-6l2.5 3-2.5 3"/></svg>
  )},
  XLSX: { bg: 'linear-gradient(135deg,#2e7d32,#43a047)', label: 'XLSX', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 12l2.5 3-2.5 3m4-6l2.5 3-2.5 3"/></svg>
  )},
  PPT:  { bg: 'linear-gradient(135deg,#e65100,#f4511e)', label: 'PPT', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3z"/></svg>
  )},
  PPTX: { bg: 'linear-gradient(135deg,#e65100,#f4511e)', label: 'PPTX', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3z"/></svg>
  )},
  ZIP:  { bg: 'linear-gradient(135deg,#6a1b9a,#9c27b0)', label: 'ZIP', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 8v8m0-8l3 3m-3-3L9 11"/></svg>
  )},
  RAR:  { bg: 'linear-gradient(135deg,#6a1b9a,#9c27b0)', label: 'RAR', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
  )},
  MP3:  { bg: 'linear-gradient(135deg,#00838f,#00acc1)', label: 'MP3', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M10 15V9l5 3-5 3z" fill="#fff" stroke="none"/></svg>
  )},
  MP4:  { bg: 'linear-gradient(135deg,#00695c,#00897b)', label: 'MP4', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="3" y="7" width="12" height="10" rx="2"/></svg>
  )},
  TXT:  { bg: 'linear-gradient(135deg,#546e7a,#78909c)', label: 'TXT', icon: (
    <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg>
  )},
};
const FILE_DEFAULT = { bg: 'linear-gradient(135deg,#455a64,#607d8b)', label: '', icon: (
  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
)};

// ─── File Bubble ──────────────────────────────────────────────
function FileBubble({ name, mine, fileUrl }) {
  const ext = (name?.split('.').pop() || 'FILE').toUpperCase();
  const cfg = FILE_TYPES[ext] || FILE_DEFAULT;
  const shortName = name?.length > 28 ? name.slice(0, 25) + '…' + name.slice(-6) : name || 'Файл';

  const download = () => {
    if (!fileUrl) { alert('Файл недоступен для скачивания'); return; }
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = name || 'file';
    a.click();
  };

  return (
    <div className="cfile" onClick={download} style={{ cursor: fileUrl ? 'pointer' : 'default' }}>
      <div className="cfile-ic" style={{ background: cfg.bg }}>
        {cfg.icon}
        <span className="cfile-ic-ext">{cfg.label || ext.slice(0,4)}</span>
      </div>
      <div className="cfile-body">
        <div className="cfile-name">{shortName}</div>
        <div className="cfile-meta">{ext} · Файл</div>
      </div>
      <div className={`cfile-dl ${fileUrl ? 'cfile-dl-active' : 'cfile-dl-disabled'}`}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Parse message ────────────────────────────────────────────
function parseMsgContent(text) {
  if (!text) return { type: 'text', text: '' };
  // Location: "📍 lat, lon"
  const loc = text.match(/^📍 (-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (loc) return { type: 'location', coords: `${loc[1]},${loc[2]}` };
  // Voice
  if (text.startsWith('🎤 Голосовое') || text.startsWith('🎤')) return { type: 'voice' };
  // Image with possible caption
  const img = text.match(/^📷 (.+?)(?:\n(.*))?$/s);
  if (img) return { type: 'image_text', filename: img[1], caption: img[2] || '' };
  // Video
  const vid = text.match(/^🎥 (.+?)(?:\n(.*))?$/s);
  if (vid) return { type: 'video_text', filename: vid[1], caption: vid[2] || '' };
  // File
  const file = text.match(/^📎 (.+?)(?:\n(.*))?$/s);
  if (file) return { type: 'file_text', filename: file[1] };
  return { type: 'text', text };
}

// ─── Preview text helpers ──────────────────────────────────────
const fmtPreview = text => {
  if (!text) return '';
  if (text.startsWith('📷 ')) return '📷 Фотография';
  if (text.startsWith('🎥 ')) return '🎥 Видео';
  if (text.startsWith('🎤 ')) return '🎤 Голосовое';
  if (text.startsWith('📎 ')) return '📎 Файл';
  if (text.startsWith('📍 ')) return '📍 Местоположение';
  return text;
};

// ─── Time helpers ─────────────────────────────────────────────
const fmtShort = d => {
  if (!d) return '';
  const dt = new Date(d), now = new Date();
  if (dt.toDateString() === now.toDateString())
    return dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now); y.setDate(y.getDate()-1);
  if (dt.toDateString() === y.toDateString()) return 'вчера';
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};
const fmtTime = d => !d ? '' : new Date(d).toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
const fmtDate = d => !d ? '' : new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'long' });

// ─── Voice Recorder Hook ──────────────────────────────────────
function useVoiceRec(onDone) {
  const [rec, setRec]   = useState(false);
  const [sec, setSec]   = useState(0);
  const mr  = useRef(null);
  const cks = useRef([]);
  const tmr = useRef(null);
  const cnt = useRef(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      cks.current = [];
      rec.ondataavailable = e => { if (e.data?.size > 0) cks.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(cks.current, { type: mime || 'audio/webm' });
        onDone({ blob, url: URL.createObjectURL(blob), duration: cnt.current });
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start(200);
      mr.current = rec;
      cnt.current = 0;
      setRec(true); setSec(0);
      tmr.current = setInterval(() => { cnt.current++; setSec(cnt.current); }, 1000);
    } catch { alert('Нет доступа к микрофону'); }
  };

  const stop = () => {
    if (mr.current?.state === 'recording') mr.current.stop();
    clearInterval(tmr.current);
    setRec(false);
  };

  const cancel = () => {
    if (mr.current?.state === 'recording') {
      mr.current.onstop = null; // не вызываем callback
      mr.current.stop();
    }
    clearInterval(tmr.current);
    cks.current = []; cnt.current = 0;
    setRec(false); setSec(0);
  };

  return { rec, sec, start, stop, cancel };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ChatPage() {
  const { partnerId } = useParams();
  const { userId, userName, userAvatar } = useAuth();
  const navigate      = useNavigate();
  const loc           = useLocation();

  const pid = useMemo(() => partnerId == null ? null : String(partnerId), [partnerId]);
  const jrId = useMemo(() => {
    const v = new URLSearchParams(loc.search || '').get('jobRequestId');
    return v ? String(v) : null;
  }, [loc.search]);

  const [convos,  setConvos]  = useState([]);
  const [msgs,    setMsgs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [txt,     setTxt]     = useState('');
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState('');

  const [editId,  setEditId]  = useState(null);
  const [editTxt, setEditTxt] = useState('');
  const [menuId,  setMenuId]  = useState(null);

  const [showEmoji,  setShowEmoji]  = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showBg,     setShowBg]     = useState(false);
  const [bgId,       setBgId]       = useState(() => localStorage.getItem('chatBg') || 'tg');

  // локальное хранилище голосовых: messageId -> {url, duration}
  const [voiceStore, setVoiceStore] = useState({});
  // локальное хранилище изображений: messageId -> objectURL
  const [imgStore,   setImgStore]   = useState({});
  // локальное хранилище файлов: messageId -> {url, name}
  const [fileStore,  setFileStore]  = useState({});
  // превью перед отправкой
  const [preview, setPreview] = useState(null);

  const endRef    = useRef(null);
  const inputRef  = useRef(null);
  const photoRef  = useRef(null);
  const fileRef   = useRef(null);
  const camRef    = useRef(null);

  const curBg = BG_LIST.find(b => b.id === bgId) || BG_LIST[0];

  const voice = useVoiceRec(({ blob, url, duration }) => {
    setPreview({ type: 'voice', blob, url, duration });
  });

  // loaders
  const loadConvos = useCallback(async () => {
    if (!userId) return;
    try { setConvos(await getConversations(userId)); } catch {}
  }, [userId]);

  const loadMsgs = useCallback(async () => {
    if (!userId || !pid) return;
    try { setMsgs(await getConversation(userId, pid)); } catch {}
  }, [userId, pid]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    if (!pid) return;
    setLoading(true);
    setMenuId(null); setEditId(null); setShowEmoji(false); setShowAttach(false);
    loadMsgs().then(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [pid, loadMsgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    if (!pid) return;
    const iv = setInterval(() => { loadMsgs(); loadConvos(); }, 5000);
    return () => clearInterval(iv);
  }, [pid, loadMsgs, loadConvos]);

  // Send
  const send = async () => {
    const t = txt.trim();
    if ((!t && !preview) || !pid || !userId) return;
    setBusy(true); setErr('');
    try {
      let finalTxt = t;
      let attachmentUrl  = null;
      let attachmentType = null;

      if (preview) {
        // ── Сохраняем локальный URL сразу — для показа в текущей сессии ──
        const localUrl = preview.url;

        // ── Загружаем файл на сервер ──────────────────────────
        if (preview.file && ['image','video','file'].includes(preview.type)) {
          try {
            const uploaded = await uploadFile(userId, preview.file);
            attachmentUrl  = uploaded.url;
            attachmentType = preview.type;

            if (preview.type === 'image')      finalTxt = `📷 ${uploaded.filename || preview.name}${t ? '\n'+t : ''}`;
            else if (preview.type === 'video') finalTxt = `🎥 ${uploaded.filename || preview.name}${t ? '\n'+t : ''}`;
            else if (preview.type === 'file')  finalTxt = `📎 ${uploaded.filename || preview.name}${t ? '\n'+t : ''}`;
          } catch (uploadErr) {
            // Сервер не поддерживает загрузку — отправляем текст, показываем локально
            console.warn('Upload failed, using local URL:', uploadErr);
            attachmentType = preview.type;
            // attachmentUrl = null — не сохранится в БД, но покажется локально
            if (preview.type === 'image')      finalTxt = `📷 ${preview.name}${t ? '\n'+t : ''}`;
            else if (preview.type === 'video') finalTxt = `🎥 ${preview.name}${t ? '\n'+t : ''}`;
            else if (preview.type === 'file')  finalTxt = `📎 ${preview.name}${t ? '\n'+t : ''}`;
          }
        }

        // ── Голосовое ────────────────────────────────────────
        else if (preview.type === 'voice' && preview.blob) {
          finalTxt = `🎤 Голосовое (${preview.duration}с)`;
          try {
            // Пробуем загрузить на сервер
            const voiceFile = new File([preview.blob], `voice_${Date.now()}.webm`, { type: preview.blob.type || 'audio/webm' });
            const uploaded  = await uploadFile(userId, voiceFile);
            attachmentUrl   = uploaded.url;
            attachmentType  = 'voice';
          } catch {
            // Сервер не поддерживает — сохраняем как base64 прямо в БД
            try {
              const base64 = await new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload  = () => res(reader.result); // data:audio/webm;base64,...
                reader.onerror = rej;
                reader.readAsDataURL(preview.blob);
              });
              attachmentUrl  = base64; // сохранится в поле attachment_url в БД
              attachmentType = 'voice';
            } catch {
              // совсем не получилось — хотя бы покажем в текущей сессии
              attachmentType = 'voice';
            }
          }
        }

        // ── Геолокация ────────────────────────────────────────
        else if (preview.type === 'location') {
          finalTxt       = `📍 ${preview.name}`;
          attachmentType = 'location';
          attachmentUrl  = preview.name;
        }

        setPreview(null);

        // Отправляем сообщение
        if (!finalTxt) { setBusy(false); return; }
        const sent = await sendMessage(userId, pid, finalTxt, jrId, attachmentUrl, attachmentType);
        const sentId = sent?.id;

        // Сохраняем в локальный store для показа сразу
        if (sentId) {
          if (attachmentType === 'voice')
            setVoiceStore(p => ({ ...p, [sentId]: { url: attachmentUrl || localUrl, duration: preview?.duration || 0 } }));
          if (attachmentType === 'image' || attachmentType === 'video')
            setImgStore(p => ({ ...p, [sentId]: attachmentUrl || localUrl }));
          if (attachmentType === 'file')
            setFileStore(p => ({ ...p, [sentId]: { url: attachmentUrl || localUrl, name: preview?.name } }));
        }

        setTxt(''); setShowEmoji(false); setShowAttach(false);
        await loadMsgs(); await loadConvos();
        setBusy(false);
        return; // выходим — уже сохранили
      }

      // Простое текстовое сообщение (без вложений)
      if (finalTxt) {
        await sendMessage(userId, pid, finalTxt, jrId, null, null);
        setTxt(''); setShowEmoji(false); setShowAttach(false);
        await loadMsgs(); await loadConvos();
      }

    } catch (e) { setErr(e?.message || 'Не удалось отправить.'); }
    setBusy(false);
  };

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const startEdit  = m => { setEditId(m.id); setEditTxt(m.text||''); setMenuId(null); };
  const cancelEdit = () => { setEditId(null); setEditTxt(''); };
  const saveEdit   = async () => {
    if (!editId || !editTxt.trim()) return;
    setBusy(true);
    try { await updateMessage(userId, editId, editTxt.trim()); cancelEdit(); await loadMsgs(); } catch {}
    setBusy(false);
  };

  const delMsg = async mid => {
    setMenuId(null); setBusy(true);
    try { await deleteMessage(userId, mid); await loadMsgs(); await loadConvos(); } catch {}
    setBusy(false);
  };

  const delChat = async () => {
    if (!window.confirm('Удалить весь чат?')) return;
    setBusy(true);
    try { await deleteConversation(userId, pid); setMsgs([]); await loadConvos(); navigate('/chat'); } catch {}
    setBusy(false);
  };

  const pickFile = (e, type) => {
    const f = e.target.files?.[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    // Определяем тип точнее по mime
    let realType = type;
    if (f.type.startsWith('image/')) realType = 'image';
    else if (f.type.startsWith('video/')) realType = 'video';
    setPreview({ type: realType, url, name: f.name, file: f });
    setShowAttach(false);
    e.target.value = '';
  };

  const shareGeo = () => {
    setShowAttach(false);
    if (!navigator.geolocation) { alert('Геолокация недоступна'); return; }
    navigator.geolocation.getCurrentPosition(
      p => setPreview({ type: 'location', name: `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}` }),
      () => alert('Не удалось получить геолокацию')
    );
  };

  const partner = convos.find(c => String(c.partnerId) === pid);
  const closeAll = () => { setMenuId(null); setShowEmoji(false); setShowAttach(false); };

  const fmt2 = s => {
    const n = isFinite(s) ? s : 0;
    return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  };

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <div className="cr" onClick={closeAll}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`cs ${pid ? 'cs-hide' : ''}`}>
        <div className="cs-top">
          <div className="cs-top-title">Сообщения</div>
          <div className="cs-top-sub">{convos.length > 0 ? `${convos.length} диалог${convos.length > 1 ? 'а' : ''}` : 'Нет диалогов'}</div>
        </div>
        {convos.length === 0 ? (
          <div className="cs-empty">
            <div style={{fontSize:52}}>💬</div>
            <b>Нет диалогов</b>
            <span>Напишите мастеру со страницы заявки</span>
          </div>
        ) : (
          <div className="cs-list">
            {convos.map(c => (
              <div key={c.partnerId}
                className={`cs-item ${String(c.partnerId) === pid ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); navigate(`/chat/${c.partnerId}`); }}
              >
                <Ava name={c.partnerName} url={c.partnerAvatarUrl} size={46}/>
                <div className="cs-item-body">
                  <div className="cs-item-row">
                    <span className="cs-item-name">{c.partnerName}</span>
                    <span className="cs-item-time">{fmtShort(c.lastMessageAt)}</span>
                  </div>
                  <div className="cs-item-row">
                    <span className="cs-item-msg">{fmtPreview(c.lastMessage) || 'Нет сообщений'}</span>
                    {c.unreadCount > 0 && <span className="cs-badge">{c.unreadCount}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ═══ CHAT AREA ═══ */}
      <div className={`cm ${!pid ? 'cm-empty' : ''}`}>
        {!pid && (
          <div className="cm-placeholder">
            <div style={{fontSize:64}}>💬</div>
            <h3>Выберите диалог</h3>
            <p>или начните новый со страницы заявки</p>
          </div>
        )}

        {pid && (<>
          {/* HEADER */}
          <header className="ch" onClick={e => e.stopPropagation()}>
            <button className="ch-back" onClick={() => navigate('/chat')}><IcBack/></button>
            <Ava name={partner?.partnerName} url={partner?.partnerAvatarUrl} size={40}/>
            <div className="ch-info">
              <div className="ch-name">{partner?.partnerName || 'Чат'}</div>
              <div className="ch-status">
                <span className="ch-dot"/>онлайн
              </div>
            </div>
            <div className="ch-actions">
              <button className="ch-btn" onClick={e => { e.stopPropagation(); setShowBg(v=>!v); }} title="Сменить фон">
                🎨
              </button>
              <button className="ch-btn ch-btn-del" onClick={e => { e.stopPropagation(); delChat(); }} title="Удалить чат">
                <IcTrash/>
              </button>
            </div>
          </header>

          {/* BG PICKER */}
          {showBg && (
            <div className="cbg-picker" onClick={e => e.stopPropagation()}>
              <div className="cbg-title">Тема чата</div>
              <div className="cbg-grid">
                {BG_LIST.map(b => (
                  <button key={b.id} className={`cbg-item ${bgId === b.id ? 'sel' : ''}`}
                    style={b.style} onClick={() => { setBgId(b.id); localStorage.setItem('chatBg', b.id); setShowBg(false); }}>
                    {bgId === b.id && <span className="cbg-check">✓</span>}
                    <span className="cbg-lbl" style={{color: b.dark ? '#fff' : '#374151'}}>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {err && <div className="cerr">{err}</div>}

          {/* MESSAGES */}
          <div className="cmsg" style={curBg.style}>
            {loading ? (
              <div className="cmsg-load">Загрузка...</div>
            ) : msgs.length === 0 ? (
              <div className="cmsg-empty">
                <div style={{fontSize:44}}>👋</div>
                <p>Напишите первое сообщение</p>
              </div>
            ) : msgs.map((m, i) => {
              const mine     = m.senderId === userId;
              const showDate = i === 0 || new Date(msgs[i-1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              const isLast   = i === msgs.length-1 || msgs[i+1].senderId !== m.senderId;
              const parsed   = parseMsgContent(m.text);
              const vd       = voiceStore[m.id] || (m.attachmentType === 'voice'  && m.attachmentUrl ? { url: m.attachmentUrl, duration: parseInt(m.text?.match(/\((\d+)с\)/)?.[1]) || 0 } : null);
              const imgUrl   = imgStore[m.id]   || (m.attachmentType === 'image'  && m.attachmentUrl ? m.attachmentUrl : null)
                                                || (m.attachmentType === 'video'  && m.attachmentUrl ? m.attachmentUrl : null);
              const fileData = fileStore[m.id]  || (m.attachmentType === 'file'   && m.attachmentUrl ? { url: m.attachmentUrl, name: parsed.filename } : null);

              return (
                <React.Fragment key={m.id}>
                  {showDate && (
                    <div className="cdate"><span>{fmtDate(m.createdAt)}</span></div>
                  )}

                  <div className={`cmrow ${mine ? 'mine' : 'their'}`} style={{marginBottom: isLast ? 10 : 2}}>
                    {!mine && (
                      <div className="cmrow-ava">{isLast && <Ava name={m.senderName} url={m.senderAvatarUrl} size={30}/>}</div>
                    )}

                    <div className={[
                      'cbub',
                      parsed.type === 'location' ? 'cbub-loc' : '',
                      (parsed.type === 'image_text' && imgUrl) || (parsed.type === 'video_text' && imgUrl) ? 'cbub-img' : '',
                    ].filter(Boolean).join(' ')}>

                      {!mine && isLast && <div className="cbub-name">{m.senderName}</div>}

                      {/* EDIT MODE */}
                      {mine && editId === m.id ? (
                        <div className="cedit">
                          <textarea className="cedit-ta" value={editTxt}
                            onChange={e => setEditTxt(e.target.value)} autoFocus/>
                          <div className="cedit-row">
                            <button className="btn btn-outline btn-sm" onClick={cancelEdit}>Отмена</button>
                            <button className="btn btn-primary btn-sm" onClick={saveEdit}>Сохранить</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* CONTENT */}
                          {parsed.type === 'location' ? (
                            <LocBubble coords={parsed.coords}/>

                          ) : parsed.type === 'voice' && vd ? (
                            <VoicePlayer url={vd.url} dur={vd.duration} mine={mine}/>

                          ) : parsed.type === 'voice' ? (
                            // голосовое без локального url
                            <div className="cvp-stub">
                              <div className="cvp-stub-btn">
                                <IcPlay/>
                              </div>
                              <div className="cvp-stub-body">
                                <div className="cvp-stub-wave">
                                  {Array.from({length:28}).map((_,i) => (
                                    <div key={i} className="cvp-stub-bar"
                                      style={{height: 3 + Math.round(Math.abs(Math.sin(i*0.85+0.5)*11))}}/>
                                  ))}
                                </div>
                                <div className="cvp-stub-time">
                                  {m.text?.match(/\((\d+)с\)/)?.[1] ? `0:${String(m.text.match(/\((\d+)с\)/)[1]).padStart(2,'0')}` : 'Голосовое'}
                                </div>
                              </div>
                            </div>

                          ) : parsed.type === 'image_text' && imgUrl ? (
                            <ImageBubble url={imgUrl} caption={parsed.caption}/>

                          ) : parsed.type === 'image_text' && !imgUrl ? (
                            <div className="cphoto-stub">
                              <div className="cphoto-stub-icon">
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                                  <circle cx="8.5" cy="8.5" r="1.5"/>
                                  <path d="M21 15l-5-5L5 21"/>
                                </svg>
                              </div>
                              <div className="cphoto-stub-label">Фотография</div>
                              {parsed.caption && <div className="cphoto-stub-text">{parsed.caption}</div>}
                            </div>

                          ) : parsed.type === 'video_text' && imgUrl ? (
                            <ImageBubble url={imgUrl} caption={parsed.caption || parsed.filename}/>

                          ) : parsed.type === 'video_text' ? (
                            <div className="cphoto-stub">
                              <div className="cphoto-stub-icon">
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                  <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/>
                                  <rect x="3" y="7" width="12" height="10" rx="2"/>
                                </svg>
                              </div>
                              <div className="cphoto-stub-label">Видео</div>
                              {parsed.caption && <div className="cphoto-stub-text">{parsed.caption}</div>}
                            </div>

                          ) : parsed.type === 'file_text' ? (
                            <FileBubble
                              name={parsed.filename}
                              mine={mine}
                              fileUrl={fileData?.url}
                            />

                          ) : (
                            <div className="cbub-txt"
                              onClick={e => { e.stopPropagation(); mine && setMenuId(menuId === m.id ? null : m.id); }}>
                              {m.text}
                            </div>
                          )}

                          {/* META */}
                          <div className="cbub-meta">
                            <span className="cbub-time">{fmtTime(m.createdAt)}</span>
                            {mine && <Ticks isRead={m.isRead}/>}
                          </div>

                          {/* CONTEXT MENU */}
                          {mine && menuId === m.id && editId !== m.id && (
                            <div className="cmenu" onClick={e => e.stopPropagation()}>
                              <button className="cmenu-btn" onClick={() => startEdit(m)}>✏️ Изменить</button>
                              <button className="cmenu-btn cmenu-del" onClick={() => delMsg(m.id)}>🗑 Удалить</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {mine && (
                      <div className="cmrow-ava cmrow-ava-mine">
                        {isLast && <Ava name={userName} url={userAvatar} size={30}/>}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={endRef}/>
          </div>

          {/* PREVIEW */}
          {preview && (
            <div className="cprev" onClick={e => e.stopPropagation()}>
              <div className="cprev-inner">
                {(preview.type === 'image') && (
                  <div className="cprev-img-wrap">
                    <img src={preview.url} alt="" className="cprev-img"/>
                    <span className="cprev-img-label">📷 {preview.name}</span>
                  </div>
                )}
                {preview.type === 'video' && (
                  <div className="cprev-img-wrap">
                    <video src={preview.url} className="cprev-img" muted/>
                    <span className="cprev-img-label">🎥 {preview.name}</span>
                  </div>
                )}
                {preview.type === 'voice' && (
                  <div className="cprev-voice">
                    <span style={{fontSize:22}}>🎤</span>
                    <span>Голосовое · {preview.duration}с</span>
                    <audio src={preview.url} controls style={{height:30}}/>
                  </div>
                )}
                {preview.type === 'file' && (
                  <div className="cprev-file">
                    <div className="cprev-file-ic" style={{background: (FILE_TYPES[(preview.name?.split('.').pop()||'').toUpperCase()] || FILE_DEFAULT).bg}}>
                      {(FILE_TYPES[(preview.name?.split('.').pop()||'').toUpperCase()] || FILE_DEFAULT).icon}
                    </div>
                    <span>{preview.name}</span>
                  </div>
                )}
                {preview.type === 'location' && (
                  <div className="cprev-file"><span>📍</span><span>{preview.name}</span></div>
                )}
              </div>
              <button className="cprev-close" onClick={() => setPreview(null)}>✕</button>
            </div>
          )}

          {/* EMOJI PANEL */}
          {showEmoji && (
            <div className="cemoji" onClick={e => e.stopPropagation()}>
              {EMOJIS.map(em => (
                <button key={em} className="cemoji-btn"
                  onClick={() => { setTxt(t => t+em); inputRef.current?.focus(); }}>
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* ATTACH PANEL */}
          {showAttach && (
            <div className="cattach" onClick={e => e.stopPropagation()}>
              <button className="ca-btn" onClick={() => photoRef.current?.click()}>
                <span className="ca-ic" style={{background:'linear-gradient(135deg,#43a047,#66bb6a)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </span>
                <span>Фото или видео</span>
              </button>
              <button className="ca-btn" onClick={() => fileRef.current?.click()}>
                <span className="ca-ic" style={{background:'linear-gradient(135deg,#1e88e5,#42a5f5)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                </span>
                <span>Файл</span>
              </button>
              <button className="ca-btn" onClick={() => { camRef.current?.click(); setShowAttach(false); }}>
                <span className="ca-ic" style={{background:'linear-gradient(135deg,#e53935,#ef5350)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </span>
                <span>Камера</span>
              </button>
              <button className="ca-btn" onClick={shareGeo}>
                <span className="ca-ic" style={{background:'linear-gradient(135deg,#f4511e,#ff7043)'}}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span>Местоположение</span>
              </button>
            </div>
          )}

          {/* INPUT */}
          <div className="cinput" onClick={e => e.stopPropagation()}>
            <button className={`ci-btn${showAttach ? ' active' : ''}`}
              onClick={() => { setShowAttach(v=>!v); setShowEmoji(false); }}>
              <IcAttach/>
            </button>

            {voice.rec ? (
              <div className="ci-vrec">
                <button className="ci-vrec-cancel" onClick={voice.cancel}>✕</button>
                <div className="ci-vrec-dot"/>
                <div className="ci-vrec-waves">
                  {Array.from({length:14}).map((_,i) => (
                    <div key={i} className="ci-vrec-bar" style={{animationDelay:`${i*0.07}s`}}/>
                  ))}
                </div>
                <span className="ci-vrec-time">{fmt2(voice.sec)}</span>
                <button className="ci-vrec-stop" onClick={voice.stop}>
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                </button>
              </div>
            ) : (<>
              <textarea ref={inputRef} className="ci-field"
                placeholder="Написать сообщение…" value={txt}
                onChange={e => setTxt(e.target.value)} onKeyDown={onKey} rows={1}/>
              <button className={`ci-btn${showEmoji ? ' active' : ''}`}
                onClick={() => { setShowEmoji(v=>!v); setShowAttach(false); }}>
                <IcSmile/>
              </button>
              {txt.trim() || preview ? (
                <button className="ci-send" disabled={busy} onClick={send}><IcSend/></button>
              ) : (
                <button className="ci-send ci-mic" onMouseDown={voice.start}><IcMic/></button>
              )}
            </>)}
          </div>

          <input ref={photoRef} type="file" accept="image/*,video/*" style={{display:'none'}} onChange={e => pickFile(e, e.target.files?.[0]?.type?.startsWith('video') ? 'video' : 'image')}/>
          <input ref={fileRef}  type="file" style={{display:'none'}} onChange={e => pickFile(e, 'file')}/>
          <input ref={camRef}   type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => pickFile(e, 'image')}/>
        </>)}
      </div>
    </div>
  );
}