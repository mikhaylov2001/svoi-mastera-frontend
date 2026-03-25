import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getConversations, getConversation, sendMessage,
  updateMessage, deleteMessage, deleteConversation,
} from '../api';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

// ── Фоны чата ──────────────────────────────────────────────
const CHAT_BACKGROUNDS = [
  { id: 'warm',    label: 'Тёплый',    style: { background: '#fdf6f0', backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(232,65,10,.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,143,0,.05) 0%, transparent 50%)' } },
  { id: 'dots',    label: 'Точки',     style: { backgroundColor: '#eef0f3', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23c9cdd4'/%3E%3C/svg%3E\")", backgroundSize: '20px 20px' } },
  { id: 'mint',    label: 'Мята',      style: { background: 'linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 100%)' } },
  { id: 'lavender',label: 'Лаванда',   style: { background: 'linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 100%)' } },
  { id: 'peach',   label: 'Персик',    style: { background: 'linear-gradient(135deg, #fff8e1 0%, #fce4ec 100%)' } },
  { id: 'dark',    label: 'Тёмный',    style: { background: '#1a1a2e' }, dark: true },
  { id: 'ocean',   label: 'Океан',     style: { background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)' }, dark: true },
  { id: 'forest',  label: 'Лес',       style: { background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' }, dark: true },
  { id: 'sunrise', label: 'Рассвет',   style: { background: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 50%, #efefd0 100%)' } },
  { id: 'night',   label: 'Ночь',      style: { background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)' }, dark: true },
  { id: 'blobs',   label: 'Пузыри',    style: { backgroundColor: '#e3f2fd', backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(100,181,246,.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(129,212,250,.3) 0%, transparent 40%)' } },
  { id: 'white',   label: 'Белый',     style: { background: '#ffffff' } },
];

const EMOJI_LIST = [
  '😀','😂','🥰','😍','🤩','😎','🤔','😮','😢','😡',
  '👍','👎','❤️','🔥','✅','⭐','💯','🎉','🙏','💪',
  '😊','😄','🤗','😌','😴','🥳','😬','🤝','👋','🫡',
  '💬','📱','🔨','🏠','⚡','🔧','💻','🧹','✨','📚',
];

// ── Avatar ──────────────────────────────────────────────────
function Avatar({ name, url, size = 40 }) {
  if (url) return <img src={url} alt="" className="cht-ava" style={{ width: size, height: size }} />;
  const ini = (name || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const cols = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#db2777','#4f46e5'];
  const col = cols[(ini.charCodeAt(0) || 0) % cols.length];
  return <div className="cht-ava" style={{ width: size, height: size, background: col, fontSize: size * 0.37 }}>{ini}</div>;
}

// ── Ticks (Telegram-style) ───────────────────────────────────
function Ticks({ isRead }) {
  const color = isRead ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.55)';
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{ flexShrink: 0, marginBottom: -1 }}>
      <path d="M1 5.5L4.5 9L10 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 5.5L8.5 9L14 2" stroke={isRead ? color : 'rgba(255,255,255,.25)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Time helpers ─────────────────────────────────────────────
function timeStr(d) {
  if (!d) return '';
  const dt = new Date(d), now = new Date();
  if (dt.toDateString() === now.toDateString())
    return dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (dt.toDateString() === y.toDateString()) return 'вчера';
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ── Voice recorder hook ──────────────────────────────────────
function useVoiceRecorder(onDone) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds]     = useState(0);
  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        onDone({ blob, url, duration: seconds });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert('Нет доступа к микрофону');
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancel = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  };

  return { recording, seconds, start, stop, cancel };
}

// ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { partnerId } = useParams();
  const { userId }    = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();

  const partnerIdStr = useMemo(() => (partnerId == null ? null : String(partnerId)), [partnerId]);
  const jobRequestId = useMemo(() => {
    const v = new URLSearchParams(location.search || '').get('jobRequestId');
    return v ? String(v) : null;
  }, [location.search]);

  const [convos,  setConvos]  = useState([]);
  const [msgs,    setMsgs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');

  const [editingId,   setEditingId]   = useState(null);
  const [editingText, setEditingText] = useState('');
  const [menuId,      setMenuId]      = useState(null);

  // UI panels
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showAttach,  setShowAttach]  = useState(false);
  const [showBgPicker,setShowBgPicker]= useState(false);
  const [bgId,        setBgId]        = useState(() => localStorage.getItem('chatBg') || 'warm');

  // Media previews
  const [mediaPreview, setMediaPreview] = useState(null); // {type, url, name, file}

  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const fileRef  = useRef(null);
  const photoRef = useRef(null);
  const cameraRef = useRef(null);

  const currentBg = CHAT_BACKGROUNDS.find(b => b.id === bgId) || CHAT_BACKGROUNDS[0];

  // Voice
  const voice = useVoiceRecorder(({ url, duration }) => {
    setMediaPreview({ type: 'voice', url, duration });
  });

  // Loaders
  const loadConvos = useCallback(async () => {
    if (!userId) return;
    try { setConvos(await getConversations(userId)); } catch {}
  }, [userId]);

  const loadMsgs = useCallback(async () => {
    if (!userId || !partnerIdStr) return;
    try { setMsgs(await getConversation(userId, partnerIdStr)); } catch {}
  }, [userId, partnerIdStr]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    if (!partnerIdStr) return;
    setLoading(true);
    setMenuId(null); setEditingId(null);
    setShowEmoji(false); setShowAttach(false);
    loadMsgs().then(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [partnerIdStr, loadMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  useEffect(() => {
    if (!partnerIdStr) return;
    const iv = setInterval(() => { loadMsgs(); loadConvos(); }, 5000);
    return () => clearInterval(iv);
  }, [partnerIdStr, loadMsgs, loadConvos]);

  // Send text
  const send = async () => {
    const t = text.trim();
    if ((!t && !mediaPreview) || !partnerIdStr || !userId) return;
    setSending(true); setError('');
    try {
      // Если есть медиа превью — добавляем метку к тексту (реальная загрузка файлов требует бэкенда)
      let finalText = t;
      if (mediaPreview) {
        if (mediaPreview.type === 'image') finalText = `📷 ${mediaPreview.name || 'Фото'}${t ? '\n' + t : ''}`;
        else if (mediaPreview.type === 'video') finalText = `🎥 ${mediaPreview.name || 'Видео'}${t ? '\n' + t : ''}`;
        else if (mediaPreview.type === 'file')  finalText = `📎 ${mediaPreview.name || 'Файл'}${t ? '\n' + t : ''}`;
        else if (mediaPreview.type === 'voice') finalText = `🎤 Голосовое (${mediaPreview.duration}с)`;
        else if (mediaPreview.type === 'location') finalText = `📍 ${mediaPreview.name}`;
        setMediaPreview(null);
      }
      if (!finalText) { setSending(false); return; }
      await sendMessage(userId, partnerIdStr, finalText, jobRequestId);
      setText('');
      setShowEmoji(false);
      setShowAttach(false);
      await loadMsgs(); await loadConvos();
    } catch (e) { setError(e?.message || 'Не удалось отправить.'); }
    setSending(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Edit
  const startEdit  = (m) => { setEditingId(m.id); setEditingText(m.text || ''); setMenuId(null); };
  const cancelEdit = ()  => { setEditingId(null); setEditingText(''); };
  const saveEdit   = async () => {
    if (!editingId || !editingText.trim()) return;
    setSending(true);
    try { await updateMessage(userId, editingId, editingText.trim()); cancelEdit(); await loadMsgs(); await loadConvos(); }
    catch (e) { setError(e?.message || 'Ошибка.'); }
    setSending(false);
  };

  // Delete
  const removeMsg = async (messageId) => {
    setMenuId(null); setSending(true);
    try { await deleteMessage(userId, messageId); await loadMsgs(); await loadConvos(); }
    catch (e) { setError(e?.message || 'Ошибка.'); }
    setSending(false);
  };

  const removeChat = async () => {
    if (!window.confirm('Удалить весь чат?')) return;
    setSending(true);
    try { await deleteConversation(userId, partnerIdStr); setMsgs([]); await loadConvos(); navigate('/chat'); }
    catch (e) { setError(e?.message || 'Ошибка.'); }
    setSending(false);
  };

  // File pick
  const handleFilePick = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMediaPreview({ type, url, name: file.name, file });
    setShowAttach(false);
    e.target.value = '';
  };

  // Location
  const shareLocation = () => {
    setShowAttach(false);
    if (!navigator.geolocation) { alert('Геолокация недоступна'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMediaPreview({ type: 'location', name: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }),
      () => alert('Не удалось получить геолокацию')
    );
  };

  // Background
  const changeBg = (id) => {
    setBgId(id);
    localStorage.setItem('chatBg', id);
    setShowBgPicker(false);
  };

  const activePartner = convos.find(c => String(c.partnerId) === partnerIdStr);
  const closeAll = () => { setMenuId(null); setShowEmoji(false); setShowAttach(false); };

  // ══════════════════════════════════════════════════════════
  return (
    <div className="cht-root" onClick={closeAll}>

      {/* ══ SIDEBAR ══ */}
      <div className={`cht-side ${partnerIdStr ? 'cht-side-hide' : ''}`}>
        <div className="cht-side-hd">
          <h2>Сообщения</h2>
          <div className="cht-side-hd-sub">
            {convos.length > 0 ? `${convos.length} диалог${convos.length > 1 ? 'а' : ''}` : 'Нет диалогов'}
          </div>
        </div>

        {convos.length === 0 ? (
          <div className="cht-side-empty">
            <div className="cht-side-empty-icon">💬</div>
            <h3>Нет диалогов</h3>
            <p>Напишите мастеру или заказчику со страницы заявки</p>
          </div>
        ) : (
          <div className="cht-side-list">
            {convos.map(c => (
              <div
                key={c.partnerId}
                className={`cht-conv ${String(c.partnerId) === partnerIdStr ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); navigate(`/chat/${c.partnerId}`); }}
              >
                <Avatar name={c.partnerName} url={c.partnerAvatarUrl} size={46} />
                <div className="cht-conv-body">
                  <div className="cht-conv-top">
                    <span className="cht-conv-name">{c.partnerName}</span>
                    <span className="cht-conv-time">{timeStr(c.lastMessageAt)}</span>
                  </div>
                  <div className="cht-conv-bottom">
                    <span className="cht-conv-msg">{c.lastMessage || 'Нет сообщений'}</span>
                    {c.unreadCount > 0 && <span className="cht-conv-badge">{c.unreadCount}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ CHAT AREA ══ */}
      <div className={`cht-main ${!partnerIdStr ? 'cht-main-placeholder' : ''}`}>

        {!partnerIdStr && (
          <div className="cht-placeholder">
            <div className="cht-placeholder-icon">💬</div>
            <h3>Выберите диалог</h3>
            <p>или начните новый со страницы заявки</p>
          </div>
        )}

        {partnerIdStr && (
          <>
            {/* Header */}
            <div className="cht-hd" onClick={e => e.stopPropagation()}>
              <button className="cht-hd-back" onClick={() => navigate('/chat')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>

              <Avatar name={activePartner?.partnerName} url={activePartner?.partnerAvatarUrl} size={38} />

              <div className="cht-hd-info">
                <div className="cht-hd-name">{activePartner?.partnerName || 'Чат'}</div>
                <div className="cht-hd-status">онлайн</div>
              </div>

              <div className="cht-hd-actions">
                {/* Сменить фон */}
                <button
                  className="cht-hd-icon-btn"
                  onClick={(e) => { e.stopPropagation(); setShowBgPicker(v => !v); }}
                  title="Сменить фон"
                >
                  🎨
                </button>
                {/* Удалить чат */}
                <button
                  className="cht-hd-icon-btn cht-hd-icon-btn-danger"
                  onClick={(e) => { e.stopPropagation(); removeChat(); }}
                  title="Удалить чат"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Background picker */}
            {showBgPicker && (
              <div className="cht-bg-picker" onClick={e => e.stopPropagation()}>
                <div className="cht-bg-picker-title">Выберите фон</div>
                <div className="cht-bg-grid">
                  {CHAT_BACKGROUNDS.map(bg => (
                    <button
                      key={bg.id}
                      className={`cht-bg-item ${bgId === bg.id ? 'active' : ''}`}
                      onClick={() => changeBg(bg.id)}
                      style={bg.style}
                      title={bg.label}
                    >
                      {bgId === bg.id && <span className="cht-bg-check">✓</span>}
                      <span className="cht-bg-label" style={{ color: bg.dark ? '#fff' : '#374151' }}>{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="cht-error">{error}</div>}

            {/* Messages */}
            <div className="cht-msgs" style={currentBg.style}>
              {loading ? (
                <div className="cht-msgs-loading">Загрузка...</div>
              ) : msgs.length === 0 ? (
                <div className="cht-msgs-empty">
                  <div className="cht-msgs-empty-icon">👋</div>
                  <p>Напишите первое сообщение</p>
                </div>
              ) : (
                msgs.map((m, i) => {
                  const mine     = m.senderId === userId;
                  const showDate = i === 0 || new Date(msgs[i-1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                  const isLast   = i === msgs.length - 1 || msgs[i+1].senderId !== m.senderId;

                  return (
                    <React.Fragment key={m.id}>
                      {showDate && (
                        <div className="cht-date-sep">
                          <span>{fmtDate(m.createdAt)}</span>
                        </div>
                      )}

                      <div className={`cht-msg ${mine ? 'cht-msg-my' : 'cht-msg-their'}`} style={{ marginBottom: isLast ? 8 : 2 }}>
                        {!mine && (
                          <div style={{ width: 32, flexShrink: 0 }}>
                            {isLast && <Avatar name={m.senderName} url={m.senderAvatarUrl} size={28} />}
                          </div>
                        )}

                        <div className="cht-bubble">
                          {!mine && isLast && <div className="cht-bubble-name">{m.senderName}</div>}

                          {mine && editingId === m.id ? (
                            <div className="cht-edit-wrap">
                              <textarea className="cht-edit-textarea" value={editingText} onChange={e => setEditingText(e.target.value)} autoFocus />
                              <div className="cht-edit-actions">
                                <button className="btn btn-outline btn-sm" onClick={cancelEdit} disabled={sending}>Отмена</button>
                                <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={sending || !editingText.trim()}>Сохранить</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="cht-bubble-text"
                                onClick={e => { e.stopPropagation(); mine && setMenuId(menuId === m.id ? null : m.id); }}
                              >
                                {m.text}
                              </div>
                              <div className="cht-bubble-meta">
                                <span className="cht-bubble-time">{fmtTime(m.createdAt)}</span>
                                {mine && <Ticks isRead={m.isRead} />}
                              </div>
                            </>
                          )}

                          {mine && menuId === m.id && editingId !== m.id && (
                            <div className="cht-msg-menu" onClick={e => e.stopPropagation()}>
                              <button className="cht-menu-btn" onClick={() => startEdit(m)}>✏️ Изменить</button>
                              <button className="cht-menu-btn cht-menu-btn-del" onClick={() => removeMsg(m.id)}>🗑 Удалить</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Media preview */}
            {mediaPreview && (
              <div className="cht-media-preview" onClick={e => e.stopPropagation()}>
                <div className="cht-media-preview-inner">
                  {mediaPreview.type === 'image' && <img src={mediaPreview.url} alt="" />}
                  {mediaPreview.type === 'video' && <video src={mediaPreview.url} controls />}
                  {mediaPreview.type === 'voice' && (
                    <div className="cht-voice-preview">
                      🎤 Голосовое · {mediaPreview.duration}с
                      <audio src={mediaPreview.url} controls />
                    </div>
                  )}
                  {mediaPreview.type === 'file' && <div className="cht-file-preview">📎 {mediaPreview.name}</div>}
                  {mediaPreview.type === 'location' && <div className="cht-file-preview">📍 {mediaPreview.name}</div>}
                </div>
                <button className="cht-media-preview-close" onClick={() => setMediaPreview(null)}>✕</button>
              </div>
            )}

            {/* Emoji panel */}
            {showEmoji && (
              <div className="cht-emoji-panel" onClick={e => e.stopPropagation()}>
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    className="cht-emoji-btn"
                    onClick={() => { setText(t => t + emoji); inputRef.current?.focus(); }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Attach panel — Telegram style, снизу вверх */}
            {showAttach && (
              <div className="cht-attach-panel" onClick={e => e.stopPropagation()}>
                <button className="cht-attach-btn" onClick={() => photoRef.current?.click()}>
                  <span className="cht-attach-icon" style={{ background: 'linear-gradient(135deg,#43a047,#66bb6a)' }}>
                    <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </span>
                  <span>Фото или видео</span>
                </button>
                <button className="cht-attach-btn" onClick={() => fileRef.current?.click()}>
                  <span className="cht-attach-icon" style={{ background: 'linear-gradient(135deg,#1e88e5,#42a5f5)' }}>
                    <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                  </span>
                  <span>Файл</span>
                </button>
                <button className="cht-attach-btn" onClick={() => { const cr = cameraRef.current; if(cr) cr.click(); setShowAttach(false); }}>
                  <span className="cht-attach-icon" style={{ background: 'linear-gradient(135deg,#e53935,#ef5350)' }}>
                    <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </span>
                  <span>Камера</span>
                </button>
                <button className="cht-attach-btn" onClick={shareLocation}>
                  <span className="cht-attach-icon" style={{ background: 'linear-gradient(135deg,#f4511e,#ff7043)' }}>
                    <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <span>Местоположение</span>
                </button>
              </div>
            )}

            {/* Input bar: [📎] [поле] [😊] [🎤/отправить] */}
            <div className="cht-input" onClick={e => e.stopPropagation()}>

              {/* Attach — слева */}
              <button
                className={`cht-input-icon-btn ${showAttach ? 'active' : ''}`}
                onClick={() => { setShowAttach(v => !v); setShowEmoji(false); }}
                title="Прикрепить"
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  style={{ transform: showAttach ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>

              {/* Voice recording mode */}
              {voice.recording ? (
                <div className="cht-voice-recording">
                  <button className="cht-voice-cancel" onClick={voice.cancel}>✕</button>
                  <div className="cht-voice-dot" />
                  <span className="cht-voice-timer">
                    {String(Math.floor(voice.seconds/60)).padStart(2,'0')}:{String(voice.seconds%60).padStart(2,'0')}
                  </span>
                  <span className="cht-voice-hint">Запись...</span>
                  <button className="cht-voice-stop btn btn-primary btn-sm" onClick={voice.stop}>✓</button>
                </div>
              ) : (
                <>
                  {/* Text field */}
                  <textarea
                    ref={inputRef}
                    className="cht-input-field"
                    placeholder="Написать сообщение…"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={onKey}
                    rows={1}
                  />

                  {/* Emoji — справа перед отправкой */}
                  <button
                    className={`cht-input-icon-btn ${showEmoji ? 'active' : ''}`}
                    onClick={() => { setShowEmoji(v => !v); setShowAttach(false); }}
                    title="Эмодзи"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <circle cx="9" cy="10" r="1" fill="currentColor"/>
                      <circle cx="15" cy="10" r="1" fill="currentColor"/>
                    </svg>
                  </button>

                  {/* Send or Voice — крайний правый */}
                  {text.trim() || mediaPreview ? (
                    <button className="cht-input-send" disabled={sending} onClick={send}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                    </button>
                  ) : (
                    <button className="cht-input-send cht-input-voice" onMouseDown={voice.start} title="Голосовое">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="9" y="2" width="6" height="12" rx="3"/>
                        <path d="M19 10a7 7 0 0 1-14 0M12 19v3M8 22h8"/>
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Hidden inputs */}
            <input ref={photoRef}  type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={e => handleFilePick(e, e.target.files?.[0]?.type?.startsWith('video') ? 'video' : 'image')} />
            <input ref={fileRef}   type="file" style={{ display:'none' }} onChange={e => handleFilePick(e, 'file')} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => handleFilePick(e, 'image')} />
          </>
        )}
      </div>
    </div>
  );
}