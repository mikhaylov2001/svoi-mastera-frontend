import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConversations, getConversation, sendMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

function Avatar({ name, url, size = 40 }) {
  if (url) return <img src={url} alt="" className="ch-avatar" style={{ width: size, height: size }} />;
  const initials = (name || '?').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#e8410a','#1565c0','#2e7d32','#f57f17','#7b1fa2','#00838f'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="ch-avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

function timeStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 172800000) return 'вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ChatPage() {
  const { partnerId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Load conversations list
  const loadConvos = useCallback(async () => {
    try { setConvos(await getConversations(userId)); } catch {}
  }, [userId]);

  // Load messages for active chat
  const loadMessages = useCallback(async () => {
    if (!partnerId) return;
    try {
      const msgs = await getConversation(userId, partnerId);
      setMessages(msgs);
    } catch {}
  }, [userId, partnerId]);

  useEffect(() => { loadConvos(); }, [loadConvos]);
  useEffect(() => {
    if (partnerId) {
      setLoading(true);
      loadMessages().then(() => setLoading(false));
    }
  }, [partnerId, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 5s
  useEffect(() => {
    if (!partnerId) return;
    pollRef.current = setInterval(() => { loadMessages(); loadConvos(); }, 5000);
    return () => clearInterval(pollRef.current);
  }, [partnerId, loadMessages, loadConvos]);

  const handleSend = async () => {
    if (!text.trim() || !partnerId) return;
    setSending(true);
    try {
      await sendMessage(userId, partnerId, text.trim());
      setText('');
      await loadMessages();
      await loadConvos();
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const activeConvo = convos.find(c => c.partnerId === partnerId);

  return (
    <div className="ch-root">
      {/* Sidebar: conversations list */}
      <div className={`ch-sidebar ${partnerId ? 'ch-sidebar-hidden' : ''}`}>
        <div className="ch-sidebar-header">
          <h2>Сообщения</h2>
        </div>
        {convos.length === 0 ? (
          <div className="ch-empty">
            <span>💬</span>
            <p>Нет сообщений</p>
            <p className="ch-empty-hint">Напишите мастеру или заказчику со страницы заявки</p>
          </div>
        ) : (
          <div className="ch-convo-list">
            {convos.map(c => (
              <div key={c.partnerId}
                className={`ch-convo ${c.partnerId === partnerId ? 'active' : ''}`}
                onClick={() => navigate(`/chat/${c.partnerId}`)}>
                <Avatar name={c.partnerName} url={c.partnerAvatarUrl} size={44} />
                <div className="ch-convo-info">
                  <div className="ch-convo-name">{c.partnerName}</div>
                  <div className="ch-convo-last">{c.lastMessage}</div>
                </div>
                <div className="ch-convo-right">
                  <div className="ch-convo-time">{timeStr(c.lastMessageAt)}</div>
                  {c.unreadCount > 0 && <div className="ch-convo-badge">{c.unreadCount}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`ch-main ${!partnerId ? 'ch-main-empty' : ''}`}>
        {!partnerId ? (
          <div className="ch-pick">
            <span>💬</span>
            <p>Выберите диалог</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="ch-header">
              <button className="ch-back-btn" onClick={() => navigate('/chat')}>←</button>
              <Avatar name={activeConvo?.partnerName || ''} url={activeConvo?.partnerAvatarUrl} size={36} />
              <div className="ch-header-name">{activeConvo?.partnerName || 'Чат'}</div>
            </div>

            {/* Messages */}
            <div className="ch-messages">
              {loading ? (
                <div className="ch-loading">Загрузка...</div>
              ) : messages.length === 0 ? (
                <div className="ch-no-msgs">Напишите первое сообщение</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`ch-msg ${m.senderId === userId ? 'ch-msg-mine' : 'ch-msg-their'}`}>
                    <div className="ch-msg-bubble">
                      <div className="ch-msg-text">{m.text}</div>
                      <div className="ch-msg-time">
                        {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        {m.senderId === userId && (
                          <span className="ch-msg-read">{m.isRead ? ' ✓✓' : ' ✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="ch-input-bar">
              <textarea className="ch-input" placeholder="Напишите сообщение…"
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown} rows={1} />
              <button className="ch-send" disabled={!text.trim() || sending} onClick={handleSend}>
                {sending ? '...' : '➤'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}