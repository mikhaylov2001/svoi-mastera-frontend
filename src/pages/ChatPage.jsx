import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getConversations, getConversation, sendMessage, updateMessage, deleteMessage, deleteConversation } from '../api';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

function Avatar({ name, url, size = 44 }) {
  if (url) return <img src={url} alt="" className="cht-ava" style={{ width: size, height: size }} />;
  const ini = (name || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const cols = ['#e8410a','#1565c0','#2e7d32','#f57f17','#7b1fa2','#00838f','#d81b60','#3949ab'];
  const col = cols[(ini.charCodeAt(0) || 0) % cols.length];
  return <div className="cht-ava" style={{ width: size, height: size, background: col, fontSize: size * 0.36 }}>{ini}</div>;
}

function timeStr(d) {
  if (!d) return '';
  const dt = new Date(d);
  const now = new Date();
  if (dt.toDateString() === now.toDateString()) return dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (dt.toDateString() === y.toDateString()) return 'вчера';
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ChatPage() {
  const { partnerId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const partnerIdStr = useMemo(() => (partnerId == null ? null : String(partnerId)), [partnerId]);
  const jobRequestId = useMemo(() => {
    const qp = new URLSearchParams(location.search || '');
    const v = qp.get('jobRequestId');
    return v ? String(v) : null;
  }, [location.search]);

  const [convos, setConvos] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ws, setWs] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [menuId, setMenuId] = useState(null);
  const [convoDrafts, setConvoDrafts] = useState({});
  const [convoSending, setConvoSending] = useState({});
  const [convoError, setConvoError] = useState({});
  const endRef = useRef(null);

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
    if (partnerIdStr) { setLoading(true); loadMsgs().then(() => setLoading(false)); }
  }, [partnerIdStr, loadMsgs]);

  useEffect(() => {
    if (!userId) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}/ws/chat?userId=${userId}`;
    try {
      const socket = new WebSocket(socketUrl);
      setWs(socket);
      setWsStatus('connecting');

      socket.onopen = () => {
        setWsStatus('connected');
      };
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new_message') {
          loadConvos();
          if (partnerIdStr && msg.partnerId === partnerIdStr) loadMsgs();
        }
      };
      socket.onclose = () => setWsStatus('disconnected');
      socket.onerror = () => setWsStatus('error');

      return () => socket.close();
    } catch (e) {
      setWsStatus('error');
    }
  }, [userId, partnerIdStr, loadConvos, loadMsgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // Poll
  useEffect(() => {
    if (!partnerIdStr) return;
    const iv = setInterval(() => { loadMsgs(); loadConvos(); }, 5000);
    return () => clearInterval(iv);
  }, [partnerIdStr, loadMsgs, loadConvos]);

  const send = async () => {
    if (!text.trim() || !partnerIdStr || !userId) return;
    setSending(true);
    setError('');
    try {
      const payload = { type: 'send_message', receiverId: partnerIdStr, text: text.trim(), jobRequestId };
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      } else {
        await sendMessage(userId, partnerIdStr, text.trim(), jobRequestId);
      }
      setText('');
      await loadMsgs();
      await loadConvos();
    } catch (e) {
      setError(e?.message || 'Не удалось отправить сообщение.');
    }
    setSending(false);
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const sendFromSidebar = async (partnerId) => {
    const draft = (convoDrafts[partnerId] || '').trim();
    if (!draft || !userId) return;
    setConvoSending(prev => ({ ...prev, [partnerId]: true }));
    setConvoError(prev => ({ ...prev, [partnerId]: '' }));
    try {
      await sendMessage(userId, partnerId, draft, null);
      setConvoDrafts(prev => ({ ...prev, [partnerId]: '' }));
      await loadConvos();
      if (partnerIdStr === partnerId) {
        await loadMsgs();
      }
    } catch (e) {
      setConvoError(prev => ({ ...prev, [partnerId]: e?.message || 'Не удалось отправить сообщение.' }));
    }
    setConvoSending(prev => ({ ...prev, [partnerId]: false }));
  };

  const activePartner = convos.find(c => String(c.partnerId) === partnerIdStr);
  const closeMenu = () => setMenuId(null);

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditingText(m.text || '');
    closeMenu();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async () => {
    if (!userId || !editingId) return;
    const next = (editingText || '').trim();
    if (!next) return;
    setSending(true);
    setError('');
    try {
      await updateMessage(userId, editingId, next);
      cancelEdit();
      await loadMsgs();
      await loadConvos();
    } catch (e) {
      setError(e?.message || 'Не удалось изменить сообщение.');
    }
    setSending(false);
  };

  const removeMsg = async (messageId) => {
    if (!userId || !messageId) return;
    closeMenu();
    setSending(true);
    setError('');
    try {
      await deleteMessage(userId, messageId);
      await loadMsgs();
      await loadConvos();
    } catch (e) {
      setError(e?.message || 'Не удалось удалить сообщение.');
    }
    setSending(false);
  };

  const removeChat = async () => {
    if (!userId || !partnerIdStr) return;
    closeMenu();
    if (!window.confirm('Удалить весь чат?')) return;
    setSending(true);
    setError('');
    try {
      await deleteConversation(userId, partnerIdStr);
      setMsgs([]);
      await loadConvos();
      navigate('/chat');
    } catch (e) {
      setError(e?.message || 'Не удалось удалить чат.');
    }
    setSending(false);
  };

  return (
    <div className="cht">
      {/* ═══ SIDEBAR ═══ */}
      <div className={`cht-side ${partnerIdStr ? 'cht-side-hide' : ''}`}>
        <div className="cht-side-hd">
          <h2>Сообщения</h2>
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
              <div key={c.partnerId}
                className={`cht-conv ${c.partnerId === partnerId ? 'active' : ''}`}
                onClick={() => navigate(`/chat/${c.partnerId}`)}>
                <Avatar name={c.partnerName} url={c.partnerAvatarUrl} size={48} />
                <div className="cht-conv-body">
                  <div className="cht-conv-top">
                    <span className="cht-conv-name">{c.partnerName}</span>
                    <span className="cht-conv-time">{timeStr(c.lastMessageAt)}</span>
                  </div>
                  <div className="cht-conv-bottom">
                    <span className="cht-conv-msg">{c.lastMessage}</span>
                    {c.unreadCount > 0 && <span className="cht-conv-badge">{c.unreadCount}</span>}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={convoDrafts[c.partnerId] || ''}
                      placeholder="Быстрый ответ"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setConvoDrafts(prev => ({ ...prev, [c.partnerId]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendFromSidebar(c.partnerId);
                        }
                      }}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid var(--gray-200)', padding: '6px 8px', fontSize: 12 }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); sendFromSidebar(c.partnerId); }}
                      className="btn btn-sm"
                      disabled={convoSending[c.partnerId] || !(convoDrafts[c.partnerId] || '').trim()}
                    >
                      {convoSending[c.partnerId] ? '...' : '↵'}
                    </button>
                  </div>
                  {convoError[c.partnerId] && <div style={{ color: '#b91c1c', fontSize: 12 }}>{convoError[c.partnerId]}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ CHAT AREA ═══ */}
      <div className={`cht-main ${!partnerIdStr ? 'cht-main-placeholder' : ''}`}>
        {!partnerIdStr ? (
          <div className="cht-placeholder">
            <div className="cht-placeholder-icon">💬</div>
            <h3>Выберите диалог</h3>
            <p>или начните новый со страницы заявки</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="cht-hd" onClick={closeMenu}>
              <div style={{ position: 'absolute', right: 12, top: 14, fontSize: 12, color: wsStatus === 'connected' ? '#16a34a' : '#be123c' }}>
                WS: {wsStatus}
              </div>
              <button className="cht-hd-back" onClick={() => navigate('/chat')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <Avatar name={activePartner?.partnerName} url={activePartner?.partnerAvatarUrl} size={38} />
              <div className="cht-hd-info">
                <div className="cht-hd-name">{activePartner?.partnerName || 'Чат'}</div>
                <div className="cht-hd-status">онлайн</div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={(e) => { e.stopPropagation(); removeChat(); }}
              >
                Удалить чат
              </button>
            </div>

            {/* Messages */}
            <div className="cht-msgs">
              {error && (
                <div className="cht-msgs-loading" style={{ color: '#b91c1c' }}>
                  {error}
                </div>
              )}
              {loading ? (
                <div className="cht-msgs-loading">Загрузка сообщений...</div>
              ) : msgs.length === 0 ? (
                <div className="cht-msgs-empty">
                  <div className="cht-msgs-empty-icon">👋</div>
                  <p>Напишите первое сообщение</p>
                </div>
              ) : (
                <>
                  {msgs.map((m, i) => {
                    const mine = m.senderId === userId;
                    const showDate = i === 0 || new Date(msgs[i-1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                    return (
                      <React.Fragment key={m.id}>
                        {showDate && (
                          <div className="cht-date-sep">
                            <span>{new Date(m.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                          </div>
                        )}
                        <div className={`cht-msg ${mine ? 'cht-msg-my' : 'cht-msg-their'}`}>
                          {!mine && <Avatar name={m.senderName} url={m.senderAvatarUrl} size={32} />}
                          <div className="cht-bubble">
                            {!mine && <div className="cht-bubble-name">{m.senderName}</div>}
                            {mine && editingId === m.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <textarea
                                  className="cht-input-field"
                                  style={{ minHeight: 70 }}
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                />
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button className="btn btn-outline btn-sm" onClick={cancelEdit} disabled={sending}>Отмена</button>
                                  <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={sending || !editingText.trim()}>
                                    Сохранить
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="cht-bubble-text" onClick={() => mine && setMenuId(menuId === m.id ? null : m.id)}>
                                {m.text}
                              </div>
                            )}
                            <div className="cht-bubble-time">
                              {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              {mine && <span className="cht-bubble-read">{m.isRead ? ' ✓✓' : ' ✓'}</span>}
                            </div>
                            {mine && menuId === m.id && editingId !== m.id && (
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button className="btn btn-outline btn-sm" onClick={() => startEdit(m)} disabled={sending}>
                                  Редактировать
                                </button>
                                <button className="btn btn-outline btn-sm" onClick={() => removeMsg(m.id)} disabled={sending}>
                                  Удалить
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="cht-input">
              <textarea
                className="cht-input-field"
                placeholder="Написать сообщение…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKey}
                rows={1}
              />
              <button className="cht-input-send" disabled={!text.trim() || sending} onClick={send}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
