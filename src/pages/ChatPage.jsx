import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getConversations, getConversation, sendMessage,
  updateMessage, deleteMessage, deleteConversation,
} from '../api';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

// ── Avatar ──────────────────────────────────────────────────
function Avatar({ name, url, size = 40 }) {
  if (url) return <img src={url} alt="" className="cht-ava" style={{ width: size, height: size }} />;
  const ini = (name || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const cols = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#db2777','#4f46e5'];
  const col  = cols[(ini.charCodeAt(0) || 0) % cols.length];
  return (
    <div className="cht-ava" style={{ width: size, height: size, background: col, fontSize: size * 0.37 }}>
      {ini}
    </div>
  );
}

// ── Telegram-style double tick ───────────────────────────────
function Ticks({ isRead }) {
  const color = isRead ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.6)';
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{ flexShrink: 0, marginBottom: -1 }}>
      {/* первая галочка */}
      <path d="M1 5.5L4.5 9L10 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      {/* вторая галочка (сдвинута вправо) — показывается только при прочтении */}
      {isRead && (
        <path d="M5 5.5L8.5 9L14 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      {/* одна галочка когда не прочитано */}
      {!isRead && (
        <path d="M5 5.5L8.5 9L14 2" stroke="rgba(255,255,255,.3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      )}
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

  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // ── Loaders ──
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

  // ── Actions ──
  const send = async () => {
    if (!text.trim() || !partnerIdStr || !userId) return;
    setSending(true); setError('');
    try {
      await sendMessage(userId, partnerIdStr, text.trim(), jobRequestId);
      setText(''); await loadMsgs(); await loadConvos();
    } catch (e) { setError(e?.message || 'Не удалось отправить.'); }
    setSending(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const startEdit  = (m) => { setEditingId(m.id); setEditingText(m.text || ''); setMenuId(null); };
  const cancelEdit = ()  => { setEditingId(null); setEditingText(''); };

  const saveEdit = async () => {
    if (!editingId || !editingText.trim()) return;
    setSending(true); setError('');
    try { await updateMessage(userId, editingId, editingText.trim()); cancelEdit(); await loadMsgs(); await loadConvos(); }
    catch (e) { setError(e?.message || 'Не удалось изменить.'); }
    setSending(false);
  };

  const removeMsg = async (messageId) => {
    setMenuId(null); setSending(true); setError('');
    try { await deleteMessage(userId, messageId); await loadMsgs(); await loadConvos(); }
    catch (e) { setError(e?.message || 'Не удалось удалить.'); }
    setSending(false);
  };

  const removeChat = async () => {
    if (!window.confirm('Удалить весь чат?')) return;
    setSending(true); setError('');
    try { await deleteConversation(userId, partnerIdStr); setMsgs([]); await loadConvos(); navigate('/chat'); }
    catch (e) { setError(e?.message || 'Не удалось удалить чат.'); }
    setSending(false);
  };

  const activePartner = convos.find(c => String(c.partnerId) === partnerIdStr);
  const closeMenu = () => setMenuId(null);

  return (
    <div className="cht-root" onClick={closeMenu}>

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
            <p>Напишите мастеру или заказчику со страницы заявки или сделки</p>
          </div>
        ) : (
          <div className="cht-side-list">
            {convos.map(c => (
              <div
                key={c.partnerId}
                className={`cht-conv ${String(c.partnerId) === partnerIdStr ? 'active' : ''}`}
                onClick={() => navigate(`/chat/${c.partnerId}`)}
              >
                <Avatar name={c.partnerName} url={c.partnerAvatarUrl} size={44} />
                <div className="cht-conv-body">
                  <div className="cht-conv-top">
                    <span className="cht-conv-name">{c.partnerName}</span>
                    <span className="cht-conv-time">{timeStr(c.lastMessageAt)}</span>
                  </div>
                  <div className="cht-conv-bottom">
                    <span className="cht-conv-msg">{c.lastMessage || 'Нет сообщений'}</span>
                    {c.unreadCount > 0 && (
                      <span className="cht-conv-badge">{c.unreadCount}</span>
                    )}
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
            <div className="cht-hd" onClick={closeMenu}>
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
                <button
                  className="cht-hd-btn cht-hd-btn-danger"
                  onClick={(e) => { e.stopPropagation(); removeChat(); }}
                  title="Удалить чат"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                  <span>Удалить чат</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="cht-error">{error}</div>}

            {/* Messages */}
            <div className="cht-msgs">
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
                  const showDate = i === 0 ||
                    new Date(msgs[i-1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();

                  // Последнее ли это сообщение в группе (следующее — другой отправитель или конец)
                  const isLast = i === msgs.length - 1 || msgs[i+1].senderId !== m.senderId;

                  return (
                    <React.Fragment key={m.id}>
                      {showDate && (
                        <div className="cht-date-sep">
                          <span>{fmtDate(m.createdAt)}</span>
                        </div>
                      )}

                      <div
                        className={`cht-msg ${mine ? 'cht-msg-my' : 'cht-msg-their'}`}
                        style={{ marginBottom: isLast ? 8 : 2 }}
                      >
                        {/* Аватар чужого (только у последнего в группе) */}
                        {!mine && (
                          <div style={{ width: 30, flexShrink: 0 }}>
                            {isLast && <Avatar name={m.senderName} url={m.senderAvatarUrl} size={28} />}
                          </div>
                        )}

                        <div className="cht-bubble">
                          {!mine && isLast && (
                            <div className="cht-bubble-name">{m.senderName}</div>
                          )}

                          {/* Edit mode */}
                          {mine && editingId === m.id ? (
                            <div className="cht-edit-wrap">
                              <textarea
                                className="cht-edit-textarea"
                                value={editingText}
                                onChange={e => setEditingText(e.target.value)}
                                autoFocus
                              />
                              <div className="cht-edit-actions">
                                <button className="btn btn-outline btn-sm" onClick={cancelEdit} disabled={sending}>
                                  Отмена
                                </button>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={saveEdit}
                                  disabled={sending || !editingText.trim()}
                                >
                                  Сохранить
                                </button>
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

                              {/* Время + галочки — telegram style */}
                              <div className="cht-bubble-meta">
                                <span className="cht-bubble-time">{fmtTime(m.createdAt)}</span>
                                {mine && <Ticks isRead={m.isRead} />}
                              </div>
                            </>
                          )}

                          {/* Контекстное меню */}
                          {mine && menuId === m.id && editingId !== m.id && (
                            <div className="cht-msg-menu" onClick={e => e.stopPropagation()}>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: 12, padding: '4px 10px', color: 'rgba(255,255,255,.9)', borderColor: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)' }}
                                onClick={() => startEdit(m)}
                                disabled={sending}
                              >
                                ✏️ Изменить
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: 12, padding: '4px 10px', color: 'rgba(255,200,200,.95)', borderColor: 'rgba(255,150,150,.4)', background: 'rgba(255,100,100,.15)' }}
                                onClick={() => removeMsg(m.id)}
                                disabled={sending}
                              >
                                🗑 Удалить
                              </button>
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

            {/* Input */}
            <div className="cht-input">
              <textarea
                ref={inputRef}
                className="cht-input-field"
                placeholder="Написать сообщение…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKey}
                rows={1}
              />
              <button
                className="cht-input-send"
                disabled={!text.trim() || sending}
                onClick={send}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}